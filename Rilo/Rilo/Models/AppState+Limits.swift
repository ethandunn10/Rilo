import Foundation

/// Changing limits, pending changes, the weekly step-down, strict mode, and
/// Rilo building the plan (App.jsx).
extension AppState {
    // MARK: the baseline and Rilo's first plan

    /// The web can't read real Screen Time, so the baseline comes from the
    /// hours they gave (5h if they never said).
    func makeBreakdown(_ allowed: Bool) {
        let total = Double(Plan.hoursToMins(time.now != 0 ? time.now : 5))
        breakdown = Plan.buildBreakdown(watched, total, allowed)
    }

    /// hours from the apps they picked; goal roughly half, on a clean half
    /// hour, floored at an hour
    func startFromApps(_ allowed: Bool) {
        let picked = watched
        let mins = MockAI.demoDailyMinutes(picked)
        let hours = JS.round(mins / 60 * 100) / 100
        let goal = max(1, JS.round(hours / 2 / 0.5) * 0.5)
        breakdown = Plan.buildBreakdown(picked, mins, allowed)
        /* the web's breakdown effect then runs on the new time.now */
        time = TimeGoal(now: hours, goal: goal)
    }

    /// Rilo writes the plan himself from the apps, the number and what they
    /// said they'd rather be doing.
    func buildPlanFor(_ picks: [String]) {
        let picked = watched
        let mins = MockAI.demoDailyMinutes(picked)
        let goal = Plan.hoursToMins(max(1, JS.round(mins / 60 / 2 / 0.5) * 0.5))
        let bd = breakdown ?? Plan.buildBreakdown(picked, mins, screenTime == true)
        var hobbies: [String] = []
        var goals: [String] = []
        for id in picks {
            guard let row = Rather.RATHER.first(where: { $0.id == id }) else { continue }
            hobbies += row.hobbies
            goals += row.goals
        }
        let out = MockAI.riloLimits(tracked: picked, breakdown: bd, goalMins: goal,
                                    hobbies: hobbies, goals: goals, calendar: [], checkins: [])
        appSettings.merge(out.settings) { _, new in new }
        riloWhy = out.why
        riloLead = out.lead
        limitMode = "rilo"
        track("limits", "built from onboarding · allows \(out.check.allows)m")
    }

    /// Rilo's plan (§13). Tightening is instant; in strict mode anything
    /// his plan loosens waits 24h like any other change.
    func makeRiloPlan(goalOverride: Int? = nil) {
        let out = MockAI.riloLimits(tracked: tracked, breakdown: breakdown, goalMins: goalOverride ?? goalMins,
                                    hobbies: profileList("hobby"), goals: profileList("goal"),
                                    calendar: weekAhead, checkins: checkins, creator: about.creator)
        if strict.on {
            var loosened: [(app: String, prev: AppSetting, next: AppSetting)] = []
            var instant: [String: AppSetting] = [:]
            for (app, next) in out.settings.sorted(by: { $0.key < $1.key }) {
                let prev = settingOf(app)
                if Limits.isLoosening(prev, next) { loosened.append((app, prev, next)) } else { instant[app] = next }
            }
            appSettings.merge(instant) { _, new in new }
            if !loosened.isEmpty {
                pending = pending.filter { p in !loosened.contains { $0.app == p.app } }
                    + loosened.map { Limits.makePending(app: $0.app, prev: $0.prev, next: $0.next) }
            }
        } else {
            appSettings.merge(out.settings) { _, new in new }
        }
        riloWhy = out.why
        riloLead = out.lead
        limitMode = "rilo"
        track("limits", "rilo built a plan · allows \(out.check.allows)m")
    }

    // MARK: changing a limit

    func applySetting(_ app: String, _ next: AppSetting) {
        appSettings[app] = next
    }

    /// Stricter is instant in both modes. Looser asks "are you sure" in
    /// normal mode (not during onboarding) and waits 24 hours in strict mode.
    func setAppSetting(_ app: String, _ raw: AppSetting) {
        let next = AppSetting(mode: raw.mode, opens: Limits.clampOpens(raw.opens),
                              minutes: Limits.clampMinutes(Double(raw.minutes)))
        let prev = settingOf(app)
        if prev == next { return }

        if !strict.on && !inOnboarding && Limits.isLoosening(prev, next) {
            loosenAsk = LoosenAsk(app: app, next: next)
            return
        }
        if strict.on && Limits.isLoosening(prev, next) {
            /* one pending change per app — a new one replaces the old */
            pending = pending.filter { $0.app != app } + [Limits.makePending(app: app, prev: prev, next: next)]
            track("limit", "pending 24h: \(Limits.describeChange(app, prev, next))")
            return
        }
        applySetting(app, next)
        /* making their own change makes it their own plan */
        limitMode = "own"
        track("limit", Limits.describeChange(app, prev, next))
    }

    func cancelPending(_ id: String) {
        pending = pending.filter { $0.id != id }
        track("limit", "pending change cancelled")
    }

    func applyPending(_ p: PendingChange) {
        if p.kind == "setting" { applySetting(p.app, p.next) }
        track("limit", "landed: \(p.label)")
    }

    // MARK: the weekly step-down (§11)

    func acceptStepDown(_ appName: String? = nil) {
        guard let target = appName ?? stepApp, let proposal = Limits.stepDownFor(settingOf(target)) else { return }
        /* always a tightening, so it lands straight away in both modes */
        applySetting(target, AppSetting(mode: proposal.to.mode, opens: Limits.clampOpens(proposal.to.opens),
                                        minutes: Limits.clampMinutes(Double(proposal.to.minutes))))
        step.app = target
        step.status = "accepted"
        step.skipAt = nil
        track("stepdown", "accepted: \(target) \(proposal.say)")
    }

    func skipStepDown() {
        if strict.on {
            /* skipping is a loosening, so it waits like any other */
            step.skipAt = JS.nowMs + 24 * 60 * 60 * 1000
            track("stepdown", "skip pending 24h")
            return
        }
        step.status = "skipped"
        step.skipAt = nil
        track("stepdown", "skipped")
    }

    func swapStepDown(_ appName: String) {
        step.app = appName
        step.status = "offered"
        step.skipAt = nil
        track("stepdown", "moved to \(appName)")
    }

    /// Offered at the start of each new week. In strict mode it just happens.
    /// `finished` is stepFinished as it was when the day/week ended.
    func offerStepDown(_ week: Int, finished: Bool? = nil) {
        let stepFinished = finished ?? self.stepFinished
        let target = Limits.stepDownTargetFor(appSettings: appSettings, tracked: tracked, shareFor: shareFor)
        guard let target, !stepFinished else {
            step.done = stepFinished
            return
        }
        if strict.on {
            acceptStepDown(target)
            step.week = week; step.app = target; step.status = "accepted"; step.skipAt = nil
            return
        }
        step.week = week; step.app = target; step.status = "offered"; step.skipAt = nil
        track("stepdown", "offered: \(target)")
    }

    // MARK: strict mode

    /// turning it on is instant
    func strictOn(days: Int, when: String) {
        strict.on = true; strict.days = days; strict.when = when; strict.endingAt = nil
        track("strict", "on · \(days)d · \(when)")
    }

    /// turning it off runs for another 24 hours first
    func strictAskOff() {
        strict.endingAt = JS.nowMs + 24 * 60 * 60 * 1000
        track("strict", "countdown started")
    }

    func strictKeepOn() {
        strict.endingAt = nil
        track("strict", "countdown cancelled")
    }

    /// off right now, no countdown — being unable to leave is a trap
    func strictOffNow() {
        strict.on = false
        strict.endingAt = nil
        track("strict", "turned off immediately")
    }
}

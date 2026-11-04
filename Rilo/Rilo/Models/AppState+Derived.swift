import Foundation

/// The values App.jsx works out on every render, as computed properties.
extension AppState {
    /// The Rilo who walks you through onboarding: always the original.
    static let OG_SKIN = "original"

    // MARK: today's numbers

    var dateKey: String { Storage.today() }
    /// the baseline (hours on now, 5h if they never said), in minutes
    var startMins: Int { Plan.hoursToMins(time.now != 0 ? time.now : 5) }
    /// the goal is one number they set; it never locks anything
    var goalMins: Int { Plan.hoursToMins(time.goal) }

    var inOnboarding: Bool { Screen.onboarding.contains(screen) }

    /// the apps they picked (capped at 5 on free). Nothing else.
    var watched: [String] { Plan.watchedFor(Apps.pickedApps(apps), isPro) }
    var tracked: [String] { watched }

    private func breakdownApp(_ app: String) -> BreakdownApp? {
        breakdown?.apps.first { $0.app == app }
    }
    /// what they typically spend on an app, from the baseline
    func typicalFor(_ app: String) -> Double { JS.round(breakdownApp(app)?.mins ?? 0) }
    func pctFor(_ app: String) -> Int? { breakdownApp(app)?.pct }
    func shareFor(_ app: String) -> Double { breakdownApp(app)?.share ?? 0 }

    /// The daily total: everything except the always-allowed apps.
    var usedTotalToday: Double {
        day.used.reduce(0) { n, kv in Limits.countsTowardDay(appSettings, kv.key) ? n + kv.value : n }
    }

    // MARK: the clock, the windows, the mood

    /// DEMO ONLY: demoClock stands in for the phone's real clock
    var nowMins: Int {
        if let demoClock, !demoClock.isEmpty { return Addons.toMins(demoClock) }
        let c = Calendar.current.dateComponents([.hour, .minute], from: Date())
        return (c.hour ?? 0) * 60 + (c.minute ?? 0)
    }

    /// bedtime / school / focus window (App.jsx `schedule`)
    var schedule: ScheduleLock {
        Addons.lockReason(bedtime: bedtime, school: school, focus: focus, nowMins: nowMins,
                          dayIndex: Addons.dayIndexOf(Date()))
    }
    var asleep: Bool { schedule.kind == "bedtime" }

    var minsSinceBlocked: Double {
        guard let at = day.lastBlockedAt, at != 0 else { return 999 }
        return JS.round((JS.nowMs - at) / 60000)
    }

    var riloMood: String {
        Addons.moodForUsage(used: usedTotalToday, goal: Double(goalMins), sinceBlockedMins: minsSinceBlocked, asleep: asleep)
    }
    var riloNote: String {
        Addons.moodNote(used: usedTotalToday, goal: Double(goalMins), sinceBlockedMins: minsSinceBlocked, asleep: asleep)
    }

    /// time you got back
    var back: TimeBack {
        Addons.timeBack(history: history, baselineMins: Double(startMins), savedMinutes: stats.savedMinutes)
    }
    var backSays: String { MockAI.comparisonFor(back.week, spin: history.count) }

    /// what Rilo knows about them: 'hobby' or 'goal'
    func profileList(_ kind: String) -> [String] {
        let list = kind == "hobby" ? Profile.HOBBIES : Profile.GOALS
        let on = list.filter { about.on[$0] == true }
        return on + (kind == "hobby" ? about.extra.hobby : about.extra.goal)
    }

    /// one pass a day, no earning extras
    var passesLeft: Int { max(0, Limits.PASSES_PER_DAY - day.passes) }

    // MARK: the nightly check-in (Pro)

    var canCheckIn: Bool { isPro }
    var checkedInToday: Bool { night.date == dateKey }
    var checkInDue: Bool {
        canCheckIn && !checkedInToday && nowMins >= Addons.toMins(night.at.isEmpty ? "21:00" : night.at)
    }

    /// what the calendar means for the week ahead
    var weekAhead: [CalendarPlanItem] {
        calendar.on ? MockAI.calendarPlan(MockAI.DEMO_CALENDAR, apps: watched) : []
    }

    // MARK: the first week of questions

    func slotAsk(_ slot: String) -> Ask? {
        FirstWeek.askFor(day: drip.day, done: drip.done, askedOn: drip.askedOn, slot: slot,
                         morning: FirstWeek.isMorning(nowMins))
    }
    var planAsk: Ask? { isPro ? slotAsk("plan") : nil }
    var checkinAsk: Ask? { isPro ? slotAsk("checkin") : nil }
    var homeAsk: Ask? { slotAsk("home") ?? (isPro ? nil : slotAsk("plan") ?? slotAsk("checkin")) }

    // MARK: the plan check + per-app state

    var check: PlanCheck {
        Limits.planCheck(appSettings: appSettings, tracked: tracked, typicalFor: typicalFor, goalMins: goalMins)
    }

    func settingOf(_ app: String) -> AppSetting { Limits.settingFor(appSettings, app) }

    func totalOpensFor(_ app: String) -> Double {
        Limits.opensTotalFor(setting: settingOf(app), app: app, day: day, borrow: borrow, dateKey: dateKey)
    }

    func opensUsedFor(_ app: String) -> Double { Limits.opensUsedFor(app, day) }

    func lockOf(_ app: String) -> LockInfo {
        Limits.lockFor(app: app, appSettings: appSettings, day: day, borrow: borrow, dateKey: dateKey,
                       strictOn: strict.on, schedule: schedule)
    }

    func availOf(_ app: String) -> Double {
        Limits.opensAvailFor(setting: settingOf(app), app: app, day: day, borrow: borrow, dateKey: dateKey)
    }

    func borrowableFor(_ app: String) -> Bool {
        Limits.canBorrow(setting: settingOf(app), app: app, day: day, borrow: borrow, dateKey: dateKey,
                         strictOn: strict.on, passesLeft: passesLeft)
    }

    // MARK: the weekly step-down

    var stepApp: String? {
        if !step.app.isEmpty && tracked.contains(step.app) { return step.app }
        return Limits.stepDownTargetFor(appSettings: appSettings, tracked: tracked, shareFor: shareFor)
    }
    var stepProposal: StepDown? { stepApp.flatMap { Limits.stepDownFor(settingOf($0)) } }
    var stepFinished: Bool { step.done || Limits.stepDownDone(check: check, history: history) }

    /// a day ahead of the new week, a preview; at the turn, the offer
    var stepPhase: String? {
        if stepFinished || stepProposal == nil { return nil }
        if step.status == "offered" && step.week == program.week { return "offered" }
        return program.daysDone >= 6 ? "preview" : nil
    }

    var stepSwappable: [String] {
        Array(tracked.filter { $0 != stepApp }.filter {
            let m = settingOf($0).mode
            return m == .limited || m == .free
        }.prefix(6))
    }

    /// Home's strict-mode suggestion
    var suggestStrict: Bool {
        !strict.on && strict.suggestedOn != dateKey && Plan.shouldSuggestStrict(history, leanDays: leanDays)
    }

    // MARK: sessions

    /// never default to an app they aren't tracking
    var currentApp: String {
        if let a = session.app, tracked.contains(a) { return a }
        return tracked.first ?? "the feed"
    }

    /// "4th time today"
    var openCount: Int { opens.date == dateKey ? (opens.counts[currentApp] ?? 0) : 0 }

    /// a recent session on this app that a reopen would carry on
    func continuationFor(_ app: String) -> LastSession? {
        guard let last = day.lastSession, last.app == app else { return nil }
        if JS.nowMs - last.endedAt > Limits.CONTINUE_MS { return nil }
        return last
    }

    /// WhyOpen's opensLeft: carrying on a recent session gets back what it cost
    var whyOpenOpensLeft: Double { availOf(currentApp) + (continuationFor(currentApp)?.charged ?? 0) }

    /// Intercept's goalLeft
    var goalLeft: Double { max(0, JS.round(Double(goalMins) - usedTotalToday)) }

    /// Creator Mode stats for today
    var creatorTodayMinutes: Double { creator.date == dateKey ? creator.todayMinutes : 0 }

    // MARK: which overlays show (App.jsx's render, after the screens)

    /// Rilo knocking only makes sense while the shield is up
    var showBanner: Bool { banner && screen == .shield }
    var showTour: Bool { !introTourDone && !handoff && Screen.tourScreens.contains(screen) }
    /// the web renders Results on its own, with no demo panel
    var showDemoPanel: Bool { screen != .appopen && screen != .results }
    /// paywall vs upgrade: where "next" goes
    var paywallNext: Screen { screen == .paywall ? .home : (cameFrom ?? .home) }
}

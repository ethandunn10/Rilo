import Foundation

/// The small callbacks App.jsx writes inline where it renders each screen
/// and overlay, as named methods so the screens can call them.
extension AppState {
    // MARK: permission (Screen Time)

    func permissionAllow() {
        screenTime = true
        track("screentime", "allowed")
        go(.crunching)
        /* Phase 8: the real Screen Time prompt (the demo just says yes) */
        requestScreenTimeAuth()
        /* Phase 7: the one moment we ask for notifications — right after
           they've said yes to Screen Time. The system prompt only. */
        /* not while DemoSeed is setting up a -screen (Track.muted), so the
           system prompt never covers seeded screens or screenshots */
        if !Track.muted { RiloNotifications.shared.askPermission() }
    }

    func permissionDeny() {
        screenTime = false
        track("screentime", "denied")
    }

    func permissionTriedAgain() {
        triedAgain = true
        track("screentime", "tried again")
    }

    func permissionSkip() {
        startFromApps(false)
        go(.rather)
    }

    func crunchingDone() {
        startFromApps(true)
        go(.rather)
    }

    // MARK: rather → your number → your plan

    /// "what would you rather spend it on?" continue: fold the picks into
    /// `about`, build the plan, and play the number sequence from the top.
    func ratherContinue(_ next: Screen = .yournumber, extras: [String] = []) {
        about = Rather.applyRather(about, rather, extras)
        buildPlanFor(rather)
        track("rather", rather.isEmpty ? "nothing picked" : rather.joined(separator: ", "))
        numberBeat = 0
        go(next)
    }

    /// YourPlan's goal stepper: changing the goal refits the limits to it
    func yourPlanSetTime(_ next: TimeGoal) {
        time = next
        makeRiloPlan(goalOverride: Plan.hoursToMins(next.goal))
    }

    /// YourPlan's swaps ("tonight 7–8pm: gym instead of tiktok")
    var insteadSwaps: [InsteadSwap] { MockAI.insteadPlan(picks: rather, apps: watched) }

    // MARK: paywall / upgrade

    func paywallChoose(_ which: String) {
        let trial = which == "start free trial"
        track("paywall", which)
        planChoice = trial ? "trial" : "free"
        /* the trial button (after StoreKit says yes) is what makes someone
           Pro; "free" never takes away a subscription they already have */
        isPro = trial || ProStore.shared.entitled == true
    }

    /// back from onboarding's paywall goes to Your plan; from a locked
    /// feature it goes back where it came from
    func paywallBack() {
        if screen == .paywall { goTo(.yourplan, dir: .back) } else { goTo(cameFrom ?? .home, dir: .back) }
    }

    /// call when leaving the paywall forward (before go(paywallNext)):
    /// the end of onboarding gives Rilo a run-up before the tour
    func paywallLeaving() {
        if screen == .paywall { handoff = true }
    }

    /// Paywall.jsx's button tap in one: onChoose(which), onNext, go(nextFor())
    func paywallDone(_ which: String) {
        paywallChoose(which)
        let next = paywallNext
        paywallLeaving()
        go(next)
    }

    // MARK: home

    func strictSuggestYes() {
        strict.suggestedOn = dateKey
        strictOn(days: 7, when: "all")
    }

    func strictSuggestNo() {
        strict.suggestedOn = dateKey
        strict.declined += 1
        track("strict", "not now")
    }

    func daySummaryDone() {
        dayResult = nil
        /* the summary is blank without its result, so the move home must
           not be dropped by a slide still running (a quick tap) */
        goToSoon(.home, dir: .back)
    }

    // MARK: whyopen / intercept / shield / reason screens

    func whyOpenFeeling(_ id: String) {
        track("checkin", id)
        go(id == "bored" ? .suggestion : .tired)
    }

    /// they took the alternative — that banks the time and the xp
    func whyOpenInstead(_ option: PushBackOption) {
        track("instead", "\(option.id): \(option.label)")
        saidNo()
        awardXp(option.id == "break" ? 5 : 10)
        go(option.id == "break" ? .break : .progress)
    }

    func whyOpenNevermind() {
        track("checkin", "never mind")
        saidNo()
        go(.home, dir: .back)
    }

    func shieldTalk() { banner = true }

    func shieldClose() {
        banner = false
        go(.home, dir: .back)
    }

    func bannerTap() {
        banner = false
        goTo(.intercept)
    }

    func interceptReason(_ reason: String) {
        track("reason", reason)
        if reason == "never mind" { saidNo() }
    }

    func interceptLimitIt() {
        track("limits", "suggested a limit on \(currentApp)")
        go(.limits)
    }

    /// Suggestion: did a hobby instead
    func suggestionSaidNo() {
        saidNo()
        awardXp(10)
        go(.progress)
    }

    /// Tired: put the phone down
    func tiredSaidNo() {
        saidNo()
        awardXp(5)
        go(.progress)
    }

    // MARK: night check-in, calendar, creator

    func nightTimeSet(_ n: NightCheck) {
        night = n
        track("night", "check-in set for \(n.at)")
    }

    /// the You tab's version of the same setter
    func youSetNight(_ n: NightCheck) {
        night = n
        track("night", "check-in moved to \(n.at)")
    }

    func nightAskAnswer(_ text: String) {
        if let ask = checkinAsk { answerAsk(ask.id, [text]) }
    }

    func nightAskSkip() {
        if let ask = checkinAsk { skipAsk(ask.id) }
    }

    func nightCheckInDone(said: NightSaid, tasks: [NightTask]) {
        /* keep the time they chose — only the day's answers change */
        night.date = dateKey
        night.said = said
        night.tasks = tasks
        /* tomorrow's tasks go straight onto the plan */
        schedulePlan = SchedulePlan(mode: schedulePlan.mode,
                                    rows: schedulePlan.rows + tasks.map { ScheduleRow(at: "", title: $0.title, note: $0.note) })
        track("night", "\(tasks.count) task(s) for tomorrow")
        go(.plan)
    }

    func nightCheckInSkip() {
        track("night", "not tonight")
        go(.home, dir: .back)
    }

    func calendarSet(_ next: CalendarLink) {
        calendar = next
        if !next.on { calendarEvents = [] }
        track("calendar", next.on ? "connected \(next.which)" : "disconnected")
    }

    func creatorUseNormalLimit(task: String, minutes: Double) {
        finishCreatorSession(task: task, minutes: minutes)
        openApp("instagram")
    }

    // MARK: you, pick rilo, level up

    func replayIntroTour() {
        introTourDone = false
        go(.home)
    }

    func setThemeTracked(_ id: String) {
        theme = id
        track("theme", id)
    }

    func lockedTheme(_ id: String) {
        track("locked", "theme \(id)")
        go(.upgrade)
    }

    func demoXp(_ amount: Int = 500) {
        if awardXp(amount) { go(.levelup) }
    }

    func pickRiloPreview(_ look: String) { track("rilo", look) }
    func pickRiloLocked(_ look: String) { track("locked", look) }

    func levelUpWear() {
        if let s = pendingSkin { chosenRilo = s }
        pendingSkin = nil
        goTo(.home, dir: .back)
    }

    func levelUpLater() {
        pendingSkin = nil
        goTo(.home, dir: .back)
    }

    // MARK: overlays

    func loosenCancel() { loosenAsk = nil }

    func loosenConfirm(_ reason: String) {
        guard let ask = loosenAsk else { return }
        loosenAsk = nil
        applySetting(ask.app, ask.next)
        track("limit", "loosened \(ask.app) · \(reason)")
    }

    func handoffDone() { handoff = false }

    /// MeetRiloTour's "do you post?" — DEMO Pro unlock, no purchase
    func tourCreatorAnswer(_ postsFrequently: Bool) {
        if postsFrequently {
            isPro = true
            creatorModeOn = true
        } else if !isPro {
            creatorModeOn = false
        }
    }

    func tourDone() { introTourDone = true }
}

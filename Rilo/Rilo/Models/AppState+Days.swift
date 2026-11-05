import Foundation

/// Ending a day or a week, the demo's time travel, the first week of
/// questions, and starting over (App.jsx).
extension AppState {
    // MARK: ending a day — the only place day XP is handed out

    func endDay(forceOver: Bool = false) {
        let goal = Double(goalMins)
        let used = forceOver ? goal + 45 : usedTotalToday
        let res = Plan.dayXp(used: used, goal: goal, streak: streak)
        let finished = stepFinished

        var gained = res.xp
        let over = !res.hit

        /* did they lean on the ways out today? that's the strict-mode signal */
        let leaned = day.passes > 0 || day.borrowed != nil
        if leaned { leanDays += 1 }

        /* a week is 7 days; more than 2 bad days and it runs again */
        let daysDone = program.daysDone + 1
        let daysOver = program.daysOver + (over ? 1 : 0)
        var nextProgram = program
        nextProgram.daysDone = daysDone
        nextProgram.daysOver = daysOver
        var repeated = false

        if daysDone >= 7 {
            if daysOver > 2 {
                repeated = true
                nextProgram = program
                nextProgram.daysDone = 0
                nextProgram.daysOver = 0
                track("week", "repeated")
            } else {
                gained += Plan.WEEK_BONUS
                nextProgram = program
                nextProgram.week = program.week + 1
                nextProgram.daysDone = 0
                nextProgram.daysOver = 0
                track("week", "cleared")
            }
            /* either way a new week means a new step-down */
            offerStepDown(nextProgram.week, finished: finished)
            leanDays = 0
            /* once the plan fits and they're living in it, stop tightening */
            if finished {
                gained += Plan.PLAN_BONUS
                step.done = true
                step.status = "idle"
            }
        }

        track("day", res.hit ? "goal hit" : "went over")

        streak = res.streak
        program = nextProgram
        history = (history + [HistoryDay(date: day.date, used: used, goal: goal, hit: res.hit)]).suffixJS(30)
        awardXp(gained)

        /* fresh day: opens and the pass reset, unused opens don't carry */
        startFreshDay()
        /* a day going by moves the first week's questions along */
        drip = FirstWeek.dripToDay(drip, drip.day + 1)

        dayResult = DayResult(used: used, goal: goal, hit: res.hit, xp: gained, streak: res.streak,
                              under: max(0, goal - used), repeated: repeated)
        goToSoon(.daysummary)
    }

    /// Seven clean days in one tap, so a tester can see a week clear.
    func runWeek() {
        let goal = Double(goalMins)
        let finished = stepFinished
        var st = streak
        var gained = 0
        var days: [HistoryDay] = []
        let under = max(0, goal - 20)

        for _ in 0..<7 {
            let res = Plan.dayXp(used: under, goal: goal, streak: st)
            st = res.streak
            gained += res.xp
            days.append(HistoryDay(date: dateKey, used: under, goal: goal, hit: true))
        }
        gained += Plan.WEEK_BONUS
        let nextWeek = program.week + 1

        track("week", "cleared")
        streak = st
        history = (history + days).suffixJS(30)
        var p = program
        p.week = nextWeek; p.daysDone = 0; p.daysOver = 0
        program = p
        leanDays = 0
        awardXp(gained)
        startFreshDay()
        /* a cleared week puts them past the first week of questions */
        drip = FirstWeek.dripToDay(drip, drip.day + 7)
        offerStepDown(nextWeek, finished: finished)

        dayResult = DayResult(used: under, goal: goal, hit: true, xp: gained, streak: st, under: 20, repeated: false)
        goToSoon(.daysummary)
    }

    // MARK: time travel (demo)

    /// Fresh day: opens and the pass reset, the borrow IOU comes due, and
    /// every shield goes back up.
    func startFreshDay() {
        day = Storage.freshDay(dateKey)
        collectBorrow()
        screenTimeService.dayRolledOver(to: dateKey)
    }

    /// The borrow IOU is the only thing that crosses midnight.
    func collectBorrow() {
        if borrow.app.isEmpty { return }
        if borrow.date == dateKey { borrow = BorrowIOU() } else { borrow.date = dateKey }
    }

    func skipToMidnight() {
        startFreshDay()
        track("demo", "skipped to midnight")
    }

    /// Land everything that was waiting out its 24 hours.
    func skip24h() {
        pending.forEach(applyPending)
        pending = []
        if strict.on && strict.endingAt != nil {
            strict.on = false
            strict.endingAt = nil
        }
        if step.skipAt != nil {
            step.skipAt = nil
            step.status = "skipped"
        }
        track("demo", "skipped 24 hours")
    }

    // MARK: the first week of questions

    /// Waved off. Marked asked so he drops it for good.
    func skipAsk(_ id: String) {
        drip = FirstWeek.markAsked(drip, id)
        track("firstweek", "\(id) · not now")
    }

    /// Answered. Each one writes to wherever that setting already lived.
    func answerAsk(_ id: String, _ values: [String] = []) {
        if id == "school" {
            let w = FirstWeek.windowOf(values.first)
            school.on = true
            school.from = w.from
            school.to = w.to
        }
        if id == "scroll" { about.scrollWhen = values }
        if id == "hobbies" { about.extra.hobby = Rather.uniq(about.extra.hobby + values) }
        if id == "goal" { about.extra.goal = Rather.uniq(about.extra.goal + values) }
        drip = FirstWeek.markAsked(drip, id)
        track("firstweek", "\(id) · \(values.isEmpty ? "answered" : values.joined(separator: ", "))")
    }

    /// The calendar question is the only one with somewhere to go.
    func ctaAsk(_ id: String) {
        drip = FirstWeek.markAsked(drip, id)
        track("firstweek", "\(id) · opened")
        if id == "calendar" { go(.calendar) }
    }

    /// DEMO ONLY: jump to one day of the first week and land where it shows.
    func demoAskDay(_ n: Int) {
        let row = FirstWeek.ASKS.first { $0.day == n }
        drip = Drip(day: n, done: drip.done.filter { $0 != row?.id }, askedOn: 0)
        guard let row else { return }
        track("demo", "first week · day \(n)")
        if row.morningOnly { demoClock = "08:00" }
        if row.slot == "checkin" { go(.nightcheckin) } else { go(.plan) }
    }

    // MARK: delete account

    /// You ▸ account ▸ delete account (App Store rule 5.1.1(v)). Rilo has no
    /// server account: everything lives on this phone, in UserDefaults. So
    /// this wipes the app's whole UserDefaults (saved state, what he
    /// remembers, check-ins, the tester counts, the mic flag, any key added
    /// later), then startOver() resets what's in memory, cancels his
    /// reminders and goes back to Welcome. An Apple subscription isn't
    /// touched: Apple bills it, so only the user can cancel it.
    func deleteAccount() {
        if let id = Bundle.main.bundleIdentifier {
            UserDefaults.standard.removePersistentDomain(forName: id)
        }
        startOver()
    }

    // MARK: start over

    /// Everything back to a brand-new account: every saved field, the
    /// onboarding answers, the tour, and Rilo's reminders.
    func startOver() {
        Storage.clearState()
        RiloNotifications.shared.cancelAll()
        restore(Storage.DEFAULT_STATE)
        opens = OpenCounts(date: dateKey)
        day = Storage.freshDay(dateKey)
        /* the in-memory bits too */
        pendingSkin = nil
        riloWhy = [:]
        riloLead = []
        introTourDone = false
        rather = []
        numberBeat = 0
        loosenAsk = nil
        handoff = false
        promise = nil
        overNote = ""
        session = Session()
        cameFrom = nil
        banner = false
        savedNote = nil
        dayResult = nil
        /* straight back to Welcome, no slide — it's a new tester */
        /* (what gets saved next is just the default state, on Welcome) */
        jump(to: .welcome)
    }
}

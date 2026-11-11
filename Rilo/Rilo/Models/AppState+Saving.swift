import Foundation

/// Phase 7: the app remembers everything (Storage), opens where it makes
/// sense, rolls the day over when it opens on a new one, and keeps Rilo's
/// reminders (RiloNotifications) in step with the settings.
extension AppState {
    // MARK: where to open

    /// Mid-onboarding: the step they were on (every step has its own back
    /// button, so back still works). Anything after onboarding: home. The
    /// shield, a session, level up and the rest are moments, not places, so
    /// they never come back half-done.
    static func restoredScreen(_ saved: SavedState) -> Screen {
        guard let raw = saved.screen, let s = Screen(rawValue: raw) else {
            /* a save from before Phase 7 has no screen */
            return saved.planChoice != nil ? .home : .welcome
        }
        return Screen.onboarding.contains(s) ? s : .home
    }

    /// Copy a saved state into the live one (start over uses the defaults).
    func restore(_ d: SavedState) {
        name = d.name
        about = d.about
        apps = d.apps
        time = d.time
        plan = d.plan
        planChoice = d.planChoice
        xp = d.xp
        level = d.level
        isPro = d.isPro
        chosenRilo = d.chosenRilo
        theme = d.theme
        opens = d.opens
        stats = d.stats
        appSettings = d.appSettings
        limitMode = d.limitMode
        borrow = d.borrow
        pending = d.pending
        step = d.step
        focus = d.focus
        screenTime = d.screenTime
        triedAgain = d.triedAgain
        breakdown = d.breakdown
        program = d.program
        day = d.day
        history = d.history
        streak = d.streak
        leanDays = d.leanDays
        strict = d.strict
        checkins = d.checkins
        bedtime = d.bedtime
        school = d.school
        buddies = d.buddies
        schedulePlan = d.schedule
        creator = d.creator
        creatorModeOn = d.creatorModeOn
        calendar = d.calendar
        night = d.night
        drip = d.drip
        demoClock = d.demoClock
        introTourDone = d.introTourDone
        rather = d.rather
        numberBeat = d.numberBeat
        riloWhy = d.riloWhy
        riloLead = d.riloLead
        pendingSkin = d.pendingSkin
        memory = d.memory
    }

    // MARK: the app coming and going

    /// screens where it's fine to drop in the day summary
    private static let resting: [Screen] = Screen.tourScreens

    /// The app opened (or came back) on a new day. Before they've finished
    /// onboarding it's just a fresh day; after, yesterday is ended exactly
    /// like the demo panel's "end day" (history, streak, xp, the week, the
    /// first-week questions), and the day summary shows.
    func rollOverIfNeeded() {
        guard day.date != dateKey else { return }
        if inOnboarding || planChoice == nil {
            startFreshDay()
            return
        }
        /* mid-session or mid-pop-up: wait for them to get back home */
        guard Self.resting.contains(screen), !isSliding else { return }
        endDay()
    }

    func appBecameActive() {
        rollOverIfNeeded()
        rescheduleNotifications(force: true)
        /* Phase 8: shields match the rules, then whatever happened while away */
        syncScreenTime(force: true)
        handleScreenTimeEvents()
        /* the calendar may have changed while away */
        reloadCalendar()
    }

    func appWentToBackground() {
        saveNow()
        rescheduleNotifications(force: true)
    }

    // MARK: notifications

    /// the reminders only start once onboarding is done
    var onboarded: Bool { planChoice != nil && !inOnboarding }

    /// What Rilo's reminders depend on; they're rebuilt when it changes.
    private var notifyKey: String {
        "\(onboarded)|\(isPro)|\(night.at)|\(night.date)|\(bedtime.on)|\(bedtime.from)|\(drip.day)|\(drip.done)|\(drip.askedOn)"
    }

    /// called after every save
    func settingsChanged() {
        rescheduleNotifications()
        syncScreenTime()
    }

    func rescheduleNotifications(force: Bool = false) {
        let key = notifyKey
        if !force && key == lastNotifyKey { return }
        lastNotifyKey = key
        #if DEBUG
        /* -notifynow keeps its 5-second test reminder */
        if DemoSeed.flag("-notifynow") { return }
        #endif
        RiloNotifications.shared.schedule(notificationPlan)
    }

    var notificationPlan: [RiloNotifications.Planned] {
        guard onboarded else { return [] }
        return RiloNotifications.plan(isPro: hasPro, night: night, checkedInToday: checkedInToday,
                                      bedtime: bedtime, drip: drip)
    }

    /// A tapped reminder: the check-in opens the check-in (Pro), anything
    /// else lands where its question shows.
    func openFromNotification(_ target: Screen) {
        guard onboarded else { return }
        let next: Screen = target == .nightcheckin && !canCheckIn ? .home : target
        if isSliding {
            Task { @MainActor [weak self] in
                try? await Task.sleep(for: .seconds(NavMotion.settleAfter))
                self?.go(next)
            }
            return
        }
        go(next, dir: next == .home ? .back : .forward)
    }

    // MARK: haptics on arrival

    /// called by goTo: the moments that earn a buzz
    func arrived(at next: Screen) {
        switch next {
        case .levelup: Haptics.success()
        case .daysummary where dayResult?.hit == true: Haptics.success()
        case .shield: Haptics.warning()
        case .intercept where settingOf(currentApp).mode == .limited && availOf(currentApp) <= 0:
            /* out of opens */
            Haptics.warning()
        default: break
        }
    }
}

import SwiftUI

/// The state + actions that live in app/src/App.jsx, one-to-one.
///
/// Every `useState` there is a property here (same name; `schedulePlan` is
/// the plan-tab schedule, saved as `schedule` like the web). Every action is
/// a method with the same logic, split across:
///   AppState+Derived   the values App.jsx works out on each render
///   AppState+Limits    changing limits, pending changes, step-down, strict, Rilo's plan
///   AppState+Sessions  opening apps, sessions, the pass, borrowing, xp, Creator Mode
///   AppState+Days      ending a day/week, time travel, the first-week asks, start over
///   AppState+Screens   the little callbacks App.jsx wires inline per screen + DemoPanel
///
/// Screens read and write it with `@Environment(AppState.self) var state`.
/// Saved to UserDefaults (Storage) whenever a saved field changes: everything
/// the web saves, plus where they are and the onboarding answers the web
/// kept in memory (Phase 7). Restored on launch (AppState+Saving).
@Observable @MainActor
final class AppState {
    // MARK: navigation (App.jsx `nav`)
    /// the screen showing (the web's last nav entry)
    private(set) var screen: Screen = .welcome { didSet { scheduleSave() } }
    /// how the last change of screen should animate
    private(set) var navDirection: NavDirection = .forward
    /// true while a slide is running; navigation is ignored then (like the web)
    private(set) var isSliding = false
    /// the same direction, readable by the screen transition at animation
    /// time (see RootView ScreenTransition)
    @ObservationIgnored let navBox = NavBox()

    // MARK: saved state (lib/storage DEFAULT_STATE)
    var name: String { didSet { scheduleSave() } }
    var about: About { didSet { scheduleSave() } }
    var apps: PickedApps { didSet { scheduleSave(); breakdownDepsChanged() } }
    var time: TimeGoal { didSet { scheduleSave(); breakdownDepsChanged() } }
    /// which price is selected on the paywall: 'year' | 'month'
    var plan: String { didSet { scheduleSave() } }
    var planChoice: String? { didSet { scheduleSave() } }
    var xp: Int { didSet { scheduleSave() } }
    /// high-water level — XP can drop, a level never does
    var level: Int { didSet { scheduleSave() } }
    var isPro: Bool {
        didSet {
            scheduleSave(); breakdownDepsChanged()
            if isPro && !oldValue && loaded { Haptics.success() }
        }
    }
    var chosenRilo: String { didSet { scheduleSave() } }
    var theme: String { didSet { scheduleSave() } }
    var opens: OpenCounts { didSet { scheduleSave() } }
    var stats: Stats { didSet { scheduleSave() } }

    var appSettings: [String: AppSetting] { didSet { scheduleSave(); checkAutoPlan() } }
    /// 'rilo' | 'own'
    var limitMode: String { didSet { scheduleSave() } }
    var borrow: BorrowIOU { didSet { scheduleSave() } }
    var pending: [PendingChange] { didSet { scheduleSave() } }
    var step: StepState { didSet { scheduleSave() } }
    var focus: FocusBlock { didSet { scheduleSave() } }

    var screenTime: Bool? { didSet { scheduleSave(); breakdownDepsChanged() } }
    var triedAgain: Bool { didSet { scheduleSave() } }
    var breakdown: Breakdown? { didSet { scheduleSave(); checkAutoPlan() } }
    var program: Program { didSet { scheduleSave() } }
    var day: DayState { didSet { scheduleSave() } }
    var history: [HistoryDay] { didSet { scheduleSave() } }
    var streak: Int { didSet { scheduleSave() } }
    var leanDays: Int { didSet { scheduleSave() } }
    var strict: StrictState { didSet { scheduleSave() } }

    var checkins: [Checkin] { didSet { scheduleSave() } }
    var bedtime: Bedtime { didSet { scheduleSave() } }
    var school: School { didSet { scheduleSave() } }
    var buddies: Buddies { didSet { scheduleSave() } }
    /// today's schedule on the plan tab (saved as `schedule`)
    var schedulePlan: SchedulePlan { didSet { scheduleSave() } }
    var creator: CreatorStats { didSet { scheduleSave() } }
    var creatorModeOn: Bool { didSet { scheduleSave() } }
    var calendar: CalendarLink { didSet { scheduleSave() } }
    var night: NightCheck { didSet { scheduleSave() } }
    var drip: Drip { didSet { scheduleSave() } }
    /// DEMO ONLY: a fake clock ("HH:MM"), nil = the real one
    var demoClock: String? { didSet { scheduleSave() } }

    // MARK: not saved
    /* saved since Phase 7 (the web kept these in memory) */
    /// a skin waiting to be celebrated, shown next time we head home
    var pendingSkin: String? = nil { didSet { scheduleSave() } }
    /// what Rilo said about his own plan, when he made it
    var riloWhy: [String: String] = [:] { didSet { scheduleSave() } }
    var riloLead: [String] = [] { didSet { scheduleSave() } }
    /// the Meet Rilo tour runs once
    var introTourDone = false { didSet { scheduleSave() } }
    /// a loosening change waiting on rilo's "are you sure"
    var loosenAsk: LoosenAsk? = nil
    /// the beat between finishing onboarding and the tour starting
    var handoff = false
    /// which beat of the YourNumber sequence they're on
    var numberBeat = 0 { didSet { scheduleSave() } }
    /// the reason they gave on the check-in, for this session
    var promise: Checkin? = nil
    /// "you said quick check on messages, and you used the whole open"
    var overNote = ""
    var session = Session()
    /// which screen opened the paywall, so it can hand them back
    var cameFrom: Screen? = nil
    /// the iOS notification Rilo sends from the shield
    var banner = false
    /// "you closed 7 min early" — shown on Home once
    var savedNote: SavedNote? = nil
    /// what they said they'd rather be doing (Rather ids)
    var rather: [String] = [] { didSet { scheduleSave() } }
    /// what the day summary shows
    var dayResult: DayResult? = nil
    /// ticks once a second while anything is pending, so countdowns move
    private(set) var tick = 0

    @ObservationIgnored private var saveQueued = false
    @ObservationIgnored private var loaded = false
    /// what the notifications were last scheduled for (AppState+Saving)
    @ObservationIgnored var lastNotifyKey: String? = nil
    @ObservationIgnored private var lastBreakdownKey: String? = nil
    @ObservationIgnored private var ticker: Task<Void, Never>? = nil
    /// Phase 8: the phone's Screen Time (demo or real, see ScreenTime.make)
    @ObservationIgnored let screenTimeService: any ScreenTimeService = ScreenTime.make()
    /// what the shields were last set to (AppState+ScreenTime)
    @ObservationIgnored var lastScreenTimeRules: ScreenTimeRules? = nil

    init(saved: SavedState = Storage.loadState()) {
        name = saved.name
        about = saved.about
        apps = saved.apps
        time = saved.time
        plan = saved.plan
        planChoice = saved.planChoice
        xp = saved.xp
        level = saved.level
        isPro = saved.isPro
        chosenRilo = saved.chosenRilo
        theme = saved.theme
        opens = saved.opens
        stats = saved.stats
        appSettings = saved.appSettings
        limitMode = saved.limitMode
        borrow = saved.borrow
        pending = saved.pending
        step = saved.step
        focus = saved.focus
        screenTime = saved.screenTime
        triedAgain = saved.triedAgain
        breakdown = saved.breakdown
        program = saved.program
        day = saved.day
        history = saved.history
        streak = saved.streak
        leanDays = saved.leanDays
        strict = saved.strict
        checkins = saved.checkins
        bedtime = saved.bedtime
        school = saved.school
        buddies = saved.buddies
        schedulePlan = saved.schedule
        creator = saved.creator
        creatorModeOn = saved.creatorModeOn
        calendar = saved.calendar
        night = saved.night
        drip = saved.drip
        demoClock = saved.demoClock
        /* Phase 7: the rest of what they did, and where they were */
        introTourDone = saved.introTourDone
        rather = saved.rather
        numberBeat = saved.numberBeat
        riloWhy = saved.riloWhy
        riloLead = saved.riloLead
        pendingSkin = saved.pendingSkin
        screen = Self.restoredScreen(saved)
        loaded = true
        lastBreakdownKey = breakdownKey
        startTicker()
    }

    // MARK: saving (the web's saveState useEffect)

    var savedState: SavedState {
        SavedState(
            name: name, about: about, apps: apps, time: time, appSettings: appSettings,
            limitMode: limitMode, plan: plan, planChoice: planChoice, isPro: isPro, xp: xp,
            level: level, chosenRilo: chosenRilo, theme: theme, opens: opens, stats: stats,
            screenTime: screenTime, triedAgain: triedAgain, breakdown: breakdown, program: program,
            day: day, borrow: borrow, pending: pending, step: step, focus: focus, history: history,
            streak: streak, leanDays: leanDays, checkins: checkins, bedtime: bedtime, school: school,
            buddies: buddies, schedule: schedulePlan, creator: creator, creatorModeOn: creatorModeOn,
            introTourDone: introTourDone,
            calendar: calendar, night: night, demoClock: demoClock, drip: drip, strict: strict,
            screen: screen.rawValue, rather: rather, numberBeat: numberBeat,
            riloWhy: riloWhy, riloLead: riloLead, pendingSkin: pendingSkin)
    }

    private func scheduleSave() {
        guard loaded, !saveQueued else { return }
        saveQueued = true
        Task { @MainActor [weak self] in
            guard let self else { return }
            self.saveQueued = false
            Storage.saveState(self.savedState)
            self.settingsChanged()
        }
    }

    /// Save right now (the app is going to the background).
    func saveNow() {
        guard loaded else { return }
        saveQueued = false
        Storage.saveState(savedState)
    }

    // MARK: navigation

    /// Move to a screen. Ignored when it's the one showing, or while a slide
    /// is still running (App.jsx goTo).
    func goTo(_ next: Screen, dir: NavDirection = .forward) {
        if screen == next { return }
        if isSliding { return }
        navDirection = dir
        navBox.direction = dir
        isSliding = true
        let curve = dir == .forward ? NavMotion.forwardEnter : NavMotion.backEnter
        withAnimation(.timingCurve(curve.x1, curve.y1, curve.x2, curve.y2, duration: curve.duration)) {
            screen = next
        }
        arrived(at: next)
        Task { @MainActor [weak self] in
            try? await Task.sleep(for: .seconds(NavMotion.settleAfter))
            self?.isSliding = false
        }
        checkAutoPlan()
    }

    /// App.jsx go(): heading home with an unlock waiting shows the
    /// celebration first, and the paywall remembers where it was opened from.
    func go(_ next: Screen, dir: NavDirection = .forward) {
        if next == .upgrade { cameFrom = screen }
        goTo(next == .home && pendingSkin != nil ? .levelup : next, dir: dir)
    }

    /// Jump with no slide (start over, and the `-screen` launch argument).
    func jump(to next: Screen) {
        navDirection = .forward
        navBox.direction = .forward
        isSliding = false
        screen = next
        checkAutoPlan()
    }

    // MARK: the web's effects

    /// pickedKey, time.now, screenTime, isPro — the breakdown is rebuilt
    /// when any of these change, once Screen Time has been answered
    private var breakdownKey: String {
        "\(Plan.watchedFor(screenTimeService.pickedAppKeys ?? Apps.pickedApps(apps), isPro).joined(separator: ","))|\(time.now)|\(String(describing: screenTime))|\(isPro)"
    }

    private func breakdownDepsChanged() {
        guard loaded else { return }
        let key = breakdownKey
        if key == lastBreakdownKey { return }
        lastBreakdownKey = key
        guard let st = screenTime else { return }
        makeBreakdown(st == true)
    }

    /// The first time they reach the onboarding limits screen there's nothing
    /// set, so Rilo builds a plan rather than handing them an empty form.
    private func checkAutoPlan() {
        guard loaded, appSettings.isEmpty, breakdown != nil, !tracked.isEmpty,
              screen == .limitsonboard else { return }
        makeRiloPlan()
    }

    /// a pending change lands the moment its 24 hours are up
    private func startTicker() {
        ticker = Task { @MainActor [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                self?.tickOnce()
            }
        }
    }

    private func tickOnce() {
        let waiting = !pending.isEmpty || strict.endingAt != nil || step.skipAt != nil
        guard waiting else { return }
        let at = JS.nowMs
        tick += 1

        let due = pending.filter { $0.at <= at }
        if !due.isEmpty {
            due.forEach(applyPending)
            pending = pending.filter { $0.at > at }
        }
        if let end = strict.endingAt, end <= at {
            strict.on = false
            strict.endingAt = nil
        }
        if let skip = step.skipAt, skip <= at {
            step.skipAt = nil
            step.status = "skipped"
        }
    }
}

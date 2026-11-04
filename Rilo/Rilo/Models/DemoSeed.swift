import Foundation

/// DEMO/DEBUG ONLY: launch arguments for screenshots.
///   -screen <name>   jump straight to that screen (web names, see Screen)
///                    with sensible demo state, e.g. home has a name, picked
///                    apps and Rilo-built limits
///   -screen foundation[-<theme>]   the Phase 1 FoundationPreview
///   -theme <id>      grass | bamboo | sakura | sunset | snow
///   -beat <0|1|2>    Your number on that beat, settled (no auto-advance)
///   -picked          Rather with gym + studying already picked;
///                    pickapps with tiktok, instagram, youtube ticked
///   -appsheet [-appquery <text>]   pickapps with the add-app sheet open
///   -permsheet / -permdenied   permission with the iOS alert / the deny branch
///   -hold            crunching stays put (no 1.5s auto-advance)
///   -tour            keep the Meet Rilo tour on the tab screens (off by
///                    default so screenshots show the screen itself)
/// The seed runs the same AppState actions onboarding does, so the numbers
/// are the real ones. Taps made while seeding aren't tracked.
enum DemoSeed {
    static var arguments: [String] { ProcessInfo.processInfo.arguments }

    static func arg(_ key: String) -> String? {
        guard let i = arguments.firstIndex(of: key), i + 1 < arguments.count else { return nil }
        return arguments[i + 1]
    }

    /// `-screen foundation` / `foundation-<theme>`
    static var foundation: (on: Bool, theme: String?) {
        guard let s = arg("-screen"), s.hasPrefix("foundation") else { return (false, nil) }
        let theme = s.split(separator: "-").dropFirst().first.map(String.init)
        return (true, theme)
    }

    /// The AppState the app starts with.
    @MainActor
    static func launch() -> AppState {
        #if DEBUG
        if arguments.contains("-selfcheck") { SelfCheck.run() }
        #endif
        let state = AppState()
        if let theme = arg("-theme") { state.theme = theme }
        if let raw = arg("-screen"), let screen = Screen(rawValue: raw) {
            seed(state, for: screen)
        }
        return state
    }

    /// screens that come before the user has picked anything
    private static let blank: [Screen] = [.welcome, .name, .pickapps]

    @MainActor
    static func seed(_ state: AppState, for screen: Screen) {
        Track.muted = true
        defer { Track.muted = false }

        if !blank.contains(screen) {
            state.name = "Ethan"
            state.apps = PickedApps(on: ["tiktok": true, "instagram": true, "youtube": true, "snapchat": true],
                                    extra: [])
        }
        let past: [Screen] = [.permission, .crunching]
        if !blank.contains(screen) && !past.contains(screen) {
            /* what Permission → Crunching → Rather do */
            state.screenTime = true
            state.startFromApps(true)
            state.rather = ["gym", "studying"]
            state.about = Rather.applyRather(state.about, state.rather, [])
            state.buildPlanFor(state.rather)
        }

        let tabs = Screen.tourScreens + [.limits, .creator, .daysummary, .shield, .appopen, .intercept,
                                         .whyopen, .suggestion, .tired, .break, .needit, .levelup,
                                         .sharecard, .buddies, .nightcheckin, .nighttime, .calendar,
                                         .talkchat, .upgrade, .results]
        if tabs.contains(screen) {
            state.planChoice = "trial"
            state.isPro = true
            state.introTourDone = !arguments.contains("-tour")
            state.day.used = ["tiktok": 38, "instagram": 22]
            state.day.opensUsed = ["tiktok": 1, "instagram": 0.5]
            /* a session a few minutes ago, so Rilo isn't "chilling" */
            state.day.lastBlockedAt = JS.nowMs - 5 * 60000
            state.day.sinceBlocked = 0
        }

        /* -picked: PickApps with tiktok, instagram and youtube ticked */
        if screen == .pickapps && arguments.contains("-picked") {
            state.apps = PickedApps(on: ["tiktok": true, "instagram": true, "youtube": true], extra: [])
        }

        switch screen {
        case .shield, .intercept, .whyopen, .suggestion, .tired, .break, .needit:
            state.session.app = "tiktok"
            state.opens = OpenCounts(date: state.dateKey, counts: ["tiktok": 4])
        case .appopen:
            let s = state.settingOf("tiktok")
            state.session = Session(app: "tiktok", cap: Double(s.minutes), carried: 0, charged: 0,
                                    kind: "open", minutes: s.minutes)
        case .daysummary:
            let goal = Double(state.goalMins)
            state.dayResult = DayResult(used: goal - 25, goal: goal, hit: true, xp: 80, streak: 3,
                                        under: 25, repeated: false)
        case .levelup:
            state.level = 3
            state.pendingSkin = "bamboo"
        case .rather:
            /* arrives with nothing picked, like onboarding; -picked keeps gym + studying */
            if !arguments.contains("-picked") { state.rather = [] }
        case .upgrade:
            state.isPro = false
            state.planChoice = "free"
        default:
            break
        }
        state.jump(to: screen)
        #if DEBUG
        /* -beat N: Your number on that beat, settled (YourNumberView) */
        if let b = arg("-beat"), let n = Int(b) { state.numberBeat = n }
        #endif
    }
}

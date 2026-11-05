import Foundation

/// The ONE seam for everything blocking-related (Phase 8).
///
/// AppState owns the rules (Models/Limits*, AppState+Limits/+Sessions) and
/// tells this service what they mean right now. The service is the only
/// thing that touches the phone's real Screen Time:
///
/// - `DemoScreenTimeService` (below, the default): blocks nothing. Apps are
///   the names the models use, and Rilo draws his own fake shield screen.
///   The app behaves exactly like the web demo.
/// - `FamilyControlsScreenTimeService` (Rilo/ScreenTimeReal/, kept out of
///   the build until the paid Apple account + Family Controls entitlement):
///   real shields (ManagedSettings), Apple's app picker (FamilyActivityPicker,
///   opaque tokens), DeviceActivity schedules + per-open time limits.
///
/// Apps are always identified by an `appKey` String. In the demo it's the
/// app's label ("tiktok"). In the real app it's a stable key Rilo gives each
/// picked token (the token itself can't be read or named by the app).
///
/// Swap the two in `ScreenTime.make()` at the bottom of this file.
@MainActor
protocol ScreenTimeService: AnyObject {
    // MARK: permission

    /// Screen Time permission as iOS sees it
    var authorization: ScreenTimeAuth { get }
    /// the real system prompt (PermissionView's "allow"). Demo: always yes.
    func requestAuthorization() async -> ScreenTimeAuth

    // MARK: picking apps

    /// true → apps come from Apple's FamilyActivityPicker (AppPickerView
    /// replaces AppPicker/AppSheet). false → Rilo's own app list (demo).
    var usesSystemPicker: Bool { get }
    /// the picked apps' keys, when the service owns the selection (real).
    /// nil → the models' own `apps` (PickedApps) are the selection (demo).
    var pickedAppKeys: [String]? { get }

    // MARK: rules

    /// true → Rilo draws the shield himself (ShieldView + the fake banner).
    /// false → iOS shows the real shield; tapping its button posts Rilo's
    /// notification, and the app arrives on Intercept (`.shieldTapped`).
    var drawsShieldInApp: Bool { get }
    /// Put up / take down shields to match the current rules. Called after
    /// every save when the rules changed, on app launch/foreground, and on
    /// day roll-over. Strict mode rides along in `rules.strict`.
    func apply(_ rules: ScreenTimeRules)

    // MARK: sessions

    /// They picked Quick ½ / Full 1 (or the pass, a free app, an
    /// always-allowed app): lift the shield on that app for `minutes`.
    func startSession(_ session: ScreenTimeSession)
    /// the session is over (closed early, or the time ran out): shield again
    func endSession(app: String, minutesUsed: Double)

    // MARK: the day

    /// midnight (or the app opening on a new day): fresh opens, the pass is
    /// back, every limited app shielded again
    func dayRolledOver(to dateKey: String)

    /// What happened while Rilo wasn't on screen (shield button tapped, a
    /// session's minutes ran out, usage seen). Each event is handed out once.
    /// Demo: always empty.
    func takeEvents() -> [ScreenTimeEvent]
}

// MARK: - the data that crosses the seam

nonisolated enum ScreenTimeAuth: String, Codable, Sendable {
    case notDetermined, approved, denied
}

/// Everything the service needs to know to shield the right apps, built by
/// AppState from lockOf / availOf / settingOf (AppState+ScreenTime).
nonisolated struct ScreenTimeRules: Equatable, Sendable {
    struct App: Equatable, Sendable {
        /// always / blocked / limited / free
        var mode: AppMode
        /// should the shield be up whenever no session is running?
        var shielded: Bool
        /// opens left today (limited apps), for the shield's text + widget
        var opensLeft: Double
        /// "Y minutes per open"
        var minutesPerOpen: Int
        /// why it's locked outright: 'blocked' | 'noopens' | 'halfstranded' |
        /// 'bedtime' | 'school' | 'focus' | nil (just asks "what for?")
        var lockKind: String?
    }

    var dateKey: String
    /// keyed by appKey
    var apps: [String: App]
    /// strict mode: no halves, nothing that loosens shields early
    var strict: Bool
    /// bedtime / school / focus right now ('bedtime' | 'school' | 'focus' | nil)
    var scheduleKind: String?
    /// "HH:MM" the schedule lock lifts
    var scheduleUntil: String?
    /// for the home-screen widget: Rilo's mood + line right now, and his skin
    var mood: String
    var note: String
    var skin: String

    static let empty = ScreenTimeRules(dateKey: "", apps: [:], strict: false, scheduleKind: nil, scheduleUntil: nil,
                                       mood: "proud", note: "", skin: "original")

    /// Which apps get a shield. Every app except an always-allowed one goes
    /// through Rilo's "what are you opening this for?" first, exactly like
    /// the demo's openApp (blocked, limited and free all show the shield).
    static func shields(_ mode: AppMode) -> Bool { mode != .always }
}

/// One unshielded stretch on one app (AppState's `Session`).
nonisolated struct ScreenTimeSession: Equatable, Sendable {
    var app: String
    /// how long the shield stays down
    var minutes: Double
    /// 'open' | 'pass' | 'free' | 'always'
    var kind: String
    /// ms since 1970 (JS.nowMs)
    var startedAt: Double
}

nonisolated enum ScreenTimeEvent: Equatable, Sendable {
    /// the shield's "talk to rilo" button → Rilo's notification → the app
    case shieldTapped(app: String)
    /// a session ended while Rilo wasn't on screen (its minutes ran out, or
    /// they left and the session's window closed). The shield is already
    /// back up; charge it as `minutes` used.
    case sessionEnded(app: String, minutes: Double)
}

// MARK: - the demo (default)

/// DEMO: what the app has always done. No real blocking; the shield is
/// Rilo's own ShieldView, the "notification" is BannerOverlay, the session
/// is AppOpenView's timer. It only remembers what it was told (handy for
/// DEBUG checks), and never produces events.
@MainActor
final class DemoScreenTimeService: ScreenTimeService {
    private(set) var authorization: ScreenTimeAuth = .notDetermined
    let usesSystemPicker = false
    let pickedAppKeys: [String]? = nil
    let drawsShieldInApp = true

    /// the last rules applied and the session running (nothing reads these
    /// but DEBUG checks)
    private(set) var rules: ScreenTimeRules = .empty
    private(set) var session: ScreenTimeSession? = nil

    func requestAuthorization() async -> ScreenTimeAuth {
        authorization = .approved
        return authorization
    }

    func apply(_ rules: ScreenTimeRules) { self.rules = rules }
    func startSession(_ session: ScreenTimeSession) { self.session = session }
    func endSession(app: String, minutesUsed: Double) {
        if session?.app == app { session = nil }
    }
    func dayRolledOver(to dateKey: String) { session = nil }
    func takeEvents() -> [ScreenTimeEvent] { [] }
}

// MARK: - THE switch

enum ScreenTime {
    /// Demo → real: `FeatureFlags.REAL_SCREEN_TIME`, one line. The real code
    /// (Rilo/Rilo/ScreenTimeReal/) is always compiled, so it can't rot while
    /// it's off. See SETUP_AFTER_PAID_ACCOUNT.md for the one-time setup.
    @MainActor
    static func make() -> any ScreenTimeService {
        #if DEBUG
        /* the screenshot seeds and checks always run on the demo */
        if DemoSeed.screenArg != nil || DemoSeed.flag("-selfcheck") || DemoSeed.flag("-flowcheck") { return DemoScreenTimeService() }
        #endif
        return FeatureFlags.REAL_SCREEN_TIME ? FamilyControlsScreenTimeService() : DemoScreenTimeService()
    }

    /// true when Rilo is really blocking (the switch is on and it's not a
    /// DEBUG seed / check). Screens that differ between the two read this.
    @MainActor
    static func isReal(_ service: any ScreenTimeService) -> Bool { service.usesSystemPicker }
}

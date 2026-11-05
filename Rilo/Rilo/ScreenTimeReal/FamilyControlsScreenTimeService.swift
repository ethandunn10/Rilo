#if RILO_FAMILY_CONTROLS
import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity
import WidgetKit

/// REAL Screen Time (target: Rilo app). Needs the Family Controls
/// entitlement (paid Apple Developer account) and the App Group.
///
/// How the demo's flow maps onto the phone:
///   demo ShieldView          → iOS's shield, drawn by ShieldConfigurationExtension
///   demo banner tap          → ShieldActionExtension posts Rilo's notification;
///                              opening the app hands over `.shieldTapped`
///   intercept → whyopen      → the same Rilo screens
///   Quick ½ / Full 1         → startSession: unshield that app, and watch it with
///                              a DeviceActivity window + "minutes used" thresholds
///   minutes run out          → DeviceActivityMonitorExtension shields it again
///                              and posts `.sessionEnded`, charged in halves
///   midnight                 → the daily schedule's intervalDidStart: fresh day
@MainActor
final class FamilyControlsScreenTimeService: ScreenTimeService {
    private let auth = AuthorizationCenter.shared
    private let store = ManagedSettingsStore(named: .rilo)
    private let activity = DeviceActivityCenter()
    private var lastWidget: WidgetSnapshot?

    init() {
        startDailySchedule()
    }

    // MARK: permission

    var authorization: ScreenTimeAuth {
        switch auth.authorizationStatus {
        case .approved: return .approved
        case .denied: return .denied
        default: return .notDetermined
        }
    }

    func requestAuthorization() async -> ScreenTimeAuth {
        do {
            /* .individual: the teen authorizes their own phone with Face ID /
               passcode (no parent needed; 13+ is the app's age) */
            try await auth.requestAuthorization(for: .individual)
        } catch {
            /* cancelled, or Screen Time is off / restricted */
            track("screentime", "ios said no: \(error.localizedDescription)")
        }
        return authorization
    }

    // MARK: picking apps

    let usesSystemPicker = true
    let drawsShieldInApp = false

    var pickedAppKeys: [String]? { RiloTokens.keys() }

    /// AppPickerView hands the new selection here. New picks are shielded
    /// on the next `apply` (AppState re-syncs after the save).
    var selection: FamilyActivitySelection {
        get { RiloTokens.selection }
        set {
            RiloTokens.selection = newValue
            shieldNow()
        }
    }

    // MARK: rules

    func apply(_ rules: ScreenTimeRules) {
        RiloShared.rules = SharedRules(
            dateKey: rules.dateKey,
            apps: rules.apps.mapValues { a in
                SharedApp(mode: a.mode.rawValue, shielded: a.shielded, opensLeft: a.opensLeft,
                          minutesPerOpen: a.minutesPerOpen, lockKind: a.lockKind)
            },
            strict: rules.strict, scheduleKind: rules.scheduleKind, scheduleUntil: rules.scheduleUntil)
        shieldNow()
        updateWidget(rules)
    }

    private func shieldNow() {
        RiloTokens.applyShields(rules: RiloShared.rules, session: liveSession, store: store)
    }

    /// the saved session, unless its window has long passed (the monitor
    /// normally clears it; this is the backstop if it never ran)
    private var liveSession: SharedSession? {
        guard let s = RiloShared.session else { return nil }
        let window = RiloShared.windowMinutes(for: s.minutes)
        if RiloShared.nowMs - s.startedAt > window * 60_000 { RiloShared.session = nil; return nil }
        return s
    }

    // MARK: sessions

    func startSession(_ session: ScreenTimeSession) {
        let shared = SharedSession(app: session.app, kind: session.kind, minutes: session.minutes,
                                   startedAt: session.startedAt)
        RiloShared.session = shared
        shieldNow()
        activity.stopMonitoring([.riloSession])
        if session.kind == "always" { return }

        let sel = RiloTokens.selection
        let apps: Set<ApplicationToken> = RiloTokens.appToken(session.app, in: sel).map { [$0] } ?? []
        let cats: Set<ActivityCategoryToken> = RiloTokens.categoryToken(session.app, in: sel).map { [$0] } ?? []
        guard !apps.isEmpty || !cats.isEmpty else { return }

        func usage(_ minutes: Double) -> DateComponents {
            let secs = max(60, Int((minutes * 60).rounded()))
            return DateComponents(minute: secs / 60, second: secs % 60)
        }
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
            .riloTimeUp: DeviceActivityEvent(applications: apps, categories: cats, webDomains: [],
                                            threshold: usage(session.minutes)),
        ]
        /* strict mode has no halves, so no half-way marker */
        if !RiloShared.rules.strict && session.kind == "open" {
            events[.riloHalf] = DeviceActivityEvent(applications: apps, categories: cats, webDomains: [],
                                                    threshold: usage(session.minutes / 2))
        }

        let cal = Calendar.current
        let start = Date()
        let end = start.addingTimeInterval(RiloShared.windowMinutes(for: session.minutes) * 60)
        let parts: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
        let schedule = DeviceActivitySchedule(intervalStart: cal.dateComponents(parts, from: start),
                                              intervalEnd: cal.dateComponents(parts, from: end),
                                              repeats: false)
        do {
            try activity.startMonitoring(.riloSession, during: schedule, events: events)
        } catch {
            /* can't watch it: shield it again straight away rather than leave it open */
            track("screentime", "session monitor failed: \(error.localizedDescription)")
            RiloShared.session = nil
            shieldNow()
        }
    }

    func endSession(app: String, minutesUsed: Double) {
        if RiloShared.session?.app == app { RiloShared.session = nil }
        activity.stopMonitoring([.riloSession])
        shieldNow()
    }

    // MARK: the day

    /// midnight to midnight, repeating: the monitor's intervalDidStart is
    /// the daily reset even when Rilo isn't running
    private func startDailySchedule() {
        guard !activity.activities.contains(.riloDaily) else { return }
        let schedule = DeviceActivitySchedule(intervalStart: DateComponents(hour: 0, minute: 0),
                                              intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
                                              repeats: true)
        do { try activity.startMonitoring(.riloDaily, during: schedule) }
        catch { track("screentime", "daily schedule failed: \(error.localizedDescription)") }
    }

    func dayRolledOver(to dateKey: String) {
        RiloShared.session = nil
        activity.stopMonitoring([.riloSession])
        var rules = RiloShared.rules
        rules.dateKey = dateKey
        RiloShared.rules = rules
        startDailySchedule()
        shieldNow()
    }

    // MARK: events from the extensions

    func takeEvents() -> [ScreenTimeEvent] {
        RiloShared.takeEvents().compactMap { e in
            switch e.kind {
            case "shieldTapped": return .shieldTapped(app: e.app)
            case "sessionEnded": return .sessionEnded(app: e.app, minutes: e.minutes)
            default: return nil
            }
        }
    }

    // MARK: the widget

    private func updateWidget(_ rules: ScreenTimeRules) {
        let limited = rules.apps.values.filter { $0.mode == .limited }
        let snap = WidgetSnapshot(dateKey: rules.dateKey, mood: rules.mood, note: rules.note, skin: rules.skin,
                                  opensLeft: limited.reduce(0) { $0 + $1.opensLeft }, limitedApps: limited.count,
                                  updatedAt: RiloShared.nowMs)
        var same = lastWidget
        same?.updatedAt = snap.updatedAt
        if same == snap { return }
        lastWidget = snap
        RiloShared.widget = snap
        WidgetCenter.shared.reloadAllTimelines()
    }
}
#endif

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
        /* a fresh install's launch-time schedule failed (no permission yet):
           start the midnight reset now that it's allowed */
        if authorization == .approved { startDailySchedule() }
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
                          minutesPerOpen: a.minutesPerOpen, lockKind: a.lockKind, automated: a.automated,
                          opensPerDay: a.opensPerDay)
            },
            strict: rules.strict, scheduleKind: rules.scheduleKind, scheduleUntil: rules.scheduleUntil)
        shieldNow()
        updateWidget(rules)
        /* the Shortcuts apps changed: re-register the daily schedule with
           their safety-net events */
        let now = rules.apps.filter { $0.value.automated }.map(\.key).sorted()
        if now != guarded {
            guarded = now
            startDailySchedule(force: true)
        }
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
        if session.kind == "always" { activity.stopMonitoring([.riloSession]); return }
        do {
            try RiloTokens.startSessionMonitoring(shared, center: activity)
            /* Rilo is on screen, so iOS lets it start the Live Activity */
            RiloLiveActivity.start(shared, from: "app")
        } catch {
            /* can't watch it: shield it again straight away rather than leave it open */
            track("screentime", "session monitor failed: \(error.localizedDescription)")
            RiloShared.session = nil
            shieldNow()
        }
    }

    func endSession(app: String, minutesUsed: Double) {
        if RiloShared.session?.app == app {
            RiloShared.session = nil
            /* the monitor's safety net reads this: a Rilo session ran today */
            if minutesUsed > 0 { RiloShared.addUsage(app: app, minutes: minutesUsed) }
        }
        activity.stopMonitoring([.riloSession])
        RiloLiveActivity.endAll()
        shieldNow()
    }

    // MARK: the day

    /// midnight to midnight, repeating: the monitor's intervalDidStart is
    /// the daily reset even when Rilo isn't running
    private func startDailySchedule(force: Bool = false) {
        guard force || !activity.activities.contains(.riloDaily) else { return }
        let schedule = DeviceActivitySchedule(intervalStart: DateComponents(hour: 0, minute: 0),
                                              intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
                                              repeats: true)
        /* the Shortcuts safety net: 2 minutes of an automated app in a day
           (the monitor checks whether Rilo had a session behind it) */
        let sel = RiloTokens.selection
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for key in guarded {
            let apps: Set<ApplicationToken> = RiloTokens.appToken(key, in: sel).map { [$0] } ?? []
            let cats: Set<ActivityCategoryToken> = RiloTokens.categoryToken(key, in: sel).map { [$0] } ?? []
            if apps.isEmpty && cats.isEmpty { continue }
            events[.riloGuard(key)] = DeviceActivityEvent(applications: apps, categories: cats, webDomains: [],
                                                          threshold: DateComponents(minute: 2))
        }
        do { try activity.startMonitoring(.riloDaily, during: schedule, events: events) }
        catch { track("screentime", "daily schedule failed: \(error.localizedDescription)") }
    }

    /// the apps whose check-in is the Shortcuts automation right now
    private var guarded: [String] = []

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
            case "shieldNeverMind": return .shieldNeverMind(app: e.app)
            case "automationMissing": return .automationMissing(app: e.app)
            case "shieldUnlocked": return .shieldUnlocked(app: e.app, minutes: e.minutes, at: e.at)
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

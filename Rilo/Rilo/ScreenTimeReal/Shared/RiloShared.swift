import Foundation

/// What the app, the Screen Time extensions and the widget share through the
/// App Group. Foundation only, so the widget can use it too.
///
/// Writers:
///   app        rules, session, widget snapshot (FamilyControlsScreenTimeService)
///   ShieldAction       a shieldTapped event
///   DeviceActivityMonitor  sessionEnded events, clears the session, writes usage
/// Readers:
///   ShieldConfiguration    rules (what the shield says)
///   DeviceActivityMonitor  rules + session (what to shield again)
///   widget                 the widget snapshot
///   app                    events (FamilyControlsScreenTimeService.takeEvents)

/// One app's rule (ScreenTimeRules.App, without AppMode so the extensions
/// don't need the app's models).
nonisolated struct SharedApp: Codable, Equatable, Sendable {
    /// 'always' | 'blocked' | 'limited' | 'free'
    var mode: String
    var shielded: Bool
    var opensLeft: Double
    var minutesPerOpen: Int
    /// 'blocked' | 'noopens' | 'halfstranded' | 'bedtime' | 'school' | 'focus' | nil
    var lockKind: String?
}

nonisolated struct SharedRules: Codable, Equatable, Sendable {
    var dateKey: String
    /// keyed by appKey (RiloTokens)
    var apps: [String: SharedApp]
    var strict: Bool
    var scheduleKind: String?
    var scheduleUntil: String?

    static let empty = SharedRules(dateKey: "", apps: [:], strict: false, scheduleKind: nil, scheduleUntil: nil)
}

/// The one session running right now (its app is unshielded until it ends).
nonisolated struct SharedSession: Codable, Equatable, Sendable {
    var app: String
    /// 'open' | 'pass' | 'free' | 'always'
    var kind: String
    var minutes: Double
    /// ms since 1970
    var startedAt: Double
    /// set by the monitor when half the session's minutes have been used
    var halfReached: Bool = false
}

nonisolated struct SharedEvent: Codable, Equatable, Sendable {
    /// 'shieldTapped' | 'sessionEnded'
    var kind: String
    var app: String
    var minutes: Double = 0
    /// ms since 1970
    var at: Double
}

/// What the home-screen widget shows.
nonisolated struct WidgetSnapshot: Codable, Equatable, Sendable {
    var dateKey: String
    /// proud | curious | letdown | angry | sleepy | coach (Addons.moodForUsage)
    var mood: String
    /// Addons.moodNote, e.g. "under your goal. keep it there."
    var note: String
    /// chosenRilo, for the image name rilo-<skin>-<mood>
    var skin: String
    /// opens left today across the Limited apps
    var opensLeft: Double
    var limitedApps: Int
    var updatedAt: Double

    static let placeholder = WidgetSnapshot(dateKey: "", mood: "proud", note: "under your goal. keep it there.",
                                            skin: "original", opensLeft: 3, limitedApps: 1, updatedAt: 0)
}

nonisolated enum RiloShared {
    private static let RULES = "rilo.rules"
    private static let SESSION = "rilo.session"
    private static let EVENTS = "rilo.events"
    private static let WIDGET = "rilo.widget"
    private static let USAGE = "rilo.usage"

    /// a shield tap older than this is stale (they never tapped the notification)
    static let SHIELD_TAP_FRESH_MS: Double = 10 * 60 * 1000

    static var nowMs: Double { Date().timeIntervalSince1970 * 1000 }

    /// DeviceActivity windows must be at least 15 minutes long, so a
    /// session's window is the open's length + the 2-minute carry-on
    /// (Limits.CONTINUE_MS), never under 15.
    static func windowMinutes(for minutes: Double) -> Double { max(15, minutes + 2) }

    /// the same YYYY-MM-DD key the app uses (JS.isoDay: UTC, like the web)
    static func todayKey(_ date: Date = Date()) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(identifier: "UTC")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    // MARK: plumbing

    private static func read<T: Decodable>(_ key: String, as: T.Type) -> T? {
        guard let data = AppGroup.defaults.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    private static func write<T: Encodable>(_ key: String, _ value: T?) {
        guard let value, let data = try? JSONEncoder().encode(value) else {
            AppGroup.defaults.removeObject(forKey: key)
            return
        }
        AppGroup.defaults.set(data, forKey: key)
    }

    // MARK: rules + session

    static var rules: SharedRules {
        get { read(RULES, as: SharedRules.self) ?? .empty }
        set { write(RULES, newValue) }
    }

    static var session: SharedSession? {
        get { read(SESSION, as: SharedSession.self) }
        set { write(SESSION, newValue) }
    }

    // MARK: events (extension → app), each handed out once

    static func post(_ event: SharedEvent) {
        var list = read(EVENTS, as: [SharedEvent].self) ?? []
        list.append(event)
        write(EVENTS, Array(list.suffix(50)))
    }

    static func takeEvents() -> [SharedEvent] {
        let list = read(EVENTS, as: [SharedEvent].self) ?? []
        write(EVENTS, [SharedEvent]?.none)
        let now = nowMs
        return list.filter { $0.kind != "shieldTapped" || now - $0.at <= SHIELD_TAP_FRESH_MS }
    }

    // MARK: usage the monitor saw (minutes per appKey, today)

    static func addUsage(app: String, minutes: Double) {
        let today = todayKey()
        var usage = read(USAGE, as: [String: [String: Double]].self) ?? [:]
        usage = usage.filter { $0.key == today }
        usage[today, default: [:]][app, default: 0] += minutes
        write(USAGE, usage)
    }

    static func usageToday() -> [String: Double] {
        (read(USAGE, as: [String: [String: Double]].self) ?? [:])[todayKey()] ?? [:]
    }

    // MARK: the widget

    static var widget: WidgetSnapshot? {
        get { read(WIDGET, as: WidgetSnapshot.self) }
        set { write(WIDGET, newValue) }
    }
}

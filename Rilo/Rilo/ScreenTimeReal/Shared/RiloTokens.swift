import Foundation
import CryptoKit
import FamilyControls
import ManagedSettings
import DeviceActivity

/// The bridge between Apple's opaque tokens and the String app keys Rilo's
/// models use. Shared by the app and the three Screen Time extensions (not
/// the widget, which never sees a token).
///
/// Apple never tells the app which app a token is (no name, no bundle id).
/// So each picked token gets a stable key, "app-1a2b3c4d" (a hash of the
/// token's own encoding, the same every launch). The models store limits,
/// opens and usage under that key, and the UI shows the real name and icon
/// with `Label(token)` (see AppPickerView.swift, `RiloAppLabel`).
nonisolated enum RiloTokens {
    private static let SELECTION = "rilo.selection"

    // MARK: the picked selection (FamilyActivitySelection is Codable)

    static var selection: FamilyActivitySelection {
        get {
            guard let data = AppGroup.defaults.data(forKey: SELECTION),
                  let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) else {
                return FamilyActivitySelection()
            }
            return sel
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) { AppGroup.defaults.set(data, forKey: SELECTION) }
        }
    }

    // MARK: keys

    private static func hashKey<T: Encodable>(_ prefix: String, _ token: T) -> String {
        let data = (try? JSONEncoder().encode(token)) ?? Data()
        let hex = SHA256.hash(data: data).prefix(4).map { String(format: "%02x", $0) }.joined()
        return "\(prefix)-\(hex)"
    }

    /// true for a key made by `key(for:)`: "app-" or "cat-" + 8 lowercase hex
    static func looksLikeTokenKey(_ s: String) -> Bool {
        guard s.count == 12 else { return false }
        let parts = s.split(separator: "-", maxSplits: 1)
        return parts.count == 2 && (parts[0] == "app" || parts[0] == "cat")
            && parts[1].allSatisfy { $0.isHexDigit && !$0.isUppercase }
    }

    static func key(for token: ApplicationToken) -> String { hashKey("app", token) }
    static func key(for token: ActivityCategoryToken) -> String { hashKey("cat", token) }

    /// the picked apps (then categories), in a stable order
    static func keys(_ sel: FamilyActivitySelection = selection) -> [String] {
        sel.applicationTokens.map { key(for: $0) }.sorted() + sel.categoryTokens.map { key(for: $0) }.sorted()
    }

    static func appToken(_ key: String, in sel: FamilyActivitySelection = selection) -> ApplicationToken? {
        sel.applicationTokens.first { Self.key(for: $0) == key }
    }

    static func categoryToken(_ key: String, in sel: FamilyActivitySelection = selection) -> ActivityCategoryToken? {
        sel.categoryTokens.first { Self.key(for: $0) == key }
    }

    // MARK: shields — the one function the app AND the monitor use

    /// Put the shields up to match `rules`, leaving the running session's
    /// app open (unless it has ended). Always-allowed apps are never in the
    /// selection's shield set.
    static func applyShields(rules: SharedRules, session: SharedSession?, store: ManagedSettingsStore) {
        let sel = selection
        let open = session.flatMap { s in s.kind == "always" ? nil : s.app }
        let kicked = RiloShared.kicked
        /* shielded by its rule, or its session time just ran out */
        func up(_ rule: SharedApp, _ k: String) -> Bool { rule.shielded || (kicked.contains(k) && rule.mode != "always") }

        var apps = Set<ApplicationToken>()
        for token in sel.applicationTokens {
            let k = key(for: token)
            guard let rule = rules.apps[k], up(rule, k), k != open else { continue }
            apps.insert(token)
        }
        var cats = Set<ActivityCategoryToken>()
        for token in sel.categoryTokens {
            let k = key(for: token)
            guard let rule = rules.apps[k], up(rule, k), k != open else { continue }
            cats.insert(token)
        }
        /* an app picked on its own and open right now stays open even if
           its category is shielded */
        let except: Set<ApplicationToken> = open.flatMap { appToken($0, in: sel) }.map { [$0] } ?? []

        store.shield.applications = apps.isEmpty ? nil : apps
        store.shield.applicationCategories = cats.isEmpty ? nil : .specific(cats, except: except)
        store.shield.webDomainCategories = cats.isEmpty ? nil : .specific(cats)
        /* strict: no deleting an app to get around Rilo, no shortcuts */
        store.application.denyAppRemoval = rules.strict ? true : nil
    }
}

// MARK: - sessions (the app AND the shield's button start them)

extension RiloTokens {
    /// Watch one session with iOS's own timer: thresholds at half its
    /// minutes (opens are charged in halves) and all of them (time's up →
    /// DeviceActivityMonitorExtension shields it again), inside a window a
    /// little longer than the session (leaving early closes the window).
    nonisolated static func startSessionMonitoring(_ s: SharedSession, center: DeviceActivityCenter = DeviceActivityCenter()) throws {
        center.stopMonitoring([.riloSession])
        if s.kind == "always" { return }
        let sel = selection
        let apps: Set<ApplicationToken> = appToken(s.app, in: sel).map { [$0] } ?? []
        let cats: Set<ActivityCategoryToken> = categoryToken(s.app, in: sel).map { [$0] } ?? []
        guard !apps.isEmpty || !cats.isEmpty else { return }

        func usage(_ minutes: Double) -> DateComponents {
            let secs = max(60, Int((minutes * 60).rounded()))
            return DateComponents(minute: secs / 60, second: secs % 60)
        }
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [
            .riloTimeUp: DeviceActivityEvent(applications: apps, categories: cats, webDomains: [],
                                            threshold: usage(s.minutes)),
        ]
        /* strict mode has no halves, so no half-way marker */
        if !RiloShared.rules.strict && s.kind == "open" {
            events[.riloHalf] = DeviceActivityEvent(applications: apps, categories: cats, webDomains: [],
                                                    threshold: usage(s.minutes / 2))
        }
        let cal = Calendar.current
        let start = Date(timeIntervalSince1970: s.startedAt / 1000)
        let end = start.addingTimeInterval(RiloShared.windowMinutes(for: s.minutes) * 60)
        let parts: Set<Calendar.Component> = [.year, .month, .day, .hour, .minute, .second]
        let schedule = DeviceActivitySchedule(intervalStart: cal.dateComponents(parts, from: start),
                                              intervalEnd: cal.dateComponents(parts, from: end),
                                              repeats: false)
        try center.startMonitoring(.riloSession, during: schedule, events: events)
    }

    /// The shield's "open instagram" after the wait: lift the shield on this
    /// one app for one open (or half, if that's all that's left), start
    /// iOS's timer, count the open, and tell Rilo. nil = can't (no opens, or
    /// iOS wouldn't start the timer, in which case the shield stays up).
    nonisolated static func unlockFromShield(_ key: String, store: ManagedSettingsStore) -> SharedSession? {
        var rules = RiloShared.rules
        guard var rule = rules.apps[key], rule.opensLeft > 0 else { return nil }
        let now = RiloShared.nowMs
        /* another app's session was running: it ends here, charged so far */
        if let old = RiloShared.session, old.app != key {
            let used = min(old.minutes, max(0, (now - old.startedAt) / 60_000))
            RiloShared.addUsage(app: old.app, minutes: used)
            RiloShared.post(SharedEvent(kind: "sessionEnded", app: old.app, minutes: used, at: now))
        }
        let half = rule.opensLeft < 1
        let minutes = Double(rule.minutesPerOpen) * (half ? 0.5 : 1)
        let s = SharedSession(app: key, kind: "open", minutes: minutes, startedAt: now, fromShield: true)
        do {
            try startSessionMonitoring(s)
        } catch {
            return nil
        }
        /* the shield's copy of the count, until Rilo opens and redoes it */
        rule.opensLeft = max(0, rule.opensLeft - (half ? 0.5 : 1))
        rules.apps[key] = rule
        RiloShared.rules = rules
        RiloShared.session = s
        RiloShared.kicked.remove(key)
        applyShields(rules: rules, session: s, store: store)
        RiloShared.post(SharedEvent(kind: "shieldUnlocked", app: key, minutes: minutes, at: now))
        return s
    }
}

extension ManagedSettingsStore.Name {
    /// Rilo's own store (so nothing else's settings get cleared)
    nonisolated static var rilo: Self { Self("rilo") }
}

extension DeviceActivityName {
    /// midnight to midnight, every day: the daily reset
    nonisolated static var riloDaily: Self { Self("rilo.daily") }
    /// the one session running now: its window, with its time thresholds
    nonisolated static var riloSession: Self { Self("rilo.session") }
}

extension DeviceActivityEvent.Name {
    /// half the session's minutes used (opens are charged in halves)
    nonisolated static var riloHalf: Self { Self("rilo.half") }
    /// all of the session's minutes used: shield again
    nonisolated static var riloTimeUp: Self { Self("rilo.timeup") }
    /// the Shortcuts safety net for one app (RiloTokens.guardedKey)
    nonisolated static func riloGuard(_ key: String) -> Self { Self("rilo.guard.\(key)") }
}

extension RiloTokens {
    /// the app key behind a safety-net event, if it is one
    nonisolated static func guardedKey(_ event: DeviceActivityEvent.Name) -> String? {
        let raw = event.rawValue
        return raw.hasPrefix("rilo.guard.") ? String(raw.dropFirst("rilo.guard.".count)) : nil
    }
}

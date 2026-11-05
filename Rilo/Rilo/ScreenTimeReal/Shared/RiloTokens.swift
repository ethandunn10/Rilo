#if RILO_FAMILY_CONTROLS
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

        var apps = Set<ApplicationToken>()
        for token in sel.applicationTokens {
            let k = key(for: token)
            guard let rule = rules.apps[k], rule.shielded, k != open else { continue }
            apps.insert(token)
        }
        var cats = Set<ActivityCategoryToken>()
        for token in sel.categoryTokens {
            let k = key(for: token)
            guard let rule = rules.apps[k], rule.shielded, k != open else { continue }
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
}
#endif

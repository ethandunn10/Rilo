import Foundation

/// Which real app each picked Screen Time token is, as the USER told Rilo
/// ("which app is this?" in onboarding). Apple never gives Rilo an app's
/// name: the picker hands out sealed tokens. The only names Rilo knows are
/// the ones the person picked from this list (or typed under "other").
/// They're saved in the App Group on the phone and never leave it.
///
/// Used for: the Shortcuts check-in (its app parameter → the token to
/// unlock), the URL to send them back into the app, and the name Rilo's
/// own screens show instead of "this app".
nonisolated struct KnownApp: Equatable, Sendable, Identifiable {
    var id: String
    var name: String
    /// URL schemes to try, in order, to open the app. Empty → none known.
    var schemes: [String]
}

nonisolated enum AppMatch {
    /// the one-tap list in the matching step, most common first
    static let KNOWN: [KnownApp] = [
        KnownApp(id: "instagram", name: "instagram", schemes: ["instagram://"]),
        KnownApp(id: "tiktok", name: "tiktok", schemes: ["snssdk1233://", "tiktok://"]),
        KnownApp(id: "youtube", name: "youtube", schemes: ["youtube://"]),
        KnownApp(id: "snapchat", name: "snapchat", schemes: ["snapchat://"]),
        KnownApp(id: "x", name: "x", schemes: ["twitter://", "x://"]),
        KnownApp(id: "reddit", name: "reddit", schemes: ["reddit://"]),
        KnownApp(id: "facebook", name: "facebook", schemes: ["fb://"]),
        KnownApp(id: "threads", name: "threads", schemes: ["barcelona://"]),
        KnownApp(id: "pinterest", name: "pinterest", schemes: ["pinterest://"]),
        KnownApp(id: "discord", name: "discord", schemes: ["discord://"]),
        KnownApp(id: "twitch", name: "twitch", schemes: ["twitch://"]),
        KnownApp(id: "netflix", name: "netflix", schemes: ["nflx://"]),
        KnownApp(id: "whatsapp", name: "whatsapp", schemes: ["whatsapp://"]),
        KnownApp(id: "roblox", name: "roblox", schemes: ["roblox://"]),
        KnownApp(id: "spotify", name: "spotify", schemes: ["spotify://"]),
    ]

    static func known(_ id: String?) -> KnownApp? {
        guard let id else { return nil }
        return KNOWN.first { $0.id == id }
    }

    private static let KEY = "rilo.appMatches"
    nonisolated(unsafe) private static var cache: [String: String]? = nil

    /// token key → known app id ("instagram") or a typed name ("duolingo")
    static var all: [String: String] {
        get {
            if let cache { return cache }
            let read = (AppGroup.defaults.dictionary(forKey: KEY) as? [String: String]) ?? [:]
            cache = read
            return read
        }
        set {
            cache = newValue
            AppGroup.defaults.set(newValue, forKey: KEY)
        }
    }

    /// what the user said this token is (nil → not matched yet)
    static func name(for key: String) -> String? {
        /* demo Screen Time keys ARE the names */
        if known(key) != nil { return key }
        return all[key]
    }

    static func set(_ name: String?, for key: String) {
        var m = all
        let clean = name?.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if let clean, !clean.isEmpty { m[key] = clean } else { m.removeValue(forKey: key) }
        all = m
    }

    /// the token key the user matched to `name` (the check-in's parameter)
    static func key(for name: String, among keys: [String]) -> String? {
        let n = name.lowercased()
        return keys.first { Self.name(for: $0) == n } ?? keys.first { $0 == n }
    }

    /// candidate URLs to open the app, in order (none for typed names
    /// Rilo doesn't know, or apps with no URL scheme)
    static func urls(for name: String?) -> [URL] {
        (known(name)?.schemes ?? []).compactMap(URL.init(string:))
    }
}

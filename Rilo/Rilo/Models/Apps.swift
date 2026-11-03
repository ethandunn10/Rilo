import SwiftUI

/// Port of app/src/lib/apps.js — the app catalog for PickApps and the
/// add-app sheet. Logos are Simple Icons path data (Models/AppIcons.swift),
/// drawn with SVGPath in a 24x24 box in the brand colour. Six apps have no
/// Simple Icon any more and the four always-allowed ones are Apple's own,
/// so those get letter tiles in the colour below.

nonisolated struct AppLogoData: Equatable, Sendable {
    let path: String
    let hex: String
}

nonisolated struct CatalogApp: Equatable, Sendable {
    let label: String
    let logo: AppLogoData?
    let hex: String
}

nonisolated enum Apps {
    private static func entry(_ label: String, hex: String? = nil) -> CatalogApp {
        let logo = AppIcons.logos[label]
        return CatalogApp(label: label, logo: hex == nil ? logo : nil, hex: hex ?? logo?.hex ?? FALLBACK_HEX)
    }

    /// label is what the app is called in the UI (lowercase, like the designs)
    static let APP_CATALOG: [CatalogApp] = [
        entry("phone", hex: "#34C759"),
        entry("messages", hex: "#30B94D"),
        entry("maps", hex: "#1A73E8"),
        entry("camera", hex: "#636366"),
        entry("tiktok"), entry("instagram"), entry("youtube"), entry("snapchat"), entry("x"),
        entry("reddit"), entry("discord"), entry("netflix"), entry("twitch"), entry("pinterest"),
        entry("facebook"), entry("threads"), entry("bereal"), entry("spotify"), entry("roblox"),
        entry("fortnite"),
        entry("minecraft", hex: "#52A535"),
        entry("clash royale", hex: "#1C8ADB"),
        entry("whatsapp"), entry("telegram"),
        entry("hulu", hex: "#1CE783"),
        entry("disney+", hex: "#113CCF"),
        entry("amazon", hex: "#FF9900"),
        entry("prime video", hex: "#00A8E1"),
        entry("tumblr"),
    ]

    /// the 5 rows PickApps starts with
    static let STARTING_APPS = ["tiktok", "instagram", "youtube", "snapchat", "x"]

    /// tracked without being picked, never count against the free app cap
    static let SYSTEM_APPS = ["phone", "messages", "maps", "camera"]

    static let FALLBACK_HEX = "#2E8B3E"

    static func appInfo(_ label: String) -> CatalogApp {
        if let found = APP_CATALOG.first(where: { $0.label == label }) {
            return CatalogApp(label: label, logo: found.logo, hex: found.logo?.hex ?? found.hex)
        }
        return CatalogApp(label: label, logo: nil, hex: FALLBACK_HEX)
    }

    static func searchApps(_ query: String) -> [CatalogApp] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if q.isEmpty { return APP_CATALOG }
        return APP_CATALOG.filter { $0.label.contains(q) }
    }

    // MARK: colour helpers

    private static func rgb(_ hex: String) -> [Int] {
        let h = hex.replacingOccurrences(of: "#", with: "")
        let chars = Array(h)
        func part(_ i: Int) -> Int {
            guard chars.count >= i + 2 else { return 0 }
            return Int(String(chars[i..<(i + 2)]), radix: 16) ?? 0
        }
        return [part(0), part(2), part(4)]
    }

    private static func luminance(_ hex: String) -> Double {
        let c = rgb(hex).map { v -> Double in
            let c = Double(v) / 255
            return c <= 0.03928 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4)
        }
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }

    private static func hexOf(_ r: Int, _ g: Int, _ b: Int) -> String {
        "#" + [r, g, b].map { String(format: "%02x", $0) }.joined()
    }

    /// brand colour, darkened only if it would wash out on a near-white tile
    static func glyphColor(_ hex: String) -> String {
        var c = rgb(hex)
        var lum = luminance(hex)
        var guardN = 0
        while lum > 0.3 && guardN < 24 {
            c = c.map { JS.roundInt(Double($0) * 0.88) }
            lum = luminance(hexOf(c[0], c[1], c[2]))
            guardN += 1
        }
        return hexOf(c[0], c[1], c[2])
    }

    /// the tile behind a logo: the brand colour at low alpha
    static func tileColor(_ hex: String, alpha: Double = 0.12) -> Color {
        let c = rgb(hex)
        return Color(.sRGB, red: Double(c[0]) / 255, green: Double(c[1]) / 255, blue: Double(c[2]) / 255, opacity: alpha)
    }

    // MARK: which apps the tester actually picked

    /// Row order matches PickApps: the starting five, then anything added.
    static func pickedApps(_ apps: PickedApps) -> [String] {
        (STARTING_APPS + apps.extra)
            .filter { apps.on[$0] == true }
            .filter { !SYSTEM_APPS.contains($0) }
    }

    /// Every app with a setting: picked + the always-allowed four + any
    /// they've marked always allowed themselves.
    static func trackedApps(_ apps: PickedApps, _ appSettings: [String: AppSetting] = [:]) -> [String] {
        let picked = pickedApps(apps)
        let always = appSettings.keys.sorted().filter { !picked.contains($0) && appSettings[$0]?.mode == .always }
        let system = SYSTEM_APPS.filter { !always.contains($0) }
        return picked + system + always
    }

    /// 1st, 2nd, 3rd, 4th ... for "4th time today"
    static func ordinal(_ n: Int) -> String {
        let mod100 = n % 100
        if mod100 >= 11 && mod100 <= 13 { return "\(n)th" }
        switch n % 10 {
        case 1: return "\(n)st"
        case 2: return "\(n)nd"
        case 3: return "\(n)rd"
        default: return "\(n)th"
        }
    }
}

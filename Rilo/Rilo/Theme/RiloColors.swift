import SwiftUI

/// Colors from app/src/index.css (:root) plus the ones screens use inline.
extension Color {
    nonisolated init(hex: String, opacity: Double = 1) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s.removeFirst() }
        if s.count == 3 { s = s.map { "\($0)\($0)" }.joined() }
        let v = UInt64(s, radix: 16) ?? 0
        self.init(
            .sRGB,
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255,
            opacity: opacity
        )
    }

    /// rgba(r,g,b,a) from the web styles
    nonisolated static func rgba(_ r: Double, _ g: Double, _ b: Double, _ a: Double) -> Color {
        Color(.sRGB, red: r / 255, green: g / 255, blue: b / 255, opacity: a)
    }
}

nonisolated enum RC {
    // ink + text
    static let ink = Color(hex: "#12301A")
    static let ink2 = Color(hex: "#2C4A36")
    static let ink3 = Color(hex: "#3D5A46")
    // greens
    static let greenPale = Color(hex: "#9EDCA6")
    static let green = Color(hex: "#4CC160")
    static let greenDeep = Color(hex: "#2E8B3E")
    // sky
    static let skyTop = Color(hex: "#7CC6EE")
    static let skyBottom = Color(hex: "#EEF8EE")
    // sticker cards
    static let card = Color(hex: "#FFFBF1")
    static let line = Color(hex: "#12301A")

    // used across many screens
    static let art = Color(hex: "#1B1F1A")      // Rilo's own outline
    static let tabIdle = Color(hex: "#4F6B58")
    static let mint = Color(hex: "#BFE8B8")      // active tab pill, Rilo tile
    static let welcomeGreen = Color(hex: "#1F5C2B")
    static let body = Color(hex: "#234030")
    static let stage = Color(hex: "#EEF8EE")
}

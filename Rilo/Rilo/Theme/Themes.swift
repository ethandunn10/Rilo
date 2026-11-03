import SwiftUI

/// Port of app/src/lib/themes.js. Grass is free, the rest are Rilo Pro.
/// A theme only changes Rilo's world: the sky, what's in it, and the hills.
struct ThemeInfo: Identifiable, Equatable {
    let id: String
    let name: String
    let tier: String
    let blurb: String
    /// linear-gradient(180deg, ...) stops: (hex, location 0...1)
    let sky: [(String, Double)]
    let hills: [Color]
    let swatch: [Color]

    var skyGradient: LinearGradient {
        LinearGradient(
            stops: sky.map { .init(color: Color(hex: $0.0), location: $0.1) },
            startPoint: .top, endPoint: .bottom
        )
    }

    static func == (a: ThemeInfo, b: ThemeInfo) -> Bool { a.id == b.id }
}

enum Themes {
    static let all: [ThemeInfo] = [
        ThemeInfo(
            id: "grass", name: "grass", tier: "free",
            blurb: "sunny meadow, wildflowers, butterflies",
            sky: [("#A6DDF0", 0), ("#CDEDF0", 0.30), ("#EAF6E6", 0.58), ("#EEF8E6", 1)],
            hills: [Color(hex: "#A8DCA0"), Color(hex: "#4CC160"), Color(hex: "#2E8B3E")],
            swatch: [Color(hex: "#A6DDF0"), Color(hex: "#4CC160")]
        ),
        ThemeInfo(
            id: "bamboo", name: "bamboo", tier: "pro",
            blurb: "golden morning, swaying bamboo, falling leaves",
            sky: [("#FFD7A3", 0), ("#FFE8C4", 0.26), ("#F8F1D9", 0.54), ("#EAF5E2", 1)],
            hills: [Color(hex: "#A8DCA0"), Color(hex: "#4CC160"), Color(hex: "#2E8B3E")],
            swatch: [Color(hex: "#FFD7A3"), Color(hex: "#8CCB78")]
        ),
        ThemeInfo(
            id: "sakura", name: "sakura", tier: "pro",
            blurb: "cherry blossoms and drifting petals",
            sky: [("#FFD3E0", 0), ("#FFE6EE", 0.30), ("#FFF4F2", 0.58), ("#F1F7EA", 1)],
            hills: [Color(hex: "#BFE3B0"), Color(hex: "#7DCB7A"), Color(hex: "#4E9E5A")],
            swatch: [Color(hex: "#FFC2D6"), Color(hex: "#7DCB7A")]
        ),
        ThemeInfo(
            id: "sunset", name: "sunset", tier: "pro",
            blurb: "big low sun, warm sky, birds heading home",
            sky: [("#FFB08A", 0), ("#FFCBA4", 0.28), ("#FFE3C8", 0.52), ("#F3E9DA", 1)],
            hills: [Color(hex: "#B9C98E"), Color(hex: "#6FA35E"), Color(hex: "#3F7A4A")],
            swatch: [Color(hex: "#FF9E7A"), Color(hex: "#6FA35E")]
        ),
        ThemeInfo(
            id: "snow", name: "snow", tier: "pro",
            blurb: "snowy hills and falling snow",
            sky: [("#C9E6FA", 0), ("#E0F0FB", 0.34), ("#F2F8FC", 0.62), ("#F6FAFD", 1)],
            hills: [Color(hex: "#EEF5FA"), Color(hex: "#8EADC4"), Color(hex: "#62849E")],
            swatch: [Color(hex: "#C9E6FA"), Color(hex: "#E3EEF6")]
        ),
    ]

    static let defaultId = "grass"

    static func info(_ id: String) -> ThemeInfo {
        all.first { $0.id == id } ?? all[0]
    }

    /// the night sky used by "just tired" in every theme
    static let duskSky = LinearGradient(
        stops: [
            .init(color: Color(hex: "#2B3A6B"), location: 0),
            .init(color: Color(hex: "#5B6FA6"), location: 0.42),
            .init(color: Color(hex: "#A9A9CF"), location: 0.72),
            .init(color: Color(hex: "#D9D2E6"), location: 1),
        ],
        startPoint: .top, endPoint: .bottom
    )
}

private struct ThemeKey: EnvironmentKey {
    static let defaultValue: ThemeInfo = Themes.all[0]
}

extension EnvironmentValues {
    var riloTheme: ThemeInfo {
        get { self[ThemeKey.self] }
        set { self[ThemeKey.self] = newValue }
    }
}

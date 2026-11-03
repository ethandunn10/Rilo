import SwiftUI
import CoreText

/// The web demo loads Fredoka, Inter and Nunito from Google Fonts. The same
/// faces are bundled in Fonts/ as static weights and registered at launch,
/// so no Info.plist change is needed.
enum RiloFonts {
    static func register() {
        let names = [
            "Fredoka-Medium", "Fredoka-SemiBold", "Fredoka-Bold",
            "Inter-Medium", "Inter-SemiBold", "Inter-Bold",
            "Nunito-Medium", "Nunito-Bold", "Nunito-ExtraBold", "Nunito-Black",
        ]
        for name in names {
            guard let url = Bundle.main.url(forResource: name, withExtension: "ttf") else { continue }
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
}

extension Font {
    /// CSS font-weight -> bundled face. Fredoka ships 500/600/700.
    static func fredoka(_ size: CGFloat, _ weight: Int = 600) -> Font {
        let face = weight >= 700 ? "Fredoka-Bold" : weight >= 600 ? "Fredoka-SemiBold" : "Fredoka-Medium"
        return .custom(face, fixedSize: size)
    }

    /// Inter ships 500/600/700 (400 falls back to 500, the lightest the web loads).
    static func inter(_ size: CGFloat, _ weight: Int = 500) -> Font {
        let face = weight >= 700 ? "Inter-Bold" : weight >= 600 ? "Inter-SemiBold" : "Inter-Medium"
        return .custom(face, fixedSize: size)
    }

    /// Nunito ships 500/700/800/900.
    static func nunito(_ size: CGFloat, _ weight: Int = 700) -> Font {
        let face: String
        switch weight {
        case 900...: face = "Nunito-Black"
        case 800..<900: face = "Nunito-ExtraBold"
        case 700..<800: face = "Nunito-Bold"
        default: face = "Nunito-Medium"
        }
        return .custom(face, fixedSize: size)
    }
}

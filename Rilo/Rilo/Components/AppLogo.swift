import SwiftUI

/// Port of app/src/components/AppLogo.jsx: a brand logo on a rounded square.
/// Simple Icons glyph in the brand's colour where one exists, otherwise the
/// letter fallback. Tile is the brand colour at low alpha.
struct AppLogo: View {
    let label: String
    var size: CGFloat = 38
    var radius: CGFloat = 12

    var body: some View {
        let info = Apps.appInfo(label)
        let color = Color(hex: Apps.glyphColor(info.hex))
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        ZStack {
            if let logo = info.logo {
                let s = (size * 0.55).rounded()
                SVGPath(logo.path)
                    .fill(color)
                    .frame(width: s, height: s)
            } else {
                Text(String(label.prefix(1)).uppercased())
                    .font(.fredoka((size * 0.45).rounded(), 700))
                    .foregroundStyle(color)
            }
        }
        .frame(width: size, height: size)
        .background(shape.fill(Apps.tileColor(info.hex)))
        .overlay(shape.strokeBorder(RC.ink.opacity(0.08), lineWidth: 1))
        .accessibilityHidden(true)
    }
}

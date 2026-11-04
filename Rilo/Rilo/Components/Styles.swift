import SwiftUI

/// `.tap` / `.tap-94` / `.tap-97` ...: buttons shrink slightly when pressed,
/// with a light haptic as the finger goes down (Haptics.tap).
struct TapScale: ButtonStyle {
    var scale: CGFloat = 0.96
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .contentShape(Rectangle())
            .scaleEffect(configuration.isPressed ? scale : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
            .onChange(of: configuration.isPressed) { _, pressed in
                if pressed { Haptics.tap() }
            }
    }
}

/// No shrink, no highlight (plain web <button> with transparent background)
struct PlainTap: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.contentShape(Rectangle())
    }
}

extension ButtonStyle where Self == TapScale {
    static var tap: TapScale { TapScale() }
    static func tap(_ s: CGFloat) -> TapScale { TapScale(scale: s) }
}

extension ButtonStyle where Self == PlainTap {
    static var plainTap: PlainTap { PlainTap() }
}

/// The "sticker" look: solid fill, 2px ink outline, a hard ink shadow
/// straight down (box-shadow: 0 Npx 0 var(--line)). No soft shadows.
struct Sticker: ViewModifier {
    var fill: Color = RC.card
    var radius: CGFloat = 22
    var border: Color = RC.line
    var borderWidth: CGFloat = 2
    var drop: CGFloat = 4
    var dropColor: Color = RC.line

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        content
            .background(shape.fill(fill))
            .overlay(shape.strokeBorder(border, lineWidth: borderWidth))
            .background(drop > 0 ? DropShadowShape(base: shape, drop: drop).fill(dropColor) : nil)
    }
}

/// The part of a hard `box-shadow: 0 Npx 0` that peeks out below the shape.
/// CSS never paints the shadow under the element itself, so translucent
/// fills (rgba(255,255,255,.45) buttons) must not show ink through them.
struct DropShadowShape<S: Shape>: Shape {
    let base: S
    let drop: CGFloat
    func path(in rect: CGRect) -> Path {
        base.path(in: rect.offsetBy(dx: 0, dy: drop)).subtracting(base.path(in: rect))
    }
}

struct CapsuleSticker: ViewModifier {
    var fill: Color = RC.card
    var border: Color = RC.line
    var borderWidth: CGFloat = 2
    var drop: CGFloat = 3
    var dropColor: Color = RC.line

    func body(content: Content) -> some View {
        content
            .background(Capsule().fill(fill))
            .overlay(Capsule().strokeBorder(border, lineWidth: borderWidth))
            .background(drop > 0 ? DropShadowShape(base: Capsule(), drop: drop).fill(dropColor) : nil)
    }
}

extension View {
    func sticker(fill: Color = RC.card, radius: CGFloat = 22, border: Color = RC.line,
                 borderWidth: CGFloat = 2, drop: CGFloat = 4, dropColor: Color = RC.line) -> some View {
        modifier(Sticker(fill: fill, radius: radius, border: border, borderWidth: borderWidth, drop: drop, dropColor: dropColor))
    }

    func capsuleSticker(fill: Color = RC.card, border: Color = RC.line, borderWidth: CGFloat = 2,
                        drop: CGFloat = 3, dropColor: Color = RC.line) -> some View {
        modifier(CapsuleSticker(fill: fill, border: border, borderWidth: borderWidth, drop: drop, dropColor: dropColor))
    }

    /// CSS `box-shadow: 0 y blur color` (soft). Only where the web has one.
    func cssShadow(_ color: Color, y: CGFloat, blur: CGFloat) -> some View {
        shadow(color: color, radius: blur / 2, x: 0, y: y)
    }
}

/// The big white pill button pinned at the bottom of most screens
/// (height 58, Fredoka 20/600, ink outline, 4px ink shadow).
struct PillButton: View {
    let title: String
    var fill: Color = .white
    var textColor: Color = RC.ink
    var height: CGFloat = 58
    var fontSize: CGFloat = 20
    var disabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.fredoka(fontSize, 600))
                .foregroundStyle(textColor)
                .frame(maxWidth: .infinity)
                .frame(height: height)
                .capsuleSticker(fill: fill, drop: 4)
        }
        .buttonStyle(.tap)
        .disabled(disabled)
        .opacity(disabled ? 0.55 : 1)
    }
}

/// Web layout: the designs are drawn at 390x844 with the status bar inside
/// that frame. iOS lays content inside the safe area instead, so a web top
/// padding of N maps to N minus the ~47pt status bar the design assumed.
enum WebLayout {
    static func top(_ web: CGFloat) -> CGFloat { max(4, web - 47) }
    /// web bottom paddings include the 34pt home-indicator area
    static func bottom(_ web: CGFloat) -> CGFloat { max(8, web - 26) }
}

/// One back button, used on every screen that has somewhere to go back to.
/// Port of app/src/components/BackButton.jsx.
struct BackButton: View {
    var label = "back"
    var light = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 5) {
                SVGPath("M19 12H7M13 6l-6 6 6 6")
                    .stroke(light ? .white : RC.ink, style: .svg(2.6))
                    .frame(width: 18, height: 18)
                Text(label)
                    .font(.fredoka(16, 600))
                    .foregroundStyle(light ? .white : RC.ink)
            }
            .padding(.leading, 11 + 2)   // css border sits outside the padding
            .padding(.trailing, 15 + 2)
            .frame(minHeight: 40)
            .background(Capsule().fill(light ? Color.white.opacity(0.14) : Color.white.opacity(0.92)))
            .overlay(Capsule().strokeBorder(light ? Color.white.opacity(0.6) : RC.ink, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityLabel(label)
    }
}

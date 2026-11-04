import SwiftUI

/// Progress.jsx's CardDecor: a little theme decoration on the "this week"
/// card. Sits on the card's corners/edges (never on the bars), small.
/// The SVGs are drawn from the web's exact path data. Offsets are the CSS
/// ones (measured from inside the card's 2px border).
struct ProgressCardDecor: View {
    let theme: String

    var body: some View {
        ZStack {
            switch theme {
            case "bamboo":
                art(46, 96, vb: (34, 70), Self.bamboo)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
                    .offset(x: -18, y: 12)
            case "sakura":
                art(110, 50, vb: (84, 38), Self.sakura)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .offset(x: 12, y: 14)
            case "sunset":
                art(96, 48, vb: (64, 32), Self.sunset)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .offset(x: 10, y: 12)
            case "snow":
                GeometryReader { geo in
                    art(geo.size.width - 4, 22, vb: (340, 22), Self.snowCap)
                        .offset(x: 2, y: -7)
                }
                art(26, 26, vb: (18, 18), Self.snowflake)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .offset(x: 8, y: 8)
            default:
                /* grass: a tuft with two little flowers poking up from the bottom-right corner */
                art(76, 48, vb: (54, 34), Self.grass)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomTrailing)
                    .offset(x: 12, y: 12)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }

    private func art(_ w: CGFloat, _ h: CGFloat, vb: (CGFloat, CGFloat),
                     _ draw: @escaping (inout GraphicsContext) -> Void) -> some View {
        Canvas { ctx, size in
            ctx.scaleBy(x: size.width / vb.0, y: size.height / vb.1)
            draw(&ctx)
        }
        .frame(width: w, height: h)
    }

    // MARK: drawing helpers (viewBox units)

    private static let ink = Color(hex: "#12301A")

    private static func path(_ d: String) -> Path { SVGPathCache.path(d) }

    private static func fillStroke(_ ctx: inout GraphicsContext, _ p: Path, fill: Color?, stroke: Color?, width: CGFloat) {
        if let fill { ctx.fill(p, with: .color(fill)) }
        if let stroke { ctx.stroke(p, with: .color(stroke), style: StrokeStyle(lineWidth: width, lineCap: .round, lineJoin: .round)) }
    }

    private static func line(_ ctx: inout GraphicsContext, _ d: String, _ color: Color, _ width: CGFloat, round: Bool = true) {
        ctx.stroke(path(d), with: .color(color), style: StrokeStyle(lineWidth: width, lineCap: round ? .round : .butt))
    }

    private static func circle(_ x: CGFloat, _ y: CGFloat, _ r: CGFloat) -> Path {
        Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2))
    }

    /// MiniFlower: five petals round a yellow middle
    private static func flower(_ ctx: inout GraphicsContext, _ x: CGFloat, _ y: CGFloat, _ petal: Color, _ size: CGFloat = 1) {
        let base = CGAffineTransform(translationX: x, y: y).scaledBy(x: size, y: size)
        for a in [0.0, 72, 144, 216, 288] {
            let t = CGAffineTransform(rotationAngle: a * .pi / 180).concatenating(base)
            let p = Path(ellipseIn: CGRect(x: -2.8, y: -4.2 - 4, width: 5.6, height: 8)).applying(t)
            ctx.fill(p, with: .color(petal))
            ctx.stroke(p, with: .color(ink), lineWidth: 1 * size)
        }
        let c = circle(0, 0, 2.4).applying(base)
        ctx.fill(c, with: .color(Color(hex: "#FFD43B")))
        ctx.stroke(c, with: .color(ink), lineWidth: 1 * size)
    }

    // MARK: the five decorations

    private static let grass: (inout GraphicsContext) -> Void = { ctx in
        let g = Color(hex: "#2E8B3E")
        line(&ctx, "M48 34 C48 22 50 16 54 12 M40 34 C40 24 38 18 34 14 M30 34 C30 26 32 20 36 18 M22 34 C22 26 20 22 16 20", g, 2.6)
        line(&ctx, "M10 34 L10 18", g, 2, round: false)
        flower(&ctx, 10, 14, Color(hex: "#F59BC0"))
        line(&ctx, "M44 34 L44 20", g, 2, round: false)
        flower(&ctx, 44, 16, .white, 0.85)
    }

    private static let bamboo: (inout GraphicsContext) -> Void = { ctx in
        let stem = Path(roundedRect: CGRect(x: 12, y: 8, width: 9, height: 62), cornerRadius: 4.5)
        fillStroke(&ctx, stem, fill: Color(hex: "#8CCB78"), stroke: ink, width: 1.6)
        line(&ctx, "M12 30 H21 M12 50 H21", Color(hex: "#5FA552"), 2.2, round: false)
        fillStroke(&ctx, path("M16 28 C10 18 2 16 0 20 C4 26 10 28 16 28 Z"), fill: Color(hex: "#6DBA5E"), stroke: ink, width: 1.4)
        fillStroke(&ctx, path("M18 12 C24 4 32 4 34 8 C30 14 24 14 18 12 Z"), fill: Color(hex: "#6DBA5E"), stroke: ink, width: 1.4)
    }

    private static let sakura: (inout GraphicsContext) -> Void = { ctx in
        let brown = Color(hex: "#7A4E3A")
        line(&ctx, "M84 34 C62 32 40 26 18 14", brown, 3.5)
        line(&ctx, "M52 28 C50 34 54 38 58 38", brown, 2.2)
        flower(&ctx, 70, 30, Color(hex: "#FFC2D6"), 1.1)
        flower(&ctx, 46, 24, Color(hex: "#FFC2D6"))
        flower(&ctx, 24, 15, Color(hex: "#FFE3EC"), 0.85)
    }

    private static let sunset: (inout GraphicsContext) -> Void = { ctx in
        let bird = Color(hex: "#7A4A3A")
        line(&ctx, "M2 10 Q6 6 10 10 Q14 6 18 10", bird, 2)
        line(&ctx, "M20 3 Q23 0 26 3 Q29 0 32 3", bird, 2)
        ctx.fill(circle(48, 18, 16), with: .color(Color(hex: "#FFC79E").opacity(0.7)))
        fillStroke(&ctx, circle(48, 18, 11), fill: Color(hex: "#FF8E5E"), stroke: ink, width: 1.6)
    }

    private static let snowCap: (inout GraphicsContext) -> Void = { ctx in
        fillStroke(&ctx, path("M10 9 C40 0 80 0 120 5 C160 0 220 0 260 5 C290 0 316 0 330 9 C324 14 316 14 310 11 C304 22 294 22 290 11 C240 13 200 13 160 11 C156 19 146 19 142 11 C100 13 60 13 26 11 C20 16 14 15 10 9 Z"),
                   fill: .white, stroke: Color(hex: "#9FC3DA"), width: 1.5)
    }

    private static let snowflake: (inout GraphicsContext) -> Void = { ctx in
        let blue = Color(hex: "#5AA9E6")
        line(&ctx, "M9 2 L9 16 M3 5.5 L15 12.5 M3 12.5 L15 5.5", blue, 2.4)
        fillStroke(&ctx, circle(9, 9, 2), fill: .white, stroke: blue, width: 1)
    }
}

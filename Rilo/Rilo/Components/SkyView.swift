import SwiftUI

/// The background behind most screens. Port of app/src/components/Sky.jsx.
///   hills: tall | mid | low     tone: day | dusk
/// The sky follows the app theme (grass, bamboo, sakura, sunset, snow).
/// Drawn in the web's 390x844 space with `xMidYMax slice`, so it lines up
/// with the web demo on any iPhone size.
struct SkyView: View {
    enum Hills { case tall, mid, low }
    enum Tone { case day, dusk }

    var hills: Hills = .low
    var tone: Tone = .day
    @Environment(\.riloTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = reduce ? 0 : ctx.date.timeIntervalSinceReferenceDate
            Canvas { g, size in
                let dusk = tone == .dusk
                g.fill(Path(CGRect(origin: .zero, size: size)),
                       with: SkyPainter.gradient(dusk ? nil : theme, height: size.height))
                let hillY: CGFloat = hills == .tall ? 484 : hills == .mid ? 540 : 600
                var s = SkyPainter.slice(g, size)
                if dusk {
                    for (x, y, r) in [(40.0, 70.0, 1.5), (300, 50, 1.2), (200, 110, 1), (350, 150, 1.4), (90, 170, 1)] {
                        s.fill(Circle().path(in: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)), with: .color(.white))
                    }
                    s.fill(Circle().path(in: CGRect(x: 298, y: 68, width: 44, height: 44)), with: .color(Color(hex: "#F7F1D8").opacity(0.9)))
                } else {
                    SkyPainter.skyThings(&s, id: theme.id, low: hillY, t: t)
                }
                let hc: [Color] = dusk
                    ? [Color(hex: "#6E8F86"), Color(hex: "#3F7A5A"), Color(hex: "#24533A")]
                    : theme.hills
                let blade = dusk ? Color(hex: "#24533A") : theme.id == "snow" ? Color(hex: "#9DB8C9") : hc[2]
                SkyPainter.hills(&s, y: hillY, colors: hc, height: 400)
                var h = s
                h.translateBy(x: 0, y: hillY)
                if !dusk { SkyPainter.hillDetails(&h, id: theme.id, blade: blade) }
                SkyPainter.blades(&h, color: blade, t: t, css: false)
                if !dusk { SkyPainter.falling(&g, size: size, id: theme.id, t: t) }
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// Just the sky things for the current theme (no hills), for screens that
/// paint their own sky + hills (Welcome, Home, the pop-up).
struct ThemeDecor: View {
    var low: CGFloat = 600
    @Environment(\.riloTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = reduce ? 0 : ctx.date.timeIntervalSinceReferenceDate
            Canvas { g, size in
                var s = SkyPainter.slice(g, size)
                SkyPainter.skyThings(&s, id: theme.id, low: low, t: t)
                SkyPainter.falling(&g, size: size, id: theme.id, t: t)
            }
        }
        .ignoresSafeArea()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// The three hills (and the two swaying grass blades) as drawn by Welcome,
/// Home and the pop-up in a 390-wide box anchored to the bottom.
/// `boxHeight` is the svg's own viewBox height (360 on Welcome).
struct HillsView: View {
    var boxHeight: CGFloat = 360
    var cssSway = true
    @Environment(\.riloTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = reduce ? 0 : ctx.date.timeIntervalSinceReferenceDate
            Canvas { g, size in
                // preserveAspectRatio xMidYMax slice into a 390 x boxHeight viewBox
                let s = max(size.width / 390, size.height / boxHeight)
                var c = g
                c.translateBy(x: (size.width - 390 * s) / 2, y: size.height - boxHeight * s)
                c.scaleBy(x: s, y: s)
                let blade = theme.id == "snow" ? Color(hex: "#9DB8C9") : theme.hills[2]
                SkyPainter.hills(&c, y: 0, colors: theme.hills, height: boxHeight)
                SkyPainter.blades(&c, color: blade, t: t, css: cssSway)
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

// MARK: - painter

nonisolated enum SkyPainter {
    static func gradient(_ theme: ThemeInfo?, height: CGFloat) -> GraphicsContext.Shading {
        let stops: [Gradient.Stop]
        if let theme {
            stops = theme.sky.map { .init(color: Color(hex: $0.0), location: $0.1) }
        } else {
            stops = [
                .init(color: Color(hex: "#2B3A6B"), location: 0),
                .init(color: Color(hex: "#5B6FA6"), location: 0.42),
                .init(color: Color(hex: "#A9A9CF"), location: 0.72),
                .init(color: Color(hex: "#D9D2E6"), location: 1),
            ]
        }
        return .linearGradient(Gradient(stops: stops), startPoint: .zero, endPoint: CGPoint(x: 0, y: height))
    }

    /// a context mapped to the web's 390x844 viewBox, xMidYMax slice
    static func slice(_ g: GraphicsContext, _ size: CGSize) -> GraphicsContext {
        let s = max(size.width / 390, size.height / 844)
        var c = g
        c.translateBy(x: (size.width - 390 * s) / 2, y: size.height - 844 * s)
        c.scaleBy(x: s, y: s)
        return c
    }

    static func p(_ d: String) -> Path { SVGPathCache.path(d) }

    static func hills(_ g: inout GraphicsContext, y: CGFloat, colors: [Color], height: CGFloat) {
        var c = g
        c.translateBy(x: 0, y: y)
        let h = Int(height)
        c.fill(p("M0 120 C90 60 170 70 250 110 C310 140 350 120 390 90 L390 \(h) L0 \(h) Z"), with: .color(colors[0]))
        c.fill(p("M0 190 C80 140 160 120 240 150 C300 172 340 190 390 170 L390 \(h) L0 \(h) Z"), with: .color(colors[1]))
        c.fill(p("M0 270 C110 240 250 236 390 262 L390 \(h) L0 \(h) Z"), with: .color(colors[2]))
    }

    /// two grass blades. Sky uses SMIL rotate ±4° (linear); Welcome/Home use
    /// the CSS `sway` keyframes ±3° (ease-in-out).
    static func blades(_ g: inout GraphicsContext, color: Color, t: TimeInterval, css: Bool) {
        func blade(_ d: String, cx: CGFloat, cy: CGFloat, dur: Double, flip: Bool) {
            let ph = Motion.phase(t, period: dur)
            let deg: Double
            if css {
                let k = ph < 0.5 ? ph * 2 : (1 - ph) * 2
                deg = -3 + 6 * Motion.easeInOut(k)
            } else {
                deg = Motion.through(flip ? [4, -4, 4] : [-4, 4, -4], ph)
            }
            var c = g
            c.translateBy(x: cx, y: cy)
            c.rotate(by: .degrees(deg))
            c.translateBy(x: -cx, y: -cy)
            c.stroke(p(d), with: .color(color), style: .svg(3))
        }
        blade("M60 160 L60 138 M54 148 L60 140 M66 150 L60 142", cx: 60, cy: 160, dur: 3, flip: false)
        blade("M330 178 L330 156 M324 166 L330 158 M336 168 L330 160", cx: 330, cy: 178, dur: 3.6, flip: true)
    }

    static func hillDetails(_ g: inout GraphicsContext, id: String, blade: Color) {
        if id == "snow" {
            g.fill(Ellipse().path(in: CGRect(x: 74, y: 146, width: 52, height: 8)), with: .color(.white.opacity(0.9)))
            g.fill(Ellipse().path(in: CGRect(x: 250, y: 164, width: 60, height: 8)), with: .color(.white.opacity(0.9)))
            return
        }
        let flowers: [String] = id == "sakura" ? ["#FFC2D6", "#FFFFFF", "#FF8FB4"]
            : id == "sunset" ? ["#FFD27A", "#FF9E7A", "#FFFFFF"]
            : ["#FFD43B", "#FFFFFF", "#F59BC0"]
        let pts: [(CGFloat, CGFloat)] = [(40, 196), (118, 172), (196, 160), (262, 168), (344, 186), (150, 250), (300, 252)]
        for (i, (x, y)) in pts.enumerated() {
            var stem = Path(); stem.move(to: CGPoint(x: x, y: y + 8)); stem.addLine(to: CGPoint(x: x, y: y))
            g.stroke(stem, with: .color(blade), style: .svg(2))
            let r = CGRect(x: x - 4.2, y: y - 4.2, width: 8.4, height: 8.4)
            g.fill(Circle().path(in: r), with: .color(Color(hex: flowers[i % flowers.count])))
            g.stroke(Circle().path(in: r), with: .color(Color.rgba(18, 48, 26, 0.35)), lineWidth: 1)
        }
    }

    // MARK: sky things

    static func sun(_ g: inout GraphicsContext, x: CGFloat, y: CGFloat, r: CGFloat, glow: String, core: String, t: TimeInterval) {
        let ph = Motion.phase(t, period: 6)
        let k = Motion.easeInOut(ph < 0.5 ? ph * 2 : (1 - ph) * 2)
        var c = g
        c.opacity = 0.9 + 0.1 * k
        c.translateBy(x: x, y: y)
        c.scaleBy(x: 1 + 0.04 * k, y: 1 + 0.04 * k)
        let gr = r * 1.56
        var glowCtx = c
        glowCtx.opacity *= 0.55
        glowCtx.fill(Circle().path(in: CGRect(x: -gr, y: -gr, width: gr * 2, height: gr * 2)), with: .color(Color(hex: glow)))
        c.fill(Circle().path(in: CGRect(x: -r, y: -r, width: r * 2, height: r * 2)), with: .color(Color(hex: core)))
    }

    static func skyThings(_ g: inout GraphicsContext, id: String, low: CGFloat, t: TimeInterval) {
        switch id {
        case "bamboo":
            sun(&g, x: 312, y: 118, r: 50, glow: "#FFF1C9", core: "#FFE7A0", t: t)
            bamboo(&g, x: 8, top: 210, dur: 7, flip: false, t: t)
            bamboo(&g, x: 383, top: 270, dur: 8.5, flip: true, t: t)
        case "sakura":
            sun(&g, x: 70, y: 130, r: 36, glow: "#FFF6F0", core: "#FFF0E2", t: t)
            sakuraBranch(&g, t: t)
        case "sunset":
            sun(&g, x: 250, y: low + 92, r: 64, glow: "#FFC79E", core: "#FF8E5E", t: t)
            birds(&g, t: t)
        case "snow":
            sun(&g, x: 300, y: 110, r: 34, glow: "#FFFFFF", core: "#FDFBEF", t: t)
        default:
            sun(&g, x: 318, y: 96, r: 34, glow: "#FFF8D8", core: "#FFEDA3", t: t)
        }
    }

    static func bamboo(_ g: inout GraphicsContext, x: CGFloat, top: CGFloat, dur: Double, flip: Bool, t: TimeInterval) {
        let w: CGFloat = 11
        let ph = Motion.phase(t, period: dur)
        let deg = -1.2 + 2.4 * Motion.easeInOut(ph < 0.5 ? ph * 2 : (1 - ph) * 2)
        var c = g
        c.translateBy(x: x, y: 844); c.rotate(by: .degrees(deg)); c.translateBy(x: -x, y: -844)
        let stalk = Color(hex: "#8CCB78"), node = Color(hex: "#5FA552"), leaf = Color(hex: "#6DBA5E")
        c.fill(RoundedRectangle(cornerRadius: w / 2).path(in: CGRect(x: x - w / 2, y: top, width: w, height: 844 - top)), with: .color(stalk))
        var y = top
        while y < 844 {
            c.fill(RoundedRectangle(cornerRadius: 1.75).path(in: CGRect(x: x - w / 2 - 1, y: y, width: w + 2, height: 3.5)), with: .color(node))
            y += 74
        }
        let dir: CGFloat = flip ? -1 : 1
        func f(_ v: CGFloat) -> String { String(format: "%.2f", v) }
        let l1 = "M\(f(x)) \(f(top + 80)) C\(f(x + 14 * dir)) \(f(top + 64)) \(f(x + 30 * dir)) \(f(top + 60)) \(f(x + 40 * dir)) \(f(top + 64)) C\(f(x + 28 * dir)) \(f(top + 74)) \(f(x + 14 * dir)) \(f(top + 80)) \(f(x)) \(f(top + 80)) Z"
        let l2 = "M\(f(x)) \(f(top + 156)) C\(f(x + 12 * dir)) \(f(top + 136)) \(f(x + 26 * dir)) \(f(top + 128)) \(f(x + 36 * dir)) \(f(top + 130)) C\(f(x + 26 * dir)) \(f(top + 144)) \(f(x + 12 * dir)) \(f(top + 154)) \(f(x)) \(f(top + 156)) Z"
        c.fill(p(l1), with: .color(leaf))
        c.fill(p(l2), with: .color(leaf))
    }

    static func blossom(_ g: inout GraphicsContext, x: CGFloat, y: CGFloat, s: CGFloat = 1) {
        var c = g
        c.translateBy(x: x, y: y); c.scaleBy(x: s, y: s)
        let pts: [(CGFloat, CGFloat)] = [(0, -6), (5.7, -1.9), (3.5, 4.9), (-3.5, 4.9), (-5.7, -1.9)]
        for (dx, dy) in pts {
            let r = CGRect(x: dx - 4.6, y: dy - 4.6, width: 9.2, height: 9.2)
            c.fill(Circle().path(in: r), with: .color(Color(hex: "#FFC2D6")))
            c.stroke(Circle().path(in: r), with: .color(Color(hex: "#E98AAB")), lineWidth: 0.9)
        }
        c.fill(Circle().path(in: CGRect(x: -2.4, y: -2.4, width: 4.8, height: 4.8)), with: .color(Color(hex: "#FF8FB4")))
    }

    static func sakuraBranch(_ g: inout GraphicsContext, t: TimeInterval) {
        var c = g
        c.translateBy(x: 390, y: -22); c.scaleBy(x: -0.82, y: 0.82)
        let ph = Motion.phase(t, period: 9)
        let deg = -1.2 + 2.4 * Motion.easeInOut(ph < 0.5 ? ph * 2 : (1 - ph) * 2)
        c.translateBy(x: 0, y: 40); c.rotate(by: .degrees(deg)); c.translateBy(x: 0, y: -40)
        let brown = Color(hex: "#7A4E3A")
        c.stroke(p("M-10 36 C40 40 90 58 150 92 C170 104 186 110 200 108"), with: .color(brown), style: StrokeStyle(lineWidth: 7, lineCap: .round))
        c.stroke(p("M70 52 C84 34 100 28 116 30"), with: .color(brown), style: StrokeStyle(lineWidth: 4, lineCap: .round))
        c.stroke(p("M120 78 C128 92 128 106 122 118"), with: .color(brown), style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
        for (x, y, s) in [(30.0, 34.0, 1.1), (58, 50, 1), (96, 30, 1.05), (118, 28, 0.9), (110, 70, 1.15), (150, 88, 1), (122, 116, 0.9), (186, 106, 1.05)] {
            blossom(&c, x: x, y: y, s: s)
        }
    }

    static func birds(_ g: inout GraphicsContext, t: TimeInterval) {
        let st = StrokeStyle(lineWidth: 2.4, lineCap: .round)
        let col = Color(hex: "#7A4A3A")
        let p1 = Motion.phase(t, period: 9)
        var a = g
        a.translateBy(x: Motion.through([0, 30, 0], p1), y: Motion.through([0, -6, 0], p1))
        a.stroke(p("M60 150 Q66 144 72 150 Q78 144 84 150"), with: .color(col), style: st)
        a.stroke(p("M96 172 Q101 167 106 172 Q111 167 116 172"), with: .color(col), style: st)
        let p2 = Motion.phase(t, period: 11)
        var b = g
        b.translateBy(x: Motion.through([0, -24, 0], p2), y: Motion.through([0, 4, 0], p2))
        b.stroke(p("M250 120 Q256 114 262 120 Q268 114 274 120"), with: .color(col), style: st)
    }

    // MARK: things drifting down / butterflies (screen coords, like the web divs)

    static let fall: [(CGFloat, Double, Double)] = [(0.12, 0, 13), (0.58, 4.5, 15), (0.84, 8, 12)]
    static let snow: [(CGFloat, Double, Double)] = [
        (0.06, 0, 11), (0.22, 3, 14), (0.38, 6.5, 12), (0.54, 1.5, 15), (0.70, 5, 11), (0.86, 8, 13), (0.94, 2.5, 16),
    ]

    static func falling(_ g: inout GraphicsContext, size: CGSize, id: String, t: TimeInterval) {
        switch id {
        case "bamboo": drop(&g, size: size, items: fall, t: t) { c in leaf(&c) }
        case "sakura": drop(&g, size: size, items: fall, t: t) { c in petal(&c) }
        case "snow": drop(&g, size: size, items: snow, t: t) { c in flake(&c) }
        case "grass":
            butterfly(&g, at: CGPoint(x: size.width * 0.14, y: size.height * 0.34), color: Color(hex: "#FFD43B"), t: t, period: 14, delay: 0, reverse: false)
            butterfly(&g, at: CGPoint(x: size.width * 0.70, y: size.height * 0.46), color: .white, t: t, period: 17, delay: 3, reverse: true)
        default: break
        }
    }

    static func drop(_ g: inout GraphicsContext, size: CGSize, items: [(CGFloat, Double, Double)], t: TimeInterval,
                     draw: (inout GraphicsContext) -> Void) {
        for (left, delay, dur) in items {
            // `both` fill: before its delay it sits at the 0% frame (invisible)
            let started = t - delay
            let p = started < 0 ? 0 : Motion.phase(started, period: dur)
            let x = Motion.keyframes([(0, 0), (0.5, 26), (1, -10)], p)
            let y = Motion.keyframes([(0, -40), (0.5, 380), (1, 820)], p)
            let rot = Motion.keyframes([(0, 0), (0.5, 160), (1, 320)], p)
            let op = Motion.keyframes([(0, 0), (0.1, 1), (0.9, 1), (1, 0)], p)
            var c = g
            c.opacity = op
            c.translateBy(x: size.width * left + x, y: y)
            c.rotate(by: .degrees(rot))
            draw(&c)
        }
    }

    static func leaf(_ g: inout GraphicsContext) {
        g.fill(SVGPath("M1 6 C6 0 16 0 21 6 C16 12 6 12 1 6 Z", w: 22, h: 12).path(in: CGRect(x: 0, y: 0, width: 22, height: 12)), with: .color(Color(hex: "#6DBA5E")))
        g.stroke(p("M3 6 L19 6"), with: .color(Color.black.opacity(0.18)), lineWidth: 1)
    }

    static func petal(_ g: inout GraphicsContext) {
        let path = p("M7 11 C2 8 0 3 3 1 C5 0 6 2 7 3 C8 2 9 0 11 1 C14 3 12 8 7 11 Z")
        g.fill(path, with: .color(Color(hex: "#FFB3CB")))
        g.stroke(path, with: .color(Color(hex: "#E98AAB")), lineWidth: 0.8)
    }

    static func flake(_ g: inout GraphicsContext) {
        g.stroke(p("M6 1 L6 11 M1.7 3.5 L10.3 8.5 M1.7 8.5 L10.3 3.5"), with: .color(.white), style: StrokeStyle(lineWidth: 1.8, lineCap: .round))
        g.fill(Circle().path(in: CGRect(x: 4.6, y: 4.6, width: 2.8, height: 2.8)), with: .color(Color(hex: "#BFE0F5")))
    }

    static func butterfly(_ g: inout GraphicsContext, at origin: CGPoint, color: Color, t: TimeInterval,
                          period: Double, delay: Double, reverse: Bool) {
        let started = max(0, t - delay)
        var ph = Motion.phase(started, period: period)
        if reverse { ph = 1 - ph }
        // keyframes 0/25/50/75/100%, ease-in-out per segment
        let xs: [(Double, Double)] = [(0, 0), (0.25, 90), (0.5, 160), (0.75, 60), (1, 0)]
        let ys: [(Double, Double)] = [(0, 0), (0.25, -40), (0.5, 10), (0.75, 50), (1, 0)]
        let dx = Motion.keyframes(xs, ph, ease: Motion.easeInOut)
        let dy = Motion.keyframes(ys, ph, ease: Motion.easeInOut)
        let flap = 1 - 0.65 * Motion.easeInOut(Motion.alternate(t, period: 0.35))
        var c = g
        c.translateBy(x: origin.x + dx, y: origin.y + dy)
        var w = c
        w.translateBy(x: 11, y: 8); w.scaleBy(x: flap, y: 1); w.translateBy(x: -11, y: -8)
        for d in ["M11 8 C6 0 0 1 1 6 C2 10 7 10 11 8 Z", "M11 8 C16 0 22 1 21 6 C20 10 15 10 11 8 Z",
                  "M11 8 C7 12 4 15 6 16 C9 16 10 12 11 8 Z", "M11 8 C15 12 18 15 16 16 C13 16 12 12 11 8 Z"] {
            w.fill(p(d), with: .color(color))
            w.stroke(p(d), with: .color(RC.ink), lineWidth: 1.2)
        }
        c.stroke(p("M11 4 L11 13"), with: .color(RC.ink), style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
    }
}

#Preview {
    SkyView(hills: .low)
}

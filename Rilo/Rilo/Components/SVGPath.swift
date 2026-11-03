import SwiftUI

/// Draws an SVG `d` string so icons, hills and decorations use the exact
/// path data from the web demo instead of being redrawn by hand.
///
/// `viewBox` is the coordinate space the path was written in; the shape is
/// scaled to whatever frame it is given (like `preserveAspectRatio="none"`
/// when the frame matches the viewBox aspect, which is how the web uses it).
nonisolated struct SVGPath: Shape {
    let d: String
    var viewBox: CGRect

    init(_ d: String, viewBox: CGRect = CGRect(x: 0, y: 0, width: 24, height: 24)) {
        self.d = d
        self.viewBox = viewBox
    }

    init(_ d: String, w: CGFloat, h: CGFloat) {
        self.init(d, viewBox: CGRect(x: 0, y: 0, width: w, height: h))
    }

    func path(in rect: CGRect) -> Path {
        let raw = SVGPathCache.path(d)
        let sx = rect.width / viewBox.width
        let sy = rect.height / viewBox.height
        let t = CGAffineTransform(translationX: rect.minX, y: rect.minY)
            .scaledBy(x: sx, y: sy)
            .translatedBy(x: -viewBox.minX, y: -viewBox.minY)
        return raw.applying(t)
    }
}

nonisolated enum SVGPathCache {
    private nonisolated(unsafe) static var cache: [String: Path] = [:]
    private static let lock = NSLock()
    static func path(_ d: String) -> Path {
        lock.lock(); defer { lock.unlock() }
        if let p = cache[d] { return p }
        let p = SVGPathParser.parse(d)
        cache[d] = p
        return p
    }
}

nonisolated enum SVGPathParser {
    static func parse(_ d: String) -> Path {
        var tokens: [String] = []
        var cur = ""
        let chars = Array(d)
        var i = 0
        func flush() { if !cur.isEmpty { tokens.append(cur); cur = "" } }
        while i < chars.count {
            let c = chars[i]
            if c.isLetter && c != "e" && c != "E" {
                flush(); tokens.append(String(c))
            } else if c == "," || c == " " || c == "\n" || c == "\t" {
                flush()
            } else if c == "-" {
                // a minus starts a new number unless it follows an exponent
                if let last = cur.last, last == "e" || last == "E" { cur.append(c) } else { flush(); cur.append(c) }
            } else if c == "." {
                if cur.contains(".") && !(cur.last == "e" || cur.last == "E") { flush() }
                cur.append(c)
            } else {
                cur.append(c)
            }
            i += 1
        }
        flush()

        var path = Path()
        var idx = 0
        var cmd: Character = "M"
        var pt = CGPoint.zero
        var start = CGPoint.zero
        var lastCtrl: CGPoint? = nil
        var lastQuad: CGPoint? = nil

        func num() -> CGFloat {
            guard idx < tokens.count, let v = Double(tokens[idx]) else { idx += 1; return 0 }
            idx += 1
            return CGFloat(v)
        }
        func hasNum() -> Bool { idx < tokens.count && Double(tokens[idx]) != nil }
        // arc flags may be packed like "0 0 1-8 8" (handled) or "011" (rare; split)
        func flag() -> CGFloat {
            guard idx < tokens.count else { return 0 }
            let t = tokens[idx]
            if t.count > 1, t.first == "0" || t.first == "1", !t.contains(".") {
                let f = CGFloat(Int(String(t.first!)) ?? 0)
                tokens[idx] = String(t.dropFirst())
                return f
            }
            return num()
        }

        while idx < tokens.count {
            if let ch = tokens[idx].first, tokens[idx].count == 1, ch.isLetter {
                cmd = ch; idx += 1
            }
            let rel = cmd.isLowercase
            let base = rel ? pt : .zero
            switch cmd.uppercased().first! {
            case "M":
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.move(to: p); pt = p; start = p
                cmd = rel ? "l" : "L"
                lastCtrl = nil; lastQuad = nil
            case "L":
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.addLine(to: p); pt = p
                lastCtrl = nil; lastQuad = nil
            case "H":
                let x = (rel ? pt.x : 0) + num()
                pt = CGPoint(x: x, y: pt.y); path.addLine(to: pt)
                lastCtrl = nil; lastQuad = nil
            case "V":
                let y = (rel ? pt.y : 0) + num()
                pt = CGPoint(x: pt.x, y: y); path.addLine(to: pt)
                lastCtrl = nil; lastQuad = nil
            case "C":
                let c1 = CGPoint(x: base.x + num(), y: base.y + num())
                let c2 = CGPoint(x: base.x + num(), y: base.y + num())
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.addCurve(to: p, control1: c1, control2: c2)
                pt = p; lastCtrl = c2; lastQuad = nil
            case "S":
                let c1 = lastCtrl.map { CGPoint(x: 2 * pt.x - $0.x, y: 2 * pt.y - $0.y) } ?? pt
                let c2 = CGPoint(x: base.x + num(), y: base.y + num())
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.addCurve(to: p, control1: c1, control2: c2)
                pt = p; lastCtrl = c2; lastQuad = nil
            case "Q":
                let c = CGPoint(x: base.x + num(), y: base.y + num())
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.addQuadCurve(to: p, control: c)
                pt = p; lastQuad = c; lastCtrl = nil
            case "T":
                let c = lastQuad.map { CGPoint(x: 2 * pt.x - $0.x, y: 2 * pt.y - $0.y) } ?? pt
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                path.addQuadCurve(to: p, control: c)
                pt = p; lastQuad = c; lastCtrl = nil
            case "A":
                let rx = num(), ry = num(), rot = num()
                let large = flag() != 0, sweep = flag() != 0
                let p = CGPoint(x: base.x + num(), y: base.y + num())
                addArc(&path, from: pt, to: p, rx: rx, ry: ry, rotDeg: rot, large: large, sweep: sweep)
                pt = p; lastCtrl = nil; lastQuad = nil
            case "Z":
                path.closeSubpath(); pt = start
                lastCtrl = nil; lastQuad = nil
                // Z takes no numbers; keep reading the next command
                if hasNum() { cmd = "L" }
            default:
                idx += 1
            }
        }
        return path
    }

    /// SVG endpoint arc -> cubic segments (SVG spec F.6.5)
    private static func addArc(_ path: inout Path, from p0: CGPoint, to p1: CGPoint,
                               rx rx0: CGFloat, ry ry0: CGFloat, rotDeg: CGFloat,
                               large: Bool, sweep: Bool) {
        var rx = abs(rx0), ry = abs(ry0)
        if rx == 0 || ry == 0 || p0 == p1 { path.addLine(to: p1); return }
        let phi = rotDeg * .pi / 180
        let cosP = cos(phi), sinP = sin(phi)
        let dx = (p0.x - p1.x) / 2, dy = (p0.y - p1.y) / 2
        let x1p = cosP * dx + sinP * dy
        let y1p = -sinP * dx + cosP * dy
        let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
        if lambda > 1 { let s = sqrt(lambda); rx *= s; ry *= s }
        let num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
        let den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
        var coef = sqrt(max(0, num / den))
        if large == sweep { coef = -coef }
        let cxp = coef * rx * y1p / ry
        let cyp = -coef * ry * x1p / rx
        let cx = cosP * cxp - sinP * cyp + (p0.x + p1.x) / 2
        let cy = sinP * cxp + cosP * cyp + (p0.y + p1.y) / 2
        func ang(_ ux: CGFloat, _ uy: CGFloat, _ vx: CGFloat, _ vy: CGFloat) -> CGFloat {
            let a = atan2(ux * vy - uy * vx, ux * vx + uy * vy)
            return a
        }
        let th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
        var dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
        if !sweep && dth > 0 { dth -= 2 * .pi }
        if sweep && dth < 0 { dth += 2 * .pi }
        let segs = Int(ceil(abs(dth) / (.pi / 2)))
        let delta = dth / CGFloat(segs)
        let t = 4.0 / 3.0 * tan(delta / 4)
        var th = th1
        for _ in 0..<segs {
            let c1 = cos(th), s1 = sin(th)
            let c2 = cos(th + delta), s2 = sin(th + delta)
            func map(_ x: CGFloat, _ y: CGFloat) -> CGPoint {
                CGPoint(x: cx + rx * x * cosP - ry * y * sinP, y: cy + rx * x * sinP + ry * y * cosP)
            }
            let e1 = map(c1 - t * s1, s1 + t * c1)
            let e2 = map(c2 + t * s2, s2 - t * c2)
            let e = map(c2, s2)
            path.addCurve(to: e, control1: e1, control2: e2)
            th += delta
        }
    }
}

/// Stroke style matching SVG `stroke-linecap="round" stroke-linejoin="round"`.
nonisolated extension StrokeStyle {
    static func svg(_ width: CGFloat, round: Bool = true, roundJoin: Bool = true) -> StrokeStyle {
        StrokeStyle(lineWidth: width, lineCap: round ? .round : .butt, lineJoin: roundJoin ? .round : .miter)
    }
}

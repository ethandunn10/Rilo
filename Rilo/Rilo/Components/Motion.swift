import SwiftUI

/// Helpers to replay the web demo's CSS @keyframes inside a TimelineView,
/// so looping animations run off the clock exactly like the browser does.
nonisolated enum Motion {
    /// 0...1 progress through a looping animation of `period` seconds,
    /// started `delay` seconds after `t0`.
    static func phase(_ t: TimeInterval, period: Double, delay: Double = 0) -> Double {
        let x = (t - delay).truncatingRemainder(dividingBy: period)
        return (x < 0 ? x + period : x) / period
    }

    /// CSS `ease-in-out` (cubic-bezier(.42,0,.58,1)), close enough by smoothstep
    static func easeInOut(_ x: Double) -> Double { x * x * (3 - 2 * x) }

    static func easeOut(_ x: Double) -> Double { 1 - pow(1 - x, 3) }

    /// cubic-bezier(x1,y1,x2,y2) solved for y at progress x
    static func bezier(_ x: Double, _ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double) -> Double {
        if x <= 0 { return 0 }
        if x >= 1 { return 1 }
        var lo = 0.0, hi = 1.0, t = x
        for _ in 0..<24 {
            let cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t
            if cx < x { lo = t } else { hi = t }
            t = (lo + hi) / 2
        }
        return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t
    }

    /// Linear interpolation through evenly-spaced values (SVG `values=` / SMIL)
    static func through(_ values: [Double], _ p: Double) -> Double {
        guard values.count > 1 else { return values.first ?? 0 }
        let seg = p * Double(values.count - 1)
        let i = min(values.count - 2, Int(seg))
        let f = seg - Double(i)
        return values[i] + (values[i + 1] - values[i]) * f
    }

    /// Keyframes at explicit stops [(offset 0...1, value)], with an easing per segment
    static func keyframes(_ stops: [(Double, Double)], _ p: Double, ease: (Double) -> Double = { $0 }) -> Double {
        guard let first = stops.first else { return 0 }
        if p <= first.0 { return first.1 }
        for k in 1..<stops.count {
            let a = stops[k - 1], b = stops[k]
            if p <= b.0 {
                let f = b.0 == a.0 ? 1 : (p - a.0) / (b.0 - a.0)
                return a.1 + (b.1 - a.1) * ease(f)
            }
        }
        return stops.last!.1
    }

    /// `alternate` direction: 0→1→0 across two periods
    static func alternate(_ t: TimeInterval, period: Double, delay: Double = 0) -> Double {
        let p = phase(t, period: period * 2, delay: delay) * 2
        return p <= 1 ? p : 2 - p
    }
}

/// Entry animations: `rise` (fade + 18px up), `rise14`, `pop`.
struct RiseIn: ViewModifier {
    var delay: Double = 0
    var distance: CGFloat = 18
    var duration: Double = 0.7
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    func body(content: Content) -> some View {
        content
            .opacity(shown || reduce ? 1 : 0)
            .offset(y: shown || reduce ? 0 : distance)
            .onAppear {
                withAnimation(.easeOut(duration: duration).delay(delay)) { shown = true }
            }
    }
}

struct PopIn: ViewModifier {
    var delay: Double = 0
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    func body(content: Content) -> some View {
        content
            .opacity(shown || reduce ? 1 : 0)
            .scaleEffect(shown || reduce ? 1 : 0.6)
            .offset(y: shown || reduce ? 0 : 30)
            .onAppear {
                withAnimation(.spring(response: 0.5, dampingFraction: 0.6).delay(delay)) { shown = true }
            }
    }
}

extension View {
    func rise(_ delay: Double = 0, distance: CGFloat = 18, duration: Double = 0.7) -> some View {
        modifier(RiseIn(delay: delay, distance: distance, duration: duration))
    }
    func popIn(_ delay: Double = 0) -> some View { modifier(PopIn(delay: delay)) }
}

import SwiftUI

/// Port of app/src/components/RiloHandoff.jsx — the beat between finishing
/// onboarding and the intro tour. Rilo bounds across the grass, says one
/// line, and the whole thing fades into the app underneath. It gets out of
/// the way on its own, and a tap skips it.
/// Done: state.handoffDone()
struct RiloHandoffOverlay: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme
    @Environment(\.accessibilityReduceMotion) private var reduce

    private static let CROSS: Double = 2.4
    private static let FADE: Double = 0.52
    /// DEBUG -handoffat <sec>: hold the run at that moment (screenshots)
    private static var holdAt: Double? {
        #if DEBUG
        return DemoSeed.arg("-handoffat").flatMap(Double.init)
        #else
        return nil
        #endif
    }

    @State private var start = Date()
    @State private var leaving = false
    @State private var done = false
    @State private var lineShown = false

    /// one exit path, however it's triggered
    private func finish() {
        if done { return }
        done = true
        if reduce { state.handoffDone(); return }
        withAnimation(.easeOut(duration: Self.FADE)) { leaving = true }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(Self.FADE))
            state.handoffDone()
        }
    }

    private var line: String {
        state.name.isEmpty ? "alright \u{2014} let me show you around."
                           : "alright \(state.name.lowercased()) \u{2014} let me show you around."
    }

    var body: some View {
        GeometryReader { g in
            let W = g.size.width, H = g.size.height
            ZStack(alignment: .topLeading) {
                theme.skyGradient
                ThemeDecor()

                /* the hills he runs along: 100% x 210, viewBox 390x210, xMidYMax slice */
                let s = max(W / 390, 1)
                ZStack {
                    SVGPath("M0 96 C110 42 250 52 390 86 L390 210 L0 210 Z", w: 390, h: 210).fill(theme.hills[1])
                    SVGPath("M0 150 C130 116 260 120 390 150 L390 210 L0 210 Z", w: 390, h: 210).fill(theme.hills[2])
                }
                .frame(width: 390 * s, height: 210 * s)
                .position(x: W / 2, y: H - 210 * s / 2)

                Color.clear
                    .frame(width: W, height: H)
                    .overlay(alignment: .top) {
                        Text(line)
                            .font(.fredoka(29, 700))
                            .webLineHeight(29, 1.18)
                            .foregroundStyle(RC.ink)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .padding(.horizontal, 24)
                            .opacity(lineShown || reduce ? 1 : 0)
                            .offset(y: lineShown || reduce ? 0 : 18)
                            .padding(.top, H * 0.17)
                    }

                if !reduce {
                    runner(W: W, H: H)
                }
            }
            .frame(width: W, height: H)
        }
        .ignoresSafeArea()
        .contentShape(Rectangle())
        .onTapGesture(perform: finish)
        .opacity(leaving ? 0 : 1)
        .onAppear {
            start = Date()
            withAnimation(.easeOut(duration: 0.5)) { lineShown = true }
            if reduce { finish(); return }
            if Self.holdAt != nil { return }
            Task { @MainActor in
                try? await Task.sleep(for: .seconds(Self.CROSS))
                finish()
            }
        }
        .accessibilityHidden(true)
    }

    /// one value through rilo-hop's keyframes, ease-in-out per segment
    private static func hop(_ v: [Double], _ p: Double) -> Double {
        let stops = [0, 0.14, 0.30, 0.46, 0.62, 0.80, 1.0]
        return Motion.keyframes(Array(zip(stops, v)), p) { Motion.bezier($0, 0.42, 0, 0.58, 1) }
    }

    /// across the grass (rilo-cross, linear), hopping as he goes (rilo-hop,
    /// ease-in-out per keyframe), with a shadow that shrinks as he leaves
    /// the ground (rilo-shadow)
    private func runner(W: CGFloat, H: CGFloat) -> some View {
        let riloH = (290 * RiloView.artH / RiloView.artW).rounded()
        let boxH = riloH - 14 + 20
        return TimelineView(.animation) { ctx in
            let p = min(1, max(0, (Self.holdAt ?? ctx.date.timeIntervalSince(start)) / Self.CROSS))
            let x = -0.34 * W + (1.24 + 0.34) * W * p
            let k = { (v: [Double]) in Self.hop(v, p) }
            let ty = k([10, -210, 0, -170, 0, -120, 0])
            let sx = k([1.1, 0.93, 1.12, 0.94, 1.1, 0.96, 1.06])
            let sy = k([0.88, 1.12, 0.86, 1.1, 0.88, 1.07, 0.93])
            let rot = k([-7, 6, -5, 7, -4, 6, -2])
            let shX = k([1, 0.38, 1, 0.44, 1, 0.56, 1])
            let shO = k([0.28, 0.07, 0.28, 0.09, 0.28, 0.12, 0.28])

            VStack(spacing: -14) {
                RiloView(skin: state.chosenRilo, mood: "proud", size: 290, motion: .none)
                Ellipse()
                    .fill(Color.rgba(12, 48, 26, 0.3))
                    .frame(width: 220, height: 20)
                    .blur(radius: 5)
                    .scaleEffect(x: shX, y: 1)
                    .opacity(shO)
            }
            .frame(width: 290, height: boxH)
            .rotationEffect(.degrees(rot))
            .scaleEffect(x: sx, y: sy)
            .offset(y: ty)
            .offset(x: x)
            .offset(y: -58)
            .frame(width: W, height: H, alignment: .bottomLeading)
        }
    }
}

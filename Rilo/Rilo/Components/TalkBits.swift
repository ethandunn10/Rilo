import SwiftUI

/// Port of app/src/components/TalkBits.jsx — the pieces shared by the Talk
/// screen and the night check-in. (ChatIcon, the other export of that file,
/// lives in ChatIcon.swift.)
///
/// RiloStage: big Rilo in the middle with sound-wave rings rolling out
///            behind him while he's saying his line. Tap him to hear it again.
///
/// The web deleted its mic pieces (MicButton, WaveBars and the green
/// "listening" rings — see lib/listen.js). They're ported here from the
/// last web version that had them (commit fd37a54^) and drive the real
/// speech-to-text behind `SpeechInput`. They only show when a `SpeechInput`
/// says it's available; otherwise the screens are typing only.
struct RiloStage: View {
    enum StageState { case idle, talking, listening }

    var skin: String
    var mood: String
    var size: CGFloat = 210
    var state: StageState = .idle
    var onTap: () -> Void = {}
    /// set → he's the talk button: hold him to talk (true down, false up)
    var onHold: ((Bool) -> Void)? = nil

    @Environment(\.accessibilityReduceMotion) private var reduce

    private var box: CGFloat { size + 110 }

    var body: some View {
        if let onHold {
            HoldToTalk(onStart: { onHold(true) }, onStop: { onHold(false) }) { stage }
                .accessibilityLabel(state == .listening ? "stop talking" : "hold rilo to talk")
                .accessibilityAction { onHold(state != .listening) }
        } else {
            Button(action: onTap) { stage }
                .buttonStyle(.tap(0.94))
                .accessibilityLabel("rilo")
        }
    }

    private var stage: some View {
            ZStack {
                /* soft disc so the rings have something to roll out from */
                Circle()
                    .fill(Color.white.opacity(0.45))
                    .overlay(Circle().strokeBorder(Color.rgba(18, 48, 26, 0.12), lineWidth: 2))
                    .frame(width: size * 0.92, height: size * 0.92)

                if state != .idle {
                    TalkRings(listening: state == .listening, diameter: box - 6)
                        .id(state)
                }

                RiloView(skin: skin, mood: mood, size: size,
                         motion: state == .listening ? .none : .idle)
            }
            .frame(width: box, height: box)
            .contentShape(Rectangle())
    }
}

/// `talk-ring`: scale .62 → 1.45 while fading .55 → 0, ease-out, looping.
/// Like the CSS (no fill-mode), a ring waiting out its delay shows unanimated.
private struct TalkRings: View {
    var listening: Bool
    var diameter: CGFloat
    @State private var start = Date()
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        let period = listening ? 1.6 : 2.2
        let gap = listening ? 0.53 : 0.73
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = ctx.date.timeIntervalSince(start)
            ZStack {
                ForEach(0..<3, id: \.self) { i in
                    let d = Double(i) * gap
                    let p = Motion.bezier(Motion.phase(t, period: period, delay: d), 0, 0, 0.58, 1)
                    let waiting = t < d
                    Circle()
                        .strokeBorder(listening ? RC.green : .white, lineWidth: listening ? 4 : 3)
                        .frame(width: diameter, height: diameter)
                        .scaleEffect(waiting ? 1 : 0.62 + (1.45 - 0.62) * p)
                        .opacity(waiting ? 1 : 0.55 * (1 - p))
                }
            }
        }
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// The bouncing sound bars under him while the mic is on (`talk-bar`).
struct WaveBars: View {
    var on: Bool
    var color: Color = RC.ink

    private static let BARS: [CGFloat] = [0.35, 0.6, 0.9, 0.5, 1, 0.7, 0.45, 0.85, 0.6, 1,
                                          0.55, 0.8, 0.4, 0.95, 0.65, 0.5, 0.9, 0.45, 0.7, 0.35]
    @State private var start = Date()
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        TimelineView(.animation(paused: !on || reduce)) { ctx in
            let t = ctx.date.timeIntervalSince(start)
            HStack(spacing: 5) {
                ForEach(Self.BARS.indices, id: \.self) { i in
                    let period = 0.55 + Double(i % 4) * 0.12
                    let delay = (Double(i) * 0.07).truncatingRemainder(dividingBy: 0.5)
                    let p = Motion.phase(t, period: period, delay: delay)
                    let s = on ? (t < delay ? 1 : 0.22 + 0.78 * Motion.easeInOut(p <= 0.5 ? p * 2 : 2 - p * 2)) : 0.22
                    RoundedRectangle(cornerRadius: 3)
                        .fill(i % 3 == 1 ? RC.green : color)
                        .frame(width: 5, height: 44 * Self.BARS[i])
                        .scaleEffect(x: 1, y: s)
                }
            }
            .frame(height: 44)
        }
        .opacity(on ? 1 : 0)
        .animation(.linear(duration: 0.25), value: on)
        .accessibilityHidden(true)
    }
}

struct MicIcon: View {
    var size: CGFloat = 30
    var color: Color = .white

    var body: some View {
        ZStack {
            SVGPath("M12 2.5 h0 a3.5 3.5 0 0 1 3.5 3.5 v5 a3.5 3.5 0 0 1 -7 0 v-5 a3.5 3.5 0 0 1 3.5 -3.5 Z")
                .fill(color)
            SVGPath("M5 11.5a7 7 0 0 0 14 0M12 18.5v3")
                .stroke(color, style: StrokeStyle(lineWidth: 2.2, lineCap: .round))
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// HOLD to talk: listening only while a finger is on it, and letting go
/// stops and hands over what was heard (the mic permission text promises
/// exactly this). VoiceOver can't hold, so for it a double-tap toggles.
struct MicButton: View {
    var listening: Bool
    var size: CGFloat = 84
    var disabled = false
    let onStart: () -> Void
    let onStop: () -> Void

    @State private var start = Date()

    var body: some View {
        HoldToTalk(disabled: disabled, onStart: onStart, onStop: onStop) {
            MicIcon(size: size * 0.4)
                .frame(width: size, height: size)
                .background(
                    TimelineView(.animation(paused: !listening)) { ctx in
                        /* talk-glow: a green halo pulsing out to 14px */
                        let p = Motion.phase(ctx.date.timeIntervalSince(start), period: 1.2)
                        let k = p <= 0.5 ? p * 2 : 2 - p * 2
                        Circle()
                            .fill(Color.rgba(76, 193, 96, 0.55 * (1 - k)))
                            .padding(-14 * k)
                            .opacity(listening ? 1 : 0)
                    }
                )
                .background(Circle().fill(listening ? RC.greenDeep : RC.ink))
                .overlay(Circle().strokeBorder(RC.line, lineWidth: 2))
                .background(DropShadowShape(base: Circle(), drop: 4).fill(RC.line))
                .scaleEffect(listening ? 1.08 : 1)
                .animation(.easeOut(duration: 0.15), value: listening)
                .contentShape(Circle())
        }
        .opacity(disabled ? 0.5 : 1)
        .accessibilityLabel(listening ? "stop talking" : "hold to talk")
        .accessibilityAction { listening ? onStop() : onStart() }
    }
}

/// Press-and-hold: `onStart` when the finger lands, `onStop` when it lifts
/// (or the touch is cancelled, e.g. a scroll takes it, so the mic can
/// never stay on by itself).
struct HoldToTalk<Content: View>: View {
    var disabled = false
    let onStart: () -> Void
    let onStop: () -> Void
    @ViewBuilder var content: () -> Content

    @GestureState private var held = false

    var body: some View {
        content()
            .gesture(DragGesture(minimumDistance: 0).updating($held) { _, h, _ in h = true },
                     including: disabled ? .none : .all)
            .onChange(of: held) { _, down in down ? onStart() : onStop() }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isButton)
    }
}

/// `bubble-in`: fade in from 8px down at 96% (ease-out). Re-runs whenever
/// the view's identity changes, like the web's `key={bubble}`.
struct BubbleIn: ViewModifier {
    var duration: Double = 0.35
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    func body(content: Content) -> some View {
        content
            .opacity(shown || reduce ? 1 : 0)
            .offset(y: shown || reduce ? 0 : 8)
            .scaleEffect(shown || reduce ? 1 : 0.96)
            .onAppear { withAnimation(.easeOut(duration: duration)) { shown = true } }
    }
}

extension View {
    func bubbleIn(_ duration: Double = 0.35) -> some View { modifier(BubbleIn(duration: duration)) }
}

/// CSS shrink-to-fit width for a centred bubble: as wide as its text on one
/// line, or the full width available once the text has to wrap (SwiftUI's
/// Text otherwise hugs its widest wrapped line).
struct ShrinkToFit<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        ViewThatFits(in: .horizontal) {
            content().fixedSize(horizontal: true, vertical: false)
            content().frame(maxWidth: .infinity)
        }
    }
}

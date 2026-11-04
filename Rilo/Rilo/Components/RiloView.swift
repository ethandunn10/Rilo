import SwiftUI

/// Rilo, the panda. Port of app/src/components/Rilo.jsx.
///
/// The art is the real artwork from designs/rilo-panda, rendered to PNG at
/// build time (Assets.xcassets/Rilo). Nothing here redraws Rilo. The two
/// animations built into the SVGs are replayed exactly:
///   wave  - the arm rotates -12° → 14° → -12° around (168,106) every 0.9s
///   angry - the whole panda shakes 0,-2,2,-2,0,0 units every 0.9s
///
/// motion: .idle (gentle bob) | .jump | .none
/// talks:  tapping squishes him and he says a line (Models/RiloLines)
struct RiloView: View {
    enum MotionKind { case idle, jump, none }

    var skin: String = "original"
    var mood: String = "coach"
    var size: CGFloat = 200
    var motion: MotionKind = .idle
    var talks: Bool = false

    @State private var line: RiloLine? = nil
    @State private var lastIndex = -1
    @State private var squishAt: Date? = nil
    @State private var hideTask: Task<Void, Never>? = nil
    @Environment(\.accessibilityReduceMotion) private var reduce

    /// the art is drawn in a 208 x 182 box (viewBox -4 0 208 182)
    static let artW: CGFloat = 208
    static let artH: CGFloat = 182

    private var height: CGFloat { (size * Self.artH / Self.artW).rounded() }
    private var shownMood: String { line?.mood ?? mood }

    var body: some View {
        Group {
            if talks {
                art
                    .contentShape(Rectangle())
                    .onTapGesture(perform: poke)
                    .overlay(alignment: .top) { bubble }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityLabel("poke rilo")
            } else {
                art
            }
        }
        .frame(width: size, height: height)
    }

    // MARK: art + motion

    private var art: some View {
        TimelineView(.animation(paused: reduce)) { ctx in
            let t = ctx.date.timeIntervalSinceReferenceDate
            sprite(t)
                .scaleEffect(x: squish(ctx.date).0, y: squish(ctx.date).1, anchor: .bottom)
                .offset(y: squish(ctx.date).2 * height)
                .offset(y: wrapperOffset(t))
        }
        .accessibilityLabel(Self.label[mood] ?? Self.label["coach"]!)
    }

    @ViewBuilder
    private func sprite(_ t: TimeInterval) -> some View {
        let unit = size / Self.artW
        let name = Self.assetName(skin: skin, mood: shownMood)
        if shownMood == "wave" {
            let p = Motion.phase(t, period: 0.9)
            let deg = reduce ? 0 : Motion.through([-12, 14, -12], p)
            ZStack {
                img("\(name)-base")
                img("\(name)-arm")
                    .rotationEffect(.degrees(deg), anchor: UnitPoint(x: (168 + 4) / Self.artW, y: 106 / Self.artH))
                img("\(name)-top")
            }
        } else if shownMood == "angry" {
            let p = Motion.phase(t, period: 0.9)
            let dx = reduce ? 0 : Motion.through([0, -2, 2, -2, 0, 0], p)
            img(name).offset(x: dx * unit)
        } else {
            img(name)
        }
    }

    private func img(_ name: String) -> some View {
        Image(name).resizable().interpolation(.high).frame(width: size, height: height)
    }

    /// bob: 0 → -5 → 0 over 2.4s · jump: up 28px and back over 1.3s
    private func wrapperOffset(_ t: TimeInterval) -> CGFloat {
        if reduce { return 0 }
        switch motion {
        case .idle:
            let p = Motion.phase(t, period: 2.4)
            let k = p < 0.5 ? p * 2 : (1 - p) * 2
            return -5 * Motion.bezier(k, 0.45, 0, 0.55, 1)
        case .jump:
            let p = Motion.phase(t, period: 1.3)
            if p <= 0.2 || p >= 0.7 { return 0 }
            if p <= 0.45 { return -28 * Motion.bezier((p - 0.2) / 0.25, 0.2, 0.8, 0.4, 1) }
            return -28 * (1 - Motion.bezier((p - 0.45) / 0.25, 0.6, 0, 0.8, 0.2))
        case .none:
            return 0
        }
    }

    /// rilo-squish: 0.42s cubic-bezier(.34,1.56,.64,1)
    private func squish(_ now: Date) -> (CGFloat, CGFloat, CGFloat) {
        guard let at = squishAt, !reduce else { return (1, 1, 0) }
        let raw = now.timeIntervalSince(at) / 0.42
        if raw >= 1 { return (1, 1, 0) }
        let p = Motion.bezier(raw, 0.34, 1.56, 0.64, 1)
        let sx = Motion.keyframes([(0, 1), (0.28, 1.1), (0.55, 0.95), (1, 1)], p)
        let sy = Motion.keyframes([(0, 1), (0.28, 0.86), (0.55, 1.08), (1, 1)], p)
        let ty = Motion.keyframes([(0, 0), (0.28, 0.04), (0.55, -0.03), (1, 0)], p)
        return (sx, sy, ty)
    }

    // MARK: poke

    private func poke() {
        Haptics.soft()
        let picked = RiloLines.next(after: lastIndex)
        lastIndex = picked.index
        line = picked.line
        squishAt = Date()
        hideTask?.cancel()
        hideTask = Task { @MainActor in
            try? await Task.sleep(for: .milliseconds(RiloLines.sayMs))
            if !Task.isCancelled { line = nil }
        }
    }

    @ViewBuilder
    private var bubble: some View {
        if let line {
            RiloSayBubble(text: line.say, fontSize: max(12, min(15, (size / 11).rounded())))
                .id(line.say + "\(lastIndex)")
                .fixedSize()
                .alignmentGuide(.top) { d in d[.bottom] + 4 }
                .allowsHitTesting(false)
                .zIndex(30)
        }
    }

    // MARK: names

    static func assetName(skin: String, mood: String) -> String {
        let s = RiloSkins.all.contains(skin) ? skin : "original"
        let m = RiloSkins.moods.contains(mood) ? mood : "coach"
        return "rilo-\(s)-\(m)"
    }

    static let label: [String: String] = [
        "coach": "Rilo, confident and winking",
        "wave": "Rilo waving hello",
        "proud": "Rilo proud",
        "curious": "Rilo curious, asking why",
        "sleepy": "Rilo sleepy",
        "letdown": "Rilo let down",
        "angry": "Rilo annoyed",
    ]
}

/// The dark pill with what he said: rilo-pop-say, 2s
private struct RiloSayBubble: View {
    let text: String
    let fontSize: CGFloat
    @State private var start = Date()

    var body: some View {
        TimelineView(.animation) { ctx in
            let p = min(1, ctx.date.timeIntervalSince(start) / (Double(RiloLines.sayMs) / 1000))
            let opacity = Motion.keyframes([(0, 0), (0.18, 1), (0.82, 1), (1, 0)], p)
            let dy = Motion.keyframes([(0, 6), (0.18, 0), (0.82, 0), (1, -4)], p)
            let s = Motion.keyframes([(0, 0.9), (0.18, 1), (0.82, 1), (1, 0.97)], p)
            Text(text)
                .font(.fredoka(fontSize, 600))
                .foregroundStyle(.white)
                .lineLimit(1)
                .padding(.vertical, 6)
                .padding(.horizontal, 12)
                .background(Capsule().fill(RC.ink))
                .shadow(color: Color.rgba(10, 40, 20, 0.28), radius: 9, y: 6)
                .opacity(opacity)
                .scaleEffect(s)
                .offset(y: dy)
        }
    }
}

#Preview {
    VStack {
        RiloView(skin: "original", mood: "wave", size: 210, motion: .jump, talks: true)
        HStack {
            RiloView(skin: "samurai", mood: "wave", size: 120)
            RiloView(skin: "gamer", mood: "angry", size: 120)
        }
    }
    .padding()
    .background(RC.stage)
}

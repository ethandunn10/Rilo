import SwiftUI

/// "here's your number", three beats: what the hours they said cost a year
/// (one big number + a bar of the year), what cutting to the starting goal
/// gives back (same), then the promise (and the per-app split).
/// Beats one and two advance themselves (BEAT_MS); a tap anywhere moves it
/// on, "skip" jumps to the last beat, back steps back through the beats.
/// The beat lives in `state.numberBeat` so it survives a trip to the paywall.
struct YourNumberView: View {
    @Environment(AppState.self) private var state
    @Environment(\.accessibilityReduceMotion) private var reduced

    static let BEAT_MS: [Int] = [3800, 3400]

    @State private var bigDays = 0
    @State private var bigFlip = 0

    /// DEBUG `-beat N`: show that beat settled (no auto-advance, counters
    /// on their final numbers) so a screenshot isn't mid-animation.
    private var pinned: Bool {
        #if DEBUG
        return DemoSeed.arg("-beat") != nil
        #else
        return false
        #endif
    }

    private var beat: Int { state.numberBeat }
    private var perDay: Double { state.breakdown?.blocked ?? 0 }
    private var days: Int { Rather.daysPerYear(perDay) }
    private var flip: InsteadOf { Rather.insteadOf(perDay, state.rather) }
    private var mood: String { beat == 0 ? "letdown" : beat == 1 ? "proud" : "coach" }

    var body: some View {
        ZStack {
            SkyView(hills: .low).ignoresSafeArea()

            if beat < 2 { stage }

            VStack(spacing: 0) {
                header
                if beat == 2 {
                    promise
                    showPlan
                } else {
                    Spacer(minLength: 0)
                }
            }
        }
        /* the whole stage is the tap target */
        .contentShape(Rectangle())
        .onTapGesture { if beat < 2 { onwards() } }
        /* each beat sets the timer for its own exit, so a tap that moves
           things on early cancels the one it replaced */
        .task(id: beat) {
            guard !pinned, beat < Self.BEAT_MS.count else { return }
            try? await Task.sleep(for: .milliseconds(Self.BEAT_MS[beat]))
            if Task.isCancelled { return }
            state.numberBeat = beat + 1
        }
        .task(id: beat == 0) {
            await countUp(to: days, ms: 2000, run: beat == 0) { bigDays = $0 }
        }
        .task(id: beat >= 1) {
            await countUp(to: daysBack, ms: 1700, run: beat >= 1) { bigFlip = $0 }
        }
    }

    // MARK: header (back + skip)

    private var header: some View {
        HStack(spacing: 10) {
            BackButton(action: back)
            Spacer(minLength: 0)
            if beat < 2 {
                Button { state.numberBeat = 2 } label: {
                    Text("skip")
                        .font(.fredoka(14, 600))
                        .foregroundStyle(RC.ink)
                        .padding(.horizontal, 14)
                        .frame(minHeight: 36)
                        .background(Capsule().fill(Color.white.opacity(0.85)))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
        }
        .padding(.top, WebLayout.top(46))
        .padding(.horizontal, 22)
        /* taps on the header row never count as "next" */
        .contentShape(Rectangle())
        .onTapGesture {}
    }

    // MARK: beats 1 and 2: one big number, one big bar

    /// beat 1: what the hours they said cost a year. beat 2: what cutting to
    /// the starting goal gives back. One number, one bar of the year, a few
    /// words: readable in a second.
    private var stage: some View {
        GeometryReader { geo in
            VStack(spacing: 18) {
                Spacer(minLength: 70)
                RiloView(skin: AppState.OG_SKIN, mood: mood, size: min(130, geo.size.height * 0.17))
                numberColumn
                    .id("num-\(beat)")
                YearBar(fraction: Double(beat == 0 ? days : daysBack) / 365,
                        color: beat == 0 ? Color(hex: "#C0532F") : RC.greenDeep,
                        reduced: reduced || pinned)
                    .id("bar-\(beat)")
                    .padding(.horizontal, 26)
                Spacer(minLength: 40)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }

    /// "6 hrs a day" / "5½ hrs"
    static func hrs(_ mins: Double) -> String {
        let h = mins / 60
        let whole = h.rounded(.down)
        let half = h - whole >= 0.5
        if whole == 1 && !half { return "1 hr" }
        return "\(Int(whole))\(half ? "½" : "") hrs"
    }

    private var goalMinsNow: Double { Double(state.goalMins) }
    private var daysBack: Int { Rather.daysPerYear(max(0, perDay - goalMinsNow)) }

    private var numberColumn: some View {
        VStack(spacing: 4) {
            Text(beat == 0 ? "\(Self.hrs(perDay)) a day" : "cut to \(Self.hrs(goalMinsNow))")
                .font(.fredoka(30, 700))
                .foregroundStyle(RC.ink)
            Text(verbatim: "= \(beat == 0 ? bigDays : bigFlip) days")
                .font(.fredoka(76, 700))
                .minimumScaleFactor(0.6)
                .lineLimit(1)
                .monospacedDigit()
                .foregroundStyle(beat == 0 ? Color(hex: "#9E3B1E") : RC.greenDeep)
            Text(beat == 0 ? "a year on your phone" : "back this year")
                .font(.fredoka(28, 700))
                .foregroundStyle(RC.ink)
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 18)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(beat == 0
            ? "\(Self.hrs(perDay)) a day equals \(days) days a year on your phone."
            : "cut to \(Self.hrs(goalMinsNow)) equals \(daysBack) days back this year.")
        .accessibilityAddTraits(.isHeader)
        .modifier(BeatRise(reduced: reduced))
    }

    // MARK: beat 3: the promise, and the split

    private var promise: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 13) {
                Text("let's get some of it back.")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(30, 700))
                    .webLineHeight(30, 1.1)
                    .foregroundStyle(RC.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .modifier(BeatRise(reduced: reduced))

                Text("not all \(days) days. i'm not going to pretend you'll never scroll again — i just want a piece of it back for \(flip.id != nil ? flip.unit : "you").")
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)

                VStack(alignment: .leading, spacing: 0) {
                    Text("where it goes")
                        .font(.fredoka(18, 600))
                        .foregroundStyle(RC.ink)
                        .padding(.bottom, 10)
                    if let b = state.breakdown {
                        BreakdownBars(breakdown: b, compact: true, isPro: state.hasPro) { state.go(.upgrade) }
                    }
                }
                /* 14/16 inside the 2px border */
                .padding(.vertical, 16)
                .padding(.horizontal, 18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .sticker(fill: RC.card, radius: 26, drop: 4)
                .modifier(BeatRise(reduced: reduced, delay: 0.12))
            }
            .padding(.top, 8)
            .padding(.horizontal, 22)
            .padding(.bottom, 12)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    private var showPlan: some View {
        PillButton(title: "show me the plan", fill: Color(hex: "#2E8B3E"), textColor: .white) {
            state.go(.rather)
        }
        .padding(.top, 10)
        .padding(.horizontal, 22)
        .padding(.bottom, WebLayout.bottom(28))
    }

    // MARK: actions

    private func onwards() { state.numberBeat = min(beat + 1, 2) }

    /// back steps through the beats before it leaves the screen
    private func back() {
        if beat > 0 { state.numberBeat = beat - 1 } else { state.goTo(.hours, dir: .back) }
    }

    /// useCountUp: 0 → `to` over `ms`, eased out; lands on it instantly when
    /// motion is off or it isn't running.
    private func countUp(to: Int, ms: Double, run: Bool, set: (Int) -> Void) async {
        if reduced || !run || pinned {
            set(to)
            return
        }
        let started = Date()
        while !Task.isCancelled {
            let t = min(1, Date().timeIntervalSince(started) * 1000 / ms)
            let eased = 1 - pow(1 - t, 3)
            set(JS.roundInt(Double(to) * eased))
            if t >= 1 { break }
            try? await Task.sleep(for: .milliseconds(16))
        }
    }
}

/// `rise .5s ease-out both` (fade + 18px up), skipped with Reduce Motion
private struct BeatRise: ViewModifier {
    let reduced: Bool
    var delay: Double = 0
    @State private var shown = false

    func body(content: Content) -> some View {
        content
            .opacity(shown || reduced ? 1 : 0)
            .offset(y: shown || reduced ? 0 : 18)
            .onAppear { withAnimation(.easeOut(duration: 0.5).delay(delay)) { shown = true } }
    }
}

/// A bar the width of the screen: the whole year, with the share of it in
/// question filling in smoothly.
private struct YearBar: View {
    let fraction: Double
    let color: Color
    let reduced: Bool
    @State private var shown: Double = 0

    var body: some View {
        VStack(spacing: 6) {
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.75))
                    Capsule().fill(color)
                        .frame(width: max(44, g.size.width * min(1, max(0, shown))))
                }
            }
            .frame(height: 44)
            .overlay(Capsule().strokeBorder(RC.ink.opacity(0.85), lineWidth: 2.5))
            HStack {
                Text("today").font(.inter(13, 700))
                Spacer()
                Text("1 year").font(.inter(13, 700))
            }
            .foregroundStyle(RC.ink)
        }
        .accessibilityHidden(true)
        .onAppear {
            if reduced { shown = fraction; return }
            withAnimation(.easeOut(duration: 1.6).delay(0.15)) { shown = fraction }
        }
    }
}

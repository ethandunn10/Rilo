import SwiftUI

/// Port of app/src/screens/YourNumber.jsx — "here's your number", three
/// beats: the hit (days a year + the pile), the flip (the same time counted
/// in what they'd rather do), the promise (and the per-app split).
/// Beats one and two advance themselves (BEAT_MS); a tap anywhere moves it
/// on, "skip" jumps to the last beat, back steps back through the beats.
/// The beat lives in `state.numberBeat` so it survives a trip to the paywall.
struct YourNumberView: View {
    @Environment(AppState.self) private var state
    @Environment(\.accessibilityReduceMotion) private var reduced

    static let BEAT_MS: [Int] = [3800, 3400]

    @State private var bigDays = 0
    @State private var bigFlip = 0
    @State private var columnHeight: CGFloat = 345

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
            await countUp(to: flip.count, ms: 1700, run: beat >= 1) { bigFlip = $0 }
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

    // MARK: beats 1 and 2: the stage

    private var stage: some View {
        GeometryReader { geo in
            ZStack {
                YourNumberPile(days: days, flipped: beat >= 1, reduced: reduced)
                    .opacity(0.45)
                    .position(x: geo.size.width / 2, y: geo.size.height - YourNumberPile.budget / 2)
                    .allowsHitTesting(false)
                    .accessibilityHidden(true)

                /* top: 43% with translateY(-50%) — but on the web the `rise`
                   entry animation (fill: both) ends on translateY(0), which
                   replaces the -50%, so the column's TOP sits at 43%. Only
                   with reduced motion (no animation) is it centred there. */
                /* short phones (SE): lift the column so it ends above the
                   pile instead of running into it (tall phones: unchanged) */
                let top = max(110,
                              min(geo.size.height * 0.43, geo.size.height - YourNumberPile.budget - columnHeight))
                VStack(spacing: 0) {
                    if reduced { Spacer(minLength: 0) }
                    numberColumn
                        .id("num-\(beat)")
                        .frame(width: geo.size.width)
                        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { columnHeight = $0 }
                    Spacer(minLength: 0)
                }
                .frame(width: geo.size.width, height: reduced ? geo.size.height * 0.86 : geo.size.height - top)
                .position(x: geo.size.width / 2,
                          y: reduced ? geo.size.height * 0.43 : top + (geo.size.height - top) / 2)
            }
        }
        .ignoresSafeArea()
    }

    private var numberColumn: some View {
        VStack(spacing: 10) {
            RiloView(skin: AppState.OG_SKIN, mood: mood, size: 124)

            Text(beat == 0 ? "\(Plan.fmtMins(perDay)) a day, on these apps" : "the same time, spent your way")
                .font(.inter(15.5, 800))
                .tracking(15.5 * 0.07)
                .textCase(.uppercase)
                .foregroundStyle(Color(hex: "#1E3A27"))
                .padding(.top, 4)

            Text(verbatim: String(beat == 0 ? bigDays : bigFlip))
                .font(.fredoka(104, 700))
                .tracking(-104 * 0.02)
                .foregroundStyle(beat == 0 ? RC.ink : Color(hex: "#2E8B3E"))
                .frame(height: 104 * 0.95)
                .monospacedDigit()

            Text(beat == 0 ? "days a year. awake, scrolling." : "\(flip.unit). that's what it's worth.")
                .font(.fredoka(30, 700))
                .webLineHeight(30, 1.2)
                .foregroundStyle(beat == 0 ? Color(hex: "#0E2615") : Color(hex: "#1B5F28"))
                .multilineTextAlignment(.center)
                .frame(maxWidth: 320)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 6)
        }
        .padding(.horizontal, 18)
        .multilineTextAlignment(.center)
        /* read the final numbers, not the count-up */
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(beat == 0
            ? "\(A11ySpeak.mins(perDay)) a day, on these apps. \(days) days a year. awake, scrolling."
            : "the same time, spent your way. \(flip.count) \(flip.unit). that's what it's worth.")
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
            state.go(.yourplan)
        }
        .padding(.top, 10)
        .padding(.horizontal, 22)
        .padding(.bottom, WebLayout.bottom(28))
    }

    // MARK: actions

    private func onwards() { state.numberBeat = min(beat + 1, 2) }

    /// back steps through the beats before it leaves the screen
    private func back() {
        if beat > 0 { state.numberBeat = beat - 1 } else { state.goTo(.rather, dir: .back) }
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

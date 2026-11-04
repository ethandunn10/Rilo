import SwiftUI

/// Port of app/src/screens/Progress.jsx (designs/Progress.dc.html + the
/// panda update's level system): real level, an XP bar to the NEXT level,
/// and the next skin you'll unlock shown with its picture.
/// (named ProgressScreenView so it doesn't clash with SwiftUI.ProgressView)
///
/// The week card is ProgressScreenView+Week.swift, its little theme
/// decoration ProgressScreenView+Decor.swift.
struct ProgressScreenView: View {
    @Environment(AppState.self) var state

    static let deepGreen = Color(hex: "#1F6B2E")
    static let paleGreen = Color(hex: "#C9E6CE")

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low).ignoresSafeArea()

            /* the cards outgrew the screen, so the page scrolls */
            ScrollView(.vertical, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 12) {
                    Text("progress")
                        .font(.fredoka(30, 700))
                        .rise(0, distance: 14, duration: 0.4)

                    levelCard
                        .rise(0.06, distance: 14, duration: 0.4)

                    ProgressWeekCard()
                        .rise(0.12, distance: 14, duration: 0.4)

                    if let breakdown = state.breakdown {
                        breakdownCard(breakdown)
                            .rise(0.15, distance: 14, duration: 0.4)
                    }

                    stats
                        .rise(0.18, distance: 14, duration: 0.4)
                }
                .padding(.horizontal, 20)
                .padding(.top, WebLayout.top(52))
                /* --tail: calc(116px + safe-bottom) clears the tab bar */
                .padding(.bottom, WebLayout.bottom(116))
            }
            #if DEBUG
            .defaultScrollAnchor(DemoSeed.flag("-scrollbottom") ? .bottom : .top)
            #endif
            .tourScrollable()
            .foregroundStyle(RC.ink)

            TabBar(active: "progress", skin: state.chosenRilo) { name in
                if let s = Screen(rawValue: name) { state.go(s) }
            }
        }
    }

    // MARK: level card

    private var levelCard: some View {
        let prog = Levels.levelProgress(state.xp, state.level)
        let nextSkin = prog.atMax ? nil : Levels.nextSkinAfter(state.level)
        return HStack(spacing: 10) {
            RiloView(skin: state.chosenRilo, mood: "proud", size: 84, motion: .jump, talks: true)

            VStack(alignment: .leading, spacing: 6) {
                Text("level \(state.level)")
                    .font(.fredoka(24, 700))
                XPBar(pct: Double(prog.pct))
                Text(prog.atMax ? "\(state.xp) xp · max level" : "\(state.xp) / \(prog.next ?? 0) xp")
                    .font(.inter(13, 600))
                    .foregroundStyle(Self.paleGreen)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            if let nextSkin {
                VStack(spacing: 2) {
                    RiloView(skin: nextSkin.skin, mood: "coach", size: 56, motion: .none)
                        .saturation(0.4)
                        .opacity(0.55)
                    Text("next: \(nextSkin.name) at level \(nextSkin.level)")
                        .font(.fredoka(10, 600))
                        .foregroundStyle(Self.paleGreen)
                        .multilineTextAlignment(.center)
                        .webLineHeight(10, 1.15)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(width: 74)
            }
        }
        .foregroundStyle(.white)
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(RC.ink)
            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 12, blur: 30))
        .tourTarget("progress-level", radius: 26)
    }

    // MARK: where your time goes

    private func breakdownCard(_ breakdown: Breakdown) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("where your time goes")
                .font(.fredoka(18, 600))
                .padding(.bottom, 10)
            BreakdownBars(breakdown: breakdown, compact: true, isPro: state.hasPro) {
                state.go(.upgrade)
            }
        }
        .padding(.vertical, 14 + 2)   // css border sits outside the padding
        .padding(.horizontal, 16 + 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(radius: 26, drop: 4)
    }

    // MARK: the three stats

    private var stats: some View {
        HStack(alignment: .top, spacing: 10) {
            Stat(value: "\(state.streak)", label: "day streak")
            Stat(value: "\(state.stats.saidNo)", label: "times you said no")
            Stat(value: Plan.fmtMins(Double(state.check.allows)), label: "your limits allow a day")
        }
        .fixedSize(horizontal: false, vertical: true)
    }
}

/// the dark card's XP bar (`fill 1.2s .3s ease-out`)
private struct XPBar: View {
    let pct: Double
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 5).fill(Color.white.opacity(0.18))
                RoundedRectangle(cornerRadius: 5)
                    .fill(LinearGradient(colors: [RC.greenPale, RC.green], startPoint: .leading, endPoint: .trailing))
                    .frame(width: geo.size.width * pct / 100 * (shown || reduce ? 1 : 0))
            }
        }
        .frame(height: 10)
        .clipShape(RoundedRectangle(cornerRadius: 5))
        .onAppear { withAnimation(.easeOut(duration: 1.2).delay(0.3)) { shown = true } }
    }
}

private struct Stat: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.fredoka(26, 700))
                .foregroundStyle(ProgressScreenView.deepGreen)
            Text(label)
                .font(.inter(12, 700))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 12 + 2)
        .padding(.horizontal, 6 + 2)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .sticker(radius: 22, drop: 3)
    }
}

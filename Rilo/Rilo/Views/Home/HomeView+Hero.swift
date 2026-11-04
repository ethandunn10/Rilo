import SwiftUI

/// 1. Rilo, big, in whatever mood the day has put him in. Tapping him opens
/// the chat — he is the way into talking, so he is the biggest thing here.
extension HomeView {
    var hero: some View {
        let shape = RoundedRectangle(cornerRadius: 26, style: .continuous)
        return ZStack(alignment: .bottomLeading) {
            theme.skyGradient

            HeroHills(back: theme.hills[1], front: theme.hills[2])
                .frame(height: 78)
                .frame(maxWidth: .infinity, alignment: .bottom)
                .frame(maxHeight: .infinity, alignment: .bottom)

            /* his line, top right */
            Text(state.riloNote.isEmpty ? "\(Plan.fmtMins(state.back.today)) saved today." : state.riloNote)
                .font(.inter(14, 700))
                .webLineHeight(14, 1.4)
                .foregroundStyle(RC.ink)
                .fixedSize(horizontal: false, vertical: true)
                .frame(width: 165, alignment: .leading)
                /* content-box: the 1.5px border sits outside the padding */
                .padding(.vertical, 12 + 1.5)
                .padding(.horizontal, 14 + 1.5)
                .background(bubbleShape.fill(RC.card))
                .overlay(bubbleShape.strokeBorder(HomeView.cardLine, lineWidth: 1.5))
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(.top, 30 + 1.5)
                .padding(.trailing, 16 + 1.5)

            Button { state.go(.talkchat) } label: {
                RiloView(skin: state.chosenRilo, mood: state.riloMood, size: 132)
                    .overlay(alignment: .bottomTrailing) {
                        ChatBadge()
                            .offset(x: 6, y: -2)
                    }
            }
            .buttonStyle(.tap(0.94))
            .accessibilityLabel("chat with rilo")
            .accessibilityValue(RiloView.spoken(state.riloMood))
            .tourTarget("home-talk")
            .padding(.leading, 16 + 1.5)
            .padding(.bottom, 24 + 1.5)
        }
        .frame(height: 210 + 3)   // content-box height + the border
        .clipShape(shape)
        .overlay(shape.strokeBorder(HomeView.cardLine, lineWidth: 1.5))
        .tourTarget("hero", radius: 26)
        .rise(0.06, distance: 14, duration: 0.5)
    }

    /// border-radius: 18px 18px 18px 6px
    private var bubbleShape: UnevenRoundedRectangle {
        UnevenRoundedRectangle(topLeadingRadius: 18, bottomLeadingRadius: 6,
                               bottomTrailingRadius: 18, topTrailingRadius: 18, style: .continuous)
    }
}

/// The two hills in the hero: an svg 100% wide x 78 tall, viewBox 350x90,
/// `xMidYMax slice` (scaled to cover, pinned to the bottom).
private struct HeroHills: View {
    let back: Color
    let front: Color

    var body: some View {
        GeometryReader { g in
            let s = max(g.size.width / 350, g.size.height / 90)
            let w = 350 * s, h = 90 * s
            ZStack {
                SVGPath("M0 40 C90 10 220 14 350 36 L350 90 L0 90 Z", w: 350, h: 90).fill(back)
                SVGPath("M0 70 C120 54 230 56 350 70 L350 90 L0 90 Z", w: 350, h: 90).fill(front)
            }
            .frame(width: w, height: h)
            .position(x: g.size.width / 2, y: g.size.height - h / 2)
        }
        .clipped()
        .allowsHitTesting(false)
        .accessibilityHidden(true)
    }
}

/// The dark "chat" pill on Rilo, pulsing (`pulse 2.2s ease-in-out infinite`:
/// a green ring that spreads 0 → 8px and fades, then comes back).
private struct ChatBadge: View {
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        HStack(spacing: 4) {
            ChatIcon(size: 14)
            Text("chat")
                .font(.fredoka(13, 600))
                .foregroundStyle(.white)
        }
        .padding(.leading, 6)
        .padding(.trailing, 9)
        .padding(.vertical, 4)
        .background(Capsule().fill(RC.ink))
        .background {
            TimelineView(.animation(paused: reduce)) { ctx in
                let p = reduce ? 0 : Motion.phase(ctx.date.timeIntervalSinceReferenceDate, period: 2.2)
                let k = Motion.bezier(p < 0.5 ? p * 2 : (1 - p) * 2, 0.42, 0, 0.58, 1)
                let spread = 8 * k
                Capsule()
                    .fill(Color.rgba(46, 139, 62, 0.5 * (1 - k)))
                    .padding(-spread)
            }
        }
    }
}

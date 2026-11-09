import SwiftUI

/* What Suggestion, Tired and Break share: Rilo's reply to a reason
   picked on the pop-up. Each is a `.scroll-y` column (padding 56px 22px 0,
   gap 14, --tail 28px) over the mid-hills sky, with a flex-grow spacer
   pushing the buttons to the bottom when it all fits. */

struct ReplyScreen<Content: View>: View {
    var tone: SkyView.Tone = .day
    var light = false
    @ViewBuilder var content: () -> Content

    var body: some View {
        ZStack {
            SkyView(hills: .mid, tone: tone).ignoresSafeArea()
            GeometryReader { geo in
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 14) {
                        content()
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, WebLayout.top(56))
                    /* --tail 28px, plus the flex gap before it */
                    .padding(.bottom, WebLayout.bottom(28 + 14))
                    .frame(minHeight: geo.size.height, alignment: .top)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
            .foregroundStyle(light ? .white : RC.ink)
        }
    }
}

/// "you said: i'm bored" — the pill at the top of each reply
struct YouSaidPill: View {
    let text: String
    var dusk = false

    var body: some View {
        Text(text)
            .font(.fredoka(15, 600))
            .padding(.vertical, 6 + (dusk ? 1 : 0))
            .padding(.horizontal, 14 + (dusk ? 1 : 0))
            .background(Capsule().fill(Color.white.opacity(dusk ? 0.14 : 0.6)))
            .overlay(dusk ? Capsule().strokeBorder(Color.white.opacity(0.3), lineWidth: 1) : nil)
            .frame(maxWidth: .infinity)
    }
}

/// border-radius: 24px 24px 24px 8px (the speech bubble's tail corner)
struct BubbleShape: InsettableShape {
    var radius: CGFloat = 24
    var tail: CGFloat = 8
    var inset: CGFloat = 0

    func path(in rect: CGRect) -> Path {
        let r = rect.insetBy(dx: inset, dy: inset)
        return UnevenRoundedRectangle(
            topLeadingRadius: max(0, radius - inset), bottomLeadingRadius: max(0, tail - inset),
            bottomTrailingRadius: max(0, radius - inset), topTrailingRadius: max(0, radius - inset),
            style: .continuous
        ).path(in: r)
    }

    func inset(by amount: CGFloat) -> BubbleShape {
        var s = self
        s.inset += amount
        return s
    }
}

extension View {
    /// a bubble/card with a solid fill, a border and a hard drop (`box-shadow: 0 Npx 0`)
    func bubble<S: InsettableShape>(_ shape: S, fill: Color, border: Color, width: CGFloat = 2,
                                    drop: CGFloat = 4, dropColor: Color = RC.line) -> some View {
        self
            .background(shape.fill(fill))
            .overlay(shape.strokeBorder(border, lineWidth: width))
            .background(drop > 0 ? DropShadowShape(base: shape, drop: drop).fill(dropColor) : nil)
    }

    /// the 12px uppercase label on the dark "do this instead" cards
    func eyebrow(_ color: Color) -> some View {
        self
            .font(.inter(12, 700))
            .tracking(12 * 0.08)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }
}

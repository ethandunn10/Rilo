import SwiftUI

/// Port of app/src/components/ProLock.jsx — a pro feature, shown as a locked
/// card instead of hidden, so the free tester can see what the trial gives.
///
/// The web's `style` prop is the card the caller spreads in (padding,
/// radius, background); here those are parameters. The dashed border always
/// replaces the card's own border, like the web.
struct ProLock: View {
    let title: String
    let sub: String
    var skin: String = "gold"
    var padding: EdgeInsets = EdgeInsets(top: 16, leading: 16, bottom: 16, trailing: 16)
    var radius: CGFloat = 24
    var fill: Color = RC.card
    var tourTarget: String? = nil
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .center, spacing: 10) {
                RiloView(skin: skin, mood: "coach", size: 56)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.fredoka(19, 600))
                        .foregroundStyle(RC.ink)
                    Text(sub)
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .multilineTextAlignment(.leading)
                Text("pro")
                    .font(.fredoka(12, 600))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 5)
                    .background(Capsule().fill(RC.ink))
                ProBadge()
            }
            .padding(padding)
            .background(RoundedRectangle(cornerRadius: radius, style: .continuous).fill(fill))
            .overlay(
                RoundedRectangle(cornerRadius: radius, style: .continuous)
                    .strokeBorder(Color.rgba(18, 48, 26, 0.3), style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
            )
        }
        .buttonStyle(.tap)
        .tourTarget(tourTarget, radius: radius)
    }
}

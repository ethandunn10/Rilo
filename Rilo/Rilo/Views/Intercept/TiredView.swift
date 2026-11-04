import SwiftUI

/// Port of app/src/screens/Tired.jsx (exact port of designs/Tired.dc.html).
/// Rilo's reply to "just tired". Uses the dusk sky.
struct TiredView: View {
    @Environment(AppState.self) private var state

    private static let glass = Color.rgba(18, 22, 48, 0.55)
    private static let glassLine = Color.white.opacity(0.55)
    private static let glassDrop = Color.white.opacity(0.35)

    var body: some View {
        let minutes = state.settingOf(state.currentApp).minutes

        ReplyScreen(tone: .dusk, light: true) {
            YouSaidPill(text: "you said: just tired", dusk: true)

            RiloView(skin: state.chosenRilo, mood: "sleepy", size: 170, talks: true)
                .frame(maxWidth: .infinity)

            Text("brain's fried? scrolling won't fix that. ten minutes of nothing will.")
                .font(.fredoka(21, 600))
                .webLineHeight(21, 1.3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 16 + 2)
                .padding(.horizontal, 18 + 2)
                .bubble(BubbleShape(), fill: Self.glass, border: Self.glassLine, dropColor: Self.glassDrop)
                .rise(0.1, duration: 0.6)

            VStack(alignment: .leading, spacing: 4) {
                Text("try this").eyebrow(Color(hex: "#C8CDF0"))
                Text("phone face down, 10 min").font(.fredoka(24, 600))
                Text("lie down, music on, eyes closed · +20 xp")
                    .font(.inter(14, 600))
                    .foregroundStyle(Color(hex: "#D9DCF2"))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18 + 2)
            .bubble(RoundedRectangle(cornerRadius: 24, style: .continuous),
                    fill: Self.glass, border: Self.glassLine, dropColor: Self.glassDrop)
            .rise(0.2, duration: 0.6)

            Spacer(minLength: 0)

            VStack(spacing: 8) {
                Button { state.tiredSaidNo() } label: {
                    Text("okay, resting")
                        .font(.fredoka(20, 600))
                        .foregroundStyle(Color(hex: "#1E2850"))
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Capsule().fill(.white))
                        .cssShadow(Color.rgba(10, 10, 40, 0.3), y: 10, blur: 30)
                }
                .buttonStyle(.tap)
                Button { state.startSession(Double(minutes), reason: "tired") } label: {
                    Text("give me \(minutes) minutes")
                        .font(.fredoka(18, 600))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Capsule().fill(Color.white.opacity(0.12)))
                        .overlay(Capsule().strokeBorder(Color.white.opacity(0.6), lineWidth: 1.5))
                }
                .buttonStyle(.tap)
            }
            .rise(0.3, duration: 0.6)
        }
    }
}

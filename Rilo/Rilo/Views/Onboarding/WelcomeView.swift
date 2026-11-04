import SwiftUI

/// Port of app/src/screens/Welcome.jsx. Paints its own sky, the theme's
/// sky things and the hills (it does not use SkyView).
struct WelcomeView: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme

    var body: some View {
        ZStack(alignment: .bottom) {
            theme.skyGradient.ignoresSafeArea()
            ThemeDecor()
            HillsView(boxHeight: 360)
                .frame(height: 360)
                .frame(maxWidth: .infinity)
                .ignoresSafeArea(edges: .bottom)

            VStack(spacing: 0) {
                column
                pinned
            }
        }
    }

    /* content column: scrolls when the phone is short */
    private var column: some View {
        GeometryReader { geo in
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    VStack(spacing: 14) {
                        Text("rilo")
                            .font(.fredoka(17, 600))
                            .foregroundStyle(RC.welcomeGreen)
                            .padding(.vertical, 7 + 2)   // css border sits outside the padding
                            .padding(.horizontal, 16 + 2)
                            .capsuleSticker(fill: RC.card, drop: 3)
                        Text("hey, i'm rilo.")
                            .font(.fredoka(44, 700))
                            .webLineHeight(44, 1.02)
                            .foregroundStyle(RC.ink)
                            .multilineTextAlignment(.center)
                        Text("your screen-time buddy. i don't just block your apps, i help you figure out what to do instead.")
                            .font(.inter(17, 600))
                            .webLineHeight(17, 1.45)
                            .foregroundStyle(RC.body)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .rise()

                    /* pushes Rilo to the bottom when there's room */
                    Spacer(minLength: 10)

                    RiloView(skin: AppState.OG_SKIN, mood: "wave", size: 210, motion: .jump, talks: true)
                        .padding(.bottom, 10 + 14)   // --tail + the column gap
                }
                .padding(.top, WebLayout.top(56))
                .padding(.horizontal, 28)
                .frame(maxWidth: .infinity, minHeight: geo.size.height)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
    }

    /* pinned: always reachable */
    private var pinned: some View {
        VStack(spacing: 8) {
            PillButton(title: "let's go") { state.go(.name) }
            Button { state.go(.home) } label: {
                Text("i already have an account")
                    .font(.inter(15, 600))
                    .foregroundStyle(.white)
                    .padding(10)
            }
            .buttonStyle(.plainTap)
        }
        .padding(.top, 8)
        .padding(.horizontal, 24)
        .padding(.bottom, WebLayout.bottom(34))
        .rise(0.25)
    }
}

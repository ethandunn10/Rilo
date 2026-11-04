import SwiftUI

/// Port of app/src/screens/ShareCard.jsx — the weekly card, sized 9:16 for
/// stories.
///
/// PORT_PLAN: the iOS version only SHOWS the card for now. The web's "save
/// image" draws it to a canvas and downloads a PNG; the real iOS share
/// sheet comes later, so the button is here (same look) but does nothing
/// yet. No photo library access, no permissions.
///
/// The web gives the card `linear-gradient(180deg, ${theme.sky}, ...)`, but
/// theme.sky is itself a gradient, so that CSS is invalid and the card is
/// see-through: it shows the page's sky with a border and a soft shadow
/// around it. Same here.
struct ShareCardView: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme

    var body: some View {
        let back = state.back

        ZStack {
            theme.skyGradient.ignoresSafeArea()

            VStack(spacing: 12) {
                Text("your week")
                    .font(.fredoka(26, 700))

                /* the card itself, 9:16 */
                VStack(spacing: 0) {
                    VStack(spacing: 0) {
                        Text("rilo")
                            .font(.inter(13, 700))
                            .foregroundStyle(RC.ink2)
                        Text("time i got back")
                            .font(.fredoka(22, 700))
                            .padding(.top, 6)
                        Text(Plan.fmtMins(back.week))
                            .font(.fredoka(44, 700))
                            .foregroundStyle(ProgressScreenView.deepGreen)
                            .frame(height: 44)   // line-height: 1
                            .padding(.top, 6)
                        Text("this week")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                            .padding(.top, 2)
                    }

                    Spacer(minLength: 0)
                    RiloView(skin: state.chosenRilo, mood: "proud", size: 150, talks: true)
                    Spacer(minLength: 0)

                    VStack(spacing: 0) {
                        Text("\(state.streak) day streak")
                            .font(.fredoka(20, 700))
                        Text("level \(state.level) · \(Plan.fmtMins(back.total)) back in total")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                            .padding(.top, 2)
                    }
                }
                .multilineTextAlignment(.center)
                .padding(18 + 2)   // css border sits outside the padding
                /* width: 100%, max-width: 300, aspect-ratio 9 / 16 */
                .frame(width: 300, height: 300 * 16 / 9)
                .background(ShadowOnly(radius: 26))
                .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(RC.line, lineWidth: 2))

                Spacer(minLength: 6)

                Button {
                    /* PORT_PLAN: shows the card only; the share sheet comes later */
                } label: {
                    Text("save image")
                        .font(.fredoka(19, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Capsule().fill(.white)
                            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30))
                }
                .buttonStyle(.tap)

                Button { state.go(.progress, dir: .back) } label: {
                    Text("back")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(RC.ink)
                        .padding(8)
                }
                .buttonStyle(.tap)
            }
            .padding(.horizontal, 22)
            .padding(.top, WebLayout.top(44))
            .padding(.bottom, WebLayout.bottom(26))
            .foregroundStyle(RC.ink)
        }
    }
}

/// `box-shadow: 0 16px 40px rgba(10,40,20,0.25)` on a see-through box: the
/// shadow only shows outside the shape, like CSS.
private struct ShadowOnly: View {
    let radius: CGFloat

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: radius, style: .continuous)
        shape
            .fill(.white)
            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 16, blur: 40)
            .overlay(shape.fill(.white).blendMode(.destinationOut))
            .compositingGroup()
    }
}

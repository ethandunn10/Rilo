import SwiftUI

/// Port of app/src/screens/Suggestion.jsx (exact port of designs/Suggestion.dc.html).
/// Rilo's reply to "i'm bored". The activity comes from the hobbies picked
/// in onboarding.
struct SuggestionView: View {
    @Environment(AppState.self) private var state

    /// "suggest something else" walks their other hobbies; with only one
    /// there's nothing else to suggest, so the button says "not right now"
    @State private var nth: Int = {
        #if DEBUG
        /* DEBUG `-suggestnth n`: as if "suggest something else" was tapped n times */
        return DemoSeed.arg("-suggestnth").flatMap(Int.init) ?? 0
        #else
        return 0
        #endif
    }()

    var body: some View {
        let app = state.currentApp
        let minutes = state.settingOf(app).minutes
        let s = Profile.suggestion(state.about, app: app, nth: nth)
        let more = Profile.pickedHobbies(state.about).count > 1

        ReplyScreen {
            YouSaidPill(text: "you said: i'm bored")

            RiloView(skin: state.chosenRilo, mood: "coach", size: 170, motion: .jump, talks: true)
                .frame(maxWidth: .infinity)

            Text(s.bubble)
                .font(.fredoka(21, 600))
                .webLineHeight(21, 1.3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 16 + 2)
                .padding(.horizontal, 18 + 2)
                .bubble(BubbleShape(), fill: RC.card, border: RC.line)
                .rise(0.1, duration: 0.5)

            VStack(alignment: .leading, spacing: 4) {
                Text("do this instead").eyebrow(Color(hex: "#9FD8A9"))
                Text(s.task).font(.fredoka(24, 600))
                Text(s.meta).font(.inter(14, 600)).foregroundStyle(Color(hex: "#C9E6CE"))
            }
            .foregroundStyle(.white)
            .accessibilityElement(children: .combine)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(RC.ink))
            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 12, blur: 30)
            .rise(0.2, duration: 0.5)

            Spacer(minLength: 0)

            VStack(spacing: 8) {
                PillButton(title: "i'm going", height: 56) { state.suggestionSaidNo() }
                Button { state.startSession(Double(minutes), reason: "bored") } label: {
                    Text("give me \(minutes) minutes")
                        .font(.fredoka(18, 600))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Capsule().fill(Color.white.opacity(0.92)))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                }
                .buttonStyle(.tap)
                Button {
                    if more { nth += 1 } else { state.go(.home, dir: .back) }
                } label: {
                    Text(more ? "suggest something else" : "not right now")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(6)
                }
                .buttonStyle(.plainTap)
            }
            .rise(0.3, duration: 0.5)
        }
    }
}

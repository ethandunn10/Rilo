import SwiftUI

/// Port of app/src/screens/Name.jsx: "what should i call you?" One field,
/// one tap, no confirm. Return or the arrow goes straight on.
struct NameView: View {
    @Environment(AppState.self) private var state
    var next: Screen = .pickapps

    @State private var draft = ""
    @FocusState private var focused: Bool

    private var ready: Bool { !draft.trimmingCharacters(in: .whitespaces).isEmpty }

    private func onward() {
        state.name = draft.trimmingCharacters(in: .whitespaces)
        state.go(next)
    }

    var body: some View {
        ZStack {
            SkyView(hills: .low)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    Dots(active: 1)
                    BackButton { state.goTo(.welcome, dir: .back) }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    RiloView(skin: AppState.OG_SKIN, mood: "wave", size: 190, talks: true)
                    Text("what should i call you?")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(30, 700))
                        .webLineHeight(30, 1.1)
                        .foregroundStyle(RC.ink)
                        .multilineTextAlignment(.center)
                    form
                    Button {
                        state.name = ""
                        state.go(next)
                    } label: {
                        Text("skip")
                            .font(.fredoka(15, 600))
                            .foregroundStyle(RC.ink2)
                            .underline()
                            .padding(6)
                    }
                    .buttonStyle(.tap)
                }
                .padding(.top, WebLayout.top(56))
                .padding(.horizontal, 24)
                .padding(.bottom, 12 + 14)   // --tail + the column gap
            }
            .scrollDismissesKeyboard(.never)
        }
        .onAppear {
            draft = state.name
            focused = true
        }
    }

    private var form: some View {
        HStack(spacing: 9) {
            TextField("", text: $draft, prompt: Text("first name").foregroundStyle(Color(hex: "#757575")))
                .focused($focused)
                .accessibilityLabel("first name")
                .font(.fredoka(19, 600))
                .foregroundStyle(RC.ink)
                .tint(RC.ink)
                .textContentType(.givenName)
                .textInputAutocapitalization(.words)
                .autocorrectionDisabled()
                .submitLabel(.go)
                .onSubmit { if ready { onward() } }
                .padding(.horizontal, 20)
                .frame(height: 58)
                .capsuleSticker(fill: .white, drop: 4)

            Button(action: onward) {
                SVGPath("M5 12h12M12 6l6 6-6 6")
                    .stroke(.white, style: .svg(2.6))
                    .frame(width: 24, height: 24)
                    .frame(width: 58, height: 58)
                    .background(Circle().fill(ready ? RC.ink : RC.ink.opacity(0.18)))
                    .animation(.easeOut(duration: 0.18), value: ready)
            }
            .buttonStyle(.tap)
            .disabled(!ready)
            .accessibilityLabel("continue")
        }
        .frame(maxWidth: .infinity)
    }
}

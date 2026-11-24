import SwiftUI

/// "which app is this?" (real Screen Time, right after Apple's picker).
/// Apple only gives Rilo sealed tokens, so the person tells Rilo once which
/// app each one is: Apple draws the real name and icon, they tap the match.
/// That's what lets the Shortcuts check-in unlock the right app and send
/// them back into it. Names stay on the phone (AppMatch).
struct MatchAppsView: View {
    @Environment(AppState.self) private var state
    /// bumps when a match changes (AppMatch lives outside the observed state)
    @State private var rev = 0
    @State private var typing: String? = nil
    @State private var typed = ""
    @FocusState private var focused: Bool

    /// the one-tap list (the rest of AppMatch.KNOWN can be typed)
    static let QUICK = ["instagram", "tiktok", "youtube", "snapchat", "x", "reddit", "facebook", "threads"]

    var body: some View {
        let keys = state.tracked
        let _ = rev
        let matched = keys.filter { AppMatch.name(for: $0) != nil }.count

        ZStack {
            SkyView(hills: .low)
            VStack(spacing: 14) {
                Dots(active: 3)
                BackButton { state.goTo(state.onboarded ? .you : .pickapps, dir: .back) }
                    .frame(maxWidth: .infinity, alignment: .leading)
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("which app is which?")
                            .font(.fredoka(32, 700))
                            .foregroundStyle(RC.ink)
                            .accessibilityAddTraits(.isHeader)
                        Text("apple keeps your apps private, even from me. tap the match so i can send you back into the right one.")
                            .font(.inter(16, 600))
                            .foregroundStyle(RC.ink2)
                            .fixedSize(horizontal: false, vertical: true)
                        ForEach(keys, id: \.self) { key in row(key) }
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.horizontal, -4)

                PillButton(title: matched == keys.count ? "continue" : "continue (\(keys.count - matched) not matched)") {
                    /* after onboarding (from the You tab) it just goes back */
                    if state.onboarded { state.syncScreenTime(force: true); state.goTo(.you, dir: .back) }
                    else { state.go(.automation) }
                }
                if matched < keys.count {
                    Text("apps you don't match just use the shield.")
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                }
            }
            .padding(.top, WebLayout.top(56))
            .padding(.horizontal, 24)
            .padding(.bottom, WebLayout.bottom(34))
        }
    }

    @ViewBuilder
    private func row(_ key: String) -> some View {
        let said = AppMatch.name(for: key)
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                RiloAppLabel(key: key)
                    .font(.fredoka(19, 600))
                    .foregroundStyle(RC.ink)
                    .lineLimit(1)
                Spacer(minLength: 6)
                if let said {
                    Text("✓ \(said)")
                        .font(.fredoka(16, 700))
                        .foregroundStyle(RC.greenDeep)
                }
            }
            ChipFlow(spacing: 6) {
                ForEach(Self.QUICK, id: \.self) { n in
                    /* a lone "x" reads as a close button */
                    chip(n == "x" ? "x (twitter)" : n, on: said == n) { set(n, key) }
                }
                chip(said != nil && !Self.QUICK.contains(said!) ? said! : "other…",
                     on: said != nil && !Self.QUICK.contains(said!)) {
                    typed = ""
                    typing = key
                    focused = true
                }
            }
            if typing == key {
                HStack(spacing: 8) {
                    TextField("type the app's name", text: $typed)
                        .font(.fredoka(17, 600))
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focused)
                        .submitLabel(.done)
                        .onSubmit { set(typed, key); typing = nil }
                        .padding(.vertical, 10)
                        .padding(.horizontal, 14)
                        .background(Capsule().fill(.white))
                    Button("save") { set(typed, key); typing = nil }
                        .font(.fredoka(17, 700))
                        .foregroundStyle(RC.greenDeep)
                        .disabled(typed.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(fill: RC.card, radius: 22, drop: 3)
    }

    private func chip(_ label: String, on: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.fredoka(16, 600))
                .foregroundStyle(on ? .white : RC.ink)
                .padding(.vertical, 9)
                .padding(.horizontal, 14)
                .background(Capsule().fill(on ? RC.ink : Color.white))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func set(_ name: String, _ key: String) {
        AppMatch.set(name, for: key)
        track("match", AppMatch.name(for: key) == nil ? "cleared" : "matched one")
        rev += 1
    }
}

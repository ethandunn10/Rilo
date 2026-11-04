import SwiftUI

/// The pinned composer under the Talk screen: quick-answer chips, the text
/// field and the round send button. Pinned with safeAreaInset, so it rides
/// on top of the keyboard and never hides behind it.
extension TalkView {
    var composer: some View {
        VStack(spacing: 9) {
            /* tap instead of type, wherever that's possible */
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 7) {
                    ForEach(Self.QUICK, id: \.self) { label in
                        TalkChip(label: label, on: picked.contains(label)) { choose(label) }
                    }
                }
                .padding(.bottom, 2)
            }

            HStack(spacing: 8) {
                TalkField(draft: Binding(get: { draft }, set: { draft = $0 }),
                          placeholder: picked.isEmpty ? Self.PLACEHOLDER : "anything else? or just send",
                          onSubmit: send)

                if speech.isAvailable {
                    MicButton(listening: listening, size: 52, disabled: thinking,
                              onStart: startMic, onStop: stopMic)
                }

                Button(action: send) {
                    SVGPath("M5 12h12M12 6l6 6-6 6")
                        .stroke(.white, style: .svg(2.6))
                        .frame(width: 22, height: 22)
                        .frame(width: 52, height: 52)
                        .background(Circle().fill(ready ? RC.ink : Color.rgba(18, 48, 26, 0.18)))
                        .animation(.easeOut(duration: 0.18), value: ready)
                }
                .buttonStyle(.tap)
                .disabled(!ready)
                .accessibilityLabel("send")
            }
        }
        .padding(.top, 10)
        .padding(.horizontal, 14)
        .padding(.bottom, 14)
        .background(
            RC.card
                .overlay(alignment: .top) { RC.line.frame(height: 2) }
                .ignoresSafeArea(edges: .bottom)
        )
    }
}

private struct TalkChip: View {
    let label: String
    let on: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(on ? "✓ \(label)" : label)
                .font(.fredoka(15, 600))
                .foregroundStyle(on ? .white : RC.ink)
                .lineLimit(1)
                .fixedSize()
                .padding(.horizontal, 15)
                .frame(minHeight: 40)
                .background(Capsule().fill(on ? RC.greenDeep : Color.white.opacity(0.92)))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

private struct TalkField: View {
    @Binding var draft: String
    let placeholder: String
    let onSubmit: () -> Void

    var body: some View {
        TextField("", text: $draft, prompt: Text(placeholder).foregroundStyle(Color(hex: "#757575")))
            .font(.inter(16, 600))
            .foregroundStyle(RC.ink)
            .tint(RC.ink)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled(false)
            .submitLabel(.send)
            .onSubmit(onSubmit)
            .padding(.horizontal, 18)
            .frame(height: 52)
            .background(Capsule().fill(.white))
            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
    }
}

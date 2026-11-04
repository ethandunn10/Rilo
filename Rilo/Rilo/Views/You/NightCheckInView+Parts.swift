import SwiftUI

/// The pieces of the night check-in: top row, his line, the pill, the
/// typing row, what he made of it, and the demo shortcut.
extension NightCheckInView {
    /* Top row, the same shape as the Talk screen: one clearly tappable
       button on the left. */
    var topRow: some View {
        HStack(spacing: 8) {
            Button { state.nightCheckInSkip() } label: {
                Text("close")
                    .font(.fredoka(16, 600))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .frame(minHeight: 40)
                    .background(Capsule().fill(Color.white.opacity(0.14)))
                    .overlay(Capsule().strokeBorder(Color.white.opacity(0.6), lineWidth: 2))
            }
            .buttonStyle(.tap)
            Spacer(minLength: 0)
            Text("CHECK-IN")
                .font(.inter(12, 700))
                .tracking(1.2)
                .opacity(0.7)
            Spacer(minLength: 0)
            /* keeps the label centred against the button on the left */
            Color.clear.frame(width: 72, height: 1)
        }
        .frame(maxWidth: .infinity, minHeight: 40)
    }

    var bubble: some View {
        ShrinkToFit {
            VStack(spacing: 5) {
                Text(done ? reply.line : q.ask)
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(22, 600))
                    .webLineHeight(22, 1.2)
                if !done, let sub = q.sub {
                    Text(sub)
                        .font(.inter(12.5, 600))
                        .opacity(0.75)
                }
            }
        }
        .multilineTextAlignment(.center)
        .padding(.vertical, 14)
        .padding(.horizontal, 18)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Color.white.opacity(0.12)))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous)
            .strokeBorder(Color.white.opacity(0.4), lineWidth: 2))
        .frame(maxWidth: 360)   // 320 content-box + padding + border
        .fixedSize(horizontal: false, vertical: true)
    }

    var pill: some View {
        Text(listening ? "let go to stop · \(left)s"
                       : speech.isAvailable ? "hold rilo and say it" : "thirty seconds, that's it")
            .accessibilityLabel(listening ? "let go to stop, \(left) seconds"
                                : speech.isAvailable ? "hold rilo and say it" : "thirty seconds, that's it")
            .font(.fredoka(16, 600))
            .foregroundStyle(listening ? Color(hex: "#2B3A6B") : .white)
            .padding(.vertical, 8)
            .padding(.horizontal, 18)
            .background(Capsule().fill(listening ? Color.white : Color.white.opacity(0.16)))
            .overlay(Capsule().strokeBorder(Color.white.opacity(0.5), lineWidth: 2))
    }

    var form: some View {
        HStack(spacing: 8) {
            TextField("", text: $draft,
                      prompt: Text("type it…").foregroundStyle(Color(hex: "#757575")))
                .focused($focused)
                /* the web input sets no font-family, so it's the system font */
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Color(hex: "#2B3A6B"))
                .tint(Color(hex: "#2B3A6B"))
                .submitLabel(.send)
                .accessibilityLabel("your answer")
                .onSubmit { answer(draft) }
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Capsule().fill(Color.white.opacity(0.95)))
                .overlay(Capsule().strokeBorder(Color.white.opacity(0.5), lineWidth: 2))
                .disabled(listening)

            ghost("send") { answer(draft) }
            /* the first-week question is the only skippable one */
            if q.id == "ask" {
                ghost("skip") {
                    state.nightAskSkip()
                    done = true
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    func ghost(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.fredoka(16, 600))
                .foregroundStyle(.white)
                .fixedSize()
                .padding(.horizontal, 18)
                .frame(minHeight: 48)
                .background(Capsule().fill(Color.white.opacity(0.12)))
                .overlay(Capsule().strokeBorder(Color.white.opacity(0.5), lineWidth: 2))
        }
        .buttonStyle(.tap)
    }

    /* what he made of it. The web card is `width: 100%` plus its own
       padding and border (content-box), so it pokes 16pt past each side. */
    var tomorrowCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("tomorrow").font(.fredoka(18, 600))
                .accessibilityAddTraits(.isHeader)
            if tasks.isEmpty {
                Text("nothing booked. i'll keep your usual plan.")
                    .font(.inter(14, 600))
                    .opacity(0.8)
            } else {
                ForEach(tasks, id: \.title) { t in
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(t.title).font(.fredoka(16, 600))
                        Text(t.note).font(.inter(12, 600)).opacity(0.75)
                    }
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Color.white.opacity(0.12)))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous)
            .strokeBorder(Color.white.opacity(0.35), lineWidth: 2))
        .padding(.horizontal, -16)
    }

    /* DEMO ONLY: see the whole thing without typing */
    var demoFill: some View {
        Button {
            said = MockAI.DEMO_NIGHT
            done = true
            track("night", "demo: filled it in")
        } label: {
            Text("demo: fill it in for me")
                .font(.fredoka(13, 600))
                .foregroundStyle(Color.white.opacity(0.65))
                .underline()
                .padding(4)
        }
        .buttonStyle(.tap)
    }
}

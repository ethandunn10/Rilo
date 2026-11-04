import SwiftUI

/// Port of app/src/components/AskCard.jsx: one of Rilo's first-week
/// questions, in the place it belongs. A card, not a screen, and every one
/// can be waved off: "not now" is a real button the size of the answers.
///
/// `light` is the version on the dark night check-in. App.jsx builds it
/// with `askProps(ask)`; `AskCard(ask:state:)` does the same here.
struct AskCard: View {
    let ask: Ask?
    var skin: String? = nil
    var light = false
    var onAnswer: ([String]) -> Void = { _ in }
    var onSkip: () -> Void = {}
    var onCta: () -> Void = {}

    @State private var picked: [String] = []
    @State private var typed = ""

    private static let night = Color(hex: "#2B3A6B")

    private var ink: Color { light ? .white : RC.ink }
    private var edge: Color { light ? Color.white.opacity(0.55) : RC.line }
    private var ready: Bool { !picked.isEmpty || !typed.trimmingCharacters(in: .whitespaces).isEmpty }

    var body: some View {
        if let ask { card(ask) }
    }

    private func toggle(_ ask: Ask, _ id: String) {
        if !ask.multi {
            /* single choice: the tap is the answer */
            onAnswer([id])
            return
        }
        picked = picked.contains(id) ? picked.filter { $0 != id } : picked + [id]
    }

    private func save() {
        let extra = typed.trimmingCharacters(in: .whitespaces).lowercased()
        onAnswer(extra.isEmpty ? picked : picked + [extra])
    }

    private func card(_ ask: Ask) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                if let skin { RiloView(skin: skin, mood: "curious", size: 54) }
                VStack(alignment: .leading, spacing: 3) {
                    Text(ask.ask)
                        .font(.fredoka(18, 600))
                        .webLineHeight(18, 1.2)
                        .fixedSize(horizontal: false, vertical: true)
                    if !ask.sub.isEmpty {
                        Text(ask.sub + (ask.optional ? " · optional" : ""))
                            .font(.inter(13, 600))
                            .opacity(0.75)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            if !ask.options.isEmpty {
                ChipFlow(spacing: 7) {
                    ForEach(ask.options, id: \.id) { o in
                        let on = picked.contains(o.id)
                        Button { toggle(ask, o.id) } label: {
                            Text(o.label)
                                .font(.fredoka(15, 600))
                                .foregroundStyle(on ? (light ? Self.night : .white) : (light ? .white : RC.ink))
                                .padding(.horizontal, 14 + 2)
                                .frame(minHeight: 42)
                                .background(Capsule().fill(on ? (light ? .white : RC.greenDeep)
                                                              : (light ? Color.white.opacity(0.14) : .white)))
                                .overlay(Capsule().strokeBorder(edge, lineWidth: 2))
                        }
                        .buttonStyle(.tap)
                        .accessibilityAddTraits(on ? .isSelected : [])
                    }
                }
            }

            if ask.typed {
                TextField("", text: $typed, prompt: Text("or type your own\u{2026}").foregroundStyle(Color.rgba(18, 48, 26, 0.45)))
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink)
                    .padding(.horizontal, 14 + 2)
                    .frame(height: 46)
                    .background(Capsule().fill(light ? Color.white.opacity(0.95) : .white))
                    .overlay(Capsule().strokeBorder(light ? Color.white.opacity(0.5) : RC.line, lineWidth: 2))
            }

            HStack(spacing: 8) {
                Button(action: onSkip) {
                    Text("not now")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(ink)
                        .padding(.horizontal, 16 + 2)
                        .frame(minHeight: 46)
                        .background(Capsule().fill(light ? Color.white.opacity(0.14) : .clear))
                        .overlay(Capsule().strokeBorder(edge, lineWidth: 2))
                }
                .buttonStyle(.tap)

                if let cta = ask.cta {
                    Button(action: onCta) {
                        Text(cta)
                            .font(.fredoka(16, 600))
                            .foregroundStyle(light ? Self.night : .white)
                            .frame(maxWidth: .infinity, minHeight: 46)
                            .background(Capsule().fill(light ? .white : RC.greenDeep))
                            .overlay(Capsule().strokeBorder(edge, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                }

                if ask.multi || ask.typed {
                    Button(action: save) {
                        Text("that's it")
                            .font(.fredoka(16, 600))
                            .foregroundStyle(ready ? (light ? Self.night : .white) : Color.rgba(18, 48, 26, 0.45))
                            .frame(maxWidth: .infinity, minHeight: 46)
                            .background(Capsule().fill(ready ? (light ? .white : RC.greenDeep) : Color.rgba(18, 48, 26, 0.12)))
                            .overlay(Capsule().strokeBorder(edge, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                    .disabled(!ready)
                }
            }
        }
        .foregroundStyle(ink)
        .padding(.vertical, 14 + 2)
        .padding(.horizontal, 16 + 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .modifier(AskCardSurface(light: light))
        .rise(0, distance: 18, duration: 0.5)
    }
}

private struct AskCardSurface: ViewModifier {
    let light: Bool
    func body(content: Content) -> some View {
        if light {
            content
                .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Color.white.opacity(0.12)))
                .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(Color.white.opacity(0.4), lineWidth: 2))
        } else {
            content.sticker(fill: RC.card, radius: 26, drop: 4)
        }
    }
}

extension AskCard {
    /// App.jsx's `<AskCard {...askProps(ask)} />`
    init(ask: Ask, state: AppState, light: Bool = false) {
        self.init(ask: ask, skin: state.chosenRilo, light: light,
                  onAnswer: { state.answerAsk(ask.id, $0) },
                  onSkip: { state.skipAsk(ask.id) },
                  onCta: { state.ctaAsk(ask.id) })
    }
}

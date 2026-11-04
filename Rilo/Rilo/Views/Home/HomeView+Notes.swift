import SwiftUI

/// The things that float over Home above the tab bar (a toast, or the
/// step-down sheet), one at a time in the web's order, and the strict-mode
/// pop-up in the middle.
extension HomeView {
    @ViewBuilder
    var notes: some View {
        let overNote = state.overNote
        let phase = state.stepPhase
        if !overNote.isEmpty {
            /* over the time they promised on the way in */
            HomeToast(fill: Color.white.opacity(0.92), action: { state.overNote = "" }) {
                RiloView(skin: state.chosenRilo, mood: "letdown", size: 58)
                Text(overNote)
                    .font(.fredoka(16, 600))
                    .webLineHeight(16, 1.25)
                    .foregroundStyle(RC.ink)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .zIndex(15)
        } else if let phase {
            /* the weekly step-down: a preview a day ahead, then the offer (§11) */
            stepSheet(phase).zIndex(20)
        } else if let saved = state.savedNote, !state.suggestStrict {
            /* closed it early — the minutes they didn't spend are still theirs */
            HomeToast(fill: Color.white.opacity(0.9), action: { state.savedNote = nil }) {
                RiloView(skin: state.chosenRilo, mood: "proud", size: 58)
                VStack(alignment: .leading, spacing: 2) {
                    Text("you shut \(saved.app) \(saved.mins) min early.")
                        .font(.fredoka(17, 600))
                        .webLineHeight(17, 1.2)
                    Text("that's still yours today.")
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                }
                .foregroundStyle(RC.ink)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .zIndex(15)
        }
    }

    private func stepCard(_ phase: String) -> some View {
        StepDownCard(
            skin: state.chosenRilo,
            app: state.stepApp,
            step: state.stepProposal,
            phase: phase,
            strictOn: state.strict.on,
            swappable: phase == "offered" ? state.stepSwappable : [],
            skipAt: state.step.skipAt,
            done: state.stepFinished,
            spacing: 9,
            onAccept: { state.acceptStepDown() },
            onSkip: { state.skipStepDown() },
            onSwap: { state.swapStepDown($0) })
            .padding(.vertical, 12 + 2)
            .padding(.horizontal, 14 + 2)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func stepSheet(_ phase: String) -> some View {
        HomeStepSheet { stepCard(phase) }
    }
}

/// The step-down sheet: as tall as its card, scrolling only past 52% of
/// the screen (the web's max-height: 52%).
struct HomeStepSheet<Card: View>: View {
    @ViewBuilder let card: Card
    @State private var cardH: CGFloat = 0

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 24, style: .continuous)
        GeometryReader { g in
            VStack {
                Spacer(minLength: 0)
                ScrollView(showsIndicators: false) {
                    card.onGeometryChange(for: CGFloat.self, of: { $0.size.height }) { cardH = $0 }
                }
                .scrollBounceBehavior(.basedOnSize)
                .frame(height: min(cardH, g.size.height * 0.52))
                .background(shape.fill(Color.white.opacity(0.97)))
                .clipShape(shape)
                .overlay(shape.strokeBorder(RC.line, lineWidth: 2))
                .cssShadow(Color.rgba(10, 40, 20, 0.28), y: 16, blur: 40)
            }
            .padding(.horizontal, 12)
            .padding(.bottom, HomeToastLayout.bottom)
        }
        .rise(0, duration: 0.4)
    }
}

/// A toast above the tab bar: Rilo and a line, tap to clear.
/// (left/right 12, bottom 96 on the web = just above the 94px tab bar)
struct HomeToast<Content: View>: View {


    var fill: Color
    let action: () -> Void
    @ViewBuilder let content: Content

    var body: some View {
        Button(action: action) {
            HStack(alignment: .center, spacing: 10) { content }
                .padding(.vertical, 12 + 2)
                .padding(.horizontal, 14 + 2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(fill))
                .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityHint("tap to clear")
        .padding(.horizontal, 12)
        .padding(.bottom, HomeToastLayout.bottom)
        .frame(maxHeight: .infinity, alignment: .bottom)
        .rise(0, duration: 0.4)
    }
}

/// Two days over the goal in a row and Rilo offers strict mode. A centred
/// pop-up: it's a yes/no question. Saying no is one tap and he won't ask
/// again today.
struct HomeStrictAsk: View {
    let skin: String
    let onYes: () -> Void
    let onNo: () -> Void
    @State private var shown = false

    var body: some View {
        ZStack {
            Color.rgba(12, 30, 18, 0.45)
                .background(.ultraThinMaterial.opacity(0.35))
                .ignoresSafeArea()
                .opacity(shown ? 1 : 0)

            VStack(spacing: 8) {
                RiloView(skin: skin, mood: "letdown", size: 120, talks: true)
                Text("that's two days over.")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(23, 700))
                    .webLineHeight(23, 1.2)
                Text("want me to get strict for a week? no half opens, no borrowing, and loosening anything waits 24 hours. your pass still works.")
                    .font(.inter(14, 600))
                    .webLineHeight(14, 1.4)
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
                Button(action: onYes) {
                    Text("yeah, lock it down")
                        .font(.fredoka(18, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(Capsule().fill(RC.ink))
                        .cssShadow(Color.rgba(10, 40, 20, 0.3), y: 8, blur: 22)
                }
                .buttonStyle(.tap(0.94))
                .padding(.top, 4)
                Button(action: onNo) {
                    Text("no, i've got it")
                        .font(.fredoka(17, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
            .multilineTextAlignment(.center)
            .foregroundStyle(RC.ink)
            .padding(.top, 18 + 2)
            .padding(.horizontal, 18 + 2)
            .padding(.bottom, 16 + 2)
            /* content-box: max-width 320 + padding + border = 360 across,
               which pokes 7px past the 22px gutter on each side */
            .frame(maxWidth: 360)
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(RC.card))
            .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
            .cssShadow(Color.rgba(10, 40, 20, 0.35), y: 16, blur: 40)
            .popIn()
            .padding(15)
        }
        .onAppear { withAnimation(.easeOut(duration: 0.25)) { shown = true } }
    }
}

enum HomeToastLayout {
    /// bottom: 96 on the web = 2px above the 94px tab bar
    static let bottom: CGFloat = 64 + 2
}

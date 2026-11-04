import SwiftUI

/// Port of app/src/screens/Home.jsx (designs/Home.dc.html). Paints its own
/// sky (it does not use Sky).
///
/// Kept simple on purpose (AGENTS.md): Rilo big with his mood, today against
/// the goal, one "do this instead" card and the apps with their opens. The
/// notes (over the promise, closed early, the step-down, strict mode) float
/// above the tab bar or in the middle, never in the column.
///   HomeView+Hero    Rilo, the chat badge and his line
///   HomeView+Cards   the score, "do this instead", the apps
///   HomeView+Notes   the toasts, the step-down sheet, the strict pop-up
struct HomeView: View {
    @Environment(AppState.self) var state
    @Environment(\.riloTheme) var theme

    /// Flat, light cards: a hairline border and no drop shadow.
    static let cardLine = Color.rgba(18, 48, 26, 0.12)

    var body: some View {
        ZStack(alignment: .bottom) {
            theme.skyGradient.ignoresSafeArea()
            ThemeDecor()

            /* Everything above the tab bar scrolls: a normal flow column
               that fits what it fits and scrolls for the rest. */
            ScrollView(showsIndicators: false) {
                column
                    .padding(.top, WebLayout.top(52))
                    .padding(.horizontal, 20)
                    /* --tail: clears the docked tab bar with room to breathe */
                    .padding(.bottom, 64 + 18)
            }
            .scrollBounceBehavior(.basedOnSize)
            .tourScrollable()
            #if DEBUG
            /* -scrollbottom: screenshot the bottom of Home */
            .defaultScrollAnchor(DemoSeed.arguments.contains("-scrollbottom") ? .bottom : .top)
            #endif

            notes

            TabBar(active: "home", skin: state.chosenRilo) { state.go(Screen(rawValue: $0) ?? .home) }

            /* two days over the goal in a row: Rilo offers strict mode */
            if state.suggestStrict {
                HomeStrictAsk(skin: state.chosenRilo,
                              onYes: { state.strictSuggestYes() },
                              onNo: { state.strictSuggestNo() })
                    .zIndex(40)
            }
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(state.name.isEmpty ? "hey there" : "hey \(state.name.lowercased())")
                .accessibilityAddTraits(.isHeader)
                .font(.fredoka(26, 700))
                .foregroundStyle(RC.ink)
                .rise(0, distance: 14, duration: 0.5)

            hero
            scoreCard
            nextCard
            appsList
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

extension View {
    /// Home's cardStyle: padding 16/18, radius 22, the card colour and a
    /// 1.5px hairline. `pad` overrides the padding (the app rows use 12/14).
    func homeCard(v: CGFloat = 16, h: CGFloat = 18) -> some View {
        let shape = RoundedRectangle(cornerRadius: 22, style: .continuous)
        return self
            /* the 1.5px border sits outside the padding (content-box) */
            .padding(.vertical, v + 1.5)
            .padding(.horizontal, h + 1.5)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(shape.fill(RC.card))
            .overlay(shape.strokeBorder(HomeView.cardLine, lineWidth: 1.5))
            .foregroundStyle(RC.ink)
    }
}

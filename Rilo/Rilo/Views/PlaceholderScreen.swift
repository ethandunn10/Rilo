import SwiftUI

/// Stand-in for a screen that hasn't been ported yet: the sky, the screen's
/// web name, and buttons to get around. Each real port replaces one of these.
struct PlaceholderScreen: View {
    let name: String
    @Environment(AppState.self) private var state

    /// the onboarding order, so "next" walks the flow
    private static let flow: [Screen] = [
        .welcome, .name, .pickapps, .permission, .crunching, .rather,
        .yournumber, .yourplan, .paywall, .home,
    ]

    private var next: Screen {
        let here = Screen(rawValue: name) ?? .home
        if let i = Self.flow.firstIndex(of: here), i + 1 < Self.flow.count { return Self.flow[i + 1] }
        return .home
    }

    var body: some View {
        ZStack {
            SkyView(hills: .low)
            VStack(spacing: 14) {
                Text("not ported yet")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(RC.welcomeGreen)
                    .padding(.vertical, 6).padding(.horizontal, 14)
                    .capsuleSticker()
                Text(name)
                    .font(.fredoka(40, 700))
                    .foregroundStyle(RC.ink)
                RiloView(skin: state.chosenRilo, mood: state.riloMood, size: 120, motion: .none)
                Text("\(state.name.isEmpty ? "no name" : state.name) · \(state.tracked.joined(separator: ", "))")
                    .font(.inter(13, 600))
                    .foregroundStyle(RC.body)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)
                ScrollView {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                        ForEach(Screen.allCases, id: \.self) { s in
                            Button(s.rawValue) { state.go(s) }
                                .font(.inter(12, 600))
                                .lineLimit(1)
                                .minimumScaleFactor(0.7)
                                .foregroundStyle(RC.ink)
                                .frame(maxWidth: .infinity, minHeight: 34)
                                .sticker(radius: 12)
                                .buttonStyle(.tap)
                        }
                    }
                    .padding(.horizontal, 20)
                }
                .frame(maxHeight: 260)
                Spacer(minLength: 0)
                HStack(spacing: 10) {
                    BackButton(label: "home") { state.go(.home, dir: .back) }
                    PillButton(title: "next: \(next.rawValue)") { state.go(next) }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, WebLayout.bottom(40))
            }
            .padding(.top, WebLayout.top(64))
        }
    }
}

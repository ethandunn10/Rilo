import SwiftUI

/// Port of app/src/screens/LevelUp.jsx — the "new rilo unlocked!"
/// celebration (panda update section 3). Shown when awardXp unlocks a skin
/// (Pro only with real gating on).
struct LevelUpView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        let skin = state.pendingSkin ?? state.chosenRilo
        let info = Levels.skinInfo(skin)

        ZStack {
            SkyView(hills: .mid).ignoresSafeArea()

            VStack(spacing: 14) {
                Text("level \(state.level)")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(.white)
                    .padding(.vertical, 6)
                    .padding(.horizontal, 16)
                    .background(Capsule().fill(RC.ink))
                    .rise(0, duration: 0.5)

                ZStack {
                    LevelUpBurst()
                    RiloView(skin: skin, mood: "proud", size: 210, motion: .jump, talks: true)
                        .modifier(PopPlain())
                }
                .frame(width: 260, height: 240)

                VStack(spacing: 6) {
                    Text("new rilo unlocked!")
                        .font(.fredoka(36, 700))
                    Text("\(info.name) rilo is yours.")
                        .font(.inter(17, 600))
                        .foregroundStyle(RC.ink2)
                }
                .multilineTextAlignment(.center)
                .rise(0.15, duration: 0.5)

                Spacer(minLength: 0)

                VStack(spacing: 8) {
                    PillButton(title: "wear it", height: 56) { state.levelUpWear() }
                    Button { state.levelUpLater() } label: {
                        Text("later")
                            .font(.fredoka(18, 600))
                            .foregroundStyle(RC.ink)
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .background(Capsule().fill(Color.white.opacity(0.92)))
                            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                    }
                    .buttonStyle(.tap)
                }
                .rise(0.25, duration: 0.5)
            }
            .padding(.horizontal, 22)
            .padding(.top, WebLayout.top(72))
            .padding(.bottom, WebLayout.bottom(28))
            .foregroundStyle(RC.ink)
        }
    }
}

/// the confetti dots behind Rilo (`burst 1.2s ease-out both`: they grow
/// from 0.4 to 1.6, fade in by 40%, then out)
private struct LevelUpBurst: View {
    @State private var scale: CGFloat = 0.4
    @State private var opacity: Double = 0

    private static let gold: [(CGFloat, CGFloat, CGFloat)] = [(34, 62, 6), (226, 52, 5), (22, 166, 4), (238, 156, 6)]
    private static let white: [(CGFloat, CGFloat, CGFloat)] = [(78, 20, 5), (182, 18, 4), (130, 8, 5)]

    var body: some View {
        Canvas { g, _ in
            for (x, y, r) in Self.gold {
                g.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: 2 * r, height: 2 * r)), with: .color(Color(hex: "#F2C230")))
            }
            for (x, y, r) in Self.white {
                g.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: 2 * r, height: 2 * r)), with: .color(.white))
            }
        }
        .frame(width: 260, height: 240)
        .scaleEffect(scale)
        .opacity(opacity)
        .allowsHitTesting(false)
        .accessibilityHidden(true)
        .onAppear {
            withAnimation(.easeOut(duration: 1.2)) { scale = 1.6 }
            withAnimation(.easeOut(duration: 0.48)) { opacity = 1 } completion: {
                withAnimation(.easeOut(duration: 0.72)) { opacity = 0 }
            }
        }
    }
}

/// `pop-plain .6s ease-out both`: 0.6 → 1.08 (60%, fully shown) → 1
private struct PopPlain: ViewModifier {
    @State private var scale: CGFloat = 0.6
    @State private var opacity: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduce

    func body(content: Content) -> some View {
        content
            .scaleEffect(reduce ? 1 : scale)
            .opacity(reduce ? 1 : opacity)
            .onAppear {
                withAnimation(.easeOut(duration: 0.36)) { scale = 1.08; opacity = 1 } completion: {
                    withAnimation(.easeOut(duration: 0.24)) { scale = 1 }
                }
            }
    }
}

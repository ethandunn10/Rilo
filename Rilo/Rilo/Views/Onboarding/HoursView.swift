import SwiftUI

/// "about how many hours a day are you on your phone?" One stepper, one
/// button. Apple doesn't let apps read Screen Time minutes, so this answer
/// is the baseline for your number, your plan, the starting goal and the
/// per-app split (AppState.saidMins). "Used today" still comes from real
/// opens through Rilo's shield.
struct HoursView: View {
    @Environment(AppState.self) private var state
    @State private var hours: Double = 0

    static let MIN: Double = 0.5
    static let MAX: Double = 16
    static let START: Double = 4

    var body: some View {
        ZStack {
            SkyView(hills: .low)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 14) {
                    Dots(active: 3)
                    BackButton { state.goTo(.pickapps, dir: .back) }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    RiloView(skin: AppState.OG_SKIN, mood: "curious", size: 170, talks: true)
                    Text("about how many hours a day are you on your phone?")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(28, 700))
                        .webLineHeight(28, 1.15)
                        .foregroundStyle(RC.ink)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                        .rise(0.05, duration: 0.5)
                    Text("a guess is fine. you can check settings \u{25B8} screen time.")
                        .font(.inter(14, 600))
                        .foregroundStyle(RC.ink2)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)

                    stepper
                        .padding(.top, 8)
                        .rise(0.15, duration: 0.5)

                    Spacer(minLength: 24)

                    PillButton(title: "continue") { state.hoursAnswered(hours) }
                }
                .padding(.top, WebLayout.top(56))
                .padding(.horizontal, 24)
                .padding(.bottom, WebLayout.bottom(34))
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .onAppear {
            /* back here again: keep what they said */
            hours = state.time.now >= Self.MIN ? min(state.time.now, Self.MAX) : Self.START
        }
    }

    private var stepper: some View {
        HStack(spacing: 18) {
            step("−", a11y: "take away 30 minutes", enabled: hours > Self.MIN) {
                hours = max(Self.MIN, hours - 0.5)
            }
            Text(GoalStepper.fmtHours(hours))
                .font(.fredoka(52, 700))
                .foregroundStyle(RC.ink)
                .monospacedDigit()
                .frame(minWidth: 150)
                .contentTransition(.numericText())
                .animation(.easeOut(duration: 0.15), value: hours)
                .accessibilityLabel("hours a day on your phone, \(GoalStepper.spokenHours(hours))")
            step("+", a11y: "add 30 minutes", enabled: hours < Self.MAX) {
                hours = min(Self.MAX, hours + 0.5)
            }
        }
        .padding(.vertical, 18)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity)
        .sticker(fill: RC.card, radius: 26, drop: 4)
    }

    private func step(_ glyph: String, a11y: String, enabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph)
                .font(.fredoka(30, 700))
                .foregroundStyle(enabled ? RC.ink : RC.ink.opacity(0.3))
                .frame(width: 56, height: 56)
                .background(Circle().fill(.white))
        }
        .buttonStyle(.tap)
        .disabled(!enabled)
        .accessibilityLabel(a11y)
    }
}

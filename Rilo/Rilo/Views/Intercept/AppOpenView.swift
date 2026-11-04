import SwiftUI

/// Port of app/src/screens/AppOpen.jsx — the app actually running. Nothing
/// to look at on purpose; the demo button lets a tester burn the session.
///
/// The clock counts down the session's CAP. When it reaches zero the app
/// locks: one session never runs past one whole open (§2.4). It reports the
/// real minutes used, fractions included, so a ten-second peek still costs
/// half an open.
struct AppOpenView: View {
    @Environment(AppState.self) private var state
    @State private var left: Double = -1
    @State private var done = false
    @State private var timer: Timer? = nil

    var body: some View {
        let session = state.session
        let app = state.currentApp
        let minutes = session.cap
        let total = minutes * 60
        let shownLeft = left < 0 ? total : left
        let clock = "\(Int(shownLeft / 60)):\(String(format: "%02d", Int(shownLeft.truncatingRemainder(dividingBy: 60))))"
        /* minutes spent so far — the clock on screen is the truth */
        let spent = minutes - shownLeft / 60

        ZStack {
            Color(hex: "#0C0F0D").ignoresSafeArea()

            VStack(spacing: 14) {
                AppLogo(label: app, size: 64, radius: 16)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(.white))

                Text("\(app) · \(clock) left")
                    .font(.fredoka(30, 600))
                    .monospacedDigit()

                /* carrying on a session they only just closed */
                if session.carried > 0 {
                    Text("same session · \(JS.roundInt(session.carried)) min already used")
                        .font(.inter(12.5, 600))
                        .foregroundStyle(Color.white.opacity(0.8))
                        .padding(.vertical, 5)
                        .padding(.horizontal, 12)
                        .background(Capsule().fill(Color.white.opacity(0.12)))
                }

                Text(costNote(spent: spent))
                    .font(.inter(14, 600))
                    .webLineHeight(14, 1.4)
                    .foregroundStyle(Color.white.opacity(0.55))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 280)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer(minLength: 0)

                Button { left = max(0, shownLeft - 5 * 60) } label: {
                    Text("demo: burn 5 min")
                        .font(.fredoka(17, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(Capsule().fill(Color.white.opacity(0.08)))
                        .overlay(Capsule().strokeBorder(Color.white.opacity(0.3), lineWidth: 2))
                }
                .buttonStyle(.tap)

                Button { finish(spent) } label: {
                    Text("close app")
                        .font(.fredoka(19, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, minHeight: 56)
                        .background(Capsule().fill(.white))
                }
                .buttonStyle(.tap)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 26)
            .padding(.top, WebLayout.top(26))
            .padding(.bottom, WebLayout.bottom(26))
        }
        .onAppear(perform: start)
        .onDisappear { timer?.invalidate() }
    }

    /// what this session will cost once they close it
    private func costNote(spent: Double) -> String {
        let session = state.session
        if session.kind == "pass" { return "your emergency pass. five minutes, no opens spent." }
        if session.kind == "always" { return "always allowed. this one never costs you anything." }
        let half = Limits.halfOf(session.minutes)
        let run = session.carried + spent
        return run <= half
            ? "still half an open — leave before \(JS.num(half)) min and it stays that way."
            : "this one costs a whole open."
    }

    private func finish(_ usedMins: Double) {
        if done { return }
        done = true
        timer?.invalidate()
        state.finishSession(state.currentApp, minutesUsed: max(0, usedMins))
    }

    /// real seconds, so a session feels like time passing
    private func start() {
        let cap = state.session.cap
        left = cap * 60
        #if DEBUG
        /* -burned <min>: that much of the session already gone (the demo button) */
        if let b = DemoSeed.arg("-burned"), let m = Double(b) { left = max(0, left - m * 60) }
        #endif
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            MainActor.assumeIsolated {
                if left <= 1 {
                    t.invalidate()
                    left = 0
                    /* hit the cap — that's the whole open, the app locks */
                    finish(cap)
                } else {
                    left -= 1
                }
            }
        }
    }
}

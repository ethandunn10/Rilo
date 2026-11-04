import SwiftUI

/// Port of app/src/screens/Paywall.jsx. Shown for both `paywall` (end of
/// onboarding: goes on to the hand-off, home and the tour) and `upgrade`
/// (from a locked feature: hands you back where you were). AppState's
/// paywallDone / paywallBack handle the difference, like App.jsx's props.
///
/// No real payment: "start 7-day free trial" asks `Purchases.shared`, which
/// is the demo service for now (it just says yes), and that makes you Pro.
struct PaywallView: View {
    @Environment(AppState.self) private var state
    @State private var buying = false

    private var plan: String { state.plan }
    private var free: Bool { plan == "free" }

    var body: some View {
        ZStack {
            SkyView(hills: .low).ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                column
                    .padding(.top, WebLayout.top(40))
                    .padding(.horizontal, 22)
                    .padding(.bottom, WebLayout.bottom(26))
            }
            .scrollBounceBehavior(.basedOnSize)
            #if DEBUG
            .defaultScrollAnchor(DemoSeed.arguments.contains("-scrollbottom") ? .bottom : .top)
            #endif
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: 12) {
            BackButton { state.paywallBack() }

            trio
                .frame(maxWidth: .infinity)
                .rise(0, duration: 0.5)

            VStack(spacing: 6) {
                Text("rilo pro")
                    .font(.fredoka(14, 600))
                    .tracking(14 * 0.06)
                    .foregroundStyle(.white)
                    .padding(.vertical, 4)
                    .padding(.horizontal, 12)
                    .background(Capsule().fill(RC.ink))
                Text("get the full coach")
                    .font(.fredoka(32, 700))
                    .foregroundStyle(RC.ink)
                    .multilineTextAlignment(.center)
                    .webLineHeight(32, 1.05)
            }
            .frame(maxWidth: .infinity)
            .rise(0.08, duration: 0.5)

            PaywallPerks().rise(0.16, duration: 0.5)

            /* free deserves a description too, not just a price */
            PaywallFreeCard().rise(0.2, duration: 0.5)

            VStack(spacing: 8) {
                ForEach(Self.PLANS, id: \.id) { p in
                    PaywallPlanButton(row: p, on: plan == p.id) { state.plan = p.id }
                }
            }
            .rise(0.24, duration: 0.5)

            Color.clear.frame(height: 8)

            /* one button, and it does whatever row is selected */
            Button(action: choose) {
                Text(free ? "continue with free" : "start 7-day free trial")
                    .font(.fredoka(20, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 58)
                    .capsuleSticker(fill: .white, drop: 4)
            }
            .buttonStyle(.tap)
            .disabled(buying)

            Text(free ? "you can upgrade any time from the you tab."
                      : "free for 7 days, then it bills. cancel whenever.")
                .font(.inter(12, 600))
                .foregroundStyle(.white)
                .opacity(0.85)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
        }
    }

    /// redpanda, gold and pinkpanda, all coaching
    private var trio: some View {
        HStack(alignment: .bottom, spacing: 0) {
            RiloView(skin: "redpanda", mood: "coach", size: 88, talks: true)
                .padding(.bottom, 4)
                .padding(.trailing, -18)
            RiloView(skin: "gold", mood: "coach", size: 112, talks: true)
                .zIndex(1)
            RiloView(skin: "pinkpanda", mood: "coach", size: 88, talks: true)
                .padding(.bottom, 4)
                .padding(.leading, -18)
        }
        .frame(height: 104, alignment: .bottom)
    }

    /// free: straight on. trial: the purchase service says yes first (the
    /// demo one always does), then AppState makes them Pro and moves on.
    private func choose() {
        if free {
            state.paywallDone("continue with free")
            return
        }
        buying = true
        let picked = plan
        Task {
            let result = await Purchases.shared.startTrial(plan: picked)
            buying = false
            if result == .success { state.paywallDone("start free trial") }
        }
    }
}

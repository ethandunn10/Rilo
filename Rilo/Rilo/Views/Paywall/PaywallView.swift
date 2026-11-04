import SwiftUI

/// Port of app/src/screens/Paywall.jsx. Shown for both `paywall` (end of
/// onboarding: goes on to the hand-off, home and the tour) and `upgrade`
/// (from a locked feature: hands you back where you were). AppState's
/// paywallDone / paywallBack handle the difference, like App.jsx's props.
///
/// "start 7-day free trial" asks `Purchases.shared` (StoreKit 2, or the
/// demo's yes for seeds / DEBUG `-demopurchase`), and a yes makes you Pro.
/// Prices are StoreKit's localized ones once loaded, the web's otherwise.
/// Apple requires a way to restore, so a quiet "restore purchases" sits
/// under the small line below the button.
struct PaywallView: View {
    @Environment(AppState.self) private var state
    @State private var buying = false
    /* Rilo's word when the store says no / not yet; replaces the small line */
    @State private var note: String?

    private var store: ProStore { ProStore.shared }
    /* someone who already used the trial can't be promised another one */
    private var trial: Bool { store.prices?.trialEligible ?? true }

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
                ForEach(Self.plans(store.prices), id: \.id) { p in
                    PaywallPlanButton(row: p, on: plan == p.id) { state.plan = p.id; note = nil }
                }
            }
            .rise(0.24, duration: 0.5)

            Color.clear.frame(height: 8)

            /* one button, and it does whatever row is selected */
            Button(action: choose) {
                Text(free ? "continue with free" : trial ? "start 7-day free trial" : "start rilo pro")
                    .font(.fredoka(20, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 58)
                    .capsuleSticker(fill: .white, drop: 4)
            }
            .buttonStyle(.tap)
            .disabled(buying)

            Text(note ?? (free ? "you can upgrade any time from the you tab."
                      : trial ? "free for 7 days, then it bills. cancel whenever."
                              : "it bills today. cancel whenever."))
                .font(.inter(12, 600))
                .foregroundStyle(.white)
                .opacity(0.85)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)

            /* Apple's rule: a way to restore. Quiet, but findable. */
            Button(action: restore) {
                Text("restore purchases")
                    .font(.inter(12, 600))
                    .underline()
                    .foregroundStyle(.white)
                    .opacity(0.7)
                    .padding(.vertical, 4)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plainTap)
            .disabled(buying)
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
    /// No products / an error: Rilo says so in the small line, and nothing
    /// is unlocked. (Never a fake yes outside the demo service.)
    private func choose() {
        if free {
            state.paywallDone("continue with free")
            return
        }
        buying = true
        note = nil
        let picked = plan
        Task {
            let result = await Purchases.shared.startTrial(plan: picked)
            buying = false
            switch result {
            case .success:
                await store.refresh()
                state.paywallDone("start free trial")
            case .cancelled:
                break
            case .pending:
                note = "waiting on a yes. pro turns on as soon as it goes through."
            case .failed:
                track("paywall", "store error")
                note = "the app store isn't answering right now. try again in a bit."
            }
        }
    }

    private func restore() {
        buying = true
        note = nil
        Task {
            let result = await Purchases.shared.restore()
            buying = false
            switch result {
            case .success:
                await store.refresh()
                state.paywallRestored()
            case .cancelled:
                break
            case .failed(StoreKitPurchaseService.NOTHING_TO_RESTORE), .pending:
                note = "i couldn't find rilo pro on this apple account."
            case .failed:
                note = "the app store isn't answering right now. try again in a bit."
            }
        }
    }
}

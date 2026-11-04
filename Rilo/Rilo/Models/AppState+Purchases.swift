import Foundation

/// Pro, purchases and the tester switch.
///
/// `isPro` is the saved "they bought it" flag (StoreKit sets it from the
/// entitlement). `hasPro` is what every Pro gate reads: bought, OR the
/// tester switch FeatureFlags.UNLOCK_ALL is on.
extension AppState {
    /// every Pro gate reads this, never `isPro` directly
    var hasPro: Bool { isPro || FeatureFlags.UNLOCK_ALL }

    /// StoreKit says whether there's an active Rilo Pro subscription (on
    /// launch, whenever a transaction changes, and when the app comes back
    /// to the front). Pro follows it, both ways.
    func applyEntitlement(_ entitled: Bool) {
        if isPro != entitled { isPro = entitled }
    }

    /// "restore purchases" found their subscription: same exit as the trial
    /// button (Pro on, then onward like Paywall.jsx's onNext)
    func paywallRestored() {
        track("paywall", "restored")
        planChoice = "trial"
        isPro = true
        let next = paywallNext
        paywallLeaving()
        go(next)
    }
}

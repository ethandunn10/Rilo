import Foundation

/// The one place the paywall "buys" something.
///
/// Phase 6 is fake like the web demo: "start 7-day free trial" just says yes,
/// and AppState.paywallDone makes you Pro. No StoreKit, no payment, nothing
/// leaves the phone. Real StoreKit 2 (Phase 7) drops in as another
/// `PurchaseService` without touching PaywallView.
nonisolated enum PurchaseResult: Sendable, Equatable {
    case success
    case cancelled
    case failed(String)
}

nonisolated protocol PurchaseService: Sendable {
    /// start the 7-day trial on a plan: "year" | "month"
    func startTrial(plan: String) async -> PurchaseResult
}

/// DEMO: always succeeds, takes no payment.
nonisolated struct DemoPurchaseService: PurchaseService {
    func startTrial(plan: String) async -> PurchaseResult { .success }
}

nonisolated enum Purchases {
    /// swap this for the StoreKit version later
    static let shared: any PurchaseService = DemoPurchaseService()
}

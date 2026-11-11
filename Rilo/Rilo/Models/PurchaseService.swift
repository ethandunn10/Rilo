import Foundation
import StoreKit

/// The one place the paywall buys something.
///
/// Two implementations behind one protocol:
/// - `StoreKitPurchaseService` (the default): real StoreKit 2. In the
///   simulator / Xcode it's tested with Rilo/Config/Rilo.storekit (set on the
///   shared Rilo scheme's Run action), so nothing is ever charged there.
/// - `DemoPurchaseService`: the web demo's fake "yes". Used for DEBUG
///   `-demopurchase` and every `-screen` seed, so screenshots keep working.
nonisolated enum PurchaseResult: Sendable, Equatable {
    case success
    case cancelled
    /// Ask to Buy / a bank check: it goes through later via Transaction.updates
    case pending
    case failed(String)
}

/// The store's own localized prices for the two plans.
nonisolated struct PlanPrices: Sendable, Equatable {
    /// "$39.99"
    var year: String
    /// "$4.99"
    var month: String
    /// the yearly price over 12 months, "$3.33"
    var yearPerMonth: String
    /// false once this Apple ID has used its free trial
    var trialEligible: Bool
}

nonisolated protocol PurchaseService: Sendable {
    /// start the 7-day trial on a plan: "year" | "month"
    func startTrial(plan: String) async -> PurchaseResult
    /// "restore purchases": re-sync with the App Store, success = Pro found
    func restore() async -> PurchaseResult
    /// nil when the products can't be loaded (no store, no network, a plain
    /// CLI build without the StoreKit config): the paywall shows the web text
    func loadPrices() async -> PlanPrices?
    /// is there an active Rilo Pro subscription? nil = this service doesn't
    /// know (the demo), so leave `isPro` alone
    func currentPro() async -> Bool?
    /// a new value every time a transaction arrives (renewals, refunds,
    /// Ask to Buy approvals, purchases made on another device)
    func proUpdates() -> AsyncStream<Bool>
}

/// DEMO: always succeeds, takes no payment.
nonisolated struct DemoPurchaseService: PurchaseService {
    func startTrial(plan: String) async -> PurchaseResult { .success }
    func restore() async -> PurchaseResult { .success }
    func loadPrices() async -> PlanPrices? { nil }
    func currentPro() async -> Bool? { nil }
    func proUpdates() -> AsyncStream<Bool> { AsyncStream { $0.finish() } }
}

/// Real StoreKit 2. Products live in App Store Connect (and, for testing,
/// in Rilo/Config/Rilo.storekit): one group "Rilo Pro", two auto-renewing
/// subscriptions, each with a 7-day free trial intro offer.
nonisolated struct StoreKitPurchaseService: PurchaseService {
    static let MONTHLY = "com.ethandunn.rilo.pro.monthly"
    static let YEARLY = "com.ethandunn.rilo.pro.yearly"
    static let ALL: Set<String> = [MONTHLY, YEARLY]
    static let NOTHING_TO_RESTORE = "nothing to restore"

    static func productID(_ plan: String) -> String { plan == "month" ? MONTHLY : YEARLY }

    private func products() async -> [String: Product] {
        guard let list = try? await Product.products(for: Array(Self.ALL)) else { return [:] }
        return Dictionary(list.map { ($0.id, $0) }, uniquingKeysWith: { a, _ in a })
    }

    func loadPrices() async -> PlanPrices? {
        let p = await products()
        guard let y = p[Self.YEARLY], let m = p[Self.MONTHLY] else { return nil }
        let eligible = await y.subscription?.isEligibleForIntroOffer ?? true
        return PlanPrices(year: y.displayPrice, month: m.displayPrice,
                          yearPerMonth: (y.price / 12).formatted(y.priceFormatStyle),
                          trialEligible: eligible)
    }

    func startTrial(plan: String) async -> PurchaseResult {
        guard let product = await products()[Self.productID(plan)] else {
            return .failed("no products")
        }
        do {
            switch try await product.purchase() {
            case .success(let verification):
                /* only a transaction Apple signed counts */
                guard case .verified(let t) = verification else { return .failed("unverified") }
                await t.finish()
                return .success
            case .userCancelled:
                return .cancelled
            case .pending:
                return .pending
            @unknown default:
                return .failed("unknown")
            }
        } catch {
            return .failed(error.localizedDescription)
        }
    }

    func restore() async -> PurchaseResult {
        do {
            try await AppStore.sync()
        } catch StoreKitError.userCancelled {
            return .cancelled
        } catch {
            return .failed(error.localizedDescription)
        }
        return await currentPro() == true ? .success : .failed(Self.NOTHING_TO_RESTORE)
    }

    func currentPro() async -> Bool? {
        for await result in Transaction.currentEntitlements {
            guard case .verified(let t) = result, Self.ALL.contains(t.productID) else { continue }
            if t.revocationDate != nil { continue }
            if let exp = t.expirationDate, exp < Date() { continue }
            return true
        }
        return false
    }

    func proUpdates() -> AsyncStream<Bool> {
        AsyncStream { cont in
            let task = Task.detached {
                for await result in Transaction.updates {
                    if case .verified(let t) = result { await t.finish() }
                    cont.yield(await currentPro() ?? false)
                }
                cont.finish()
            }
            cont.onTermination = { _ in task.cancel() }
        }
    }
}

/// Which service the app uses, plus what the paywall shows from it.
/// Started once from RiloApp.init, so Transaction.updates is heard from
/// launch (Apple's rule: otherwise purchases made elsewhere get missed).
@MainActor @Observable
final class ProStore {
    static let shared = ProStore()

    let service: any PurchaseService
    /// nil until (unless) the products load: the paywall shows the web prices
    private(set) var prices: PlanPrices?
    /// the store's answer: nil = not known yet / the demo service
    var entitled: Bool?
    @ObservationIgnored private var listener: Task<Void, Never>?

    init() {
        /* payments off (FeatureFlags.PAYMENTS): StoreKit isn't used at all.
           The demo service never loads products or checks purchases. */
        if !FeatureFlags.PAYMENTS {
            service = DemoPurchaseService()
            return
        }
        #if DEBUG
        /* the screenshot seeds and `-demopurchase` keep the web's fake yes */
        if DemoSeed.flag("-demopurchase") || DemoSeed.screenArg != nil {
            service = DemoPurchaseService()
            return
        }
        #endif
        service = StoreKitPurchaseService()
    }

    func start() {
        /* payments off: don't listen to Transaction.updates, ask for nothing */
        guard FeatureFlags.PAYMENTS, listener == nil else { return }
        let service = service
        listener = Task { [weak self] in
            let updates = service.proUpdates()
            await self?.refresh()
            for await pro in updates { self?.entitled = pro }
        }
    }

    /// prices + entitlement again (launch, and whenever the app comes back,
    /// so an expired or refunded subscription turns Pro off)
    func refresh() async {
        guard FeatureFlags.PAYMENTS else { return }
        if prices == nil { prices = await service.loadPrices() }
        if let pro = await service.currentPro() { entitled = pro }
    }
}

/// kept for SettingsCheck and the paywall: the service in use
enum Purchases {
    static var shared: any PurchaseService { ProStore.shared.service }
}

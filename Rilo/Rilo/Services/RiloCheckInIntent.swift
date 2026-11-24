import AppIntents
import Foundation

/// "Rilo check-in", for a Shortcuts automation the user makes themselves:
/// "When Instagram is opened → Rilo check-in (instagram)". iOS doesn't let
/// an app create automations, so the onboarding step walks them through it.
///
/// It runs in the background first and only brings Rilo to the front when a
/// check-in is due: not while that app's session is running (going back in
/// would loop) and not while its shield is up (the shield is the check-in
/// then, and the two must never show at once).
struct RiloCheckInIntent: AppIntent {
    static let title: LocalizedStringResource = "Rilo check-in"
    static let description = IntentDescription(
        "Rilo asks what it's for before the app opens. Use it in an automation: when the app is opened, run Rilo check-in.")
    static let supportedModes: IntentModes = [.background, .foreground(.dynamic)]

    @Parameter(title: "App")
    var app: RiloAppEntity

    static var parameterSummary: some ParameterSummary {
        Summary("Rilo check-in for \(\.$app)")
    }

    init() {}
    init(app: RiloAppEntity) { self.app = app }

    func perform() async throws -> some IntentResult {
        let name = app.id
        /* it ran, so the automation exists: that app's check-in is the
           automation's now (the shield only goes up when it's locked) */
        let keys = Array(RiloShared.rules.apps.keys)
        if let key = AppMatch.key(for: name, among: keys) { Automation.markSeen(key) }
        guard Automation.shouldOpenRilo(forName: name) else { return .result() }
        try await continueInForeground(alwaysConfirm: false)
        await MainActor.run { CheckInRouter.shared.open(name) }
        return .result()
    }
}

/// An app the check-in is for, by the name the user gave it in Rilo's
/// "which app is this?" step (or one of the common ones).
struct RiloAppEntity: AppEntity {
    static let typeDisplayRepresentation: TypeDisplayRepresentation = "App"
    static let defaultQuery = RiloAppQuery()

    /// the name, lowercased ("instagram")
    var id: String

    var displayRepresentation: DisplayRepresentation { DisplayRepresentation(title: "\(id)") }
}

struct RiloAppQuery: EntityStringQuery {
    func entities(for identifiers: [String]) async throws -> [RiloAppEntity] {
        identifiers.map { RiloAppEntity(id: $0.lowercased()) }
    }

    /// the apps they matched in Rilo first, then the common ones
    func suggestedEntities() async throws -> [RiloAppEntity] {
        let matched = Array(Set(AppMatch.all.values)).sorted()
        let rest = AppMatch.KNOWN.map(\.id).filter { !matched.contains($0) }
        return (matched + rest).map { RiloAppEntity(id: $0) }
    }

    /// typing a name in Shortcuts works too
    func entities(matching string: String) async throws -> [RiloAppEntity] {
        let s = string.lowercased().trimmingCharacters(in: .whitespaces)
        let all = try await suggestedEntities()
        let hits = all.filter { $0.id.contains(s) }
        return hits.isEmpty && !s.isEmpty ? [RiloAppEntity(id: s)] : hits
    }
}

/// Hands a Shortcuts check-in to the app state once it exists (the intent
/// can run before ContentView has set the handler, on a cold launch).
@MainActor
final class CheckInRouter {
    static let shared = CheckInRouter()
    private var waiting: String? = nil

    var handler: ((String) -> Void)? {
        didSet { if let w = waiting, let handler { waiting = nil; handler(w) } }
    }

    func open(_ name: String) {
        if let handler { handler(name) } else { waiting = name }
    }
}

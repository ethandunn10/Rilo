import Foundation
import ManagedSettings
import UserNotifications

/// Target: RiloShieldAction (Shield Action Extension).
/// Also needs Shared/AppGroup.swift, Shared/RiloShared.swift, Shared/RiloTokens.swift.
///
/// The two shield buttons (ShieldConfigurationExtension):
///   "talk to rilo"  → Rilo's notification ("RILO" / "tap to talk", the web's
///                     Banner.jsx). An extension can't open its app; a
///                     notification is the only way an app can pull you out
///                     of a shield. Tapping it opens Rilo, which reads the
///                     shieldTapped event and lands on Intercept.
///   "close"         → closes the app, like ShieldView's close.
/// The app's own notification permission covers this (asked right after
/// the Screen Time step, Phase 7).
nonisolated final class ShieldActionExtension: ShieldActionDelegate {
    override func handle(action: ShieldAction, for application: ApplicationToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        respond(action, key: RiloTokens.key(for: application), completionHandler)
    }

    override func handle(action: ShieldAction, for webDomain: WebDomainToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        /* Rilo doesn't limit websites on their own */
        completionHandler(.close)
    }

    override func handle(action: ShieldAction, for category: ActivityCategoryToken,
                         completionHandler: @escaping (ShieldActionResponse) -> Void) {
        respond(action, key: RiloTokens.key(for: category), completionHandler)
    }

    private func respond(_ action: ShieldAction, key: String,
                         _ completionHandler: @escaping (ShieldActionResponse) -> Void) {
        switch action {
        case .primaryButtonPressed:
            /* the app also reads this when it next opens (backup for the
               notification); the two are de-duplicated there */
            RiloShared.post(SharedEvent(kind: "shieldTapped", app: key, at: RiloShared.nowMs))
            nonisolated(unsafe) let finish = completionHandler
            notify(key: key) {
                /* close the blocked app so the banner is the next thing they see */
                finish(.close)
            }
        case .secondaryButtonPressed:
            /* "never mind": a win, counted by the app when it next opens */
            RiloShared.post(SharedEvent(kind: "shieldNeverMind", app: key, at: RiloShared.nowMs))
            completionHandler(.close)
        default:   /* newer SDKs add submenu items; Rilo has none */
            completionHandler(.close)
        }
    }

    /// "tap to talk to rilo about instagram." Delivered at once (no trigger:
    /// the old 1-second timer was part of the wait), time-sensitive (breaks
    /// through Focus once the Time Sensitive Notifications capability is on;
    /// without it iOS treats it as a normal alert), and with a fresh id
    /// every time (reusing one id made iOS treat a second tap as an update
    /// to the old notification and sometimes not show it at all).
    private func notify(key: String, then done: @escaping @Sendable () -> Void) {
        let content = UNMutableNotificationContent()
        /* the name the user gave this app in Rilo, if they did (App Group) */
        let matches = AppGroup.defaults.dictionary(forKey: "rilo.appMatches") as? [String: String]
        if let name = matches?[key] {
            content.body = "tap to talk to rilo about \(name)."
        } else {
            content.body = "tap to talk to rilo."
        }
        content.sound = .default
        content.interruptionLevel = .timeSensitive
        content.relevanceScore = 1
        content.threadIdentifier = "rilo-shield"
        /* the app routes straight to this app's check-in from here */
        content.userInfo = ["rilo.shieldTapped": key]
        let center = UNUserNotificationCenter.current()
        /* one banner at a time: clear the older shield ones */
        center.getDeliveredNotifications { delivered in
            let old = delivered.map(\.request.identifier).filter { $0.hasPrefix("rilo-shield-") }
            if !old.isEmpty { center.removeDeliveredNotifications(withIdentifiers: old) }
            let request = UNNotificationRequest(identifier: "rilo-shield-\(UUID().uuidString)", content: content,
                                                trigger: nil)
            center.add(request) { _ in done() }
        }
    }
}

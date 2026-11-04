#if RILO_FAMILY_CONTROLS
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
            RiloShared.post(SharedEvent(kind: "shieldTapped", app: key, at: RiloShared.nowMs))
            /* the handler is only ever called once, after the notification is queued */
            nonisolated(unsafe) let finish = completionHandler
            notify(key: key) {
                /* close the blocked app so the banner is the next thing they see */
                finish(.close)
            }
        case .secondaryButtonPressed:
            completionHandler(.close)
        default:   /* newer SDKs add submenu items; Rilo has none */
            completionHandler(.close)
        }
    }

    /// Banner.jsx: "RILO" / "tap to talk"
    private func notify(key: String, then done: @escaping @Sendable () -> Void) {
        let content = UNMutableNotificationContent()
        /* iOS puts the app's name ("RILO") on top itself, like the web banner */
        content.body = "tap to talk"
        content.sound = .default
        /* no "screen" key: RiloNotifications ignores it; the app's
           handleScreenTimeEvents picks up the shieldTapped event instead */
        content.userInfo = ["rilo.shieldTapped": key]
        let request = UNNotificationRequest(identifier: "rilo-shield-\(key)", content: content,
                                            trigger: UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false))
        UNUserNotificationCenter.current().add(request) { _ in done() }
    }
}
#endif

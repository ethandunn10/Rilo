import Foundation
import ManagedSettings
import UserNotifications

/// Target: RiloShieldAction (Shield Action Extension).
/// Also needs Shared/AppGroup.swift, Shared/RiloShared.swift, Shared/RiloTokens.swift.
///
/// The shield's two buttons (ShieldConfigurationExtension draws them), the
/// ScreenZen-style open:
///
///   "open instagram (5s)"  1st tap: the wait starts and the shield is drawn
///                          again with the seconds left (`.defer` asks iOS to
///                          redraw it; a shield can't tick on its own).
///                          A tap once the wait is over: the shield comes off
///                          that one app for one open, iOS's timer starts
///                          (it shields it again when the time's up), the open
///                          is counted, and the Live Activity starts.
///   "talk to rilo"         (out of opens, blocked, bedtime / school / focus)
///                          opens Rilo itself (`.openParentalControlsApp`,
///                          iOS 26.5+) on that app's check-in.
///   "never mind"           closes the app; a win, counted when Rilo opens.
nonisolated final class ShieldActionExtension: ShieldActionDelegate {
    private let store = ManagedSettingsStore(named: .rilo)

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

    /// the same test the shield's text uses (ShieldConfigurationExtension.canOpen)
    static func canOpen(_ rules: SharedRules, _ rule: SharedApp?) -> Bool {
        guard let rule, rules.scheduleKind == nil, rule.lockKind == nil else { return false }
        return rule.mode == "limited" && rule.opensLeft > 0
    }

    private func respond(_ action: ShieldAction, key: String,
                         _ completionHandler: @escaping (ShieldActionResponse) -> Void) {
        let rules = RiloShared.rules
        let rule = rules.apps[key]
        switch action {
        case .primaryButtonPressed:
            guard Self.canOpen(rules, rule) else {
                /* locked: Rilo's check-in (emergency pass rules) */
                RiloShared.post(SharedEvent(kind: "shieldTapped", app: key, at: RiloShared.nowMs))
                completionHandler(.openParentalControlsApp)
                return
            }
            guard let left = RiloShared.waitLeft(key, rule, strict: rules.strict) else {
                /* first tap: start the wait, draw the shield again */
                RiloShared.shieldWaits[key] = RiloShared.nowMs
                completionHandler(.defer)
                return
            }
            if left > 0 {
                /* not yet: redraw with the seconds left */
                completionHandler(.defer)
                return
            }
            RiloShared.shieldWaits[key] = nil
            guard let session = RiloTokens.unlockFromShield(key, store: store) else {
                completionHandler(.defer)
                return
            }
            /* the timer in the Dynamic Island. iOS may not let an extension
               start one (it's documented for the app in the foreground); if
               it says no, a notification takes its place, and Rilo starts
               the Live Activity the next time it's opened. */
            if RiloLiveActivity.start(session, from: "shield") != nil {
                nonisolated(unsafe) let finish = completionHandler
                notifyStarted(session) { finish(.none) }
                return
            }
            /* the shield is off this app now: stay in it */
            completionHandler(.none)
        case .secondaryButtonPressed:
            /* "never mind": a win, counted by the app when it next opens */
            RiloShared.shieldWaits[key] = nil
            RiloShared.post(SharedEvent(kind: "shieldNeverMind", app: key, at: RiloShared.nowMs))
            completionHandler(.close)
        default:   /* newer SDKs add submenu items; Rilo has none */
            completionHandler(.close)
        }
    }

    /// Only when the Live Activity couldn't start: "instagram's open ·
    /// 10 min. tap here when you're done." Tapping it opens Rilo on the
    /// relock screen. Delivered at once, time-sensitive, fresh id each time.
    private func notifyStarted(_ s: SharedSession, then done: @escaping @Sendable () -> Void) {
        let content = UNMutableNotificationContent()
        let name = RiloShared.userName(s.app) ?? "your app"
        content.title = "\(name) · \(Int(s.minutes)) min"
        content.body = "rilo locks it again when the time's up. tap here when you're done."
        content.interruptionLevel = .timeSensitive
        content.threadIdentifier = "rilo-session"
        content.userInfo = ["rilo.relock": s.app]
        let center = UNUserNotificationCenter.current()
        center.getDeliveredNotifications { delivered in
            let old = delivered.map(\.request.identifier).filter { $0.hasPrefix("rilo-session-") }
            if !old.isEmpty { center.removeDeliveredNotifications(withIdentifiers: old) }
            let request = UNNotificationRequest(identifier: "rilo-session-\(UUID().uuidString)", content: content,
                                                trigger: nil)
            center.add(request) { _ in done() }
        }
    }
}

import Foundation
import UserNotifications

/// Rilo's local reminders (Phase 7). Nothing leaves the phone.
///
///   check-in   Pro, every night at the check-in time (night.at), the next
///              7 nights, skipping tonight once they've checked in.
///              Tapping it opens the check-in.
///   ask        the first week's question for tomorrow (FirstWeek), once.
///              Morning-only questions at 8:00, the rest at 16:00. Tapping
///              it opens the screen where that question shows.
///   bedtime    when bedtime mode is on, every night at bedtime.from.
///
/// Permission is asked once, right after "allow" on the Screen Time sheet
/// in onboarding (AppState.permissionAllow). If they say no, scheduling
/// just quietly does nothing.
@MainActor
final class RiloNotifications: NSObject, UNUserNotificationCenterDelegate {
    static let shared = RiloNotifications()

    nonisolated struct Planned: Equatable, Sendable {
        var id: String
        var title: String
        var body: String
        /// where tapping it goes (a Screen raw value)
        var screen: String
        var at: DateComponents
        var repeats = false
    }

    /* the copy, all of it lines the app already says */
    nonisolated static let checkinTitle = "check in with rilo"          // Plan tab's check-in row
    nonisolated static let checkinBody = "how'd today go?"              // NightCheckIn's first question
    nonisolated static let bedtimeTitle = "bedtime mode"                 // You tab / ScheduleCard
    nonisolated static let bedtimeBody = "rilo’s asleep. so should you be."   // Addons.moodNote, asleep

    private var center: UNUserNotificationCenter { .current() }
    /// a tapped notification's screen, waiting for the app to be ready
    private var waiting: Screen? = nil
    /// set by ContentView once the state exists
    var onOpen: ((Screen) -> Void)? {
        didSet { if let w = waiting, let onOpen { waiting = nil; onOpen(w) } }
    }

    /// RiloApp.init: the delegate has to be in place before launch finishes
    /// so a tap that launched the app is delivered.
    func install() { center.delegate = self }

    /// The system prompt, once. Whatever they answer, `then` runs after.
    func askPermission(then: @escaping @MainActor () -> Void = {}) {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            Task { @MainActor in
                track("notifications", granted ? "allowed" : "not allowed")
                then()
            }
        }
    }

    // MARK: scheduling

    func schedule(_ list: [Planned]) {
        center.removeAllPendingNotificationRequests()
        /* only once they've said yes: adding requests before that can make
           iOS show its permission prompt at a random moment */
        center.getNotificationSettings { settings in
            let ok = settings.authorizationStatus == .authorized
                || settings.authorizationStatus == .provisional
                || settings.authorizationStatus == .ephemeral
            guard ok else { return }
            Task { @MainActor in self.add(list) }
        }
    }

    private func add(_ list: [Planned]) {
        for p in list {
            let content = UNMutableNotificationContent()
            content.title = p.title
            content.body = p.body
            content.sound = .default
            content.userInfo = ["screen": p.screen]
            let trigger = UNCalendarNotificationTrigger(dateMatching: p.at, repeats: p.repeats)
            center.add(UNNotificationRequest(identifier: p.id, content: content, trigger: trigger))
        }
    }

    func cancelAll() {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
    }

    #if DEBUG
    /// `-notifynow`: the check-in reminder 5 seconds from now.
    func checkinIn5s() {
        askPermission { [weak self] in
            guard let self else { return }
            self.center.removeAllPendingNotificationRequests()
            let content = UNMutableNotificationContent()
            content.title = Self.checkinTitle
            content.body = Self.checkinBody
            content.sound = .default
            content.userInfo = ["screen": Screen.nightcheckin.rawValue]
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            self.center.add(UNNotificationRequest(identifier: "checkin-now", content: content, trigger: trigger))
        }
    }
    #endif

    /// What to schedule, worked out from the settings (pure, so SelfCheck
    /// can test it). Times are the phone's local time.
    nonisolated static func plan(isPro: Bool, night: NightCheck, checkedInToday: Bool,
                                 bedtime: Bedtime, drip: Drip, now: Date = Date(),
                                 cal: Calendar = .current) -> [Planned] {
        var out: [Planned] = []
        func at(_ hhmm: String, daysAhead: Int) -> (DateComponents, Date)? {
            guard let day = cal.date(byAdding: .day, value: daysAhead, to: cal.startOfDay(for: now)) else { return nil }
            let mins = Addons.toMins(hhmm)
            guard let when = cal.date(byAdding: .minute, value: mins, to: day) else { return nil }
            return (cal.dateComponents([.year, .month, .day, .hour, .minute], from: when), when)
        }

        /* the nightly check-in is Pro, like the check-in itself */
        if isPro {
            let time = night.at.isEmpty ? "21:00" : night.at
            for d in 0..<7 {
                if d == 0 && checkedInToday { continue }
                guard let (comps, when) = at(time, daysAhead: d), when > now else { continue }
                out.append(Planned(id: "checkin-\(d)", title: checkinTitle, body: checkinBody,
                                   screen: Screen.nightcheckin.rawValue, at: comps))
            }
        }

        /* tomorrow's first-week question */
        let tomorrow = drip.day + 1
        if tomorrow <= FirstWeek.LAST_DAY,
           let ask = FirstWeek.ASKS
            .filter({ $0.day <= tomorrow && !drip.done.contains($0.id) && !(isPro && $0.slot == "checkin") })
            .sorted(by: { $0.day < $1.day }).first,
           let (comps, _) = at(ask.morningOnly ? "08:00" : "16:00", daysAhead: 1) {
            let screen: Screen = isPro && ask.slot == "plan" ? .plan : .home
            out.append(Planned(id: "ask-\(ask.id)", title: ask.ask, body: ask.sub,
                               screen: screen.rawValue, at: comps))
        }

        /* bedtime mode, every night */
        if bedtime.on {
            let m = Addons.toMins(bedtime.from)
            out.append(Planned(id: "bedtime", title: bedtimeTitle, body: bedtimeBody,
                               screen: Screen.home.rawValue,
                               at: DateComponents(hour: m / 60, minute: m % 60), repeats: true))
        }
        return out
    }

    // MARK: UNUserNotificationCenterDelegate

    /// show it even while the app is open (a banner over the app)
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .list, .sound]
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            didReceive response: UNNotificationResponse) async {
        let raw = response.notification.request.content.userInfo["screen"] as? String
        await MainActor.run {
            guard let raw, let screen = Screen(rawValue: raw) else { return }
            track("notifications", "opened \(raw)")
            if let onOpen { onOpen(screen) } else { waiting = screen }
        }
    }
}

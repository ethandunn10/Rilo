import EventKit
import Foundation

/// The ONE seam for reading the user's calendar.
///
/// - `EventKitCalendarService` (the default): Apple's EventKit. One "allow"
///   reads every calendar on the phone, so Google, Outlook, Yahoo, iCloud...
///   all come along whenever that account is added in iPhone Settings ▸
///   Calendar ▸ Accounts. Read only: Rilo never writes an event. Free, no
///   account, no API key, nothing leaves the phone.
/// - `DemoCalendarService`: the fixed week in MockAI.DEMO_CALENDAR, with the
///   pretend system sheet (CalendarSystemSheet). Used by the DEBUG
///   screenshot seeds and the self/flow checks.
///
/// AppState keeps what was read in `calendarEvents` (not saved; reloaded on
/// launch and whenever the app comes back to the front).
@MainActor
protocol CalendarService: AnyObject {
    /// true → the fake sheet and the demo week
    var isDemo: Bool { get }
    /// already allowed (so a reload can go ahead without asking)
    var hasAccess: Bool { get }
    /// the real iOS prompt. nil = they said no (or said no before).
    func requestAccess() async -> CalendarGrant?
    /// the next 7 days, from every calendar, starting today
    func loadWeek() -> [CalendarEvent]
}

/// what an "allow" found
nonisolated struct CalendarGrant: Equatable, Sendable {
    /// the accounts the calendars live in ("iCloud", "Gmail", "Outlook")
    var sources: [String]
}

// MARK: - demo

final class DemoCalendarService: CalendarService {
    let isDemo = true
    var hasAccess: Bool { true }
    func requestAccess() async -> CalendarGrant? { CalendarGrant(sources: []) }
    func loadWeek() -> [CalendarEvent] { MockAI.DEMO_CALENDAR }
}

// MARK: - real (EventKit)

final class EventKitCalendarService: CalendarService {
    let isDemo = false
    private let store = EKEventStore()

    var hasAccess: Bool { EKEventStore.authorizationStatus(for: .event) == .fullAccess }

    func requestAccess() async -> CalendarGrant? {
        let granted: Bool
        do { granted = try await store.requestFullAccessToEvents() } catch { granted = false }
        guard granted else { return nil }
        /* the store caches from before the allow; start fresh */
        store.reset()
        return CalendarGrant(sources: sourceNames())
    }

    func loadWeek() -> [CalendarEvent] {
        guard hasAccess else { return [] }
        let cal = Calendar.current
        let start = cal.startOfDay(for: Date())
        guard let end = cal.date(byAdding: .day, value: 7, to: start) else { return [] }
        let pred = store.predicateForEvents(withStart: start, end: end, calendars: nil)
        return store.events(matching: pred)
            .filter { !$0.isAllDay && $0.startDate >= start }
            .sorted { $0.startDate < $1.startDate }
            .map { CalendarMapping.event(title: $0.title ?? "", start: $0.startDate, calendar: cal) }
    }

    /// the accounts behind the calendars, e.g. ["Gmail", "iCloud"]
    private func sourceNames() -> [String] {
        var seen: [String] = []
        for c in store.calendars(for: .event) {
            let t = c.source.title.trimmingCharacters(in: .whitespaces)
            if !t.isEmpty && !seen.contains(t) { seen.append(t) }
        }
        return seen
    }
}

/// EKEvent → CalendarEvent, in DEMO_CALENDAR's shape: day "mon"…"sun",
/// at "HH:MM" (24h), lowercase title, kind for MockAI.calendarPlan.
nonisolated enum CalendarMapping {
    static func event(title: String, start: Date, calendar cal: Calendar) -> CalendarEvent {
        /* weekday: 1 = sunday … 7 = saturday */
        let wd = cal.component(.weekday, from: start)
        /* same as MockAI.DAY_ORDER (which is main-actor) */
        let day = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"][(wd + 5) % 7]
        let h = cal.component(.hour, from: start)
        let m = cal.component(.minute, from: start)
        let at = String(format: "%02d:%02d", h, m)
        let t = title.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        return CalendarEvent(day: day, at: at, title: t.isEmpty ? "something" : t, kind: kind(t))
    }

    /// same words MockAI's nightly check-in looks for. calendarPlan acts on
    /// test (lock apps the night before), practice and work (keep it free).
    private static let KINDS: [(re: String, kind: String)] = [
        ("\\btests?\\b|quiz|exam|\\bfinals?\\b|midterm", "test"),
        ("practice|training|\\bgames?\\b|\\bmatch|tryout|scrimmage|rehearsal|\\bmeet\\b|tournament|\\bvs\\.?\\b", "practice"),
        ("\\bwork\\b|shift|\\bjob\\b", "work"),
        ("tutor|study|homework|\\bclass\\b|lesson|\\bhw\\b", "study"),
    ]

    static func kind(_ title: String) -> String {
        for k in KINDS where JS.test(k.re, title) { return k.kind }
        return "event"
    }
}

// MARK: - THE switch

enum CalendarServices {
    static func make() -> any CalendarService {
        #if DEBUG
        /* the screenshot seeds and checks always run on the demo week */
        if DemoSeed.screenArg != nil || DemoSeed.flag("-selfcheck") || DemoSeed.flag("-flowcheck") {
            return DemoCalendarService()
        }
        #endif
        return EventKitCalendarService()
    }
}

import Foundation

/// The real calendar (Services/CalendarService). Connecting asks iOS for
/// read access; once allowed the week is read on launch and whenever the
/// app comes back. The DEMO "fake calendar" (which == DEMO_CALENDAR_NAME)
/// and the demo service both use MockAI.DEMO_CALENDAR.
extension AppState {
    static let DEMO_CALENDAR_NAME = "Demo Calendar"

    /// the events every calendar reader plans around
    var calendarWeek: [CalendarEvent] {
        guard calendar.on else { return [] }
        if calendarService.isDemo || calendar.which == Self.DEMO_CALENDAR_NAME { return MockAI.DEMO_CALENDAR }
        return calendarEvents
    }

    /// re-read the next 7 days (only when connected to the real one)
    func reloadCalendar() {
        guard calendar.on, !calendarService.isDemo, calendar.which != Self.DEMO_CALENDAR_NAME,
              calendarService.hasAccess else { return }
        let next = calendarService.loadWeek()
        if next != calendarEvents { calendarEvents = next }
    }

    /// the connect button: the real iOS prompt. false = they said no.
    func connectRealCalendar() async -> Bool {
        guard let grant = await calendarService.requestAccess() else {
            track("calendar", "denied")
            return false
        }
        var next = calendar
        next.on = true
        next.which = "your calendars"
        /* keep the extra read-only sources (notes, reminders...) they picked */
        let extras = calendar.sources.filter { s in CalendarConnectView.SOURCES.contains { $0.id == s } }
        next.sources = extras + grant.sources.filter { !extras.contains($0) }
        calendarSet(next)
        calendarEvents = calendarService.loadWeek()
        return true
    }
}

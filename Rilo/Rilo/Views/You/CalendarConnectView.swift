import SwiftUI

/// Port of app/src/screens/CalendarConnect.jsx: connecting a calendar. Same
/// shape as the Screen Time permission: Rilo asks, the system sheet appears,
/// and whichever way they answer decides how much he can plan around.
///
/// DEMO ONLY: nothing is connected and no account is signed into (no
/// EventKit). The events are MockAI.DEMO_CALENDAR.
/// App.jsx passes skin OG_SKIN, apps = watched, setCalendar = calendarSet.
/// DEBUG `-calsheet <Calendar|Google Calendar|Notes|...>` starts with that
/// system sheet up; `-calendaron` (DemoSeed) starts connected; `-calbottom`
/// starts scrolled to the end.
struct CalendarConnectView: View {
    @Environment(AppState.self) private var state
    /// in onboarding this carries on through the flow instead of going back
    var onContinue: (() -> Void)? = nil
    var onSkip: (() -> Void)? = nil

    @State private var sheet = DemoSeed.arg("-calsheet") ?? ""

    /* The other places a plan actually lives. Rilo reads them the same way
       he reads the calendar — to know what's on, never to change anything. */
    static let SOURCES: [(id: String, label: String, why: String, hex: String)] = [
        ("Notes", "notes", "to-do lists you already keep", "#F7C948"),
        ("Reminders", "reminders", "what you told your phone to nag you about", "#FF6B6B"),
        ("Google Tasks", "google tasks", "homework and assignments", "#3A8FD9"),
        ("Notion", "notion", "your school or project pages", "#2C4A36"),
    ]

    private var calendar: CalendarLink { state.calendar }
    private var connected: Bool { calendar.on }
    private var plan: [CalendarPlanItem] {
        connected ? MockAI.calendarPlan(MockAI.DEMO_CALENDAR, apps: state.watched) : []
    }

    private func setCalendar(_ next: CalendarLink) { state.calendarSet(next) }

    private func toggleSource(_ id: String) {
        if calendar.sources.contains(id) {
            var next = calendar
            next.sources = calendar.sources.filter { $0 != id }
            setCalendar(next)
            return
        }
        /* same system sheet as the calendar — it's the same kind of permission */
        sheet = id
    }

    var body: some View {
        ZStack {
            ZStack {
                SkyView(hills: .low).ignoresSafeArea()

                GeometryReader { g in
                    ScrollView(.vertical, showsIndicators: false) {
                        column
                            .padding(.top, WebLayout.top(56))
                            .padding(.horizontal, 22)
                            .padding(.bottom, WebLayout.bottom(26))
                            .frame(minHeight: g.size.height)
                    }
                    .defaultScrollAnchor(DemoSeed.flag("-calbottom") ? .bottom : .top)
                }
                .foregroundStyle(RC.ink)
            }
            /* backdrop-filter: blur(3px) on the scrim */
            .blur(radius: sheet.isEmpty ? 0 : 3)
            .animation(.easeOut(duration: 0.25), value: sheet.isEmpty)

            if !sheet.isEmpty {
                CalendarSystemSheet(
                    which: sheet,
                    onAllow: {
                        var next = calendar
                        if Self.SOURCES.contains(where: { $0.id == sheet }) {
                            next.sources = calendar.sources + [sheet]
                        } else {
                            next.on = true
                            next.which = sheet
                        }
                        setCalendar(next)
                        sheet = ""
                    },
                    onDeny: { sheet = "" }
                )
                .zIndex(30)
            }
        }
    }

    private var column: some View {
        VStack(spacing: 12) {
            RiloView(skin: AppState.OG_SKIN, mood: connected ? "proud" : "coach",
                     size: connected ? 120 : 170, talks: true)

            Text(connected ? "got it. here's what i'll do." : "let me see your week and i\u{2019}ll plan around it.")
                .font(.fredoka(connected ? 24 : 27, 600))
                .webLineHeight(connected ? 24 : 27, 1.25)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            if !connected {
                Text("practices, tests, shifts. i only read it.")
                    .font(.inter(14, 600))
                    .foregroundStyle(RC.ink2)
                    .multilineTextAlignment(.center)
            }

            /* what he found, and what he'll do about it */
            if connected {
                VStack(alignment: .leading, spacing: 9) {
                    ForEach(Array(plan.enumerated()), id: \.offset) { _, p in
                        HStack(alignment: .top, spacing: 9) {
                            Text(p.day.uppercased())
                                .font(.inter(12, 700))
                                .foregroundStyle(p.kind == "test" ? Color(hex: "#A33A2B") : RC.ink3)
                                .frame(width: 34, alignment: .leading)
                                .padding(.top, 1)
                            Text(p.why)
                                .font(.inter(14, 600))
                                .webLineHeight(14, 1.35)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                .modifier(CalendarPanel())
            }

            sourcesCard

            Spacer(minLength: 8)

            if connected {
                Button { if let onContinue { onContinue() } else { state.go(.plan) } } label: {
                    Text(onContinue != nil ? "next" : "see my plan").modifier(CalendarBigButton())
                }
                .buttonStyle(.tap)
                Button { setCalendar(CalendarLink(on: false, which: "")) } label: {
                    Text("disconnect")
                        .font(.fredoka(18, 600))
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(Capsule().fill(Color.white.opacity(0.92)))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                }
                .buttonStyle(.tap)
            } else {
                VStack(spacing: 8) {
                    Button { sheet = "Calendar" } label: {
                        Text("connect apple calendar").modifier(CalendarBigButton())
                    }
                    .buttonStyle(.tap)
                    Button { sheet = "Google Calendar" } label: {
                        Text("connect google calendar")
                            .font(.fredoka(18, 600))
                            .frame(maxWidth: .infinity)
                            .frame(height: 52)
                            .capsuleSticker(fill: Color.white.opacity(0.92), drop: 4)
                    }
                    .buttonStyle(.tap)
                    /* DEMO ONLY: skip the system sheet entirely */
                    Button { setCalendar(CalendarLink(on: true, which: "Demo Calendar")) } label: {
                        Text("demo: connect a fake calendar")
                            .font(.fredoka(13, 600))
                            .underline()
                            .foregroundStyle(RC.ink2)
                            .padding(8)
                    }
                    .buttonStyle(.tap)
                    Button { if let onSkip { onSkip() } else { state.go(.you, dir: .back) } } label: {
                        Text("not now")
                            .font(.fredoka(16, 600))
                            .padding(8)
                    }
                    .buttonStyle(.tap)
                }
            }
        }
    }

    /* other apps rilo can read, connected or not */
    private var sourcesCard: some View {
        VStack(alignment: .leading, spacing: 9) {
            VStack(alignment: .leading, spacing: 2) {
                Text("anything else i can read?").font(.fredoka(17, 600))
                Text("optional. read only, same as the calendar.")
                    .font(.inter(12.5, 600))
                    .foregroundStyle(RC.ink2)
            }
            ForEach(Self.SOURCES, id: \.id) { src in
                let on = calendar.sources.contains(src.id)
                Button { toggleSource(src.id) } label: {
                    HStack(spacing: 11) {
                        Text(String(src.label.prefix(1)))
                            .font(.fredoka(16, 700))
                            .foregroundStyle(.white)
                            .frame(width: 34, height: 34)
                            .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(Color(hex: src.hex)))
                            .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
                            .accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 0) {
                            Text(src.label).font(.fredoka(16, 600))
                            Text(src.why)
                                .font(.inter(12, 600))
                                .foregroundStyle(RC.ink3)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .multilineTextAlignment(.leading)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        Text(on ? "connected" : "connect")
                            .font(.fredoka(13, 600))
                            .foregroundStyle(on ? .white : RC.ink)
                            .padding(.horizontal, on ? 12 : 14)
                            /* a content-box span: the border adds to minHeight */
                            .frame(minHeight: on ? 32 : 36)
                            .background(Capsule().fill(on ? RC.ink : Color.clear))
                            .overlay(on ? nil : Capsule().strokeBorder(RC.line, lineWidth: 2))
                    }
                    .foregroundStyle(RC.ink)
                }
                .buttonStyle(.tap(0.97))
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .modifier(CalendarPanel())
    }
}

/// the white panels: padding 14, radius 24, white .85, 2px ink border.
/// On the web they're `width: 100%` content-box divs, so the padding and
/// border land outside the column: 16px wider than it on each side.
private struct CalendarPanel: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(14 + 2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(Color.white.opacity(0.85)))
            .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
            .padding(.horizontal, -16)
    }
}

/// CalendarConnect.jsx `btn`: the big white pill with a soft shadow
private struct CalendarBigButton: ViewModifier {
    func body(content: Content) -> some View {
        content
            .font(.fredoka(20, 600))
            .foregroundStyle(RC.ink)
            .frame(maxWidth: .infinity)
            .frame(height: 56)
            .background(Capsule().fill(.white))
            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30)
    }
}

import SwiftUI

/// You.jsx, the middle of the list: "what rilo knows about you", "what rilo
/// watches", "when rilo steps in" and "friends".
extension YouView {
    @ViewBuilder var settingsPart: some View {
        @Bindable var s = state
        YouSection(title: "what rilo knows about you")
        /* hobbies + goals, same chips as onboarding */
        ChipPicker(about: $s.about, card: { content, delay in
            AnyView(content.youCard(delay, fill: Color.white.opacity(0.55)))
        })
        .id("about")
        scrollWhenCard.id("scroll")
        memoryCard.id("memory")

        YouSection(title: "what rilo watches")
        appsCard

        YouSection(title: "when rilo steps in")
        creatorCard
        /* bedtime + school (rilo-addons-test) */
        ScheduleCard(bedtime: $s.bedtime, school: $s.school, focus: $s.focus)
            .youCard(0.22)
            .tourTarget("you-schedule", radius: 26)
        nightCard.id("night")
        calendarCard.id("calendar")

        YouSection(title: "friends")
        buddiesCard
    }

    // MARK: when they scroll (the day-4 question's own options)

    private var scrollWhenCard: some View {
        let options = FirstWeek.ASKS.first { $0.id == "scroll" }?.options ?? []
        let picked = state.about.scrollWhen ?? []
        return VStack(alignment: .leading, spacing: 10) {
            Text("when you scroll the most")
                .font(.fredoka(17, 600))
                .accessibilityAddTraits(.isHeader)
                .padding(.bottom, 8)
            ChipFlow(spacing: 7) {
                ForEach(options, id: \.id) { w in
                    let on = picked.contains(w.id)
                    Button {
                        state.about.scrollWhen = on ? picked.filter { $0 != w.id } : picked + [w.id]
                    } label: {
                        Text(w.label)
                            .font(.fredoka(15, 600))
                            .foregroundStyle(on ? .white : RC.ink)
                            .padding(.horizontal, 14 + 2)
                            .frame(minHeight: 40)
                            .background(Capsule().fill(on ? RC.greenDeep : .white))
                            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                    .accessibilityAddTraits(on ? .isSelected : [])
                }
            }
        }
        .youCard(0.22, fill: Color.white.opacity(0.55))
    }

    // MARK: apps rilo watches

    private var appsCard: some View {
        @Bindable var s = state
        return VStack(alignment: .leading, spacing: 10) {
            Text("apps rilo watches").font(.fredoka(19, 600))
                .accessibilityAddTraits(.isHeader)
            /* real Screen Time (FeatureFlags.REAL_SCREEN_TIME): Apple's picker */
            if ScreenTime.isReal(state.screenTimeService) {
                AppPickerView(maxApps: state.hasPro ? .max : Plan.FREE_MAX_APPS)
            } else {
                AppPicker(apps: $s.apps, sheet: $appSheet, refused: $refused,
                          maxApps: state.hasPro ? .max : Plan.FREE_MAX_APPS,
                          onMaxed: { state.go(.upgrade) })
            }
            AppPicker.refusedNote(refused)
            if !state.hasPro {
                Text("free blocks \(Plan.FREE_MAX_APPS) apps. pro blocks as many as you like.")
                    .font(.inter(12, 700))
                    .foregroundStyle(RC.ink2)
            }
        }
        .youCard(0.24)
        .tourTarget("you-apps", radius: 26)
        .id("apps")
    }

    // MARK: creator mode

    private var creatorCard: some View {
        let on = state.creatorModeOn
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 10) {
                Text("🎬")
                    .font(.system(size: 23))
                    .frame(width: 44, height: 44)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color(hex: "#E9F5E6")))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text("creator mode").font(.fredoka(19, 600))
                        .accessibilityAddTraits(.isHeader)
                    Text("Turn it on to add a Home button for focused Instagram posting or research. Pro feature.")
                        .font(.inter(12, 600))
                        .webLineHeight(12, 1.35)
                        .foregroundStyle(RC.ink3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Button {
                    if state.hasPro { state.creatorModeOn = !on } else { state.go(.upgrade) }
                } label: {
                    Circle()
                        .fill(.white)
                        .frame(width: 26, height: 26)
                        .offset(x: on ? 24 : 0)
                        .animation(.linear(duration: 0.16), value: on)
                        .padding(4)
                        .frame(width: 58, height: 34, alignment: .leading)
                        .background(Capsule().fill(on ? RC.greenDeep : Color(hex: "#AAB8AD")))
                }
                .buttonStyle(.plainTap)
                .accessibilityLabel("creator mode")
                .accessibilityValue(on ? "on" : "off")
                .accessibilityAddTraits(.isToggle)
            }
            if on && state.hasPro {
                Button { state.go(.creator) } label: {
                    Text("start a creator session")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(Capsule().fill(RC.ink))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
        }
        .youCard(0.215)
        .tourTarget("you-creator", radius: 26)
    }

    // MARK: the nightly check-in (pro)

    @ViewBuilder private var nightCard: some View {
        if state.hasPro {
            let at = state.night.at.isEmpty ? "21:00" : state.night.at
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 10) {
                    RiloView(skin: state.chosenRilo, mood: "sleepy", size: 54)
                        .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("nightly check-in").font(.fredoka(19, 600))
                            .accessibilityAddTraits(.isHeader)
                        Text(state.checkedInToday
                             ? "done for today. tomorrow is planned."
                             : "he asks at \(Addons.fmtClock(at)).")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                HStack(spacing: 8) {
                    WebTimeInput(value: Binding(get: { at }, set: { v in
                        var n = state.night
                        n.at = v
                        state.youSetNight(n)
                    }), a11y: "check-in time")
                    Button { state.go(.nightcheckin) } label: {
                        Text("check in now")
                            .font(.fredoka(15, 600))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .padding(.horizontal, 16 + 2)
                            .frame(minHeight: 42)
                            .background(Capsule().fill(RC.ink))
                            .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                }
            }
            .youCard(0.225)
        } else {
            ProLock(title: "nightly check-in",
                    sub: "thirty seconds before bed, and tomorrow is planned for you.",
                    padding: EdgeInsets(top: 18, leading: 18, bottom: 18, trailing: 18),
                    radius: 26) { state.go(.upgrade) }
                .rise(0.225, distance: 14, duration: 0.4)
        }
    }

    // MARK: what he remembers (on the phone only)

    private var memoryCard: some View {
        let n = state.memory.count
        return YouRowCard(delay: 0.22, skin: state.chosenRilo, mood: "curious",
                          title: "what rilo knows",
                          sub: n == 0 ? "nothing yet. talk to him and he'll remember."
                                      : "\(n) thing\(n == 1 ? "" : "s") he remembers. see or delete them.") {
            showMemory = true
        }
    }

    // MARK: calendar + buddies

    private var calendarCard: some View {
        let on = state.calendar.on
        return YouRowCard(delay: 0.23, skin: state.chosenRilo, mood: on ? "proud" : "coach",
                          title: "your calendar",
                          sub: on ? "connected. rilo plans around your week." : "let rilo plan around practices and tests.") {
            state.go(.calendar)
        }
    }

    private var buddiesCard: some View {
        let count = state.buddies.friends.count
        let sub = state.hasPro
            ? (count > 0 ? "\(count) added" : "invite code only. no profiles.")
            : "a friend sees your mood and streak, never your numbers."
        return YouRowCard(delay: 0.24, skin: state.chosenRilo, mood: "wave", title: "buddies", sub: sub,
                          badge: !state.hasPro) {
            state.go(state.hasPro ? .buddies : .upgrade)
        }
        .tourTarget("you-buddies", radius: 26)
    }
}

/// a card-shaped button: Rilo, a title and a line under it
struct YouRowCard: View {
    let delay: Double
    let skin: String
    let mood: String
    let title: String
    let sub: String
    var badge = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .center, spacing: 10) {
                RiloView(skin: skin, mood: mood, size: 54)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.fredoka(19, 600))
                    Text(sub)
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                if badge { ProBadge() }
            }
            .foregroundStyle(RC.ink)
            .youCard(delay)
        }
        .buttonStyle(.tap)
    }
}

/// `<input type="time">` as the browser draws it ("09:00 PM" and a clock),
/// with the system time picker invisibly on top.
struct WebTimeInput: View {
    @Binding var value: String
    var height: CGFloat = 42
    var radius: CGFloat = 14
    var fontSize: CGFloat = 15
    var padding: CGFloat = 10
    var color: Color = RC.ink
    var border: Color = RC.line
    /// what VoiceOver calls the picker
    var a11y = "time"

    private var date: Binding<Date> {
        Binding(get: {
            let p = value.split(separator: ":").compactMap { Int($0) }
            return Calendar.current.date(bySettingHour: p.first ?? 0, minute: p.count > 1 ? p[1] : 0,
                                         second: 0, of: Date()) ?? Date()
        }, set: { d in
            let c = Calendar.current.dateComponents([.hour, .minute], from: d)
            value = String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
        })
    }

    private var shown: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "hh:mm a"
        return f.string(from: date.wrappedValue)
    }

    var body: some View {
        HStack(spacing: 0) {
            Text(shown).font(.fredoka(fontSize, 600))
                .accessibilityHidden(true)   // the picker on top reads the time
            Spacer(minLength: 4)
            ZStack {
                Circle().stroke(color, lineWidth: 1.6).frame(width: 13, height: 13)
                SVGPath("M6.5 3.5 V6.5 L8.5 8", w: 13, h: 13)
                    .stroke(color, style: StrokeStyle(lineWidth: 1.6, lineCap: .round))
                    .frame(width: 13, height: 13)
            }
            .padding(.trailing, 6)
            .accessibilityHidden(true)
        }
        .foregroundStyle(color)
        .padding(.horizontal, padding + 2)
        .frame(maxWidth: .infinity, minHeight: height, maxHeight: height)
        .background(RoundedRectangle(cornerRadius: radius, style: .continuous).fill(Color.white))
        .overlay(RoundedRectangle(cornerRadius: radius, style: .continuous).strokeBorder(border, lineWidth: 2))
        .overlay {
            DatePicker("", selection: date, displayedComponents: .hourAndMinute)
                .labelsHidden()
                .accessibilityLabel(a11y)
                .scaleEffect(x: 1.6, y: 1.2)
                .colorMultiply(.clear)   // invisible, still tappable
                .opacity(0.02)
        }
    }
}

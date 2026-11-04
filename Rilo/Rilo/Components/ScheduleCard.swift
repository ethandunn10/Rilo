import SwiftUI

/// Port of app/src/components/ScheduleCard.jsx: bedtime, school mode and
/// focus blocks. All three lock the same set of apps (blocked and limited
/// go away, always-allowed never do, the emergency pass works through all
/// of it, §14). None is location-based: they're all just windows.
///
/// The web's `style` is the container (You.jsx's `card(delay)`): the caller
/// wraps this view in it. `spacing` is that container's gap (10).
/// `dataTourTarget` = `data-tour-target`.
struct ScheduleCard: View {
    var dataTourTarget: String? = nil
    @Binding var bedtime: Bedtime
    @Binding var school: School
    @Binding var focus: FocusBlock
    var spacing: CGFloat = 10

    static let DAY_LABEL = ["mon": "m", "tue": "t", "wed": "w", "thu": "t", "fri": "f", "sat": "s", "sun": "s"]
    /// a focus block is "lock it for the next N minutes", from now
    static let FOCUS_LENGTHS = [30, 45, 60, 90]

    static func endsIn(_ mins: Int) -> String {
        let d = Date().addingTimeInterval(Double(mins) * 60)
        let c = Calendar.current.dateComponents([.hour, .minute], from: d)
        return String(format: "%02d:%02d", c.hour ?? 0, c.minute ?? 0)
    }

    private func toggleDay(_ d: String) {
        var next = school
        next.days = next.days.contains(d) ? next.days.filter { $0 != d } : next.days + [d]
        school = next
    }

    var body: some View {
        VStack(alignment: .leading, spacing: spacing) {
            /* bedtime */
            row("bedtime mode", "rilo sleeps, your apps lock till morning.",
                on: bedtime.on, label: "Bedtime mode") { bedtime.on.toggle() }

            if bedtime.on {
                window(from: $bedtime.from, to: $bedtime.to)
            }

            divider

            /* school */
            row("school mode", "locks on a schedule, not where you are.",
                on: school.on, label: "School mode") { school.on.toggle() }

            if school.on {
                VStack(spacing: 8) {
                    HStack(spacing: 5) {
                        ForEach(Addons.SCHOOL_DAYS, id: \.self) { d in
                            let on = school.days.contains(d)
                            Button { toggleDay(d) } label: {
                                Text((Self.DAY_LABEL[d] ?? "").uppercased())
                                    .font(.fredoka(14, 600))
                                    .foregroundStyle(on ? Color.white : RC.ink)
                                    .frame(maxWidth: .infinity, minHeight: 38)
                                    .background(Capsule().fill(on ? RC.ink : Color.white.opacity(0.9)))
                                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                            }
                            .buttonStyle(.tap)
                            .accessibilityLabel(d)
                            .accessibilityAddTraits(on ? .isSelected : [])
                        }
                    }
                    window(from: $school.from, to: $school.to)
                }
            }

            divider

            /* focus block: the one you start yourself, right now */
            row("focus block",
                focus.on ? "on till \(Addons.fmtClock(focus.until)). apps locked." : "lock everything for a while, starting now.",
                on: focus.on, label: "Focus block") {
                focus = focus.on ? FocusBlock(on: false, until: "") : FocusBlock(on: true, until: Self.endsIn(45))
            }

            if !focus.on {
                HStack(spacing: 5) {
                    ForEach(Self.FOCUS_LENGTHS, id: \.self) { m in
                        Button { focus = FocusBlock(on: true, until: Self.endsIn(m)) } label: {
                            Text("\(m)m")
                                .font(.fredoka(14, 600))
                                .foregroundStyle(RC.ink)
                                .frame(maxWidth: .infinity, minHeight: 38)
                                .background(Capsule().fill(Color.white.opacity(0.9)))
                                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                        }
                        .buttonStyle(.tap)
                    }
                }
            }

            if bedtime.on || school.on || focus.on {
                Text("always-allowed apps keep working, and so does your emergency pass"
                     + (bedtime.on ? ", even after \(Addons.fmtClock(bedtime.from))" : "") + ".")
                    .font(.inter(12, 600))
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .foregroundStyle(RC.ink)
        .tourTarget(dataTourTarget)
    }

    private var divider: some View {
        Rectangle().fill(Color.rgba(18, 48, 26, 0.12)).frame(height: 1)
    }

    private func row(_ title: String, _ sub: String, on: Bool, label: String,
                     tap: @escaping () -> Void) -> some View {
        HStack(alignment: .center, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.fredoka(19, 600))
                Text(sub)
                    .font(.inter(13, 600))
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            ScheduleToggle(on: on, label: label, onTap: tap)
        }
    }

    private func window(from: Binding<String>, to: Binding<String>) -> some View {
        HStack(spacing: 8) {
            TimeField(value: from)
            Text("to").font(.inter(13, 700)).foregroundStyle(RC.ink2)
            TimeField(value: to)
        }
    }
}

/// ScheduleCard.jsx `Toggle`: the 62x34 switch
struct ScheduleToggle: View {
    let on: Bool
    let label: String
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Circle()
                .fill(on ? Color.white : RC.ink)
                .frame(width: 24, height: 24)
                .padding(.horizontal, 3 + 2)
                .frame(width: 62, height: 34, alignment: on ? .trailing : .leading)
                .background(Capsule().fill(on ? RC.ink : Color.white.opacity(0.9)))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityLabel(label)
        .accessibilityValue(on ? "on" : "off")
        .accessibilityAddTraits(.isToggle)
    }
}

/// ScheduleCard.jsx `timeInput` (`<input type="time">`, "HH:MM"). Shows the
/// time the way the browser's field does ("10:30 PM"); tapping it opens the
/// system time picker, which sits invisibly on top.
private struct TimeField: View {
    @Binding var value: String

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
        f.dateFormat = "h:mm a"
        return f.string(from: date.wrappedValue)
    }

    var body: some View {
        Text(shown)
            .font(.fredoka(15, 600))
            .foregroundStyle(RC.ink)
            .padding(.horizontal, 10 + 2)
            .frame(maxWidth: .infinity, minHeight: 42, maxHeight: 42, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Color.white))
            .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
            .overlay {
                DatePicker("", selection: date, displayedComponents: .hourAndMinute)
                    .labelsHidden()
                    .scaleEffect(x: 1.6, y: 1.2)
                    .opacity(0.02)
            }
    }
}

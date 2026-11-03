import Foundation

/// Port of app/src/lib/addons.js — check-in reasons, Rilo's mood from the
/// day, time you got back, and the bedtime / school / focus windows.

nonisolated struct CheckinReason: Equatable, Identifiable, Sendable {
    var id: String
    var label: String
    var sub: String
}

nonisolated struct TimeBack: Equatable, Sendable {
    var today: Double
    var week: Double
    var total: Double
}

nonisolated enum Addons {
    // MARK: 1. check-in reasons
    static let CHECKIN_REASONS = [
        CheckinReason(id: "messages", label: "messages", sub: "replying to someone"),
        CheckinReason(id: "post", label: "posting", sub: "something you made"),
        CheckinReason(id: "custom", label: "something else", sub: "tell me"),
        CheckinReason(id: "bored", label: "i'm bored", sub: "rilo picks something"),
        CheckinReason(id: "tired", label: "just tired", sub: "brain is fried"),
    ]

    static func checkinReasons(_ creator: String) -> [CheckinReason] {
        let posts = creator == "yes" || creator == "sometimes"
        if !posts { return CHECKIN_REASONS }
        return CHECKIN_REASONS.map { r in
            var r = r
            if r.id == "post" { r.sub = "your own content. this is the job." }
            return r
        }
    }

    // MARK: 2. Rilo's mood from how the day is going
    /// minutes off the limited + free apps before he's "chilling"
    static let IDLE_FOR_CHILL: Double = 90

    static func moodForUsage(used: Double, goal: Double, sinceBlockedMins: Double, asleep: Bool) -> String {
        if asleep { return "sleepy" }
        if sinceBlockedMins >= IDLE_FOR_CHILL { return "sleepy" }
        if goal <= 0 { return "coach" }
        let share = used / goal
        if share >= 1.25 { return "angry" }
        if share >= 1 { return "letdown" }
        if share >= 0.8 { return "curious" }
        return "proud"
    }

    static func moodNote(used: Double, goal: Double, sinceBlockedMins: Double, asleep: Bool) -> String {
        if asleep { return "rilo’s asleep. so should you be." }
        if sinceBlockedMins >= IDLE_FOR_CHILL { return "phone down a while. he’s chilling." }
        if goal <= 0 { return "" }
        let share = used / goal
        if share >= 1.25 { return "way over. he’s not thrilled." }
        if share >= 1 { return "over your goal for today." }
        if share >= 0.8 { return "close to the line." }
        return "under your goal. keep it there."
    }

    // MARK: 6. time you got back
    static func timeBack(history: [HistoryDay], baselineMins: Double, savedMinutes: Double = 0) -> TimeBack {
        func day(_ d: HistoryDay) -> Double { max(0, baselineMins - d.used) }
        let today = history.last.map(day) ?? 0
        let week = history.suffixJS(7).reduce(0) { $0 + day($1) }
        let total = history.reduce(0) { $0 + day($1) } + savedMinutes
        return TimeBack(today: today, week: week, total: total)
    }

    // MARK: 9. bedtime + school
    static func toMins(_ hhmm: String?) -> Int {
        let s = (hhmm?.isEmpty == false ? hhmm! : "0:00")
        let parts = s.components(separatedBy: ":").map { jsParseInt($0) ?? 0 }
        let h = parts.first ?? 0
        let m = parts.count > 1 ? parts[1] : 0
        return h * 60 + m
    }

    /// "22:30" → "10:30pm"
    static func fmtClock(_ hhmm: String?) -> String {
        let t = toMins(hhmm)
        let h = t / 60
        let m = String(format: "%02d", t % 60)
        let ampm = h >= 12 ? "pm" : "am"
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(m)\(ampm)"
    }

    static func inWindow(_ nowMins: Int, _ start: String?, _ end: String?) -> Bool {
        let a = toMins(start)
        let b = toMins(end)
        if a == b { return false }
        return a < b ? (nowMins >= a && nowMins < b) : (nowMins >= a || nowMins < b)
    }

    static let SCHOOL_DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    /// Is a bedtime / school / focus window open right now?
    static func lockReason(bedtime: Bedtime?, school: School?, focus: FocusBlock?, nowMins: Int, dayIndex: Int) -> ScheduleLock {
        if let bedtime, bedtime.on, inWindow(nowMins, bedtime.from, bedtime.to) {
            return ScheduleLock(locked: true, kind: "bedtime", until: bedtime.to)
        }
        if let school, school.on {
            /* dayIndex: 0 = monday, to match SCHOOL_DAYS */
            let key = SCHOOL_DAYS.indices.contains(dayIndex) ? SCHOOL_DAYS[dayIndex] : "mon"
            if school.days.contains(key) && inWindow(nowMins, school.from, school.to) {
                return ScheduleLock(locked: true, kind: "school", until: school.to)
            }
        }
        if let focus, focus.on, !focus.until.isEmpty, nowMins < toMins(focus.until) {
            return ScheduleLock(locked: true, kind: "focus", until: focus.until)
        }
        return ScheduleLock()
    }

    /// monday-first index for a Date
    static func dayIndexOf(_ date: Date) -> Int {
        let weekday = Calendar.current.component(.weekday, from: date) /* 1 = sunday */
        return (weekday - 1 + 6) % 7
    }

    /// parseInt(): leading digits (with optional sign), else nil (NaN)
    static func jsParseInt(_ s: String) -> Int? {
        let t = s.trimmingCharacters(in: .whitespaces)
        var out = ""
        for (i, c) in t.enumerated() {
            if c.isASCII && c.isNumber { out.append(c) }
            else if i == 0 && (c == "-" || c == "+") { out.append(c) }
            else { break }
        }
        return Int(out)
    }
}

import Foundation

/// Port of app/src/lib/firstWeek.js — one new question a day for the first
/// week, each in its own slot. One a day; in its place; skipping is final.

nonisolated struct AskOption: Equatable, Sendable {
    var id: String
    var label: String
}

nonisolated struct Ask: Equatable, Identifiable, Sendable {
    var id: String
    var day: Int
    /// 'checkin' | 'plan' | 'home'
    var slot: String
    var ask: String
    var sub: String
    var typed = false
    var cta: String? = nil
    var optional = false
    var morningOnly = false
    var multi = false
    var options: [AskOption] = []
}

nonisolated enum FirstWeek {
    static let ASKS: [Ask] = [
        Ask(id: "goal", day: 1, slot: "checkin",
            ask: "what are you working toward right now?",
            sub: "so i can say what a limit is actually for",
            typed: true),
        Ask(id: "calendar", day: 2, slot: "plan",
            ask: "want me to plan around practice and tests?",
            sub: "connect your calendar and tomorrow fits around what’s already on it",
            cta: "connect it", optional: true),
        Ask(id: "school", day: 3, slot: "home",
            ask: "when are you in school?",
            sub: "i’ll shut the apps during class. the pass still works if you need it",
            morningOnly: true,
            options: [
                AskOption(id: "08:00-15:00", label: "8 – 3"),
                AskOption(id: "08:30-15:30", label: "8:30 – 3:30"),
                AskOption(id: "09:00-16:00", label: "9 – 4"),
            ]),
        Ask(id: "scroll", day: 4, slot: "home",
            ask: "when do you scroll the most?",
            sub: "that’s where i’ll put the tightest limits",
            multi: true,
            options: [
                AskOption(id: "morning", label: "first thing"),
                AskOption(id: "school", label: "during school"),
                AskOption(id: "afterschool", label: "after school"),
                AskOption(id: "night", label: "at night"),
                AskOption(id: "bed", label: "in bed"),
            ]),
        Ask(id: "hobbies", day: 5, slot: "home",
            ask: "anything else you’re into?",
            sub: "the more i know, the better the thing i offer you instead",
            typed: true, multi: true,
            options: [
                AskOption(id: "music", label: "music"),
                AskOption(id: "cooking", label: "cooking"),
                AskOption(id: "drawing", label: "drawing"),
                AskOption(id: "gaming", label: "gaming"),
                AskOption(id: "outside", label: "being outside"),
                AskOption(id: "coding", label: "coding"),
            ]),
    ]

    static let LAST_DAY = 7

    /// The one question to ask here, now — or nothing (the common answer).
    static func askFor(day: Int = 1, done: [String] = [], askedOn: Int = 0, slot: String?, morning: Bool = false) -> Ask? {
        guard let slot else { return nil }
        if day > LAST_DAY { return nil }
        if askedOn == day { return nil }
        return Limits.stableSorted(ASKS.filter {
            $0.slot == slot && $0.day <= day && !done.contains($0.id) && (!$0.morningOnly || morning)
        }) { $0.day < $1.day }.first
    }

    /// Mark one asked, however it was answered. Skipping counts.
    static func markAsked(_ drip: Drip, _ id: String) -> Drip {
        var d = drip
        if !d.done.contains(id) { d.done.append(id) }
        d.askedOn = drip.day
        return d
    }

    /// A day goes by.
    static func dripToDay(_ drip: Drip, _ day: Int) -> Drip {
        var d = drip
        d.day = max(1, day)
        d.askedOn = 0
        return d
    }

    /// "08:30-15:30" → (from, to) for school windows
    static func windowOf(_ id: String?) -> (from: String, to: String) {
        let parts = (id ?? "").components(separatedBy: "-")
        let from = parts.first ?? ""
        let to = parts.count > 1 ? parts[1] : ""
        return (from.isEmpty ? "08:15" : from, to.isEmpty ? "15:00" : to)
    }

    /// the school question only shows up before noon
    static func isMorning(_ nowMins: Int) -> Bool { nowMins < 12 * 60 }
}

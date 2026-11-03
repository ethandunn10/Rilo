import Foundation

/// DEMO ONLY: the rest of app/src/demo/mockAI.js — the push-back when you
/// open a limited app, Rilo building your day, the fake calendar, the
/// nightly check-in and buddies.

nonisolated struct PushBackOption: Equatable, Identifiable, Sendable {
    var id: String
    var label: String
    var sub: String
}

nonisolated struct PushBack: Equatable, Sendable {
    var lead: String
    var options: [PushBackOption]
}

nonisolated struct ScheduleQuestion: Equatable, Identifiable, Sendable {
    var id: String
    var ask: String
    var multi = false
    var options: [AskOption]
}

/// tap answers to SCHEDULE_QUESTIONS
nonisolated struct ScheduleAnswers: Equatable, Sendable {
    var free: String? = nil
    var needs: [String]? = nil
    var bed: String? = nil
}

nonisolated struct CalendarEvent: Equatable, Sendable {
    var day: String
    var at: String
    var title: String
    var kind: String
}

/// calendarPlan() output: what the calendar means for the week ahead
nonisolated struct CalendarPlanItem: Equatable, Sendable {
    var day: String
    var from: String
    var to: String
    var why: String
    var kind: String
}

nonisolated struct NightReply: Equatable, Sendable {
    var mood: String
    var line: String
}

nonisolated struct NightQuestion: Equatable, Identifiable, Sendable {
    var id: String
    var ask: String
}

extension MockAI {
    // MARK: what he says instead of "fine, go ahead"
    static func pushBack(reason: String, app: String, hobbies: [String] = [], goals: [String] = [],
                         schedule: [ScheduleRow] = [], nowMins: Int = 0) -> PushBack? {
        if reason == "post" { return nil }
        var options: [PushBackOption] = []

        func toMins(_ at: String) -> Int? {
            let parts = at.components(separatedBy: ":")
            guard let h = Addons.jsParseInt(parts[0]) else { return nil }
            let m = parts.count > 1 ? (Addons.jsParseInt(parts[1]) ?? 0) : 0
            return h * 60 + m
        }
        let upcoming = Limits.stableSorted(
            schedule.compactMap { r -> (row: ScheduleRow, mins: Int)? in
                guard let m = toMins(r.at), !r.title.isEmpty,
                      !JS.test("bedtime|dinner|free time|chill", r.title, ignoreCase: true) else { return nil }
                return (r, m)
            }
        ) { $0.mins < $1.mins }.first { $0.mins >= nowMins - 30 }?.row

        if let upcoming {
            options.append(PushBackOption(id: "plan", label: upcoming.title,
                                          sub: !upcoming.at.isEmpty ? "it's on your plan for \(upcoming.at)" : "it's on your plan"))
        }
        let hobby = hobbies.first { upcoming == nil || !upcoming!.title.contains($0) }
        if let hobby {
            options.append(PushBackOption(id: "hobby", label: hobby, sub: "the thing you said you wanted time for"))
        }
        if let goal = goals.first, options.count < 3 {
            options.append(PushBackOption(id: "goal", label: "ten minutes on \(goal)", sub: "you said that's the plan"))
        }
        options.append(PushBackOption(id: "break", label: "just put it down", sub: "no task, no points. still counts."))

        let lead: String
        if reason == "bored" {
            lead = upcoming != nil ? "bored? \(upcoming!.title) is on your plan."
                : hobby != nil ? "bored? you said you never get time for \(hobby!)."
                : "bored is the one i can actually help with."
        } else if reason == "messages" {
            lead = "messages, sure. that's thirty seconds, not \(app)."
        } else if reason == "something" {
            lead = "one thing, then out. you know how that usually goes."
        } else {
            lead = upcoming != nil ? "before you do — \(upcoming!.title) is on your plan." : "before you do."
        }
        return PushBack(lead: lead, options: options)
    }

    // MARK: Rilo builds your day
    private static func clock(_ mins: Int) -> String {
        let h = (mins / 60) % 24
        let m = String(format: "%02d", mins % 60)
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(m)"
    }

    static let SCHEDULE_QUESTIONS = [
        ScheduleQuestion(id: "free", ask: "when are you free from?", options: [
            AskOption(id: "15:00", label: "after school"),
            AskOption(id: "16:30", label: "after practice"),
            AskOption(id: "18:00", label: "after dinner"),
            AskOption(id: "09:00", label: "all day"),
        ]),
        ScheduleQuestion(id: "needs", ask: "what has to happen today?", multi: true, options: [
            AskOption(id: "homework", label: "homework"),
            AskOption(id: "study", label: "studying"),
            AskOption(id: "practice", label: "practice"),
            AskOption(id: "work", label: "a shift"),
            AskOption(id: "hobby", label: "my thing"),
        ]),
        ScheduleQuestion(id: "bed", ask: "when's bed?", options: [
            AskOption(id: "21:30", label: "9:30"),
            AskOption(id: "22:30", label: "10:30"),
            AskOption(id: "23:30", label: "11:30"),
            AskOption(id: "00:30", label: "late"),
        ]),
    ]

    /// "HH:MM".split(':').map(Number) → minutes
    private static func hhmmMins(_ s: String) -> Int {
        let p = s.components(separatedBy: ":")
        let h = Int(Double(p[0]) ?? 0)
        let m = p.count > 1 ? Int(Double(p[1]) ?? 0) : 0
        return h * 60 + m
    }

    static func riloSchedule(hobbies: [String] = [], goals: [String] = [], school: School?, bedtime: Bedtime?,
                             scrollMins: Double = 60, answers: ScheduleAnswers? = nil) -> [ScheduleRow] {
        var rows: [ScheduleRow] = []
        func add(_ at: String, _ title: String, _ note: String) { rows.append(ScheduleRow(at: at, title: title, note: note)) }

        let from = (answers?.free).flatMap { $0.isEmpty ? nil : $0 } ?? (school?.on == true ? school!.to : "15:00")
        var t = hhmmMins(from)
        let needs = answers?.needs
        func wants(_ k: String) -> Bool { needs.map { $0.contains(k) } ?? true }

        let free1 = max(10, JS.roundInt(scrollMins * 0.25))
        let free2 = max(10, JS.roundInt(scrollMins * 0.5))

        add(clock(t), school?.on == true ? "out of school" : "chill + snack", "\(free1) min free scroll")
        t += 30

        let studyGoal = goals.first { JS.test("grade|school|college|read|code|learn", $0) }
        if wants("homework") || wants("study") {
            add(clock(t), studyGoal.map { "work on \($0)" } ?? "homework", "apps locked for 45 min")
            t += 75
        }
        if needs?.contains("practice") == true { add(clock(t), "practice", "phone stays in the bag"); t += 90 }
        if needs?.contains("work") == true { add(clock(t), "work shift", "phone away"); t += 180 }
        if let h = hobbies.first, wants("hobby") {
            add(clock(t), h, "the thing you said you wanted time for"); t += 60
        }
        let fitGoal = goals.first { JS.test("fit|team|gym|strong", $0) }
        if let fitGoal, hobbies.count > 1, wants("hobby") {
            add(clock(t), hobbies[1], "counts toward \(fitGoal)"); t += 45
        }
        add(clock(t), "dinner", "phone away"); t += 60
        add(clock(t), "free time", "\(free2) min scroll allowed"); t += 60

        let bed = (answers?.bed).flatMap { $0.isEmpty ? nil : $0 }
            ?? (bedtime?.from).flatMap { $0.isEmpty ? nil : $0 } ?? "22:30"
        add(clock(hhmmMins(bed)), "bedtime", "rilo goes to sleep, apps lock")
        return rows
    }

    // MARK: their calendar (DEMO ONLY: a fixed week)
    static let DEMO_CALENDAR = [
        CalendarEvent(day: "mon", at: "16:00", title: "basketball practice", kind: "practice"),
        CalendarEvent(day: "tue", at: "15:30", title: "tutoring", kind: "study"),
        CalendarEvent(day: "wed", at: "16:00", title: "basketball practice", kind: "practice"),
        CalendarEvent(day: "thu", at: "08:30", title: "ap bio test", kind: "test"),
        CalendarEvent(day: "fri", at: "19:00", title: "game vs. lincoln", kind: "practice"),
        CalendarEvent(day: "sat", at: "11:00", title: "work shift", kind: "work"),
    ]

    static let DAY_NAME = [
        "mon": "monday", "tue": "tuesday", "wed": "wednesday",
        "thu": "thursday", "fri": "friday", "sat": "saturday", "sun": "sunday",
    ]
    static let DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

    /// The night before a test the apps go away; practices and shifts become blocks.
    static func calendarPlan(_ events: [CalendarEvent], apps: [String] = ["tiktok"]) -> [CalendarPlanItem] {
        var out: [CalendarPlanItem] = []
        let first = apps.first ?? "undefined"
        for e in events {
            if e.kind == "test" {
                let i = DAY_ORDER.firstIndex(of: e.day) ?? -1
                let before = DAY_ORDER[((i + 6) % 7 + 7) % 7]
                out.append(CalendarPlanItem(day: before, from: "19:00", to: "21:00",
                    why: "you've got \(e.title) \(DAY_NAME[e.day] ?? ""). i'll lock \(first) 7–9 \(DAY_NAME[before] ?? "").",
                    kind: "test"))
            } else if e.kind == "practice" || e.kind == "work" {
                out.append(CalendarPlanItem(day: e.day, from: e.at, to: "",
                    why: "\(e.title) \(DAY_NAME[e.day] ?? ""). i'll keep that time free.", kind: e.kind))
            }
        }
        return out
    }

    // MARK: the nightly 30 seconds (DEMO ONLY: pattern matching, no model)
    private static let TASK_HINTS: [(re: String, title: String, note: String)] = [
        ("test|quiz|exam|final", "study", "apps locked for an hour"),
        ("homework|hw|essay|project|assignment", "homework", "apps locked for 45 min"),
        ("practice|training|game|match|tryout", "practice", "phone stays in the bag"),
        ("\\bwork\\b|shift|\\bjob\\b", "work shift", "phone away"),
        ("\\bgym\\b|\\blift|\\brun\\b|workout", "gym", "earns you xp"),
        ("guitar|piano|draw|read|paint|write", "your thing", "the one you keep skipping"),
        ("early|wake|morning", "early start", "bedtime moves up tonight"),
    ]

    static func tasksFrom(_ text: String?) -> [NightTask] {
        let t = (text ?? "").lowercased()
        var out: [NightTask] = []
        for h in TASK_HINTS where JS.test(h.re, t) && !out.contains(where: { $0.title == h.title }) {
            out.append(NightTask(title: h.title, note: h.note))
        }
        return out
    }

    static func nightReply(_ text: String?) -> NightReply {
        let t = (text ?? "").lowercased()
        if JS.test("bad|rough|awful|terrible|hard|stressed|tired", t) {
            return NightReply(mood: "letdown", line: "rough one. tomorrow's a clean slate.")
        }
        if JS.test("good|great|fine|ok|okay|solid|chill|nice", t) {
            return NightReply(mood: "proud", line: "good. let me set tomorrow up for you.")
        }
        return NightReply(mood: "coach", line: "got it. let me set tomorrow up.")
    }

    /// DEMO ONLY: canned answers so the check-in can be shown without typing
    static let DEMO_NIGHT = NightSaid(today: "it was alright, kind of a long one",
                                      tomorrow: "i have a bio test and practice after school")

    static let NIGHT_QUESTIONS = [
        NightQuestion(id: "today", ask: "how'd today go?"),
        NightQuestion(id: "tomorrow", ask: "anything on tomorrow?"),
    ]

    // MARK: buddies (no backend: codes are local, these three are fake)
    private static let CODE_LETTERS = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")

    static func makeInviteCode() -> String {
        String((0..<6).map { _ in CODE_LETTERS[Int.random(in: 0..<CODE_LETTERS.count)] })
    }

    static let DEMO_FRIENDS = [
        Friend(id: "f1", name: "maya", skin: "redpanda", mood: "proud", streak: 9, nudged: false),
        Friend(id: "f2", name: "dev", skin: "original", mood: "letdown", streak: 0, nudged: false),
        Friend(id: "f3", name: "sam", skin: "pinkpanda", mood: "coach", streak: 3, nudged: false),
    ]

    static let NUDGE_LINES = [
        "rilo poked them. they saw it.",
        "nudge sent. their rilo is staring at them.",
        "done. rilo told them you noticed.",
    ]
}

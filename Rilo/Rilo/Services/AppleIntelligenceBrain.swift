import Foundation
import FoundationModels

/// Rilo's brain on Apple's on-device model (FoundationModels). See
/// RiloBrain.swift for the seam. Every call:
///   1. checks for words that need the fixed safety reply (never the model's),
///   2. checks the model is there (Apple Intelligence on, model downloaded),
///   3. asks it, with guided generation into the structs below,
///   4. falls back to ScriptedBrain on ANY error: unavailable, guardrails,
///      refusal, too long, too slow, or an answer that doesn't fit.
///
/// Each request gets a fresh session (persona in the instructions, what Rilo
/// knows in the prompt), so the small context window never fills up. The
/// last few chat turns ride along in the prompt instead.
final class AppleIntelligenceBrain: RiloBrain {
    private let fallback = ScriptedBrain()
    /// a session made (and warmed) ahead of the next chat message
    private var warmChat: LanguageModelSession?

    var usesModel: Bool { SystemLanguageModel.default.isAvailable }

    /// give up and use the scripted line after this long
    nonisolated private static let TIMEOUT: Double = 20

    // MARK: who Rilo is

    private static let PERSONA = """
    you are rilo, a round white panda who is a screen-time buddy for teens (13 and up).
    you talk like a friendly teen: short, warm, casual, all lowercase, no emojis, never preachy, never a lecture.
    your job: get to know them (their schedule, goals, hobbies, what's coming up) and help them spend time on what they actually care about instead of scrolling.
    ask at most one short follow-up question at a time.
    never give medical, diet, weight or mental health advice. never ask for addresses, passwords or other private details.
    only use facts you were given or that they told you. don't make things up about them.
    """

    // MARK: RiloBrain

    func prewarm(context: BrainContext) {
        guard usesModel, warmChat == nil else { return }
        let s = Self.session(Self.CHAT_RULES)
        s.prewarm()
        warmChat = s
    }

    func chat(_ message: String, history: [ChatLine], context: BrainContext) async -> ChatTurn {
        if RiloSafety.isCrisis(message) { return ScriptedBrain.chat(message) }
        guard usesModel else { return await fallback.chat(message, history: history, context: context) }

        let session = warmChat ?? Self.session(Self.CHAT_RULES)
        warmChat = nil
        let past = history.suffix(6).map { "them: \(Self.cut($0.you, 300))\nrilo: \($0.rilo)" }
            .joined(separator: "\n")
        let prompt = """
        what you know about them:
        \(context.text)

        the chat so far:
        \(past.isEmpty ? "(just started)" : past)

        they just said: "\(Self.cut(message, 500))"
        """
        do {
            let out = try await Self.timed {
                try await session.respond(to: prompt, generating: ChatOut.self,
                                          options: GenerationOptions(temperature: 0.7, maximumResponseTokens: 220)).content
            }
            /* the next message gets a warm session too */
            prewarm(context: context)
            let reply = Self.clean(out.reply)
            guard !reply.isEmpty else { return ScriptedBrain.chat(message) }
            return ChatTurn(reply: reply,
                            mood: ["proud", "curious", "coach"].contains(out.mood) ? out.mood : "proud",
                            learned: Self.facts(out.learned),
                            hobbiesToAdd: Self.words(out.hobbies), goalsToAdd: Self.words(out.goals))
        } catch {
            return ScriptedBrain.chat(message)
        }
    }

    func nightCheckIn(today: String, tomorrow: String, context: BrainContext) async -> NightResult {
        if RiloSafety.isCrisis(today) || RiloSafety.isCrisis(tomorrow) {
            return ScriptedBrain.night(today: today, tomorrow: tomorrow)
        }
        guard usesModel else { return ScriptedBrain.night(today: today, tomorrow: tomorrow) }

        let session = Self.session(Self.NIGHT_RULES)
        let prompt = """
        what you know about them:
        \(context.text)

        it's their nightly check-in.
        how today went: "\(Self.cut(today, 400))"
        what's on tomorrow: "\(Self.cut(tomorrow, 400))"
        """
        do {
            let out = try await Self.timed {
                try await session.respond(to: prompt, generating: NightOut.self,
                                          options: GenerationOptions(temperature: 0.5, maximumResponseTokens: 300)).content
            }
            let line = Self.clean(out.line)
            let scripted = ScriptedBrain.night(today: today, tomorrow: tomorrow)
            var tasks: [NightTask] = []
            for t in out.tasks.prefix(5) {
                let title = Self.clean(t.title, max: 40)
                guard !title.isEmpty, !tasks.contains(where: { $0.title == title }) else { continue }
                tasks.append(NightTask(title: title, note: Self.clean(t.note, max: 60)))
            }
            return NightResult(
                reply: NightReply(mood: ["proud", "letdown", "coach"].contains(out.mood) ? out.mood : scripted.reply.mood,
                                  line: line.isEmpty ? scripted.reply.line : line),
                /* the model saw nothing booked but the words say otherwise: trust the words */
                tasks: tasks.isEmpty ? scripted.tasks : tasks,
                learned: Self.facts(out.learned))
        } catch {
            return ScriptedBrain.night(today: today, tomorrow: tomorrow)
        }
    }

    func makeSchedule(context: BrainContext, answers: ScheduleAnswers?) async -> [ScheduleRow] {
        guard usesModel else { return ScriptedBrain.schedule(context, answers) }

        let session = Self.session(Self.DAY_RULES)
        let scroll = max(20, context.goalMins / 2)
        let prompt = """
        what you know about them:
        \(context.text)

        build the rest of today, starting \(Self.said(answers?.free, "free")) and ending with bedtime\(Self.said(answers?.bed, "bed").isEmpty ? "" : " at \(Self.said(answers?.bed, "bed"))").
        what has to happen today: \(Self.needs(answers)).
        include free scroll time adding up to about \(scroll) minutes, in one or two blocks, so they stay under their goal.
        """
        do {
            let out = try await Self.timed {
                try await session.respond(to: prompt, generating: DayOut.self,
                                          options: GenerationOptions(temperature: 0.4, maximumResponseTokens: 600)).content
            }
            var rows: [(mins: Int, row: ScheduleRow)] = []
            for r in out.rows {
                guard let m = Self.mins(r.at) else { continue }
                let title = Self.clean(r.title, max: 40)
                guard !title.isEmpty, !rows.contains(where: { $0.mins == m }) else { continue }
                rows.append((m, ScheduleRow(at: Self.clock(m), title: title, note: Self.clean(r.note, max: 50))))
            }
            /* after midnight sorts after the evening */
            let from = Self.mins(answers?.free ?? "") ?? 0
            rows.sort { ($0.mins < from ? $0.mins + 1440 : $0.mins) < ($1.mins < from ? $1.mins + 1440 : $1.mins) }
            guard rows.count >= 3 else { return ScriptedBrain.schedule(context, answers) }
            return rows.prefix(12).map(\.row)
        } catch {
            return ScriptedBrain.schedule(context, answers)
        }
    }

    // MARK: rules per job

    private static let CHAT_RULES = """
    this is a chat. reply in 1 to 3 short sentences, all lowercase.
    react to what they said, then if it helps, ask one short question to learn more about them (their week, what they're into, what they want to get better at).
    if they mention something they do or want, point out how they could do it instead of scrolling.
    """

    private static let NIGHT_RULES = """
    this is the 30-second nightly check-in. reply with one short lowercase line (under 15 words) about their day, kind if it was rough, and say you'll set tomorrow up.
    then list what's happening tomorrow from what they said, as short tasks with a short note on how you'll help (like "apps locked for an hour" before a test, "phone stays in the bag" for practice).
    only list things they actually said.
    """

    private static let DAY_RULES = """
    you build today's schedule for them. use 24-hour HH:MM times, in order, 4 to 10 rows.
    fit around school hours, bedtime, their calendar events and what has to happen today.
    give real blocks for their goals and hobbies (homework, practice, their thing), dinner, and free scroll blocks with the minutes in the note (like "20 min free scroll").
    titles: 1 to 4 lowercase words. notes: a few lowercase words (like "apps locked for 45 min", "phone away").
    end with bedtime.
    """

    // MARK: helpers

    private static func session(_ rules: String) -> LanguageModelSession {
        LanguageModelSession(model: SystemLanguageModel.default, instructions: PERSONA + "\n\n" + rules)
    }

    /// the model, or a timeout, whichever comes first
    private static func timed<T: Sendable>(_ op: @escaping @Sendable () async throws -> T) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { group in
            group.addTask { try await op() }
            group.addTask {
                try await Task.sleep(for: .seconds(TIMEOUT))
                throw CancellationError()
            }
            defer { group.cancelAll() }
            guard let first = try await group.next() else { throw CancellationError() }
            return first
        }
    }

    private static func cut(_ s: String, _ n: Int) -> String {
        s.count > n ? String(s.prefix(n)) : s
    }

    /// lowercase, one line, no quotes or emoji-only noise, capped
    private static func clean(_ s: String, max n: Int = 260) -> String {
        var t = s.lowercased()
            .replacingOccurrences(of: "\n", with: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        t = t.trimmingCharacters(in: CharacterSet(charactersIn: "\"“”"))
        return cut(t, n).trimmingCharacters(in: .whitespaces)
    }

    private static func facts(_ list: [String]) -> [String] {
        list.map { clean($0, max: 90) }.filter { $0.count >= 3 }
    }

    private static func words(_ list: [String]) -> [String] {
        list.map { clean($0, max: 30) }.filter { !$0.isEmpty }
    }

    /// "HH:MM" (or "H:MM") → minutes since midnight
    private static func mins(_ s: String) -> Int? {
        let p = s.trimmingCharacters(in: .whitespaces).split(separator: ":")
        guard p.count == 2, let h = Int(p[0]), let m = Int(p[1].prefix(2)),
              (0...24).contains(h), (0...59).contains(m) else { return nil }
        return (h % 24) * 60 + m
    }

    /// minutes → "3:15", like MockAI.riloSchedule
    private static func clock(_ mins: Int) -> String {
        let h = (mins / 60) % 24
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(String(format: "%02d", mins % 60))"
    }

    /// a tapped answer as words ("after school (3:00pm)")
    private static func said(_ id: String?, _ question: String) -> String {
        guard let id, !id.isEmpty else { return question == "free" ? "now" : "" }
        let label = MockAI.SCHEDULE_QUESTIONS.first { $0.id == question }?.options.first { $0.id == id }?.label
        let time = Addons.fmtClock(id)
        return label.map { "\($0) (\(time))" } ?? time
    }

    private static func needs(_ a: ScheduleAnswers?) -> String {
        guard let ids = a?.needs, !ids.isEmpty else { return "nothing special" }
        let opts = MockAI.SCHEDULE_QUESTIONS.first { $0.id == "needs" }?.options ?? []
        return ids.map { id in id == "hobby" ? "time for their hobby" : (opts.first { $0.id == id }?.label ?? id) }
            .joined(separator: ", ")
    }
}

// MARK: - guided generation shapes

@Generable
nonisolated struct ChatOut {
    @Guide(description: "rilo's reply: 1 to 3 short, warm, casual sentences, all lowercase. may end with one short follow-up question.")
    var reply: String
    @Guide(description: "how rilo looks while saying it", .anyOf(["proud", "curious", "coach"]))
    var mood: String
    @Guide(description: "new facts about them worth remembering, each a short lowercase phrase like 'plays soccer on tuesdays', 'wants to read more' or 'has a bio test friday'. empty if nothing new.", .maximumCount(3))
    var learned: [String]
    @Guide(description: "hobbies or activities they said they do or want to do, one or two lowercase words each. empty if none.", .maximumCount(3))
    var hobbies: [String]
    @Guide(description: "goals they said they have, a few lowercase words each, like 'better grades' or 'sleep more'. empty if none.", .maximumCount(3))
    var goals: [String]
}

@Generable
nonisolated struct NightOut {
    @Guide(description: "one short lowercase line about their day, under 15 words")
    var line: String
    @Guide(description: "proud if the day went well, letdown if it was rough, coach otherwise", .anyOf(["proud", "letdown", "coach"]))
    var mood: String
    @Guide(description: "what's happening tomorrow, only things they said", .maximumCount(5))
    var tasks: [NightTaskOut]
    @Guide(description: "new facts about them worth remembering, short lowercase phrases. empty if nothing new.", .maximumCount(3))
    var learned: [String]
}

@Generable
nonisolated struct NightTaskOut {
    @Guide(description: "1 to 4 lowercase words, like 'bio test' or 'practice'")
    var title: String
    @Guide(description: "a few lowercase words on how rilo helps, like 'apps locked for an hour'")
    var note: String
}

@Generable
nonisolated struct DayOut {
    @Guide(description: "today's schedule in time order", .count(3...10))
    var rows: [DayRowOut]
}

@Generable
nonisolated struct DayRowOut {
    @Guide(description: "start time, 24-hour HH:MM, like 15:30")
    var at: String
    @Guide(description: "1 to 4 lowercase words")
    var title: String
    @Guide(description: "a few lowercase words, like 'apps locked for 45 min' or '20 min free scroll'")
    var note: String
}

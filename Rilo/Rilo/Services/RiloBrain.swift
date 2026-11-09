import Foundation

/// The ONE seam for Rilo's "thinking": the Talk chat, the nightly check-in
/// and "let rilo make your schedule".
///
/// - `AppleIntelligenceBrain` (the default, AppleIntelligenceBrain.swift):
///   Apple's on-device model (FoundationModels). Free, private, no API key,
///   nothing leaves the phone. Needs Apple Intelligence (iPhone 15 Pro or
///   newer, switched on). Whenever the model isn't there, or a call fails,
///   is refused or is too slow, it answers with `ScriptedBrain` instead.
/// - `ScriptedBrain`: today's scripted logic (Listen + MockAI). Used by the
///   DEBUG screenshot seeds and the self/flow checks, so they stay the same
///   every run.
///
/// What Rilo knows about them goes in as `BrainContext` (AppState+Memory).
@MainActor
protocol RiloBrain: AnyObject {
    /// true → the on-device model will answer (slower, so screens show "…")
    var usesModel: Bool { get }
    /// get the model loaded before they say anything (the Talk screen opening)
    func prewarm(context: BrainContext)
    func chat(_ message: String, history: [ChatLine], context: BrainContext) async -> ChatTurn
    func nightCheckIn(today: String, tomorrow: String, context: BrainContext) async -> NightResult
    func makeSchedule(context: BrainContext, answers: ScheduleAnswers?) async -> [ScheduleRow]
}

/// one back-and-forth in the Talk chat
nonisolated struct ChatLine: Equatable, Sendable {
    var you: String
    var rilo: String
}

/// what Rilo says back, and what he learned from it
nonisolated struct ChatTurn: Equatable, Sendable {
    var reply: String
    var mood = "proud"
    /// short facts worth remembering ("plays soccer on tuesdays")
    var learned: [String] = []
    var hobbiesToAdd: [String] = []
    var goalsToAdd: [String] = []
}

/// what the nightly check-in turns into
nonisolated struct NightResult: Equatable, Sendable {
    var reply: NightReply
    var tasks: [NightTask]
    var learned: [String] = []
}

/// Everything Rilo knows, in two shapes: `text` for the model (kept short,
/// the on-device model has a small window) and the plain fields the
/// scripted brain plans with.
nonisolated struct BrainContext: Equatable, Sendable {
    var text: String
    var hobbies: [String] = []
    var goals: [String] = []
    var school: School? = nil
    var bedtime: Bedtime? = nil
    var goalMins: Int = 120
}

// MARK: - safety (fixed words, never the model's)

nonisolated enum RiloSafety {
    static let REPLY = "i'm really glad you told me. please talk to a trusted adult, or call or text 988 any time (us). you matter."

    private static let WORDS = [
        "kill myself", "killing myself", "suicid", "self harm", "self-harm", "selfharm",
        "hurt myself", "hurting myself", "cut myself", "cutting myself", "want to die",
        "wanna die", "end my life", "end it all", "don't want to live", "dont want to live",
        "no reason to live", "better off dead", "not safe at home", "someone is hurting me",
        "being abused", "i'm in danger", "im in danger",
    ]

    static func isCrisis(_ text: String) -> Bool {
        let t = text.lowercased().replacingOccurrences(of: "’", with: "'")
        return WORDS.contains { t.contains($0) }
    }
}

// MARK: - scripted (today's logic)

final class ScriptedBrain: RiloBrain {
    let usesModel = false

    func prewarm(context: BrainContext) {}

    func chat(_ message: String, history: [ChatLine], context: BrainContext) async -> ChatTurn {
        Self.chat(message)
    }

    func nightCheckIn(today: String, tomorrow: String, context: BrainContext) async -> NightResult {
        Self.night(today: today, tomorrow: tomorrow)
    }

    func makeSchedule(context: BrainContext, answers: ScheduleAnswers?) async -> [ScheduleRow] {
        Self.schedule(context, answers)
    }

    /// "i like soccer" → "added soccer. i'll use that when you're bored."
    static func chat(_ message: String) -> ChatTurn {
        if RiloSafety.isCrisis(message) { return ChatTurn(reply: RiloSafety.REPLY, mood: "coach") }
        let hobbies = Listen.hobbiesIn(message)
        let goals = Listen.goalsIn(message)
        /* "i want to read more" is both the hobby "reading" and the goal "read more":
           both are still saved, but the reply names it once ("added read more.") */
        let added = hobbies.filter { hobby in !goals.contains { Listen.GOAL_COVERS[$0] == hobby } } + goals
        let reply = added.isEmpty
            ? "got it. i'll keep that in mind."
            : "added \(Listen.joinNice(added)). i'll use that when you're bored."
        return ChatTurn(reply: reply, mood: "proud",
                        learned: hobbies.map { "into \($0)" } + goals.map { "goal: \($0)" },
                        hobbiesToAdd: hobbies, goalsToAdd: goals)
    }

    static func night(today: String, tomorrow: String) -> NightResult {
        let tasks = MockAI.tasksFrom(tomorrow)
        if RiloSafety.isCrisis(today) || RiloSafety.isCrisis(tomorrow) {
            return NightResult(reply: NightReply(mood: "coach", line: RiloSafety.REPLY), tasks: tasks)
        }
        return NightResult(reply: MockAI.nightReply(today), tasks: tasks)
    }

    static func schedule(_ c: BrainContext, _ answers: ScheduleAnswers?) -> [ScheduleRow] {
        MockAI.riloSchedule(hobbies: c.hobbies, goals: c.goals, school: c.school, bedtime: c.bedtime,
                            scrollMins: Double(c.goalMins), answers: answers)
    }
}

// MARK: - THE switch

enum RiloBrains {
    static func make() -> any RiloBrain {
        #if DEBUG
        /* the screenshot seeds and checks always use the scripted brain */
        if DemoSeed.screenArg != nil || DemoSeed.flag("-selfcheck") || DemoSeed.flag("-flowcheck") {
            return ScriptedBrain()
        }
        #endif
        return AppleIntelligenceBrain()
    }
}

import Foundation

/// Port of app/src/lib/profile.js — the onboarding lists, and turning the
/// picked hobbies into Rilo's "do this instead" suggestion.

nonisolated struct Suggestion: Equatable, Sendable {
    var hobby: String?
    var bubble: String
    var task: String
    var meta: String
}

nonisolated struct CreatorAnswer: Equatable, Sendable {
    var id: String
    var label: String
    var sub: String
}

nonisolated enum Profile {
    static let HOBBIES = [
        "basketball", "soccer", "football", "golf", "gym", "running", "skating", "swimming",
        "gaming", "making videos",
        /* --- behind "show more" --- */
        "photography", "drawing", "music", "guitar", "piano", "reading", "writing", "coding",
        "cooking", "hanging with friends",
    ]

    static let GOALS = [
        "better grades", "get fit", "grow my content", "build something", "sleep more",
        "read more", "learn an instrument", "make a team", "less phone", "save money",
        /* --- behind "show more" --- */
        "learn to code", "spend time with family",
    ]

    static let HOBBIES_SHOWN = 10
    static let GOALS_SHOWN = 10

    /// (bubble, task, meta)
    private static let SUGGESTIONS: [String: (String, String, String)] = [
        "basketball": ("bored? perfect time for those free throws. {app} will still be here.", "shoot 50 free throws", "about 20 min · +40 xp"),
        "soccer": ("bored? perfect time to go take some shots. {app} will still be here.", "take 50 shots on goal", "about 25 min · +40 xp"),
        "football": ("bored? perfect time to go throw some routes. {app} will still be here.", "throw some routes", "about 30 min · +40 xp"),
        "golf": ("bored? perfect time to work on your swing. {app} will still be here.", "hit a bucket of balls", "about 30 min · +40 xp"),
        "gym": ("bored? perfect time to get a session in. {app} will still be here.", "go get your session in", "about 45 min · +40 xp"),
        "running": ("bored? perfect time to get a couple miles in. {app} will still be here.", "run a couple miles", "about 25 min · +40 xp"),
        "skating": ("bored? perfect time to go land that trick. {app} will still be here.", "go land that trick", "about 30 min · +40 xp"),
        "swimming": ("bored? perfect time to swim some laps. {app} will still be here.", "swim 20 laps", "about 30 min · +40 xp"),
        "gaming": ("bored? play something you actually choose. the feed picks for you.", "play an actual game", "about 30 min · +40 xp"),
        "making videos": ("bored? perfect time to film something. {app} will still be here.", "film 2 videos", "about 30 min · +40 xp"),
        "photography": ("bored? perfect time to go shoot something. {app} will still be here.", "go shoot 20 frames", "about 30 min · +40 xp"),
        "drawing": ("bored? perfect time to fill a page. {app} will still be here.", "fill one page", "about 25 min · +40 xp"),
        "music": ("bored? perfect time to practice. {app} will still be here.", "practice for 20 minutes", "about 20 min · +40 xp"),
        "guitar": ("bored? perfect time to run your scales. {app} will still be here.", "run your scales", "about 20 min · +40 xp"),
        "piano": ("bored? perfect time to run your scales. {app} will still be here.", "run your scales", "about 20 min · +40 xp"),
        "reading": ("bored? perfect time for those 20 pages. {app} will still be here.", "read 20 pages", "about 25 min · +40 xp"),
        "writing": ("bored? perfect time to get some words down. {app} will still be here.", "write 300 words", "about 25 min · +40 xp"),
        "coding": ("bored? perfect time to ship something small. {app} will still be here.", "ship one small thing", "about 30 min · +40 xp"),
        "cooking": ("bored? perfect time to cook something real. {app} will still be here.", "cook something real", "about 30 min · +40 xp"),
        "hanging with friends": ("bored? text someone and actually go do something. the feed can wait.", "text someone, go outside", "about an hour · +40 xp"),
    ]

    /// first hobby they left switched on, in the order shown
    static func pickedHobby(_ about: About?) -> String? { pickedHobbies(about).first }

    /// every hobby they ticked, in order
    static func pickedHobbies(_ about: About?) -> [String] {
        let all = HOBBIES + (about?.extra.hobby ?? [])
        return all.filter { about?.on[$0] == true }
    }

    /// `app` is the app they were about to open, so Rilo names the right one.
    static func suggestion(_ about: About?, app: String = "the feed", nth: Int = 0) -> Suggestion {
        func fill(_ s: String) -> String { replaceFirst(s, "{app}", app) }
        let picks = pickedHobbies(about)
        let hobby: String? = picks.isEmpty ? nil : picks[((nth % picks.count) + picks.count) % picks.count]

        guard let hobby else {
            return Suggestion(hobby: nil,
                              bubble: fill("bored? anything beats the feed right now. {app} will still be here."),
                              task: "get outside for 20 min", meta: "about 20 min · +40 xp")
        }
        if let known = SUGGESTIONS[hobby] {
            return Suggestion(hobby: hobby, bubble: fill(known.0), task: known.1, meta: known.2)
        }
        return Suggestion(hobby: hobby,
                          bubble: fill("bored? perfect time for \(hobby). {app} will still be here."),
                          task: "20 minutes of \(hobby)", meta: "about 20 min · +40 xp")
    }

    static let CREATOR_ANSWERS = [
        CreatorAnswer(id: "yes", label: "yes, all the time", sub: "posting is the point"),
        CreatorAnswer(id: "sometimes", label: "sometimes", sub: "a few times a month"),
        CreatorAnswer(id: "no", label: "no, i just watch", sub: "be honest, it helps"),
    ]

    static func postsContent(_ about: About?) -> Bool {
        about?.creator == "yes" || about?.creator == "sometimes"
    }

    /// String.prototype.replace with a string pattern: first occurrence only
    static func replaceFirst(_ s: String, _ target: String, _ with: String) -> String {
        guard let r = s.range(of: target) else { return s }
        return s.replacingCharacters(in: r, with: with)
    }
}

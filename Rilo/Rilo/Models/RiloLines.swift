import Foundation

/// What Rilo says when you poke him. Port of app/src/lib/riloLines.js.
struct RiloLine: Equatable {
    let say: String
    var mood: String? = nil
}

enum RiloLines {
    static let all: [RiloLine] = [
        RiloLine(say: "oi."),
        RiloLine(say: "that tickles.", mood: "proud"),
        RiloLine(say: "yes? i was napping.", mood: "sleepy"),
        RiloLine(say: "i'm a panda, not a button."),
        RiloLine(say: "again? okay, again.", mood: "curious"),
        RiloLine(say: "bamboo would be nice.", mood: "curious"),
        RiloLine(say: "still here.", mood: "wave"),
        RiloLine(say: "do that once more. i dare you.", mood: "coach"),
        RiloLine(say: "poke.", mood: "wave"),
        RiloLine(say: "this is my whole job, you know."),
        RiloLine(say: "careful, i'm ticklish.", mood: "proud"),
        RiloLine(say: "mm?", mood: "sleepy"),
    ]

    /// How long the line hangs around (matches the bubble animation)
    static let sayMs = 2000

    /// A different line each time, as far as that's possible.
    static func next(after lastIndex: Int = -1) -> (index: Int, line: RiloLine) {
        if all.count < 2 { return (0, all[0]) }
        var i = lastIndex
        while i == lastIndex { i = Int.random(in: 0..<all.count) }
        return (i, all[i])
    }
}

/// Skins + moods that have art (app/src/rilo/sprites.js)
enum RiloSkins {
    static let all = [
        "original", "proband", "bamboo", "shades", "beanie",
        "sakura", "studio", "redpanda", "pinkpanda", "gold",
        "hoops", "dimsum", "astro", "cowboy", "ninja", "chef", "gamer",
        "ronin", "lunar", "bambooking", "shadow", "sensei", "samurai",
    ]
    static let moods = ["coach", "wave", "proud", "curious", "sleepy", "letdown", "angry"]
}

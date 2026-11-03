import Foundation

/// Port of app/src/lib/listen.js — understanding what someone TYPES to Rilo.
/// The web removed its microphone (the comments there explain why); only the
/// text parsers are left, and they're all here. Speech (SFSpeechRecognizer)
/// is not ported — that's for later, and would feed these same parsers.
nonisolated enum Listen {
    /// full matrix, so swapped letters count as one mistake
    static func editDistance(_ a: String, _ b: String) -> Int {
        let a = Array(a), b = Array(b)
        var d = (0...a.count).map { i in (0...b.count).map { j in i == 0 ? j : (j == 0 ? i : 0) } }
        if a.isEmpty || b.isEmpty { return d[a.count][b.count] }
        for i in 1...a.count {
            for j in 1...b.count {
                let cost = a[i - 1] == b[j - 1] ? 0 : 1
                d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
                if i > 1 && j > 1 && a[i - 1] == b[j - 2] && a[i - 2] == b[j - 1] {
                    d[i][j] = min(d[i][j], d[i - 2][j - 2] + 1)
                }
            }
        }
        return d[a.count][b.count]
    }

    /// the words worth correcting, per question
    static let VOCAB: [String: [String]] = [
        "when": [
            "night", "nights", "late", "bed", "bedtime", "sleep", "school", "class",
            "classes", "lunch", "morning", "mornings", "homework", "study", "studying",
            "bored", "boring", "evening", "afternoon", "weekend", "weekends", "dinner",
            "breakfast", "practice", "work",
        ],
        "hobby": [
            "basketball", "soccer", "football", "golf", "gym", "lifting", "running",
            "track", "skating", "skateboard", "swimming", "gaming", "fortnite",
            "minecraft", "valorant", "filming", "editing", "photography", "camera",
            "drawing", "painting", "sketching", "music", "singing", "guitar", "piano",
            "drums", "reading", "books", "writing", "coding", "programming", "cooking",
            "baking", "friends", "fishing", "hunting", "boxing", "wrestling", "tennis",
            "volleyball", "baseball", "hockey", "dancing", "chess", "karate",
        ],
        "goal": [
            "grades", "school", "college", "study", "fitness", "muscle", "stronger",
            "followers", "content", "business", "startup", "sleep", "reading", "books",
            "instrument", "guitar", "piano", "varsity", "tryouts", "money", "saving",
            "coding", "programming", "family", "parents", "siblings",
        ],
    ]

    /// insertion order matters (Object.keys), so these are ordered pairs
    static let HOBBY_WORDS: [(String, String)] = [
        ("basketball", "basketball|hoop|hooping|ball(ing)?\\b|free throws"),
        ("soccer", "soccer|futbol"),
        ("football", "football"),
        ("golf", "golf"),
        ("gym", "gym|lift|lifting|work(ing)? ?out|weights"),
        ("running", "\\brun(ning)?\\b|track|cross country|jog"),
        ("skating", "skat|skateboard"),
        ("swimming", "swim"),
        ("gaming", "gam(e|es|ing)|xbox|playstation|ps5|fortnite|minecraft|valorant|2k"),
        ("making videos", "video|filming|film|youtube|edit(ing)?|content|tiktoks?\\b"),
        ("photography", "photo|camera|pictures"),
        ("drawing", "draw|art\\b|sketch|paint"),
        ("music", "music|sing|beats|rap"),
        ("guitar", "guitar"),
        ("piano", "piano"),
        ("reading", "read(ing)?\\b|books?"),
        ("writing", "writ(e|ing)"),
        ("coding", "cod(e|ing)|program|apps?\\b|computer"),
        ("cooking", "cook|bak(e|ing)"),
        ("hanging with friends", "friends|hang(ing)? out"),
    ]

    static let GOAL_WORDS: [(String, String)] = [
        ("better grades", "grades|school|gpa|ap\\b|test|study|class"),
        ("get fit", "fit|in shape|muscle|strong|weight|abs"),
        ("grow my content", "grow|followers|content|page|views|audience|brand"),
        ("build something", "build|startup|business|company|app|make money online"),
        ("sleep more", "sleep|bed"),
        ("read more", "read more|more books"),
        ("learn an instrument", "instrument|guitar|piano|drums"),
        ("make a team", "make (the )?team|varsity|tryouts|starting lineup|\\bstarter\\b"),
        ("less phone", "less phone|phone less|screen ?time|off my phone|stop scrolling"),
        ("save money", "save|money|saving"),
        ("learn to code", "learn (to )?code|coding|programming"),
        ("spend time with family", "family|parents|siblings|brother|sister"),
    ]

    static func tokens(_ text: String) -> [String] {
        text.lowercased().components(separatedBy: CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyz'").inverted)
            .filter { !$0.isEmpty }
    }

    /// one mistake in most words, two only in long ones
    static func near(_ word: String, _ target: String) -> Bool {
        if word == target { return true }
        if target.count < 5 { return false }
        if abs(word.count - target.count) > 2 { return false }
        return editDistance(word, target) <= (target.count <= 7 ? 1 : 2)
    }

    /// "noght" on the when question → (typo: "noght", meant: "night")
    static func didYouMean(_ text: String, _ which: String) -> (typo: String, meant: String)? {
        let list = which == "chat" ? (VOCAB["hobby"]! + VOCAB["goal"]!) : VOCAB[which]
        guard let list else { return nil }
        let toks = tokens(text)
        if toks.contains(where: { list.contains($0) }) { return nil }
        for t in toks where t.count >= 4 {
            if let hit = list.first(where: { $0 != t && near(t, $0) }) { return (t, hit) }
        }
        return nil
    }

    private static func matches(_ text: String, _ table: [(String, String)]) -> [String] {
        let t = " \(text.lowercased()) "
        return table.filter { JS.test($0.1, t) }.map(\.0)
    }

    static func hobbiesIn(_ text: String) -> [String] { matches(text, HOBBY_WORDS) }
    static func goalsIn(_ text: String) -> [String] { matches(text, GOAL_WORDS) }

    private static let EXPLICIT =
        "(?:my name is|my name's|names|name's|the name is|i am|i'm|im|call me|they call me|you can call me|everyone calls me|people call me|this is|it's|its)\\s+([a-z][a-z'-]*)"

    private static let FILLER =
        "^(o+h+|a+h+|h+m+|u+m+|u+h+|e+r+|y+e+a+h?|yep|yup|yes|no|ok|okay|alright|right|well|so|like|just|actually|i|its|it's|is|and|then|hi+|hey+|hello+|yo+|sup|wait|sorry|my|name|call|me|am|a|the)$"

    private static let NOT_A_NAME: Set<String> = [
        "the", "a", "an", "and", "but", "is", "am", "are", "my", "me", "you", "your",
        "what", "who", "thats", "that's", "nice", "good", "hello", "there", "name",
        "maybe", "idk", "idc", "dunno", "nothing", "none", "nope", "nah", "sure",
        "whatever", "anything", "something", "stuff", "things", "guess", "dont",
        "don't", "know", "not", "uhh", "umm", "erm", "eh",
    ]

    private static func tidyName(_ word: String?) -> String {
        guard let word, !word.isEmpty, word.count <= 16 else { return "" }
        if !JS.test("^[a-z][a-z'-]*$", word) { return "" }
        if NOT_A_NAME.contains(word) || JS.test(FILLER, word) { return "" }
        return word.components(separatedBy: "-")
            .map { $0.prefix(1).uppercased() + $0.dropFirst() }
            .joined(separator: "-")
    }

    /// "my name's ethan" / "i'm ethan" / "ethan" → "Ethan"
    static func nameIn(_ text: String) -> String {
        let clean = JS.replaceAll("[.!?,]", in: text.trimmingCharacters(in: .whitespacesAndNewlines).lowercased(), with: "")
        if let m = JS.match(EXPLICIT, clean), m.count > 1 {
            let got = tidyName(m[1])
            if !got.isEmpty { return got }
        }
        for w in clean.split(whereSeparator: \.isWhitespace).map(String.init) {
            let got = tidyName(w)
            if !got.isEmpty { return got }
        }
        return ""
    }

    private static let NON_ANSWER =
        "^(?:(?:u+m+|u+h+|h+m+|o+h+|a+h+|e+h+|well|like|so|y+e+a+h?|idk|idc|maybe|dunno|nothing|none|nope|no|yes|yep|sure|not sure|i don'?t know|don'?t know|i guess|guess|whatever|anything|something|stuff|things|ok|okay|hi+|hey+)[\\s,.!?]*)+$"

    static func isNonAnswer(_ text: String?) -> Bool {
        let t = (text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        if t.isEmpty { return true }
        return JS.test(NON_ANSWER, t, ignoreCase: true)
    }

    /// yes / sometimes / no, in whatever words; '' when it can't tell
    static func creatorIn(_ text: String?) -> String {
        let t = (text ?? "").lowercased()
        if JS.test("\\b(?:sometimes|occasionally|rarely|kinda|sorta)\\b|now and then|once in a while|every so often|here and there|not much|not often|a few times|couple times|a bit|don'?t post much|dont post much|hardly|barely", t) {
            return "sometimes"
        }
        if JS.test("\\b(?:no|nope|nah|never|lurk|lurker)\\b|not really|just watch|only watch|i watch|don'?t post|dont post|do not post|never post|not a creator", t) {
            return "no"
        }
        if JS.test("\\b(?:yes|yeah|yep|yup|ya|sure|definitely|creator|influencer|youtuber|tiktoker|streamer|content)\\b|all the time|every day|everyday|daily|a lot|lots|constantly|i post|post a lot|make videos|making videos|make content|film", t) {
            return "yes"
        }
        return ""
    }

    /// what you said on the pop-up → which screen
    static func reasonIn(_ text: String) -> String? {
        let t = text.lowercased()
        if JS.test("never ?mind|nah|nothing|no reason|close it", t) { return "never mind" }
        if JS.test("tired|sleepy|exhausted|fried|can't think", t) { return "just tired" }
        if JS.test("bored|nothing to do|boring", t) { return "i'm bored" }
        if JS.test("break|earned|rest|chill", t) { return "taking a break" }
        if JS.test("need|homework|school|message|text|dm|reply|post|upload|work|look up|check", t) { return "need it" }
        return nil
    }

    /// ["a","b","c"] → "a, b and c"
    static func joinNice(_ list: [String]) -> String {
        if list.count <= 1 { return list.joined() }
        return "\(list.dropLast().joined(separator: ", ")) and \(list.last!)"
    }

    private static let APP_ALIASES: [String: String] = [
        "instagram": "insta|\\big\\b|instagram",
        "youtube": "youtube|\\byt\\b|shorts",
        "snapchat": "snap",
        "x": "twitter|\\bx\\b",
        "tiktok": "tik ?tok",
        "clash royale": "clash",
        "disney+": "disney",
        "prime video": "prime",
    ]

    /// "tiktok and insta" → ["tiktok", "instagram"] (only the labels given)
    static func appsIn(_ text: String, _ labels: [String]) -> [String] {
        let t = " \(text.lowercased()) "
        return labels.filter { l in
            if let re = APP_ALIASES[l] { return JS.test(re, t) }
            return t.contains(" \(l) ") || t.contains(" \(l)s ")
        }
    }

    private static let WORDS: [String: Double] = [
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7,
        "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    ]

    /// "like five hours, i want two" → [5, 2]  ("half" adds .5)
    static func hoursIn(_ text: String) -> [Double] {
        var t = text.lowercased().replacingOccurrences(of: "an hour", with: "1 hour")
        t = t.replacingOccurrences(of: "a half", with: "half")
        var out: [Double] = []
        let re = "(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)( and half| and a half|½)?"
        for m in JS.matches(re, t) {
            guard let word = m[1] else { continue }
            var n = WORDS[word] ?? Double(word) ?? .nan
            if m.count > 2, m[2] != nil { n += 0.5 }
            if n > 0 && n <= 16 { out.append(n) }
        }
        return out
    }
}

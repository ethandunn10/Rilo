import Foundation

/// one thing Rilo remembers ("plays soccer on tuesdays"). Saved with
/// everything else, on the phone only. You ▸ what rilo knows shows them,
/// and they can delete any of them.
nonisolated struct RiloMemory: Codable, Equatable, Identifiable, Sendable {
    var text: String
    /// the day he learned it (YYYY-MM-DD)
    var date: String
    var id: String { text }
}

/// Rilo's memory, and the short summary of everything he knows that his
/// brain (Services/RiloBrain) gets with every question.
extension AppState {
    /// newest kept, oldest dropped
    static let MEMORY_MAX = 60

    // MARK: remembering

    func remember(_ facts: [String]) {
        var next = memory
        for raw in facts {
            let text = raw.lowercased().trimmingCharacters(in: .whitespacesAndNewlines.union(CharacterSet(charactersIn: ".")))
            guard text.count >= 3, text.count <= 120, !RiloSafety.isCrisis(text) else { continue }
            /* already known: move it to the newest end */
            next.removeAll { $0.text == text }
            next.append(RiloMemory(text: text, date: dateKey))
        }
        if next.count > Self.MEMORY_MAX { next = Array(next.suffix(Self.MEMORY_MAX)) }
        if next != memory { memory = next }
    }

    func forget(_ text: String) {
        memory.removeAll { $0.text == text }
        track("memory", "forgot one")
    }

    func forgetEverything() {
        memory = []
        track("memory", "forgot everything")
    }

    /// what a chat taught him: facts, plus hobbies and goals onto the same
    /// lists onboarding fills, so plans and suggestions use them too
    func learn(_ turn: ChatTurn) {
        addToProfile(turn.hobbiesToAdd, kind: "hobby")
        addToProfile(turn.goalsToAdd, kind: "goal")
        remember(turn.learned)
    }

    private func addToProfile(_ list: [String], kind: String) {
        guard !list.isEmpty else { return }
        var next = about
        for raw in list {
            let word = raw.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
            guard !word.isEmpty, word.count <= 30 else { continue }
            /* "playing soccer" → the "soccer" chip, when there is one */
            let known = kind == "hobby" ? Listen.hobbiesIn(word) : Listen.goalsIn(word)
            let listed = kind == "hobby" ? Profile.HOBBIES : Profile.GOALS
            if !known.isEmpty {
                for k in known { next.on[k] = true }
            } else if listed.contains(word) {
                next.on[word] = true
            } else {
                var extra = kind == "hobby" ? next.extra.hobby : next.extra.goal
                if !extra.contains(word) && extra.count < 12 { extra.append(word) }
                if kind == "hobby" { next.extra.hobby = extra } else { next.extra.goal = extra }
                next.on[word] = true
            }
        }
        if next != about { about = next }
    }

    // MARK: what the brain gets

    /// keep the summary well inside the on-device model's small window
    static let CONTEXT_MAX_CHARS = 4800

    var brainContext: BrainContext {
        BrainContext(text: brainSummary, hobbies: profileList("hobby"), goals: profileList("goal"),
                     school: school, bedtime: bedtime, goalMins: goalMins)
    }

    private var brainSummary: String {
        var out: [String] = []
        let now = Date()
        let weekday = now.formatted(.dateTime.weekday(.wide)).lowercased()
        out.append("name: \(name.isEmpty ? "(not given)" : name.lowercased()). age: 13 or older.")
        out.append("right now: \(weekday), \(Addons.fmtClock(String(format: "%02d:%02d", nowMins / 60, nowMins % 60))).")

        let hobbies = profileList("hobby"), goals = profileList("goal")
        if !hobbies.isEmpty { out.append("hobbies: \(hobbies.prefix(10).joined(separator: ", ")).") }
        if !goals.isEmpty { out.append("goals: \(goals.prefix(10).joined(separator: ", ")).") }
        if let when = about.scrollWhen, !when.isEmpty { out.append("scrolls most: \(when.joined(separator: ", ")).") }
        if school.on {
            out.append("school: \(school.days.joined(separator: " ")) \(Addons.fmtClock(school.from))–\(Addons.fmtClock(school.to)).")
        }
        if bedtime.on { out.append("bedtime: \(Addons.fmtClock(bedtime.from)), up at \(Addons.fmtClock(bedtime.to)).") }

        out.append("daily screen time goal: \(goalMins) min. used so far today: \(Int(usedTotalToday.rounded())) min.")
        let apps = tracked.prefix(8).map { app -> String in
            let s = settingOf(app)
            switch s.mode {
            case .limited: return "\(app) (\(JS.num(s.opens)) opens × \(s.minutes) min)"
            default: return "\(app) (\(s.mode.rawValue))"
            }
        }
        if !apps.isEmpty { out.append("apps rilo watches: \(apps.joined(separator: ", ")).") }

        let week = calendarWeek.prefix(12).map { "\($0.day) \(Addons.fmtClock($0.at)) \($0.title)" }
        if !week.isEmpty { out.append("calendar, next 7 days: \(week.joined(separator: "; ")).") }

        let rows = schedulePlan.rows.prefix(10).map { "\($0.at.isEmpty ? "" : $0.at + " ")\($0.title)" }
        if !rows.isEmpty { out.append("today's plan: \(rows.joined(separator: "; ")).") }

        if let said = night.said, !(said.today + said.tomorrow).isEmpty {
            out.append("last check-in (\(night.date)): today \"\(said.today.prefix(120))\", tomorrow \"\(said.tomorrow.prefix(120))\".")
        }

        let facts = memory.suffix(25).map { "- \($0.text)" }
        if !facts.isEmpty { out.append("things they told you before:\n" + facts.joined(separator: "\n")) }

        let text = out.joined(separator: "\n")
        return text.count > Self.CONTEXT_MAX_CHARS ? String(text.prefix(Self.CONTEXT_MAX_CHARS)) : text
    }
}

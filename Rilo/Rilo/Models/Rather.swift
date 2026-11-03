import Foundation

/// Port of app/src/lib/rather.js — "what would you rather spend it on?",
/// the one question onboarding asks about the person, and the flip
/// ("that's 180 gym sessions").

nonisolated struct RatherRow: Equatable, Sendable {
    var id: String
    var label: String
    var hobbies: [String]
    var goals: [String]
    /// what one of the thing costs in minutes
    var rate: Double
    var one: String
    var many: String
}

nonisolated struct InsteadOf: Equatable, Sendable {
    var count: Int
    var unit: String
    var line: String
    var id: String?
}

nonisolated enum Rather {
    static let RATHER: [RatherRow] = [
        RatherRow(id: "gym", label: "gym", hobbies: ["gym"], goals: ["get fit"],
                  rate: 60, one: "gym session", many: "gym sessions"),
        RatherRow(id: "studying", label: "studying", hobbies: ["reading"], goals: ["better grades"],
                  rate: 45, one: "study session", many: "study sessions"),
        RatherRow(id: "sports", label: "sports", hobbies: ["basketball"], goals: ["make a team"],
                  rate: 90, one: "practice", many: "practices"),
        RatherRow(id: "friends", label: "friends", hobbies: ["hanging with friends"], goals: [],
                  rate: 120, one: "afternoon with your friends", many: "afternoons with your friends"),
        RatherRow(id: "making", label: "making stuff", hobbies: ["making videos"], goals: ["build something"],
                  rate: 75, one: "thing you actually made", many: "things you actually made"),
        RatherRow(id: "reading", label: "reading", hobbies: ["reading"], goals: ["read more"],
                  rate: 360, one: "book", many: "books"),
        RatherRow(id: "skill", label: "a new skill", hobbies: ["coding"], goals: ["learn to code"],
                  rate: 6000, one: "skill, learned properly", many: "skills, learned properly"),
    ]

    /// Fold the picks into the about-you shape the rest of the app reads.
    static func applyRather(_ about: About, _ picked: [String], _ typed: [String] = []) -> About {
        var on = about.on
        /* onboarding replaces the demo defaults rather than adding to them */
        for k in on.keys { on[k] = false }
        for id in picked {
            guard let row = RATHER.first(where: { $0.id == id }) else { continue }
            row.hobbies.forEach { on[$0] = true }
            row.goals.forEach { on[$0] = true }
        }
        let clean = typed.map { $0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }.filter { !$0.isEmpty }
        var out = about
        out.on = on
        out.extra = AboutExtra(hobby: uniq(about.extra.hobby + clean), goal: about.extra.goal)
        return out
    }

    /// "64 days a year"
    static func daysPerYear(_ minutesPerDay: Double) -> Int {
        JS.roundInt(minutesPerDay * 365 / (60 * 24))
    }

    /// The same year of scrolling, counted in the first thing they picked.
    static func insteadOf(_ minutesPerDay: Double, _ picked: [String] = []) -> InsteadOf {
        let year = max(0, minutesPerDay) * 365
        guard let row = RATHER.filter({ picked.contains($0.id) }).first(where: { year / $0.rate >= 1 }) else {
            let d = daysPerYear(minutesPerDay)
            return InsteadOf(count: d, unit: "days of your own", line: "\(d) days of your own", id: nil)
        }
        let count = JS.roundInt(year / row.rate)
        let unit = count == 1 ? row.one : row.many
        return InsteadOf(count: count, unit: unit, line: "\(count) \(unit)", id: row.id)
    }

    /// Array.from(new Set(list)) — keeps first-seen order
    static func uniq(_ list: [String]) -> [String] {
        var seen = Set<String>()
        return list.filter { seen.insert($0).inserted }
    }
}

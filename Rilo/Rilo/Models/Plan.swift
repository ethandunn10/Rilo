import Foundation

/// Port of app/src/lib/plan.js — where the time goes (the generated
/// baseline), the daily goal floor, end-of-day XP and when to push strict.

nonisolated struct BreakdownApp: Codable, Equatable, Sendable {
    var app: String
    var mins: Double
    var opens: Int
    var share: Double
    /// nil when Screen Time was denied (we don't pretend to know a percentage)
    var pct: Int?
}

nonisolated struct Breakdown: Codable, Equatable, Sendable {
    var allowed: Bool
    var total: Double
    var blocked: Double
    var other: Double
    var apps: [BreakdownApp]
}

nonisolated struct DayXp: Equatable, Sendable {
    var xp: Int
    var hit: Bool
    var streak: Int
}

nonisolated enum Plan {
    private static let SHARE_WEIGHT: [String: Double] = ["tiktok": 35, "instagram": 25, "youtube": 20, "snapchat": 15]
    private static let SHARE_DEFAULT: Double = 10
    private static let OPEN_COUNT: [String: Int] = ["tiktok": 40, "snapchat": 50, "instagram": 35, "youtube": 15]
    private static let OPEN_DEFAULT = 20
    private static let OTHER_WEIGHT: Double = 30
    private static let MAX_BLOCKED_SHARE = 0.85

    private static func blockedShare(_ appList: [String]) -> Double {
        let sum = appList.reduce(0) { $0 + weight($1) }
        return min(MAX_BLOCKED_SHARE, sum / (sum + OTHER_WEIGHT))
    }

    /// free blocks three apps; pro blocks as many as they like
    static let FREE_MAX_APPS = 3

    static func watchedFor(_ appList: [String], _ isPro: Bool) -> [String] {
        isPro ? appList : Array(appList.prefix(FREE_MAX_APPS))
    }

    static func weight(_ app: String) -> Double { SHARE_WEIGHT[app] ?? SHARE_DEFAULT }
    static func baseOpens(_ app: String) -> Int { OPEN_COUNT[app] ?? OPEN_DEFAULT }

    static func hoursToMins(_ h: Double) -> Int { JS.roundInt(h * 60) }

    /// 135 → "2h 15m", 45 → "45m", 120 → "2h"
    static func fmtMins(_ mins: Double) -> String {
        let m = max(0, JS.roundInt(mins))
        let h = m / 60
        let r = m % 60
        if h == 0 { return "\(r)m" }
        if r == 0 { return "\(h)h" }
        return "\(h)h \(r)m"
    }

    /// `allowed` false means Screen Time was denied: spread evenly, no pct.
    static func buildBreakdown(_ appList: [String], _ totalMins: Double, _ allowed: Bool = true) -> Breakdown {
        let apps = appList.isEmpty ? ["tiktok"] : appList
        if !allowed {
            let each = totalMins / Double(apps.count)
            return Breakdown(allowed: false, total: totalMins, blocked: totalMins, other: 0,
                             apps: apps.map { BreakdownApp(app: $0, mins: each, opens: baseOpens($0),
                                                           share: 1 / Double(apps.count), pct: nil) })
        }
        let blocked = totalMins * blockedShare(apps)
        let sum = apps.reduce(0) { $0 + weight($1) }
        return Breakdown(allowed: true, total: totalMins, blocked: blocked, other: totalMins - blocked,
                         apps: apps.map { app in
                             let share = weight(app) / sum
                             let mins = blocked * share
                             return BreakdownApp(app: app, mins: mins, opens: baseOpens(app), share: share,
                                                 pct: JS.roundInt(mins / totalMins * 100))
                         })
    }

    /// the goal is a scoreboard, not a lock; the only floor is half an hour
    static let GOAL_FLOOR_HOURS = 0.5

    static let NUDGE_HOBBY = 10
    static let NUDGE_TIRED = 5

    /// XP comes from being under the daily goal. Over scores nothing.
    static func dayXp(used: Double, goal: Double, streak: Int) -> DayXp {
        let hit = used <= goal
        if !hit { return DayXp(xp: 0, hit: false, streak: 0) }
        let under = JS.roundInt(goal - used)
        let xp = under + 25 + min(50, 5 * (streak + 1))
        return DayXp(xp: xp, hit: true, streak: streak + 1)
    }

    static let WEEK_BONUS = 100
    static let PLAN_BONUS = 500

    /// two days over in a row, or three days leaning on the ways out
    static let OVER_DAYS_FOR_STRICT = 2

    static func shouldSuggestStrict(_ history: [HistoryDay], leanDays: Int = 0) -> Bool {
        let recent = history.suffixJS(OVER_DAYS_FOR_STRICT)
        let twoInARow = recent.count == OVER_DAYS_FOR_STRICT && recent.allSatisfy { !$0.hit }
        if twoInARow { return true }
        return leanDays >= 3
    }
}

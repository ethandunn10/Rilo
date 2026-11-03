import Foundation

/// Port of app/src/lib/limits.js — the whole screen-time system: four
/// settings per app, opens in halves, the emergency pass, borrowing, the
/// plan check and the weekly step-down. Opens are counted in halves, so every
/// opens number in here moves in 0.5 steps. The daily goal never locks
/// anything; it only drives mood, xp, streaks, "time you got back".

// MARK: 1. the four settings

nonisolated enum AppMode: String, Codable, CaseIterable, Sendable {
    case always, blocked, limited, free

    /// unknown saved modes read as limited (settingFor)
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = AppMode(rawValue: raw) ?? .limited
    }
}

nonisolated struct AppSetting: Codable, Equatable, Sendable {
    var mode: AppMode
    var opens: Double
    var minutes: Int
}

/// what lockFor() says about an app
nonisolated struct LockInfo: Equatable, Sendable {
    var locked: Bool
    /// 'bedtime' | 'school' | 'focus' | 'blocked' | 'halfstranded' | 'noopens' | nil
    var kind: String?
    var until: String? = nil
    var setting: AppSetting
    var total: Double? = nil
    var used: Double? = nil
    var left: Double? = nil
    var cap: Double? = nil
    var passable: Bool
}

/// bedtime / school / focus window (Addons.lockReason)
nonisolated struct ScheduleLock: Equatable, Sendable {
    var locked = false
    var kind: String? = nil
    var until: String? = nil
}

nonisolated struct PlanApp: Equatable, Sendable {
    var app: String
    var mins: Double
    var opens: Double? = nil
    var minutes: Int? = nil
}

nonisolated struct PlanCheck: Equatable, Sendable {
    var allows: Int
    var goal: Int
    var over: Bool
    var by: Int
    var limited: [PlanApp]
    var free: [PlanApp]
    var biggestLimited: PlanApp?
    var biggestFree: PlanApp?
}

nonisolated struct StepDown: Equatable, Sendable {
    /// 'limit' | 'minutes' | 'opens'
    var kind: String
    var to: AppSetting
    var say: String
}

/// a loosening change waiting out its 24 hours in strict mode
nonisolated struct PendingChange: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var kind: String
    var app: String
    var prev: AppSetting
    var next: AppSetting
    /// when it lands, ms since 1970
    var at: Double
    var label: String
}

nonisolated enum Limits {
    static let MODES: [AppMode] = [.always, .blocked, .limited, .free]

    static let MODE_LABEL: [AppMode: String] = [
        .always: "always allowed", .blocked: "blocked", .limited: "limited", .free: "free",
    ]
    static let MODE_SUB: [AppMode: String] = [
        .always: "never locked, never costs an open",
        .blocked: "no opens. emergency pass only",
        .limited: "x opens a day, y minutes each",
        .free: "no limit, but it counts toward your day",
    ]

    /// always allowed out of the box
    static let DEFAULT_ALWAYS = ["phone", "messages", "maps", "camera"]

    static let DEFAULT_OPENS: Double = 3
    static let DEFAULT_MINUTES = 15
    static let MIN_OPENS: Double = 0.5
    static let MAX_OPENS: Double = 12
    static let MIN_MINUTES = 5
    static let MAX_MINUTES = 60
    static let OPEN_STEP: Double = 0.5
    static let MINUTE_STEP = 5

    // MARK: 2. the numbers that don't change
    static let PASSES_PER_DAY = 1
    static let PASS_MINUTES: Double = 5
    static let BORROW_OPENS: Double = 0.5
    /// reopening this soon carries on the same session (ms)
    static let CONTINUE_MS: Double = 2 * 60 * 1000
    static let WAIT_NORMAL = 5
    static let WAIT_STRICT = 15
    /// how long a loosening change sits pending in strict mode (ms)
    static let PENDING_MS: Double = 24 * 60 * 60 * 1000

    // MARK: 3. reading an app's setting
    static func defaultSetting(_ mode: AppMode = .limited) -> AppSetting {
        AppSetting(mode: mode, opens: DEFAULT_OPENS, minutes: DEFAULT_MINUTES)
    }

    static func settingFor(_ appSettings: [String: AppSetting], _ app: String) -> AppSetting {
        if let saved = appSettings[app] {
            return AppSetting(mode: saved.mode, opens: clampOpens(saved.opens),
                              minutes: clampMinutes(Double(saved.minutes)))
        }
        return defaultSetting(DEFAULT_ALWAYS.contains(app) ? .always : .limited)
    }

    static func clampOpens(_ n: Double) -> Double {
        let v = JS.round((n.isNaN ? 0 : n) * 2) / 2
        return min(MAX_OPENS, max(MIN_OPENS, v))
    }

    static func clampMinutes(_ n: Double) -> Int {
        let v = Int(JS.round((n.isNaN ? 0 : n) / Double(MINUTE_STEP))) * MINUTE_STEP
        return min(MAX_MINUTES, max(MIN_MINUTES, v))
    }

    static func isAlways(_ s: [String: AppSetting], _ app: String) -> Bool { settingFor(s, app).mode == .always }
    static func isLimited(_ s: [String: AppSetting], _ app: String) -> Bool { settingFor(s, app).mode == .limited }
    static func isBlocked(_ s: [String: AppSetting], _ app: String) -> Bool { settingFor(s, app).mode == .blocked }

    /// always-allowed apps don't count toward the daily total
    static func countsTowardDay(_ s: [String: AppSetting], _ app: String) -> Bool { !isAlways(s, app) }

    static func appsInMode(_ s: [String: AppSetting], _ tracked: [String], _ mode: AppMode) -> [String] {
        tracked.filter { settingFor(s, $0).mode == mode }
    }

    // MARK: 4. opens, in halves
    static func halfOf(_ minutes: Int) -> Double { Double(minutes) / 2 }

    /// "2½" rather than "2.5"
    static func fmtOpens(_ n: Double) -> String {
        let v = max(0, JS.round(n * 2) / 2)
        let whole = Int(v.rounded(.down))
        let half = v - Double(whole) >= 0.5
        if !half { return String(whole) }
        return whole != 0 ? "\(whole)½" : "½"
    }

    /// Opens today, after anything borrowed against this app.
    static func opensTotalFor(setting: AppSetting, app: String, day: DayState?, borrow: BorrowIOU?, dateKey: String) -> Double {
        if setting.mode != .limited { return 0 }
        var total = setting.opens
        if day?.borrowed?.app == app { total += BORROW_OPENS }
        if let b = borrow, b.app == app, b.date == dateKey { total -= BORROW_OPENS }
        return max(0, JS.round(total * 2) / 2)
    }

    static func opensUsedFor(_ app: String, _ day: DayState?) -> Double {
        max(0, day?.opensUsed[app] ?? 0)
    }

    static func opensAvailFor(setting: AppSetting, app: String, day: DayState?, borrow: BorrowIOU?, dateKey: String) -> Double {
        let total = opensTotalFor(setting: setting, app: app, day: day, borrow: borrow, dateKey: dateKey)
        return max(0, JS.round((total - opensUsedFor(app, day)) * 2) / 2)
    }

    /// one circle per whole open: "full" | "half" | "empty"
    static func circlesFor(_ total: Double, _ used: Double) -> [String] {
        let left = max(0, total - used)
        var out: [String] = []
        var i = 0
        while Double(i) < total.rounded(.up) {
            let remaining = left - Double(i)
            if remaining >= 1 { out.append("full") }
            else if remaining >= 0.5 { out.append("half") }
            else { out.append("empty") }
            i += 1
        }
        return out
    }

    /// "2½ opens left · 15 min each"
    static func opensText(_ left: Double, _ minutes: Int) -> String {
        if left <= 0 { return "no opens left · \(minutes) min each" }
        if left == 0.5 { return "½ an open left · \(minutes) min each" }
        let n = fmtOpens(left)
        let word = left == 1 ? "open" : "opens"
        return "\(n) \(word) left · \(minutes) min each"
    }

    /// How long a session may run. `avail` is the opens left BEFORE this
    /// session is charged.
    static func sessionCapMins(avail: Double, minutes: Int, strictOn: Bool) -> Double {
        if strictOn { return avail >= 1 ? Double(minutes) : 0 }
        if avail >= 1 { return Double(minutes) }
        if avail >= 0.5 { return halfOf(minutes) }
        return 0
    }

    /// What a finished session of `mins` costs: at least ½, never more than 1.
    static func opensSpent(mins: Double, minutes: Int, strictOn: Bool) -> Double {
        if strictOn { return 1 }
        return mins <= halfOf(minutes) ? 0.5 : 1
    }

    static func canOpen(setting: AppSetting, app: String, day: DayState?, borrow: BorrowIOU?, dateKey: String, strictOn: Bool) -> Bool {
        if setting.mode == .always || setting.mode == .free { return true }
        if setting.mode == .blocked { return false }
        let avail = opensAvailFor(setting: setting, app: app, day: day, borrow: borrow, dateKey: dateKey)
        return sessionCapMins(avail: avail, minutes: setting.minutes, strictOn: strictOn) > 0
    }

    // MARK: 5. is this app locked, and why
    static func lockFor(app: String, appSettings: [String: AppSetting], day: DayState?, borrow: BorrowIOU?,
                        dateKey: String, strictOn: Bool, schedule: ScheduleLock = ScheduleLock()) -> LockInfo {
        let setting = settingFor(appSettings, app)
        if setting.mode == .always { return LockInfo(locked: false, kind: nil, setting: setting, passable: false) }
        if schedule.locked {
            return LockInfo(locked: true, kind: schedule.kind, until: schedule.until, setting: setting, passable: true)
        }
        if setting.mode == .free { return LockInfo(locked: false, kind: nil, setting: setting, passable: false) }
        if setting.mode == .blocked { return LockInfo(locked: true, kind: "blocked", setting: setting, passable: true) }

        let total = opensTotalFor(setting: setting, app: app, day: day, borrow: borrow, dateKey: dateKey)
        let used = opensUsedFor(app, day)
        let left = max(0, total - used)
        let cap = sessionCapMins(avail: left, minutes: setting.minutes, strictOn: strictOn)
        return LockInfo(
            locked: cap <= 0,
            kind: cap <= 0 ? (left > 0 ? "halfstranded" : "noopens") : nil,
            setting: setting, total: total, used: used, left: left, cap: cap, passable: true)
    }

    // MARK: 6. borrowing from tomorrow
    static func canBorrow(setting: AppSetting, app: String, day: DayState?, borrow: BorrowIOU?,
                          dateKey: String, strictOn: Bool, passesLeft: Int) -> Bool {
        if strictOn { return false }
        if setting.mode != .limited { return false }
        if passesLeft > 0 { return false }
        if day?.borrowed != nil { return false }
        return opensAvailFor(setting: setting, app: app, day: day, borrow: borrow, dateKey: dateKey) <= 0
    }

    // MARK: 7. the plan check
    static func planCheck(appSettings: [String: AppSetting], tracked: [String],
                          typicalFor: (String) -> Double, goalMins: Int) -> PlanCheck {
        let limited = appsInMode(appSettings, tracked, .limited).map { app -> PlanApp in
            let s = settingFor(appSettings, app)
            return PlanApp(app: app, mins: s.opens * Double(s.minutes), opens: s.opens, minutes: s.minutes)
        }
        let free = appsInMode(appSettings, tracked, .free).map { app in
            PlanApp(app: app, mins: max(0, JS.round(typicalFor(app))))
        }
        let allows = JS.roundInt(limited.reduce(0) { $0 + $1.mins } + free.reduce(0) { $0 + $1.mins })
        // stable sort, biggest first, like [...].sort((a, b) => b.mins - a.mins)[0]
        let biggestLimited = stableSorted(limited) { $0.mins > $1.mins }.first
        let biggestFree = stableSorted(free) { $0.mins > $1.mins }.first
        return PlanCheck(allows: allows, goal: goalMins, over: allows > goalMins, by: max(0, allows - goalMins),
                         limited: limited, free: free, biggestLimited: biggestLimited, biggestFree: biggestFree)
    }

    /// "your limits allow 4h 20m a day, but your goal is 3h. tighten tiktok, or limit youtube too."
    static func planCheckLine(_ check: PlanCheck, _ fmt: (Double) -> String) -> String {
        if !check.over {
            return "your limits allow \(fmt(Double(check.allows))) a day. that fits under your \(fmt(Double(check.goal))) goal."
        }
        var fixes: [String] = []
        if let b = check.biggestLimited { fixes.append("tighten \(b.app)") }
        if let b = check.biggestFree { fixes.append("limit \(b.app) too") }
        let how = fixes.isEmpty ? "" : " \(fixes.joined(separator: ", or "))."
        return "your limits allow \(fmt(Double(check.allows))) a day, but your goal is \(fmt(Double(check.goal))).\(how)"
    }

    // MARK: 8. the weekly step-down
    static let STEP_MINUTES = 3

    static func stepDownTargetFor(appSettings: [String: AppSetting], tracked: [String], shareFor: (String) -> Double) -> String? {
        let open = tracked.filter {
            let m = settingFor(appSettings, $0).mode
            return m == .limited || m == .free
        }
        if open.isEmpty { return nil }
        return stableSorted(open) { shareFor($0) > shareFor($1) }.first
    }

    static func stepDownFor(_ setting: AppSetting) -> StepDown? {
        if setting.mode == .free {
            return StepDown(kind: "limit",
                            to: AppSetting(mode: .limited, opens: DEFAULT_OPENS, minutes: DEFAULT_MINUTES),
                            say: "goes limited · \(JS.num(DEFAULT_OPENS)) × \(DEFAULT_MINUTES) min")
        }
        if setting.mode != .limited { return nil }
        let nextMins = setting.minutes - STEP_MINUTES
        if nextMins >= MIN_MINUTES {
            var to = setting; to.minutes = nextMins
            return StepDown(kind: "minutes", to: to, say: "goes to \(nextMins) min per open")
        }
        let nextOpens = JS.round((setting.opens - 1) * 2) / 2
        if nextOpens >= MIN_OPENS {
            var to = setting; to.opens = nextOpens
            return StepDown(kind: "opens", to: to,
                            say: "goes to \(fmtOpens(nextOpens)) open\(nextOpens == 1 ? "" : "s") a day")
        }
        return nil
    }

    /// "next week: tiktok goes to 12 min per open."
    static func stepDownLine(_ app: String, _ step: StepDown?) -> String {
        guard let step else { return "" }
        return "next week: \(app) \(step.say)."
    }

    static let GOOD_DAYS_NEEDED = 4

    static func stepDownDone(check: PlanCheck, history: [HistoryDay]) -> Bool {
        if check.over { return false }
        let week = history.suffixJS(7)
        if week.count < 7 { return false }
        return week.filter(\.hit).count >= GOOD_DAYS_NEEDED
    }

    // MARK: 9. loosening vs. tightening
    private static let ROPE: [AppMode: Int] = [.blocked: 0, .limited: 1, .free: 2, .always: 3]

    static func isLoosening(_ prev: AppSetting?, _ next: AppSetting) -> Bool {
        guard let prev else { return false }
        if prev.mode != next.mode { return ROPE[next.mode]! > ROPE[prev.mode]! }
        if next.mode != .limited { return false }
        if next.opens > prev.opens { return true }
        if next.minutes > prev.minutes { return true }
        return false
    }

    static func describeChange(_ app: String, _ prev: AppSetting?, _ next: AppSetting) -> String {
        if prev == nil || prev!.mode != next.mode {
            if next.mode == .limited { return "\(app) → limited · \(fmtOpens(next.opens)) × \(next.minutes) min" }
            return "\(app) → \(MODE_LABEL[next.mode]!)"
        }
        let prev = prev!
        if next.opens != prev.opens { return "\(app) → \(fmtOpens(next.opens)) open\(next.opens == 1 ? "" : "s") a day" }
        if next.minutes != prev.minutes { return "\(app) → \(next.minutes) min per open" }
        return "\(app) unchanged"
    }

    // MARK: 10. pending changes (strict mode)
    static func makePending(app: String, prev: AppSetting, next: AppSetting, now: Double = JS.nowMs) -> PendingChange {
        PendingChange(id: "\(app)-\(JS.num(now.rounded(.down)))", kind: "setting", app: app, prev: prev, next: next,
                      at: now + PENDING_MS, label: describeChange(app, prev, next))
    }

    /// "in 23h 41m" — the countdown on a pending change
    static func countdownText(_ at: Double, now: Double = JS.nowMs) -> String {
        let left = max(0, at - now)
        let mins = Int((left / 60000).rounded(.up))
        let h = mins / 60
        let m = mins % 60
        if h == 0 { return "\(m)m" }
        return m != 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    // MARK: 11. percentages: insight only
    static func insightLine(_ app: String, _ pct: Int?) -> String {
        guard let pct else { return "" }
        return "\(app) is \(pct)% of your screen time"
    }

    /// JS Array.sort is stable; Swift's sort isn't guaranteed to be
    static func stableSorted<T>(_ list: [T], by less: (T, T) -> Bool) -> [T] {
        list.enumerated().sorted { a, b in
            if less(a.element, b.element) { return true }
            if less(b.element, a.element) { return false }
            return a.offset < b.offset
        }.map(\.element)
    }
}

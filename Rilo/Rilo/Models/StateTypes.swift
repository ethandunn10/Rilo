import Foundation

/// The shapes of everything App.jsx keeps in state (see lib/storage.js
/// DEFAULT_STATE for what each one means). Codable so they can be saved.

nonisolated struct AboutExtra: Codable, Equatable, Sendable {
    var hobby: [String] = []
    var goal: [String] = []
}

/// what Rilo knows about them: picked hobbies/goals, typed extras, do they post
nonisolated struct About: Codable, Equatable, Sendable {
    var on: [String: Bool]
    var extra = AboutExtra()
    /// '' = not asked, then 'yes' | 'sometimes' | 'no'
    var creator = ""
    /// set by the first-week "when do you scroll the most?" question
    var scrollWhen: [String]? = nil
}

/// which apps they picked: the starting five toggled + any they added
nonisolated struct PickedApps: Codable, Equatable, Sendable {
    var on: [String: Bool] = [:]
    var extra: [String] = []
}

/// hours: now = what they're on today, goal = the daily goal
nonisolated struct TimeGoal: Codable, Equatable, Sendable {
    var now: Double
    var goal: Double
}

/// real "4th time today" counts, per app
nonisolated struct OpenCounts: Codable, Equatable, Sendable {
    var date: String
    var counts: [String: Int] = [:]
}

nonisolated struct Stats: Codable, Equatable, Sendable {
    var savedMinutes: Double = 0
    var saidNo: Int = 0
}

nonisolated struct Program: Codable, Equatable, Sendable {
    var week = 1
    var daysDone = 0
    var daysOver = 0
    var done = false
}

nonisolated struct BorrowedToday: Codable, Equatable, Sendable { var app: String }

/// the last session that ended, so reopening inside two minutes carries it on
nonisolated struct LastSession: Codable, Equatable, Sendable {
    var app: String
    var endedAt: Double
    var mins: Double
    var charged: Double
}

/// everything that resets at midnight
nonisolated struct DayState: Codable, Equatable, Sendable {
    var date: String
    var used: [String: Double] = [:]
    var opensUsed: [String: Double] = [:]
    var passes = 0
    var borrowed: BorrowedToday? = nil
    var lastSession: LastSession? = nil
    var sinceBlocked: Double = 999
    var lastBlockedAt: Double? = nil
}

/// tomorrow's IOU: the app half an open comes off, and the day it's due
nonisolated struct BorrowIOU: Codable, Equatable, Sendable {
    var date = ""
    var app = ""
}

nonisolated struct StepState: Codable, Equatable, Sendable {
    var week = 0
    var app = ""
    /// 'idle' | 'offered' | 'accepted' | 'skipped'
    var status = "idle"
    var done = false
    var skipAt: Double? = nil
}

nonisolated struct FocusBlock: Codable, Equatable, Sendable {
    var on = false
    var until = ""
}

nonisolated struct HistoryDay: Codable, Equatable, Sendable {
    var date: String
    var used: Double
    var goal: Double
    var hit: Bool
}

nonisolated struct Checkin: Codable, Equatable, Sendable {
    var app: String
    var reason: String
    var why: String
    var promised: Double
    var length: String
    var cost: Double
    var at: Double
    var date: String
    var used: Double? = nil
    var gone: Double? = nil
    var over: Bool? = nil
}

nonisolated struct Bedtime: Codable, Equatable, Sendable {
    var on = false
    var from = "22:30"
    var to = "07:00"
}

nonisolated struct School: Codable, Equatable, Sendable {
    var on = false
    var days = ["mon", "tue", "wed", "thu", "fri"]
    var from = "08:15"
    var to = "15:00"
}

nonisolated struct Friend: Codable, Equatable, Identifiable, Sendable {
    var id: String
    var name: String
    var skin: String
    var mood: String
    var streak: Int
    var nudged: Bool
    var code: String? = nil
}

nonisolated struct Buddies: Codable, Equatable, Sendable {
    var code = ""
    var friends: [Friend] = []
}

nonisolated struct ScheduleRow: Codable, Equatable, Sendable {
    var at: String
    var title: String
    var note: String
}

nonisolated struct SchedulePlan: Codable, Equatable, Sendable {
    /// 'rilo' | 'own'
    var mode = "rilo"
    var rows: [ScheduleRow] = []
}

nonisolated struct CreatorActive: Codable, Equatable, Sendable {
    var task: String
    var duration: Double?
    var startedAt: Double
}

/// Creator Mode time, tracked separately from recreational screen time
nonisolated struct CreatorStats: Codable, Equatable, Sendable {
    var date: String
    var todayMinutes: Double = 0
    var totalMinutes: Double = 0
    var sessions = 0
    var active: CreatorActive? = nil
}

nonisolated struct CalendarLink: Codable, Equatable, Sendable {
    var on = false
    var which = ""
    var sources: [String] = []
}

nonisolated struct NightSaid: Codable, Equatable, Sendable {
    var today = ""
    var tomorrow = ""
}

nonisolated struct NightTask: Codable, Equatable, Sendable {
    var title: String
    var note: String
}

/// the nightly check-in: `at` is the time they picked
nonisolated struct NightCheck: Codable, Equatable, Sendable {
    var date = ""
    var said: NightSaid? = nil
    var tasks: [NightTask] = []
    var at = "21:00"
}

/// the first week of questions (FirstWeek)
nonisolated struct Drip: Codable, Equatable, Sendable {
    var day = 1
    var done: [String] = []
    var askedOn = 0
}

nonisolated struct StrictState: Codable, Equatable, Sendable {
    var on = false
    /// 1 | 3 | 7
    var days = 7
    /// 'all' | 'school' | 'night'
    var when = "all"
    /// set when they ask to turn it off: it runs for another 24h (ms)
    var endingAt: Double? = nil
    var declined = 0
    var suggestedOn = ""
}

/// The session being "opened" right now (App.jsx `session`).
nonisolated struct Session: Equatable, Sendable {
    var app: String? = nil
    /// how many more minutes it may run
    var cap: Double = 5
    /// minutes already spent in this session before a reopen
    var carried: Double = 0
    /// opens this session has already cost
    var charged: Double = 0
    /// 'open' | 'pass' | 'free' | 'always'
    var kind = "open"
    /// the app's per-open length
    var minutes = 15
}

/// "you closed 7 min early" — shown on Home once
nonisolated struct SavedNote: Equatable, Sendable {
    var app: String
    var mins: Int
}

/// what the day summary shows
nonisolated struct DayResult: Equatable, Sendable {
    var used: Double
    var goal: Double
    var hit: Bool
    var xp: Int
    var streak: Int
    var under: Double
    var repeated: Bool
}

/// a loosening change waiting on rilo's "are you sure"
nonisolated struct LoosenAsk: Equatable, Sendable {
    var app: String
    var next: AppSetting
}

/// what startCheckedIn() takes from the check-in
nonisolated struct CheckinPick: Equatable, Sendable {
    var reason: String
    var why: String = ""
    var mins: Double
    /// 'quick' | 'full'
    var length: String
    var cost: Double
}

import Foundation

/// Port of app/src/lib/storage.js: persistence, in UserDefaults as JSON
/// under the same key the web uses for localStorage.
///
/// Like the web, EVERYTHING is saved but only a few counters come back on
/// launch (xp, level, today's open counts, Creator Mode stats and the
/// Creator Mode toggle). The app always opens on Welcome and re-runs
/// onboarding, so the onboarding answers go back to the defaults every
/// launch. introTourDone is never restored.
nonisolated struct SavedState: Codable, Equatable, Sendable {
    var name: String
    var about: About
    var apps: PickedApps
    var time: TimeGoal
    var appSettings: [String: AppSetting]
    /// 'rilo' | 'own'
    var limitMode: String
    /// 'year' | 'month' — the price selected on the paywall
    var plan: String
    /// nil until they choose: 'trial' | 'free'
    var planChoice: String?
    var isPro: Bool
    var xp: Int
    var level: Int
    var chosenRilo: String
    var theme: String
    var opens: OpenCounts
    var stats: Stats
    var screenTime: Bool?
    var triedAgain: Bool
    var breakdown: Breakdown?
    var program: Program
    var day: DayState
    var borrow: BorrowIOU
    var pending: [PendingChange]
    var step: StepState
    var focus: FocusBlock
    var history: [HistoryDay]
    var streak: Int
    var leanDays: Int
    var checkins: [Checkin]
    var bedtime: Bedtime
    var school: School
    var buddies: Buddies
    var schedule: SchedulePlan
    var creator: CreatorStats
    var creatorModeOn: Bool
    var introTourDone: Bool
    var calendar: CalendarLink
    var night: NightCheck
    var demoClock: String?
    var drip: Drip
    var strict: StrictState
}

nonisolated enum Storage {
    static let KEY = "rilo.state.v1"
    /// lib/storage.js RESET_KEY (resolveRilo is defined on the web but never
    /// called, so it isn't ported)
    static let RESET_KEY = "rilo.riloReset.v1"

    /// today's date key — UTC, exactly like the web's toISOString().slice(0, 10)
    static func today() -> String { JS.isoDay() }

    /// tomorrow, as a YYYY-MM-DD key (local +1 day, then UTC like the web)
    static func tomorrow(from: Date = Date()) -> String {
        JS.isoDay(Calendar.current.date(byAdding: .day, value: 1, to: from) ?? from)
    }

    static func freshDay(_ date: String = today()) -> DayState { DayState(date: date) }

    static var DEFAULT_STATE: SavedState {
        SavedState(
            name: "",
            about: About(on: [
                "basketball": true, "golf": true, "making videos": true,
                "better grades": true, "grow my content": true,
            ]),
            apps: PickedApps(),
            time: TimeGoal(now: 4, goal: 2),
            appSettings: [:],
            limitMode: "rilo",
            plan: "year",
            planChoice: nil,
            isPro: false,
            xp: 320,
            level: 2,
            chosenRilo: "original",
            theme: "grass",
            opens: OpenCounts(date: today()),
            stats: Stats(),
            screenTime: nil,
            triedAgain: false,
            breakdown: nil,
            program: Program(),
            day: freshDay(),
            borrow: BorrowIOU(),
            pending: [],
            step: StepState(),
            focus: FocusBlock(),
            history: [],
            streak: 0,
            leanDays: 0,
            checkins: [],
            bedtime: Bedtime(),
            school: School(),
            buddies: Buddies(),
            schedule: SchedulePlan(),
            creator: CreatorStats(date: today()),
            creatorModeOn: false,
            introTourDone: false,
            calendar: CalendarLink(),
            night: NightCheck(),
            demoClock: nil,
            drip: Drip(),
            strict: StrictState()
        )
    }

    /// Only the fields loadState() reads back. Each is optional so an older
    /// or hand-edited payload can't break the load ("merge rather than trust").
    private struct Restorable: Decodable {
        var xp: Int?
        var level: Int?
        var opens: OpenCounts?
        var creator: PartialCreator?
        var creatorModeOn: Bool?
    }

    private struct PartialCreator: Decodable {
        var date: String?
        var todayMinutes: Double?
        var totalMinutes: Double?
        var sessions: Int?
        var active: CreatorActive?
    }

    static func loadState() -> SavedState {
        var state = DEFAULT_STATE
        guard let data = UserDefaults.standard.data(forKey: KEY),
              let saved = try? JSONDecoder().decode(Restorable.self, from: data)
        else { return state }

        if let xp = saved.xp { state.xp = xp }
        if let level = saved.level { state.level = level }
        if let opens = saved.opens, opens.date == today() {
            state.opens = OpenCounts(date: opens.date, counts: opens.counts)
        }
        if let c = saved.creator {
            if let v = c.date { state.creator.date = v }
            if let v = c.todayMinutes { state.creator.todayMinutes = v }
            if let v = c.totalMinutes { state.creator.totalMinutes = v }
            if let v = c.sessions { state.creator.sessions = v }
            state.creator.active = c.active
        }
        state.creatorModeOn = saved.creatorModeOn ?? false
        state.introTourDone = false
        return state
    }

    static func saveState(_ state: SavedState) {
        guard let data = try? JSONEncoder().encode(state) else { return }
        UserDefaults.standard.set(data, forKey: KEY)
    }

    static func clearState() {
        UserDefaults.standard.removeObject(forKey: KEY)
        /* starting over forgets a mic refusal too */
        UserDefaults.standard.removeObject(forKey: "rilo.micBlocked")
    }
}

import Foundation

/// Port of app/src/lib/storage.js: persistence, in UserDefaults as JSON
/// under the same key the web uses for localStorage.
///
/// Phase 7 (a real app, not the web demo): EVERYTHING the user does comes
/// back on launch, not just the few counters the web restored. That
/// includes the onboarding answers, introTourDone, and where they were
/// (`screen`): mid-onboarding they land back on the same step, otherwise on
/// home (AppState+Saving decides). Decoding is field by field, so a payload
/// from an older build (or a broken one) falls back to the default for
/// just the fields it can't read instead of losing everything or crashing.
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

    /* Phase 7: things the web kept in memory only */
    /// the screen showing when it was saved (a Screen raw value)
    var screen: String? = nil
    /// onboarding's "what would you rather spend it on?" picks (Rather ids)
    var rather: [String] = []
    /// which beat of Your number they were on
    var numberBeat: Int = 0
    /// what Rilo said about his own plan
    var riloWhy: [String: String] = [:]
    var riloLead: [String] = []
    /// a skin unlock still waiting to be celebrated
    var pendingSkin: String? = nil

    /* the on-device brain */
    /// what Rilo remembers about them (AppState+Memory), newest last
    var memory: [RiloMemory] = []
}

/// Field-by-field decoding: anything missing or unreadable takes its default.
nonisolated extension SavedState {
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let d = Storage.DEFAULT_STATE
        func v<T: Decodable>(_ key: CodingKeys, _ fallback: T) -> T {
            ((try? c.decodeIfPresent(T.self, forKey: key)) ?? nil) ?? fallback
        }
        func o<T: Decodable>(_ key: CodingKeys) -> T? {
            (try? c.decodeIfPresent(T.self, forKey: key)) ?? nil
        }
        self.init(
            name: v(.name, d.name), about: v(.about, d.about), apps: v(.apps, d.apps),
            time: v(.time, d.time), appSettings: v(.appSettings, d.appSettings),
            limitMode: v(.limitMode, d.limitMode), plan: v(.plan, d.plan), planChoice: o(.planChoice),
            isPro: v(.isPro, d.isPro), xp: v(.xp, d.xp), level: v(.level, d.level),
            chosenRilo: v(.chosenRilo, d.chosenRilo), theme: v(.theme, d.theme),
            opens: v(.opens, d.opens), stats: v(.stats, d.stats), screenTime: o(.screenTime),
            triedAgain: v(.triedAgain, d.triedAgain), breakdown: o(.breakdown),
            program: v(.program, d.program), day: v(.day, d.day), borrow: v(.borrow, d.borrow),
            pending: v(.pending, d.pending), step: v(.step, d.step), focus: v(.focus, d.focus),
            history: v(.history, d.history), streak: v(.streak, d.streak),
            leanDays: v(.leanDays, d.leanDays), checkins: v(.checkins, d.checkins),
            bedtime: v(.bedtime, d.bedtime), school: v(.school, d.school),
            buddies: v(.buddies, d.buddies), schedule: v(.schedule, d.schedule),
            creator: v(.creator, d.creator), creatorModeOn: v(.creatorModeOn, d.creatorModeOn),
            introTourDone: v(.introTourDone, d.introTourDone), calendar: v(.calendar, d.calendar),
            night: v(.night, d.night), demoClock: o(.demoClock), drip: v(.drip, d.drip),
            strict: v(.strict, d.strict),
            screen: o(.screen), rather: v(.rather, d.rather), numberBeat: v(.numberBeat, d.numberBeat),
            riloWhy: v(.riloWhy, d.riloWhy), riloLead: v(.riloLead, d.riloLead),
            pendingSkin: o(.pendingSkin), memory: v(.memory, d.memory))
    }
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

    /// Everything saved comes back. No payload, or one that isn't a JSON
    /// object at all, is a fresh start; a payload with some unreadable
    /// fields keeps the rest (SavedState.init(from:)).
    static func loadState() -> SavedState {
        guard let data = UserDefaults.standard.data(forKey: KEY) else { return DEFAULT_STATE }
        return decode(data) ?? DEFAULT_STATE
    }

    static func decode(_ data: Data) -> SavedState? {
        guard var state = try? JSONDecoder().decode(SavedState.self, from: data) else { return nil }
        /* yesterday's "4th time today" counts don't carry over */
        if state.opens.date != today() { state.opens = OpenCounts(date: today()) }
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

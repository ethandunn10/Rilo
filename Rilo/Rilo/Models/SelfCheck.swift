#if DEBUG
import Foundation

/// DEBUG ONLY: a few of app/tests/limits.test.mjs, session.test.mjs and
/// firstweek.test.mjs, replayed against the Swift ports. Run by launching
/// with `-selfcheck`; results go to the console ("[selfcheck] ...").
enum SelfCheck {
    /// stderr, so it shows up unbuffered in `simctl launch --console`
    private static func say(_ s: String) {
        FileHandle.standardError.write(Data((s + "\n").utf8))
    }

    static func run() {
        var fail = 0
        func iss<T: Equatable>(_ name: String, _ got: T, _ want: T) {
            if got != want { fail += 1; say("[selfcheck] FAIL \(name): got \(got) want \(want)") }
        }
        let L = Limits.self
        let spend = { (m: Double, s: Bool) in L.opensSpent(mins: m, minutes: 15, strictOn: s) }
        let cap = { (a: Double, s: Bool) in L.sessionCapMins(avail: a, minutes: 15, strictOn: s) }

        // limits.test.mjs
        iss("2.1 exactly half", spend(7.5, false), 0.5)
        iss("2.2 just past half", spend(7.6, false), 1)
        iss("2.3 zero", spend(0, false), 0.5)
        iss("2.4 cap 2.5", cap(2.5, false), 15)
        iss("2.5 cap 0.5", cap(0.5, false), 7.5)
        iss("2.8 strict peek", spend(1.0 / 6, true), 1)
        iss("2.8 strict stranded", cap(0.5, true), 0)
        iss("3 circles", L.circlesFor(3, 0.5), ["full", "full", "half"])
        iss("3 text 2.5", L.opensText(2.5, 15), "2½ opens left · 15 min each")
        iss("3 text 0.5", L.opensText(0.5, 15), "½ an open left · 15 min each")
        let lim = AppSetting(mode: .limited, opens: 3, minutes: 15)
        iss("6 borrow adds", L.opensTotalFor(setting: lim, app: "tiktok", day: DayState(date: "", borrowed: BorrowedToday(app: "tiktok")),
                                             borrow: BorrowIOU(), dateKey: "2026-10-31"), 3.5)
        iss("6 borrow due", L.opensTotalFor(setting: lim, app: "tiktok", day: DayState(date: ""),
                                            borrow: BorrowIOU(date: "2026-11-01", app: "tiktok"), dateKey: "2026-11-01"), 2.5)
        let out = DayState(date: "", opensUsed: ["tiktok": 3])
        iss("6 borrow offered", L.canBorrow(setting: lim, app: "tiktok", day: out, borrow: BorrowIOU(), dateKey: "d", strictOn: false, passesLeft: 0), true)
        iss("6 not with pass", L.canBorrow(setting: lim, app: "tiktok", day: out, borrow: BorrowIOU(), dateKey: "d", strictOn: false, passesLeft: 1), false)
        iss("1 phone always", L.settingFor([:], "phone").mode, .always)
        let settings: [String: AppSetting] = [
            "tiktok": lim, "youtube": AppSetting(mode: .free, opens: 3, minutes: 15),
            "phone": AppSetting(mode: .always, opens: 3, minutes: 15),
        ]
        let chk = L.planCheck(appSettings: settings, tracked: ["tiktok", "youtube", "phone"],
                              typicalFor: { $0 == "youtube" ? 60 : 0 }, goalMins: 90)
        iss("9 allows", chk.allows, 105)
        iss("9 by", chk.by, 15)
        iss("11 minutes first", L.stepDownFor(lim)?.to.minutes, 12)
        iss("11 then an open", L.stepDownFor(AppSetting(mode: .limited, opens: 3, minutes: 5))?.to.opens, 2)
        iss("11 line", L.stepDownLine("tiktok", L.stepDownFor(lim)), "next week: tiktok goes to 12 min per open.")
        iss("12 limited->free loosens", L.isLoosening(lim, AppSetting(mode: .free, opens: 3, minutes: 15)), true)
        iss("12 free->limited tightens", L.isLoosening(AppSetting(mode: .free, opens: 3, minutes: 15), lim), false)

        // session.test.mjs: full open, immediate retry starts fresh
        var day = DayState(date: "")
        let avail = { L.opensAvailFor(setting: lim, app: "instagram", day: day, borrow: BorrowIOU(), dateKey: "d") }
        func start(_ wanted: Double) -> (cap: Double, carried: Double, charged: Double)? {
            var carry = day.lastSession
            if let c = carry, L.sessionCapMins(avail: avail() + c.charged, minutes: 15, strictOn: false) - c.mins <= 0 { carry = nil }
            let carried = carry?.mins ?? 0, charged = carry?.charged ?? 0
            let full = L.sessionCapMins(avail: avail() + charged, minutes: 15, strictOn: false)
            let c = min(wanted, full) - carried
            return c <= 0 ? nil : (c, carried, charged)
        }
        func finish(_ s: (cap: Double, carried: Double, charged: Double), _ used: Double) {
            let total = s.carried + used
            let sp = L.opensSpent(mins: total, minutes: 15, strictOn: false)
            day.opensUsed["instagram", default: 0] += max(0, sp - s.charged)
            day.lastSession = LastSession(app: "instagram", endedAt: 0, mins: total, charged: sp)
        }
        if let s1 = start(15) { finish(s1, 15) }
        iss("session left after full", avail(), 2)
        iss("session retry fresh", start(15)?.carried, 0)
        day = DayState(date: "")
        if let s3 = start(15) { finish(s3, 5) }
        iss("session half", day.opensUsed["instagram"], 0.5)
        let s4 = start(15)
        iss("session carried", s4?.cap, 10)
        if let s4 { finish(s4, 4) }
        iss("session whole open", day.opensUsed["instagram"], 1)

        // firstweek.test.mjs
        let FW = FirstWeek.self
        iss("day one at check-in", FW.askFor(day: 1, slot: "checkin")?.id, "goal")
        iss("nothing on home day one", FW.askFor(day: 1, slot: "home")?.id, nil)
        iss("backlog home", FW.askFor(day: 4, done: ["goal"], slot: "home", morning: true)?.id, "school")
        iss("backlog plan", FW.askFor(day: 4, done: ["goal"], slot: "plan")?.id, "calendar")
        iss("stops after 7", FW.askFor(day: 8, slot: "home", morning: true)?.id, nil)
        iss("window", FW.windowOf("08:30-15:30").to, "15:30")
        iss("broken window", FW.windowOf("").from, "08:15")

        // a few text parsers
        iss("nameIn", Listen.nameIn("ohhh umm yeah ethan"), "Ethan")
        iss("creatorIn", Listen.creatorIn("i'm not a creator but i post sometimes"), "sometimes")
        iss("hoursIn", Listen.hoursIn("like five hours, i want two and a half"), [5, 2.5])
        iss("fmtMins", Plan.fmtMins(135), "2h 15m")

        // Phase 7: saving round-trips, and a broken save is a fresh start
        var saved = Storage.DEFAULT_STATE
        saved.name = "Sam"; saved.xp = 999; saved.level = 5; saved.screen = "rather"
        saved.rather = ["gym"]; saved.introTourDone = true; saved.isPro = true
        saved.appSettings = ["tiktok": lim]; saved.night.at = "22:15"
        let data = (try? JSONEncoder().encode(saved)) ?? Data()
        iss("save round-trip", Storage.decode(data), saved)
        iss("save garbage", Storage.decode(Data("not json".utf8)) == nil, true)
        let partial = Storage.decode(Data(#"{"xp":5,"name":3,"screen":"pickapps","day":{"nope":1}}"#.utf8))
        iss("save partial xp", partial?.xp, 5)
        iss("save partial bad name", partial?.name, "")
        iss("save partial bad day", partial?.day.date, Storage.today())
        iss("save partial screen", partial.map(AppState.restoredScreen), .pickapps)
        saved.screen = "shield"
        iss("restore transient", AppState.restoredScreen(saved), .home)
        saved.screen = nil; saved.planChoice = nil
        iss("restore old fresh", AppState.restoredScreen(saved), .welcome)

        // Phase 7: the reminders
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "UTC")!
        let eight = cal.date(from: DateComponents(year: 2026, month: 11, day: 4, hour: 20))!
        let N = RiloNotifications.self
        let p1 = N.plan(isPro: true, night: NightCheck(), checkedInToday: false, bedtime: Bedtime(on: true),
                        drip: Drip(day: 2, done: ["goal"]), now: eight, cal: cal)
        iss("notify checkin tonight", p1.first?.id, "checkin-0")
        iss("notify checkin at", p1.first?.at.hour, 21)
        iss("notify 7 nights", p1.filter { $0.id.hasPrefix("checkin") }.count, 7)
        iss("notify ask", p1.first { $0.id.hasPrefix("ask") }?.title, "want me to plan around practice and tests?")
        iss("notify ask screen", p1.first { $0.id.hasPrefix("ask") }?.screen, "plan")
        iss("notify bedtime", p1.last?.at.hour, 22)
        let p2 = N.plan(isPro: false, night: NightCheck(), checkedInToday: true, bedtime: Bedtime(),
                        drip: Drip(day: 7), now: eight, cal: cal)
        iss("notify free: nothing", p2.count, 0)

        say("[selfcheck] \(fail == 0 ? "all good" : "\(fail) FAILED")")
    }
}
#endif

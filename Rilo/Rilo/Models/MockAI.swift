import Foundation

/// DEMO ONLY: port of app/src/demo/mockAI.js. Replace with real AI/API later.
/// Everything here is scripted: Rilo's "thinking" is a lookup table and a few
/// simple rules over what the tester said in onboarding. No model, no network.
/// (The schedule, calendar, night check-in and buddies parts are in
/// MockAI+Day.swift.)

nonisolated struct Comparison: Sendable {
    var per: Double
    var one: String
    var many: String
}

nonisolated struct InsteadSwap: Equatable, Sendable {
    var id: String
    var when: String
    var what: String
    var instead: String
}

/// what riloLimits() comes back with
nonisolated struct RiloPlan: Equatable, Sendable {
    var settings: [String: AppSetting]
    var why: [String: String]
    var lead: [String]
    var check: PlanCheck
}

nonisolated enum MockAI {
    // MARK: what Rilo says when a check-in runs over
    private static let OVER_LINES: [String: String] = [
        "messages": "you said {mins} for messages. it has been {gone}.",
        "something": "you said {mins} to look one thing up. it has been {gone}.",
        "post": "you said {mins} to post something. it has been {gone}.",
        "bored": "you said {mins} because you were bored. it has been {gone}.",
        "custom": "you said {mins} for \"{why}\". it has been {gone}.",
    ]

    static func overLine(reason: String, why: String, promised: Double, gone: Double,
                         fmt: (Double) -> String, cost: Int) -> String {
        let t = OVER_LINES[reason] ?? OVER_LINES["custom"]!
        var line = Profile.replaceFirst(t, "{mins}", fmt(promised))
        line = Profile.replaceFirst(line, "{gone}", fmt(gone))
        line = Profile.replaceFirst(line, "{why}", why.isEmpty ? "that" : why)
        return cost != 0 ? "\(line) −\(cost) xp." : line
    }

    // MARK: "you got back N hours" in something real
    static let COMPARISONS = [
        Comparison(per: 110, one: "a movie", many: "movies"),
        Comparison(per: 45, one: "a workout", many: "workouts"),
        Comparison(per: 25, one: "an episode", many: "episodes"),
        Comparison(per: 30, one: "a walk", many: "walks"),
        Comparison(per: 60, one: "an hour of practice", many: "hours of practice"),
        Comparison(per: 20, one: "a chapter", many: "chapters"),
    ]

    static func comparisonFor(_ mins: Double, spin: Int = 0) -> String {
        let usable = COMPARISONS.filter { (mins / $0.per).rounded(.down) >= 1 }
        if usable.isEmpty { return "" }
        let c = usable[spin % usable.count]
        let n = Int((mins / c.per).rounded(.down))
        return "that's \(n) \(n == 1 ? c.one : c.many)"
    }

    // MARK: the number onboarding is built around (DEMO: no real Screen Time)
    private static let DEMO_MINUTES: [String: Double] = [
        "tiktok": 78, "instagram": 54, "youtube": 46, "snapchat": 33, "x": 22, "reddit": 26,
        "netflix": 31, "twitch": 29, "discord": 24, "roblox": 27, "fortnite": 25, "pinterest": 18,
        "facebook": 16, "threads": 14, "spotify": 20,
    ]
    private static let DEMO_OTHER: Double = 41
    private static let DEMO_DEFAULT: Double = 23

    static func demoDailyMinutes(_ picked: [String] = []) -> Double {
        let apps = picked.reduce(0) { $0 + (DEMO_MINUTES[$1] ?? DEMO_DEFAULT) }
        return max(96, apps + DEMO_OTHER)
    }

    // MARK: "what you'll do instead"
    private static let WHEN: [(at: String, fits: [String])] = [
        ("tonight, 7–8pm", ["gym", "sports", "friends"]),
        ("after school", ["studying", "skill", "reading"]),
        ("before bed", ["reading", "studying"]),
        ("saturday morning", ["making", "skill", "sports"]),
    ]

    private static let DOING: [String: String] = [
        "gym": "gym", "studying": "30 min of studying", "sports": "practice",
        "friends": "see your friends", "making": "make something", "reading": "20 pages",
        "skill": "20 min on a new skill",
    ]

    static func insteadPlan(picks: [String] = [], apps: [String] = []) -> [InsteadSwap] {
        let worst = apps.first ?? "the feed"
        let second = apps.count > 1 ? apps[1] : worst
        var out: [InsteadSwap] = []
        var usedWhen = Set<String>()
        for id in picks {
            if out.count >= 3 { continue }
            guard let slot = WHEN.first(where: { $0.fits.contains(id) && !usedWhen.contains($0.at) }),
                  let what = DOING[id] else { continue }
            usedWhen.insert(slot.at)
            out.append(InsteadSwap(id: id, when: slot.at, what: what, instead: out.isEmpty ? worst : second))
        }
        if out.isEmpty {
            out.append(InsteadSwap(id: "any", when: "tonight, 7–8pm", what: "anything but scrolling", instead: worst))
        }
        return out
    }

    // MARK: Rilo's own plan, "generated" (§13)
    private static let BIG_SHARE = 0.3
    private static let MID_SHARE = 0.12
    private static let LONG_FORM = ["youtube", "netflix", "twitch", "hulu", "disney+", "prime video"]
    private static let POSTING_APPS = ["instagram", "tiktok", "youtube", "x", "threads", "snapchat"]

    private static func minutesFor(_ app: String, _ pct: Int) -> Int {
        if LONG_FORM.contains(app) { return 20 }
        return Double(pct) >= BIG_SHARE * 100 ? 10 : 15
    }

    static func riloLimits(tracked: [String] = [], breakdown: Breakdown?, goalMins: Int,
                           hobbies: [String] = [], goals: [String] = [],
                           calendar: [CalendarPlanItem] = [], checkins: [Checkin] = [],
                           creator: String = "") -> RiloPlan {
        let posts = creator == "yes" || creator == "sometimes"
        var byApp: [String: BreakdownApp] = [:]
        for a in breakdown?.apps ?? [] { byApp[a.app] = a }
        let total = breakdown?.total ?? 0
        func typical(_ app: String) -> Double { JS.round(byApp[app]?.mins ?? 0) }
        func shareOf(_ app: String) -> Double { total != 0 ? (byApp[app]?.mins ?? 0) / total : 0 }

        var settings: [String: AppSetting] = [:]
        var why: [String: String] = [:]
        let ordered = Limits.stableSorted(tracked) { shareOf($0) > shareOf($1) }

        for app in ordered {
            let pct = JS.roundInt(shareOf(app) * 100)
            if Limits.DEFAULT_ALWAYS.contains(app) {
                settings[app] = AppSetting(mode: .always, opens: 3, minutes: 15)
                why[app] = "you need this one. never locked."
                continue
            }
            let share = shareOf(app)
            let isPostingApp = posts && POSTING_APPS.contains(app)
            let tiedToSomething = isPostingApp
                || hobbies.contains { app.contains($0) || $0.contains(app) }
                || goals.contains { JS.test("content|video|post|grow|follow", $0) && JS.test("tiktok|instagram|youtube", app) }

            if share >= BIG_SHARE && !tiedToSomething {
                settings[app] = AppSetting(mode: .limited, opens: 2, minutes: minutesFor(app, pct))
                why[app] = "\(pct)% of your screen time. two short goes a day."
                continue
            }
            if share >= MID_SHARE || isPostingApp {
                let opens: Double = creator == "yes" && isPostingApp ? 4 : 3
                let mins = isPostingApp ? max(20, minutesFor(app, pct)) : minutesFor(app, pct)
                settings[app] = AppSetting(mode: .limited, opens: opens, minutes: mins)
                why[app] = isPostingApp
                    ? "you post here, so this is work. \(JS.num(opens)) goes of \(mins) min — long enough to film, edit and put it up."
                    : tiedToSomething
                        ? "you said you want to grow this, so you keep three goes a day."
                        : "\(pct)% of your day. three goes, then it's done."
                continue
            }
            settings[app] = AppSetting(mode: .free, opens: 3, minutes: 15)
            why[app] = "barely a blip. it counts toward your day, nothing more."
        }

        let busy = calendar.first { $0.kind == "test" || $0.kind == "practice" }

        /* ---- tighten until the plan check passes ---- */
        var limitedOrder = ordered.filter { settings[$0]?.mode == .limited }
        var guardN = 0
        func check() -> PlanCheck {
            Limits.planCheck(appSettings: settings, tracked: tracked, typicalFor: typical, goalMins: goalMins)
        }

        while check().over && guardN < 80 {
            guardN += 1
            let worst = Limits.stableSorted(limitedOrder) {
                settings[$0]!.opens * Double(settings[$0]!.minutes) > settings[$1]!.opens * Double(settings[$1]!.minutes)
            }.first

            guard let worst else {
                guard let freeApp = ordered.first(where: { settings[$0]?.mode == .free }) else { break }
                settings[freeApp] = AppSetting(mode: .limited, opens: 2, minutes: 15)
                why[freeApp] = "your limits didn't fit your goal without this one."
                limitedOrder.append(freeApp)
                continue
            }

            var s = settings[worst]!
            if s.minutes - Limits.MINUTE_STEP >= Limits.MIN_MINUTES {
                s.minutes -= Limits.MINUTE_STEP
            } else if s.opens > 1 {
                s.opens -= 1
            } else if s.opens > 0.5 {
                s.opens = 0.5
            } else {
                s.mode = .blocked
                why[worst] = "there was no version of this that fit your goal. blocked."
                if let i = limitedOrder.firstIndex(of: worst) { limitedOrder.remove(at: i) }
            }
            settings[worst] = s
        }

        var lead: [String] = []
        if let biggest = ordered.first(where: { !Limits.DEFAULT_ALWAYS.contains($0) }) {
            lead.append("\(biggest) is where most of it goes, so that's where i started.")
        }
        if let h = hobbies.first { lead.append("when you want to scroll, i'll point you at \(h).") }
        if let g = goals.first { lead.append("you said \(g). this is the part you control.") }
        if posts {
            lead.append(creator == "yes"
                ? "you post all the time, so i left the apps you publish to longer. that's work, not scrolling."
                : "you post sometimes, so you get a proper sitting on those — just not an unlimited one.")
        }
        if let busy { lead.append(busy.why) }
        if checkins.count >= 3, let top = checkins.last {
            lead.append("you mostly open these for \(top.reason == "custom" ? top.why : top.reason).")
        }

        return RiloPlan(settings: settings, why: why, lead: lead, check: check())
    }
}

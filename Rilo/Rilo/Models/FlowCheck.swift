#if DEBUG
import Foundation

/// DEBUG ONLY (Phase 9): every flow a new user goes through, driven through
/// the same AppState calls the buttons make, checking where each one lands.
/// Onboarding start to finish (and back from every step), the hand-off and
/// the tour, opening a Limited app (quick, full, carry-on, leave early, go
/// over your word, run out, the pass, borrowing, strict), blocked and
/// always-allowed apps, loosening and tightening limits, plan editing, the
/// check-in, talk, skins / themes / level up, the upgrade paywall, a new
/// day, saving + relaunch, start over, and a brand-new empty account.
///
/// Launch with `-flowcheck` (no -screen). It starts from a wiped save and
/// wipes it again at the end. Results go to stderr ("[flowcheck] ...") and
/// to Documents/flowcheck.txt.
@MainActor
enum FlowCheck {
    static func run(_ state: AppState) async {
        var lines: [String] = []
        var fail = 0
        func ok(_ name: String, _ cond: Bool, _ detail: @autoclosure () -> String = "") {
            if !cond { fail += 1 }
            let extra = detail()
            let d = cond ? "" : "  (\(extra.isEmpty ? "on \(state.screen)" : "\(extra), on \(state.screen)"))"
            lines.append("\(cond ? "ok  " : "FAIL") \(name)\(d)")
        }
        func at(_ name: String, _ want: Screen) { ok(name, state.screen == want) }
        /* navigation waits for each slide to settle, like a real tap */
        /* the slide's own timer starts only when the main actor gets to it,
           so on a slow frame a fixed wait can end first and the next step is
           dropped as a double tap. Wait for the slide (and any queued
           goToSoon/goSoon move it was holding back) to really finish. */
        func settle() async {
            try? await Task.sleep(for: .seconds(NavMotion.settleAfter + 0.15))
            for _ in 0..<3 {
                var n = 0
                while state.isSliding && n < 100 { try? await Task.sleep(for: .milliseconds(50)); n += 1 }
                try? await Task.sleep(for: .milliseconds(100))
                if !state.isSliding { break }
            }
        }

        /* no tracking, no system prompts (notifications) while it runs */
        Track.muted = true
        defer { Track.muted = false }

        await settle()
        state.startOver()
        await settle()

        // MARK: onboarding, with back from every step
        lines.append("— onboarding")
        at("starts on welcome", .welcome)
        state.go(.name); await settle()
        at("welcome → name", .name)
        state.goTo(.welcome, dir: .back); await settle()
        at("name back → welcome", .welcome)
        state.go(.name); await settle()
        state.name = "Tester"
        state.go(.pickapps); await settle()
        at("name → pick apps", .pickapps)
        state.goTo(.name, dir: .back); await settle()
        ok("pick apps back → name, name kept", state.screen == .name && state.name == "Tester")
        state.go(.pickapps); await settle()
        state.apps = PickedApps(on: ["tiktok": true, "instagram": true, "youtube": true], extra: [])
        ok("three apps picked", state.tracked.count == 3, "\(state.tracked)")
        state.go(.permission); await settle()
        at("pick apps → permission", .permission)
        state.goTo(.pickapps, dir: .back); await settle()
        at("permission back → pick apps", .pickapps)
        state.go(.permission); await settle()
        state.permissionDeny()
        ok("don't allow stays on permission", state.screen == .permission && state.screenTime == false)
        state.permissionTriedAgain()
        ok("try again remembered", state.triedAgain)
        state.permissionAllow(); await settle()
        ok("allow → crunching", state.screen == .crunching && state.screenTime == true)
        state.crunchingDone(); await settle()
        at("crunching → rather", .rather)
        ok("crunching built the baseline", state.breakdown != nil && state.time.now > 0 && state.time.goal >= 1)
        state.goTo(.pickapps, dir: .back); await settle()
        ok("rather back → pick apps, apps kept", state.screen == .pickapps && state.tracked.count == 3)
        state.goTo(.rather); await settle()
        state.rather = ["gym", "studying"]
        state.ratherContinue(); await settle()
        ok("rather → your number, from the top", state.screen == .yournumber && state.numberBeat == 0)
        ok("rather built rilo's limits", !state.appSettings.isEmpty && state.limitMode == "rilo")
        ok("rather folded into about", !state.profileList("hobby").isEmpty)
        state.numberBeat = 2
        /* YourNumber's back: a beat back, then Rather */
        state.numberBeat -= 1
        ok("number back → the beat before", state.screen == .yournumber && state.numberBeat == 1)
        state.numberBeat = 0
        state.goTo(.rather, dir: .back); await settle()
        ok("number back on beat 0 → rather, picks kept", state.screen == .rather && state.rather == ["gym", "studying"])
        state.goTo(.yournumber); await settle()
        state.numberBeat = 2
        state.go(.yourplan); await settle()
        at("your number → your plan", .yourplan)
        state.goTo(.yournumber, dir: .back); await settle()
        ok("plan back → your number, last beat", state.screen == .yournumber && state.numberBeat == 2)
        state.go(.yourplan); await settle()
        let goalBefore = state.goalMins
        var t = state.time; t.goal += 0.5
        state.yourPlanSetTime(t)
        ok("goal stepper moves the goal", state.goalMins == goalBefore + 30)
        ok("limits refit the goal", !state.check.over, "allows \(state.check.allows) goal \(state.goalMins)")
        state.go(.limitsonboard); await settle()
        at("edit → limits (onboarding)", .limitsonboard)
        if let app = state.tracked.first {
            var s = state.settingOf(app)
            s.mode = .free
            state.setAppSetting(app, s)
            ok("loosening in onboarding is instant, no ask", state.loosenAsk == nil && state.settingOf(app).mode == .free)
        }
        state.goTo(.yourplan, dir: .back); await settle()
        at("limits back → your plan", .yourplan)
        state.go(.paywall); await settle()
        at("your plan → paywall", .paywall)
        state.paywallBack(); await settle()
        at("paywall back → your plan", .yourplan)
        state.go(.paywall); await settle()
        state.plan = "year"
        /* the purchase service said yes (PaywallView), then: */
        state.paywallDone("start free trial"); await settle()
        ok("trial → home with the hand-off", state.screen == .home && state.handoff && state.planChoice == "trial")
        ok("pro after the trial", state.hasPro)
        ok("no tour during the hand-off", !state.showTour)
        ok("onboarded (reminders can start)", state.onboarded)

        // MARK: the tour
        lines.append("— tour")
        state.handoffDone()
        ok("tour starts after the hand-off", state.showTour)
        state.tourCreatorAnswer(false)
        for s in Screen.tourScreens {
            state.goSoon(s); await settle()
            ok("tour walks to \(s.rawValue)", state.screen == s && state.showTour, "on \(state.screen)")
        }
        state.tourDone()
        ok("tour done, gone for good", !state.showTour && state.introTourDone)
        state.go(.home, dir: .back); await settle()
        at("back home", .home)

        // MARK: opening a limited app
        lines.append("— opening apps")
        let app = state.tracked.first ?? "tiktok"
        state.startFreshDay()
        state.borrow = BorrowIOU()
        state.applySetting(app, AppSetting(mode: .limited, opens: 3, minutes: 15))
        ok("\(app): 3 opens left", state.availOf(app) == 3)
        state.openApp(app); await settle()
        at("open → shield", .shield)
        state.shieldClose(); await settle()
        at("shield close → home", .home)
        state.openApp(app); await settle()
        state.shieldTalk()
        ok("talk to rilo → his banner", state.showBanner)
        state.bannerTap(); await settle()
        ok("banner → the pop-up", state.screen == .intercept && !state.banner)
        state.go(.whyopen); await settle()
        at("open it → what for", .whyopen)
        let xp0 = state.xp
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "check one thing", mins: 7.5, length: "quick", cost: 0.5))
        await settle()
        ok("quick → app open, half the minutes", state.screen == .appopen && state.session.cap == 7.5 && state.session.kind == "open")
        state.finishSession(app, minutesUsed: 3); await settle()
        at("close → home", .home)
        ok("quick peek costs ½ open", state.opensUsedFor(app) == 0.5, "\(state.opensUsedFor(app))")
        ok("closing early banks minutes + a note", state.savedNote != nil && state.stats.savedMinutes > 0)
        ok("leaving on time pays xp", state.xp == xp0 + AppState.ON_TIME_XP, "\(xp0) → \(state.xp)")
        /* reopening within two minutes carries the same session on */
        ok("a recent session can carry on", state.continuationFor(app) != nil)
        state.goTo(.whyopen); await settle()
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "finish watching", mins: 15, length: "full", cost: 1))
        await settle()
        ok("carry-on: same session, 3 min already used", state.screen == .appopen && state.session.carried == 3,
           "carried \(state.session.carried)")
        state.finishSession(app, minutesUsed: 12); await settle()
        ok("one session never costs more than 1 open", state.opensUsedFor(app) == 1, "\(state.opensUsedFor(app))")
        /* a fresh full open */
        state.day.lastSession = nil
        state.goTo(.whyopen); await settle()
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "watch", mins: 7.5, length: "quick", cost: 0.5))
        await settle()
        let xp1 = state.xp
        state.finishSession(app, minutesUsed: 12); await settle()
        ok("going over your word: note + xp off", !state.overNote.isEmpty && state.xp < xp1, "xp \(xp1) → \(state.xp)")
        state.overNote = ""
        state.savedNote = nil
        state.day.lastSession = nil

        /* close tapped while the app-open slide is still running: the move
           home must still happen (it used to be dropped → stuck) */
        state.goTo(.whyopen); await settle()
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "peek", mins: 7.5, length: "quick", cost: 0.5))
        state.finishSession(app, minutesUsed: 0.1)
        await settle(); await settle()
        at("close mid-slide still lands home", .home)
        state.day.lastSession = nil

        // run out
        state.day.opensUsed[app] = state.totalOpensFor(app)
        ok("out of opens", state.availOf(app) <= 0)
        state.goTo(.whyopen); await settle()
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "more", mins: 15, length: "full", cost: 1))
        await settle()
        at("no opens left → back to the pop-up", .intercept)
        ok("pass offered, borrow not yet (pass comes first)", state.passesLeft == 1 && !state.borrowableFor(app))

        // the emergency pass
        let xp2 = state.xp
        let usedBefore = state.opensUsedFor(app)
        state.spendEmergencyPass(app, why: "group project"); await settle()
        ok("pass → 5 min session", state.screen == .appopen && state.session.kind == "pass" && state.session.cap == Limits.PASS_MINUTES)
        ok("pass costs xp, one a day", state.xp == max(0, xp2 - AppState.PASS_XP) && state.passesLeft == 0)
        state.finishSession(app, minutesUsed: 5); await settle()
        ok("pass spends no opens", state.screen == .home && state.opensUsedFor(app) == usedBefore)

        // borrowing ½ open from tomorrow
        ok("borrow offered now", state.borrowableFor(app))
        let totalBefore = state.totalOpensFor(app)
        state.goTo(.intercept); await settle()
        state.borrowFromTomorrow(app, why: "homework video"); await settle()
        ok("borrow → what for", state.screen == .whyopen)
        ok("borrow adds ½ today, owed tomorrow", state.totalOpensFor(app) == totalBefore + Limits.BORROW_OPENS
           && state.borrow.app == app && state.borrow.date == Storage.tomorrow())
        ok("borrow once a day", !state.borrowableFor(app))
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "homework", mins: 7.5, length: "quick", cost: 0.5))
        await settle()
        ok("borrowed half → a half session", state.screen == .appopen && state.session.cap == 7.5, "cap \(state.session.cap)")
        state.finishSession(app, minutesUsed: 2); await settle()
        at("borrowed session → home", .home)
        state.goTo(.intercept); await settle()
        state.interceptReason("never mind")
        state.go(.home, dir: .back); await settle()
        at("stuck: alright, close it → home", .home)

        // the reason screens
        state.startFreshDay()
        state.borrow = BorrowIOU()
        state.goTo(.whyopen); await settle()
        state.whyOpenFeeling("bored"); await settle()
        at("bored → suggestion", .suggestion)
        state.suggestionSaidNo(); await settle()
        at("i'm going → progress", .progress)
        state.goTo(.whyopen); await settle()
        state.whyOpenFeeling("tired"); await settle()
        at("tired → tired", .tired)
        state.startSession(15, reason: "tired"); await settle()
        at("tired: open it anyway → app open", .appopen)
        state.finishSession(app, minutesUsed: 15); await settle()
        state.day.lastSession = nil
        state.goTo(.whyopen); await settle()
        state.whyOpenNevermind(); await settle()
        at("never mind → home", .home)

        // strict mode
        lines.append("— strict")
        state.startFreshDay()
        state.strictOn(days: 7, when: "all")
        state.goTo(.whyopen); await settle()
        state.startCheckedIn(app, CheckinPick(reason: "custom", why: "peek", mins: 15, length: "full", cost: 1))
        await settle()
        state.finishSession(app, minutesUsed: 2); await settle()
        ok("strict: no halves, a peek is 1 open", state.opensUsedFor(app) == 1, "\(state.opensUsedFor(app))")
        state.day.lastSession = nil
        state.day.opensUsed[app] = state.totalOpensFor(app)
        state.day.passes = Limits.PASSES_PER_DAY
        ok("strict: no borrowing", !state.borrowableFor(app))
        let strictPrev = state.settingOf(app)
        var looser = strictPrev; looser.opens += 1
        state.setAppSetting(app, looser)
        ok("strict: loosening waits 24h", state.pending.count == 1 && state.settingOf(app) == strictPrev)
        var tighter = strictPrev; tighter.minutes = max(Limits.MIN_MINUTES, strictPrev.minutes - Limits.MINUTE_STEP)
        if tighter != strictPrev {
            state.setAppSetting(app, tighter)
            ok("strict: tightening is instant", state.settingOf(app).minutes == tighter.minutes)
        }
        state.skip24h()
        ok("24h later the loosening lands", state.pending.isEmpty && state.settingOf(app).opens == looser.opens)
        state.strictAskOff()
        ok("strict off waits 24h", state.strict.on && state.strict.endingAt != nil)
        state.strictOffNow()
        ok("strict off now", !state.strict.on)

        // limits in normal mode
        lines.append("— limits")
        state.startFreshDay()
        let normalPrev = state.settingOf(app)
        var more = normalPrev; more.opens += 1
        state.setAppSetting(app, more)
        ok("loosening asks rilo first", state.loosenAsk != nil && state.settingOf(app) == normalPrev)
        state.loosenCancel()
        ok("cancel keeps it", state.loosenAsk == nil && state.settingOf(app) == normalPrev)
        state.setAppSetting(app, more)
        state.loosenConfirm("i need it for school")
        ok("confirm loosens", state.settingOf(app).opens == more.opens)
        var fewer = state.settingOf(app); fewer.opens = max(1, fewer.opens - 1)
        state.setAppSetting(app, fewer)
        ok("tightening is instant, and it's their plan now", state.settingOf(app).opens == fewer.opens && state.limitMode == "own")
        state.applySetting(app, AppSetting(mode: .blocked, opens: 3, minutes: 15))
        state.session.app = app
        state.goTo(.tired); await settle()
        state.startSession(15, reason: "tired"); await settle()
        at("blocked app → the pop-up, never opens", .intercept)
        state.applySetting(app, AppSetting(mode: .limited, opens: 3, minutes: 15))
        state.go(.home, dir: .back); await settle()
        state.openApp("phone"); await settle()
        ok("always-allowed just opens", state.screen == .appopen && state.session.kind == "always")
        state.finishSession("phone", minutesUsed: 1); await settle()
        at("always-allowed → home", .home)
        state.go(.limits); await settle()
        at("limits tab opens", .limits)
        state.go(.home, dir: .back); await settle()

        // MARK: plan, check-in, talk
        lines.append("— plan, check-in, talk")
        state.go(.plan); await settle()
        at("plan tab", .plan)
        let rows = state.schedulePlan.rows
        state.schedulePlan = SchedulePlan(mode: "own", rows: rows + [ScheduleRow(at: "8:00", title: "something", note: "")])
        ok("plan: add a row", state.schedulePlan.rows.count == rows.count + 1 && state.schedulePlan.mode == "own")
        var edited = state.schedulePlan.rows
        if !edited.isEmpty { edited[edited.count - 1].title = "gym" }
        state.schedulePlan = SchedulePlan(mode: "own", rows: edited)
        ok("plan: edit a row", state.schedulePlan.rows.last?.title == "gym")
        state.schedulePlan = SchedulePlan(mode: "own", rows: Array(edited.dropLast()))
        ok("plan: remove a row", state.schedulePlan.rows.count == rows.count)
        state.go(.nightcheckin); await settle()
        at("check-in opens (pro)", .nightcheckin)
        state.nightCheckInSkip(); await settle()
        at("not tonight → home", .home)
        state.go(.nightcheckin); await settle()
        let before = state.schedulePlan.rows.count
        state.nightCheckInDone(said: NightSaid(today: "good", tomorrow: "math test"),
                               tasks: [NightTask(title: "study for math", note: "before 5")])
        await settle()
        ok("check-in done → plan, tasks added", state.screen == .plan && state.schedulePlan.rows.count == before + 1)
        ok("checked in today", state.checkedInToday)
        state.demoAskDay(2); await settle()
        ok("day 2 question shows somewhere", state.planAsk != nil || state.homeAsk != nil || state.checkinAsk != nil)
        state.demoClock = nil
        state.ctaAsk("calendar"); await settle()
        at("calendar question → calendar", .calendar)
        state.calendarSet(CalendarLink(on: true, which: "apple", sources: ["school"]))
        ok("calendar connected", state.calendar.on)
        state.go(.plan); await settle()
        state.go(.talkchat); await settle()
        at("talk opens", .talkchat)
        let heard = Listen.hobbiesIn("i like basketball and guitar") + Listen.goalsIn("i want to make varsity")
        ok("talk hears hobbies/goals", !heard.isEmpty, "\(heard)")
        state.go(.home, dir: .back); await settle()
        at("talk done → home", .home)

        // MARK: skins, themes, level up
        lines.append("— rilo, themes, levels")
        state.go(.pickrilo); await settle()
        at("rilo tile → pick rilo", .pickrilo)
        state.chosenRilo = "original"
        state.go(.home, dir: .back); await settle()
        state.xp = 320; state.level = 2
        state.demoXp(500); await settle()
        ok("+500 xp → level up with a skin", state.screen == .levelup && state.pendingSkin != nil && state.level > 2)
        let skin = state.pendingSkin
        state.levelUpWear(); await settle()
        ok("wear it → home in the new skin", state.screen == .home && state.chosenRilo == skin && state.pendingSkin == nil)
        state.pendingSkin = "shades"
        state.go(.progress); await settle()
        state.go(.home); await settle()
        at("heading home with a skin waiting → level up first", .levelup)
        state.levelUpLater(); await settle()
        ok("later → home, skin not worn", state.screen == .home && state.pendingSkin == nil)
        state.setThemeTracked("sakura")
        ok("theme sakura", state.theme == "sakura")
        state.setThemeTracked("grass")
        state.go(.progress); await settle()
        state.go(.sharecard); await settle()
        at("progress → share card", .sharecard)
        state.go(.progress, dir: .back); await settle()
        at("share card back → progress", .progress)
        state.go(.buddies); await settle()
        at("buddies opens", .buddies)

        // MARK: you tab, upgrade
        lines.append("— you, upgrade")
        state.go(.you); await settle()
        at("you tab", .you)
        state.go(.upgrade); await settle()
        ok("upgrade remembers where it came from", state.screen == .upgrade && state.cameFrom == .you)
        state.paywallBack(); await settle()
        at("upgrade back → you", .you)
        state.go(.creator); await settle()
        at("creator mode opens", .creator)
        state.go(.you, dir: .back); await settle()
        state.go(.nighttime); await settle()
        var n = state.night; n.at = "20:30"
        state.nightTimeSet(n); state.go(.home); await settle()
        ok("check-in time saved → home", state.screen == .home && state.night.at == "20:30")

        // MARK: a new day
        lines.append("— new day")
        let historyBefore = state.history.count
        state.goTo(.intercept); await settle()
        state.day.date = "2000-01-01"
        state.rollOverIfNeeded()
        ok("mid pop-up: the day waits", state.screen == .intercept && state.day.date == "2000-01-01")
        state.go(.home, dir: .back); await settle()
        state.rollOverIfNeeded(); await settle()
        ok("home on a new day → day summary", state.screen == .daysummary && state.dayResult != nil)
        ok("yesterday scored, today fresh", state.history.count == historyBefore + 1 && state.day.date == state.dateKey
           && state.passesLeft == Limits.PASSES_PER_DAY)
        state.daySummaryDone(); await settle()
        ok("summary done → home", state.screen == .home && state.dayResult == nil)
        /* the demo's "end day", then "nice" tapped mid-slide: must not
           strand them on a blank summary */
        state.endDay()
        state.daySummaryDone()
        await settle(); await settle()
        ok("summary tapped mid-slide still lands home", state.screen == .home && state.dayResult == nil, "on \(state.screen)")

        // MARK: saving + relaunch
        lines.append("— saving")
        state.saveNow()
        let loaded = Storage.loadState()
        ok("everything comes back after closing", loaded == state.savedState)
        ok("relaunch after onboarding → home", AppState.restoredScreen(loaded) == .home)
        var mid = loaded; mid.screen = Screen.rather.rawValue
        ok("relaunch mid-onboarding → same step", AppState.restoredScreen(mid) == .rather)
        mid.screen = Screen.appopen.rawValue
        ok("relaunch mid-session → home", AppState.restoredScreen(mid) == .home)
        mid.screen = "not-a-screen"
        ok("relaunch with a broken screen → home", AppState.restoredScreen(mid) == .home)
        ok("a broken save starts fresh", Storage.decode(Data("{oops".utf8)) == nil)

        // MARK: start over, free path, brand-new empty account
        lines.append("— start over")
        state.startOver(); await settle()
        ok("start over → welcome, blank", state.screen == .welcome && state.name.isEmpty && state.planChoice == nil
           && Storage.loadState().name.isEmpty)
        /* home with nothing set up: nothing may crash */
        state.goTo(.home); await settle()
        _ = (state.riloMood, state.riloNote, state.back, state.check, state.goalLeft, state.currentApp,
             state.weekAhead, state.stepApp, state.suggestStrict)
        state.makeBreakdown(true)
        ok("empty account: breakdown builds", state.breakdown != nil)
        _ = Plan.buildBreakdown([], 0, true)
        ok("empty account: still alive", state.currentApp == "the feed")
        state.startOver(); await settle()
        /* the free path through the paywall */
        state.name = "Free"
        state.apps = PickedApps(on: ["tiktok": true], extra: [])
        state.goTo(.permission); await settle()
        state.permissionSkip(); await settle()
        ok("skip screen time → rather", state.screen == .rather && state.screenTime == nil)
        state.ratherContinue(); await settle()
        state.goTo(.paywall); await settle()
        state.plan = "free"
        state.paywallDone("continue with free"); await settle()
        ok("free → home with the hand-off", state.screen == .home && state.planChoice == "free" && state.handoff)
        state.handoffDone()
        state.startOver(); await settle()

        lines.append("[flowcheck] \(fail == 0 ? "all passed" : "\(fail) failed")")
        let text = lines.joined(separator: "\n")
        FileHandle.standardError.write(Data((text + "\n").utf8))
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            try? text.write(to: dir.appendingPathComponent("flowcheck.txt"), atomically: true, encoding: .utf8)
        }
    }
}
#endif

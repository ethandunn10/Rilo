#if DEBUG
import Foundation

/// DEBUG ONLY: walks every setting on the You tab through the same AppState
/// calls its buttons make, end to end (theme, goal, bedtime/school, focus,
/// night check-in time, Creator Mode, strict on/off, upgrade → back, the
/// trial, replay tour, start over). Launch with `-screen you -settingscheck`.
/// Results go to stderr and to Documents/settingscheck.txt.
@MainActor
enum SettingsCheck {
    static func run(_ state: AppState) async {
        var lines: [String] = []
        var fail = 0
        func ok(_ name: String, _ cond: Bool) {
            if !cond { fail += 1 }
            lines.append("\(cond ? "ok  " : "FAIL") \(name)")
        }
        /* navigation waits for each slide to settle, like a real tap */
        func settle() async { try? await Task.sleep(for: .seconds(NavMotion.settleAfter + 0.15)) }
        await settle()
        ok("starts on you", state.screen == .you)

        // theme (Pro picks any; free users get the paywall)
        state.setThemeTracked("bamboo")
        ok("theme bamboo", state.theme == "bamboo")
        state.setThemeTracked("grass")

        // the daily goal
        let before = state.goalMins
        var t = state.time; t.goal += 0.5; state.time = t
        ok("goal +30m moves goalMins", state.goalMins == before + 30)
        t.goal -= 0.5; state.time = t

        // bedtime / school / focus
        state.demoClock = "23:00"
        state.bedtime.on = true
        ok("bedtime on at 23:00 → asleep", state.asleep && state.schedule.locked)
        state.bedtime.on = false
        ok("bedtime off → awake", !state.asleep)
        state.demoClock = "10:00"
        state.school.on = true
        state.school.days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
        ok("school on at 10:00 → locked", state.schedule.locked && state.schedule.kind == "school")
        state.school.on = false
        ok("school off → unlocked", !state.schedule.locked)
        state.focus = FocusBlock(on: true, until: "23:59")
        ok("focus block → locked", state.schedule.locked)
        state.focus = FocusBlock(on: false, until: "")
        state.demoClock = nil

        // the night check-in time
        var n = state.night; n.at = "20:00"; state.youSetNight(n)
        ok("night moved to 20:00", state.night.at == "20:00")
        state.demoClock = "20:30"
        ok("check-in due after 20:00", state.checkInDue)
        state.demoClock = "19:30"
        ok("not due before 20:00", !state.checkInDue)
        state.demoClock = nil

        // Creator Mode
        let c = state.creatorModeOn
        state.creatorModeOn = !c
        ok("creator toggled", state.creatorModeOn == !c)
        state.creatorModeOn = c

        // strict
        state.strictOn(days: 7, when: "all")
        ok("strict on", state.strict.on && state.strict.endingAt == nil)
        state.strictAskOff()
        ok("strict 24h countdown", state.strict.on && state.strict.endingAt != nil)
        state.strictKeepOn()
        ok("strict keep on", state.strict.on && state.strict.endingAt == nil)
        state.strictOffNow()
        ok("strict off now", !state.strict.on)

        // upgrade from settings → back
        state.go(.upgrade); await settle()
        ok("upgrade opens", state.screen == .upgrade && state.cameFrom == .you)
        state.paywallBack(); await settle()
        ok("back returns to you", state.screen == .you)

        // upgrade → free → back to you as free
        state.go(.upgrade); await settle()
        state.plan = "free"
        state.paywallDone("continue with free"); await settle()
        ok("free → you, not pro", state.screen == .you && !state.isPro && state.planChoice == "free")

        // locked theme as a free user → paywall
        state.lockedTheme("sakura"); await settle()
        ok("locked theme → upgrade", state.screen == .upgrade && state.cameFrom == .you)

        // the trial through the purchase service
        state.plan = "year"
        let r = await Purchases.shared.startTrial(plan: state.plan)
        if r == .success { state.paywallDone("start free trial") }
        await settle()
        ok("trial → you, pro", state.screen == .you && state.isPro && state.planChoice == "trial")
        ok("no hand-off from upgrade", !state.handoff)

        // replay tour
        state.replayIntroTour(); await settle()
        ok("replay tour → home with the tour (\(state.screen) done=\(state.introTourDone) handoff=\(state.handoff))", state.screen == .home && state.showTour)
        state.introTourDone = true

        // Phase 8: the Screen Time seam (the demo service just remembers)
        if let demo = state.screenTimeService as? DemoScreenTimeService, let app = state.tracked.first {
            let turn = { try? await Task.sleep(for: .milliseconds(100)) }
            state.appSettings[app] = AppSetting(mode: .limited, opens: 3, minutes: 15)
            state.strictOn(days: 7, when: "all"); await turn()
            ok("seam: rules shield \(app), strict on", demo.rules.strict && demo.rules.apps[app]?.shielded == true
               && demo.rules.apps[app]?.opensLeft == state.availOf(app))
            state.strictOffNow(); await turn()
            ok("seam: strict off reaches the service", !demo.rules.strict)
            state.go(.home); await settle()
            state.openApp(app); await settle()
            ok("seam: demo draws its own shield", state.screen == .shield)
            state.startCheckedIn(app, CheckinPick(reason: "custom", why: "check", mins: 5, length: "quick", cost: 0.5))
            await settle()
            ok("seam: session lifts the shield", state.screen == .appopen && demo.session?.app == app && demo.session?.minutes == 5)
            state.finishSession(app, minutesUsed: 2); await settle()
            ok("seam: finishing re-shields", demo.session == nil && state.screen == .home)
            state.skipToMidnight(); await turn()
            ok("seam: day roll-over reaches the service", demo.rules.dateKey == state.dateKey && state.screenTimeService.takeEvents().isEmpty)
        } else {
            ok("seam: demo service in use", false)
        }

        // start over
        state.startOver(); await settle()
        ok("start over → welcome, blank", state.screen == .welcome && state.name.isEmpty && !state.isPro)

        lines.append("[settingscheck] \(fail == 0 ? "all passed" : "\(fail) failed")")
        let text = lines.joined(separator: "\n")
        FileHandle.standardError.write(Data((text + "\n").utf8))
        if let dir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            try? text.write(to: dir.appendingPathComponent("settingscheck.txt"), atomically: true, encoding: .utf8)
        }
    }
}
#endif

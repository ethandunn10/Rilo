import Foundation

/// DEMO ONLY: the DemoPanel's callbacks (App.jsx), the tester's remote control.
extension AppState {
    func demoSetClock(_ at: String?) {
        demoClock = at
        track("demo", "clock \(at ?? "real")")
    }

    /// 'under' | 'close' | 'over' — put that much on the first app that counts
    func demoUsage(_ how: String) {
        let g = Double(goalMins)
        let target = how == "under" ? JS.round(g * 0.5) : how == "close" ? JS.round(g * 0.92) : JS.round(g * 1.4)
        let first = tracked.first { Limits.countsTowardDay(appSettings, $0) } ?? tracked.first ?? "tiktok"
        day.used = [first: target]
        track("demo", "usage \(how)")
    }

    /// run a real session of a chosen length on a chosen app, finished at once
    func demoSimulate(_ app: String, mins: Double) {
        session.app = app
        let setting = settingOf(app)
        let carry = continuationFor(app)
        let carried = carry?.mins ?? 0
        let charged = carry?.charged ?? 0
        let avail = availOf(app) + charged
        let full = Limits.sessionCapMins(avail: avail, minutes: setting.minutes, strictOn: strict.on)

        if full - carried <= 0 {
            track("demo", "\(app): no room, shield instead")
            openApp(app)
            return
        }

        let run = min(mins, full - carried)
        session = Session(app: app, cap: run, carried: carried, charged: charged, kind: "open", minutes: setting.minutes)
        let total = carried + run
        let spend = Limits.opensSpent(mins: total, minutes: setting.minutes, strictOn: strict.on)
        let delta = max(0, spend - charged)
        let now = JS.nowMs
        var d = day
        d.used[app] = (d.used[app] ?? 0) + run
        d.opensUsed[app] = (d.opensUsed[app] ?? 0) + delta
        d.lastSession = LastSession(app: app, endedAt: now, mins: total, charged: spend)
        d.lastBlockedAt = now
        d.sinceBlocked = 0
        day = d
        track("demo", "\(app): simulated \(JS.num(mins))m")
    }

    func demoPass(_ app: String) {
        session.app = app
        spendEmergencyPass(app, why: "demo panel")
    }

    func demoBorrow(_ app: String) {
        session.app = app
        borrowFromTomorrow(app)
    }

    func demoToggleStrict() {
        if strict.on { strictAskOff() } else { strictOn(days: strict.days, when: strict.when) }
    }

    func demoOpenBlocked() { openApp(tracked.first ?? "tiktok") }
}

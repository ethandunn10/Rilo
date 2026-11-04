import Foundation

/// Opening apps, sessions, the emergency pass, borrowing, XP and Creator
/// Mode (App.jsx). Opens are charged when a session ENDS, because the cost
/// depends on how long it actually ran, and reopening inside two minutes
/// carries the same session on.
extension AppState {
    /// how much time saying no is worth
    static let SAID_NO_MINUTES: Double = 15
    /// what going around a limit costs, and what leaving on time is worth
    static let PASS_XP = 20
    static let ON_TIME_XP = 5
    /// breaking their own word: a minute of xp per minute over, capped
    static let OVER_XP_CAP: Double = 30

    /// Start (or carry on) a session on a Limited app. `wanted` is the
    /// length they asked for; the real cap is what their opens buy.
    func startOpenSession(_ appName: String, wanted: Double?) {
        let setting = settingOf(appName)

        /* a carried session that has already spent its whole open is over */
        var carry = continuationFor(appName)
        if let c = carry {
            let roomInCarry = Limits.sessionCapMins(avail: availOf(appName) + c.charged,
                                                    minutes: setting.minutes, strictOn: strict.on) - c.mins
            if roomInCarry <= 0 { carry = nil }
        }
        let carried = carry?.mins ?? 0
        let charged = carry?.charged ?? 0

        /* an app with no limit just opens, for its own per-open length */
        if setting.mode == .free {
            let mins = max(1, min(wanted ?? Double(setting.minutes), Double(setting.minutes)))
            beginAppSession(Session(app: appName, cap: mins, carried: 0, charged: 0, kind: "free", minutes: setting.minutes))
            return
        }

        let avail = availOf(appName) + charged
        let full = Limits.sessionCapMins(avail: avail, minutes: setting.minutes, strictOn: strict.on)
        /* one session never runs past one whole open */
        let cap = min(wanted ?? full, full) - carried

        if cap <= 0 {
            track("session", "\(appName): no opens left")
            go(.intercept)
            return
        }
        beginAppSession(Session(app: appName, cap: cap, carried: carried, charged: charged, kind: "open", minutes: setting.minutes))
    }

    /// They said why and which length they wanted. Rilo keeps both.
    func startCheckedIn(_ appName: String, _ pick: CheckinPick) {
        let entry = Checkin(app: appName, reason: pick.reason, why: pick.why, promised: pick.mins,
                            length: pick.length, cost: pick.cost, at: JS.nowMs, date: dateKey)
        promise = entry
        checkins = (checkins + [entry]).suffixJS(60)
        track("checkin", "\(pick.length) · \(pick.reason == "custom" ? "custom: \(pick.why)" : pick.reason)")
        startOpenSession(appName, wanted: pick.mins)
    }

    /// the emergency pass: five minutes, no opens spent, but it costs xp
    func spendEmergencyPass(_ appName: String, why: String?) {
        if passesLeft <= 0 { return }
        day.passes += 1
        awardXp(-Self.PASS_XP)
        track("pass", "\((why?.isEmpty == false) ? why! : "no reason given") · -\(Self.PASS_XP) xp")
        beginAppSession(Session(app: appName, cap: Limits.PASS_MINUTES, carried: 0, charged: 0, kind: "pass",
                                minutes: settingOf(appName).minutes))
    }

    /// borrow half an open off tomorrow
    func borrowFromTomorrow(_ appName: String, why: String? = nil) {
        if !borrowableFor(appName) { return }
        day.borrowed = BorrowedToday(app: appName)
        borrow = BorrowIOU(date: Storage.tomorrow(), app: appName)
        track("borrow", "\(appName): ½ open off tomorrow · \((why?.isEmpty == false) ? why! : "no reason given")")
        /* the half open is theirs now — straight to the check-in */
        go(.whyopen)
    }

    func finishSession(_ appName: String, minutesUsed: Double) {
        let used = max(0, minutesUsed)
        /* the shield goes back up */
        screenTimeService.endSession(app: appName, minutesUsed: used)
        let total = session.carried + used
        /* every xp change in here reads the xp from before it, like the
           web's handler (the last award wins) */
        let base = (xp: xp, level: level)
        let now = JS.nowMs

        if session.kind == "open" {
            let spend = Limits.opensSpent(mins: total, minutes: session.minutes, strictOn: strict.on)
            let delta = max(0, spend - session.charged)
            var d = day
            d.used[appName] = (d.used[appName] ?? 0) + used
            d.opensUsed[appName] = (d.opensUsed[appName] ?? 0) + delta
            d.lastSession = LastSession(app: appName, endedAt: now, mins: total, charged: spend)
            d.lastBlockedAt = now
            d.sinceBlocked = 0
            day = d
            track("session", "\(appName): \(JS.roundInt(total))m, cost \(JS.num(spend)) open\(spend == 1 ? "" : "s")")
        } else {
            /* a pass session spends no opens, and never becomes a continuation */
            var d = day
            d.used[appName] = (d.used[appName] ?? 0) + used
            d.lastSession = nil
            d.lastBlockedAt = now
            d.sinceBlocked = 0
            day = d
        }

        /* getting off when the timer is up pays xp */
        if session.kind == "open" && used <= session.cap + 0.5 {
            awardXp(Self.ON_TIME_XP, base: base)
        }

        /* closing early banks the minutes they didn't spend */
        let unspent = max(0, session.cap - used)
        if unspent >= 1 {
            stats.savedMinutes += JS.round(unspent)
            track("early", "\(appName): left \(JS.roundInt(unspent)) min on the table")
            savedNote = SavedNote(app: appName, mins: JS.roundInt(unspent))
        } else {
            savedNote = nil
        }

        /* did they do what they said? */
        if let promise {
            let gone = JS.round(total)
            let over = session.kind == "open" && gone > promise.promised
            checkins = checkins.map { c in
                guard c.at == promise.at else { return c }
                var c = c; c.used = used; c.gone = gone; c.over = over
                return c
            }
            if over {
                let spill = Int(max(1, min(Self.OVER_XP_CAP, JS.round(gone - promise.promised))))
                awardXp(-spill, base: base)
                track("checkin", "over: said \(JS.num(promise.promised))m, took \(JS.num(gone))m · -\(spill) xp")
                savedNote = nil
                overNote = MockAI.overLine(reason: promise.reason, why: promise.why, promised: promise.promised,
                                           gone: gone, fmt: Plan.fmtMins, cost: spill)
            }
            self.promise = nil
        }

        goTo(.home, dir: .back)
    }

    /// "pretend you opened X": bump that app's real count for today
    func openApp(_ label: String) {
        countOpen(label)

        /* an always-allowed app has no shield and no pop-up — it just opens */
        if settingOf(label).mode == .always {
            beginAppSession(Session(app: label, cap: 15, carried: 0, charged: 0, kind: "always", minutes: 15))
            return
        }
        /* the demo draws its own shield; with real Screen Time iOS already
           showed one, so straight to Rilo's questions */
        go(screenTimeService.drawsShieldInApp ? .shield : .intercept)
    }

    /// today's count for an app, and it becomes the current app
    func countOpen(_ label: String) {
        let fresh = opens.date != dateKey
        var counts = fresh ? [:] : opens.counts
        counts[label] = (counts[label] ?? 0) + 1
        opens = OpenCounts(date: dateKey, counts: counts)
        session.app = label
    }

    /// The reason screens (bored / tired / a break / need it) ARE the reason,
    /// so they open the app rather than asking again.
    func startSession(_ wanted: Double?, reason: String = "something") {
        let setting = settingOf(currentApp)
        if setting.mode == .blocked { go(.intercept); return }
        if setting.mode != .limited && setting.mode != .free { openApp(currentApp); return }
        let mins = max(1, min(wanted ?? Double(setting.minutes), Double(setting.minutes)))
        startCheckedIn(currentApp, CheckinPick(reason: reason, why: "", mins: mins, length: "full", cost: 1))
    }

    func saidNo() {
        stats = Stats(savedMinutes: stats.savedMinutes + Self.SAID_NO_MINUTES, saidNo: stats.saidNo + 1)
    }

    /// XP never goes below 0, and a level once earned is never lost.
    /// Returns true if a Pro unlock is now waiting to be celebrated.
    @discardableResult
    func awardXp(_ amount: Int, base: (xp: Int, level: Int)? = nil) -> Bool {
        let fromXp = base?.xp ?? xp
        let fromLevel = base?.level ?? level
        let next = max(0, fromXp + amount)
        xp = next

        let earned = Levels.levelFor(next)
        if earned <= fromLevel { return false }

        let unlocked = Levels.skinsUnlockedBetween(fromLevel, earned)
        level = earned
        track("levelup", "level \(earned)")

        /* past level 10 most levels don't unlock a skin */
        if unlocked.isEmpty { return false }
        /* with real gating on this is Pro-only */
        if !hasPro { return false }

        pendingSkin = unlocked[0].skin
        return true
    }

    // MARK: Creator Mode

    func startCreatorSession(task: String, duration: Double?) {
        if !hasPro { return }
        creator.active = CreatorActive(task: task, duration: duration, startedAt: JS.nowMs)
        track("creator", "started \(task) · \(duration.flatMap { $0 != 0 ? "\(JS.num($0))m" : nil } ?? "no limit")")
    }

    func finishCreatorSession(task: String, minutes: Double, savedAction: Bool = false) {
        var c = creator
        c.todayMinutes = (c.date == dateKey ? c.todayMinutes : 0) + minutes
        c.date = dateKey
        c.totalMinutes += minutes
        c.sessions += 1
        c.active = nil
        creator = c
        track("creator", "finished \(task) · \(JS.num(minutes))m\(savedAction ? " · task saved" : "")")
    }
}

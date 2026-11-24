import Foundation

/// The one check-in, however they got there (real Screen Time):
///   Shortcuts automation   "when instagram is opened → rilo check-in"
///                          (RiloCheckInIntent → CheckInRouter → here)
///   the shield             "talk to rilo" → notification → here
///   Rilo's own app list    tapping an app on Home
/// All three land on CheckInView for that app, once: the same open is never
/// counted twice when two of them fire for one tap.
extension AppState {
    /// two routes firing for the same tap (the notification AND the App
    /// Group event) inside this window are one check-in
    static let CHECKIN_DEDUPE_MS: Double = 20_000
    /// "never mind" is a win, but not one to farm: xp for the first few a day
    static let NEVER_MIND_XP = 10
    static let NEVER_MIND_XP_PER_DAY = 3

    /// Open the check-in for `app` (a token key). `counted`: openApp
    /// already counted this open.
    func checkIn(_ app: String, via: String, counted: Bool = false) {
        guard onboarded, tracked.contains(app) else {
            track("checkin", "ignored \(via): \(onboarded ? "not a picked app" : "still onboarding")")
            return
        }
        let now = JS.nowMs
        if let last = lastCheckIn, last.app == app, now - last.at < Self.CHECKIN_DEDUPE_MS,
           screen == .checkin || screen == .whyopen || screen == .appopen {
            return
        }
        /* a session already running on it: back to its screen, nothing counted */
        if screen == .appopen && session.app == app { return }
        lastCheckIn = (app, now)
        if !counted { countOpen(app) }
        session.app = app
        banner = false
        track("checkin", "via \(via)")
        /* straight there: no slide to wait out (a slide in progress would
           otherwise drop the move) */
        jump(to: .checkin)
    }

    /// The check-in's wait before "open" unlocks, escalating with each open
    /// of this app today: 5s, 10s, 15s, then 20s. Strict mode adds 10s.
    func checkInWait(_ app: String) -> Int {
        let n = max(1, opens.date == dateKey ? (opens.counts[app] ?? 1) : 1)
        let base = [Limits.WAIT_NORMAL, 10, 15, 20][min(n, 4) - 1]
        return base + (strict.on ? Limits.WAIT_STRICT - Limits.WAIT_NORMAL : 0)
    }

    /// "open": one session (the app's minutes per open, or what's left of
    /// the last open), then straight back into the real app
    func checkInOpen(_ app: String, reason: CheckinReason) {
        let minutes = Double(settingOf(app).minutes)
        let before = JS.nowMs
        startCheckedIn(app, CheckinPick(reason: reason.id, why: reason.label, mins: minutes, length: "full", cost: 1))
        if sessionStarted(app, since: before) { reopenApp(app) }
    }

    private func sessionStarted(_ app: String, since: Double) -> Bool {
        session.app == app && session.startedAt >= since
    }

    /// the emergency pass from the out-of-opens check-in
    func checkInPass(_ app: String) {
        let before = JS.nowMs
        spendEmergencyPass(app, why: "from the check-in")
        if sessionStarted(app, since: before) { reopenApp(app) }
    }

    /// "never mind": that's a win
    func checkInNeverMind(_ app: String, win: Bool = true) {
        /* out of opens there was nothing to say no to: no win, no "time saved" */
        if win { interceptReason("never mind"); neverMindWin() }
        track("checkin", "never mind")
        go(.home, dir: .back)
    }

    /// xp for not opening it, the first few times a day (check-in or shield)
    func neverMindWin() {
        let d = UserDefaults.standard
        let today = d.string(forKey: "rilo.neverMind.date") == dateKey ? d.integer(forKey: "rilo.neverMind.count") : 0
        if today < Self.NEVER_MIND_XP_PER_DAY { awardXp(Self.NEVER_MIND_XP) }
        d.set(dateKey, forKey: "rilo.neverMind.date")
        d.set(today + 1, forKey: "rilo.neverMind.count")
    }

    /// The Shortcuts check-in, once Rilo is in front. `name` is the app the
    /// automation was made for ("instagram").
    func checkInFromShortcut(_ name: String) {
        guard let key = AppMatch.key(for: name, among: tracked) else {
            track("checkin", "shortcut for \(name): no matching app")
            return
        }
        Automation.markSeen(key)
        /* the setup step's "test it": show the tick, not a check-in */
        if !onboarded || screen == .automation {
            syncScreenTime(force: true)
            return
        }
        syncScreenTime(force: true)
        checkIn(key, via: "shortcut")
    }
}

/// Which apps the user's Shortcuts automation is doing the check-in for.
/// Rilo can't see the Shortcuts app, so an app counts as set up the first
/// time its check-in actually runs (the setup step's "test it"). Saved in
/// the App Group on the phone.
nonisolated enum Automation {
    private static let KEY = "rilo.automationSeen"

    static var seen: [String: Double] {
        get { (AppGroup.defaults.dictionary(forKey: KEY) as? [String: Double]) ?? [:] }
        set { AppGroup.defaults.set(newValue, forKey: KEY) }
    }

    static func isOn(_ key: String) -> Bool { seen[key] != nil }

    static func markSeen(_ key: String) {
        var s = seen
        s[key] = Date().timeIntervalSince1970 * 1000
        seen = s
    }

    /// "use the shield instead" (or the automation was deleted)
    static func turnOff(_ key: String) {
        var s = seen
        s.removeValue(forKey: key)
        seen = s
    }

    /// For the Shortcuts check-in, before Rilo comes to the front: should it
    /// open at all? No while that app's session is running (they're going
    /// back in) and no while its shield is up (the shield is already the
    /// check-in; both must never show at once).
    static func shouldOpenRilo(forName name: String) -> Bool {
        let keys = Array(RiloShared.rules.apps.keys)
        guard let key = AppMatch.key(for: name, among: keys) else { return true }
        if let s = RiloShared.session, s.app == key,
           RiloShared.nowMs - s.startedAt < RiloShared.windowMinutes(for: s.minutes) * 60_000 { return false }
        if RiloShared.kicked.contains(key) { return false }
        if let rule = RiloShared.rules.apps[key], rule.shielded { return false }
        return true
    }
}

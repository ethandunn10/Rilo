import Foundation
import DeviceActivity
import ManagedSettings

/// Target: RiloActivityMonitor (Device Activity Monitor Extension).
/// Also needs Shared/AppGroup.swift, Shared/RiloShared.swift, Shared/RiloTokens.swift.
///
/// iOS runs this even when Rilo is closed:
///   rilo.daily   intervalDidStart at midnight → fresh day, every shield back up
///   rilo.session the open's window: thresholds at half the minutes (halves)
///                and all of them (time's up → shield again); the window
///                ending means they left → shield again
/// Each ended session is written to the App Group for the app to charge.
nonisolated final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    private let store = ManagedSettingsStore(named: .rilo)

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard activity == .riloDaily else { return }
        /* only on a real new day: the app re-registers this schedule mid-day
           (when its Shortcuts apps change) and that can start it again */
        guard RiloShared.rules.dateKey != RiloShared.todayKey() else { return }
        /* fresh day: no session carries over midnight, nobody stays kicked out */
        if let s = RiloShared.session { endSession(s, timeUp: false) }
        RiloShared.kicked = []
        var rules = RiloShared.rules
        rules.dateKey = RiloShared.todayKey()
        /* fresh opens even if Rilo isn't opened today: out-of-opens locks
           lift, and apps whose check-in is the Shortcuts automation drop
           their shield again (the app redoes all of this when it opens) */
        for (k, var a) in rules.apps {
            if a.lockKind == "noopens" || a.lockKind == "halfstranded" {
                a.lockKind = nil
                if let fresh = a.opensPerDay { a.opensLeft = fresh }
                if a.automated == true { a.shielded = false }
            } else if a.lockKind == nil, let fresh = a.opensPerDay {
                a.opensLeft = fresh
            }
            rules.apps[k] = a
        }
        RiloShared.rules = rules
        reshield()
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)
        /* the session's window closed before its minutes ran out: they left */
        guard activity == .riloSession, let s = RiloShared.session else { return }
        /* only if it's THIS session's window (not one the app just replaced) */
        let endsAt = s.startedAt + RiloShared.windowMinutes(for: s.minutes) * 60_000
        if RiloShared.nowMs >= endsAt - 30_000 { endSession(s, timeUp: false) }
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        /* the Shortcuts safety net: an app whose check-in is the automation
           got 2 minutes of use today with no Rilo session behind it. The
           automation is gone (or off), so put its shield back. */
        if activity == .riloDaily, let key = RiloTokens.guardedKey(event) {
            if RiloShared.session?.app == key { return }
            if (RiloShared.usageToday()[key] ?? 0) > 0 { return }
            RiloShared.kicked.insert(key)
            RiloShared.post(SharedEvent(kind: "automationMissing", app: key, at: RiloShared.nowMs))
            reshield()
            return
        }
        guard activity == .riloSession, var s = RiloShared.session else { return }
        if event == .riloHalf {
            s.halfReached = true
            RiloShared.session = s
            return
        }
        if event == .riloTimeUp {
            endSession(s, timeUp: true)
            /* no need to keep watching this window */
            DeviceActivityCenter().stopMonitoring([.riloSession])
        }
    }

    /// Shield it again and tell the app what to charge. Opens are charged in
    /// halves by the app (Limits.opensSpent), so all this needs is a fair
    /// guess at the minutes: all of them, past half, or under half.
    private func endSession(_ s: SharedSession, timeUp: Bool) {
        let minutes: Double
        if timeUp { minutes = s.minutes }
        else if s.halfReached { minutes = s.minutes / 2 + 1 }
        else { minutes = min(1, s.minutes / 2) }

        RiloShared.session = nil
        /* the Live Activity's timer goes stale on its own at the end time;
           also try to take it down now (iOS may not let an extension) */
        RiloLiveActivity.endAll()
        /* shield it now even if the automation does its check-ins: that's
           the only way to get them out of the app (the app lifts it again
           when they check in) */
        if s.kind != "always" { RiloShared.kicked.insert(s.app) }
        RiloShared.addUsage(app: s.app, minutes: minutes)
        RiloShared.post(SharedEvent(kind: "sessionEnded", app: s.app, minutes: minutes, at: RiloShared.nowMs))
        reshield()
    }

    private func reshield() {
        RiloTokens.applyShields(rules: RiloShared.rules, session: RiloShared.session, store: store)
    }
}

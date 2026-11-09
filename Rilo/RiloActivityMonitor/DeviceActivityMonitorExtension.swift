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
        /* fresh day: no session carries over midnight */
        if let s = RiloShared.session { endSession(s, timeUp: false) }
        var rules = RiloShared.rules
        rules.dateKey = RiloShared.todayKey()
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
        RiloShared.addUsage(app: s.app, minutes: minutes)
        RiloShared.post(SharedEvent(kind: "sessionEnded", app: s.app, minutes: minutes, at: RiloShared.nowMs))
        reshield()
    }

    private func reshield() {
        RiloTokens.applyShields(rules: RiloShared.rules, session: RiloShared.session, store: store)
    }
}

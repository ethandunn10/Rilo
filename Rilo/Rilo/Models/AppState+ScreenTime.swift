import Foundation
import UIKit

/// Phase 8: where AppState talks to the phone's Screen Time, through the one
/// seam `ScreenTimeService` (Services/ScreenTimeService.swift). With the demo
/// service (the default) none of this changes anything you can see.
///
/// The points it's called from:
///   openApp / beginAppSession   AppState+Sessions (a session lifts a shield)
///   finishSession               AppState+Sessions (the shield goes back up)
///   settingsChanged             AppState+Saving   (limits, strict, opens left → shields)
///   appBecameActive             AppState+Saving   (what happened while away)
///   startFreshDay               AppState+Days     (midnight)
///   permissionAllow             AppState+Screens  (the real permission prompt)
extension AppState {
    // MARK: the rules, as the service needs them

    var screenTimeRules: ScreenTimeRules {
        var apps: [String: ScreenTimeRules.App] = [:]
        for app in tracked {
            let lock = lockOf(app)
            apps[app] = ScreenTimeRules.App(mode: lock.setting.mode,
                                            shielded: ScreenTimeRules.shields(lock.setting.mode),
                                            opensLeft: availOf(app),
                                            minutesPerOpen: lock.setting.minutes,
                                            lockKind: lock.locked ? lock.kind : nil)
        }
        let sched = schedule
        return ScreenTimeRules(dateKey: dateKey, apps: apps, strict: strict.on,
                               scheduleKind: sched.locked ? sched.kind : nil,
                               scheduleUntil: sched.locked ? sched.until : nil,
                               mood: riloMood, note: riloNote, skin: chosenRilo)
    }

    /// Hand the service the rules when they've changed (after every save).
    func syncScreenTime(force: Bool = false) {
        let rules = screenTimeRules
        if !force && rules == lastScreenTimeRules { return }
        lastScreenTimeRules = rules
        screenTimeService.apply(rules)
    }

    // MARK: sessions

    /// Start a session: the shield comes down for its length, then the
    /// timer screen. (Every `session = …; goTo(.appopen)` goes through here.)
    func beginAppSession(_ s: Session) {
        var s = s
        s.startedAt = JS.nowMs
        session = s
        if let app = s.app {
            screenTimeService.startSession(ScreenTimeSession(app: app, minutes: s.cap, kind: s.kind, startedAt: s.startedAt))
        }
        goToSoon(.appopen)
    }

    /// true when Rilo is really blocking (not the DEBUG demo)
    var realScreenTime: Bool { ScreenTime.isReal(screenTimeService) }

    // MARK: things that happened while Rilo wasn't on screen

    /// Real Screen Time only (the demo never has any).
    func handleScreenTimeEvents() {
        for event in screenTimeService.takeEvents() {
            switch event {
            case .shieldTapped(let app):
                openedFromShield(app)
            case .sessionEnded(let app, let minutes):
                /* the session ran out (or they left) while Rilo was away: charge it */
                if screen == .appopen && session.app == app {
                    finishSession(app, minutesUsed: minutes)
                }
            }
        }
    }

    /// The real shield's button → Rilo's notification → here. Same as the
    /// demo's openApp → shield → banner tap: count the open, then Intercept.
    func openedFromShield(_ app: String) {
        guard onboarded else { return }
        countOpen(app)
        banner = false
        goTo(.intercept)
    }

    // MARK: permission

    /// PermissionView's "allow": the real system prompt (demo: instant yes).
    /// Saying no in the real prompt is the same as the fake sheet's "don't allow".
    func requestScreenTimeAuth() {
        let service = screenTimeService
        Task { @MainActor [weak self] in
            let answer = await service.requestAuthorization()
            if answer == .denied { self?.screenTime = false; track("screentime", "denied by ios") }
        }
    }
}

// MARK: - back into the real app

extension AppState {
    /// is there a URL to send them straight back into this app?
    func canReopen(_ app: String) -> Bool { !AppMatch.urls(for: AppMatch.name(for: app)).isEmpty }

    /// Open the real app (its URL scheme). Tries each known scheme in turn;
    /// apps with none just stay on Rilo's session screen, which says to
    /// open it from the home screen.
    func reopenApp(_ app: String) {
        let urls = AppMatch.urls(for: AppMatch.name(for: app))
        func attempt(_ i: Int) {
            guard i < urls.count else { track("session", "no url worked for \(Apps.name(app))"); return }
            UIApplication.shared.open(urls[i]) { ok in
                if !ok { Task { @MainActor in attempt(i + 1) } }
            }
        }
        attempt(0)
    }
}

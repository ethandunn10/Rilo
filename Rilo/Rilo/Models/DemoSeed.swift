import Foundation

/// DEMO/DEBUG ONLY: launch arguments for screenshots.
///   -screen <name>   jump straight to that screen (web names, see Screen)
///                    with sensible demo state, e.g. home has a name, picked
///                    apps and Rilo-built limits
///   -screen foundation[-<theme>]   the Phase 1 FoundationPreview
///   -theme <id>      grass | bamboo | sakura | sunset | snow
///   -beat <0|1|2>    Your number on that beat, settled (no auto-advance)
///   -picked          Rather with gym + studying already picked;
///                    pickapps with tiktok, instagram, youtube ticked
///   -appsheet [-appquery <text>]   pickapps with the add-app sheet open
///   -permsheet / -permdenied   permission with the iOS alert / the deny branch
///   -hold            crunching stays put (no 1.5s auto-advance)
///   -handoff         home with Rilo's hand-off running (then the tour)
///   -tourstep <n>    start the Meet Rilo tour on step n (with -tour)
///   -creatoractive [-creatoralert nudge|kicked|time-up]   creator with a
///                    10-min posting session running (and that pop-up up)
///   -askday <n>      first-week question of day n is waiting (the demo
///                    panel's "day n" button), e.g. plan with -askday 2
///   -planask / -planedit / -planbottom   plan with Rilo's questions open /
///                    editing / scrolled to the end (PlanView)
///   -demopanel       the demo panel starts open
///   -stepdown        this week's step-down offered (home)
///   -screen strictcard  the strict mode card alone (StrictCardPreview), with
///                    -strictpicking / -strictshowing / -strictconfirm
///   -strict          strict mode on (1 week, all day); -strictending: and
///                    its 24h switch-off countdown running
///   -pending         limits: a loosening change waiting its 24h (with -strict)
///   -limitsscroll <app|bottom>   limits scrolled to that card / the end
///   -limitsmode <app>=<blocked|limited|free>   set one app's mode first
///   -breakmins <5|10|15>   break with that length; -suggestnth <n>: suggestion
///                    after n taps of "suggest something else"
///   -outofopens / -passused / -strict   shield, intercept, whyopen with
///                    tiktok out of opens / the pass used / strict mode on
///   -banner          shield with Rilo's notification down
///   -waitdone        intercept with the wait already run down
///   -bypass pass|borrow [-reason <text>]   intercept with that sheet up
///   -whyreason <id> / -whystage reason|what|push|length / -whylength
///                    quick|full / -why <text>   whyopen on that step
///   -appkind pass|always / -burned <min>   appopen as a pass / always-
///                    allowed session, or with that many minutes burned
///   -loosen          the "making it easier?" sheet (BypassGuiltOverlay)
///   -youscroll <id>  you tab scrolled to that part (see YouView), -youloosen
///                    strict-wait|strict-now: its "making it easier?" sheet up
///   -calendaron [-calsources a,b] / -calsheet <which>   calendar connected
///                    (with those sources) / with that system sheet up
///   -goalhours <h>   the daily goal set to h hours
///   -nightcustom     nighttime on "another time" with the field open
///   -scrollbottom    progress scrolled to the end (also Home)
///   -picksel <skin> / -pickscroll   pickrilo previewing that skin / with
///                    the grid scrolled to the end
///   -buddycode <CODE> / -buddyfriends <n> / -nudged / -buddysaid <text>
///                    buddies with a code, n demo friends, the first nudged,
///                    and that line under the invite card
///   -plan year|month|free   paywall / upgrade with that row selected
///   -resultstaps     results with a tester's onboarding taps counted
///   -settingscheck   (with -screen you) run SettingsCheck, see that file
///   -flowcheck       (no -screen) run FlowCheck: every flow, from a wiped
///                    save; results in Documents/flowcheck.txt
///   -notifynow       schedule the check-in reminder 5 seconds out
///   -askpermission   show the notification permission prompt
///   (no -screen)     a normal launch: whatever was saved comes back
///   -tour            keep the Meet Rilo tour on the tab screens (off by
///                    default so screenshots show the screen itself)
/// The seed runs the same AppState actions onboarding does, so the numbers
/// are the real ones. Taps made while seeding aren't tracked.
enum DemoSeed {
    static var arguments: [String] { ProcessInfo.processInfo.arguments }

    /// a DEBUG-only on/off launch argument (always false in release)
    static func flag(_ key: String) -> Bool {
        #if DEBUG
        return arguments.contains(key)
        #else
        return false
        #endif
    }

    static func arg(_ key: String) -> String? {
        guard let i = arguments.firstIndex(of: key), i + 1 < arguments.count else { return nil }
        return arguments[i + 1]
    }

    static var screenArg: String? { arg("-screen") }

    /// `-screen foundation` / `foundation-<theme>`
    static var foundation: (on: Bool, theme: String?) {
        guard let s = arg("-screen"), s.hasPrefix("foundation") else { return (false, nil) }
        let theme = s.split(separator: "-").dropFirst().first.map(String.init)
        return (true, theme)
    }

    /// The AppState the app starts with.
    @MainActor
    static func launch() -> AppState {
        #if DEBUG
        if arguments.contains("-selfcheck") { SelfCheck.run() }
        /* a seeded screen always starts from a fresh account (the saved xp
           and level would otherwise carry over from the last launch) */
        if screenArg != nil { Storage.clearState() }
        /* -flowcheck: every flow from a brand-new account (FlowCheck) */
        if arguments.contains("-flowcheck") { Storage.clearState() }
        #endif
        let state = AppState()
        if let theme = arg("-theme") { state.theme = theme }
        /* the strict card preview: seed like the You tab */
        if screenArg == "strictcard" { seed(state, for: .you) }
        if let raw = arg("-screen"), let screen = Screen(rawValue: raw) {
            seed(state, for: screen)
        }
        #if DEBUG
        /* -settingscheck: tap through every You-tab setting in code */
        if arguments.contains("-settingscheck") {
            Task { @MainActor in await SettingsCheck.run(state) }
        }
        /* -flowcheck: walk every flow in code, see Models/FlowCheck */
        if arguments.contains("-flowcheck") {
            Task { @MainActor in await FlowCheck.run(state) }
        }
        /* -notifynow: the check-in reminder 5 seconds out (asks permission
           first if it hasn't been asked) */
        if arguments.contains("-notifynow") { RiloNotifications.shared.checkinIn5s() }
        /* -askpermission: the notification prompt, the way PermissionView's
           "allow" triggers it */
        if arguments.contains("-askpermission") { RiloNotifications.shared.askPermission() }
        #endif
        return state
    }

    /// screens that come before the user has picked anything
    private static let blank: [Screen] = [.welcome, .name, .pickapps]

    @MainActor
    static func seed(_ state: AppState, for screen: Screen) {
        Track.muted = true
        defer { Track.muted = false }

        if !blank.contains(screen) {
            state.name = "Ethan"
            state.apps = PickedApps(on: ["tiktok": true, "instagram": true, "youtube": true, "snapchat": true],
                                    extra: [])
        }
        let past: [Screen] = [.permission, .crunching]
        if !blank.contains(screen) && !past.contains(screen) {
            /* what Permission → Crunching → Rather do */
            state.screenTime = true
            state.startFromApps(true)
            state.rather = ["gym", "studying"]
            state.about = Rather.applyRather(state.about, state.rather, [])
            state.buildPlanFor(state.rather)
        }

        let tabs = Screen.tourScreens + [.limits, .creator, .daysummary, .shield, .appopen, .intercept,
                                         .whyopen, .suggestion, .tired, .break, .levelup,
                                         .sharecard, .buddies, .nightcheckin, .nighttime, .calendar,
                                         .talkchat, .upgrade, .results]
        if tabs.contains(screen) {
            state.planChoice = "trial"
            state.isPro = true
            state.introTourDone = !arguments.contains("-tour")
            state.day.used = ["tiktok": 38, "instagram": 22]
            state.day.opensUsed = ["tiktok": 1, "instagram": 0.5]
            /* a session a few minutes ago, so Rilo isn't "chilling" */
            state.day.lastBlockedAt = JS.nowMs - 5 * 60000
            state.day.sinceBlocked = 0
        }

        /* -picked: PickApps with tiktok, instagram and youtube ticked */
        if screen == .pickapps && arguments.contains("-picked") {
            state.apps = PickedApps(on: ["tiktok": true, "instagram": true, "youtube": true], extra: [])
        }

        switch screen {
        case .shield, .intercept, .whyopen, .suggestion, .tired, .break:
            state.session.app = "tiktok"
            state.opens = OpenCounts(date: state.dateKey, counts: ["tiktok": 4])
            /* sub-states of the pop-up (Intercept): */
            /* -outofopens: tiktok's opens are all spent today */
            if arguments.contains("-outofopens") {
                state.day.opensUsed["tiktok"] = state.totalOpensFor("tiktok")
            }
            /* -passused: today's emergency pass is gone */
            if arguments.contains("-passused") { state.day.passes = Limits.PASSES_PER_DAY }
            /* -strict: strict mode on (15s wait, no halves, no borrowing) */
            if arguments.contains("-strict") { state.strictOn(days: 7, when: "all") }
            /* -banner: the shield with Rilo's notification down */
            if screen == .shield && arguments.contains("-banner") { state.banner = true }
        case .appopen:
            let s = state.settingOf("tiktok")
            let kind = arg("-appkind") ?? "open"
            state.session = Session(app: "tiktok", cap: kind == "pass" ? Limits.PASS_MINUTES : Double(s.minutes),
                                    carried: 0, charged: 0, kind: kind, minutes: s.minutes)
        case .daysummary:
            let goal = Double(state.goalMins)
            state.dayResult = DayResult(used: goal - 25, goal: goal, hit: true, xp: 80, streak: 3,
                                        under: 25, repeated: false)
        case .creator where arguments.contains("-creatoractive"):
            state.creator.active = CreatorActive(task: "post", duration: 10, startedAt: JS.nowMs - 3 * 60000)
        case .levelup:
            /* what the You tab's "demo: +500 xp" does to the web's fresh
               account (320 xp, level 2): 820 xp, level 4, shades unlocked */
            state.xp = 820
            state.level = 4
            state.pendingSkin = "shades"
        case .buddies:
            /* -buddycode <CODE>: an invite code made; -buddyfriends <n>: that
               many demo friends joined; -nudged: the first one nudged */
            if let c = arg("-buddycode") { state.buddies.code = c }
            if let n = arg("-buddyfriends").flatMap(Int.init) {
                state.buddies.friends = MockAI.DEMO_FRIENDS.prefix(n).map { f in
                    var f = f; f.code = "ABC123"; return f
                }
                if arguments.contains("-nudged"), !state.buddies.friends.isEmpty {
                    state.buddies.friends[0].nudged = true
                }
            }
        case .rather:
            /* arrives with nothing picked, like onboarding; -picked keeps gym + studying */
            if !arguments.contains("-picked") { state.rather = [] }
        case .you:
            /* what the web shows right after onboarding + the trial */
            state.xp = 320
            state.level = 2
        case .upgrade:
            state.isPro = false
            state.planChoice = "free"
            /* opened from the You tab's "see rilo pro", so back goes there */
            state.cameFrom = .you
        case .results where arguments.contains("-resultstaps"):
            /* -resultstaps: the taps a tester makes walking onboarding as
               Ethan, then opening the demo panel (what the web shot shows) */
            Track.muted = false
            Track.resetCounts()
            track("screentime", "allowed")
            track("limits", "built from onboarding · allows 120m")
            track("paywall", "start free trial")
            track("demo", "usage under")
            Track.muted = true
        default:
            break
        }
        if arguments.contains("-handoff") {
            state.introTourDone = false
            state.handoff = true
        }
        /* -plan year|month|free: the paywall with that row selected */
        if let p = arg("-plan") { state.plan = p }
        /* -goalhours <h>: the daily goal moved (You's goal stepper) */
        if let g = arg("-goalhours"), let h = Double(g) { state.time.goal = h }
        /* -calendaron [-calsources Notes,Reminders]: the demo calendar connected */
        if arguments.contains("-calendaron") {
            state.calendar = CalendarLink(on: true, which: "Demo Calendar",
                                          sources: arg("-calsources")?.split(separator: ",").map(String.init) ?? [])
        }
        /* -loosen: Rilo's "making it easier?" sheet for a looser tiktok limit */
        if arguments.contains("-loosen") {
            var next = state.settingOf("tiktok")
            next.opens += 1
            state.loosenAsk = LoosenAsk(app: "tiktok", next: next)
        }
        /* -stepdown: this week's step-down is on offer (Home's StepDown card) */
        if arguments.contains("-stepdown") {
            state.step = StepState(week: state.program.week, app: "", status: "offered")
        }
        /* -limitsmode app=mode: one app's setting changed first */
        if let lm = arg("-limitsmode"), let eq = lm.firstIndex(of: "="),
           let mode = AppMode(rawValue: String(lm[lm.index(after: eq)...])) {
            let app = String(lm[..<eq])
            var s = state.settingOf(app); s.mode = mode
            state.appSettings[app] = s
        }
        /* -strict / -strictending: strict mode on, and winding down */
        if arguments.contains("-strict") || arguments.contains("-strictending") || screenArg == "strictcard" && arguments.contains("-strictconfirm") {
            state.strict = StrictState(on: true, days: 7, when: "all",
                                       endingAt: arguments.contains("-strictending") ? JS.nowMs + 24 * 60 * 60 * 1000 - 19 * 60000 : nil)
        }
        /* -pending: a loosening change on the first limited app, waiting its 24h */
        if arguments.contains("-pending"),
           let app = state.tracked.first(where: { state.settingOf($0).mode == .limited }) {
            let prev = state.settingOf(app)
            var next = prev; next.opens += Limits.OPEN_STEP
            state.pending = [Limits.makePending(app: app, prev: prev, next: next, now: JS.nowMs - 18 * 60000)]
        }
        /* -askday N: what the demo panel's "day N · ..." button does */
        if let d = arg("-askday"), let n = Int(d) { state.demoAskDay(n) }
        state.jump(to: screen)
        #if DEBUG
        /* -beat N: Your number on that beat, settled (YourNumberView) */
        if let b = arg("-beat"), let n = Int(b) { state.numberBeat = n }
        #endif
    }
}

import SwiftUI

/// Port of app/src/screens/Intercept.jsx — the pop-up, after the shield and
/// the notification.
///
/// Every way through an app lives here, and there are only three: spend an
/// open, spend today's emergency pass, or borrow half an open off tomorrow.
/// When all three are gone, that's the day (§7). Nothing unlocks until a
/// short wait runs down: 5 seconds normally, 15 in strict mode (§12).
struct InterceptView: View {
    @Environment(AppState.self) private var state
    @State private var countdown: Int = -1
    /// which bypass they tapped, if any: "pass" or "borrow"
    @State private var bypass: String? = nil
    @State private var timer: Timer? = nil

    static func waitFor(_ strictOn: Bool) -> Int { strictOn ? Limits.WAIT_STRICT : Limits.WAIT_NORMAL }

    /// out of everything gets the sad face, never the angry one
    static func moodFor(stuck: Bool, opensToday: Int) -> String {
        if stuck { return "letdown" }
        if opensToday >= 3 { return "angry" }
        if opensToday >= 2 { return "letdown" }
        return "coach"
    }

    /// everything the web computes from Intercept's props
    struct Facts {
        let app: String
        let lock: LockInfo
        let openCount: Int
        let opensToday: Int
        let minutes: Int
        let opensTotal: Double
        let opensUsed: Double
        let opensLeft: Double
        let strictOn: Bool
        let passesLeft: Int
        let canBorrow: Bool
        let streak: Int
        let goalLeft: Int

        var limited: Bool { lock.setting.mode == .limited }
        var blocked: Bool { lock.setting.mode == .blocked }
        /// an app with no limit has nothing to run out of
        var unlimited: Bool { lock.setting.mode == .free }
        /// a window (bedtime / school / focus) beats everything but the pass
        var windowed: Bool { ["bedtime", "school", "focus"].contains(lock.kind ?? "") }
        var canSpend: Bool { (limited || unlimited) && !windowed && !lock.locked }
        /// nothing left anywhere — the end of the road (§7)
        var stuck: Bool { !canSpend && !windowed && passesLeft <= 0 && !canBorrow }
    }

    private var facts: Facts {
        let app = state.currentApp
        return Facts(app: app, lock: state.lockOf(app), openCount: max(1, state.openCount),
                     opensToday: Int(state.opensUsedFor(app).rounded(.up)),
                     minutes: state.settingOf(app).minutes, opensTotal: state.totalOpensFor(app),
                     opensUsed: state.opensUsedFor(app), opensLeft: state.availOf(app),
                     strictOn: state.strict.on, passesLeft: state.passesLeft,
                     canBorrow: state.borrowableFor(app), streak: state.streak,
                     goalLeft: Int(state.goalLeft))
    }

    var body: some View {
        let f = facts
        let shownCountdown = countdown < 0 ? Self.waitFor(f.strictOn) : countdown
        let ready = shownCountdown <= 0

        ZStack {
            SkyView(hills: .mid)
                .blur(radius: bypass != nil ? 3 : 0)

            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 9) {
                        InterceptAppChip(app: f.app)

                        RiloView(skin: state.chosenRilo, mood: Self.moodFor(stuck: f.stuck, opensToday: f.opensToday),
                                 size: 140, talks: true)

                        InterceptTop(f: f, countdown: shownCountdown, ready: ready)

                        Spacer(minLength: 6)

                        InterceptWays(f: f, ready: ready, bypass: $bypass)

                        Button {
                            state.interceptReason("never mind")
                            state.go(.home, dir: .back)
                        } label: {
                            Text(f.stuck ? "alright, close it" : "never mind, close it")
                                .font(.fredoka(17, 600))
                                .foregroundStyle(RC.ink)
                                .padding(.vertical, 12 + 1.5)
                                .padding(.horizontal, 22 + 1.5)
                                .background(Capsule().fill(Color.white.opacity(0.92)))
                                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                        }
                        .buttonStyle(.tap)
                        .padding(.top, 4)
                    }
                    .foregroundStyle(RC.ink)
                    .padding(.top, WebLayout.top(40))
                    .padding(.horizontal, 20)
                    .padding(.bottom, WebLayout.bottom(24 + 9))   // --tail + the column gap
                    .frame(maxWidth: .infinity, minHeight: geo.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
            /* the sheet's backdrop-filter: blur(3px) */
            .blur(radius: bypass != nil ? 3 : 0)
            .animation(.easeOut(duration: 0.25), value: bypass)

            /* every way around a limit goes through rilo first */
            if let kind = bypass {
                BypassGuilt(
                    skin: state.chosenRilo,
                    kind: kind,
                    title: kind == "borrow" ? "borrowing from tomorrow?" : "using your one pass?",
                    hobbies: state.profileList("hobby"),
                    goals: state.profileList("goal"),
                    streak: f.streak,
                    confirmLabel: kind == "borrow" ? "borrow it" : "use the pass",
                    initialReason: debugReason,
                    frost: false,
                    onConfirm: { reason in
                        bypass = nil
                        if kind == "borrow" { state.borrowFromTomorrow(f.app, why: reason) }
                        else { state.spendEmergencyPass(f.app, why: reason) }
                    },
                    onCancel: { bypass = nil }
                )
                .zIndex(50)
            }
        }
        .onAppear(perform: start)
        .onDisappear { timer?.invalidate() }
    }

    private func start() {
        countdown = Self.waitFor(state.strict.on)
        #if DEBUG
        /* -waitdone: the wait already ran down; -bypass pass|borrow: that sheet is up */
        if DemoSeed.flag("-waitdone") || DemoSeed.arg("-bypass") != nil { countdown = 0 }
        if let b = DemoSeed.arg("-bypass") { bypass = b }
        #endif
        timer?.invalidate()
        guard countdown > 0 else { return }
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            MainActor.assumeIsolated {
                if countdown <= 1 {
                    t.invalidate()
                    countdown = 0
                } else {
                    countdown -= 1
                }
            }
        }
    }

    private var debugReason: String {
        #if DEBUG
        return DemoSeed.arg("-reason") ?? ""
        #else
        return ""
        #endif
    }
}

import SwiftUI

/// Real Screen Time's session screen. The shield is down on the real app
/// (FamilyControlsScreenTimeService.startSession) and iOS's DeviceActivity
/// timer puts it back when the minutes run out, even with Rilo closed. So
/// there's no pretend app and no fake clock here: just how long is left
/// (the wall clock since the session started), a way back into the app,
/// and "i'm done" to end it early (unspent minutes bank as time saved).
struct RealSessionView: View {
    @Environment(AppState.self) private var state
    @State private var done = false

    var body: some View {
        let s = state.session
        let app = state.currentApp
        let name = Apps.name(app)

        ZStack {
            SkyView(hills: .low)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    AppLogo(label: app, size: 72, radius: 18)
                        .padding(.top, 8)
                    TimelineView(.periodic(from: .now, by: 1)) { ctx in
                        let left = remaining(s, now: ctx.date)
                        VStack(spacing: 6) {
                            Text("\(name) is open")
                                .font(.fredoka(30, 700))
                                .foregroundStyle(RC.ink)
                                .multilineTextAlignment(.center)
                                .fixedSize(horizontal: false, vertical: true)
                                .accessibilityAddTraits(.isHeader)
                            Text(Self.clock(left) + " left")
                                .font(.fredoka(44, 700))
                                .monospacedDigit()
                                .foregroundStyle(RC.greenDeep)
                                .accessibilityLabel("\(Int(left / 60)) minutes \(Int(left) % 60) seconds left")
                        }
                        .onChange(of: left <= 0, initial: true) { _, over in
                            /* time's up while they're looking at Rilo: the
                               shield is already back, charge the whole open */
                            if over { finish(s.cap) }
                        }
                    }
                    Text("rilo puts the lock back when the time's up, even if you leave.")
                        .font(.inter(15, 600))
                        .foregroundStyle(RC.ink2)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)

                    RiloView(skin: state.chosenRilo, mood: "coach", size: 120, talks: false)

                    if state.canReopen(app) {
                        PillButton(title: "open \(name)", fill: RC.green, textColor: .white) { state.reopenApp(app) }
                    } else {
                        Text("open \(name) from your home screen.")
                            .font(.inter(14, 600))
                            .foregroundStyle(RC.ink2)
                            .multilineTextAlignment(.center)
                    }
                    PillButton(title: "i'm done") { finish(usedMins(s)) }
                }
                .padding(.horizontal, 24)
                .padding(.top, WebLayout.top(40))
                .padding(.bottom, WebLayout.bottom(34))
            }
        }
    }

    private func usedMins(_ s: Session, now: Date = Date()) -> Double {
        let start = s.startedAt > 0 ? s.startedAt : JS.nowMs
        return max(0, min(s.cap, (now.timeIntervalSince1970 * 1000 - start) / 60_000))
    }

    private func remaining(_ s: Session, now: Date) -> Double {
        max(0, (s.cap - usedMins(s, now: now)) * 60)
    }

    private func finish(_ mins: Double) {
        if done { return }
        done = true
        state.finishSession(state.currentApp, minutesUsed: mins)
    }

    static func clock(_ secs: Double) -> String {
        let t = Int(secs.rounded(.up))
        return "\(t / 60):\(String(format: "%02d", t % 60))"
    }
}

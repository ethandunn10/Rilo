import SwiftUI

/// Real Screen Time's relock screen: where tapping the Live Activity (or
/// opening Rilo mid-open) lands. The shield is down on the real app and
/// iOS's DeviceActivity timer puts it back when the minutes run out, even
/// with Rilo closed, so there's no pretend app and no fake clock: how long
/// is left (the wall clock since the open started), a quick "what was it
/// for?", "done? relock it" (unspent minutes bank as time saved), and
/// talking to Rilo.
struct RealSessionView: View {
    @Environment(AppState.self) private var state
    @State private var done = false
    @State private var picked: CheckinReason? = nil

    var body: some View {
        let s = state.session
        let app = state.currentApp
        let name = Apps.name(app)

        ZStack {
            SkyView(hills: .low)
            ScrollView(showsIndicators: false) {
                VStack(spacing: 16) {
                    HStack(spacing: 10) {
                        AppLogo(label: app, size: 34, radius: 10)
                        AppName(app: app)
                            .font(.fredoka(19, 600))
                            .foregroundStyle(RC.ink)
                    }
                    .padding(.vertical, 6)
                    .padding(.horizontal, 14)
                    .background(Capsule().fill(Color.white.opacity(0.85)))
                    .padding(.top, 8)

                    TimelineView(.periodic(from: .now, by: 1)) { ctx in
                        let left = remaining(s, now: ctx.date)
                        Text(Self.clock(left) + " left")
                            .font(.fredoka(44, 700))
                            .monospacedDigit()
                            .foregroundStyle(RC.greenDeep)
                            .accessibilityLabel("\(Int(left / 60)) minutes \(Int(left) % 60) seconds left")
                            .onChange(of: left <= 0, initial: true) { _, over in
                                /* time's up while they're looking at Rilo: the
                                   shield is already back, charge the whole open */
                                if over { finish(s.cap) }
                            }
                    }

                    RiloView(skin: state.chosenRilo, mood: "coach", size: 120, talks: false)

                    Text("what was it for?")
                        .font(.fredoka(24, 700))
                        .foregroundStyle(RC.ink)
                        .accessibilityAddTraits(.isHeader)
                    reasons
                    if let picked {
                        Text(CheckInView.reply(picked, minutes: Int(s.cap.rounded())))
                            .font(.fredoka(17, 600))
                            .foregroundStyle(RC.ink)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .transition(.opacity)
                    }

                    PillButton(title: "done? relock it", fill: RC.greenDeep, textColor: .white) {
                        finish(usedMins(s))
                    }
                    PillButton(title: "talk to rilo") { state.goTo(.talkchat) }
                    Text("rilo locks \(name) again when the time's up, even if you leave.")
                        .font(.inter(14, 600))
                        .foregroundStyle(RC.ink2)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 24)
                .padding(.top, WebLayout.top(40))
                .padding(.bottom, WebLayout.bottom(34))
            }
        }
        .animation(.easeOut(duration: 0.2), value: picked)
    }

    private var reasons: some View {
        ChipFlow(spacing: 8) {
            ForEach(Addons.checkinReasons(state.about.creator)) { r in
                let on = picked?.id == r.id
                Button {
                    picked = r
                    state.interceptReason(r.label)
                } label: {
                    Text(r.label)
                        .font(.fredoka(16, 600))
                        .foregroundStyle(on ? .white : RC.ink)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 14)
                        .background(Capsule().fill(on ? RC.ink : Color.white))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                }
                .buttonStyle(.tap)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .frame(maxWidth: .infinity)
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

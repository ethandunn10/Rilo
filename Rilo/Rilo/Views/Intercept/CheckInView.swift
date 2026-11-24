import SwiftUI

/// The check-in (real Screen Time), from the Shortcuts automation, the
/// shield's "talk to rilo" notification, or an app tapped on Home.
///
/// Rilo with his mood, "what's it for?", the opens left as dots, and an
/// "open in 5s" button whose wait grows with each open today
/// (AppState.checkInWait). "open" starts one session and goes straight
/// back into the app. "never mind" is a win. Out of opens (or locked by a
/// schedule, or blocked): no countdown, just the emergency pass rules.
struct CheckInView: View {
    @Environment(AppState.self) private var state
    @State private var left: Int = -1
    @State private var picked: CheckinReason? = nil
    @State private var timer: Timer? = nil

    var body: some View {
        let app = state.currentApp
        let name = Apps.name(app)
        let lock = state.lockOf(app)
        let setting = state.settingOf(app)
        let limited = setting.mode == .limited
        let stuck = lock.locked || setting.mode == .blocked
        let opensToday = state.opens.date == state.dateKey ? (state.opens.counts[app] ?? 1) : 1

        ZStack {
            SkyView(hills: .mid)
            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        HStack(spacing: 10) {
                            AppLogo(label: app, size: 34, radius: 10)
                            Text(name)
                                .font(.fredoka(19, 600))
                                .foregroundStyle(RC.ink)
                        }
                        .padding(.vertical, 6)
                        .padding(.horizontal, 14)
                        .background(Capsule().fill(Color.white.opacity(0.85)))

                        RiloView(skin: state.chosenRilo,
                                 mood: InterceptView.moodFor(stuck: stuck, opensToday: opensToday),
                                 size: 150, talks: true)

                        if stuck { outOfOpens(app, name: name, lock: lock) } else {
                            Text("what's it for?")
                                .font(.fredoka(32, 700))
                                .foregroundStyle(RC.ink)
                                .accessibilityAddTraits(.isHeader)
                            if limited {
                                Opens(total: state.totalOpensFor(app), used: lock.used ?? 0,
                                      minutes: setting.minutes, size: 18, align: .center)
                            }
                            reasons
                            if let picked {
                                Text(Self.reply(picked, minutes: setting.minutes))
                                    .font(.fredoka(18, 600))
                                    .foregroundStyle(RC.ink)
                                    .multilineTextAlignment(.center)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .padding(.horizontal, 8)
                                    .transition(.opacity)
                            }
                            Spacer(minLength: 4)
                            openButton(app, name: name, minutes: setting.minutes)
                        }

                        Button { state.checkInNeverMind(app, win: !stuck) } label: {
                            Text(stuck ? "alright, close it" : "never mind")
                                .font(.fredoka(18, 600))
                                .foregroundStyle(RC.ink)
                                .frame(maxWidth: .infinity, minHeight: 52)
                                .background(Capsule().fill(Color.white.opacity(0.92)))
                                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                        }
                        .buttonStyle(.tap)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, WebLayout.top(28))
                    .padding(.bottom, WebLayout.bottom(28))
                    .frame(minHeight: geo.size.height)
                }
            }
        }
        .animation(.easeOut(duration: 0.2), value: picked)
        .onAppear { start(app) }
        .onDisappear { timer?.invalidate() }
    }

    // MARK: pieces

    private var reasons: some View {
        ChipFlow(spacing: 8) {
            ForEach(Addons.checkinReasons(state.about.creator)) { r in
                let on = picked?.id == r.id
                Button { picked = r } label: {
                    Text(r.label)
                        .font(.fredoka(17, 600))
                        .foregroundStyle(on ? .white : RC.ink)
                        .padding(.vertical, 11)
                        .padding(.horizontal, 16)
                        .background(Capsule().fill(on ? RC.ink : Color.white))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
                }
                .buttonStyle(.tap)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func openButton(_ app: String, name: String, minutes: Int) -> some View {
        let waiting = left > 0
        let ready = !waiting && picked != nil
        let title = waiting ? "open in \(left)s" : picked == nil ? "pick a reason" : "open \(name) · \(minutes) min"
        return Button {
            if let picked, ready { state.checkInOpen(app, reason: picked) }
        } label: {
            Text(title)
                .font(.fredoka(20, 700))
                .monospacedDigit()
                .foregroundStyle(ready ? .white : RC.ink.opacity(0.8))
                .frame(maxWidth: .infinity, minHeight: 58)
                /* waiting: a solid pale pill with dark text (readable over the hills) */
                .background(Capsule().fill(ready ? RC.greenDeep : Color.white.opacity(0.9)))
                .overlay(Capsule().strokeBorder(ready ? Color.clear : RC.line, lineWidth: 1.5))
                .contentTransition(.numericText())
        }
        .buttonStyle(.tap)
        .disabled(!ready)
        .accessibilityLabel(waiting ? "open, in \(left) seconds" : title)
    }

    @ViewBuilder
    private func outOfOpens(_ app: String, name: String, lock: LockInfo) -> some View {
        let passes = state.passesLeft
        Text(Self.stuckTitle(lock, name: name))
            .font(.fredoka(30, 700))
            .foregroundStyle(RC.ink)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityAddTraits(.isHeader)
        Text(lock.kind == "bedtime" || lock.kind == "school" || lock.kind == "focus"
             ? "it opens again at \(Addons.fmtClock(lock.until))."
             : "fresh opens at midnight.")
            .font(.fredoka(19, 600))
            .foregroundStyle(RC.ink2)
        VStack(alignment: .leading, spacing: 6) {
            Text("emergency pass")
                .font(.fredoka(18, 700))
                .foregroundStyle(RC.ink)
            Text("\(Int(Limits.PASS_MINUTES)) minutes, no opens used. costs \(AppState.PASS_XP) xp. one a day.")
                .font(.inter(15, 600))
                .foregroundStyle(RC.ink2)
                .fixedSize(horizontal: false, vertical: true)
            if lock.passable && passes > 0 {
                Button { state.checkInPass(app) } label: {
                    Text("use my emergency pass")
                        .font(.fredoka(18, 700))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 52)
                        .background(Capsule().fill(RC.ink))
                }
                .buttonStyle(.tap)
                .padding(.top, 4)
            } else {
                Text(passes > 0 ? "this lock can't be passed." : "you've used today's pass.")
                    .font(.inter(15, 700))
                    .foregroundStyle(RC.ink)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(fill: RC.card, radius: 22, drop: 3)
    }

    // MARK: words

    static func stuckTitle(_ lock: LockInfo, name: String) -> String {
        switch lock.kind {
        case "bedtime": return "it's bedtime. \(name) is locked."
        case "school": return "school hours. \(name) is locked."
        case "focus": return "focus block. \(name) is locked."
        case "blocked": return "\(name) is blocked."
        default: return "you're out of opens today."
        }
    }

    /// Rilo's one-line reply to the reason, in his voice
    static func reply(_ r: CheckinReason, minutes: Int) -> String {
        switch r.id {
        case "messages": return "reply, then get out. \(minutes) min."
        case "post": return "post it. don't scroll."
        case "bored": return "bored is ok. \(minutes) min, then do something real."
        case "tired": return "tired scrolling never helps. keep it short."
        default: return "fair. \(minutes) min."
        }
    }

    // MARK: the wait

    private func start(_ app: String) {
        timer?.invalidate()
        left = state.checkInWait(app)
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { t in
            MainActor.assumeIsolated {
                if left <= 1 { left = 0; t.invalidate() } else { left -= 1 }
            }
        }
    }
}

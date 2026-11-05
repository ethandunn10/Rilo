#if DEBUG
// DEBUG ONLY: the demo panel is not in Release (TestFlight / App Store) builds.
import SwiftUI

/// DemoPanel.jsx, the open panel's sections, top to bottom.
extension DemoPanelOverlay {
    var sections: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 8) {
                Text("demo panel")
                    .font(.fredoka(18, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
                DemoButton(minHeight: 32, action: { open = false }) { Text("close") }
            }

            Text(statusLine)
                .font(.inter(12, 600))
                .foregroundStyle(RC.ink2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.top, 4)

            simulate
            waysThrough
            strictSection
            skipAhead
            usage
            timeOfDay
            firstWeek
            jumpTo

            label("start clean")
            ChipFlow(spacing: 6) {
                DemoButton("reset all demo data", on: true) { state.startOver() }
            }
        }
    }

    private var statusLine: String {
        let p = state.passesLeft
        let clock = state.demoClock.map { Addons.fmtClock($0) } ?? "real time"
        return "today: \(Plan.fmtMins(state.usedTotalToday)) of \(Plan.fmtMins(Double(state.goalMins))) · "
            + "\(p) pass\(p == 1 ? "" : "es") · \(state.strict.on ? "strict" : "normal") · clock \(clock)"
    }

    // MARK: pieces (DemoPanel.jsx `label`, `note`, `row`)

    func label(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.inter(11, 700))
            .tracking(11 * 0.08)
            .foregroundStyle(RC.ink2)
            .padding(.top, 10)
            .padding(.bottom, 2)
    }

    func note(_ text: String) -> some View {
        Text(text)
            .font(.inter(11.5, 600))
            .foregroundStyle(RC.ink3)
            .webLineHeight(11.5, 1.35)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 2)
    }

    private func withSub(_ title: String, _ sub: String) -> Text {
        Text("\(title)\(Text(sub).font(.fredoka(10.5, 600)).foregroundStyle(RC.ink.opacity(0.65)))")
    }

    // MARK: open an app for a chosen length

    @ViewBuilder
    private var simulate: some View {
        label("simulate a session")
        let tracked = state.tracked
        if !tracked.isEmpty {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(tracked, id: \.self) { a in
                        DemoButton(on: a == app, leading: 5, action: { pick = a }) {
                            HStack(spacing: 6) {
                                AppLogo(label: a, size: 24, radius: 8)
                                    .background(RoundedRectangle(cornerRadius: 8).fill(Color.white))
                                Text(a)
                            }
                        }
                    }
                }
                .padding(.bottom, 2)
            }
            if limited, let s = setting {
                ChipFlow(spacing: 6) {
                    ForEach(lengths, id: \.label) { l in
                        DemoButton(action: { state.demoSimulate(app, mins: l.mins) }) {
                            withSub(l.label, " · \(l.why)")
                        }
                    }
                }
                .padding(.top, 6)
                note("\(app): \(Limits.fmtOpens(s.opens)) × \(s.minutes) min. half is \(JS.num(Limits.halfOf(s.minutes))) min. "
                     + (state.strict.on ? "strict mode — every one of these costs a whole open."
                                        : "leave by half and it costs ½."))
            } else {
                note("\(app) is \(setting?.mode.rawValue ?? ""). only a limited app spends opens — set one on the limits screen to test halves.")
            }
        } else {
            note("no apps tracked yet. pick some on the you tab.")
        }
    }

    // MARK: the ways through

    @ViewBuilder
    private var waysThrough: some View {
        let canBorrow = state.borrowableFor(state.currentApp)
        label("the ways through")
        ChipFlow(spacing: 6) {
            DemoButton("use the emergency pass", dim: state.passesLeft <= 0 || app.isEmpty) {
                if !app.isEmpty { state.demoPass(app) }
            }
            DemoButton("borrow ½ from tomorrow", dim: !canBorrow || app.isEmpty) {
                if !app.isEmpty { state.demoBorrow(app) }
            }
        }
        note(canBorrow ? "borrowing needs the pass gone and no opens left — it is."
                       : "borrowing only shows up with 0 opens left, the pass used, and strict off.")
    }

    // MARK: strict mode

    @ViewBuilder
    private var strictSection: some View {
        label("strict mode")
        ChipFlow(spacing: 6) {
            DemoButton(state.strict.on ? "strict is on — ask to turn off" : "turn strict on", on: state.strict.on) {
                state.demoToggleStrict()
            }
        }
        note("on is instant, off takes 24 hours. use \"skip 24 hours\" below to land it.")
    }

    // MARK: time travel

    @ViewBuilder
    private var skipAhead: some View {
        let pendingCount = state.pending.count
        label("skip ahead")
        ChipFlow(spacing: 6) {
            DemoButton(action: { state.skip24h() }) {
                pendingCount > 0 ? withSub("skip 24 hours", " · \(pendingCount) pending") : Text("skip 24 hours")
            }
            DemoButton("skip to midnight") { state.skipToMidnight() }
            DemoButton("end the day") { state.endDay(forceOver: false) }
            DemoButton("skip a week") { state.runWeek() }
        }
        note("24 hours lands any pending change. midnight resets opens and the pass (and collects a borrow). a week brings the step-down.")
    }

    // MARK: today's usage against the goal

    @ViewBuilder
    private var usage: some View {
        label("today's usage")
        ChipFlow(spacing: 6) {
            DemoButton("under goal") { state.demoUsage("under") }
            DemoButton("close to it") { state.demoUsage("close") }
            DemoButton("way over") { state.demoUsage("over") }
        }
        note("moves rilo's mood and the xp, never a lock.")
    }

    // MARK: time of day

    @ViewBuilder
    private var timeOfDay: some View {
        label("time of day")
        ChipFlow(spacing: 6) {
            ForEach(Self.CLOCKS, id: \.at) { c in
                DemoButton(c.label) { state.demoSetClock(c.at) }
            }
            DemoButton("real time") { state.demoSetClock(nil) }
        }
    }

    // MARK: the first week of questions

    @ViewBuilder
    private var firstWeek: some View {
        label("first week · one ask a day")
        ChipFlow(spacing: 6) {
            ForEach(FirstWeek.ASKS, id: \.id) { a in
                DemoButton("day \(a.day) · \(a.id)") { state.demoAskDay(a.day) }
                    .opacity(state.drip.done.contains(a.id) ? 0.55 : 1)
            }
        }
        note("on day \(state.drip.day). each button sets the day, un-asks that question and drops you where it appears — day 1 at the check-in, the rest on the plan tab. faded means he has already asked it. only ever one a day, and nothing after day 7.")
    }

    // MARK: jump to

    @ViewBuilder
    private var jumpTo: some View {
        label("jump to")
        ChipFlow(spacing: 6) {
            DemoButton("your limits") { state.go(.limits) }
            DemoButton("the shield") { state.demoOpenBlocked() }
            DemoButton("share card") { state.go(.sharecard) }
            DemoButton("buddies") { state.go(.buddies) }
            DemoButton("the check-in") { state.go(.nightcheckin) }
            DemoButton("pick check-in time") { state.go(.nighttime) }
            DemoButton("calendar") { state.go(.calendar) }
        }
    }
}
#endif

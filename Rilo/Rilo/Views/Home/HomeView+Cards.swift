import SwiftUI

/// Home's three rows under Rilo: today against the goal, one thing to do
/// instead, and their apps with the opens left on each.
extension HomeView {
    /// the apps that can actually be locked — always-allowed ones never
    /// stop you, so they aren't interesting here
    var watchedApps: [String] { state.tracked.filter { state.settingOf($0).mode != .always } }

    // MARK: 2. the one number that matters: today against the goal (§8)

    var scoreCard: some View {
        let used = state.usedTotalToday
        let goal = Double(state.goalMins)
        /* a scoreboard, never a lock */
        let pct = goal != 0 ? min(100, (used / goal * 100).rounded()) : 0
        let over = used > goal

        return VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(Plan.fmtMins(used))
                    .font(.fredoka(34, 700))
                    .webLineHeight(34, 1)
                    .foregroundStyle(over ? Color(hex: "#C2541F") : RC.ink)
                Text("of \(Plan.fmtMins(goal)) today")
                    .font(.inter(14, 600))
                    .foregroundStyle(Color(hex: "#52715A"))
            }
            GeometryReader { g in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.rgba(18, 48, 26, 0.09))
                    Capsule()
                        .fill(over ? Color(hex: "#D9643A") : RC.greenDeep)
                        .frame(width: g.size.width * pct / 100)
                        .animation(.easeInOut(duration: 0.4), value: pct)
                }
            }
            .frame(height: 8)
            .clipShape(Capsule())
            .padding(.top, 12)
            .accessibilityHidden(true)
        }
        .homeCard()
        .tourTarget("score", radius: 22)
        .rise(0.12, distance: 14, duration: 0.5)
    }

    // MARK: 3. one thing to do instead of picking the phone back up

    var nextCard: some View {
        Button { state.go(.plan) } label: {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("DO THIS INSTEAD")
                        .font(.inter(11.5, 700))
                        .tracking(11.5 * 0.08)
                        .foregroundStyle(Color(hex: "#52715A"))
                    Text(Profile.suggestion(state.about).task)
                        .font(.fredoka(20, 600))
                        .foregroundStyle(RC.ink)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                SVGPath("M9 5 L16 12 L9 19")
                    .stroke(Color(hex: "#1F6B2E"), style: .svg(2.5))
                    .frame(width: 20, height: 20)
            }
            .homeCard()
        }
        .buttonStyle(.tap)
        .tourTarget("next", radius: 22)
        .rise(0.18, distance: 14, duration: 0.5)
    }

    // MARK: 4. their apps, with the opens they have left on each

    var appsList: some View {
        VStack(alignment: .leading, spacing: 10) {
            if watchedApps.isEmpty {
                Text("set some limits on the you tab to see them here")
                    .font(.inter(13, 600))
                    .foregroundStyle(Color(hex: "#52715A"))
            }
            ForEach(watchedApps, id: \.self) { label in
                appRow(label)
            }
        }
        .tourTarget("home-apps")
        .rise(0.24, distance: 14, duration: 0.5)
    }

    private func appRow(_ label: String) -> some View {
        let lock = state.lockOf(label)
        let setting = state.settingOf(label)
        let locked = lock.locked
        let total = state.totalOpensFor(label)
        let used = lock.used ?? 0

        return Button { state.openApp(label) } label: {
            HStack(alignment: .center, spacing: 12) {
                AppLogo(label: label, size: 38, radius: 11)
                VStack(alignment: .leading, spacing: 3) {
                    Text(label)
                        .font(.fredoka(17, 600))
                        .foregroundStyle(RC.ink)
                    if setting.mode == .limited {
                        Opens(total: total, used: used, minutes: setting.minutes, size: 11, note: false)
                        rowNote(locked ? "no opens left"
                                       : "\(Limits.fmtOpens(max(0, total - used))) left · \(setting.minutes) min each")
                    } else {
                        rowNote(setting.mode == .blocked ? "blocked" : "free · counts toward your day")
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .homeCard(v: 12, h: 14)
            .opacity(locked ? 0.55 : 1)
        }
        .buttonStyle(.tap)
        .accessibilityLabel("Open \(label)")
    }

    private func rowNote(_ text: String) -> some View {
        Text(text)
            .font(.inter(12, 600))
            .foregroundStyle(Color(hex: "#52715A"))
    }
}

import SwiftUI

/// You.jsx, the end of the list: "your limits" (strict mode, the limits
/// card, the daily goal), "account" (replay the tour, the plan + restore
/// purchases, start over, delete account)
/// and the demo buttons.
extension YouView {
    @ViewBuilder var limitsPart: some View {
        YouSection(title: "your limits")
        strictCard
        limitsCard.id("limits")
        goalCard.id("goal")

        /* v1 has no accounts: everything lives on the phone */
        YouSection(title: "your data").id("account")
        replayCard
        /* "your plan" (Pro, change plan, restore purchases): payments only */
        if FeatureFlags.PAYMENTS { planCard }
        startOverButton
        deleteAccountButton

        #if DEBUG
        /* DEBUG only (not in TestFlight / App Store builds): lets a tester
           see level-ups without waiting weeks */
        YouSection(title: "demo")
        YouDemoButton(title: "demo: +500 xp") { state.demoXp(500) }
        YouDemoButton(title: "demo: +5,000 xp") { state.demoXp(5000) }
        YouDemoButton(title: "demo: next day") { state.endDay(forceOver: false) }
        YouDemoButton(title: "demo: next day (went over)") { state.endDay(forceOver: true) }
        YouDemoButton(title: "demo: next week") { state.runWeek() }
        #endif
    }

    // MARK: strict mode (rilo pro)

    @ViewBuilder private var strictCard: some View {
        if state.hasPro {
            StrictCard(dataTourTarget: "you-strict", cardDelay: 0.2, skin: state.chosenRilo,
                       strict: state.strict,
                       onTurnOn: { state.strictOn(days: $0, when: $1) },
                       onAskOff: { loosening = "strict-wait" },
                       onKeepOn: { state.strictKeepOn() },
                       onTurnOffNow: { loosening = "strict-now" })
        } else {
            ProLock(title: "strict mode",
                    sub: "no half opens, no borrowing, 24 hours to loosen anything.",
                    padding: EdgeInsets(top: 18, leading: 18, bottom: 18, trailing: 18),
                    radius: 26, tourTarget: "you-strict") { state.go(.upgrade) }
                .rise(0.2, distance: 14, duration: 0.4)
        }
    }

    // MARK: the way into the limits screen, with the plan check on it

    /// a one-line summary of the limits, so the card means something before
    /// they tap into it
    private var limitSummary: String {
        func count(_ m: AppMode) -> Int { state.tracked.filter { state.settingOf($0).mode == m }.count }
        return [
            count(.limited) > 0 ? "\(count(.limited)) limited" : nil,
            count(.blocked) > 0 ? "\(count(.blocked)) blocked" : nil,
            count(.free) > 0 ? "\(count(.free)) free" : nil,
            count(.always) > 0 ? "\(count(.always)) always allowed" : nil,
        ].compactMap { $0 }.joined(separator: " · ")
    }

    private var limitsCard: some View {
        let limited = state.tracked.filter { state.settingOf($0).mode == .limited }
        let check = state.check
        let pendingCount = state.pending.count
        return Button { state.go(.limits) } label: {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .center, spacing: 10) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("your limits").font(.fredoka(19, 600))
                        Text(limitSummary.isEmpty ? "nothing set yet" : limitSummary)
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    HStack(spacing: -8) {
                        ForEach(Array(limited.prefix(3).enumerated()), id: \.element) { i, label in
                            AppLogo(label: label, size: 32, radius: 10)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(.white))
                                .padding(i > 0 ? 2 : 0)
                                .background(i > 0 ? RoundedRectangle(cornerRadius: 10, style: .continuous).fill(RC.card) : nil)
                        }
                    }
                }
                /* the plan check, short form */
                Text(check.over
                     ? "these allow \(Plan.fmtMins(Double(check.allows))) a day \u{2014} \(Plan.fmtMins(Double(check.by))) more than your goal."
                     : "these allow \(Plan.fmtMins(Double(check.allows))) a day. that fits.")
                    .font(.inter(12.5, 600))
                    .webLineHeight(12.5, 1.35)
                    .foregroundStyle(check.over ? .white : RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 11)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(check.over ? RC.ink : Color.rgba(18, 48, 26, 0.06)))
                /* anything waiting out its 24 hours in strict mode */
                if pendingCount > 0 {
                    Text("\(pendingCount) change\(pendingCount == 1 ? "" : "s") pending")
                        .font(.fredoka(12.5, 600))
                        .foregroundStyle(.white)
                        .padding(.vertical, 4)
                        .padding(.horizontal, 11)
                        .background(Capsule().fill(RC.ink))
                }
            }
            .multilineTextAlignment(.leading)
            .foregroundStyle(RC.ink)
            .youCard(0.26)
        }
        .buttonStyle(.tap(0.94))
    }

    // MARK: daily goal (the scoreboard, never a lock)

    private var goalCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            GoalStepper(time: state.time, setTime: { state.time = $0 }, floor: Plan.GOAL_FLOOR_HOURS)
            Text("drives rilo's mood, your xp and your streak. it never blocks an app \u{2014} your limits do that.")
                .font(.inter(12.5, 600))
                .foregroundStyle(RC.ink2)
                .fixedSize(horizontal: false, vertical: true)
        }
        .youCard(0.28)
    }

    // MARK: account

    private var replayCard: some View {
        Button { state.replayIntroTour() } label: {
            HStack(alignment: .center, spacing: 10) {
                RiloView(skin: state.chosenRilo, mood: "wave", size: 46)
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 0) {
                    Text("meet Rilo again").font(.fredoka(18, 600))
                    Text("replay the quick tour of what he can do")
                        .font(.inter(12, 600))
                        .foregroundStyle(RC.ink3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Text("\u{203A}")
                    .font(.inter(22, 700))
                    .foregroundStyle(Color(hex: "#1F6B2E"))
                    .accessibilityHidden(true)
            }
            .multilineTextAlignment(.leading)
            .foregroundStyle(RC.ink)
            .youCard(0.30)
        }
        .buttonStyle(.tap)
    }

    private var planCard: some View {
        let pro = state.hasPro
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .center, spacing: 10) {
                Text("your plan")
                    .font(.fredoka(19, 600))
                    .accessibilityAddTraits(.isHeader)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(pro ? "rilo pro (trial)" : "free")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(pro ? .white : RC.ink)
                    .padding(.vertical, pro ? 6 : 7.5)
                    .padding(.horizontal, pro ? 14 : 15.5)
                    .background(Capsule().fill(pro ? RC.ink : .white))
                    .overlay(pro ? nil : Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.15), lineWidth: 1.5))
            }
            Button { state.go(.upgrade) } label: {
                Text(pro ? "change plan" : "see rilo pro")
                    .font(.fredoka(16, 600))
                    .foregroundStyle(pro ? RC.ink : .white)
                    .frame(maxWidth: .infinity, minHeight: 46)
                    .background(Capsule().fill(pro ? Color.clear : RC.ink))
                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
            }
            .buttonStyle(.tap)
            /* Apple's rule: restore in Settings too, not only on the paywall */
            Button(action: restorePurchases) {
                Text(restoring ? "checking\u{2026}" : "restore purchases")
                    .font(.inter(13, 600))
                    .underline()
                    .foregroundStyle(RC.ink2)
                    .padding(.vertical, 4)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.plainTap)
            .disabled(restoring)
            if let restoreNote {
                Text(restoreNote)
                    .font(.inter(12.5, 600))
                    .foregroundStyle(RC.ink2)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
        }
        .youCard(0.32)
        .tourTarget("you-plan", radius: 26)
    }

    /// same answers as the paywall's restore, but stays on this screen
    private func restorePurchases() {
        restoring = true
        restoreNote = nil
        Task {
            let result = await Purchases.shared.restore()
            restoring = false
            switch result {
            case .success:
                await ProStore.shared.refresh()
                track("settings", "restored")
                state.applyEntitlement(true)
                restoreNote = "found it. rilo pro is back on."
            case .cancelled:
                break
            case .failed(StoreKitPurchaseService.NOTHING_TO_RESTORE), .pending:
                restoreNote = "i couldn't find rilo pro on this apple account."
            case .failed:
                restoreNote = "the app store isn't answering right now. try again in a bit."
            }
        }
    }

    /// Settings ▸ delete account: asks first, then AppState.deleteAccount()
    private var deleteAccountButton: some View {
        Button { confirmDelete = true } label: {
            Text("delete all my data")
                .font(.fredoka(18, 600))
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Capsule().fill(Color.white.opacity(0.5)))
                .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .rise(0.38, distance: 14, duration: 0.4)
    }

    /// start over, for the next tester
    private var startOverButton: some View {
        Button { confirmStartOver = true } label: {
            Text("start over")
                .font(.fredoka(18, 600))
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 54)
                .background(Capsule().fill(Color.white.opacity(0.5)))
                .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .rise(0.36, distance: 14, duration: 0.4)
    }
}

#if DEBUG
/// the grey demo-only buttons at the bottom (DEBUG only)
struct YouDemoButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.inter(14, 600))
                .foregroundStyle(Color(hex: "#4F6B58"))
                .frame(maxWidth: .infinity)
                .frame(height: 44)
                .background(Capsule().fill(Color.rgba(18, 48, 26, 0.07)))
                .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.18), lineWidth: 1))
        }
        .buttonStyle(.tap)
    }
}
#endif

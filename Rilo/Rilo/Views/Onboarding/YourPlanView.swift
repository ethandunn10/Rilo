import SwiftUI

/// Port of app/src/screens/YourPlan.jsx — "here's your plan", the last
/// screen before the paywall: the daily goal, your limits, what you'll do
/// instead, and the Pro parts shown locked rather than hidden.
struct YourPlanView: View {
    @Environment(AppState.self) private var state

    /* Rilo only says it once per drift */
    @State private var hushed = false

    static let LOCKED: [(name: String, sub: String)] = [
        ("nightly check-in", "thirty seconds before bed, tomorrow planned"),
        ("the weekly step-down", "one thing gets tighter each week"),
        ("where your time goes", "the full per-app breakdown"),
        ("strict mode", "no half opens, 24 hours to loosen anything"),
        ("creator mode", "focused Instagram sessions for posting or research"),
    ]

    private var avgMins: Double { state.breakdown?.blocked ?? 0 }
    private var check: PlanCheck { state.check }
    private var over: Bool { check.over && !hushed }

    private var limited: [String] {
        state.tracked.filter {
            let m = state.settingOf($0).mode
            return m == .limited || m == .blocked || m == .free
        }
    }

    var body: some View {
        ZStack {
            SkyView(hills: .low).ignoresSafeArea()
            VStack(spacing: 0) {
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        column
                            .padding(.top, WebLayout.top(52))
                            .padding(.horizontal, 22)
                            .padding(.bottom, 12)
                        Color.clear.frame(height: 0).id("planBottom")
                    }
                    .scrollBounceBehavior(.basedOnSize)
                    #if DEBUG
                    /* -scrollbottom: screenshot the bottom of the plan */
                    .task {
                        guard DemoSeed.arguments.contains("-scrollbottom") else { return }
                        try? await Task.sleep(for: .milliseconds(800))
                        proxy.scrollTo("planBottom", anchor: .bottom)
                    }
                    #endif
                }
                pinned
            }

            /* their limits add up to more than the goal they just set */
            if over {
                YourPlanOverDialog(check: check, onLeave: { hushed = true },
                                   onFit: { hushed = true; state.makeRiloPlan() })
                    .zIndex(40)
            }
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: 12) {
            Dots(active: 3)

            BackButton { state.goTo(.yournumber, dir: .back) }

            HStack(spacing: 10) {
                RiloView(skin: AppState.OG_SKIN, mood: "proud", size: 92, talks: true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("here's your plan.")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(26, 700))
                        .foregroundStyle(RC.ink)
                    Text(avgMins != 0 ? "pick your goal and i'll fit your limits to it."
                                      : "aiming at \(Plan.fmtMins(Double(state.goalMins))) a day.")
                        .font(.inter(13.5, 600))
                        .foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            goalCard
            limitsCard
            insteadCard
            /* payments off: nothing is locked, so no "with rilo pro" card */
            if FeatureFlags.PAYMENTS { proCard }
        }
    }

    // MARK: the daily goal, above the limits it drives

    private var goalCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            /* what they are on today, right above the goal they set against it */
            if avgMins > 0 {
                HStack(alignment: .firstTextBaseline, spacing: 10) {
                    Text("your screen time now")
                        .font(.inter(13, 700))
                        .foregroundStyle(Color(hex: "#52715A"))
                    Spacer(minLength: 0)
                    Text("\(Plan.fmtMins(avgMins)) a day")
                        .font(.fredoka(24, 700))
                        .foregroundStyle(RC.ink)
                        /* narrow phones: the label wraps, the number stays on one line */
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .layoutPriority(1)
                }
                .accessibilityElement(children: .combine)
                .padding(.bottom, 10)
                .overlay(alignment: .bottom) {
                    Rectangle().fill(Color.rgba(18, 48, 26, 0.10)).frame(height: 1.5)
                }
                .padding(.bottom, 2)
            }

            GoalStepper(time: state.time, setTime: { state.yourPlanSetTime($0) }, floor: Plan.GOAL_FLOOR_HOURS)
        }
        .planCard()
    }

    // MARK: the limits

    private var limitsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("your limits")
                .font(.fredoka(19, 600))
                .foregroundStyle(RC.ink)
                .accessibilityAddTraits(.isHeader)

            ForEach(limited, id: \.self) { app in
                let s = state.settingOf(app)
                HStack(spacing: 10) {
                    AppLogo(label: app, size: 32, radius: 10)
                    Text(app)
                        .font(.fredoka(16, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, alignment: .leading)
                    Text(s.mode == .limited ? "\(Limits.fmtOpens(s.opens)) opens × \(s.minutes) min"
                         : s.mode == .blocked ? "blocked" : "no limit")
                        .font(.inter(13.5, 700))
                        .foregroundStyle(Color(hex: "#1F6B2E"))
                        /* big Text Size: keep "3 opens × 10 min" on one line */
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                        .layoutPriority(1)
                }
                .accessibilityElement(children: .ignore)
                .accessibilityLabel("\(app): " + (s.mode == .limited
                    ? A11ySpeak.text("\(Limits.fmtOpens(s.opens)) opens") + ", \(s.minutes) minutes each"
                    : s.mode == .blocked ? "blocked" : "no limit"))
            }

            Button { state.go(.limitsonboard) } label: {
                Text("edit")
                    .accessibilityLabel("edit your limits")
                    .font(.fredoka(13.5, 600))
                    .foregroundStyle(RC.ink2)
                    .padding(.horizontal, 13.5)
                    .frame(minHeight: 34)
                    .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.3), lineWidth: 1.5))
            }
            .buttonStyle(.tap)
        }
        .planCard()
    }

    // MARK: and what replaces it

    private var insteadCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("what you'll do instead")
                    .font(.fredoka(19, 600))
                    .accessibilityAddTraits(.isHeader)
                Text("this is the part that actually works")
                    .font(.inter(12.5, 600))
                    .foregroundStyle(Color(hex: "#9FD8A9"))
            }

            ForEach(state.insteadSwaps, id: \.id) { row in
                HStack(alignment: .top, spacing: 10) {
                    Circle().fill(RC.green).frame(width: 7, height: 7).padding(.top, 7)
                        .accessibilityHidden(true)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("\(row.when): \(row.what)")
                            .font(.fredoka(16, 600))
                            .webLineHeight(16, 1.25)
                            .fixedSize(horizontal: false, vertical: true)
                        Text("instead of \(row.instead)")
                            .font(.inter(12.5, 600))
                            .foregroundStyle(Color(hex: "#C9E6CE"))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityElement(children: .combine)
                }
            }
        }
        .foregroundStyle(.white)
        .padding(.vertical, 14)
        .padding(.horizontal, 16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(RC.ink))
        .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 12, blur: 30)
    }

    // MARK: what pro adds

    private var proCard: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text("with rilo pro")
                .font(.inter(11.5, 700))
                .tracking(11.5 * 0.08)
                .textCase(.uppercase)
                .foregroundStyle(RC.ink2)
                .accessibilityAddTraits(.isHeader)
            ForEach(Self.LOCKED, id: \.name) { f in
                HStack(alignment: .top, spacing: 9) {
                    PlanLockIcon().padding(.top, 2)
                    VStack(alignment: .leading, spacing: 0) {
                        Text(f.name)
                            .font(.fredoka(15.5, 600))
                            .foregroundStyle(RC.ink3)
                        Text(f.sub)
                            .font(.inter(12, 600))
                            .foregroundStyle(Color(hex: "#5A7A64"))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityElement(children: .combine)
                    .accessibilityHint("locked, rilo pro")
                }
            }
        }
        .padding(.vertical, 16)
        .padding(.horizontal, 18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(Color.white.opacity(0.6)))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous)
            .strokeBorder(Color.rgba(18, 48, 26, 0.3), style: StrokeStyle(lineWidth: 2, dash: [6, 4])))
    }

    private var pinned: some View {
        Button {
            if FeatureFlags.PAYMENTS { state.go(.paywall) } else { state.finishOnboardingFree() }
        } label: {
            Text(FeatureFlags.PAYMENTS ? "unlock my full plan" : "let's do it")
                .font(.fredoka(20, 600))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .frame(height: 58)
                .background(Capsule().fill(RC.ink))
                .cssShadow(Color.rgba(10, 40, 20, 0.3), y: 10, blur: 26)
        }
        .buttonStyle(.tap(0.92))
        .padding(.top, 10)
        .padding(.horizontal, 22)
        .padding(.bottom, WebLayout.bottom(28))
    }
}

private extension View {
    /// padding 14/16 inside a 2px border, radius 26, card fill, ink outline + 4px ink drop
    func planCard() -> some View {
        padding(.vertical, 16)
            .padding(.horizontal, 18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .sticker(fill: RC.card, radius: 26, drop: 4)
    }
}

/// the 15x15 padlock (YourPlan.jsx `Lock`)
struct PlanLockIcon: View {
    var body: some View {
        ZStack {
            SVGPath("M7.5 11H16.5A2.5 2.5 0 0 1 19 13.5V17.5A2.5 2.5 0 0 1 16.5 20H7.5A2.5 2.5 0 0 1 5 17.5V13.5A2.5 2.5 0 0 1 7.5 11Z")
                .stroke(RC.ink3, lineWidth: 2.2 * 15 / 24)
            SVGPath("M8.5 11V8a3.5 3.5 0 0 1 7 0v3")
                .stroke(RC.ink3, lineWidth: 2.2 * 15 / 24)
        }
        .frame(width: 15, height: 15)
        .accessibilityHidden(true)
    }
}

/// "that's more than your goal." — the limits allow more than the goal
private struct YourPlanOverDialog: View {
    let check: PlanCheck
    let onLeave: () -> Void
    let onFit: () -> Void
    @State private var shown = false

    var body: some View {
        ZStack {
            Color.rgba(12, 30, 18, 0.45).ignoresSafeArea()
                .opacity(shown ? 1 : 0)
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 11) {
                    RiloView(skin: AppState.OG_SKIN, mood: "curious", size: 62)
                    Text("that's more than your goal.")
                        .font(.fredoka(17, 600))
                        .webLineHeight(17, 1.22)
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                Text("your limits allow \(Plan.fmtMins(Double(check.allows))) a day — \(Plan.fmtMins(Double(check.by))) over the \(Plan.fmtMins(Double(check.goal))) you picked.")
                    .font(.inter(13, 600))
                    .webLineHeight(13, 1.4)
                    .foregroundStyle(Color(hex: "#43604D"))
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 8) {
                    Button(action: onLeave) {
                        Text("leave it")
                            .font(.fredoka(15, 600))
                            .foregroundStyle(RC.ink)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.16), lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                    Button(action: onFit) {
                        Text("fit them for me")
                            .font(.fredoka(15, 600))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, minHeight: 44)
                            .background(Capsule().fill(RC.ink))
                    }
                    .buttonStyle(.tap(0.94))
                }
            }
            .padding(.top, 18)
            .padding(.horizontal, 18)
            .padding(.bottom, 16)
            .frame(maxWidth: 320)
            .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(RC.card))
            .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous)
                .strokeBorder(Color.rgba(18, 48, 26, 0.12), lineWidth: 1.5))
            .opacity(shown ? 1 : 0)
            .offset(y: shown ? 0 : 14)
            .padding(20)
        }
        .accessibilityAddTraits(.isModal)
        .accessibilityLabel("your limits are over your goal")
        .onAppear { withAnimation(.easeOut(duration: 0.3)) { shown = true } }
    }
}

import SwiftUI

/// Walks them through making the Shortcuts automation that runs
/// "Rilo check-in" when an app opens (iOS doesn't let apps make it for
/// them). Big steps, a button into Shortcuts, a tick per app once its
/// check-in has really run, and "test it". Skipping is fine: those apps
/// use the shield. Also reachable from the You tab later.
struct AutomationSetupView: View {
    @Environment(AppState.self) private var state
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.openURL) private var openURL
    @State private var rev = 0

    private var matched: [String] { state.tracked.filter { AppMatch.name(for: $0) != nil } }

    var body: some View {
        let _ = rev
        let apps = matched
        let firstName = apps.first.flatMap { AppMatch.name(for: $0) } ?? "instagram"
        let waiting = apps.filter { !Automation.isOn($0) }

        ZStack {
            SkyView(hills: .low)
            VStack(spacing: 12) {
                BackButton { state.goTo(state.onboarded ? .you : .matchapps, dir: .back) }
                    .frame(maxWidth: .infinity, alignment: .leading)
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("make rilo pop up first")
                            .font(.fredoka(32, 700))
                            .foregroundStyle(RC.ink)
                            .accessibilityAddTraits(.isHeader)
                        Text("one shortcut per app. about a minute each.")
                            .font(.inter(16, 600))
                            .foregroundStyle(RC.ink2)

                        step(1, "square.grid.2x2", "open shortcuts. tap automation, then +.")
                        step(2, "app.badge", "tap app. choose \(firstName). tick \u{201C}is opened\u{201D} and \u{201C}run immediately\u{201D}.")
                        step(3, "bell.slash", "turn off \u{201C}notify when run\u{201D}, then next.")
                        step(4, "plus.magnifyingglass", "new blank automation \u{25B8} add action \u{25B8} search \u{201C}rilo\u{201D} \u{25B8} rilo check-in. set app to \(firstName). done.")
                        step(5, "repeat", "do the same for your other apps.")

                        PillButton(title: "open shortcuts") {
                            if let url = URL(string: "shortcuts://") { openURL(url) }
                        }

                        if !apps.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("your apps")
                                    .font(.fredoka(18, 700))
                                    .foregroundStyle(RC.ink)
                                ForEach(apps, id: \.self) { key in
                                    HStack(spacing: 10) {
                                        AppLogo(label: key, size: 30, radius: 8)
                                        Text(Apps.name(key))
                                            .font(.fredoka(18, 600))
                                            .foregroundStyle(RC.ink)
                                        Spacer(minLength: 6)
                                        Text(Automation.isOn(key) ? "✓ working" : "not yet")
                                            .font(.fredoka(16, 700))
                                            .foregroundStyle(Automation.isOn(key) ? RC.greenDeep : RC.ink2)
                                    }
                                }
                            }
                            .padding(16)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .sticker(fill: RC.card, radius: 22, drop: 3)
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.horizontal, -4)

                if let next = waiting.first, state.canReopen(next) {
                    PillButton(title: "test it: open \(Apps.name(next))", fill: RC.greenDeep, textColor: .white) {
                        state.reopenApp(next)
                    }
                } else if !waiting.isEmpty {
                    Text("to test, open \(Apps.name(waiting[0])) from your home screen.")
                        .font(.inter(14, 600))
                        .foregroundStyle(RC.ink2)
                }
                PillButton(title: waiting.isEmpty && !apps.isEmpty ? "done" : "skip, use the shield") { leave() }
                if !waiting.isEmpty {
                    Text("apps without the shortcut get rilo's shield instead.")
                        .font(.inter(13, 600))
                        .foregroundStyle(RC.ink2)
                        .multilineTextAlignment(.center)
                }
            }
            .padding(.top, WebLayout.top(48))
            .padding(.horizontal, 24)
            .padding(.bottom, WebLayout.bottom(30))
        }
        /* a test run brings Rilo back to the front: show the new ticks */
        .onChange(of: scenePhase) { _, phase in if phase == .active { rev += 1 } }
    }

    private func leave() {
        track("automation", "\(matched.filter(Automation.isOn).count) of \(matched.count) set up")
        if state.onboarded { state.goTo(.you, dir: .back) } else { state.go(.hours) }
    }

    private func step(_ n: Int, _ symbol: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 14, style: .continuous).fill(RC.ink)
                Image(systemName: symbol)
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .frame(width: 52, height: 52)
            .overlay(alignment: .topLeading) {
                Text("\(n)")
                    .font(.fredoka(14, 700))
                    .foregroundStyle(RC.ink)
                    .frame(width: 22, height: 22)
                    .background(Circle().fill(RC.green))
                    .offset(x: -6, y: -6)
            }
            .accessibilityHidden(true)
            Text(text)
                .font(.fredoka(18, 600))
                .foregroundStyle(RC.ink)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityLabel("step \(n). \(text)")
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(fill: Color.white.opacity(0.92), radius: 20, drop: 2)
    }
}

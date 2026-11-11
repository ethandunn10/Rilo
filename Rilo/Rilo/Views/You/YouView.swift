import SwiftUI

/// Port of app/src/screens/You.jsx: the "you" tab.
///
/// Name, level + XP, the current Rilo small, stats, the app theme, the same
/// hobby/goal chips and app list as onboarding, the settings (Creator Mode,
/// bedtime/school/focus, the nightly check-in, calendar, buddies, strict
/// mode, the limits, the daily goal), the plan, "start over" for handing the
/// phone to the next tester, and the demo buttons.
///   YouView+Top       section labels, the level card, stats, themes
///   YouView+Settings  what rilo knows, apps, creator, schedule, night, calendar, buddies
///   YouView+Limits    strict, your limits, the goal, account, plan, start over, demo
///
/// DEBUG `-youscroll <id>` starts scrolled to that part (theme, about,
/// scroll, apps, you-creator, you-schedule, night, calendar, you-buddies,
/// you-strict, limits, goal, account, bottom).
struct YouView: View {
    @Environment(AppState.self) var state

    /* Loosening strict mode is a bypass, so it goes through the same sad-rilo
       sheet as the pass and the borrow. Tightening never does. */
    @State var loosening: String? = DemoSeed.arg("-youloosen")
    /// the add-app sheet (AppPicker draws it from the screen root here)
    @State var appSheet = DemoSeed.flag("-appsheet")
    @State var refused = ""
    @State var confirmStartOver = false
    @State var confirmDelete = false
    /// restore purchases in the account section: busy, and Rilo's answer
    @State var restoring = false
    @State var restoreNote: String?
    /// You ▸ what rilo knows (MemoryView)
    @State var showMemory = DemoSeed.flag("-memory")

    var body: some View {
        @Bindable var s = state
        ZStack(alignment: .bottom) {
            SkyView(hills: .low).ignoresSafeArea()

            VStack(alignment: .leading, spacing: 12) {
                Text(state.name.isEmpty ? "you" : state.name.lowercased())
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(30, 700))
                    .rise(0, distance: 14, duration: 0.4)
                    .padding(.horizontal, 20)

                /* the list scrolls; the tab bar stays put */
                ScrollViewReader { proxy in
                    ScrollView(.vertical, showsIndicators: false) {
                        VStack(alignment: .leading, spacing: 12) {
                            topPart
                            settingsPart
                            limitsPart
                            Color.clear.frame(height: 0).id("bottom")
                        }
                        .padding(.horizontal, 20)
                        /* clear the floating tab bar at the bottom */
                        .padding(.bottom, WebLayout.bottom(124))
                    }
                    .defaultScrollAnchor(DemoSeed.arg("-youscroll") == "bottom" ? .bottom : .top)
                    .tourScrollable()
                    .onAppear {
                        #if DEBUG
                        if let id = DemoSeed.arg("-youscroll"), id != "bottom" {
                            Task { @MainActor in
                                try? await Task.sleep(for: .milliseconds(150))
                                proxy.scrollTo(id, anchor: .top)
                            }
                        }
                        #endif
                    }
                }
            }
            .padding(.top, WebLayout.top(52))
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .foregroundStyle(RC.ink)

            TabBar(active: "you", skin: state.chosenRilo) { name in
                if let sc = Screen(rawValue: name) { state.go(sc) }
            }
        }
        .appSheetHost(apps: $s.apps, sheet: $appSheet, refused: $refused,
                      maxApps: state.hasPro ? .max : Plan.FREE_MAX_APPS,
                      onMaxed: { state.go(.upgrade) })
        .overlay {
            /* loosening strict mode goes past rilo first */
            if let which = loosening {
                BypassGuilt(
                    skin: state.chosenRilo,
                    kind: "loosen",
                    title: "making it easier?",
                    hobbies: state.profileList("hobby"),
                    goals: state.profileList("goal"),
                    streak: state.streak,
                    confirmLabel: which == "strict-now" ? "turn it off" : "start the 24 hours",
                    onConfirm: { _ in
                        loosening = nil
                        if which == "strict-now" { state.strictOffNow() } else { state.strictAskOff() }
                    },
                    onCancel: { loosening = nil }
                )
            }
        }
        .sheet(isPresented: $showMemory) { MemoryView() }
        .alert("Start over? This clears this tester\u{2019}s name, picks, xp and progress.",
               isPresented: $confirmStartOver) {
            Button("Cancel", role: .cancel) {}
            Button("OK") { state.startOver() }
        }
        .alert("Delete your account?", isPresented: $confirmDelete) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { state.deleteAccount() }
        } message: {
            Text("This erases everything Rilo has saved on this phone: your name, apps, limits, progress, check-ins and what he remembers. It can\u{2019}t be undone." +
                 (FeatureFlags.PAYMENTS
                  ? "\n\nA Rilo Pro subscription is billed by Apple and keeps going until you cancel it in iPhone Settings \u{2192} your name \u{2192} Subscriptions."
                  : ""))
        }
    }
}

/// You.jsx `card(delay)`: padding 16 inside a 2px ink border, radius 26,
/// a 4px ink drop, and the rise14 entry.
struct YouCard: ViewModifier {
    var delay: Double
    var fill: Color = RC.card

    func body(content: Content) -> some View {
        content
            .padding(16 + 2)   // css border sits outside the padding
            .frame(maxWidth: .infinity, alignment: .leading)
            .sticker(fill: fill, radius: 26, drop: 4)
            .rise(delay, distance: 14, duration: 0.4)
    }
}

extension View {
    func youCard(_ delay: Double, fill: Color = RC.card) -> some View {
        modifier(YouCard(delay: delay, fill: fill))
    }
}

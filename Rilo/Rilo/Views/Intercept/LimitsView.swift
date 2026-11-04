import SwiftUI

/// Port of app/src/screens/Limits.jsx: "your limits".
/// Every tracked app is limited, blocked or free. This screen is where that
/// gets set, and the rules (stricter is instant, looser waits 24h in strict
/// mode or asks first in normal mode) all live in AppState.setAppSetting.
///
/// `onboarding` is the "edit" link on Your plan (screen `limitsonboard`):
/// there, back and continue both return to Your plan and there's no tab bar.
/// One app's card is LimitsView+Card.swift.
struct LimitsView: View {
    var onboarding = false

    @Environment(AppState.self) private var state

    /// limited first, then blocked, then free (the web's `order`)
    private var order: [String] {
        let byMode = { (mode: AppMode) in state.tracked.filter { state.settingOf($0).mode == mode } }
        return byMode(.limited) + byMode(.blocked) + byMode(.free)
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low).ignoresSafeArea()

            ScrollViewReader { proxy in
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 12) {
                        if onboarding {
                            BackButton { state.goTo(.yourplan, dir: .back) }
                        }
                        header

                        if order.isEmpty {
                            Text("no apps yet. pick some on the you tab and they’ll show up here.")
                                .font(.inter(14, 600))
                                .foregroundStyle(RC.ink2)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .limitsCard(delay: 0.16)
                        }

                        ForEach(Array(order.enumerated()), id: \.element) { i, app in
                            LimitCard(
                                app: app,
                                setting: state.settingOf(app),
                                usedOpens: state.day.opensUsed[app] ?? 0,
                                totalOpens: state.totalOpensFor(app),
                                pendingFor: state.pending.filter { $0.app == app },
                                onSet: { state.setAppSetting(app, $0) },
                                onCancelPending: { state.cancelPending($0) },
                                delay: 0.16 + Double(min(i, 8)) * 0.03
                            )
                            .id(app)
                        }

                        /* onboarding ends here; the tab version has the tab bar instead */
                        if onboarding {
                            Button { state.goTo(.yourplan, dir: .back) } label: {
                                Text(state.check.over ? "use it anyway" : "lock it in")
                                    .font(.fredoka(20, 600))
                                    .foregroundStyle(.white)
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 58)
                                    .background(Capsule().fill(RC.ink))
                                    .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 26)
                            }
                            .buttonStyle(.tap(0.92))
                            .padding(.top, 6)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, WebLayout.top(52))
                    /* --tail: 124px (plus the flex gap) clears the tab bar */
                    .padding(.bottom, WebLayout.bottom(124 + 12))
                    #if DEBUG
                    /* -limitsscroll bottom: the very end, tab or onboarding */
                    .overlay(alignment: .bottom) { Color.clear.frame(height: 1).id("bottom") }
                    #endif
                }
                .onAppear {
                    #if DEBUG
                    if let target = DemoSeed.arg("-limitsscroll") {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                            proxy.scrollTo(target, anchor: target == "bottom" ? .bottom : .top)
                        }
                    }
                    #endif
                }
            }
            .foregroundStyle(RC.ink)

            if !onboarding {
                TabBar(active: "you", skin: state.chosenRilo) { name in
                    if let s = Screen(rawValue: name) { state.go(s) }
                }
            }
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 8) {
            VStack(alignment: .leading, spacing: 2) {
                Text("your limits")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(30, 700))
                if state.strict.on {
                    Text("strict mode. loosening anything takes 24 hours.")
                        .font(.inter(14, 600))
                        .foregroundStyle(RC.ink2)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            RiloView(skin: state.chosenRilo, mood: state.check.over ? "curious" : "proud", size: 74, talks: true)
        }
        .rise(0, distance: 14, duration: 0.4)
    }
}

extension View {
    /// Limits.jsx `card(delay)`: padding 16, radius 26, the card fill, a 2px
    /// ink line with a 4px ink drop, children 10 apart, rise14 .4s.
    func limitsCard(delay: Double) -> some View {
        self
            .padding(16 + 2)      // css border sits outside the padding
            .sticker(fill: RC.card, radius: 26, drop: 4)
            .rise(delay, distance: 14, duration: 0.4)
    }
}

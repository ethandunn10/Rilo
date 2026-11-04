import SwiftUI

/// The router: App.jsx `render()` — one line per screen — plus the overlays
/// it draws on top, under the same conditions.
struct RootView: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme

    var body: some View {
        ZStack {
            /* always something behind the screens: while one slides out and
               the next pops in (both shrunk a little), the edges used to show
               the window's black for a moment */
            theme.skyGradient.ignoresSafeArea()

            screenView(state.screen)
                .id(state.screen)
                /* the incoming screen runs on goTo's curve (pop-in 0.36s /
                   rise-back 0.34s); the outgoing one always eases in over
                   0.3s, like the web's sink-out / drop-out */
                .transition(AsymmetricTransition(
                    insertion: ScreenTransition(nav: state.navBox),
                    removal: ScreenTransition(nav: state.navBox)
                        .animation(.easeIn(duration: NavMotion.exitDuration))))

            if state.showBanner { BannerOverlay().zIndex(40) }
            if state.loosenAsk != nil { BypassGuiltOverlay().zIndex(50) }
            if state.showTour { MeetRiloTourOverlay(screen: state.screen).zIndex(60) }
            if state.showDemoPanel { DemoPanelOverlay().zIndex(61) }
            if state.handoff { RiloHandoffOverlay().zIndex(70) }
        }
    }

    @ViewBuilder
    private func screenView(_ screen: Screen) -> some View {
        switch screen {
        /* onboarding, in order */
        case .welcome: WelcomeView()
        case .name: NameView()
        case .pickapps: PickAppsView()
        case .permission: PermissionView()
        case .crunching: CrunchingView()
        case .rather: RatherView()
        case .yournumber: YourNumberView()
        case .yourplan: YourPlanView()
        case .limitsonboard: LimitsView(onboarding: true)
        case .paywall, .upgrade: PaywallView()
        /* daily use */
        case .home: HomeView()
        case .plan: PlanView()
        case .creator: CreatorModeView()
        case .daysummary: DaySummaryView()
        case .limits: LimitsView()
        /* the blocked-app pop-up and its reasons */
        case .shield: ShieldView()
        case .appopen: AppOpenView()
        case .intercept: InterceptView()
        case .whyopen: WhyOpenView()
        case .suggestion: SuggestionView()
        case .tired: TiredView()
        case .break: BreakView()
        case .needit: NeedItView()
        /* progress */
        case .progress: ProgressScreenView()
        case .pickrilo: PickRiloView()
        case .levelup: LevelUpView()
        case .sharecard: ShareCardView()
        case .buddies: BuddiesView()
        /* you */
        case .you: YouView()
        case .nightcheckin: NightCheckInView()
        case .nighttime: NightTimeView()
        case .calendar: CalendarConnectView()
        case .talkchat: TalkView()
        /* hidden tester stats */
        case .results: ResultsView()
        }
    }
}

/// The web's screen pop-in / sink-out (Router.swift NavMotion). Reads the
/// direction from a reference box so the screen being removed animates the
/// way the CURRENT navigation goes, not the one it arrived with.
struct ScreenTransition: Transition {
    let nav: NavBox

    func body(content: Content, phase: TransitionPhase) -> some View {
        let back = nav.direction == .back
        let entering = phase == .willAppear
        let leaving = phase == .didDisappear
        let opacity: Double = phase.isIdentity ? 1 : 0
        let scale: CGFloat = entering ? (back ? 0.97 : 0.96) : (leaving ? 0.97 : 1)
        let y: CGFloat = entering ? (back ? 0 : 28) : (leaving && back ? 40 : 0)
        /* forward: the incoming screen is on top; back: the outgoing one */
        let z: Double = phase == .didDisappear ? (back ? 2 : 1) : (back ? 1 : 2)
        content
            .opacity(opacity)
            .scaleEffect(scale)
            .offset(y: y)
            .zIndex(z)
    }
}

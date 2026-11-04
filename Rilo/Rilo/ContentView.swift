import SwiftUI

/// Creates the app state, hands it to every screen, applies the theme, and
/// shows the router. DEMO/DEBUG launch arguments are read in Models/DemoSeed.
/// Saves when the app goes to the background, rolls the day over when it
/// comes back, and routes tapped reminders (AppState+Saving).
struct ContentView: View {
    @State private var state = DemoSeed.launch()
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        let foundation = DemoSeed.foundation
        Group {
            if foundation.on {
                FoundationPreview()
            } else if DemoSeed.arg("-screen") == "strictcard" {
                StrictCardPreview()
            } else {
                RootView()
            }
        }
        .environment(state)
        .environment(\.riloTheme, Themes.info(foundation.theme ?? state.theme))
        /* Pro follows the App Store entitlement (StoreKit only; the demo
           service never answers, so seeds keep their own isPro) */
        .onChange(of: ProStore.shared.entitled, initial: true) { _, pro in
            if let pro { state.applyEntitlement(pro) }
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { Task { await ProStore.shared.refresh() } }
        }
        .onAppear {
            RiloNotifications.shared.onOpen = { [state] screen in state.openFromNotification(screen) }
        }
        .onChange(of: scenePhase, initial: true) { _, phase in
            switch phase {
            case .active: state.appBecameActive()
            case .background: state.appWentToBackground()
            default: break
            }
        }
    }
}

#Preview { ContentView() }

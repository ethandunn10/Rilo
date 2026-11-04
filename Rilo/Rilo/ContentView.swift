import SwiftUI

/// Creates the app state, hands it to every screen, applies the theme, and
/// shows the router. DEMO/DEBUG launch arguments are read in Models/DemoSeed.
struct ContentView: View {
    @State private var state = DemoSeed.launch()

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
    }
}

#Preview { ContentView() }

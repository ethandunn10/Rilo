import SwiftUI

struct ContentView: View {
    /// DEMO/DEBUG: `-screen <name>` launch argument jumps straight to a screen
    /// (used for the screenshot checks). `-theme <id>` picks the app theme.
    private var args: [String] { ProcessInfo.processInfo.arguments }
    private func arg(_ key: String) -> String? {
        guard let i = args.firstIndex(of: key), i + 1 < args.count else { return nil }
        return args[i + 1]
    }

    var body: some View {
        FoundationPreview()
            .environment(\.riloTheme, Themes.info(arg("-theme") ?? Themes.defaultId))
    }
}

#Preview { ContentView() }

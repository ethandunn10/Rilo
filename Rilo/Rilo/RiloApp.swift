import SwiftUI

@main
struct RiloApp: App {
    init() {
        RiloFonts.register()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

import SwiftUI

@main
struct RiloApp: App {
    init() {
        RiloFonts.register()
        /* StoreKit: hear Transaction.updates from launch, check entitlements */
        ProStore.shared.start()
        /* before launch finishes, so a tapped reminder that opened the app
           still reaches it */
        RiloNotifications.shared.install()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

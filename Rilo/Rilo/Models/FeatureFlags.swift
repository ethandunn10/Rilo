import Foundation

/// THE switch for testers. One line, one place.
///
/// UNLOCK_ALL = true  → every Pro feature, every skin and every theme is open
///                      for everyone, bought or not. The paywall still shows
///                      and still runs a real (test) purchase, so it can be
///                      tested, but nothing is locked behind it.
/// UNLOCK_ALL = false → real gating: Pro needs a purchase (StoreKit), skins
///                      unlock by level, free users see the locks.
///
/// To flip it: change `true` to `false` below and rebuild. Set it to false
/// before shipping to the App Store.
///
/// Everything reads it through `AppState.hasPro` (Pro features) and
/// `Levels.UNLOCK_ALL` (skins), never directly from a screen.
nonisolated enum FeatureFlags {
    static let TESTERS_UNLOCK_ALL = true

    /// What the app reads. DEBUG `-gated` turns the real locks back on for
    /// one launch (to see or screenshot the free tier without editing the
    /// line above). Release builds always use TESTERS_UNLOCK_ALL as is.
    static let UNLOCK_ALL: Bool = {
        #if DEBUG
        if ProcessInfo.processInfo.arguments.contains("-gated") { return false }
        #endif
        return TESTERS_UNLOCK_ALL
    }()
}

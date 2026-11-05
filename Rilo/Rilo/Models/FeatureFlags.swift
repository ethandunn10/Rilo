import Foundation

/// The tester switches. They only exist in DEBUG builds (Xcode's Run button
/// onto a simulator or your own phone). A RELEASE build (Archive, so every
/// TestFlight and App Store build) has none of them: Pro needs a real
/// purchase, skins unlock by level, and there's no demo panel and no demo
/// buttons. So there's nothing to remember to flip before shipping.
///
/// Everything reads them through `AppState.hasPro` (Pro features),
/// `Levels.UNLOCK_ALL` (skins) and `AppState.showDemoPanel`, never directly
/// from a screen.
nonisolated enum FeatureFlags {
    /// THE Screen Time switch, for every build (Debug, TestFlight, App Store).
    ///
    /// false → pretend blocking, like the web demo: Rilo's own app list and
    ///         his own drawn shield. Works on any phone and the simulator.
    /// true  → real blocking with Apple's Screen Time: Apple's app picker,
    ///         real shields, real timers. Needs the paid account, the Family
    ///         Controls capability and the four extensions first
    ///         (SETUP_AFTER_PAID_ACCOUNT.md), and only works on a real iPhone.
    static let REAL_SCREEN_TIME = false

    #if DEBUG
    /// DEBUG only. true → every Pro feature, skin and theme is open for
    /// everyone, and the trial button lets you in even with no App Store
    /// products. false → real gating, like Release.
    static let TESTERS_UNLOCK_ALL = true

    /// What the app reads. `-gated` turns the real locks back on for one
    /// launch (to see or screenshot the free tier without editing the line
    /// above).
    static let UNLOCK_ALL: Bool =
        ProcessInfo.processInfo.arguments.contains("-gated") ? false : TESTERS_UNLOCK_ALL

    /// DEBUG only: the floating "demo" button (the tester's remote control).
    static let SHOW_DEMO_PANEL_SETTING = true

    /// What the app reads. `-nodemo` hides it for one launch (screenshots).
    static let SHOW_DEMO_PANEL: Bool =
        ProcessInfo.processInfo.arguments.contains("-nodemo") ? false : SHOW_DEMO_PANEL_SETTING
    #else
    /// RELEASE (TestFlight + App Store): real gating, no demo panel. Fixed.
    static let UNLOCK_ALL = false
    static let SHOW_DEMO_PANEL = false
    #endif
}

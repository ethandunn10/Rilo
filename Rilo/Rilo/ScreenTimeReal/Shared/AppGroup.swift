import Foundation

/// The App Group every Rilo process shares: the app, the three Screen Time
/// extensions and the widget. Each of those targets needs the App Groups
/// capability with exactly this id ticked.
nonisolated enum AppGroup {
    static let id = "group.com.ethandunn.Rilo"

    /// the shared UserDefaults (falls back to .standard if the capability is
    /// missing, so nothing crashes; it just won't be shared)
    static var defaults: UserDefaults { UserDefaults(suiteName: id) ?? .standard }
}

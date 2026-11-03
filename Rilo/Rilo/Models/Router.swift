import Foundation

/// Every screen the web's router knows (App.jsx `render()`), by the same name.
nonisolated enum Screen: String, CaseIterable, Codable, Sendable {
    /* onboarding, in order */
    case welcome, name, pickapps, permission, crunching, rather, yournumber, yourplan, limitsonboard
    case paywall
    /* the same paywall, opened from a locked feature: it hands you back */
    case upgrade
    case limits, nighttime, home, talkchat, daysummary, whyopen, nightcheckin, calendar
    case sharecard, buddies, shield, appopen, intercept, suggestion, tired
    case `break`
    case needit, plan, creator, progress, pickrilo, you, levelup, results

    /// App.jsx ONBOARDING — loosening a limit here never asks "are you sure"
    static let onboarding: [Screen] = [
        .welcome, .name, .pickapps, .permission, .crunching,
        .yournumber, .rather, .yourplan, .limitsonboard, .paywall,
    ]

    /// the tabs the intro tour walks through (App.jsx TOUR_SCREENS)
    static let tourScreens: [Screen] = [.home, .plan, .progress, .pickrilo, .you]
}

/// forward = the new screen pops in; back = the old one sinks out
nonisolated enum NavDirection: String, Sendable {
    case forward, back
}

/// The web's screen transition (index.css), for the view layer:
///   forward: new screen pops in   (screen-pop-in 0.36s cubic-bezier(.2,.9,.3,1.15):
///            from opacity 0, y +28, scale 0.96), on top;
///            old one sinks out    (screen-sink-out 0.3s ease-in: to opacity 0, scale 0.97)
///   back:    new screen rises back (screen-rise-back 0.34s cubic-bezier(.2,.8,.3,1):
///            from opacity 0, scale 0.97);
///            old one drops out    (screen-drop-out 0.3s ease-in: to opacity 0, y +40, scale 0.97), on top
nonisolated enum NavMotion {
    static let forwardEnter = (duration: 0.36, x1: 0.2, y1: 0.9, x2: 0.3, y2: 1.15)
    static let backEnter = (duration: 0.34, x1: 0.2, y1: 0.8, x2: 0.3, y2: 1.0)
    static let exitDuration = 0.3
    /// App.jsx settles a slide after 450ms even if animationend never fires;
    /// navigating again during a slide is ignored, like the web
    static let settleAfter = 0.45
}

/// A reference to the current direction, so a transition evaluated after
/// the change still sees it.
nonisolated final class NavBox: @unchecked Sendable {
    var direction: NavDirection = .forward
}

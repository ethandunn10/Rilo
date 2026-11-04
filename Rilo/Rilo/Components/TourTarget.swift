import SwiftUI

/// Where the Meet Rilo tour's green box goes (MeetRiloTour.jsx looks these
/// up with `[data-tour-target="id"]`).
///
/// Any screen marks a feature with `.tourTarget("id")` and the tour finds it
/// there. The tour overlay is drawn next to the screens (RootView's ZStack),
/// not around them, so a plain preference can't reach it: each target
/// reports its on-screen frame to `TourTargets.shared`, and the overlay
/// reads that. Screens that scroll add `.tourScrollable()` to their
/// ScrollView, so the tour can scroll a target into view the way the web's
/// `scrollIntoView({ block: 'center' })` does.
///
/// `radius` is the target's own corner radius (CSS border-radius); the box
/// hugs it at radius + 6, or uses 20 when the target has none, like the web.
@Observable @MainActor
final class TourTargets {
    static let shared = TourTargets()

    struct Target: Equatable {
        /// in global (window) coordinates
        var frame: CGRect
        var radius: CGFloat?
    }

    private(set) var targets: [String: Target] = [:]
    /// the id a scrolling screen should bring into view, bumped per request
    private(set) var scrollRequest: (id: String, nonce: Int)? = nil
    private var nonce = 0

    func set(_ id: String, _ t: Target?) {
        if targets[id] != t { targets[id] = t }
    }

    func requestScroll(to id: String) {
        nonce += 1
        scrollRequest = (id, nonce)
    }
}

private struct TourTargetModifier: ViewModifier {
    let id: String
    let radius: CGFloat?

    func body(content: Content) -> some View {
        content
            .id(id)
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: { frame in
                TourTargets.shared.set(id, .init(frame: frame, radius: radius))
            }
            .onDisappear { TourTargets.shared.set(id, nil) }
    }
}

/// Lets the tour scroll a target inside this ScrollView into the middle.
private struct TourScrollableModifier: ViewModifier {
    func body(content: Content) -> some View {
        ScrollViewReader { proxy in
            content.onChange(of: TourTargets.shared.scrollRequest?.nonce) { _, _ in
                guard let id = TourTargets.shared.scrollRequest?.id else { return }
                withAnimation(.easeInOut(duration: 0.45)) { proxy.scrollTo(id, anchor: .center) }
            }
        }
    }
}

extension View {
    /// `data-tour-target="id"`. A nil id does nothing (ProLock's optional
    /// `dataTourTarget`).
    @ViewBuilder
    func tourTarget(_ id: String?, radius: CGFloat? = nil) -> some View {
        if let id {
            modifier(TourTargetModifier(id: id, radius: radius))
        } else {
            self
        }
    }

    /// Put on a ScrollView whose content carries tour targets.
    func tourScrollable() -> some View { modifier(TourScrollableModifier()) }
}

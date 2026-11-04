import SwiftUI
import UIKit

/// Port of app/src/components/MeetRiloTour.jsx — the walkthrough that runs
/// once, right after onboarding. One green box around the feature being
/// explained, everything else dimmed, and Rilo with one line sitting below
/// or above it — never on top of it. It walks itself across the tab screens.
///
/// Targets are the views marked `.tourTarget("id")` (Components/TourTarget).
/// Nothing is drawn until a target's frame has held still for a few frames
/// (the screens' entry animations and the scroll have to settle); after the
/// first step the box and card stay up and glide to the next one.
/// state.tourCreatorAnswer(_:), state.tourDone()
struct MeetRiloTourOverlay: View {
    let screen: Screen
    @Environment(AppState.self) private var state

    struct Step {
        let screen: Screen
        let target: String?
        var title = ""
        var mood = "coach"
        var ask = false
    }

    static let STEPS: [Step] = [
        /* home — what he tracks and what to do instead */
        Step(screen: .home, target: "home-talk", title: "Hey \u{2014} I'm Rilo. Tap me any time to talk.", mood: "wave"),
        Step(screen: .home, target: "score", title: "Your day at a glance \u{2014} time, goal, streak.", mood: "coach"),
        Step(screen: .home, target: "home-apps", title: "I watch these. Leave early, it costs half an open.", mood: "coach"),
        Step(screen: .home, target: "next", title: "And something to do instead of scrolling.", mood: "proud"),
        /* the plan */
        Step(screen: .plan, target: "plan-day", title: "Your day, built around what you told me.", mood: "coach"),
        /* the one question */
        Step(screen: .plan, target: nil, ask: true),
        /* progress, and the rilos you unlock */
        Step(screen: .progress, target: "progress-level", title: "Every day under your goal earns xp.", mood: "proud"),
        Step(screen: .pickrilo, target: "skins", title: "Level up and you unlock a new me.", mood: "wave"),
        /* the settings worth knowing about */
        Step(screen: .you, target: "you-creator", title: "Posting isn't scrolling \u{2014} it's tracked on its own.", mood: "proud"),
        Step(screen: .you, target: "you-strict", title: "Strict mode: 24 hours before anything loosens.", mood: "coach"),
        Step(screen: .you, target: "you-schedule", title: "Bedtime, school and focus times go here.", mood: "coach"),
        Step(screen: .you, target: "you-buddies", title: "Add a friend \u{2014} they see your streak, not your numbers.", mood: "wave"),
    ]

    /// DEBUG -tourstep n: start on that step (screenshots)
    static var debugStep: Int {
        #if DEBUG
        if let s = DemoSeed.arg("-tourstep"), let n = Int(s) { return min(max(0, n), STEPS.count - 1) }
        #endif
        return 0
    }

    static let PAD: CGFloat = 6
    static let GAP: CGFloat = 14
    static let EDGE: CGFloat = 12
    static let GREEN = Color(hex: "#7ED957")
    static let DIM = Color.rgba(8, 26, 14, 0.66)
    static let glide = Animation.timingCurve(0.33, 1, 0.68, 1, duration: 0.42)

    struct Box: Equatable { var rect: CGRect; var radius: CGFloat }

    @State private var step = MeetRiloTourOverlay.debugStep
    @State private var box: Box? = nil
    @State private var ready = false
    @State private var gaveUp = false
    @State private var everPlaced = false
    @State private var cardH: CGFloat = 120
    /// tapping Rilo re-keys him, which replays the jump
    @State private var poke = 0
    @State private var origin: CGPoint = .zero
    @State private var size: CGSize = .zero

    private var slide: Step { Self.STEPS[min(step, Self.STEPS.count - 1)] }
    private var last: Bool { step == Self.STEPS.count - 1 }
    private var anchored: Bool { slide.target != nil }
    private var placed: Bool { box != nil && ready }
    private var showCard: Bool { !anchored || placed || gaveUp || everPlaced }

    private var insets: UIEdgeInsets {
        (UIApplication.shared.connectedScenes.first as? UIWindowScene)?.keyWindow?.safeAreaInsets ?? .zero
    }

    var body: some View {
        GeometryReader { g in
            ZStack(alignment: .topLeading) {
                dimAndBox
                card
            }
            .frame(width: g.size.width, height: g.size.height, alignment: .topLeading)
            .onGeometryChange(for: CGRect.self) { $0.frame(in: .global) } action: {
                origin = $0.origin
                size = $0.size
            }
        }
        .ignoresSafeArea()
        .foregroundStyle(RC.ink)
        .task(id: step) { await place() }
        .accessibilityAddTraits(.isModal)
    }

    // MARK: the dim with the green box cut out of it

    @ViewBuilder
    private var dimAndBox: some View {
        if let box, ready || everPlaced {
            let r = box.rect
            ZStack(alignment: .topLeading) {
                TourDim(hole: r, radius: box.radius)
                    .fill(Self.DIM, style: FillStyle(eoFill: true))
                RoundedRectangle(cornerRadius: box.radius, style: .continuous)
                    .strokeBorder(Self.GREEN, lineWidth: 3)
                    .frame(width: r.width, height: r.height)
                    .offset(x: r.minX, y: r.minY)
            }
            .contentShape(Rectangle())
            .transition(.opacity.animation(.easeOut(duration: 0.3)))
            .accessibilityHidden(true)
        } else {
            Self.DIM
                .contentShape(Rectangle())
                .accessibilityHidden(true)
        }
    }

    // MARK: Rilo, one line, and the way forward

    private var cardPlacement: (x: CGFloat, y: CGFloat, w: CGFloat)? {
        guard let box, size.width > 0 else { return nil }
        let W = size.width, H = size.height
        let top = insets.top, bottom = insets.bottom
        let cw = min(306, W - Self.EDGE * 2)
        let r = box.rect.insetBy(dx: Self.PAD, dy: Self.PAD)
        /* the card never covers the box: below if it fits, else above */
        let below = H - bottom - r.maxY - Self.GAP >= cardH + Self.EDGE
        let rawTop = below ? r.maxY + Self.GAP : r.minY - cardH - Self.GAP
        let y = max(top + Self.EDGE, min(H - bottom - cardH - Self.EDGE, rawTop))
        let x = max(Self.EDGE, min(W - cw - Self.EDGE, r.midX - cw / 2))
        return (x, y, cw)
    }

    private var card: some View {
        let place = cardPlacement
        let W = size.width
        return VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                Button { poke += 1 } label: {
                    RiloView(skin: state.chosenRilo, mood: slide.ask ? "curious" : slide.mood, size: 44, motion: .jump)
                        .id("\(step)-\(poke)")
                }
                .buttonStyle(.tap(0.94))
                .accessibilityLabel("tap rilo")
                Text(slide.ask ? "Do you post a lot?" : slide.title)
                    .font(.fredoka(15.5, 600))
                    .webLineHeight(15.5, 1.25)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
            }
            if slide.ask { askButtons } else { navButtons }
        }
        .padding(.vertical, 13)
        .padding(.horizontal, 14)
        .frame(width: place?.w ?? max(0, W - Self.EDGE * 2), alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20, style: .continuous).fill(.white))
        .cssShadow(Color.rgba(8, 26, 14, 0.34), y: 10, blur: 28)
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { cardH = $0 }
        .offset(x: place?.x ?? Self.EDGE,
                y: place?.y ?? max(0, (size.height - cardH) / 2))
        .opacity(showCard ? 1 : 0)
        .animation(.easeOut(duration: 0.3), value: showCard)
    }

    private var askButtons: some View {
        HStack(spacing: 8) {
            Button { answer(true) } label: {
                Text("yes").font(.fredoka(15, 600)).foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 40)
                    .background(Capsule().fill(RC.ink))
            }
            .buttonStyle(.tap(0.94))
            Button { answer(false) } label: {
                Text("no").font(.fredoka(15, 600)).foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, minHeight: 40)
                    .overlay(Capsule().strokeBorder(Color(hex: "#DCE7DE"), lineWidth: 2))
            }
            .buttonStyle(.tap)
        }
        .padding(.top, 11)
    }

    private var navButtons: some View {
        HStack(spacing: 8) {
            Button { state.tourDone() } label: {
                Text("skip").font(.inter(12, 700)).foregroundStyle(Color(hex: "#85978B"))
                    .padding(.horizontal, 6)
                    .frame(minHeight: 30)
            }
            .buttonStyle(.tap)
            .accessibilityLabel("skip tour")
            Spacer(minLength: 0)
            if step > 0 {
                Button { step = max(0, step - 1) } label: {
                    Text("back").font(.fredoka(14, 600)).foregroundStyle(RC.ink)
                        .padding(.horizontal, 8)
                        .frame(minWidth: 54, minHeight: 36)
                        .overlay(Capsule().strokeBorder(Color(hex: "#DCE7DE"), lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
            Button(action: next) {
                Text(last ? "got it" : "next").font(.fredoka(15, 600)).foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .frame(minWidth: 92, minHeight: 36)
                    .background(Capsule().fill(RC.ink))
            }
            .buttonStyle(.tap(0.94))
        }
        .padding(.top, 11)
    }

    private func answer(_ posts: Bool) {
        state.tourCreatorAnswer(posts)
        step += 1
    }

    private func next() {
        if last { state.tourDone() } else { step += 1 }
    }

    // MARK: finding the target

    /// Walk to this step's screen, then wait for its target to hold still
    /// and commit the box there in one move.
    private func place() async {
        if slide.screen != state.screen { state.goSoon(slide.screen) }
        ready = false
        gaveUp = false
        guard let id = slide.target else {
            box = nil
            return
        }
        let started = Date()
        /* the screens animate their cards in (rise14); a target measured
           mid-entry is still travelling */
        try? await Task.sleep(for: .milliseconds(everPlaced ? 120 : 450))

        var scrolled = false
        var lastRect: CGRect? = nil
        var settled = 0
        for _ in 0..<160 {
            if Task.isCancelled { return }
            if let t = TourTargets.shared.targets[id] {
                let f = t.frame.offsetBy(dx: -origin.x, dy: -origin.y)
                /* only scroll when it isn't already comfortably on screen */
                if !scrolled {
                    scrolled = true
                    let inView = f.minY >= 60 && f.maxY <= size.height - 140
                    if !inView { TourTargets.shared.requestScroll(to: id) }
                }
                if let l = lastRect, abs(l.minX - f.minX) < 0.5, abs(l.minY - f.minY) < 0.5,
                   abs(l.width - f.width) < 0.5, abs(l.height - f.height) < 0.5 {
                    settled += 1
                } else {
                    settled = 0
                    lastRect = f
                }
                if settled >= 5 {
                    let next = Box(rect: f.insetBy(dx: -Self.PAD, dy: -Self.PAD),
                                   radius: t.radius.map { $0 + Self.PAD } ?? 20)
                    withAnimation(everPlaced ? Self.glide : nil) {
                        box = next
                        ready = true
                    }
                    everPlaced = true
                    return
                }
            }
            if !gaveUp && Date().timeIntervalSince(started) > 1.6 {
                /* a target that never shows up must not leave the screen
                   dimmed with no way forward: centre the card instead */
                gaveUp = true
                if TourTargets.shared.targets[id] == nil {
                    withAnimation(.easeOut(duration: 0.3)) { box = nil }
                }
            }
            try? await Task.sleep(for: .milliseconds(33))
        }
        gaveUp = true
    }
}

/// The full-screen dim with a rounded hole, animatable so the hole glides
/// with the green box (the web's `box-shadow: 0 0 0 100vmax`).
private struct TourDim: Shape {
    var hole: CGRect
    var radius: CGFloat

    var animatableData: AnimatablePair<AnimatablePair<CGFloat, CGFloat>, AnimatablePair<CGFloat, CGFloat>> {
        get { .init(.init(hole.minX, hole.minY), .init(hole.width, hole.height)) }
        set {
            hole = CGRect(x: newValue.first.first, y: newValue.first.second,
                          width: newValue.second.first, height: newValue.second.second)
        }
    }

    func path(in rect: CGRect) -> Path {
        var p = Path(rect.insetBy(dx: -40, dy: -40))
        p.addRoundedRect(in: hole, cornerSize: CGSize(width: radius, height: radius), style: .continuous)
        return p
    }
}

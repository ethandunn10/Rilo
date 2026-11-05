#if DEBUG
// DEBUG ONLY: the demo panel is not in Release (TestFlight / App Store) builds.
import SwiftUI

/// DEMO ONLY: port of app/src/components/DemoPanel.jsx, the tester's remote
/// control (§15). Hidden behind a small "demo" button in the corner. The
/// session simulator runs the real opens arithmetic on a chosen length.
/// Callbacks: Models/AppState+Demo.swift and AppState+Days.swift.
/// The sections are in DemoPanelOverlay+Sections.swift.
struct DemoPanelOverlay: View {
    @Environment(AppState.self) var state

    @State var open = DemoPanelOverlay.startsOpen
    /// which app the simulated session runs on
    @State var pick = ""

    /// DEBUG: `-demopanel` launches with the panel open (screenshots)
    static var startsOpen: Bool { DemoSeed.flag("-demopanel") }

    static let CLOCKS: [(label: String, at: String)] = [
        ("morning", "08:00"), ("school", "10:00"), ("evening", "19:00"), ("bedtime", "23:30"),
    ]

    var app: String {
        let tracked = state.tracked
        return !pick.isEmpty && tracked.contains(pick) ? pick : tracked.first ?? ""
    }
    var setting: AppSetting? { app.isEmpty ? nil : state.settingOf(app) }
    var limited: Bool { setting?.mode == .limited }

    /// a peek (min 0.5), exactly half (still 0.5), a minute past half (a
    /// whole open), and the full cap
    var lengths: [(mins: Double, label: String, why: String)] {
        guard limited, let s = setting else { return [] }
        let half = Limits.halfOf(s.minutes)
        return [
            (0.2, "10 sec", "min ½"),
            (half, "\(JS.num(half))m", "exactly ½"),
            (half + 1, "\(JS.num(half + 1))m", "full"),
            (Double(s.minutes), "\(s.minutes)m", "the cap"),
        ]
    }

    var body: some View {
        /* phones with a home button (SE) are too short for the bottom-left
           spot (it lands on the main button), so there it sits in the empty
           part of the status bar, between the clock and the battery */
        let se = WebLayout.hasHomeButton
        ZStack(alignment: open ? .bottomLeading : (se ? .topTrailing : .bottomLeading)) {
            Color.clear.allowsHitTesting(false)
            if open {
                panel
            } else {
                Button { open = true } label: {
                    Text("demo")
                        .font(.fredoka(12, 600))
                        .foregroundStyle(RC.ink)
                        .padding(.horizontal, 10 + 1.5)
                        .frame(minHeight: se ? 18 : 30)
                        .background(Capsule().fill(Color.white.opacity(0.75)))
                        .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.35), lineWidth: 1.5))
                        .dynamicTypeSize(.large)
                }
                .buttonStyle(.plainTap)
                .accessibilityLabel("open the demo panel")
                .padding(se ? .trailing : .leading, se ? 62 : 10)
                .padding(se ? .top : .bottom, se ? 1 : WebLayout.bottom(96))
                .ignoresSafeArea(edges: se ? .top : [])
            }
        }
        /* the closed "demo" button stays put instead of riding up on the
           keyboard and covering the field being typed in */
        .ignoresSafeArea(open ? [] : .keyboard)
    }

    private var panel: some View {
        GeometryReader { geo in
            VStack {
                Spacer(minLength: 0)
                ScrollView(.vertical, showsIndicators: false) {
                    sections
                        .padding(14 + 2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .scrollBounceBehavior(.basedOnSize)
                /* web: max-height 82% of the whole 844 frame (status bar included) */
                .frame(maxHeight: (geo.size.height + geo.safeAreaInsets.top + geo.safeAreaInsets.bottom) * 0.82
                       - geo.safeAreaInsets.bottom)
                .fixedSize(horizontal: false, vertical: true)
                .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
                .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(Color.white.opacity(0.97))
                    .cssShadow(Color.rgba(10, 40, 20, 0.3), y: 16, blur: 40))
                .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(RC.ink, lineWidth: 2))
            }
            .padding(.horizontal, 8)
            .padding(.bottom, 8)
        }
        .foregroundStyle(RC.ink)
    }
}

/// DemoPanel.jsx `btn` / `btnOn` / `dim`
struct DemoButton<Label: View>: View {
    var on = false
    var dim = false
    var minHeight: CGFloat = 38
    var leading: CGFloat = 12
    let action: () -> Void
    @ViewBuilder let label: () -> Label

    var body: some View {
        Button(action: action) {
            label()
                .font(.fredoka(14, 600))
                .foregroundStyle(on ? Color.white : RC.ink)
                .padding(.leading, leading + 2)
                .padding(.trailing, 12 + 2)
                .frame(minHeight: minHeight)
                .background(Capsule().fill(on ? RC.ink : Color.white))
                .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
                .opacity(dim ? 0.4 : 1)
        }
        .buttonStyle(.plainTap)
        .disabled(dim)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

extension DemoButton where Label == Text {
    init(_ title: String, on: Bool = false, dim: Bool = false, action: @escaping () -> Void) {
        self.init(on: on, dim: dim, action: action) { Text(title) }
    }
}
#endif

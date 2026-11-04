import SwiftUI

/// Port of app/src/screens/NightTime.jsx: "when should i check in?", straight
/// after the paywall (and from the You tab). The nightly check-in is a Rilo
/// Pro thing. Same dusk sky as the check-in itself.
///
/// App.jsx passes skin OG_SKIN, next "home", and setNight = state.nightTimeSet.
/// DEBUG `-nightcustom` starts on "another time" with the time field open.
struct NightTimeView: View {
    @Environment(AppState.self) private var state
    var next: Screen = .home

    /* The times people actually go to bed, plus a custom field. Not a scroll
       wheel: four taps beat a time picker for something this simple. */
    static let TIMES: [(at: String, label: String, sub: String)] = [
        ("20:00", "8:00", "early night"),
        ("21:00", "9:00", "most people"),
        ("22:00", "10:00", "later"),
        ("23:00", "11:00", "night owl"),
    ]

    static let NIGHT_INK = Color(hex: "#2B3A6B")

    @State private var at: String? = nil
    @State private var custom = DemoSeed.flag("-nightcustom")

    private var current: String { at ?? (state.night.at.isEmpty ? "21:00" : state.night.at) }

    private func setNight(_ value: String) {
        var n = state.night
        n.at = value
        state.nightTimeSet(n)
    }

    private func save() {
        setNight(current)
        state.go(next)
    }

    var body: some View {
        ZStack {
            SkyView(hills: .low, tone: .dusk).ignoresSafeArea()

            GeometryReader { g in
                ScrollView(.vertical, showsIndicators: false) {
                    column
                        .padding(.top, WebLayout.top(56))
                        .padding(.horizontal, 22)
                        .padding(.bottom, WebLayout.bottom(28))
                        .frame(minHeight: g.size.height)
                }
            }
        }
        .foregroundStyle(.white)
    }

    private var column: some View {
        VStack(spacing: 12) {
            Text("RILO PRO · NIGHTLY CHECK-IN")
                .font(.inter(12, 700))
                .tracking(12 * 0.1)
                .opacity(0.75)

            RiloView(skin: AppState.OG_SKIN, mood: "sleepy", size: 150, talks: true)

            Text("when should i check in?")
                .font(.fredoka(27, 700))
                .webLineHeight(27, 1.15)
                .multilineTextAlignment(.center)

            Text("thirty seconds before bed. how today went, what's on tomorrow. i'll have your plan ready when you wake up.")
                .font(.inter(14.5, 600))
                .webLineHeight(14.5, 1.4)
                .multilineTextAlignment(.center)
                .opacity(0.85)
                .frame(maxWidth: 300)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 8) {
                ForEach(Self.TIMES, id: \.at) { t in
                    let on = !custom && current == t.at
                    option(t.label, t.sub, on: on) {
                        /* single choice — the tap IS the answer */
                        custom = false
                        at = t.at
                        setNight(t.at)
                        state.go(next)
                    }
                }
                option(custom ? Addons.fmtClock(current) : "another time", "pick it", on: custom) {
                    custom = true
                }
                if custom {
                    WebTimeInput(value: Binding(get: { current }, set: { at = $0 }),
                                 height: 52, radius: 18, fontSize: 18, padding: 16,
                                 color: Self.NIGHT_INK, border: Color.white.opacity(0.6))
                }
            }

            Spacer(minLength: 8)

            /* only the hand-picked time needs a button */
            if custom {
                Button(action: save) {
                    Text("ask me at \(Addons.fmtClock(current))")
                        .font(.fredoka(20, 600))
                        .foregroundStyle(Self.NIGHT_INK)
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .background(Capsule().fill(.white))
                        .cssShadow(Color.rgba(10, 20, 50, 0.3), y: 10, blur: 28)
                }
                .buttonStyle(.tap(0.94))
            }

            Text("you can check in any time from the home screen, and change this whenever you like.")
                .font(.inter(12, 600))
                .opacity(0.7)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func option(_ label: String, _ sub: String, on: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Text(label)
                    .font(.fredoka(19, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(sub)
                    .font(.inter(12, 600))
                    .opacity(0.7)
            }
            .foregroundStyle(on ? Self.NIGHT_INK : .white)
            .padding(.vertical, 10 + 2)
            .padding(.horizontal, 18 + 2)
            .frame(maxWidth: .infinity, minHeight: 60)
            .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(on ? Color.white : Color.white.opacity(0.12)))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(on ? Color.white : Color.white.opacity(0.45), lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

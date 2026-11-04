import SwiftUI

/// Port of app/src/screens/Permission.jsx. The real iOS Screen Time flow,
/// faked: Rilo asks, "Apple's" alert appears, and the answer decides how
/// honest the numbers downstream can be.
struct PermissionView: View {
    @Environment(AppState.self) private var state
    @State private var sheet = false
    @State private var denied = false

    var body: some View {
        ZStack {
            SkyView(hills: .low)
                .blur(radius: sheet ? 3 : 0)

            GeometryReader { geo in
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 16) {
                        BackButton { state.goTo(.pickapps, dir: .back) }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        RiloView(skin: AppState.OG_SKIN, mood: denied ? "letdown" : "coach", size: 190, talks: true)
                        Text(denied
                             ? "no problem. i'll go off your hours and your goal instead."
                             : "i need to see where your time goes to build your plan.")
                            .font(.fredoka(28, 600))
                            .webLineHeight(28, 1.25)
                            .foregroundStyle(RC.ink)
                            .multilineTextAlignment(.center)
                            .fixedSize(horizontal: false, vertical: true)
                            .id(denied)
                            .rise(0.1, duration: 0.5)
                        Spacer(minLength: 0)
                        buttons
                    }
                    .padding(.top, WebLayout.top(72))
                    .padding(.horizontal, 24)
                    .padding(.bottom, WebLayout.bottom(34 + 16))   // --tail + the column gap
                    .frame(minHeight: geo.size.height)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
            /* the alert's backdrop-filter: blur(3px) */
            .blur(radius: sheet ? 3 : 0)
            .animation(.easeOut(duration: 0.25), value: sheet)

            if sheet {
                SystemSheet(
                    onAllow: {
                        sheet = false
                        state.permissionAllow()
                    },
                    onDeny: {
                        sheet = false
                        denied = true
                        state.permissionDeny()
                    }
                )
                .zIndex(30)
            }
        }
        .onAppear {
            #if DEBUG
            if DemoSeed.arguments.contains("-permsheet") { sheet = true }
            if DemoSeed.arguments.contains("-permdenied") { denied = true }
            #endif
        }
    }

    @ViewBuilder private var buttons: some View {
        VStack(spacing: 8) {
            if denied {
                bigButton("try again") {
                    state.permissionTriedAgain()
                    denied = false
                    sheet = true
                }
                outlineButton("keep going without it") { state.permissionSkip() }
            } else {
                bigButton("allow") { sheet = true }
                outlineButton("don't allow") {
                    denied = true
                    state.permissionDeny()
                }
            }
        }
    }

    private func bigButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.fredoka(20, 600))
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 56)
                .background(Capsule().fill(.white))
                .cssShadow(Color(.sRGB, red: 10 / 255, green: 40 / 255, blue: 20 / 255, opacity: 0.25), y: 10, blur: 30)
        }
        .buttonStyle(.tap)
    }

    private func outlineButton(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.fredoka(18, 600))
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 52)
                .background(Capsule().fill(Color.white.opacity(0.92)))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 1.5))
        }
        .buttonStyle(.tap)
    }
}

/// Apple's own alert, near enough: centred, blurred behind, two buttons
/// split by a hairline. Not in Rilo's voice. Rilo points at "Continue".
private struct SystemSheet: View {
    let onAllow: () -> Void
    let onDeny: () -> Void
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    private let hair = Color(.sRGB, red: 60 / 255, green: 60 / 255, blue: 67 / 255, opacity: 0.29)
    private let blue = Color(hex: "#007AFF")

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .opacity(shown ? 1 : 0)
                .animation(.easeOut(duration: 0.25), value: shown)

            VStack(spacing: 10) {
                alert
                    .opacity(shown ? 1 : 0)
                    .scaleEffect(shown ? 1 : 0.9)
                    .animation(.timingCurve(0.2, 0.9, 0.3, 1.1, duration: 0.22), value: shown)
                pointer
                    .rise(0.35, duration: 0.45)
            }
        }
        .onAppear { shown = true }
    }

    private var alert: some View {
        VStack(spacing: 0) {
            VStack(spacing: 4) {
                Text("“Rilo” Would Like to Access Screen Time")
                    .font(.system(size: 17, weight: .semibold))
                    .webLineHeight(17, 1.3)
                Text("Providing Rilo access to Screen Time may allow it to see your activity data, restrict content, and limit the use of apps and websites.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color(hex: "#1C1C1E"))
                    .webLineHeight(13, 1.33)
            }
            .foregroundStyle(.black)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 19)
            .padding(.horizontal, 16)
            .padding(.bottom, 15)

            hair.frame(height: 1)

            HStack(spacing: 0) {
                Button(action: onDeny) {
                    Text("Don't Allow")
                        .font(.system(size: 17))
                        .foregroundStyle(blue)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plainTap)
                hair.frame(width: 1, height: 44)
                Button(action: onAllow) {
                    Text("Continue")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(blue)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plainTap)
            }
        }
        .frame(width: 270)
        .background(Color(.sRGB, red: 250 / 255, green: 250 / 255, blue: 250 / 255, opacity: 0.94))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("Screen Time permission")
    }

    /* Rilo can't reach into Apple's sheet, so he points at it instead */
    private var pointer: some View {
        HStack(spacing: 0) {
            Color.clear.frame(maxWidth: .infinity, maxHeight: 1)
            VStack(spacing: 2) {
                TimelineView(.animation(paused: reduce)) { ctx in
                    let p = Motion.phase(ctx.date.timeIntervalSinceReferenceDate, period: 1.1)
                    let k = Motion.keyframes([(0, 0), (0.5, 1), (1, 0)], p, ease: Motion.easeInOut)
                    Text("↑")
                        .font(.system(size: 30))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.45), radius: 3, y: 2)
                        .offset(y: reduce ? 0 : -7 * k)
                }
                .frame(height: 30)
                Text("tap here")
                    .font(.fredoka(14, 600))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .fixedSize()
                    .padding(.vertical, 6)
                    .padding(.horizontal, 12)
                    .background(Capsule().fill(RC.ink))
            }
            .frame(maxWidth: .infinity)
        }
        .frame(width: 270)
        .accessibilityHidden(true)
    }
}

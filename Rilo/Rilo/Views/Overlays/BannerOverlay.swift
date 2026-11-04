import SwiftUI

/// Port of app/src/components/Banner.jsx — the iOS notification Rilo sends
/// after the shield. The only way an app can pull you out of a shield on a
/// real phone is to notify you. Tap: state.bannerTap()
struct BannerOverlay: View {
    @Environment(AppState.self) private var state
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        GeometryReader { geo in
            /* web top: 12 inside a frame whose status bar is ~47 tall */
            let top = 12 + max(0, geo.safeAreaInsets.top - 47)
            Button { state.bannerTap() } label: {
                HStack(spacing: 12) {
                    RiloView(skin: state.chosenRilo, mood: "coach", size: 42, motion: .none)
                        .frame(width: 46, height: 46)
                        .background(RC.mint)
                        .clipShape(RoundedRectangle(cornerRadius: 11, style: .continuous))

                    VStack(alignment: .leading, spacing: 1) {
                        Text("RILO")
                            .font(.system(size: 14, weight: .semibold))
                            .kerning(0.14)
                        Text("tap to talk")
                            .font(.system(size: 17))
                    }
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Text("now")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.rgba(60, 60, 67, 0.6))
                }
                .padding(.vertical, 14)
                .padding(.leading, 12)
                .padding(.trailing, 16)
                .background(
                    RoundedRectangle(cornerRadius: 24, style: .continuous)
                        .fill(.ultraThinMaterial)
                        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous)
                            .fill(Color.rgba(245, 245, 247, 0.86)))
                        .cssShadow(Color.black.opacity(0.18), y: 8, blur: 26)
                )
            }
            .buttonStyle(.plainTap)
            .accessibilityLabel("notification from rilo, now: tap to talk")
            .padding(.horizontal, 8)
            .padding(.top, top)
            .opacity(shown || reduce ? 1 : 0)
            /* banner-down: from translateY(-120%) */
            .offset(y: shown || reduce ? 0 : -(top + 74 * 1.2))
            .ignoresSafeArea(edges: .top)
            .onAppear {
                withAnimation(.timingCurve(0.2, 0.9, 0.3, 1.1, duration: 0.4)) { shown = true }
            }
        }
    }
}

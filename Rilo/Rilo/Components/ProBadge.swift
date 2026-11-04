import SwiftUI

/// Port of app/src/components/ProBadge.jsx — the small padlock that marks a
/// rilo pro feature. Deliberately tiny and quiet: a locked feature should
/// still be visible and understandable. Tapping whatever carries this badge
/// opens the paywall rather than the feature.
struct ProBadge: View {
    var size: CGFloat = 22

    var body: some View {
        ZStack {
            Circle().fill(Color(hex: "#F0E4C3"))
            Circle().strokeBorder(Color(hex: "#D8C48C"), lineWidth: 1.5)
            ZStack {
                SVGPath("M7 10V7.5a5 5 0 0 1 10 0V10")
                    .stroke(Color(hex: "#8A6B1F"), style: StrokeStyle(lineWidth: 2.4, lineCap: .round))
                SVGPath("M7.5 10 H16.5 A3 3 0 0 1 19.5 13 V17.5 A3 3 0 0 1 16.5 20.5 H7.5 A3 3 0 0 1 4.5 17.5 V13 A3 3 0 0 1 7.5 10 Z")
                    .fill(Color(hex: "#8A6B1F"))
            }
            .frame(width: size * 0.55, height: size * 0.55)
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("rilo pro")
    }
}

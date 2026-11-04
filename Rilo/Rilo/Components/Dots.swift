import SwiftUI

/// Onboarding progress dots (web components/Dots.jsx).
/// Active dot is a 28x8 ink pill, the rest are 8x8 translucent white.
struct Dots: View {
    var active: Int = 0
    var count: Int = 4

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<count, id: \.self) { i in
                RoundedRectangle(cornerRadius: 4)
                    .fill(i == active ? Color(hex: "12301A") : Color.white.opacity(0.8))
                    .frame(width: i == active ? 28 : 8, height: 8)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

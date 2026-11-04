import SwiftUI

/// Port of ChatIcon in app/src/components/TalkBits.jsx — the little speech
/// bubble on Home's "chat" badge.
struct ChatIcon: View {
    var size: CGFloat = 16
    var color: Color = .white

    var body: some View {
        ZStack {
            SVGPath("M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 13 4a8 8 0 0 1 8 8Z")
                .stroke(color, style: StrokeStyle(lineWidth: 2.2, lineJoin: .round))
            ForEach([9.5, 13, 16.5], id: \.self) { x in
                SVGPath("M\(x - 1.1) 12 a1.1 1.1 0 1 0 2.2 0 a1.1 1.1 0 1 0 -2.2 0 Z").fill(color)
            }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

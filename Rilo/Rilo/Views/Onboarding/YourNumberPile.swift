import SwiftUI

/// The pile on Your number: one slab per day they lose in a year, a stack
/// of thin planks rising off the hills (YourNumber.jsx `Pile`). Slabs are
/// sized to the count so 40 days and 90 days fill the same space.
struct YourNumberPile: View {
    let days: Int
    let flipped: Bool
    let reduced: Bool

    static let budget: CGFloat = 150

    private var slabH: CGFloat {
        CGFloat(max(2, min(7, Int((Double(Self.budget) / Double(max(days, 1))).rounded(.down)) - 1)))
    }
    /* ms between slabs */
    private var stagger: Double { reduced ? 0 : min(26, 2000 / Double(max(days, 1))) }

    @State private var tilted = false

    var body: some View {
        VStack(spacing: 1) {
            Spacer(minLength: 0)
            /* column-reverse: slab 0 sits at the bottom */
            ForEach((0..<days).reversed(), id: \.self) { i in
                Slab(index: i, width: 240 * CGFloat(54 + (i * 37) % 26) / 100, height: slabH,
                     delay: Double(i) * stagger / 1000, flipped: flipped, reduced: reduced)
            }
        }
        .frame(width: 240, height: Self.budget, alignment: .bottom)
        .rotationEffect(.degrees(tilted ? -4 : 0))
        .offset(y: tilted ? -4 : 0)
        .onAppear { tilted = flipped }
        .onChange(of: flipped) {
            if reduced { tilted = flipped } else {
                withAnimation(.timingCurve(0.2, 0.8, 0.3, 1, duration: 0.9)) { tilted = flipped }
            }
        }
    }
}

private struct Slab: View {
    let index: Int
    let width: CGFloat
    let height: CGFloat
    let delay: Double
    let flipped: Bool
    let reduced: Bool

    @State private var shown = false
    @State private var green = false

    var body: some View {
        RoundedRectangle(cornerRadius: 2)
            .fill(green ? Color(hex: "#2E8B3E") : RC.ink)
            .frame(width: width, height: height)
            /* slab-in .42s ease-out: from opacity 0, translateY(9px) scaleX(.55) */
            .scaleEffect(x: shown ? 1 : 0.55, y: 1)
            .offset(y: shown ? 0 : 9)
            .opacity(shown ? 1 : 0)
            .onAppear {
                green = flipped
                if reduced { shown = true } else {
                    withAnimation(.easeOut(duration: 0.42).delay(delay)) { shown = true }
                }
            }
            .onChange(of: flipped) {
                /* the recolour sweeps up the pile instead of all at once */
                if reduced { green = flipped } else {
                    withAnimation(.easeOut(duration: 0.5).delay(min(0.9, Double(index) * 0.012))) { green = flipped }
                }
            }
    }
}

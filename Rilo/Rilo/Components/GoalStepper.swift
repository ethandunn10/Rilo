import SwiftUI

/// Port of app/src/components/GoalStepper.jsx — the daily screen-time goal
/// with +/- buttons, half an hour a step, clamped to [floor, min(now, 10)].
struct GoalStepper: View {
    let time: TimeGoal
    let setTime: (TimeGoal) -> Void
    var label = "daily screen time goal"
    var floor: Double = 0.5

    static let MAX: Double = 10

    static func fmtHours(_ h: Double) -> String {
        let whole = Int(h.rounded(.down))
        let mins = JS.roundInt((h - Double(whole)) * 60)
        return mins != 0 ? "\(whole)h \(mins)m" : "\(whole)h"
    }

    /// "2h 30m" → "2 hours 30 minutes" for VoiceOver
    static func spokenHours(_ h: Double) -> String {
        let whole = Int(h.rounded(.down))
        let mins = JS.roundInt((h - Double(whole)) * 60)
        let hrs = whole == 1 ? "1 hour" : "\(whole) hours"
        if whole == 0 { return "\(mins) minutes" }
        return mins != 0 ? "\(hrs) \(mins) minutes" : hrs
    }

    @State private var fill: Double = 0

    var body: some View {
        VStack(spacing: 8) {
            HStack(alignment: .center, spacing: 0) {
                Text(label)
                    .font(.fredoka(17, 600))
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .layoutPriority(1)
                    .accessibilityHidden(true)
                HStack(spacing: 6) {
                    stepButton("−", a11y: "take away 30 minutes") {
                        var t = time
                        t.goal = max(floor, time.goal - 0.5)
                        setTime(t)
                    }
                    Text(Self.fmtHours(time.goal))
                        .font(.fredoka(22, 700))
                        .foregroundStyle(Color(hex: "#1F6B2E"))
                        .frame(minWidth: 70)
                        .multilineTextAlignment(.center)
                        .accessibilityLabel("\(label), \(Self.spokenHours(time.goal))")
                    stepButton("+", a11y: "add 30 minutes") {
                        var t = time
                        t.goal = min(min(time.now, Self.MAX), time.goal + 0.5)
                        setTime(t)
                    }
                }
                .fixedSize()
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.rgba(18, 48, 26, 0.08))
                    Capsule()
                        .fill(LinearGradient(colors: [RC.green, RC.greenDeep], startPoint: .leading, endPoint: .trailing))
                        .frame(width: geo.size.width * fill)
                }
            }
            .frame(height: 22)
            .clipShape(Capsule())
            .accessibilityHidden(true)   // the number above says the same
        }
        .onAppear { fill = pct }
        .onChange(of: time.goal) {
            withAnimation(.timingCurve(0.2, 0.8, 0.3, 1, duration: 0.5)) { fill = pct }
        }
    }

    /* width: Math.round(goal / MAX * 100)% */
    private var pct: Double { Double(JS.roundInt(time.goal / Self.MAX * 100)) / 100 }

    private func stepButton(_ glyph: String, a11y: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph)
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(RC.ink)
                .frame(width: 44, height: 44)
                .background(Circle().fill(.white))
                .cssShadow(Color.rgba(20, 60, 40, 0.1), y: 4, blur: 10)
        }
        .buttonStyle(.tap(0.92))
        .accessibilityLabel(a11y)
    }
}

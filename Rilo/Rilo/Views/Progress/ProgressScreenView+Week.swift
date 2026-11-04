import SwiftUI

/// Progress.jsx's middle card: time you got back, the share-card button,
/// and this week's bars. The bars, the streak and the "times you said no"
/// are all scored against the DAILY GOAL (§8). Over-goal days stay grey;
/// the colour of a "good" day follows the app theme.
struct ProgressWeekCard: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme

    /// BAR_COLOR: the gradient of a good day per theme, and its name
    static func barColor(_ id: String) -> (name: String, top: Color, bottom: Color) {
        switch id {
        case "bamboo": return ("green", Color(hex: "#9ED48C"), Color(hex: "#5FA552"))
        case "sakura": return ("pink", Color(hex: "#FFA9C6"), Color(hex: "#E9719B"))
        case "sunset": return ("orange", Color(hex: "#FFB347"), Color(hex: "#FF7A45"))
        case "snow": return ("blue", Color(hex: "#8FD0F5"), Color(hex: "#4A9BD6"))
        default: return ("green", Color(hex: "#4CC160"), Color(hex: "#2E8B3E"))
        }
    }

    /// monday-first labels under the bars, oldest day on the left
    static let DAY_LABELS = ["m", "t", "w", "t", "f", "s", "s"]
    static let DAY_NAMES = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

    struct Bar { var mins: Double; var goal: Double; var hit: Bool; var real: Bool }

    /// the last six finished days, with today tacked on the end; days they
    /// haven't lived yet are left empty rather than invented
    private var weekBars: [Bar] {
        let goal = Double(state.goalMins)
        let week = state.history.suffix(6).map { Bar(mins: $0.used, goal: $0.goal, hit: $0.hit, real: true) }
        let used = state.usedTotalToday
        let bars = Array((week + [Bar(mins: used, goal: goal, hit: used <= goal, real: true)]).suffix(7))
        let pad = Array(repeating: Bar(mins: 0, goal: goal, hit: false, real: false), count: max(0, 7 - bars.count))
        return pad + bars
    }

    private var kept: [Checkin] { state.checkins.filter { $0.gone != nil } }

    var body: some View {
        let back = state.back
        let bars = weekBars
        /* the tallest bar sets the scale, so a bad day doesn't clip */
        let tallest = max(Double(state.goalMins), bars.map(\.mins).max() ?? 0, 1)
        let goodDays = bars.filter { $0.real && $0.hit }.count
        let color = Self.barColor(theme.id)
        let ink2 = RC.ink2

        VStack(alignment: .leading, spacing: 10) {
            /* time you got back (rilo-addons-test) */
            HStack(spacing: 8) {
                ForEach([("today", back.today), ("this week", back.week), ("all time", back.total)], id: \.0) { label, mins in
                    VStack(spacing: 0) {
                        Text(Plan.fmtMins(mins))
                            .font(.fredoka(19, 700))
                            .foregroundStyle(ProgressScreenView.deepGreen)
                        Text(label)
                            .font(.inter(11, 700))
                            .foregroundStyle(ink2)
                    }
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(A11ySpeak.mins(mins)) back \(label)")
                    .padding(.vertical, 8)
                    .padding(.horizontal, 6)
                    .frame(maxWidth: .infinity)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Color.white.opacity(0.6)))
                }
            }
            .padding(.bottom, 2)

            if !state.backSays.isEmpty {
                note("you got back \(Plan.fmtMins(back.week)) this week. \(state.backSays).")
            }
            if !kept.isEmpty {
                let onTime = kept.filter { $0.over != true }.count
                note("check-ins: \(onTime) of \(kept.count) stayed inside the time you asked for.")
            }

            Button { state.go(.sharecard) } label: {
                Text("your week, as a card")
                    .font(.fredoka(14, 600))
                    .foregroundStyle(RC.ink)
                    .padding(.horizontal, 14 + 2)
                    .frame(minHeight: 38)
                    .background(Capsule().fill(.white))
                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
            }
            .buttonStyle(.tap)
            .padding(.bottom, 6)

            HStack(alignment: .firstTextBaseline) {
                Text("week \(state.program.week) · \(Plan.fmtMins(Double(state.goalMins))) a day")
                    .font(.fredoka(18, 600))
                Spacer(minLength: 4)
                Text("\(Plan.fmtMins(back.week)) saved")
                    .font(.fredoka(15, 600))
                    .foregroundStyle(ProgressScreenView.deepGreen)
            }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)

            HStack(alignment: .bottom, spacing: 10) {
                ForEach(Array(bars.enumerated()), id: \.offset) { i, b in
                    VStack(spacing: 6) {
                        WeekBar(good: b.real && b.hit, top: color.top, bottom: color.bottom,
                                height: b.real ? max(4, (b.mins / tallest * 96).rounded()) : 3,
                                delay: 0.2 + Double(i) * 0.07)
                        Text(Self.DAY_LABELS[i])
                            .font(.fredoka(13, 600))
                            .foregroundStyle(RC.ink3)
                    }
                    /* "monday, 1 hour 20 minutes, under your goal" */
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel(Self.DAY_NAMES[i])
                    .accessibilityValue(!b.real ? "no data yet"
                        : "\(A11ySpeak.mins(b.mins)), \(b.hit ? "under your goal" : "over your goal")")
                    .frame(maxWidth: .infinity)
                }
            }
            .frame(height: 120, alignment: .bottom)
            .tourTarget("progress-week")

            Text("\(color.name) bars came in under \(Plan.fmtMins(Double(state.goalMins))) · \(goodDays) of 7 this week")
                .font(.inter(12, 600))
                .foregroundStyle(RC.ink3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.vertical, 14 + 2)   // css border sits outside the padding
        .padding(.horizontal, 16 + 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(radius: 26, drop: 4)
        .overlay { ProgressCardDecor(theme: theme.id) }
    }

    private func note(_ s: String) -> some View {
        Text(s)
            .font(.inter(13, 700))
            .foregroundStyle(RC.ink2)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.bottom, 4)
    }
}

/// one plain bar, growing up from the bottom
/// (`grow .7s <delay> cubic-bezier(.2,.8,.3,1) both`)
private struct WeekBar: View {
    let good: Bool
    let top: Color
    let bottom: Color
    let height: CGFloat
    let delay: Double
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        RoundedRectangle(cornerRadius: 10, style: .continuous)
            .fill(good ? AnyShapeStyle(LinearGradient(colors: [top, bottom], startPoint: .top, endPoint: .bottom))
                       : AnyShapeStyle(Color.rgba(18, 48, 26, 0.15)))
            .frame(height: height)
            .frame(maxWidth: .infinity)
            .scaleEffect(x: 1, y: shown || reduce ? 1 : 0.001, anchor: .bottom)
            .onAppear {
                withAnimation(.timingCurve(0.2, 0.8, 0.3, 1, duration: 0.7).delay(delay)) { shown = true }
            }
    }
}

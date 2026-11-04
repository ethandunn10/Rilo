import SwiftUI

/// Port of app/src/screens/DaySummary.jsx — how the day went. Shown when a
/// day ends: the only place XP is handed out, because it's the only place
/// results exist.
struct DaySummaryView: View {
    @Environment(AppState.self) private var state

    var body: some View {
        if let result = state.dayResult {
            content(result)
        }
    }

    private func content(_ r: DayResult) -> some View {
        ZStack {
            SkyView(hills: .mid)
            VStack(spacing: 14) {
                RiloView(skin: state.chosenRilo, mood: r.hit ? "proud" : "letdown",
                         size: 180, motion: r.hit ? .jump : .idle, talks: true)

                Text(r.hit ? "that's a day." : "we went over.")
                    .font(.fredoka(32, 700))
                    .webLineHeight(32, 1.15)
                    .multilineTextAlignment(.center)

                Text("\(Plan.fmtMins(r.used)) used · \(Plan.fmtMins(r.goal)) goal")
                    .font(.inter(16, 600))
                    .foregroundStyle(RC.ink2)
                    .multilineTextAlignment(.center)

                HStack(spacing: 10) {
                    stat(r.under > 0 ? Plan.fmtMins(r.under) : "0m", "saved", color: Color(hex: "#1F6B2E"))
                    stat("\(r.xp >= 0 ? "+" : "")\(r.xp)", "xp",
                         color: r.xp >= 0 ? Color(hex: "#1F6B2E") : Color(hex: "#A33A2B"))
                    stat("\(r.streak)", "day streak", color: Color(hex: "#1F6B2E"))
                }

                Spacer(minLength: 0)

                Button { state.daySummaryDone() } label: {
                    Text(r.hit ? "nice" : "tomorrow then")
                        .font(.fredoka(20, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Capsule().fill(.white))
                        .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30)
                }
                .buttonStyle(.tap)
            }
            .foregroundStyle(RC.ink)
            .padding(.top, WebLayout.top(62))
            .padding(.horizontal, 22)
            .padding(.bottom, WebLayout.bottom(28))
        }
    }

    private func stat(_ value: String, _ label: String, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.fredoka(24, 700))
                .foregroundStyle(color)
            Text(label)
                .font(.inter(12, 700))
        }
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14 + 2)
        .padding(.horizontal, 8 + 2)
        .background(RoundedRectangle(cornerRadius: 22, style: .continuous).fill(Color.white.opacity(0.75)))
        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
    }
}

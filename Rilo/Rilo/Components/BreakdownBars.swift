import SwiftUI

/// Port of app/src/components/Breakdown.jsx — where the day actually goes:
/// one bar per blocked app, plus everything else. Used on Your number and
/// again on Progress. (Named BreakdownBars because `Breakdown` is the model.)
struct BreakdownBars: View {
    let breakdown: Breakdown
    var compact = false
    var isPro = true
    var onUpgrade: () -> Void = {}

    @Environment(\.riloTheme) private var theme

    private var rows: [BreakdownApp] { breakdown.apps.sorted { $0.mins > $1.mins } }
    private var widest: Double { max(rows.map(\.mins).max() ?? 0, breakdown.other, 1) }
    private var gap: CGFloat { compact ? 10 : 13 }

    var body: some View {
        VStack(alignment: .leading, spacing: gap) {
            /* free sees the total, not the split — that's the pro bit */
            ZStack {
                VStack(alignment: .leading, spacing: gap) {
                    ForEach(rows, id: \.app) { r in
                        row(key: r.app, label: r.app, mins: r.mins, pct: r.pct, logo: true, muted: false)
                    }
                }
                .blur(radius: isPro ? 0 : 7)
                .opacity(isPro ? 1 : 0.65)
                .allowsHitTesting(isPro)
                .accessibilityHidden(!isPro)

                if !isPro {
                    Button(action: onUpgrade) {
                        VStack(spacing: 4) {
                            Text("see where your time goes")
                                .font(.fredoka(compact ? 15 : 17, 600))
                                .foregroundStyle(RC.ink)
                            Text("rilo pro")
                                .font(.inter(12, 700))
                                .foregroundStyle(RC.ink2)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(Color.white.opacity(0.35)))
                    }
                    .buttonStyle(.tap)
                }
            }

            if breakdown.other > 0 {
                row(key: "other", label: "everything else", mins: breakdown.other,
                    pct: JS.roundInt(breakdown.other / breakdown.total * 100), logo: false, muted: true)
            }

            Text("your blocked apps: \(Plan.fmtMins(breakdown.blocked)) a day"
                 + (breakdown.allowed ? " (\(JS.roundInt(breakdown.blocked / breakdown.total * 100))%)" : ""))
                .font(.inter(compact ? 13 : 14, 700))
                .foregroundStyle(RC.ink2)
                .padding(.top, 2)
                .fixedSize(horizontal: false, vertical: true)

            if !compact, let most = rows.first, breakdown.allowed {
                Text("\(most.app)'s eating the most. we'll start there.")
                    .font(.fredoka(19, 600))
                    .webLineHeight(19, 1.3)
                    .foregroundStyle(RC.ink)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private func row(key: String, label: String, mins: Double, pct: Int?, logo: Bool, muted: Bool) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 9) {
                if logo {
                    AppLogo(label: key, size: compact ? 24 : 28, radius: 8)
                } else {
                    Color.clear.frame(width: compact ? 24 : 28, height: 1)
                }
                Text(label)
                    .font(.fredoka(compact ? 15 : 17, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(Plan.fmtMins(mins) + (pct.map { " · \($0)%" } ?? ""))
                    .font(.inter(compact ? 13 : 14, 700))
                    .foregroundStyle(RC.ink3)
            }
            FillBar(fraction: max(0.04, mins / widest), height: compact ? 10 : 14,
                    fill: muted ? AnyShapeStyle(Color.rgba(18, 48, 26, 0.18))
                                : AnyShapeStyle(LinearGradient(colors: [theme.hills[1], theme.hills[2]],
                                                               startPoint: .leading, endPoint: .trailing)))
        }
    }
}

/// a bar that grows from 0 on appear (`bar-fill .7s ease-out`)
private struct FillBar: View {
    let fraction: Double
    let height: CGFloat
    let fill: AnyShapeStyle
    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    var body: some View {
        GeometryReader { geo in
            Capsule()
                .fill(fill)
                .frame(width: geo.size.width * fraction * (shown || reduce ? 1 : 0))
        }
        .frame(height: height)
        .onAppear { withAnimation(.easeOut(duration: 0.7)) { shown = true } }
    }
}

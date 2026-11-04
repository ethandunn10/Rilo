import SwiftUI

/// Port of app/src/components/Opens.jsx — the opens display (§3): circles
/// plus one line of text.
///
/// full = available, half-shaded = half an open left, empty = used. Used on
/// each app's limit card and on Rilo's pop-up when a Limited app is opened,
/// so the same picture means the same thing in both places.
struct Opens: View {
    var total: Double
    var used: Double
    var minutes: Int
    /// `on` inverts the colours for the dark cards (Rilo's pop-up, the chips)
    var on = false
    var size: CGFloat = 16
    var note = true
    var align: HorizontalAlignment = .leading

    private static let LINE = RC.line

    var body: some View {
        let states = Limits.circlesFor(total, used)
        let left = max(0, total - used)
        let color: Color = on ? .white : Self.LINE

        VStack(alignment: align, spacing: 4) {
            WrapRow(spacing: 4) {
                ForEach(Array(states.enumerated()), id: \.offset) { _, st in
                    OpenCircle(state: st, size: size, color: color, on: on)
                }
                if states.isEmpty {
                    Text("no opens")
                        .font(.inter(12, 700))
                        .foregroundStyle(on ? Color.white.opacity(0.75) : RC.ink3)
                }
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(Limits.opensText(left, minutes))

            if note {
                Text(Limits.opensText(left, minutes))
                    .font(.inter(12, 600))
                    .foregroundStyle(on ? Color(hex: "#C9E6CE") : RC.ink3)
            }
        }
    }
}

/// One open: the hole, the fill (left half for a half open), the ring.
private struct OpenCircle: View {
    let state: String
    let size: CGFloat
    let color: Color
    let on: Bool

    var body: some View {
        let r = size / 2 - 1.25
        let c = size / 2
        Canvas { g, _ in
            let rect = CGRect(x: c - r, y: c - r, width: r * 2, height: r * 2)
            if on { g.fill(Circle().path(in: rect), with: .color(Color.white.opacity(0.35))) }
            if state == "half" {
                /* a half open is the left half filled, like a battery at 50% */
                var p = Path()
                p.move(to: CGPoint(x: c, y: c - r))
                p.addArc(center: CGPoint(x: c, y: c), radius: r,
                         startAngle: .degrees(-90), endAngle: .degrees(90), clockwise: true)
                p.closeSubpath()
                g.fill(p, with: .color(color))
            }
            if state == "full" { g.fill(Circle().path(in: rect), with: .color(color)) }
            g.stroke(Circle().path(in: rect), with: .color(on ? color : RC.line), lineWidth: 2)
        }
        .frame(width: size, height: size)
    }
}

/// `display: flex; flex-wrap: wrap` for a row of small items.
struct WrapRow: Layout {
    var spacing: CGFloat = 4

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxW = proposal.width ?? .infinity
        var x: CGFloat = 0, y: CGFloat = 0, rowH: CGFloat = 0, widest: CGFloat = 0
        for v in subviews {
            let s = v.sizeThatFits(.unspecified)
            if x > 0 && x + s.width > maxW { y += rowH + spacing; x = 0; rowH = 0 }
            x += s.width + spacing
            rowH = max(rowH, s.height)
            widest = max(widest, x - spacing)
        }
        return CGSize(width: widest, height: subviews.isEmpty ? 0 : y + rowH)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = 0, y: CGFloat = 0, rowH: CGFloat = 0
        let rows: [[(Int, CGSize)]] = {
            var out: [[(Int, CGSize)]] = [[]]
            var cx: CGFloat = 0
            for (i, v) in subviews.enumerated() {
                let s = v.sizeThatFits(.unspecified)
                if cx > 0 && cx + s.width > bounds.width { out.append([]); cx = 0 }
                out[out.count - 1].append((i, s))
                cx += s.width + spacing
            }
            return out
        }()
        for row in rows {
            rowH = row.map { $0.1.height }.max() ?? 0
            x = 0
            for (i, s) in row {
                /* align-items: center within the row */
                subviews[i].place(at: CGPoint(x: bounds.minX + x, y: bounds.minY + y + (rowH - s.height) / 2),
                                  proposal: ProposedViewSize(s))
                x += s.width + spacing
            }
            y += rowH + spacing
        }
    }
}

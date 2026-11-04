import SwiftUI

/// Paywall.jsx's PERKS, FREE_BITS and PLANS, word for word.
extension PaywallView {
    struct Perk { let title: String; let sub: String }
    struct PlanRow { let id: String; let name: String; let sub: String; let price: String }

    static let PERKS: [Perk] = [
        Perk(title: "unlimited apps", sub: "free watches 5"),
        Perk(title: "strict mode", sub: "no half opens, 24 hours to loosen anything"),
        Perk(title: "where your time goes", sub: "the per-app breakdown and your trends"),
        Perk(title: "the weekly step-down", sub: "one thing tightens each week"),
        Perk(title: "rilo checks in every night", sub: "thirty seconds before bed, and tomorrow is planned"),
        Perk(title: "all 23 rilos and every theme", sub: "a new one every level"),
        Perk(title: "buddy mode", sub: "a friend sees your mood and streak, never your numbers"),
    ]

    /* Exactly what the free tier does. The limit system itself is not behind
       the paywall. Pro is more apps and more depth. */
    static let FREE_BITS: [String] = [
        "watches up to 5 apps",
        "opens in halves, with the wait and the \"what are you opening this for?\"",
        "rilo's plan, and something to do instead",
        "your daily goal, your streak and your screen-time number",
        "rilo's moods, and a word from him when you go around a limit",
        "1 emergency pass a day",
        "original rilo and the grass theme",
    ]

    static let PLANS: [PlanRow] = [
        PlanRow(id: "year", name: "yearly · best value", sub: "$3.33 a month, billed yearly", price: "$39.99/yr"),
        PlanRow(id: "month", name: "monthly", sub: "billed every month", price: "$4.99/mo"),
        PlanRow(id: "free", name: "free", sub: "5 apps, your limits and your plan", price: "$0"),
    ]

    /// PLANS with the App Store's own localized prices once StoreKit has
    /// loaded them; the web's text above until then (or if it never does).
    static func plans(_ prices: PlanPrices?) -> [PlanRow] {
        guard let p = prices else { return PLANS }
        return [
            PlanRow(id: "year", name: PLANS[0].name, sub: "\(p.yearPerMonth) a month, billed yearly", price: "\(p.year)/yr"),
            PlanRow(id: "month", name: PLANS[1].name, sub: PLANS[1].sub, price: "\(p.month)/mo"),
            PLANS[2],
        ]
    }
}

/// The dark "pro adds" card.
struct PaywallPerks: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("pro adds")
                .font(.fredoka(17, 600))
                .accessibilityAddTraits(.isHeader)
                .foregroundStyle(.white)
                .padding(.bottom, 2)
            ForEach(PaywallView.PERKS, id: \.title) { p in
                HStack(spacing: 10) {
                    Circle().fill(RC.green)
                        .frame(width: 26, height: 26)
                        .overlay(
                            SVGPath("M3 8.5 L6.5 12 L13 4.5", w: 16, h: 16)
                                .stroke(RC.ink, style: .svg(2.6 * 13 / 16))
                                .frame(width: 13, height: 13)
                        )
                        .accessibilityHidden(true)
                    Text("\(Text(p.title).font(.inter(15, 700)).foregroundStyle(.white)) · \(p.sub)")
                        .font(.inter(15, 600))
                        .foregroundStyle(Color(hex: "#C9E6CE"))
                        .webLineHeight(15, 1.3)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(.vertical, 14 + 2)
        .padding(.horizontal, 16 + 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(RC.ink))
        .overlay(RoundedRectangle(cornerRadius: 24, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
        .cssShadow(Color.rgba(10, 40, 20, 0.22), y: 14, blur: 30)
    }
}

/// "free does the basics"
struct PaywallFreeCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("free does the basics")
                .font(.fredoka(17, 600))
                .accessibilityAddTraits(.isHeader)
                .foregroundStyle(RC.ink)
            ForEach(PaywallView.FREE_BITS, id: \.self) { t in
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("·").foregroundStyle(Color(hex: "#7FA38A"))
                        .accessibilityHidden(true)
                    Text(t).foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .font(.inter(14, 600))
                .webLineHeight(14, 1.3)
            }
        }
        .padding(.vertical, 14 + 2)
        .padding(.horizontal, 16 + 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .sticker(fill: RC.card, radius: 24, drop: 3)
    }
}

/// One price row (the `tap-pw` button with aria-pressed).
struct PaywallPlanButton: View {
    let row: PaywallView.PlanRow
    let on: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                VStack(alignment: .leading, spacing: 1) {
                    Text(row.name).font(.fredoka(18, 600))
                    Text(row.sub).font(.inter(13, 600)).foregroundStyle(RC.ink3)
                }
                Spacer(minLength: 8)
                Text(row.price).font(.fredoka(18, 700))
            }
            .foregroundStyle(RC.ink)
            .padding(.horizontal, 18 + (on ? 2.5 : 2))
            .frame(maxWidth: .infinity, minHeight: 62)
            .sticker(fill: on ? Color(hex: "#DDF3D9") : RC.card, radius: 22,
                     borderWidth: on ? 2.5 : 2, drop: on ? 4 : 3)
            .animation(.easeOut(duration: 0.2), value: on)
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

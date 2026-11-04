import SwiftUI

/* Port of app/src/components/StrictCard.jsx: strict mode, the bundle (§12).

   Strict mode isn't a separate set of limits. It's one switch that changes
   five things about the limits you already have, shown as exactly that:
   two columns, same five rows.

   Turning it ON is instant. Turning it OFF runs for another 24 hours first
   (cancelable), or right now if they insist: nobody gets trapped by a
   switch they flipped at 2am. The emergency pass works in both modes.

   Inputs are the JSX props. `style` there is always the You tab's
   `card(delay)`, so here it's `cardDelay` (nil = no card chrome, for a
   caller that wraps it itself). Wire it as:
     StrictCard(dataTourTarget: "you-strict", cardDelay: 0.2, skin: state.chosenRilo,
                strict: state.strict, onTurnOn: { state.strictOn(days: $0, when: $1) },
                onAskOff: { state.loosening = "strict-wait" }, onKeepOn: state.strictKeepOn,
                onTurnOffNow: { state.loosening = "strict-now" })
   (match whatever App.jsx's onStrictOn / setLoosening map to in AppState). */

struct StrictCard: View {
    var dataTourTarget: String? = nil
    var cardDelay: Double? = 0.2
    var skin = "original"
    let strict: StrictState
    let onTurnOn: (_ days: Int, _ when: String) -> Void
    /// start the 24-hour countdown
    let onAskOff: () -> Void
    /// cancel a countdown that's already running
    let onKeepOn: () -> Void
    /// turn it off right now, no waiting: their call
    var onTurnOffNow: () -> Void = {}

    @State private var picking = DemoSeed.flag("-strictpicking")
    @State private var showing = DemoSeed.flag("-strictshowing")
    /// turning it off asks first (the confirm panel)
    @State private var confirmOff = DemoSeed.flag("-strictconfirm")
    @State private var days: Int
    @State private var when: String

    init(dataTourTarget: String? = nil, cardDelay: Double? = 0.2, skin: String = "original",
         strict: StrictState, onTurnOn: @escaping (Int, String) -> Void, onAskOff: @escaping () -> Void,
         onKeepOn: @escaping () -> Void, onTurnOffNow: @escaping () -> Void = {}) {
        self.dataTourTarget = dataTourTarget
        self.cardDelay = cardDelay
        self.skin = skin
        self.strict = strict
        self.onTurnOn = onTurnOn
        self.onAskOff = onAskOff
        self.onKeepOn = onKeepOn
        self.onTurnOffNow = onTurnOffNow
        _days = State(initialValue: strict.days)
        _when = State(initialValue: strict.when)
    }

    /* 0 days means no end date: it runs until they turn it off (24 hours) */
    static let LENGTHS: [(days: Int, label: String)] = [(1, "1 day"), (3, "3 days"), (7, "1 week"), (0, "for good")]
    static let WINDOWS: [(id: String, label: String)] = [("all", "all day"), ("school", "school hours"), ("night", "after 10pm")]

    static func lengthLabel(_ days: Int) -> String { LENGTHS.first { $0.days == days }?.label ?? "1 week" }

    /// "4:12pm"
    static func endsAtText(_ endingAt: Double?) -> String {
        guard let endingAt else { return "" }
        let d = Date(timeIntervalSince1970: endingAt / 1000)
        let c = Calendar.current.dateComponents([.hour, .minute], from: d)
        let h = c.hour ?? 0, m = c.minute ?? 0
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(String(format: "%02d", m))\(h >= 12 ? "pm" : "am")"
    }

    /// "23h 41m": how long the countdown has left
    static func leftText(_ endingAt: Double) -> String {
        let mins = max(0, Int(((endingAt - JS.nowMs) / 60000).rounded(.up)))
        let h = mins / 60, m = mins % 60
        if h == 0 { return "\(m)m" }
        return m != 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    private var ending: Bool { strict.endingAt != nil }

    var body: some View {
        let content = VStack(alignment: .leading, spacing: 10) {
            header
            if strict.on && !ending && confirmOff { confirmPanel }
            if strict.on, let endingAt = strict.endingAt { windingDown(endingAt) }
            if strict.on && !ending { onPill }
            whatChanges
            if showing { StrictBundleTable(on: strict.on) }
            if !strict.on && picking { picker }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .foregroundStyle(RC.ink)

        Group {
            if let cardDelay {
                content
                    .padding(16 + 2)
                    .sticker(fill: RC.card, radius: 26, drop: 4)
                    .rise(cardDelay, distance: 14, duration: 0.4)
            } else {
                content
            }
        }
        .tourTarget(dataTourTarget, radius: cardDelay == nil ? nil : 26)
    }

    private var header: some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 2) {
                Text("strict mode").font(.fredoka(19, 600))
                    .accessibilityAddTraits(.isHeader)
                Text("no half opens, no borrowing, 24 hours to loosen anything.")
                    .font(.inter(13, 600))
                    .foregroundStyle(RC.ink2)
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                if strict.on { confirmOff.toggle() } else { picking.toggle() }
            } label: {
                Circle()
                    .fill(strict.on ? .white : RC.ink)
                    .frame(width: 24, height: 24)
                    .padding(.horizontal, 3 + 2)
                    .frame(width: 62, height: 34, alignment: strict.on ? .trailing : .leading)
                    .background(Capsule().fill(strict.on ? RC.ink : Color.white.opacity(0.9)))
                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
            }
            .buttonStyle(.tap)
            .accessibilityLabel("strict mode")
            .accessibilityValue(strict.on ? "on" : "off")
            .accessibilityAddTraits(.isToggle)
        }
    }

    /* They asked to turn it off. They're allowed to. Rilo asks once whether
       they'd rather wait the 24 hours out, then does whatever they say. */
    private var confirmPanel: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 10) {
                RiloView(skin: skin, mood: "curious", size: 56, talks: true)
                VStack(alignment: .leading, spacing: 3) {
                    Text("get through 24 hours first?")
                        .font(.fredoka(17, 600))
                        .webLineHeight(17, 1.25)
                    Text("waiting it out is the one that works — one more day, then it switches itself off, and you can cancel any time. or turn it off now. up to you.")
                        .font(.inter(12.5, 600))
                        .webLineHeight(12.5, 1.35)
                        .foregroundStyle(Color(hex: "#C9E6CE"))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            VStack(spacing: 7) {
                Button {
                    confirmOff = false
                    onAskOff()
                } label: {
                    Text("yes, wait it out")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(Capsule().fill(.white))
                }
                .buttonStyle(.tap)
                Button {
                    confirmOff = false
                    onTurnOffNow()
                } label: {
                    Text("no, turn it off")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .overlay(Capsule().strokeBorder(.white, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
        }
        .foregroundStyle(.white)
        .padding(.vertical, 12)
        .padding(.horizontal, 13)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(RC.ink))
    }

    /// winding down: 24 hours, with a way back
    private func windingDown(_ endingAt: Double) -> some View {
        HStack(spacing: 10) {
            RiloView(skin: skin, mood: "letdown", size: 56, talks: true)
            VStack(alignment: .leading, spacing: 1) {
                Text("strict mode turns off in \(Self.leftText(endingAt))")
                    .font(.fredoka(15, 600))
                Text("pending · tomorrow at \(Self.endsAtText(endingAt))")
                    .font(.inter(12, 600))
                    .foregroundStyle(RC.ink2)
                Button {
                    confirmOff = false
                    onKeepOn()
                } label: {
                    Text("cancel, keep it on")
                        .font(.fredoka(14, 600))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 14 + 2)
                        .frame(minHeight: 38)
                        .background(Capsule().fill(RC.ink))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
                .padding(.top, 6 - 1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 10 + 2)
        .padding(.horizontal, 12 + 2)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.85)))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
    }

    private var onPill: some View {
        Text("on · \(Self.lengthLabel(strict.days)) · \(Self.WINDOWS.first { $0.id == strict.when }?.label ?? "all day")")
            .font(.fredoka(14, 600))
            .foregroundStyle(.white)
            .padding(.vertical, 5)
            .padding(.horizontal, 12)
            .background(Capsule().fill(RC.ink))
    }

    private var whatChanges: some View {
        Button { showing.toggle() } label: {
            Text(showing ? "hide what changes" : "what changes?")
                .font(.fredoka(13, 600))
                .foregroundStyle(RC.ink2)
                .padding(.horizontal, 12 + 1.5)
                .frame(minHeight: 34)
                .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.3), lineWidth: 1.5))
        }
        .buttonStyle(.tap)
    }

    /// choosing how long and when
    private var picker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("how long?").font(.inter(13, 700)).foregroundStyle(RC.ink2)
            VStack(spacing: 6) {
                ForEach(Self.LENGTHS, id: \.days) { l in
                    StrictChip(label: l.label, on: days == l.days) { days = l.days }
                }
            }
            Text("when?").font(.inter(13, 700)).foregroundStyle(RC.ink2)
            VStack(spacing: 6) {
                ForEach(Self.WINDOWS, id: \.id) { w in
                    StrictChip(label: w.label, on: when == w.id) { when = w.id }
                }
            }
            Text(days == 0
                 ? "no end date — it stays on until you turn it off, and that takes 24 hours."
                 : "this starts the second you tap. turning it back off takes 24 hours.")
                .font(.inter(12, 600))
                .foregroundStyle(RC.ink2)
            Button {
                picking = false
                onTurnOn(days, when)
            } label: {
                Text("lock it down")
                    .font(.fredoka(17, 600))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .background(Capsule().fill(RC.ink))
                    .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
            }
            .buttonStyle(.tap)
            .padding(.top, 2)
        }
    }
}

/// a full-width row with a tick (StrictCard.jsx `chip` + `tick`)
private struct StrictChip: View {
    let label: String
    let on: Bool
    let action: () -> Void

    var body: some View {
        let shape = RoundedRectangle(cornerRadius: 16, style: .continuous)
        Button(action: action) {
            HStack(spacing: 10) {
                ZStack {
                    if on {
                        Circle().fill(.white)
                        Text("✓").font(.fredoka(13, 700)).foregroundStyle(RC.ink)
                    } else {
                        Circle().strokeBorder(Color.rgba(18, 48, 26, 0.3), lineWidth: 2)
                    }
                }
                /* content-box: the off ring's 2px border sits outside its 20px */
                .frame(width: on ? 20 : 24, height: on ? 20 : 24)
                .accessibilityHidden(true)
                Text(label).font(.fredoka(16, 600))
                Spacer(minLength: 0)
            }
            .foregroundStyle(on ? .white : RC.ink)
            .padding(.horizontal, 16 + 2)
            .frame(maxWidth: .infinity, minHeight: 48)
            .background(shape.fill(on ? RC.ink : Color.white.opacity(0.9)))
            .overlay(shape.strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// the five things the switch actually changes, normal vs strict
struct StrictBundleTable: View {
    let on: Bool

    private static let BUNDLE: [(what: String, normal: String, strict: String)] = [
        ("opens", "count in halves", "every session costs a whole one"),
        ("loosening a limit", "instant", "takes 24 hours"),
        ("the weekly step-down", "he asks first", "happens by itself"),
        ("borrowing from tomorrow", "available", "off"),
        ("the wait before an app opens", "about \(Limits.WAIT_NORMAL) seconds", "about \(Limits.WAIT_STRICT) seconds"),
    ]
    private static let faded = Color.rgba(61, 90, 70, 0.55)

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            row(Color.clear.frame(height: 1),
                Text("normal").font(.inter(11, 700)).tracking(0.66).foregroundStyle(RC.ink3),
                Text("strict").font(.inter(11, 700)).tracking(0.66)
                    .foregroundStyle(on ? Color(hex: "#1F6B2E") : RC.ink3))
                .textCase(.uppercase)
                .accessibilityHidden(true)   // each row says normal / strict itself
                .padding(.bottom, 5)
                .overlay(alignment: .bottom) { Rectangle().fill(Color.rgba(18, 48, 26, 0.14)).frame(height: 1.5) }

            ForEach(Self.BUNDLE, id: \.what) { r in
                row(Text(r.what).font(.inter(12.5, 700)).webLineHeight(12.5, 1.3).foregroundStyle(RC.ink),
                    Text(r.normal).font(.inter(12, 600)).webLineHeight(12, 1.3)
                        .foregroundStyle(on ? Self.faded : RC.ink3),
                    Text(r.strict).font(.inter(12, 600)).webLineHeight(12, 1.3)
                        .foregroundStyle(on ? RC.ink : Self.faded))
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(r.what). normal: \(r.normal). strict: \(r.strict).")
                    .padding(.vertical, 7)
                    .overlay(alignment: .bottom) { Rectangle().fill(Color.rgba(18, 48, 26, 0.07)).frame(height: 1) }
            }

            Text("your emergency pass works in both. making a limit stricter is instant in both.")
                .font(.inter(12, 600))
                .foregroundStyle(RC.ink2)
                .padding(.top, 7)
        }
    }

    /// grid-template-columns: 1.25fr 1fr 1fr, gap 6
    private func row<A: View, B: View, C: View>(_ a: A, _ b: B, _ c: C) -> some View {
        ThreeColumns(spacing: 6, weights: [1.25, 1, 1]) { a; b; c }
    }
}

/// a row split into fractional columns, each top-aligned and wrapping
struct ThreeColumns: Layout {
    var spacing: CGFloat
    var weights: [CGFloat]

    private func widths(_ total: CGFloat) -> [CGFloat] {
        let free = max(0, total - spacing * CGFloat(weights.count - 1))
        let sum = weights.reduce(0, +)
        return weights.map { free * $0 / sum }
    }

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let total = proposal.width ?? 300
        let w = widths(total)
        var h: CGFloat = 0
        for (i, v) in subviews.enumerated() where i < w.count {
            h = max(h, v.sizeThatFits(ProposedViewSize(width: w[i], height: nil)).height)
        }
        return CGSize(width: total, height: h)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let w = widths(bounds.width)
        var x = bounds.minX
        for (i, v) in subviews.enumerated() where i < w.count {
            v.place(at: CGPoint(x: x, y: bounds.minY), anchor: .topLeading,
                    proposal: ProposedViewSize(width: w[i], height: nil))
            x += w[i] + spacing
        }
    }
}

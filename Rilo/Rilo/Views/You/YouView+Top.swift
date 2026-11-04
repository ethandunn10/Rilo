import SwiftUI

/// You.jsx, top of the list: the "you" group (level card + stats) and
/// "how it looks" (the app theme).
extension YouView {
    @ViewBuilder var topPart: some View {
        YouSection(title: "you", first: true)
        levelCard
        stats
        YouSection(title: "how it looks")
        themeCard.id("theme")
    }

    // MARK: level + xp + current rilo

    private var levelCard: some View {
        let prog = Levels.levelProgress(state.xp, state.level)
        let xpLine = prog.atMax || prog.next == nil
            ? "\(state.xp) xp · max level"
            : "\(state.xp) / \(prog.next ?? 0) xp"
        return HStack(alignment: .center, spacing: 10) {
            RiloView(skin: state.chosenRilo, mood: "coach", size: 76, talks: true)
            VStack(alignment: .leading, spacing: 6) {
                Text("level \(state.level)")
                    .font(.fredoka(22, 700))
                YouXpBar(pct: prog.pct)
                Text("\(xpLine) · \(Levels.skinInfo(state.chosenRilo).name) rilo")
                    .font(.inter(13, 600))
                    .foregroundStyle(Color(hex: "#C9E6CE"))
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("level \(state.level), \(Levels.skinInfo(state.chosenRilo).name) rilo")
            .accessibilityValue(prog.atMax || prog.next == nil ? "\(state.xp) xp, max level"
                                : "\(state.xp) of \(prog.next ?? 0) xp, \(prog.pct) percent")
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .foregroundStyle(.white)
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(RC.ink))
        .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 12, blur: 30)
        .rise(0.04, distance: 14, duration: 0.4)
    }

    // MARK: stats

    static func fmtSaved(_ minutes: Double) -> String {
        let mins = Int(minutes)
        if mins < 60 { return "\(mins)m" }
        let h = mins / 60, m = mins % 60
        return m != 0 ? "\(h)h \(m)m" : "\(h)h"
    }

    private var stats: some View {
        HStack(alignment: .top, spacing: 10) {
            YouStat(value: "\(state.streak)", label: "day streak")
            YouStat(value: Self.fmtSaved(state.stats.savedMinutes), label: "time saved")
            YouStat(value: "\(state.stats.saidNo)", label: "times you said no")
        }
        .fixedSize(horizontal: false, vertical: true)
        .rise(0.08, distance: 14, duration: 0.4)
    }

    // MARK: app theme (a Rilo Pro feature; grass is free)

    private var themeCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                Text("app theme").font(.fredoka(19, 600))
                    .accessibilityAddTraits(.isHeader)
                Spacer(minLength: 0)
                Text("rilo pro").font(.inter(12, 700)).foregroundStyle(RC.ink3)
            }
            /* three across, not five */
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 10, alignment: .top), count: 3),
                      alignment: .leading, spacing: 10) {
                ForEach(Themes.all) { t in
                    let open = t.tier == "free" || state.hasPro
                    ThemeSwatch(t: t, on: state.theme == t.id) {
                        if open { state.setThemeTracked(t.id) } else { state.lockedTheme(t.id) }
                    }
                }
            }
        }
        .youCard(0.12)
    }
}

/// You.jsx `Section`: the uppercase group label.
struct YouSection: View {
    let title: String
    var first = false

    var body: some View {
        Text(title.uppercased())
            .font(.inter(12, 700))
            .tracking(12 * 0.09)
            .foregroundStyle(RC.ink2)
            .padding(.leading, 4)
            .accessibilityLabel(title)
            .accessibilityAddTraits(.isHeader)
            .padding(.top, first ? 2 : 14)
            .padding(.bottom, -2)
    }
}

/// the xp bar, filling in from 0 (`fill 1.2s .3s ease-out`)
private struct YouXpBar: View {
    let pct: Int
    @State private var shown = false

    var body: some View {
        GeometryReader { g in
            Capsule()
                .fill(LinearGradient(colors: [RC.greenPale, RC.green], startPoint: .leading, endPoint: .trailing))
                .frame(width: shown ? g.size.width * CGFloat(pct) / 100 : 0, height: 10)
        }
        .frame(height: 10)
        .background(Capsule().fill(Color.white.opacity(0.18)))
        .clipShape(Capsule())
        .onAppear {
            withAnimation(.easeOut(duration: 1.2).delay(0.3)) { shown = true }
        }
    }
}

/// You.jsx `Stat`
private struct YouStat: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.fredoka(24, 700))
                .foregroundStyle(Color(hex: "#1F6B2E"))
            Text(label)
                .font(.inter(12, 700))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
        .padding(.vertical, 12 + 2)
        .padding(.horizontal, 6 + 2)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .sticker(fill: RC.card, radius: 22, drop: 3)
    }
}

/// one theme: the little sky + hills picture, its name, and "pro"
private struct ThemeSwatch: View {
    let t: ThemeInfo
    let on: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 4) {
                let shape = RoundedRectangle(cornerRadius: 14, style: .continuous)
                Canvas { ctx, size in
                    draw(&ctx, size)
                }
                .padding(on ? 3 : 2)   // the svg sits inside the border
                .background(t.skyGradient)
                .clipShape(shape)
                .overlay(shape.strokeBorder(on ? RC.line : Color.rgba(18, 48, 26, 0.25), lineWidth: on ? 3 : 2))
                .background(on ? DropShadowShape(base: shape, drop: 3).fill(RC.line) : nil)
                .aspectRatio(1 / 1.25, contentMode: .fit)
                .frame(maxWidth: .infinity)
                Text(t.name)
                    .font(.fredoka(12, 600))
                    .foregroundStyle(RC.ink)
            }
            .overlay(alignment: .topTrailing) {
                if t.tier == "pro" {
                    Text("pro")
                        .font(.fredoka(9, 600))
                        .foregroundStyle(.white)
                        .padding(.vertical, 1)
                        .padding(.horizontal, 5)
                        .background(Capsule().fill(RC.ink))
                        .padding(4)
                }
            }
        }
        .buttonStyle(.tap)
        .accessibilityLabel("\(t.name) theme\(t.tier == "pro" ? ", rilo pro" : "")")
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    /// the web's `<svg viewBox="0 0 60 75">`
    private func draw(_ ctx: inout GraphicsContext, _ size: CGSize) {
        ctx.scaleBy(x: size.width / 60, y: size.height / 75)
        func circle(_ x: CGFloat, _ y: CGFloat, _ r: CGFloat, _ hex: String) {
            ctx.fill(Path(ellipseIn: CGRect(x: x - r, y: y - r, width: r * 2, height: r * 2)), with: .color(Color(hex: hex)))
        }
        let box = CGRect(x: 0, y: 0, width: 60, height: 75)
        if t.id == "sunset" { circle(38, 50, 14, "#FF8E5E") }
        if t.id != "sunset" { circle(46, 16, 7, t.id == "snow" ? "#FFFFFF" : "#FFE7A0") }
        if t.id == "bamboo" {
            ctx.fill(Path(roundedRect: CGRect(x: 5, y: 14, width: 4, height: 61), cornerRadius: 2), with: .color(Color(hex: "#8CCB78")))
        }
        if t.id == "sakura" {
            ctx.stroke(SVGPath("M-2 10 C14 12 26 18 36 26", w: 60, h: 75).path(in: box),
                       with: .color(Color(hex: "#7A4E3A")), lineWidth: 2.5)
            circle(14, 12, 4, "#FFC2D6")
            circle(28, 20, 4, "#FFC2D6")
        }
        if t.id == "snow" {
            circle(12, 20, 1.8, "#FFFFFF")
            circle(30, 34, 1.5, "#FFFFFF")
            circle(20, 44, 1.6, "#FFFFFF")
        }
        ctx.fill(SVGPath("M0 52 C18 42 36 44 60 50 L60 75 L0 75 Z", w: 60, h: 75).path(in: box), with: .color(t.hills[1]))
        ctx.fill(SVGPath("M0 64 C20 58 40 58 60 62 L60 75 L0 75 Z", w: 60, h: 75).path(in: box), with: .color(t.hills[2]))
    }
}

import SwiftUI

/// Port of app/src/screens/Results.jsx: the hidden tester stats screen.
/// Not a design: it exists so Ethan can read what testers actually tapped.
/// Counts come from UserDefaults via Track (the web's lib/track.js).
/// The web reaches it at /results; here it's `-screen results` (the web's
/// demo panel has no link to it, so neither does ours).
struct ResultsView: View {
    @Environment(AppState.self) private var state
    @State private var data: [String: [String: Int]] = Track.counts()
    @State private var updated: String? = Track.updated()
    @State private var confirmReset = false

    struct Group { let key: String; let title: String; let order: [String] }

    static let GROUPS: [Group] = [
        Group(key: "reason", title: "pop-up reason", order: ["opened it", "i'm bored", "just tired", "never mind"]),
        Group(key: "checkin", title: "check-in (why, and how long)", order: []),
        Group(key: "paywall", title: "paywall", order: ["start free trial", "continue with free"]),
        Group(key: "rilo", title: "rilo previewed", order: [
            "original", "proband", "bamboo", "shades", "beanie",
            "sakura", "studio", "redpanda", "pinkpanda", "gold",
        ]),
        /* free users tapping a locked skin = a would-you-pay signal */
        Group(key: "locked", title: "locked skin tapped (free users)", order: []),
        Group(key: "screentime", title: "screen time permission", order: ["allowed", "denied", "tried again"]),
        Group(key: "strict", title: "strict mode", order: ["not now", "countdown started", "countdown cancelled"]),
        Group(key: "pass", title: "emergency passes (and what for)", order: []),
        Group(key: "borrow", title: "borrowed from tomorrow", order: []),
        Group(key: "session", title: "sessions (length and what they cost)", order: []),
        Group(key: "early", title: "closed an app early", order: []),
        Group(key: "limits", title: "who made the limits", order: []),
        Group(key: "limit", title: "limit changes", order: []),
        Group(key: "stepdown", title: "weekly step-down", order: []),
        Group(key: "demo", title: "demo panel used", order: []),
        Group(key: "day", title: "days", order: ["goal hit", "went over"]),
        Group(key: "week", title: "weeks", order: ["cleared", "repeated"]),
        Group(key: "levelup", title: "level ups", order: []),
    ]

    struct Row: Hashable { let label: String; let n: Int }

    private func rows(_ g: Group) -> (rows: [Row], total: Int) {
        let bucket = data[g.key] ?? [:]
        /* listed order first, then anything unexpected that showed up */
        let extra = bucket.keys.filter { !g.order.contains($0) }.sorted()
        let rows = (g.order + extra)
            .map { Row(label: $0, n: bucket[$0] ?? 0) }
            .filter { $0.n > 0 || g.order.contains($0.label) }
        return (rows, bucket.values.reduce(0, +))
    }

    var body: some View {
        ZStack {
            LinearGradient(stops: [.init(color: Color(hex: "#CBEAF5"), location: 0),
                                   .init(color: Color(hex: "#EEF8EE"), location: 0.6),
                                   .init(color: Color(hex: "#EEF8EE"), location: 1)],
                           startPoint: .top, endPoint: .bottom)
                .ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("test results").font(.fredoka(30, 700))
                        Text("counts from this browser only. \(updated.map { "last tap \(Self.stamp($0))" } ?? "no taps yet")")
                            .font(.inter(14, 600))
                            .foregroundStyle(RC.ink2)
                    }
                    ForEach(Self.GROUPS, id: \.key) { g in
                        let r = rows(g)
                        ResultsGroup(title: g.title, rows: r.rows, total: r.total)
                    }
                    saved
                    buttons.padding(.top, 4)
                }
                .foregroundStyle(RC.ink)
                .padding(.top, WebLayout.top(40))
                .padding(.horizontal, 20)
                .padding(.bottom, 32)
            }
            .defaultScrollAnchor(DemoSeed.flag("-scrollbottom") ? .bottom : .top)
        }
        .alert("Clear the counts and this tester’s saved progress?", isPresented: $confirmReset) {
            Button("Cancel", role: .cancel) {}
            Button("OK", role: .destructive) {
                Track.resetCounts()
                state.startOver()          // clears the saved state too
                state.jump(to: .results)   // the web stays on this screen
                data = Track.counts()
                updated = Track.updated()
            }
        }
    }

    /// the web's `__updated.slice(0, 16).replace('T', ' ')`
    static func stamp(_ iso: String) -> String {
        String(iso.prefix(16)).replacingOccurrences(of: "T", with: " ")
    }

    private func picked(_ obj: [String: Bool]) -> String {
        let on = obj.keys.filter { obj[$0] == true }.sorted()
        return on.isEmpty ? "—" : on.joined(separator: ", ")
    }

    private var saved: some View {
        let opens = state.opens.counts.sorted { $0.key < $1.key }.map { "\($0.key) \($0.value)x" }
        let lines: [(String, String)] = [
            ("name:", state.name.isEmpty ? "—" : state.name),
            ("hobbies + goals:", picked(state.about.on)),
            ("apps watched:", picked(state.apps.on)),
            ("screen time:", "\(JS.num(state.time.now))h now · \(JS.num(state.time.goal))h goal"),
            ("plan tapped:", "\(state.planChoice ?? "not yet") (\(state.plan) price) · \(state.isPro ? "PRO" : "free")"),
            ("xp:", "\(state.xp) · level \(state.level)"),
            ("chosen rilo:", state.chosenRilo),
            ("time saved:", "\(JS.num(state.stats.savedMinutes))m · said no \(state.stats.saidNo)x"),
            ("opens today:", opens.isEmpty ? "—" : opens.joined(separator: ", ")),
        ]
        return VStack(alignment: .leading, spacing: 8) {
            Text("what this tester saved").font(.fredoka(18, 600))
            VStack(alignment: .leading, spacing: 0) {
                ForEach(lines, id: \.0) { l in
                    Text("\(Text(l.0).font(.inter(14, 700))) \(l.1)")
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .font(.inter(14, 600))
            .webLineHeight(14, 1.5)
        }
        .modifier(ResultsCard())
    }

    private var buttons: some View {
        VStack(spacing: 8) {
            PillButton(title: "back to the app", height: 52, fontSize: 18) {
                /* the web reloads "/", which starts at Welcome */
                state.goTo(.welcome, dir: .back)
            }
            Button { confirmReset = true } label: {
                Text("reset counts + saved progress")
                    .font(.fredoka(16, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .overlay(Capsule().strokeBorder(Color.rgba(18, 48, 26, 0.3), lineWidth: 2))
            }
            .buttonStyle(.tap)
        }
    }
}

/// the web's `card` style: translucent white, a pale white outline
struct ResultsCard: ViewModifier {
    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: 22, style: .continuous)
        content
            .padding(.vertical, 14 + 1.5)
            .padding(.horizontal, 16 + 1.5)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(shape.fill(Color.white.opacity(0.75)))
            .overlay(shape.strokeBorder(Color.white.opacity(0.95), lineWidth: 1.5))
    }
}

/// One group: title + "N taps", then a bar per answer.
struct ResultsGroup: View {
    let title: String
    let rows: [ResultsView.Row]
    let total: Int

    var body: some View {
        let max = Swift.max(1, rows.map(\.n).max() ?? 0)
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .firstTextBaseline) {
                Text(title).font(.fredoka(18, 600))
                Spacer(minLength: 8)
                Text("\(total) taps").font(.inter(13, 700)).foregroundStyle(RC.ink3)
            }
            if total == 0 {
                Text("nothing yet.").font(.inter(14, 600)).foregroundStyle(RC.ink3)
            }
            ForEach(rows, id: \.self) { r in
                VStack(alignment: .leading, spacing: 3) {
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text(r.label).font(.inter(14, 600))
                        Spacer(minLength: 0)
                        Text("\(Text("\(r.n)").font(.inter(14, 700)).foregroundStyle(RC.ink))\(total > 0 ? " · \(JS.roundInt(Double(r.n) / Double(total) * 100))%" : "")")
                            .font(.inter(14, 600))
                            .foregroundStyle(RC.ink3)
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color.rgba(18, 48, 26, 0.08))
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient(colors: [RC.green, RC.greenDeep], startPoint: .leading, endPoint: .trailing))
                                .frame(width: geo.size.width * CGFloat(r.n) / CGFloat(max))
                        }
                    }
                    .frame(height: 8)
                    .clipShape(RoundedRectangle(cornerRadius: 4))
                }
            }
        }
        .modifier(ResultsCard())
    }
}

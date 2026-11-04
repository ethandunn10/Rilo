import SwiftUI

/// Port of app/src/components/ChipPicker.jsx — the hobbies + goals chip
/// cards. Shared by the You screen (and anything else that edits `about`):
/// tap to toggle, "show more" to expand the rest, "+ add your own" with
/// type-ahead, and a × on chips you added yourself.
///
/// The web takes a `cardStyle(delay)` function; here that is `card`, which
/// wraps each card's content (default = You.jsx's `chipCard`).
struct ChipPicker: View {
    @Binding var about: About
    var card: (AnyView, Double) -> AnyView = { content, delay in
        AnyView(content.modifier(ChipCard(delay: delay)))
    }

    enum Kind: String { case hobby, goal }

    @State private var adding: Kind? = nil
    @State private var draft = ""
    @State private var expanded: [Kind: Bool] = [.hobby: false, .goal: false]

    var body: some View {
        cardFor(.hobby, title: "what are you into?", delay: 0.1, placeholder: "e.g. fishing", inputLabel: "New hobby")
        cardFor(.goal, title: "what are you working toward?", delay: 0.2, placeholder: "e.g. make varsity", inputLabel: "New goal")
    }

    // MARK: rules (same as the web)

    private func list(_ k: Kind) -> [String] { k == .hobby ? Profile.HOBBIES : Profile.GOALS }
    private func shownCount(_ k: Kind) -> Int { k == .hobby ? Profile.HOBBIES_SHOWN : Profile.GOALS_SHOWN }
    private func extras(_ k: Kind) -> [String] { k == .hobby ? about.extra.hobby : about.extra.goal }
    private func isOn(_ label: String) -> Bool { about.on[label] ?? false }

    private func toggle(_ label: String) { about.on[label] = !isOn(label) }

    private func removeCustom(_ k: Kind, _ label: String) {
        var next = about
        next.on.removeValue(forKey: label)
        if k == .hobby { next.extra.hobby.removeAll { $0 == label } } else { next.extra.goal.removeAll { $0 == label } }
        about = next
    }

    private func turnOn(_ label: String) {
        about.on[label] = true
        adding = nil
        draft = ""
    }

    /// Typing an option that already exists turns that one on rather than
    /// making a duplicate chip.
    private func commit() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !text.isEmpty, let k = adding else {
            adding = nil
            draft = ""
            return
        }
        let builtIn = list(k)
        if builtIn.contains(text) || extras(k).contains(text) {
            if let i = builtIn.firstIndex(of: text), i >= shownCount(k) { expanded[k] = true }
            turnOn(text)
            return
        }
        var next = about
        next.on[text] = true
        if k == .hobby { next.extra.hobby.append(text) } else { next.extra.goal.append(text) }
        about = next
        adding = nil
        draft = ""
    }

    private func suggestFor(_ k: Kind) -> [String] {
        let q = draft.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if q.isEmpty { return [] }
        return Array(list(k).filter { $0.contains(q) && !isOn($0) }.prefix(6))
    }

    private func pickSuggestion(_ k: Kind, _ label: String) {
        if let i = list(k).firstIndex(of: label), i >= shownCount(k) { expanded[k] = true }
        turnOn(label)
    }

    // MARK: views

    private func cardFor(_ k: Kind, title: String, delay: Double, placeholder: String, inputLabel: String) -> some View {
        let all = list(k)
        let open = expanded[k] ?? false
        /* always show anything switched on, even if it lives behind "show more" */
        let visible = open ? all : all.enumerated().filter { $0.offset < shownCount(k) || isOn($0.element) }.map(\.element)
        let hidden = all.count - visible.count

        let content = VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.fredoka(19, 600))
                .foregroundStyle(RC.ink)
            ChipFlow(spacing: 7) {
                ForEach(visible, id: \.self) { x in
                    PickChip(label: x, on: isOn(x)) { toggle(x) }
                }
                ForEach(extras(k), id: \.self) { x in
                    CustomChip(label: x, on: isOn(x), onPick: { toggle(x) }, onRemove: { removeCustom(k, x) })
                }
                if hidden > 0 {
                    GhostChip(label: "show more (\(hidden))") { expanded[k] = true }
                }
                if open {
                    GhostChip(label: "show less") { expanded[k] = false }
                }
                GhostChip(label: "+ add your own", dashed: true) {
                    adding = k
                    draft = ""
                }
            }
            if adding == k {
                AddRow(label: inputLabel, placeholder: placeholder, draft: $draft, commit: commit,
                       matches: suggestFor(k), onSuggest: { pickSuggestion(k, $0) })
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)

        return card(AnyView(content), delay)
    }
}

/// You.jsx `chipCard(delay)`: padding 16, radius 26, rgba(255,255,255,.55),
/// ink outline + 4px ink drop, rise14 .4s entry.
struct ChipCard: ViewModifier {
    var delay: Double = 0
    func body(content: Content) -> some View {
        content
            .padding(16)
            .sticker(fill: Color.white.opacity(0.55), radius: 26, drop: 4)
            .rise(delay, distance: 14, duration: 0.4)
    }
}

// MARK: chips

private let chipOnFill = RC.ink
private let chipOffFill = Color.white.opacity(0.85)

private struct PickChip: View {
    let label: String
    let on: Bool
    let onPick: () -> Void

    var body: some View {
        Button(action: onPick) {
            Text(label)
                .font(.fredoka(16, 600))
                .foregroundStyle(on ? .white : RC.ink)
                .padding(.horizontal, 14 + 2)   // css border sits outside the padding
                .frame(minHeight: 44)
                .background(Capsule().fill(on ? chipOnFill : chipOffFill))
                .overlay(Capsule().strokeBorder(on ? RC.ink : .white, lineWidth: 2))
        }
        .buttonStyle(.tap(0.94))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

/// a chip the tester added themselves — toggles, and can be removed
private struct CustomChip: View {
    let label: String
    let on: Bool
    let onPick: () -> Void
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 2) {
            Button(action: onPick) {
                Text(label).font(.fredoka(16, 600))
            }
            .buttonStyle(.tap(0.94))
            .accessibilityAddTraits(on ? .isSelected : [])
            Button(action: onRemove) {
                Text("×")
                    .font(.inter(15, 700))
                    .frame(width: 26, height: 26)
                    .background(Circle().fill(on ? Color.white.opacity(0.22) : Color.rgba(18, 48, 26, 0.1)))
            }
            .buttonStyle(.plainTap)
            .accessibilityLabel("Remove \(label)")
        }
        .foregroundStyle(on ? .white : RC.ink)
        .padding(.leading, 14 + 2)
        .padding(.trailing, 6 + 2)
        .frame(minHeight: 44)
        .background(Capsule().fill(on ? chipOnFill : chipOffFill))
        .overlay(Capsule().strokeBorder(on ? RC.ink : .white, lineWidth: 2))
    }
}

private struct GhostChip: View {
    let label: String
    var dashed = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.fredoka(16, 600))
                .foregroundStyle(RC.ink)
                .padding(.horizontal, 14 + 2)
                .frame(minHeight: 44)
                .overlay(
                    Capsule().strokeBorder(dashed ? RC.ink : Color.rgba(18, 48, 26, 0.35),
                                           style: StrokeStyle(lineWidth: 2, dash: dashed ? [6, 4] : []))
                )
        }
        .buttonStyle(.tap(0.94))
    }
}

private struct AddRow: View {
    let label: String
    let placeholder: String
    @Binding var draft: String
    let commit: () -> Void
    let matches: [String]
    let onSuggest: (String) -> Void
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                TextField(label, text: $draft, prompt: Text(placeholder).foregroundStyle(Color.rgba(18, 48, 26, 0.45)))
                    .font(.inter(16, 600))
                    .foregroundStyle(RC.ink)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled(false)
                    .focused($focused)
                    .onSubmit(commit)
                    .padding(.horizontal, 16)
                    .frame(height: 46)
                    .background(Capsule().fill(.white))
                    .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
                    .accessibilityLabel(label)
                Button(action: commit) {
                    Text("add")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 18)
                        .frame(height: 46)
                        .background(Capsule().fill(RC.ink))
                }
                .buttonStyle(.tap(0.94))
            }

            /* type-ahead: tap one of ours instead of typing it out */
            if !matches.isEmpty {
                ChipFlow(spacing: 7) {
                    ForEach(matches, id: \.self) { m in
                        Button { onSuggest(m) } label: {
                            Text(m)
                                .font(.fredoka(15, 600))
                                .foregroundStyle(RC.ink)
                                .padding(.horizontal, 14)
                                .frame(minHeight: 38)
                                .background(Capsule().fill(Color.white.opacity(0.95)))
                                .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
                        }
                        .buttonStyle(.tap(0.94))
                    }
                }
            }
        }
    }
}

/// `display: flex; flex-wrap: wrap; gap: N` — rows left to right, wrapping.
struct ChipFlow: Layout {
    var spacing: CGFloat = 7

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        let rows = arrange(width: width, subviews: subviews)
        let h = rows.map(\.height).reduce(0, +) + spacing * CGFloat(max(0, rows.count - 1))
        let w = rows.map(\.width).max() ?? 0
        return CGSize(width: proposal.width ?? w, height: h)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var y = bounds.minY
        for row in arrange(width: bounds.width, subviews: subviews) {
            var x = bounds.minX
            for i in row.items {
                let s = subviews[i].sizeThatFits(.unspecified)
                subviews[i].place(at: CGPoint(x: x, y: y + (row.height - s.height) / 2), proposal: ProposedViewSize(s))
                x += s.width + spacing
            }
            y += row.height + spacing
        }
    }

    private struct Row { var items: [Int] = []; var width: CGFloat = 0; var height: CGFloat = 0 }

    private func arrange(width: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = []
        var cur = Row()
        for i in subviews.indices {
            let s = subviews[i].sizeThatFits(.unspecified)
            let add = cur.items.isEmpty ? s.width : cur.width + spacing + s.width
            if !cur.items.isEmpty && add > width {
                rows.append(cur)
                cur = Row()
            }
            cur.width = cur.items.isEmpty ? s.width : cur.width + spacing + s.width
            cur.height = max(cur.height, s.height)
            cur.items.append(i)
        }
        if !cur.items.isEmpty { rows.append(cur) }
        return rows
    }
}

import SwiftUI

/// WhyOpen.jsx `pill(on)`: a two-line option, ink when picked.
struct WhyOpenPill: View {
    let title: String
    var sub: String? = nil
    var on = false
    var minHeight: CGFloat = 54
    var centered = false
    var enabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: centered ? .center : .leading, spacing: 0) {
                Text(title)
                    .font(.fredoka(17, 600))
                if let sub {
                    Text(sub)
                        .font(.inter(12, 600))
                        .opacity(0.75)
                }
            }
            .foregroundStyle(on ? .white : RC.ink)
            .multilineTextAlignment(centered ? .center : .leading)
            .padding(.vertical, 8 + 2)
            .padding(.horizontal, 16 + 2)
            .frame(maxWidth: .infinity, minHeight: minHeight, alignment: centered ? .center : .leading)
            .background(RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(on ? RC.ink : Color.white.opacity(0.92)))
            .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous)
                .strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .disabled(!enabled)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(A11ySpeak.text(title) + (sub.map { ", " + A11ySpeak.text($0) } ?? ""))
        .accessibilityAddTraits(on ? [.isButton, .isSelected] : .isButton)
    }
}

/// stage 'reason': the check-in reasons
struct WhyOpenReasons: View {
    @Environment(AppState.self) private var state
    let selected: String
    let onPick: (CheckinReason) -> Void

    var body: some View {
        VStack(spacing: 7) {
            ForEach(Addons.checkinReasons(state.about.creator)) { r in
                WhyOpenPill(title: r.label, sub: r.sub, on: selected == r.id) { onPick(r) }
            }
        }
    }
}

/// stage 'what': "i need to post" has to be said out loud
struct WhyOpenWhat: View {
    let reason: String
    @Binding var why: String
    let onDone: () -> Void
    @FocusState private var focused: Bool

    var body: some View {
        let has = !why.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        VStack(alignment: .leading, spacing: 9) {
            Text(reason == "post" ? "what are you posting?" : "what for?")
                .font(.fredoka(19, 600))
                .accessibilityAddTraits(.isHeader)
            TextField("", text: $why, prompt: Text(reason == "post" ? "the video i filmed, the photo from…" : "say what for…")
                .foregroundStyle(Color(hex: "#757575")))
                .font(.inter(16, 600))
                .foregroundStyle(RC.ink)
                .focused($focused)
                .accessibilityLabel(reason == "post" ? "what are you posting?" : "what for?")
                .padding(.horizontal, 18 + 2)
                .frame(height: 50)
                .background(Capsule().fill(.white))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
            WhyOpenPill(title: "that's what i'm doing", minHeight: 50, centered: true, enabled: has, action: onDone)
                .opacity(has ? 1 : 0.45)
        }
        .onAppear {
            #if DEBUG
            /* screenshots with -why show the step without the keyboard */
            if DemoSeed.arg("-why") != nil { return }
            #endif
            focused = true
        }
    }
}

/// stage 'push': the argument. Everything he knows about them, spent here.
struct WhyOpenPush: View {
    let app: String
    let argument: PushBack
    let onInstead: (PushBackOption) -> Void
    let onAnyway: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Text(argument.lead)
                .font(.fredoka(21, 600))
                .webLineHeight(21, 1.25)
                .fixedSize(horizontal: false, vertical: true)

            ForEach(argument.options) { o in
                WhyOpenPill(title: o.label, sub: o.sub) { onInstead(o) }
            }

            /* he argues once, then gets out of the way — readably */
            Button(action: onAnyway) {
                Text("no, open \(app) anyway")
                    .font(.fredoka(16, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, minHeight: 50)
                    .capsuleSticker(fill: Color.white.opacity(0.92), drop: 3)
            }
            .buttonStyle(.tap)
        }
    }
}

/// stage 'length': quick (½ open) or full (1 open)
struct WhyOpenLength: View {
    let picked: String
    let half: Double
    let minutes: Int
    let canQuick: Bool
    let canFull: Bool
    let strictOn: Bool
    let onPick: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 11) {
            Text("how long do you need?")
                .accessibilityAddTraits(.isHeader)
                .font(.inter(13, 700))
                .foregroundStyle(RC.ink2)
                .padding(.top, 2)

            VStack(spacing: 7) {
                choice("quick", "quick", "½ open · \(WhyOpenView.mins(half))", canQuick)
                choice("full", "full", "1 open · \(WhyOpenView.mins(Double(minutes)))", canFull)
            }

            Text(note)
                .font(.inter(12, 600))
                .webLineHeight(12, 1.35)
                .foregroundStyle(RC.ink2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var note: String {
        if strictOn { return "strict mode: no halves. any session costs a whole open." }
        if !canFull { return "half an open left, so this one maxes out at \(WhyOpenView.mins(half))." }
        return "leave by \(WhyOpenView.mins(half)) and it only costs half an open."
    }

    private func choice(_ id: String, _ title: String, _ sub: String, _ enabled: Bool) -> some View {
        WhyOpenPill(title: title, sub: sub, on: picked == id, minHeight: 58, enabled: enabled) { onPick(id) }
            .opacity(enabled ? 1 : 0.4)
    }
}

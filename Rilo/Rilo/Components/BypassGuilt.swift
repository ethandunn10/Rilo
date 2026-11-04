import SwiftUI

/// Port of app/src/components/BypassGuilt.jsx — the sheet Rilo puts in front
/// of every way around a limit: the emergency pass, borrowing from tomorrow,
/// and loosening anything.
///
/// Three jobs, in this order:
///   1. Say what they told him they'd rather be doing, in their own words.
///   2. Say what this actually costs — a streak, tomorrow's opens, the goal.
///   3. Make them type a reason before it opens.
///
/// Disappointed, never shaming. The reason box is a speed bump, not a lock,
/// and "never mind" is always one tap.
struct BypassGuilt: View {
    var skin: String
    /// 'pass' | 'borrow' | 'loosen'
    var kind: String = "pass"
    var title: String? = nil
    var hobbies: [String] = []
    var goals: [String] = []
    var streak: Int = 0
    var confirmLabel: String = "unlock it"
    var initialReason: String = ""
    /// frost what's behind it; a screen that blurs itself (Intercept) turns this off
    var frost = true
    let onConfirm: (String) -> Void
    let onCancel: () -> Void

    @State private var reason = ""
    @State private var shown = false
    @FocusState private var focused: Bool
    @Environment(\.accessibilityReduceMotion) private var reduce

    static let MIN_REASON = 3

    /// their own onboarding answers, turned into the line
    static func ratherLine(hobbies: [String], goals: [String]) -> String {
        if let hobby = hobbies.first {
            return "you said you'd rather be at \(hobby == "gym" ? "the gym" : hobby) right now."
        }
        if let goal = goals.first { return "you said you wanted to \(goal)." }
        return "you said you wanted less of this."
    }

    /// what it costs them, most painful first
    static func costLine(streak: Int, kind: String) -> String {
        if streak > 1 { return "this breaks your \(streak)-day streak." }
        if kind == "borrow" { return "you get half an open less tomorrow." }
        if kind == "pass" { return "that's your one pass for today." }
        return "your plan gets easier than the one you chose."
    }

    private var trimmed: String { reason.trimmingCharacters(in: .whitespacesAndNewlines) }
    private var ok: Bool { trimmed.count >= Self.MIN_REASON }
    private var on: Bool { shown || reduce }

    var body: some View {
        ZStack {
            /* scrim: rgba(12,30,18,0.45) + backdrop-filter: blur(3px) */
            Rectangle()
                .fill(frost ? AnyShapeStyle(.ultraThinMaterial.opacity(0.35)) : AnyShapeStyle(Color.clear))
                .overlay(Color.rgba(12, 30, 18, 0.45))
                .ignoresSafeArea()
                .opacity(on ? 1 : 0)
                .animation(.easeOut(duration: 0.25), value: shown)

            card
                .frame(maxWidth: 330)
                .padding(20)
                .opacity(on ? 1 : 0)
                .offset(y: on ? 0 : 14)
                .animation(.easeOut(duration: 0.3), value: shown)
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel("rilo has something to say")
        .accessibilityAddTraits(.isModal)
        .onAppear {
            reason = initialReason
            shown = true
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 12) {
                RiloView(skin: skin, mood: "letdown", size: 66, motion: .idle)
                VStack(alignment: .leading, spacing: 4) {
                    Text(title ?? "you can, but…")
                        .font(.fredoka(18, 600))
                        .webLineHeight(18, 1.2)
                    Text(Self.ratherLine(hobbies: hobbies, goals: goals))
                        .font(.inter(13, 600))
                        .webLineHeight(13, 1.35)
                        .foregroundStyle(Color(hex: "#43604D"))
                }
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            /* the price, said once and plainly */
            Text(Self.costLine(streak: streak, kind: kind))
                .font(.inter(13, 700))
                .foregroundStyle(Color(hex: "#9C4518"))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.vertical, 9)
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.rgba(217, 100, 58, 0.10)))

            VStack(alignment: .leading, spacing: 6) {
                Text("tell me why, and it's yours")
                    .font(.inter(12.5, 700))
                    .foregroundStyle(Color(hex: "#43604D"))
                TextField("", text: $reason,
                          prompt: Text("what's going on?").foregroundStyle(Color(hex: "#757575")))
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink)
                    .focused($focused)
                    .submitLabel(.done)
                    .padding(.horizontal, 12 + 1.5)
                    .frame(minHeight: 44)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(.white))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(RC.ink.opacity(0.16), lineWidth: 1.5))
                    .accessibilityLabel("why you need this")
            }

            HStack(spacing: 8) {
                Button(action: onCancel) {
                    Text("never mind")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .overlay(Capsule().strokeBorder(RC.ink.opacity(0.16), lineWidth: 2))
                }
                .buttonStyle(.tap)

                Button { if ok { onConfirm(trimmed) } } label: {
                    Text(confirmLabel)
                        .font(.fredoka(15, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(Capsule().fill(ok ? RC.ink : RC.ink.opacity(0.22)))
                }
                .buttonStyle(.tap(0.94))
                .disabled(!ok)
            }
        }
        .foregroundStyle(RC.ink)
        .padding(.top, 18 + 1.5)
        .padding(.horizontal, 18 + 1.5)
        .padding(.bottom, 16 + 1.5)
        .background(RoundedRectangle(cornerRadius: 26, style: .continuous).fill(RC.card))
        .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous)
            .strokeBorder(RC.ink.opacity(0.12), lineWidth: 1.5))
    }
}

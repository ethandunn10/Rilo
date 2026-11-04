import SwiftUI

/// Intercept.jsx: the headline down to the wait pill.
struct InterceptTop: View {
    let f: InterceptView.Facts
    let countdown: Int
    let ready: Bool

    var body: some View {
        VStack(spacing: 9) {
            Text(headline)
                .accessibilityAddTraits(.isHeader)
                .font(.fredoka(27, 700))
                .webLineHeight(27, 1.15)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            /* §7: kind, not mean. the day is over, midnight is coming. */
            if f.stuck {
                Text("fresh opens at midnight. go do something better.")
                    .font(.fredoka(17, 600))
                    .foregroundStyle(RC.ink2)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            if !subline.isEmpty {
                Text(subline)
                    .accessibilityLabel(A11ySpeak.text(subline))
                    .font(.inter(13.5, 600))
                    .foregroundStyle(RC.ink2)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }

            /* how many times today, and the circles */
            Text("\(f.openCount)\(Self.ordinal(f.openCount)) time today")
                .font(.inter(14, 600))
                .foregroundStyle(RC.ink2)

            if f.limited {
                Opens(total: f.opensTotal, used: f.opensUsed, minutes: f.minutes, align: .center)
                    .padding(.vertical, 9 + 1.5)
                    .padding(.horizontal, 14 + 1.5)
                    .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white.opacity(0.7)))
                    .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .strokeBorder(Color.white.opacity(0.95), lineWidth: 1.5))
            }

            /* the wait */
            if !ready {
                Text("hold on… \(countdown)s")
                    .accessibilityLabel("hold on, \(countdown) seconds")
                    .font(.fredoka(17, 600))
                    .foregroundStyle(.white)
                    .monospacedDigit()
                    .padding(.vertical, 9)
                    .padding(.horizontal, 18)
                    .background(Capsule().fill(RC.ink))
            }
        }
    }

    static func ordinal(_ n: Int) -> String {
        n == 1 ? "st" : n == 2 ? "nd" : n == 3 ? "rd" : "th"
    }

    private var headline: String {
        if f.windowed {
            switch f.lock.kind {
            case "bedtime": return "it’s bedtime"
            case "school": return "school hours"
            default: return "you’re in a focus block"
            }
        }
        if f.blocked { return "\(f.app) is blocked" }
        if f.stuck { return "that’s it for today" }
        if !f.canSpend { return "out of opens for today" }
        return "opening \(f.app)?"
    }

    private var subline: String {
        if f.windowed { return "always-allowed apps still work. so does your pass." }
        if f.blocked { return "no opens on this one. the pass still works." }
        if f.lock.kind == "halfstranded" {
            return "strict mode needs a whole open, and you’ve got \(Limits.fmtOpens(f.opensLeft)) left."
        }
        return ""
    }
}

/// Intercept.jsx: the streak warning, "limit it", and the three ways in.
struct InterceptWays: View {
    @Environment(AppState.self) private var state
    let f: InterceptView.Facts
    let ready: Bool
    @Binding var bypass: String?

    var body: some View {
        VStack(spacing: 8) {
            /* what this open is about to cost them, said before they commit */
            if f.streak >= 2 && f.goalLeft > 0 && f.goalLeft <= 30 {
                Text("\(f.goalLeft) min left today — that's all that's between you and losing a \(f.streak)-day streak.")
                    .font(.inter(13.5, 700))
                    .webLineHeight(13.5, 1.35)
                    .foregroundStyle(Color(hex: "#8F3F15"))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.vertical, 10)
                    .padding(.horizontal, 13)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(Color.rgba(217, 100, 58, 0.12)))
            }

            /* an app with no limit: offer to put one on it */
            if f.unlimited && f.openCount >= 3 {
                Button { state.interceptLimitIt() } label: {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("that's \(f.openCount) times today, and \(f.app) has no limit.")
                            .font(.fredoka(17, 600))
                            .foregroundStyle(RC.ink)
                        Text("want me to put one on it?")
                            .font(.inter(12.5, 600))
                            .foregroundStyle(RC.ink3)
                    }
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.vertical, 12 + 2)
                    .padding(.horizontal, 14 + 2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Color.white.opacity(0.94)))
                    .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }

            /* 1. spend an open — the normal way in, via the check-in (§4) */
            if f.canSpend {
                wide("open it", sub: "i’ll ask what for, then how long") {
                    state.interceptReason("opened it")
                    state.go(.whyopen)
                }
            }

            /* 2. the emergency pass (§5) */
            if !f.canSpend && f.passesLeft > 0 {
                wide("emergency pass · \(JS.num(Limits.PASS_MINUTES)) min", sub: "one a day. this is it.") {
                    bypass = "pass"
                }
            }

            /* 3. borrow half an open off tomorrow (§6, normal mode only) */
            if f.canBorrow {
                wide("borrow ½ open from tomorrow",
                     sub: "tomorrow \(f.app) starts \(Limits.fmtOpens(Limits.BORROW_OPENS)) lower. once a day.",
                     dark: false) {
                    bypass = "borrow"
                }
            }
        }
    }

    /// Intercept.jsx wideBtn()
    private func wide(_ title: String, sub: String, dark: Bool = true, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 0) {
                Text(title)
                    .font(.fredoka(18, 600))
                Text(sub)
                    .font(.fredoka(12, 600))
                    .foregroundStyle(dark ? Color.white.opacity(0.8) : RC.ink3)
            }
            .foregroundStyle(dark ? .white : RC.ink)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 6)
            .frame(maxWidth: .infinity, minHeight: 56)
            .background(Capsule().fill(dark ? (ready ? RC.ink : RC.ink.opacity(0.35)) : Color.white.opacity(0.92)))
            .overlay(dark ? nil : Capsule().strokeBorder(RC.ink, lineWidth: 2))
            .opacity(ready ? 1 : 0.75)
        }
        .buttonStyle(.tap)
        .disabled(!ready)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(A11ySpeak.text(title) + ", " + A11ySpeak.text(sub))
        .accessibilityAddTraits(.isButton)
    }
}

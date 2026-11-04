import SwiftUI

/* One app's card on "your limits" (Limits.jsx LimitCard + Stepper).

   Two settings, not four: "always allowed" and "free forever" both meant
   "this app is not really in the plan", which picking your apps already
   decides. So the only question here is blocked outright or on a limit.
   Tapping the one that's on turns it off (free, no cap), rather than
   switching to the other; that's a second, separate tap. */

struct LimitCard: View {
    let app: String
    let setting: AppSetting
    let usedOpens: Double
    let totalOpens: Double
    let pendingFor: [PendingChange]
    let onSet: (AppSetting) -> Void
    let onCancelPending: (String) -> Void
    let delay: Double

    /// blocked or limited (EDITABLE_MODES); turning the chosen one off is FREE
    private static let EDITABLE: [AppMode] = [.blocked, .limited]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 10) {
                AppLogo(label: app, size: 38, radius: 12)
                Text(app)
                    .font(.fredoka(19, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityAddTraits(.isHeader)
            }

            VStack(spacing: 7) {
                ForEach(Self.EDITABLE, id: \.self) { m in
                    modeChip(m)
                }
            }

            if setting.mode == .limited {
                /* the circles, exactly as they appear on Rilo's pop-up (§3) */
                Opens(total: totalOpens, used: usedOpens, minutes: setting.minutes, note: false)

                LimitStepper(
                    label: "opens a day",
                    value: Limits.fmtOpens(setting.opens),
                    atMin: setting.opens <= Limits.MIN_OPENS,
                    atMax: setting.opens >= Limits.MAX_OPENS,
                    onLess: { onSet(with { $0.opens -= Limits.OPEN_STEP }) },
                    onMore: { onSet(with { $0.opens += Limits.OPEN_STEP }) }
                )
                LimitStepper(
                    label: "minutes per open",
                    value: "\(setting.minutes)m",
                    atMin: setting.minutes <= Limits.MIN_MINUTES,
                    atMax: setting.minutes >= Limits.MAX_MINUTES,
                    onLess: { onSet(with { $0.minutes -= Limits.MINUTE_STEP }) },
                    onMore: { onSet(with { $0.minutes += Limits.MINUTE_STEP }) }
                )
            }

            /* a loosening change waiting out its 24 hours in strict mode (§12) */
            ForEach(pendingFor, id: \.id) { p in
                pendingRow(p)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .limitsCard(delay: delay)
    }

    private func with(_ change: (inout AppSetting) -> Void) -> AppSetting {
        var next = setting
        change(&next)
        return next
    }

    private func modeChip(_ m: AppMode) -> some View {
        let on = setting.mode == m
        let shape = RoundedRectangle(cornerRadius: 18, style: .continuous)
        return Button {
            onSet(with { $0.mode = on ? .free : m })
        } label: {
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
                Text(Limits.MODE_LABEL[m] ?? m.rawValue)
                    .font(.fredoka(16, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .foregroundStyle(on ? .white : RC.ink)
            .padding(.vertical, 8 + 2)
            .padding(.horizontal, 16 + 2)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(shape.fill(on ? RC.ink : Color.white.opacity(0.9)))
            .overlay(shape.strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap)
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    private func pendingRow(_ p: PendingChange) -> some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 0) {
                Text(p.label)
                    .font(.fredoka(14, 600))
                Text("pending · lands in \(Limits.countdownText(p.at))")
                    .font(.inter(12, 600))
                    .foregroundStyle(Color(hex: "#9FD8A9"))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityElement(children: .combine)
            Button { onCancelPending(p.id) } label: {
                Text("cancel")
                    .font(.fredoka(13, 600))
                    .padding(.horizontal, 12 + 2)
                    .frame(minHeight: 32)
                    .overlay(Capsule().strokeBorder(.white, lineWidth: 2))
            }
            .buttonStyle(.tap)
        }
        .foregroundStyle(.white)
        .padding(.vertical, 8)
        .padding(.horizontal, 10)
        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(RC.ink))
    }
}

/// Limits.jsx `Stepper`: label on the left, − value + on the right.
struct LimitStepper: View {
    let label: String
    let value: String
    let atMin: Bool
    let atMax: Bool
    let onLess: () -> Void
    let onMore: () -> Void

    var body: some View {
        HStack(spacing: 8) {
            Text(label)
                .font(.inter(13, 700))
                .foregroundStyle(RC.ink2)
                .accessibilityHidden(true)
            Spacer(minLength: 0)
            HStack(spacing: 6) {
                stepButton("−", disabled: atMin, a11y: "fewer \(label)", action: onLess)
                Text(value)
                    .font(.fredoka(19, 700))
                    .foregroundStyle(Color(hex: "#1F6B2E"))
                    .frame(minWidth: 58)
                    .accessibilityLabel("\(label), \(A11ySpeak.text(value))")
                stepButton("+", disabled: atMax, a11y: "more \(label)", action: onMore)
            }
        }
    }

    /* the web's −/+ are plain <button> text, so they're the system font */
    private func stepButton(_ glyph: String, disabled: Bool, a11y: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(glyph)
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(RC.ink)
                .frame(width: 36, height: 36)
                .background(Circle().fill(.white))
                .overlay(Circle().strokeBorder(RC.line, lineWidth: 2))
        }
        .buttonStyle(.tap(0.92))
        .disabled(disabled)
        .opacity(disabled ? 0.35 : 1)
        .accessibilityLabel(a11y)
    }
}

import SwiftUI

/// Port of app/src/components/StepDown.jsx: the weekly step-down (§11).
///
/// Once a week Rilo tightens ONE thing (a few fewer minutes per open, or one
/// fewer open) on whichever Limited or Free app is eating the biggest share.
/// In normal mode it's a suggestion they accept or skip. In strict mode it
/// happens by itself; they can still swap the app, and skipping waits 24h.
///
/// The web's `style` prop is the container (padding, background, border):
/// here the caller wraps this view in its own container. `spacing` is that
/// container's `gap` (Home passes 9). The struct is `StepDownCard` because
/// `StepDown` is already the model (Limits.StepDown).
struct StepDownCard: View {
    var skin: String = "original"
    /// the app it's aimed at, and what it would do
    var app: String?
    var step: StepDown?
    /// "preview" (a day ahead) | "offered" (this week's)
    var phase: String = "offered"
    var strictOn = false
    /// other apps they could point it at instead
    var swappable: [String] = []
    /// set when they skipped in strict mode and it's waiting out its 24h
    var skipAt: Double? = nil
    var done = false
    var spacing: CGFloat = 9
    var onAccept: () -> Void = {}
    var onSkip: () -> Void = {}
    var onSwap: (String) -> Void = { _ in }

    var body: some View {
        if done {
            doneRow
        } else if let app, let step {
            offer(app, step)
        }
    }

    /// the plan fits and they're living in it: nothing left to tighten
    private var doneRow: some View {
        HStack(alignment: .center, spacing: 10) {
            RiloView(skin: skin, mood: "proud", size: 58, talks: true)
            VStack(alignment: .leading, spacing: 2) {
                Text("no more stepping down")
                    .font(.fredoka(18, 600))
                Text("your limits fit your goal and you\u{2019}re hitting it. this is the plan now.")
                    .font(.inter(13, 600))
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .foregroundStyle(RC.ink)
    }

    private func offer(_ app: String, _ step: StepDown) -> some View {
        VStack(alignment: .leading, spacing: spacing) {
            HStack(alignment: .center, spacing: 10) {
                RiloView(skin: skin, mood: phase == "preview" ? "curious" : "coach", size: 58, talks: true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(phase == "preview" ? "HEADS UP · TOMORROW" : "THIS WEEK\u{2019}S STEP DOWN")
                        .font(.inter(11, 700))
                        .tracking(11 * 0.08)
                        .foregroundStyle(RC.ink2)
                    Text(Limits.stepDownLine(app, step))
                        .font(.fredoka(18, 600))
                        .webLineHeight(18, 1.25)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            // strict mode: it lands either way, so say that plainly
            Text(strictOn
                 ? "strict mode, so this happens by itself. you can move it to another app, and skipping it waits 24 hours."
                 : "one thing a week. accept it, skip it, or move it somewhere else.")
                .font(.inter(12.5, 600))
                .foregroundStyle(RC.ink2)
                .webLineHeight(12.5, 1.35)
                .fixedSize(horizontal: false, vertical: true)

            // skipped in strict mode, waiting out the 24 hours
            if let skipAt {
                Text("skip pending · it stops in \(Limits.countdownText(skipAt))")
                    .font(.fredoka(13.5, 600))
                    .foregroundStyle(.white)
                    .padding(.vertical, 8)
                    .padding(.horizontal, 12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(RC.ink))
            }

            if phase == "offered" {
                HStack(spacing: 8) {
                    if !strictOn {
                        Button(action: onAccept) { btnLabel("accept", primary: true) }
                            .buttonStyle(.tap)
                    }
                    Button(action: onSkip) { btnLabel(strictOn ? "skip it (24h)" : "skip this week", primary: false) }
                        .buttonStyle(.tap)
                }
            }

            // swap which app gets tightened: allowed in both modes
            if !swappable.isEmpty {
                Text("tighten something else instead")
                    .font(.inter(12, 700))
                    .foregroundStyle(RC.ink2)
                    .padding(.top, 2)
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 7) {
                        ForEach(swappable, id: \.self) { other in
                            Button { onSwap(other) } label: {
                                HStack(spacing: 7) {
                                    AppLogo(label: other, size: 30, radius: 9)
                                    Text(other).font(.fredoka(15, 600)).foregroundStyle(RC.ink)
                                }
                                .padding(.leading, 5 + 2)
                                .padding(.trailing, 13 + 2)
                                .padding(.vertical, 4 + 2)
                                .frame(minHeight: 42)
                                .background(Capsule().fill(Color.white.opacity(0.9)))
                                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                            }
                            .buttonStyle(.tap)
                        }
                    }
                    .padding(.bottom, 2)
                }
                /* a sideways scroller would otherwise take all the height offered */
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        .foregroundStyle(RC.ink)
    }

    private func btnLabel(_ title: String, primary: Bool) -> some View {
        Text(title)
            .font(.fredoka(15, 600))
            .foregroundStyle(primary ? Color.white : RC.ink)
            .padding(.horizontal, primary ? 16 : 16 + 2)
            .frame(minHeight: 44)
            .background(Capsule().fill(primary ? RC.ink : Color.clear))
            .overlay(primary ? nil : Capsule().strokeBorder(RC.line, lineWidth: 2))
    }
}

import SwiftUI

/// CalendarConnect.jsx `SystemSheet`: Apple's permission alert, near enough,
/// for the calendar and the other read-only sources. Deliberately not in
/// Rilo's voice: this is the system asking, not him. DEMO ONLY: nothing is
/// connected, OK just flips the demo state.
struct CalendarSystemSheet: View {
    let which: String
    let onAllow: () -> Void
    let onDeny: () -> Void

    @State private var shown = false
    @Environment(\.accessibilityReduceMotion) private var reduce

    /* What Apple's sheet says, per thing being asked for */
    static let SHEET_BODY: [String: String] = [
        "Calendar": "Rilo uses your events to plan around practices, tests and work. It only reads your calendar and never changes it.",
        "Google Calendar": "Rilo uses your events to plan around practices, tests and work. It only reads your calendar and never changes it.",
        "Notes": "Rilo reads your notes to find the things you have already written down to do. It never edits or deletes a note.",
        "Reminders": "Rilo reads your reminders so it can build your day around them. It only reads them and never changes them.",
        "Google Tasks": "Rilo reads your tasks to know what is due. It only reads them and never marks anything complete.",
        "Notion": "Rilo reads the pages you share with it to find your assignments and deadlines. It never edits a page.",
    ]
    static let DEFAULT_BODY = "Rilo only reads this, and never changes anything in it."

    private let hair = Color(.sRGB, red: 60 / 255, green: 60 / 255, blue: 67 / 255, opacity: 0.29)
    private let blue = Color(hex: "#007AFF")

    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()
                .opacity(shown ? 1 : 0)
                .animation(.easeOut(duration: 0.25), value: shown)

            VStack(spacing: 10) {
                alert
                    .opacity(shown ? 1 : 0)
                    .scaleEffect(shown ? 1 : 0.9)
                    .animation(.timingCurve(0.2, 0.9, 0.3, 1.1, duration: 0.22), value: shown)
                pointer
                    .opacity(shown ? 1 : 0)
                    .animation(.easeOut(duration: 0.25), value: shown)
            }
        }
        .onAppear { shown = true }
    }

    private var alert: some View {
        VStack(spacing: 0) {
            VStack(spacing: 4) {
                Text("\u{201C}Rilo\u{201D} Would Like to Access Your \(which)")
                    .font(.system(size: 17, weight: .semibold))
                    .webLineHeight(17, 1.3)
                Text(Self.SHEET_BODY[which] ?? Self.DEFAULT_BODY)
                    .font(.system(size: 13))
                    .foregroundStyle(Color(hex: "#1C1C1E"))
                    .webLineHeight(13, 1.33)
            }
            .foregroundStyle(.black)
            .multilineTextAlignment(.center)
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 19)
            .padding(.horizontal, 16)
            .padding(.bottom, 15)

            hair.frame(height: 1)

            HStack(spacing: 0) {
                Button(action: onDeny) {
                    Text("Don't Allow")
                        .font(.system(size: 17))
                        .foregroundStyle(blue)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plainTap)
                hair.frame(width: 1, height: 44)
                Button(action: onAllow) {
                    Text("OK")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(blue)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                }
                .buttonStyle(.plainTap)
            }
        }
        .frame(width: 270)
        .background(Color(.sRGB, red: 250 / 255, green: 250 / 255, blue: 250 / 255, opacity: 0.94))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .contain)
        .accessibilityLabel("\(which) permission")
    }

    /* same nudge as the screen time sheet */
    private var pointer: some View {
        HStack(spacing: 0) {
            Color.clear.frame(maxWidth: .infinity, maxHeight: 1)
            VStack(spacing: 2) {
                TimelineView(.animation(paused: reduce)) { ctx in
                    let p = Motion.phase(ctx.date.timeIntervalSinceReferenceDate, period: 1.1)
                    let k = Motion.keyframes([(0, 0), (0.5, 1), (1, 0)], p, ease: Motion.easeInOut)
                    Text("\u{2191}")
                        .font(.system(size: 30))
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.45), radius: 3, y: 2)
                        .offset(y: reduce ? 0 : -7 * k)
                }
                .frame(height: 30)
                Text("tap here")
                    .font(.fredoka(14, 600))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .fixedSize()
                    .padding(.vertical, 6)
                    .padding(.horizontal, 12)
                    .background(Capsule().fill(RC.ink))
            }
            .frame(maxWidth: .infinity)
        }
        .frame(width: 270)
        .accessibilityHidden(true)
    }
}

import ActivityKit
import SwiftUI
import WidgetKit

/// The open's timer on the Lock Screen and in the Dynamic Island:
/// "instagram · 9:42 left" with Rilo. Started by the shield or by Rilo
/// (RiloShared.swift, RiloLiveActivity). Tapping it opens Rilo, which lands
/// on the relock screen ("done? relock it") while the open is running.
/// The countdown is drawn by iOS (Text(timerInterval:)), so it ticks with
/// Rilo closed; at the end time it goes stale and says "time's up".
struct RiloSessionLiveActivity: Widget {
    private static let ink = Color(red: 0x12 / 255, green: 0x30 / 255, blue: 0x1A / 255)
    private static let ink2 = Color(red: 0x2C / 255, green: 0x4A / 255, blue: 0x36 / 255)
    private static let cream = Color(red: 0xFF / 255, green: 0xFB / 255, blue: 0xF1 / 255)
    private static let green = Color(red: 0x7E / 255, green: 0xD9 / 255, blue: 0x57 / 255)

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: RiloSessionAttributes.self) { context in
            /* Lock Screen / banner: cream card, dark text */
            HStack(spacing: 12) {
                rilo(context, size: 52)
                VStack(alignment: .leading, spacing: 2) {
                    line(context, big: true)
                        .foregroundStyle(Self.ink)
                    Text(context.isStale ? "rilo locked it again." : "tap when you're done to relock it.")
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(Self.ink2)
                }
                Spacer(minLength: 0)
            }
            .padding(16)
            .activityBackgroundTint(Self.cream)
            .activitySystemActionForegroundColor(Self.ink)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) { rilo(context, size: 44) }
                DynamicIslandExpandedRegion(.center) {
                    line(context, big: true).foregroundStyle(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.isStale ? "rilo locked it again." : "tap when you're done to relock it.")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(.white.opacity(0.8))
                }
            } compactLeading: {
                rilo(context, size: 22)
            } compactTrailing: {
                timer(context)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(Self.green)
                    .frame(maxWidth: 52)
            } minimal: {
                rilo(context, size: 20)
            }
        }
    }

    private func rilo(_ context: ActivityViewContext<RiloSessionAttributes>, size: CGFloat) -> some View {
        let skin = context.attributes.skin
        let img = UIImage(named: "rilo-\(skin)-coach") ?? UIImage(named: "rilo-original-coach")
        return Group {
            if let img { Image(uiImage: img).resizable().scaledToFit() } else { Color.clear }
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }

    /// "instagram · 9:42 left" (or "time's up on instagram")
    private func line(_ context: ActivityViewContext<RiloSessionAttributes>, big: Bool) -> some View {
        let label = context.attributes.label
        return Group {
            if context.isStale || context.state.endsAt <= Date() {
                Text("time's up on \(label)")
            } else {
                HStack(spacing: 0) {
                    Text("\(label) · ")
                    timer(context)
                    Text(" left")
                }
            }
        }
        .font(.system(size: big ? 19 : 15, weight: .bold, design: .rounded))
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }

    private func timer(_ context: ActivityViewContext<RiloSessionAttributes>) -> some View {
        let now = Date()
        let end = max(now, context.state.endsAt)
        return Text(timerInterval: now...end, countsDown: true)
            .monospacedDigit()
    }
}

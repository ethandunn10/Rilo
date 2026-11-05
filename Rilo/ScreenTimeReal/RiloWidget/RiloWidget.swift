import WidgetKit
import SwiftUI

/// Target: RiloWidget (Widget Extension). Also needs Shared/AppGroup.swift and
/// Shared/RiloShared.swift (NOT RiloTokens.swift), and the Rilo images
/// rilo-<skin>-<mood> (tick the app's Assets.xcassets for this target too).
///
/// Rilo's face + today's mood, small and medium. The app writes the snapshot
/// (FamilyControlsScreenTimeService.updateWidget) from AppState.riloMood /
/// riloNote whenever they change, and asks WidgetKit to reload.
struct RiloEntry: TimelineEntry {
    let date: Date
    let snap: WidgetSnapshot
}

struct RiloProvider: TimelineProvider {
    func placeholder(in context: Context) -> RiloEntry { RiloEntry(date: Date(), snap: .placeholder) }

    func getSnapshot(in context: Context, completion: @escaping (RiloEntry) -> Void) {
        completion(RiloEntry(date: Date(), snap: context.isPreview ? .placeholder : current()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RiloEntry>) -> Void) {
        /* the app reloads it when the mood changes; midnight is a fresh day */
        let midnight = Calendar.current.startOfDay(for: Date().addingTimeInterval(86_400))
        completion(Timeline(entries: [RiloEntry(date: Date(), snap: current())], policy: .after(midnight)))
    }

    /// A snapshot from yesterday means nothing's been used today yet:
    /// Addons.moodForUsage(used: 0) is "proud" / "under your goal".
    private func current() -> WidgetSnapshot {
        guard var snap = RiloShared.widget else { return .placeholder }
        if snap.dateKey != RiloShared.todayKey() {
            snap.mood = "proud"
            snap.note = "under your goal. keep it there."
        }
        return snap
    }
}

struct RiloWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: RiloEntry

    // RiloColors.swift
    private let ink = Color(red: 0x12 / 255, green: 0x30 / 255, blue: 0x1A / 255)
    private let ink2 = Color(red: 0x2C / 255, green: 0x4A / 255, blue: 0x36 / 255)
    private let skyTop = Color(red: 0x7C / 255, green: 0xC6 / 255, blue: 0xEE / 255)
    private let skyBottom = Color(red: 0xEE / 255, green: 0xF8 / 255, blue: 0xEE / 255)

    private var face: Image {
        let s = entry.snap
        let name = "rilo-\(s.skin)-\(s.mood)"
        return UIImage(named: name) != nil ? Image(name) : Image("rilo-original-\(s.mood)")
    }

    private var opensLine: String? {
        let s = entry.snap
        guard s.limitedApps > 0 else { return nil }
        let left = s.opensLeft
        let whole = Int(left)
        let n = "\(whole)\(left - Double(whole) >= 0.5 ? "½" : "")"
        if left <= 0 { return "no opens left today" }
        if left == 0.5 { return "½ an open left today" }
        return "\(n) \(left == 1 ? "open" : "opens") left today"
    }

    var body: some View {
        Group {
            if family == .systemMedium {
                HStack(spacing: 14) {
                    face.resizable().scaledToFit().frame(width: 110, height: 110)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(entry.snap.note)
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(ink)
                            .fixedSize(horizontal: false, vertical: true)
                        if let opensLine {
                            Text(opensLine)
                                .font(.system(size: 14, weight: .semibold, design: .rounded))
                                .foregroundStyle(ink2)
                        }
                    }
                    Spacer(minLength: 0)
                }
            } else {
                VStack(spacing: 4) {
                    face.resizable().scaledToFit().frame(maxWidth: .infinity, maxHeight: .infinity)
                    Text(entry.snap.mood)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(ink)
                }
            }
        }
        .riloWidgetBackground(LinearGradient(colors: [skyTop, skyBottom], startPoint: .top, endPoint: .bottom))
    }
}

private extension View {
    /// iOS 17+ wants the widget background declared; iOS 16 just draws it
    @ViewBuilder func riloWidgetBackground<B: View>(_ bg: B) -> some View {
        if #available(iOS 17.0, *) {
            containerBackground(for: .widget) { bg }
        } else {
            padding().background(bg)
        }
    }
}

struct RiloWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RiloWidget", provider: RiloProvider()) { entry in
            RiloWidgetView(entry: entry)
        }
        .configurationDisplayName("rilo")
        .description("rilo’s mood today.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@main
struct RiloWidgetBundle: WidgetBundle {
    var body: some Widget { RiloWidget() }
}

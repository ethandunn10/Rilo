import SwiftUI
import UIKit

/// Port of app/src/screens/ShareCard.jsx — the weekly card, sized 9:16 for
/// stories.
///
/// "save image": like the web (which draws the card to a 1080×1920 canvas
/// and downloads a PNG), the card is drawn at story size with ImageRenderer
/// and handed to the iOS share sheet (save to Photos, Files, Messages...).
/// Offline, nothing uploaded; saving to Photos uses the add-only photo
/// permission (NSPhotoLibraryAddUsageDescription).
///
/// The web gives the card `linear-gradient(180deg, ${theme.sky}, ...)`, but
/// theme.sky is itself a gradient, so that CSS is invalid and the card is
/// see-through on the web. iOS draws what it meant: a solid card, the theme's
/// sky into its middle hill colour, the same as the saved image.
struct ShareCardView: View {
    @Environment(AppState.self) private var state
    @Environment(\.riloTheme) private var theme
    /// the web's "saved to your downloads." line, after the share sheet
    @State private var saved = ""

    var body: some View {
        let back = state.back

        ZStack {
            theme.skyGradient.ignoresSafeArea()

            VStack(spacing: 12) {
                Text("your week")
                    .font(.fredoka(26, 700))

                /* the card itself, 9:16 */
                VStack(spacing: 0) {
                    VStack(spacing: 0) {
                        Text("rilo")
                            .font(.inter(13, 700))
                            .foregroundStyle(RC.ink2)
                        Text("time i got back")
                            .font(.fredoka(22, 700))
                            .padding(.top, 6)
                        Text(Plan.fmtMins(back.week))
                            .font(.fredoka(44, 700))
                            .foregroundStyle(ProgressScreenView.deepGreen)
                            .frame(height: 44)   // line-height: 1
                            .padding(.top, 6)
                        Text("this week")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                            .padding(.top, 2)
                    }

                    Spacer(minLength: 0)
                    RiloView(skin: state.chosenRilo, mood: "proud", size: 150, talks: true)
                    Spacer(minLength: 0)

                    VStack(spacing: 0) {
                        Text("\(state.streak) day streak")
                            .font(.fredoka(20, 700))
                        Text("level \(state.level) · \(Plan.fmtMins(back.total)) back in total")
                            .font(.inter(13, 600))
                            .foregroundStyle(RC.ink2)
                            .padding(.top, 2)
                    }
                }
                .multilineTextAlignment(.center)
                .padding(18 + 2)   // css border sits outside the padding
                /* width: 100%, max-width: 300, aspect-ratio 9 / 16 (shrinks
                   on short phones like the SE so the buttons stay on screen) */
                .aspectRatio(9 / 16, contentMode: .fit)
                .frame(maxWidth: 300, maxHeight: 300 * 16 / 9)
                .background(CardFill(theme: theme, radius: 26))
                .overlay(RoundedRectangle(cornerRadius: 26, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
                .layoutPriority(1)

                if !saved.isEmpty {
                    Text(saved)
                        .font(.inter(13, 700))
                        .foregroundStyle(ProgressScreenView.deepGreen)
                }

                Spacer(minLength: 6)

                Button { save(back) } label: {
                    Text("save image")
                        .font(.fredoka(19, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Capsule().fill(.white)
                            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 10, blur: 30))
                }
                .buttonStyle(.tap)

                Button { state.go(.progress, dir: .back) } label: {
                    Text("back")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(RC.ink)
                        .padding(8)
                }
                .buttonStyle(.tap)
            }
            .padding(.horizontal, 22)
            .padding(.top, WebLayout.top(44))
            .padding(.bottom, WebLayout.bottom(26))
            .foregroundStyle(RC.ink)
        }
    }
}

extension ShareCardView {
    /// Draw the story-size card (the web's canvas, same lines and spots) and
    /// open the share sheet with it.
    @MainActor
    func save(_ back: TimeBack) {
        saved = ""
        let card = ShareCardImage(theme: theme, skin: state.chosenRilo, level: state.level,
                                  streak: state.streak, week: back.week, total: back.total)
        let renderer = ImageRenderer(content: card)
        renderer.scale = 1
        renderer.proposedSize = ProposedViewSize(width: ShareCardImage.W, height: ShareCardImage.H)
        guard let image = renderer.uiImage else { return }
        track("share", "week card")
        ShareSheet.present([image]) { done, kind in
            guard done else { return }
            saved = kind == .saveToCameraRoll ? "saved to your photos." : "shared."
        }
    }
}

/// The 1080 × 1920 PNG the web's save() draws: the theme's sky into its
/// middle hill colour, the lines at the web's baselines, Rilo at 600.
struct ShareCardImage: View {
    static let W: CGFloat = 1080
    static let H: CGFloat = 1920
    let theme: ThemeInfo
    let skin: String
    let level: Int
    let streak: Int
    let week: Double
    let total: Double

    var body: some View {
        let top = theme.sky.first.map { Color(hex: $0.0) } ?? RC.stage
        ZStack(alignment: .topLeading) {
            LinearGradient(colors: [top, theme.hills.count > 1 ? theme.hills[1] : top],
                           startPoint: .top, endPoint: .bottom)
            line("rilo", 190, 72, 600, RC.ink2)
            line("time i got back", 300, 96)
            line(Plan.fmtMins(week), 470, 190, 700, ProgressScreenView.deepGreen)
            line("this week", 560, 56, 600, RC.ink2)
            Image(RiloView.assetName(skin: skin, mood: "proud"))
                .resizable().interpolation(.high)
                .frame(width: 600, height: 600 * RiloView.artH / RiloView.artW)
                .position(x: Self.W / 2, y: 640 + 300)
            line("\(streak) day streak", 1400, 76)
            line("level \(level)", 1500, 64, 600, RC.ink2)
            line("\(Plan.fmtMins(total)) back in total", 1620, 56, 600, RC.ink2)
            line("tryrilo.vercel.app", 1800, 44, 600, Color(hex: "#3D5A46"))
        }
        .frame(width: Self.W, height: Self.H)
    }

    /// canvas fillText at a baseline y: centre the line a bit above it
    private func line(_ text: String, _ y: CGFloat, _ size: CGFloat, _ weight: Int = 700,
                      _ color: Color = RC.ink) -> some View {
        Text(text)
            .font(.fredoka(size, weight))
            .foregroundStyle(color)
            .fixedSize()
            .position(x: Self.W / 2, y: y - size * 0.35)
    }
}

/// The iOS share sheet, opened over whatever is showing.
enum ShareSheet {
    @MainActor
    static func present(_ items: [Any], done: @escaping (Bool, UIActivity.ActivityType?) -> Void) {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive } ?? UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }.first
        guard var top = scene?.keyWindow?.rootViewController ?? scene?.windows.first?.rootViewController else { return }
        while let next = top.presentedViewController { top = next }
        let sheet = UIActivityViewController(activityItems: items, applicationActivities: nil)
        sheet.completionWithItemsHandler = { kind, completed, _, _ in
            Task { @MainActor in done(completed, kind) }
        }
        /* iPad: anchor the popover to the middle of the screen */
        sheet.popoverPresentationController?.sourceView = top.view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: top.view.bounds.midX, y: top.view.bounds.maxY - 80,
                                                                width: 1, height: 1)
        top.present(sheet, animated: true)
    }
}

/// The card's solid background: the theme's sky into its middle hill colour
/// (what the web's `linear-gradient(180deg, sky, hills[1])` meant, and what the
/// saved image draws), with `box-shadow: 0 16px 40px rgba(10,40,20,0.25)`.
private struct CardFill: View {
    let theme: ThemeInfo
    let radius: CGFloat

    var body: some View {
        let top = theme.sky.first.map { Color(hex: $0.0) } ?? RC.stage
        RoundedRectangle(cornerRadius: radius, style: .continuous)
            .fill(LinearGradient(colors: [top, theme.hills.count > 1 ? theme.hills[1] : top],
                                 startPoint: .top, endPoint: .bottom))
            .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 16, blur: 40)
    }
}

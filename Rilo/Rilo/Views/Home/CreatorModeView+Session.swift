import SwiftUI

/// The pretend Instagram screen and Rilo's Reels pop-ups (simulated: iOS
/// can't see inside Instagram).
extension CreatorModeView {
    struct AlertCopy { let title: String; let body: String; let action: String }

    private var posting: Bool { active?.task == "post" }
    private var taskLabel: String { posting ? "posting a video" : "doing research" }

    var alertCopy: AlertCopy? {
        guard state.hasPro, active != nil, shownScreen == "instagram" else { return nil }
        switch alert {
        case "nudge":
            return AlertCopy(title: "Back to your creator task.",
                             body: "You opened Instagram for \(taskLabel). Reels can wait. Go back to your \(posting ? "video" : "research").",
                             action: "back to \(posting ? "posting" : "research")")
        case "kicked":
            return AlertCopy(title: "That\u{2019}s two Reels tries.",
                             body: "Rilo is closing Instagram in this demo. If you open it again, your usual Instagram time limits apply.",
                             action: "close Instagram")
        case "time-up":
            return AlertCopy(title: "Creator time is up.",
                             body: "Rilo is closing Instagram in this demo. Your usual Instagram time limits apply if you open it again.",
                             action: "close Instagram")
        default:
            return nil
        }
    }

    private var clock: String {
        guard let r = remaining else { return "\u{221E}" }
        return "\(r / 60):\(String(format: "%02d", r % 60))"
    }

    private var hairline: some View { Rectangle().fill(Color.rgba(18, 48, 26, 0.12)).frame(height: 1) }

    var instagram: some View {
        Group {
            VStack(spacing: 0) {
                HStack(spacing: 9) {
                    AppLogo(label: "instagram", size: 34, radius: 11)
                    VStack(alignment: .leading, spacing: 0) {
                        Text("Instagram").font(.fredoka(17, 600))
                        Text("CREATOR MODE DEMO")
                            .font(.inter(11, 700))
                            .foregroundStyle(Color(hex: "#54705B"))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    Text(clock).font(.fredoka(15, 600))
                }
                .padding(.bottom, 11)
                hairline

                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 8) {
                        RiloView(skin: state.chosenRilo, mood: "proud", size: 42)
                        Text("focused session · \(taskLabel)")
                            .font(.inter(12, 700))
                            .foregroundStyle(Color(hex: "#405C47"))
                    }
                    VStack(spacing: 8) {
                        Text(posting ? "\u{1F3A5}" : "\u{1F50E}").font(.system(size: 42))
                        Text(posting ? "your video is ready to post" : "look for ideas with a purpose")
                            .font(.fredoka(19, 700))
                            .foregroundStyle(RC.ink)
                        Text("This sample screen stands in for Instagram. No post or research content is created in Rilo.")
                            .font(.inter(12, 600))
                            .foregroundStyle(Color(hex: "#24442B"))
                            .frame(maxWidth: 220)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .multilineTextAlignment(.center)
                    .padding(14)
                    .frame(maxWidth: .infinity, minHeight: 190)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous).fill(LinearGradient(
                            stops: [.init(color: Color(hex: "#D8F1D3"), location: 0),
                                    .init(color: Color(hex: "#A8D9B0"), location: 0.52),
                                    .init(color: Color(hex: "#5B9C68"), location: 1)],
                            startPoint: UnitPoint(x: 0.25, y: 0.067), endPoint: UnitPoint(x: 0.75, y: 0.933)))
                    )
                }
                .padding(.top, 14)
                .padding(.bottom, 12)
                .padding(.horizontal, 2)

                hairline
                SpaceAround {
                    tabWord("HOME")
                    Button { screen = "instagram" } label: { tabWord("POST") }.buttonStyle(.tap)
                    Button { screen = "instagram" } label: { tabWord("SEARCH") }.buttonStyle(.tap)
                    Button(action: tryReels) {
                        Text("REELS")
                            .font(.fredoka(14, 700))
                            .foregroundStyle(Color(hex: "#9D3429"))
                            .padding(.horizontal, 12 + 2)
                            .frame(minHeight: 38)
                            .background(Capsule().fill(Color(hex: "#FFF4F1")))
                            .overlay(Capsule().strokeBorder(Color(hex: "#D55C4C"), lineWidth: 2))
                    }
                    .buttonStyle(.tap)
                }
                .padding(.top, 8)

                Text("Tap Reels to see Rilo\u{2019}s reminder. Try it twice.")
                    .font(.inter(11, 600))
                    .foregroundStyle(Color(hex: "#55725C"))
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.top, 9)
            }
            .creatorCard(fill: Color(hex: "#F8F9F7"), pad: 13)

            Button(action: finish) { primaryLabel("finish creator session", light: true) }
                .buttonStyle(.tap)
                .padding(.top, 12)   // margin-top 12 on top of the column's gap

            Text("This is a click-through web demo. iPhone can limit the whole Instagram app, but Rilo can\u{2019}t see Reels inside it.")
                .font(.inter(11, 600))
                .webLineHeight(11, 1.35)
                .foregroundStyle(Color(hex: "#5A7A64"))
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 4)
        }
    }

    private func tabWord(_ t: String) -> some View {
        Text(t).font(.inter(11, 700)).foregroundStyle(Color(hex: "#54705B"))
    }

    func alertView(_ copy: AlertCopy) -> some View {
        let nudge = alert == "nudge"
        return ZStack {
            Color.rgba(10, 32, 16, 0.58)
            VStack(spacing: 0) {
                RiloView(skin: state.chosenRilo, mood: nudge ? "coach" : "letdown", size: 112, motion: .jump)
                    .frame(height: 102, alignment: .top)
                    .clipped()
                Text(nudge ? "RILO POP-UP · FIRST TRY" : "RILO SHIELD · DEMO")
                    .font(.inter(10, 800))
                    .tracking(1)
                    .foregroundStyle(Color(hex: "#347244"))
                    .padding(.top, 3)
                    .padding(.bottom, 5)
                Text(copy.title)
                    .font(.fredoka(24, 700))
                    .webLineHeight(24, 1.08)
                    .padding(.bottom, 8)
                Text(copy.body)
                    .font(.inter(13, 600))
                    .webLineHeight(13, 1.45)
                    .foregroundStyle(Color(hex: "#365642"))
                    .fixedSize(horizontal: false, vertical: true)
                    .padding(.bottom, 15)
                Button { if nudge { alert = "" } else { useNormalLimit() } } label: { primaryLabel(copy.action) }
                    .buttonStyle(.tap(0.94))
            }
            .multilineTextAlignment(.center)
            .foregroundStyle(RC.ink)
            .padding(18 + 3)
            .frame(maxWidth: .infinity)
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color(hex: "#F1F8EC")))
            .overlay(RoundedRectangle(cornerRadius: 28, style: .continuous).strokeBorder(.white, lineWidth: 3))
            .background(RoundedRectangle(cornerRadius: 28, style: .continuous).fill(Color.rgba(10, 32, 16, 0.25)).offset(y: 7))
            .rise(0, distance: 14, duration: 0.35)
            .padding(20)
        }
        .padding(.bottom, 64)
        .ignoresSafeArea(edges: .top)
        .transition(.opacity.animation(.easeOut(duration: 0.2)))
    }
}

/// `display: flex; justify-content: space-around; align-items: center`
private struct SpaceAround: Layout {
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        return CGSize(width: proposal.width ?? sizes.reduce(0) { $0 + $1.width },
                      height: sizes.map(\.height).max() ?? 0)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let sizes = subviews.map { $0.sizeThatFits(.unspecified) }
        let free = max(0, bounds.width - sizes.reduce(0) { $0 + $1.width })
        let each = sizes.isEmpty ? 0 : free / CGFloat(sizes.count)
        var x = bounds.minX + each / 2
        for (v, s) in zip(subviews, sizes) {
            v.place(at: CGPoint(x: x, y: bounds.midY - s.height / 2), proposal: ProposedViewSize(s))
            x += s.width + each
        }
    }
}

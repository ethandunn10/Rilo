import SwiftUI

/// DEMO/DEBUG ONLY: shows the Phase 1 foundation pieces (sky, hills,
/// Rilo moods and skins, tab bar) so they can be checked against the web.
/// Launch with `-screen foundation` or `-screen foundation-<theme>`.
struct FoundationPreview: View {
    var skin = "original"

    var body: some View {
        ZStack(alignment: .bottom) {
            SkyView(hills: .low)
            VStack(spacing: 14) {
                Text("rilo")
                    .font(.fredoka(17, 600))
                    .foregroundStyle(RC.welcomeGreen)
                    .padding(.vertical, 7).padding(.horizontal, 16)
                    .capsuleSticker()
                Text("hey, i'm rilo.")
                    .font(.fredoka(44, 700))
                    .foregroundStyle(RC.ink)
                Text("your screen-time buddy.")
                    .font(.inter(17, 600))
                    .foregroundStyle(RC.body)
                RiloView(skin: skin, mood: "wave", size: 170, motion: .jump, talks: true)
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 4) {
                    ForEach(RiloSkins.moods, id: \.self) { m in
                        RiloView(skin: skin, mood: m, size: 76, motion: .none)
                    }
                    RiloView(skin: "samurai", mood: "wave", size: 76, motion: .none)
                }
                .padding(.horizontal, 20)
                Spacer()
            }
            .padding(.top, WebLayout.top(56))
            TabBar(active: "home", skin: skin) { _ in }
        }
    }
}

#Preview { FoundationPreview() }

import SwiftUI

/// One skin in PickRilo's grid (the `tap-pw` button in PickRilo.jsx).
struct PickRiloTile: View {
    let item: SkinInfo
    let status: SkinStatus
    let on: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 1) {
                /* dimmed only when actually locked */
                RiloView(skin: item.skin, mood: "coach", size: 56, motion: .none)
                    .saturation(status.unlocked ? 1 : 0.4)
                    .opacity(status.unlocked ? 1 : 0.45)
                Text(item.name)
                    .font(.fredoka(10, 600))
                    .foregroundStyle(RC.ink3)
                    .multilineTextAlignment(.center)
                    .webLineHeight(10, 1.1)
                    .fixedSize(horizontal: false, vertical: true)
                if item.level > 10 {
                    Text("lv \(item.level)")
                        .font(.fredoka(9, 600))
                        .foregroundStyle(item.legendary ? Color(hex: "#9A6B00") : Color(hex: "#6B8A74"))
                        .webLineHeight(9, 1)
                }
            }
            .padding(.top, 4)
            .padding(.bottom, 3)
            .frame(maxWidth: .infinity, minHeight: 78, alignment: .bottom)
            .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(on ? Color.white : Color.white.opacity(0.5)))
            .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(on ? RC.ink : .clear, lineWidth: on ? 2.5 : 2))
            .overlay(alignment: .topTrailing) { badge.padding(3) }
        }
        .buttonStyle(.tap(0.96))
        .accessibilityLabel("\(item.name) rilo, " + (status.unlocked
            ? (status.tier == "pro" ? "available now, rilo pro later" : "free")
            : (status.reason == "pro" ? "rilo pro" : "unlocks at level \(item.level)")))
        .accessibilityAddTraits(on ? .isSelected : [])
    }

    @ViewBuilder
    private var badge: some View {
        if !status.unlocked || (Levels.UNLOCK_ALL && status.tier == "pro") {
            let level = status.reason == "level"
            HStack(spacing: 2) {
                if status.unlocked {
                    /* demo: a label for what the paid plan will cover */
                    Text("pro")
                } else if status.reason == "pro" {
                    SkinLockIcon(size: 11, color: .white)
                } else {
                    SkinLockIcon(size: 8, color: Color(hex: "#3D2E00"))
                    Text("\(item.level)")
                }
            }
            .font(.fredoka(9, 600))
            .foregroundStyle(level ? Color(hex: "#3D2E00") : .white)
            .padding(.horizontal, 4)
            .frame(minWidth: 16, minHeight: 16, maxHeight: 16)
            .background(Capsule().fill(level ? Color(hex: "#F2C230") : RC.ink))
        }
    }
}

/// PickRilo.jsx's LockIcon (viewBox 0 0 10 12)
struct SkinLockIcon: View {
    var size: CGFloat = 11
    var color: Color = .white

    var body: some View {
        ZStack {
            SVGPath("M2.4 5V3.4a2.6 2.6 0 0 1 5.2 0V5", w: 10, h: 12)
                .stroke(color, style: StrokeStyle(lineWidth: 1.6 * size / 10, lineCap: .round))
            RoundedRectangle(cornerRadius: 1.8 * size / 10)
                .fill(color)
                .frame(width: 8 * size / 10, height: 6.4 * size / 10)
                .position(x: 5 * size / 10, y: 8.2 * size / 10)
        }
        .frame(width: size, height: size * 1.2)
    }
}

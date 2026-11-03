import SwiftUI

/// home / plan / Rilo (center) / progress / you.
/// Port of app/src/components/TabBar.jsx (the docked "less-nudgy" bar).
struct TabBar: View {
    var active: String = "home"
    var skin: String = "original"
    let go: (String) -> Void

    private func col(_ name: String) -> Color { active == name ? RC.ink : RC.tabIdle }

    var body: some View {
        HStack(alignment: .center) {
            tab("home", icon: AnyView(SVGPath("M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z")
                .stroke(col("home"), style: StrokeStyle(lineWidth: 2.2, lineJoin: .round))))
            Spacer(minLength: 0)
            tab("plan", icon: AnyView(ZStack {
                RoundedRectangle(cornerRadius: 3).stroke(col("plan"), lineWidth: 2.2)
                    .frame(width: 16, height: 15).position(x: 12, y: 12.5)
                SVGPath("M4 10 H20 M9 3 V7 M15 3 V7").stroke(col("plan"), style: .svg(2.2))
            }))
            Spacer(minLength: 0)
            Button { go("pickrilo") } label: {
                ZStack {
                    Circle().fill(RC.mint)
                    RiloView(skin: skin, mood: "coach", size: 46, motion: .none)
                }
                .frame(width: 58, height: 58)
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(RC.line, lineWidth: 2))
                .background(Circle().fill(RC.line).offset(y: 3))
            }
            .buttonStyle(.tap)
            .accessibilityLabel("Your Rilo")
            Spacer(minLength: 0)
            tab("progress", icon: AnyView(SVGPath("M5 19 V13 M12 19 V8 M19 19 V4")
                .stroke(col("progress"), style: .svg(2.6))))
            Spacer(minLength: 0)
            tab("you", icon: AnyView(ZStack {
                Circle().stroke(col("you"), lineWidth: 2.2).frame(width: 8, height: 8).position(x: 12, y: 9)
                SVGPath("M4 20 C5 15 19 15 20 20").stroke(col("you"), style: .svg(2.2))
            }))
        }
        .padding(.horizontal, 10 + 14)
        .padding(.top, 8)
        .frame(height: 64, alignment: .center)
        .padding(.bottom, 0)
        .frame(maxWidth: .infinity)
        .background(alignment: .top) {
            UnevenRoundedRectangle(topLeadingRadius: 26, topTrailingRadius: 26)
                .fill(RC.card)
                .overlay(alignment: .top) {
                    UnevenRoundedRectangle(topLeadingRadius: 26, topTrailingRadius: 26)
                        .stroke(RC.line, lineWidth: 2)
                        .mask(alignment: .top) { Rectangle().frame(height: 30) }
                }
                .background(
                    UnevenRoundedRectangle(topLeadingRadius: 26, topTrailingRadius: 26)
                        .fill(Color.rgba(18, 48, 26, 0.08)).offset(y: -4)
                )
                .ignoresSafeArea(edges: .bottom)
        }
    }

    private func tab(_ name: String, icon: AnyView) -> some View {
        Button { go(name) } label: {
            VStack(spacing: 2) {
                icon
                    .frame(width: 24, height: 24)
                    .frame(width: 48, height: 30)
                    .background(Capsule().fill(active == name ? RC.mint : .clear))
                    .animation(.easeOut(duration: 0.2), value: active)
                Text(name)
                    .font(.fredoka(13, 600))
                    .foregroundStyle(col(name))
            }
            .frame(minWidth: 56, minHeight: 48)
        }
        .buttonStyle(.plainTap)
        .accessibilityAddTraits(active == name ? .isSelected : [])
    }
}

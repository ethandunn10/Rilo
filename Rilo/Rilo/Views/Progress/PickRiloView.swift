import SwiftUI

/// Port of app/src/screens/PickRilo.jsx — every skin in level order (panda
/// update sections 3 + 5). With real gating on (Levels.UNLOCK_ALL = false),
/// a free user taps a pro skin and is sent to the paywall; a Pro user below
/// a skin's level sees "level N of M · keep going". The grid tile is
/// PickRiloView+Tile.swift.
struct PickRiloView: View {
    @Environment(AppState.self) private var state

    @State private var sel: String = PickRiloView.initialSel

    /// DEBUG -picksel <skin>: start with that skin previewed (screenshots)
    private static var initialSel: String {
        #if DEBUG
        if let s = DemoSeed.arg("-picksel") { return s }
        #endif
        return "__chosen"
    }

    private var selected: String { sel == "__chosen" ? state.chosenRilo : sel }

    static let deepGreen = Color(hex: "#1F6B2E")

    var body: some View {
        let cur = Levels.skinState(selected, isPro: state.hasPro, level: state.level)

        ZStack {
            SkyView(hills: .mid).ignoresSafeArea()

            VStack(spacing: 12) {
                header
                preview(cur)
                grid
                footer(cur)
            }
            .padding(.horizontal, 20)
            .padding(.top, WebLayout.top(52))
            .padding(.bottom, WebLayout.bottom(30))
            .foregroundStyle(RC.ink)
        }
    }

    // MARK: header

    private var header: some View {
        HStack {
            Button { state.go(.home, dir: .back) } label: {
                SVGPath("M15 5 L8 12 L15 19")
                    .stroke(RC.ink, style: .svg(2.6))
                    .frame(width: 20, height: 20)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(Color.white.opacity(0.7)))
            }
            .buttonStyle(.tap)
            .accessibilityLabel("back to home")

            Spacer()
            Text("your rilo")
                .accessibilityAddTraits(.isHeader)
                .font(.fredoka(26, 700))
            Spacer()

            Text("lv \(state.level)")
                .accessibilityLabel("level \(state.level)")
                .font(.fredoka(14, 600))
                .foregroundStyle(Self.deepGreen)
                .frame(minWidth: 44, alignment: .trailing)
        }
    }

    // MARK: the big preview

    private func preview(_ cur: SkinStatus) -> some View {
        let tag = selected == state.chosenRilo ? "wearing this" : cur.unlocked ? "yours" : "rilo pro"
        return VStack(spacing: 2) {
            RiloView(skin: selected, mood: "proud", size: cur.info.level > 10 ? 168 : 190, motion: .jump)
            Text("\(cur.info.name) rilo")
                .font(.fredoka(24, 700))
            if cur.info.level > 10 {
                Text("level \(cur.info.level)" + (cur.info.legendary ? " · legendary" : ""))
                    .font(.inter(13, 600))
                    .foregroundStyle(RC.ink2)
            }
            Text(tag)
                .font(.fredoka(13, 600))
                .foregroundStyle(cur.unlocked ? RC.ink : .white)
                .padding(.vertical, 4)
                .padding(.horizontal, 11)
                .background(Capsule().fill(cur.unlocked ? .white : RC.ink))
                .padding(.top, 2)
        }
        .accessibilityElement(children: .combine)
        .frame(maxWidth: .infinity)
        .frame(height: 228, alignment: .bottom)
    }

    // MARK: the grid of skins

    private var grid: some View {
        ScrollView(.vertical, showsIndicators: false) {
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(minimum: 0), spacing: 8), count: 5), spacing: 8) {
                ForEach(Levels.SKIN_LADDER, id: \.skin) { item in
                    PickRiloTile(item: item,
                                 status: Levels.skinState(item.skin, isPro: state.hasPro, level: state.level),
                                 on: selected == item.skin) { tap(item.skin) }
                }
            }
            .padding(12 + 2)   // css border sits outside the padding
        }
        #if DEBUG
        /* -pickscroll: the grid scrolled to the end (the locked high-level skins) */
        .defaultScrollAnchor(DemoSeed.flag("-pickscroll") ? .bottom : .top)
        #endif
        .tourScrollable()
        .frame(maxHeight: .infinity)
        /* overflow: auto inside a rounded, bordered box */
        .clipShape(RoundedRectangle(cornerRadius: 28, style: .continuous))
        .sticker(radius: 28, drop: 4)
        .tourTarget("skins", radius: 28)
    }

    private func tap(_ skin: String) {
        let s = Levels.skinState(skin, isPro: state.hasPro, level: state.level)
        /* once the paid plan is real, a locked skin sells the plan instead */
        if !s.unlocked && s.reason == "pro" {
            state.pickRiloLocked(s.info.name)
            state.go(.upgrade)
            return
        }
        sel = skin
        state.pickRiloPreview(skin)
    }

    // MARK: the button underneath

    @ViewBuilder
    private func footer(_ cur: SkinStatus) -> some View {
        if Levels.UNLOCK_ALL {
            Text("every rilo is unlocked while we're testing · \"pro\" shows what the paid plan will cover later")
                .font(.inter(12, 600))
                .foregroundStyle(RC.ink2)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }

        if cur.unlocked {
            PillButton(title: "wear this") {
                state.chosenRilo = selected
                state.go(.home, dir: .back)
            }
        } else if cur.reason == "pro" {
            Button {
                state.pickRiloLocked(cur.info.name)
                state.go(.upgrade)
            } label: {
                Text("unlock with rilo pro")
                    .font(.fredoka(20, 600))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 58)
                    .background(Capsule().fill(RC.ink)
                        .cssShadow(Color.rgba(10, 40, 20, 0.3), y: 10, blur: 30))
            }
            .buttonStyle(.tap)
        } else {
            Text("level \(state.level) of \(cur.info.level) · keep going")
                .font(.fredoka(18, 600))
                .foregroundStyle(RC.ink)
                .frame(maxWidth: .infinity)
                .frame(height: 58)
                .background(Capsule().fill(Color.white.opacity(0.85)))
        }
    }
}

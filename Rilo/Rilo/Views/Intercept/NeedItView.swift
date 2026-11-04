import SwiftUI

/// Port of app/src/screens/NeedIt.jsx (exact port of designs/NeedIt.dc.html).
/// Rilo's reply to "need it". The reply card and the open button only
/// appear once a reason is picked, exactly as the design does it.
struct NeedItView: View {
    @Environment(AppState.self) private var state

    struct Reason: Identifiable {
        let id: String
        let label: String
        let reply: String
        let mins: Int
    }

    static let REASONS: [Reason] = [
        Reason(id: "text", label: "texting someone", reply: "got it. reply, then get out. no feed.", mins: 5),
        Reason(id: "post", label: "posting a video",
               reply: "creator move. post it, don’t scroll after. i’m watching.", mins: 10),
        Reason(id: "school", label: "school thing", reply: "respect. handle it.", mins: 10),
        Reason(id: "other", label: "something else", reply: "alright, i trust you. make it quick.", mins: 5),
    ]

    /// DEBUG `-needpick text|post|school|other` starts with a reason picked
    @State private var pick: String? = {
        #if DEBUG
        return DemoSeed.arg("-needpick")
        #else
        return nil
        #endif
    }()

    var body: some View {
        let cur = Self.REASONS.first { $0.id == pick }

        ReplyScreen {
            YouSaidPill(text: "you said: need it")

            HStack(alignment: .bottom, spacing: 6) {
                RiloView(skin: state.chosenRilo, mood: "curious", size: 140, talks: true)
                Text("fair. what for?")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(22, 600))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 14 + 1.5)
                    .padding(.horizontal, 16 + 1.5)
                    .bubble(BubbleShape(radius: 22, tail: 6), fill: Color.white.opacity(0.85),
                            border: .white, width: 1.5, drop: 0)
                    .padding(.bottom, 40)
                    .rise(0.1, duration: 0.5)
            }

            VStack(spacing: 9) {
                ForEach(Self.REASONS) { r in
                    reasonButton(r)
                }
            }
            .rise(0.2, duration: 0.5)

            if let cur {
                VStack(alignment: .leading, spacing: 4) {
                    Text(cur.reply)
                        .font(.fredoka(20, 600))
                        .webLineHeight(20, 1.3)
                    Text("i'll check in when time's up.")
                        .font(.inter(14, 600))
                        .foregroundStyle(Color(hex: "#9FD8A9"))
                }
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 16)
                .padding(.horizontal, 18)
                .background(RoundedRectangle(cornerRadius: 24, style: .continuous).fill(RC.ink))
                .cssShadow(Color.rgba(10, 40, 20, 0.25), y: 12, blur: 30)
                .id(cur.id)
                .rise(0, duration: 0.4)
            }

            Spacer(minLength: 0)

            if let cur {
                PillButton(title: "open \(state.currentApp) for \(cur.mins) min", height: 56) {
                    state.startSession(Double(cur.mins), reason: "needed")
                }
            }

            Button {
                state.saidNo()
                state.go(.home, dir: .back)
            } label: {
                Text("never mind, close it")
                    .font(.fredoka(16, 600))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(8)
            }
            .buttonStyle(.plainTap)
        }
    }

    private func reasonButton(_ r: Reason) -> some View {
        let on = pick == r.id
        let shape = RoundedRectangle(cornerRadius: 22, style: .continuous)
        return Button { pick = r.id } label: {
            Text(r.label)
                .font(.fredoka(17, 600))
                .foregroundStyle(RC.ink)
                .padding(.horizontal, 10)
                .frame(maxWidth: .infinity, minHeight: 64)
                .bubble(shape, fill: on ? Color(hex: "#DDF3D9") : RC.card,
                        border: RC.line, width: on ? 2.5 : 2, drop: on ? 1 : 3)
                .offset(y: on ? 2 : 0)
        }
        .buttonStyle(.tap(0.95))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

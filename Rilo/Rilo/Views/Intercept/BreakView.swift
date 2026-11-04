import SwiftUI

/// Port of app/src/screens/Break.jsx (exact port of designs/Break.dc.html).
/// Rilo's reply to "taking a break".
struct BreakView: View {
    @Environment(AppState.self) private var state

    @State private var mins = Self.startMins

    /// DEBUG `-breakmins 5|10|15` picks a length up front (screenshots)
    private static var startMins: Int {
        #if DEBUG
        if let m = DemoSeed.arg("-breakmins").flatMap(Int.init) { return m }
        #endif
        return 15
    }

    var body: some View {
        ReplyScreen {
            YouSaidPill(text: "you said: taking a break")

            RiloView(skin: state.chosenRilo, mood: "proud", size: 160, motion: .jump, talks: true)
                .frame(maxWidth: .infinity)

            Text("you earned it. ap bio homework is done. enjoy it, then i'll come get you.")
                .font(.fredoka(21, 600))
                .webLineHeight(21, 1.3)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 16 + 2)
                .padding(.horizontal, 18 + 2)
                .bubble(BubbleShape(), fill: RC.card, border: RC.line)
                .rise(0.1, duration: 0.5)

            VStack(alignment: .leading, spacing: 12) {
                Text("how long?")
                    .font(.fredoka(17, 600))
                    .foregroundStyle(RC.ink2)
                HStack(spacing: 8) {
                    ForEach([5, 10, 15], id: \.self) { m in
                        lengthButton(m)
                    }
                }
                Text("\(mins):00")
                    .font(.fredoka(46, 700))
                    .frame(maxWidth: .infinity)
            }
            .padding(16 + 2)
            .bubble(RoundedRectangle(cornerRadius: 24, style: .continuous), fill: RC.card, border: RC.line, drop: 3)
            .rise(0.2, duration: 0.5)

            Spacer(minLength: 0)

            VStack(spacing: 6) {
                PillButton(title: "start my break", height: 56) {
                    state.startSession(Double(mins), reason: "break")
                }
                Button {
                    state.saidNo()
                    state.go(.home, dir: .back)
                } label: {
                    Text("actually, never mind")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(8)
                }
                .buttonStyle(.plainTap)
            }
            .rise(0.3, duration: 0.5)
        }
    }

    private func lengthButton(_ m: Int) -> some View {
        let on = mins == m
        return Button { mins = m } label: {
            Text("\(m) min")
                .font(.fredoka(17, 600))
                .foregroundStyle(on ? .white : RC.ink)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(Capsule().fill(on ? RC.ink : Color.white.opacity(0.85)))
                .overlay(Capsule().strokeBorder(on ? RC.ink : .white, lineWidth: 2))
        }
        .buttonStyle(.tap(0.94))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

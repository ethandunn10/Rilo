import SwiftUI

/// You ▸ what rilo knows: everything Rilo remembers from talking to them
/// (AppState+Memory). Swipe one away, or forget everything. It never
/// leaves the phone.
///
/// DEBUG `-memory` (with `-screen you`) opens it on launch.
struct MemoryView: View {
    @Environment(AppState.self) private var state
    @Environment(\.dismiss) private var dismiss
    @State private var confirmForget = false

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Button { dismiss() } label: {
                    Text("done")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(RC.ink)
                        .padding(.horizontal, 14)
                        .frame(height: 36)
                        .capsuleSticker(fill: RC.card, drop: 3)
                }
                .buttonStyle(.tap)
                Spacer()
            }

            HStack(alignment: .center, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("what rilo knows")
                        .accessibilityAddTraits(.isHeader)
                        .font(.fredoka(28, 700))
                    Text("what you've told him. it stays on this phone.")
                        .font(.inter(14, 600))
                        .foregroundStyle(RC.ink2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                RiloView(skin: state.chosenRilo, mood: "curious", size: 64)
                    .accessibilityHidden(true)
            }

            if state.memory.isEmpty {
                Text("nothing yet. tell him about your week, your hobbies, what you want to get better at.")
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .youCard(0)
                Spacer()
            } else {
                List {
                    ForEach(state.memory.reversed()) { m in
                        Text(m.text)
                            .font(.inter(15, 600))
                            .foregroundStyle(RC.ink)
                            .listRowBackground(Color.white.opacity(0.9))
                    }
                    .onDelete { offsets in
                        let newestFirst = Array(state.memory.reversed())
                        for i in offsets where newestFirst.indices.contains(i) { state.forget(newestFirst[i].text) }
                    }
                }
                .listStyle(.insetGrouped)
                .scrollContentBackground(.hidden)
                .padding(.horizontal, -20)

                Text("swipe left on one to delete it.")
                    .font(.inter(12, 700))
                    .foregroundStyle(RC.ink3)
                    .frame(maxWidth: .infinity)

                Button { confirmForget = true } label: {
                    Text("forget everything")
                        .font(.fredoka(16, 600))
                        .foregroundStyle(RC.ink)
                        .frame(maxWidth: .infinity, minHeight: 48)
                        .background(Capsule().fill(Color.white))
                        .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                }
                .buttonStyle(.tap)
            }
        }
        .foregroundStyle(RC.ink)
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(SkyView(hills: .low).ignoresSafeArea())
        .confirmationDialog("forget everything rilo knows?", isPresented: $confirmForget, titleVisibility: .visible) {
            Button("forget everything", role: .destructive) { state.forgetEverything() }
            Button("cancel", role: .cancel) {}
        }
    }
}

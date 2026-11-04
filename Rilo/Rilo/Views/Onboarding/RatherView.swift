import SwiftUI

/// Port of app/src/screens/Rather.jsx — "what would you rather spend it on?"
/// Multi-select with one next, plus "add your own".
struct RatherView: View {
    @Environment(AppState.self) private var state
    @State private var typed = ""
    @State private var adding = false
    @State private var extras: [String] = []
    @FocusState private var inputFocused: Bool

    private var chosen: [String] { state.rather }
    private var ready: Bool { !chosen.isEmpty || !extras.isEmpty }
    private var typedClean: String { typed.trimmingCharacters(in: .whitespacesAndNewlines) }

    var body: some View {
        ZStack {
            SkyView(hills: .low).ignoresSafeArea()
            VStack(spacing: 0) {
                ScrollView(showsIndicators: false) {
                    column
                        .padding(.top, WebLayout.top(52))
                        .padding(.horizontal, 22)
                        .padding(.bottom, 12)
                }
                .scrollBounceBehavior(.basedOnSize)
                pinned
            }
        }
    }

    private var column: some View {
        VStack(alignment: .leading, spacing: 12) {
            Dots(active: 2)

            BackButton { state.goTo(.pickapps, dir: .back) }

            HStack(spacing: 10) {
                RiloView(skin: AppState.OG_SKIN, mood: "curious", size: 92, talks: true)
                Text("if you got a chunk of that time back, what would you rather spend it on?")
                    .font(.fredoka(24, 700))
                    .webLineHeight(24, 1.15)
                    .foregroundStyle(RC.ink)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            Text("pick as many as you like. this is what i'll point you at instead.")
                .font(.inter(13.5, 600))
                .foregroundStyle(RC.ink2)
                .fixedSize(horizontal: false, vertical: true)

            VStack(spacing: 8) {
                ForEach(Rather.RATHER, id: \.id) { r in
                    let on = chosen.contains(r.id)
                    Button { toggle(r.id) } label: { RatherChip(label: r.label, on: on) }
                        .buttonStyle(.tap)
                        .accessibilityAddTraits(on ? .isSelected : [])
                }

                /* anything they added themselves */
                ForEach(extras, id: \.self) { e in
                    Button { extras.removeAll { $0 == e } } label: { RatherChip(label: e, on: true) }
                        .buttonStyle(.tap)
                        .accessibilityAddTraits(.isSelected)
                }

                if adding { addRow } else { addButton }
            }
        }
    }

    private var addButton: some View {
        Button { adding = true } label: {
            HStack(spacing: 11) {
                Text("+")
                    .font(.fredoka(20, 700))
                    .foregroundStyle(Color(hex: "#2E8B3E"))
                    .frame(width: 22, height: 22)
                Text("add your own")
                    .font(.fredoka(18, 600))
                    .foregroundStyle(RC.ink)
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 20)
            .frame(maxWidth: .infinity, minHeight: 54)
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(Color.rgba(18, 48, 26, 0.4), style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
            )
        }
        .buttonStyle(.tap)
    }

    private var addRow: some View {
        HStack(spacing: 8) {
            TextField("", text: $typed, prompt: Text("what is it?").foregroundStyle(Color.rgba(18, 48, 26, 0.45)))
                .font(.fredoka(17, 600))
                .foregroundStyle(RC.ink)
                .textInputAutocapitalization(.never)
                .submitLabel(.done)
                .focused($inputFocused)
                .onSubmit(addOwn)
                .padding(.horizontal, 18)
                .frame(height: 54)
                .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(.white))
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
                .onAppear { inputFocused = true }

            Button(action: addOwn) {
                Text("+")
                    .font(.fredoka(24, 600))
                    .foregroundStyle(.white)
                    .frame(width: 54, height: 54)
                    .background(Circle().fill(typedClean.isEmpty ? Color.rgba(18, 48, 26, 0.18) : RC.ink))
            }
            .buttonStyle(.tap)
            .disabled(typedClean.isEmpty)
            .accessibilityLabel("add it")
        }
    }

    private var pinned: some View {
        Button {
            state.ratherContinue(.yournumber, extras: extras)
        } label: {
            Text(ready ? "next" : "pick at least one")
                .font(.fredoka(20, 600))
                .foregroundStyle(ready ? RC.ink : Color.rgba(18, 48, 26, 0.45))
                .frame(maxWidth: .infinity)
                .frame(height: 58)
                .background(Capsule().fill(ready ? .white : Color.white.opacity(0.5)))
                .overlay(Capsule().strokeBorder(RC.line, lineWidth: 2))
                /* box-shadow 0 4px 0: only the part below the button, so
                   the half-clear disabled fill doesn't show ink through it */
                .background(
                    ZStack {
                        Capsule().fill(RC.line).offset(y: 4)
                        Capsule().blendMode(.destinationOut)
                    }
                    .compositingGroup()
                )
        }
        .buttonStyle(.tap(0.92))
        .disabled(!ready)
        .padding(.top, 10)
        .padding(.horizontal, 22)
        .padding(.bottom, WebLayout.bottom(28))
    }

    private func toggle(_ id: String) {
        if chosen.contains(id) { state.rather = chosen.filter { $0 != id } } else { state.rather = chosen + [id] }
    }

    private func addOwn() {
        let t = typedClean.lowercased()
        if t.isEmpty { return }
        extras = Rather.uniq(extras + [t])
        typed = ""
        adding = false
    }
}

/// One "rather" row: tick circle + label, green when picked.
private struct RatherChip: View {
    let label: String
    let on: Bool

    var body: some View {
        HStack(spacing: 11) {
            ZStack {
                if on {
                    Circle().fill(.white)
                    Text("✓").font(.system(size: 14, weight: .heavy)).foregroundStyle(Color(hex: "#2E8B3E"))
                } else {
                    /* content-box: 22 + a 2px border each side */
                    Circle().strokeBorder(Color.rgba(18, 48, 26, 0.3), lineWidth: 2)
                }
            }
            .frame(width: on ? 22 : 26, height: on ? 22 : 26)
            Text(label)
                .font(.fredoka(18, 600))
                .foregroundStyle(on ? .white : RC.ink)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
        /* 2px border + 18px padding */
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, minHeight: 54)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous)
            .fill(on ? Color(hex: "#2E8B3E") : Color.white.opacity(0.92)))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(RC.line, lineWidth: 2))
    }
}

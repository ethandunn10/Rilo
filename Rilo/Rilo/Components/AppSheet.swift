import SwiftUI

/// Port of app/src/components/AppSheet.jsx: the "add another app" sheet.
/// Slides up with a search box and the popular-app list. Typing filters it;
/// anything not in the list offers add "<what you typed>" with a letter tile.
struct AppSheet: View {
    let already: [String: Bool]
    let onPick: (String) -> Void
    let onClose: () -> Void

    @State private var query = ""
    @State private var shown = false
    @FocusState private var focused: Bool

    private var typed: String { query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() }
    private var results: [CatalogApp] { Apps.searchApps(query) }
    private var exact: Bool { results.contains { $0.label == typed } }
    /// the list's own height: every row is 56 tall (one line of Fredoka 18)
    private var listHeight: CGFloat {
        var h = CGFloat(results.count) * 56
        if !typed.isEmpty && !exact { h += 56 }
        if results.isEmpty && typed.isEmpty { h += 47 }
        return h
    }

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                /* scrim */
                Button(action: onClose) {
                    Color(.sRGB, red: 10 / 255, green: 30 / 255, blue: 18 / 255, opacity: 0.38)
                }
                .buttonStyle(.plainTap)
                .ignoresSafeArea()
                .opacity(shown ? 1 : 0)
                .animation(.easeOut(duration: 0.28), value: shown)
                .accessibilityLabel("Close")

                panel(maxHeight: geo.size.height * 0.78)
                    .offset(y: shown ? 0 : geo.size.height * 0.8 + 40)
                    .animation(.timingCurve(0.2, 0.8, 0.3, 1, duration: 0.3), value: shown)
            }
        }
        .onAppear {
            shown = true
            #if DEBUG
            if let q = DemoSeed.arg("-appquery") { query = q }
            #endif
            Task {
                try? await Task.sleep(for: .milliseconds(260))
                focused = true
            }
        }
    }

    private func panel(maxHeight: CGFloat) -> some View {
        let shape = UnevenRoundedRectangle(topLeadingRadius: 30, topTrailingRadius: 30, style: .continuous)
        return VStack(spacing: 12) {
            Capsule()
                .fill(RC.ink.opacity(0.18))
                .frame(width: 42, height: 5)

            HStack(spacing: 10) {
                Text("add an app")
                    .font(.fredoka(22, 600))
                    .foregroundStyle(RC.ink)
                Spacer(minLength: 0)
                Button(action: onClose) {
                    Text("done")
                        .font(.fredoka(15, 600))
                        .foregroundStyle(RC.ink)
                        .padding(.horizontal, 14)
                        .frame(height: 36)
                        .background(Capsule().fill(RC.ink.opacity(0.08)))
                }
                .buttonStyle(.tap(0.97))
            }

            TextField("", text: $query, prompt: Text("search apps").foregroundStyle(Color(hex: "#757575")))
                .focused($focused)
                .font(.inter(16, 600))
                .foregroundStyle(RC.ink)
                .tint(RC.ink)
                .textInputAutocapitalization(.never)
                .submitLabel(.search)
                .padding(.horizontal, 16)
                .frame(height: 48)
                .background(Capsule().fill(.white))
                .overlay(Capsule().strokeBorder(RC.ink, lineWidth: 2))
                .accessibilityLabel("Search apps")

            /* the list scrolls inside the sheet; the sheet is only as tall
               as it needs to be, up to 78% of the screen */
            ScrollView(showsIndicators: false) {
                list
            }
            .frame(height: min(listHeight, max(0, maxHeight - 143)))
            .padding(.horizontal, -4)
        }
        .padding(.top, 10)
        .padding(.horizontal, 18)
        .padding(.bottom, 8)
        .frame(maxWidth: .infinity)
        .background(
            shape.fill(RC.card)
                .cssShadow(Color(.sRGB, red: 10 / 255, green: 40 / 255, blue: 20 / 255, opacity: 0.22), y: -14, blur: 44)
                .ignoresSafeArea(edges: .bottom)
        )
        .overlay(
            /* 2px ink on the sides, 1.5px white along the top (css border-top) */
            ZStack(alignment: .top) {
                shape.strokeBorder(RC.line, lineWidth: 2).mask(TopEdgeCut().fill(style: FillStyle(eoFill: true)))
                Rectangle().fill(.white).frame(height: 1.5).padding(.horizontal, 30)
            }
            .ignoresSafeArea(edges: .bottom)
            .allowsHitTesting(false)
        )
    }

    private var list: some View {
        VStack(spacing: 0) {
            ForEach(results, id: \.label) { a in
                let on = already[a.label] == true
                row(a.label, title: a.label, trailing: on ? "added" : "+ add",
                    trailingColor: on ? Color(hex: "#1F6B2E") : RC.ink3, divider: true)
            }
            if !typed.isEmpty && !exact {
                row(typed, title: "add “\(typed)”", trailing: "+ add", trailingColor: RC.ink3, divider: false)
            }
            if results.isEmpty && typed.isEmpty {
                Text("no apps found.")
                    .font(.inter(15, 600))
                    .foregroundStyle(RC.ink2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 14)
                    .padding(.horizontal, 4)
            }
        }
    }

    private func row(_ label: String, title: String, trailing: String, trailingColor: Color, divider: Bool) -> some View {
        Button { onPick(label) } label: {
            HStack(spacing: 14) {
                AppLogo(label: label)
                Text(title)
                    .font(.fredoka(18, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                Text(trailing)
                    .font(.inter(13, 700))
                    .foregroundStyle(trailingColor)
            }
            .padding(.horizontal, 4)
            .frame(minHeight: 56)
            .overlay(alignment: .bottom) {
                if divider { Rectangle().fill(RC.ink.opacity(0.08)).frame(height: 1) }
            }
        }
        .buttonStyle(.tap(0.97))
    }
}

/// everything except the straight part of the top edge, so the ink border
/// only runs down the sides and round the corners
private struct TopEdgeCut: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path(rect)
        p.addRect(CGRect(x: 30, y: 0, width: max(0, rect.width - 60), height: 3))
        return p
    }
}

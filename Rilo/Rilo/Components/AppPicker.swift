import SwiftUI

/// Port of app/src/components/AppPicker.jsx: the watched-apps list with real
/// logos and the "add another app" row. Shared by PickApps and the You tab.
///
/// The web draws the add-app sheet from inside the picker, absolutely
/// positioned over the whole screen. SwiftUI can't escape the list like
/// that, so the screen owns `sheet` and puts `.appSheetHost(...)` on its
/// root view; that modifier draws AppSheet and runs the same addApp rules.
struct AppPicker: View {
    @Binding var apps: PickedApps
    @Binding var sheet: Bool
    /// "phone is always allowed already" note, shown under the list
    @Binding var refused: String
    var maxApps: Int = .max
    var onMaxed: (() -> Void)? = nil

    private var rows: [String] { Apps.STARTING_APPS + apps.extra }
    private var full: Bool { apps.on.values.filter { $0 }.count >= maxApps }

    var body: some View {
        VStack(spacing: 0) {
            ForEach(rows, id: \.self) { label in
                let on = apps.on[label] == true
                AppRow(label: label, on: on) {
                    /* turning one off is always allowed; turning a third on isn't */
                    if !on && full {
                        onMaxed?()
                        return
                    }
                    apps.on[label] = !on
                }
            }
            Button { sheet = true } label: {
                HStack(spacing: 14) {
                    Text("+")
                        .font(.fredoka(22, 600))
                        .frame(width: 38, height: 38)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .strokeBorder(RC.ink, style: StrokeStyle(lineWidth: 2, dash: [6, 3]))
                        )
                        .accessibilityHidden(true)
                    Text("add another app")
                        .font(.fredoka(18, 600))
                    Spacer(minLength: 0)
                }
                .foregroundStyle(RC.ink)
                .frame(minHeight: 56)
            }
            .buttonStyle(.tap(0.97))
        }
    }

    /// the refused note (web: a <p> right after the picker card)
    @ViewBuilder static func refusedNote(_ refused: String) -> some View {
        if !refused.isEmpty {
            Text("\(refused) is always allowed already. change that on your limits screen if you really want to.")
                .font(.fredoka(15, 600))
                .foregroundStyle(RC.ink)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 10)
                .padding(.horizontal, 14)
                .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(Color.white.opacity(0.9)))
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(RC.ink, lineWidth: 2))
                .padding(.top, 8)
        }
    }

    /// AppPicker.jsx `addApp`
    static func addApp(_ label: String, apps: inout PickedApps, maxApps: Int,
                       sheet: inout Bool, refused: inout String, onMaxed: (() -> Void)?) {
        let t = label.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if t.isEmpty { return }
        if Apps.SYSTEM_APPS.contains(t) {
            refused = t
            sheet = false
            return
        }
        /* free blocks FREE_MAX_APPS (3); one more means the trial */
        let full = apps.on.values.filter { $0 }.count >= maxApps
        if full && apps.on[t] != true {
            sheet = false
            onMaxed?()
            return
        }
        let rows = Apps.STARTING_APPS + apps.extra
        apps.on[t] = true
        if !rows.contains(t) { apps.extra.append(t) }
    }
}

private struct AppRow: View {
    let label: String
    let on: Bool
    let onPick: () -> Void

    var body: some View {
        Button(action: onPick) {
            HStack(spacing: 14) {
                AppLogo(label: label)
                Text(label)
                    .font(.fredoka(19, 600))
                    .foregroundStyle(RC.ink)
                    .frame(maxWidth: .infinity, alignment: .leading)
                ZStack {
                    if on {
                        Circle().fill(RC.ink)
                    } else {
                        Circle().fill(Color.white.opacity(0.8))
                        Circle().strokeBorder(RC.ink.opacity(0.2), lineWidth: 2)
                    }
                    SVGPath("M3 8.5 L6.5 12 L13 4.5", w: 16, h: 16)
                        .stroke(.white, style: .svg(2.5))
                        .frame(width: 16, height: 16)
                }
                .frame(width: 30, height: 30)
                .animation(.easeOut(duration: 0.2), value: on)
            }
            .frame(minHeight: 58)
            .overlay(alignment: .bottom) {
                Rectangle().fill(RC.ink.opacity(0.08)).frame(height: 1)
            }
        }
        .buttonStyle(.tap(0.97))
        .accessibilityAddTraits(on ? .isSelected : [])
    }
}

extension View {
    /// Draws the add-app sheet over the whole screen while `sheet` is true
    /// (AppPicker.jsx `{sheet && <AppSheet .../>}` + its addApp rules).
    func appSheetHost(apps: Binding<PickedApps>, sheet: Binding<Bool>, refused: Binding<String>,
                      maxApps: Int = .max, onMaxed: (() -> Void)? = nil) -> some View {
        /* backdrop-filter: blur(2px) on the scrim = the screen behind blurs */
        blur(radius: sheet.wrappedValue ? 2 : 0)
            .animation(.easeOut(duration: 0.28), value: sheet.wrappedValue)
            .overlay {
            ZStack {
                if sheet.wrappedValue {
                    AppSheet(already: apps.wrappedValue.on,
                             onPick: { label in
                                 var a = apps.wrappedValue, s = sheet.wrappedValue, r = refused.wrappedValue
                                 AppPicker.addApp(label, apps: &a, maxApps: maxApps, sheet: &s, refused: &r, onMaxed: onMaxed)
                                 apps.wrappedValue = a
                                 sheet.wrappedValue = s
                                 refused.wrappedValue = r
                             },
                             onClose: { sheet.wrappedValue = false })
                }
            }
            .animation(nil, value: sheet.wrappedValue)
        }
    }
}

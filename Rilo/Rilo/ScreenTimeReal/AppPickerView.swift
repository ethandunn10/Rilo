#if RILO_FAMILY_CONTROLS
import SwiftUI
import FamilyControls
import ManagedSettings

/// Target: Rilo app. Apple's app picker in Rilo's look.
///
/// WHERE IT GOES: it replaces the demo app list in two places, only when
/// `state.screenTimeService.usesSystemPicker` is true:
///   - Views/Onboarding/PickAppsView.swift: the `AppPicker(apps: $s.apps, sheet: $sheet, refused: $refused)`
///     block (and its `.appSheetHost(...)`): use `AppPickerView(maxApps: …)` instead
///   - Views/You/YouView+Settings.swift: the `AppPicker(...)` in the apps card
///     (the "add another app" row opens Apple's picker instead of AppSheet)
/// Everything after that (limits, opens circles, shields) keys off the app
/// keys it writes, so no other screen changes. Where a screen shows an app's
/// name or logo (AppLogo / Text(app)), show `RiloAppLabel(key:)` instead,
/// because the app itself can't read the real name behind a token.
struct AppPickerView: View {
    @Environment(AppState.self) private var state
    /// the free plan's cap (Plan.watchedFor caps the rest)
    var maxApps: Int = .max

    @State private var selection = RiloTokens.selection
    @State private var picking = false

    private var keys: [String] { RiloTokens.keys(selection) }

    var body: some View {
        VStack(spacing: 0) {
            ForEach(keys, id: \.self) { key in
                HStack(spacing: 12) {
                    RiloAppLabel(key: key, selection: selection)
                        .font(.fredoka(18, 600))
                        .foregroundStyle(RC.ink)
                    Spacer(minLength: 0)
                }
                .frame(height: 56)
                .padding(.horizontal, 16)
                Divider().overlay(RC.line.opacity(0.08))
            }

            Button { picking = true } label: {
                Text(keys.isEmpty ? "pick your apps" : "add another app")
                    .font(.fredoka(18, 600))
                    .foregroundStyle(RC.greenDeep)
                    .frame(maxWidth: .infinity, minHeight: 56)
            }
            .buttonStyle(.tap)
        }
        .sticker(fill: .white, radius: 22)
        .familyActivityPicker(isPresented: $picking, selection: $selection)
        .onChange(of: selection) { _, next in save(next) }
    }

    private func save(_ next: FamilyActivitySelection) {
        var sel = next
        /* the free cap: keep the first `maxApps` apps they picked */
        if sel.applicationTokens.count + sel.categoryTokens.count > maxApps {
            let keep = Set(RiloTokens.keys(sel).prefix(maxApps))
            sel.applicationTokens = sel.applicationTokens.filter { keep.contains(RiloTokens.key(for: $0)) }
            sel.categoryTokens = sel.categoryTokens.filter { keep.contains(RiloTokens.key(for: $0)) }
            selection = sel
        }
        if let real = state.screenTimeService as? FamilyControlsScreenTimeService { real.selection = sel }
        /* the models key everything by app key: mirror the picks into
           `apps` so the plan, the breakdown and the shields all follow */
        let keys = RiloTokens.keys(sel)
        state.apps = PickedApps(on: Dictionary(uniqueKeysWithValues: keys.map { ($0, true) }), extra: keys)
        track("apps", "picked \(keys.count) with screen time")
    }
}

/// An app's real name and icon. Only iOS can draw them (`Label(token)`).
struct RiloAppLabel: View {
    let key: String
    var selection: FamilyActivitySelection = RiloTokens.selection

    var body: some View {
        if let token = RiloTokens.appToken(key, in: selection) {
            Label(token)
        } else if let token = RiloTokens.categoryToken(key, in: selection) {
            Label(token)
        } else {
            Text(key)
        }
    }
}
#endif

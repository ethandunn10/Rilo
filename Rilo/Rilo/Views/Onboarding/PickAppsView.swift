import SwiftUI

/// Port of app/src/screens/PickApps.jsx: real logos, the add-app sheet,
/// the list scrolling with the button pinned.
struct PickAppsView: View {
    @Environment(AppState.self) private var state
    @State private var sheet = false
    @State private var refused = ""

    var body: some View {
        @Bindable var s = state
        /* nothing is pre-checked, so there's nothing to turn on until they pick */
        let picked = !Apps.pickedApps(state.apps).isEmpty

        ZStack {
            SkyView(hills: .low)

            VStack(spacing: 14) {
                Dots(active: 3)
                BackButton { state.goTo(.name, dir: .back) }
                    .frame(maxWidth: .infinity, alignment: .leading)

                /* everything above the pinned button scrolls */
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 14) {
                        header.rise(0, duration: 0.5)

                        /* real Screen Time (FeatureFlags.REAL_SCREEN_TIME): Apple's picker */
                        if ScreenTime.isReal(state.screenTimeService) {
                            AppPickerView()
                                .rise(0.1, duration: 0.5)
                        } else {
                            AppPicker(apps: $s.apps, sheet: $sheet, refused: $refused)
                                .padding(.vertical, 4 + 2)   // + the 2px css border
                                .padding(.horizontal, 16 + 2)
                                .sticker(fill: RC.card, radius: 26, drop: 4)
                                .rise(0.1, duration: 0.5)
                        }

                        AppPicker.refusedNote(refused)

                        Text(picked
                             ? "rilo uses apple's screen time to see when you open these."
                             : "pick at least one for rilo to watch.")
                            .font(.inter(13, 600))
                            .webLineHeight(13, 1.45)
                            .foregroundStyle(RC.ink2)
                            .multilineTextAlignment(.center)
                            .frame(maxWidth: .infinity)
                    }
                    .padding(.horizontal, 4)
                }
                .padding(.horizontal, -4)

                Button { state.go(.permission) } label: {
                    Text("turn on screen time")
                        .font(.fredoka(20, 600))
                        .foregroundStyle(picked ? RC.ink : RC.ink.opacity(0.45))
                        .frame(maxWidth: .infinity)
                        .frame(height: 58)
                        .capsuleSticker(fill: picked ? .white : Color.white.opacity(0.45), drop: 4)
                        .animation(.easeOut(duration: 0.2), value: picked)
                }
                .buttonStyle(.tap(0.97))
                .disabled(!picked)
            }
            .padding(.top, WebLayout.top(56))
            .padding(.horizontal, 24)
            .padding(.bottom, WebLayout.bottom(34))
        }
        .appSheetHost(apps: $s.apps, sheet: $sheet, refused: $refused)
        .onAppear {
            #if DEBUG
            if DemoSeed.arguments.contains("-appsheet") { sheet = true }
            #endif
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 6) {
                Text("which apps steal your time?")
                    .accessibilityAddTraits(.isHeader)
                    .font(.fredoka(32, 700))
                    .webLineHeight(32, 1.05)
                    .foregroundStyle(RC.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text("i'll check in when you open these.")
                    .font(.inter(16, 600))
                    .webLineHeight(16, 1.45)
                    .foregroundStyle(RC.ink2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            /* Rilo is on every onboarding page except the paywall */
            RiloView(skin: AppState.OG_SKIN, mood: "coach", size: 76, talks: true)
        }
    }
}

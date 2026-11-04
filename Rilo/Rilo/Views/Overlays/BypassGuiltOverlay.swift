import SwiftUI

/// App.jsx's BypassGuilt with kind "loosen" — "making it easier?" — for
/// state.loosenAsk (a loosening change in normal mode).
struct BypassGuiltOverlay: View {
    @Environment(AppState.self) private var state

    var body: some View {
        BypassGuilt(
            skin: state.chosenRilo,
            kind: "loosen",
            title: "making it easier?",
            hobbies: state.profileList("hobby"),
            goals: state.profileList("goal"),
            streak: state.streak,
            confirmLabel: "change it",
            onConfirm: { state.loosenConfirm($0) },
            onCancel: { state.loosenCancel() }
        )
    }
}

import SwiftUI

/// Port of app/src/screens/Limits.jsx — placeholder until the real screen is ported.
/// `onboarding` is the "edit" link on Your plan (screen `limitsonboard`):
/// there, back and continue both return to Your plan.
struct LimitsView: View {
    var onboarding = false

    var body: some View {
        PlaceholderScreen(name: onboarding ? "limitsonboard" : "limits")
    }
}

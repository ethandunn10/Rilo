import SwiftUI

/* The overlays App.jsx draws on top of the screens. Stubs for now — later
   ports fill each in. RootView already shows them under exactly the web's
   conditions (see AppState+Derived showBanner / showTour / showDemoPanel),
   in the web's z order: Banner 40, BypassGuilt 50, MeetRiloTour 60,
   DemoPanel 60 (drawn after the tour), RiloHandoff 70. */

/// components/Banner.jsx — Rilo's fake iOS notification on the shield.
/// Tap: state.bannerTap()
struct BannerOverlay: View {
    var body: some View { EmptyView() }
}

/// components/BypassGuilt.jsx with kind "loosen" — "making it easier?"
/// for state.loosenAsk. Cancel: state.loosenCancel(); confirm: state.loosenConfirm(reason)
struct BypassGuiltOverlay: View {
    var body: some View { EmptyView() }
}

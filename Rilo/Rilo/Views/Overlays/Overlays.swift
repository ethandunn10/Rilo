import SwiftUI

/* The overlays App.jsx draws on top of the screens each live in their own
   file in this folder (BannerOverlay, BypassGuiltOverlay, MeetRiloTour,
   DemoPanel, RiloHandoff). RootView shows them under exactly the web's
   conditions (see AppState+Derived showBanner / showTour / showDemoPanel),
   in the web's z order: Banner 40, BypassGuilt 50, MeetRiloTour 60,
   DemoPanel 60 (drawn after the tour), RiloHandoff 70. */

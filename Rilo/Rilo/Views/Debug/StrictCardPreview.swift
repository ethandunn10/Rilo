import SwiftUI

/// DEMO/DEBUG ONLY: the strict mode card on its own, for checking it
/// against the web's You tab before the You tab is ported (phase 5).
/// Launch with `-screen strictcard`, plus any of:
///   -strict          strict mode on           -strictending   ...and winding down (24h)
///   -strictpicking   the how long / when picker open (strict off)
///   -strictshowing   "what changes?" table open
///   -strictconfirm   "get through 24 hours first?" panel (strict on)
struct StrictCardPreview: View {
    @Environment(AppState.self) private var state

    var body: some View {
        ZStack(alignment: .top) {
            SkyView(hills: .low).ignoresSafeArea()
            ScrollView(.vertical, showsIndicators: false) {
                StrictCard(skin: state.chosenRilo, strict: state.strict,
                           onTurnOn: { state.strictOn(days: $0, when: $1) },
                           onAskOff: state.strictAskOff, onKeepOn: state.strictKeepOn,
                           onTurnOffNow: state.strictOffNow)
                    .padding(.horizontal, 20)
                    .padding(.top, WebLayout.top(52))
                    .padding(.bottom, 40)
            }
        }
    }
}

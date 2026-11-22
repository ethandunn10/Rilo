import SwiftUI

/// An app's name on its own (a row title, a chip). For a real Screen Time
/// pick, iOS draws the real name (`RiloAppLabel`), since Rilo can't read it;
/// otherwise it's just the label. Font/colour modifiers apply to both.
struct AppName: View {
    let app: String

    var body: some View {
        if Apps.isHiddenName(app) {
            RiloAppLabel(key: app)
                .labelStyle(.titleOnly)
                .lineLimit(1)
        } else {
            Text(app)
        }
    }
}

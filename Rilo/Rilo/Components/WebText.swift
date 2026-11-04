import SwiftUI

extension View {
    /// CSS `line-height: <lineHeight>` for text at `fontSize`: every line is
    /// exactly fontSize x lineHeight tall, tighter than the font's own
    /// spacing too (e.g. a 1.05 headline). `natural` is kept for old call sites.
    func webLineHeight(_ fontSize: CGFloat, _ lineHeight: CGFloat, natural: CGFloat = 1.21) -> some View {
        self.lineHeight(.exact(points: fontSize * lineHeight))
    }
}

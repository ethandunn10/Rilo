import SwiftUI
import UIKit

extension View {
    /// CSS `line-height: <lineHeight>` for text at `fontSize`: every line is
    /// exactly fontSize x lineHeight tall, tighter than the font's own
    /// spacing too (e.g. a 1.05 headline). `natural` is kept for old call sites.
    /// The line height grows with the Text Size setting the same way the
    /// font does (Font.fredoka/inter/nunito), so bigger text never overlaps.
    func webLineHeight(_ fontSize: CGFloat, _ lineHeight: CGFloat, natural: CGFloat = 1.21) -> some View {
        modifier(WebLineHeight(points: fontSize * lineHeight, style: Font.textStyle(for: fontSize)))
    }
}

private struct WebLineHeight: ViewModifier {
    let points: CGFloat
    let style: Font.TextStyle
    @Environment(\.dynamicTypeSize) private var size

    func body(content: Content) -> some View {
        content.lineHeight(.exact(points: TextScale.scaled(points, style: style, size: size)))
    }
}

/// Scales a web pixel value the way a custom font `relativeTo:` that style
/// scales at the current Text Size. At the default size it returns `value`.
enum TextScale {
    static func scaled(_ value: CGFloat, style: Font.TextStyle, size: DynamicTypeSize) -> CGFloat {
        if size == .large { return value }
        let traits = UITraitCollection(preferredContentSizeCategory: UIContentSizeCategory(size))
        return UIFontMetrics(forTextStyle: uiStyle(style)).scaledValue(for: value, compatibleWith: traits)
    }

    private static func uiStyle(_ s: Font.TextStyle) -> UIFont.TextStyle {
        switch s {
        case .largeTitle: return .largeTitle
        case .title: return .title1
        case .title2: return .title2
        case .title3: return .title3
        default: return .body
        }
    }
}

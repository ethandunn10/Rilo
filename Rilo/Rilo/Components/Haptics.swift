import UIKit

/// Subtle haptics (Phase 7). Every button gets `tap` through the shared
/// `.tap` button style (Styles.swift); the rest are a handful of moments:
///   soft     tapping Rilo
///   success  level up, Pro unlocked, a day under the goal
///   warning  the shield, out of opens
@MainActor
enum Haptics {
    private static let light = UIImpactFeedbackGenerator(style: .light)
    private static let softGen = UIImpactFeedbackGenerator(style: .soft)
    private static let note = UINotificationFeedbackGenerator()

    static func tap() { light.impactOccurred(intensity: 0.55) }
    static func soft() { softGen.impactOccurred(intensity: 0.7) }
    static func success() { note.notificationOccurred(.success) }
    static func warning() { note.notificationOccurred(.warning) }
}

#if RILO_FAMILY_CONTROLS
import UIKit
import ManagedSettings
import ManagedSettingsUI

/// Target: RiloShieldConfiguration (Shield Configuration Extension).
/// Also needs Shared/AppGroup.swift, Shared/RiloShared.swift, Shared/RiloTokens.swift,
/// and the Rilo images rilo-original-coach / rilo-original-letdown (tick the
/// app's Assets.xcassets for this target too).
///
/// Rilo's copy from Shield.jsx / ShieldView.swift, one-to-one. A real shield
/// can only show a picture, a title, one line and two buttons, which is
/// exactly why the web's shield was designed that bare.
nonisolated final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
    // RiloColors.swift
    private static let ink = UIColor(red: 0x12 / 255, green: 0x30 / 255, blue: 0x1A / 255, alpha: 1)    // RC.ink
    private static let ink2 = UIColor(red: 0x2C / 255, green: 0x4A / 255, blue: 0x36 / 255, alpha: 1)   // RC.ink2
    private static let green = UIColor(red: 0x4C / 255, green: 0xC1 / 255, blue: 0x60 / 255, alpha: 1)  // RC.green
    private static let sky = UIColor(red: 0xEE / 255, green: 0xF8 / 255, blue: 0xEE / 255, alpha: 1)    // RC.skyBottom

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        let key = application.token.map { RiloTokens.key(for: $0) }
        return make(name: application.localizedDisplayName ?? "this app", key: key)
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        /* picked on its own → its own rule; otherwise its category's */
        let appKey = application.token.map { RiloTokens.key(for: $0) }
        let catKey = category.token.map { RiloTokens.key(for: $0) }
        let key = appKey.flatMap { RiloShared.rules.apps[$0] != nil ? $0 : nil } ?? catKey
        return make(name: application.localizedDisplayName ?? category.localizedDisplayName ?? "this app", key: key)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        make(name: webDomain.domain ?? "this site", key: nil)
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        make(name: webDomain.domain ?? "this site", key: category.token.map { RiloTokens.key(for: $0) })
    }

    // MARK: Shield.jsx

    private func make(name: String, key: String?) -> ShieldConfiguration {
        let app = name.lowercased()
        let rules = RiloShared.rules
        let rule = key.flatMap { rules.apps[$0] }
        let scheduleLocked = rules.scheduleKind != nil
        let locked = scheduleLocked || rule?.lockKind != nil
        let mode = rule?.mode ?? "limited"

        let skin = RiloShared.widget?.skin ?? "original"
        let mood = locked ? "letdown" : "coach"
        let icon = UIImage(named: "rilo-\(skin)-\(mood)") ?? UIImage(named: "rilo-original-\(mood)")

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialLight,
            backgroundColor: Self.sky,
            icon: icon,
            title: .init(text: locked ? "rilo locked \(app)" : "\(app)?", color: Self.ink),
            subtitle: .init(text: subline(rules: rules, mode: mode, locked: locked, rule: rule), color: Self.ink2),
            primaryButtonLabel: .init(text: "talk to rilo", color: .white),
            primaryButtonBackgroundColor: Self.green,
            secondaryButtonLabel: .init(text: "close", color: Self.ink))
    }

    /// ShieldView.subline, plus the opens line the web shows as circles
    private func subline(rules: SharedRules, mode: String, locked: Bool, rule: SharedApp?) -> String {
        if let kind = rules.scheduleKind {
            let at = Self.fmtClock(rules.scheduleUntil)
            switch kind {
            case "bedtime": return "bedtime. open again at \(at)"
            case "school": return "school hours. open again at \(at)"
            default: return "focus block. open again at \(at)"
            }
        }
        if mode == "blocked" { return "blocked. your pass still works." }
        if locked { return "no opens left. fresh ones at midnight." }
        if mode == "limited", let rule {
            return "tap through and i’ll ask what for.\n\(Self.opensText(rule.opensLeft, rule.minutesPerOpen))"
        }
        return "tap through and i’ll ask what for."
    }

    /// Limits.opensText ("2½ opens left · 15 min each")
    private static func opensText(_ left: Double, _ minutes: Int) -> String {
        if left <= 0 { return "no opens left · \(minutes) min each" }
        if left == 0.5 { return "½ an open left · \(minutes) min each" }
        let whole = Int(left)
        let n = "\(whole)\(left - Double(whole) >= 0.5 ? "½" : "")"
        return "\(n) \(left == 1 ? "open" : "opens") left · \(minutes) min each"
    }

    /// Addons.fmtClock: "07:00" → "7:00am", "15:30" → "3:30pm"
    private static func fmtClock(_ hhmm: String?) -> String {
        let p = (hhmm ?? "").split(separator: ":").compactMap { Int($0) }
        let t = p.count == 2 ? p[0] * 60 + p[1] : 0
        let h = t / 60
        let h12 = h % 12 == 0 ? 12 : h % 12
        return "\(h12):\(String(format: "%02d", t % 60))\(h >= 12 ? "pm" : "am")"
    }
}
#endif

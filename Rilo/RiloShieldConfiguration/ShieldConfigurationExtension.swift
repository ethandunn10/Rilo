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
    /// RC.greenDeep: white text on it stays readable (RC.green is too light)
    private static let green = UIColor(red: 0x2E / 255, green: 0x8B / 255, blue: 0x3E / 255, alpha: 1)
    /// RC.card, Rilo's cream
    private static let cream = UIColor(red: 0xFF / 255, green: 0xFB / 255, blue: 0xF1 / 255, alpha: 1)

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

    // MARK: what the shield says

    /// Apple lets a shield set: the background colour and blur, one icon,
    /// the title and subtitle (text + colour), and two buttons' labels and
    /// colours. Nothing else: no fonts, no layout, no icon size, no extra
    /// buttons, and it can't tick by itself. Every colour is set here (a
    /// default one turns white in dark mode).
    ///
    /// Can open: "hey. instagram again?" / "2 opens left today · 10 min each"
    ///   / "open instagram (5s)" / "never mind". After the first tap the
    ///   shield is redrawn with the seconds left ("hold on. 5 seconds."),
    ///   then "open instagram" once the wait is over (ShieldActionExtension).
    /// Locked (no opens, blocked, bedtime / school / focus): "talk to rilo",
    ///   which opens Rilo's check-in.
    private func make(name: String, key: String?) -> ShieldConfiguration {
        let app = name.lowercased()
        let rules = RiloShared.rules
        let rule = key.flatMap { rules.apps[$0] }
        let kicked = key.map { RiloShared.kicked.contains($0) } ?? false
        let lockKind = rules.scheduleKind ?? rule?.lockKind
        let canOpen = Self.canOpen(rules, rule)
        let wait = RiloShared.waitSeconds(rule, strict: rules.strict)
        let left = canOpen ? key.flatMap { RiloShared.waitLeft($0, rule, strict: rules.strict) } : nil

        let skin = RiloShared.widget?.skin ?? "original"
        let mood = !canOpen || kicked ? "letdown" : "coach"
        /* the square, trimmed panda (Assets rilo-shield-*): as big as the
           shield's fixed icon box allows */
        let icon = UIImage(named: "rilo-shield-\(skin)-\(mood)") ?? UIImage(named: "rilo-shield-original-\(mood)")
            ?? UIImage(named: "rilo-original-\(mood)")

        let title: String
        let subtitle: String
        let primary: String
        if !canOpen {
            let why = lockKind ?? (rule?.mode == "blocked" ? "blocked" : "noopens")
            title = Self.title(app: app, lockKind: why, kicked: kicked)
            subtitle = Self.subtitle(rules: rules, rule: rule, lockKind: why, kicked: kicked)
            primary = "talk to rilo"
        } else if let left, left > 0 {
            title = "hold on. \(left) \(left == 1 ? "second" : "seconds")."
            subtitle = "take a breath. tap open when it's up.\n\(Self.opensText(rule?.opensLeft ?? 0, rule?.minutesPerOpen ?? 0))"
            primary = "open \(app) (\(left)s)"
        } else if left == 0 {
            title = "okay. \(app) is yours."
            subtitle = Self.opensText(rule?.opensLeft ?? 0, rule?.minutesPerOpen ?? 0)
            primary = "open \(app)"
        } else {
            title = Self.title(app: app, lockKind: nil, kicked: kicked)
            subtitle = Self.opensText(rule?.opensLeft ?? 0, rule?.minutesPerOpen ?? 0)
            primary = "open \(app) (\(wait)s)"
        }

        return ShieldConfiguration(
            backgroundBlurStyle: nil,
            backgroundColor: Self.cream,
            icon: icon,
            title: .init(text: title, color: Self.ink),
            subtitle: .init(text: subtitle, color: Self.ink2),
            primaryButtonLabel: .init(text: primary, color: .white),
            primaryButtonBackgroundColor: Self.green,
            secondaryButtonLabel: .init(text: "never mind", color: Self.ink))
    }

    /// same rule as ShieldActionExtension.canOpen: a Limited app with an
    /// open left and no lock or schedule
    static func canOpen(_ rules: SharedRules, _ rule: SharedApp?) -> Bool {
        guard let rule, rules.scheduleKind == nil, rule.lockKind == nil else { return false }
        return rule.mode == "limited" && rule.opensLeft > 0
    }

    static func title(app: String, lockKind: String?, kicked: Bool) -> String {
        switch lockKind {
        case "bedtime": return "bedtime. \(app) can wait."
        case "school": return "school hours. \(app) can wait."
        case "focus": return "focus block. \(app) can wait."
        case "blocked": return "\(app) is blocked."
        case "noopens", "halfstranded": return "no opens left for \(app)."
        default: return kicked ? "time's up on \(app)." : "hey. \(app) again?"
        }
    }

    static func subtitle(rules: SharedRules, rule: SharedApp?, lockKind: String?, kicked: Bool) -> String {
        if rules.scheduleKind != nil { return "opens again at \(fmtClock(rules.scheduleUntil))." }
        switch lockKind {
        case "blocked": return "talk to rilo if it's an emergency."
        case "noopens", "halfstranded": return "fresh opens at midnight.\ntalk to rilo about your emergency pass."
        default: return "talk to rilo first."
        }
    }

    /// Limits.opensText ("2½ opens left today · 15 min each")
    static func opensText(_ left: Double, _ minutes: Int) -> String {
        if left <= 0 { return "no opens left today" }
        if left == 0.5 { return "½ an open left today · \(minutes) min" }
        let whole = Int(left)
        let n = "\(whole)\(left - Double(whole) >= 0.5 ? "½" : "")"
        return "\(n) \(left == 1 ? "open" : "opens") left today · \(minutes) min each"
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

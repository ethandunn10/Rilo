import Foundation

/// Port of app/src/lib/levels.js — levels, XP thresholds and the skin ladder.
/// Don't speed these up.

nonisolated struct SkinInfo: Equatable, Sendable {
    var level: Int
    var skin: String
    var name: String
    var legendary = false
}

nonisolated struct SkinStatus: Equatable, Sendable {
    var info: SkinInfo
    /// 'free' | 'pro'
    var tier: String
    var unlocked: Bool
    /// 'demo' | 'free' | 'pro' | 'earned' | 'level'
    var reason: String
}

nonisolated struct LevelProgress: Equatable, Sendable {
    var current: Int
    var next: Int?
    var pct: Int
    var atMax: Bool
}

nonisolated enum Levels {
    /// total XP needed to REACH each level, index 0 = level 1
    static let LEVEL_XP: [Int] = [
        0, 150, 350, 600, 900, 1300, 1800, 2400, 3100, 4000,
        4220, 4440, 4660, 4890, 5120, 5350, 5580, 5820, 6060, 6300,
        6540, 6780, 7030, 7280, 7530, 7780, 8040, 8300, 8560, 8820,
        9080, 9350, 9620, 9890, 10160, 10440, 10720, 11000, 11280, 11570,
        11860, 12150, 12440, 12730, 13030, 13330, 13630, 13930, 14240, 14550,
        14860, 15170, 15480, 15800, 16120, 16440, 16760, 17090, 17420, 17750,
        18080, 18410, 18750, 19090, 19430, 19770, 20120, 20470, 20820, 21170,
        21520, 21880, 22240, 22600, 22960, 23330, 23700, 24070, 24440, 24820,
        25200, 25580, 25960, 26340, 26730, 27120, 27510, 27900, 28300, 28700,
        29100, 29500, 29900, 30310, 30720, 31130, 31540, 31960, 32380, 32800,
    ]

    static var MAX_LEVEL: Int { LEVEL_XP.count }

    /// one skin per level, in level order
    static let SKIN_LADDER: [SkinInfo] = [
        SkinInfo(level: 1, skin: "original", name: "original"),
        SkinInfo(level: 2, skin: "proband", name: "pro band"),
        SkinInfo(level: 3, skin: "bamboo", name: "bamboo"),
        SkinInfo(level: 4, skin: "shades", name: "shades"),
        SkinInfo(level: 5, skin: "beanie", name: "beanie"),
        SkinInfo(level: 6, skin: "sakura", name: "sakura"),
        SkinInfo(level: 7, skin: "studio", name: "studio"),
        SkinInfo(level: 8, skin: "redpanda", name: "red panda"),
        SkinInfo(level: 9, skin: "pinkpanda", name: "pink panda"),
        SkinInfo(level: 10, skin: "gold", name: "gold"),
        SkinInfo(level: 15, skin: "hoops", name: "hoops"),
        SkinInfo(level: 20, skin: "dimsum", name: "dim sum"),
        SkinInfo(level: 25, skin: "astro", name: "astronaut"),
        SkinInfo(level: 30, skin: "cowboy", name: "cowboy"),
        SkinInfo(level: 35, skin: "ninja", name: "ninja"),
        SkinInfo(level: 40, skin: "chef", name: "chef"),
        SkinInfo(level: 45, skin: "gamer", name: "gamer"),
        SkinInfo(level: 50, skin: "ronin", name: "ronin"),
        SkinInfo(level: 60, skin: "lunar", name: "lunar"),
        SkinInfo(level: 70, skin: "bambooking", name: "bamboo warrior"),
        SkinInfo(level: 80, skin: "shadow", name: "shadow"),
        SkinInfo(level: 90, skin: "sensei", name: "sensei"),
        SkinInfo(level: 100, skin: "samurai", name: "samurai", legendary: true),
    ]

    static func skinInfo(_ skin: String) -> SkinInfo {
        SKIN_LADDER.first { $0.skin == skin } ?? SKIN_LADDER[0]
    }

    /// the newest skin you have at this level
    static func skinForLevel(_ level: Int) -> SkinInfo {
        var best = SKIN_LADDER[0]
        for s in SKIN_LADDER where s.level <= level && s.level > best.level { best = s }
        return best
    }

    /// skins unlocked going from oldLevel up to newLevel, newest first
    static func skinsUnlockedBetween(_ oldLevel: Int, _ newLevel: Int) -> [SkinInfo] {
        SKIN_LADDER.filter { $0.level > oldLevel && $0.level <= newLevel }.sorted { $0.level > $1.level }
    }

    static func nextSkinAfter(_ level: Int) -> SkinInfo? {
        SKIN_LADDER.first { $0.level > level }
    }

    /// XP amounts (section 4)
    enum XP {
        static let done = 10
        static let suggestion = 40
        static let tired = 20
        static let more = -15
    }

    static func levelFor(_ xp: Int) -> Int {
        var level = 1
        for (i, need) in LEVEL_XP.enumerated() where xp >= need { level = i + 1 }
        return level
    }

    static func levelProgress(_ xp: Int, _ level: Int) -> LevelProgress {
        let lv = min(max(level, 1), MAX_LEVEL)
        if lv >= MAX_LEVEL { return LevelProgress(current: xp, next: nil, pct: 100, atMax: true) }
        let nextAt = LEVEL_XP[lv]
        let pct = max(0, min(100, JS.roundInt(Double(xp) / Double(nextAt) * 100)))
        return LevelProgress(current: xp, next: nextAt, pct: pct, atMax: false)
    }

    /// DEMO SWITCH — false means real Pro + level gating is on.
    static let UNLOCK_ALL = false

    static func skinTier(_ skin: String) -> String {
        skinInfo(skin).level == 1 ? "free" : "pro"
    }

    static func skinState(_ skin: String, isPro: Bool, level: Int) -> SkinStatus {
        let info = skinInfo(skin)
        let tier = skinTier(skin)
        if UNLOCK_ALL { return SkinStatus(info: info, tier: tier, unlocked: true, reason: "demo") }
        if info.level == 1 { return SkinStatus(info: info, tier: tier, unlocked: true, reason: "free") }
        if !isPro { return SkinStatus(info: info, tier: tier, unlocked: false, reason: "pro") }
        if level >= info.level { return SkinStatus(info: info, tier: tier, unlocked: true, reason: "earned") }
        return SkinStatus(info: info, tier: tier, unlocked: false, reason: "level")
    }
}

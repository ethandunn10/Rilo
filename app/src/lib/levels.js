/* Levels, XP thresholds and the skin ladder.
   Levels 1-10: straight from RILO_PANDA_UPDATE.md section 3 + 4.
   Levels 11-100 (skins-15-100 branch): each level costs a bit more than the
   last (220 XP at level 11 up to ~420 XP at level 100). At ~80 XP a day of
   real use that's ~7 weeks to level 10 and well over a year to level 100.
   Don't speed these up. */

/* total XP needed to REACH each level, index 0 = level 1 */
export const LEVEL_XP = [
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
];

export const MAX_LEVEL = LEVEL_XP.length;

/* one skin per level, in level order */
export const SKIN_LADDER = [
  { level: 1, skin: 'original', name: 'original' },
  { level: 2, skin: 'proband', name: 'pro band' },
  { level: 3, skin: 'bamboo', name: 'bamboo' },
  { level: 4, skin: 'shades', name: 'shades' },
  { level: 5, skin: 'beanie', name: 'beanie' },
  { level: 6, skin: 'sakura', name: 'sakura' },
  { level: 7, skin: 'studio', name: 'studio' },
  { level: 8, skin: 'redpanda', name: 'red panda' },
  { level: 9, skin: 'pinkpanda', name: 'pink panda' },
  { level: 10, skin: 'gold', name: 'gold' },

  /* Levels 15-100 (final picks, Oct 29): a skin every 5 levels to 50,
     then every 10 to 100. */
  { level: 15, skin: 'hoops', name: 'hoops' },
  { level: 20, skin: 'dimsum', name: 'dim sum' },
  { level: 25, skin: 'astro', name: 'astronaut' },
  { level: 30, skin: 'cowboy', name: 'cowboy' },
  { level: 35, skin: 'ninja', name: 'ninja' },
  { level: 40, skin: 'chef', name: 'chef' },
  { level: 45, skin: 'gamer', name: 'gamer' },
  { level: 50, skin: 'ronin', name: 'ronin' },
  { level: 60, skin: 'lunar', name: 'lunar' },
  { level: 70, skin: 'bambooking', name: 'bamboo warrior' },
  { level: 80, skin: 'shadow', name: 'shadow' },
  { level: 90, skin: 'sensei', name: 'sensei' },
  { level: 100, skin: 'samurai', name: 'samurai', legendary: true },
];

const BY_SKIN = new Map(SKIN_LADDER.map((s) => [s.skin, s]));

export function skinInfo(skin) {
  return BY_SKIN.get(skin) ?? SKIN_LADDER[0];
}

/* The newest skin you have at this level (the last one on the ladder you've
   reached). */
export function skinForLevel(level) {
  let best = SKIN_LADDER[0];
  for (const s of SKIN_LADDER) {
    if (s.level <= level && s.level > best.level) best = s;
  }
  return best;
}

/* The skin(s) you just unlocked going from oldLevel up to newLevel, newest
   first. Most level-ups past 10 unlock nothing (skins are every 5 / 10). */
export function skinsUnlockedBetween(oldLevel, newLevel) {
  return SKIN_LADDER.filter((s) => s.level > oldLevel && s.level <= newLevel).sort(
    (a, b) => b.level - a.level,
  );
}

/* The next skin you're working toward. */
export function nextSkinAfter(level) {
  return SKIN_LADDER.find((s) => s.level > level) ?? null;
}

/* XP amounts (section 4) */
export const XP = {
  done: 10,
  suggestion: 40,
  tired: 20,
  more: -15,
};

/* which level a given total XP earns */
export function levelFor(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_XP.length; i += 1) {
    if (xp >= LEVEL_XP[i]) level = i + 1;
  }
  return level;
}

/* Progress bar: where you are between this level and the next.
   At max level the bar is full and there is no next. */
export function levelProgress(xp, level) {
  const lv = Math.min(Math.max(level, 1), MAX_LEVEL);

  if (lv >= MAX_LEVEL) {
    return { current: xp, next: null, pct: 100, atMax: true };
  }

  const nextAt = LEVEL_XP[lv]; /* XP needed for lv + 1 */
  const pct = Math.max(0, Math.min(100, Math.round((xp / nextAt) * 100)));
  return { current: xp, next: nextAt, pct, atMax: false };
}

/* DEMO SWITCH — everything is unlocked for everyone right now.
   There will be a paid plan later: the Paywall still appears in the flow and
   skins still carry their "pro" / level labels so testers can see what's
   coming, but nothing is actually blocked. Flip this to false to turn the
   real Pro + level gating back on; the rules below are already written. */
export const UNLOCK_ALL = true;

/* What tier a skin WILL be once the paid plan is real. */
export function skinTier(skin) {
  const info = skinInfo(skin);
  return info.level === 1 ? 'free' : 'pro';
}

/* Is this skin wearable?
   With UNLOCK_ALL on, always. Otherwise: free users only ever get Original,
   and Pro users unlock one per level. */
export function skinState(skin, { isPro, level }) {
  const info = skinInfo(skin);
  const tier = skinTier(skin);

  if (UNLOCK_ALL) return { ...info, tier, unlocked: true, reason: 'demo' };

  if (info.level === 1) return { ...info, tier, unlocked: true, reason: 'free' };
  if (!isPro) return { ...info, tier, unlocked: false, reason: 'pro' };
  if (level >= info.level) return { ...info, tier, unlocked: true, reason: 'earned' };
  return { ...info, tier, unlocked: false, reason: 'level' };
}

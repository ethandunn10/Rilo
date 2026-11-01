/* The app catalog for PickApps and the add-app sheet.

   Logos come from Simple Icons (simpleicons.org) via the `simple-icons`
   package, shown in the brand's own colour.

   Six of the apps the spec lists are NOT in Simple Icons any more — minecraft,
   clash royale, hulu, disney+, amazon and prime video were all removed
   upstream over trademark concerns. Those fall back to the spec's letter
   icon, with the brand colour kept so they still read correctly.

   The four always-allowed apps (phone, messages, maps, camera) are Apple's
   own, so they aren't in Simple Icons either. They get letter tiles in the
   iOS system colours. They're in the catalog because the user can change
   what's always allowed, so they have to be visible and settable. */

import {
  siTiktok,
  siInstagram,
  siYoutube,
  siSnapchat,
  siX,
  siReddit,
  siDiscord,
  siNetflix,
  siTwitch,
  siPinterest,
  siFacebook,
  siThreads,
  siBereal,
  siSpotify,
  siRoblox,
  siFortnite,
  siWhatsapp,
  siTelegram,
  siTumblr,
} from 'simple-icons';

const icon = (si) => ({ path: si.path, hex: `#${si.hex}` });

/* label is what the app is called in the UI (lowercase, like the designs) */
export const APP_CATALOG = [
  /* the four that ship always-allowed (lib/limits DEFAULT_ALWAYS) */
  { label: 'phone', logo: null, hex: '#34C759' },
  { label: 'messages', logo: null, hex: '#30B94D' },
  { label: 'maps', logo: null, hex: '#1A73E8' },
  { label: 'camera', logo: null, hex: '#636366' },

  { label: 'tiktok', logo: icon(siTiktok) },
  { label: 'instagram', logo: icon(siInstagram) },
  { label: 'youtube', logo: icon(siYoutube) },
  { label: 'snapchat', logo: icon(siSnapchat) },
  { label: 'x', logo: icon(siX) },
  { label: 'reddit', logo: icon(siReddit) },
  { label: 'discord', logo: icon(siDiscord) },
  { label: 'netflix', logo: icon(siNetflix) },
  { label: 'twitch', logo: icon(siTwitch) },
  { label: 'pinterest', logo: icon(siPinterest) },
  { label: 'facebook', logo: icon(siFacebook) },
  { label: 'threads', logo: icon(siThreads) },
  { label: 'bereal', logo: icon(siBereal) },
  { label: 'spotify', logo: icon(siSpotify) },
  { label: 'roblox', logo: icon(siRoblox) },
  { label: 'fortnite', logo: icon(siFortnite) },
  /* no Simple Icon available — letter fallback, brand colour kept */
  { label: 'minecraft', logo: null, hex: '#52A535' },
  { label: 'clash royale', logo: null, hex: '#1C8ADB' },
  { label: 'whatsapp', logo: icon(siWhatsapp) },
  { label: 'telegram', logo: icon(siTelegram) },
  { label: 'hulu', logo: null, hex: '#1CE783' },
  { label: 'disney+', logo: null, hex: '#113CCF' },
  { label: 'amazon', logo: null, hex: '#FF9900' },
  { label: 'prime video', logo: null, hex: '#00A8E1' },
  { label: 'tumblr', logo: icon(siTumblr) },
];

/* the 5 rows PickApps starts with, same as the design */
export const STARTING_APPS = ['tiktok', 'instagram', 'youtube', 'snapchat', 'x'];

/* The four always-allowed apps are tracked without being picked: they show
   up in the limits list so they can be changed, but they're never part of
   "apps rilo watches" and never count against the free app cap. */
export const SYSTEM_APPS = ['phone', 'messages', 'maps', 'camera'];

const BY_LABEL = new Map(APP_CATALOG.map((a) => [a.label, a]));

/* Anything not in the catalog gets a letter tile in Rilo green,
   the same colour the design used for added apps. */
const FALLBACK_HEX = '#2E8B3E';

export function appInfo(label) {
  const found = BY_LABEL.get(label);
  if (found) {
    return {
      label,
      logo: found.logo,
      hex: found.logo ? found.logo.hex : found.hex,
    };
  }
  return { label, logo: null, hex: FALLBACK_HEX };
}

export function searchApps(query) {
  const q = query.trim().toLowerCase();
  if (!q) return APP_CATALOG;
  return APP_CATALOG.filter((a) => a.label.includes(q));
}

/* ---------- colour helpers ----------
   A few brand colours are far too light to read as a glyph (snapchat's
   #FFFC00 for one), so they get darkened until they do. The tile behind is
   the same colour at low alpha, which keeps each row recognisable. */

function rgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/* brand colour, darkened only if it would wash out on a near-white tile */
export function glyphColor(hex) {
  let [r, g, b] = rgb(hex);
  let lum = luminance(hex);
  let guard = 0;
  while (lum > 0.3 && guard < 24) {
    r = Math.round(r * 0.88);
    g = Math.round(g * 0.88);
    b = Math.round(b * 0.88);
    const next = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    lum = luminance(next);
    guard += 1;
  }
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function tileColor(hex, alpha = 0.12) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ---------- which apps the tester actually picked ----------
   Row order matches PickApps: the starting five, then anything added. */

export function pickedApps(apps) {
  return STARTING_APPS.concat(apps.extra)
    .filter((label) => apps.on[label])
    .filter((label) => !SYSTEM_APPS.includes(label));
}

/* Every app with a setting: the ones they picked, plus the always-allowed
   four and anything they've added to that list themselves. The limits
   screen runs off this, not off pickedApps. */
export function trackedApps(apps, appSettings = {}) {
  const picked = pickedApps(apps);
  const always = Object.keys(appSettings).filter(
    (label) => !picked.includes(label) && appSettings[label]?.mode === 'always',
  );
  const system = SYSTEM_APPS.filter((label) => !always.includes(label));
  return picked.concat(system, always);
}

/* 1st, 2nd, 3rd, 4th ... for "4th time today" */
export function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

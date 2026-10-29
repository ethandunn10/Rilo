/* Turns designs/rilo-panda/{skin}-{mood}.svg into one inlineable JS module.
   Run with: npm run build:rilo

   The art is used EXACTLY as drawn — this only strips the c2pa <metadata>
   block and the outer <svg> wrapper, so the component can supply its own
   size while keeping every path, colour and built-in animation untouched. */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'designs', 'rilo-panda');
const OUT = join(here, '..', 'src', 'rilo', 'sprites.js');

const SKINS = [
  'original', 'proband', 'bamboo', 'shades', 'beanie',
  'sakura', 'studio', 'redpanda', 'pinkpanda', 'gold',
  /* levels 15-100 (final picks, Oct 29) */
  'hoops', 'dimsum', 'astro', 'cowboy', 'ninja', 'chef', 'gamer',
  'ronin', 'lunar', 'bambooking', 'shadow', 'sensei', 'samurai',
];
const MOODS = ['coach', 'wave', 'proud', 'curious', 'sleepy', 'letdown', 'angry'];

/* ---------- headband text ----------
   The only change made to the art, and only to the "RILO" <text>:

   1. At the drawn size the word fills barely a third of the band, so it
      turns to mush anywhere the app draws Rilo small (the tab bar, the
      Pick-your-Rilo tiles). Bumping 12 -> 16 fills the band properly and
      keeps "RILO" readable. 18 was tried and crowds the band's stroke.
   2. The baseline sits on the band's lower edge, so the letters rest on the
      dark stroke. Raising it 3px centres them in the band.
   3. beanie draws the word twice — once on the base band (buried under the
      hat) and again on the brim. Only the visible one is kept.

   Every other path, colour and animation is passed through untouched. */

const TEXT_SIZE = 16;
const TEXT_RAISE = 3;

function fixHeadbandText(svg, name) {
  const texts = svg.match(/<text[^>]*>RILO<\/text>/g) ?? [];
  if (!texts.length) {
    /* some level 15-100 skins wear a hat/helmet instead of the headband
       (skater, pirate, cowboy, wizard, robot, knight, samurai...) — nothing
       to fix there */
    return svg;
  }

  let out = svg;

  /* drop every copy but the last — the last one is the one on top */
  for (const buried of texts.slice(0, -1)) {
    out = out.replace(buried, '');
  }

  const keep = texts[texts.length - 1];
  const y = Number(keep.match(/\by="([\d.]+)"/)[1]);
  const ny = y - TEXT_RAISE;

  const fixed = keep
    .replace(/\by="[\d.]+"/, `y="${ny}"`)
    .replace(/rotate\((-?[\d.]+) 101 [\d.]+\)/, `rotate($1 101 ${ny})`)
    .replace(/font-size="[\d.]+"/, `font-size="${TEXT_SIZE}"`);

  return out.replace(keep, fixed);
}

/* ---------- RILO on the four hat skins ----------
   cowboy, gamer, ronin and samurai wear headwear instead of the headband, so
   the art has no "RILO" anywhere. This puts the word on the natural band of
   each piece of headwear, in that skin's own colours:

     cowboy   the dark band around the hat crown      (white on brown)
     ronin    the front of the straw hat              (ink on straw)
     gamer    the top of the headset arc, like a      (white on charcoal)
              headset brand label
     samurai  the helmet dome, between its two ridge  (gold on black)
              lines — the gold brow band is only 7
              units tall, too thin to hold the word

   Measured from each band's own path, and the headwear is identical across
   all 7 moods, so one placement per skin covers every mood. The word is
   appended last so nothing can cover it.

   TO REVERSE: set this to false and re-run `npm run build:rilo`. The source
   SVGs are never modified, so that restores the art exactly as drawn. */
const ADD_MISSING_RILO = true;

const HAT_RILO = {
  cowboy: { y: 60, size: 9, spacing: 1.5, fill: '#FFFFFF' },
  ronin: { y: 70, size: 15, spacing: 2, fill: '#1B1F1A' },
  gamer: { y: 42, size: 10, spacing: 1.5, fill: '#FFFFFF' },
  samurai: { y: 70, size: 15, spacing: 2, fill: '#E8B931' },
};

/* ---------- gamer proportions ----------
   As drawn, the headset arc floats above the crown and the face sits low,
   so the forehead is a big empty dome and Rilo reads tiny inside it. This:

     - grows the earcups (24x40 -> 34x52) and thickens the band (9 -> 12)
     - drops the band so it rests on the crown instead of hovering
     - lifts the whole face block 12 units so the eyes sit higher

   The face block is everything between the band and the arms, which is the
   same run in every mood, so one rule covers all seven.

   TO REVERSE: set this to false and re-run `npm run build:rilo`. */
const GAMER_TWEAKS = true;

const FACE_LIFT = 12;

function tweakGamer(svg, skin) {
  if (!GAMER_TWEAKS || skin !== 'gamer') return svg;

  let out = svg;

  /* bigger earcups, and LEDs re-centred inside them */
  out = out
    .replace(
      /<rect x="14" y="82" width="24" height="40" rx="11"/,
      '<rect x="8" y="76" width="34" height="52" rx="15"',
    )
    .replace(
      /<rect x="162" y="82" width="24" height="40" rx="11"/,
      '<rect x="158" y="76" width="34" height="52" rx="15"',
    )
    .replace(
      /<rect x="19" y="90" width="5" height="24" rx="2.5"/,
      '<rect x="22" y="88" width="6" height="30" rx="3"',
    )
    .replace(
      /<rect x="176" y="90" width="5" height="24" rx="2.5"/,
      '<rect x="172" y="88" width="6" height="30" rx="3"',
    );

  /* band: wider span to meet the new cups, lower so it sits on the head */
  out = out
    .replace(/d="M30 92 C24 20 176 20 170 92" fill="none" stroke="#23272E" stroke-width="9"/,
      'd="M25 84 C20 22 180 22 175 84" fill="none" stroke="#23272E" stroke-width="12"')
    .replace(/d="M30 92 C24 20 176 20 170 92" fill="none" stroke="#3A404A" stroke-width="3"/,
      'd="M25 84 C20 22 180 22 175 84" fill="none" stroke="#3A404A" stroke-width="4"');

  /* lift the face: everything after the band, up to the first arm stroke */
  const bandEnd = out.indexOf('stroke="#3A404A"');
  if (bandEnd === -1) return out;

  const afterBand = out.indexOf('>', out.indexOf('</path>', bandEnd) + 1) + 1;
  const rest = out.slice(afterBand);
  const arm = rest.search(/<path [^>]*stroke-width="7"/);
  if (arm === -1) return out;

  const face = rest.slice(0, arm);
  return (
    out.slice(0, afterBand) +
    `<g transform="translate(0 -${FACE_LIFT})">${face}</g>` +
    rest.slice(arm)
  );
}

function addHatRilo(svg, skin) {
  if (!ADD_MISSING_RILO) return svg;

  const spec = HAT_RILO[skin];
  /* only for the hat skins, and never on top of art that already says RILO */
  if (!spec || /<text[^>]*>RILO<\/text>/.test(svg)) return svg;

  const text =
    `<text x="100" y="${spec.y}" text-anchor="middle" ` +
    `font-family="Fredoka, sans-serif" font-weight="700" ` +
    `font-size="${spec.size}" letter-spacing="${spec.spacing}" ` +
    `fill="${spec.fill}">RILO</text>`;

  return svg.replace(/<\/svg>\s*$/, `${text}</svg>`);
}

const files = readdirSync(SRC).filter((f) => f.endsWith('.svg'));
const viewBoxes = new Set();
const entries = [];
const missing = [];

for (const skin of SKINS) {
  for (const mood of MOODS) {
    const name = `${skin}-${mood}.svg`;
    if (!files.includes(name)) {
      missing.push(name);
      continue;
    }
    let s = readFileSync(join(SRC, name), 'utf8');

    s = s.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');
    s = fixHeadbandText(s, name);
    s = addHatRilo(s, skin);
    s = tweakGamer(s, skin);

    const open = s.match(/<svg[^>]*>/);
    viewBoxes.add(open[0].match(/viewBox="([^"]+)"/)[1]);

    const inner = s.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
    entries.push([`${skin}-${mood}`, inner]);
  }
}

if (missing.length) {
  console.error('MISSING art:', missing.join(', '));
  process.exit(1);
}
if (viewBoxes.size !== 1) {
  console.error('Expected one viewBox, got:', [...viewBoxes]);
  process.exit(1);
}

const viewBox = [...viewBoxes][0];
const body = entries
  .map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`)
  .join('\n');

writeFileSync(
  OUT,
  `/* GENERATED by scripts/build-rilo.mjs — do not edit by hand.
   Source art: designs/rilo-panda/{skin}-{mood}.svg (used exactly as drawn).
   Regenerate with: npm run build:rilo */

export const RILO_VIEWBOX = ${JSON.stringify(viewBox)};

export const SKINS = ${JSON.stringify(SKINS, null, 2)};

export const MOODS = ${JSON.stringify(MOODS, null, 2)};

export const SPRITES = {
${body}
};
`,
  'utf8',
);

console.log(`wrote ${entries.length} sprites (${SKINS.length} skins x ${MOODS.length} moods)`);
console.log(`viewBox ${viewBox}, ${(Buffer.byteLength(body) / 1024).toFixed(0)}KB of markup`);

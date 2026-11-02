/* Structural audit: on a phone the viewport is ~620-660px tall, not the
   844px the designs were drawn at. Any screen that lays content out at a
   fixed pixel top, or has a fixed-height container with no scroller, can
   clip with no way to reach what's cut off. Assert neither pattern remains. */
import { readdirSync, readFileSync } from 'fs';

const DIR = new URL('../src/screens', import.meta.url).pathname;
const PHONE_SHORTEST = 620;   /* iPhone SE in Safari, roughly */

/* genuinely full-bleed screens with no scrollable content to miss */
const EXEMPT = new Set(['AppOpen.jsx', 'Crunching.jsx', 'Results.jsx']);

let fail = 0;
const bad = (f, why) => { fail++; console.log(`  FAIL ${f}: ${why}`); };

const files = readdirSync(DIR).filter((f) => f.endsWith('.jsx'));

console.log(`auditing ${files.length} screens at ${PHONE_SHORTEST}px tall:\n`);

for (const f of files) {
  const src = readFileSync(`${DIR}/${f}`, 'utf8');

  /* 1. nothing laid out at a fixed top beyond what a phone can show.
        Tops inside a fixed-height card are fine — those are checked by the
        card's own height — so only flag ones past the phone's viewport. */
  const tops = [...src.matchAll(/top: (\d{3,}),/g)].map((m) => Number(m[1]));
  const tooDeep = tops.filter((t) => t >= 400);
  if (tooDeep.length) {
    bad(f, `content pinned at top ${tooDeep.join(', ')} — past a short phone's viewport`);
  }

  /* 2. a container that is exactly the viewport tall must be able to scroll */
  const fixedHeight = /height: '100%'/.test(src);
  const scrolls = src.includes('className="scroll-y"');
  if (fixedHeight && !scrolls && !EXEMPT.has(f)) {
    bad(f, "has a 100%-height container but no scroller — content past the fold is unreachable");
  }

  /* 3. a scroller must reserve its bottom space as --tail, not padding,
        or Chrome/Safari drop it and the last element hides behind the bar */
  if (scrolls) {
    /* only a THREE-value padding has a bottom; "0 4px" is horizontal-only.
       Look just inside the scroller's own style object. */
    const windows = [...src.matchAll(/className="scroll-y"[\s\S]{0,260}?\}\}/g)].map((m) => m[0]);
    const offenders = windows
      .map((w) => w.match(/padding: '\d+px \d+px (\d+)px'/))
      .filter((m) => m && Number(m[1]) > 0)
      .map((m) => m[1]);
    if (offenders.length) {
      bad(f, `scroller reserves ${offenders.join(', ')}px as padding-bottom, which the browser drops — use --tail`);
    }
  }
}

if (!fail) console.log('  every screen fits or scrolls');
console.log(fail ? `\n${fail} FAILED` : '\nall good');
process.exit(fail ? 1 : 0);

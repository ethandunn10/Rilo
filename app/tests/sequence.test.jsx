/* The number sequence in a real DOM.

   Three beats that run themselves can't be checked from rendered markup —
   only the first one exists there. What matters is everything after it:
   that it advances on its own, that a tap gets ahead of it, that skip
   lands on the beat with the button, that the flip quotes back the thing
   they said they'd rather be doing, and that none of it strands anyone
   who has asked their phone to stop moving things. */

import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'https://localhost/', pretendToBeVisual: true });
for (const [k, v] of Object.entries({
  window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent, localStorage: dom.window.localStorage,
})) globalThis[k] = v;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom has no matchMedia at all, so the screen has to cope with that too
   — and it's the switch this test needs to flip */
let reduced = false;
dom.window.matchMedia = (q) => ({
  matches: reduced && q.includes('reduce'),
  media: q,
  addEventListener() {},
  removeEventListener() {},
});

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const YourNumberModule = await import('../src/screens/YourNumber.jsx');
const YourNumber = YourNumberModule.default;
/* read the real beat timings rather than hardcoding them — they have been
   tuned twice now, and a copied number just goes stale */
const { BEAT_MS } = YourNumberModule;
const past = (n) => BEAT_MS[n] + 400;
const { daysPerYear, insteadOf } = await import('../src/lib/rather.js');

let fail = 0;
const is = (n, ok, extra = '') => {
  if (!ok) fail += 1;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`);
};

const breakdown = {
  blocked: 159,
  apps: [
    { app: 'tiktok', mins: 71, pct: 45, share: 0.45 },
    { app: 'instagram', mins: 52, pct: 33, share: 0.33 },
    { app: 'youtube', mins: 36, pct: 22, share: 0.22 },
  ],
};
const days = daysPerYear(breakdown.blocked);
const flip = insteadOf(breakdown.blocked, ['gym']);

const text = () => document.body.textContent.replace(/\s+/g, ' ').toLowerCase();
const buttonSaying = (s) =>
  [...document.querySelectorAll('button')].find((b) => b.textContent.toLowerCase().includes(s));
const click = async (el) => {
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
};
const wait = async (ms) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms));
  });
};

let root = createRoot(document.getElementById('root'));
let went = null;
let backed = 0;
/* a fresh key each time, or re-rendering the same component into the same
   root hands the next scenario the last one's beat */
let run = 0;
const mount = async () => {
  went = null;
  backed = 0;
  run += 1;
  await act(async () => {
    root.render(
      React.createElement(YourNumber, {
        key: `run-${run}`,
        go: (n) => { went = n; },
        skin: 'original',
        breakdown,
        picked: ['gym', 'reading'],
        isPro: false,
        onBack: () => { backed += 1; },
        next: 'yourplan',
      }),
    );
  });
};

/* ---------- beat one: the hit ---------- */
await mount();
console.log('beat one — the hit');
is('what they lose a day', text().includes('2h 39m'), text().match(/\d+h \d+m/)?.[0]);
is('counted up into a year', text().includes('days a year'));
is('the pile is one plank a day', document.querySelectorAll('.pile-slab').length === days,
  `${document.querySelectorAll('.pile-slab').length} planks, ${days} days`);
is('planks arrive one after another, not all at once',
  new Set([...document.querySelectorAll('.pile-slab')]
    .map((e) => (e.getAttribute('style') ?? '').match(/slab-in [^;]*/)?.[0])).size > 4);
is('it can be skipped', Boolean(buttonSaying('skip')));
is('nothing has gone anywhere yet', went === null);

/* ---------- it advances by itself ---------- */
console.log('\nit plays on its own');
await wait(past(0));
is('beat two arrived without a tap', text().includes(flip.unit), flip.line);
await wait(past(1));
is('and beat three after it', text().includes("let's get some of it back"));
is('and then it stops', Boolean(buttonSaying('show me the plan')));
is('still waiting on them', went === null);

/* ---------- a tap gets ahead of it ---------- */
console.log('\na tap gets ahead of it');
await mount();
await click(document.querySelector('.pile-slab').parentElement);
is('one tap moves to the flip', text().includes(flip.unit));
is('the pile turns green rather than redrawing',
  document.querySelectorAll('.pile-slab').length === days
  && (document.querySelector('.pile-slab').getAttribute('style') ?? '').includes('rgb(46, 139, 62)'));
await click(document.querySelector('.pile-slab').parentElement);
is('the next moves to the promise', text().includes("let's get some of it back"));
await click(buttonSaying('show me the plan'));
is('and then the plan', went === 'yourplan', `${went}`);

/* ---------- skip ---------- */
console.log('\nskip goes to the end, not out the door');
await mount();
await click(buttonSaying('skip'));
is('lands on the last beat', text().includes("let's get some of it back"));
is('which still has the number', text().includes(`${days} days`));
is('and the per-app split under it', text().includes('where it goes'));
is('blurred, because that part is pro', text().includes('see where your time goes'));
is('it did not leave the screen', went === null);

/* ---------- the flip is theirs ---------- */
console.log('\nthe flip is in their words');
const quoted = (picks) => {
  const r = insteadOf(breakdown.blocked, picks);
  return r;
};
is('gym becomes gym sessions', quoted(['gym']).unit === 'gym sessions');
is('reading becomes books', quoted(['reading']).unit === 'books');
is('the count is the year divided by one of them',
  quoted(['gym']).count === Math.round((159 * 365) / 60), `${quoted(['gym']).count}`);
is('their first pick wins, in the order they read them',
  quoted(['reading', 'gym']).id === 'gym');
is('picking nothing falls back to the days', quoted([]).unit === 'days of your own');
is('and so does a pick too big to have one of',
  insteadOf(2, ['skill']).unit === 'days of your own', 'two minutes a day is not a skill');

/* ---------- the paywall round trip ----------
   The last beat holds the per-app split, blurred. Tapping it opens the
   paywall — and coming back has to land on that same beat, with the
   percentages, not back on the hit counting up to a year again. App holds
   the beat for exactly this reason, so here the test holds it. */
console.log('\nlooking at the price and coming back');
let heldBeat = 0;
const mountHeld = async () => {
  went = null;
  run += 1;
  await act(async () => {
    root.render(React.createElement(YourNumber, {
      key: `held-${run}`,
      go: (n) => { went = n; },
      skin: 'original',
      breakdown,
      picked: ['gym'],
      isPro: false,
      onBack: () => { backed += 1; },
      next: 'yourplan',
      beat: heldBeat,
      setBeat: (v) => { heldBeat = typeof v === 'function' ? v(heldBeat) : v; },
    }));
  });
};

heldBeat = 0;
await mountHeld();
await click(buttonSaying('skip'));
is('skip is remembered outside the screen', heldBeat === 2, `beat ${heldBeat}`);
await mountHeld();
is('the split is there', text().includes('see where your time goes'));
await click(buttonSaying('see where your time goes'));
is('tapping the blur opens the paywall', went === 'upgrade', `${went}`);
is('and the beat is untouched by it', heldBeat === 2, `beat ${heldBeat}`);

/* back from the paywall rebuilds this screen — the beat comes with it */
await mountHeld();
is('coming back lands on the percentages', text().includes('where it goes'));
is('not on the hit', !text().includes('a day, on these apps'));
is('the plan is still one tap away', Boolean(buttonSaying('show me the plan')));

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
is('App is what holds the beat', app.includes('beat={numberBeat}') && app.includes('setBeat={setNumberBeat}'));
is('the paywall knows where it was opened from',
  app.includes("setCameFrom(nav.entries[nav.entries.length - 1])"));
is('and arriving fresh still plays from the top', app.includes('setNumberBeat(0)'));


console.log('\nwith reduced motion on');
reduced = true;
await act(async () => { root.unmount(); });
root = createRoot(document.getElementById('root'));
await mount();
is('the number is already there, not counting up',
  new RegExp(`${days}\\s*days a year`).test(text()));
is('no plank animates in',
  [...document.querySelectorAll('.pile-slab')]
    .every((e) => (e.getAttribute('style') ?? '').includes('animation: none')));
is('the beats still advance', await (async () => { await wait(past(0)); return text().includes(flip.unit); })());
is('the flip number is final too', text().includes(String(flip.count)));
await click(buttonSaying('skip'));
is('and the way out still works', Boolean(buttonSaying('show me the plan')));

console.log(fail ? `\n${fail} FAILED` : '\nall good — three beats, skippable, and still readable standing still');
process.exit(fail ? 1 : 0);

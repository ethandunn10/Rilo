/* The intro tour in a real DOM.

   Two kinds of breakage this is here to catch:

   1. The spotlight drifting off the thing Rilo is talking about, or the
      bubble sitting on top of it. That's geometry, so the test gives the
      targets real rects and checks the numbers.
   2. An anchor getting renamed in a screen, which leaves a step pointing at
      nothing and silently kills the spotlight. So every target named in
      STEPS is also grepped for in src/. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'https://localhost/', pretendToBeVisual: true });
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent, localStorage: dom.window.localStorage })) globalThis[k] = v;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const MeetRiloTour = (await import('../src/components/MeetRiloTour.jsx')).default;

let fail = 0;
const is = (n, ok, extra = '') => { if (!ok) fail++; console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`); };

/* ---- the phone frame, with the sections the tour points at ----------
   The tour measures against its own parentElement, so the fake sections
   have to be its siblings — same shape as App.jsx, where the tour sits
   next to the screens inside the frame. */

const FRAME = { left: 0, top: 0, width: 390, height: 844, right: 390, bottom: 844, x: 0, y: 0 };
const RECTS = {
  'home-talk': { top: 120, height: 150 },
  score: { top: 300, height: 110 },
  'home-apps': { top: 430, height: 90 },
  next: { top: 540, height: 80 },
  'you-creator': { top: 160, height: 120 },
  'you-strict': { top: 300, height: 120 },
  'you-schedule': { top: 440, height: 130 },
  'you-buddies': { top: 590, height: 90 },
  'you-apps': { top: 700, height: 110 },
};

/* jsdom has no layout, so hand out the rects above by element */
const ZERO = { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 };
dom.window.HTMLElement.prototype.getBoundingClientRect = function rect() {
  if (this.id === 'host' || this.getAttribute?.('role') === 'dialog') return { ...FRAME };
  const name = this.getAttribute?.('data-tour-target');
  const box = name ? RECTS[name] : null;
  if (!box) return { ...ZERO };
  return {
    left: 16, right: 374, width: 358, x: 16,
    top: box.top, bottom: box.top + box.height, height: box.height, y: box.top,
  };
};
dom.window.HTMLElement.prototype.scrollIntoView = function noop() {};
/* jsdom has no layout; the overlay reports the frame's real size so the
   scale works out to 1 and placement has something to measure against */
Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetWidth', {
  configurable: true, get() { return this.getAttribute?.('role') === 'dialog' ? 390 : 0; },
});
Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() {
    if (this.getAttribute?.('role') === 'dialog') return 844;
    return this.getAttribute?.('data-tour-card') === '' ? 120 : 0;
  },
});

let screen = 'home';
let answered = null;
let done = false;

function Harness() {
  return React.createElement(
    'div',
    { id: 'host', style: { position: 'relative' } },
    ...Object.keys(RECTS).map((name) =>
      React.createElement('div', { key: name, 'data-tour-target': name })),
    React.createElement(MeetRiloTour, {
      skin: 'original',
      screen,
      go: (s) => { screen = s; },
      onCreatorAnswer: (v) => { answered = v; },
      onDone: () => { done = true; },
    }),
  );
}

const root = createRoot(document.getElementById('root'));
const render = () => act(async () => { root.render(React.createElement(Harness)); });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 40)); });

await render();
await settle();
const host = () => document.getElementById('host');

const px = (s, prop) => {
  const m = (s ?? '').match(new RegExp(`(?:^|;)\\s*${prop}:\\s*(-?[\\d.]+)px`));
  return m ? Number(m[1]) : null;
};
const greenBox = () => host().querySelector('div[data-tour-box=""]')?.getAttribute('style') ?? '';
const bubble = () => host().querySelector('div[data-tour-card=""]')?.getAttribute('style') ?? '';
const heading = () => host().querySelector('#meet-rilo-title')?.textContent ?? '';
const click = async (sel) => {
  const el = host().querySelector(sel);
  if (!el) throw new Error(`no ${sel}`);
  await act(async () => { el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  await settle();
};
const nextBtn = () => [...host().querySelectorAll('button')]
  .find((b) => ['next', 'got it'].includes(b.textContent.trim()));

console.log('step 1 — meet rilo:');
is('Rilo introduces himself', heading().includes("I'm Rilo"), heading());
is('and says you can talk to him', heading().toLowerCase().includes('talk'), heading());
is('one line, not a paragraph', heading().length <= 60, `${heading().length} chars`);

/* ---- the geometry, which is the thing that looked broken ------------ */
{
  const target = RECTS['home-talk'];
  const g = greenBox();

  is('there is a green box', Boolean(g));
  is('it sits exactly on the feature',
    px(g, 'left') === 16 - 6 && px(g, 'top') === target.top - 6,
    `left=${px(g, 'left')} top=${px(g, 'top')} (want 10/${target.top - 6})`);
  is('and is sized to it', px(g, 'width') === 358 + 12 && px(g, 'height') === target.height + 12,
    `w=${px(g, 'width')} h=${px(g, 'height')}`);
  is('everything outside it is dimmed', g.includes('100vmax'));
  is('the box itself is empty', !host().querySelector('div[data-tour-box=""]')?.childNodes.length);

  const bTop = px(bubble(), 'top');
  is('Rilo sits clear of the box', bTop >= target.top + target.height,
    `card top=${bTop}, feature ends ${target.top + target.height}`);
  is('and inside the frame', bTop >= 12 && bTop <= 844 - 12, String(bTop));
}

/* The stage is CSS-scaled to fit the window. Rects come back post-scale but
   these panels are painted pre-scale, so a measurement that forgets to
   divide puts the box in the wrong place and the wrong size — which is
   exactly what shipped twice. Re-measure at 0.5 and check it holds. */
console.log('\nwhen the phone is scaled down:');
{
  const realRoot = Object.getOwnPropertyDescriptor(dom.window.HTMLElement.prototype, 'offsetWidth');
  const SCALE = 0.5;
  const prevRect = dom.window.HTMLElement.prototype.getBoundingClientRect;
  /* the overlay reports half-size painted, full-size laid out */
  Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetWidth', {
    configurable: true,
    get() { return this.getAttribute?.('role') === 'dialog' ? 390 : 0; },
  });
  Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get() { return this.getAttribute?.('role') === 'dialog' ? 844 : 120; },
  });
  dom.window.HTMLElement.prototype.getBoundingClientRect = function rect() {
    if (this.getAttribute?.('role') === 'dialog') {
      return { left: 0, top: 0, width: 390 * SCALE, height: 844 * SCALE, right: 195, bottom: 422, x: 0, y: 0 };
    }
    const name = this.getAttribute?.('data-tour-target');
    const b = name ? RECTS[name] : null;
    if (!b) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 };
    return {
      left: 16 * SCALE, right: 374 * SCALE, width: 358 * SCALE, x: 16 * SCALE,
      top: b.top * SCALE, bottom: (b.top + b.height) * SCALE,
      height: b.height * SCALE, y: b.top * SCALE,
    };
  };

  await act(async () => { dom.window.dispatchEvent(new dom.window.Event('resize')); });
  await settle();

  const g = greenBox();
  is('the box is still on the feature, not half off it',
    px(g, 'left') === 10 && px(g, 'top') === RECTS['home-talk'].top - 6,
    `left=${px(g, 'left')} top=${px(g, 'top')} (want 10/${RECTS['home-talk'].top - 6})`);
  is('and still the right size', px(g, 'width') === 370,
    `w=${px(g, 'width')} (want 370)`);

  dom.window.HTMLElement.prototype.getBoundingClientRect = prevRect;
  if (realRoot) Object.defineProperty(dom.window.HTMLElement.prototype, 'offsetWidth', realRoot);
  await act(async () => { dom.window.dispatchEvent(new dom.window.Event('resize')); });
  await settle();
}

console.log('\ntapping Rilo:');
{
  const before = heading();
  await click('button[aria-label="tap rilo"]');
  is('he jumps', Boolean(host().querySelector('.rilo-jump')));
  is('and tapping him does not skip the step', heading() === before);
}

console.log('\nwalking the tour:');
const seen = [heading()];
for (let i = 0; i < 4; i++) {
  await click('button[aria-label="tap rilo"]'); // harmless; keeps focus on the card
  const btn = nextBtn();
  if (!btn) break;
  await act(async () => { btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  await settle();
  seen.push(heading());
}
is('the question about posting comes up', host().textContent.includes('Do you post a lot?'),
  seen.join(' | ').slice(0, 90));
is('with a yes and a no', [...host().querySelectorAll('button')]
  .filter((b) => ['yes', 'no'].includes(b.textContent.trim())).length === 2);

{
  const yes = [...host().querySelectorAll('button')].find((b) => b.textContent.trim() === 'yes');
  await act(async () => { yes.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  await settle();
  is('answering yes is reported up', answered === true);
  is('and it moves to the You tab', screen === 'you', screen);
  await render();
  await settle();
  is('landing on creator mode', heading().toLowerCase().includes('posting'), heading());
}

console.log('\nthe rest of the topics:');
{
  const topics = [];
  for (let i = 0; i < 6; i++) {
    topics.push(heading());
    const btn = nextBtn();
    if (!btn || btn.textContent.trim() === 'got it') { if (btn) { await act(async () => { btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); }); } break; }
    await act(async () => { btn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
    await settle();
  }
  const all = topics.join(' | ').toLowerCase();
  for (const topic of ['posting', 'strict', 'friend']) {
    is(`${topic} is covered`, all.includes(topic), all.slice(0, 70));
  }
  is('the tour finishes', done);
}

/* ---- every anchor the tour names really exists in the screens ------- */
console.log('\nanchors:');
{
  const srcDir = new URL('../src/', import.meta.url).pathname;
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
  const src = walk(srcDir).filter((f) => /\.jsx?$/.test(f))
    .map((f) => readFileSync(f, 'utf8')).join('\n');
  const tour = readFileSync(new URL('../src/components/MeetRiloTour.jsx', import.meta.url).pathname, 'utf8');
  const named = [...tour.matchAll(/target: '([^']+)'/g)].map((m) => m[1]);
  is('the tour names some targets', named.length >= 9, String(named.length));
  for (const name of named) {
    /* either a literal attribute, or passed through a dataTourTarget prop */
    const ok = src.includes(`data-tour-target="${name}"`) || src.includes(`dataTourTarget="${name}"`);
    is(`"${name}" is anchored in a screen`, ok);
  }
}

console.log('\ncopy stays short:');
{
  const tourSrc = readFileSync(new URL('../src/components/MeetRiloTour.jsx', import.meta.url).pathname, 'utf8');
  const lines = [...tourSrc.matchAll(/title: (?:'([^']*)'|"([^"]*)")/g)].map((m) => m[1] ?? m[2]);
  is('every step has a line', lines.length >= 9, String(lines.length));
  const longest = lines.reduce((a, b) => (b.length > a.length ? b : a), '');
  is('no step writes a paragraph', longest.length <= 60, `${longest.length} chars: "${longest}"`);
}

console.log(fail ? `\n${fail} failed` : '\nall good — ten steps, aligned to real sections, every topic covered');
process.exit(fail ? 1 : 0);

/* The simplification pass: a home screen cut to four things, a word from
   Rilo before any bypass, and the free/pro split the paywall promises.

   Most of this is checked against the real DOM rather than the source,
   because "the card is gone from the file" and "the card is gone from the
   screen" are different claims and only the second one matters. */
import { readFileSync } from 'node:fs';
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
const Home = (await import('../src/screens/Home.jsx')).default;
const BypassGuilt = (await import('../src/components/BypassGuilt.jsx')).default;
const { FREE_MAX_APPS } = await import('../src/lib/plan.js');

let fail = 0;
const is = (n, ok, extra = '') => { if (!ok) fail++; console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`); };

const root = createRoot(document.getElementById('root'));
const render = (el) => act(async () => { root.render(el); });
const text = () => (document.getElementById('root').textContent || '').toLowerCase();
const btns = () => [...document.querySelectorAll('button')];
const byText = (t) => btns().find((b) => (b.textContent || '').trim().toLowerCase().includes(t));

/* ---------- 1. home is four things ---------- */
console.log('home keeps only what matters:');
await render(React.createElement(Home, {
  go: () => {},
  name: 'ethan',
  about: { on: {}, extra: { hobby: [], goal: [] } },
  skin: 'original',
  onOpenApp: () => {},
  tracked: ['tiktok', 'instagram'],
  appSettings: { tiktok: { mode: 'limited', opens: 3, minutes: 15 } },
  lockOf: () => ({ used: 1, locked: false }),
  totalOpensFor: () => 3,
  usedToday: 45,
  goalMins: 120,
  riloMood: 'coach',
  riloNote: 'phone down a while.',
  backToday: 12,
}));

is('rilo is on it, and he is tappable', Boolean(document.querySelector('[data-tour-target="home-talk"]')));
is('the one stat is there', Boolean(document.querySelector('[data-tour-target="score"]')));
is('and reads as today against the goal', text().includes('of 2h today'), text().slice(0, 60));
is('the apps list is there', Boolean(document.querySelector('[data-tour-target="home-apps"]')));
is('with the opens spelled out', text().includes('min each'));
is('and one thing to do instead', text().includes('do this instead'));

console.log('\n  and nothing else:');
is('no xp or level on home', !text().includes(' xp') && !/lvl|level/.test(text()));
is('no streak tile', !text().includes('day streak'));
is('no passes counter', !text().includes('pass'));
is('no creator mode entry', !text().includes('creator mode'));
is('no nightly check-in', !text().includes('check in'));
is('no buddies or share card', !text().includes('budd') && !text().includes('share'));

console.log('\n  and the cards are flat:');
{
  /* only the cards in the scrolling column — the tab bar is shared chrome
     and keeps its own look */
  const column = document.querySelector('.scroll-y');
  const heavy = [...(column?.querySelectorAll('*') ?? [])]
    .map((e) => e.getAttribute('style') || '')
    /* the chunky `0 4px 0 <line>` and dark drop shadows that made it heavy */
    .filter((s) => /box-shadow:\s*0 \d+px (0|\d+px)/.test(s) && !/inset/.test(s));
  is('no chunky drop shadows left', heavy.length === 0, heavy.join(' || ').slice(0, 160));
}

/* ---------- 2. the guilt prompt ---------- */
console.log('\nrilo has a word before any bypass:');
let confirmedWith = null;
await render(React.createElement(BypassGuilt, {
  skin: 'original',
  kind: 'pass',
  hobbies: ['gym'],
  goals: ['get fit'],
  streak: 6,
  onConfirm: (reason) => { confirmedWith = reason; },
  onCancel: () => {},
}));

is('he is sad about it', Boolean(document.querySelector('.rilo, [class*="rilo"]')));
is('he uses their own answer', text().includes("you said you'd rather be at the gym"), text().slice(0, 80));
is('and says what it costs', text().includes('breaks your 6-day streak'));

const unlock = byText('use the pass') || byText('unlock');
is('the way through starts disabled', Boolean(unlock?.disabled));
await act(async () => {
  unlock.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});
is('and clicking it does nothing yet', confirmedWith === null);

const box = document.querySelector('input[type="text"]');
is('there is somewhere to say why', Boolean(box));
await act(async () => {
  const set = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
  set.call(box, 'my sister is texting me');
  box.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
});
const unlock2 = byText('use the pass') || byText('unlock');
is('typing a reason opens it up', !unlock2.disabled);
await act(async () => {
  unlock2.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
});
is('and the reason comes through', confirmedWith === 'my sister is texting me', `${confirmedWith}`);
is('backing out is always one tap', Boolean(byText('never mind')));

/* the sheet is only worth anything if the real screen actually shows it */
console.log('\nand the intercept screen puts it in the way:');
{
  const Intercept = (await import('../src/screens/Intercept.jsx')).default;
  let passedWith;
  await render(React.createElement(Intercept, {
    go: () => {},
    app: 'tiktok',
    skin: 'original',
    openCount: 3,
    opensToday: 3,
    /* blocked, so the only ways on are the pass and the borrow */
    lock: { locked: true, used: 3, setting: { mode: 'blocked', opens: 3, minutes: 15 } },
    minutes: 15,
    opensTotal: 3,
    opensUsed: 3,
    opensLeft: 0,
    passesLeft: 1,
    canBorrow: true,
    hobbies: ['gym'],
    goals: [],
    streak: 6,
    onPass: (why) => { passedWith = why; },
    onBorrow: () => {},
    onOpen: () => {},
  }));

  /* The screen deliberately holds them for WAIT_NORMAL seconds before
     anything is tappable, so wait it out rather than forcing the button —
     that pause is part of the behaviour worth checking. */
  const { WAIT_NORMAL } = await import('../src/lib/limits.js');
  await act(async () => { await new Promise((r) => setTimeout(r, (WAIT_NORMAL + 1) * 1000)); });

  const pass = btns().find((b) => /emergency pass/.test((b.textContent || '').toLowerCase()));
  is('the emergency pass is offered', Boolean(pass));
  is('and the wait is over, so it is live', !pass.disabled);

  await act(async () => {
    pass.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  is('tapping it brings rilo up first', Boolean(document.querySelector('[data-guilt-cost]')));
  is('it did not just let them through', passedWith === undefined);
  is('and he knows what it costs', text().includes('6-day streak'));
}

/* ---------- 3. the free / pro split ---------- */
console.log('\nthe split the paywall promises:');
const paywall = readFileSync(new URL('../src/screens/Paywall.jsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

is('free watches five apps', FREE_MAX_APPS === 5, String(FREE_MAX_APPS));
is('and the paywall says so', paywall.includes('free watches 5'));
is('the free row is not selling the plan', !paywall.includes('no plan'));

for (const pro of ['strict mode', 'step-down', 'every night', 'buddy mode', 'per-app breakdown']) {
  is(`pro lists ${pro}`, paywall.toLowerCase().includes(pro));
}
for (const free of ['5 apps', "rilo's plan", 'emergency pass', 'daily goal']) {
  is(`free lists ${free}`, paywall.toLowerCase().includes(free.toLowerCase()));
}
is('rilo\'s plan is no longer pro-locked', app.includes('locked={false}'));
is('and pro features carry a lock', readFileSync(
  new URL('../src/components/ProLock.jsx', import.meta.url), 'utf8').includes('ProBadge'));

/* ---------- 4. the onboarding plan editor ---------- */
console.log('\nthe limits editor only asks what it needs to:');
{
  const Limits = (await import('../src/screens/Limits.jsx')).default;
  const noop = () => {};
  await render(React.createElement(Limits, {
    go: noop,
    skin: 'original',
    tracked: ['tiktok', 'instagram'],
    appSettings: {
      tiktok: { mode: 'limited', opens: 3, minutes: 15 },
      instagram: { mode: 'blocked', opens: 0, minutes: 0 },
    },
    onSetApp: noop,
    day: { opensUsed: {} },
    check: { allows: 30, by: 0, fits: true },
    pending: [],
    onCancelPending: noop,
    limitMode: 'rilo',
    riloWhy: {},
    riloLead: [],
    pctFor: () => null,
    totalOpensFor: () => 3,
    onContinue: noop,
    onBack: noop,
  }));

  const t = text();
  is('no "how your plan gets made" chooser', !t.includes('how your plan gets made'));
  is('no "let rilo make one" / "make your own"',
    !t.includes('let rilo make one') && !t.includes('make your own'));
  is('no edit-mode toggle', !t.includes('edit your plan') && !t.includes('done editing'));
  is('the daily goal is not here any more', !t.includes('daily screen time goal'));

  /* exactly two choices per app, and never "free forever" */
  const choices = btns().filter((b) => b.getAttribute('aria-pressed') !== null);
  /* the selected chip renders a ✓ before its label, so read the first word */
  const labels = [...new Set(choices.map(
    (b) => ((b.textContent || '').toLowerCase().match(/[a-z]+/) || [''])[0]))];
  is('each app offers blocked or limited only',
    labels.length === 2 && labels.every((l) => l.startsWith('blocked') || l.startsWith('limited')),
    labels.join(' / '));
  is('and nothing can be set free forever', !t.includes('no limit. the time still counts'));
  is('the opens are still editable', t.includes('opens a day') && t.includes('minutes per open'));
}

console.log('\nthe goal moved to the plan screen:');
{
  const YourPlan = (await import('../src/screens/YourPlan.jsx')).default;
  let setTo = null;
  await render(React.createElement(YourPlan, {
    go: () => {},
    skin: 'original',
    tracked: ['tiktok'],
    appSettings: { tiktok: { mode: 'limited', opens: 2, minutes: 10 } },
    instead: [],
    goalMins: 60,
    time: { now: 4, goal: 1 },
    setTime: (v) => { setTo = v; },
    onEdit: () => {},
    onBack: () => {},
  }));

  const t = text();
  is('the daily goal is on the plan screen', t.includes('daily screen time goal'));
  is('above the limits it drives',
    t.indexOf('daily screen time goal') < t.indexOf('your limits'),
    `goal@${t.indexOf('daily screen time goal')} limits@${t.indexOf('your limits')}`);

  const plus = btns().find((b) => (b.textContent || '').trim() === '+');
  is('and it can actually be changed', Boolean(plus));
  await act(async () => { plus.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  is('the meter reports back', setTo !== null, JSON.stringify(setTo));
}

console.log('\nthe number lands properly:');
{
  const { BEAT_MS } = await import('../src/screens/YourNumber.jsx');
  /* This is the moment the pitch rests on, so each beat has to hold long
     enough to actually read the number — and still be skippable. */
  is('each beat holds long enough to read', BEAT_MS.every((b) => b >= 3000),
    BEAT_MS.join(' / '));
  is('but not so long it drags', BEAT_MS.every((b) => b <= 5000), BEAT_MS.join(' / '));

  const src = readFileSync(new URL('../src/screens/YourNumber.jsx', import.meta.url), 'utf8');
  is('a tap still gets ahead of it', src.includes('onClick={beat < 2 ? onwards : undefined}'));
  is('and skip still jumps to the end', src.includes('onClick={() => setBeat(2)}'));

  /* big, centred, and rilo in the frame rather than off in a corner */
  is('the number is big', /fontSize: 10\d,/.test(src), (src.match(/fontSize: \d{2,3},/g) || []).join(' '));
  is('it sits a little above centre', src.includes("top: '43%'"));
  is('the block is centred', src.includes("alignItems: 'center'") && src.includes("textAlign: 'center'"));
  is('rilo stands with it', /<Rilo skin=\{skin\} mood=\{mood\} size=\{1[0-9]\d\} \/>/.test(src));
  is('and not tucked in the corner any more', !src.includes('left: 14,\n            bottom: 4,'));
}

console.log('\nthe tour covers the app without dragging:');
{
  const src = readFileSync(new URL('../src/components/MeetRiloTour.jsx', import.meta.url), 'utf8');
  const screens = [...src.matchAll(/screen: '([a-z]+)'/g)].map((m) => m[1]);
  is('it stays at or under 15 steps', screens.length <= 15, String(screens.length));
  for (const tab of ['home', 'plan', 'progress', 'pickrilo', 'you']) {
    is(`it visits ${tab}`, screens.includes(tab), [...new Set(screens)].join(','));
  }
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  is('and the tour is allowed to render on all of them',
    /TOUR_SCREENS = \['home', 'plan', 'progress', 'pickrilo', 'you'\]/.test(app));
}

console.log('\nrilo hands off into the tour:');
{
  const handoff = readFileSync(new URL('../src/components/RiloHandoff.jsx', import.meta.url), 'utf8');
  is('he crosses the screen', handoff.includes('rilo-cross'));
  is('hopping as he goes', handoff.includes('rilo-hop'));
  is('and it fades out rather than cutting', handoff.includes('handoff-out'));
  is('a tap skips it', handoff.includes('onClick={finish}'));
  is('and reduced motion skips it entirely', handoff.includes('if (reduced) { finish(); return undefined; }'));

  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
  for (const k of ['rilo-cross', 'rilo-hop', 'handoff-out']) {
    is(`${k} is defined`, css.includes(`@keyframes ${k}`));
  }

  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  is('it runs when onboarding ends', app.includes("if (screen === 'paywall') setHandoff(true)"));
  is('and the tour waits for it', app.includes('!introTourDone && !handoff'));
}

console.log(fail ? `\n${fail} failed` : '\nall good — home cut back, guilt before bypasses, five free apps, a simpler plan editor');
process.exit(fail ? 1 : 0);

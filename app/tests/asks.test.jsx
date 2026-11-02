/* Rilo's first-week questions as they actually appear: a card in the
   middle of a screen someone was already using.

   The rules live in tests/firstweek.test.mjs. This is about the card —
   that answering it reports what they picked, that "not now" is a real way
   out of every single one, and that the whole thing is wired into the
   three places it's meant to show up. */

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
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const AskCard = (await import('../src/components/AskCard.jsx')).default;
const { ASKS } = await import('../src/lib/firstWeek.js');

let fail = 0;
const is = (n, ok, extra = '') => {
  if (!ok) fail += 1;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`);
};

const root = createRoot(document.getElementById('root'));
const buttons = () => [...document.querySelectorAll('button')];
const saying = (s) => buttons().find((b) => b.textContent.toLowerCase().includes(s.toLowerCase()));
const click = async (el) => {
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
};

let answered = null;
let skipped = 0;
let opened = 0;
let key = 0;
const show = async (id) => {
  answered = null;
  skipped = 0;
  opened = 0;
  key += 1;
  const ask = ASKS.find((a) => a.id === id);
  await act(async () => {
    root.render(React.createElement(AskCard, {
      key: `ask-${key}`,
      ask,
      skin: 'original',
      onAnswer: (v) => { answered = v; },
      onSkip: () => { skipped += 1; },
      onCta: () => { opened += 1; },
    }));
  });
  return ask;
};

/* ---------- every one of them can be waved off ---------- */
console.log('not now is on every single one');
for (const a of ASKS.filter((x) => x.options || x.cta)) {
  await show(a.id);
  const out = saying('not now');
  is(`${a.id} can be skipped`, Boolean(out));
  if (out) {
    await click(out);
    is(`  and skipping ${a.id} says so once`, skipped === 1 && answered === null);
  }
}

/* ---------- single choice: the tap is the answer ---------- */
console.log('\none choice needs one tap');
const school = await show('school');
is('shows the school windows', school.options.every((o) => saying(o.label)));
await click(saying(school.options[1].label));
is('tapping one answers it', answered?.[0] === school.options[1].id, `${answered}`);
is('with no second confirm tap', skipped === 0);

/* ---------- several choices need a finish ---------- */
console.log('\nseveral choices need a finish');
const scroll = await show('scroll');
is('nothing is sent on the first tap', (await click(saying('at night')), answered === null));
is('or the second', (await click(saying('in bed')), answered === null));
const done = saying("that's it");
is('there is a way to finish', Boolean(done));
await click(done);
is('and it sends both', answered?.length === 2 && answered.includes('night') && answered.includes('bed'),
  `${answered}`);
is('it is a multi-choice ask in the first place', scroll.multi === true);

await show('scroll');
is('with nothing picked the finish is disabled', saying("that's it")?.disabled === true);

/* ---------- the calendar one goes somewhere ---------- */
console.log('\nthe calendar question is the only one with a door');
const cal = await show('calendar');
is('it says it is optional', document.body.textContent.includes('optional'));
is('and has a button that opens it', Boolean(saying(cal.cta)));
await click(saying(cal.cta));
is('which reports back', opened === 1 && answered === null);

/* ---------- typing your own ---------- */
console.log('\nthe hobbies one takes anything');
await show('hobbies');
const input = document.querySelector('input');
is('there is somewhere to type', Boolean(input));
const setValue = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
  setter.call(el, v);
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};
await act(async () => { setValue(input, 'Skateboarding'); });
await click(saying("that's it"));
is('typed answers come through, tidied', answered?.includes('skateboarding'), `${answered}`);

/* ---------- nothing is a dead end ---------- */
console.log('\nevery question has a way to answer it, not just a way out');
for (const a of ASKS) {
  await show(a.id);
  const ways = buttons().filter((b) => !b.textContent.toLowerCase().includes('not now'));
  const typing = Boolean(document.querySelector('input'));
  is(`${a.id} can be answered`, ways.length > 0 || typing,
    `${ways.length} buttons${typing ? ' + typing' : ''}`);
}

/* the day-1 question is asked out loud at the check-in, but a free
   account has no check-in — so it has to work as a card too */
await show('goal');
is('what they are working toward can be typed on a card', Boolean(document.querySelector('input')));
await act(async () => {
  const el = document.querySelector('input');
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set
    .call(el, 'make varsity');
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
});
await click(saying("that's it"));
is('and it comes through', answered?.includes('make varsity'), `${answered}`);

/* ---------- wired into the three places ---------- */
console.log('\nand it is wired where it belongs');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../src/screens/Home.jsx', import.meta.url), 'utf8');
const plan = readFileSync(new URL('../src/screens/Plan.jsx', import.meta.url), 'utf8');
const night = readFileSync(new URL('../src/screens/NightCheckIn.jsx', import.meta.url), 'utf8');

is('home gets at most one', app.includes('askCard={homeAsk ? <AskCard {...askProps(homeAsk)} /> : null}'));
is('the plan tab gets at most one', app.includes('askCard={planAsk ? <AskCard {...askProps(planAsk)} /> : null}'));
is('the check-in gets the extra question', app.includes('extraAsk={checkinAsk}'));
is('home has somewhere to put it', home.includes('askCard'));
is('so does the plan tab', plan.includes('askCard'));
is('the check-in can be skipped past', night.includes('onAskSkip'));
is('a day going by moves it along', app.includes('dripToDay(d, d.day + 1)'));
is('answers are written where that setting already lived',
  app.includes("if (id === 'school')") && app.includes('setSchool((sc) => ({ ...sc, on: true, from, to }))'));
is('the demo panel can trigger each day', app.includes('onAskDay={demoAskDay}'));
is('and the pro-only slots fall back to home for a free account',
  app.includes("slotAsk('home') ?? (isPro ? null : slotAsk('plan') ?? slotAsk('checkin'))"));
is('and it is all in settings afterwards',
  readFileSync(new URL('../src/screens/You.jsx', import.meta.url), 'utf8')
    .includes('when you scroll the most'));

console.log(fail ? `\n${fail} FAILED` : '\nall good — one card, always skippable, wired into all three places');
process.exit(fail ? 1 : 0);

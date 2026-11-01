/* Walks the whole onboarding conversation in a real DOM, the way a person
   does: type, press Enter, click the button, tap the chips. This is the
   test that was missing — a ReferenceError inside the form's onSubmit made
   every single submit a silent no-op, and nothing caught it because the
   render tests only ever checked that the markup appeared. */
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'https://localhost/',
  pretendToBeVisual: true,
});
for (const [k, v] of Object.entries({
  window: dom.window, document: dom.window.document, HTMLElement: dom.window.HTMLElement,
  Event: dom.window.Event, MouseEvent: dom.window.MouseEvent, localStorage: dom.window.localStorage,
})) globalThis[k] = v;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const Talk = (await import('../src/screens/Talk.jsx')).default;

let fail = 0;
const is = (n, ok, extra = '') => { if (!ok) fail++; console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`); };

const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set;
const $ = (s) => document.querySelector(s);
const buttons = () => [...document.querySelectorAll('button')];
const byText = (t) => buttons().find((b) => b.textContent.trim() === t);
const bubble = () => document.querySelector('p')?.textContent ?? '';
/* Rilo replies after ~220ms and then moves to the next question up to
   1.5s after that, so waiting a fixed moment is a coin flip. Poll until
   what we're waiting for is actually on screen. */
async function waitFor(pred, label = 'something', ms = 4000) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (pred()) return true;
    await act(async () => { await new Promise((r) => setTimeout(r, 60)); });
  }
  console.log(`      (gave up waiting for ${label}; screen says "${bubble()}")`);
  return false;
}
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 300)); });
const saysSoon = (text) => waitFor(() => bubble().includes(text), `"${text}"`);
const chipSoon = (label) => waitFor(() => Boolean(byText(label)), `the "${label}" button`);

async function type(value) {
  await act(async () => {
    setter.call($('input'), value);
    $('input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
}
async function clickSend() {
  await act(async () => {
    $('button[type="submit"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  await settle();
}
async function pressEnter() {
  await act(async () => {
    $('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
  });
  await settle();
}
async function tapChip(label) {
  const el = byText(label);
  if (!el) { fail++; console.log(`  FAIL no "${label}" button on screen`); return; }
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  });
  await settle();
}

let about = { on: {}, extra: { hobby: [], goal: [] }, creator: '' };
let name = '';
let went = null;
const root = createRoot(document.getElementById('root'));
await act(async () => {
  root.render(React.createElement(Talk, {
    go: (s) => { went = s; }, mode: 'onboarding', skin: 'original',
    name, setName: (n) => { name = n; }, about,
    setAbout: (fn) => { about = typeof fn === 'function' ? fn(about) : fn; },
    onTalked: () => {},
  }));
});

console.log('1. the name — typed, sent with the SEND BUTTON:');
await type('ethan');
is('button enables once there are words', !$('button[type="submit"]').disabled);
await clickSend();
is('it sent', bubble().includes('did i get that right'), `"${bubble()}"`);
is('the name was captured', name === 'Ethan', `"${name}"`);
is('the field cleared', $('input').value === '');
await tapChip('yep');
is('confirming moves to the hobby question', await saysSoon('not on your phone'), `"${bubble()}"`);

console.log('\n2. hobbies — TAP SEVERAL, then send:');
is('chips are offered', buttons().some((b) => b.textContent.trim() === 'basketball'));
/* tapping must NOT submit on its own any more */
await tapChip('basketball');
is('one tap does not send', bubble().includes('not on your phone'), `"${bubble()}"`);
is('the chip reads as picked', buttons().some((b) => b.textContent.trim() === '✓ basketball'));
is('send is enabled by a pick alone', !$('button[type="submit"]').disabled);
await tapChip('✓ basketball');
is('tapping again unpicks it', !buttons().some((b) => b.textContent.trim() === '✓ basketball'));
is('and send goes back to disabled', $('button[type="submit"]').disabled);
/* now pick two and send them together */
await tapChip('basketball');
await tapChip('soccer');
await clickSend();
is('both were taken', bubble().includes('basketball') && bubble().includes('soccer'), `"${bubble()}"`);
is('both saved', about.on.basketball === true && about.on.soccer === true);
is('on to the goal question', await saysSoon('working toward'), `"${bubble()}"`);

console.log('\n3. a goal — TYPED, sent with ENTER:');
await type('better grades');
await pressEnter();
is('enter sent it', bubble().includes('better grades'), `"${bubble()}"`);
is('and saved it', about.on['better grades'] === true);
is('on to the posting question', await saysSoon('content creator'), `"${bubble()}"`);

console.log('\n4. do you post — one answer only, then send:');
await tapChip('yes, all the time');
await tapChip('sometimes');
is('picking a second answer replaces the first (not both)',
  !buttons().some((b) => b.textContent.trim() === '✓ yes, all the time')
  && buttons().some((b) => b.textContent.trim() === '✓ sometimes'));
await clickSend();
is('it took it', bubble().includes('posting sometimes'), `"${bubble()}"`);
is('and saved it', about.creator === 'sometimes', `"${about.creator}"`);
is('on to the last question', await saysSoon('scrolling the most'), `"${bubble()}"`);

console.log('\n5. when — a tap AND some typing together:');
await tapChip('at night');
await type('and on the bus');
await clickSend();
is('he wraps up', await saysSoon("that's all i needed"), `"${bubble()}"`);
is('and the way forward appears', await chipSoon('next step'));
is('the composer is gone', !$('input'));

console.log('\n6. "next step" actually leaves:');
await tapChip('next step');
is('goes to about you', went === 'aboutyou', `went to "${went}"`);

console.log(fail ? `\n${fail} FAILED` : '\nall good — the whole conversation works end to end');
process.exit(fail ? 1 : 0);

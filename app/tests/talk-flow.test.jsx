/* Typing to Rilo in a real DOM — the chat from Home, which is the only
   place the conversation screen lives now that onboarding asks its one
   question on its own screen.

   This exists because typing once shipped completely broken: a missing
   word table made every submit throw inside React's onSubmit, silently,
   and every render test still passed. A screen can look perfect and be
   entirely non-functional. */
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
let went = null;
const root = createRoot(document.getElementById('root'));
await act(async () => {
  root.render(React.createElement(Talk, {
    go: (s) => { went = s; }, mode: 'chat', skin: 'original',
    name: 'ethan', setName: () => {},
    setAbout: (fn) => { about = typeof fn === 'function' ? fn(about) : fn; },
    onTalked: () => {},
  }));
});

console.log('the chat opens on the keyboard:');
is('he asks something open', bubble().includes("what's new"), `"${bubble()}"`);
is('there is a field', Boolean($('input')));
is('send is off until there are words', $('button[type="submit"]').disabled);

console.log('\ntyped, sent with ENTER:');
await type('basketball');
is('send turns on', !$('button[type="submit"]').disabled);
await pressEnter();
is('he took it', bubble().includes('basketball'), `"${bubble()}"`);
is('and saved it', about.on.basketball === true);
is('the field cleared', $('input').value === '');

console.log('\ntapped a chip, then SEND:');
await tapChip('soccer');
is('one tap does not send', !bubble().includes('soccer'), `"${bubble()}"`);
is('it reads as picked', buttons().some((b) => b.textContent.trim() === '✓ soccer'));
await clickSend();
is('send took it', bubble().includes('soccer'), `"${bubble()}"`);
is('and saved it', about.on.soccer === true);

console.log('\nno confirm screens anywhere:');
is('never asks "did i get that right"', !bubble().includes('did i get that right'));
is('no yep/nope', !byText('yep') && !byText('nope'));

console.log('\n"done" leaves:');
await tapChip('done');
is('goes home', went === 'home', `went to "${went}"`);

console.log(fail ? `\n${fail} FAILED` : '\nall good — typing to rilo works');
process.exit(fail ? 1 : 0);

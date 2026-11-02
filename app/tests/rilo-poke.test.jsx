/* Tapping Rilo in a real DOM: does he squish, say something, and get out
   of the way again — without disturbing the screen? */
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'https://localhost/', pretendToBeVisual: true });
for (const [k, v] of Object.entries({ window: dom.window, document: dom.window.document,
  HTMLElement: dom.window.HTMLElement, Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent, localStorage: dom.window.localStorage })) globalThis[k] = v;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react');
const Rilo = (await import('../src/components/Rilo.jsx')).default;
const { RILO_LINES } = await import('../src/lib/riloLines.js');

let fail = 0;
const is = (n, ok, extra = '') => { if (!ok) fail++; console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`); };
const root = createRoot(document.getElementById('root'));
const $ = (s) => document.querySelector(s);
const said = () => [...document.querySelectorAll('span')].map((e) => e.textContent)
  .find((t) => RILO_LINES.some((l) => l.say === t));

await act(async () => { root.render(React.createElement(Rilo, { skin: 'original', mood: 'coach', size: 140, talks: true })); });

console.log('before any tap:');
is('he is a button you can poke', Boolean($('button[aria-label="poke rilo"]')));
is('nothing is being said yet', !said());
is('no squish class yet', !$('.rilo-squish'));

const poke = async () => {
  await act(async () => { $('button[aria-label="poke rilo"]').dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
};

await poke();
console.log('\nafter a tap:');
const first = said();
is('he says something', Boolean(first), `"${first}"`);
is('it is one of the written lines', RILO_LINES.some((l) => l.say === first));
is('he squishes', Boolean($('.rilo-squish')));
const bubbleStyle = ($('span[aria-live="polite"]')?.getAttribute('style') ?? '').replace(/\s+/g, '');
is('the line floats (no layout space)', bubbleStyle.includes('position:absolute'), bubbleStyle.slice(0, 40));
is('and ignores taps itself', bubbleStyle.includes('pointer-events:none'));

console.log('\ntapping repeatedly:');
const seen = new Set([first]);
let repeatedImmediately = false;
for (let i = 0; i < 12; i++) {
  const prev = said();
  await poke();
  const now = said();
  if (now === prev) repeatedImmediately = true;
  seen.add(now);
}
is('never says the same line twice in a row', !repeatedImmediately);
is('rotates through plenty of lines', seen.size >= 6, `${seen.size} different lines in 13 taps`);
is('there are 8–10+ lines written', RILO_LINES.length >= 8, `${RILO_LINES.length} lines`);
is('some lines change his mood', RILO_LINES.filter((l) => l.mood).length > 0,
  `${RILO_LINES.filter((l) => l.mood).length} of ${RILO_LINES.length} do`);

console.log('\nit gets out of the way:');
await act(async () => { await new Promise((r) => setTimeout(r, 2300)); });
is('the line is gone after ~2s', !said());
is('he is still pokeable', Boolean($('button[aria-label="poke rilo"]')));

console.log('\nwhen not opted in (inside an existing button):');
await act(async () => { root.render(React.createElement(Rilo, { skin: 'original', mood: 'coach', size: 140 })); });
is('he is not a button', !$('button'));
is('and says nothing', !said());

console.log(fail ? `\n${fail} FAILED` : '\nall good');
process.exit(fail ? 1 : 0);

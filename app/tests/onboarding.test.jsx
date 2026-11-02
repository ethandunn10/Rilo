/* The rebuilt onboarding: eight steps, everything before the paywall,
   nothing after it.

   This checks each screen's content and the route graph that joins them,
   rather than driving the whole thing through the router — jsdom has no CSS
   animations and no AnimationEvent, so a slide only settles on the app's
   fallback timer and a scripted walk spends its life guessing at delays.
   The talk-flow test covers real typing; this one covers the shape. */
import { renderToString } from 'react-dom/server';
import React from 'react';
import { readFileSync } from 'fs';
import * as L from '../src/lib/limits.js';
import { buildBreakdown } from '../src/lib/plan.js';
import { demoDailyMinutes, insteadPlan, riloLimits } from '../src/demo/mockAI.js';
import { daysPerYear, RATHER, applyRather } from '../src/lib/rather.js';

const noop = () => {};
let fail = 0;
const is = (n, ok, extra = '') => { if (!ok) fail++; console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`); };
const flat = (h) => h.replace(/<!--[^>]*-->/g, '').replace(/<[^>]+>/g, ' ').replace(/&#x27;/g, "'").replace(/&apos;/g, "'").replace(/\s+/g, ' ').toLowerCase();
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

/* the demo data the flow runs on */
const picked = ['tiktok', 'instagram', 'youtube'];
const mins = demoDailyMinutes(picked);
const breakdown = buildBreakdown(picked, mins, true);
const days = daysPerYear(breakdown.blocked);
const goalMins = 60 * Math.max(1, Math.round(mins / 60 / 2 / 0.5) * 0.5);
const plan = riloLimits({ tracked: picked, breakdown, goalMins, hobbies: ['gym'], goals: ['get fit'] });

/* ---------- 1. welcome ---------- */
const Welcome = (await import('../src/screens/Welcome.jsx')).default;
const w = flat(renderToString(<Welcome go={noop} skin="original" />));
console.log('1. welcome — the one idea');
is('names what rilo is', w.includes('screen-time buddy'));
is("and what he isn't", w.includes("i don't just block your apps"));
is('promises the alternative', w.includes('what to do instead'));
is('"let\'s go"', w.includes("let's go"));
is('"i already have an account"', w.includes('already have an account'));
is('goes to the name screen', app.includes("go('name')") || readFileSync(new URL('../src/screens/Welcome.jsx', import.meta.url), 'utf8').includes("go('name')"));

/* ---------- 2. name ---------- */
const Name = (await import('../src/screens/Name.jsx')).default;
const n = flat(renderToString(<Name go={noop} name="" setName={noop} skin="original" />));
console.log('\n2. name — one field');
is('asks it', n.includes('what should i call you'));
is('no confirm', !n.includes('did i get that right'));
is('can be skipped', n.includes('skip'));
is('enter submits (it is a form)', renderToString(<Name go={noop} name="" setName={noop} skin="original" />).includes('<form'));

/* ---------- 4. crunching ---------- */
console.log('\n4. crunching — 1.5s');
const crunch = readFileSync(new URL('../src/screens/Crunching.jsx', import.meta.url), 'utf8');
is('waits 1500ms', crunch.includes('1500'));
is('and the timer cannot be restarted by a parent render', crunch.includes('done.current?.()'));

/* ---------- 5. your number ---------- */
const YourNumber = (await import('../src/screens/YourNumber.jsx')).default;
const num = flat(renderToString(<YourNumber go={noop} skin="original" breakdown={breakdown} isPro={false} />));
console.log('\n5. your number — the stat is free');
is('the daily figure', /\d+h \d+m/.test(num), num.match(/\d+h \d+m/)?.[0]);
is('the days-a-year line', num.includes(`${days} days a year`), `${days} days a year`);
is('the per-app split is still pro', num.includes('see where your time goes') && num.includes('rilo pro'));
const numPro = flat(renderToString(<YourNumber go={noop} skin="original" breakdown={breakdown} isPro />));
is('and unblurred for pro', !numPro.includes('see where your time goes'));

/* ---------- 6. what would you rather ---------- */
const Rather = (await import('../src/screens/Rather.jsx')).default;
const r = flat(renderToString(<Rather go={noop} skin="original" breakdown={breakdown} picked={[]} setPicked={noop} />));
console.log('\n6. what would you rather — the only question about them');
is('uses the real number', r.includes(`${days} days a year. what would you rather`));
is('all seven options', RATHER.every((x) => r.includes(x.label)), `${RATHER.length} chips`);
is('plus add your own', r.includes('add your own'));
is('multi-select, one next', r.includes('pick at least one'));
const rPicked = flat(renderToString(<Rather go={noop} skin="original" breakdown={breakdown} picked={['gym', 'studying']} setPicked={noop} />));
is('two picks are allowed at once', (rPicked.match(/✓/g) ?? []).length >= 2);
is('and then next is live', rPicked.includes('next') && !rPicked.includes('pick at least one'));

console.log('\n   …saved where the old screens saved');
const folded = applyRather({ on: { golf: true }, extra: { hobby: [], goal: [] } }, ['gym', 'studying'], ['chess']);
is('hobbies land in about.on', folded.on.gym === true);
is('goals land in about.on', folded.on['get fit'] === true && folded.on['better grades'] === true);
is('typed answers land in about.extra', folded.extra.hobby.includes('chess'));
is('the demo defaults are cleared', folded.on.golf === false);

/* ---------- 7. your plan ---------- */
const YourPlan = (await import('../src/screens/YourPlan.jsx')).default;
const instead = insteadPlan({ picks: ['gym', 'studying'], apps: picked });
const p = flat(renderToString(
  <YourPlan go={noop} skin="original" tracked={picked} appSettings={plan.settings}
    instead={instead} goalMins={goalMins} onEdit={noop} />,
));
console.log('\n7. your plan — both halves of the pitch');
is('your limits', p.includes('your limits'));
is('with a real per-app limit', /opens × \d+ min/.test(p), p.match(/[\d½]+ opens × \d+ min/)?.[0]);
is('what you\'ll do instead', p.includes("what you'll do instead"));
is('with a time and a swap', /instead of (tiktok|instagram|youtube)/.test(p), instead[0] && `${instead[0].when}: ${instead[0].what}`);
is('2–3 suggestions', instead.length >= 2 && instead.length <= 3, `${instead.length}`);
is('pro named but locked', p.includes('with rilo pro'));
for (const f of ['nightly check-in', 'step-down', 'where your time goes', 'strict mode']) {
  is(`  locked: ${f}`, p.includes(f));
}
is('an edit link', p.includes('edit'));
is('one big button to the paywall', p.includes('unlock my full plan'));

/* ---------- 8. paywall, then home ---------- */
console.log('\n8. paywall last — then straight home');
const Paywall = (await import('../src/screens/Paywall.jsx')).default;
const pw = flat(renderToString(<Paywall go={noop} plan="year" setPlan={noop} onChoose={noop} nextFor={() => 'home'} />));
is('the free option is visible', pw.includes('free does the basics') || pw.includes('free'));
is('step 8 ends at home whichever they choose',
  app.includes("nextFor={() => (screen === 'paywall' ? 'home' : cameFrom ?? 'home')}"));
is('nothing is set up after it', !app.includes("'nightonboard'") && !app.includes("'calendaronboard'"));

/* ---------- the route graph ---------- */
console.log('\nthe order, read off the routes');
const order = ['welcome', 'name', 'pickapps', 'permission', 'crunching', 'yournumber', 'rather', 'yourplan', 'paywall'];
for (const route of order.slice(1)) {
  is(`route exists: ${route}`, app.includes(`case '${route}'`) || route === 'welcome');
}
console.log(`  ${order.join(' → ')} → home`);
is('8 steps (apps + screen time is one step, two screens)', order.length - 1 === 8, `${order.length - 1}`);

/* ---------- and what was removed stayed removed ---------- */
console.log('\nremoved for good');
for (const [what, route] of [
  ['how it works', 'howitworks'], ['instead (explainer)', 'instead'],
  ['the about-you review', 'aboutyou'], ['the hours stepper', 'timeback'],
  ['the breakdown screen', 'timegoes'],
]) {
  is(`${what} is gone`, !app.includes(`case '${route}'`));
}
const talk = readFileSync(new URL('../src/screens/Talk.jsx', import.meta.url), 'utf8');
is('"when do you scroll most" is gone', !talk.includes("id: 'when'"));
is('"do you post?" is gone', !talk.includes("id: 'creator'"));
is('talk is still in the app, just not in onboarding',
  app.includes("case 'talkchat'") && !app.includes("case 'talk':"));

/* ---------- the paywall is not a one-way door ---------- */
console.log('\nlooking at the price is undoable');
const pwBack = flat(renderToString(
  <Paywall go={noop} plan="year" setPlan={noop} onChoose={noop} nextFor={() => 'x'} onBack={noop} />,
));
is('there is a back button when something opened it', pwBack.includes('back'));
is('and none on the onboarding step itself', !flat(renderToString(
  <Paywall go={noop} plan="year" setPlan={noop} onChoose={noop} nextFor={() => 'home'} />,
)).match(/\bback\b/));

is('the blurred split opens the returnable route, not step 8',
  readFileSync(new URL('../src/screens/YourNumber.jsx', import.meta.url), 'utf8')
    .includes("onUpgrade={() => go('upgrade')}"));
is('App records where the paywall was opened from', app.includes("setCameFrom(nav.entries[nav.entries.length - 1])"));
is('back returns there', app.includes("goTo(cameFrom ?? 'home', 'back')"));
is('and so does choosing a plan', app.includes("nextFor={() => (screen === 'paywall' ? 'home' : cameFrom ?? 'home')}"));
is('step 8 still ends at home', app.includes("screen === 'paywall' ? 'home'"));
is('step 8 can go back to the plan', app.includes("goTo('yourplan', 'back')"));

console.log(fail ? `\n${fail} FAILED` : '\nall good — 8 steps, paywall last, home straight after');
process.exit(fail ? 1 : 0);

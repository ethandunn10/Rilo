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

console.log('\n"give me a few minutes" actually opens the app:');
{
  const Tired = (await import('../src/screens/Tired.jsx')).default;
  let got = null;
  await render(React.createElement(Tired, {
    onStart: (m) => { got = m; },
    onSaidNo: () => {},
    skin: 'original',
    minutes: 10,
  }));

  const give = btns().find((b) => /give me/.test(b.textContent || ''));
  is('the button offers their own minutes', /give me 10 minutes/.test(give?.textContent || ''),
    (give?.textContent || '').trim());
  await act(async () => { give.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  is('and asks for that many', got === 10, String(got));

  /* the handler on the other end has to open the app, not re-ask the
     question they already answered by tapping "just tired" */
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const fn = app.slice(app.indexOf('const startSession = ('), app.indexOf('const saidNo'));
  is('it starts a real session', fn.includes('startCheckedIn(currentApp'), fn.slice(0, 80));
  is('and never bounces back to the reason screen', !fn.includes("go('whyopen')"));
  is('using the minutes set for that app', fn.includes('setting.minutes'));
  is('and it records why they opened it',
    /startSession\(mins, 'tired'\)/.test(app) && /startSession\(mins, 'bored'\)/.test(app));
}

console.log('\nan app with no limit actually opens:');
{
  /* The loop: a free app has no opens, so the opens arithmetic produced a
     cap of 0, which sent the user back to the pop-up that offered to open
     it again. Verify the numbers that caused it, then the guard. */
  const { opensTotalFor, sessionCapMins } = await import('../src/lib/limits.js');
  const free = { mode: 'free', opens: 3, minutes: 15 };
  const avail = opensTotalFor({ setting: free, app: 'x', day: { opensUsed: {} }, borrow: null, dateKey: 'd' });
  is('a free app really does have zero opens', avail === 0, String(avail));
  is('so the opens maths alone would cap it at nothing',
    sessionCapMins({ avail: 0, minutes: 15, strictOn: false }) === 0);

  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const fn = app.slice(app.indexOf('const startOpenSession ='), app.indexOf('const finishSession'));
  is('so a free app skips that maths entirely', fn.includes("if (setting.mode === FREE)"));
  is('and goes straight into the app', /setting\.mode === FREE[\s\S]{0,420}goTo\('appopen'\)/.test(fn));
  is('with its own session kind, so nothing charges it an open',
    /kind: 'free'/.test(fn) && app.includes("session.kind === 'open'"));
  is('the free branch comes before the cap check',
    fn.indexOf('mode === FREE') < fn.indexOf('if (cap <= 0)'));

  /* a length the user picked is no longer thrown away */
  const ss = app.slice(app.indexOf('const startSession = ('), app.indexOf('const saidNo'));
  is('a picked length is honoured, capped by the app',
    ss.includes('Math.min(wanted ?? setting.minutes, setting.minutes)'), ss.slice(0, 60));
  is('and a blocked app no longer loops back to the shield', ss.includes('mode === BLOCKED'));
  is('BLOCKED is imported, so that branch cannot throw', /\n  BLOCKED,/.test(app));
}

console.log('\nthe loose ends:');
{
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  is('the knock only shows while the shield is up',
    app.includes("banner && nav.entries[nav.entries.length - 1] === 'shield'"));
  is('and closing the shield clears it', app.includes('setBanner(false); go(\'home\', \'back\')'));

  const { suggestion, pickedHobbies } = await import('../src/lib/profile.js');
  const about = { on: { basketball: true, gym: true }, extra: { hobby: [], goal: [] } };
  is('both hobbies are available to suggest', pickedHobbies(about).length === 2);
  const a = suggestion(about, 'tiktok', 0);
  const b = suggestion(about, 'tiktok', 1);
  is('"something else" really is something else', a.task !== b.task, `${a.task} / ${b.task}`);
  is('and it wraps round', suggestion(about, 'tiktok', 2).task === a.task);

  const sug = readFileSync(new URL('../src/screens/Suggestion.jsx', import.meta.url), 'utf8');
  is('with one hobby the button says what it does', sug.includes("'not right now'"));
}

console.log('\nthe tour can never trap them:');
{
  const MeetRiloTour = (await import('../src/components/MeetRiloTour.jsx')).default;
  /* render it with NO anchors in the DOM — a renamed target, or a screen
     that hasn't mounted. The card must still appear so skip/next work;
     otherwise the full-screen dim covers everything and the app is stuck. */
  let skipped = false;
  await render(React.createElement(MeetRiloTour, {
    skin: 'original',
    screen: 'home',
    go: () => {},
    onCreatorAnswer: () => {},
    onDone: () => { skipped = true; },
  }));
  await act(async () => { await new Promise((r) => setTimeout(r, 2000)); });

  const card = document.querySelector('[data-tour-card=""]');
  is('the card still appears', Boolean(card));
  is('and is not hidden', (card?.getAttribute('style') || '').includes('visibility: visible'),
    (card?.getAttribute('style') || '').match(/visibility:[^;]*/)?.[0] ?? 'none');

  const skip = btns().find((b) => b.getAttribute('aria-label') === 'Skip tour');
  is('skip is reachable', Boolean(skip));
  await act(async () => { skip.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })); });
  is('and it works', skipped);

  const src = readFileSync(new URL('../src/components/MeetRiloTour.jsx', import.meta.url), 'utf8');
  is('scrolling cannot kill the measuring loop',
    src.includes('scrollIntoView') && /catch \{ \/\* no layout to scroll/.test(src));
}

console.log('\nand the small things:');
{
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  is('tapping the tab you are on does nothing',
    app.includes("if (n.entries[n.entries.length - 1] === next) return n;"));
  is("rilo's daily question is demoed where it actually shows",
    app.includes("if (row.slot === 'checkin') go('nightcheckin');\n    else go('plan');"));
}

console.log('\nthe step that pointed at nothing:');
{
  const tour = readFileSync(new URL('../src/components/MeetRiloTour.jsx', import.meta.url), 'utf8');
  const prog = readFileSync(new URL('../src/screens/Progress.jsx', import.meta.url), 'utf8');
  /* the week chart is empty on a new account, so a step highlighting it
     framed a blank box */
  is('progress points at the level card, not the empty chart',
    tour.includes("target: 'progress-level'") && !tour.includes("target: 'progress-week'"));
  is('and that card is anchored', prog.includes('data-tour-target="progress-level"'));

  const handoff = readFileSync(new URL('../src/components/RiloHandoff.jsx', import.meta.url), 'utf8');
  is('rilo is big on the way in', /size=\{2[5-9]\d\}/.test(handoff),
    (handoff.match(/size=\{\d+\}/) || [''])[0]);
}

console.log('\nthe xp system, rule by rule:');
{
  const { dayXp } = await import('../src/lib/plan.js');
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');

  /* earning */
  const good = dayXp({ used: 90, goal: 120, streak: 2 });
  is('under the goal pays', good.xp > 0 && good.hit, JSON.stringify(good));
  is('and extends the streak', good.streak === 3);
  is('further under pays more', dayXp({ used: 60, goal: 120, streak: 2 }).xp > good.xp);
  is('a longer streak pays more', dayXp({ used: 90, goal: 120, streak: 5 }).xp > good.xp);

  /* going over the DAY */
  const bad = dayXp({ used: 200, goal: 120, streak: 6 });
  is('over the goal scores nothing', bad.xp === 0, JSON.stringify(bad));
  is('and never goes negative', bad.xp >= 0);
  is('the streak is what is lost', bad.streak === 0);

  /* losing */
  is('the emergency pass costs xp', app.includes('awardXp(-PASS_XP)'));
  is('overstaying what they promised costs xp', app.includes('awardXp(-spill)'));
  is('proportional to how far over they went',
    app.includes('Math.min(OVER_XP_CAP, Math.round(gone - promise.promised))'));
  is('and capped so one session cannot wipe a week', app.includes('OVER_XP_CAP = 30'));

  /* the cost is stated, not silent */
  const mock = readFileSync(new URL('../src/demo/mockAI.js', import.meta.url), 'utf8');
  is('and rilo says the number', mock.includes('cost ? `${line} −${cost} xp.`'));

  /* nothing else takes xp */
  const takes = [...app.matchAll(/awardXp\(\s*-([A-Za-z_]+)/g)].map((m) => m[1]);
  is('only the pass and overstaying ever take xp',
    new Set(takes).size === 2 && takes.includes('PASS_XP') && takes.includes('spill'),
    [...new Set(takes)].join(','));

  /* opening an app normally costs an OPEN, never xp */
  /* just startOpenSession — the pass is declared between it and
     finishSession, and it legitimately does spend xp */
  const openStart = app.indexOf('const startOpenSession =');
  const open = app.slice(openStart, app.indexOf('\n  const ', openStart + 10));
  is('opening an app does not cost xp', !open.includes('awardXp'),
    open.match(/awardXp\([^)]*\)/)?.[0] ?? 'none');
  is('leaving on time earns it', app.includes('awardXp(ON_TIME_XP)'));

  /* xp floors at zero and a level is never lost */
  const award = app.slice(app.indexOf('const awardXp ='), app.indexOf('const awardXp =') + 400);
  is('xp can never go below zero', award.includes('Math.max(0, xp + amount)'));
  is('and a level once earned stays', award.includes('if (earned <= level) return false;'));
}

console.log('\nand the warning that comes BEFORE the open:');
{
  const Intercept = (await import('../src/screens/Intercept.jsx')).default;
  const base = {
    go: () => {}, app: 'tiktok', skin: 'original', openCount: 1, opensToday: 1,
    lock: { locked: false, used: 1, setting: { mode: 'limited', opens: 3, minutes: 15 } },
    minutes: 15, opensTotal: 3, opensUsed: 1, opensLeft: 2,
    passesLeft: 1, canBorrow: false, hobbies: [], goals: [],
    onPass: () => {}, onBorrow: () => {}, onOpen: () => {}, onReason: () => {},
  };

  await render(React.createElement(Intercept, { ...base, streak: 6, goalLeft: 12 }));
  const warn = document.querySelector('[data-streak-warning]');
  is('a streak about to go is called out', Boolean(warn));
  is('naming the minutes and the streak',
    /12 min left/.test(warn?.textContent || '') && /6-day streak/.test(warn?.textContent || ''),
    (warn?.textContent || '').trim().slice(0, 70));

  await render(React.createElement(Intercept, { ...base, streak: 6, goalLeft: 200 }));
  is('but not when the day is wide open', !document.querySelector('[data-streak-warning]'));

  await render(React.createElement(Intercept, { ...base, streak: 0, goalLeft: 12 }));
  is('and not when there is no streak to lose', !document.querySelector('[data-streak-warning]'));
}

console.log(fail ? `\n${fail} failed` : '\nall good — home cut back, guilt before bypasses, five free apps, a simpler plan editor');
process.exit(fail ? 1 : 0);

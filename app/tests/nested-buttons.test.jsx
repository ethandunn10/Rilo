/* A <button> inside a <button> is invalid HTML and the two fight over the
   tap. Rilo became tappable, so every place he sits inside an existing
   button has to be found. */
import { renderToString } from 'react-dom/server';
import React from 'react';
import * as L from '../src/lib/limits.js';

const noop = () => {};
const about = { on: {}, extra: { hobby: [], goal: [] }, creator: '' };
const tracked = ['tiktok', 'youtube', 'phone'];
const appSettings = { tiktok: { mode: L.LIMITED, opens: 3, minutes: 15 } };
const day = { opensUsed: { tiktok: 1 }, used: {}, lastSession: null };
const lockOf = (a) => L.lockFor({ app: a, appSettings, day, borrow: {}, dateKey: 'd', strictOn: false });
const check = L.planCheck({ appSettings, tracked, typicalFor: () => 20, goalMins: 120 });

function nestedButtons(html) {
  let depth = 0, worst = 0;
  const re = /<button\b|<\/button>/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[0] === '</button>') depth -= 1;
    else { depth += 1; worst = Math.max(worst, depth); }
  }
  return worst;
}

const R = new URL('../src/screens/', import.meta.url).pathname;
const cases = [];
const add = (n, el) => cases.push([n, el]);

const Home = (await import(R + 'Home.jsx')).default;
const homeProps = {
  go: noop, name: 'ethan', about, xp: 320, level: 2, skin: 'original', onOpenApp: noop,
  tracked, appSettings, lockOf, totalOpensFor: () => 3, usedToday: 55, goalMins: 120,
  streak: 4, passesLeft: 1, backToday: 30, canCheckIn: true, onNightCheckIn: noop,
  onStrictYes: noop, onStrictNo: noop, onClearSavedNote: noop, onClearOverNote: noop,
  onStepAccept: noop, onStepSkip: noop, onStepSwap: noop,
};
add('Home', <Home {...homeProps} />);
add('Home + saved note', <Home {...homeProps} savedNote={{ app: 'tiktok', mins: 7 }} />);
add('Home + over note', <Home {...homeProps} overNote="you said quick." />);
add('Home + strict popup', <Home {...homeProps} suggestStrict />);
add('Home + step-down', <Home {...homeProps} stepApp="tiktok" stepPhase="offered"
  stepProposal={{ kind: 'minutes', say: 'goes to 12 min per open' }} stepSwappable={['youtube']} />);

const You = (await import(R + 'You.jsx')).default;
add('You', <You go={noop} name="e" about={about} setAbout={noop} apps={{ on: {}, extra: [] }}
  setApps={noop} time={{ now: 4, goal: 2 }} setTime={noop} check={check} tracked={tracked}
  appSettings={appSettings} xp={320} level={2} isPro chosenRilo="original" theme="grass"
  onTheme={noop} onLockedTheme={noop} stats={{ savedMinutes: 0, saidNo: 0 }}
  strict={{ on: false, days: 7, when: 'all', endingAt: null }} onStrictOn={noop}
  onStrictAskOff={noop} onStrictKeepOn={noop} onStrictOffNow={noop} onNextDay={noop}
  onNextDayOver={noop} onNextWeek={noop} onStartOver={noop} onDemoXp={noop}
  night={{ at: '21:00', date: '' }} setNight={noop} />);

for (const [name, file, props] of [
  ['Limits', 'Limits.jsx', { go: noop, skin: 'original', tracked, appSettings, onSetApp: noop,
    time: { now: 4, goal: 2 }, setTime: noop, day, check, pending: [], onCancelPending: noop,
    limitMode: 'rilo', riloWhy: { tiktok: 'most of it' }, riloLead: ['tiktok first'],
    onRiloPlan: noop, onOwnPlan: noop, pctFor: () => 40, totalOpensFor: () => 3 }],
  ['Plan', 'Plan.jsx', { go: noop, skin: 'original', schedule: { mode: 'rilo', rows: [] },
    setSchedule: noop, check, onLimits: noop }],
  ['Plan locked', 'Plan.jsx', { go: noop, skin: 'original', locked: true, onUpgrade: noop,
    schedule: { mode: 'rilo', rows: [] }, setSchedule: noop, check, onLimits: noop }],
  ['Progress', 'Progress.jsx', { go: noop, xp: 320, skin: 'original', level: 2, program: { week: 1 },
    goalMins: 120, usedToday: 55, history: [], streak: 0, stats: { savedMinutes: 0, saidNo: 0 },
    check, isPro: true }],
  ['Buddies', 'Buddies.jsx', { go: noop, skin: 'original', buddies: { code: 'ABC123', friends: [] },
    setBuddies: noop, myMood: 'proud', myStreak: 4 }],
  ['CalendarConnect', 'CalendarConnect.jsx', { go: noop, skin: 'original', apps: ['tiktok'],
    calendar: { on: false, which: '', sources: [] }, setCalendar: noop }],
  ['PickRilo', 'PickRilo.jsx', { go: noop, chosenRilo: 'original', setChosenRilo: noop,
    isPro: true, level: 40, onPreview: noop, onLockedTap: noop }],
  ['ShareCard', 'ShareCard.jsx', { go: noop, skin: 'original', level: 2, streak: 4, week: 210, total: 900 }],
  ['Paywall', 'Paywall.jsx', { go: noop, plan: 'year', setPlan: noop, onChoose: noop, nextFor: () => 'x' }],
  ['Permission', 'Permission.jsx', { skin: 'original', onAllow: noop, onDeny: noop, onTriedAgain: noop, onSkip: noop }],
  ['Welcome', 'Welcome.jsx', { go: noop, skin: 'original' }],
  ['HowItWorks', 'HowItWorks.jsx', { go: noop, skin: 'original' }],
  ['Instead', 'Instead.jsx', { go: noop, skin: 'original' }],
  ['AboutYou', 'AboutYou.jsx', { go: noop, about, setAbout: noop, name: '', setName: noop, skin: 'original' }],
  ['PickApps', 'PickApps.jsx', { go: noop, apps: { on: {}, extra: [] }, setApps: noop, skin: 'original' }],
  ['NightTime', 'NightTime.jsx', { go: noop, skin: 'original', night: { at: '21:00' }, setNight: noop }],
  ['DaySummary', 'DaySummary.jsx', { skin: 'original', result: { used: 90, goal: 120, hit: true, xp: 60, streak: 3, under: 30 }, onDone: noop }],
  ['LevelUp', 'LevelUp.jsx', { skin: 'gold', level: 10, onWear: noop, onLater: noop }],
  ['Shield', 'Shield.jsx', { app: 'tiktok', skin: 'original', lock: lockOf('tiktok'), minutes: 15, opensTotal: 3, opensUsed: 1, onTalk: noop, onClose: noop }],
  ['Suggestion', 'Suggestion.jsx', { go: noop, about, app: 'tiktok', onStart: noop, onSaidNo: noop, skin: 'original' }],
  ['Tired', 'Tired.jsx', { go: noop, onStart: noop, onSaidNo: noop, skin: 'original' }],
  ['Break', 'Break.jsx', { go: noop, onStart: noop, onSaidNo: noop, skin: 'original' }],
  ['NeedIt', 'NeedIt.jsx', { go: noop, app: 'tiktok', onStart: noop, onSaidNo: noop, skin: 'original' }],
  ['TimeGoes', 'TimeGoes.jsx', { go: noop, skin: 'original', breakdown: null }],
  ['TimeBack', 'TimeBack.jsx', { go: noop, time: { now: 4, goal: 2 }, setTime: noop, skin: 'original', check }],
  ['Crunching', 'Crunching.jsx', { skin: 'original', onDone: noop }],
  ['WhyOpen', 'WhyOpen.jsx', { app: 'tiktok', skin: 'original', minutes: 15, opensTotal: 3, opensUsed: 1, opensLeft: 2, onStart: noop, onNevermind: noop, onInstead: noop }],
  ['Intercept', 'Intercept.jsx', { go: noop, app: 'tiktok', skin: 'original', openCount: 2, opensToday: 1, lock: lockOf('tiktok'), minutes: 15, opensTotal: 3, opensUsed: 1, opensLeft: 2, passesLeft: 1, onReason: noop, onOpen: noop, onPass: noop, onBorrow: noop }],
  ['NightCheckIn', 'NightCheckIn.jsx', { skin: 'original', onDone: noop, onSkip: noop }],
  ['Talk', 'Talk.jsx', { go: noop, mode: 'onboarding', skin: 'original', name: '', setName: noop, about, setAbout: noop, onTalked: noop }],
]) {
  const Comp = (await import(R + file)).default;
  add(name, <Comp {...props} />);
}

let bad = 0;
for (const [name, el] of cases) {
  try {
    const depth = nestedButtons(renderToString(el));
    if (depth > 1) { bad++; console.log(`  FAIL ${name}: button nested ${depth} deep`); }
  } catch (e) {
    bad++;
    console.log(`  FAIL ${name}: threw — ${e.message.split('\n')[0]}`);
  }
}
console.log(bad ? `\n${bad} of ${cases.length} screens have a nested button` : `\nall ${cases.length} screens clean — no nested buttons`);
process.exit(bad ? 1 : 0);

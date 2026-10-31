/* DEMO ONLY: replace with real AI/API in mobile app.
 *
 * Everything in this file is scripted. In the web demo there is no model
 * and no network — Rilo's "thinking" is a lookup table and a few simple
 * rules over the profile the tester filled in during onboarding.
 *
 * In the mobile app this is where real AI and real Screen Time data go. */

/* ---------- what Rilo says when a check-in runs over ---------- */
const OVER_LINES = {
  messages: 'you said {mins} for messages. it has been {gone}.',
  something: 'you said {mins} to look one thing up. it has been {gone}.',
  bored: 'you said {mins} because you were bored. it has been {gone}.',
  custom: 'you said {mins} for "{why}". it has been {gone}.',
};

export function overLine({ reason, why, promised, gone, fmt }) {
  const t = OVER_LINES[reason] ?? OVER_LINES.custom;
  return t
    .replace('{mins}', fmt(promised))
    .replace('{gone}', fmt(gone))
    .replace('{why}', why || 'that');
}

/* ---------- "you got back N hours" in something real ---------- */
/* each takes minutes and returns a phrase; rotated so it isn't stale */
export const COMPARISONS = [
  { per: 110, one: 'a movie', many: 'movies' },
  { per: 45, one: 'a workout', many: 'workouts' },
  { per: 25, one: 'an episode', many: 'episodes' },
  { per: 30, one: 'a walk', many: 'walks' },
  { per: 60, one: 'an hour of practice', many: 'hours of practice' },
  { per: 20, one: 'a chapter', many: 'chapters' },
];

export function comparisonFor(mins, spin = 0) {
  const usable = COMPARISONS.filter((c) => Math.floor(mins / c.per) >= 1);
  if (!usable.length) return '';
  const c = usable[spin % usable.length];
  const n = Math.floor(mins / c.per);
  return `that's ${n} ${n === 1 ? c.one : c.many}`;
}

/* ---------- Rilo's own plan, "generated" ---------- */
/* Simple rules over the profile + the mock baseline. The explanation is
   scripted so it reads like he thought about it. */
export function riloPlan({ startMins, goalMins, hobbies = [], goals = [], apps = [] }) {
  const gap = Math.max(0, startMins - goalMins);
  const steep = gap / Math.max(1, startMins) > 0.5;

  const pace = steep ? 'steady' : gap > 90 ? 'two' : 'straight';
  const sessionMins = startMins > 300 ? 20 : startMins > 180 ? 15 : 10;

  const why = [];
  why.push(
    steep
      ? `you're cutting a lot, so we'll do it over four weeks instead of all at once.`
      : gap > 90
        ? `that's a real cut but not a brutal one. two weeks.`
        : `you're close already. we'll go straight to it.`,
  );
  if (apps.length) why.push(`${apps[0]} is where most of it goes, so that's where we start.`);
  if (hobbies.length) why.push(`when you want to scroll, i'll point you at ${hobbies[0]}.`);
  if (goals.length) why.push(`you said ${goals[0]}. this is the part you control.`);

  return { pace, sessionMins, why };
}

/* ---------- Rilo builds your day ----------
   Rules over the profile, their school hours and their bedtime. The
   wording is scripted; in the mobile app this is a real model looking at
   real Screen Time and a real calendar. */
function clock(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = String(mins % 60).padStart(2, '0');
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}`;
}

export function riloSchedule({ hobbies = [], goals = [], school, bedtime, scrollMins = 60 }) {
  const rows = [];
  const add = (at, title, note) => rows.push({ at, title, note });

  /* the day starts when school lets out, or mid-afternoon if there's none */
  const [eh, em] = String(school?.on ? school.to : '15:00').split(':').map(Number);
  let t = eh * 60 + (em || 0);

  const free1 = Math.max(10, Math.round(scrollMins * 0.25));
  const free2 = Math.max(10, Math.round(scrollMins * 0.5));

  add(clock(t), school?.on ? 'out of school' : 'chill + snack', `${free1} min free scroll`);
  t += 30;

  const studyGoal = goals.find((g) => /grade|school|college|read|code|learn/.test(g));
  add(clock(t), studyGoal ? `work on ${studyGoal}` : 'homework', 'apps locked for 45 min');
  t += 75;

  if (hobbies[0]) {
    add(clock(t), hobbies[0], 'the thing you said you wanted time for');
    t += 60;
  }

  const fitGoal = goals.find((g) => /fit|team|gym|strong/.test(g));
  if (fitGoal && hobbies[1]) {
    add(clock(t), hobbies[1], `counts toward ${fitGoal}`);
    t += 45;
  }

  add(clock(t), 'dinner', 'phone away');
  t += 60;

  add(clock(t), 'free time', `${free2} min scroll allowed`);
  t += 60;

  const [bh, bm] = String(bedtime?.from || '22:30').split(':').map(Number);
  add(clock(bh * 60 + (bm || 0)), 'bedtime', 'rilo goes to sleep, apps lock');

  return rows;
}

/* ---------- their calendar ----------
   DEMO ONLY: a fixed week. In the mobile app this is EventKit on iOS or
   the Google Calendar API, read only, after the user allows it. */
export const DEMO_CALENDAR = [
  { day: 'mon', at: '16:00', title: 'basketball practice', kind: 'practice' },
  { day: 'tue', at: '15:30', title: 'tutoring', kind: 'study' },
  { day: 'wed', at: '16:00', title: 'basketball practice', kind: 'practice' },
  { day: 'thu', at: '08:30', title: 'ap bio test', kind: 'test' },
  { day: 'fri', at: '19:00', title: 'game vs. lincoln', kind: 'practice' },
  { day: 'sat', at: '11:00', title: 'work shift', kind: 'work' },
];

const DAY_NAME = {
  mon: 'monday', tue: 'tuesday', wed: 'wednesday',
  thu: 'thursday', fri: 'friday', sat: 'saturday', sun: 'sunday',
};

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/* The night before a test, Rilo takes the apps away for a couple of
   hours. Practices and shifts just become blocks he plans around. */
export function calendarPlan(events, apps = ['tiktok']) {
  const out = [];
  events.forEach((e) => {
    if (e.kind === 'test') {
      const i = DAY_ORDER.indexOf(e.day);
      const before = DAY_ORDER[(i + 6) % 7];
      out.push({
        day: before,
        from: '19:00',
        to: '21:00',
        why: `you've got ${e.title} ${DAY_NAME[e.day]}. i'll lock ${apps[0]} 7–9 ${DAY_NAME[before]}.`,
        kind: 'test',
      });
    } else if (e.kind === 'practice' || e.kind === 'work') {
      out.push({
        day: e.day,
        from: e.at,
        to: '',
        why: `${e.title} ${DAY_NAME[e.day]}. i'll keep that time free.`,
        kind: e.kind,
      });
    }
  });
  return out;
}

/* ---------- the nightly 30 seconds ----------
   DEMO ONLY: no model. What they said is matched against a few patterns
   to pull out tomorrow's tasks, and Rilo's reply is scripted. */
const TASK_HINTS = [
  { re: /test|quiz|exam|final/, title: 'study', note: 'apps locked for an hour' },
  { re: /homework|hw|essay|project|assignment/, title: 'homework', note: 'apps locked for 45 min' },
  { re: /practice|training|game|match|tryout/, title: 'practice', note: 'phone stays in the bag' },
  { re: /\bwork\b|shift|\bjob\b/, title: 'work shift', note: 'phone away' },
  { re: /\bgym\b|\blift|\brun\b|workout/, title: 'gym', note: 'earns you xp' },
  { re: /guitar|piano|draw|read|paint|write/, title: 'your thing', note: 'the one you keep skipping' },
  { re: /early|wake|morning/, title: 'early start', note: 'bedtime moves up tonight' },
];

export function tasksFrom(text) {
  const t = (text || '').toLowerCase();
  const out = [];
  TASK_HINTS.forEach((h) => {
    if (h.re.test(t) && !out.some((x) => x.title === h.title)) {
      out.push({ title: h.title, note: h.note });
    }
  });
  return out;
}

/* how the day went, from what they said about it */
export function nightReply(text) {
  const t = (text || '').toLowerCase();
  if (/bad|rough|awful|terrible|hard|stressed|tired/.test(t)) {
    return { mood: 'letdown', line: "rough one. tomorrow's a clean slate." };
  }
  if (/good|great|fine|ok|okay|solid|chill|nice/.test(t)) {
    return { mood: 'proud', line: 'good. let me set tomorrow up for you.' };
  }
  return { mood: 'coach', line: 'got it. let me set tomorrow up.' };
}

/* DEMO ONLY: a canned pair of answers, so the check-in can be shown
   without a working mic. */
export const DEMO_NIGHT = {
  today: 'it was alright, kind of a long one',
  tomorrow: 'i have a bio test and practice after school',
};

export const NIGHT_QUESTIONS = [
  { id: 'today', ask: "how'd today go?" },
  { id: 'tomorrow', ask: "anything on tomorrow?" },
];

/* ---------- buddies ---------- */
/* No backend in the demo. Codes are generated locally and these three
   exist so the screen looks like a real one. */
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function makeInviteCode() {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += CODE_LETTERS[Math.floor(Math.random() * CODE_LETTERS.length)];
  }
  return out;
}

export const DEMO_FRIENDS = [
  { id: 'f1', name: 'maya', skin: 'redpanda', mood: 'proud', streak: 9, nudged: false },
  { id: 'f2', name: 'dev', skin: 'original', mood: 'letdown', streak: 0, nudged: false },
  { id: 'f3', name: 'sam', skin: 'pinkpanda', mood: 'coach', streak: 3, nudged: false },
];

export const NUDGE_LINES = [
  'rilo poked them. they saw it.',
  'nudge sent. their rilo is staring at them.',
  'done. rilo told them you noticed.',
];

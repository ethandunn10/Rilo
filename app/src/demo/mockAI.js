/* DEMO ONLY: replace with real AI/API in mobile app.
 *
 * Everything in this file is scripted. In the web demo there is no model
 * and no network — Rilo's "thinking" is a lookup table and a few simple
 * rules over the profile the tester filled in during onboarding.
 *
 * In the mobile app this is where real AI and real Screen Time data go. */

import {
  ALWAYS,
  BLOCKED,
  LIMITED,
  FREE,
  DEFAULT_ALWAYS,
  MIN_MINUTES,
  MINUTE_STEP,
  planCheck,
} from '../lib/limits';

/* ---------- what Rilo says when a check-in runs over ---------- */
const OVER_LINES = {
  messages: 'you said {mins} for messages. it has been {gone}.',
  something: 'you said {mins} to look one thing up. it has been {gone}.',
  post: 'you said {mins} to post something. it has been {gone}.',
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

/* ---------- the number onboarding is built around ----------
   DEMO ONLY: the web can't read real Screen Time, and onboarding no longer
   asks how many hours they're on (that screen is gone). So the baseline is
   generated from the apps they picked — more apps, more hours — which gives
   a specific-looking total like "4h 12m" instead of a suspiciously round
   one. In the mobile app this is a DeviceActivityReport. */
const DEMO_MINUTES = {
  tiktok: 78,
  instagram: 54,
  youtube: 46,
  snapchat: 33,
  x: 22,
  reddit: 26,
  netflix: 31,
  twitch: 29,
  discord: 24,
  roblox: 27,
  fortnite: 25,
  pinterest: 18,
  facebook: 16,
  threads: 14,
  spotify: 20,
};
const DEMO_OTHER = 41; /* everything on the phone Rilo isn't watching */
const DEMO_DEFAULT = 23;

export function demoDailyMinutes(picked = []) {
  const apps = picked.reduce((n, a) => n + (DEMO_MINUTES[a] ?? DEMO_DEFAULT), 0);
  /* a floor, so someone who picks one small app still sees a real number */
  return Math.max(96, apps + DEMO_OTHER);
}

/* ---------- "what you'll do instead" ----------
   Two or three concrete swaps, built from the apps they picked and what
   they said they'd rather be doing. Specific on purpose: "do something
   else" is advice, "tonight 7-8pm: gym instead of tiktok" is a plan.

   DEMO ONLY: the times are sensible defaults. In the mobile app this reads
   their calendar. */
const WHEN = [
  { at: 'tonight, 7–8pm', fits: ['gym', 'sports', 'friends'] },
  { at: 'after school', fits: ['studying', 'skill', 'reading'] },
  { at: 'before bed', fits: ['reading', 'studying'] },
  { at: 'saturday morning', fits: ['making', 'skill', 'sports'] },
];

const DOING = {
  gym: 'gym',
  studying: '30 min of studying',
  sports: 'practice',
  friends: 'see your friends',
  making: 'make something',
  reading: '20 pages',
  skill: '20 min on a new skill',
};

export function insteadPlan({ picks = [], apps = [] } = {}) {
  const worst = apps[0] ?? 'the feed';
  const second = apps[1] ?? worst;
  const out = [];
  const usedWhen = new Set();

  picks.forEach((id) => {
    if (out.length >= 3) return;
    const slot = WHEN.find((w) => w.fits.includes(id) && !usedWhen.has(w.at));
    if (!slot || !DOING[id]) return;
    usedWhen.add(slot.at);
    out.push({
      id,
      when: slot.at,
      what: DOING[id],
      instead: out.length === 0 ? worst : second,
    });
  });

  /* they skipped the question — still give him something to say */
  if (!out.length) {
    out.push({ id: 'any', when: 'tonight, 7–8pm', what: 'anything but scrolling', instead: worst });
  }

  return out;
}

/* ---------- Rilo's own plan, "generated" (§13) ----------
   He proposes a setting for every app off the % data, the hobbies and goals
   they gave, their calendar, and the check-ins — then checks the result
   against the daily goal and tightens until it fits. One short sentence of
   reasoning per app, because a plan you don't understand isn't a plan.

   The rules are simple on purpose; in the mobile app this is a real model.
   What matters is that it always comes out passing the plan check. */
/* the share of their day at which an app stops being "a bit of a habit" */
const BIG_SHARE = 0.3;
const MID_SHARE = 0.12;

/* a sitting length that suits the app: feeds get short ones, video longer */
const LONG_FORM = ['youtube', 'netflix', 'twitch', 'hulu', 'disney+', 'prime video'];

function minutesFor(app, pct) {
  if (LONG_FORM.includes(app)) return 20;
  return pct >= BIG_SHARE * 100 ? 10 : 15;
}

/* the apps you'd actually post to */
const POSTING_APPS = ['instagram', 'tiktok', 'youtube', 'x', 'threads', 'snapchat'];

export function riloLimits({
  tracked = [],
  breakdown,
  goalMins,
  hobbies = [],
  goals = [],
  calendar = [],
  checkins = [],
  /* '' | 'yes' | 'sometimes' | 'no' — from the onboarding question */
  creator = '',
}) {
  const posts = creator === 'yes' || creator === 'sometimes';
  const byApp = new Map((breakdown?.apps ?? []).map((a) => [a.app, a]));
  const total = breakdown?.total ?? 0;
  const typical = (app) => Math.round(byApp.get(app)?.mins ?? 0);
  const shareOf = (app) => (total ? (byApp.get(app)?.mins ?? 0) / total : 0);

  const settings = {};
  const why = {};

  /* biggest first, so the apps doing the damage get the real decisions
     while there's still room in the goal to give them */
  const ordered = [...tracked].sort((a, b) => shareOf(b) - shareOf(a));

  ordered.forEach((app) => {
    const pct = Math.round(shareOf(app) * 100);

    /* the four that ship always allowed stay that way, plus anything the
       user already marked always allowed themselves */
    if (DEFAULT_ALWAYS.includes(app)) {
      settings[app] = { mode: ALWAYS, opens: 3, minutes: 15 };
      why[app] = 'you need this one. never locked.';
      return;
    }

    const share = shareOf(app);

    /* an app that's eating a third of the day and isn't tied to anything
       they said they cared about — block it outright */
    /* An app can be tied to something they actually care about — a hobby, a
       stated goal, or posting. Those don't get the doom-scroll treatment. */
    const isPostingApp = posts && POSTING_APPS.includes(app);
    const tiedToSomething =
      isPostingApp ||
      hobbies.some((h) => app.includes(h) || h.includes(app)) ||
      goals.some((g) => /content|video|post|grow|follow/.test(g) && /tiktok|instagram|youtube/.test(app));

    if (share >= BIG_SHARE && !tiedToSomething) {
      settings[app] = { mode: LIMITED, opens: 2, minutes: minutesFor(app, pct) };
      why[app] = `${pct}% of your screen time. two short goes a day.`;
      return;
    }

    if (share >= MID_SHARE || isPostingApp) {
      /* Posting needs a sitting long enough to actually post — a 10 minute
         cap on the app you publish to is just a way to fail. Creators who
         post constantly get a fourth go at it. */
      const opens = creator === 'yes' && isPostingApp ? 4 : 3;
      const mins = isPostingApp ? Math.max(20, minutesFor(app, pct)) : minutesFor(app, pct);
      settings[app] = { mode: LIMITED, opens, minutes: mins };
      why[app] = isPostingApp
        ? `you post here, so this is work. ${opens} goes of ${mins} min — long enough to film, edit and put it up.`
        : tiedToSomething
          ? `you said you want to grow this, so you keep three goes a day.`
          : `${pct}% of your day. three goes, then it's done.`;
      return;
    }

    /* the small stuff isn't worth a limit — it still counts toward the day */
    settings[app] = { mode: FREE, opens: 3, minutes: 15 };
    why[app] = `barely a blip. it counts toward your day, nothing more.`;
  });

  /* anything the calendar says they're busy with gets a mention, so the
     explanation reads like he looked */
  const busy = calendar.find((c) => c.kind === 'test' || c.kind === 'practice');

  /* ---- tighten until the plan check passes ---- */
  const limitedOrder = ordered.filter((a) => settings[a]?.mode === LIMITED);
  let guard = 0;

  const check = () =>
    planCheck({
      appSettings: settings,
      tracked,
      typicalFor: typical,
      goalMins,
    });

  while (check().over && guard < 80) {
    guard += 1;
    /* shave the biggest allowance first — minutes, then an open, then the
       app goes blocked, which is the end of the road */
    const worst = [...limitedOrder].sort(
      (a, b) =>
        settings[b].opens * settings[b].minutes - settings[a].opens * settings[a].minutes,
    )[0];

    /* nothing left to tighten: the biggest Free app becomes Limited */
    if (!worst) {
      const freeApp = ordered.find((a) => settings[a]?.mode === FREE);
      if (!freeApp) break;
      settings[freeApp] = { mode: LIMITED, opens: 2, minutes: 15 };
      why[freeApp] = `your limits didn't fit your goal without this one.`;
      limitedOrder.push(freeApp);
      continue;
    }

    const s = settings[worst];
    if (s.minutes - MINUTE_STEP >= MIN_MINUTES) {
      settings[worst] = { ...s, minutes: s.minutes - MINUTE_STEP };
    } else if (s.opens > 1) {
      settings[worst] = { ...s, opens: s.opens - 1 };
    } else if (s.opens > 0.5) {
      settings[worst] = { ...s, opens: 0.5 };
    } else {
      settings[worst] = { ...s, mode: BLOCKED };
      why[worst] = `there was no version of this that fit your goal. blocked.`;
      limitedOrder.splice(limitedOrder.indexOf(worst), 1);
    }
  }

  /* the opening line, and one closing thought that isn't about an app */
  const lead = [];
  const biggest = ordered.find((a) => !DEFAULT_ALWAYS.includes(a));
  if (biggest) lead.push(`${biggest} is where most of it goes, so that's where i started.`);
  if (hobbies[0]) lead.push(`when you want to scroll, i'll point you at ${hobbies[0]}.`);
  if (goals[0]) lead.push(`you said ${goals[0]}. this is the part you control.`);
  if (posts) {
    lead.push(
      creator === 'yes'
        ? `you post all the time, so i left the apps you publish to longer. that's work, not scrolling.`
        : `you post sometimes, so you get a proper sitting on those — just not an unlimited one.`,
    );
  }
  if (busy) lead.push(`${busy.why}`);
  if (checkins.length >= 3) {
    const top = checkins[checkins.length - 1];
    lead.push(`you mostly open these for ${top.reason === 'custom' ? top.why : top.reason}.`);
  }

  return { settings, why, lead, check: check() };
}

/* ---------- what he says instead of "fine, go ahead" ----------
   The whole point of the onboarding questions is that Rilo KNOWS things:
   the hobby you said you never get to, the goal you said you're working
   toward, what's actually on your plan for today. So when someone opens a
   limited app, he spends that knowledge instead of just counting an open
   down. He names the specific thing, not "do something else".

   "need to post" is the one reason he doesn't argue with — that's work, and
   arguing with it is how an app loses someone's trust. He still asks WHAT
   they're posting, because "posting" is also the easiest lie to tell
   yourself.

   Ordered best-first: something on today's plan beats a hobby, because a
   plan has a time attached and is harder to wave away. */
export function pushBack({ reason, app, hobbies = [], goals = [], schedule = [], nowMins = 0 }) {
  if (reason === 'post') return null;

  const options = [];

  /* 1. something they actually scheduled, soonest still to come */
  const toMins = (at) => {
    const [h, m] = String(at || '').split(':').map((n) => parseInt(n, 10));
    return Number.isFinite(h) ? h * 60 + (m || 0) : null;
  };
  const upcoming = schedule
    .map((r) => ({ ...r, mins: toMins(r.at) }))
    .filter((r) => r.mins !== null && r.title && !/bedtime|dinner|free time|chill/i.test(r.title))
    .sort((a, b) => a.mins - b.mins)
    .find((r) => r.mins >= nowMins - 30);

  if (upcoming) {
    options.push({
      id: 'plan',
      label: upcoming.title,
      sub: upcoming.at ? `it's on your plan for ${upcoming.at}` : "it's on your plan",
    });
  }

  /* 2. the hobby they said they never get round to */
  const hobby = hobbies.find((h) => !upcoming || !upcoming.title.includes(h));
  if (hobby) {
    options.push({ id: 'hobby', label: hobby, sub: 'the thing you said you wanted time for' });
  }

  /* 3. the goal, as a reason rather than a task */
  const goal = goals[0];
  if (goal && options.length < 3) {
    options.push({ id: 'goal', label: `ten minutes on ${goal}`, sub: "you said that's the plan" });
  }

  /* he always offers simply stopping — "do a hobby" is not the only
     alternative to scrolling, and pretending it is gets tiresome */
  options.push({ id: 'break', label: 'just put it down', sub: 'no task, no points. still counts.' });

  const lead =
    reason === 'bored'
      ? upcoming
        ? `bored? ${upcoming.title} is on your plan.`
        : hobby
          ? `bored? you said you never get time for ${hobby}.`
          : 'bored is the one i can actually help with.'
      : reason === 'messages'
        ? `messages, sure. that\'s thirty seconds, not ${app}.`
        : reason === 'something'
          ? 'one thing, then out. you know how that usually goes.'
          : upcoming
            ? `before you do — ${upcoming.title} is on your plan.`
            : 'before you do.';

  return { lead, options };
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

/* The few things Rilo asks before he builds anything. Tap answers, not
   typing — it should take fifteen seconds. */
export const SCHEDULE_QUESTIONS = [
  {
    id: 'free',
    ask: 'when are you free from?',
    options: [
      { id: '15:00', label: 'after school' },
      { id: '16:30', label: 'after practice' },
      { id: '18:00', label: 'after dinner' },
      { id: '09:00', label: 'all day' },
    ],
  },
  {
    id: 'needs',
    ask: 'what has to happen today?',
    multi: true,
    options: [
      { id: 'homework', label: 'homework' },
      { id: 'study', label: 'studying' },
      { id: 'practice', label: 'practice' },
      { id: 'work', label: 'a shift' },
      { id: 'hobby', label: 'my thing' },
    ],
  },
  {
    id: 'bed',
    ask: "when's bed?",
    options: [
      { id: '21:30', label: '9:30' },
      { id: '22:30', label: '10:30' },
      { id: '23:30', label: '11:30' },
      { id: '00:30', label: 'late' },
    ],
  },
];

export function riloSchedule({
  hobbies = [],
  goals = [],
  school,
  bedtime,
  scrollMins = 60,
  answers = null,
}) {
  const rows = [];
  const add = (at, title, note) => rows.push({ at, title, note });

  /* what they just told him wins; otherwise their settings do */
  const from = answers?.free || (school?.on ? school.to : '15:00');
  const [eh, em] = String(from).split(':').map(Number);
  let t = eh * 60 + (em || 0);
  const needs = answers?.needs ?? null;
  const wants = (k) => (needs ? needs.includes(k) : true);

  const free1 = Math.max(10, Math.round(scrollMins * 0.25));
  const free2 = Math.max(10, Math.round(scrollMins * 0.5));

  add(clock(t), school?.on ? 'out of school' : 'chill + snack', `${free1} min free scroll`);
  t += 30;

  const studyGoal = goals.find((g) => /grade|school|college|read|code|learn/.test(g));
  if (wants('homework') || wants('study')) {
    add(clock(t), studyGoal ? `work on ${studyGoal}` : 'homework', 'apps locked for 45 min');
    t += 75;
  }

  if (needs?.includes('practice')) {
    add(clock(t), 'practice', 'phone stays in the bag');
    t += 90;
  }

  if (needs?.includes('work')) {
    add(clock(t), 'work shift', 'phone away');
    t += 180;
  }

  if (hobbies[0] && wants('hobby')) {
    add(clock(t), hobbies[0], 'the thing you said you wanted time for');
    t += 60;
  }

  const fitGoal = goals.find((g) => /fit|team|gym|strong/.test(g));
  if (fitGoal && hobbies[1] && wants('hobby')) {
    add(clock(t), hobbies[1], `counts toward ${fitGoal}`);
    t += 45;
  }

  add(clock(t), 'dinner', 'phone away');
  t += 60;

  add(clock(t), 'free time', `${free2} min scroll allowed`);
  t += 60;

  const [bh, bm] = String(answers?.bed || bedtime?.from || '22:30').split(':').map(Number);
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

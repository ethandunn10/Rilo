/* localStorage persistence.
   Keeps the name, picked hobbies, picked apps, screen-time numbers, plan,
   XP, chosen Rilo, the per-app "nth time today" counts and the You-screen
   stats, so a refresh doesn't reset everything. */

const KEY = 'rilo.state.v1';

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export const DEFAULT_STATE = {
  /* optional, asked for on About you */
  name: '',
  /* defaults copied from the design files */
  about: {
    on: {
      basketball: true,
      golf: true,
      'making videos': true,
      'better grades': true,
      'grow my content': true,
    },
    extra: { hobby: [], goal: [] },
    /* Do they post? '' = not asked, then 'yes' | 'sometimes' | 'no'.
       It changes real things: a creator's instagram or tiktok IS their
       work, so Rilo keeps more opens on it instead of treating it as pure
       scrolling, and the check-in offers "need to post" in their words. */
    creator: '',
  },
  apps: {
    /* nothing pre-checked — they pick what Rilo blocks */
    on: {},
    extra: [],
  },
  /* now = what they're on today, goal = the daily goal, in hours.
     The goal is the scoreboard (lib/plan §8) — it never locks anything. */
  time: { now: 4, goal: 2 },

  /* ---------- the limits (lib/limits) ----------
     One entry per tracked app: { mode, opens, minutes }. Anything missing
     falls back to Limited on the default numbers, except the four that ship
     always allowed (phone, messages, maps, camera). This is the ONLY thing
     that blocks an app. */
  appSettings: {},
  /* how the limits were made: 'rilo' | 'own' */
  limitMode: 'rilo',

  /* which price they had selected on the paywall */
  plan: 'year',
  /* which button they actually tapped: null until they choose */
  planChoice: null,
  /* the trial button makes them Pro in the prototype */
  isPro: false,
  xp: 320,
  /* high-water level — XP can drop, a level never does */
  level: 2,
  chosenRilo: 'original',
  /* app theme (lib/themes) — grass is free, the rest are Rilo Pro */
  theme: 'grass',
  /* real "4th time today" counts, per app, reset each day */
  opens: { date: today(), counts: {} },
  stats: { savedMinutes: 0, saidNo: 0 },

  /* ---------- screen time baseline + the week counter ---------- */

  /* null = not asked yet, true = allowed, false = carried on without it */
  screenTime: null,
  /* whether they ever tapped "try again" on the deny screen */
  triedAgain: false,
  /* the generated baseline: where their time goes today */
  breakdown: null,

  /* which week they're on, and how it's going */
  program: {
    week: 1,
    /* days finished in the current week, and how many went over */
    daysDone: 0,
    daysOver: 0,
    done: false,
  },

  /* everything that resets at midnight */
  day: {
    date: today(),
    /* minutes spent in each non-always-allowed app today */
    used: {},
    /* opens spent per app, in halves — 0.5, 1, 1.5 ... */
    opensUsed: {},
    /* the one emergency pass: 0 or 1 */
    passes: 0,
    /* the half open borrowed off tomorrow today, if they did: { app } */
    borrowed: null,
    /* the last session that ended, so reopening inside two minutes carries
       it on instead of costing a second open:
       { app, endedAt, mins, charged } */
    lastSession: null,
    /* minutes since they last had a limited/free app open, for "chilling" */
    sinceBlocked: 999,
    /* when one was last open (ms) */
    lastBlockedAt: null,
  },

  /* tomorrow's IOU: the app half an open comes off, and the day it's due */
  borrow: { date: '', app: '' },

  /* loosening changes waiting out their 24 hours in strict mode (lib/limits) */
  pending: [],

  /* the weekly step-down: one tightening a week on the biggest app */
  step: {
    /* the week number the current offer belongs to */
    week: 0,
    /* which app it's aimed at — they can swap it */
    app: '',
    /* 'idle' | 'offered' | 'accepted' | 'skipped' */
    status: 'idle',
    /* true once the plan fits and they're living inside it */
    done: false,
    /* skipping in strict mode counts as loosening: 24h before it lands */
    skipAt: null,
  },

  /* a focus block: apps locked until a time today */
  focus: { on: false, until: '' },

  /* one entry per finished day: { date, used, goal, hit } */
  history: [],
  streak: 0,
  /* days they needed the pass or a borrow — the "not following through"
     signal Rilo uses to recommend strict mode */
  leanDays: 0,

  /* ---------- add-ons (rilo-addons-test) ---------- */
  /* why they opened a blocked app, and for how long — kept for stats */
  checkins: [],
  /* rilo goes to sleep, apps lock */
  bedtime: { on: false, from: '22:30', to: '07:00' },
  /* locked on a schedule, not location */
  school: { on: false, days: ['mon', 'tue', 'wed', 'thu', 'fri'], from: '08:15', to: '15:00' },
  /* buddies: invite codes only, no profiles, no search */
  buddies: { code: '', friends: [] },
  /* today's schedule on the plan tab: rilo's, or theirs */
  schedule: { mode: 'rilo', rows: [] },
  /* their calendar, read only — DEMO ONLY, nothing is connected.
     `sources` is the other apps rilo can read for the same reason: notes,
     reminders, tasks. Same deal — read only, never written to. */
  calendar: { on: false, which: '', sources: [] },
  /* The nightly check-in (rilo pro). `at` is the time they picked on the
     way in — he nudges from then on, but the button is always there so
     they can check in whenever they want. */
  night: { date: '', said: null, tasks: [], at: '21:00' },
  /* demo panel: a fake clock, null means use the real one */
  demoClock: null,
  /* ---------- strict mode: the bundle (§12) ----------
     On: no halves, loosening takes 24h, the step-down happens by itself, no
     borrowing, a 15-second wait. Turning it ON is instant; turning it OFF
     takes 24 hours, which is `endingAt`. */
  strict: {
    on: false,
    /* 1 | 3 | 7 days */
    days: 7,
    /* 'all' | 'school' | 'night' */
    when: 'all',
    /* set when they ask to turn it off: it runs for another 24h */
    endingAt: null,
    /* days they've asked and been told no */
    declined: 0,
    suggestedOn: '',
  },
};

/* A clean day. Opens and the emergency pass reset at midnight and unused
   opens never carry over (§2.7) — the only thing that crosses midnight is
   the borrow IOU, which lives outside `day`. */
export function freshDay(date = today()) {
  return {
    date,
    used: {},
    opensUsed: {},
    passes: 0,
    borrowed: null,
    lastSession: null,
    sinceBlocked: 999,
    lastBlockedAt: null,
  };
}

/* tomorrow, as a YYYY-MM-DD key */
export function tomorrow(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/* One-time reset (Oct 29).
   Demo testing left browsers wearing a high-level skin (samurai). The main
   Rilo should be the original again, so the first load after this change
   puts it back — once. Everything else (name, picks, xp, level) is kept,
   and whatever they choose on Pick your Rilo afterwards sticks as normal. */
const RESET_KEY = 'rilo.riloReset.v1';

function resolveRilo(savedSkin) {
  const skin = typeof savedSkin === 'string' ? savedSkin : 'original';
  try {
    if (localStorage.getItem(RESET_KEY)) return skin;
    localStorage.setItem(RESET_KEY, '1');
    return 'original';
  } catch {
    /* storage off — nothing saved to reset anyway */
    return skin;
  }
}

/* Merge rather than trust, so an older or hand-edited payload can't leave
   the app with a missing field. */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const saved = JSON.parse(raw);

    const opens = saved.opens ?? {};
    const freshDay = opens.date !== today();

    /* The app always opens on Welcome, so every visit re-runs onboarding.
       That means the onboarding answers must always go back to the
       defaults — otherwise the next tester walks through it carrying the
       last one's apps, goal and name. Only the demo's own counters stay. */
    return {
      ...DEFAULT_STATE,
      xp: typeof saved.xp === 'number' ? saved.xp : DEFAULT_STATE.xp,
      level: typeof saved.level === 'number' ? saved.level : DEFAULT_STATE.level,
      opens: freshDay ? DEFAULT_STATE.opens : { date: opens.date, counts: opens.counts ?? {} },
    };

  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / storage off — the app still works, just won't persist */
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY);
    /* starting over forgets a mic refusal too, or voice stays dead */
    localStorage.removeItem('rilo.micBlocked');
  } catch {
    /* nothing to do */
  }
}

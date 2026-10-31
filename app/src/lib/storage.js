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
  },
  apps: {
    /* nothing pre-checked — they pick what Rilo blocks */
    on: {},
    extra: [],
  },
  time: { now: 4, goal: 2 },
  /* how hard the plan pushes: easy | steady | straight (lib/plan) */
  pace: 'steady',
  /* how long one sitting on a blocked app lasts; opens follow from it */
  sessionMins: 15,
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
  /* how many times they took "5 more minutes" today — the 2nd+ makes Rilo angry */
  extras: { date: today(), count: 0 },
  stats: { savedMinutes: 0, saidNo: 0 },

  /* ---------- screen time + the 30-day plan (lib/plan) ---------- */

  /* null = not asked yet, true = allowed, false = carried on without it */
  screenTime: null,
  /* whether they ever tapped "try again" on the deny screen */
  triedAgain: false,
  /* the generated baseline: where their time goes today */
  breakdown: null,

  /* which week of the plan they're on, and how it's going */
  program: {
    week: 1,
    /* days finished in the current week, and how many went over */
    daysDone: 0,
    daysOver: 0,
    /* weeks that had to be run again */
    repeats: 0,
    done: false,
  },

  /* everything that resets at midnight */
  day: {
    date: today(),
    /* minutes spent in each blocked app today */
    used: {},
    /* opens spent per app */
    opens: {},
    /* emergency passes used today, and what for */
    passes: 0,
    /* "5 more minutes" is once a day, across every app */
    fiveMore: 0,
    /* minutes since they last had a blocked app open, for "taking a break" */
    sinceBlocked: 999,
    /* when a blocked app was last open (ms), for "taking a break" */
    lastBlockedAt: null,
  },

  /* one entry per finished day: { date, used, goal, hit } */
  history: [],
  streak: 0,
  /* days this week where they used "5 more" twice */
  fiveMoreDays: 0,

  /* strict mode */
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

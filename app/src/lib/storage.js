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
    on: { tiktok: true, instagram: true, youtube: true },
    extra: [],
  },
  time: { now: 4, goal: 2 },
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

    return {
      name: typeof saved.name === 'string' ? saved.name : '',
      about: {
        on: { ...DEFAULT_STATE.about.on, ...(saved.about?.on ?? {}) },
        extra: {
          hobby: saved.about?.extra?.hobby ?? [],
          goal: saved.about?.extra?.goal ?? [],
        },
      },
      apps: {
        on: { ...DEFAULT_STATE.apps.on, ...(saved.apps?.on ?? {}) },
        extra: saved.apps?.extra ?? [],
      },
      time: {
        now: typeof saved.time?.now === 'number' ? saved.time.now : DEFAULT_STATE.time.now,
        goal: typeof saved.time?.goal === 'number' ? saved.time.goal : DEFAULT_STATE.time.goal,
      },
      plan: saved.plan === 'month' ? 'month' : 'year',
      planChoice:
        saved.planChoice === 'trial' || saved.planChoice === 'free' ? saved.planChoice : null,
      isPro: saved.isPro === true,
      xp: typeof saved.xp === 'number' ? Math.max(0, saved.xp) : DEFAULT_STATE.xp,
      level: typeof saved.level === 'number' ? saved.level : DEFAULT_STATE.level,
      chosenRilo: resolveRilo(saved.chosenRilo),
      theme: typeof saved.theme === 'string' ? saved.theme : DEFAULT_STATE.theme,
      /* a new day starts the per-app counts over */
      opens: freshDay
        ? { date: today(), counts: {} }
        : { date: opens.date, counts: opens.counts ?? {} },
      extras:
        saved.extras?.date === today()
          ? { date: saved.extras.date, count: saved.extras.count ?? 0 }
          : { date: today(), count: 0 },
      stats: {
        savedMinutes:
          typeof saved.stats?.savedMinutes === 'number' ? saved.stats.savedMinutes : 0,
        saidNo: typeof saved.stats?.saidNo === 'number' ? saved.stats.saidNo : 0,
      },
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
  } catch {
    /* nothing to do */
  }
}

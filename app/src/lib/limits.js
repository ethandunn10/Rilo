/* The whole screen-time system: four settings per app, opens in halves,
   the emergency pass, borrowing, the plan check and the weekly step-down.

   This file replaced the old percentage-based minute budget. There is no
   "minutes left" for an app any more and no separate half-unlock: an app is
   gated by its OPENS, and a session's length is capped by how much of an
   open is left. The daily goal never locks anything (see §8) — it only
   drives mood, xp, streaks, "time you got back" and the step-down.

   Opens are counted in halves, so every number in here moves in 0.5 steps. */

/* ---------- 1. the four settings ---------- */

export const ALWAYS = 'always';
export const BLOCKED = 'blocked';
export const LIMITED = 'limited';
export const FREE = 'free';

export const MODES = [ALWAYS, BLOCKED, LIMITED, FREE];

export const MODE_LABEL = {
  [ALWAYS]: 'always allowed',
  [BLOCKED]: 'blocked',
  [LIMITED]: 'limited',
  [FREE]: 'free',
};

export const MODE_SUB = {
  [ALWAYS]: 'never locked, never costs an open',
  [BLOCKED]: 'no opens. emergency pass only',
  [LIMITED]: 'x opens a day, y minutes each',
  [FREE]: 'no limit, but it counts toward your day',
};

/* The apps you need to reach people, or that aren't the problem. These are
   always allowed out of the box and the user can add more (school apps). */
export const DEFAULT_ALWAYS = ['phone', 'messages', 'maps', 'camera'];

/* what a brand new Limited app starts at */
export const DEFAULT_OPENS = 3;
export const DEFAULT_MINUTES = 15;

/* how far either number can be pushed */
export const MIN_OPENS = 0.5;
export const MAX_OPENS = 12;
export const MIN_MINUTES = 5;
export const MAX_MINUTES = 60;

export const OPEN_STEP = 0.5;
export const MINUTE_STEP = 5;

/* ---------- 2. the numbers that don't change ---------- */

/* one emergency pass a day, five minutes. no earning extra ones. */
export const PASSES_PER_DAY = 1;
export const PASS_MINUTES = 5;

/* borrowing takes half an open off tomorrow, once a day, normal mode only */
export const BORROW_OPENS = 0.5;

/* reopening this soon carries on the same session instead of starting a new
   one, so flicking out of an app and back doesn't cost a second open */
export const CONTINUE_MS = 2 * 60 * 1000;

/* the pause before a Limited app opens. strict mode makes you wait longer. */
export const WAIT_NORMAL = 5;
export const WAIT_STRICT = 15;

/* how long a loosening change sits pending in strict mode */
export const PENDING_MS = 24 * 60 * 60 * 1000;

/* ---------- 3. reading an app's setting ---------- */

export const defaultSetting = (mode = LIMITED) => ({
  mode,
  opens: DEFAULT_OPENS,
  minutes: DEFAULT_MINUTES,
});

/* An app with no setting yet is Limited on the default numbers — except the
   four that ship always-allowed. */
export function settingFor(appSettings, app) {
  const saved = appSettings?.[app];
  if (saved) {
    return {
      mode: MODES.includes(saved.mode) ? saved.mode : LIMITED,
      opens: clampOpens(saved.opens ?? DEFAULT_OPENS),
      minutes: clampMinutes(saved.minutes ?? DEFAULT_MINUTES),
    };
  }
  return defaultSetting(DEFAULT_ALWAYS.includes(app) ? ALWAYS : LIMITED);
}

export function clampOpens(n) {
  const v = Math.round((Number(n) || 0) * 2) / 2;
  return Math.min(MAX_OPENS, Math.max(MIN_OPENS, v));
}

export function clampMinutes(n) {
  const v = Math.round((Number(n) || 0) / MINUTE_STEP) * MINUTE_STEP;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, v));
}

export const isAlways = (appSettings, app) => settingFor(appSettings, app).mode === ALWAYS;
export const isLimited = (appSettings, app) => settingFor(appSettings, app).mode === LIMITED;
export const isBlocked = (appSettings, app) => settingFor(appSettings, app).mode === BLOCKED;

/* Always-allowed apps don't count toward the daily total (§8), so the goal
   is about the apps that are actually the problem. */
export const countsTowardDay = (appSettings, app) => !isAlways(appSettings, app);

export function appsInMode(appSettings, tracked, mode) {
  return tracked.filter((a) => settingFor(appSettings, a).mode === mode);
}

/* ---------- 4. opens, in halves ---------- */

/* half the per-open time: leave by here and it only costs half an open */
export const halfOf = (minutes) => minutes / 2;

/* Half opens are written as ½ — "2½ opens left" reads better than "2.5". */
export function fmtOpens(n) {
  const v = Math.max(0, Math.round(n * 2) / 2);
  const whole = Math.floor(v);
  const half = v - whole >= 0.5;
  if (!half) return String(whole);
  return whole ? `${whole}½` : '½';
}

/* Opens today, after anything borrowed against this app.
   `borrow` is the IOU written yesterday: { date, app } — the day it comes
   due and the app it comes out of. */
export function opensTotalFor({ setting, app, day, borrow, dateKey }) {
  if (setting.mode !== LIMITED) return 0;
  let total = setting.opens;
  /* borrowed half lands on today */
  if (day?.borrowed?.app === app) total += BORROW_OPENS;
  /* and comes off the day it's due */
  if (borrow?.app === app && borrow?.date === dateKey) total -= BORROW_OPENS;
  return Math.max(0, Math.round(total * 2) / 2);
}

export const opensUsedFor = (app, day) => Math.max(0, day?.opensUsed?.[app] ?? 0);

export function opensAvailFor({ setting, app, day, borrow, dateKey }) {
  const total = opensTotalFor({ setting, app, day, borrow, dateKey });
  return Math.max(0, Math.round((total - opensUsedFor(app, day)) * 2) / 2);
}

/* The circles under an app's name: one per whole open, full / half / empty.
   A borrowed or step-down'd allowance can be a half, so the last circle is
   allowed to be a half on its own. */
export function circlesFor(total, used) {
  const left = Math.max(0, total - used);
  const out = [];
  for (let i = 0; i < Math.ceil(total); i += 1) {
    const remaining = left - i;
    if (remaining >= 1) out.push('full');
    else if (remaining >= 0.5) out.push('half');
    else out.push('empty');
  }
  return out;
}

/* "2½ opens left · 15 min each" */
export function opensText(left, minutes) {
  if (left <= 0) return `no opens left · ${minutes} min each`;
  /* half an open on its own wants an article, not a plural */
  if (left === 0.5) return `½ an open left · ${minutes} min each`;
  const n = fmtOpens(left);
  const word = left === 1 ? 'open' : 'opens';
  return `${n} ${word} left · ${minutes} min each`;
}

/* How long a session may run.
   `avail` is the opens left BEFORE this session is charged — for a session
   that's carrying on from a recent one, add back what it already cost.

   In strict mode halves are off, so a session needs a whole open and always
   gets the full length. In normal mode half an open buys half the time. */
export function sessionCapMins({ avail, minutes, strictOn }) {
  if (strictOn) return avail >= 1 ? minutes : 0;
  if (avail >= 1) return minutes;
  if (avail >= 0.5) return halfOf(minutes);
  return 0;
}

/* What a finished session of `mins` costs.
   Any session costs at least half an open, even a ten-second peek, and no
   single session can ever cost more than one. */
export function opensSpent({ mins, minutes, strictOn }) {
  if (strictOn) return 1;
  return mins <= halfOf(minutes) ? 0.5 : 1;
}

/* Does this app have room for a session right now? */
export function canOpen({ setting, app, day, borrow, dateKey, strictOn }) {
  if (setting.mode === ALWAYS || setting.mode === FREE) return true;
  if (setting.mode === BLOCKED) return false;
  const avail = opensAvailFor({ setting, app, day, borrow, dateKey });
  return sessionCapMins({ avail, minutes: setting.minutes, strictOn }) > 0;
}

/* ---------- 5. is this app locked, and why ----------
   Per-app limits are the only thing that blocks an app. Bedtime, school
   mode and focus blocks lock Blocked + Limited apps but never an
   always-allowed one, and the emergency pass works through all of it. */
export function lockFor({
  app,
  appSettings,
  day,
  borrow,
  dateKey,
  strictOn,
  schedule = { locked: false, kind: null, until: null },
}) {
  const setting = settingFor(appSettings, app);

  if (setting.mode === ALWAYS) {
    return { locked: false, kind: null, setting, passable: false };
  }

  /* a window beats an open — you can't spend one during bedtime */
  if (schedule.locked) {
    return {
      locked: true,
      kind: schedule.kind, /* 'bedtime' | 'school' | 'focus' */
      until: schedule.until,
      setting,
      passable: true,
    };
  }

  if (setting.mode === FREE) {
    return { locked: false, kind: null, setting, passable: false };
  }

  if (setting.mode === BLOCKED) {
    return { locked: true, kind: 'blocked', setting, passable: true };
  }

  const total = opensTotalFor({ setting, app, day, borrow, dateKey });
  const used = opensUsedFor(app, day);
  const left = Math.max(0, total - used);
  const cap = sessionCapMins({ avail: left, minutes: setting.minutes, strictOn });

  return {
    locked: cap <= 0,
    /* in strict mode a leftover half open can't be spent, so say so */
    kind: cap <= 0 ? (left > 0 ? 'halfstranded' : 'noopens') : null,
    setting,
    total,
    used,
    left,
    cap,
    passable: true,
  };
}

/* ---------- 6. borrowing from tomorrow ----------
   Only when a Limited app is out of opens AND today's pass is gone. Once a
   day across every app, and never in strict mode. */
export function canBorrow({ setting, app, day, borrow, dateKey, strictOn, passesLeft }) {
  if (strictOn) return false;
  if (setting.mode !== LIMITED) return false;
  if (passesLeft > 0) return false;
  /* once a day across every app (§6) */
  if (day?.borrowed) return false;
  return opensAvailFor({ setting, app, day, borrow, dateKey }) <= 0;
}

/* ---------- 7. the plan check ----------
   What the limits ALLOW in a day: every Limited app at full tilt, plus what
   they normally spend on the Free ones. If that's over the goal, the plan
   can't work however good their intentions are. */
export function planCheck({ appSettings, tracked, typicalFor, goalMins }) {
  const limited = appsInMode(appSettings, tracked, LIMITED).map((app) => {
    const s = settingFor(appSettings, app);
    return { app, mins: s.opens * s.minutes, opens: s.opens, minutes: s.minutes };
  });

  const free = appsInMode(appSettings, tracked, FREE).map((app) => ({
    app,
    mins: Math.max(0, Math.round(typicalFor?.(app) ?? 0)),
  }));

  const allows = Math.round(
    limited.reduce((n, a) => n + a.mins, 0) + free.reduce((n, a) => n + a.mins, 0),
  );

  const biggestLimited = [...limited].sort((a, b) => b.mins - a.mins)[0] ?? null;
  const biggestFree = [...free].sort((a, b) => b.mins - a.mins)[0] ?? null;

  return {
    allows,
    goal: goalMins,
    over: allows > goalMins,
    by: Math.max(0, allows - goalMins),
    limited,
    free,
    biggestLimited,
    biggestFree,
  };
}

/* Rilo's line about it, e.g. "your limits allow 4h 20m a day, but your goal
   is 3h. tighten tiktok, or limit youtube too." */
export function planCheckLine(check, fmt) {
  if (!check.over) {
    return `your limits allow ${fmt(check.allows)} a day. that fits under your ${fmt(
      check.goal,
    )} goal.`;
  }

  const fixes = [];
  if (check.biggestLimited) fixes.push(`tighten ${check.biggestLimited.app}`);
  if (check.biggestFree) fixes.push(`limit ${check.biggestFree.app} too`);

  const how = fixes.length ? ` ${fixes.join(', or ')}.` : '';
  return `your limits allow ${fmt(check.allows)} a day, but your goal is ${fmt(
    check.goal,
  )}.${how}`;
}

/* ---------- 8. the weekly step-down ----------
   One thing a week, on the app eating the biggest share. Minutes come off
   first because losing 3 minutes a sitting is easier to live with than
   losing a whole sitting; once minutes are at the floor, an open goes. */

export const STEP_MINUTES = 3;

export function stepDownTargetFor({ appSettings, tracked, shareFor }) {
  const open = tracked.filter((a) => {
    const m = settingFor(appSettings, a).mode;
    return m === LIMITED || m === FREE;
  });
  if (!open.length) return null;
  return [...open].sort((a, b) => (shareFor?.(b) ?? 0) - (shareFor?.(a) ?? 0))[0];
}

/* What next week would do to this app. null when there's nothing left to
   take — an app already at one open of five minutes has given enough. */
export function stepDownFor(setting) {
  if (setting.mode === FREE) {
    /* a Free app has no opens to cut, so the tightening is limiting it */
    return {
      kind: 'limit',
      to: { mode: LIMITED, opens: DEFAULT_OPENS, minutes: DEFAULT_MINUTES },
      say: `goes limited · ${DEFAULT_OPENS} × ${DEFAULT_MINUTES} min`,
    };
  }

  if (setting.mode !== LIMITED) return null;

  const nextMins = setting.minutes - STEP_MINUTES;
  if (nextMins >= MIN_MINUTES) {
    return {
      kind: 'minutes',
      to: { ...setting, minutes: nextMins },
      say: `goes to ${nextMins} min per open`,
    };
  }

  const nextOpens = Math.round((setting.opens - 1) * 2) / 2;
  if (nextOpens >= MIN_OPENS) {
    return {
      kind: 'opens',
      to: { ...setting, opens: nextOpens },
      say: `goes to ${fmtOpens(nextOpens)} open${nextOpens === 1 ? '' : 's'} a day`,
    };
  }

  return null;
}

/* "next week: tiktok goes to 12 min per open." */
export function stepDownLine(app, step) {
  if (!step) return '';
  return `next week: ${app} ${step.say}.`;
}

/* Stepping down stops once the plan actually fits AND they're living inside
   it — most days of the week under goal. After that the plan just stays. */
export const GOOD_DAYS_NEEDED = 4;

export function stepDownDone({ check, history }) {
  if (check.over) return false;
  const week = history.slice(-7);
  if (week.length < 7) return false;
  return week.filter((d) => d.hit).length >= GOOD_DAYS_NEEDED;
}

/* ---------- 9. loosening vs. tightening ----------
   Making a limit stricter is instant in both modes. Loosening one is
   instant in normal mode and takes 24 hours in strict mode, so the version
   of you that set the limit gets a say. */

/* how much rope each setting gives, loosest last */
const ROPE = { [BLOCKED]: 0, [LIMITED]: 1, [FREE]: 2, [ALWAYS]: 3 };

export function isLoosening(prev, next) {
  if (!prev) return false;
  if (prev.mode !== next.mode) return ROPE[next.mode] > ROPE[prev.mode];
  if (next.mode !== LIMITED) return false;
  /* more opens or longer sittings — either way it's more time */
  if (next.opens > prev.opens) return true;
  if (next.minutes > prev.minutes) return true;
  return false;
}

/* The one-line version of a change, for the pending list and the log. */
export function describeChange(app, prev, next) {
  if (!prev || prev.mode !== next.mode) {
    if (next.mode === LIMITED) {
      return `${app} → limited · ${fmtOpens(next.opens)} × ${next.minutes} min`;
    }
    return `${app} → ${MODE_LABEL[next.mode]}`;
  }
  if (next.opens !== prev.opens) {
    return `${app} → ${fmtOpens(next.opens)} open${next.opens === 1 ? '' : 's'} a day`;
  }
  if (next.minutes !== prev.minutes) {
    return `${app} → ${next.minutes} min per open`;
  }
  return `${app} unchanged`;
}

/* ---------- 10. pending changes (strict mode) ---------- */

export function makePending({ app, prev, next, now = Date.now() }) {
  return {
    id: `${app}-${now}`,
    kind: 'setting',
    app,
    prev,
    next,
    at: now + PENDING_MS,
    label: describeChange(app, prev, next),
  };
}

/* "in 23h 41m" — the countdown on a pending change */
export function countdownText(at, now = Date.now()) {
  const left = Math.max(0, at - now);
  const mins = Math.ceil(left / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/* ---------- 11. percentages: insight only ----------
   An app's share of total screen time never sets a limit by itself. It
   picks the order Rilo suggests things in, and it's what he says out loud:
   "youtube is 40% of your screen time." */
export function insightLine(app, pct) {
  if (pct == null) return '';
  return `${app} is ${pct}% of your screen time`;
}

/* The numbers behind Rilo's job: where the time goes, the 30-day plan, the
   per-app limits for the current week, and the end-of-day XP.

   The web can't read real Screen Time, so the baseline is generated from
   what the tester told us in onboarding. Everything downstream — the plan,
   the limits, the shield — is derived from that one baseline. */

/* how the blocked time splits between apps, before normalising */
const SHARE_WEIGHT = { tiktok: 35, instagram: 25, youtube: 20, snapchat: 15 };
const SHARE_DEFAULT = 10;

/* how many times a day each app gets opened today, before any plan */
const OPEN_COUNT = { tiktok: 40, snapchat: 50, instagram: 35, youtube: 15 };
const OPEN_DEFAULT = 20;

/* Everything on the phone that Rilo isn't watching, as a weight — so
   blocking one app leaves most of the day out of his hands, and blocking
   five puts most of it in. Capped, because nobody's phone is only apps. */
const OTHER_WEIGHT = 30;
const MAX_BLOCKED_SHARE = 0.85;

function blockedShare(appList) {
  const sum = appList.reduce((n, a) => n + weight(a), 0);
  return Math.min(MAX_BLOCKED_SHARE, sum / (sum + OTHER_WEIGHT));
}

/* how long one sitting lasts. They pick; opens are worked out from it. */
/* sittings come in clean five-minute lengths */
export const SESSION_CHOICES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];
/* nobody wants to be told they get 33 goes at something */
export const MAX_OPENS = 15;
export const SESSION_MINUTES = 10;

/* the emergency pass: one a day on free, two on pro */
export const FREE_PASSES = 1;
export const PRO_PASSES = 2;
export const PASSES_PER_DAY = FREE_PASSES;
export const PASS_MINUTES = 5;

export function passesFor(isPro) {
  return isPro ? PRO_PASSES : FREE_PASSES;
}

/* free blocks two apps; pro blocks as many as they like */
export const FREE_MAX_APPS = 2;

export function watchedFor(appList, isPro) {
  return isPro ? appList : appList.slice(0, FREE_MAX_APPS);
}

/* how long off the blocked apps earns a break */
export const BREAK_EARNED_AFTER = 60;

/* apps Rilo will never block */
export const NEVER_BLOCK = ['messages', 'phone'];

/* how fast they want to get there. Straight to the goal is one week at
   the target; the others close the gap a step at a time. */
export const PACES = [
  { id: 'straight', weeks: 1, label: 'straight to the goal', note: 'your goal from day one' },
  { id: 'two', weeks: 2, label: '2 weeks', note: 'halfway, then all the way' },
  { id: 'steady', weeks: 4, label: '4 weeks', note: 'a step down every week' },
];

export const PLAN_WEEKS = 4;

const DEFAULT_PACE = PACES[2]; /* 4 weeks */

export function weeksFor(pace) {
  return (PACES.find((p) => p.id === pace) ?? DEFAULT_PACE).weeks;
}

export function paceLabel(pace) {
  return (PACES.find((p) => p.id === pace) ?? DEFAULT_PACE).label;
}

export const weight = (app) => SHARE_WEIGHT[app] ?? SHARE_DEFAULT;
export const baseOpens = (app) => OPEN_COUNT[app] ?? OPEN_DEFAULT;

export function hoursToMins(h) {
  return Math.round(h * 60);
}

export function fmtMins(mins) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r}m`;
  if (!r) return `${h}h`;
  return `${h}h ${r}m`;
}

/* ---------- where the time goes ----------
   `allowed` false means Screen Time was denied, so there's no "everything
   else" to show — the total is just spread evenly over their apps. */
export function buildBreakdown(appList, totalMins, allowed = true) {
  const apps = appList.length ? appList : ['tiktok'];

  if (!allowed) {
    const each = totalMins / apps.length;
    return {
      allowed: false,
      total: totalMins,
      blocked: totalMins,
      other: 0,
      /* no pct: without Screen Time we're guessing, so we don't pretend
         to know a percentage. The plan runs off their total and goal. */
      apps: apps.map((app) => ({
        app,
        mins: each,
        opens: baseOpens(app),
        share: 1 / apps.length,
        pct: null,
      })),
    };
  }

  const blocked = totalMins * blockedShare(apps);
  const sum = apps.reduce((n, a) => n + weight(a), 0);

  return {
    allowed: true,
    total: totalMins,
    blocked,
    other: totalMins - blocked,
    apps: apps.map((app) => {
      const share = weight(app) / sum;
      const mins = blocked * share;
      return {
        app,
        mins,
        opens: baseOpens(app),
        share,
        pct: Math.round((mins / totalMins) * 100),
      };
    }),
  };
}

/* ---------- the 30-day plan ----------
   Each week closes another quarter of the gap. 5h -> 2h gives
   4h15, 3h30, 2h45, 2h. */
export function weekGoals(startMins, targetMins, pace = 'steady') {
  const weeks = weeksFor(pace);
  if (weeks <= 1) return [targetMins];
  const gap = startMins - targetMins;
  return Array.from({ length: weeks }, (_, i) =>
    Math.round(startMins - (gap * (i + 1)) / weeks),
  );
}

/* All of the cut comes out of the blocked apps. */
export function blockedGoalFor(totalGoal, startMins, blockedBaseline) {
  return Math.round(blockedBaseline - (startMins - totalGoal));
}

/* Would the plan need them to block more than they actually use? */
export function planNeedsMoreApps(startMins, targetMins, blockedBaseline, pace = 'steady') {
  const goals = weekGoals(startMins, targetMins, pace);
  const last = goals[goals.length - 1];
  return blockedGoalFor(last, startMins, blockedBaseline) <= 0;
}

/* ---------- what Rilo offers once he knows the goal ----------
   The same budget, cut up different ways: lots of short looks, or a few
   proper sittings. They pick the trade-off; he does the arithmetic. */
export function sittingOptions(breakdown, startMins, totalGoal, current) {
  const blockedGoal = Math.max(
    5,
    blockedGoalFor(totalGoal, startMins, breakdown?.blocked ?? startMins),
  );

  const out = [];
  const seen = new Set();
  for (const mins of SESSION_CHOICES) {
    const opens = Math.floor(blockedGoal / mins);
    /* one go a day isn't a choice, and fifteen is already plenty */
    if (opens < 2 || opens > MAX_OPENS) continue;
    if (seen.has(opens)) continue;
    seen.add(opens);
    out.push({ mins, opens });
    if (out.length === 4) break;
  }

  /* a goal small enough that nothing fits still needs one row */
  if (!out.length) out.push({ mins: 5, opens: Math.max(1, Math.floor(blockedGoal / 5)) });

  /* keep whatever they already picked on the list, so it stays selected */
  if (current && !out.some((o) => o.mins === current)) {
    out.push({ mins: current, opens: Math.max(1, Math.floor(blockedGoal / current)) });
    out.sort((a, b) => a.mins - b.mins);
  }
  return out;
}

/* ---------- this week's limits, per app ---------- */
export function limitsFor(
  breakdown,
  startMins,
  totalGoal,
  strictOn = false,
  sessionMins = SESSION_MINUTES,
) {
  const blockedGoal = Math.max(0, blockedGoalFor(totalGoal, startMins, breakdown.blocked));
  const len = SESSION_CHOICES.includes(sessionMins) ? sessionMins : SESSION_MINUTES;

  return breakdown.apps.map((a) => {
    const minutes = Math.max(0, Math.round(blockedGoal * a.share));
    /* the minutes decide how many sittings fit, not the other way round */
    let opens = Math.floor(minutes / len);
    if (strictOn) opens = Math.floor(opens / 2);
    return { app: a.app, minutes, opens: Math.max(1, opens) };
  });
}

/* the two small nudges that still pay out on the spot */
export const NUDGE_HOBBY = 10;
export const NUDGE_TIRED = 5;

/* ---------- end of day ---------- */
export function dayXp({ used, goal, streak }) {
  const hit = used <= goal;
  let xp = 0;

  if (hit) {
    xp += Math.round(goal - used); /* a point a minute under */
    xp += 25;
    xp += Math.min(50, 5 * (streak + 1));
  } else {
    xp -= Math.min(50, Math.round(used - goal));
  }

  return { xp, hit, streak: hit ? streak + 1 : 0 };
}

export const WEEK_BONUS = 100;
export const PLAN_BONUS = 500;

/* ---------- when Rilo should push strict mode ---------- */
export function shouldSuggestStrict(history, fiveMoreDays) {
  const last5 = history.slice(-5);
  const overDays = last5.filter((d) => !d.hit).length;
  if (last5.length >= 3 && overDays >= 3) return true;
  /* "5 more" used twice in a day, on two days of the same week */
  return fiveMoreDays >= 2;
}

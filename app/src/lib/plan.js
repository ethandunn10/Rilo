/* Where the time goes, and the end-of-day XP.

   The web can't read real Screen Time, so the baseline is generated from
   what the tester told us in onboarding. Everything downstream reads off
   that one baseline.

   The LIMITS themselves are not in here any more — the four per-app
   settings, opens in halves, the pass, borrowing, the plan check and the
   weekly step-down all live in lib/limits.js. What's left here is the
   baseline (so percentages have something to be a percentage OF) and the
   daily XP, which is scored against the daily goal. */

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

/* free blocks two apps; pro blocks as many as they like */
export const FREE_MAX_APPS = 2;

export function watchedFor(appList, isPro) {
  return isPro ? appList : appList.slice(0, FREE_MAX_APPS);
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

/* ---------- the daily goal ----------
   The goal is a scoreboard, not a lock (§8). It's one number the user
   sets, it never steps itself down, and nothing in the app is blocked
   because of it. What tightens over time is the per-app limits, one thing
   a week — see the step-down in lib/limits.js.

   The only floor is a sane one: half an hour. The old floor existed
   because the goal used to be cut up into per-app minute budgets, and
   those couldn't go below the time Rilo didn't control. Nothing is cut up
   any more, so the goal is free to be whatever they want to aim at. */
export const GOAL_FLOOR_HOURS = 0.5;

/* the two small nudges that still pay out on the spot */
export const NUDGE_HOBBY = 10;
export const NUDGE_TIRED = 5;

/* ---------- end of day ----------
   XP comes from being under the daily goal (§8). A day over the goal
   simply scores nothing — it doesn't take XP away. Losing the streak is
   the cost of going over; being docked on top of it just made people feel
   like the app was punishing them for a bad Tuesday. */
export function dayXp({ used, goal, streak }) {
  const hit = used <= goal;
  if (!hit) return { xp: 0, hit: false, streak: 0 };

  const under = Math.round(goal - used); /* a point a minute under */
  const xp = under + 25 + Math.min(50, 5 * (streak + 1));

  return { xp, hit: true, streak: streak + 1 };
}

export const WEEK_BONUS = 100;
export const PLAN_BONUS = 500;

/* ---------- when Rilo should push strict mode ----------
   Two days over the daily goal in a row and he offers it. That's early on
   purpose: a bad Tuesday is a bad Tuesday, but two in a row is the start of
   the pattern strict mode exists to break, and a suggestion they can say no
   to costs them nothing.

   The second signal is leaning on the ways out — days they needed the
   emergency pass or borrowed half an open off tomorrow. Three of those and
   the limits clearly aren't holding either. */
export const OVER_DAYS_FOR_STRICT = 2;

export function shouldSuggestStrict(history, leanDays = 0) {
  const recent = history.slice(-OVER_DAYS_FOR_STRICT);
  const twoInARow =
    recent.length === OVER_DAYS_FOR_STRICT && recent.every((d) => !d.hit);
  if (twoInARow) return true;
  return leanDays >= 3;
}

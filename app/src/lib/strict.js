/* Strict mode.

   Strict is the "you asked for this" setting: no 5-more-minutes, and once
   you're past your daily goal the watched apps lock until midnight. You get
   three need-its a day as the escape hatch, and double XP for finishing.

   It stays on until the tester turns it off — there is no timer. */

export const NEED_IT_MAX = 3;

/* how many "5 more minutes" in one day before Rilo offers strict */
export const FIVE_MORE_TRIGGER = 3;

/* how many days over the goal in a row before Rilo offers strict */
export const OVER_GOAL_TRIGGER = 2;

/* after this many "not yet"s, stop asking for a week */
export const NOT_YET_LIMIT = 3;
export const SNOOZE_DAYS = 7;

export function dayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dayStr(d);
}

/* minutes used today, reset each day */
export function usedToday(used) {
  return used.date === dayStr() ? used.minutes : 0;
}

/* are they past the daily goal? goal is in hours */
export function overGoal(used, goalHours) {
  return usedToday(used) >= goalHours * 60;
}

export function needItsLeft(needIt) {
  const used = needIt.date === dayStr() ? needIt.count : 0;
  return Math.max(0, NEED_IT_MAX - used);
}

/* Should Rilo offer strict mode right now?
   Only when it's off, not snoozed, not already asked today, and they've
   either leaned on "5 more" today or gone over the goal two days running. */
export function shouldRecommend({ strictMode, strict, extrasToday }) {
  if (strictMode) return false;

  const today = dayStr();
  if (strict.askedOn === today) return false;
  if (strict.snoozedUntil && strict.snoozedUntil > today) return false;

  const overStreak = (strict.overGoalOn ?? []).slice(-OVER_GOAL_TRIGGER);
  const wentOverTwice =
    overStreak.length >= OVER_GOAL_TRIGGER && overStreak.includes(today);

  return extrasToday >= FIVE_MORE_TRIGGER || wentOverTwice;
}

/* Record that today went over the goal, keeping only the recent run. */
export function markOverGoal(list) {
  const today = dayStr();
  if (list.includes(today)) return list;
  return [...list, today].slice(-5);
}

/* A day has passed with strict on → the streak grows. */
export function rollStreak(strict) {
  const today = dayStr();
  if (strict.streakOn === today) return strict;
  return { ...strict, streak: strict.streak + 1, streakOn: today };
}

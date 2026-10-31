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

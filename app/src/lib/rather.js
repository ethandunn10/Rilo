/* "what would you rather spend it on?" — the one question onboarding asks
   about the person.

   It replaces two older screens ("what are you into?" and "what are you
   working toward?") and saves to exactly the same place they did, so
   everything downstream keeps working untouched: the "do this instead"
   suggestions (lib/profile), the plan Rilo generates (demo/mockAI
   riloLimits), and the push-back when you open a limited app.

   Each answer maps to the vocabulary those already speak — a hobby so the
   suggestions have something concrete to offer, and where it makes sense a
   goal too, so Rilo can say "you said better grades" when he explains a
   limit. Every hobby below has its own written suggestion in lib/profile,
   so none of these can land on the generic fallback. */

/* `rate` is what one of the thing costs in minutes, so a year of scrolling
   can be quoted back in it — "that's 180 gym sessions" lands where "64
   days" only stings. The numbers are deliberately ordinary (an hour at the
   gym, six hours for a book) rather than flattering: an inflated count
   reads as a sales pitch the moment anyone checks it. */
export const RATHER = [
  { id: 'gym', label: 'gym', hobbies: ['gym'], goals: ['get fit'],
    rate: 60, one: 'gym session', many: 'gym sessions' },
  { id: 'studying', label: 'studying', hobbies: ['reading'], goals: ['better grades'],
    rate: 45, one: 'study session', many: 'study sessions' },
  { id: 'sports', label: 'sports', hobbies: ['basketball'], goals: ['make a team'],
    rate: 90, one: 'practice', many: 'practices' },
  { id: 'friends', label: 'friends', hobbies: ['hanging with friends'], goals: [],
    rate: 120, one: 'afternoon with your friends', many: 'afternoons with your friends' },
  { id: 'making', label: 'making stuff', hobbies: ['making videos'], goals: ['build something'],
    rate: 75, one: 'thing you actually made', many: 'things you actually made' },
  { id: 'reading', label: 'reading', hobbies: ['reading'], goals: ['read more'],
    rate: 360, one: 'book', many: 'books' },
  /* a hundred hours is roughly "can actually play a song" territory */
  { id: 'skill', label: 'a new skill', hobbies: ['coding'], goals: ['learn to code'],
    rate: 6000, one: 'skill, learned properly', many: 'skills, learned properly' },
];

/* Fold the picks into the about-you shape the rest of the app reads.
   `extra` holds anything they typed themselves — the free-text path the old
   chip screens already supported. */
export function applyRather(about, picked, typed = []) {
  const on = { ...about.on };

  /* onboarding replaces the demo defaults rather than adding to them */
  Object.keys(on).forEach((k) => {
    on[k] = false;
  });

  picked.forEach((id) => {
    const row = RATHER.find((r) => r.id === id);
    if (!row) return;
    row.hobbies.forEach((h) => {
      on[h] = true;
    });
    row.goals.forEach((g) => {
      on[g] = true;
    });
  });

  const clean = typed.map((t) => t.trim().toLowerCase()).filter(Boolean);

  return {
    ...about,
    on,
    extra: {
      hobby: Array.from(new Set((about.extra?.hobby ?? []).concat(clean))),
      goal: about.extra?.goal ?? [],
    },
  };
}

/* "64 days a year" — the line the whole screen hangs on. */
export function daysPerYear(minutesPerDay) {
  return Math.round((minutesPerDay * 365) / (60 * 24));
}

/* ---------- the flip ----------
   The same year of scrolling, counted in the first thing they picked.

   First, not biggest: the order of RATHER is the order they read, so the
   top pick is the one they'll recognise as theirs. Anything that works out
   to less than one of the thing falls back to the days line, because
   "that's 0 books" is a joke at their expense. */
export function insteadOf(minutesPerDay, picked = []) {
  const year = Math.max(0, minutesPerDay) * 365;
  const row = RATHER.filter((r) => picked.includes(r.id)).find((r) => year / r.rate >= 1);

  if (!row) {
    return {
      count: daysPerYear(minutesPerDay),
      unit: 'days of your own',
      line: `${daysPerYear(minutesPerDay)} days of your own`,
      id: null,
    };
  }

  const count = Math.round(year / row.rate);
  const unit = count === 1 ? row.one : row.many;
  return { count, unit, line: `${count} ${unit}`, id: row.id };
}

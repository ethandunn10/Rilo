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

export const RATHER = [
  { id: 'gym', label: 'gym', hobbies: ['gym'], goals: ['get fit'] },
  { id: 'studying', label: 'studying', hobbies: ['reading'], goals: ['better grades'] },
  { id: 'sports', label: 'sports', hobbies: ['basketball'], goals: ['make a team'] },
  { id: 'friends', label: 'friends', hobbies: ['hanging with friends'], goals: [] },
  { id: 'making', label: 'making stuff', hobbies: ['making videos'], goals: ['build something'] },
  { id: 'reading', label: 'reading', hobbies: ['reading'], goals: ['read more'] },
  { id: 'skill', label: 'a new skill', hobbies: ['coding'], goals: ['learn to code'] },
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

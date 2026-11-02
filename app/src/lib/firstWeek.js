/* The first week: one new question a day, each one where it's useful.

   Everything Rilo wants to know can't be asked on the way in — onboarding
   is eight screens and it stays eight screens. So the rest arrives a day
   at a time, and each question waits for the moment it actually means
   something: the calendar is offered while he's showing tomorrow's plan,
   school hours in the morning, what they're working toward at night when
   he's already asking how the day went.

   Three rules hold the whole thing together:

     one a day      once something has been asked — answered or waved off
                    — nothing else asks until tomorrow
     in its place   each question has a slot, and it appears nowhere else
     never again    skipping is an answer. It's marked done and he drops
                    it; all of it is in the You tab whenever they want it

   The first week only. After day 7 Rilo has asked everything he's going
   to ask, and anything still unanswered stays in settings. */

export const ASKS = [
  {
    id: 'goal',
    day: 1,
    slot: 'checkin',
    ask: 'what are you working toward right now?',
    sub: 'so i can say what a limit is actually for',
    /* at the check-in he just asks it out loud; as a card it needs
       somewhere to type, because a free account has no check-in */
    typed: true,
  },
  {
    id: 'calendar',
    day: 2,
    slot: 'plan',
    ask: 'want me to plan around practice and tests?',
    sub: 'connect your calendar and tomorrow fits around what’s already on it',
    cta: 'connect it',
    /* the one he calls optional out loud — it asks for the most */
    optional: true,
  },
  {
    id: 'school',
    day: 3,
    slot: 'home',
    morningOnly: true,
    ask: 'when are you in school?',
    sub: 'i’ll shut the apps during class. the pass still works if you need it',
    options: [
      { id: '08:00-15:00', label: '8 – 3' },
      { id: '08:30-15:30', label: '8:30 – 3:30' },
      { id: '09:00-16:00', label: '9 – 4' },
    ],
  },
  {
    id: 'scroll',
    day: 4,
    slot: 'home',
    ask: 'when do you scroll the most?',
    sub: 'that’s where i’ll put the tightest limits',
    multi: true,
    options: [
      { id: 'morning', label: 'first thing' },
      { id: 'school', label: 'during school' },
      { id: 'afterschool', label: 'after school' },
      { id: 'night', label: 'at night' },
      { id: 'bed', label: 'in bed' },
    ],
  },
  {
    id: 'hobbies',
    day: 5,
    slot: 'home',
    ask: 'anything else you’re into?',
    sub: 'the more i know, the better the thing i offer you instead',
    multi: true,
    typed: true,
    options: [
      { id: 'music', label: 'music' },
      { id: 'cooking', label: 'cooking' },
      { id: 'drawing', label: 'drawing' },
      { id: 'gaming', label: 'gaming' },
      { id: 'outside', label: 'being outside' },
      { id: 'coding', label: 'coding' },
    ],
  },
];

export const LAST_DAY = 7;

/* The one question to ask here, now — or nothing, which is the common
   answer and the important one.

   Oldest first WITHIN a slot, rather than oldest overall: someone who
   never opens the plan tab would otherwise sit behind the calendar
   question forever and never be asked anything again. */
export function askFor({ day = 1, done = [], askedOn = 0, slot, morning = false }) {
  if (!slot) return null;
  if (day > LAST_DAY) return null;
  /* already had today's question */
  if (askedOn === day) return null;

  return (
    ASKS.filter(
      (a) =>
        a.slot === slot &&
        a.day <= day &&
        !done.includes(a.id) &&
        (!a.morningOnly || morning),
    ).sort((a, b) => a.day - b.day)[0] ?? null
  );
}

/* Mark one asked, however it was answered. Skipping counts: being asked
   twice about something you've already passed on is worse than never
   being asked at all. */
export function markAsked(drip, id) {
  return {
    ...drip,
    done: drip.done.includes(id) ? drip.done : drip.done.concat([id]),
    askedOn: drip.day,
  };
}

/* A day goes by. Used by the real midnight rollover and by the demo
   panel's day buttons. */
export function dripToDay(drip, day) {
  return { ...drip, day: Math.max(1, day), askedOn: 0 };
}

/* "08:30-15:30" → { from, to } for lib/addons school windows */
export function windowOf(id) {
  const [from, to] = String(id || '').split('-');
  return { from: from || '08:15', to: to || '15:00' };
}

/* Is it still morning? The school question is the one that has to land
   before school, so it only shows up before noon. */
export function isMorning(nowMins) {
  return nowMins < 12 * 60;
}

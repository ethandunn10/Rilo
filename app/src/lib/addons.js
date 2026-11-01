/* The rules behind the add-ons. Real logic lives here; anything scripted
   or faked for the web demo lives in src/demo/mockAI.js instead. */

/* ---------- 1. check-in reasons ----------
   "what are you opening this for?" (§4). The LENGTH isn't a free choice
   any more — it's quick (half an open) or full (one open), worked out from
   the app's own numbers — so there's no fixed minute list here.

   "bored" is deliberately NOT here. It lives one screen earlier, on the
   pop-up, where it goes somewhere useful (Rilo suggests something instead).
   Offering it again here just let you tick "bored" and carry on scrolling,
   which is the opposite of the point.

   Its slot went to "need to post", because posting something you made is a
   real reason to open an app and it was the one thing people had to type
   out every time. */
export const CHECKIN_REASONS = [
  { id: 'messages', label: 'messages', sub: 'replying to someone' },
  { id: 'something', label: 'something specific', sub: 'one thing, then out' },
  { id: 'post', label: 'need to post', sub: 'something you made' },
  { id: 'custom', label: 'something else', sub: 'tell me' },
];

/* Creators get a sharper version of the posting line — for them it isn't a
   excuse, it's the work. Everyone still gets the option. */
export function checkinReasons(creator) {
  const posts = creator === 'yes' || creator === 'sometimes';
  if (!posts) return CHECKIN_REASONS;
  return CHECKIN_REASONS.map((r) =>
    r.id === 'post' ? { ...r, sub: 'your own content. this is the job.' } : r,
  );
}

/* ---------- 2. Rilo's mood from how the day is going ----------
   The DAILY GOAL drives this (§8), never the per-app limits: under = happy,
   close = worried, way over = angry, a long phone-down stretch = chilling.

   Only moods the art already has: proud / coach / curious / letdown /
   angry / wave / sleepy. "chilling" and "asleep" share the sleepy drawing
   — the note underneath is what tells them apart. */
export const IDLE_FOR_CHILL = 90; /* minutes off the limited + free apps */

export function moodForUsage({ used, goal, sinceBlockedMins, asleep }) {
  if (asleep) return 'sleepy';
  if (sinceBlockedMins >= IDLE_FOR_CHILL) return 'sleepy'; /* chilling */
  if (goal <= 0) return 'coach';
  const share = used / goal;
  if (share >= 1.25) return 'angry'; /* way over */
  if (share >= 1) return 'letdown'; /* over */
  if (share >= 0.8) return 'curious'; /* worried — close to the line */
  return 'proud'; /* happy — under */
}

export function moodNote({ used, goal, sinceBlockedMins, asleep }) {
  if (asleep) return 'rilo’s asleep. so should you be.';
  if (sinceBlockedMins >= IDLE_FOR_CHILL) return 'phone down a while. he’s chilling.';
  if (goal <= 0) return '';
  const share = used / goal;
  if (share >= 1.25) return 'way over. he’s not thrilled.';
  if (share >= 1) return 'over your goal for today.';
  if (share >= 0.8) return 'close to the line.';
  return 'under your goal. keep it there.';
}

/* ---------- 6. time you got back ---------- */
export function timeBack({ history, baselineMins, savedMinutes = 0 }) {
  const day = (d) => Math.max(0, baselineMins - d.used);
  const today = history.length ? day(history[history.length - 1]) : 0;
  const week = history.slice(-7).reduce((n, d) => n + day(d), 0);
  const total = history.reduce((n, d) => n + day(d), 0) + savedMinutes;
  return { today, week, total };
}

/* ---------- 9. bedtime + school ---------- */
/* Windows are stored as "HH:MM" strings and compared in minutes, so a
   window that crosses midnight still works. */
export function toMins(hhmm) {
  const [h, m] = String(hhmm || '0:00').split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export function fmtClock(hhmm) {
  const t = toMins(hhmm);
  const h = Math.floor(t / 60);
  const m = String(t % 60).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${ampm}`;
}

export function inWindow(nowMins, startHHMM, endHHMM) {
  const a = toMins(startHHMM);
  const b = toMins(endHHMM);
  if (a === b) return false;
  return a < b ? nowMins >= a && nowMins < b : nowMins >= a || nowMins < b;
}

export const SCHOOL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/* Bedtime, school mode and focus blocks all lock the same way: Blocked and
   Limited apps go away, always-allowed ones never do, and the emergency
   pass still works through them (§14). This only says whether a window is
   open — lib/limits lockFor() is what decides per app. */
export function lockReason({ bedtime, school, focus, nowMins, dayIndex }) {
  if (bedtime?.on && inWindow(nowMins, bedtime.from, bedtime.to)) {
    return { locked: true, kind: 'bedtime', until: bedtime.to };
  }
  if (school?.on) {
    /* dayIndex: 0 = monday, to match SCHOOL_DAYS */
    const key = SCHOOL_DAYS[dayIndex] ?? 'mon';
    if (school.days?.includes(key) && inWindow(nowMins, school.from, school.to)) {
      return { locked: true, kind: 'school', until: school.to };
    }
  }
  /* a focus block the user started by hand, or one off their plan */
  if (focus?.on && focus.until && nowMins < toMins(focus.until)) {
    return { locked: true, kind: 'focus', until: focus.until };
  }
  return { locked: false, kind: null, until: null };
}

/* monday-first index for a Date */
export function dayIndexOf(date) {
  return (date.getDay() + 6) % 7;
}

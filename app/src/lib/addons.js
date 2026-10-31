/* The rules behind the add-ons. Real logic lives here; anything scripted
   or faked for the web demo lives in src/demo/mockAI.js instead. */

/* ---------- 1. check-in reasons ---------- */
export const CHECKIN_REASONS = [
  { id: 'messages', label: 'messages', sub: 'replying to someone' },
  { id: 'something', label: 'something specific', sub: 'one thing, then out' },
  { id: 'bored', label: 'bored', sub: 'at least you said it' },
  { id: 'custom', label: 'something else', sub: 'tell me' },
];

export const CHECKIN_MINUTES = [2, 5, 10];

/* ---------- 2. Rilo's mood from how the day is going ---------- */
/* Only moods the art already has: proud / coach / curious / letdown /
   angry / wave / sleepy. */
export const IDLE_FOR_CHILL = 90; /* minutes off the blocked apps */

export function moodForUsage({ used, goal, sinceBlockedMins, asleep }) {
  if (asleep) return 'sleepy';
  if (sinceBlockedMins >= IDLE_FOR_CHILL) return 'proud';
  if (goal <= 0) return 'coach';
  const share = used / goal;
  if (share >= 1.25) return 'angry';
  if (share >= 1) return 'letdown';
  if (share >= 0.8) return 'curious'; /* worried — close to the line */
  return 'proud';
}

export function moodNote({ used, goal, sinceBlockedMins, asleep }) {
  if (asleep) return 'rilo’s asleep. so should you be.';
  if (sinceBlockedMins >= IDLE_FOR_CHILL) return 'phone down a while. he likes that.';
  if (goal <= 0) return '';
  const share = used / goal;
  if (share >= 1.25) return 'way over. he’s not thrilled.';
  if (share >= 1) return 'over your goal for today.';
  if (share >= 0.8) return 'close to the line.';
  return 'under your goal. keep it there.';
}

/* ---------- 4. earning emergency passes ---------- */
export const WEEKLY_PASS_MAX = 4;

/* A day under goal earns one, up to the weekly cap. */
export function passesAfterGoodDay(passesLeft, max = WEEKLY_PASS_MAX) {
  return Math.min(max, passesLeft + 1);
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

export function lockReason({ bedtime, school, nowMins, dayIndex }) {
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
  return { locked: false, kind: null, until: null };
}

/* monday-first index for a Date */
export function dayIndexOf(date) {
  return (date.getDay() + 6) % 7;
}

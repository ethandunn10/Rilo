/* The first week's rules, on their own: one question a day, each in its
   own place, and skipping is final.

   These are the rules that decide whether Rilo is helpful or a pest, and
   none of them are visible in a screenshot — a pile of questions on day
   five looks exactly like one question on day five until you count. */

import { ASKS, LAST_DAY, askFor, markAsked, dripToDay, windowOf, isMorning }
  from '../src/lib/firstWeek.js';

let fail = 0;
const is = (n, ok, extra = '') => {
  if (!ok) fail += 1;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${n}${extra ? `  ${extra}` : ''}`);
};

const fresh = { day: 1, done: [], askedOn: 0 };
const at = (day, extra = {}) => ({ ...fresh, day, ...extra });
const morning = { morning: true };

/* ---------- the five questions ---------- */
console.log('the asks themselves');
is('there are five', ASKS.length === 5, ASKS.map((a) => a.id).join(', '));
is('one a day, days 1 to 5', ASKS.every((a, i) => a.day === i + 1));
is('every one has a slot', ASKS.every((a) => ['home', 'plan', 'checkin'].includes(a.slot)));
is('every one has something to answer with',
  ASKS.every((a) => a.options?.length || a.cta || a.slot === 'checkin'));
is('night one asks what they are working toward',
  ASKS[0].ask.includes('working toward') && ASKS[0].slot === 'checkin');
is('day two offers the calendar on the plan tab',
  ASKS[1].id === 'calendar' && ASKS[1].slot === 'plan' && ASKS[1].optional === true);
is('day three asks about school, in the morning only',
  ASKS[2].id === 'school' && ASKS[2].morningOnly === true);
is('days four and five are scrolling and hobbies',
  ASKS[3].id === 'scroll' && ASKS[4].id === 'hobbies');

/* ---------- one a day ---------- */
console.log('\nnever a pile');
is('day one has one question at the check-in', askFor({ ...at(1), slot: 'checkin' })?.id === 'goal');
is('and nothing on home that day', askFor({ ...at(1), slot: 'home' }) === null);
is('and nothing on the plan tab that day', askFor({ ...at(1), slot: 'plan' }) === null);

const askedToday = at(1, { askedOn: 1, done: ['goal'] });
is('once today is spent, nothing asks again', askFor({ ...askedToday, slot: 'checkin' }) === null);
is('not on another screen either', askFor({ ...askedToday, slot: 'home' }) === null);
is('tomorrow it moves on', askFor({ ...dripToDay(askedToday, 2), slot: 'plan' })?.id === 'calendar');

/* two questions are due at once on day four, and only one may show */
const dayFour = at(4, { done: ['goal'] });
const home = askFor({ ...dayFour, slot: 'home', ...morning });
const plan = askFor({ ...dayFour, slot: 'plan' });
is('a backlog still only shows one per screen',
  home?.id === 'school' && plan?.id === 'calendar', `${home?.id} / ${plan?.id}`);
is('and answering either spends the day',
  askFor({ ...markAsked(dayFour, 'school'), slot: 'plan' }) === null);

/* ---------- in its place ---------- */
console.log('\nin its place, or not at all');
is('the school question waits for the morning',
  askFor({ ...at(3, { done: ['goal', 'calendar'] }), slot: 'home' }) === null);
is('and shows up in it',
  askFor({ ...at(3, { done: ['goal', 'calendar'] }), slot: 'home', ...morning })?.id === 'school');
is('the calendar question is never on home',
  askFor({ ...at(2, { done: ['goal'] }), slot: 'home', ...morning })?.id !== 'calendar');
is('nowhere at all without a slot', askFor({ ...at(5) }) === null);

/* ---------- a stuck question never blocks the rest ---------- */
console.log('\none unanswered question cannot stall the others');
const neverOpensPlan = at(5, { done: [] });
is('day five still asks on home',
  askFor({ ...neverOpensPlan, slot: 'home' })?.id === 'scroll',
  'calendar is still owed, on a tab they never opened');

/* ---------- skipping is final ---------- */
console.log('\nskipping is an answer');
const skipped = markAsked(at(4, { done: ['goal', 'calendar'] }), 'school');
is('it is marked done', skipped.done.includes('school'));
is('and never asked again',
  askFor({ ...dripToDay(skipped, 5), slot: 'home', ...morning })?.id !== 'school');
is('marking twice does not duplicate',
  markAsked(skipped, 'school').done.filter((x) => x === 'school').length === 1);

/* ---------- he stops ---------- */
console.log('\nand then he stops asking');
is(`nothing after day ${LAST_DAY}`,
  askFor({ ...at(LAST_DAY + 1, { done: [] }), slot: 'home', ...morning }) === null);
is('even with everything still unanswered',
  ASKS.every((a) => askFor({ ...at(30), slot: a.slot, ...morning }) === null));

/* ---------- the bits the answers turn into ---------- */
console.log('\nwhat the answers become');
const win = windowOf('08:30-15:30');
is('a school window parses', win.from === '08:30' && win.to === '15:30', `${win.from}–${win.to}`);
is('and a broken one still gives a usable window',
  windowOf('').from === '08:15' && windowOf('').to === '15:00');
is('morning is before noon', isMorning(8 * 60) && !isMorning(13 * 60));
is('a day can be jumped to, clearing today',
  dripToDay({ day: 1, done: ['goal'], askedOn: 1 }, 4).askedOn === 0);
is('and never below day one', dripToDay(fresh, -3).day === 1);

console.log(fail ? `\n${fail} FAILED` : '\nall good — one ask a day, in its place, skippable');
process.exit(fail ? 1 : 0);

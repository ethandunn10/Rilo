/* Replays the exact sequence the user hit: open instagram, run a full
   session, then immediately try again with a typed reason. */
import * as L from '../src/lib/limits.js';

const setting = { mode: L.LIMITED, opens: 3, minutes: 15 };
const strictOn = false;
let day = { opensUsed: {}, lastSession: null, used: {} };
const borrow = { date: '', app: '' };
const dateKey = '2026-10-31';
const app = 'instagram';

const availOf = () => L.opensAvailFor({ setting, app, day, borrow, dateKey });
const continuationFor = () => {
  const last = day.lastSession;
  if (!last || last.app !== app) return null;
  if (Date.now() - last.endedAt > L.CONTINUE_MS) return null;
  return last;
};

/* the fixed startOpenSession, same logic as App.jsx */
function startOpenSession(wanted) {
  let carry = continuationFor();
  if (carry) {
    const roomInCarry =
      L.sessionCapMins({ avail: availOf() + carry.charged, minutes: setting.minutes, strictOn }) -
      carry.mins;
    if (roomInCarry <= 0) carry = null;
  }
  const carried = carry?.mins ?? 0;
  const charged = carry?.charged ?? 0;
  const avail = availOf() + charged;
  const full = L.sessionCapMins({ avail, minutes: setting.minutes, strictOn });
  const cap = Math.min(wanted ?? full, full) - carried;
  if (cap <= 0) return { blocked: true };
  return { blocked: false, cap, carried, charged };
}

function finish(sess, minutesUsed) {
  const total = sess.carried + minutesUsed;
  const spend = L.opensSpent({ mins: total, minutes: setting.minutes, strictOn });
  const delta = Math.max(0, spend - sess.charged);
  day = {
    ...day,
    opensUsed: { ...day.opensUsed, [app]: (day.opensUsed[app] ?? 0) + delta },
    lastSession: { app, endedAt: Date.now(), mins: total, charged: spend },
  };
  return { total, spend, delta };
}

let fail = 0;
const step = (label, got, want) => {
  const ok = got === want;
  if (!ok) fail++;
  console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${label}: ${got}${ok ? '' : `  (want ${want})`}`);
};

console.log('1. first open, "full" (15 min), runs the whole thing:');
let s1 = startOpenSession(15);
step('not blocked', s1.blocked, false);
step('cap', s1.cap, 15);
const f1 = finish(s1, 15);
step('cost 1 open', f1.spend, 1);
step('opens left', availOf(), 2);

console.log('\n2. IMMEDIATELY reopen with a typed reason — the reported bug:');
let s2 = startOpenSession(15);
step('not blocked (was the bug)', s2.blocked, false);
step('starts a fresh session, nothing carried', s2.carried, 0);
step('cap is a whole open again', s2.cap, 15);
const f2 = finish(s2, 15);
step('opens left after', availOf(), 1);

console.log('\n3. a genuine flick-out-and-back still continues (2.6):');
day = { opensUsed: {}, lastSession: null, used: {} };
let s3 = startOpenSession(15);
finish(s3, 5);                       /* left after 5 of 15 */
step('cost only half an open', day.opensUsed[app], 0.5);
let s4 = startOpenSession(15);
step('carried the 5 min', s4.carried, 5);
step('10 min left in the same open', s4.cap, 10);
const f4 = finish(s4, 4);            /* 9 total, past half */
step('total 9 min', f4.total, 9);
step('now costs a whole open', day.opensUsed[app], 1);
step('still a second open spent? no', availOf(), 2);

console.log('\n4. truly out of opens still goes to the pop-up:');
day = { opensUsed: { [app]: 3 }, lastSession: null, used: {} };
step('blocked', startOpenSession(15).blocked, true);

console.log('\n5. half an open left -> quick only, 7.5 min cap:');
day = { opensUsed: { [app]: 2.5 }, lastSession: null, used: {} };
const s5 = startOpenSession(7.5);
step('not blocked', s5.blocked, false);
step('cap', s5.cap, 7.5);

console.log(fail ? `\n${fail} FAILED` : '\nall good');
process.exit(fail ? 1 : 0);

import * as L from '../src/lib/limits.js';

let pass = 0, fail = 0;
const is = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  if (!ok) console.log(`FAIL ${name}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`);
};

const M = 15, HALF = 7.5;
const spend = (mins, strictOn = false) => L.opensSpent({ mins, minutes: M, strictOn });
const cap = (avail, strictOn = false) => L.sessionCapMins({ avail, minutes: M, strictOn });

// §2.1 leave at or before half -> 0.5
is('2.1 exactly half = 0.5', spend(HALF), 0.5);
is('2.1 under half = 0.5', spend(5), 0.5);
// §2.2 past half up to full -> 1
is('2.2 just past half = 1', spend(7.6), 1);
is('2.2 full = 1', spend(15), 1);
// §2.3 min 0.5 even for a 10-second peek
is('2.3 ten seconds = 0.5', spend(1/6), 0.5);
is('2.3 zero = 0.5', spend(0), 0.5);
// §2.4 one session never past 1 full open
is('2.4 cap with 3 opens = 15', cap(3), M);
is('2.4 cap with 2.5 opens = 15', cap(2.5), M);
// §2.5 with only 0.5 left, session maxes at half
is('2.5 cap with 0.5 = 7.5', cap(0.5), HALF);
is('2.5 cap with 0 = 0 (locked)', cap(0), 0);
// §2.8 strict: halves off, any session = 1 full open
is('2.8 strict ten seconds = 1', spend(1/6, true), 1);
is('2.8 strict cap with 1 = 15', cap(1, true), M);
is('2.8 strict cap with 0.5 = 0 (stranded)', cap(0.5, true), 0);

// §3 circles + text
is('3 circles 3 total 0 used', L.circlesFor(3, 0), ['full','full','full']);
is('3 circles 3 total 0.5 used', L.circlesFor(3, 0.5), ['full','full','half']);
is('3 circles 3 total 1 used', L.circlesFor(3, 1), ['full','full','empty']);
is('3 circles 3 total 3 used', L.circlesFor(3, 3), ['empty','empty','empty']);
is('3 text 2.5 left', L.opensText(2.5, 15), '2½ opens left · 15 min each');
is('3 text 1 left', L.opensText(1, 15), '1 open left · 15 min each');
is('3 text 0.5 left', L.opensText(0.5, 15), '½ an open left · 15 min each');
is('3 fmtOpens 0.5', L.fmtOpens(0.5), '½');
is('3 fmtOpens 2.5', L.fmtOpens(2.5), '2½');
is('3 fmtOpens 3', L.fmtOpens(3), '3');

// §2.7 + §6 borrow: today +0.5, tomorrow -0.5
const setting = { mode: L.LIMITED, opens: 3, minutes: 15 };
is('6 borrow adds half today',
  L.opensTotalFor({ setting, app:'tiktok', day:{ borrowed:{app:'tiktok'}, opensUsed:{} }, borrow:{date:'',app:''}, dateKey:'2026-10-31' }), 3.5);
is('6 borrow comes off the day it is due',
  L.opensTotalFor({ setting, app:'tiktok', day:{ opensUsed:{} }, borrow:{date:'2026-11-01',app:'tiktok'}, dateKey:'2026-11-01' }), 2.5);
is('6 borrow does not touch another app',
  L.opensTotalFor({ setting, app:'youtube', day:{ opensUsed:{} }, borrow:{date:'2026-11-01',app:'tiktok'}, dateKey:'2026-11-01' }), 3);

// §6 borrow is only offered with 0 opens, pass gone, strict off, once a day
const bArgs = { setting, app:'tiktok', day:{ opensUsed:{tiktok:3} }, borrow:{date:'',app:''}, dateKey:'d' };
is('6 offered when out of opens + no pass', L.canBorrow({ ...bArgs, strictOn:false, passesLeft:0 }), true);
is('6 not while a pass is left', L.canBorrow({ ...bArgs, strictOn:false, passesLeft:1 }), false);
is('6 never in strict mode', L.canBorrow({ ...bArgs, strictOn:true, passesLeft:0 }), false);
is('6 not twice in a day', L.canBorrow({ ...bArgs, day:{opensUsed:{tiktok:3}, borrowed:{app:'x'}}, strictOn:false, passesLeft:0 }), false);
is('6 not with opens still left', L.canBorrow({ ...bArgs, day:{opensUsed:{tiktok:1}}, strictOn:false, passesLeft:0 }), false);

// §1 the four settings + defaults
is('1 phone ships always allowed', L.settingFor({}, 'phone').mode, L.ALWAYS);
is('1 messages ships always allowed', L.settingFor({}, 'messages').mode, L.ALWAYS);
is('1 maps ships always allowed', L.settingFor({}, 'maps').mode, L.ALWAYS);
is('1 camera ships always allowed', L.settingFor({}, 'camera').mode, L.ALWAYS);
is('1 anything else defaults limited', L.settingFor({}, 'tiktok').mode, L.LIMITED);
is('8 always-allowed is off the daily total', L.countsTowardDay({}, 'phone'), false);
is('8 limited counts toward the daily total', L.countsTowardDay({}, 'tiktok'), true);

// §1/§5 blocked = 0 opens, pass still works
const blocked = { mode: L.BLOCKED, opens: 3, minutes: 15 };
is('1 blocked has no opens', L.opensTotalFor({ setting: blocked, app:'tiktok', day:{opensUsed:{}}, borrow:{}, dateKey:'d' }), 0);
const lk = L.lockFor({ app:'tiktok', appSettings:{tiktok:blocked}, day:{opensUsed:{}}, borrow:{}, dateKey:'d', strictOn:false });
is('1 blocked is locked', lk.locked, true);
is('5 blocked still takes the pass', lk.passable, true);

// §14 windows lock limited, never always-allowed; pass works through them
const win = { locked:true, kind:'bedtime', until:'07:00' };
is('14 bedtime locks a limited app',
  L.lockFor({ app:'tiktok', appSettings:{}, day:{opensUsed:{}}, borrow:{}, dateKey:'d', strictOn:false, schedule:win }).locked, true);
is('14 bedtime never locks an always-allowed app',
  L.lockFor({ app:'phone', appSettings:{}, day:{opensUsed:{}}, borrow:{}, dateKey:'d', strictOn:false, schedule:win }).locked, false);
is('14 pass works through bedtime',
  L.lockFor({ app:'tiktok', appSettings:{}, day:{opensUsed:{}}, borrow:{}, dateKey:'d', strictOn:false, schedule:win }).passable, true);
is('14 a free app is never locked by its limit',
  L.lockFor({ app:'spotify', appSettings:{spotify:{mode:L.FREE,opens:3,minutes:15}}, day:{opensUsed:{}}, borrow:{}, dateKey:'d', strictOn:false }).locked, false);

// §9 plan check
const tracked = ['tiktok','youtube','phone'];
const settings = {
  tiktok: { mode: L.LIMITED, opens: 3, minutes: 15 },   // 45
  youtube:{ mode: L.FREE,    opens: 3, minutes: 15 },   // typical 60
  phone:  { mode: L.ALWAYS,  opens: 3, minutes: 15 },   // ignored
};
const chk = L.planCheck({ appSettings: settings, tracked, typicalFor: (a) => (a==='youtube'?60:0), goalMins: 90 });
is('9 allows = limited max + free typical', chk.allows, 105);
is('9 over the goal', chk.over, true);
is('9 by how much', chk.by, 15);
is('9 always-allowed is not counted', chk.limited.length + chk.free.length, 2);
const chkOk = L.planCheck({ appSettings: settings, tracked, typicalFor: () => 0, goalMins: 90 });
is('9 fits when free time is nil', chkOk.over, false);

// §11 step-down: minutes first, then an open, then nothing left
is('11 minutes come off first', L.stepDownFor({mode:L.LIMITED,opens:3,minutes:15}).to.minutes, 12);
is('11 then an open', L.stepDownFor({mode:L.LIMITED,opens:3,minutes:5}).to.opens, 2);
is('11 a free app gets limited', L.stepDownFor({mode:L.FREE,opens:3,minutes:15}).kind, 'limit');
is('11 nothing left to give', L.stepDownFor({mode:L.LIMITED,opens:0.5,minutes:5}), null);
is('11 the line', L.stepDownLine('tiktok', L.stepDownFor({mode:L.LIMITED,opens:3,minutes:15})),
   'next week: tiktok goes to 12 min per open.');

// §11 stop condition
const good = Array.from({length:7},()=>({hit:true}));
const mixed = [{hit:true},{hit:false},{hit:false},{hit:false},{hit:true},{hit:false},{hit:false}];
is('11 stops when it fits and they hit it', L.stepDownDone({ check: chkOk, history: good }), true);
is('11 keeps going while it does not fit', L.stepDownDone({ check: chk, history: good }), false);
is('11 keeps going while they miss most days', L.stepDownDone({ check: chkOk, history: mixed }), false);

// §12 loosening vs tightening
const lim = (o,m)=>({mode:L.LIMITED,opens:o,minutes:m});
is('12 more opens is loosening', L.isLoosening(lim(3,15), lim(4,15)), true);
is('12 more minutes is loosening', L.isLoosening(lim(3,15), lim(3,20)), true);
is('12 fewer opens is tightening', L.isLoosening(lim(3,15), lim(2,15)), false);
is('12 fewer minutes is tightening', L.isLoosening(lim(3,15), lim(3,10)), false);
is('12 limited -> free is loosening', L.isLoosening(lim(3,15), {mode:L.FREE,opens:3,minutes:15}), true);
is('12 limited -> always is loosening', L.isLoosening(lim(3,15), {mode:L.ALWAYS,opens:3,minutes:15}), true);
is('12 limited -> blocked is tightening', L.isLoosening(lim(3,15), {mode:L.BLOCKED,opens:3,minutes:15}), false);
is('12 blocked -> limited is loosening', L.isLoosening({mode:L.BLOCKED,opens:3,minutes:15}, lim(3,15)), true);
is('12 free -> limited is tightening', L.isLoosening({mode:L.FREE,opens:3,minutes:15}, lim(3,15)), false);

// §12 the two waits
is('12 normal wait', L.WAIT_NORMAL, 5);
is('12 strict wait', L.WAIT_STRICT, 15);
// §5 one pass a day, five minutes
is('5 one pass a day', L.PASSES_PER_DAY, 1);
is('5 five minutes', L.PASS_MINUTES, 5);
// §2.6 two minutes
is('2.6 continue window is 2 min', L.CONTINUE_MS, 120000);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

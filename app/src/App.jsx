/* Rilo — screen router.
   Screens slide in left/right like an iPhone push/pop: the incoming screen
   comes in from the edge while the outgoing one slides off with a parallax.

   Name, onboarding answers, XP, chosen Rilo, the per-app limits, today's
   opens and the You stats live here and are saved to localStorage, so a
   refresh doesn't reset everything. Tester taps are counted in lib/track.js
   and shown on the hidden /results screen.

   The limit system (lib/limits) is the heart of it: every tracked app is
   always allowed, blocked, limited or free, and a Limited app's OPENS are
   the only thing that locks it. Opens count in halves. The daily goal is a
   scoreboard — it drives mood, xp, streaks, "time you got back" and the
   weekly step-down, and it never blocks anything. */

import { useEffect, useState } from 'react';
import PhoneFrame from './components/PhoneFrame';

import Welcome from './screens/Welcome';
import Name from './screens/Name';
import YourNumber from './screens/YourNumber';
import Rather from './screens/Rather';
import YourPlan from './screens/YourPlan';
import Talk from './screens/Talk';
import PickApps from './screens/PickApps';
import Paywall from './screens/Paywall';
import Permission from './screens/Permission';
import Crunching from './screens/Crunching';
import Shield from './screens/Shield';
import AppOpen from './screens/AppOpen';
import Banner from './components/Banner';
import DaySummary from './screens/DaySummary';
import Home from './screens/Home';
import Intercept from './screens/Intercept';
import Suggestion from './screens/Suggestion';
import Tired from './screens/Tired';
import Break from './screens/Break';
import NeedIt from './screens/NeedIt';
import Plan from './screens/Plan';
import Limits from './screens/Limits';
import Progress from './screens/Progress';
import PickRilo from './screens/PickRilo';
import You from './screens/You';
import LevelUp from './screens/LevelUp';
import Results from './screens/Results';

import {
  loadState,
  saveState,
  clearState,
  DEFAULT_STATE,
  today,
  tomorrow,
  freshDay,
} from './lib/storage';
import { track } from './lib/track';
import { pickedApps, trackedApps } from './lib/apps';
import { HOBBIES, GOALS } from './lib/profile';
import {
  buildBreakdown,
  hoursToMins,
  fmtMins,
  dayXp,
  WEEK_BONUS,
  PLAN_BONUS,
  shouldSuggestStrict,
  watchedFor,
} from './lib/plan';
import { levelFor, skinsUnlockedBetween, UNLOCK_ALL } from './lib/levels';
/* ---- add-ons (rilo-addons-test) ---- */
import WhyOpen from './screens/WhyOpen';
import ShareCard from './screens/ShareCard';
import Buddies from './screens/Buddies';
import DemoPanel from './components/DemoPanel';
import {
  moodForUsage,
  moodNote,
  timeBack,
  lockReason,
  dayIndexOf,
  toMins,
} from './lib/addons';
import {
  overLine,
  comparisonFor,
  calendarPlan,
  DEMO_CALENDAR,
  riloLimits,
  demoDailyMinutes,
  insteadPlan,
} from './demo/mockAI';
import { applyRather, RATHER } from './lib/rather';
import NightCheckIn from './screens/NightCheckIn';
import NightTime from './screens/NightTime';
import CalendarConnect from './screens/CalendarConnect';
import { ThemeContext, themeInfo } from './lib/themes';

/* ---- the limit system ---- */
import {
  ALWAYS,
  LIMITED,
  FREE,
  PASS_MINUTES,
  PASSES_PER_DAY,
  CONTINUE_MS,
  clampOpens,
  clampMinutes,
  settingFor,
  countsTowardDay,
  opensTotalFor,
  opensUsedFor,
  opensAvailFor,
  sessionCapMins,
  opensSpent,
  canBorrow as canBorrowFor,
  lockFor,
  planCheck,
  isLoosening,
  describeChange,
  makePending,
  stepDownTargetFor,
  stepDownFor,
  stepDownDone,
} from './lib/limits';

/* the hidden results screen: /results, or #results if rewrites aren't on */
function wantsResults() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '/results' || window.location.hash === '#results';
}

/* How much time saying no is worth. Refusing a session outright banks the
   open they didn't spend, which is the app's own per-open length. */
const SAID_NO_MINUTES = 15;

/* The Rilo who walks you through onboarding: always the original. */
const OG_SKIN = 'original';

export default function App() {
  const [showResults, setShowResults] = useState(wantsResults);

  useEffect(() => {
    const sync = () => setShowResults(wantsResults());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);

  /* nav.entries holds one screen normally, two mid-transition:
     [outgoing, incoming]. Keys stay stable so the outgoing screen is not
     remounted (which would re-run its entry animations as it leaves). */
  const [nav, setNav] = useState({ entries: ['welcome'], dir: 'forward' });

  /* saved state */
  const [saved] = useState(loadState);
  const [name, setName] = useState(saved.name);
  const [about, setAbout] = useState(saved.about);
  const [apps, setApps] = useState(saved.apps);
  const [time, setTime] = useState(saved.time);
  const [plan, setPlan] = useState(saved.plan);
  const [planChoice, setPlanChoice] = useState(saved.planChoice);
  const [xp, setXp] = useState(saved.xp);
  const [level, setLevel] = useState(saved.level);
  const [isPro, setIsPro] = useState(saved.isPro);
  /* a skin waiting to be celebrated, shown next time we head home */
  const [pendingSkin, setPendingSkin] = useState(null);
  const [chosenRilo, setChosenRilo] = useState(saved.chosenRilo);
  /* app theme — grass is free, the rest are Rilo Pro (lib/themes) */
  const [theme, setTheme] = useState(saved.theme);
  const [opens, setOpens] = useState(saved.opens);
  const [stats, setStats] = useState(saved.stats);

  /* ---------- the limits (lib/limits) ---------- */
  const [appSettings, setAppSettings] = useState(saved.appSettings);
  const [limitMode, setLimitMode] = useState(saved.limitMode);
  /* tomorrow's IOU from a borrow: { date, app } */
  const [borrow, setBorrow] = useState(saved.borrow);
  /* loosening changes waiting out their 24 hours in strict mode */
  const [pending, setPending] = useState(saved.pending);
  /* the weekly step-down */
  const [step, setStep] = useState(saved.step);
  /* a focus block: apps locked until a time today */
  const [focus, setFocus] = useState(saved.focus);
  /* what Rilo said about his own plan, when he made it */
  const [riloWhy, setRiloWhy] = useState({});
  const [riloLead, setRiloLead] = useState([]);

  /* ---------- screen time baseline + the week counter ---------- */
  const [screenTime, setScreenTime] = useState(saved.screenTime);
  const [triedAgain, setTriedAgain] = useState(saved.triedAgain);
  const [breakdown, setBreakdown] = useState(saved.breakdown);
  const [program, setProgram] = useState(saved.program);
  const [day, setDay] = useState(saved.day);
  const [history, setHistory] = useState(saved.history);
  const [streak, setStreak] = useState(saved.streak);
  const [leanDays, setLeanDays] = useState(saved.leanDays);
  const [strict, setStrict] = useState(saved.strict);

  /* ---------- add-ons (rilo-addons-test) ---------- */
  const [checkins, setCheckins] = useState(saved.checkins);
  const [bedtime, setBedtime] = useState(saved.bedtime);
  const [school, setSchool] = useState(saved.school);
  const [buddies, setBuddies] = useState(saved.buddies);
  /* today's schedule on the plan tab */
  const [schedulePlan, setSchedulePlan] = useState(saved.schedule);
  const [calendar, setCalendar] = useState(saved.calendar);
  const [night, setNight] = useState(saved.night);
  /* DEMO ONLY: a fake clock so bedtime and school can be tested */
  const [demoClock, setDemoClock] = useState(saved.demoClock);
  /* the reason they gave on the check-in, for this session */
  const [promise, setPromise] = useState(null);
  /* "you said quick check on messages, and you used the whole open" */
  const [overNote, setOverNote] = useState('');

  /* The session being "opened" right now.
       app      which app
       cap      how many more minutes it may run
       carried  minutes already spent in this session before a reopen
       charged  opens this session has already cost
       kind     'open' spends an open · 'pass' spends the emergency pass
       minutes  the app's per-open length, for the arithmetic at the end */
  const [session, setSession] = useState({
    app: null,
    cap: 5,
    carried: 0,
    charged: 0,
    kind: 'open',
    minutes: 15,
  });
  /* which screen opened the paywall, so it can hand them back */
  const [cameFrom, setCameFrom] = useState(null);
  /* the iOS notification Rilo sends from the shield */
  const [banner, setBanner] = useState(false);
  /* "you closed 7 min early" — shown on Home once, after a short session */
  const [savedNote, setSavedNote] = useState(null);
  /* what they said they'd rather be doing (lib/rather ids). Kept so the
     plan screen can build its swaps, and folded into `about` on the way
     past so everything downstream reads it where it always did. */
  const [rather, setRather] = useState([]);
  /* ticks once a second while anything is pending, so countdowns move and
     a change lands the moment its 24 hours are up */
  const [, setTick] = useState(0);

  useEffect(() => {
    saveState({
      name, about, apps, time, plan, planChoice, isPro,
      xp, level, chosenRilo, theme, opens, stats,
      appSettings, limitMode, borrow, pending, step, focus,
      screenTime, triedAgain, breakdown, program, day, history, streak,
      leanDays, strict,
      checkins, bedtime, school, buddies, demoClock,
      schedule: schedulePlan,
      calendar,
      night,
    });
  }, [name, about, apps, time, plan, planChoice, isPro, xp, level, chosenRilo, theme, opens,
      stats, appSettings, limitMode, borrow, pending, step, focus,
      screenTime, triedAgain, breakdown, program, day, history, streak,
      leanDays, strict, checkins, bedtime, school, buddies,
      demoClock, schedulePlan, calendar, night]);

  /* The web can't read real Screen Time, so the baseline comes from the
     hours they gave on Your time back (5h if they never said). */
  const makeBreakdown = (allowed) => {
    const picked = watchedFor(pickedApps(apps), isPro);
    const total = hoursToMins(time.now || 5);
    setBreakdown(buildBreakdown(picked, total, allowed));
  };

  /* ---------- the two things onboarding no longer asks ----------
     It used to ask how many hours they're on and what their goal was, on
     two separate screens. Both are derived now:

       hours  from the apps they picked (demoDailyMinutes) — the web can't
              read real Screen Time, and a number built from their own
              picks beats a stepper they'd guess at
       goal   roughly half of it, on a clean half hour, floored at an hour

     Both are editable on the you tab, which is where someone who cares
     about the exact figure will go anyway. */
  const startFromApps = (allowed) => {
    const picked = watchedFor(pickedApps(apps), isPro);
    const mins = demoDailyMinutes(picked);
    const hours = Math.round((mins / 60) * 100) / 100;
    const goal = Math.max(1, Math.round(hours / 2 / 0.5) * 0.5);
    setTime((t) => ({ ...t, now: hours, goal }));
    setBreakdown(buildBreakdown(picked, mins, allowed));
  };

  /* Rilo writes the plan himself from the apps, the number and what they
     said they'd rather be doing. No "set your limits" screen in the way —
     they see the result and can edit it. */
  const buildPlanFor = (picks) => {
    const picked = watchedFor(pickedApps(apps), isPro);
    const mins = demoDailyMinutes(picked);
    const goal = hoursToMins(Math.max(1, Math.round(mins / 60 / 2 / 0.5) * 0.5));
    const bd = breakdown ?? buildBreakdown(picked, mins, screenTime === true);
    const hobbies = [];
    const goals = [];
    picks.forEach((id) => {
      const row = RATHER.find((r) => r.id === id);
      if (!row) return;
      hobbies.push(...row.hobbies);
      goals.push(...row.goals);
    });

    const out = riloLimits({
      tracked: picked,
      breakdown: bd,
      goalMins: goal,
      hobbies,
      goals,
      calendar: [],
      checkins: [],
    });
    setAppSettings((prev) => ({ ...prev, ...out.settings }));
    setRiloWhy(out.why);
    setRiloLead(out.lead);
    setLimitMode('rilo');
    track('limits', `built from onboarding · allows ${out.check.allows}m`);
  };

  /* Watching another app, or changing their hours, changes where the time
     goes — so the breakdown is rebuilt instead of going stale. */
  const pickedKey = watchedFor(pickedApps(apps), isPro).join(',');
  useEffect(() => {
    if (screenTime === null || screenTime === undefined) return;
    makeBreakdown(screenTime === true);
    /* makeBreakdown reads the same values these deps track */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey, time.now, screenTime, isPro]);

  /* ---------- today's numbers ---------- */
  const dateKey = today();
  const startMins = hoursToMins(time.now || 5);
  /* The goal is one number they set. It does not step itself down and it
     never locks anything (§8). */
  const goalMins = hoursToMins(time.goal);

  /* every app Rilo watches, plus the always-allowed ones */
  const watched = watchedFor(pickedApps(apps), isPro);
  const tracked = trackedApps(apps, appSettings).filter(
    (a) => watched.includes(a) || settingFor(appSettings, a).mode === ALWAYS,
  );

  /* what they typically spend on an app, from the baseline — this is what
     the plan check counts for a Free app, and what the step-down ranks by */
  const byApp = new Map((breakdown?.apps ?? []).map((a) => [a.app, a]));
  const typicalFor = (app) => Math.round(byApp.get(app)?.mins ?? 0);
  const pctFor = (app) => byApp.get(app)?.pct ?? null;
  const shareFor = (app) => byApp.get(app)?.share ?? 0;

  /* The daily total: everything except the always-allowed apps (§8). */
  const usedTotalToday = Object.entries(day.used).reduce(
    (n, [app, mins]) => (countsTowardDay(appSettings, app) ? n + mins : n),
    0,
  );

  /* ---------- the clock, the windows, the mood ---------- */
  /* DEMO ONLY: demoClock stands in for the phone's real clock */
  const now = new Date();
  const nowMins = demoClock ? toMins(demoClock) : now.getHours() * 60 + now.getMinutes();
  const schedule = lockReason({ bedtime, school, focus, nowMins, dayIndex: dayIndexOf(now) });
  const asleep = schedule.kind === 'bedtime';

  const minsSinceBlocked = day.lastBlockedAt
    ? Math.round((Date.now() - day.lastBlockedAt) / 60000)
    : 999;

  const riloMood = moodForUsage({
    used: usedTotalToday,
    goal: goalMins,
    sinceBlockedMins: minsSinceBlocked,
    asleep,
  });
  const riloNote = moodNote({
    used: usedTotalToday,
    goal: goalMins,
    sinceBlockedMins: minsSinceBlocked,
    asleep,
  });

  const back = timeBack({
    history,
    baselineMins: startMins,
    savedMinutes: stats.savedMinutes,
  });
  const backSays = comparisonFor(back.week, history.length);

  /* what Rilo knows about them, for the suggestions and his own plan */
  const profileList = (kind) => {
    const list = kind === 'hobby' ? HOBBIES : GOALS;
    const on = list.filter((k) => about.on?.[k]);
    return on.concat(about.extra?.[kind] ?? []);
  };

  /* one pass a day, no earning extras (§5) */
  const passesLeft = Math.max(0, PASSES_PER_DAY - (day.passes ?? 0));

  /* ---------- the nightly check-in (§ rilo pro) ----------
     They have it if they're Pro. The button is always there once they do —
     checking in at 4pm because you know how the day went is fine. `due`
     only controls the nudge: their chosen time has passed and they haven't
     done it yet today. */
  const canCheckIn = isPro;
  const checkedInToday = night.date === dateKey;
  const checkInDue = canCheckIn && !checkedInToday && nowMins >= toMins(night.at || '21:00');

  /* what the calendar means for the week ahead */
  const weekAhead = calendar.on ? calendarPlan(DEMO_CALENDAR, watched) : [];

  /* ---------- the plan check (§9) ---------- */
  const check = planCheck({ appSettings, tracked, typicalFor, goalMins });

  /* ---------- per-app state, all from lib/limits ---------- */
  const settingOf = (app) => settingFor(appSettings, app);

  const totalOpensFor = (app) =>
    opensTotalFor({ setting: settingOf(app), app, day, borrow, dateKey });

  const lockOf = (app) =>
    lockFor({ app, appSettings, day, borrow, dateKey, strictOn: strict.on, schedule });

  const availOf = (app) =>
    opensAvailFor({ setting: settingOf(app), app, day, borrow, dateKey });

  const borrowableFor = (app) =>
    canBorrowFor({
      setting: settingOf(app),
      app,
      day,
      borrow,
      dateKey,
      strictOn: strict.on,
      passesLeft,
    });

  /* ---------- changing a limit ----------
     Stricter is instant in both modes. Looser is instant in normal mode and
     waits 24 hours in strict mode (§12). */
  const applySetting = (app, next) => {
    setAppSettings((s) => ({ ...s, [app]: next }));
  };

  const setAppSetting = (app, raw) => {
    const next = {
      mode: raw.mode,
      opens: clampOpens(raw.opens),
      minutes: clampMinutes(raw.minutes),
    };
    const prev = settingOf(app);
    if (prev.mode === next.mode && prev.opens === next.opens && prev.minutes === next.minutes) {
      return;
    }

    if (strict.on && isLoosening(prev, next)) {
      /* one pending change per app — a new one replaces the old */
      setPending((list) =>
        (list ?? []).filter((p) => p.app !== app).concat([makePending({ app, prev, next })]),
      );
      track('limit', `pending 24h: ${describeChange(app, prev, next)}`);
      return;
    }

    applySetting(app, next);
    /* making their own change makes it their own plan */
    setLimitMode('own');
    track('limit', describeChange(app, prev, next));
  };

  const cancelPending = (id) => {
    setPending((list) => (list ?? []).filter((p) => p.id !== id));
    track('limit', 'pending change cancelled');
  };

  const applyPending = (p) => {
    if (p.kind === 'setting') applySetting(p.app, p.next);
    track('limit', `landed: ${p.label}`);
  };

  /* a pending change lands the moment its 24 hours are up */
  useEffect(() => {
    const waiting = (pending ?? []).length > 0 || Boolean(strict.endingAt) || Boolean(step.skipAt);
    if (!waiting) return;

    const id = setInterval(() => {
      const at = Date.now();
      setTick((v) => v + 1);

      const due = (pending ?? []).filter((p) => p.at <= at);
      if (due.length) {
        due.forEach(applyPending);
        setPending((list) => (list ?? []).filter((p) => p.at > at));
      }

      if (strict.endingAt && strict.endingAt <= at) {
        setStrict((st) => ({ ...st, on: false, endingAt: null }));
      }

      if (step.skipAt && step.skipAt <= at) {
        setStep((s) => ({ ...s, skipAt: null, status: 'skipped' }));
      }
    }, 1000);

    return () => clearInterval(id);
    /* applyPending reads the same state these deps track */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, strict.endingAt, step.skipAt]);

  /* The first time they reach the limits screen there's nothing set, so
     Rilo builds a plan rather than handing them an empty form. They can
     still take it apart, or tap "make your own" and start from scratch. */
  const noLimitsYet = Object.keys(appSettings).length === 0;
  useEffect(() => {
    if (!noLimitsYet) return;
    if (!breakdown || !tracked.length) return;
    if (nav.entries[nav.entries.length - 1] !== 'limitsonboard') return;
    makeRiloPlan();
    /* makeRiloPlan reads the same state these deps track */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noLimitsYet, breakdown, nav.entries, tracked.length]);

  /* ---------- the weekly step-down (§11) ---------- */
  const stepApp =
    step.app && tracked.includes(step.app)
      ? step.app
      : stepDownTargetFor({ appSettings, tracked, shareFor });

  const stepProposal = stepApp ? stepDownFor(settingOf(stepApp)) : null;
  const stepFinished = step.done || stepDownDone({ check, history });

  /* a day ahead of the new week, they get a preview; at the turn, the offer */
  const stepPhase =
    stepFinished || !stepProposal
      ? null
      : step.status === 'offered' && step.week === program.week
        ? 'offered'
        : program.daysDone >= 6
          ? 'preview'
          : null;

  const stepSwappable = tracked
    .filter((a) => a !== stepApp)
    .filter((a) => {
      const m = settingOf(a).mode;
      return m === LIMITED || m === FREE;
    })
    .slice(0, 6);

  const acceptStepDown = (appName = stepApp) => {
    const target = appName;
    const proposal = stepDownFor(settingOf(target));
    if (!proposal) return;
    /* a step-down is always a tightening, so it lands straight away in
       both modes — no 24 hour wait on making things harder */
    applySetting(target, {
      mode: proposal.to.mode,
      opens: clampOpens(proposal.to.opens),
      minutes: clampMinutes(proposal.to.minutes),
    });
    setStep((s) => ({ ...s, app: target, status: 'accepted', skipAt: null }));
    track('stepdown', `accepted: ${target} ${proposal.say}`);
  };

  const skipStepDown = () => {
    if (strict.on) {
      /* skipping is a loosening, so it waits like any other (§11) */
      setStep((s) => ({ ...s, skipAt: Date.now() + 24 * 60 * 60 * 1000 }));
      track('stepdown', 'skip pending 24h');
      return;
    }
    setStep((s) => ({ ...s, status: 'skipped', skipAt: null }));
    track('stepdown', 'skipped');
  };

  const swapStepDown = (appName) => {
    setStep((s) => ({ ...s, app: appName, status: 'offered', skipAt: null }));
    track('stepdown', `moved to ${appName}`);
  };

  /* Offered at the start of each new week. In strict mode it just happens. */
  const offerStepDown = (week) => {
    const target = stepDownTargetFor({ appSettings, tracked, shareFor });
    if (!target || stepFinished) {
      setStep((s) => ({ ...s, done: stepFinished }));
      return;
    }
    if (strict.on) {
      acceptStepDown(target);
      setStep((s) => ({ ...s, week, app: target, status: 'accepted', skipAt: null }));
      return;
    }
    setStep((s) => ({ ...s, week, app: target, status: 'offered', skipAt: null }));
    track('stepdown', `offered: ${target}`);
  };

  /* ---------- sessions ----------
     Opens are charged when a session ENDS, not when it starts, because the
     cost depends on how long it actually ran — and because reopening inside
     two minutes carries the same session on rather than starting a new one
     (§2.6). `day.lastSession` is what makes that possible. */

  const continuationFor = (appName) => {
    const last = day.lastSession;
    if (!last || last.app !== appName) return null;
    if (Date.now() - last.endedAt > CONTINUE_MS) return null;
    return last;
  };

  /* Start (or carry on) a session on a Limited app.
     `wanted` is the length they asked for on the check-in; the real cap is
     whatever their remaining opens actually buy. */
  const startOpenSession = (appName, wanted) => {
    const setting = settingOf(appName);

    /* Is there a session to carry on? Reopening inside two minutes continues
       the last one rather than costing a second open (§2.6).

       But a carried session that has ALREADY spent its whole open is over,
       not continuable — §2.4 caps a single session at one open, it doesn't
       cap the day. Treating it as a continuation is what made every retry
       inside two minutes bounce back to the pop-up with opens still left.
       If that's the case we drop the carry and this is simply a new
       session, on a new open. */
    let carry = continuationFor(appName);
    if (carry) {
      const roomInCarry =
        sessionCapMins({
          avail: availOf(appName) + carry.charged,
          minutes: setting.minutes,
          strictOn: strict.on,
        }) - carry.mins;
      if (roomInCarry <= 0) carry = null;
    }

    const carried = carry?.mins ?? 0;
    const charged = carry?.charged ?? 0;

    /* add back what this session already cost, so carrying on doesn't look
       like a second session with less to spend */
    const avail = availOf(appName) + charged;
    const full = sessionCapMins({ avail, minutes: setting.minutes, strictOn: strict.on });

    /* one session never runs past one whole open (§2.4) */
    const cap = Math.min(wanted ?? full, full) - carried;

    if (cap <= 0) {
      /* genuinely out of opens — the pop-up is the right place for that,
         because that's where the pass and the borrow live */
      track('session', `${appName}: no opens left`);
      go('intercept');
      return;
    }

    setSession({
      app: appName,
      cap,
      carried,
      charged,
      kind: 'open',
      minutes: setting.minutes,
    });
    goTo('appopen');
  };

  /* They said why and which length they wanted. Rilo keeps both. */
  const startCheckedIn = (appName, { reason, why, mins, length, cost }) => {
    const entry = {
      app: appName,
      reason,
      why,
      promised: mins,
      length,
      cost,
      at: Date.now(),
      date: dateKey,
    };
    setPromise(entry);
    setCheckins((list) => list.concat([entry]).slice(-60));
    track('checkin', `${length} · ${reason === 'custom' ? `custom: ${why}` : reason}`);
    startOpenSession(appName, mins);
  };

  /* the emergency pass: five minutes, no opens spent (§5) */
  const spendEmergencyPass = (appName, why) => {
    if (passesLeft <= 0) return;
    setDay((d) => ({ ...d, passes: (d.passes ?? 0) + 1 }));
    track('pass', why || 'no reason given');
    setSession({
      app: appName,
      cap: PASS_MINUTES,
      carried: 0,
      charged: 0,
      kind: 'pass',
      minutes: settingOf(appName).minutes,
    });
    goTo('appopen');
  };

  /* borrow half an open off tomorrow (§6) */
  const borrowFromTomorrow = (appName) => {
    if (!borrowableFor(appName)) return;
    setDay((d) => ({ ...d, borrowed: { app: appName } }));
    setBorrow({ date: tomorrow(), app: appName });
    track('borrow', `${appName}: ½ open off tomorrow`);
    /* the half open is theirs now — straight to the check-in */
    go('whyopen');
  };

  const finishSession = (appName, minutesUsed) => {
    const used = Math.max(0, minutesUsed);
    const total = session.carried + used;

    if (session.kind === 'open') {
      const spend = opensSpent({
        mins: total,
        minutes: session.minutes,
        strictOn: strict.on,
      });
      const delta = Math.max(0, spend - session.charged);

      setDay((d) => ({
        ...d,
        used: { ...d.used, [appName]: (d.used[appName] ?? 0) + used },
        opensUsed: { ...d.opensUsed, [appName]: (d.opensUsed[appName] ?? 0) + delta },
        /* so a reopen inside two minutes carries this session on */
        lastSession: { app: appName, endedAt: Date.now(), mins: total, charged: spend },
        lastBlockedAt: Date.now(),
        sinceBlocked: 0,
      }));

      track(
        'session',
        `${appName}: ${Math.round(total)}m, cost ${spend} open${spend === 1 ? '' : 's'}`,
      );
    } else {
      /* a pass session spends no opens, and never becomes a continuation —
         the app is already out of opens, so carrying on would be nonsense */
      setDay((d) => ({
        ...d,
        used: { ...d.used, [appName]: (d.used[appName] ?? 0) + used },
        lastSession: null,
        lastBlockedAt: Date.now(),
        sinceBlocked: 0,
      }));
    }

    /* closing early banks the minutes they didn't spend */
    const unspent = Math.max(0, session.cap - used);
    if (unspent >= 1) {
      setStats((st) => ({ ...st, savedMinutes: st.savedMinutes + Math.round(unspent) }));
      track('early', `${appName}: left ${Math.round(unspent)} min on the table`);
      setSavedNote({ app: appName, mins: Math.round(unspent) });
    } else {
      setSavedNote(null);
    }

    /* Did they do what they said? Rilo calls it out when a "quick check"
       turns into the whole open (§4). */
    if (promise) {
      const gone = Math.round(total);
      const over = session.kind === 'open' && gone > promise.promised;
      setCheckins((list) =>
        list.map((c) => (c.at === promise.at ? { ...c, used, gone, over } : c)),
      );
      if (over) {
        track('checkin', `over: said ${promise.promised}m, took ${gone}m`);
        setSavedNote(null);
        setOverNote(
          overLine({
            reason: promise.reason,
            why: promise.why,
            promised: promise.promised,
            gone,
            fmt: fmtMins,
          }),
        );
      }
      setPromise(null);
    }

    goTo('home', 'back');
  };

  /* ---------- ending a day ----------
     The only place XP is handed out. Results, not taps. */
  const [dayResult, setDayResult] = useState(null);

  const endDay = (forceOver = false) => {
    const used = forceOver ? goalMins + 45 : usedTotalToday;
    const res = dayXp({ used, goal: goalMins, streak });

    let gained = res.xp;
    const over = !res.hit;

    /* did they lean on the ways out today? that's the strict-mode signal */
    const leaned = (day.passes ?? 0) > 0 || Boolean(day.borrowed);
    if (leaned) setLeanDays((v) => v + 1);

    /* a week is 7 days; more than 2 bad days and it runs again */
    const daysDone = program.daysDone + 1;
    const daysOver = program.daysOver + (over ? 1 : 0);
    let nextProgram = { ...program, daysDone, daysOver };
    let repeated = false;

    if (daysDone >= 7) {
      if (daysOver > 2) {
        repeated = true;
        nextProgram = { ...program, daysDone: 0, daysOver: 0 };
        track('week', 'repeated');
      } else {
        gained += WEEK_BONUS;
        nextProgram = { ...program, week: program.week + 1, daysDone: 0, daysOver: 0 };
        track('week', 'cleared');
      }
      /* either way a new week means a new step-down */
      offerStepDown(nextProgram.week);
      setLeanDays(0);
      /* once the plan fits and they're living in it, stop tightening */
      if (stepFinished) {
        gained += PLAN_BONUS;
        setStep((s) => ({ ...s, done: true, status: 'idle' }));
      }
    }

    track('day', res.hit ? 'goal hit' : 'went over');

    setStreak(res.streak);
    setProgram(nextProgram);
    setHistory((h) => [...h, { date: day.date, used, goal: goalMins, hit: res.hit }].slice(-30));
    awardXp(gained);

    /* fresh day: opens and the pass reset, unused opens don't carry (§2.7) */
    setDay(freshDay(dateKey));
    collectBorrow();

    setDayResult({
      used,
      goal: goalMins,
      hit: res.hit,
      xp: gained,
      streak: res.streak,
      under: Math.max(0, goalMins - used),
      repeated,
    });
    goTo('daysummary');
  };

  /* Seven clean days in one tap, so a tester can see a week clear and the
     step-down arrive. */
  const runWeek = () => {
    let st = streak;
    let gained = 0;
    const days = [];
    const under = Math.max(0, goalMins - 20);

    for (let i = 0; i < 7; i += 1) {
      const res = dayXp({ used: under, goal: goalMins, streak: st });
      st = res.streak;
      gained += res.xp;
      days.push({ date: dateKey, used: under, goal: goalMins, hit: true });
    }

    gained += WEEK_BONUS;
    const nextWeek = program.week + 1;

    track('week', 'cleared');
    setStreak(st);
    setHistory((h) => [...h, ...days].slice(-30));
    setProgram({ ...program, week: nextWeek, daysDone: 0, daysOver: 0 });
    setLeanDays(0);
    awardXp(gained);
    setDay(freshDay(dateKey));
    collectBorrow();
    offerStepDown(nextWeek);

    setDayResult({
      used: under,
      goal: goalMins,
      hit: true,
      xp: gained,
      streak: st,
      under: 20,
      repeated: false,
    });
    goTo('daysummary');
  };

  /* ---------- time travel (demo) ---------- */

  /* The borrow IOU is the only thing that crosses midnight. The day it's
     due it comes off that app's opens; the midnight after, it's paid. */
  const collectBorrow = () => {
    setBorrow((b) => {
      if (!b.app) return b;
      if (b.date === dateKey) return { date: '', app: '' };
      return { ...b, date: dateKey };
    });
  };

  const skipToMidnight = () => {
    setDay(freshDay(dateKey));
    collectBorrow();
    track('demo', 'skipped to midnight');
  };

  /* Land everything that was waiting out its 24 hours. */
  const skip24h = () => {
    (pending ?? []).forEach(applyPending);
    setPending([]);
    if (strict.on && strict.endingAt) {
      setStrict((st) => ({ ...st, on: false, endingAt: null }));
    }
    if (step.skipAt) setStep((s) => ({ ...s, skipAt: null, status: 'skipped' }));
    track('demo', 'skipped 24 hours');
  };

  /* ---------- strict mode ---------- */
  const strictOn = (days, when) => {
    /* turning it on is instant (§12) */
    setStrict((st) => ({ ...st, on: true, days, when, endingAt: null }));
    track('strict', `on · ${days}d · ${when}`);
  };

  /* turning it off runs for another 24 hours first */
  const strictAskOff = () => {
    setStrict((st) => ({ ...st, endingAt: Date.now() + 24 * 60 * 60 * 1000 }));
    track('strict', 'countdown started');
  };

  const strictKeepOn = () => {
    setStrict((st) => ({ ...st, endingAt: null }));
    track('strict', 'countdown cancelled');
  };

  /* Off right now, no countdown. Rilo asks whether they'd rather wait the
     24 hours out first, but if they say no that's the end of it — being
     unable to leave a setting you chose is a trap, not a feature. */
  const strictOffNow = () => {
    setStrict((st) => ({ ...st, on: false, endingAt: null }));
    track('strict', 'turned off immediately');
  };

  /* ---------- Rilo's plan, and their own (§13) ---------- */
  const makeRiloPlan = () => {
    const out = riloLimits({
      tracked,
      breakdown,
      goalMins,
      hobbies: profileList('hobby'),
      goals: profileList('goal'),
      calendar: weekAhead,
      checkins,
      creator: about.creator,
    });

    /* Rilo tightening things is always instant; if his plan loosens
       something in strict mode, that part waits like anything else. */
    if (strict.on) {
      const loosened = [];
      const instant = {};
      Object.entries(out.settings).forEach(([app, next]) => {
        const prev = settingOf(app);
        if (isLoosening(prev, next)) loosened.push({ app, prev, next });
        else instant[app] = next;
      });
      setAppSettings((s) => ({ ...s, ...instant }));
      if (loosened.length) {
        setPending((list) =>
          (list ?? [])
            .filter((p) => !loosened.some((l) => l.app === p.app))
            .concat(loosened.map((l) => makePending(l))),
        );
      }
    } else {
      setAppSettings((s) => ({ ...s, ...out.settings }));
    }

    setRiloWhy(out.why);
    setRiloLead(out.lead);
    setLimitMode('rilo');
    track('limits', `rilo built a plan · allows ${out.check.allows}m`);
  };

  /* "make your own" starts from a clean slate: nothing is pre-limited, so
     there's nothing to undo first. */
  const makeOwnPlan = () => {
    setAppSettings((s) => {
      const next = { ...s };
      tracked.forEach((app) => {
        if (settingFor(s, app).mode === ALWAYS) return;
        next[app] = { mode: FREE, opens: 3, minutes: 15 };
      });
      return next;
    });
    setRiloWhy({});
    setRiloLead([]);
    setLimitMode('own');
    track('limits', 'made their own');
  };

  /* Ignore taps while a slide is already running. */
  const goTo = (next, dir = 'forward') =>
    setNav((n) => (n.entries.length > 1 ? n : { entries: [n.entries[0], next], dir }));

  /* Heading home with an unlock waiting shows the celebration first.
     Leaving the celebration calls goTo directly so it can't bounce back.

     The paywall also records where it was opened from. Tapping a locked
     feature used to be a one-way door: the blurred breakdown mid-onboarding
     sent you to the paywall, and whichever button you pressed dropped you
     on Home — skipping the rest of the setup. Same from the you tab, where
     a Pro lock cost you your place. Now both the back button and the
     choice return you to where you were. */
  const go = (next, dir = 'forward') => {
    if (next === 'upgrade') setCameFrom(nav.entries[nav.entries.length - 1]);
    goTo(next === 'home' && pendingSkin ? 'levelup' : next, dir);
  };

  /* XP never goes below 0, and a level once earned is never lost.
     Returns true if a Pro unlock is now waiting to be celebrated. */
  const awardXp = (amount) => {
    const next = Math.max(0, xp + amount);
    setXp(next);

    const earned = levelFor(next);
    if (earned <= level) return false;

    const unlocked = skinsUnlockedBetween(level, earned);
    setLevel(earned);
    track('levelup', `level ${earned}`);

    /* past level 10 most levels don't unlock a skin — no celebration then */
    if (unlocked.length === 0) return false;

    /* DEMO: every skin is unlocked for everyone, so everyone gets the
       celebration. With real gating on (lib/levels UNLOCK_ALL = false) this
       is Pro-only: free users level up but never unlock a skin. */
    if (!UNLOCK_ALL && !isPro) return false;

    setPendingSkin(unlocked[0].skin);
    return true;
  };

  const settle = () =>
    setNav((n) => (n.entries.length > 1 ? { entries: [n.entries[1]], dir: n.dir } : n));

  /* A slide settles on the incoming screen's `animationend`. If that event
     never arrives the app is stuck for good: two screens stay mounted and
     `goTo` ignores every tap, because it refuses to start a slide while one
     is running. The event is normally reliable, but it isn't guaranteed —
     an interrupted animation, a backgrounded tab mid-transition, a browser
     that doesn't deliver it. One missed event should not brick the app, so
     this settles anyway shortly after the slide should have finished. */
  useEffect(() => {
    if (nav.entries.length < 2) return undefined;
    const t = setTimeout(settle, 450);
    return () => clearTimeout(t);
    /* settle only reads the setter */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.entries]);

  /* never default to an app they aren't tracking */
  const currentApp = session.app && tracked.includes(session.app) ? session.app : tracked[0] ?? 'the feed';

  /* "pretend you opened X": bump that app's real count for today */
  const openApp = (label) => {
    const fresh = opens.date !== dateKey;
    const counts = fresh ? {} : opens.counts;
    const next = (counts[label] ?? 0) + 1;

    setOpens({ date: dateKey, counts: { ...counts, [label]: next } });
    setSession((s) => ({ ...s, app: label }));

    /* an always-allowed app has no shield and no pop-up — it just opens */
    if (settingOf(label).mode === ALWAYS) {
      setSession({
        app: label,
        cap: 15,
        carried: 0,
        charged: 0,
        kind: 'always',
        minutes: 15,
      });
      goTo('appopen');
      return;
    }

    go('shield');
  };

  const openCount = (opens.date === dateKey ? opens.counts[currentApp] : 0) ?? 0;

  /* The reason screens (bored / tired / a break) still end in a session, and
     a session still costs an open — so they all go through the check-in. */
  const startSession = () => {
    if (settingOf(currentApp).mode === LIMITED) go('whyopen');
    else openApp(currentApp);
  };

  const saidNo = () => {
    setStats((s) => ({
      savedMinutes: s.savedMinutes + SAID_NO_MINUTES,
      saidNo: s.saidNo + 1,
    }));
  };

  const startOver = () => {
    clearState();
    setName(DEFAULT_STATE.name);
    setAbout(DEFAULT_STATE.about);
    setApps(DEFAULT_STATE.apps);
    setTime(DEFAULT_STATE.time);
    setPlan(DEFAULT_STATE.plan);
    setPlanChoice(DEFAULT_STATE.planChoice);
    setXp(DEFAULT_STATE.xp);
    setLevel(DEFAULT_STATE.level);
    setIsPro(DEFAULT_STATE.isPro);
    setPendingSkin(null);
    setChosenRilo(DEFAULT_STATE.chosenRilo);
    setTheme(DEFAULT_STATE.theme);
    setOpens({ date: dateKey, counts: {} });
    setStats({ savedMinutes: 0, saidNo: 0 });
    /* the whole limit system back to factory */
    setAppSettings(DEFAULT_STATE.appSettings);
    setLimitMode(DEFAULT_STATE.limitMode);
    setBorrow(DEFAULT_STATE.borrow);
    setPending([]);
    setStep(DEFAULT_STATE.step);
    setFocus(DEFAULT_STATE.focus);
    setRiloWhy({});
    setRiloLead([]);
    setStrict(DEFAULT_STATE.strict);
    setDay(freshDay(dateKey));
    setHistory([]);
    setStreak(0);
    setLeanDays(0);
    setProgram(DEFAULT_STATE.program);
    setCheckins([]);
    setPromise(null);
    setOverNote('');
    setSavedNote(null);
    setDemoClock(null);
    setSession({ app: null, cap: 5, carried: 0, charged: 0, kind: 'open', minutes: 15 });
    /* straight back to Welcome, no slide — it's a new tester */
    setNav({ entries: ['welcome'], dir: 'forward' });
  };

  if (showResults) {
    return (
      <PhoneFrame>
        <Results />
      </PhoneFrame>
    );
  }

  /* everything the limits screen needs, in one place */
  const limitsProps = {
    skin: chosenRilo,
    tracked,
    appSettings,
    onSetApp: setAppSetting,
    time,
    setTime,
    day,
    check,
    pending,
    onCancelPending: cancelPending,
    strictOn: strict.on,
    limitMode,
    riloWhy,
    riloLead,
    onRiloPlan: makeRiloPlan,
    onOwnPlan: makeOwnPlan,
    pctFor,
    totalOpensFor,
  };

  const render = (screen) => {
    switch (screen) {
      /* Onboarding always meets you as the original Rilo — this is Rilo
         introducing himself, before any skin has been earned or picked. */
      case 'welcome':
        return <Welcome go={go} skin={OG_SKIN} />;
      /* ---------- onboarding, in order ----------
         welcome → name → apps + screen time → crunching → your number →
         what you'd rather → your plan → paywall → home.

         Eight screens, everything before the paywall, and nothing after
         it. The screens that used to live here — how it works, instead,
         the conversation, the about-you review, the hours stepper, the
         calendar, the check-in setup — are either gone or reachable from
         the tabs. Talk is still in the app; it just isn't in the way. */
      case 'name':
        return (
          <Name go={go} name={name} setName={setName} skin={OG_SKIN} next="pickapps" />
        );

      /* from Home: tap Rilo's chat badge */
      case 'talkchat':
        return (
          <Talk
            go={go}
            mode="chat"
            skin={chosenRilo}
            name={name}
            setName={setName}
            setAbout={setAbout}
          />
        );

      case 'pickapps':
        return <PickApps go={go} apps={apps} setApps={setApps} skin={OG_SKIN} />;

      case 'permission':
        return (
          <Permission
            skin={OG_SKIN}
            onAllow={() => {
              setScreenTime(true);
              track('screentime', 'allowed');
              go('crunching');
            }}
            onDeny={() => {
              setScreenTime(false);
              track('screentime', 'denied');
            }}
            onTriedAgain={() => {
              setTriedAgain(true);
              track('screentime', 'tried again');
            }}
            onSkip={() => {
              startFromApps(false);
              go('yournumber');
            }}
          />
        );

      case 'crunching':
        return (
          <Crunching
            skin={OG_SKIN}
            onDone={() => {
              startFromApps(true);
              go('yournumber');
            }}
          />
        );

      case 'yournumber':
        return (
          <YourNumber
            go={go}
            skin={OG_SKIN}
            breakdown={breakdown}
            isPro={isPro}
            next="rather"
          />
        );

      case 'rather':
        return (
          <Rather
            skin={OG_SKIN}
            breakdown={breakdown}
            picked={rather}
            setPicked={setRather}
            /* the only question about them — folded into `about` here, in
               the same shape the two screens it replaced used */
            go={(next, extras = []) => {
              setAbout((a) => applyRather(a, rather, extras));
              buildPlanFor(rather);
              track('rather', rather.join(', ') || 'nothing picked');
              go(next);
            }}
            next="yourplan"
          />
        );

      case 'yourplan':
        return (
          <YourPlan
            go={go}
            skin={OG_SKIN}
            tracked={tracked}
            appSettings={appSettings}
            instead={insteadPlan({ picks: rather, apps: watched })}
            goalMins={goalMins}
            onEdit={() => go('limitsonboard')}
            next="paywall"
          />
        );

      /* the "edit" link on the plan — the limits screen, and back */
      case 'limitsonboard':
        return <Limits {...limitsProps} go={go} onContinue={() => go('yourplan', 'back')} />;
      case 'limits':
        return <Limits {...limitsProps} go={go} />;

      case 'paywall':
      case 'upgrade':
        return (
          <Paywall
            go={go}
            plan={plan}
            setPlan={setPlan}
            onChoose={(which) => {
              const trial = which === 'start free trial';
              track('paywall', which);
              setPlanChoice(trial ? 'trial' : 'free');
              /* prototype: the trial button is what makes someone Pro */
              setIsPro(trial);
            }}
            /* Step 8 ends at home — nothing is set up after it. But the
               same paywall opened from a locked feature has to return to
               where it came from, or looking at what Pro costs throws away
               whatever you were doing. */
            onBack={
              screen === 'paywall'
                ? () => goTo('yourplan', 'back')
                : () => goTo(cameFrom ?? 'home', 'back')
            }
            nextFor={() => (screen === 'paywall' ? 'home' : cameFrom ?? 'home')}
          />
        );

      /* "when should i check in?" — from the you tab now, not onboarding */
      case 'nighttime':
        return (
          <NightTime
            go={go}
            skin={OG_SKIN}
            night={night}
            setNight={(n) => {
              setNight(n);
              track('night', `check-in set for ${n.at}`);
            }}
            next="home"
          />
        );

      /* daily use */
      case 'home':
        return (
          <Home
            go={go}
            name={name}
            about={about}
            xp={xp}
            level={level}
            skin={chosenRilo}
            onOpenApp={openApp}
            tracked={tracked}
            appSettings={appSettings}
            lockOf={lockOf}
            totalOpensFor={totalOpensFor}
            usedToday={usedTotalToday}
            goalMins={goalMins}
            streak={streak}
            savedNote={savedNote}
            onClearSavedNote={() => setSavedNote(null)}
            isPro={isPro}
            riloMood={riloMood}
            riloNote={riloNote}
            overNote={overNote}
            onClearOverNote={() => setOverNote('')}
            passesLeft={passesLeft}
            backToday={back.today}
            canCheckIn={canCheckIn}
            checkInDue={checkInDue}
            checkedInToday={checkedInToday}
            onNightCheckIn={() => go('nightcheckin')}
            strictOn={strict.on}
            /* the weekly step-down surfaces here */
            stepApp={stepApp}
            stepProposal={stepProposal}
            stepPhase={stepPhase}
            stepDone={stepFinished}
            stepSkipAt={step.skipAt}
            stepSwappable={stepSwappable}
            onStepAccept={() => acceptStepDown()}
            onStepSkip={skipStepDown}
            onStepSwap={swapStepDown}
            suggestStrict={
              !strict.on &&
              strict.suggestedOn !== dateKey &&
              shouldSuggestStrict(history, leanDays)
            }
            onStrictYes={() => {
              setStrict((st) => ({ ...st, suggestedOn: dateKey }));
              strictOn(7, 'all');
            }}
            onStrictNo={() => {
              setStrict((st) => ({
                ...st,
                suggestedOn: dateKey,
                declined: (st.declined ?? 0) + 1,
              }));
              track('strict', 'not now');
            }}
          />
        );
      case 'daysummary':
        return (
          <DaySummary
            skin={chosenRilo}
            result={dayResult}
            onDone={() => {
              setDayResult(null);
              goTo('home', 'back');
            }}
          />
        );

      case 'whyopen': {
        const setting = settingOf(currentApp);
        const carry = continuationFor(currentApp);
        return (
          <WhyOpen
            app={currentApp}
            skin={chosenRilo}
            minutes={setting.minutes}
            opensTotal={totalOpensFor(currentApp)}
            opensUsed={opensUsedFor(currentApp, day)}
            /* carrying on a recent session gets back what it already cost */
            opensLeft={availOf(currentApp) + (carry?.charged ?? 0)}
            strictOn={strict.on}
            creator={about.creator}
            /* everything he learned in onboarding, so he can argue with
               something specific instead of nagging in general */
            hobbies={profileList('hobby')}
            goals={profileList('goal')}
            schedule={schedulePlan.rows ?? []}
            nowMins={nowMins}
            onStart={(pick) => startCheckedIn(currentApp, pick)}
            onInstead={(option) => {
              /* they took the alternative — that's the whole point of the
                 app, so it banks the time and the xp */
              track('instead', `${option.id}: ${option.label}`);
              saidNo();
              awardXp(option.id === 'break' ? 5 : 10);
              go(option.id === 'break' ? 'break' : 'progress');
            }}
            onNevermind={() => {
              track('checkin', 'never mind');
              saidNo();
              go('home', 'back');
            }}
          />
        );
      }

      case 'nightcheckin':
        return (
          <NightCheckIn
            skin={chosenRilo}
            onDone={({ said, tasks }) => {
              /* keep the time they chose — only the day's answers change */
              setNight((n) => ({ ...n, date: dateKey, said, tasks }));
              /* tomorrow's tasks go straight onto the plan */
              setSchedulePlan((sp) => ({
                mode: sp.mode,
                rows: (sp.rows ?? []).concat(
                  tasks.map((t) => ({ at: '', title: t.title, note: t.note })),
                ),
              }));
              track('night', `${tasks.length} task(s) for tomorrow`);
              go('plan');
            }}
            onSkip={() => {
              track('night', 'not tonight');
              go('home', 'back');
            }}
          />
        );

      /* the you tab, not onboarding */
      case 'calendar':
        return (
          <CalendarConnect
            go={go}
            skin={OG_SKIN}
            apps={watched}
            calendar={calendar}
            setCalendar={(next) => {
              setCalendar(next);
              track('calendar', next.on ? `connected ${next.which}` : 'disconnected');
            }}
          />
        );

      case 'sharecard':
        return (
          <ShareCard
            go={go}
            skin={chosenRilo}
            level={level}
            streak={streak}
            week={back.week}
            total={back.total}
          />
        );

      case 'buddies':
        return (
          <Buddies
            go={go}
            skin={chosenRilo}
            buddies={buddies}
            setBuddies={setBuddies}
            myMood={riloMood}
            myStreak={streak}
          />
        );

      case 'shield':
        return (
          <Shield
            app={currentApp}
            skin={chosenRilo}
            lock={lockOf(currentApp)}
            minutes={settingOf(currentApp).minutes}
            opensTotal={totalOpensFor(currentApp)}
            opensUsed={opensUsedFor(currentApp, day)}
            schedule={schedule}
            onTalk={() => setBanner(true)}
            onClose={() => go('home', 'back')}
          />
        );

      case 'appopen':
        return (
          <AppOpen
            app={currentApp}
            minutes={session.cap}
            carried={session.carried}
            kind={session.kind}
            perOpen={session.minutes}
            onFinish={(mins) => finishSession(currentApp, mins)}
          />
        );

      case 'intercept': {
        const lock = lockOf(currentApp);
        const setting = settingOf(currentApp);
        return (
          <Intercept
            go={go}
            app={currentApp}
            skin={chosenRilo}
            openCount={Math.max(1, openCount)}
            opensToday={Math.ceil(opensUsedFor(currentApp, day))}
            lock={lock}
            minutes={setting.minutes}
            opensTotal={totalOpensFor(currentApp)}
            opensUsed={opensUsedFor(currentApp, day)}
            opensLeft={availOf(currentApp)}
            strictOn={strict.on}
            passesLeft={passesLeft}
            canBorrow={borrowableFor(currentApp)}
            onReason={(reason) => {
              track('reason', reason);
              if (reason === 'never mind') saidNo();
            }}
            onOpen={() => go('whyopen')}
            onPass={(why) => spendEmergencyPass(currentApp, why)}
            onBorrow={() => borrowFromTomorrow(currentApp)}
          />
        );
      }

      case 'suggestion':
        return (
          <Suggestion
            go={go}
            about={about}
            app={currentApp}
            onStart={startSession}
            onSaidNo={() => {
              saidNo();
              awardXp(10); /* did a hobby instead */
              go('progress');
            }}
            skin={chosenRilo}
          />
        );
      case 'tired':
        return (
          <Tired
            go={go}
            onStart={startSession}
            onSaidNo={() => {
              saidNo();
              awardXp(5); /* put the phone down */
              go('progress');
            }}
            skin={chosenRilo}
          />
        );
      case 'break':
        return <Break go={go} onStart={startSession} onSaidNo={saidNo} skin={chosenRilo} />;
      case 'needit':
        return (
          <NeedIt
            go={go}
            app={currentApp}
            onStart={startSession}
            onSaidNo={saidNo}
            skin={chosenRilo}
          />
        );

      case 'plan':
        /* today's plan is rilo pro */
        return (
          <Plan
            go={go}
            skin={chosenRilo}
            locked={!isPro}
            onUpgrade={() => go('upgrade')}
            schedule={schedulePlan}
            setSchedule={setSchedulePlan}
            hobbies={profileList('hobby')}
            goals={profileList('goal')}
            school={school}
            bedtime={bedtime}
            scrollMins={goalMins}
            weekAhead={weekAhead}
            /* the plan check belongs on the plan screen too (§9) */
            check={check}
            onLimits={() => go('limits')}
          />
        );
      case 'progress':
        return (
          <Progress
            go={go}
            xp={xp}
            skin={chosenRilo}
            level={level}
            breakdown={breakdown}
            program={program}
            goalMins={goalMins}
            usedToday={usedTotalToday}
            history={history}
            streak={streak}
            stats={stats}
            isPro={isPro}
            back={back}
            backSays={backSays}
            checkins={checkins}
            check={check}
          />
        );
      case 'pickrilo':
        return (
          <PickRilo
            go={go}
            chosenRilo={chosenRilo}
            setChosenRilo={setChosenRilo}
            isPro={isPro}
            level={level}
            onPreview={(look) => track('rilo', look)}
            onLockedTap={(look) => track('locked', look)}
          />
        );
      case 'you':
        return (
          <You
            go={go}
            name={name}
            about={about}
            setAbout={setAbout}
            apps={apps}
            setApps={setApps}
            time={time}
            setTime={setTime}
            check={check}
            tracked={tracked}
            appSettings={appSettings}
            pendingCount={(pending ?? []).length}
            bedtime={bedtime}
            setBedtime={setBedtime}
            school={school}
            setSchool={setSchool}
            focus={focus}
            setFocus={setFocus}
            night={night}
            setNight={(n) => {
              setNight(n);
              track('night', `check-in moved to ${n.at}`);
            }}
            checkedInToday={checkedInToday}
            buddyCount={(buddies.friends ?? []).length}
            calendarOn={calendar.on}
            xp={xp}
            level={level}
            isPro={isPro}
            chosenRilo={chosenRilo}
            theme={theme}
            onTheme={(id) => {
              setTheme(id);
              track('theme', id);
            }}
            onLockedTheme={(id) => {
              track('locked', `theme ${id}`);
              go('upgrade');
            }}
            stats={stats}
            streak={streak}
            strict={strict}
            onStrictOn={strictOn}
            onStrictAskOff={strictAskOff}
            onStrictKeepOn={strictKeepOn}
            onStrictOffNow={strictOffNow}
            onNextDay={() => endDay(false)}
            onNextDayOver={() => endDay(true)}
            onNextWeek={runWeek}
            onStartOver={startOver}
            onDemoXp={(amount = 500) => {
              if (awardXp(amount)) go('levelup');
            }}
          />
        );

      case 'levelup':
        return (
          <LevelUp
            skin={pendingSkin ?? chosenRilo}
            level={level}
            onWear={() => {
              if (pendingSkin) setChosenRilo(pendingSkin);
              setPendingSkin(null);
              goTo('home', 'back');
            }}
            onLater={() => {
              setPendingSkin(null);
              goTo('home', 'back');
            }}
          />
        );

      default:
        return <Welcome go={go} skin={OG_SKIN} />;
    }
  };

  const sliding = nav.entries.length === 2;

  return (
    <ThemeContext.Provider value={themeInfo(theme)}>
    <PhoneFrame>
      {banner && (
        <Banner
          skin={chosenRilo}
          onTap={() => {
            setBanner(false);
            goTo('intercept');
          }}
        />
      )}
      {nav.entries.map((screen, i) => {
        const incoming = sliding && i === 1;
        const outgoing = sliding && i === 0;

        let cls = 'screen';
        if (incoming) cls += nav.dir === 'forward' ? ' screen-enter-right' : ' screen-enter-left';
        if (outgoing) cls += nav.dir === 'forward' ? ' screen-exit-left' : ' screen-exit-right';

        return (
          <div
            key={screen}
            className={cls}
            /* animationend bubbles, so only react to this element's own slide */
            onAnimationEnd={
              incoming
                ? (e) => {
                    if (e.target === e.currentTarget) settle();
                  }
                : undefined
            }
          >
            {render(screen)}
          </div>
        );
      })}

      {/* DEMO ONLY: the tester's remote control */}
      {nav.entries[nav.entries.length - 1] !== 'appopen' && (
        <DemoPanel
          demoClock={demoClock}
          used={usedTotalToday}
          goal={goalMins}
          fmtMins={fmtMins}
          tracked={tracked}
          appSettings={appSettings}
          passesLeft={passesLeft}
          canBorrow={borrowableFor(currentApp)}
          strictOn={strict.on}
          pendingCount={(pending ?? []).length}
          onClock={(at) => {
            setDemoClock(at);
            track('demo', `clock ${at ?? 'real'}`);
          }}
          onUsage={(how) => {
            const target =
              how === 'under'
                ? Math.round(goalMins * 0.5)
                : how === 'close'
                  ? Math.round(goalMins * 0.92)
                  : Math.round(goalMins * 1.4);
            /* put it on the first app that actually counts toward the day */
            const first =
              tracked.find((a) => countsTowardDay(appSettings, a)) ?? tracked[0] ?? 'tiktok';
            setDay((d) => ({ ...d, used: { [first]: target } }));
            track('demo', `usage ${how}`);
          }}
          /* run a real session of a chosen length on a chosen app */
          onSimulate={(app, mins) => {
            setSession((s) => ({ ...s, app }));
            const setting = settingOf(app);
            const carry = continuationFor(app);
            const carried = carry?.mins ?? 0;
            const charged = carry?.charged ?? 0;
            const avail = availOf(app) + charged;
            const full = sessionCapMins({
              avail,
              minutes: setting.minutes,
              strictOn: strict.on,
            });

            if (full - carried <= 0) {
              track('demo', `${app}: no room, shield instead`);
              openApp(app);
              return;
            }

            const run = Math.min(mins, full - carried);
            setSession({
              app,
              cap: run,
              carried,
              charged,
              kind: 'open',
              minutes: setting.minutes,
            });
            /* finish it immediately at that length, so a tester doesn't sit
               through fifteen real minutes to see what it costs */
            setDay((d) => {
              const total = carried + run;
              const spend = opensSpent({
                mins: total,
                minutes: setting.minutes,
                strictOn: strict.on,
              });
              const delta = Math.max(0, spend - charged);
              return {
                ...d,
                used: { ...d.used, [app]: (d.used[app] ?? 0) + run },
                opensUsed: { ...d.opensUsed, [app]: (d.opensUsed[app] ?? 0) + delta },
                lastSession: { app, endedAt: Date.now(), mins: total, charged: spend },
                lastBlockedAt: Date.now(),
                sinceBlocked: 0,
              };
            });
            track('demo', `${app}: simulated ${mins}m`);
          }}
          onPass={(app) => {
            setSession((s) => ({ ...s, app }));
            spendEmergencyPass(app, 'demo panel');
          }}
          onBorrow={(app) => {
            setSession((s) => ({ ...s, app }));
            borrowFromTomorrow(app);
          }}
          onToggleStrict={() => {
            if (strict.on) strictAskOff();
            else strictOn(strict.days ?? 7, strict.when ?? 'all');
          }}
          onSkip24h={skip24h}
          onMidnight={skipToMidnight}
          onNextDay={() => endDay(false)}
          onNextWeek={runWeek}
          onOpenBlocked={() => openApp(tracked[0] ?? 'tiktok')}
          onLimits={() => go('limits')}
          onShareCard={() => go('sharecard')}
          onBuddies={() => go('buddies')}
          onNight={() => go('nightcheckin')}
          onNightTime={() => go('nighttime')}
          onCalendar={() => go('calendar')}
          onReset={startOver}
        />
      )}
    </PhoneFrame>
    </ThemeContext.Provider>
  );
}

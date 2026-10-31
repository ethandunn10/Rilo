/* Rilo — screen router.
   Screens slide in left/right like an iPhone push/pop: the incoming screen
   comes in from the edge while the outgoing one slides off with a parallax.

   Name, onboarding answers, XP, chosen Rilo, the per-app "nth time today"
   counts and the You stats live here and are saved to localStorage, so a
   refresh doesn't reset everything. Tester taps are counted in lib/track.js
   and shown on the hidden /results screen. */

import { useEffect, useState } from 'react';
import PhoneFrame from './components/PhoneFrame';

import Welcome from './screens/Welcome';
import HowItWorks from './screens/HowItWorks';
import Instead from './screens/Instead';
import AboutYou from './screens/AboutYou';
import Talk from './screens/Talk';
import PickApps from './screens/PickApps';
import TimeBack from './screens/TimeBack';
import Paywall from './screens/Paywall';
import Permission from './screens/Permission';
import Crunching from './screens/Crunching';
import TimeGoes from './screens/TimeGoes';
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
import Timer from './screens/Timer';
import CheckIn from './screens/CheckIn';
import Plan from './screens/Plan';
import Progress from './screens/Progress';
import PickRilo from './screens/PickRilo';
import You from './screens/You';
import LevelUp from './screens/LevelUp';
import Results from './screens/Results';

import { loadState, saveState, clearState, DEFAULT_STATE, today } from './lib/storage';
import { track } from './lib/track';
import { pickedApps } from './lib/apps';
import { HOBBIES, GOALS } from './lib/profile';
import {
  buildBreakdown,
  hoursToMins,
  weekGoals,
  limitsFor,
  fmtMins,
  PASS_MINUTES,
  BREAK_EARNED_AFTER,
  dayXp,
  WEEK_BONUS,
  PLAN_BONUS,
  shouldSuggestStrict,
  weeksFor,
  passesFor,
  watchedFor,
} from './lib/plan';
import { levelFor, skinsUnlockedBetween, XP, UNLOCK_ALL } from './lib/levels';
/* ---- add-ons (rilo-addons-test) ---- */
import WhyOpen from './screens/WhyOpen';
import ShareCard from './screens/ShareCard';
import Buddies from './screens/Buddies';
import DemoPanel from './components/DemoPanel';
import {
  moodForUsage,
  moodNote,
  passesAfterGoodDay,
  timeBack,
  lockReason,
  dayIndexOf,
  toMins,
  WEEKLY_PASS_MAX,
} from './lib/addons';
import { overLine, comparisonFor, calendarPlan, DEMO_CALENDAR } from './demo/mockAI';
import NightCheckIn from './screens/NightCheckIn';
import CalendarConnect from './screens/CalendarConnect';
import { ThemeContext, themeInfo } from './lib/themes';

/* the hidden results screen: /results, or #results if rewrites aren't on */
function wantsResults() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === '/results' || window.location.hash === '#results';
}

/* How much time saying no is worth. A doom-scroll block is treated as 15
   minutes, so refusing outright banks 15, finishing a shorter session banks
   whatever you didn't spend, and taking 5 more costs 5. */
const BLOCK_MINUTES = 15;

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
  const [pace, setPace] = useState(saved.pace);
  const [sessionMins, setSessionMins] = useState(saved.sessionMins);

  const choosePace = (id) => {
    setPace(id);
    /* a shorter plan can't leave them on a week that no longer exists */
    setProgram((p) => ({ ...p, week: Math.min(p.week, weeksFor(id)) }));
    track('plan', `pace: ${id}`);
  };
  const chooseSession = (mins) => {
    setSessionMins(mins);
    track('plan', `${mins} min sittings`);
  };
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
  const [extras, setExtras] = useState(saved.extras);
  const [stats, setStats] = useState(saved.stats);

  /* ---------- screen time + the 30-day plan ---------- */
  const [screenTime, setScreenTime] = useState(saved.screenTime);
  const [triedAgain, setTriedAgain] = useState(saved.triedAgain);
  const [breakdown, setBreakdown] = useState(saved.breakdown);
  const [program, setProgram] = useState(saved.program);
  const [day, setDay] = useState(saved.day);
  const [history, setHistory] = useState(saved.history);
  const [streak, setStreak] = useState(saved.streak);
  const [fiveMoreDays, setFiveMoreDays] = useState(saved.fiveMoreDays);
  const [strict, setStrict] = useState(saved.strict);

  /* ---------- add-ons (rilo-addons-test) ---------- */
  const [checkins, setCheckins] = useState(saved.checkins);
  const [passBank, setPassBank] = useState(saved.passBank);
  const [bedtime, setBedtime] = useState(saved.bedtime);
  const [school, setSchool] = useState(saved.school);
  const [buddies, setBuddies] = useState(saved.buddies);
  const [planMode, setPlanMode] = useState(saved.planMode);
  /* today's schedule on the plan tab */
  const [schedulePlan, setSchedulePlan] = useState(saved.schedule);
  const [calendar, setCalendar] = useState(saved.calendar);
  const [night, setNight] = useState(saved.night);
  /* DEMO ONLY: a fake clock so bedtime and school can be tested */
  const [demoClock, setDemoClock] = useState(saved.demoClock);
  /* the promise they made on the check-in, for this session */
  const [promise, setPromise] = useState(null);
  /* a pass they just earned, celebrated once */
  const [passWon, setPassWon] = useState(false);
  /* "you said 5 minutes for messages. it has been 22." */
  const [overNote, setOverNote] = useState('');

  /* the app + length of the session being "opened" right now */
  const [session, setSession] = useState({ app: null, minutes: 5 });
  /* the iOS notification Rilo sends from the shield */
  const [banner, setBanner] = useState(false);
  /* "you closed 7 min early" — shown on Home once, after a short session */
  const [savedNote, setSavedNote] = useState(null);
  /* came through Talk in onboarding → About you says "here's what i got" */
  const [talked, setTalked] = useState(false);

  useEffect(() => {
    saveState({
      name, about, apps, time, pace, sessionMins, plan, planChoice, isPro,
      xp, level, chosenRilo, theme, opens, extras, stats,
      screenTime, triedAgain, breakdown, program, day, history, streak,
      fiveMoreDays, strict,
      checkins, passBank, bedtime, school, buddies, planMode, demoClock,
      schedule: schedulePlan,
      calendar,
      night,
    });
  }, [name, about, apps, time, pace, sessionMins, plan, planChoice, isPro, xp, level, chosenRilo, theme, opens,
      extras, stats, screenTime, triedAgain, breakdown, program, day, history, streak,
      fiveMoreDays, strict, checkins, passBank, bedtime, school, buddies, planMode,
      demoClock, schedulePlan, calendar, night]);

  /* The web can't read real Screen Time, so the baseline comes from the
     hours they gave on Your time back (5h if they never said). */
  const makeBreakdown = (allowed) => {
    const picked = watchedFor(pickedApps(apps), isPro);
    const total = hoursToMins(time.now || 5);
    setBreakdown(buildBreakdown(picked, total, allowed));
  };

  /* Blocking another app, or changing their hours, changes where the time
     goes — so the breakdown is rebuilt instead of going stale. */
  const pickedKey = watchedFor(pickedApps(apps), isPro).join(',');
  useEffect(() => {
    if (screenTime === null || screenTime === undefined) return;
    makeBreakdown(screenTime === true);
    /* makeBreakdown reads the same values these deps track */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedKey, time.now, screenTime, isPro]);

  /* ---------- this week's numbers ----------
     Everything the shield and the pop-up need: the goal for the week they're
     on, the per-app time and open limits, and what's left of each today. */
  const startMins = hoursToMins(time.now || 5);
  /* Free is one flat daily limit, so there's no plan to step down and
     only one week. Pro gets the 30-day plan. */
  const planWeeks = isPro ? weeksFor(pace) : 1;
  const goalsByWeek = isPro
    ? weekGoals(startMins, hoursToMins(time.goal), pace)
    : [hoursToMins(time.goal)];
  const weekGoal = goalsByWeek[Math.min(program.week, planWeeks) - 1];

  const limits = breakdown
    ? limitsFor(breakdown, startMins, weekGoal, strict.on, sessionMins)
    : [];

  const limitFor = (app) => limits.find((l) => l.app === app) ?? null;

  const usedTotalToday = Object.values(day.used).reduce((n, m) => n + m, 0);

  /* ---------- add-ons: clock, locks, mood, time back ---------- */
  /* DEMO ONLY: demoClock stands in for the phone's real clock */
  const now = new Date();
  const nowMins = demoClock ? toMins(demoClock) : now.getHours() * 60 + now.getMinutes();
  const schedule = lockReason({ bedtime, school, nowMins, dayIndex: dayIndexOf(now) });
  const asleep = schedule.kind === 'bedtime';

  const minsSinceBlocked = day.lastBlockedAt
    ? Math.round((Date.now() - day.lastBlockedAt) / 60000)
    : 999;

  const riloMood = moodForUsage({
    used: usedTotalToday,
    goal: weekGoal,
    sinceBlockedMins: minsSinceBlocked,
    asleep,
  });
  const riloNote = moodNote({
    used: usedTotalToday,
    goal: weekGoal,
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

  const passesLeft = Math.max(0, (passBank.left ?? 1) - (day.passes ?? 0));

  /* the thirty seconds at night: evening, and not already done today */
  const askTonight = nowMins >= 20 * 60 && night.date !== today();

  /* what the calendar means for the week ahead */
  const weekAhead = calendar.on ? calendarPlan(DEMO_CALENDAR, watched) : [];

  const leftFor = (app) => {
    /* Free has no per-app allowance — the whole day is one pot, shared by
       every app they block, and nothing counts opens. */
    if (!isPro) {
      const minsLeft = Math.max(0, weekGoal - usedTotalToday);
      return { opens: Infinity, minutes: minsLeft, locked: minsLeft <= 0, shared: true };
    }
    const lim = limitFor(app);
    if (!lim) return { opens: 0, minutes: 0, locked: true };
    const opensUsed = day.opens[app] ?? 0;
    const minsUsed = day.used[app] ?? 0;
    const opensLeft = Math.max(0, lim.opens - opensUsed);
    const minsLeft = Math.max(0, lim.minutes - minsUsed);
    return {
      opens: opensLeft,
      minutes: minsLeft,
      /* whichever runs out first locks it for the day */
      locked: opensLeft <= 0 || minsLeft <= 0,
    };
  };

  /* Spending an open: the session runs, then the minutes land on the day. */
  const startSessionFor = (appName, minutes) => {
    setDay((d) => ({
      ...d,
      opens: { ...d.opens, [appName]: (d.opens[appName] ?? 0) + 1 },
    }));
    setSession({ app: appName, minutes });
    goTo('appopen');
  };

  /* They said why and for how long. Rilo keeps both. */
  const startCheckedIn = (appName, { reason, why, mins }) => {
    const entry = { app: appName, reason, why, promised: mins, at: Date.now(), date: today() };
    setPromise(entry);
    setCheckins((list) => list.concat([entry]).slice(-60));
    track('checkin', reason === 'custom' ? `custom: ${why}` : reason);
    startSessionFor(appName, mins);
  };

  const finishSession = (appName, minutesUsed) => {
    /* closing early doesn't spend the rest of the sitting — those minutes
       stay in today's budget, so they get another go later. */
    const unspent = Math.max(0, session.minutes - minutesUsed);
    setDay((d) => ({
      ...d,
      used: { ...d.used, [appName]: (d.used[appName] ?? 0) + minutesUsed },
      /* when they last had a blocked app open, for the "earn it" rule */
      lastBlockedAt: Date.now(),
      sinceBlocked: 0,
    }));
    if (unspent > 0) {
      setStats((st) => ({ ...st, savedMinutes: st.savedMinutes + unspent }));
      track('early', `${appName}: left ${unspent} min on the table`);
      setSavedNote({ app: appName, mins: unspent });
    } else {
      setSavedNote(null);
    }

    /* did they keep the promise they made on the way in? */
    if (promise) {
      const gone = Math.round((Date.now() - promise.at) / 60000);
      const over = gone > promise.promised;
      setCheckins((list) =>
        list.map((c) => (c.at === promise.at ? { ...c, used: minutesUsed, gone, over } : c)),
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

  const useEmergencyPass = (appName, why) => {
    setDay((d) => ({ ...d, passes: (d.passes ?? 0) + 1 }));
    track('pass', why || 'no reason given');
    startSessionFor(appName, PASS_MINUTES);
  };

  const tapFiveMore = (alreadyUsed) => {
    track('fivemore', alreadyUsed ? 'blocked (second time)' : 'used');
    if (alreadyUsed) return;
    setDay((d) => {
      const n = (d.fiveMore ?? 0) + 1;
      if (n === 2) setFiveMoreDays((v) => v + 1);
      return { ...d, fiveMore: n };
    });
  };

  /* ---------- ending a day ----------
     The only place XP is handed out. Results, not taps. */
  const [dayResult, setDayResult] = useState(null);

  const endDay = (forceOver = false) => {
    const used = forceOver ? weekGoal + 45 : usedTotalToday;
    const res = dayXp({ used, goal: weekGoal, streak });

    let gained = res.xp;
    const over = !res.hit;

    /* a day under goal earns an emergency pass, up to the weekly cap */
    if (res.hit) {
      setPassBank((b) => {
        const next = passesAfterGoodDay(b.left ?? 1);
        if (next > (b.left ?? 1)) setPassWon(true);
        return { ...b, left: next };
      });
      track('pass', 'earned one by hitting the goal');
    }

    /* a week is 7 days; more than 2 bad days and it runs again */
    const daysDone = program.daysDone + 1;
    const daysOver = program.daysOver + (over ? 1 : 0);
    let nextProgram = { ...program, daysDone, daysOver };
    let repeated = false;

    if (daysDone >= 7) {
      if (daysOver > 2) {
        repeated = true;
        nextProgram = {
          ...program,
          daysDone: 0,
          daysOver: 0,
          repeats: program.repeats + 1,
        };
        track('week', 'repeated');
      } else {
        gained += WEEK_BONUS;
        const nextWeek = program.week + 1;
        const finished = nextWeek > planWeeks;
        if (finished) gained += PLAN_BONUS;
        nextProgram = {
          ...program,
          week: finished ? planWeeks : nextWeek,
          daysDone: 0,
          daysOver: 0,
          done: finished,
        };
        track('week', finished ? 'plan finished' : 'week cleared');
      }
      setFiveMoreDays(0);
    }

    track('day', res.hit ? 'goal hit' : 'went over');

    setStreak(res.streak);
    setProgram(nextProgram);
    setHistory((h) => [...h, { date: day.date, used, goal: weekGoal, hit: res.hit }].slice(-30));
    awardXp(gained);

    /* fresh day */
    setDay({
      date: today(),
      used: {},
      opens: {},
      passes: 0,
      fiveMore: 0,
      sinceBlocked: 999,
    });

    setDayResult({
      used,
      goal: weekGoal,
      hit: res.hit,
      xp: gained,
      streak: res.streak,
      under: Math.max(0, weekGoal - used),
      repeated,
    });
    goTo('daysummary');
  };

  /* Seven clean days in one tap, so a tester can see a week clear. */
  const runWeek = () => {
    let st = streak;
    let prog = program;
    let gained = 0;
    const days = [];

    for (let i = 0; i < 7; i += 1) {
      const res = dayXp({ used: Math.max(0, weekGoal - 20), goal: weekGoal, streak: st });
      st = res.streak;
      gained += res.xp;
      days.push({ date: today(), used: Math.max(0, weekGoal - 20), goal: weekGoal, hit: true });
      prog = { ...prog, daysDone: prog.daysDone + 1 };
    }

    /* a full clean week clears it */
    gained += WEEK_BONUS;
    const nextWeek = prog.week + 1;
    const finished = nextWeek > planWeeks;
    if (finished) gained += PLAN_BONUS;

    track('week', finished ? 'plan finished' : 'week cleared');
    setStreak(st);
    setHistory((h) => [...h, ...days].slice(-30));
    setProgram({
      ...prog,
      week: finished ? planWeeks : nextWeek,
      daysDone: 0,
      daysOver: 0,
      done: finished,
    });
    setFiveMoreDays(0);
    awardXp(gained);
    setDay({ date: today(), used: {}, opens: {}, passes: 0, fiveMore: 0, sinceBlocked: 999 });

    setDayResult({
      used: Math.max(0, weekGoal - 20),
      goal: weekGoal,
      hit: true,
      xp: gained,
      streak: st,
      under: 20,
      repeated: false,
    });
    goTo('daysummary');
  };

  /* ---------- strict mode ---------- */
  const strictOn = (days, when) => {
    setStrict((st) => ({ ...st, on: true, days, when, endingAt: null }));
    track('strict', `on · ${days}d · ${when}`);
  };

  /* turning it off runs for another 24 hours first */
  const strictAskOff = () => {
    const at = Date.now() + 24 * 60 * 60 * 1000;
    setStrict((st) => ({ ...st, endingAt: at }));
    track('strict', 'countdown started');
  };

  const strictKeepOn = () => {
    setStrict((st) => ({ ...st, endingAt: null }));
    track('strict', 'countdown cancelled');
  };

  /* the 24 hours are up */
  useEffect(() => {
    if (!strict.on || !strict.endingAt) return;
    const wait = strict.endingAt - Date.now();
    if (wait <= 0) {
      setStrict((st) => ({ ...st, on: false, endingAt: null }));
      return;
    }
    const t = setTimeout(
      () => setStrict((st) => ({ ...st, on: false, endingAt: null })),
      Math.min(wait, 2 ** 31 - 1),
    );
    return () => clearTimeout(t);
  }, [strict.on, strict.endingAt]);

  /* Ignore taps while a slide is already running. */
  const goTo = (next, dir = 'forward') =>
    setNav((n) => (n.entries.length > 1 ? n : { entries: [n.entries[0], next], dir }));

  /* Heading home with an unlock waiting shows the celebration first.
     Leaving the celebration calls goTo directly so it can't bounce back. */
  const go = (next, dir = 'forward') =>
    goTo(next === 'home' && pendingSkin ? 'levelup' : next, dir);

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

  /* never default to an app they didn't pick */
  const watched = pickedApps(apps);
  const currentApp = session.app && apps.on[session.app] ? session.app : watched[0] ?? 'the feed';

  /* "pretend you opened X": bump that app's real count for today */
  const openApp = (label) => {
    const dayKey = today();
    const fresh = opens.date !== dayKey;
    const counts = fresh ? {} : opens.counts;
    const next = (counts[label] ?? 0) + 1;

    setOpens({ date: dayKey, counts: { ...counts, [label]: next } });
    setSession({ app: label, minutes: sessionMins });
    go('shield');
  };

  const openCount = (opens.date === today() ? opens.counts[currentApp] : 0) ?? 0;

  /* how many times they've already taken "5 more" today */
  const extrasToday = extras.date === today() ? extras.count : 0;

  const startSession = (minutes) => {
    setSession((s) => ({ app: s.app ?? currentApp, minutes }));
    go('timer');
  };

  const saidNo = () => {
    setStats((s) => ({
      savedMinutes: s.savedMinutes + BLOCK_MINUTES,
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
    setOpens({ date: today(), counts: {} });
    setExtras({ date: today(), count: 0 });
    setStats({ savedMinutes: 0, saidNo: 0 });
    setSession({ app: null, minutes: 5 });
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

  const render = (screen) => {
    switch (screen) {
      /* Onboarding always meets you as the original Rilo — this is Rilo
         introducing himself, before any skin has been earned or picked. */
      case 'welcome':
        return <Welcome go={go} skin={OG_SKIN} />;
      case 'howitworks':
        return <HowItWorks go={go} skin={OG_SKIN} />;
      case 'instead':
        return <Instead go={go} skin={OG_SKIN} />;
      case 'talk':
      case 'talkchat':
        return (
          <Talk
            go={go}
            onTalked={() => setTalked(true)}
            mode={screen === 'talk' ? 'onboarding' : 'chat'}
            skin={screen === 'talk' ? OG_SKIN : chosenRilo}
            name={name}
            setName={setName}
            about={about}
            setAbout={setAbout}
          />
        );
      case 'aboutyou':
        return (
          <AboutYou
            talked={talked}
            go={go}
            about={about}
            setAbout={setAbout}
            name={name}
            setName={setName}
            skin={OG_SKIN}
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
              makeBreakdown(false);
              go('paywall');
            }}
          />
        );

      case 'crunching':
        return (
          <Crunching
            skin={OG_SKIN}
            onDone={() => {
              makeBreakdown(true);
              /* the paywall comes first — "where your time goes" is pro */
              go('paywall');
            }}
          />
        );

      case 'timegoes':
        return <TimeGoes go={go} skin={OG_SKIN} breakdown={breakdown} />;

      case 'timeback':
        return (
          <TimeBack
            go={go}
            time={time}
            setTime={setTime}
            skin={OG_SKIN}
            breakdown={breakdown}
            apps={apps}
            setApps={setApps}
            pace={pace}
            setPace={choosePace}
            sessionMins={sessionMins}
            setSessionMins={chooseSession}
            isPro={isPro}
            planMode={planMode}
            setPlanMode={setPlanMode}
            hobbies={profileList('hobby')}
            goalList={profileList('goal')}
          />
        );
      case 'paywall':
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
          />
        );

      /* daily use */
      case 'home':
        return (
          <Home
            go={go}
            name={name}
            about={about}
            apps={apps}
            xp={xp}
            skin={chosenRilo}
            onOpenApp={openApp}
            leftFor={leftFor}
            savedNote={savedNote}
            onClearSavedNote={() => setSavedNote(null)}
            isPro={isPro}
            riloMood={riloMood}
            riloNote={riloNote}
            overNote={overNote}
            onClearOverNote={() => setOverNote('')}
            passesLeft={passesLeft}
            passWon={passWon}
            onClearPassWon={() => setPassWon(false)}
            schedule={schedule}
            backToday={back.today}
            askTonight={askTonight}
            onNightCheckIn={() => go('nightcheckin')}
            weekAhead={weekAhead}
            suggestStrict={
              isPro &&
              !strict.on &&
              strict.suggestedOn !== today() &&
              shouldSuggestStrict(history, fiveMoreDays)
            }
            onStrictYes={() => {
              setStrict((st) => ({ ...st, suggestedOn: today() }));
              strictOn(7, 'all');
            }}
            onStrictNo={() => {
              setStrict((st) => ({
                ...st,
                suggestedOn: today(),
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

      case 'whyopen':
        return (
          <WhyOpen
            app={currentApp}
            skin={chosenRilo}
            onStart={(pick) => startCheckedIn(currentApp, pick)}
            onNevermind={() => {
              track('checkin', 'never mind');
              go('home', 'back');
            }}
          />
        );

      case 'nightcheckin':
        return (
          <NightCheckIn
            skin={chosenRilo}
            onDone={({ said, tasks }) => {
              setNight({ date: today(), said, tasks });
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

      case 'calendar':
      case 'calendaronboard':
        return (
          <CalendarConnect
            go={go}
            skin={OG_SKIN}
            apps={watched}
            onContinue={
              screen === 'calendaronboard' ? () => go(isPro ? 'timegoes' : 'timeback') : undefined
            }
            onSkip={
              screen === 'calendaronboard' ? () => go(isPro ? 'timegoes' : 'timeback') : undefined
            }
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
            left={leftFor(currentApp)}
            sessionMins={sessionMins}
            schedule={schedule}
            onTalk={() => setBanner(true)}
            onClose={() => go('home', 'back')}
          />
        );

      case 'appopen':
        return (
          <AppOpen
            app={currentApp}
            minutes={session.minutes}
            onFinish={(mins) => finishSession(currentApp, mins)}
          />
        );

      case 'intercept':
        return (
          <Intercept
            go={go}
            app={currentApp}
            openCount={Math.max(1, openCount)}
            opensToday={day.opens[currentApp] ?? 0}
            left={leftFor(currentApp)}
            sessionMins={sessionMins}
            passesPerDay={passesFor(isPro)}
            day={day}
            strictOn={strict.on}
            breakEarned={
              !day.lastBlockedAt ||
              (Date.now() - day.lastBlockedAt) / 60000 >= BREAK_EARNED_AFTER
            }
            skin={chosenRilo}
            onReason={(reason) => {
              track('reason', reason);
              if (reason === 'never mind') saidNo();
            }}
            onUnlock={(why, mins) => {
              track('unlock', why);
              /* "5 more minutes" and the pass are already a stated length;
                 everything else goes through the check-in first */
              if (mins) startSessionFor(currentApp, mins);
              else go('whyopen');
            }}
            onPass={(why) => useEmergencyPass(currentApp, why)}
            onFiveMore={tapFiveMore}
          />
        );
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

      case 'timer':
        return (
          <Timer
            app={currentApp}
            minutes={session.minutes}
            skin={chosenRilo}
            onEnd={() => go('checkin')}
          />
        );

      case 'checkin':
        return (
          <CheckIn
            go={go}
            app={currentApp}
            minutes={session.minutes}
            skin={chosenRilo}
            angry={extrasToday >= 1}
            onDone={() => {
              track('checkin', "i'm done");
              /* xp comes from the day's result now, not this tap */
              /* finishing a shorter session banks the time not spent */
              setStats((s) => ({
                savedMinutes: s.savedMinutes + Math.max(0, BLOCK_MINUTES - session.minutes),
                saidNo: s.saidNo + 1,
              }));
            }}
            onMore={() => {
              track('checkin', '5 more minutes');
              setExtras({ date: today(), count: extrasToday + 1 });
              /* no xp here either — see endDay */
              setStats((s) => ({
                savedMinutes: Math.max(0, s.savedMinutes - 5),
                saidNo: s.saidNo,
              }));
            }}
            onExtra={(mins) => {
              setSession((s) => ({ ...s, minutes: mins }));
              go('timer');
            }}
          />
        );

      case 'plan':
        /* today's plan is rilo pro */
        return (
          <Plan
            go={go}
            skin={chosenRilo}
            locked={!isPro}
            onUpgrade={() => go('paywall')}
            schedule={schedulePlan}
            setSchedule={setSchedulePlan}
            hobbies={profileList('hobby')}
            goals={profileList('goal')}
            school={school}
            bedtime={bedtime}
            scrollMins={weekGoal}
            weekAhead={weekAhead}
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
            weekGoal={weekGoal}
            planWeeks={planWeeks}
            isPro={isPro}
            back={back}
            backSays={backSays}
            checkins={checkins}
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
            pace={pace}
            setPace={choosePace}
            sessionMins={sessionMins}
            setSessionMins={chooseSession}
            breakdown={breakdown}
            startMins={startMins}
            weekGoal={weekGoal}
            bedtime={bedtime}
            setBedtime={setBedtime}
            school={school}
            setSchool={setSchool}
            buddyCount={(buddies.friends ?? []).length}
            calendarOn={calendar.on}
            planMode={planMode}
            setPlanMode={setPlanMode}
            hobbies={profileList('hobby')}
            goalList={profileList('goal')}
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
              go('paywall');
            }}
            stats={stats}
            strict={strict}
            onStrictOn={strictOn}
            onStrictAskOff={strictAskOff}
            onStrictKeepOn={strictKeepOn}
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
          goal={weekGoal}
          passes={passesLeft}
          fmtMins={fmtMins}
          onClock={(at) => {
            setDemoClock(at);
            track('demo', `clock ${at ?? 'real'}`);
          }}
          onUsage={(how) => {
            const target =
              how === 'under'
                ? Math.round(weekGoal * 0.5)
                : how === 'close'
                  ? Math.round(weekGoal * 0.92)
                  : Math.round(weekGoal * 1.4);
            const first = watched[0] ?? 'tiktok';
            setDay((d) => ({ ...d, used: { [first]: target } }));
            track('demo', `usage ${how}`);
          }}
          onOpenBlocked={() => openApp(watched[0] ?? 'tiktok')}
          onNextDay={() => endDay(false)}
          onNextWeek={runWeek}
          onShareCard={() => go('sharecard')}
          onBuddies={() => go('buddies')}
          onNight={() => go('nightcheckin')}
          onCalendar={() => go('calendar')}
          onReset={startOver}
        />
      )}
    </PhoneFrame>
    </ThemeContext.Provider>
  );
}

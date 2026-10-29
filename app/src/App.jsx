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
import PickApps from './screens/PickApps';
import TimeBack from './screens/TimeBack';
import Paywall from './screens/Paywall';
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
import { levelFor, skinsUnlockedBetween, XP, UNLOCK_ALL } from './lib/levels';
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

  /* the app + length of the session being "opened" right now */
  const [session, setSession] = useState({ app: null, minutes: 5 });

  useEffect(() => {
    saveState({
      name, about, apps, time, plan, planChoice, isPro,
      xp, level, chosenRilo, theme, opens, extras, stats,
    });
  }, [name, about, apps, time, plan, planChoice, isPro, xp, level, chosenRilo, theme, opens, extras, stats]);

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
    const day = today();
    const fresh = opens.date !== day;
    const counts = fresh ? {} : opens.counts;
    const next = (counts[label] ?? 0) + 1;

    setOpens({ date: day, counts: { ...counts, [label]: next } });
    setSession({ app: label, minutes: 5 });
    go('intercept');
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
      case 'aboutyou':
        return (
          <AboutYou
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
      case 'timeback':
        return <TimeBack go={go} time={time} setTime={setTime} skin={OG_SKIN} />;
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
          />
        );
      case 'intercept':
        return (
          <Intercept
            go={go}
            app={currentApp}
            openCount={Math.max(1, openCount)}
            skin={chosenRilo}
            onReason={(reason) => {
              track('reason', reason);
              if (reason === 'never mind') saidNo();
            }}
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
              awardXp(XP.suggestion);
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
              awardXp(XP.tired);
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
              awardXp(XP.done);
              /* finishing a shorter session banks the time not spent */
              setStats((s) => ({
                savedMinutes: s.savedMinutes + Math.max(0, BLOCK_MINUTES - session.minutes),
                saidNo: s.saidNo + 1,
              }));
            }}
            onMore={() => {
              track('checkin', '5 more minutes');
              setExtras({ date: today(), count: extrasToday + 1 });
              awardXp(XP.more);
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
        return <Plan go={go} skin={chosenRilo} />;
      case 'progress':
        return <Progress go={go} xp={xp} skin={chosenRilo} level={level} />;
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
    </PhoneFrame>
    </ThemeContext.Provider>
  );
}

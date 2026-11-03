/* Home — exact port of designs/Home.dc.html
   Paints its own sky (it does not use Sky).

   One addition the spec asks for: a "pretend you opened..." row showing the
   apps the tester actually picked, so they can trigger the pop-up. It sits in
   the gap the design leaves between the watched-apps row and the tab bar.
   The watched-apps row shows the real count and the real logos. */

import Rilo from '../components/Rilo';
import { ChatIcon } from '../components/TalkBits';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import TabBar from '../components/TabBar';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';
import StepDown from '../components/StepDown';
import { suggestion } from '../lib/profile';
import { fmtMins } from '../lib/plan';
import { ALWAYS, BLOCKED, LIMITED, settingFor, fmtOpens } from '../lib/limits';

/* Flat, light cards: a hairline border and no drop shadow. The old chunky
   `0 4px 0 var(--line)` shadows under every card were most of why this
   screen read as heavy. */
const CARD_LINE = '1.5px solid rgba(18,48,26,0.12)';
const cardStyle = {
  padding: '16px 18px',
  borderRadius: 22,
  background: 'var(--card)',
  border: CARD_LINE,
  color: '#12301A',
  animation: 'rise14 .5s ease-out both',
};

export default function Home({
  go,
  name,
  about,
  skin,
  onOpenApp,
  /* ---- the limits (lib/limits) ---- */
  tracked = [],
  appSettings = {},
  lockOf,
  totalOpensFor,
  usedToday = 0,
  goalMins = 120,
  /* the weekly step-down */
  stepApp,
  stepProposal,
  stepPhase,
  stepDone = false,
  stepSkipAt = null,
  stepSwappable = [],
  onStepAccept,
  onStepSkip,
  onStepSwap,
  strictOn = false,
  suggestStrict,
  onStrictYes,
  onStrictNo,
  savedNote,
  onClearSavedNote,
  /* ---- add-ons (rilo-addons-test) ---- */
  riloMood = 'coach',
  riloNote = '',
  overNote = '',
  onClearOverNote,
  backToday = 0,
}) {
  const theme = useTheme();
  const upNext = suggestion(about).task;
  /* the apps that can actually be locked — always-allowed ones aren't
     interesting here, they never stop you */
  const watched = tracked.filter((a) => settingFor(appSettings, a).mode !== ALWAYS);

  /* the daily total against the goal (§8) — a scoreboard, never a lock */
  const goalPct = goalMins ? Math.min(100, Math.round((usedToday / goalMins) * 100)) : 0;
  const overGoal = usedToday > goalMins;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: theme.sky,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <ThemeDecor />

      {/* Everything above the tab bar scrolls.
          This used to be a stack of absolutely-positioned rows at fixed
          pixel tops (52, 104, 352, 488, 582, 648) — fine in the 844px-tall
          frame it was drawn in, and badly broken on a real phone, where the
          browser's chrome leaves roughly 650px and the bottom 200px of the
          design simply did not exist. There was no scrolling to recover it
          either, because absolutely-positioned children create no scroll
          height. It's a normal flow column now: it fits what it fits and
          scrolls for the rest. */}
      <div
        className="scroll-y"
        style={{
          position: 'absolute',
          inset: 0,
          boxSizing: 'border-box',
          padding: '52px 20px 0',
          /* clears the floating tab bar (94px) with room to breathe */
          '--tail': 'calc(112px + var(--safe-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            animation: 'rise14 .5s ease-out both',
          }}
        >
          {name ? `hey ${name.toLowerCase()}` : 'hey there'}
        </p>

        {/* 1. Rilo, big, in whatever mood the day has put him in. Tapping
            him opens the chat — he is the way into talking, so he is the
            biggest thing on the screen. */}
        <div
          data-tour-target="hero"
          style={{
            position: 'relative',
            height: 210,
            flexShrink: 0,
            borderRadius: 26,
            overflow: 'hidden',
            background: theme.sky,
            border: CARD_LINE,
            animation: 'rise14 .5s .06s ease-out both',
          }}
        >
          <svg
            width="100%"
            height="78"
            viewBox="0 0 350 90"
            preserveAspectRatio="xMidYMax slice"
            aria-hidden="true"
            style={{ position: 'absolute', left: 0, bottom: 0 }}
          >
            <path d="M0 40 C90 10 220 14 350 36 L350 90 L0 90 Z" fill={theme.hills[1]} />
            <path d="M0 70 C120 54 230 56 350 70 L350 90 L0 90 Z" fill={theme.hills[2]} />
          </svg>

          <button
            type="button"
            className="tap-94"
            aria-label="chat with rilo"
            data-tour-target="home-talk"
            onClick={() => go('talkchat')}
            style={{
              position: 'absolute',
              left: 16,
              bottom: 24,
              border: 0,
              padding: 0,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <Rilo skin={skin} mood={riloMood} size={132} />
            <span
              style={{
                position: 'absolute',
                right: -6,
                bottom: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 9px 4px 6px',
                borderRadius: 999,
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                animation: 'pulse 2.2s ease-in-out infinite',
              }}
            >
              <ChatIcon size={14} />
              chat
            </span>
          </button>

          <div
            style={{
              position: 'absolute',
              right: 16,
              top: 30,
              width: 165,
              padding: '12px 14px',
              borderRadius: '18px 18px 18px 6px',
              background: 'var(--card)',
              border: CARD_LINE,
            }}
          >
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
              {riloNote || `${fmtMins(backToday)} saved today.`}
            </p>
          </div>
        </div>

        {/* 2. The one number that matters: today against the goal. */}
        <div data-tour-target="score" style={{ ...cardStyle, animationDelay: '.12s' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 34,
                fontWeight: 700,
                color: overGoal ? '#C2541F' : '#12301A',
                lineHeight: 1,
              }}
            >
              {fmtMins(usedToday)}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#52715A' }}>
              of {fmtMins(goalMins)} today
            </span>
          </div>
          <div
            aria-hidden="true"
            style={{
              marginTop: 12,
              height: 8,
              borderRadius: 999,
              background: 'rgba(18,48,26,0.09)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${goalPct}%`,
                height: '100%',
                borderRadius: 999,
                background: overGoal ? '#D9643A' : '#2E8B3E',
                transition: 'width .4s ease',
              }}
            />
          </div>
        </div>

        {/* 3. One thing to do instead of picking the phone back up. */}
        <button
          type="button"
          className="tap"
          onClick={() => go('plan')}
          data-tour-target="next"
          style={{
            ...cardStyle,
            animationDelay: '.18s',
            textAlign: 'left',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
            <span
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#52715A',
              }}
            >
              do this instead
            </span>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600 }}>
              {upNext}
            </span>
          </span>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M9 5 L16 12 L9 19"
              fill="none"
              stroke="#1F6B2E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* 4. Their apps, with the opens they have left on each. */}
        <div
          data-tour-target="home-apps"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'rise14 .5s .24s ease-out both',
          }}
        >
          {watched.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#52715A' }}>
              set some limits on the you tab to see them here
            </p>
          )}

          {watched.map((label) => {
            const lock = lockOf ? lockOf(label) : null;
            const setting = settingFor(appSettings, label);
            const locked = Boolean(lock?.locked);
            const total = totalOpensFor ? totalOpensFor(label) : 0;
            const used = lock?.used ?? 0;

            return (
              <button
                key={label}
                type="button"
                className="tap"
                aria-label={`Open ${label}`}
                onClick={() => onOpenApp(label)}
                style={{
                  ...cardStyle,
                  animation: 'none',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  cursor: 'pointer',
                  opacity: locked ? 0.55 : 1,
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}>
                  <AppLogo label={label} size={38} radius={11} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600 }}>
                    {label}
                  </span>
                  {setting.mode === LIMITED ? (
                    <>
                      <Opens total={total} used={used} minutes={setting.minutes} size={11} note={false} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#52715A' }}>
                        {locked
                          ? 'no opens left'
                          : `${fmtOpens(Math.max(0, total - used))} left · ${setting.minutes} min each`}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#52715A' }}>
                      {setting.mode === BLOCKED ? 'blocked' : 'free · counts toward your day'}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* over the time they promised on the way in */}
      {overNote && (
        <button
          type="button"
          className="tap"
          onClick={onClearOverNote}
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            /* a toast above the tab bar — the fixed rows above are a stack,
               and anything floating in them covers a real button */
            bottom: 96,
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.92)',
            border: '2px solid var(--line, #12301A)',
            cursor: 'pointer',
            animation: 'rise .4s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="letdown" size={58} />
          <span
            style={{
              flexGrow: 1,
              minWidth: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {overNote}
          </span>
        </button>
      )}

      {/* the weekly step-down: a preview a day ahead, then the offer (§11) */}
      {stepPhase && !overNote && (
        /* A sheet above the tab bar rather than a card in the layout:
           Home is absolutely positioned, and the step-down can carry an
           accept, a skip and a row of apps to swap to — more than fits in
           the gap the design leaves between rows. */
        <div
          className="scroll-y"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 96,
            maxHeight: '52%',
            boxSizing: 'border-box',
            padding: '12px 14px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.97)',
            border: '2px solid var(--line, #12301A)',
            boxShadow: '0 16px 40px rgba(10,40,20,0.28)',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            animation: 'rise .4s ease-out both',
            zIndex: 20,
          }}
        >
          <StepDown
            skin={skin}
            app={stepApp}
            step={stepProposal}
            phase={stepPhase}
            strictOn={strictOn}
            swappable={stepPhase === 'offered' ? stepSwappable : []}
            skipAt={stepSkipAt}
            done={stepDone}
            onAccept={onStepAccept}
            onSkip={onStepSkip}
            onSwap={onStepSwap}
          />
        </div>
      )}

      {/* closed it early — the minutes they didn't spend are still theirs */}
      {savedNote && !suggestStrict && !overNote && !stepPhase && (
        <button
          type="button"
          className="tap"
          onClick={onClearSavedNote}
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            /* a toast above the tab bar — the fixed rows above are a stack,
               and anything floating in them covers a real button */
            bottom: 96,
            zIndex: 15,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.9)',
            border: '2px solid var(--line, #12301A)',
            cursor: 'pointer',
            animation: 'rise .4s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="proud" size={58} />
          <span style={{ flexGrow: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 17,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              you shut {savedNote.app} {savedNote.mins} min early.
            </span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              that time&apos;s still yours today.
            </span>
          </span>
        </button>
      )}

      {/* Two days over the goal in a row and Rilo offers strict mode.
          A centred pop-up, not a banner: it's a yes/no question, it was
          getting lost in the row of notifications, and it sat on top of the
          "test it" button. Saying no is one tap and he won't ask again
          today. */}
      {suggestStrict && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 22,
            boxSizing: 'border-box',
            background: 'rgba(12,30,18,0.45)',
            backdropFilter: 'blur(3px)',
            animation: 'scrim-in .25s ease-out both',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '18px 18px 16px',
              borderRadius: 28,
              background: 'var(--card)',
              border: '2px solid var(--line)',
              boxShadow: '0 16px 40px rgba(10,40,20,0.35)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              textAlign: 'center',
              animation: 'pop .3s cubic-bezier(.2,.9,.3,1.1) both',
            }}
          >
            <Rilo skin={skin} mood="letdown" size={120} talks />

            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 23,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              that&apos;s two days over.
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: '#2C4A36',
                lineHeight: 1.4,
              }}
            >
              want me to get strict for a week? no half opens, no borrowing,
              and loosening anything waits 24 hours. your pass still works.
            </p>

            <button
              type="button"
              className="tap-94"
              onClick={onStrictYes}
              style={{
                marginTop: 4,
                width: '100%',
                minHeight: 52,
                borderRadius: 999,
                border: 0,
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 8px 22px rgba(10,40,20,0.3)',
              }}
            >
              yeah, lock it down
            </button>

            <button
              type="button"
              className="tap"
              onClick={onStrictNo}
              style={{
                width: '100%',
                minHeight: 48,
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: 'transparent',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 17,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              no, i&apos;ve got it
            </button>
          </div>
        </div>
      )}

      <TabBar active="home" go={go} variant="home" skin={skin} />
    </div>
  );
}

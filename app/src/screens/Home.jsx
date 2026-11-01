/* Home — exact port of designs/Home.dc.html
   Paints its own sky (it does not use Sky).

   One addition the spec asks for: a "pretend you opened..." row showing the
   apps the tester actually picked, so they can trigger the pop-up. It sits in
   the gap the design leaves between the watched-apps row and the tab bar.
   The watched-apps row shows the real count and the real logos. */

import Rilo from '../components/Rilo';
import { MicIcon } from '../components/TalkBits';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import TabBar from '../components/TabBar';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';
import StepDown from '../components/StepDown';
import { suggestion } from '../lib/profile';
import { fmtMins } from '../lib/plan';
import { ALWAYS, BLOCKED, LIMITED, settingFor, fmtOpens } from '../lib/limits';

/* no clouds — the theme's sky things instead (see ThemeDecor) */
const CLOUD = null;

/* the nightly check-in button's icon */
function MoonIcon({ color = '#2B3A6B' }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* less-nudgy: the three Nudgy-style rings became solid stat tiles with a
   chunky progress bar — same three numbers, same colors. The numbers are
   real now: today's total against the goal, the streak, and the time back. */
function Ring({ pct = 0, color, delay, big, label, value }) {
  return (
    <div
      style={{
        padding: '12px 10px 10px',
        borderRadius: 20,
        background: 'var(--card)',
        border: '2px solid var(--line)',
        boxShadow: '0 4px 0 var(--line)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: big ? 30 : 24,
          lineHeight: 1,
          fontWeight: 700,
          color: '#12301A',
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#3D5A46' }}>{label}</p>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: '#EDE6D3',
          border: '1.5px solid var(--line)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transformOrigin: 'left',
            animation: `bar-fill-x .9s ${delay} cubic-bezier(.2,.8,.3,1) both`,
          }}
        />
      </div>
    </div>
  );
}

export default function Home({
  go,
  name,
  about,
  xp,
  level = 1,
  skin,
  onOpenApp,
  /* ---- the limits (lib/limits) ---- */
  tracked = [],
  appSettings = {},
  lockOf,
  totalOpensFor,
  usedToday = 0,
  goalMins = 120,
  streak = 0,
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
  passesLeft = 1,
  backToday = 0,
  /* the nightly check-in (pro): whether they have it, whether their chosen
     time has passed, and whether they already did it today */
  canCheckIn = false,
  checkInDue = false,
  checkedInToday = false,
  onNightCheckIn,
}) {
  const theme = useTheme();
  const upNext = suggestion(about).task;
  /* the apps that can actually be locked — always-allowed ones aren't
     interesting here, they never stop you */
  const watched = tracked.filter((a) => settingFor(appSettings, a).mode !== ALWAYS);

  /* the daily total against the goal (§8) — a scoreboard, never a lock */
  const goalPct = goalMins ? Math.min(100, Math.round((usedToday / goalMins) * 100)) : 0;

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
          gap: 14,
        }}
      >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'rise14 .5s ease-out both',
        }}
      >
        <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 700 }}>
          {name ? `hey ${name.toLowerCase()}` : 'hey there'}
        </p>
        <p
          style={{
            margin: 0,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#1F6B2E',
          }}
        >
          lvl {level} · {xp} xp · {passesLeft} pass{passesLeft === 1 ? '' : 'es'}
        </p>
      </div>

      <div
        style={{
          position: 'relative',
          height: 230,
          flexShrink: 0,
          borderRadius: 30,
          overflow: 'hidden',
          background: theme.sky,
          border: '2px solid var(--line)',
          boxShadow: '0 4px 0 var(--line)',
          animation: 'rise14 .5s .08s ease-out both',
        }}
      >
        <svg
          width="140"
          height="60"
          viewBox="0 0 200 86"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 10,
            top: 18,
            opacity: 0.9,
            animation: 'drift 12s ease-in-out infinite',
          }}
        >
          {CLOUD}
        </svg>
        <svg
          width="100%"
          height="90"
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
          aria-label="talk to rilo"
          onClick={() => go('talkchat')}
          style={{
            position: 'absolute',
            left: 16,
            bottom: 30,
            border: 0,
            padding: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <Rilo skin={skin} mood={riloMood} size={140} />
          {/* tap Rilo to talk */}
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
              border: '2px solid #FFFFFF',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              animation: 'pulse 2.2s ease-in-out infinite',
            }}
          >
            <MicIcon size={14} />
            talk
          </span>
        </button>
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: 34,
            width: 170,
            padding: '12px 14px',
            borderRadius: '18px 18px 18px 6px',
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
            {riloNote || `${fmtMins(backToday)} saved today.`}
          </p>
        </div>

        {/* The nightly check-in, as a real button (rilo pro).
            It lives INSIDE the hero, under Rilo's speech bubble, because
            everything below here is a fixed stack of rows — a floating card
            in that stack covered the "test it" button. It's always here so
            they can check in whenever, and it grows a dot once their chosen
            time has passed and they haven't yet. */}
        {canCheckIn && (
          <button
            type="button"
            className="tap"
            onClick={onNightCheckIn}
            style={{
              position: 'absolute',
              right: 16,
              top: 126,
              width: 170,
              boxSizing: 'border-box',
              minHeight: 48,
              padding: '8px 12px',
              borderRadius: 18,
              background: checkInDue ? '#2B3A6B' : 'var(--card)',
              border: '2px solid var(--line)',
              boxShadow: '0 3px 0 var(--line)',
              color: checkInDue ? '#FFFFFF' : '#12301A',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MoonIcon color={checkInDue ? '#FFFFFF' : '#2B3A6B'} />
            <span style={{ flexGrow: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {checkedInToday ? 'checked in' : 'check in'}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  opacity: checkInDue ? 0.8 : 0.6,
                }}
              >
                {checkedInToday
                  ? 'tomorrow is planned'
                  : checkInDue
                    ? '30 seconds, then bed'
                    : 'how today went'}
              </span>
            </span>
            {checkInDue && !checkedInToday && (
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: '#FFD43B',
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
            )}
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          animation: 'rise14 .5s .16s ease-out both',
        }}
      >
        <Ring
          pct={goalPct}
          /* over the goal turns it, but nothing locks — it's a scoreboard */
          color={usedToday > goalMins ? '#D9643A' : '#2E8B3E'}
          delay="0s"
          value={fmtMins(usedToday)}
          label={`of ${fmtMins(goalMins)} goal`}
        />
        <Ring
          pct={Math.min(100, streak * 14)}
          color="#E0A526"
          delay=".1s"
          value={streak}
          label="day streak"
          big
        />
        <Ring
          pct={Math.min(100, Math.round((backToday / Math.max(1, goalMins)) * 100))}
          color="#3A8FD9"
          delay=".2s"
          value={fmtMins(backToday)}
          label="saved today"
        />
      </div>

      <button
        type="button"
        className="tap"
        onClick={() => go('plan')}
        style={{
          padding: '16px 18px',
          borderRadius: 24,
          background: '#12301A',
          color: '#FFFFFF',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 10px 26px rgba(10,40,20,0.22)',
          animation: 'rise14 .5s .24s ease-out both',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9FD8A9',
            }}
          >
            up next · 4:30
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600 }}>
            {upNext}
          </span>
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 5 L16 12 L9 19"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="tap"
        onClick={() => watched.length && onOpenApp(watched[0])}
        disabled={!watched.length}
        style={{
          padding: '10px 18px',
          borderRadius: 24,
          background: 'var(--card)',
          border: '2px solid var(--line)',
          color: '#12301A',
          textAlign: 'left',
          cursor: watched.length ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 0 var(--line)',
          animation: 'rise14 .5s .32s ease-out both',
        }}
      >
        <span style={{ display: 'flex', flexShrink: 0 }}>
          {watched.slice(0, 3).map((label, i) => (
            <span
              key={label}
              style={{
                marginLeft: i ? -8 : 0,
                borderRadius: 10,
                border: i ? '2px solid #FFFFFF' : 0,
                display: 'flex',
                background: '#FFFFFF',
              }}
            >
              <AppLogo label={label} size={34} radius={10} />
            </span>
          ))}
        </span>
        <span style={{ flexGrow: 1, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
          {watched.length
            ? `rilo's watching ${watched.length} app${watched.length === 1 ? '' : 's'}`
            : "rilo isn't watching any apps"}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1F6B2E' }}>test it</span>
      </button>

      {/* spec addition: trigger the pop-up with one of THEIR apps */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          animation: 'rise14 .5s .4s ease-out both',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#2C4A36',
          }}
        >
          {watched.length ? 'pretend you opened…' : 'set some limits on the you tab to test this'}
        </p>
        <div
          className="scroll-x"
          style={{ display: 'flex', gap: 8, paddingBottom: 2 }}
        >
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
                aria-label={`Pretend you opened ${label}`}
                onClick={() => onOpenApp(label)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 54,
                  padding: '6px 14px 6px 8px',
                  borderRadius: 999,
                  background: locked ? 'rgba(18,48,26,0.45)' : '#12301A',
                  border: 0,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 8px 20px rgba(10,40,20,0.22)',
                }}
              >
                <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 10 }}>
                  <AppLogo label={label} size={36} radius={10} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span
                    style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600 }}
                  >
                    {label}
                  </span>

                  {/* the circles, the same ones as the limit card (§3) */}
                  {setting.mode === LIMITED ? (
                    <Opens
                      total={total}
                      used={used}
                      minutes={setting.minutes}
                      on
                      size={11}
                      note={false}
                    />
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#C9E6CE' }}>
                      {setting.mode === BLOCKED ? 'blocked' : 'free · counts toward your day'}
                    </span>
                  )}

                  {setting.mode === LIMITED && (
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#C9E6CE' }}>
                      {locked
                        ? 'no opens left'
                        : `${fmtOpens(Math.max(0, total - used))} left · ${setting.minutes} min each`}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
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
            <Rilo skin={skin} mood="letdown" size={120} />

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

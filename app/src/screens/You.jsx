/* You — the "you" tab (fixes round 2).
   Not in designs/: built in the same Touch Grass style (sky, glass cards,
   Fredoka lowercase).

   Name, level + XP, the current Rilo small, stats, the same hobby/goal chips
   and app list as onboarding, the daily goal stepper, the plan they tapped,
   and "start over" for handing the phone to the next tester. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import ChipPicker from '../components/ChipPicker';
import AppPicker from '../components/AppPicker';
import GoalStepper from '../components/GoalStepper';
import StrictCard from '../components/StrictCard';
import ProLock from '../components/ProLock';
import ScheduleCard from '../components/ScheduleCard';
import { FREE_MAX_APPS, GOAL_FLOOR_HOURS, fmtMins } from '../lib/plan';
import { fmtClock } from '../lib/addons';
import { LIMITED, BLOCKED, ALWAYS, FREE, settingFor } from '../lib/limits';
import AppLogo from '../components/AppLogo';
import { levelProgress, skinInfo, UNLOCK_ALL } from '../lib/levels';
import { THEMES } from '../lib/themes';

const card = (delay) => ({
  padding: 16,
  borderRadius: 26,
  background: 'var(--card)',
  border: '2px solid var(--line)',
  boxShadow: '0 4px 0 var(--line)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flexShrink: 0,
  animation: `rise14 .4s ${delay} ease-out both`,
});

/* ChipPicker and AppPicker take the same card shape */
/* The page is a long list, so it's broken into named groups. */
function Section({ children, first = false }) {
  return (
    <p
      style={{
        margin: first ? '2px 0 -2px' : '14px 0 -2px',
        paddingLeft: 4,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: '#2C4A36',
        flexShrink: 0,
      }}
    >
      {children}
    </p>
  );
}

const chipCard = (delay) => ({ ...card(delay), background: 'rgba(255,255,255,0.55)' });

/* the grey demo-only buttons at the bottom */
const demoBtn = {
  width: '100%',
  height: 44,
  flexShrink: 0,
  borderRadius: 999,
  background: 'rgba(18,48,26,0.07)',
  border: '1px solid rgba(18,48,26,0.18)',
  color: '#4F6B58',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

function Stat({ value, label }) {
  return (
    <div
      style={{
        padding: '12px 6px',
        borderRadius: 22,
        background: 'var(--card)',
        border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 24,
          fontWeight: 700,
          color: '#1F6B2E',
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{label}</p>
    </div>
  );
}

function fmtSaved(mins) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function You({
  go,
  name,
  about,
  setAbout,
  apps,
  setApps,
  time,
  setTime,
  /* ---- the limits (lib/limits) ---- */
  check,
  tracked = [],
  appSettings = {},
  pendingCount = 0,
  /* ---- add-ons (rilo-addons-test) ---- */
  bedtime = { on: false, from: '22:30', to: '07:00' },
  setBedtime = () => {},
  school = { on: false, days: [], from: '08:15', to: '15:00' },
  setSchool = () => {},
  focus = { on: false, until: '' },
  setFocus = () => {},
  /* the nightly check-in (pro): the time he asks, and whether today's done */
  night = { at: '21:00', date: '' },
  setNight = () => {},
  checkedInToday = false,
  buddyCount = 0,
  calendarOn = false,
  streak = 0,
  xp,
  level,
  isPro,
  chosenRilo,
  theme,
  onTheme,
  onLockedTheme,
  stats,
  onStartOver,
  strict,
  onStrictOn,
  onStrictAskOff,
  onStrictKeepOn,
  onStrictOffNow,
  onNextDay,
  onNextDayOver,
  onNextWeek,
  onDemoXp,
}) {
  const prog = levelProgress(xp, level);
  const planLabel = isPro ? 'rilo pro (trial)' : 'free';

  /* a one-line summary of the limits, so the card means something before
     they tap into it */
  const count = (mode) => tracked.filter((a) => settingFor(appSettings, a).mode === mode).length;
  const limitSummary = [
    count(LIMITED) && `${count(LIMITED)} limited`,
    count(BLOCKED) && `${count(BLOCKED)} blocked`,
    count(FREE) && `${count(FREE)} free`,
    count(ALWAYS) && `${count(ALWAYS)} always allowed`,
  ]
    .filter(Boolean)
    .join(' · ');

  /* the three or four apps with real limits, for the row of logos */
  const limitedApps = tracked.filter((a) => settingFor(appSettings, a).mode === LIMITED);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="low" />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1
          style={{
            margin: 0,
            flexShrink: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            animation: 'rise14 .4s ease-out both',
          }}
        >
          {name ? `${name.toLowerCase()}` : 'you'}
        </h1>

        {/* the list scrolls; the tab bar stays put */}
        <div
          className="scroll-y"
          style={{
            flexGrow: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            margin: '0 -4px',
            /* clear the floating tab bar at the bottom */
            padding: '0 4px',
            '--tail': 'calc(124px + var(--safe-bottom, 0px))',
          }}
        >
          <Section first>you</Section>

          {/* level + xp + current rilo */}
          <div
            style={{
              ...card('.04s'),
              background: '#12301A',
              border: 0,
              color: '#FFFFFF',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
            }}
          >
            <Rilo skin={chosenRilo} mood="coach" size={76} talks />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                level {level}
              </p>
              <div
                style={{
                  height: 10,
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.18)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${prog.pct}%`,
                    height: 10,
                    borderRadius: 5,
                    background: 'linear-gradient(90deg, #9EDCA6, #4CC160)',
                    animation: 'fill 1.2s .3s ease-out both',
                  }}
                />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#C9E6CE' }}>
                {prog.atMax ? `${xp} xp · max level` : `${xp} / ${prog.next} xp`} ·{' '}
                {skinInfo(chosenRilo).name} rilo
              </p>
            </div>
          </div>

          {/* stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              flexShrink: 0,
              animation: 'rise14 .4s .08s ease-out both',
            }}
          >
            <Stat value={streak} label="day streak" />
            <Stat value={fmtSaved(stats.savedMinutes)} label="time saved" />
            <Stat value={stats.saidNo} label="times you said no" />
          </div>

          <Section>how it looks</Section>

          {/* app theme — a Rilo Pro feature (grass is free) */}
          <div style={card('.12s')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <p
                style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}
              >
                app theme
              </p>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#3D5A46' }}>rilo pro</span>
            </div>
            {/* three across, not five — at 390px five swatches were 58px
                wide with their names underneath */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
              {THEMES.map((t) => {
                const on = theme === t.id;
                const open = t.tier === 'free' || isPro || UNLOCK_ALL;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className="tap"
                    aria-pressed={on}
                    aria-label={`${t.name} theme${t.tier === 'pro' ? ', rilo pro' : ''}`}
                    onClick={() => (open ? onTheme(t.id) : onLockedTheme(t.id))}
                    style={{
                      position: 'relative',
                      padding: 0,
                      border: 0,
                      background: 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: '100%',
                        aspectRatio: '1 / 1.25',
                        borderRadius: 14,
                        background: t.sky,
                        border: on ? '3px solid var(--line)' : '2px solid rgba(18,48,26,0.25)',
                        boxShadow: on ? '0 3px 0 var(--line)' : 'none',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <svg viewBox="0 0 60 75" width="100%" height="100%" aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
                        {t.id === 'sunset' && <circle cx="38" cy="50" r="14" fill="#FF8E5E" />}
                        {t.id !== 'sunset' && <circle cx="46" cy="16" r="7" fill={t.id === 'snow' ? '#FFFFFF' : '#FFE7A0'} />}
                        {t.id === 'bamboo' && <rect x="5" y="14" width="4" height="61" rx="2" fill="#8CCB78" />}
                        {t.id === 'sakura' && (
                          <>
                            <path d="M-2 10 C14 12 26 18 36 26" stroke="#7A4E3A" strokeWidth="2.5" fill="none" />
                            <circle cx="14" cy="12" r="4" fill="#FFC2D6" />
                            <circle cx="28" cy="20" r="4" fill="#FFC2D6" />
                          </>
                        )}
                        {t.id === 'snow' && <g fill="#FFFFFF"><circle cx="12" cy="20" r="1.8" /><circle cx="30" cy="34" r="1.5" /><circle cx="20" cy="44" r="1.6" /></g>}
                        <path d="M0 52 C18 42 36 44 60 50 L60 75 L0 75 Z" fill={t.hills[1]} />
                        <path d="M0 64 C20 58 40 58 60 62 L60 75 L0 75 Z" fill={t.hills[2]} />
                      </svg>
                    </span>
                    <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 12, fontWeight: 600, color: '#12301A' }}>
                      {t.name}
                    </span>
                    {t.tier === 'pro' && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          padding: '1px 5px',
                          borderRadius: 999,
                          background: '#12301A',
                          color: '#FFFFFF',
                          fontFamily: 'Fredoka, sans-serif',
                          fontSize: 9,
                          fontWeight: 600,
                        }}
                      >
                        pro
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Section>what rilo knows about you</Section>

          {/* hobbies + goals, same chips as onboarding */}
          <ChipPicker about={about} setAbout={setAbout} cardStyle={chipCard} />

          <Section>what rilo watches</Section>

          {/* apps rilo watches, same list + add sheet as onboarding */}
          <div style={card('.24s')}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}
            >
              apps rilo watches
            </p>
            <AppPicker
              apps={apps}
              setApps={setApps}
              maxApps={isPro ? Infinity : FREE_MAX_APPS}
              onMaxed={() => go('upgrade')}
              style={{ display: 'flex', flexDirection: 'column' }}
            />
            {!isPro && (
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#2C4A36' }}>
                free blocks {FREE_MAX_APPS} apps. pro blocks as many as you like.
              </p>
            )}
          </div>

          <Section>when rilo steps in</Section>

          {/* bedtime + school (rilo-addons-test) */}
          <ScheduleCard
            style={card('.22s')}
            bedtime={bedtime}
            setBedtime={setBedtime}
            school={school}
            setSchool={setSchool}
            focus={focus}
            setFocus={setFocus}
          />

          {/* the nightly check-in — rilo pro, set up right after the paywall.
              This is where the time they picked can be changed. */}
          {isPro ? (
            <div style={card('.225s')}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Rilo skin={chosenRilo} mood="sleepy" size={54} />
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 19,
                      fontWeight: 600,
                    }}
                  >
                    nightly check-in
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
                    {checkedInToday
                      ? 'done for today. tomorrow is planned.'
                      : `he asks at ${fmtClock(night.at || '21:00')}.`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="time"
                  aria-label="Check-in time"
                  value={night.at || '21:00'}
                  onChange={(e) => setNight({ ...night, at: e.target.value })}
                  style={{
                    flex: 1,
                    height: 42,
                    boxSizing: 'border-box',
                    padding: '0 10px',
                    borderRadius: 14,
                    border: '2px solid var(--line, #12301A)',
                    background: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#12301A',
                  }}
                />
                <button
                  type="button"
                  className="tap"
                  onClick={() => go('nightcheckin')}
                  style={{
                    minHeight: 42,
                    padding: '0 16px',
                    borderRadius: 999,
                    border: '2px solid var(--line, #12301A)',
                    background: '#12301A',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  check in now
                </button>
              </div>
            </div>
          ) : (
            <ProLock
              style={card('.225s')}
              title="nightly check-in"
              sub="thirty seconds before bed, and tomorrow is planned for you."
              onTap={() => go('upgrade')}
            />
          )}

          {/* calendar (rilo-addons-test-2) */}
          <button
            type="button"
            className="tap"
            onClick={() => go('calendar')}
            style={{
              ...card('.23s'),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Rilo skin={chosenRilo} mood={calendarOn ? 'proud' : 'coach'} size={54} />
            <span style={{ flexGrow: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 19,
                  fontWeight: 600,
                }}
              >
                your calendar
              </span>
              <span
                style={{ display: 'block', marginTop: 2, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}
              >
                {calendarOn
                  ? 'connected. rilo plans around your week.'
                  : 'let rilo plan around practices and tests.'}
              </span>
            </span>
          </button>

          <Section>friends</Section>

          {/* buddies (rilo-addons-test) */}
          <button
            type="button"
            className="tap"
            onClick={() => go('buddies')}
            style={{
              ...card('.24s'),
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <Rilo skin={chosenRilo} mood="wave" size={54} />
            <span style={{ flexGrow: 1, minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 19,
                  fontWeight: 600,
                }}
              >
                buddies
              </span>
              <span
                style={{ display: 'block', marginTop: 2, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}
              >
                {buddyCount ? `${buddyCount} added` : 'invite code only. no profiles.'}
              </span>
            </span>
          </button>

          <Section>your limits</Section>

          {/* strict mode — rilo pro */}
          {isPro ? (
            <StrictCard
              style={card('.2s')}
              skin={chosenRilo}
              strict={strict}
              onTurnOn={onStrictOn}
              onAskOff={onStrictAskOff}
              onKeepOn={onStrictKeepOn}
              onTurnOffNow={onStrictOffNow}
            />
          ) : (
            <ProLock
              style={card('.2s')}
              title="strict mode"
              sub="no half opens, no borrowing, 24 hours to loosen anything."
              onTap={() => go('upgrade')}
            />
          )}

          {/* the limits themselves live on their own screen — this is the
              way in, with the plan check's verdict on the front of it (§9) */}
          <button
            type="button"
            className="tap-94"
            onClick={() => go('limits')}
            style={{ ...card('.26s'), textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 19,
                    fontWeight: 600,
                  }}
                >
                  your limits
                </span>
                <span
                  style={{
                    display: 'block',
                    marginTop: 2,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#2C4A36',
                  }}
                >
                  {limitSummary || 'nothing set yet'}
                </span>
              </span>
              <span style={{ display: 'flex', flexShrink: 0 }}>
                {limitedApps.slice(0, 3).map((label, i) => (
                  <span
                    key={label}
                    style={{
                      marginLeft: i ? -8 : 0,
                      borderRadius: 10,
                      border: i ? '2px solid var(--card)' : 0,
                      display: 'flex',
                      background: '#FFFFFF',
                    }}
                  >
                    <AppLogo label={label} size={32} radius={10} />
                  </span>
                ))}
              </span>
            </div>

            {/* the plan check, short form */}
            {check && (
              <span
                style={{
                  display: 'block',
                  padding: '8px 11px',
                  borderRadius: 14,
                  background: check.over ? '#12301A' : 'rgba(18,48,26,0.06)',
                  color: check.over ? '#FFFFFF' : '#2C4A36',
                  fontSize: 12.5,
                  fontWeight: 600,
                  lineHeight: 1.35,
                }}
              >
                {check.over
                  ? `these allow ${fmtMins(check.allows)} a day — ${fmtMins(
                      check.by,
                    )} more than your goal.`
                  : `these allow ${fmtMins(check.allows)} a day. that fits.`}
              </span>
            )}

            {/* anything waiting out its 24 hours in strict mode */}
            {pendingCount > 0 && (
              <span
                style={{
                  alignSelf: 'flex-start',
                  padding: '4px 11px',
                  borderRadius: 999,
                  background: '#12301A',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {pendingCount} change{pendingCount === 1 ? '' : 's'} pending
              </span>
            )}
          </button>

          {/* daily goal — the scoreboard, never a lock (§8) */}
          <div style={card('.28s')}>
            <GoalStepper time={time} setTime={setTime} floor={GOAL_FLOOR_HOURS} />
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#2C4A36' }}>
              drives rilo&apos;s mood, your xp and your streak. it never blocks
              an app — your limits do that.
            </p>
          </div>

          <Section>account</Section>

          {/* plan */}
          <div style={card('.32s')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p
                style={{
                  margin: 0,
                  flexGrow: 1,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 19,
                  fontWeight: 600,
                }}
              >
                your plan
              </p>
              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: isPro ? '#12301A' : '#FFFFFF',
                  color: isPro ? '#FFFFFF' : '#12301A',
                  border: isPro ? 0 : '1.5px solid rgba(18,48,26,0.15)',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {planLabel}
              </span>
            </div>

            <button
              type="button"
              className="tap"
              onClick={() => go('upgrade')}
              style={{
                minHeight: 46,
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: isPro ? 'transparent' : '#12301A',
                color: isPro ? '#12301A' : '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isPro ? 'change plan' : 'see rilo pro'}
            </button>
          </div>

          {/* start over, for the next tester */}
          <button
            type="button"
            className="tap"
            onClick={() => {
              if (
                !window.confirm(
                  'Start over? This clears this tester’s name, picks, xp and progress.',
                )
              ) {
                return;
              }
              onStartOver();
            }}
            style={{
              width: '100%',
              height: 54,
              flexShrink: 0,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.5)',
              border: '2px solid #12301A',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              animation: 'rise14 .4s .36s ease-out both',
            }}
          >
            start over
          </button>

          <Section>demo</Section>

          {/* prototype only — lets a tester see level-ups without waiting weeks */}
          <button
            type="button"
            className="tap"
            onClick={() => onDemoXp(500)}
            style={{
              width: '100%',
              height: 44,
              flexShrink: 0,
              borderRadius: 999,
              background: 'rgba(18,48,26,0.07)',
              border: '1px solid rgba(18,48,26,0.18)',
              color: '#4F6B58',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            demo: +500 xp
          </button>

          {/* skins-15-100 branch: jump far enough to see the high-level skins */}
          <button
            type="button"
            className="tap"
            onClick={() => onDemoXp(5000)}
            style={{
              width: '100%',
              height: 44,
              flexShrink: 0,
              borderRadius: 999,
              background: 'rgba(18,48,26,0.07)',
              border: '1px solid rgba(18,48,26,0.18)',
              color: '#4F6B58',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            demo: +5,000 xp
          </button>
          <button
            type="button"
            className="tap"
            onClick={onNextDay}
            style={demoBtn}
          >
            demo: next day
          </button>

          <button
            type="button"
            className="tap"
            onClick={onNextDayOver}
            style={demoBtn}
          >
            demo: next day (went over)
          </button>

          <button
            type="button"
            className="tap"
            onClick={onNextWeek}
            style={demoBtn}
          >
            demo: next week
          </button>

        </div>
      </div>

      <TabBar active="you" go={go} variant="progress" skin={chosenRilo} />
    </div>
  );
}

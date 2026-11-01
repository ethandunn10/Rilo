/* DEMO ONLY: replace with real AI/API in mobile app.
 *
 * A tester's remote control (§15). Hidden behind a small "demo" button in
 * the corner so it never gets in the way of the app itself. Nothing in here
 * ships to a real phone.
 *
 * The session simulator is the important one: pick an app, pick a length,
 * and the real opens arithmetic runs on it — so you can watch a 5-minute
 * peek cost half an open, a 12-minute sitting cost a whole one, and the
 * app lock itself at the cap without sitting through 15 real minutes. */

import { useState } from 'react';
import { fmtClock } from '../lib/addons';
import AppLogo from './AppLogo';
import { LIMITED, fmtOpens, halfOf, settingFor } from '../lib/limits';
const row = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const btn = {
  minHeight: 38,
  padding: '0 12px',
  borderRadius: 999,
  border: '2px solid #12301A',
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnOn = { ...btn, background: '#12301A', color: '#FFFFFF' };

const dim = { ...btn, opacity: 0.4, cursor: 'default' };

const label = {
  margin: '10px 0 2px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#2C4A36',
};

const note = {
  margin: '2px 0 0',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#3D5A46',
  lineHeight: 1.35,
};

const CLOCKS = [
  { label: 'morning', at: '08:00' },
  { label: 'school', at: '10:00' },
  { label: 'evening', at: '19:00' },
  { label: 'bedtime', at: '23:30' },
];

export default function DemoPanel({
  demoClock,
  onClock,
  onUsage,
  /* the session simulator */
  tracked = [],
  appSettings = {},
  onSimulate,
  /* the ways through */
  onPass,
  onBorrow,
  canBorrow = false,
  passesLeft = 0,
  /* strict mode + time travel */
  strictOn = false,
  onToggleStrict,
  onSkip24h,
  onMidnight,
  onNextDay,
  onNextWeek,
  pendingCount = 0,
  /* jump to */
  onOpenBlocked,
  onLimits,
  onShareCard,
  onBuddies,
  onNight,
  onNightTime,
  onCalendar,
  onReset,
  used,
  goal,
  fmtMins,
}) {
  const [open, setOpen] = useState(false);
  /* which app the simulated session runs on */
  const [pick, setPick] = useState('');

  const app = pick && tracked.includes(pick) ? pick : tracked[0] ?? '';
  const setting = app ? settingFor(appSettings, app) : null;
  const limited = setting?.mode === LIMITED;

  /* the lengths worth testing: a peek (min 0.5), exactly half (still 0.5),
     a minute past half (a whole open), and the full cap */
  const lengths = limited
    ? [
        { mins: 0.2, label: '10 sec', why: 'min ½' },
        { mins: halfOf(setting.minutes), label: `${halfOf(setting.minutes)}m`, why: 'exactly ½' },
        { mins: halfOf(setting.minutes) + 1, label: `${halfOf(setting.minutes) + 1}m`, why: 'full' },
        { mins: setting.minutes, label: `${setting.minutes}m`, why: 'the cap' },
      ]
    : [];

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          left: 10,
          bottom: 96,
          zIndex: 60,
          minHeight: 30,
          padding: '0 10px',
          borderRadius: 999,
          border: '1.5px solid rgba(18,48,26,0.35)',
          background: 'rgba(255,255,255,0.75)',
          color: '#12301A',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        demo
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 60,
        maxHeight: '82%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: 14,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.97)',
        border: '2px solid #12301A',
        boxShadow: '0 16px 40px rgba(10,40,20,0.3)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
      className="scroll-y"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p
          style={{
            margin: 0,
            flexGrow: 1,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          demo panel
        </p>
        <button type="button" onClick={() => setOpen(false)} style={{ ...btn, minHeight: 32 }}>
          close
        </button>
      </div>

      <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
        today: {fmtMins(used)} of {fmtMins(goal)} · {passesLeft} pass
        {passesLeft === 1 ? '' : 'es'} · {strictOn ? 'strict' : 'normal'} · clock{' '}
        {demoClock ? fmtClock(demoClock) : 'real time'}
      </p>

      {/* ---------- open an app for a chosen length ---------- */}
      <p style={label}>simulate a session</p>

      {tracked.length ? (
        <>
          <div className="scroll-x" style={{ display: 'flex', gap: 6, paddingBottom: 2 }}>
            {tracked.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setPick(a)}
                style={{
                  ...(a === app ? btnOn : btn),
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  paddingLeft: 5,
                }}
              >
                <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8 }}>
                  <AppLogo label={a} size={24} radius={8} />
                </span>
                {a}
              </button>
            ))}
          </div>

          {limited ? (
            <>
              <div style={{ ...row, marginTop: 6 }}>
                {lengths.map((l) => (
                  <button
                    key={l.label}
                    type="button"
                    onClick={() => onSimulate(app, l.mins)}
                    style={btn}
                  >
                    {l.label}
                    <span style={{ fontSize: 10.5, opacity: 0.65 }}> · {l.why}</span>
                  </button>
                ))}
              </div>
              <p style={note}>
                {app}: {fmtOpens(setting.opens)} × {setting.minutes} min. half is{' '}
                {halfOf(setting.minutes)} min.{' '}
                {strictOn
                  ? 'strict mode — every one of these costs a whole open.'
                  : 'leave by half and it costs ½.'}
              </p>
            </>
          ) : (
            <p style={note}>
              {app} is {setting?.mode}. only a limited app spends opens — set one on
              the limits screen to test halves.
            </p>
          )}
        </>
      ) : (
        <p style={note}>no apps tracked yet. pick some on the you tab.</p>
      )}

      {/* ---------- the ways through ---------- */}
      <p style={label}>the ways through</p>
      <div style={row}>
        <button
          type="button"
          onClick={() => app && onPass(app)}
          style={passesLeft > 0 && app ? btn : dim}
          disabled={passesLeft <= 0 || !app}
        >
          use the emergency pass
        </button>
        <button
          type="button"
          onClick={() => app && onBorrow(app)}
          style={canBorrow && app ? btn : dim}
          disabled={!canBorrow || !app}
        >
          borrow ½ from tomorrow
        </button>
      </div>
      <p style={note}>
        {canBorrow
          ? 'borrowing needs the pass gone and no opens left — it is.'
          : 'borrowing only shows up with 0 opens left, the pass used, and strict off.'}
      </p>

      {/* ---------- strict mode ---------- */}
      <p style={label}>strict mode</p>
      <div style={row}>
        <button type="button" onClick={onToggleStrict} style={strictOn ? btnOn : btn}>
          {strictOn ? 'strict is on — ask to turn off' : 'turn strict on'}
        </button>
      </div>
      <p style={note}>
        on is instant, off takes 24 hours. use &quot;skip 24 hours&quot; below to land it.
      </p>

      {/* ---------- time travel ---------- */}
      <p style={label}>skip ahead</p>
      <div style={row}>
        <button type="button" onClick={onSkip24h} style={btn}>
          skip 24 hours
          {pendingCount > 0 && (
            <span style={{ fontSize: 10.5, opacity: 0.65 }}> · {pendingCount} pending</span>
          )}
        </button>
        <button type="button" onClick={onMidnight} style={btn}>
          skip to midnight
        </button>
        <button type="button" onClick={onNextDay} style={btn}>
          end the day
        </button>
        <button type="button" onClick={onNextWeek} style={btn}>
          skip a week
        </button>
      </div>
      <p style={note}>
        24 hours lands any pending change. midnight resets opens and the pass
        (and collects a borrow). a week brings the step-down.
      </p>

      {/* ---------- today's usage against the goal ---------- */}
      <p style={label}>today&apos;s usage</p>
      <div style={row}>
        <button type="button" onClick={() => onUsage('under')} style={btn}>
          under goal
        </button>
        <button type="button" onClick={() => onUsage('close')} style={btn}>
          close to it
        </button>
        <button type="button" onClick={() => onUsage('over')} style={btn}>
          way over
        </button>
      </div>
      <p style={note}>moves rilo&apos;s mood and the xp, never a lock.</p>

      {/* ---------- time of day ---------- */}
      <p style={label}>time of day</p>
      <div style={row}>
        {CLOCKS.map((c) => (
          <button key={c.at} type="button" onClick={() => onClock(c.at)} style={btn}>
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => onClock(null)} style={btn}>
          real time
        </button>
      </div>

      {/* ---------- jump to ---------- */}
      <p style={label}>jump to</p>
      <div style={row}>
        <button type="button" onClick={onLimits} style={btn}>
          your limits
        </button>
        <button type="button" onClick={onOpenBlocked} style={btn}>
          the shield
        </button>
        <button type="button" onClick={onShareCard} style={btn}>
          share card
        </button>
        <button type="button" onClick={onBuddies} style={btn}>
          buddies
        </button>
        <button type="button" onClick={onNight} style={btn}>
          the check-in
        </button>
        <button type="button" onClick={onNightTime} style={btn}>
          pick check-in time
        </button>
        <button type="button" onClick={onCalendar} style={btn}>
          calendar
        </button>
      </div>

      <p style={label}>start clean</p>
      <div style={row}>
        <button
          type="button"
          onClick={onReset}
          style={{ ...btn, background: '#12301A', color: '#FFFFFF' }}
        >
          reset all demo data
        </button>
      </div>
    </div>
  );
}

/* "your plan" — the last screen before the paywall, and the one that has
   to earn it.

   Built from the three things they've given: the apps (screen 3), the
   number (screen 5) and what they'd rather be doing (screen 6). It shows
   both halves of the pitch, because the limits on their own are just a
   blocker:

     - your limits        what each app gets
     - instead            two or three specific swaps, with times

   The Pro features are shown rather than hidden. Someone deciding whether
   to pay should be able to see what they'd be paying for, and a lock on a
   named feature reads as honest where a blank space reads as nothing. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';
import BackButton from '../components/BackButton';
import AppLogo from '../components/AppLogo';
import { fmtMins } from '../lib/plan';
import { LIMITED, BLOCKED, FREE, settingFor, fmtOpens } from '../lib/limits';

const LOCKED = [
  { name: 'nightly check-in', sub: 'thirty seconds before bed, tomorrow planned' },
  { name: 'the weekly step-down', sub: 'one thing gets tighter each week' },
  { name: 'where your time goes', sub: 'the full per-app breakdown' },
  { name: 'strict mode', sub: 'no half opens, 24 hours to loosen anything' },
];

function Lock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="11" width="14" height="9" rx="2.5" fill="none" stroke="#3D5A46" strokeWidth="2.2" />
      <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#3D5A46" strokeWidth="2.2" />
    </svg>
  );
}

export default function YourPlan({
  go,
  skin,
  tracked = [],
  appSettings = {},
  instead = [],
  goalMins = 120,
  onEdit,
  next = 'paywall',
  onBack,
}) {
  const limited = tracked.filter((a) => {
    const m = settingFor(appSettings, a).mode;
    return m === LIMITED || m === BLOCKED || m === FREE;
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="low" />

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          boxSizing: 'border-box',
          padding: '52px 22px 0',
          '--tail': '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Dots active={3} />

        <BackButton onBack={onBack} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Rilo skin={skin} mood="proud" size={92} talks />
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              here&apos;s your plan.
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13.5, fontWeight: 600, color: '#2C4A36' }}>
              aiming at {fmtMins(goalMins)} a day.
            </p>
          </div>
        </div>

        {/* ---------- the limits ---------- */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 26,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            your limits
          </p>

          {limited.map((app) => {
            const s = settingFor(appSettings, app);
            return (
              <div key={app} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AppLogo label={app} size={32} radius={10} />
                <span
                  style={{
                    flexGrow: 1,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {app}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1F6B2E' }}>
                  {s.mode === LIMITED
                    ? `${fmtOpens(s.opens)} opens × ${s.minutes} min`
                    : s.mode === BLOCKED
                      ? 'blocked'
                      : 'no limit'}
                </span>
              </div>
            );
          })}

          <button
            type="button"
            className="tap"
            onClick={onEdit}
            style={{
              alignSelf: 'flex-start',
              minHeight: 34,
              padding: '0 12px',
              borderRadius: 999,
              border: '1.5px solid rgba(18,48,26,0.3)',
              background: 'transparent',
              color: '#2C4A36',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            edit
          </button>
        </div>

        {/* ---------- and what replaces it ---------- */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 26,
            background: '#12301A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
          }}
        >
          <div>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}
            >
              what you&apos;ll do instead
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, fontWeight: 600, color: '#9FD8A9' }}>
              this is the part that actually works
            </p>
          </div>

          {instead.map((row) => (
            <div key={row.when + row.what} style={{ display: 'flex', gap: 10 }}>
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 7,
                  height: 7,
                  marginTop: 7,
                  borderRadius: 999,
                  background: '#4CC160',
                }}
              />
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: 1.25,
                  }}
                >
                  {row.when}: {row.what}
                </span>
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#C9E6CE' }}>
                  instead of {row.instead}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* ---------- what pro adds ---------- */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 26,
            background: 'rgba(255,255,255,0.6)',
            border: '2px dashed rgba(18,48,26,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2C4A36' }}>
            with rilo pro
          </p>
          {LOCKED.map((f) => (
            <div key={f.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <span style={{ marginTop: 2 }}>
                <Lock />
              </span>
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 15.5,
                    fontWeight: 600,
                    color: '#3D5A46',
                  }}
                >
                  {f.name}
                </span>
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A7A64' }}>
                  {f.sub}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '10px 22px calc(28px + var(--safe-bottom, 0px))',
        }}
      >
        <button
          type="button"
          className="tap-92"
          onClick={() => go(next)}
          style={{
            width: '100%',
            height: 58,
            border: 0,
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 26px rgba(10,40,20,0.3)',
          }}
        >
          unlock my full plan
        </button>
      </div>
    </div>
  );
}

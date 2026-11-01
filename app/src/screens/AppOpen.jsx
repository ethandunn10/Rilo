/* The app actually running. Nothing to look at on purpose — the demo
   button is there so a tester can burn the session in a few taps.

   The clock counts down the session's CAP, not the app's per-open length.
   Those are the same thing for a full open, and half of it for a quick one
   or when only half an open is left. When it reaches zero the app locks:
   one session never runs past one whole open (§2.4).

   It reports the real minutes used, fractions included, because a
   ten-second peek still has to cost half an open rather than round up to a
   minute and look like a full one. */

import { useEffect, useRef, useState } from 'react';
import AppLogo from '../components/AppLogo';
import { halfOf } from '../lib/limits';

export default function AppOpen({
  app,
  /* how many more minutes this session may run */
  minutes,
  /* minutes already spent in this session before a reopen (§2.6) */
  carried = 0,
  /* 'open' spends an open · 'pass' the emergency pass · 'always' neither */
  kind = 'open',
  /* the app's per-open length, for the line about what this costs */
  perOpen = 15,
  onFinish,
}) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const done = useRef(false);

  const finish = (usedMins) => {
    if (done.current) return;
    done.current = true;
    onFinish(Math.max(0, usedMins));
  };

  /* real seconds, so a session feels like time passing */
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(id);
          /* hit the cap — that's the whole open, the app locks */
          finish(minutes);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    /* one timer for the life of the session */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes, total]);

  const clock = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;

  /* minutes spent so far — the clock on screen is the truth, so the demo's
     "burn 5 min" counts exactly like sitting there for five would */
  const spent = minutes - left / 60;

  /* what this session will cost once they close it */
  const half = halfOf(perOpen);
  const costNote = () => {
    if (kind === 'pass') return 'your emergency pass. five minutes, no opens spent.';
    if (kind === 'always') return 'always allowed. this one never costs you anything.';
    const run = carried + spent;
    return run <= half
      ? `still half an open — leave before ${half} min and it stays that way.`
      : 'this one costs a whole open.';
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#0C0F0D',
        color: '#FFFFFF',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 26,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 16 }}>
        <AppLogo label={app} size={64} radius={16} />
      </span>

      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 30,
          fontWeight: 600,
        }}
      >
        {app} · {clock} left
      </p>

      {/* carrying on a session they only just closed */}
      {carried > 0 && (
        <p
          style={{
            margin: 0,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.12)',
            fontSize: 12.5,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          same session · {Math.round(carried)} min already used
        </p>
      )}

      <p
        style={{
          margin: 0,
          maxWidth: 280,
          textAlign: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.55)',
          lineHeight: 1.4,
        }}
      >
        {costNote()}
      </p>

      <div style={{ flexGrow: 1 }} />

      <button
        type="button"
        className="tap"
        onClick={() => setLeft((v) => Math.max(0, v - 5 * 60))}
        style={{
          width: '100%',
          minHeight: 52,
          borderRadius: 999,
          border: '2px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.08)',
          color: '#FFFFFF',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 17,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        demo: burn 5 min
      </button>

      <button
        type="button"
        className="tap"
        onClick={() => finish(spent)}
        style={{
          width: '100%',
          minHeight: 56,
          borderRadius: 999,
          border: 0,
          background: '#FFFFFF',
          color: '#12301A',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 19,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        close app
      </button>
    </div>
  );
}

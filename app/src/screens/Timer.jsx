/* Timer — the "timer running" screen (fixes round 2).
   Not in designs/: built in the same Touch Grass style.

   App logo + name, a countdown in a ring, Rilo relaxed, and a demo skip.
   For testing the clock runs fast: 1 real second = 1 displayed minute, so a
   15 minute session takes 15 real seconds. When it hits 0 -> check-in. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';

/* the demo speed-up: one real second burns one minute of the session */
const SECONDS_PER_REAL_SECOND = 60;

const R = 104;
const CIRC = 2 * Math.PI * R;

function clock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

export default function Timer({ minutes, app, onEnd, skin }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);

  /* onEnd must not restart the clock if its identity changes */
  const ended = useRef(false);
  const endRef = useRef(onEnd);

  useEffect(() => {
    endRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    const startedAt = performance.now();
    let raf = 0;

    const tick = (now) => {
      const burned = ((now - startedAt) / 1000) * SECONDS_PER_REAL_SECOND;
      const remaining = total - burned;

      if (remaining <= 0) {
        setLeft(0);
        if (!ended.current) {
          ended.current = true;
          endRef.current();
        }
        return;
      }

      setLeft(remaining);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [total]);

  const progress = total ? left / total : 0;

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
      <Sky hills="mid" />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '56px 22px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* which app is open */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 16px 8px 10px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            animation: 'rise .5s ease-out both',
          }}
        >
          <AppLogo label={app} size={32} radius={10} />
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            {app} is open
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            width: 240,
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 8,
              borderRadius: '50%',
              background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            }}
          />
          <svg
            width="240"
            height="240"
            viewBox="0 0 240 240"
            aria-hidden="true"
            style={{ position: 'absolute', left: 0, top: 0 }}
          >
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="12"
            />
            <circle
              cx="120"
              cy="120"
              r={R}
              fill="none"
              stroke="#12301A"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              transform="rotate(-90 120 120)"
            />
          </svg>
          <p
            style={{
              position: 'relative',
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 52,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
            }}
            aria-live="off"
          >
            {clock(left)}
          </p>
        </div>

        {/* Rilo waits it out */}
        <Rilo skin={skin} mood="sleepy" size={150} />

        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
            animation: 'rise .5s .15s ease-out both',
          }}
        >
          you asked for {minutes} minutes. i'll check in when it's up.
        </p>

        <div style={{ flexGrow: 1 }} />

        <button
          type="button"
          className="tap"
          onClick={() => {
            if (!ended.current) {
              ended.current = true;
              onEnd();
            }
          }}
          style={{
            minHeight: 44,
            padding: '0 20px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          skip to the end (demo)
        </button>
      </div>
    </div>
  );
}

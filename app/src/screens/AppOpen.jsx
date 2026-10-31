/* The app actually running. Nothing to look at on purpose — the demo
   buttons are there so a tester can burn 15 minutes in a few taps. */

import { useEffect, useRef, useState } from 'react';
import AppLogo from '../components/AppLogo';

export default function AppOpen({ app, minutes, onFinish }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const burned = useRef(0);
  const done = useRef(false);

  /* real seconds, so a session feels like time passing */
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(id);
          if (!done.current) {
            done.current = true;
            onFinish(minutes);
          }
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
    /* one timer for the life of the session */
  }, [minutes, total, onFinish]);

  const clock = `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;

  const finish = (usedMins) => {
    if (done.current) return;
    done.current = true;
    onFinish(usedMins);
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
        gap: 16,
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

      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
        rilo&apos;s counting this against your day
      </p>

      <div style={{ flexGrow: 1 }} />

      <button
        type="button"
        className="tap"
        onClick={() => {
          const used = Math.min(minutes, burned.current + 5);
          burned.current = used;
          if (used >= minutes) finish(minutes);
          else setLeft((v) => Math.max(0, v - 5 * 60));
        }}
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
        demo: use 5 min
      </button>

      <button
        type="button"
        className="tap"
        onClick={() => finish(Math.max(1, Math.round(minutes - left / 60)))}
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

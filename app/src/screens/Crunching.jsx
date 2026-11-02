/* The beat between allowing Screen Time and seeing the damage. */

import { useEffect, useRef } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

export default function Crunching({ skin, onDone }) {
  /* onDone is a fresh arrow on every parent render, so depending on it
     restarted the timer each time App re-rendered — which meant "1.5
     seconds" was really "1.5 seconds after the app stops re-rendering".
     Holding it in a ref keeps the wait exactly as long as it says. */
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    /* 1.5s. Long enough to feel like he looked, short enough that
       nobody sits waiting for a progress animation. */
    const t = setTimeout(() => done.current?.(), 1500);
    return () => clearTimeout(t);
    /* one timer for the life of the screen */
  }, []);

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
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <Rilo skin={skin} mood="curious" size={190} talks />

        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 26,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          rilo&apos;s crunching your numbers…
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 11,
                height: 11,
                borderRadius: 999,
                background: '#12301A',
                animation: `splash-dot 1.1s ${i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

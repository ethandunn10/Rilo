/* The beat between allowing Screen Time and seeing the damage. */

import { useEffect } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

export default function Crunching({ skin, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
    /* onDone is stable enough for one timer */
  }, [onDone]);

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
        <Rilo skin={skin} mood="curious" size={190} />

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

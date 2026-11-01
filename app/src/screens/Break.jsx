/* Break — exact port of designs/Break.dc.html
   Rilo's reply to "taking a break". */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

const lenBase = {
  minHeight: 48,
  borderRadius: 999,
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 17,
  fontWeight: 600,
  cursor: 'pointer',
};

export default function Break({ go, onStart, onSaidNo, skin }) {
  const [mins, setMins] = useState(15);

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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '56px 22px 0',
          '--tail': '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            alignSelf: 'center',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.6)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          you said: taking a break
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Rilo skin={skin} mood="proud" motion="jump" size={160} />
        </div>

        <div
          style={{
            padding: '16px 18px',
            borderRadius: '24px 24px 24px 8px',
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            animation: 'rise .5s .1s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 21,
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            you earned it. ap bio homework is done. enjoy it, then i'll come get you.
          </p>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 24,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            animation: 'rise .5s .2s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#2C4A36',
            }}
          >
            how long?
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
            }}
          >
            {[5, 10, 15].map((m) => {
              const on = mins === m;
              return (
                <button
                  key={m}
                  type="button"
                  className="tap-94"
                  aria-pressed={on}
                  onClick={() => setMins(m)}
                  style={
                    on
                      ? {
                          ...lenBase,
                          background: '#12301A',
                          color: '#FFFFFF',
                          border: '2px solid #12301A',
                        }
                      : {
                          ...lenBase,
                          background: 'rgba(255,255,255,0.85)',
                          color: '#12301A',
                          border: '2px solid #FFFFFF',
                        }
                  }
                >
                  {m} min
                </button>
              );
            })}
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 46,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            {mins}:00
          </p>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            animation: 'rise .5s .3s ease-out both',
          }}
        >
          <button
            type="button"
            className="tap-94"
            onClick={() => onStart(mins)}
            style={{
              width: '100%',
              height: 56,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            start my break
          </button>
          <button
            type="button"
            onClick={() => {
              onSaidNo();
              go('home', 'back');
            }}
            style={{
              border: 0,
              background: 'transparent',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              padding: 8,
              textAlign: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            actually, never mind
          </button>
        </div>
      </div>
    </div>
  );
}

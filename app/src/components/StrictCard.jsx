/* StrictCard — the strict mode toggle on the You screen.
   Turning it ON is instant. Turning it OFF asks first, because it costs
   them their streak. */

import { useState } from 'react';
import Rilo from './Rilo';

function Sheet({ streak, skin, onKeep, onConfirm }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20 }}>
      <button
        type="button"
        aria-label="Keep strict mode on"
        onClick={onKeep}
        style={{
          position: 'absolute',
          inset: 0,
          border: 0,
          padding: 0,
          background: 'rgba(10,30,18,0.38)',
          cursor: 'pointer',
          animation: 'scrim-in .28s ease-out both',
        }}
      />
      <div
        role="dialog"
        aria-label="Turn off strict mode"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          boxSizing: 'border-box',
          padding: '18px 20px 24px',
          borderRadius: '28px 28px 0 0',
          background: '#F3F7F1',
          borderTop: '2px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          animation: 'sheet-up .3s cubic-bezier(.2,.8,.3,1) both',
        }}
      >
        <Rilo skin={skin} mood="letdown" size={120} />
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 22,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.25,
          }}
        >
          you sure? you&apos;ve got a {streak}-day strict streak.
        </p>

        <button
          type="button"
          className="tap"
          onClick={onKeep}
          style={{
            width: '100%',
            height: 54,
            borderRadius: 999,
            border: '2px solid var(--line)',
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 19,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          keep it on
        </button>
        <button
          type="button"
          className="tap"
          onClick={onConfirm}
          style={{
            width: '100%',
            height: 48,
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
          turn it off
        </button>
      </div>
    </div>
  );
}

export default function StrictCard({ style, on, streak, skin, onTurnOn, onTurnOff }) {
  const [asking, setAsking] = useState(false);

  return (
    <>
      <div style={style}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}
            >
              strict mode
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              no &quot;5 more minutes&quot;, and apps lock once you hit your goal.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Strict mode"
            className="tap"
            onClick={() => (on ? setAsking(true) : onTurnOn())}
            style={{
              width: 62,
              height: 34,
              flexShrink: 0,
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: on ? 'flex-end' : 'flex-start',
              boxShadow: '0 3px 0 var(--line)',
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                margin: '0 3px',
                borderRadius: 999,
                background: on ? '#FFFFFF' : '#12301A',
                transition: 'background .2s ease',
              }}
            />
          </button>
        </div>

        {on && (
          <p
            style={{
              margin: 0,
              alignSelf: 'flex-start',
              padding: '5px 12px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            🔥 strict streak: {streak} {streak === 1 ? 'day' : 'days'}
          </p>
        )}
      </div>

      {asking && (
        <Sheet
          streak={streak}
          skin={skin}
          onKeep={() => setAsking(false)}
          onConfirm={() => {
            setAsking(false);
            onTurnOff();
          }}
        />
      )}
    </>
  );
}

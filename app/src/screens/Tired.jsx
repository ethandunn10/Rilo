/* Tired — exact port of designs/Tired.dc.html
   Rilo's reply to "just tired". Uses the dusk sky. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

export default function Tired({ onStart, onSaidNo, skin }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#FFFFFF',
      }}
    >
      <Sky hills="mid" tone="dusk" />

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
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.3)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          you said: just tired
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Rilo skin={skin} mood="sleepy" size={170} talks />
        </div>

        <div
          style={{
            padding: '16px 18px',
            borderRadius: '24px 24px 24px 8px',
            background: 'rgba(18,22,48,0.55)',
            border: '2px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 0 rgba(255,255,255,0.35)',
            animation: 'rise .6s .1s ease-out both',
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
            brain's fried? scrolling won't fix that. ten minutes of nothing will.
          </p>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 24,
            background: 'rgba(18,22,48,0.55)',
            border: '2px solid rgba(255,255,255,0.55)',
            boxShadow: '0 4px 0 rgba(255,255,255,0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'rise .6s .2s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#C8CDF0',
            }}
          >
            try this
          </p>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 600 }}>
            phone face down, 10 min
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#D9DCF2' }}>
            lie down, music on, eyes closed · +20 xp
          </p>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'rise .6s .3s ease-out both',
          }}
        >
          <button
            type="button"
            className="tap"
            onClick={() => onSaidNo()}
            style={{
              width: '100%',
              height: 56,
              border: 0,
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#1E2850',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(10,10,40,0.3)',
            }}
          >
            okay, resting
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => onStart(5)}
            style={{
              width: '100%',
              height: 52,
              boxSizing: 'border-box',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.12)',
              border: '1.5px solid rgba(255,255,255,0.6)',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            give me 5 minutes
          </button>
        </div>
      </div>
    </div>
  );
}

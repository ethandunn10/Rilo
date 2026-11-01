/* Suggestion — exact port of designs/Suggestion.dc.html
   Rilo's reply to "i'm bored". The activity comes from the hobbies picked in
   onboarding; with the default picks it reads exactly as the design. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { suggestion } from '../lib/profile';

export default function Suggestion({ go, about, app, onStart, onSaidNo, skin }) {
  const s = suggestion(about, app);

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
          you said: i'm bored
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Rilo skin={skin} mood="coach" motion="jump" size={170} />
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
            {s.bubble}
          </p>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 24,
            background: '#12301A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
            animation: 'rise .5s .2s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9FD8A9',
            }}
          >
            do this instead
          </p>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 600 }}>
            {s.task}
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#C9E6CE' }}>{s.meta}</p>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'rise .5s .3s ease-out both',
          }}
        >
          <button
            type="button"
            className="tap"
            onClick={() => onSaidNo()}
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
            i'm going
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
              background: 'rgba(255,255,255,0.18)',
              border: '1.5px solid rgba(255,255,255,0.7)',
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
          <button
            type="button"
            onClick={() => go('home', 'back')}
            style={{
              border: 0,
              background: 'transparent',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              padding: 6,
              textAlign: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            suggest something else
          </button>
        </div>
      </div>
    </div>
  );
}

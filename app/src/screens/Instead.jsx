/* Instead — exact port of designs/Instead.dc.html */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';

export default function Instead({ go, skin }) {
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

      <div style={{ position: 'absolute', left: 0, right: 0, top: 56 }}>
        <Dots active={1} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: 92,
          padding: '20px 18px',
          borderRadius: 30,
          background: 'var(--card)',
          border: '2px solid var(--line)',
          boxShadow: '0 4px 0 var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'rise .6s ease-out both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ animation: 'pop .7s .15s cubic-bezier(.2,.9,.3,1.2) both' }}>
            <Rilo skin={skin} mood="coach" size={100} />
          </div>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            bored? you said you're working on your jumper.
          </p>
        </div>
        <div
          style={{
            borderRadius: 22,
            background: '#12301A',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            color: '#FFFFFF',
            animation: 'rise .5s .35s ease-out both',
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
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            shoot 50 free throws
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#C9E6CE' }}>
            about 20 min · +40 xp
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, animation: 'rise .5s .45s ease-out both' }}>
          <span
            style={{
              flexGrow: 1,
              height: 46,
              borderRadius: 999,
              background: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(20,60,40,0.12)',
            }}
          >
            i'm going
          </span>
          <span
            style={{
              flexGrow: 1,
              height: 46,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.4)',
              border: '1.5px solid #FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            not now
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          top: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          animation: 'rise .6s .3s ease-out both',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 34,
            fontWeight: 700,
            lineHeight: 1.05,
          }}
        >
          i don't just block apps. i know you.
        </h1>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.45, color: '#2C4A36' }}>
          i learn what you're into and point you at it right when you're about to lose an hour.
        </p>
      </div>

      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 34 }}>
        <button
          type="button"
          className="tap"
          onClick={() => go('talk')}
          style={{
            width: '100%',
            height: 58,
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
          next
        </button>
      </div>
    </div>
  );
}

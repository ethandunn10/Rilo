/* HowItWorks — exact port of designs/HowItWorks.dc.html */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';

const chip = {
  padding: '9px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.85)',
  border: '1.5px solid #FFFFFF',
  fontSize: 14,
  fontWeight: 700,
};

export default function HowItWorks({ go, skin }) {
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
        <Dots active={0} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: 92,
          padding: '22px 18px',
          borderRadius: 30,
          background: 'var(--card)',
          border: '2px solid var(--line)',
          boxShadow: '0 4px 0 var(--line)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          animation: 'rise .6s ease-out both',
        }}
      >
        <p
          style={{
            margin: 0,
            padding: '5px 12px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          YOU OPEN TIKTOK…
        </p>
        <div style={{ animation: 'pop .7s .2s cubic-bezier(.2,.9,.3,1.2) both' }}>
          <Rilo skin={skin} mood="curious" size={140} />
        </div>
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 24,
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          what's up? why tiktok right now?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          <span style={{ ...chip, animation: 'rise .4s .45s ease-out both' }}>i'm bored</span>
          <span style={{ ...chip, animation: 'rise .4s .55s ease-out both' }}>just tired</span>
          <span style={{ ...chip, animation: 'rise .4s .65s ease-out both' }}>need it</span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 28,
          right: 28,
          top: 486,
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
          i check in before you get sucked in.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.45,
            color: '#2C4A36',
          }}
        >
          open an app you're cutting back on and i'll pop up. one tap tells me why. no lectures.
        </p>
      </div>

      <div style={{ position: 'absolute', left: 24, right: 24, bottom: 34 }}>
        <button
          type="button"
          className="tap"
          onClick={() => go('instead')}
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

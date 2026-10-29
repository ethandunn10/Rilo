/* StrictAsk — Rilo offering strict mode after a rough day.
   Shown at most once a day, and not at all for a week after three
   "not yet"s (see lib/strict). */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

export default function StrictAsk({ skin, onAccept, onDecline }) {
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
          padding: '72px 22px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Rilo skin={skin} mood="letdown" size={200} />

        <div
          style={{
            padding: '18px 18px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            animation: 'rise .5s .1s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 26,
              fontWeight: 600,
              lineHeight: 1.25,
              textAlign: 'center',
            }}
          >
            this isn't working. want me to get strict?
          </p>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          no "5 more minutes", and your apps lock once you hit your goal.
          three need-its a day if something's real.
        </p>

        <div style={{ flexGrow: 1 }} />

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            className="tap"
            onClick={onAccept}
            style={{
              width: '100%',
              height: 56,
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            lock it down
          </button>
          <button
            type="button"
            className="tap"
            onClick={onDecline}
            style={{
              width: '100%',
              height: 52,
              boxSizing: 'border-box',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.85)',
              border: '2px solid var(--line)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            not yet
          </button>
        </div>
      </div>
    </div>
  );
}

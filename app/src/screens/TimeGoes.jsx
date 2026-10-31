/* "where your time goes" — the first time they see the damage written down. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Breakdown from '../components/Breakdown';
import { fmtMins } from '../lib/plan';

export default function TimeGoes({ go, skin, breakdown }) {
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
          padding: '52px 22px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Rilo skin={skin} mood="coach" size={80} />
          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                lineHeight: 1.05,
              }}
            >
              {breakdown?.allowed === false ? 'your apps' : 'where your time goes'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#2C4A36' }}>
              {fmtMins(breakdown?.total ?? 0)} a day
              {breakdown?.allowed === false ? ", split even — i'm guessing" : ', all in'}
            </p>
          </div>
        </div>

        <div
          className="scroll-y"
          style={{
            flexGrow: 1,
            minHeight: 0,
            padding: 16,
            borderRadius: 26,
            background: 'rgba(255,255,255,0.62)',
            border: '1.5px solid rgba(255,255,255,0.95)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 10px 30px rgba(20,60,40,0.1)',
            animation: 'rise .5s .1s ease-out both',
          }}
        >
          <Breakdown breakdown={breakdown} />
        </div>

        <button
          type="button"
          className="tap"
          onClick={() => go('timeback')}
          style={{
            width: '100%',
            height: 58,
            flexShrink: 0,
            border: 0,
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
          }}
        >
          let&apos;s fix it
        </button>
      </div>
    </div>
  );
}

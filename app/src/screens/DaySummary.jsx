/* How the day went. Shown when a day ends — the only place XP is handed
   out now, because it's the only place results exist. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { fmtMins } from '../lib/plan';

const stat = {
  flex: 1,
  padding: '14px 8px',
  borderRadius: 22,
  background: 'rgba(255,255,255,0.75)',
  border: '2px solid var(--line, #12301A)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  textAlign: 'center',
};

export default function DaySummary({ skin, result, onDone }) {
  if (!result) return null;
  const { used, goal, hit, xp, streak, under } = result;

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
          padding: '62px 22px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Rilo skin={skin} mood={hit ? 'proud' : 'letdown'} motion={hit ? 'jump' : 'idle'} size={180} />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 32,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {hit ? "that's a day." : 'we went over.'}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
          }}
        >
          {fmtMins(used)} used · {fmtMins(goal)} goal
        </p>

        <div style={{ width: '100%', display: 'flex', gap: 10 }}>
          <div style={stat}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: '#1F6B2E',
              }}
            >
              {under > 0 ? fmtMins(under) : '0m'}
            </p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>saved</p>
          </div>
          <div style={stat}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: xp >= 0 ? '#1F6B2E' : '#A33A2B',
              }}
            >
              {xp >= 0 ? '+' : ''}
              {xp}
            </p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>xp</p>
          </div>
          <div style={stat}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 24,
                fontWeight: 700,
                color: '#1F6B2E',
              }}
            >
              {streak}
            </p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>day streak</p>
          </div>
        </div>

        <div style={{ flexGrow: 1 }} />

        <button
          type="button"
          className="tap"
          onClick={onDone}
          style={{
            width: '100%',
            height: 56,
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
          {hit ? 'nice' : 'tomorrow then'}
        </button>
      </div>
    </div>
  );
}

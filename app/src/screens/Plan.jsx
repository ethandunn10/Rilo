/* Plan — exact port of designs/Plan.dc.html */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';

const ROWS = [
  ['3:15', 'chill + snack', '15 min free scroll allowed', 'done'],
  ['3:45', 'ap bio homework', 'apps locked for 45 min', 'done'],
  ['4:30', 'shoot 50 free throws', 'up next · +40 xp', 'now'],
  ['5:15', 'film 2 videos', 'creator mode on', ''],
  ['6:30', 'dinner', 'phone away', ''],
  ['7:30', 'ap gov review', 'apps locked for 40 min', ''],
  ['9:00', 'free time', '30 min scroll allowed', ''],
];

const dotStyle = (status) => {
  if (status === 'now') {
    return {
      width: 14,
      height: 14,
      borderRadius: 7,
      background: '#2E8B3E',
      flexShrink: 0,
      animation: 'pulse 1.8s infinite',
    };
  }
  if (status === 'done') {
    return { width: 14, height: 14, borderRadius: 7, background: '#12301A', flexShrink: 0 };
  }
  return {
    width: 14,
    height: 14,
    borderRadius: 7,
    border: '2.5px solid #7FA38A',
    boxSizing: 'border-box',
    flexShrink: 0,
  };
};

const rowStyle = (status, i) => {
  const animation = `rise14 .4s ${(0.05 + i * 0.05).toFixed(2)}s ease-out both`;
  if (status === 'now') {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 12px',
      margin: '3px -12px',
      borderRadius: 18,
      background: '#FFFFFF',
      boxShadow: '0 6px 16px rgba(20,60,40,0.12)',
      animation,
    };
  }
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 0',
    opacity: status === 'done' ? 0.5 : 1,
    animation,
  };
};

export default function Plan({ go, skin, locked = false, onUpgrade }) {
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
          padding: '52px 20px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'rise14 .4s ease-out both',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                today's plan
              </h1>
              <span
                style={{
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: '#12301A',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                pro
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2C4A36' }}>
              made by rilo from your goals
            </p>
          </div>
          <Rilo skin={skin} mood="proud" size={74} />
        </div>

        <div
          style={{
            padding: '6px 16px',
            borderRadius: 26,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {ROWS.map(([time, title, sub, status], i) => (
            <div key={time} style={rowStyle(status, i)}>
              <p
                style={{
                  margin: 0,
                  width: 44,
                  flexShrink: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#3D5A46',
                }}
              >
                {time}
              </p>
              <span style={dotStyle(status)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 17,
                    fontWeight: 600,
                  }}
                >
                  {title}
                </p>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* today's plan is rilo pro — free sees it, blurred, with the way in */}
      {locked && (
        <button
          type="button"
          className="tap"
          onClick={onUpgrade}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: 0,
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
            cursor: 'pointer',
          }}
        >
          <Rilo skin="gold" mood="coach" size={140} />
          <span
            style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 26,
              fontWeight: 600,
              color: '#12301A',
            }}
          >
            today&apos;s plan
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#2C4A36' }}>
            your day, built around your goals
          </span>
          <span
            style={{
              marginTop: 4,
              padding: '9px 18px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            try rilo pro free
          </span>
        </button>
      )}

      <TabBar active="plan" go={go} variant="plan" skin={skin} />
    </div>
  );
}

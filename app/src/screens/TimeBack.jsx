/* TimeBack — exact port of designs/TimeBack.dc.html
   The screen-time / goal numbers live in App so the choice survives the flow. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { TalkCircle } from '../components/TalkBits';
import { hoursIn } from '../lib/listen';

const MAX = 10;

function fmt(h) {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

const stepBtn = {
  width: 44,
  height: 44,
  borderRadius: 22,
  border: 0,
  background: '#FFFFFF',
  fontSize: 22,
  fontWeight: 700,
  color: '#12301A',
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(20,60,40,0.1)',
};

const trackStyle = {
  height: 22,
  borderRadius: 11,
  background: 'rgba(18,48,26,0.08)',
  overflow: 'hidden',
};

const bar = (h, background) => ({
  height: 22,
  borderRadius: 11,
  background,
  width: `${Math.round((h / MAX) * 100)}%`,
  transition: 'width 0.5s cubic-bezier(.2,.8,.3,1)',
});

const statCard = {
  padding: '14px 16px',
  borderRadius: 22,
  background: 'var(--card)',
  border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
};

export default function TimeBack({ go, time, setTime, skin }) {
  const { now, goal } = time;
  const saved = Math.max(0, now - goal);

  const yearHours = Math.round(saved * 365).toLocaleString('en-US');
  const yearDays = Math.round((saved * 365) / 24);
  const weekHours = Math.round(saved * 7 * 10) / 10;
  const sessions = Math.round(saved * 365).toLocaleString('en-US');

  /* say it instead: "like 5 hours, i want to get to 2" */
  const hearTime = (said) => {
    const nums = hoursIn(said);
    if (!nums.length) return '';
    const isGoal = nums.length === 1 && /goal|want|get (it )?(down )?to|only|aim/.test(said.toLowerCase());
    let n = nums.length > 1 || !isGoal ? nums[0] : now;
    let g = nums.length > 1 ? nums[1] : isGoal ? nums[0] : goal;
    n = Math.min(MAX, Math.round(n * 2) / 2);
    g = Math.max(0.5, Math.min(n - 0.5, Math.round(g * 2) / 2));
    setTime({ now: n, goal: g });
    return `${n}h a day now, goal ${g}h. we got this.`;
  };

  const nowUp = () => setTime({ ...time, now: Math.min(MAX, now + 0.5) });
  const nowDown = () => setTime({ ...time, now: Math.max(goal + 0.5, now - 0.5) });
  const goalUp = () => setTime({ ...time, goal: Math.min(now - 0.5, goal + 0.5) });
  const goalDown = () => setTime({ ...time, goal: Math.max(0.5, goal - 0.5) });

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
          padding: '48px 24px 34px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'rise .5s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="proud" motion="jump" size={96} />
          <h1
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 28,
              fontWeight: 700,
              lineHeight: 1.05,
            }}
          >
            here's what we're getting back.
          </h1>
        </div>

        <div
          style={{
            padding: 18,
            borderRadius: 26,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            animation: 'rise .5s .1s ease-out both',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                screen time now
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="tap-92"
                  aria-label="Less screen time now"
                  onClick={nowDown}
                  style={stepBtn}
                >
                  −
                </button>
                <p
                  style={{
                    margin: 0,
                    minWidth: 70,
                    textAlign: 'center',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {fmt(now)}
                </p>
                <button
                  type="button"
                  className="tap-92"
                  aria-label="More screen time now"
                  onClick={nowUp}
                  style={stepBtn}
                >
                  +
                </button>
              </div>
            </div>
            <div style={trackStyle}>
              <div style={bar(now, '#9EB8A4')} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
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
                goal with rilo
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  type="button"
                  className="tap-92"
                  aria-label="Lower goal"
                  onClick={goalDown}
                  style={stepBtn}
                >
                  −
                </button>
                <p
                  style={{
                    margin: 0,
                    minWidth: 70,
                    textAlign: 'center',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#1F6B2E',
                  }}
                >
                  {fmt(goal)}
                </p>
                <button
                  type="button"
                  className="tap-92"
                  aria-label="Raise goal"
                  onClick={goalUp}
                  style={stepBtn}
                >
                  +
                </button>
              </div>
            </div>
            <div style={trackStyle}>
              <div style={bar(goal, 'linear-gradient(90deg, #4CC160, #2E8B3E)')} />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 26,
            background: '#12301A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 14px 34px rgba(10,40,20,0.25)',
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
            time back every year
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {yearHours} hrs
          </p>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#C9E6CE' }}>
            that's {yearDays} full days. every single year.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
            animation: 'rise .5s .3s ease-out both',
          }}
        >
          <div style={statCard}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {weekHours} hrs
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              back every week
            </p>
          </div>
          <div style={statCard}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {sessions}
            </p>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              hour-long practices
            </p>
          </div>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <button
          type="button"
          className="tap-92"
          onClick={() => go('paywall')}
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 58,
            flexShrink: 0,
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
          let's get it back
        </button>
          <TalkCircle skin={skin} onHeard={hearTime} />
        </div>
      </div>
    </div>
  );
}

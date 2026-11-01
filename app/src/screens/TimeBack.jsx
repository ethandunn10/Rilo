/* TimeBack — port of designs/TimeBack.dc.html.
   The screen-time / goal numbers live in App so the choice survives the flow.

   This is where the DAILY GOAL gets set, and that's all it sets. The goal is
   a scoreboard (§8): it drives Rilo's mood, the xp, the streak and the
   weekly step-down, and it never blocks anything. The limits that DO block
   things come next, on the limits screen.

   There used to be a 30-day plan ladder here, stepping the goal down a
   quarter of the gap each week. That's gone — the goal is one number now,
   and what tightens over time is the per-app limits, one thing a week. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { GOAL_FLOOR_HOURS, fmtMins } from '../lib/plan';

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

export default function TimeBack({ go, time, setTime, skin, check }) {
  const { now, goal } = time;
  const saved = Math.max(0, now - goal);
  const weekHours = Math.round(saved * 7 * 10) / 10;
  const sessions = Math.round(saved * 365).toLocaleString('en-US');

  /* the only floor is a sane one — nothing is cut up into per-app budgets
     any more, so the goal can be whatever they want to aim at */
  const floor = GOAL_FLOOR_HOURS;
  const atFloor = goal <= floor;

  const nowUp = () => setTime({ ...time, now: Math.min(MAX, now + 0.5) });
  const nowDown = () => setTime({ ...time, now: Math.max(goal + 0.5, now - 0.5) });
  const goalUp = () => setTime({ ...time, goal: Math.min(now - 0.5, goal + 0.5) });
  const goalDown = () => setTime({ ...time, goal: Math.max(floor, goal - 0.5) });

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

      {/* the plan card grows when they open it, so the screen scrolls */}
      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '48px 24px 0',
          '--tail': '34px',
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

            {/* the goal is a scoreboard, so say so plainly here too */}
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: atFloor ? '#B4631A' : '#2C4A36',
                lineHeight: 1.3,
              }}
            >
              {atFloor
                ? `${fmt(floor)} is as low as it goes.`
                : `this never locks an app. it's what you're aiming at.`}
            </p>
          </div>
        </div>

        {/* What the limits currently allow, against the goal they just set
            (§9). It's only a heads-up here — the next screen is where they
            actually set the limits, and the same check lives there. */}
        {check && (
          <div
            style={{
              padding: 18,
              borderRadius: 26,
              background: '#12301A',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
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
              next: your limits
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 19,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {check.over
                ? `right now your limits would allow ${fmtMins(check.allows)} a day. we'll tighten them until they fit.`
                : `i'll set opens on each app so the day actually fits in ${fmtMins(
                    check.goal,
                  )}.`}
            </p>
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#C9E6CE' }}>
              a limited app gets x opens a day, y minutes each. leave early
              and it only costs half an open.
            </p>
          </div>
        )}

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

        <div style={{ flexGrow: 1, flexShrink: 1, minHeight: 0 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <button
          type="button"
          className="tap-92"
          onClick={() => go('limitsonboard')}
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
          set my limits
        </button>
        </div>
      </div>
    </div>
  );
}

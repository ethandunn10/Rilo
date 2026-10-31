/* TimeBack — exact port of designs/TimeBack.dc.html
   The screen-time / goal numbers live in App so the choice survives the flow. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import PlanPicker from '../components/PlanPicker';
import { weekGoals, blockedGoalFor, goalFloorHours, hoursToMins, fmtMins } from '../lib/plan';

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

export default function TimeBack({
  go,
  time,
  setTime,
  skin,
  breakdown,
  apps,
  setApps,
  pace,
  setPace,
  sessionMins,
  setSessionMins,
  isPro = false,
  planMode = 'rilo',
  setPlanMode = () => {},
  hobbies = [],
  goalList = [],
}) {
  const { now, goal } = time;
  const saved = Math.max(0, now - goal);
  const weekHours = Math.round(saved * 7 * 10) / 10;
  const sessions = Math.round(saved * 365).toLocaleString('en-US');

  const startMins = hoursToMins(now);
  const blockedBase = breakdown?.blocked ?? startMins;
  const goals = weekGoals(startMins, hoursToMins(goal), pace);
  /* they can't aim below the time Rilo doesn't control */
  const floor = goalFloorHours(startMins, blockedBase);
  const atFloor = goal <= floor;

  const [editing, setEditing] = useState(false);

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

            {/* Rilo only controls the apps they blocked, so say where the
                floor is instead of sending them off to block more. */}
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: atFloor ? '#FFD9A8' : '#C9E6CE',
                lineHeight: 1.3,
              }}
            >
              {atFloor
                ? `that's as low as it goes with these apps. block another to aim lower.`
                : `lowest you can go with these apps: ${fmt(floor)}.`}
            </p>
          </div>
        </div>

        {/* the 30-day plan is rilo pro; free just has the limit above */}
        {isPro && (
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
              your {goals.length === 1 ? '1-week' : `${goals.length}-week`} plan
            </p>
  
            <button
              type="button"
              className="tap"
              onClick={() => setEditing((v) => !v)}
              style={{
                alignSelf: 'stretch',
                minHeight: 46,
                marginTop: 4,
                padding: '0 18px',
                borderRadius: 999,
                border: 0,
                background: '#FFFFFF',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 0 rgba(0,0,0,0.28)',
              }}
            >
              {editing ? 'done' : 'change my plan'}
            </button>
  
            {editing && (
              <PlanPicker
                pace={pace}
                setPace={setPace}
                sessionMins={sessionMins}
                setSessionMins={setSessionMins}
                dark
              />
            )}
  
            {goals.map((g, i) => (
              <div
                key={g + '-' + i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 0',
                  borderBottom:
                    i === goals.length - 1 ? 0 : '1px solid rgba(255,255,255,0.14)',
                }}
              >
                <span
                  style={{
                    width: 58,
                    flexShrink: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#9FD8A9',
                  }}
                >
                  week {i + 1}
                </span>
                <span
                  style={{
                    flexGrow: 1,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  {fmtMins(g)} a day
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#C9E6CE' }}>
                  {fmtMins(Math.max(0, blockedGoalFor(g, startMins, blockedBase)))} on apps
                </span>
              </div>
            ))}
  
            <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 600, color: '#C9E6CE' }}>
              {goals.length === 1
                ? "straight in at your goal. no easing in."
                : `you hit your goal in ${goals.length * 7} days.`}
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
          onClick={() => go('home')}
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
        </div>
      </div>
    </div>
  );
}

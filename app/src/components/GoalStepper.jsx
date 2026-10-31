/* GoalStepper — the daily screen-time goal with +/- buttons.
   Same controls and clamping as Your time back (TimeBack.dc.html). */

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

const MAX = 10;

function fmtHours(h) {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  return mins ? `${whole}h ${mins}m` : `${whole}h`;
}

export default function GoalStepper({
  time,
  setTime,
  label = 'daily screen time goal',
  floor = 0.5,
}) {
  const { now, goal } = time;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: '#2C4A36',
          }}
        >
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="tap-92"
            aria-label="Lower goal"
            onClick={() => setTime({ ...time, goal: Math.max(floor, goal - 0.5) })}
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
            {fmtHours(goal)}
          </p>
          <button
            type="button"
            className="tap-92"
            aria-label="Raise goal"
            onClick={() => setTime({ ...time, goal: Math.min(Math.min(now, MAX), goal + 0.5) })}
            style={stepBtn}
          >
            +
          </button>
        </div>
      </div>
      <div
        style={{
          height: 22,
          borderRadius: 11,
          background: 'rgba(18,48,26,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 22,
            borderRadius: 11,
            background: 'linear-gradient(90deg, #4CC160, #2E8B3E)',
            width: `${Math.round((goal / MAX) * 100)}%`,
            transition: 'width 0.5s cubic-bezier(.2,.8,.3,1)',
          }}
        />
      </div>
    </div>
  );
}

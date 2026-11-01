/* Bedtime, school mode and focus blocks.

   All three lock the same set of apps: blocked and limited ones go away,
   always-allowed ones never do, and the emergency pass works through all of
   it (§14). None of them is location-based — they're all just windows. */

import { SCHOOL_DAYS, fmtClock } from '../lib/addons';

const DAY_LABEL = { mon: 'm', tue: 't', wed: 'w', thu: 't', fri: 'f', sat: 's', sun: 's' };

const timeInput = {
  height: 42,
  boxSizing: 'border-box',
  padding: '0 10px',
  borderRadius: 14,
  border: '2px solid var(--line, #12301A)',
  background: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#12301A',
};

function Toggle({ on, onTap, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="tap"
      onClick={onTap}
      style={{
        width: 62,
        height: 34,
        flexShrink: 0,
        borderRadius: 999,
        border: '2px solid var(--line, #12301A)',
        background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
        cursor: 'pointer',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          margin: '0 3px',
          borderRadius: 999,
          background: on ? '#FFFFFF' : '#12301A',
        }}
      />
    </button>
  );
}

/* a focus block is "lock it for the next N minutes", from now */
const FOCUS_LENGTHS = [30, 45, 60, 90];

function endsIn(mins) {
  const d = new Date(Date.now() + mins * 60000);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ScheduleCard({
  style,
  bedtime,
  setBedtime,
  school,
  setSchool,
  focus = { on: false, until: '' },
  setFocus = () => {},
}) {
  const toggleDay = (d) => {
    const days = school.days ?? [];
    setSchool({
      ...school,
      days: days.includes(d) ? days.filter((x) => x !== d) : days.concat([d]),
    });
  };

  return (
    <div style={style}>
      {/* bedtime */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            bedtime mode
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            rilo sleeps, your apps lock till morning.
          </p>
        </div>
        <Toggle on={bedtime.on} label="Bedtime mode" onTap={() => setBedtime({ ...bedtime, on: !bedtime.on })} />
      </div>

      {bedtime.on && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="time"
            value={bedtime.from}
            onChange={(e) => setBedtime({ ...bedtime, from: e.target.value })}
            style={{ ...timeInput, flex: 1 }}
          />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>to</span>
          <input
            type="time"
            value={bedtime.to}
            onChange={(e) => setBedtime({ ...bedtime, to: e.target.value })}
            style={{ ...timeInput, flex: 1 }}
          />
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(18,48,26,0.12)' }} />

      {/* school */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            school mode
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            locks on a schedule, not where you are.
          </p>
        </div>
        <Toggle on={school.on} label="School mode" onTap={() => setSchool({ ...school, on: !school.on })} />
      </div>

      {school.on && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {SCHOOL_DAYS.map((d) => {
              const on = (school.days ?? []).includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  className="tap"
                  aria-pressed={on}
                  aria-label={d}
                  onClick={() => toggleDay(d)}
                  style={{
                    flex: 1,
                    minHeight: 38,
                    borderRadius: 999,
                    border: '2px solid var(--line, #12301A)',
                    background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
                    color: on ? '#FFFFFF' : '#12301A',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {DAY_LABEL[d]}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="time"
              value={school.from}
              onChange={(e) => setSchool({ ...school, from: e.target.value })}
              style={{ ...timeInput, flex: 1 }}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>to</span>
            <input
              type="time"
              value={school.to}
              onChange={(e) => setSchool({ ...school, to: e.target.value })}
              style={{ ...timeInput, flex: 1 }}
            />
          </div>
        </div>
      )}

      <div style={{ height: 1, background: 'rgba(18,48,26,0.12)' }} />

      {/* focus block — the one you start yourself, right now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            focus block
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            {focus.on
              ? `on till ${fmtClock(focus.until)}. apps locked.`
              : 'lock everything for a while, starting now.'}
          </p>
        </div>
        <Toggle
          on={focus.on}
          label="Focus block"
          onTap={() => setFocus(focus.on ? { on: false, until: '' } : { on: true, until: endsIn(45) })}
        />
      </div>

      {!focus.on && (
        <div style={{ display: 'flex', gap: 5 }}>
          {FOCUS_LENGTHS.map((m) => (
            <button
              key={m}
              type="button"
              className="tap"
              onClick={() => setFocus({ on: true, until: endsIn(m) })}
              style={{
                flex: 1,
                minHeight: 38,
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: 'rgba(255,255,255,0.9)',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      {(bedtime.on || school.on || focus.on) && (
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
          always-allowed apps keep working, and so does your emergency pass
          {bedtime.on ? `, even after ${fmtClock(bedtime.from)}` : ''}.
        </p>
      )}
    </div>
  );
}

/* Plan — exact port of designs/Plan.dc.html */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import { riloSchedule } from '../demo/mockAI';

const ROWS = [
  ['3:15', 'chill + snack', '15 min free scroll allowed', 'done'],
  ['3:45', 'ap bio homework', 'apps locked for 45 min', 'done'],
  ['4:30', 'shoot 50 free throws', 'up next · +40 xp', 'now'],
  ['5:15', 'film 2 videos', 'creator mode on', ''],
  ['6:30', 'dinner', 'phone away', ''],
  ['7:30', 'ap gov review', 'apps locked for 40 min', ''],
  ['9:00', 'free time', '30 min scroll allowed', ''],
];

const cellInput = (width) => ({
  width: width ?? '100%',
  boxSizing: 'border-box',
  minWidth: 0,
  height: 26,
  padding: '0 8px',
  borderRadius: 10,
  border: '1.5px solid rgba(18,48,26,0.35)',
  background: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  color: '#12301A',
});

const modeBtn = (on) => ({
  flex: 1,
  minHeight: 38,
  borderRadius: 999,
  border: '2px solid #12301A',
  background: on ? '#12301A' : 'rgba(255,255,255,0.85)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
});

const addBtn = {
  marginTop: 8,
  minHeight: 42,
  width: '100%',
  borderRadius: 999,
  border: '2px dashed rgba(18,48,26,0.4)',
  background: 'transparent',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

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

export default function Plan({
  go,
  skin,
  locked = false,
  onUpgrade,
  /* ---- add-ons (rilo-addons-test) ---- */
  schedule = { mode: 'rilo', rows: [] },
  setSchedule = () => {},
  hobbies = [],
  goals = [],
  school,
  bedtime,
  scrollMins = 60,
  weekAhead = [],
}) {
  const [editing, setEditing] = useState(false);

  /* Rilo's version until they make their own; the design's day is the
     fallback so the screen is never empty. */
  const rows = schedule.rows?.length
    ? schedule.rows
    : ROWS.map(([at, title, note]) => ({ at, title, note }));

  const letRiloDoIt = () => {
    setSchedule({
      mode: 'rilo',
      rows: riloSchedule({ hobbies, goals, school, bedtime, scrollMins }),
    });
    setEditing(false);
  };

  const startOwn = () => {
    setSchedule({ mode: 'own', rows: rows.map((r) => ({ ...r })) });
    setEditing(true);
  };

  const editRow = (i, key, value) =>
    setSchedule({
      ...schedule,
      mode: 'own',
      rows: rows.map((r, n) => (n === i ? { ...r, [key]: value } : r)),
    });

  const removeRow = (i) =>
    setSchedule({ ...schedule, mode: 'own', rows: rows.filter((_, n) => n !== i) });

  const addRow = () =>
    setSchedule({
      ...schedule,
      mode: 'own',
      rows: rows.concat([{ at: '8:00', title: 'something', note: '' }]),
    });

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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 20px 104px',
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
          {/* what the calendar means for the week (rilo-addons-test-2) */}
          {weekAhead.length > 0 && (
            <div
              style={{
                marginBottom: 8,
                padding: '10px 12px',
                borderRadius: 18,
                background: 'rgba(18,48,26,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2C4A36' }}>
                from your calendar
              </p>
              {weekAhead.slice(0, 3).map((w) => (
                <p
                  key={`${w.day}-${w.why}`}
                  style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: '#2C4A36' }}
                >
                  {w.why}
                </p>
              ))}
            </div>
          )}

          {/* who makes the day (rilo-addons-test) */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button
              type="button"
              className="tap"
              onClick={letRiloDoIt}
              style={modeBtn(schedule.mode === 'rilo' && !editing)}
            >
              let rilo make it
            </button>
            <button
              type="button"
              className="tap"
              onClick={startOwn}
              style={modeBtn(schedule.mode === 'own' && !editing)}
            >
              make my own
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => setEditing((v) => !v)}
              style={modeBtn(editing)}
            >
              {editing ? 'done' : 'edit'}
            </button>
          </div>

          {rows.map((row, i) => (
            <div key={`${row.at}-${i}`} style={rowStyle(row.status ?? '', i)}>
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
                {editing ? (
                  <input
                    value={row.at}
                    onChange={(e) => editRow(i, 'at', e.target.value)}
                    style={cellInput(44)}
                  />
                ) : (
                  row.at
                )}
              </p>
              <span style={dotStyle(row.status ?? '')} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, minWidth: 0 }}>
                {editing ? (
                  <>
                    <input
                      value={row.title}
                      onChange={(e) => editRow(i, 'title', e.target.value)}
                      style={cellInput()}
                    />
                    <input
                      value={row.note}
                      onChange={(e) => editRow(i, 'note', e.target.value)}
                      placeholder="what happens to your apps"
                      style={{ ...cellInput(), fontSize: 12 }}
                    />
                  </>
                ) : (
                  <>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: 17,
                        fontWeight: 600,
                      }}
                    >
                      {row.title}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                      {row.note}
                    </p>
                  </>
                )}
              </div>
              {editing && (
                <button
                  type="button"
                  aria-label={`Remove ${row.title}`}
                  onClick={() => removeRow(i)}
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: '2px solid #12301A',
                    background: 'transparent',
                    color: '#12301A',
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {editing && (
            <button type="button" className="tap" onClick={addRow} style={addBtn}>
              + add something
            </button>
          )}
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

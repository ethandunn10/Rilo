/* Plan — exact port of designs/Plan.dc.html */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import BackButton from '../components/BackButton';
import { riloSchedule } from '../demo/mockAI';
import ProBadge from '../components/ProBadge';
import ScheduleAsk from '../components/ScheduleAsk';
import { fmtMins } from '../lib/plan';
import { planCheckLine } from '../lib/limits';

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

const bigBtn = (primary) => ({
  width: '100%',
  minHeight: 68,
  padding: '12px 18px',
  borderRadius: 24,
  border: primary ? 0 : '2px solid #12301A',
  background: primary ? '#12301A' : 'rgba(255,255,255,0.92)',
  color: primary ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 2,
  boxShadow: primary ? '0 8px 22px rgba(10,40,20,0.3)' : '0 4px 0 #12301A',
});

const bigSub = (primary) => ({
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 12.5,
  fontWeight: 600,
  opacity: primary ? 0.78 : 0.68,
});


/* "done" is a bar docked above the tab bar while editing, not a sticky
   button inside the card. As a sticky child of the card it floated in the
   middle of the screen over the rows it was meant to sit under, and it
   covered "+ add something", which made adding a row impossible. */
const doneBtn = {
  flex: 1,
  minWidth: 0,
  minHeight: 54,
  borderRadius: 999,
  border: 0,
  background: '#12301A',
  color: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 19,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 8px 22px rgba(10,40,20,0.3)',
};

const addBtn = {
  flex: 1,
  minWidth: 0,
  minHeight: 54,
  borderRadius: 999,
  border: '2px dashed rgba(18,48,26,0.4)',
  background: 'var(--card, #FFFFFF)',
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
  onBack,
  /* ---- add-ons (rilo-addons-test) ---- */
  schedule = { mode: 'rilo', rows: [] },
  setSchedule = () => {},
  hobbies = [],
  goals = [],
  school,
  bedtime,
  scrollMins = 60,
  weekAhead = [],
  /* the plan check belongs on the plan screen too (§9) */
  check,
  onLimits = () => {},
  /* day 2 of the first week asks for the calendar here, where he's
     already showing what tomorrow looks like (lib/firstWeek) */
  askCard = null,
  /* the nightly check-in moved off Home when Home was cut back to four
     things. It belongs here: it is how tomorrow gets planned. (pro) */
  canCheckIn = false,
  checkInDue = false,
  checkedInToday = false,
  onNightCheckIn = () => {},
  /* free sees the check-in, locked — knowing what pro does is the argument
     for it, and a feature that simply isn't there makes no argument */
  isPro = false,
}) {
  const [editing, setEditing] = useState(false);
  /* rilo asks a few things before he builds anything */
  const [asking, setAsking] = useState(false);

  /* Rilo's version until they make their own; the design's day is the
     fallback so the screen is never empty. */
  const blank = schedule.mode === 'own' && (schedule.rows ?? []).length === 0;
  const rows = schedule.rows?.length
    ? schedule.rows
    : blank
      ? []
      : ROWS.map(([at, title, note]) => ({ at, title, note }));

  const buildWithRilo = (answers) => {
    setSchedule({
      mode: 'rilo',
      rows: riloSchedule({ hobbies, goals, school, bedtime, scrollMins, answers }),
    });
    setAsking(false);
    setEditing(false);
  };

  /* "make your own" starts empty on purpose — nothing to delete first */
  const startOwn = () => {
    setSchedule({ mode: 'own', rows: [] });
    setAsking(false);
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
          padding: '52px 20px 0',
          /* while editing, clear the docked "done" bar as well as the tab
             bar, so the last row and "+ add something" are both reachable */
          '--tail': editing
            ? 'calc(206px + var(--safe-bottom, 0px))'
            : 'calc(128px + var(--safe-bottom, 0px))',
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
            /* a flex child in a scrolling column must not shrink, or the
               page squashes its content instead of scrolling to it */
            flexShrink: 0,
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
          <Rilo skin={skin} mood="proud" size={74} talks />
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
            /* same reason: this card grows with every row they add, and it
               has to push the page taller rather than compress */
            flexShrink: 0,
          }}
        >
          {/* Does the plan add up? The limits are what actually block apps,
              so a day planned around them has to fit inside them (§9). */}
          {check && (
            <button
              type="button"
              className="tap"
              onClick={onLimits}
              style={{
                marginTop: 8,
                marginBottom: 8,
                padding: '11px 13px',
                borderRadius: 18,
                background: check.over ? '#12301A' : 'rgba(18,48,26,0.06)',
                border: 0,
                color: check.over ? '#FFFFFF' : '#12301A',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: check.over ? '#9FD8A9' : '#2C4A36',
                }}
              >
                plan check
              </span>
              <span
                style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.35,
                }}
              >
                {planCheckLine(check, fmtMins)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: check.over ? '#C9E6CE' : '#3D5A46',
                }}
              >
                tap to change your limits
              </span>
            </button>
          )}

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

          {/* today's question, if the plan tab is where it belongs */}
          {askCard ? <div style={{ marginBottom: 9 }}>{askCard}</div> : null}

          {/* rilo's nightly check-in */}
          {(canCheckIn || !isPro) && (
            <button
              type="button"
              className="tap"
              onClick={isPro ? onNightCheckIn : onUpgrade}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                minHeight: 56,
                marginBottom: 9,
                padding: '10px 14px',
                borderRadius: 20,
                background: checkInDue ? '#2B3A6B' : 'var(--card)',
                border: '1.5px solid rgba(18,48,26,0.12)',
                color: checkInDue ? '#FFFFFF' : '#12301A',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 20 }}>🌙</span>
              <span style={{ flexGrow: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600 }}>
                  {checkedInToday ? 'checked in' : 'check in with rilo'}
                </span>
                <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, opacity: checkInDue ? 0.85 : 0.6 }}>
                  {!isPro
                    ? 'thirty seconds before bed, and tomorrow is planned'
                    : checkedInToday
                      ? 'tomorrow is planned'
                      : checkInDue
                        ? '30 seconds, then bed'
                        : 'how today went'}
                </span>
              </span>
              {!isPro && <ProBadge />}
              {isPro && checkInDue && !checkedInToday && (
                <span aria-hidden="true" style={{ flexShrink: 0, width: 9, height: 9, borderRadius: 999, background: '#FFD43B' }} />
              )}
            </button>
          )}

          {/* who makes the day */}
          {asking ? (
            <ScheduleAsk skin={skin} onBuild={buildWithRilo} onCancel={() => setAsking(false)} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 4 }}>
              <button
                type="button"
                className="tap-94"
                onClick={() => {
                  setEditing(false);
                  setAsking(true);
                }}
                style={bigBtn(true)}
              >
                let rilo make your schedule
                <span style={bigSub(true)}>he&apos;ll ask a couple of things first</span>
              </button>

              {!editing && (
                <button
                  type="button"
                  className="tap-94"
                  onClick={() => setEditing(true)}
                  style={bigBtn(false)}
                >
                  edit the schedule
                  <span style={bigSub(false)}>change what you already have</span>
                </button>
              )}

              <button type="button" className="tap-94" onClick={startOwn} style={bigBtn(false)}>
                make your own
                <span style={bigSub(false)}>start from nothing and add as you go</span>
              </button>
            </div>
          )}

          <div data-tour-target="plan-day" style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map((row, i) => (
            <div
              key={`${row.at}-${i}`}
              style={rowStyle(row.status ?? '', i)}
            >
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
          </div>

          {!rows.length && (
            <p
              style={{
                margin: '6px 0',
                fontSize: 14,
                fontWeight: 600,
                color: '#3D5A46',
                textAlign: 'center',
              }}
            >
              {editing ? 'empty. add your first thing below.' : 'nothing here yet.'}
            </p>
          )}

        </div>
      </div>

      {/* docked above the tab bar, clear of everything it used to cover */}
      {editing && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 'calc(94px + var(--safe-bottom, 0px))',
            zIndex: 12,
            boxSizing: 'border-box',
            padding: '11px 20px 13px',
            background: 'var(--card, #FFFFFF)',
            borderTop: '1.5px solid rgba(18,48,26,0.10)',
            boxShadow: '0 -6px 18px rgba(10,40,20,0.10)',
          }}
        >
          <div style={{ display: 'flex', gap: 9 }}>
            <button type="button" className="tap" onClick={addRow} style={addBtn}>
              + add something
            </button>
            <button
              type="button"
              className="tap-94"
              onClick={() => setEditing(false)}
              style={doneBtn}
            >
              done
            </button>
          </div>
        </div>
      )}

      {/* today's plan is rilo pro — free sees it, blurred, with the way in */}
      {locked && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rilo Pro plan"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'rgba(255,255,255,0.45)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <BackButton
            onBack={onBack}
            style={{ position: 'absolute', top: 12, left: 16, zIndex: 1 }}
          />
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
          <button
            type="button"
            className="tap-94"
            onClick={onUpgrade}
            style={{
              marginTop: 4,
              padding: '9px 18px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            try rilo pro free
          </button>
        </div>
      )}

      <TabBar active="plan" go={go} variant="plan" skin={skin} />
    </div>
  );
}

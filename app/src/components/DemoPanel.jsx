/* DEMO ONLY: replace with real AI/API in mobile app.
 *
 * A tester's remote control. Hidden behind a small "demo" button in the
 * corner so it never gets in the way of the app itself. Nothing in here
 * ships to a real phone. */

import { useState } from 'react';
import { fmtClock } from '../lib/addons';

const row = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const btn = {
  minHeight: 38,
  padding: '0 12px',
  borderRadius: 999,
  border: '2px solid #12301A',
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const label = {
  margin: '10px 0 2px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#2C4A36',
};

const CLOCKS = [
  { label: 'morning', at: '08:00' },
  { label: 'school', at: '10:00' },
  { label: 'evening', at: '19:00' },
  { label: 'bedtime', at: '23:30' },
];

export default function DemoPanel({
  demoClock,
  onClock,
  onUsage,
  onOpenBlocked,
  onNextDay,
  onNextWeek,
  onShareCard,
  onBuddies,
  onReset,
  used,
  goal,
  passes,
  fmtMins,
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          left: 10,
          bottom: 96,
          zIndex: 60,
          minHeight: 30,
          padding: '0 10px',
          borderRadius: 999,
          border: '1.5px solid rgba(18,48,26,0.35)',
          background: 'rgba(255,255,255,0.75)',
          color: '#12301A',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        demo
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        bottom: 8,
        zIndex: 60,
        maxHeight: '72%',
        overflowY: 'auto',
        boxSizing: 'border-box',
        padding: 14,
        borderRadius: 24,
        background: 'rgba(255,255,255,0.97)',
        border: '2px solid #12301A',
        boxShadow: '0 16px 40px rgba(10,40,20,0.3)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
      className="scroll-y"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p
          style={{
            margin: 0,
            flexGrow: 1,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          demo panel
        </p>
        <button type="button" onClick={() => setOpen(false)} style={{ ...btn, minHeight: 32 }}>
          close
        </button>
      </div>

      <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
        today: {fmtMins(used)} of {fmtMins(goal)} · {passes} pass{passes === 1 ? '' : 'es'} ·{' '}
        clock {demoClock ? fmtClock(demoClock) : 'real time'}
      </p>

      <p style={label}>time of day</p>
      <div style={row}>
        {CLOCKS.map((c) => (
          <button key={c.at} type="button" onClick={() => onClock(c.at)} style={btn}>
            {c.label}
          </button>
        ))}
        <button type="button" onClick={() => onClock(null)} style={btn}>
          real time
        </button>
      </div>

      <p style={label}>today&apos;s usage</p>
      <div style={row}>
        <button type="button" onClick={() => onUsage('under')} style={btn}>
          under goal
        </button>
        <button type="button" onClick={() => onUsage('close')} style={btn}>
          close to it
        </button>
        <button type="button" onClick={() => onUsage('over')} style={btn}>
          way over
        </button>
      </div>

      <p style={label}>jump to</p>
      <div style={row}>
        <button type="button" onClick={onOpenBlocked} style={btn}>
          open a blocked app
        </button>
        <button type="button" onClick={onShareCard} style={btn}>
          share card
        </button>
        <button type="button" onClick={onBuddies} style={btn}>
          buddies
        </button>
      </div>

      <p style={label}>skip ahead</p>
      <div style={row}>
        <button type="button" onClick={onNextDay} style={btn}>
          next day
        </button>
        <button type="button" onClick={onNextWeek} style={btn}>
          next week
        </button>
      </div>

      <p style={label}>start clean</p>
      <div style={row}>
        <button
          type="button"
          onClick={onReset}
          style={{ ...btn, background: '#12301A', color: '#FFFFFF' }}
        >
          reset all demo data
        </button>
      </div>
    </div>
  );
}

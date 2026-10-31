/* How fast they want to get to their goal. Three choices, a line each.

   The sitting length that the per-app opens are worked out from is kept
   as a prop but no longer shown — one number across several apps didn't
   mean anything anyone could act on. */

import { PACES } from '../lib/plan';

const chip = (on, dark) => ({
  flex: 1,
  minHeight: 42,
  padding: '0 6px',
  borderRadius: 999,
  border: `2px solid ${dark ? 'rgba(255,255,255,0.55)' : 'var(--line, #12301A)'}`,
  background: on ? (dark ? '#FFFFFF' : '#12301A') : 'transparent',
  color: on ? (dark ? '#12301A' : '#FFFFFF') : dark ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
});


export default function PlanPicker({
  pace,
  setPace,
  sessionMins,
  setSessionMins,
  dark = false,
}) {



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.2,
          color: dark ? '#FFFFFF' : '#12301A',
        }}
      >
        how fast?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PACES.map((p) => (
          <button
            key={p.id}
            type="button"
            className="tap"
            onClick={() => setPace(p.id)}
            style={{ ...chip(pace === p.id, dark), textAlign: 'left', padding: '8px 14px' }}
          >
            {p.label}
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.75,
              }}
            >
              {p.note}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}

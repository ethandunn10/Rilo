/* AppPicker — the watched-apps list with real logos, plus the add-app sheet.
   Shared by Pick apps (onboarding) and the You screen. */

import { useState } from 'react';
import AppLogo from './AppLogo';
import AppSheet from './AppSheet';
import { STARTING_APPS } from '../lib/apps';

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path
      d="M3 8.5 L6.5 12 L13 4.5"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function AppRow({ label, on, onPick }) {
  return (
    <button
      type="button"
      className="tap-97"
      aria-pressed={on}
      onClick={onPick}
      style={{
        minHeight: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'transparent',
        border: 0,
        borderBottom: '1px solid rgba(18,48,26,0.08)',
        padding: 0,
        fontFamily: 'Fredoka, sans-serif',
        color: '#12301A',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <AppLogo label={label} />
      <span style={{ flexGrow: 1, fontSize: 19, fontWeight: 600 }}>{label}</span>
      <span
        style={
          on
            ? {
                width: 30,
                height: 30,
                borderRadius: 15,
                background: '#12301A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background .2s ease',
              }
            : {
                width: 30,
                height: 30,
                borderRadius: 15,
                background: 'rgba(255,255,255,0.8)',
                border: '2px solid rgba(18,48,26,0.2)',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background .2s ease',
              }
        }
      >
        {CHECK}
      </span>
    </button>
  );
}

export default function AppPicker({ apps, setApps, style }) {
  const [sheet, setSheet] = useState(false);

  const { on, extra } = apps;
  const rows = STARTING_APPS.concat(extra);

  const addApp = (label) => {
    const t = label.trim().toLowerCase();
    if (!t) return;
    setApps({
      on: { ...on, [t]: true },
      extra: rows.includes(t) ? extra : extra.concat([t]),
    });
  };

  return (
    <>
      <div style={style}>
        {rows.map((label) => (
          <AppRow
            key={label}
            label={label}
            on={!!on[label]}
            onPick={() => setApps({ ...apps, on: { ...on, [label]: !on[label] } })}
          />
        ))}

        <button
          type="button"
          className="tap-97"
          onClick={() => setSheet(true)}
          style={{
            minHeight: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: 'transparent',
            border: 0,
            padding: 0,
            fontFamily: 'Fredoka, sans-serif',
            color: '#12301A',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              border: '2px dashed #12301A',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            +
          </span>
          add another app
        </button>
      </div>

      {sheet && <AppSheet already={on} onPick={addApp} onClose={() => setSheet(false)} />}
    </>
  );
}

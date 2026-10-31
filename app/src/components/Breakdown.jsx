/* Where the day actually goes — one bar per blocked app, plus everything
   else. Used on the onboarding screen and again on Progress. */

import AppLogo from './AppLogo';
import { fmtMins } from '../lib/plan';
import { useTheme } from '../lib/themes';

export default function Breakdown({ breakdown, compact = false, isPro = true, onUpgrade }) {
  const theme = useTheme();
  if (!breakdown) return null;

  const rows = [...breakdown.apps].sort((a, b) => b.mins - a.mins);
  const most = rows[0];
  const widest = Math.max(...rows.map((r) => r.mins), breakdown.other, 1);

  const bar = (mins, muted) => ({
    height: compact ? 10 : 14,
    borderRadius: 999,
    width: `${Math.max(4, (mins / widest) * 100)}%`,
    background: muted
      ? 'rgba(18,48,26,0.18)'
      : `linear-gradient(90deg, ${theme.hills[1]}, ${theme.hills[2]})`,
    animation: 'bar-fill .7s ease-out both',
  });

  const row = (key, label, mins, pct, logo, muted) => (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {logo ? (
          <AppLogo label={key} size={compact ? 24 : 28} radius={8} />
        ) : (
          <span style={{ width: compact ? 24 : 28 }} />
        )}
        <span
          style={{
            flexGrow: 1,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: compact ? 15 : 17,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: compact ? 13 : 14, fontWeight: 700, color: '#3D5A46' }}>
          {fmtMins(mins)}
          {pct == null ? '' : ` · ${pct}%`}
        </span>
      </div>
      <div style={bar(mins, muted)} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 13 }}>
      {/* free sees the total, not the split — that's the pro bit */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: compact ? 10 : 13,
            filter: isPro ? 'none' : 'blur(7px)',
            opacity: isPro ? 1 : 0.65,
            pointerEvents: isPro ? 'auto' : 'none',
            userSelect: isPro ? 'auto' : 'none',
          }}
          aria-hidden={!isPro}
        >
          {rows.map((r) => row(r.app, r.app, r.mins, r.pct, true, false))}
        </div>

        {!isPro && (
          <button
            type="button"
            className="tap"
            onClick={onUpgrade}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: 0,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: compact ? 15 : 17,
                fontWeight: 600,
                color: '#12301A',
              }}
            >
              see where your time goes
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2C4A36' }}>
              rilo pro
            </span>
          </button>
        )}
      </div>

      {breakdown.other > 0 &&
        row(
          'other',
          'everything else',
          breakdown.other,
          Math.round((breakdown.other / breakdown.total) * 100),
          false,
          true,
        )}

      <p
        style={{
          margin: '2px 0 0',
          fontSize: compact ? 13 : 14,
          fontWeight: 700,
          color: '#2C4A36',
        }}
      >
        your blocked apps: {fmtMins(breakdown.blocked)} a day
        {breakdown.allowed
          ? ` (${Math.round((breakdown.blocked / breakdown.total) * 100)}%)`
          : ''}
      </p>

      {!compact && most && breakdown.allowed && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 19,
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {most.app}&apos;s eating the most. we&apos;ll start there.
        </p>
      )}
    </div>
  );
}

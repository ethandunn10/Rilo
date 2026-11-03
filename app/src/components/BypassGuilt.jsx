/* BypassGuilt — the sheet Rilo puts in front of every way around a limit:
   the emergency pass, borrowing from tomorrow, and loosening anything.

   Three jobs, in this order:
     1. Say what they told him they'd rather be doing, in their own words.
     2. Say what this actually costs — a streak, tomorrow's opens, the goal.
     3. Make them type a reason before it opens.

   The tone is disappointed, never shaming: these are 13+ users and an app
   that calls them weak is an app they delete. Rilo is let down, he says so
   plainly once, and then he lets them through. The reason box is the point —
   it is a speed bump, not a lock, and "never mind" is always one tap. */

import { useState } from 'react';
import Rilo from './Rilo';

/* their own onboarding answers, turned into the line */
export function ratherLine({ hobbies = [], goals = [] }) {
  const hobby = hobbies[0];
  const goal = goals[0];
  if (hobby) return `you said you'd rather be at ${hobby === 'gym' ? 'the gym' : hobby} right now.`;
  if (goal) return `you said you wanted to ${goal}.`;
  return 'you said you wanted less of this.';
}

/* what it costs them, most painful first */
export function costLine({ streak = 0, kind }) {
  if (streak > 1) return `this breaks your ${streak}-day streak.`;
  if (kind === 'borrow') return 'you get half an open less tomorrow.';
  if (kind === 'pass') return "that's your one pass for today.";
  return 'your plan gets easier than the one you chose.';
}

const MIN_REASON = 3;

export default function BypassGuilt({
  skin,
  kind = 'pass',
  title,
  hobbies = [],
  goals = [],
  streak = 0,
  confirmLabel = 'unlock it',
  onConfirm,
  onCancel,
}) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= MIN_REASON;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="rilo has something to say"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        boxSizing: 'border-box',
        background: 'rgba(12,30,18,0.45)',
        backdropFilter: 'blur(3px)',
        animation: 'scrim-in .25s ease-out both',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 330,
          boxSizing: 'border-box',
          padding: '18px 18px 16px',
          borderRadius: 26,
          background: 'var(--card, #FFFFFF)',
          border: '1.5px solid rgba(18,48,26,0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'rise14 .3s ease-out both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Rilo skin={skin} mood="letdown" size={66} motion="idle" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>
              {title ?? 'you can, but…'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#43604D', lineHeight: 1.35 }}>
              {ratherLine({ hobbies, goals })}
            </p>
          </div>
        </div>

        {/* the price, said once and plainly */}
        <p
          data-guilt-cost=""
          style={{
            margin: 0,
            padding: '9px 12px',
            borderRadius: 14,
            background: 'rgba(217,100,58,0.10)',
            color: '#9C4518',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {costLine({ streak, kind })}
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#43604D' }}>
            tell me why, and it&apos;s yours
          </span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="what's going on?"
            aria-label="why you need this"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              minHeight: 44,
              padding: '10px 12px',
              borderRadius: 14,
              border: '1.5px solid rgba(18,48,26,0.16)',
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 15,
              fontWeight: 600,
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="tap"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              border: '2px solid rgba(18,48,26,0.16)',
              background: 'transparent',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            never mind
          </button>
          <button
            type="button"
            className="tap-94"
            disabled={!ok}
            onClick={() => ok && onConfirm(reason.trim())}
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              border: 0,
              background: ok ? '#12301A' : 'rgba(18,48,26,0.22)',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: ok ? 'pointer' : 'default',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

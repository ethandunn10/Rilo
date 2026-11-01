/* The opens display (§3): circles plus one line of text.

   full = available, half-shaded = half an open left, empty = used. Used on
   each app's limit card and on Rilo's pop-up when a Limited app is opened,
   so the same picture means the same thing in both places.

   Drawn in the app's own style: the dark green line colour, a 2px stroke
   and the flat fill the cards use, no gradients. */

import { circlesFor, opensText } from '../lib/limits';

const LINE = '#12301A';

function Circle({ state, size, color, on }) {
  const r = size / 2 - 1.25;
  const c = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {/* the hole, always drawn, so an empty open still reads as a slot */}
      <circle cx={c} cy={c} r={r} fill={on ? 'rgba(255,255,255,0.35)' : 'transparent'} />

      {/* a half open is the left half filled, like a battery at 50% */}
      {state === 'half' && (
        <path
          d={`M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`}
          fill={color}
        />
      )}

      {state === 'full' && <circle cx={c} cy={c} r={r} fill={color} />}

      <circle cx={c} cy={c} r={r} fill="none" stroke={on ? color : LINE} strokeWidth="2" />
    </svg>
  );
}

export default function Opens({
  total,
  used,
  minutes,
  /* `on` inverts the colours for the dark cards (Rilo's pop-up, the chips) */
  on = false,
  size = 16,
  note = true,
  align = 'flex-start',
  style,
}) {
  const states = circlesFor(total, used);
  const left = Math.max(0, total - used);
  const color = on ? '#FFFFFF' : LINE;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align,
        gap: 4,
        ...style,
      }}
    >
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}
        role="img"
        aria-label={opensText(left, minutes)}
      >
        {states.map((state, i) => (
          <Circle key={i} state={state} size={size} color={color} on={on} />
        ))}
        {!states.length && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: on ? 'rgba(255,255,255,0.75)' : '#3D5A46',
            }}
          >
            no opens
          </span>
        )}
      </div>

      {note && (
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: on ? '#C9E6CE' : '#3D5A46',
          }}
        >
          {opensText(left, minutes)}
        </p>
      )}
    </div>
  );
}

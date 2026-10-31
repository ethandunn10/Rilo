/* Strict mode. Free, not Pro.

   Turning it on is a choice of how long and when. Turning it off isn't
   instant — it runs for another 24 hours first, which is the whole point
   of it. */

import { useState } from 'react';
import Rilo from './Rilo';

const LENGTHS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
];

const WINDOWS = [
  { id: 'all', label: 'all day' },
  { id: 'school', label: 'school hours' },
  { id: 'night', label: 'after 10pm' },
];

const chip = (on) => ({
  flex: 1,
  minHeight: 44,
  borderRadius: 999,
  border: '2px solid var(--line, #12301A)',
  background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
});

export function endsAtText(endingAt) {
  if (!endingAt) return '';
  const d = new Date(endingAt);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${ampm}`;
}

export default function StrictCard({ style, skin, strict, onTurnOn, onAskOff, onKeepOn }) {
  const [picking, setPicking] = useState(false);
  const [days, setDays] = useState(strict.days ?? 7);
  const [when, setWhen] = useState(strict.when ?? 'all');

  const ending = Boolean(strict.endingAt);

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            strict mode
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            half the opens, no &quot;5 more&quot;, no breaks. free.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={strict.on}
          aria-label="Strict mode"
          className="tap"
          onClick={() => {
            if (strict.on) onAskOff();
            else setPicking((v) => !v);
          }}
          style={{
            width: 62,
            height: 34,
            flexShrink: 0,
            borderRadius: 999,
            border: '2px solid var(--line, #12301A)',
            background: strict.on ? '#12301A' : 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: strict.on ? 'flex-end' : 'flex-start',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              margin: '0 3px',
              borderRadius: 999,
              background: strict.on ? '#FFFFFF' : '#12301A',
            }}
          />
        </button>
      </div>

      {/* winding down */}
      {strict.on && ending && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.85)',
            border: '2px solid var(--line, #12301A)',
          }}
        >
          <Rilo skin={skin} mood="letdown" size={56} />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600 }}
            >
              strict mode ends tomorrow at {endsAtText(strict.endingAt)}
            </p>
            <button
              type="button"
              className="tap"
              onClick={onKeepOn}
              style={{
                marginTop: 6,
                minHeight: 38,
                padding: '0 14px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              cancel, keep it on
            </button>
          </div>
        </div>
      )}

      {strict.on && !ending && (
        <p
          style={{
            margin: 0,
            alignSelf: 'flex-start',
            padding: '5px 12px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          on · {strict.days === 1 ? '1 day' : strict.days === 3 ? '3 days' : '1 week'} ·{' '}
          {WINDOWS.find((w) => w.id === strict.when)?.label ?? 'all day'}
        </p>
      )}

      {/* choosing how long and when */}
      {!strict.on && picking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>how long?</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {LENGTHS.map((l) => (
              <button
                key={l.days}
                type="button"
                className="tap"
                onClick={() => setDays(l.days)}
                style={chip(days === l.days)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>when?</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="tap"
                onClick={() => setWhen(w.id)}
                style={chip(when === w.id)}
              >
                {w.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="tap"
            onClick={() => {
              setPicking(false);
              onTurnOn(days, when);
            }}
            style={{
              marginTop: 2,
              minHeight: 50,
              borderRadius: 999,
              border: '2px solid var(--line, #12301A)',
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            lock it down
          </button>
        </div>
      )}
    </div>
  );
}

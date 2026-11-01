/* "when should i check in?" — straight after the paywall.

   The nightly check-in is a Rilo Pro thing, so this only appears for
   someone who took the trial. Thirty seconds before bed: how today went,
   what's on tomorrow. He needs to know when to ask.

   Same dusk sky as the check-in itself, so the two screens read as one
   feature rather than two unrelated ones. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { fmtClock } from '../lib/addons';

/* The times people actually go to bed, plus a custom field. Not a scroll
   wheel: four taps beat a time picker for something this simple. */
const TIMES = [
  { at: '20:00', label: '8:00', sub: 'early night' },
  { at: '21:00', label: '9:00', sub: 'most people' },
  { at: '22:00', label: '10:00', sub: 'later' },
  { at: '23:00', label: '11:00', sub: 'night owl' },
];

const card = (on) => ({
  width: '100%',
  minHeight: 60,
  boxSizing: 'border-box',
  padding: '10px 18px',
  borderRadius: 22,
  border: on ? '2px solid #FFFFFF' : '2px solid rgba(255,255,255,0.45)',
  background: on ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
  color: on ? '#2B3A6B' : '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

export default function NightTime({ go, skin, night, setNight, next = 'calendaronboard' }) {
  const [at, setAt] = useState(night?.at || '21:00');
  const [custom, setCustom] = useState(false);

  const save = () => {
    setNight({ ...night, at });
    go(next);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#FFFFFF',
      }}
    >
      <Sky hills="low" tone="dusk" />

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '56px 22px 0',
          '--tail': '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.1em',
            opacity: 0.75,
          }}
        >
          RILO PRO · NIGHTLY CHECK-IN
        </p>

        <Rilo skin={skin} mood="sleepy" size={150} />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 27,
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: 'center',
          }}
        >
          when should i check in?
        </h1>

        <p
          style={{
            margin: 0,
            maxWidth: 300,
            fontSize: 14.5,
            fontWeight: 600,
            lineHeight: 1.4,
            textAlign: 'center',
            opacity: 0.85,
          }}
        >
          thirty seconds before bed. how today went, what&apos;s on tomorrow.
          i&apos;ll have your plan ready when you wake up.
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIMES.map((t) => {
            const on = !custom && at === t.at;
            return (
              <button
                key={t.at}
                type="button"
                className="tap"
                aria-pressed={on}
                onClick={() => {
                  setCustom(false);
                  setAt(t.at);
                }}
                style={card(on)}
              >
                <span style={{ flexGrow: 1, fontSize: 19, fontWeight: 600 }}>{t.label}</span>
                <span
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.7,
                  }}
                >
                  {t.sub}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="tap"
            aria-pressed={custom}
            onClick={() => setCustom(true)}
            style={card(custom)}
          >
            <span style={{ flexGrow: 1, fontSize: 19, fontWeight: 600 }}>
              {custom ? fmtClock(at) : 'another time'}
            </span>
            <span
              style={{
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.7,
              }}
            >
              pick it
            </span>
          </button>

          {custom && (
            <input
              type="time"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              style={{
                height: 52,
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 18,
                border: '2px solid rgba(255,255,255,0.6)',
                background: 'rgba(255,255,255,0.95)',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                color: '#2B3A6B',
              }}
            />
          )}
        </div>

        <div style={{ flexGrow: 1, minHeight: 8 }} />

        <button
          type="button"
          className="tap-94"
          onClick={save}
          style={{
            width: '100%',
            height: 58,
            flexShrink: 0,
            border: 0,
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#2B3A6B',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 28px rgba(10,20,50,0.3)',
          }}
        >
          ask me at {fmtClock(at)}
        </button>

        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, opacity: 0.7, textAlign: 'center' }}>
          you can check in any time from the home screen, and change this
          whenever you like.
        </p>
      </div>
    </div>
  );
}

/* "what are you opening this for?" — the check-in before a session.
   They say why, and how long they want. Rilo holds them to both. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import { CHECKIN_REASONS, CHECKIN_MINUTES } from '../lib/addons';

const pill = (on) => ({
  width: '100%',
  minHeight: 56,
  boxSizing: 'border-box',
  padding: '8px 16px',
  borderRadius: 22,
  border: '2px solid var(--line, #12301A)',
  background: on ? '#12301A' : 'rgba(255,255,255,0.92)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
});

export default function WhyOpen({ app, skin, onStart, onNevermind }) {
  const [reason, setReason] = useState('');
  const [why, setWhy] = useState('');
  const [mins, setMins] = useState(5);

  const ready = reason && (reason !== 'custom' || why.trim());

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
      <Sky hills="mid" />

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '48px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Rilo skin={skin} mood="curious" size={90} />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 26,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              what are you opening {app} for?
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {CHECKIN_REASONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="tap"
              onClick={() => setReason(r.id)}
              style={pill(reason === r.id)}
            >
              <span style={{ fontSize: 18, fontWeight: 600 }}>{r.label}</span>
              <span
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.75,
                }}
              >
                {r.sub}
              </span>
            </button>
          ))}

          {reason === 'custom' && (
            <input
              autoFocus
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="what for?"
              style={{
                height: 50,
                boxSizing: 'border-box',
                padding: '0 18px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: '#FFFFFF',
                fontSize: 16,
                fontWeight: 600,
                color: '#12301A',
              }}
            />
          )}
        </div>

        <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>
          how long do you need?
        </p>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {CHECKIN_MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              className="tap"
              onClick={() => setMins(m)}
              style={{
                ...pill(mins === m),
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 50,
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 600 }}>{m} min</span>
            </button>
          ))}
        </div>

        <div style={{ flexGrow: 1, minHeight: 8 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ display: 'flex', borderRadius: 12, overflow: 'hidden' }}>
            <AppLogo label={app} size={44} radius={12} />
          </span>
          <button
            type="button"
            className="tap"
            disabled={!ready}
            onClick={() => onStart({ reason, why: why.trim(), mins })}
            style={{
              flexGrow: 1,
              height: 56,
              borderRadius: 999,
              border: 0,
              background: ready ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              color: ready ? '#12301A' : 'rgba(18,48,26,0.45)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 19,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'default',
              boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
            }}
          >
            {ready ? `open for ${mins} min` : 'pick a reason'}
          </button>
        </div>

        <button
          type="button"
          className="tap"
          onClick={onNevermind}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#FFFFFF',
            padding: 8,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          never mind
        </button>
      </div>
    </div>
  );
}

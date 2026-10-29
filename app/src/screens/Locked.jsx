/* Locked — what a watched app opens into once strict mode is on and the
   daily goal is spent. Rilo is angry, and the only way through is a
   need-it: three a day, five minutes each, then the normal check-in. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import { needItsLeft, NEED_IT_MAX } from '../lib/strict';

const REASONS = [
  { id: 'texting', label: 'texting someone' },
  { id: 'school', label: 'school thing' },
  { id: 'other', label: 'something else' },
];

const pill = {
  margin: 0,
  alignSelf: 'center',
  padding: '6px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.75)',
  border: '2px solid var(--line)',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
};

const card = {
  padding: '18px 18px',
  borderRadius: 24,
  background: 'rgba(255,255,255,0.88)',
  border: '2px solid var(--line)',
  boxShadow: '0 4px 0 var(--line)',
  animation: 'rise .5s .1s ease-out both',
};

const btn = {
  width: '100%',
  height: 56,
  borderRadius: 999,
  border: '2px solid var(--line)',
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 0 var(--line)',
};

export default function Locked({ go, app, skin, strict, onNeedIt }) {
  const [picking, setPicking] = useState(false);
  const left = needItsLeft(strict.needIt);
  const spent = left === 0;

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
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '56px 22px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'center',
            padding: '5px 14px 5px 6px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.75)',
            border: '2px solid var(--line)',
          }}
        >
          <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8 }}>
            <AppLogo label={app} size={26} radius={8} />
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600 }}>
            {app}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Rilo skin={skin} mood="angry" size={170} />
        </div>

        <div style={card}>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 24,
              fontWeight: 600,
              lineHeight: 1.25,
              textAlign: 'center',
            }}
          >
            locked till midnight.
            <br />
            you asked for this.
          </p>
        </div>

        {picking && !spent && (
          <div style={{ ...card, animation: 'rise .4s ease-out both' }}>
            <p
              style={{
                margin: '0 0 10px',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 19,
                fontWeight: 600,
              }}
            >
              what for?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="tap"
                  onClick={() => onNeedIt(r.label)}
                  style={{
                    minHeight: 52,
                    borderRadius: 18,
                    border: '2px solid var(--line)',
                    background: 'rgba(255,255,255,0.9)',
                    color: '#12301A',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 17,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {spent ? (
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#2C4A36',
              lineHeight: 1.35,
            }}
          >
            that's all your need-its for today.
            <br />
            see you tomorrow.
          </p>
        ) : (
          !picking && (
            <>
              <button type="button" className="tap" onClick={() => setPicking(true)} style={btn}>
                i actually need it
              </button>
              <p style={{ ...pill, marginTop: 2 }}>
                {left} left today{left === NEED_IT_MAX ? '' : ` of ${NEED_IT_MAX}`}
              </p>
            </>
          )
        )}

        <button
          type="button"
          className="tap"
          onClick={() => go('home', 'back')}
          style={{
            minHeight: 44,
            border: 0,
            background: 'transparent',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          fine, close it
        </button>
      </div>
    </div>
  );
}

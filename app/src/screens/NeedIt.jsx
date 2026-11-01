/* NeedIt — exact port of designs/NeedIt.dc.html
   Rilo's reply to "need it". The reply card and the open button only appear
   once a reason is picked, exactly as the design does it. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

const REASONS = [
  { id: 'text', label: 'texting someone', reply: 'got it. reply, then get out. no feed.', mins: 5 },
  {
    id: 'post',
    label: 'posting a video',
    reply: 'creator move. post it, don’t scroll after. i’m watching.',
    mins: 10,
  },
  { id: 'school', label: 'school thing', reply: 'respect. handle it.', mins: 10 },
  { id: 'other', label: 'something else', reply: 'alright, i trust you. make it quick.', mins: 5 },
];

const reasonBase = {
  minHeight: 64,
  borderRadius: 22,
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 17,
  fontWeight: 600,
  cursor: 'pointer',
  padding: '0 10px',
};

export default function NeedIt({ go, app, onStart, onSaidNo, skin }) {
  const [pick, setPick] = useState(null);
  const cur = REASONS.find((x) => x.id === pick);

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
          padding: '56px 22px 0',
          '--tail': '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            alignSelf: 'center',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.6)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          you said: need it
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <Rilo skin={skin} mood="curious" size={140} />
          <div
            style={{
              padding: '14px 16px',
              marginBottom: 40,
              borderRadius: '22px 22px 22px 6px',
              background: 'rgba(255,255,255,0.85)',
              border: '1.5px solid #FFFFFF',
              flexGrow: 1,
              animation: 'rise .5s .1s ease-out both',
            }}
          >
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 22, fontWeight: 600 }}
            >
              fair. what for?
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 10,
            animation: 'rise .5s .2s ease-out both',
          }}
        >
          {REASONS.map((r) => {
            const on = pick === r.id;
            return (
              <button
                key={r.id}
                type="button"
                className="tap-95"
                aria-pressed={on}
                onClick={() => setPick(r.id)}
                style={
                  on
                    ? {
                        ...reasonBase,
                        background: '#DDF3D9',
                        color: '#12301A',
                        border: '2.5px solid #12301A',
                        boxShadow: '0 1px 0 var(--line)',
                        transform: 'translateY(2px)',
                      }
                    : {
                        ...reasonBase,
                        background: 'var(--card)',
                        color: '#12301A',
                        border: '2px solid var(--line)',
                        boxShadow: '0 3px 0 var(--line)',
                      }
                }
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {cur && (
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 24,
              background: '#12301A',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
              animation: 'rise .4s ease-out both',
            }}
          >
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 20,
                fontWeight: 600,
                lineHeight: 1.3,
              }}
            >
              {cur.reply}
            </p>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#9FD8A9' }}>
              i'll check in when time's up.
            </p>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {cur && (
          <button
            type="button"
            className="tap-95"
            onClick={() => onStart(cur.mins)}
            style={{
              width: '100%',
              height: 56,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            open {app} for {cur.mins} min
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onSaidNo();
            go('home', 'back');
          }}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            padding: 8,
            textAlign: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          never mind, close it
        </button>
      </div>
    </div>
  );
}

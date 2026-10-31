/* CheckIn — exact port of designs/CheckIn.dc.html
   Three states, same as the design: ask -> done (+10 xp) or more (-15 xp).
   The xp change is applied once, on the tap that causes it.

   Fixes round 2: the copy uses the real session length they picked and the
   real app name, and "5 more minutes" runs the timer again. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

export default function CheckIn({ go, app, minutes, angry, skin, onDone, onMore, onExtra }) {
  const [step, setStep] = useState('ask');

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

      {step === 'ask' && (
        <div
          style={{
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            padding: '64px 22px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 240,
              height: 240,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 8,
                borderRadius: '50%',
                background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
              }}
            />
            <svg
              width="240"
              height="240"
              viewBox="0 0 240 240"
              aria-hidden="true"
              style={{ position: 'absolute', left: 0, top: 0 }}
            >
              <circle
                cx="120"
                cy="120"
                r="104"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="12"
              />
              <circle
                cx="120"
                cy="120"
                r="104"
                fill="none"
                stroke="#12301A"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="653"
                strokeDashoffset="0"
                transform="rotate(-90 120 120)"
                style={{ animation: 'ringin 1.4s ease-out both' }}
              />
            </svg>
            <div style={{ position: 'relative' }}>
              <Rilo skin={skin} mood="coach" size={150} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              textAlign: 'center',
              animation: 'rise .5s .2s ease-out both',
            }}
          >
            <h1
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 38, fontWeight: 700 }}
            >
              time's up!
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#2C4A36' }}>
              that was your {minutes} minutes. how'd it go?
            </p>
          </div>

          <div style={{ flexGrow: 1 }} />

          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              animation: 'rise .5s .3s ease-out both',
            }}
          >
            <button
              type="button"
              className="tap"
              onClick={() => {
                if (onDone) onDone();
                setStep('done');
              }}
              style={{
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
              }}
            >
              i'm done · +10 xp
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => {
                if (onMore) onMore();
                setStep('more');
              }}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
                border: '1.5px solid rgba(255,255,255,0.7)',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 18,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              5 more minutes · costs 15 xp
            </button>
            <button
              type="button"
              onClick={() => go('suggestion')}
              style={{
                border: 0,
                background: 'transparent',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                padding: 6,
                textAlign: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              what should i do instead?
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div
          style={{
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            padding: '90px 22px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 240,
              height: 230,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="240"
              height="230"
              viewBox="0 0 240 230"
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                animation: 'burst 1.2s ease-out both',
              }}
            >
              <g fill="#F2C230">
                <circle cx="30" cy="60" r="6" />
                <circle cx="210" cy="50" r="5" />
                <circle cx="20" cy="160" r="4" />
                <circle cx="220" cy="150" r="6" />
              </g>
              <g fill="#FFFFFF">
                <circle cx="70" cy="20" r="5" />
                <circle cx="170" cy="18" r="4" />
                <circle cx="120" cy="8" r="5" />
              </g>
            </svg>
            <div style={{ animation: 'pop-plain .6s ease-out both' }}>
              <Rilo skin={skin} mood="proud" motion="jump" size={210} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              textAlign: 'center',
              animation: 'rise .5s .15s ease-out both',
            }}
          >
            <h1
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 38, fontWeight: 700 }}
            >
              respect.
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#2C4A36' }}>
              you closed it on your own. that's the whole game.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, animation: 'rise .5s .25s ease-out both' }}>
            <p
              style={{
                margin: 0,
                padding: '8px 14px',
                borderRadius: 999,
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              +10 xp
            </p>
            <p
              style={{
                margin: 0,
                padding: '8px 14px',
                borderRadius: 999,
                background: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              6-day streak safe
            </p>
          </div>

          <div style={{ flexGrow: 1 }} />

          <button
            type="button"
            className="tap"
            onClick={() => go('home', 'back')}
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
            back to home
          </button>
        </div>
      )}

      {step === 'more' && (
        <div
          style={{
            position: 'relative',
            height: '100%',
            boxSizing: 'border-box',
            padding: '90px 22px 28px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ animation: 'pop-plain .6s ease-out both' }}>
            <Rilo skin={skin} mood={angry ? 'angry' : 'letdown'} size={210} />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              textAlign: 'center',
              animation: 'rise .5s .15s ease-out both',
            }}
          >
            <h1
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 38, fontWeight: 700 }}
            >
              {angry ? 'again?? we talked about this.' : 'fine. 5 more.'}
            </h1>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#2C4A36' }}>
              but that one cost you. i'll be back when it's up, and i won't be as chill.
            </p>
          </div>

          <p
            style={{
              margin: 0,
              padding: '8px 14px',
              borderRadius: 999,
              background: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: '#A33A2B',
            }}
          >
            −15 xp
          </p>

          <div style={{ flexGrow: 1 }} />

          <button
            type="button"
            className="tap"
            onClick={() => onExtra(5)}
            style={{
              width: '100%',
              height: 56,
              border: 0,
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(10,40,20,0.3)',
            }}
          >
            open {app} for 5 min
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => setStep('done')}
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
            wait, i'm actually done
          </button>
        </div>
      )}
    </div>
  );
}

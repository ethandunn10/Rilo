/* The shield iOS puts up over a blocked app.

   Deliberately bare: a real Screen Time shield can only show a picture, a
   title, one line of text and two buttons. Anything cleverer has to happen
   after they tap through to Rilo. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import { fmtMins } from '../lib/plan';

export default function Shield({ app, skin, left, sessionMins = 15, onTalk, onClose }) {
  const locked = left?.locked;

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
          padding: '72px 26px 34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px 5px 6px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.75)',
            border: '1.5px solid #FFFFFF',
          }}
        >
          <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8 }}>
            <AppLogo label={app} size={24} radius={8} />
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 600 }}>
            {app}
          </span>
        </div>

        <Rilo skin={skin} mood={locked ? 'angry' : 'coach'} size={180} />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          rilo locked {app}
        </h1>

        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
          }}
        >
          {locked
            ? 'locked till tomorrow'
            : left.shared
              ? `${fmtMins(left.minutes)} left today`
              : `${left.opens} open${left.opens === 1 ? '' : 's'} left · ${fmtMins(
                  Math.min(sessionMins, left.minutes),
                )}${left.opens === 1 ? '' : ' each'}`}
        </p>

        <div style={{ flexGrow: 1 }} />

        <button
          type="button"
          className="tap"
          onClick={onTalk}
          style={{
            width: '100%',
            height: 56,
            border: 0,
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
          }}
        >
          talk to rilo
        </button>

        <button
          type="button"
          className="tap"
          onClick={onClose}
          style={{
            width: '100%',
            height: 52,
            boxSizing: 'border-box',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            border: '1.5px solid rgba(255,255,255,0.7)',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          close
        </button>
      </div>
    </div>
  );
}

/* The shield iOS puts up over a blocked app.

   Deliberately bare: a real Screen Time shield can only show a picture, a
   title, one line of text and two buttons. Anything cleverer has to happen
   after they tap through to Rilo. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';
import { fmtClock } from '../lib/addons';
import { BLOCKED, LIMITED } from '../lib/limits';

export default function Shield({
  app,
  skin,
  /* what lib/limits lockFor() said about this app right now */
  lock,
  minutes = 15,
  opensTotal = 0,
  opensUsed = 0,
  schedule = { locked: false, kind: null, until: null },
  onTalk,
  onClose,
}) {
  const locked = Boolean(lock?.locked);
  const mode = lock?.setting?.mode;
  /* the circles only make sense for a Limited app that still has opens */
  const showOpens = mode === LIMITED && !schedule.locked && !locked;

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
          padding: '72px 26px 0',
          '--tail': '34px',
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

        {/* kind, not mean, when the day is simply over (§7) */}
        <Rilo skin={skin} mood={locked ? 'letdown' : 'coach'} size={180} talks />

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
          {locked ? `rilo locked ${app}` : `${app}?`}
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
          {schedule.locked
            ? schedule.kind === 'bedtime'
              ? `bedtime. open again at ${fmtClock(schedule.until)}`
              : schedule.kind === 'school'
                ? `school hours. open again at ${fmtClock(schedule.until)}`
                : `focus block. open again at ${fmtClock(schedule.until)}`
            : mode === BLOCKED
              ? 'blocked. your pass still works.'
              : locked
                ? 'no opens left. fresh ones at midnight.'
                : 'tap through and i’ll ask what for.'}
        </p>

        {/* the same circles as the limit card and the pop-up (§3) */}
        {showOpens && (
          <div
            style={{
              padding: '9px 14px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.72)',
              border: '1.5px solid rgba(255,255,255,0.95)',
            }}
          >
            <Opens total={opensTotal} used={opensUsed} minutes={minutes} align="center" />
          </div>
        )}

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
            background: 'rgba(255,255,255,0.92)',
            border: '1.5px solid var(--line, #12301A)',
            color: '#12301A',
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

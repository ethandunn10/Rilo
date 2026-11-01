/* The weekly step-down (§11).

   Once a week Rilo tightens ONE thing — a few fewer minutes per open, or
   one fewer open — on whichever Limited or Free app is eating the biggest
   share. They see it a day ahead: "next week: tiktok goes to 12 min per
   open."

   In normal mode it's a suggestion they accept or skip. In strict mode it
   happens by itself; they can still swap which app it lands on, but
   skipping is a loosening, so it waits 24 hours like any other.

   It stops once the plan check fits under the daily goal AND they actually
   hit the goal most days that week. Then the plan just stays. */

import Rilo from './Rilo';
import AppLogo from './AppLogo';
import { stepDownLine, countdownText } from '../lib/limits';

const btn = (primary) => ({
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 999,
  border: primary ? 0 : '2px solid var(--line, #12301A)',
  background: primary ? '#12301A' : 'transparent',
  color: primary ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
});

export default function StepDown({
  style,
  skin,
  /* the app it's aimed at, and what it would do */
  app,
  step,
  /* 'preview' (a day ahead) | 'offered' (this week's) */
  phase = 'offered',
  strictOn = false,
  /* other apps they could point it at instead */
  swappable = [],
  /* set when they skipped in strict mode and it's waiting out its 24h */
  skipAt = null,
  done = false,
  onAccept,
  onSkip,
  onSwap,
}) {
  /* the plan fits and they're living in it — nothing left to tighten */
  if (done) {
    return (
      <div style={{ ...style, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Rilo skin={skin} mood="proud" size={58} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p
            style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
          >
            no more stepping down
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            your limits fit your goal and you’re hitting it. this is the plan now.
          </p>
        </div>
      </div>
    );
  }

  if (!app || !step) return null;

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Rilo skin={skin} mood={phase === 'preview' ? 'curious' : 'coach'} size={58} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#2C4A36',
            }}
          >
            {phase === 'preview' ? 'heads up · tomorrow' : 'this week’s step down'}
          </p>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.25,
            }}
          >
            {stepDownLine(app, step)}
          </p>
        </div>
      </div>

      {/* strict mode: it lands either way, so say that plainly */}
      <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: '#2C4A36', lineHeight: 1.35 }}>
        {strictOn
          ? 'strict mode, so this happens by itself. you can move it to another app, and skipping it waits 24 hours.'
          : 'one thing a week. accept it, skip it, or move it somewhere else.'}
      </p>

      {/* Skipped in strict mode — waiting out the 24 hours. App clears
          skipAt the moment it lands, so its presence is the whole test. */}
      {skipAt && (
        <p
          style={{
            margin: 0,
            padding: '8px 12px',
            borderRadius: 14,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 13.5,
            fontWeight: 600,
          }}
        >
          skip pending · it stops in {countdownText(skipAt)}
        </p>
      )}

      {phase === 'offered' && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!strictOn && (
            <button type="button" className="tap" onClick={onAccept} style={btn(true)}>
              accept
            </button>
          )}
          <button type="button" className="tap" onClick={onSkip} style={btn(false)}>
            {strictOn ? 'skip it (24h)' : 'skip this week'}
          </button>
        </div>
      )}

      {/* swap which app gets tightened — allowed in both modes */}
      {swappable.length > 0 && (
        <>
          <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#2C4A36' }}>
            tighten something else instead
          </p>
          <div className="scroll-x" style={{ display: 'flex', gap: 7, paddingBottom: 2 }}>
            {swappable.map((other) => (
              <button
                key={other}
                type="button"
                className="tap"
                onClick={() => onSwap(other)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  minHeight: 42,
                  padding: '4px 13px 4px 5px',
                  borderRadius: 999,
                  border: '2px solid var(--line, #12301A)',
                  background: 'rgba(255,255,255,0.9)',
                  color: '#12301A',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <AppLogo label={other} size={30} radius={9} />
                {other}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

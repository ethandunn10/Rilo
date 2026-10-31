/* The pop-up, after the shield and the notification.

   Nothing here unlocks anything until a wait runs down, and the wait gets
   longer every time they come back to the same app today: 5s, 15s, 30s,
   then a minute. Rilo's mood hardens with it. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import { MicButton, WaveBars } from '../components/TalkBits';
import { useListen, reasonIn } from '../lib/listen';
import { fmtMins, PASSES_PER_DAY, PASS_MINUTES } from '../lib/plan';

/* Every way through costs the same five seconds — long enough to think,
   short enough that nobody rage-quits. The emergency pass included. */
export const WAIT_SECONDS = 5;

export function waitFor() {
  return WAIT_SECONDS;
}

function moodFor(opensToday) {
  if (opensToday >= 3) return 'angry';
  if (opensToday >= 2) return 'letdown';
  return 'coach';
}

const card = {
  minHeight: 86,
  borderRadius: 24,
  background: 'rgba(255,255,255,0.62)',
  border: '1.5px solid rgba(255,255,255,0.9)',
  backdropFilter: 'blur(14px)',
  boxShadow: '0 8px 26px rgba(20,60,40,0.12)',
  color: '#12301A',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  padding: '10px 8px',
};

export default function Intercept({
  go,
  skin,
  app,
  openCount,
  opensToday,
  left,
  day,
  strictOn,
  breakEarned,
  onReason,
  onUnlock,
  sessionMins = 15,
  onPass,
  onFiveMore,
}) {
  const wait = waitFor();
  const [countdown, setCountdown] = useState(wait);
  const [needWhat, setNeedWhat] = useState(false);
  const [passWhat, setPassWhat] = useState(false);
  const [typed, setTyped] = useState('');
  const [scolded, setScolded] = useState(false);
  const mic = useListen();
  const timer = useRef(null);

  const outOfRoom = left?.locked;
  const passesLeft = Math.max(0, PASSES_PER_DAY - (day?.passes ?? 0));
  const fiveMoreUsed = (day?.fiveMore ?? 0) >= 1;

  useEffect(() => {
    timer.current = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) {
          clearInterval(timer.current);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(timer.current);
  }, []);

  const ready = countdown <= 0;
  const mood = scolded ? 'angry' : moodFor(opensToday);

  /* a reason that doesn't unlock just goes to its own screen */
  const sayReason = (label, where) => {
    onReason?.(label);
    go(where);
  };

  const submitReason = (text) => {
    const what = (text || '').trim();
    if (!what) return;
    if (passWhat) {
      onPass(what);
    } else {
      onReason?.('need it');
      onUnlock('need it');
    }
  };

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
          padding: '44px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px 5px 6px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.7)',
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

        <Rilo skin={skin} mood={mood} size={150} />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
          }}
        >
          {scolded
            ? 'again?? we talked about this.'
            : outOfRoom
              ? 'out of opens for today'
              : `opening ${app}?`}
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
          }}
        >
          {openCount}
          {openCount === 1 ? 'st' : openCount === 2 ? 'nd' : openCount === 3 ? 'rd' : 'th'} time
          today
          {!outOfRoom && left
            ? ` · ${left.opens} open${left.opens === 1 ? '' : 's'} left, ${fmtMins(
                Math.min(sessionMins, left.minutes),
              )}${left.opens === 1 ? '' : ' each'}`
            : ''}
        </p>

        {/* the wait */}
        {!ready && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '9px 18px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            hold on… {countdown}s
          </div>
        )}

        <div style={{ flexGrow: 1 }} />

        {/* out of room: the emergency pass is the only way through */}
        {outOfRoom ? (
          passWhat ? (
            <AskWhat
              mic={mic}
              typed={typed}
              setTyped={setTyped}
              onSubmit={submitReason}
              title="what's it for?"
            />
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {passesLeft > 0 ? (
                <button
                  type="button"
                  className="tap"
                  disabled={!ready}
                  onClick={() => setPassWhat(true)}
                  style={{
                    width: '100%',
                    minHeight: 56,
                    borderRadius: 999,
                    border: 0,
                    background: ready ? '#12301A' : 'rgba(18,48,26,0.35)',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 18,
                    fontWeight: 600,
                    cursor: ready ? 'pointer' : 'default',
                  }}
                >
                  emergency pass · {PASS_MINUTES} min
                  <span style={{ display: 'block', fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                    {PASSES_PER_DAY === 1 ? 'one a day. this is it.' : `${passesLeft} left today`}
                  </span>
                </button>
              ) : (
                <p
                  style={{
                    margin: 0,
                    textAlign: 'center',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 19,
                    fontWeight: 600,
                  }}
                >
                  locked till tomorrow. see you then.
                </p>
              )}
            </div>
          )
        ) : needWhat ? (
          <AskWhat
            mic={mic}
            typed={typed}
            setTyped={setTyped}
            onSubmit={submitReason}
            title="fair. what for?"
          />
        ) : (
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            <button
              type="button"
              className="tap-ic"
              disabled={!ready}
              onClick={() => sayReason("i'm bored", 'suggestion')}
              style={{ ...card, opacity: ready ? 1 : 0.5 }}
            >
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
                i&apos;m bored
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                rilo picks something
              </span>
            </button>

            <button
              type="button"
              className="tap-ic"
              disabled={!ready}
              onClick={() => sayReason('just tired', 'tired')}
              style={{ ...card, opacity: ready ? 1 : 0.5 }}
            >
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
                just tired
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                brain is fried
              </span>
            </button>

            <button
              type="button"
              className="tap-ic"
              disabled={!ready}
              onClick={() => {
                onReason?.('taking a break');
                onUnlock('taking a break');
              }}
              style={{ ...card, opacity: ready ? 1 : 0.5 }}
            >
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
                taking a break
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                {strictOn ? 'strict mode' : breakEarned ? 'earned it' : 'costs an open'}
              </span>
            </button>

            <button
              type="button"
              className="tap-ic"
              disabled={!ready}
              onClick={() => setNeedWhat(true)}
              style={{ ...card, opacity: ready ? 1 : 0.5 }}
            >
              <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
                need it
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                for something real
              </span>
            </button>

            {/* once a day, across every app */}
            {!strictOn && (
              <button
                type="button"
                className="tap-ic"
                disabled={!ready}
                onClick={() => {
                  onFiveMore(fiveMoreUsed);
                  if (fiveMoreUsed) setScolded(true);
                  else onUnlock('5 more minutes', 5);
                }}
                style={{
                  ...card,
                  gridColumn: '1 / -1',
                  minHeight: 56,
                  opacity: ready ? 1 : 0.5,
                }}
              >
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
                  5 more minutes
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                  {fiveMoreUsed ? 'already used today' : 'once a day'}
                </span>
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className="tap"
          onClick={() => {
            onReason?.('never mind');
            go('home', 'back');
          }}
          style={{
            marginTop: 4,
            padding: '12px 22px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.22)',
            border: '1.5px solid rgba(255,255,255,0.6)',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          never mind, close it
        </button>
      </div>
    </div>
  );
}

/* "what for?" — talk or type, same as everywhere else in the app */
function AskWhat({ mic, typed, setTyped, onSubmit, title }) {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 22,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        {title}
      </p>

      {mic.usable && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <MicButton
            listening={mic.listening}
            disabled={false}
            onStart={() => mic.start((said) => said && onSubmit(said))}
            onStop={mic.stop}
          />
          {mic.listening ? <WaveBars on /> : null}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={typed}
          placeholder="type it…"
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit(typed);
          }}
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 48,
            boxSizing: 'border-box',
            padding: '0 16px',
            borderRadius: 999,
            border: '2px solid #12301A',
            background: '#FFFFFF',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#12301A',
          }}
        />
        <button
          type="button"
          className="tap"
          onClick={() => onSubmit(typed)}
          style={{
            height: 48,
            padding: '0 20px',
            borderRadius: 999,
            border: 0,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          go
        </button>
      </div>
    </div>
  );
}

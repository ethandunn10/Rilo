/* The pop-up, after the shield and the notification.

   This is where every way through an app lives, and there are only three:
   spend an open, spend today's emergency pass, or borrow half an open off
   tomorrow. When all three are gone, that's the day (§7) — Rilo says so
   kindly and there is nothing else to tap.

   Nothing unlocks until a short wait runs down: about 5 seconds normally,
   about 15 in strict mode (§12). Long enough to notice you're doing it.

   The opens circles are the same ones on the app's limit card (§3), so
   "two and a half left" looks identical in both places. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';
import {
  BLOCKED,
  LIMITED,
  BORROW_OPENS,
  PASS_MINUTES,
  WAIT_NORMAL,
  WAIT_STRICT,
  fmtOpens,
} from '../lib/limits';

export function waitFor(strictOn) {
  return strictOn ? WAIT_STRICT : WAIT_NORMAL;
}

function moodFor({ stuck, opensToday }) {
  /* out of everything gets the sad face, never the angry one — the day is
     already over for this app, there's nothing left to tell them off for */
  if (stuck) return 'letdown';
  if (opensToday >= 3) return 'angry';
  if (opensToday >= 2) return 'letdown';
  return 'coach';
}

const card = {
  minHeight: 80,
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

const wideBtn = (ready, dark = true) => ({
  width: '100%',
  minHeight: 56,
  borderRadius: 999,
  border: dark ? 0 : '2px solid #12301A',
  background: dark ? (ready ? '#12301A' : 'rgba(18,48,26,0.35)') : 'rgba(255,255,255,0.92)',
  color: dark ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  cursor: ready ? 'pointer' : 'default',
  opacity: ready ? 1 : 0.75,
});

export default function Intercept({
  go,
  skin,
  app,
  openCount,
  opensToday,
  /* the app's limit and what's left of it (lib/limits lockFor) */
  lock,
  minutes = 15,
  opensTotal = 0,
  opensUsed = 0,
  opensLeft = 0,
  strictOn = false,
  passesLeft = 0,
  canBorrow = false,
  onReason,
  onOpen,
  onPass,
  onBorrow,
}) {
  const wait = waitFor(strictOn);
  const [countdown, setCountdown] = useState(wait);
  const [passWhat, setPassWhat] = useState(false);
  const [typed, setTyped] = useState('');
  const timer = useRef(null);

  const limited = lock?.setting?.mode === LIMITED;
  const blocked = lock?.setting?.mode === BLOCKED;
  /* a window (bedtime / school / focus) beats everything but the pass */
  const windowed = Boolean(lock?.kind) && ['bedtime', 'school', 'focus'].includes(lock.kind);
  /* can they still spend an open on this? */
  const canSpend = limited && !windowed && !lock?.locked;
  /* Nothing left anywhere — the end of the road (§7). A window doesn't
     count: bedtime isn't "that's it for today", it's "not right now", and
     the opens are still sitting there waiting for the morning. */
  const stuck = !canSpend && !windowed && passesLeft <= 0 && !canBorrow;

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
  const mood = moodFor({ stuck, opensToday });

  const sayReason = (label, where) => {
    onReason?.(label);
    go(where);
  };

  const headline = () => {
    if (windowed) {
      return lock.kind === 'bedtime'
        ? 'it’s bedtime'
        : lock.kind === 'school'
          ? 'school hours'
          : 'you’re in a focus block';
    }
    if (blocked) return `${app} is blocked`;
    if (stuck) return 'that’s it for today';
    if (!canSpend) return 'out of opens for today';
    return `opening ${app}?`;
  };

  const subline = () => {
    if (windowed) return 'always-allowed apps still work. so does your pass.';
    if (blocked) return 'no opens on this one. the pass still works.';
    if (lock?.kind === 'halfstranded') {
      return `strict mode needs a whole open, and you’ve got ${fmtOpens(opensLeft)} left.`;
    }
    return '';
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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '40px 20px 0',
          '--tail': '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
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
            flexShrink: 0,
          }}
        >
          <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8 }}>
            <AppLogo label={app} size={24} radius={8} />
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 600 }}>
            {app}
          </span>
        </div>

        <Rilo skin={skin} mood={mood} size={140} />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 27,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
            flexShrink: 0,
          }}
        >
          {headline()}
        </h1>

        {/* §7: kind, not mean. the day is over, midnight is coming. */}
        {stuck && (
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: '#2C4A36',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            fresh opens at midnight. go do something better.
          </p>
        )}

        {subline() && (
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              fontWeight: 600,
              color: '#2C4A36',
              textAlign: 'center',
              flexShrink: 0,
            }}
          >
            {subline()}
          </p>
        )}

        {/* how many times today, and the circles */}
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {openCount}
          {openCount === 1 ? 'st' : openCount === 2 ? 'nd' : openCount === 3 ? 'rd' : 'th'} time
          today
        </p>

        {limited && (
          <div
            style={{
              flexShrink: 0,
              padding: '9px 14px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.7)',
              border: '1.5px solid rgba(255,255,255,0.95)',
            }}
          >
            <Opens total={opensTotal} used={opensUsed} minutes={minutes} align="center" />
          </div>
        )}

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
              flexShrink: 0,
            }}
          >
            hold on… {countdown}s
          </div>
        )}

        <div style={{ flexGrow: 1, minHeight: 6 }} />

        {passWhat ? (
          <AskWhat
            typed={typed}
            setTyped={setTyped}
            onSubmit={(text) => text.trim() && onPass(text.trim())}
            title="what's it for?"
          />
        ) : (
          <div
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}
          >
            {/* 1. spend an open — the normal way in, via the check-in (§4) */}
            {canSpend && (
              <button
                type="button"
                className="tap"
                disabled={!ready}
                onClick={() => {
                  onReason?.('opened it');
                  onOpen();
                }}
                style={wideBtn(ready)}
              >
                open it
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                  i’ll ask what for, then how long
                </span>
              </button>
            )}

            {/* 2. the emergency pass — works on blocked and limited apps, in
                   both modes, and through bedtime / school / focus (§5) */}
            {!canSpend && passesLeft > 0 && (
              <button
                type="button"
                className="tap"
                disabled={!ready}
                onClick={() => setPassWhat(true)}
                style={wideBtn(ready)}
              >
                emergency pass · {PASS_MINUTES} min
                <span style={{ display: 'block', fontSize: 12, fontWeight: 600, opacity: 0.8 }}>
                  one a day. this is it.
                </span>
              </button>
            )}

            {/* 3. borrow half an open off tomorrow (§6, normal mode only) */}
            {canBorrow && (
              <button
                type="button"
                className="tap"
                disabled={!ready}
                onClick={onBorrow}
                style={wideBtn(ready, false)}
              >
                borrow ½ open from tomorrow
                <span
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#3D5A46',
                  }}
                >
                  tomorrow {app} starts {fmtOpens(BORROW_OPENS)} lower. once a day.
                </span>
              </button>
            )}

            {/* something better to do, instead of any of the above */}
            {!stuck && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="tap-ic"
                  onClick={() => sayReason("i'm bored", 'suggestion')}
                  style={card}
                >
                  <span
                    style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
                  >
                    i&apos;m bored
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                    rilo picks something
                  </span>
                </button>

                <button
                  type="button"
                  className="tap-ic"
                  onClick={() => sayReason('just tired', 'tired')}
                  style={card}
                >
                  <span
                    style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
                  >
                    just tired
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
                    brain is fried
                  </span>
                </button>
              </div>
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
            flexShrink: 0,
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
          {stuck ? 'alright, close it' : 'never mind, close it'}
        </button>
      </div>
    </div>
  );
}

/* "what for?" — talk or type, same as everywhere else in the app */
function AskWhat({ typed, setTyped, onSubmit, title }) {
  return (
    <div
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}
    >
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

      {/* Typing first: it's the thing that always works, needs no
          permission and no quiet room. The mic sits under it for anyone who
          would rather say it. */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          autoFocus
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

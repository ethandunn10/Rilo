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
import BypassGuilt from '../components/BypassGuilt';
import {
  BLOCKED,
  FREE,
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
  /* their own onboarding answers and what a bypass costs — rilo says both
     before he lets them past a limit */
  hobbies = [],
  goals = [],
  streak = 0,
  /* how much of today's goal is left, so rilo can say what this open
     actually risks BEFORE they tap through — a streak they can still save
     stops more opens than any penalty applied afterwards */
  goalLeft = null,
  /* put a limit on an app that hasn't got one */
  onLimitIt,
}) {
  const wait = waitFor(strictOn);
  const [countdown, setCountdown] = useState(wait);
  /* which bypass they tapped, if any: 'pass' or 'borrow'. Both go through
     the same sad-rilo sheet, which is what collects the reason. */
  const [bypass, setBypass] = useState(null);
  const timer = useRef(null);

  const limited = lock?.setting?.mode === LIMITED;
  const blocked = lock?.setting?.mode === BLOCKED;
  /* An app with no limit has nothing to run out of. It still gets the wait
     and the check-in — rilo always asks what it's for — but it can never be
     "that's it for today", which is what used to happen: with no opens to
     spend it fell through to the out-of-everything screen and got blocked
     by a limit it doesn't have. */
  const unlimited = lock?.setting?.mode === FREE;
  /* a window (bedtime / school / focus) beats everything but the pass */
  const windowed = Boolean(lock?.kind) && ['bedtime', 'school', 'focus'].includes(lock.kind);
  /* can they still spend an open on this? */
  const canSpend = (limited || unlimited) && !windowed && !lock?.locked;
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

        <Rilo skin={skin} mood={mood} size={140} talks />

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

        {(
          <div
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}
          >
            {/* What this open is actually about to cost them, said before
                they commit rather than after. Only when a streak is real
                and genuinely close to going — otherwise it is noise. */}
            {streak >= 2 && goalLeft !== null && goalLeft > 0 && goalLeft <= 30 && (
              <p
                data-streak-warning=""
                style={{
                  margin: 0,
                  padding: '10px 13px',
                  borderRadius: 16,
                  background: 'rgba(217,100,58,0.12)',
                  color: '#8F3F15',
                  fontSize: 13.5,
                  fontWeight: 700,
                  lineHeight: 1.35,
                  textAlign: 'left',
                }}
              >
                {goalLeft} min left today — that&apos;s all that&apos;s between you and
                losing a {streak}-day streak.
              </p>
            )}

            {/* An app with no limit can't block them, so the only useful
                thing rilo can do is point out how often they're on it and
                offer to put a limit there. */}
            {unlimited && openCount >= 3 && onLimitIt && (
              <button
                type="button"
                className="tap"
                data-suggest-limit=""
                onClick={onLimitIt}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  textAlign: 'left',
                  padding: '12px 14px',
                  borderRadius: 20,
                  border: '2px solid var(--line, #12301A)',
                  background: 'rgba(255,255,255,0.94)',
                  color: '#12301A',
                  cursor: 'pointer',
                }}
              >
                <span style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600 }}>
                  that&apos;s {openCount} times today, and {app} has no limit.
                </span>
                <span style={{ display: 'block', marginTop: 2, fontSize: 12.5, fontWeight: 600, color: '#3D5A46' }}>
                  want me to put one on it?
                </span>
              </button>
            )}

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
                onClick={() => setBypass('pass')}
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
                onClick={() => setBypass('borrow')}
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

            {/* "i'm bored" and "just tired" used to sit here, which let them
                tick a box and carry straight on. They belong one screen
                later, with the rest of the reasons, after the wait. */}
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
            background: 'rgba(255,255,255,0.92)',
            border: '1.5px solid var(--line, #12301A)',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {stuck ? 'alright, close it' : 'never mind, close it'}
        </button>
      </div>

      {/* every way around a limit goes through rilo first */}
      {bypass && (
        <BypassGuilt
          skin={skin}
          kind={bypass}
          hobbies={hobbies}
          goals={goals}
          streak={streak}
          title={bypass === 'borrow' ? 'borrowing from tomorrow?' : 'using your one pass?'}
          confirmLabel={bypass === 'borrow' ? 'borrow it' : 'use the pass'}
          onCancel={() => setBypass(null)}
          onConfirm={(reason) => {
            setBypass(null);
            if (bypass === 'borrow') onBorrow(reason);
            else onPass(reason);
          }}
        />
      )}
    </div>
  );
}


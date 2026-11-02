/* "what are you opening this for?" — the check-in before a session (§4).

   They say why, then pick how long: quick (half an open) or full (one
   open), using the app's own numbers. There's no free choice of minutes any
   more — the two options ARE the two things half an open and a whole open
   buy you.

   With only half an open left, only quick is on offer (§2.5). In strict
   mode halves are off, so only full is (§2.8).

   Rilo keeps the reason either way: it's what he calls out if they burn the
   whole open on a "quick check", and it's what the stats are built from. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';
import { checkinReasons } from '../lib/addons';
import { pushBack } from '../demo/mockAI';
import { halfOf } from '../lib/limits';

const pill = (on) => ({
  width: '100%',
  minHeight: 54,
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

/* "7.5 min" reads better than "7.5m" here, and a whole number loses the .0 */
const mins = (n) => `${Math.round(n * 10) / 10} min`;

export default function WhyOpen({
  app,
  skin,
  /* the app's limit and what's left of it today */
  minutes = 15,
  opensLeft = 1,
  opensTotal = 3,
  opensUsed = 0,
  strictOn = false,
  /* 'yes' | 'sometimes' | 'no' — sharpens the "need to post" line */
  creator = '',
  /* what Rilo knows, so he can argue with something specific */
  hobbies = [],
  goals = [],
  schedule = [],
  nowMins = 0,
  onStart,
  onNevermind,
  /* they took him up on the alternative */
  onInstead,
}) {
  const [reason, setReason] = useState('');
  const [why, setWhy] = useState('');
  /* 'reason' -> 'push' (or 'what' for posting) -> 'length' */
  const [stage, setStage] = useState('reason');

  /* which lengths are actually on offer */
  const half = halfOf(minutes);
  const canFull = opensLeft >= 1;
  const canQuick = !strictOn && opensLeft >= 0.5;

  /* default to whatever's available — full if they have it, else quick */
  const [length, setLength] = useState(canFull && strictOn ? 'full' : canQuick ? 'quick' : 'full');

  const picked = length === 'quick' && canQuick ? 'quick' : 'full';
  const capMins = picked === 'quick' ? half : minutes;
  const cost = picked === 'quick' ? 0.5 : 1;

  /* what he'd say instead, built from what they told him in onboarding */
  const argument =
    stage === 'push' && reason ? pushBack({ reason, app, hobbies, goals, schedule, nowMins }) : null;

  /* "something else" and "need to post" both have to be described */
  const needsWords = reason === 'custom' || reason === 'post';
  const ready = reason && (!needsWords || why.trim()) && stage === 'length';

  const choice = (id, title, sub, enabled) => (
    <button
      key={id}
      type="button"
      className="tap"
      disabled={!enabled}
      onClick={() => setLength(id)}
      style={{
        ...pill(picked === id),
        minHeight: 58,
        opacity: enabled ? 1 : 0.4,
        cursor: enabled ? 'pointer' : 'default',
      }}
    >
      <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.75,
        }}
      >
        {sub}
      </span>
    </button>
  );

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
          padding: '44px 22px 0',
          '--tail': '26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 11,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <Rilo skin={skin} mood="curious" size={88} talks />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 25,
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              what are you opening {app} for?
            </h1>
          </div>
        </div>

        {/* what's left, in the same circles as everywhere else (§3) */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 14px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.72)',
            border: '2px solid rgba(255,255,255,0.95)',
          }}
        >
          <Opens total={opensTotal} used={opensUsed} minutes={minutes} />
        </div>

        {stage === 'reason' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
          {checkinReasons(creator).map((r) => (
            <button
              key={r.id}
              type="button"
              className="tap"
              onClick={() => {
                setReason(r.id);
                /* posting is the one he doesn't argue with — but he does
                   ask what. everything else gets pushed back on first. */
                setStage(r.id === 'post' ? 'what' : 'push');
              }}
              style={pill(reason === r.id)}
            >
              <span style={{ fontSize: 17, fontWeight: 600 }}>{r.label}</span>
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
        </div>
        )}

        {/* He doesn't argue with posting — but "i need to post" is the
            easiest thing to tell yourself, so it has to be said out loud. */}
        {stage === 'what' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0 }}>
            <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
              {reason === 'post' ? 'what are you posting?' : 'what for?'}
            </p>
            <input
              autoFocus
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder={
                reason === 'post' ? 'the video i filmed, the photo from…' : 'say what for…'
              }
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
            <button
              type="button"
              className="tap"
              disabled={!why.trim()}
              onClick={() => setStage('length')}
              style={{
                ...pill(false),
                minHeight: 50,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: why.trim() ? 1 : 0.45,
                cursor: why.trim() ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 600 }}>that's what i'm doing</span>
            </button>
          </div>
        )}

        {/* The argument. Everything he knows about them, spent here. */}
        {stage === 'push' && argument && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flexShrink: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 21,
                fontWeight: 600,
                lineHeight: 1.25,
              }}
            >
              {argument.lead}
            </p>

            {argument.options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="tap"
                onClick={() => onInstead?.(o)}
                style={pill(false)}
              >
                <span style={{ fontSize: 17, fontWeight: 600 }}>{o.label}</span>
                <span
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    opacity: 0.75,
                  }}
                >
                  {o.sub}
                </span>
              </button>
            ))}

            {/* He argues once, then gets out of the way — and the way out
                has to be READABLE. This was white text on 22% white over a
                pale sky, which is to say invisible. It's the app's normal
                secondary button now: opaque, dark text, dark border. */}
            <button
              type="button"
              className="tap"
              onClick={() => setStage(reason === 'custom' ? 'what' : 'length')}
              style={{
                minHeight: 50,
                boxSizing: 'border-box',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: 'rgba(255,255,255,0.92)',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 3px 0 var(--line, #12301A)',
              }}
            >
              no, open {app} anyway
            </button>
          </div>
        )}

        {stage === 'length' && (
          <>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>
              how long do you need?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
              {choice('quick', 'quick', `½ open · ${mins(half)}`, canQuick)}
              {choice('full', 'full', `1 open · ${mins(minutes)}`, canFull)}
            </div>

            <p
              style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#2C4A36', lineHeight: 1.35 }}
            >
              {strictOn
                ? 'strict mode: no halves. any session costs a whole open.'
                : !canFull
                  ? `half an open left, so this one maxes out at ${mins(half)}.`
                  : `leave by ${mins(half)} and it only costs half an open.`}
            </p>
          </>
        )}

        <div style={{ flexGrow: 1, minHeight: 6 }} />

        {stage === 'length' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ display: 'flex', borderRadius: 12, overflow: 'hidden' }}>
            <AppLogo label={app} size={44} radius={12} />
          </span>
          <button
            type="button"
            className="tap"
            disabled={!ready}
            onClick={() =>
              onStart({
                reason,
                why: why.trim(),
                /* what they asked for, and what it costs */
                length: picked,
                mins: capMins,
                cost,
              })
            }
            style={{
              flexGrow: 1,
              height: 56,
              borderRadius: 999,
              border: 0,
              background: ready ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
              color: ready ? '#12301A' : 'rgba(18,48,26,0.45)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'default',
              boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
            }}
          >
            {ready ? `open for ${mins(capMins)}` : 'pick a reason'}
          </button>
        </div>
        )}

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

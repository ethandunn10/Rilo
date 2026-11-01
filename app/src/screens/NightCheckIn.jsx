/* The thirty seconds at night. Rilo asks how today went and what's on
   tomorrow, they type it, and he turns it into tomorrow's schedule.

   DEMO ONLY: what they write is matched against patterns in demo/mockAI.js.
   The mobile app sends this to a real model. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { RiloStage } from '../components/TalkBits';
import { track } from '../lib/track';
import { NIGHT_QUESTIONS, nightReply, tasksFrom, DEMO_NIGHT } from '../demo/mockAI';

export default function NightCheckIn({ skin, onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const [said, setSaid] = useState({ today: '', tomorrow: '' });
  const [draft, setDraft] = useState('');
  const [done, setDone] = useState(false);
  const timers = useRef([]);
  const stepRef = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const q = NIGHT_QUESTIONS[Math.min(step, NIGHT_QUESTIONS.length - 1)];

  const answer = (raw) => {
    const text = (raw || '').trim();
    if (!text) return;
    const at = stepRef.current;
    const key = NIGHT_QUESTIONS[at].id;
    setSaid((s) => ({ ...s, [key]: text }));
    setDraft('');
    track('night', key);

    if (at + 1 < NIGHT_QUESTIONS.length) {
      stepRef.current = at + 1;
      setStep(at + 1);
    } else {
      setDone(true);
    }
  };

  const reply = nightReply(said.today);
  const tasks = tasksFrom(said.tomorrow);
  const showText = draft;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#FFFFFF',
      }}
    >
      {/* the same dusk sky the "just tired" screen already uses */}
      <Sky hills="low" tone="dusk" />

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 22px 0',
          '--tail': '26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {/* Top row, the same shape as the Talk screen: one clearly tappable
            button on the left. The old way out was a 15px "not tonight" at
            the very bottom of a scrolling page — easy to miss, easy to
            mis-tap, and below the fold while he was still asking. */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            minHeight: 40,
          }}
        >
          <button
            type="button"
            className="tap"
            onClick={onSkip}
            style={{
              minHeight: 40,
              padding: '0 16px',
              borderRadius: 999,
              border: '2px solid rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.14)',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            close
          </button>

          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.1em',
              opacity: 0.7,
            }}
          >
            CHECK-IN
          </p>

          {/* keeps the label centred against the button on the left */}
          <span style={{ width: 72 }} />
        </div>

        <div
          style={{
            maxWidth: 320,
            padding: '14px 18px',
            borderRadius: 22,
            background: 'rgba(255,255,255,0.12)',
            border: '2px solid rgba(255,255,255,0.4)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {done ? reply.line : q.ask}
          </p>
        </div>

        <RiloStage skin={skin} mood={done ? reply.mood : 'curious'} size={180} />

        {!done && (
          <p
            style={{
              margin: 0,
              padding: '8px 18px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.16)',
              color: '#FFFFFF',
              border: '2px solid rgba(255,255,255,0.5)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            thirty seconds, that&apos;s it
          </p>
        )}

        {showText && !done && (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
            “{showText}”
          </p>
        )}

        {!done && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              answer(draft);
            }}
            style={{ display: 'flex', gap: 8, width: '100%' }}
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="type it…"
              style={{
                flexGrow: 1,
                minWidth: 0,
                height: 48,
                boxSizing: 'border-box',
                padding: '0 16px',
                borderRadius: 999,
                border: '2px solid rgba(255,255,255,0.5)',
                background: 'rgba(255,255,255,0.95)',
                fontSize: 16,
                fontWeight: 600,
                color: '#2B3A6B',
              }}
            />
            <button type="submit" className="tap" style={ghost}>
              send
            </button>
          </form>
        )}

        {/* what he made of it */}
        {done && (
          <div
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 22,
              background: 'rgba(255,255,255,0.12)',
              border: '2px solid rgba(255,255,255,0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
              tomorrow
            </p>
            {tasks.length ? (
              tasks.map((t) => (
                <div key={t.title} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600 }}>
                    {t.title}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.75 }}>{t.note}</span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, opacity: 0.8 }}>
                nothing booked. i&apos;ll keep your usual plan.
              </p>
            )}
          </div>
        )}

        <div style={{ flexGrow: 1, minHeight: 6 }} />

        {done ? (
          <button
            type="button"
            className="tap-94"
            onClick={() => onDone({ said, tasks, mood: reply.mood })}
            style={{
              width: '100%',
              height: 56,
              border: 0,
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#2B3A6B',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 19,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            put it in tomorrow&apos;s plan
          </button>
        ) : null}

        {/* DEMO ONLY: see the whole thing without a mic */}
        {!done && (
          <button
            type="button"
            className="tap"
            onClick={() => {
              setSaid(DEMO_NIGHT);
              setDone(true);
              track('night', 'demo: filled it in');
            }}
            style={{
              border: 0,
              background: 'transparent',
              color: 'rgba(255,255,255,0.65)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              padding: 4,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              cursor: 'pointer',
            }}
          >
            demo: fill it in for me
          </button>
        )}

      </div>
    </div>
  );
}

const ghost = {
  minHeight: 48,
  padding: '0 18px',
  borderRadius: 999,
  border: '2px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.12)',
  color: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};

/* Talk to Rilo — the pieces shared by the Talk screen and the pop-up.

   RiloStage: big Rilo in the middle with sound-wave rings rolling out
              behind him. Green rings while you talk, soft white while he
              talks. Tap him to talk.
   WaveBars:  the bouncing sound bars under him while the mic is on.
   MicButton: hold to talk, or tap once to start and again to stop. */

import { useEffect, useRef, useState } from 'react';
import { useListen } from '../lib/listen';
import Rilo from './Rilo';

export function RiloStage({ skin, mood, size = 210, state = 'idle', onTap }) {
  const box = size + 110;
  const ringColor = state === 'listening' ? '#4CC160' : '#FFFFFF';
  const rings = state === 'idle' ? [] : [0, 1, 2];

  return (
    <button
      type="button"
      aria-label="tap rilo to talk"
      onClick={onTap}
      className="tap-94"
      style={{
        position: 'relative',
        width: box,
        height: box,
        border: 0,
        padding: 0,
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* soft disc so the rings have something to roll out from */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: size * 0.92,
          height: size * 0.92,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          border: '2px solid rgba(18,48,26,0.12)',
        }}
      />
      {rings.map((i) => (
        <span
          key={`${state}-${i}`}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: box - 6,
            height: box - 6,
            borderRadius: '50%',
            border: `${state === 'listening' ? 4 : 3}px solid ${ringColor}`,
            animation: `talk-ring ${state === 'listening' ? 1.6 : 2.2}s ${i * (state === 'listening' ? 0.53 : 0.73)}s ease-out infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <span style={{ position: 'relative' }}>
        <Rilo skin={skin} mood={mood} size={size} motion={state === 'listening' ? 'none' : 'idle'} />
      </span>
    </button>
  );
}

const BARS = [0.35, 0.6, 0.9, 0.5, 1, 0.7, 0.45, 0.85, 0.6, 1, 0.55, 0.8, 0.4, 0.95, 0.65, 0.5, 0.9, 0.45, 0.7, 0.35];

export function WaveBars({ on, color = '#12301A' }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        opacity: on ? 1 : 0,
        transition: 'opacity .25s',
      }}
    >
      {BARS.map((h, i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 44 * h,
            borderRadius: 3,
            background: i % 3 === 1 ? '#4CC160' : color,
            transformOrigin: 'center',
            animation: on ? `talk-bar ${0.55 + (i % 4) * 0.12}s ${(i * 0.07) % 0.5}s ease-in-out infinite` : 'none',
            transform: on ? undefined : 'scaleY(0.22)',
          }}
        />
      ))}
    </div>
  );
}

export function MicIcon({ size = 30, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="2.5" width="7" height="12" rx="3.5" fill={color} />
      <path
        d="M5 11.5a7 7 0 0 0 14 0M12 18.5v3"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* hold → talk while held. quick tap → stays on until you tap again. */
export function MicButton({ listening, onStart, onStop, size = 84, disabled }) {
  const downAt = useRef(0);
  const wasOn = useRef(false);

  return (
    <button
      type="button"
      aria-label={listening ? 'stop talking' : 'hold to talk'}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        wasOn.current = listening;
        downAt.current = Date.now();
        if (!listening) onStart();
      }}
      onPointerUp={() => {
        const held = Date.now() - downAt.current > 350;
        if (wasOn.current || held) onStop();
      }}
      onPointerLeave={() => {
        if (listening && Date.now() - downAt.current > 350 && !wasOn.current) onStop();
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '2px solid var(--line)',
        background: listening ? '#2E8B3E' : '#12301A',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: listening ? 'scale(1.08)' : 'none',
        transition: 'transform .15s, background .15s',
        animation: listening ? 'talk-glow 1.2s ease-out infinite' : 'none',
        boxShadow: '0 4px 0 var(--line)',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <MicIcon size={size * 0.4} />
    </button>
  );
}

/* TalkCircle — the little Rilo circle that sits next to the continue
   button on the onboarding pages after the big Talk screen. Hold it and
   say it instead of tapping. `onHeard(text)` does the work and returns
   Rilo's reply line. */
export function TalkCircle({ skin, onHeard, hint = 'hold me and just say it' }) {
  const mic = useListen();
  const [reply, setReply] = useState('');
  const [peek, setPeek] = useState(true);
  const t = useRef(null);
  const downAt = useRef(0);
  const wasOn = useRef(false);

  useEffect(() => {
    t.current = setTimeout(() => setPeek(false), 3200);
    return () => clearTimeout(t.current);
  }, []);

  if (!mic.usable) return null;

  const heard = (said) => {
    const line = said ? onHeard(said) : '';
    setReply(line || "didn't catch that. try again?");
    clearTimeout(t.current);
    t.current = setTimeout(() => setReply(''), 2800);
  };
  const start = () => {
    setPeek(false);
    setReply('');
    mic.start(heard);
  };

  const listening = mic.listening;
  const bubbleText = listening ? mic.text : reply || (peek ? hint : '');

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {(listening || bubbleText) && (
        <div
          key={listening ? 'l' : bubbleText}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 72,
            width: 230,
            padding: '10px 14px',
            borderRadius: '18px 18px 6px 18px',
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            animation: 'bubble-in .25s ease-out both',
            zIndex: 5,
          }}
        >
          {listening && !mic.text ? (
            <div style={{ transform: 'scale(0.7)', height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WaveBars on />
            </div>
          ) : (
            <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: '#12301A' }}>
              {listening ? `“${bubbleText}”` : bubbleText}
            </p>
          )}
        </div>
      )}
      {listening &&
        [0, 1].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: -14,
              borderRadius: '50%',
              border: '3px solid #4CC160',
              animation: `talk-ring 1.4s ${i * 0.7}s ease-out infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}
      <button
        type="button"
        aria-label={listening ? 'stop talking' : 'hold rilo to talk'}
        onPointerDown={(e) => {
          e.preventDefault();
          wasOn.current = listening;
          downAt.current = Date.now();
          if (!listening) start();
        }}
        onPointerUp={() => {
          if (wasOn.current || Date.now() - downAt.current > 350) mic.stop();
        }}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          position: 'relative',
          width: 58,
          height: 58,
          borderRadius: 999,
          background: listening ? '#4CC160' : '#BFE8B8',
          border: '2px solid var(--line)',
          boxShadow: '0 4px 0 var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transform: listening ? 'scale(1.08)' : 'none',
          transition: 'transform .15s, background .15s',
        }}
      >
        <Rilo skin={skin} mood={listening ? 'curious' : 'coach'} motion="none" size={46} />
      </button>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -4,
          bottom: -4,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#12301A',
          border: '2px solid #FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <MicIcon size={12} />
      </span>
    </div>
  );
}

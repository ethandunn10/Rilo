/* Talk to Rilo — the pieces shared by the Talk screen and the pop-up.

   RiloStage: big Rilo in the middle with sound-wave rings rolling out
              behind him while he's saying his line. Tap him to hear it
              again.
   ChatIcon:  the little badge on Home that opens the chat.

   The microphone pieces (MicButton, WaveBars, TalkCircle) are gone along
   with talk-to-text — see the note at the top of lib/listen.js. */

import Rilo from './Rilo';

export function RiloStage({ skin, mood, size = 210, state = 'idle', onTap }) {
  const box = size + 110;
  /* 'talking' rolls rings out while he says his line; 'idle' is still */
  const rings = state === 'idle' ? [] : [0, 1, 2];

  return (
    <button
      type="button"
      aria-label="rilo"
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
            border: '3px solid #FFFFFF',
            animation: `talk-ring 2.2s ${i * 0.73}s ease-out infinite`,
            pointerEvents: 'none',
          }}
        />
      ))}
      <span style={{ position: 'relative' }}>
        <Rilo skin={skin} mood={mood} size={size} />
      </span>
    </button>
  );
}

/* The badge on Home's Rilo. It used to be a microphone, which promised
   something the app no longer does. */
export function ChatIcon({ size = 16, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 13 4a8 8 0 0 1 8 8Z"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="9.5" cy="12" r="1.1" fill={color} />
      <circle cx="13" cy="12" r="1.1" fill={color} />
      <circle cx="16.5" cy="12" r="1.1" fill={color} />
    </svg>
  );
}

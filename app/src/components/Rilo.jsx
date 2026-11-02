/* Rilo — the panda character.

   Renders designs/rilo-panda/{skin}-{mood}.svg inline, exactly as drawn, so
   the art's own animations run (the waving arm, the angry shake). The markup
   is generated into src/rilo/sprites.js by scripts/build-rilo.mjs — nothing
   here redraws or restyles Rilo.

   The headband "RILO" is set in Fredoka inside the art itself; Fredoka is
   loaded in index.html, so it renders in the right face.

   props: skin  = original | proband | bamboo | shades | beanie
                | sakura | studio | redpanda | pinkpanda | gold
          mood  = coach | wave | proud | curious | sleepy | letdown | angry
          size  = px width
          motion = idle (gentle bob) | jump | none

   The bob/jump sit on a wrapper so they never interfere with the animations
   built into the SVGs. */

import { useEffect, useRef, useState } from 'react';
import { RILO_VIEWBOX, SPRITES } from '../rilo/sprites';
import { nextLine, SAY_MS } from '../lib/riloLines';

/* the art is drawn in a 208 x 182 box */
const W = 208;
const H = 182;

const LABEL = {
  coach: 'Rilo, confident and winking',
  wave: 'Rilo waving hello',
  proud: 'Rilo proud',
  curious: 'Rilo curious, asking why',
  sleepy: 'Rilo sleepy',
  letdown: 'Rilo let down',
  angry: 'Rilo annoyed',
};

export default function Rilo({
  skin = 'original',
  mood = 'coach',
  size = 200,
  motion = 'idle',
  /* Tapping him squishes him and he says something (lib/riloLines).
     Off by default, because plenty of Rilos sit INSIDE a button already —
     Home's hero opens the chat, the You tab's cards navigate — and a
     button inside a button is both invalid markup and a fight over the
     tap. Those pass nothing; everywhere he's just decoration passes
     `talks`. */
  talks = false,
}) {
  /* the line he's saying right now, and which one it was last time */
  const [line, setLine] = useState(null);
  const lastIndex = useRef(-1);
  const timer = useRef(null);
  const [squish, setSquish] = useState(0);

  useEffect(() => () => clearTimeout(timer.current), []);

  const poke = () => {
    const picked = nextLine(lastIndex.current);
    lastIndex.current = picked.index;
    setLine(picked);
    /* a changing key restarts the animation even on a rapid second tap */
    setSquish((n) => n + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLine(null), SAY_MS);
  };

  /* His line can carry a mood, which lasts only as long as the line. A
     screen that put him in a particular face gets it back afterwards. */
  const shown = line?.mood ?? mood;

  const key = `${skin}-${shown}`;
  const markup = SPRITES[key] ?? SPRITES[`original-${shown}`] ?? SPRITES['original-coach'];

  const w = Number(size);
  const h = Math.round((w * H) / W);

  const cls = motion === 'jump' ? 'rilo rilo-jump' : motion === 'none' ? 'rilo' : 'rilo rilo-bob';

  const art = (
    <div className={cls} style={{ width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox={RILO_VIEWBOX}
        role="img"
        aria-label={LABEL[mood] ?? LABEL.coach}
        /* static, local art generated at build time */
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  );

  if (!talks) return art;

  return (
    <div style={{ position: 'relative', width: w, height: h, flexShrink: 0 }}>
      <button
        type="button"
        aria-label="poke rilo"
        onClick={poke}
        style={{
          display: 'block',
          width: w,
          height: h,
          padding: 0,
          border: 0,
          background: 'transparent',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* the squish rides on a wrapper so it never fights the bob or the
            animations built into the SVGs themselves */}
        <span
          key={squish}
          className={squish ? 'rilo-squish' : undefined}
          style={{ display: 'block', transformOrigin: 'center bottom' }}
        >
          {art}
        </span>
      </button>

      {/* What he said. Floats above him, ignores pointers, and takes up no
          layout space — so it can't nudge the screen around or block the
          thing you were actually doing. */}
      {line && (
        <span
          aria-live="polite"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '100%',
            marginBottom: 4,
            zIndex: 30,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            padding: '6px 12px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: Math.max(12, Math.min(15, Math.round(w / 11))),
            fontWeight: 600,
            boxShadow: '0 6px 18px rgba(10,40,20,0.28)',
            animation: `rilo-pop-say ${SAY_MS}ms ease-out both`,
          }}
        >
          {line.say}
        </span>
      )}
    </div>
  );
}

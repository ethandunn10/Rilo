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

import { RILO_VIEWBOX, SPRITES } from '../rilo/sprites';

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

export default function Rilo({ skin = 'original', mood = 'coach', size = 200, motion = 'idle' }) {
  const key = `${skin}-${mood}`;
  const markup = SPRITES[key] ?? SPRITES[`original-${mood}`] ?? SPRITES['original-coach'];

  const w = Number(size);
  const h = Math.round((w * H) / W);

  const cls = motion === 'jump' ? 'rilo rilo-jump' : motion === 'none' ? 'rilo' : 'rilo rilo-bob';

  return (
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
}

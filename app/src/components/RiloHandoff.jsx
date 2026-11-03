/* RiloHandoff — the beat between finishing onboarding and the intro tour.

   Onboarding ends on a paywall and the tour opens with a dimmed screen and
   a spotlight; cutting straight from one to the other is abrupt, and the
   first thing they'd see of their own app is it being greyed out. So Rilo
   bounds across the grass first, says one line, and the whole thing fades
   into the app underneath.

   It gets out of the way on its own, and a tap skips it — it's a flourish,
   and a flourish you can't skip is just a delay. */

import { useEffect, useRef, useState } from 'react';
import Rilo from './Rilo';
import { ThemeDecor } from './Sky';
import { useTheme } from '../lib/themes';
import { useReducedMotion } from '../lib/motion';

const CROSS_MS = 2400;
const FADE_MS = 520;

export default function RiloHandoff({ skin, name, onDone }) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  /* one exit path, however it's triggered */
  const finish = () => {
    if (done.current) return;
    done.current = true;
    setLeaving(true);
    setTimeout(onDone, reduced ? 0 : FADE_MS);
  };

  useEffect(() => {
    if (reduced) { finish(); return undefined; }
    const t = setTimeout(finish, CROSS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      role="presentation"
      onClick={finish}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        overflow: 'hidden',
        background: theme.sky,
        cursor: 'pointer',
        animation: leaving && !reduced ? `handoff-out ${FADE_MS}ms ease-out both` : 'none',
      }}
    >
      <ThemeDecor />

      {/* the hills he runs along */}
      <svg
        width="100%"
        height="210"
        viewBox="0 0 390 210"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <path d="M0 96 C110 42 250 52 390 86 L390 210 L0 210 Z" fill={theme.hills[1]} />
        <path d="M0 150 C130 116 260 120 390 150 L390 210 L0 210 Z" fill={theme.hills[2]} />
      </svg>

      <p
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          top: '24%',
          margin: 0,
          textAlign: 'center',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 29,
          fontWeight: 700,
          lineHeight: 1.18,
          color: '#12301A',
          animation: reduced ? 'none' : 'rise .5s ease-out both',
        }}
      >
        {name ? `alright ${name.toLowerCase()} — let me show you around.` : 'alright — let me show you around.'}
      </p>

      {/* across the grass, hopping as he goes */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          bottom: 78,
          animation: reduced ? 'none' : `rilo-cross ${CROSS_MS}ms linear both`,
        }}
      >
        <div style={{ animation: reduced ? 'none' : `rilo-hop ${CROSS_MS}ms ease-in-out both` }}>
          {/* big — he is the whole screen here, not a mascot in a corner */}
          <Rilo skin={skin} mood="proud" size={190} motion="none" />
          <div
            aria-hidden="true"
            style={{
              width: 150,
              height: 15,
              margin: '-8px auto 0',
              borderRadius: '50%',
              background: 'rgba(12,48,26,0.3)',
              filter: 'blur(5px)',
              animation: reduced ? 'none' : `rilo-shadow ${CROSS_MS}ms ease-in-out both`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

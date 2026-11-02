/* MeetRiloTour — the walkthrough that runs once, right after onboarding.

   One green box around the feature being explained, everything else dimmed,
   and Rilo with one line sitting above or below it — never on top of it.

   The coordinate trap, which broke this twice: PhoneFrame scales .stage with
   a CSS transform to fit the window. getBoundingClientRect() reports
   post-scale pixels, but absolutely positioned children inside the stage are
   laid out in pre-scale ones. Measuring with rects and painting without
   dividing by that scale puts everything in the wrong place and the wrong
   size. So every measurement below is converted back into layout pixels
   before it is used.

   The other trap: a smooth scroll outlasts any fixed frame count, so the box
   used to freeze mid-scroll over whatever was passing. It now tracks until
   the rect holds still. */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Rilo from './Rilo';

const STEPS = [
  { screen: 'home', target: 'home-talk', title: "Hey — I'm Rilo. Tap me any time to talk.", mood: 'wave' },
  { screen: 'home', target: 'score', title: 'Your day at a glance — time, goal, streak.', mood: 'coach' },
  { screen: 'home', target: 'home-apps', title: 'I watch these apps. Leave early, it costs half an open.', mood: 'coach' },
  { screen: 'home', target: 'next', title: 'What to do instead. Your schedule lives here.', mood: 'proud' },
  { screen: 'home', target: null, ask: true },
  { screen: 'you', target: 'you-creator', title: "Posting isn't scrolling — it's tracked on its own.", mood: 'proud' },
  { screen: 'you', target: 'you-strict', title: 'Strict mode: 24 hours before anything loosens.', mood: 'coach' },
  { screen: 'you', target: 'you-schedule', title: 'Bedtime, school and focus times go here.', mood: 'coach' },
  { screen: 'you', target: 'you-buddies', title: 'Add a friend — they see your streak, not your numbers.', mood: 'wave' },
  { screen: 'you', target: 'you-apps', title: "That's me. Change any of it here.", mood: 'proud' },
];

const PAD = 6;
const GAP = 14;
const EDGE = 12;
const GREEN = '#7ED957';

export default function MeetRiloTour({ skin, screen, onCreatorAnswer, onDone, go }) {
  const [step, setStep] = useState(0);
  const [box, setBox] = useState(null);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const [cardH, setCardH] = useState(120);
  /* tapping Rilo re-keys him, which replays the jump */
  const [poke, setPoke] = useState(0);

  const slide = STEPS[step];
  const isAsk = Boolean(slide?.ask);
  const targetName = slide?.target ?? null;
  const last = step === STEPS.length - 1;

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;
    const read = () => setCardH(el.offsetHeight || 120);
    read();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !targetName) { setBox(null); return undefined; }

    let frame;
    let passes = 0;
    let settled = 0;
    let lastKey = '';
    let scrolled = false;

    const measure = () => {
      const target = (root.parentElement ?? document).querySelector(`[data-tour-target="${targetName}"]`);
      if (!target) { setBox(null); return ''; }

      const rootRect = root.getBoundingClientRect();
      /* the overlay is inset:0 inside the scaled stage, so its own layout
         size against its painted size is exactly the stage's scale */
      const scale = rootRect.width && root.offsetWidth ? rootRect.width / root.offsetWidth : 1;
      /* fall back to the painted rect if layout hasn't settled, so the card
         never gets placed against a zero-sized frame */
      const frameW = root.offsetWidth || rootRect.width;
      const frameH = root.offsetHeight || rootRect.height;

      if (!scrolled) {
        scrolled = true;
        target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }

      const r = target.getBoundingClientRect();
      /* back into layout pixels, the space these panels are painted in */
      const x = (r.left - rootRect.left) / scale;
      const y = (r.top - rootRect.top) / scale;
      const w = r.width / scale;
      const h = r.height / scale;

      /* hug the feature's own corners */
      let radius = 20;
      try {
        const got = parseFloat(window.getComputedStyle(target).borderRadius);
        if (Number.isFinite(got) && got > 0) radius = got + PAD;
      } catch { /* jsdom has no layout — the default is fine */ }

      const cw = Math.min(306, frameW - EDGE * 2);
      /* the card never covers the box: below if it fits, else above */
      const below = frameH - (y + h) - GAP >= cardH + EDGE;
      const rawTop = below ? y + h + GAP : y - cardH - GAP;
      const top = Math.max(EDGE, Math.min(frameH - cardH - EDGE, rawTop));
      const left = Math.max(EDGE, Math.min(frameW - cw - EDGE, x + w / 2 - cw / 2));

      setBox({ x, y, w, h, radius, frameW, frameH, cardLeft: left, cardTop: top, cardW: cw, below });
      return `${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)}`;
    };

    const track = () => {
      const key = measure();
      if (key && key === lastKey) settled += 1;
      else { settled = 0; lastKey = key; }
      if (settled < 5 && passes++ < 120) frame = requestAnimationFrame(track);
    };
    track();

    const onMove = () => { settled = 0; passes = 0; measure(); };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [targetName, cardH, step]);

  useEffect(() => {
    if (slide?.screen && slide.screen !== screen) go(slide.screen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const answer = (posts) => { onCreatorAnswer(posts); setStep((n) => n + 1); };
  const next = () => (last ? onDone() : setStep((n) => n + 1));
  const prev = () => setStep((n) => Math.max(0, n - 1));

  const cardStyle = box
    ? { left: box.cardLeft, top: box.cardTop, width: box.cardW }
    : { left: EDGE, right: EDGE, top: '50%', transform: 'translateY(-50%)' };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meet-rilo-title"
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'absolute', inset: 0, zIndex: 60, overflow: 'hidden', color: '#12301A', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* the green box: nothing inside it, the feature shows through */}
      {box ? (
        <div
          aria-hidden="true"
          data-tour-box=""
          style={{
            position: 'absolute',
            left: box.x - PAD,
            top: box.y - PAD,
            width: box.w + PAD * 2,
            height: box.h + PAD * 2,
            boxSizing: 'border-box',
            border: `3px solid ${GREEN}`,
            borderRadius: box.radius,
            boxShadow: '0 0 0 100vmax rgba(8, 26, 14, .66)',
            transition: 'left .26s ease, top .26s ease, width .26s ease, height .26s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div aria-hidden="true" data-tour-box="none" style={{ position: 'absolute', inset: 0, background: 'rgba(8, 26, 14, .66)' }} />
      )}

      {/* Rilo, one line, and the way forward */}
      <div
        ref={cardRef}
        data-tour-card=""
        style={{
          position: 'absolute',
          ...cardStyle,
          boxSizing: 'border-box',
          padding: '13px 14px',
          borderRadius: 20,
          background: '#FFFFFF',
          boxShadow: '0 10px 28px rgba(8,26,14,.34)',
          transition: 'left .26s ease, top .26s ease',
          animation: 'rise14 .24s ease-out both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="tap-94"
            aria-label="tap rilo"
            onClick={() => setPoke((n) => n + 1)}
            style={{ flexShrink: 0, border: 0, padding: 0, background: 'transparent', cursor: 'pointer' }}
          >
            <Rilo key={`${step}-${poke}`} skin={skin} mood={isAsk ? 'curious' : slide?.mood ?? 'coach'} size={44} motion="jump" />
          </button>
          <h2
            id="meet-rilo-title"
            style={{ margin: 0, flex: 1, minWidth: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 15.5, fontWeight: 600, lineHeight: 1.25 }}
          >
            {isAsk ? 'Do you post a lot?' : slide?.title}
          </h2>
        </div>

        {isAsk ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 11 }}>
            <button type="button" className="tap-94" onClick={() => answer(true)} style={{ flex: 1, minHeight: 40, border: 0, borderRadius: 999, background: '#12301A', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>yes</button>
            <button type="button" className="tap" onClick={() => answer(false)} style={{ flex: 1, minHeight: 40, border: '2px solid #DCE7DE', borderRadius: 999, background: 'transparent', color: '#12301A', fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>no</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
            <button type="button" className="tap" onClick={onDone} style={{ border: 0, background: 'transparent', color: '#85978B', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>skip</button>
            <span style={{ flex: 1 }} />
            {step > 0 && (
              <button type="button" className="tap" onClick={prev} style={{ minWidth: 54, minHeight: 36, border: '2px solid #DCE7DE', borderRadius: 999, background: 'transparent', color: '#12301A', fontFamily: 'Fredoka, sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>back</button>
            )}
            <button type="button" className="tap-94" onClick={next} style={{ minWidth: 92, minHeight: 36, border: 0, borderRadius: 999, background: '#12301A', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>{last ? 'got it' : 'next'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

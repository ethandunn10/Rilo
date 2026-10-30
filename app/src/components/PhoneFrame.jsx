/* PhoneFrame
   On a phone: the app fills the whole screen.
   On a laptop: a centered iPhone-sized frame on soft sky-blue.
   No fake iPhone status bar, per the spec.

   The screens are drawn against a 390 x 844 canvas, and several of them pin
   real content low on it (Home at y=648, Intercept at 636, Welcome's Rilo at
   410 + 210 tall). A phone browser hands us far less than 844 once its own
   toolbars are showing — more like 650-750 — so painting those screens at
   1:1 clipped the bottom off them, and `overflow: hidden` meant there was no
   way to scroll to what had been cut.

   So the phone gets the same treatment the laptop frame always had: the
   canvas is scaled down to fit the height instead of being clipped. The
   canvas is also measured in design px from the *real* viewport, so after
   scaling it covers the screen exactly — full bleed, no letterbox bars.

   Height is measured from this wrapper (CSS 100dvh) rather than from
   window.innerHeight, for two reasons: innerHeight on iOS Safari reports the
   tall viewport as if the toolbar weren't there, and dvh ignores the
   keyboard — so typing a name on About you doesn't shrink the whole app. */

import { useEffect, useRef, useState } from 'react';

const W = 390;
const H = 844;
const MARGIN = 48; /* breathing room above + below the frame, = the wrap padding */

/* below this width there is no room for a frame — be the app */
const PHONE_MAX = 440;

export default function PhoneFrame({ children }) {
  const wrapRef = useRef(null);
  /* first paint uses the window; the observer below refines it immediately */
  const [fit, setFit] = useState(() => measure(windowSize()));

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const size = { w: el.clientWidth, h: el.clientHeight };
      /* a collapsed measurement (hidden tab, mid-rotation) would scale the
         app to nothing — keep the last good fit instead */
      if (size.w < 1 || size.h < 1) return;
      setFit((prev) => {
        const next = measure(size);
        return same(prev, next) ? prev : next;
      });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('orientationchange', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return (
    <div className="stage-wrap" ref={wrapRef}>
      <div
        className="stage-sizer"
        style={{
          width: Math.round(fit.w * fit.scale),
          height: Math.round(fit.h * fit.scale),
        }}
      >
        <div
          className={`stage ${fit.full ? 'stage-full' : 'stage-framed'}`}
          style={{
            width: fit.w,
            height: fit.h,
            transform: `scale(${fit.scale})`,
            transformOrigin: 'top left',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function windowSize() {
  if (typeof window === 'undefined') return { w: W + MARGIN, h: H + MARGIN };
  return { w: window.innerWidth, h: window.innerHeight };
}

/* Given the space available, decide the canvas size in design px and the
   scale that maps it onto the screen. */
function measure({ w, h }) {
  if (w < PHONE_MAX) {
    /* Phone. Scale down only if the screen is shorter than the 844 the
       designs need; never scale up past 1:1. */
    const scale = Math.min(1, h / H);

    /* Measure the viewport in design px so the canvas covers it exactly.
       Screens anchor their content to the edges (left/right/bottom) rather
       than to a fixed 390 width, so a slightly wider or taller canvas just
       gives them a little more room — and Sky's SVGs are width/height 100%
       with xMidYMax slice, so the sky and hills still fill it. */
    return {
      full: true,
      scale,
      w: Math.round(w / scale),
      h: Math.round(h / scale),
    };
  }

  /* Laptop: the exact 390x844 the designs are drawn at, scaled to fit the
     window rather than squashed. Unchanged from before. */
  const scale = Math.min(1, (h - MARGIN) / H, (w - MARGIN) / W);
  return { full: false, scale: Math.max(0.4, scale), w: W, h: H };
}

function same(a, b) {
  return a.full === b.full && a.w === b.w && a.h === b.h && Math.abs(a.scale - b.scale) < 0.0005;
}

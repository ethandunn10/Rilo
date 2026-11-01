/* PhoneFrame
   On a phone: the app fills the whole screen.
   On a laptop: a centered iPhone-sized frame on soft sky-blue.
   No fake iPhone status bar, per the spec.

   The frame is always exactly 390 x 844 — the size the designs are drawn at.
   If the window is too short for that, the whole frame is scaled down to fit
   rather than squashed, so screens never overlap their own buttons. */

import { useEffect, useState } from 'react';

const W = 390;
const H = 844;
const MARGIN = 48; /* breathing room above + below the frame */

export default function PhoneFrame({ children }) {
  const [fit, setFit] = useState(() => measure());
  /* The height actually visible, which is NOT the window height once a
     keyboard is up. See the note below. */
  const [visible, setVisible] = useState(null);

  useEffect(() => {
    const onResize = () => setFit(measure());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  /* ---------- the keyboard ----------
     On a phone the on-screen keyboard covers the bottom of the window
     WITHOUT changing the window's height. So a stage sized to 100dvh keeps
     its full height, the browser scrolls the page up to reveal whatever you
     focused, and you end up looking at a view that's slid half off the
     screen with the field hidden behind the keys — scrolled "below the
     app", with no way to get back.

     visualViewport reports what's genuinely visible. Sizing the stage to
     THAT means the app is always exactly the space above the keyboard: the
     pinned composer sits right on top of the keys, the page itself never
     scrolls, and nothing can hide behind anything. */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const sync = () => {
      setVisible(Math.round(vv.height));
      /* iOS also OFFSETS the visual viewport when it scrolls the page to
         reveal a field. Undo that, so the stage stays pinned to the top of
         what's visible rather than drifting upward. */
      if (vv.offsetTop > 0) window.scrollTo(0, 0);
    };

    sync();
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  /* the page itself must never scroll on a phone — only the app's own
     scrollers do, which is what keeps the keyboard from dragging the
     whole layout around */
  useEffect(() => {
    if (!fit.full) return undefined;
    document.body.classList.add('app-locked');
    return () => document.body.classList.remove('app-locked');
  }, [fit.full]);

  if (fit.full) {
    /* phone: fill the space the keyboard leaves */
    return (
      <div className="stage-wrap">
        <div
          className="stage stage-full"
          style={visible ? { height: `${visible}px` } : undefined}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="stage-wrap">
      <div
        className="stage-sizer"
        style={{ width: Math.round(W * fit.scale), height: Math.round(H * fit.scale) }}
      >
        <div
          className="stage stage-framed"
          style={{ transform: `scale(${fit.scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function measure() {
  if (typeof window === 'undefined') return { full: false, scale: 1 };

  /* Be the app, not a picture of one, whenever a frame would be silly:
     narrow (any phone upright) or short (a phone on its side, where the
     frame would scale to about 40% and be unreadable). Screens scroll, so
     filling a short viewport is always better than shrinking into one. */
  const full = window.innerWidth < 440 || window.innerHeight < 620;
  if (full) return { full: true, scale: 1 };

  const scale = Math.min(
    1,
    (window.innerHeight - MARGIN) / H,
    (window.innerWidth - MARGIN) / W,
  );
  return { full: false, scale: Math.max(0.4, scale) };
}

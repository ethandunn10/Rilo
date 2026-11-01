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

  useEffect(() => {
    const onResize = () => setFit(measure());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  if (fit.full) {
    /* phone: fill the screen */
    return (
      <div className="stage-wrap">
        <div className="stage stage-full">{children}</div>
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

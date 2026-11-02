/* Does this person want motion?

   Everything animated in the app is decoration over something that is
   readable standing still, so honouring the system setting is a matter of
   dropping the animation and showing the end state — never of hiding
   content or stalling a screen until an animation that will never run
   finishes.

   Lives in a hook rather than CSS alone because the number sequence counts
   with JavaScript: a `@media (prefers-reduced-motion)` block can stop a
   keyframe, but it can't stop a counter from ticking 0 → 64. */
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    /* Safari < 14 only has the deprecated listener */
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  return reduced;
}

/* Count from 0 to `to` over `ms`, or land on it instantly when motion is
   off. Eased out, so the number slows as it arrives instead of stopping
   dead on a fast tick. */
export function useCountUp(to, ms = 1400, { run = true, reduced = false } = {}) {
  const [n, setN] = useState(reduced || !run ? to : 0);

  useEffect(() => {
    if (reduced || !run) {
      setN(to);
      return undefined;
    }
    if (typeof requestAnimationFrame !== 'function') {
      setN(to);
      return undefined;
    }

    let frame = 0;
    const started = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - started) / ms);
      const eased = 1 - (1 - t) ** 3;
      setN(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, ms, run, reduced]);

  return n;
}

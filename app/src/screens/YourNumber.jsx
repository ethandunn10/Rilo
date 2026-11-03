/* "here's your number" — three beats, not three screens.

   The old version put the whole finding in one static card and asked them
   to be shocked by a number sitting still. The number is the same; what
   was missing was the moment it takes to land. So it's a short sequence:

     1. the hit    their day stacks up, one slab a day, into a year
     2. the flip   that same pile counted in the thing they said they'd
                   rather be doing — "that's 180 gym sessions"
     3. the promise "let's get some of it back", then their plan

   Beats one and two run themselves (about two seconds each)
   and a tap anywhere moves it on, because someone who has read it should
   never have to wait out an animation. "skip" jumps straight to the last
   beat, which is the resting one: nothing moves there, the button is
   there, and the per-app split sits underneath it.

   The flip needs to know what they'd rather be doing, which is why "what
   would you rather spend it on?" is now asked BEFORE this and not after.

   Motion is decoration over a screen that reads fine standing still — with
   reduced motion on, every beat shows its finished state immediately and
   the counters start on their final numbers. */

import { useEffect, useRef, useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import BackButton from '../components/BackButton';
import Breakdown from '../components/Breakdown';
import { fmtMins } from '../lib/plan';
import { daysPerYear, insteadOf } from '../lib/rather';
import { useCountUp, useReducedMotion } from '../lib/motion';

/* How long each self-advancing beat holds. This is the moment the whole
   pitch rests on — the number has to land, not flash past — so each beat
   holds long enough to read it twice. A tap moves it on early and "skip"
   jumps to the end, so nobody who has read it has to wait. */
export const BEAT_MS = [3800, 3400];

/* The pile: one slab per day they lose in a year.
   Drawn as a stack of thin planks rising off the hills rather than a grid
   of dots — a dot grid reads as a chart, and this isn't a chart, it's a
   weight. Slabs are sized to the count so 40 days and 90 days both fill
   the same space instead of one overflowing the screen. */
function Pile({ days, flipped, reduced }) {
  /* Kept below the centred column rather than running up behind it — the
     words are the point, the pile is the weight under them. */
  const budget = 150;
  const slabH = Math.max(2, Math.min(7, Math.floor(budget / Math.max(days, 1)) - 1));
  const stagger = reduced ? 0 : Math.min(26, 2000 / Math.max(days, 1));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1,
        /* The slabs are sized in %, so the stack needs a width of its own.
           Without one it shrink-wraps its children, the percentages resolve
           against zero, and every plank renders 0px wide — the pile was
           there in the DOM and invisible on screen. */
        width: 240,
        height: budget,
        transition: reduced ? 'none' : 'transform .9s cubic-bezier(.2,.8,.3,1)',
        transform: flipped ? 'rotate(-4deg) translateY(-4px)' : 'none',
      }}
    >
      {Array.from({ length: days }, (_, i) => (
        <div
          key={i}
          className="pile-slab"
          style={{
            width: `${54 + ((i * 37) % 26)}%`,
            height: slabH,
            borderRadius: 2,
            background: flipped ? '#2E8B3E' : '#12301A',
            /* the recolour sweeps up the pile instead of all at once */
            transition: reduced ? 'none' : `background .5s ${Math.min(900, i * 12)}ms ease-out`,
            animation: reduced ? 'none' : `slab-in .42s ${i * stagger}ms ease-out both`,
          }}
        />
      ))}
    </div>
  );
}

export default function YourNumber({
  go,
  skin,
  breakdown,
  picked = [],
  isPro = false,
  onBack,
  next = 'yourplan',
  /* Which beat they're on, held by App when it's given.

     It has to survive leaving the screen: the blurred split on the last
     beat opens the paywall, and coming back from the paywall used to
     remount this and start the whole sequence again — they tapped the
     percentages, looked at the price, and landed back on a pile of planks
     counting up to a year. Back now returns them to the beat they left. */
  beat: beatProp,
  setBeat: setBeatProp,
}) {
  const reduced = useReducedMotion();
  const [ownBeat, setOwnBeat] = useState(0);
  const beat = beatProp ?? ownBeat;
  const setBeat = setBeatProp ?? setOwnBeat;
  const timer = useRef(null);

  const perDay = breakdown?.blocked ?? 0;
  const days = daysPerYear(perDay);
  const flip = insteadOf(perDay, picked);

  /* each beat sets the timer for its own exit, so a tap that moves things
     on early cancels the one it replaced rather than firing later */
  useEffect(() => {
    clearTimeout(timer.current);
    if (beat >= BEAT_MS.length) return undefined;
    timer.current = setTimeout(() => setBeat((b) => b + 1), BEAT_MS[beat]);
    return () => clearTimeout(timer.current);
    /* setBeat is stable either way — App's setter or useState's */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat]);

  const bigDays = useCountUp(days, 2000, { run: beat === 0, reduced });
  const bigFlip = useCountUp(flip.count, 1700, { run: beat >= 1, reduced });

  const onwards = () => setBeat((b) => Math.min(b + 1, 2));
  /* back steps through the beats before it leaves the screen — the way
     back out of a sequence is the way you came in */
  const back = beat > 0 ? () => setBeat((b) => b - 1) : onBack;

  const mood = beat === 0 ? 'letdown' : beat === 1 ? 'proud' : 'coach';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="low" />

      {/* the whole stage is the tap target; the controls on top of it stop
          the tap so "skip" never also counts as "next" */}
      <div
        onClick={beat < 2 ? onwards : undefined}
        style={{
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          cursor: beat < 2 ? 'pointer' : 'default',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '46px 22px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <BackButton onBack={back} />

          {beat < 2 && (
            <button
              type="button"
              className="tap"
              onClick={() => setBeat(2)}
              style={{
                minHeight: 36,
                padding: '0 14px',
                borderRadius: 999,
                border: '2px solid var(--line)',
                background: 'rgba(255,255,255,0.85)',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              skip
            </button>
          )}
        </div>

        {/* ---------- beats 1 and 2: the stage ---------- */}
        {beat < 2 && (
          <div
            style={{
              flexGrow: 1,
              minHeight: 0,
              boxSizing: 'border-box',
              padding: '0 22px',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                opacity: 0.45,
                pointerEvents: 'none',
              }}
            >
              <Pile days={days} flipped={beat >= 1} reduced={reduced} />
            </div>

            <div
              key={`num-${beat}`}
              style={{
                position: 'absolute',
                /* a little above centre: it reads better with the pile
                   under it, and nothing is fighting the hills */
                top: '43%',
                left: 0,
                right: 0,
                transform: 'translateY(-50%)',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '0 18px',
                boxSizing: 'border-box',
                textAlign: 'center',
                animation: reduced ? 'none' : 'rise .5s ease-out both',
              }}
            >
              {/* Rilo is part of the moment, not a decoration in the corner:
                  he is the one being let down by the number, so he stands
                  with it where they are already looking. */}
              <Rilo skin={skin} mood={mood} size={124} />

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 15.5,
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: '#1E3A27',
                }}
              >
                {beat === 0 ? `${fmtMins(perDay)} a day, on these apps` : 'the same time, spent your way'}
              </p>

              <p
                style={{
                  margin: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 104,
                  fontWeight: 700,
                  lineHeight: 0.95,
                  letterSpacing: '-0.02em',
                  color: beat === 0 ? '#12301A' : '#2E8B3E',
                }}
              >
                {beat === 0 ? bigDays : bigFlip}
              </p>

              <p
                style={{
                  margin: '6px 0 0',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 30,
                  fontWeight: 700,
                  lineHeight: 1.2,
                  maxWidth: 320,
                  color: beat === 0 ? '#0E2615' : '#1B5F28',
                }}
              >
                {beat === 0 ? 'days a year. awake, scrolling.' : `${flip.unit}. that's what it's worth.`}
              </p>
            </div>
          </div>
        )}

        {/* ---------- beat 3: the promise, and the split ---------- */}
        {beat === 2 && (
          <div
            className="scroll-y"
            style={{
              flexGrow: 1,
              minHeight: 0,
              boxSizing: 'border-box',
              padding: '8px 22px 0',
              '--tail': '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 13,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1.1,
                animation: reduced ? 'none' : 'rise .5s ease-out both',
              }}
            >
              let&apos;s get some of it back.
            </h1>

            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#2C4A36' }}>
              not all {days} days. i&apos;m not going to pretend you&apos;ll never
              scroll again — i just want a piece of it back for{' '}
              {flip.id ? flip.unit : 'you'}.
            </p>

            <div
              style={{
                padding: '14px 16px',
                borderRadius: 26,
                background: 'var(--card)',
                border: '2px solid var(--line)',
                boxShadow: '0 4px 0 var(--line)',
                animation: reduced ? 'none' : 'rise .5s .12s ease-out both',
              }}
            >
              <p
                style={{
                  margin: '0 0 10px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                where it goes
              </p>
              {breakdown ? (
                <Breakdown
                  breakdown={breakdown}
                  compact
                  isPro={isPro}
                  onUpgrade={() => go('upgrade')}
                />
              ) : null}
            </div>
          </div>
        )}

      </div>

      {/* no button while it's playing — a tap anywhere moves it on and
          "skip" is up top, so a third control down here would just be a
          third thing to read */}
      {beat === 2 && (
        <div
          style={{
            position: 'relative',
            flexShrink: 0,
            boxSizing: 'border-box',
            padding: '10px 22px calc(28px + var(--safe-bottom, 0px))',
          }}
        >
          <button
            type="button"
            className="tap-92"
            onClick={() => go(next)}
            style={{
              width: '100%',
              height: 58,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#2E8B3E',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            show me the plan
          </button>
        </div>
      )}
    </div>
  );
}

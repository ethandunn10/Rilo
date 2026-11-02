/* "your number" — the one stat, free.

   The headline is deliberately not behind the paywall. Someone who has
   just handed over their app list has earned the finding, and "64 days a
   year" is the whole pitch in four words. The per-app split stays Pro
   (Breakdown blurs itself for free accounts), so what's paid for is the
   detail, not the shock. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';
import BackButton from '../components/BackButton';
import Breakdown from '../components/Breakdown';
import { fmtMins } from '../lib/plan';
import { daysPerYear } from '../lib/rather';

export default function YourNumber({ go, skin, breakdown, isPro = false, onBack, next = 'rather' }) {
  const perDay = breakdown?.blocked ?? 0;
  const days = daysPerYear(perDay);

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

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          boxSizing: 'border-box',
          padding: '52px 22px 0',
          '--tail': '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        }}
      >
        <Dots active={2} />

        <BackButton onBack={onBack} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Rilo skin={skin} mood="letdown" size={96} talks />
          <h1
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 25,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            okay. here&apos;s your number.
          </h1>
        </div>

        {/* the headline stat */}
        <div
          style={{
            padding: '20px 18px',
            borderRadius: 28,
            background: '#12301A',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
            animation: 'rise .5s .05s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9FD8A9',
            }}
          >
            on these apps, every day
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 54,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {fmtMins(perDay)}
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 23,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            that&apos;s {days} days a year.
          </p>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#C9E6CE' }}>
            awake, scrolling. not asleep.
          </p>
        </div>

        {/* the split is the pro bit — Breakdown blurs itself */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 26,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            animation: 'rise .5s .12s ease-out both',
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
            <Breakdown breakdown={breakdown} compact isPro={isPro} onUpgrade={() => go('upgrade')} />
          ) : null}
        </div>
      </div>

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
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          what could i do instead?
        </button>
      </div>
    </div>
  );
}

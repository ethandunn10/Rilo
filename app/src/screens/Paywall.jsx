/* Paywall — exact port of designs/Paywall.dc.html
   No real payment. Both buttons go Home.
   (Which button testers tap gets logged in Phase 4's test tracking.) */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

const PERKS = [
  { title: 'unlimited apps', sub: 'free watches 2' },
  { title: 'where your time goes', sub: 'the per-app breakdown, unblurred' },
  { title: 'let rilo build your limits', sub: 'and explain every choice' },
  { title: 'the weekly step-down', sub: 'one thing tightens each week' },
  {
    title: 'rilo checks in every night',
    sub: 'thirty seconds before bed, and tomorrow is planned',
  },
  { title: 'strict mode', sub: 'no half opens, 24 hours to loosen anything' },
  { title: 'all 23 rilos', sub: 'a new one every level' },
  { title: 'all app themes', sub: 'bamboo, sakura, sunset, snow' },
  { title: "today's plan + full history", sub: 'every day you have logged' },
];

/* exactly what the free tier does, in the same words as the free row.
   The limit system itself is not behind the paywall — opens, halves, the
   emergency pass and borrowing are how the app works, for everyone. */
const FREE_BITS = [
  'watches 2 apps',
  'opens in halves, with the wait and the rilo pop-up',
  'always allowed / blocked / limited / free, per app',
  '1 emergency pass a day, and borrowing from tomorrow',
  'your daily goal, your streak and your total screen time',
  'original rilo and the grass theme',
];

const PLANS = [
  {
    id: 'year',
    name: 'yearly · best value',
    sub: '$3.33 a month, billed yearly',
    price: '$39.99/yr',
  },
  { id: 'month', name: 'monthly', sub: 'billed every month', price: '$4.99/mo' },
  {
    id: 'free',
    name: 'free',
    sub: '2 apps, one daily limit, no plan',
    price: '$0',
  },
];

const planBase = {
  minHeight: 62,
  width: '100%',
  boxSizing: 'border-box',
  padding: '0 18px',
  borderRadius: 22,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontFamily: 'Inter, system-ui, sans-serif',
  color: '#12301A',
  cursor: 'pointer',
};

export default function Paywall({
  go,
  plan,
  setPlan,
  onChoose,
  /* where to go next depends on which button they tapped — taking the
     trial detours through setting up the nightly check-in */
  nextFor = () => 'calendaronboard',
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="low" />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '40px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
        }}
        className="scroll-y"
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 0,
            height: 104,
            flexShrink: 0,
            animation: 'rise .5s ease-out both',
          }}
        >
          <div style={{ marginRight: -18, marginBottom: 4 }}>
            <Rilo skin="redpanda" mood="coach" size={88} talks />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Rilo skin="gold" mood="coach" size={112} talks />
          </div>
          <div style={{ marginLeft: -18, marginBottom: 4 }}>
            <Rilo skin="pinkpanda" mood="coach" size={88} talks />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            animation: 'rise .5s .08s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              padding: '4px 12px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '0.06em',
            }}
          >
            rilo pro
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 32,
              fontWeight: 700,
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            get the full coach
          </h1>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 24,
            background: '#12301A',
            border: '2px solid var(--line)',
            boxShadow: '0 14px 30px rgba(10,40,20,0.22)',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
            animation: 'rise .5s .16s ease-out both',
          }}
        >
          <p
            style={{
              margin: '0 0 2px',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            pro adds
          </p>
          {PERKS.map((p) => (
            <div key={p.title} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: '#4CC160',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
                  <path
                    d="M3 8.5 L6.5 12 L13 4.5"
                    fill="none"
                    stroke="#12301A"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.3,
                  color: '#C9E6CE',
                }}
              >
                <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{p.title}</span> · {p.sub}
              </p>
            </div>
          ))}
        </div>

        {/* free deserves a description too, not just a price */}
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 24,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            color: '#12301A',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            flexShrink: 0,
            animation: 'rise .5s .2s ease-out both',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
            }}
          >
            free does the basics
          </p>
          {FREE_BITS.map((t) => (
            <p
              key={t}
              style={{
                margin: 0,
                display: 'flex',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#2C4A36',
                lineHeight: 1.3,
              }}
            >
              <span aria-hidden="true" style={{ color: '#7FA38A' }}>
                ·
              </span>
              {t}
            </p>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
            animation: 'rise .5s .24s ease-out both',
          }}
        >
          {PLANS.map((p) => {
            const on = plan === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className="tap-pw"
                aria-pressed={on}
                onClick={() => setPlan(p.id)}
                style={
                  on
                    ? {
                        ...planBase,
                        background: '#DDF3D9',
                        border: '2.5px solid #12301A',
                        boxShadow: '0 4px 0 var(--line)',
                      }
                    : {
                        ...planBase,
                        background: 'var(--card)',
                        border: '2px solid var(--line)',
                        boxShadow: '0 3px 0 var(--line)',
                      }
                }
              >
                <span
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 1,
                  }}
                >
                  <span
                    style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
                  >
                    {p.name}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#3D5A46' }}>{p.sub}</span>
                </span>
                <span
                  style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 700 }}
                >
                  {p.price}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flexGrow: 1, flexShrink: 1, minHeight: 8 }} />

        {/* one button, and it does whatever row is selected */}
        <button
          type="button"
          className="tap-pw"
          onClick={() => {
            const free = plan === 'free';
            const which = free ? 'continue with free' : 'start free trial';
            if (onChoose) onChoose(which);
            /* onboarding carries on to the calendar; from settings it
               just goes back to where they were */
            go(nextFor(which));
          }}
          style={{
            width: '100%',
            height: 58,
            flexShrink: 0,
            border: '2px solid var(--line)',
            borderRadius: 999,
            background: '#FFFFFF',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          {plan === 'free' ? 'continue with free' : 'start 7-day free trial'}
        </button>

        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: '#FFFFFF',
            textAlign: 'center',
            opacity: 0.85,
          }}
        >
          {plan === 'free'
            ? 'you can upgrade any time from the you tab.'
            : 'free for 7 days, then it bills. cancel whenever.'}
        </p>
      </div>
    </div>
  );
}

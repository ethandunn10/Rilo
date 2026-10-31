/* Paywall — exact port of designs/Paywall.dc.html
   No real payment. Both buttons go Home.
   (Which button testers tap gets logged in Phase 4's test tracking.) */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';

const PERKS = [
  { title: 'unlimited apps', sub: 'free blocks 2' },
  { title: 'where your time goes', sub: 'the per-app breakdown, unblurred' },
  { title: 'your 30-day plan', sub: '25% closer to your goal every week' },
  { title: 'opens + time limits per app', sub: 'free is one daily total' },
  { title: 'strict mode', sub: 'half the opens, 24 hours to switch off' },
  { title: '2 emergency passes a day', sub: 'free gets 1' },
  { title: 'all 23 rilos', sub: 'a new one every level' },
  { title: 'all app themes', sub: 'bamboo, sakura, sunset, snow' },
  { title: "today's plan + full history", sub: 'every day you have logged' },
];

const PLANS = [
  {
    id: 'year',
    name: 'yearly · best value',
    sub: '$2.50 a month, billed yearly',
    price: '$29.99/yr',
  },
  { id: 'month', name: 'monthly', sub: 'billed every month', price: '$4.99/mo' },
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

export default function Paywall({ go, plan, setPlan, onChoose }) {
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
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: 0,
            height: 120,
            animation: 'rise .5s ease-out both',
          }}
        >
          <div style={{ marginRight: -18, marginBottom: 4 }}>
            <Rilo skin="redpanda" mood="coach" size={100} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Rilo skin="gold" mood="coach" size={128} />
          </div>
          <div style={{ marginLeft: -18, marginBottom: 4 }}>
            <Rilo skin="pinkpanda" mood="coach" size={100} />
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
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'rise .5s .16s ease-out both',
          }}
        >
          {PERKS.map((p) => (
            <div key={p.title} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  background: '#12301A',
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
                    stroke="#FFFFFF"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
                <span style={{ fontWeight: 700 }}>{p.title}</span> · {p.sub}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
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

        <div style={{ flexGrow: 1 }} />

        <button
          type="button"
          className="tap-pw"
          onClick={() => {
            if (onChoose) onChoose('start free trial');
            go('home');
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
          start 7-day free trial
        </button>
        <button
          type="button"
          onClick={() => {
            if (onChoose) onChoose('continue with free');
            go('home');
          }}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            padding: 6,
            textAlign: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          continue with free
        </button>
      </div>
    </div>
  );
}

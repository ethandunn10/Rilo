/* TabBar — exact port of the <nav> in Home.dc.html
   home / plan / Rilo (center) / progress / you.
   The centre Rilo button changes character (Pick your Rilo); the "you" tab
   goes to the You screen.
   Home draws it at 0.75 white and a lighter shadow; Plan and Progress use
   0.8 and a heavier one, so both are available. */

import Rilo from './Rilo';

const IDLE = '#4F6B58';

const tab = {
  minWidth: 56,
  minHeight: 48,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  textDecoration: 'none',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 13,
  fontWeight: 600,
  background: 'transparent',
  border: 0,
  padding: 0,
  cursor: 'pointer',
};

function HomeIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlanIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="3" fill="none" stroke={color} strokeWidth="2.2" />
      <path d="M4 10 H20 M9 3 V7 M15 3 V7" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function ProgressIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19 V13 M12 19 V8 M19 19 V4" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function YouIcon({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="9" r="4" fill="none" stroke={color} strokeWidth="2.2" />
      <path d="M4 20 C5 15 19 15 20 20" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/* less-nudgy branch: a docked bar that sits flush on the bottom edge
   (instead of a floating glass pill with Rilo bubbling out of the middle).
   Rilo is still in the middle, but as a square tile in line with the others.
   The active tab gets a green pill behind its icon. */
export default function TabBar({ active = 'home', go, skin = 'original' }) {
  const col = (name) => (active === name ? '#12301A' : IDLE);

  const icon = (name, Icon) => (
    <span
      style={{
        width: 48,
        height: 30,
        borderRadius: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active === name ? '#BFE8B8' : 'transparent',
        transition: 'background .2s ease',
      }}
    >
      <Icon color={col(name)} />
    </span>
  );

  return (
    <nav
      aria-label="Main"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 94,
        boxSizing: 'border-box',
        padding: '8px 10px 22px',
        borderRadius: '26px 26px 0 0',
        background: 'var(--card)',
        borderTop: '2px solid var(--line)',
        boxShadow: '0 -4px 0 rgba(18,48,26,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      <button
        type="button"
        onClick={() => go('home')}
        aria-current={active === 'home' ? 'page' : undefined}
        style={{ ...tab, color: col('home') }}
      >
        {icon('home', HomeIcon)}
        home
      </button>

      <button
        type="button"
        onClick={() => go('plan')}
        aria-current={active === 'plan' ? 'page' : undefined}
        style={{ ...tab, color: col('plan') }}
      >
        {icon('plan', PlanIcon)}
        plan
      </button>

      <button
        type="button"
        className="tap"
        aria-label="Your Rilo"
        onClick={() => go('pickrilo')}
        style={{
          width: 58,
          height: 58,
          borderRadius: 999,
          background: '#BFE8B8',
          border: '2px solid var(--line)',
          boxShadow: '0 3px 0 var(--line)',
          display: 'flex',
          /* centred, not bottom-aligned: a circle crops the corners, so
             Rilo sits in the middle at a size that stays fully visible */
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <Rilo skin={skin} mood="coach" motion="none" size={46} />
      </button>

      <button
        type="button"
        onClick={() => go('progress')}
        aria-current={active === 'progress' ? 'page' : undefined}
        style={{ ...tab, color: col('progress') }}
      >
        {icon('progress', ProgressIcon)}
        progress
      </button>

      <button
        type="button"
        onClick={() => go('you')}
        aria-current={active === 'you' ? 'page' : undefined}
        style={{ ...tab, color: col('you') }}
      >
        {icon('you', YouIcon)}
        you
      </button>
    </nav>
  );
}

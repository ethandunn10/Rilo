/* Intercept — exact port of designs/Intercept.dc.html
   The pop-up Rilo shows when you open a watched app.
   Paints its own sky (it does not use Sky). */

import Rilo from '../components/Rilo';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import AppLogo from '../components/AppLogo';
import { ordinal } from '../lib/apps';

/* no clouds — the theme's sky things instead (see ThemeDecor) */
const CLOUD = null;

const REASONS = [
  { id: 'bored', to: 'suggestion', label: "i'm bored", sub: 'nothing to do', delay: '.3s' },
  { id: 'tired', to: 'tired', label: 'just tired', sub: 'brain is fried', delay: '.37s' },
  { id: 'break', to: 'break', label: 'taking a break', sub: 'earned it', delay: '.44s' },
  { id: 'need', to: 'needit', label: 'need it', sub: 'for something real', delay: '.51s' },
];

/* `app` is the app they just "opened"; `openCount` is how many times today */
export default function Intercept({ go, onReason, app, openCount, skin }) {
  const theme = useTheme();

  /* say it instead of tapping: "i'm bored", "just tired", "need to reply to a text" */
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: theme.sky,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <ThemeDecor />
      <svg
        width="200"
        height="86"
        viewBox="0 0 200 86"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -40,
          top: 70,
          opacity: 0.9,
          animation: 'drift 14s ease-in-out infinite',
        }}
      >
        {CLOUD}
      </svg>
      <svg
        width="160"
        height="70"
        viewBox="0 0 200 86"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -30,
          top: 190,
          opacity: 0.8,
          animation: 'drift 19s ease-in-out infinite reverse',
        }}
      >
        {CLOUD}
      </svg>

      <svg
        width="100%"
        height="140"
        viewBox="0 0 390 140"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, bottom: 0 }}
      >
        <path d="M0 50 C100 10 240 14 390 46 L390 140 L0 140 Z" fill={theme.hills[1]} />
        <path d="M0 96 C130 74 260 76 390 98 L390 140 L0 140 Z" fill={theme.hills[2]} />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <div style={{ animation: 'pop .6s cubic-bezier(.2,.9,.3,1.2) both' }}>
          <Rilo skin={skin} mood="curious" size={170} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 2,
            padding: '5px 14px 5px 6px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            animation: 'rise .6s .1s ease-out both',
          }}
        >
          <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 8 }}>
            <AppLogo label={app} size={26} radius={8} />
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600 }}>
            {app}
          </span>
        </div>
        <h1
          style={{
            margin: '4px 0 0',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 38,
            fontWeight: 700,
            textAlign: 'center',
            animation: 'rise .6s .15s ease-out both',
          }}
        >
          opening {app}?
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            color: '#2C4A36',
            textAlign: 'center',
            animation: 'rise .6s .22s ease-out both',
          }}
        >
          {ordinal(openCount)} time today. what's up?
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 22,
          right: 22,
          top: 420,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 12,
        }}
      >
        {REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="tap-ic"
            onClick={() => {
              if (onReason) onReason(r.label);
              go(r.to);
            }}
            style={{
              minHeight: 92,
              borderRadius: 24,
              background: 'var(--card)',
              border: '2px solid var(--line)',
              boxShadow: '0 4px 0 var(--line)',
              color: '#12301A',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              animation: `rise .5s ${r.delay} ease-out both`,
            }}
          >
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600 }}>
              {r.label}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3D5A46' }}>{r.sub}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 30,
          display: 'flex',
          justifyContent: 'center',
          animation: 'rise .5s .6s ease-out both',
        }}
      >
        <button
          type="button"
          className="tap-ic"
          onClick={() => {
            if (onReason) onReason('never mind');
            go('home', 'back');
          }}
          style={{
            padding: '12px 22px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            color: '#12301A',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          never mind, close it
        </button>
      </div>
    </div>
  );
}

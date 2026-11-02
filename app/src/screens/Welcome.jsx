/* Welcome — exact port of designs/Welcome.dc.html
   This screen paints its own sky, clouds and hills (it does not use Sky). */

import Rilo from '../components/Rilo';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';

/* no clouds — the theme's sky things instead (see ThemeDecor) */
const CLOUD = null;

export default function Welcome({ go, skin }) {
  const theme = useTheme();
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: theme.sky,
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#1B1F1A',
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
          left: -30,
          top: 120,
          opacity: 0.95,
          animation: 'drift 14s ease-in-out infinite',
        }}
      >
        {CLOUD}
      </svg>
      <svg
        width="150"
        height="66"
        viewBox="0 0 200 86"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -20,
          top: 230,
          opacity: 0.85,
          animation: 'drift 18s ease-in-out infinite reverse',
        }}
      >
        {CLOUD}
      </svg>
      <svg
        width="110"
        height="48"
        viewBox="0 0 200 86"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 150,
          top: 330,
          opacity: 0.7,
          animation: 'drift 22s ease-in-out infinite',
        }}
      >
        {CLOUD}
      </svg>

      <svg
        width="100%"
        height="360"
        viewBox="0 0 390 360"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, bottom: 0 }}
      >
        <path
          d="M0 120 C90 60 170 70 250 110 C310 140 350 120 390 90 L390 360 L0 360 Z"
          fill={theme.hills[0]}
        />
        <path
          d="M0 190 C80 140 160 120 240 150 C300 172 340 190 390 170 L390 360 L0 360 Z"
          fill={theme.hills[1]}
        />
        <path d="M0 270 C110 240 250 236 390 262 L390 360 L0 360 Z" fill={theme.hills[2]} />
        <g style={{ transformOrigin: '60px 160px', animation: 'sway 3s ease-in-out infinite' }}>
          <path
            d="M60 160 L60 138 M54 148 L60 140 M66 150 L60 142"
            stroke={theme.id === 'snow' ? '#9DB8C9' : theme.hills[2]}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
        <g style={{ transformOrigin: '330px 178px', animation: 'sway 3.6s ease-in-out infinite' }}>
          <path
            d="M330 178 L330 156 M324 166 L330 158 M336 168 L330 160"
            stroke={theme.id === 'snow' ? '#9DB8C9' : theme.hills[2]}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>

      {/* Content column: the design pinned the title at top 56 and Rilo at
          top 410, which only works in an 844px frame. On a phone Rilo landed
          under the button or off the screen entirely. Scrolls now. */}
      <div
        className="scroll-y"
        style={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          boxSizing: 'border-box',
          padding: '56px 28px 0',
          '--tail': '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          animation: 'rise .7s ease-out both',
        }}
      >
        <p
          style={{
            margin: 0,
            padding: '7px 16px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 17,
            fontWeight: 600,
            color: '#1F5C2B',
          }}
        >
          rilo
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.02,
            textAlign: 'center',
            color: '#12301A',
          }}
        >
          hey, i'm rilo.
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            lineHeight: 1.45,
            textAlign: 'center',
            color: '#234030',
          }}
        >
          your screen-time buddy. i don&apos;t just block your apps, i help
          you figure out what to do instead.
        </p>
      </div>

      {/* pushes Rilo to the bottom of the column when there's room, and
          simply sits under the text when there isn't */}
      <div style={{ flexGrow: 1, minHeight: 10 }} />

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Rilo skin={skin} mood="wave" motion="jump" size={210} talks />
      </div>
      </div>

      {/* pinned: always reachable */}
      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '8px 24px 34px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          animation: 'rise .7s .25s ease-out both',
        }}
      >
        <button
          type="button"
          className="tap"
          onClick={() => go('name')}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          let's go
        </button>
        <button
          type="button"
          onClick={() => go('home')}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            padding: 10,
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          i already have an account
        </button>
      </div>
    </div>
  );
}

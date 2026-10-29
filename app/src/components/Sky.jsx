/* Sky — the background behind most screens.
   props: hills = "tall" | "mid" | "low"   tone = "day" | "dusk"

   themes branch: the sky follows the app theme (lib/themes):
     grass  — sunny meadow, wildflowers on the hills, butterflies (default)
     bamboo — golden morning, swaying bamboo, falling leaves
     sakura — cherry branch, drifting petals
     sunset — big low sun behind the hills, birds
     snow   — snowy hills, falling snow
   Dusk ("just tired") is the same night sky in every theme.

   ThemeDecor is just the sky things (no hills) for the screens that paint
   their own hills: Welcome, Home and the pop-up. */

import { useTheme } from '../lib/themes';

/* ---------- small pieces ---------- */

function Leaf({ color }) {
  return (
    <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true">
      <path d="M1 6 C6 0 16 0 21 6 C16 12 6 12 1 6 Z" fill={color} />
      <path d="M3 6 L19 6" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
    </svg>
  );
}

function Petal() {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      <path d="M7 11 C2 8 0 3 3 1 C5 0 6 2 7 3 C8 2 9 0 11 1 C14 3 12 8 7 11 Z" fill="#FFB3CB" stroke="#E98AAB" strokeWidth="0.8" />
    </svg>
  );
}

function Flake() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <g stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 1 L6 11 M1.7 3.5 L10.3 8.5 M1.7 8.5 L10.3 3.5" />
      </g>
      <circle cx="6" cy="6" r="1.4" fill="#BFE0F5" />
    </svg>
  );
}

function Butterfly({ color }) {
  return (
    <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
      <g style={{ transformOrigin: '11px 8px', animation: 'flap .35s ease-in-out infinite alternate' }}>
        <path d="M11 8 C6 0 0 1 1 6 C2 10 7 10 11 8 Z" fill={color} stroke="#12301A" strokeWidth="1.2" />
        <path d="M11 8 C16 0 22 1 21 6 C20 10 15 10 11 8 Z" fill={color} stroke="#12301A" strokeWidth="1.2" />
        <path d="M11 8 C7 12 4 15 6 16 C9 16 10 12 11 8 Z" fill={color} stroke="#12301A" strokeWidth="1.2" />
        <path d="M11 8 C15 12 18 15 16 16 C13 16 12 12 11 8 Z" fill={color} stroke="#12301A" strokeWidth="1.2" />
      </g>
      <path d="M11 4 L11 13" stroke="#12301A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* things drifting down the screen (leaves, petals, snow) */
const FALL = [
  { left: '12%', delay: '0s', dur: '13s' },
  { left: '58%', delay: '4.5s', dur: '15s' },
  { left: '84%', delay: '8s', dur: '12s' },
];
const SNOW = [
  { left: '6%', delay: '0s', dur: '11s' },
  { left: '22%', delay: '3s', dur: '14s' },
  { left: '38%', delay: '6.5s', dur: '12s' },
  { left: '54%', delay: '1.5s', dur: '15s' },
  { left: '70%', delay: '5s', dur: '11s' },
  { left: '86%', delay: '8s', dur: '13s' },
  { left: '94%', delay: '2.5s', dur: '16s' },
];

function Falling({ items, children }) {
  return items.map((l) => (
    <div
      key={l.left}
      className="leaf"
      style={{
        position: 'absolute',
        top: 0,
        left: l.left,
        animation: `leaf-fall ${l.dur} linear ${l.delay} infinite both`,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  ));
}

/* one bamboo stalk: segments + a couple of leaf sprigs, swaying from its base */
function Bamboo({ x, top, w = 11, stalk, node, leaf, dur, flip = false }) {
  const segs = [];
  for (let y = top; y < 844; y += 74) segs.push(y);
  const dir = flip ? -1 : 1;
  return (
    <g
      className="bamboo"
      style={{
        transformOrigin: `${x}px 844px`,
        animation: `bamboo-sway ${dur} ease-in-out infinite`,
      }}
    >
      <rect x={x - w / 2} y={top} width={w} height={844 - top} rx={w / 2} fill={stalk} />
      {segs.map((y) => (
        <rect key={y} x={x - w / 2 - 1} y={y} width={w + 2} height="3.5" rx="1.75" fill={node} />
      ))}
      <path
        d={`M${x} ${top + 80} C${x + 14 * dir} ${top + 64} ${x + 30 * dir} ${top + 60} ${x + 40 * dir} ${top + 64} C${x + 28 * dir} ${top + 74} ${x + 14 * dir} ${top + 80} ${x} ${top + 80} Z`}
        fill={leaf}
      />
      <path
        d={`M${x} ${top + 156} C${x + 12 * dir} ${top + 136} ${x + 26 * dir} ${top + 128} ${x + 36 * dir} ${top + 130} C${x + 26 * dir} ${top + 144} ${x + 12 * dir} ${top + 154} ${x} ${top + 156} Z`}
        fill={leaf}
      />
    </g>
  );
}

function Sun({ x = 312, y = 118, r = 50, glow = '#FFF1C9', core = '#FFE7A0' }) {
  return (
    <g className="sun" style={{ transformOrigin: `${x}px ${y}px`, animation: 'sun-glow 6s ease-in-out infinite' }}>
      <circle cx={x} cy={y} r={r * 1.56} fill={glow} opacity="0.55" />
      <circle cx={x} cy={y} r={r} fill={core} />
    </g>
  );
}

function Blossom({ x, y, s = 1 }) {
  const pts = [
    [0, -6],
    [5.7, -1.9],
    [3.5, 4.9],
    [-3.5, 4.9],
    [-5.7, -1.9],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {pts.map(([dx, dy]) => (
        <circle key={`${dx}${dy}`} cx={dx} cy={dy} r="4.6" fill="#FFC2D6" stroke="#E98AAB" strokeWidth="0.9" />
      ))}
      <circle cx="0" cy="0" r="2.4" fill="#FF8FB4" />
    </g>
  );
}

function SakuraBranch() {
  return (
    <g transform="translate(390 -22) scale(-0.82 0.82)">
    <g className="bamboo" style={{ transformOrigin: '0px 40px', animation: 'bamboo-sway 9s ease-in-out infinite' }}>
      <path d="M-10 36 C40 40 90 58 150 92 C170 104 186 110 200 108" fill="none" stroke="#7A4E3A" strokeWidth="7" strokeLinecap="round" />
      <path d="M70 52 C84 34 100 28 116 30" fill="none" stroke="#7A4E3A" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 78 C128 92 128 106 122 118" fill="none" stroke="#7A4E3A" strokeWidth="3.5" strokeLinecap="round" />
      <Blossom x={30} y={34} s={1.1} />
      <Blossom x={58} y={50} />
      <Blossom x={96} y={30} s={1.05} />
      <Blossom x={118} y={28} s={0.9} />
      <Blossom x={110} y={70} s={1.15} />
      <Blossom x={150} y={88} />
      <Blossom x={122} y={116} s={0.9} />
      <Blossom x={186} y={106} s={1.05} />
    </g>
    </g>
  );
}

function Birds() {
  return (
    <g fill="none" stroke="#7A4A3A" strokeWidth="2.4" strokeLinecap="round">
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;30 -6;0 0" dur="9s" repeatCount="indefinite" />
        <path d="M60 150 Q66 144 72 150 Q78 144 84 150" />
        <path d="M96 172 Q101 167 106 172 Q111 167 116 172" />
      </g>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;-24 4;0 0" dur="11s" repeatCount="indefinite" />
        <path d="M250 120 Q256 114 262 120 Q268 114 274 120" />
      </g>
    </g>
  );
}

/* the sky things for a theme (no hills). `low` = where a big low sun sits */
function SkyThings({ id, low = 600 }) {
  switch (id) {
    case 'bamboo':
      return (
        <>
          <Sun />
          <Bamboo x={8} top={210} stalk="#8CCB78" node="#5FA552" leaf="#6DBA5E" dur="7s" />
          <Bamboo x={383} top={270} stalk="#8CCB78" node="#5FA552" leaf="#6DBA5E" dur="8.5s" flip />
        </>
      );
    case 'sakura':
      return (
        <>
          <Sun x={70} y={130} r={36} glow="#FFF6F0" core="#FFF0E2" />
          <SakuraBranch />
        </>
      );
    case 'sunset':
      return (
        <>
          <Sun x={250} y={low + 92} r={64} glow="#FFC79E" core="#FF8E5E" />
          <Birds />
        </>
      );
    case 'snow':
      return <Sun x={300} y={110} r={34} glow="#FFFFFF" core="#FDFBEF" />;
    default:
      return <Sun x={318} y={96} r={34} glow="#FFF8D8" core="#FFEDA3" />;
  }
}

function FallingThings({ id }) {
  if (id === 'bamboo') return <Falling items={FALL}><Leaf color="#6DBA5E" /></Falling>;
  if (id === 'sakura') return <Falling items={FALL}><Petal /></Falling>;
  if (id === 'snow') return <Falling items={SNOW}><Flake /></Falling>;
  if (id === 'grass')
    return (
      <>
        <div style={{ position: 'absolute', left: '14%', top: '34%', animation: 'butterfly 14s ease-in-out infinite', pointerEvents: 'none' }}>
          <Butterfly color="#FFD43B" />
        </div>
        <div style={{ position: 'absolute', left: '70%', top: '46%', animation: 'butterfly 17s ease-in-out 3s infinite reverse', pointerEvents: 'none' }}>
          <Butterfly color="#FFFFFF" />
        </div>
      </>
    );
  return null;
}

/* little wildflowers / snow tufts along the hill tops */
function HillDetails({ id, h3 }) {
  if (id === 'snow') {
    return (
      <g fill="#FFFFFF" opacity="0.9">
        <ellipse cx="100" cy="150" rx="26" ry="4" />
        <ellipse cx="280" cy="168" rx="30" ry="4" />
      </g>
    );
  }
  const flowers =
    id === 'sakura'
      ? ['#FFC2D6', '#FFFFFF', '#FF8FB4']
      : id === 'sunset'
        ? ['#FFD27A', '#FF9E7A', '#FFFFFF']
        : ['#FFD43B', '#FFFFFF', '#F59BC0'];
  const pts = [
    [40, 196],
    [118, 172],
    [196, 160],
    [262, 168],
    [344, 186],
    [150, 250],
    [300, 252],
  ];
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={`${x}-${y}`}>
          <path d={`M${x} ${y + 8} L${x} ${y}`} stroke={h3} strokeWidth="2" strokeLinecap="round" />
          <circle cx={x} cy={y} r="4.2" fill={flowers[i % flowers.length]} stroke="rgba(18,48,26,0.35)" strokeWidth="1" />
        </g>
      ))}
    </g>
  );
}

/* ---------- the full background (sky + hills) ---------- */

export default function Sky({ hills = 'low', tone = 'day' }) {
  const theme = useTheme();
  const dusk = tone === 'dusk';
  const hillY = hills === 'tall' ? 484 : hills === 'mid' ? 540 : 600;

  const bg = dusk
    ? 'linear-gradient(180deg, #2B3A6B 0%, #5B6FA6 42%, #A9A9CF 72%, #D9D2E6 100%)'
    : theme.sky;
  const [h1, h2, h3] = dusk ? ['#6E8F86', '#3F7A5A', '#24533A'] : theme.hills;
  const blade = dusk ? '#24533A' : theme.id === 'snow' ? '#9DB8C9' : h3;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: bg,
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        {dusk ? (
          <>
            <g fill="#FFFFFF">
              <circle cx="40" cy="70" r="1.5" />
              <circle cx="300" cy="50" r="1.2" />
              <circle cx="200" cy="110" r="1" />
              <circle cx="350" cy="150" r="1.4" />
              <circle cx="90" cy="170" r="1" />
            </g>
            <circle cx="320" cy="90" r="22" fill="#F7F1D8" opacity="0.9" />
          </>
        ) : (
          <SkyThings id={theme.id} low={hillY} />
        )}

        <g transform={`translate(0 ${hillY})`}>
          <path
            d="M0 120 C90 60 170 70 250 110 C310 140 350 120 390 90 L390 400 L0 400 Z"
            fill={h1}
          />
          <path
            d="M0 190 C80 140 160 120 240 150 C300 172 340 190 390 170 L390 400 L0 400 Z"
            fill={h2}
          />
          <path d="M0 270 C110 240 250 236 390 262 L390 400 L0 400 Z" fill={h3} />
          {!dusk && <HillDetails id={theme.id} h3={blade} />}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-4 60 160;4 60 160;-4 60 160"
              dur="3s"
              repeatCount="indefinite"
            />
            <path
              d="M60 160 L60 138 M54 148 L60 140 M66 150 L60 142"
              stroke={blade}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="4 330 178;-4 330 178;4 330 178"
              dur="3.6s"
              repeatCount="indefinite"
            />
            <path
              d="M330 178 L330 156 M324 166 L330 158 M336 168 L330 160"
              stroke={blade}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </svg>

      {!dusk && <FallingThings id={theme.id} />}
    </div>
  );
}

/* Just the sky things for the current theme — for screens that paint their
   own sky + hills (Welcome, the pop-up, Home). Behind everything. */
export function ThemeDecor({ low = 600 }) {
  const theme = useTheme();
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden="true">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMax slice"
        style={{ position: 'absolute', left: 0, top: 0 }}
      >
        <SkyThings id={theme.id} low={low} />
      </svg>
      <FallingThings id={theme.id} />
    </div>
  );
}

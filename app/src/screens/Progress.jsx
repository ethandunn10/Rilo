/* Progress — port of designs/Progress.dc.html, with the panda update's
   level system: real level, an XP bar to the NEXT level, and the next skin
   you'll unlock shown with its picture. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import { levelProgress, nextSkinAfter } from '../lib/levels';
import { useTheme } from '../lib/themes';
import Breakdown from '../components/Breakdown';
import { fmtMins } from '../lib/plan';

/* ---------- this week's bars ----------
   Same plain bars as the original design. Only the colour of a "good" day
   (under your 2h goal) follows the app theme; over-goal days stay grey. */
const BAR_COLOR = {
  grass: { name: 'green', fill: 'linear-gradient(180deg, #4CC160, #2E8B3E)' },
  bamboo: { name: 'green', fill: 'linear-gradient(180deg, #9ED48C, #5FA552)' },
  sakura: { name: 'pink', fill: 'linear-gradient(180deg, #FFA9C6, #E9719B)' },
  sunset: { name: 'orange', fill: 'linear-gradient(180deg, #FFB347, #FF7A45)' },
  snow: { name: 'blue', fill: 'linear-gradient(180deg, #8FD0F5, #4A9BD6)' },
};

function WeekBar({ theme, good, height, delay }) {
  const c = BAR_COLOR[theme] ?? BAR_COLOR.grass;
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 10,
        transformOrigin: 'bottom',
        animation: `grow .7s ${delay}s cubic-bezier(.2,.8,.3,1) both`,
        background: good ? c.fill : 'rgba(18,48,26,0.15)',
      }}
    />
  );
}

/* ---------- a little theme decoration on the "this week" card ----------
   Sits on the card's corners/edges (never on the bars) and stays small. */
const deco = { position: 'absolute', pointerEvents: 'none' };

function MiniFlower({ x, y, petal, size = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="0" cy="-4.2" rx="2.8" ry="4" fill={petal} stroke="#12301A" strokeWidth="1" transform={`rotate(${a})`} />
      ))}
      <circle r="2.4" fill="#FFD43B" stroke="#12301A" strokeWidth="1" />
    </g>
  );
}

function CardDecor({ theme }) {
  if (theme === 'bamboo') {
    return (
      <svg width="46" height="96" viewBox="0 0 34 70" aria-hidden="true" style={{ ...deco, left: -20, bottom: -14 }}>
        <rect x="12" y="8" width="9" height="62" rx="4.5" fill="#8CCB78" stroke="#12301A" strokeWidth="1.6" />
        <path d="M12 30 H21 M12 50 H21" stroke="#5FA552" strokeWidth="2.2" />
        <path d="M16 28 C10 18 2 16 0 20 C4 26 10 28 16 28 Z" fill="#6DBA5E" stroke="#12301A" strokeWidth="1.4" />
        <path d="M18 12 C24 4 32 4 34 8 C30 14 24 14 18 12 Z" fill="#6DBA5E" stroke="#12301A" strokeWidth="1.4" />
      </svg>
    );
  }
  if (theme === 'sakura') {
    return (
      <svg width="110" height="50" viewBox="0 0 84 38" aria-hidden="true" style={{ ...deco, right: -14, bottom: -16 }}>
        <path d="M84 34 C62 32 40 26 18 14" fill="none" stroke="#7A4E3A" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M52 28 C50 34 54 38 58 38" fill="none" stroke="#7A4E3A" strokeWidth="2.2" strokeLinecap="round" />
        <MiniFlower x={70} y={30} petal="#FFC2D6" size={1.1} />
        <MiniFlower x={46} y={24} petal="#FFC2D6" />
        <MiniFlower x={24} y={15} petal="#FFE3EC" size={0.85} />
      </svg>
    );
  }
  if (theme === 'sunset') {
    return (
      <svg width="96" height="48" viewBox="0 0 64 32" aria-hidden="true" style={{ ...deco, right: -12, bottom: -14 }}>
        <path d="M2 10 Q6 6 10 10 Q14 6 18 10" fill="none" stroke="#7A4A3A" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 3 Q23 0 26 3 Q29 0 32 3" fill="none" stroke="#7A4A3A" strokeWidth="2" strokeLinecap="round" />
        <circle cx="48" cy="18" r="16" fill="#FFC79E" opacity="0.7" />
        <circle cx="48" cy="18" r="11" fill="#FF8E5E" stroke="#12301A" strokeWidth="1.6" />
      </svg>
    );
  }
  if (theme === 'snow') {
    return (
      <>
        <svg width="100%" height="22" viewBox="0 0 340 22" preserveAspectRatio="none" aria-hidden="true" style={{ ...deco, left: 0, right: 0, top: -9 }}>
          <path d="M10 9 C40 0 80 0 120 5 C160 0 220 0 260 5 C290 0 316 0 330 9 C324 14 316 14 310 11 C304 22 294 22 290 11 C240 13 200 13 160 11 C156 19 146 19 142 11 C100 13 60 13 26 11 C20 16 14 15 10 9 Z" fill="#FFFFFF" stroke="#9FC3DA" strokeWidth="1.5" />
        </svg>
        <svg width="26" height="26" viewBox="0 0 18 18" aria-hidden="true" style={{ ...deco, right: -10, bottom: -10 }}>
          <g stroke="#5AA9E6" strokeWidth="2.4" strokeLinecap="round"><path d="M9 2 L9 16 M3 5.5 L15 12.5 M3 12.5 L15 5.5" /></g>
          <circle cx="9" cy="9" r="2" fill="#FFFFFF" stroke="#5AA9E6" strokeWidth="1" />
        </svg>
      </>
    );
  }
  /* grass: a tuft with two little flowers poking up from the bottom-right corner */
  return (
    <svg width="76" height="48" viewBox="0 0 54 34" aria-hidden="true" style={{ ...deco, right: -14, bottom: -14 }}>
      <path d="M48 34 C48 22 50 16 54 12 M40 34 C40 24 38 18 34 14 M30 34 C30 26 32 20 36 18 M22 34 C22 26 20 22 16 20" fill="none" stroke="#2E8B3E" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M10 34 L10 18" stroke="#2E8B3E" strokeWidth="2" />
      <MiniFlower x={10} y={14} petal="#F59BC0" />
      <path d="M44 34 L44 20" stroke="#2E8B3E" strokeWidth="2" />
      <MiniFlower x={44} y={16} petal="#FFFFFF" size={0.85} />
    </svg>
  );
}

const DAYS = [
  ['m', 2.8],
  ['t', 2.4],
  ['w', 1.9],
  ['t', 1.7],
  ['f', 2.2],
  ['s', 1.5],
  ['s', 1.8],
];

const statCard = {
  padding: '12px 6px',
  borderRadius: 22,
  background: 'var(--card)',
  border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  textAlign: 'center',
};

function Stat({ value, label }) {
  return (
    <div style={statCard}>
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 26,
          fontWeight: 700,
          color: '#1F6B2E',
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>{label}</p>
    </div>
  );
}

export default function Progress({
  go,
  xp,
  skin,
  level,
  breakdown,
  program,
  weekGoal,
  planWeeks = 4,
  isPro = false,
  /* ---- add-ons (rilo-addons-test) ---- */
  back = { today: 0, week: 0, total: 0 },
  backSays = '',
  checkins = [],
}) {
  const kept = checkins.filter((c) => c.gone !== undefined);
  const onTime = kept.filter((c) => !c.over).length;
  const theme = useTheme();
  const prog = levelProgress(xp, level);
  const nextSkin = prog.atMax ? null : nextSkinAfter(level);

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

      {/* the cards outgrew the screen, so the page scrolls */}
      <div
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 20px 104px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            animation: 'rise14 .4s ease-out both',
          }}
        >
          progress
        </h1>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 26,
            background: '#12301A',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 12px 30px rgba(10,40,20,0.25)',
            animation: 'rise14 .4s .06s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="proud" motion="jump" size={84} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexGrow: 1 }}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 700 }}
            >
              level {level}
            </p>
            <div
              style={{
                height: 10,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.18)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${prog.pct}%`,
                  height: 10,
                  borderRadius: 5,
                  background: 'linear-gradient(90deg, #9EDCA6, #4CC160)',
                  animation: 'fill 1.2s .3s ease-out both',
                }}
              />
            </div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#C9E6CE' }}>
              {prog.atMax ? `${xp} xp · max level` : `${xp} / ${prog.next} xp`}
            </p>
          </div>
          {nextSkin ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                flexShrink: 0,
                width: 74,
              }}
            >
              <span style={{ display: 'flex', opacity: 0.55, filter: 'saturate(0.4)' }}>
                <Rilo skin={nextSkin.skin} mood="coach" motion="none" size={56} />
              </span>
              <span
                style={{
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#C9E6CE',
                  textAlign: 'center',
                  lineHeight: 1.15,
                }}
              >
                next: {nextSkin.name} at level {nextSkin.level}
              </span>
            </div>
          ) : null}
        </div>

        <div
          style={{
            position: 'relative',
            padding: '14px 16px',
            borderRadius: 26,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            animation: 'rise14 .4s .12s ease-out both',
          }}
        >
          <CardDecor theme={theme.id} />

          {/* time you got back (rilo-addons-test) */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 2,
            }}
          >
            {[
              ['today', back.today],
              ['this week', back.week],
              ['all time', back.total],
            ].map(([label, mins]) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: '8px 6px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 19,
                    fontWeight: 700,
                    color: '#1F6B2E',
                  }}
                >
                  {fmtMins(mins)}
                </p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#2C4A36' }}>{label}</p>
              </div>
            ))}
          </div>
          {backSays && (
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>
              you got back {fmtMins(back.week)} this week. {backSays}.
            </p>
          )}
          {kept.length > 0 && (
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>
              check-ins: {onTime} of {kept.length} stayed inside the time you asked for.
            </p>
          )}

          <button
            type="button"
            className="tap"
            onClick={() => go('sharecard')}
            style={{
              alignSelf: 'flex-start',
              marginBottom: 6,
              minHeight: 38,
              padding: '0 14px',
              borderRadius: 999,
              border: '2px solid var(--line, #12301A)',
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            your week, as a card
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}
            >
              {isPro
                ? `week ${Math.min(program?.week ?? 1, planWeeks)} of ${planWeeks} · `
                : 'your daily limit · '}
              {fmtMins(weekGoal ?? 0)} a day
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                color: '#1F6B2E',
              }}
            >
              4h 20m saved
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 120,
              gap: 10,
            }}
          >
            {DAYS.map(([label, hours], i) => (
              <div
                key={`${label}-${i}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  flexGrow: 1,
                }}
              >
                {/* plain bar; colour follows the app theme */}
                <WeekBar
                  theme={theme.id}
                  good={hours <= 2}
                  height={Math.round((hours / 3) * 96)}
                  delay={(0.2 + i * 0.07).toFixed(2)}
                />
                <p
                  style={{
                    margin: 0,
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#3D5A46',
                  }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#3D5A46' }}>
            {(BAR_COLOR[theme.id] ?? BAR_COLOR.grass).name} bars hit your 2h goal
          </p>
        </div>

        {breakdown && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 26,
              background: 'var(--card, rgba(255,255,255,0.65))',
              border: '2px solid var(--line)',
              boxShadow: '0 4px 0 var(--line)',
              animation: 'rise14 .4s .15s ease-out both',
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
              where your time goes
            </p>
            <Breakdown
              breakdown={breakdown}
              compact
              isPro={isPro}
              onUpgrade={() => go('upgrade')}
            />
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 10,
            animation: 'rise14 .4s .18s ease-out both',
          }}
        >
          <Stat value="6" label="day streak" />
          <Stat value="12" label="times you said no" />
          <Stat value="3" label="plans finished" />
        </div>
      </div>

      <TabBar active="progress" go={go} variant="progress" skin={skin} />
    </div>
  );
}

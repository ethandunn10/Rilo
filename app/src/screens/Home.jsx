/* Home — exact port of designs/Home.dc.html
   Paints its own sky (it does not use Sky).

   One addition the spec asks for: a "pretend you opened..." row showing the
   apps the tester actually picked, so they can trigger the pop-up. It sits in
   the gap the design leaves between the watched-apps row and the tab bar.
   The watched-apps row shows the real count and the real logos. */

import Rilo from '../components/Rilo';
import { MicIcon } from '../components/TalkBits';
import { ThemeDecor } from '../components/Sky';
import { useTheme } from '../lib/themes';
import TabBar from '../components/TabBar';
import AppLogo from '../components/AppLogo';
import { suggestion } from '../lib/profile';
import { pickedApps } from '../lib/apps';
import { watchedFor } from '../lib/plan';
import { fmtMins } from '../lib/plan';

/* no clouds — the theme's sky things instead (see ThemeDecor) */
const CLOUD = null;

/* less-nudgy: the three Nudgy-style rings became solid stat tiles with a
   chunky progress bar — same three numbers, same colors. */
function Ring({ dashoffset, color, delay, big, label, value }) {
  const pct = Math.round((1 - dashoffset / 214) * 100);
  return (
    <div
      style={{
        padding: '12px 10px 10px',
        borderRadius: 20,
        background: 'var(--card)',
        border: '2px solid var(--line)',
        boxShadow: '0 4px 0 var(--line)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: big ? 30 : 24,
          lineHeight: 1,
          fontWeight: 700,
          color: '#12301A',
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#3D5A46' }}>{label}</p>
      <div
        style={{
          height: 10,
          borderRadius: 5,
          background: '#EDE6D3',
          border: '1.5px solid var(--line)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            transformOrigin: 'left',
            animation: `bar-fill-x .9s ${delay} cubic-bezier(.2,.8,.3,1) both`,
          }}
        />
      </div>
    </div>
  );
}

export default function Home({
  go,
  name,
  about,
  apps,
  xp,
  skin,
  onOpenApp,
  leftFor,
  suggestStrict,
  onStrictYes,
  onStrictNo,
  savedNote,
  onClearSavedNote,
  isPro = false,
}) {
  const theme = useTheme();
  const upNext = suggestion(about).task;
  /* free blocks two apps, so that's all Rilo is actually watching */
  const watched = watchedFor(pickedApps(apps), isPro);

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
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 52,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          animation: 'rise14 .5s ease-out both',
        }}
      >
        <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 700 }}>
          {name ? `hey ${name.toLowerCase()}` : 'hey there'}
        </p>
        <p
          style={{
            margin: 0,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#1F6B2E',
          }}
        >
          lvl 4 · {xp} xp
        </p>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 104,
          height: 230,
          borderRadius: 30,
          overflow: 'hidden',
          background: theme.sky,
          border: '2px solid var(--line)',
          boxShadow: '0 4px 0 var(--line)',
          animation: 'rise14 .5s .08s ease-out both',
        }}
      >
        <svg
          width="140"
          height="60"
          viewBox="0 0 200 86"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 10,
            top: 18,
            opacity: 0.9,
            animation: 'drift 12s ease-in-out infinite',
          }}
        >
          {CLOUD}
        </svg>
        <svg
          width="100%"
          height="90"
          viewBox="0 0 350 90"
          preserveAspectRatio="xMidYMax slice"
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, bottom: 0 }}
        >
          <path d="M0 40 C90 10 220 14 350 36 L350 90 L0 90 Z" fill={theme.hills[1]} />
          <path d="M0 70 C120 54 230 56 350 70 L350 90 L0 90 Z" fill={theme.hills[2]} />
        </svg>
        <button
          type="button"
          className="tap-94"
          aria-label="talk to rilo"
          onClick={() => go('talkchat')}
          style={{
            position: 'absolute',
            left: 16,
            bottom: 30,
            border: 0,
            padding: 0,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          <Rilo skin={skin} mood="coach" size={140} />
          {/* tap Rilo to talk */}
          <span
            style={{
              position: 'absolute',
              right: -6,
              bottom: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 9px 4px 6px',
              borderRadius: 999,
              background: '#12301A',
              border: '2px solid #FFFFFF',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              animation: 'pulse 2.2s ease-in-out infinite',
            }}
          >
            <MicIcon size={14} />
            talk
          </span>
        </button>
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: 34,
            width: 170,
            padding: '12px 14px',
            borderRadius: '18px 18px 18px 6px',
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 3px 0 var(--line)',
          }}
        >
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>
            34 min saved today. that's a whole practice.
          </p>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 352,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 10,
          animation: 'rise14 .5s .16s ease-out both',
        }}
      >
        <Ring dashoffset={21} color="#2E8B3E" delay="0s" value="1h48" label="of 2h goal" />
        <Ring dashoffset={30} color="#E0A526" delay=".1s" value="6" label="day streak" big />
        <Ring dashoffset={77} color="#3A8FD9" delay=".2s" value="34m" label="saved today" />
      </div>

      <button
        type="button"
        className="tap"
        onClick={() => go('plan')}
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 488,
          padding: '16px 18px',
          borderRadius: 24,
          background: '#12301A',
          color: '#FFFFFF',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 10px 26px rgba(10,40,20,0.22)',
          animation: 'rise14 .5s .24s ease-out both',
        }}
      >
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1 }}>
          <span
            style={{
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9FD8A9',
            }}
          >
            up next · 4:30
          </span>
          <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 20, fontWeight: 600 }}>
            {upNext}
          </span>
        </span>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9 5 L16 12 L9 19"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <button
        type="button"
        className="tap"
        onClick={() => watched.length && onOpenApp(watched[0])}
        disabled={!watched.length}
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 582,
          padding: '10px 18px',
          borderRadius: 24,
          background: 'var(--card)',
          border: '2px solid var(--line)',
          color: '#12301A',
          textAlign: 'left',
          cursor: watched.length ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 4px 0 var(--line)',
          animation: 'rise14 .5s .32s ease-out both',
        }}
      >
        <span style={{ display: 'flex', flexShrink: 0 }}>
          {watched.slice(0, 3).map((label, i) => (
            <span
              key={label}
              style={{
                marginLeft: i ? -8 : 0,
                borderRadius: 10,
                border: i ? '2px solid #FFFFFF' : 0,
                display: 'flex',
                background: '#FFFFFF',
              }}
            >
              <AppLogo label={label} size={34} radius={10} />
            </span>
          ))}
        </span>
        <span style={{ flexGrow: 1, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
          {watched.length
            ? `rilo's watching ${watched.length} app${watched.length === 1 ? '' : 's'}`
            : "rilo isn't watching any apps"}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1F6B2E' }}>test it</span>
      </button>

      {/* closed it early — the minutes they didn't spend are still theirs */}
      {savedNote && !suggestStrict && (
        <button
          type="button"
          className="tap"
          onClick={onClearSavedNote}
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 568,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'left',
            padding: '12px 14px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.9)',
            border: '2px solid var(--line, #12301A)',
            cursor: 'pointer',
            animation: 'rise .4s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="proud" size={58} />
          <span style={{ flexGrow: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 17,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              you shut {savedNote.app} {savedNote.mins} min early.
            </span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              that time&apos;s still yours today.
            </span>
          </span>
        </button>
      )}

      {suggestStrict && (
        <div
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            top: 568,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 14px',
            borderRadius: 24,
            background: 'rgba(255,255,255,0.95)',
            border: '2px solid #12301A',
            boxShadow: '0 8px 22px rgba(20,60,40,0.18)',
            animation: 'rise14 .5s ease-out both',
          }}
        >
          <Rilo skin={skin} mood="letdown" size={62} />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 16,
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              want me to get strict for a week?
            </p>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                type="button"
                className="tap"
                onClick={onStrictYes}
                style={{
                  minHeight: 36,
                  padding: '0 14px',
                  borderRadius: 999,
                  border: 0,
                  background: '#12301A',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                turn it on
              </button>
              <button
                type="button"
                className="tap"
                onClick={onStrictNo}
                style={{
                  minHeight: 36,
                  padding: '0 14px',
                  borderRadius: 999,
                  border: '2px solid #12301A',
                  background: 'transparent',
                  color: '#12301A',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                not now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* spec addition: trigger the pop-up with one of THEIR apps */}
      <div
        style={{
          position: 'absolute',
          left: 20,
          right: 20,
          top: 648,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          animation: 'rise14 .5s .4s ease-out both',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 14,
            fontWeight: 600,
            color: '#2C4A36',
          }}
        >
          {watched.length ? 'pretend you opened…' : 'pick some apps on the you tab to test this'}
        </p>
        <div
          className="scroll-x"
          style={{ display: 'flex', gap: 8, paddingBottom: 2 }}
        >
          {watched.map((label) => {
            const left = leftFor ? leftFor(label) : null;
            const locked = left?.locked;
            return (
              <button
                key={label}
                type="button"
                className="tap"
                aria-label={`Pretend you opened ${label}`}
                onClick={() => onOpenApp(label)}
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 52,
                  padding: '6px 14px 6px 8px',
                  borderRadius: 999,
                  background: locked ? 'rgba(18,48,26,0.45)' : '#12301A',
                  border: 0,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 8px 20px rgba(10,40,20,0.22)',
                }}
              >
                <span style={{ display: 'flex', background: '#FFFFFF', borderRadius: 10 }}>
                  <AppLogo label={label} size={36} radius={10} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span
                    style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 17, fontWeight: 600 }}
                  >
                    {label}
                  </span>
                  {left && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#C9E6CE' }}>
                      {locked
                        ? 'locked till tomorrow'
                        : `${left.opens} open${left.opens === 1 ? '' : 's'} · ${fmtMins(
                            left.minutes,
                          )} left`}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <TabBar active="home" go={go} variant="home" skin={skin} />
    </div>
  );
}

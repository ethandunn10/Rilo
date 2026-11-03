/* Your limits — the plan (§1, §9, §13).

   Every tracked app is one of four things: always allowed, blocked, limited
   (x opens × y minutes) or free. This screen is where that gets set, and
   it's the only thing in the app that blocks anything.

   Three ways in, all live here (§13):
     - make your own: set each app yourself
     - let rilo make one: he proposes everything and explains each choice
     - edit: always available, and in strict mode loosening waits 24 hours

   The plan check (§9) sits at the top whenever the limits allow more time
   than the daily goal, because that's the one way a plan quietly fails.

   Built in the same Touch Grass style as the rest: sky, glass cards,
   Fredoka lowercase, 2px lines and a flat drop shadow. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import TabBar from '../components/TabBar';
import BackButton from '../components/BackButton';
import AppLogo from '../components/AppLogo';
import Opens from '../components/Opens';

import {
  BLOCKED,
  LIMITED,
  FREE,
  MODE_LABEL,
  MIN_OPENS,
  MAX_OPENS,
  MIN_MINUTES,
  MAX_MINUTES,
  OPEN_STEP,
  MINUTE_STEP,
  fmtOpens,
  settingFor,
  countdownText,
} from '../lib/limits';

const card = (delay) => ({
  padding: 16,
  borderRadius: 26,
  background: 'var(--card)',
  border: '2px solid var(--line)',
  boxShadow: '0 4px 0 var(--line)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flexShrink: 0,
  animation: `rise14 .4s ${delay} ease-out both`,
});




/* Full-width and stacked. Four of these across a 390px phone left each one
   about 80px wide at 13px type — legible on a desk, a dart board on a
   phone. One per row, 52px tall, with the setting's own explanation next
   to it, so picking is a glance rather than a squint. */
const modeChip = (on) => ({
  width: '100%',
  minHeight: 52,
  boxSizing: 'border-box',
  padding: '8px 16px',
  borderRadius: 18,
  border: '2px solid var(--line, #12301A)',
  background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

const stepBtn = {
  width: 36,
  height: 36,
  flexShrink: 0,
  borderRadius: 18,
  border: '2px solid var(--line, #12301A)',
  background: '#FFFFFF',
  fontSize: 19,
  fontWeight: 700,
  color: '#12301A',
  cursor: 'pointer',
};

/* the short word under the app name when it isn't Limited */
/* blocked or limited — see the note on the picker below */
const EDITABLE_MODES = [BLOCKED, LIMITED];
/* Turning the chosen one off leaves the app with no limit at all — it still
   counts toward the day, it just isn't capped. Picking the other one is a
   separate tap, so tapping "blocked" off never silently limits the app. */
const OFF = FREE;


function Stepper({ label, value, onLess, onMore, atMin, atMax }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'space-between',
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          className="tap-92"
          aria-label={`less ${label}`}
          disabled={atMin}
          onClick={onLess}
          style={{ ...stepBtn, opacity: atMin ? 0.35 : 1 }}
        >
          −
        </button>
        <p
          style={{
            margin: 0,
            minWidth: 58,
            textAlign: 'center',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 19,
            fontWeight: 700,
            color: '#1F6B2E',
          }}
        >
          {value}
        </p>
        <button
          type="button"
          className="tap-92"
          aria-label={`more ${label}`}
          disabled={atMax}
          onClick={onMore}
          style={{ ...stepBtn, opacity: atMax ? 0.35 : 1 }}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ---------- one app's card ---------- */
function LimitCard({
  app,
  setting,
  usedOpens,
  totalOpens,
  pendingFor,
  onSet,
  onCancelPending,
  delay,
}) {
  const limited = setting.mode === LIMITED;

  return (
    <div style={card(delay)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AppLogo label={app} size={38} radius={12} />
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 19,
              fontWeight: 600,
            }}
          >
            {app}
          </p>
        </div>
      </div>

      {/* Two settings, not four. "always allowed" and "free forever" both
          meant "this app is not really in the plan", which is what picking
          your apps already decides — so the only question left here is
          whether it is blocked outright or on a limit. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {EDITABLE_MODES.map((m) => {
          const on = setting.mode === m;
          return (
            <button
              key={m}
              type="button"
              className="tap"
              aria-pressed={on}
              /* tapping the one that's on turns it off, rather than
                 switching to the other — that's a second, separate tap */
              onClick={() => onSet({ ...setting, mode: on ? OFF : m })}
              style={modeChip(on)}
            >
              <span
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  border: on ? 0 : '2px solid rgba(18,48,26,0.3)',
                  background: on ? '#FFFFFF' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#12301A',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {on ? '✓' : ''}
              </span>
              <span style={{ flexGrow: 1, minWidth: 0 }}>{MODE_LABEL[m]}</span>
            </button>
          );
        })}
      </div>

      {limited ? (
        <>
          {/* the circles, exactly as they appear on Rilo's pop-up (§3) */}
          <Opens total={totalOpens} used={usedOpens} minutes={setting.minutes} note={false} />

          <Stepper
            label="opens a day"
            value={fmtOpens(setting.opens)}
            atMin={setting.opens <= MIN_OPENS}
            atMax={setting.opens >= MAX_OPENS}
            onLess={() => onSet({ ...setting, opens: setting.opens - OPEN_STEP })}
            onMore={() => onSet({ ...setting, opens: setting.opens + OPEN_STEP })}
          />
          <Stepper
            label="minutes per open"
            value={`${setting.minutes}m`}
            atMin={setting.minutes <= MIN_MINUTES}
            atMax={setting.minutes >= MAX_MINUTES}
            onLess={() => onSet({ ...setting, minutes: setting.minutes - MINUTE_STEP })}
            onMore={() => onSet({ ...setting, minutes: setting.minutes + MINUTE_STEP })}
          />

        </>
      ) : null}


      {/* a loosening change waiting out its 24 hours in strict mode (§12) */}
      {pendingFor.map((p) => (
        <div
          key={p.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 14,
            background: '#12301A',
            color: '#FFFFFF',
          }}
        >
          <span style={{ flexGrow: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {p.label}
            </span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9FD8A9' }}>
              pending · lands in {countdownText(p.at)}
            </span>
          </span>
          <button
            type="button"
            className="tap"
            onClick={() => onCancelPending(p.id)}
            style={{
              flexShrink: 0,
              minHeight: 32,
              padding: '0 12px',
              borderRadius: 999,
              border: '2px solid #FFFFFF',
              background: 'transparent',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            cancel
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Limits({
  go,
  skin,
  tracked = [],
  appSettings = {},
  onSetApp,
  day,
  check,
  pending = [],
  onCancelPending = () => {},
  strictOn = false,
  totalOpensFor = () => 0,
  /* onboarding passes these; the tab version doesn't */
  onContinue,
  onBack,
}) {

  const byMode = (mode) => tracked.filter((a) => settingFor(appSettings, a).mode === mode);
  const order = [...byMode(LIMITED), ...byMode(BLOCKED), ...byMode(FREE)];

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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 20px 0',
          '--tail': 'calc(124px + var(--safe-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <BackButton onBack={onBack} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
            animation: 'rise14 .4s ease-out both',
          }}
        >
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              your limits
            </h1>
            {strictOn && (
              <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: '#2C4A36' }}>
                strict mode. loosening anything takes 24 hours.
              </p>
            )}
          </div>
          <Rilo skin={skin} mood={check?.over ? 'curious' : 'proud'} size={74} talks />
        </div>

        {!order.length && (
          <div style={card('.16s')}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2C4A36' }}>
              no apps yet. pick some on the you tab and they’ll show up here.
            </p>
          </div>
        )}

        {order.map((app, i) => {
          const setting = settingFor(appSettings, app);
          return (
            <LimitCard
              key={app}
              app={app}
              setting={setting}
              usedOpens={day?.opensUsed?.[app] ?? 0}
              totalOpens={totalOpensFor(app)}
              pendingFor={pending.filter((p) => p.app === app)}
              onSet={(next) => onSetApp(app, next)}
              onCancelPending={onCancelPending}
              delay={`${(0.16 + Math.min(i, 8) * 0.03).toFixed(2)}s`}
            />
          );
        })}

        {/* onboarding ends here; the tab version has the tab bar instead */}
        {onContinue && (
          <button
            type="button"
            className="tap-92"
            onClick={onContinue}
            style={{
              marginTop: 6,
              width: '100%',
              height: 58,
              flexShrink: 0,
              border: 0,
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 10px 26px rgba(10,40,20,0.25)',
            }}
          >
            {check?.over ? 'use it anyway' : 'lock it in'}
          </button>
        )}
      </div>

      {!onContinue && <TabBar active="you" go={go} variant="progress" skin={skin} />}
    </div>
  );
}

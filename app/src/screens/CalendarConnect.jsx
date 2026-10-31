/* Connecting a calendar. Same shape as the Screen Time permission: Rilo
   asks, the system sheet appears, and whichever way they answer decides
   how much he can plan around.

   DEMO ONLY: nothing is connected and no account is signed into. The
   events come from demo/mockAI.js. The mobile app uses EventKit on iOS
   or the Google Calendar API, read only. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { DEMO_CALENDAR, calendarPlan } from '../demo/mockAI';

const DAY_NAME = {
  mon: 'mon', tue: 'tue', wed: 'wed', thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun',
};

const btn = {
  width: '100%',
  height: 56,
  borderRadius: 999,
  border: 0,
  background: '#FFFFFF',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 10px 30px rgba(10,40,20,0.25)',
};

/* Apple's sheet, near enough — deliberately not in Rilo's voice */
function SystemSheet({ which, onAllow, onDeny }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(3px)',
        animation: 'scrim-in .25s ease-out both',
      }}
    >
      <div
        role="dialog"
        aria-label="Calendar permission"
        style={{
          width: 270,
          borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(250,250,250,0.94)',
          backdropFilter: 'blur(20px)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
          textAlign: 'center',
          color: '#000000',
          animation: 'ios-pop .22s cubic-bezier(.2,.9,.3,1.1) both',
        }}
      >
        <div style={{ padding: '19px 16px 15px' }}>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>
            “Rilo” Would Like to Access Your {which}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.33, color: '#1C1C1E' }}>
            Rilo uses your events to plan around practices, tests and work. It only reads
            your calendar and never changes it.
          </p>
        </div>
        <div style={{ height: 1, background: 'rgba(60,60,67,0.29)' }} />
        <div style={{ display: 'flex' }}>
          <button
            type="button"
            onClick={onDeny}
            style={{
              flex: 1,
              height: 44,
              border: 0,
              background: 'transparent',
              color: '#007AFF',
              fontSize: 17,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Don&apos;t Allow
          </button>
          <div style={{ width: 1, background: 'rgba(60,60,67,0.29)' }} />
          <button
            type="button"
            onClick={onAllow}
            style={{
              flex: 1,
              height: 44,
              border: 0,
              background: 'transparent',
              color: '#007AFF',
              fontSize: 17,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            OK
          </button>
        </div>
      </div>

      {/* same nudge as the screen time sheet */}
      <div style={{ width: 270, marginTop: 10, display: 'flex' }}>
        <span style={{ flex: 1 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span
            aria-hidden="true"
            style={{
              fontSize: 30,
              lineHeight: 1,
              color: '#FFFFFF',
              textShadow: '0 2px 6px rgba(0,0,0,0.45)',
              animation: 'point-up 1.1s ease-in-out infinite',
            }}
          >
            &#8593;
          </span>
          <p
            style={{
              margin: 0,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            tap here
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CalendarConnect({ go, skin, apps = ['tiktok'], calendar, setCalendar }) {
  const [sheet, setSheet] = useState('');
  const connected = calendar?.on;
  const plan = connected ? calendarPlan(DEMO_CALENDAR, apps) : [];

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
          padding: '56px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Rilo skin={skin} mood={connected ? 'proud' : 'coach'} size={connected ? 120 : 170} />

        <p
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: connected ? 24 : 27,
            fontWeight: 600,
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          {connected
            ? "got it. here's what i'll do."
            : 'let me see your week and i’ll plan around it.'}
        </p>

        {!connected && (
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#2C4A36', textAlign: 'center' }}>
            practices, tests, shifts. i only read it.
          </p>
        )}

        {/* what he found, and what he'll do about it */}
        {connected && (
          <div
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 24,
              background: 'rgba(255,255,255,0.85)',
              border: '2px solid var(--line, #12301A)',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            {plan.map((p) => (
              <div key={`${p.day}-${p.why}`} style={{ display: 'flex', gap: 9 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 34,
                    paddingTop: 1,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: p.kind === 'test' ? '#A33A2B' : '#3D5A46',
                  }}
                >
                  {DAY_NAME[p.day]}
                </span>
                <span style={{ flexGrow: 1, fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>
                  {p.why}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flexGrow: 1, minHeight: 8 }} />

        {connected ? (
          <>
            <button type="button" className="tap" onClick={() => go('plan')} style={btn}>
              see my plan
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => setCalendar({ on: false, which: '' })}
              style={ghostBtn}
            >
              disconnect
            </button>
          </>
        ) : (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" className="tap" onClick={() => setSheet('Calendar')} style={btn}>
              connect apple calendar
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => setSheet('Google Calendar')}
              style={ghostBtn}
            >
              connect google calendar
            </button>
            <button type="button" className="tap" onClick={() => go('you', 'back')} style={plainBtn}>
              not now
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <SystemSheet
          which={sheet}
          onAllow={() => {
            setCalendar({ on: true, which: sheet });
            setSheet('');
          }}
          onDeny={() => setSheet('')}
        />
      )}
    </div>
  );
}

const ghostBtn = {
  width: '100%',
  height: 52,
  boxSizing: 'border-box',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.18)',
  border: '1.5px solid rgba(255,255,255,0.7)',
  color: '#FFFFFF',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
};

const plainBtn = {
  border: 0,
  background: 'transparent',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  padding: 8,
  cursor: 'pointer',
};

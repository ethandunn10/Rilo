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

/* What Apple's sheet says, per thing being asked for. Deliberately not in
   Rilo's voice — this is the system asking, not him. */
const SHEET_BODY = {
  Calendar:
    'Rilo uses your events to plan around practices, tests and work. It only reads your calendar and never changes it.',
  'Google Calendar':
    'Rilo uses your events to plan around practices, tests and work. It only reads your calendar and never changes it.',
  Notes:
    'Rilo reads your notes to find the things you have already written down to do. It never edits or deletes a note.',
  Reminders:
    'Rilo reads your reminders so it can build your day around them. It only reads them and never changes them.',
  'Google Tasks':
    'Rilo reads your tasks to know what is due. It only reads them and never marks anything complete.',
  Notion:
    'Rilo reads the pages you share with it to find your assignments and deadlines. It never edits a page.',
  default: 'Rilo only reads this, and never changes anything in it.',
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
        aria-label={`${which} permission`}
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
            {SHEET_BODY[which] ?? SHEET_BODY.default}
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

/* The other places a plan actually lives. Rilo reads them the same way he
   reads the calendar — to know what's on, never to change anything. Each
   one says what he'd get out of it, so connecting isn't a blind tap. */
const SOURCES = [
  { id: 'Notes', label: 'notes', why: 'to-do lists you already keep', hex: '#F7C948' },
  { id: 'Reminders', label: 'reminders', why: 'what you told your phone to nag you about', hex: '#FF6B6B' },
  { id: 'Google Tasks', label: 'google tasks', why: 'homework and assignments', hex: '#3A8FD9' },
  { id: 'Notion', label: 'notion', why: 'your school or project pages', hex: '#2C4A36' },
];

export default function CalendarConnect({
  go,
  skin,
  apps = ['tiktok'],
  calendar,
  setCalendar,
  /* in onboarding this carries on through the flow instead of going back */
  onContinue,
  onSkip,
}) {
  const [sheet, setSheet] = useState('');
  const connected = calendar?.on;
  const plan = connected ? calendarPlan(DEMO_CALENDAR, apps) : [];

  const sources = calendar?.sources ?? [];
  const hasSource = (id) => sources.includes(id);

  const toggleSource = (id) => {
    if (hasSource(id)) {
      setCalendar({ ...calendar, sources: sources.filter((x) => x !== id) });
      return;
    }
    /* same system sheet as the calendar — it's the same kind of permission */
    setSheet(id);
  };

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
          padding: '56px 22px 0',
          '--tail': '26px',
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

        {/* other apps rilo can read, connected or not — a calendar isn't
            the only place a plan lives, and plenty of people keep theirs in
            notes or reminders instead. */}
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
          <div>
            <p
              style={{
                margin: 0,
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              anything else i can read?
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, fontWeight: 600, color: '#2C4A36' }}>
              optional. read only, same as the calendar.
            </p>
          </div>

          {SOURCES.map((src) => {
            const on = hasSource(src.id);
            return (
              <button
                key={src.id}
                type="button"
                className="tap-97"
                aria-pressed={on}
                onClick={() => toggleSource(src.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  padding: 0,
                  border: 0,
                  background: 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#12301A',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    flexShrink: 0,
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: src.hex,
                    border: '2px solid var(--line, #12301A)',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#FFFFFF',
                  }}
                >
                  {src.label[0]}
                </span>

                <span style={{ flexGrow: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {src.label}
                  </span>
                  <span
                    style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#3D5A46' }}
                  >
                    {src.why}
                  </span>
                </span>

                <span
                  style={{
                    flexShrink: 0,
                    minHeight: 32,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    borderRadius: 999,
                    border: on ? 0 : '2px solid var(--line, #12301A)',
                    background: on ? '#12301A' : 'transparent',
                    color: on ? '#FFFFFF' : '#12301A',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {on ? 'connected' : 'connect'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ flexGrow: 1, minHeight: 8 }} />

        {connected ? (
          <>
            <button
              type="button"
              className="tap"
              onClick={() => (onContinue ? onContinue() : go('plan'))}
              style={btn}
            >
              {onContinue ? 'next' : 'see my plan'}
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
              style={secondBtn}
            >
              connect google calendar
            </button>
            {/* DEMO ONLY: skip the system sheet entirely */}
            <button
              type="button"
              className="tap"
              onClick={() => setCalendar({ on: true, which: 'Demo Calendar' })}
              style={{
                ...plainBtn,
                fontSize: 13,
                color: '#2C4A36',
                textDecoration: 'underline',
                textUnderlineOffset: 3,
              }}
            >
              demo: connect a fake calendar
            </button>

            <button
              type="button"
              className="tap"
              onClick={() => (onSkip ? onSkip() : go('you', 'back'))}
              style={plainBtn}
            >
              not now
            </button>
          </div>
        )}
      </div>

      {sheet && (
        <SystemSheet
          which={sheet}
          onAllow={() => {
            if (SOURCES.some((x) => x.id === sheet)) {
              setCalendar({ ...calendar, sources: sources.concat([sheet]) });
            } else {
              setCalendar({ ...calendar, on: true, which: sheet });
            }
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

/* The second real choice, not a throwaway. It used to be the ghost style —
   white text at 18% white over a pale sky, which read as disabled. It's the
   same weight as the Apple button now, in the app's own card treatment, so
   the two look like two options rather than one option and a hint. */
const secondBtn = {
  width: '100%',
  height: 52,
  boxSizing: 'border-box',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.92)',
  border: '2px solid #12301A',
  color: '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 0 #12301A',
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

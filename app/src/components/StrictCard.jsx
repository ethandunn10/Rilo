/* Strict mode — the bundle (§12).

   Strict mode isn't a separate set of limits. It's one switch that changes
   five things about the limits you already have, so it's shown as exactly
   that: two columns, same five rows.

   Turning it ON is instant. Turning it OFF runs for another 24 hours first,
   which is the whole point of it — and that countdown is cancelable, so
   nobody gets trapped by a switch they flipped at 2am.

   The emergency pass works in both modes. It always has. */

import { useState } from 'react';
import Rilo from './Rilo';
import { WAIT_NORMAL, WAIT_STRICT } from '../lib/limits';

/* 0 days means no end date — it runs until they deliberately turn it off,
   which itself takes 24 hours. It's the one people actually want: the whole
   point of strict mode is not having to re-decide every week. */
const LENGTHS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 0, label: 'for good' },
];

export function lengthLabel(days) {
  return LENGTHS.find((l) => l.days === days)?.label ?? '1 week';
}

const WINDOWS = [
  { id: 'all', label: 'all day' },
  { id: 'school', label: 'school hours' },
  { id: 'night', label: 'after 10pm' },
];

/* the five things the switch actually changes */
const BUNDLE = [
  { what: 'opens', normal: 'count in halves', strict: 'every session costs a whole one' },
  { what: 'loosening a limit', normal: 'instant', strict: 'takes 24 hours' },
  { what: 'the weekly step-down', normal: 'he asks first', strict: 'happens by itself' },
  { what: 'borrowing from tomorrow', normal: 'available', strict: 'off' },
  {
    what: 'the wait before an app opens',
    normal: `about ${WAIT_NORMAL} seconds`,
    strict: `about ${WAIT_STRICT} seconds`,
  },
];

const chip = (on) => ({
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
  minHeight: 44,
  padding: '0 4px',
  borderRadius: 999,
  border: '2px solid var(--line, #12301A)',
  background: on ? '#12301A' : 'rgba(255,255,255,0.9)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  /* four lengths across a phone-width card, so a notch smaller than the
     three windows below it */
  fontSize: 14,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  cursor: 'pointer',
});

export function endsAtText(endingAt) {
  if (!endingAt) return '';
  const d = new Date(endingAt);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m}${ampm}`;
}

/* "23h 41m" — how long the countdown has left */
function leftText(endingAt) {
  const mins = Math.max(0, Math.ceil((endingAt - Date.now()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function BundleTable({ on }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 1fr 1fr',
          gap: 6,
          paddingBottom: 5,
          borderBottom: '1.5px solid rgba(18,48,26,0.14)',
        }}
      >
        <span />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#3D5A46' }}>
          normal
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: on ? '#1F6B2E' : '#3D5A46',
          }}
        >
          strict
        </span>
      </div>

      {BUNDLE.map((r) => (
        <div
          key={r.what}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr 1fr',
            gap: 6,
            padding: '7px 0',
            borderBottom: '1px solid rgba(18,48,26,0.07)',
            alignItems: 'start',
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#12301A', lineHeight: 1.3 }}>
            {r.what}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.3,
              color: on ? 'rgba(61,90,70,0.55)' : '#3D5A46',
            }}
          >
            {r.normal}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              lineHeight: 1.3,
              color: on ? '#12301A' : 'rgba(61,90,70,0.55)',
            }}
          >
            {r.strict}
          </span>
        </div>
      ))}

      <p style={{ margin: '7px 0 0', fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
        your emergency pass works in both. making a limit stricter is instant
        in both.
      </p>
    </div>
  );
}

export default function StrictCard({
  style,
  skin,
  strict,
  onTurnOn,
  /* start the 24-hour countdown */
  onAskOff,
  /* cancel a countdown that's already running */
  onKeepOn,
  /* turn it off right now, no waiting — their call (see the panel below) */
  onTurnOffNow = () => {},
}) {
  const [picking, setPicking] = useState(false);
  const [showing, setShowing] = useState(false);
  /* turning it off asks first — see the confirm panel below */
  const [confirmOff, setConfirmOff] = useState(false);
  const [days, setDays] = useState(strict.days ?? 7);
  const [when, setWhen] = useState(strict.when ?? 'all');

  const ending = Boolean(strict.endingAt);

  return (
    <div style={style}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
            strict mode
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
            no half opens, no borrowing, 24 hours to loosen anything.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={strict.on}
          aria-label="Strict mode"
          className="tap"
          onClick={() => {
            if (strict.on) setConfirmOff((v) => !v);
            else setPicking((v) => !v);
          }}
          style={{
            width: 62,
            height: 34,
            flexShrink: 0,
            borderRadius: 999,
            border: '2px solid var(--line, #12301A)',
            background: strict.on ? '#12301A' : 'rgba(255,255,255,0.9)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: strict.on ? 'flex-end' : 'flex-start',
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              margin: '0 3px',
              borderRadius: 999,
              background: strict.on ? '#FFFFFF' : '#12301A',
            }}
          />
        </button>
      </div>

      {/* They asked to turn it off. They're allowed to, full stop — nobody
          should be locked inside a setting they chose. Rilo asks once
          whether they'd rather wait the 24 hours out, because that's the
          version that actually helps, and then does whatever they say. */}
      {strict.on && !ending && confirmOff && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
            padding: '12px 13px',
            borderRadius: 18,
            background: '#12301A',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Rilo skin={skin} mood="curious" size={56} />
            <div style={{ flexGrow: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 17,
                  fontWeight: 600,
                  lineHeight: 1.25,
                }}
              >
                get through 24 hours first?
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, fontWeight: 600, color: '#C9E6CE', lineHeight: 1.35 }}>
                waiting it out is the one that works — one more day, then it
                switches itself off, and you can cancel any time. or turn it
                off now. up to you.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 7 }}>
            <button
              type="button"
              className="tap"
              onClick={() => {
                setConfirmOff(false);
                onAskOff();
              }}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 999,
                border: 0,
                background: '#FFFFFF',
                color: '#12301A',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              yes, wait it out
            </button>
            <button
              type="button"
              className="tap"
              onClick={() => {
                setConfirmOff(false);
                onTurnOffNow();
              }}
              style={{
                flex: 1,
                minHeight: 46,
                borderRadius: 999,
                border: '2px solid #FFFFFF',
                background: 'transparent',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              no, turn it off
            </button>
          </div>
        </div>
      )}

      {/* winding down: 24 hours, with a way back */}
      {strict.on && ending && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            borderRadius: 18,
            background: 'rgba(255,255,255,0.85)',
            border: '2px solid var(--line, #12301A)',
          }}
        >
          <Rilo skin={skin} mood="letdown" size={56} />
          <div style={{ flexGrow: 1, minWidth: 0 }}>
            <p
              style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 15, fontWeight: 600 }}
            >
              strict mode turns off in {leftText(strict.endingAt)}
            </p>
            <p style={{ margin: '1px 0 0', fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
              pending · tomorrow at {endsAtText(strict.endingAt)}
            </p>
            <button
              type="button"
              className="tap"
              onClick={() => {
                setConfirmOff(false);
                onKeepOn();
              }}
              style={{
                marginTop: 6,
                minHeight: 38,
                padding: '0 14px',
                borderRadius: 999,
                border: '2px solid var(--line, #12301A)',
                background: '#12301A',
                color: '#FFFFFF',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              cancel, keep it on
            </button>
          </div>
        </div>
      )}

      {strict.on && !ending && (
        <p
          style={{
            margin: 0,
            alignSelf: 'flex-start',
            padding: '5px 12px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          on · {lengthLabel(strict.days)} ·{' '}
          {WINDOWS.find((w) => w.id === strict.when)?.label ?? 'all day'}
        </p>
      )}

      {/* what the switch actually does */}
      <button
        type="button"
        className="tap"
        onClick={() => setShowing((v) => !v)}
        style={{
          alignSelf: 'flex-start',
          minHeight: 34,
          padding: '0 12px',
          borderRadius: 999,
          border: '1.5px solid rgba(18,48,26,0.3)',
          background: 'transparent',
          color: '#2C4A36',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {showing ? 'hide what changes' : 'what changes?'}
      </button>

      {showing && <BundleTable on={strict.on} />}

      {/* choosing how long and when */}
      {!strict.on && picking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>how long?</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {LENGTHS.map((l) => (
              <button
                key={l.days}
                type="button"
                className="tap"
                onClick={() => setDays(l.days)}
                style={chip(days === l.days)}
              >
                {l.label}
              </button>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#2C4A36' }}>when?</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {WINDOWS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="tap"
                onClick={() => setWhen(w.id)}
                style={chip(when === w.id)}
              >
                {w.label}
              </button>
            ))}
          </div>

          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#2C4A36' }}>
            {days === 0
              ? 'no end date — it stays on until you turn it off, and that takes 24 hours.'
              : 'this starts the second you tap. turning it back off takes 24 hours.'}
          </p>

          <button
            type="button"
            className="tap"
            onClick={() => {
              setPicking(false);
              onTurnOn(days, when);
            }}
            style={{
              marginTop: 2,
              minHeight: 50,
              borderRadius: 999,
              border: '2px solid var(--line, #12301A)',
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            lock it down
          </button>
        </div>
      )}
    </div>
  );
}

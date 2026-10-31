/* How hard the plan pushes, and how long one sitting lasts.

   Rilo works the opens out from the sitting length — pick 10 minutes and
   an hour of tiktok is six sittings, not some number nobody chose. */

import { useState } from 'react';
import { PACES, sittingOptions } from '../lib/plan';
import { riloPlan } from '../demo/mockAI';

const chip = (on, dark) => ({
  flex: 1,
  minHeight: 42,
  padding: '0 6px',
  borderRadius: 999,
  border: `2px solid ${dark ? 'rgba(255,255,255,0.55)' : 'var(--line, #12301A)'}`,
  background: on ? (dark ? '#FFFFFF' : '#12301A') : 'transparent',
  color: on ? (dark ? '#12301A' : '#FFFFFF') : dark ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
});


export default function PlanPicker({
  pace,
  setPace,
  sessionMins,
  setSessionMins,
  breakdown,
  startMins,
  weekGoal,
  dark = false,
  /* ---- add-ons (rilo-addons-test) ---- */
  mode = 'rilo',
  setMode,
  hobbies = [],
  goals = [],
}) {
  const picked = PACES.find((p) => p.id === pace) ?? PACES[1];
  const options = sittingOptions(breakdown, startMins, weekGoal, sessionMins);
  const [why, setWhy] = useState([]);

  /* DEMO ONLY: scripted rules over the saved profile, see demo/mockAI.js */
  const letRiloDoIt = () => {
    const made = riloPlan({
      startMins,
      goalMins: weekGoal,
      hobbies,
      goals,
      apps: (breakdown?.apps ?? []).map((a) => a.app),
    });
    setPace(made.pace);
    setSessionMins(made.sessionMins);
    setWhy(made.why);
    setMode?.('rilo');
  };

  const chip2 = (on) => ({
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    border: `2px solid ${dark ? 'rgba(255,255,255,0.55)' : 'var(--line, #12301A)'}`,
    background: on ? (dark ? '#FFFFFF' : '#12301A') : 'transparent',
    color: on ? (dark ? '#12301A' : '#FFFFFF') : dark ? '#FFFFFF' : '#12301A',
    fontFamily: 'Fredoka, sans-serif',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* who makes the plan (rilo-addons-test) */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" className="tap" onClick={letRiloDoIt} style={chip2(mode === 'rilo')}>
          let rilo make it
        </button>
        <button
          type="button"
          className="tap"
          onClick={() => {
            setWhy([]);
            setMode?.('own');
          }}
          style={chip2(mode === 'own')}
        >
          make my own
        </button>
      </div>

      {why.length > 0 && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 18,
            background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(18,48,26,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {why.map((line) => (
            <p
              key={line}
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.35,
                color: dark ? '#C9E6CE' : '#2C4A36',
              }}
            >
              {line}
            </p>
          ))}
        </div>
      )}

      <p
        style={{
          margin: 0,
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.2,
          color: dark ? '#FFFFFF' : '#12301A',
        }}
      >
        how fast do you want to get there?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PACES.map((p) => (
          <button
            key={p.id}
            type="button"
            className="tap"
            onClick={() => setPace(p.id)}
            style={{ ...chip(pace === p.id, dark), textAlign: 'left', padding: '8px 14px' }}
          >
            {p.label}
            <span
              style={{
                display: 'block',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                opacity: 0.75,
              }}
            >
              {p.note}
            </span>
          </button>
        ))}
      </div>

      <p
        style={{
          margin: '8px 0 0',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 19,
          fontWeight: 600,
          lineHeight: 1.2,
          color: dark ? '#FFFFFF' : '#12301A',
        }}
      >
        choose how many opens a day you get, and how long each one is
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          fontWeight: 600,
          color: dark ? '#C9E6CE' : '#2C4A36',
        }}
      >
        same amount of time either way — pick one.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((o) => (
          <button
            key={o.mins}
            type="button"
            className="tap"
            onClick={() => setSessionMins(o.mins)}
            style={{
              ...chip(sessionMins === o.mins, dark),
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              padding: '9px 14px',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 19 }}>
              {o.opens} open{o.opens === 1 ? '' : 's'} a day
            </span>
            <span style={{ fontSize: 15, opacity: 0.8 }}>
              · {o.mins} min each
            </span>
          </button>
        ))}
      </div>

      <p
        style={{
          margin: '2px 0 0',
          fontSize: 13,
          fontWeight: 600,
          color: dark ? '#C9E6CE' : '#2C4A36',
        }}
      >
        {picked.weeks === 1 ? 'one week' : `${picked.weeks} weeks`} ·{' '}
        {options.find((o) => o.mins === sessionMins)?.opens ?? ''} opens a day of{' '}
        {sessionMins} min. change it whenever.
      </p>
    </div>
  );
}

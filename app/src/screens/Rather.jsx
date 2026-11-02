/* "that's N days a year. what would you rather spend it on?"

   The one question onboarding asks about the person, and it does the work
   of two screens it replaced ("what are you into?" and "what are you
   working toward?"). Asking it here, straight after the number, is the
   point: the answer is the alternative to the thing they just saw the cost
   of.

   Multi-select with one next — people have more than one thing, and
   tapping one shouldn't commit them. Saved to the same place the old
   screens saved to (see lib/rather), so the suggestions and Rilo's plans
   need no changes. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';
import BackButton from '../components/BackButton';
import { RATHER } from '../lib/rather';
import { daysPerYear } from '../lib/rather';

const chip = (on) => ({
  width: '100%',
  minHeight: 54,
  boxSizing: 'border-box',
  padding: '0 18px',
  borderRadius: 18,
  border: '2px solid var(--line)',
  background: on ? '#2E8B3E' : 'rgba(255,255,255,0.92)',
  color: on ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 18,
  fontWeight: 600,
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 11,
});

const tick = (on) => ({
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: 999,
  border: on ? 0 : '2px solid rgba(18,48,26,0.3)',
  background: on ? '#FFFFFF' : 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#2E8B3E',
  fontSize: 14,
  fontWeight: 700,
});

export default function Rather({ go, skin, breakdown, picked, setPicked, onBack, next = 'yourplan' }) {
  const [typed, setTyped] = useState('');
  const [adding, setAdding] = useState(false);
  const [extras, setExtras] = useState([]);

  const days = daysPerYear(breakdown?.blocked ?? 0);
  const chosen = picked ?? [];
  const ready = chosen.length > 0 || extras.length > 0;

  const toggle = (id) =>
    setPicked(chosen.includes(id) ? chosen.filter((x) => x !== id) : chosen.concat([id]));

  const addOwn = () => {
    const t = typed.trim().toLowerCase();
    if (!t) return;
    setExtras((list) => Array.from(new Set(list.concat([t]))));
    setTyped('');
    setAdding(false);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
    >
      <Sky hills="low" />

      <div
        className="scroll-y"
        style={{
          position: 'relative',
          flexGrow: 1,
          minHeight: 0,
          boxSizing: 'border-box',
          padding: '52px 22px 0',
          '--tail': '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <Dots active={2} />

        <BackButton onBack={onBack} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Rilo skin={skin} mood="curious" size={92} talks />
          <h1
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.15,
            }}
          >
            that&apos;s {days} days a year. what would you rather spend it on?
          </h1>
        </div>

        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: '#2C4A36' }}>
          pick as many as you like. this is what i&apos;ll point you at instead.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RATHER.map((r) => {
            const on = chosen.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                className="tap"
                aria-pressed={on}
                onClick={() => toggle(r.id)}
                style={chip(on)}
              >
                <span aria-hidden="true" style={tick(on)}>
                  {on ? '✓' : ''}
                </span>
                {r.label}
              </button>
            );
          })}

          {/* anything they added themselves */}
          {extras.map((e) => (
            <button
              key={e}
              type="button"
              className="tap"
              aria-pressed
              onClick={() => setExtras((list) => list.filter((x) => x !== e))}
              style={chip(true)}
            >
              <span aria-hidden="true" style={tick(true)}>
                ✓
              </span>
              {e}
            </button>
          ))}

          {adding ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addOwn();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <input
                autoFocus
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="what is it?"
                enterKeyHint="done"
                autoCapitalize="none"
                style={{
                  flexGrow: 1,
                  minWidth: 0,
                  height: 54,
                  boxSizing: 'border-box',
                  padding: '0 18px',
                  borderRadius: 18,
                  border: '2px solid var(--line)',
                  background: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 17,
                  fontWeight: 600,
                  color: '#12301A',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="tap"
                aria-label="add it"
                disabled={!typed.trim()}
                style={{
                  width: 54,
                  height: 54,
                  flexShrink: 0,
                  borderRadius: '50%',
                  border: 0,
                  background: typed.trim() ? '#12301A' : 'rgba(18,48,26,0.18)',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: 24,
                  fontWeight: 600,
                  cursor: typed.trim() ? 'pointer' : 'default',
                }}
              >
                +
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="tap"
              onClick={() => setAdding(true)}
              style={{
                ...chip(false),
                border: '2px dashed rgba(18,48,26,0.4)',
                background: 'transparent',
              }}
            >
              <span aria-hidden="true" style={{ ...tick(false), border: 0, fontSize: 20 }}>
                +
              </span>
              add your own
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flexShrink: 0,
          boxSizing: 'border-box',
          padding: '10px 22px calc(28px + var(--safe-bottom, 0px))',
        }}
      >
        <button
          type="button"
          className="tap-92"
          disabled={!ready}
          onClick={() => go(next, extras)}
          style={{
            width: '100%',
            height: 58,
            border: '2px solid var(--line)',
            borderRadius: 999,
            background: ready ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
            color: ready ? '#12301A' : 'rgba(18,48,26,0.45)',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 20,
            fontWeight: 600,
            cursor: ready ? 'pointer' : 'default',
            boxShadow: '0 4px 0 var(--line)',
          }}
        >
          {ready ? 'next' : 'pick at least one'}
        </button>
      </div>
    </div>
  );
}

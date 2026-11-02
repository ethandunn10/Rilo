/* One of Rilo's first-week questions, in the place it belongs.

   Deliberately a card and not a screen: these arrive while someone is
   doing something else, and a full-screen takeover for "when are you in
   school?" would be a worse interruption than the question is worth.

   Every one of them can be waved off. "not now" is a real button at the
   same size as the answers, not small print — skipping is an answer, and
   a question you can't get out of is a trap. */

import { useState } from 'react';
import Rilo from './Rilo';

const chip = (on, light) => ({
  minHeight: 42,
  padding: '0 14px',
  borderRadius: 999,
  border: `2px solid ${light ? 'rgba(255,255,255,0.55)' : 'var(--line)'}`,
  background: on ? (light ? '#FFFFFF' : '#2E8B3E') : light ? 'rgba(255,255,255,0.14)' : '#FFFFFF',
  color: on ? (light ? '#2B3A6B' : '#FFFFFF') : light ? '#FFFFFF' : '#12301A',
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
});

export default function AskCard({ ask, skin, light = false, onAnswer, onSkip, onCta }) {
  const [picked, setPicked] = useState([]);
  const [typed, setTyped] = useState('');

  if (!ask) return null;

  const ink = light ? '#FFFFFF' : '#12301A';
  const options = ask.options ?? [];

  /* a question with nothing to tick and nothing to type would leave "not
     now" as the only button on it */
  const toggle = (id) => {
    if (!ask.multi) {
      /* single choice: the tap is the answer */
      onAnswer([id]);
      return;
    }
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.concat([id])));
  };

  const save = () => {
    const extra = typed.trim().toLowerCase();
    onAnswer(extra ? picked.concat([extra]) : picked);
  };

  const ready = picked.length > 0 || typed.trim().length > 0;

  return (
    <div
      style={{
        boxSizing: 'border-box',
        padding: '14px 16px',
        borderRadius: 26,
        background: light ? 'rgba(255,255,255,0.12)' : 'var(--card)',
        border: `2px solid ${light ? 'rgba(255,255,255,0.4)' : 'var(--line)'}`,
        boxShadow: light ? 'none' : '0 4px 0 var(--line)',
        color: ink,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'rise .5s ease-out both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {skin ? <Rilo skin={skin} mood="curious" size={54} /> : null}
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {ask.ask}
          </p>
          {ask.sub ? (
            <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 600, opacity: 0.75 }}>
              {ask.sub}
              {ask.optional ? ' · optional' : ''}
            </p>
          ) : null}
        </div>
      </div>

      {options.length ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="tap"
              aria-pressed={picked.includes(o.id)}
              onClick={() => toggle(o.id)}
              style={chip(picked.includes(o.id), light)}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}

      {ask.typed ? (
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="or type your own…"
          style={{
            height: 46,
            boxSizing: 'border-box',
            padding: '0 14px',
            borderRadius: 999,
            border: `2px solid ${light ? 'rgba(255,255,255,0.5)' : 'var(--line)'}`,
            background: light ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#12301A',
          }}
        />
      ) : null}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          className="tap"
          onClick={onSkip}
          style={{
            minHeight: 46,
            padding: '0 16px',
            borderRadius: 999,
            border: `2px solid ${light ? 'rgba(255,255,255,0.55)' : 'var(--line)'}`,
            background: light ? 'rgba(255,255,255,0.14)' : 'transparent',
            color: ink,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          not now
        </button>

        {ask.cta ? (
          <button
            type="button"
            className="tap"
            onClick={onCta}
            style={{
              flexGrow: 1,
              minHeight: 46,
              borderRadius: 999,
              border: `2px solid ${light ? 'rgba(255,255,255,0.55)' : 'var(--line)'}`,
              background: light ? '#FFFFFF' : '#2E8B3E',
              color: light ? '#2B3A6B' : '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ask.cta}
          </button>
        ) : null}

        {ask.multi || ask.typed ? (
          <button
            type="button"
            className="tap"
            disabled={!ready}
            onClick={save}
            style={{
              flexGrow: 1,
              minHeight: 46,
              borderRadius: 999,
              border: `2px solid ${light ? 'rgba(255,255,255,0.55)' : 'var(--line)'}`,
              background: ready ? (light ? '#FFFFFF' : '#2E8B3E') : 'rgba(18,48,26,0.12)',
              color: ready ? (light ? '#2B3A6B' : '#FFFFFF') : 'rgba(18,48,26,0.45)',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: ready ? 'pointer' : 'default',
            }}
          >
            that&apos;s it
          </button>
        ) : null}
      </div>
    </div>
  );
}

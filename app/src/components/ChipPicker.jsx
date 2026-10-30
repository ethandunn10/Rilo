/* ChipPicker — the hobbies + goals chip cards.
   Shared by About you (onboarding) and the You screen, so editing works the
   same in both places: tap to toggle, a green "+ add your own",
   "+ add your own" with type-ahead, and a × on chips you added yourself. */

import { useState } from 'react';
import { HOBBIES, GOALS } from '../lib/profile';

const chipBase = {
  minHeight: 44,
  padding: '0 14px',
  borderRadius: 999,
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
};

const onStyle = { background: '#12301A', color: '#FFFFFF', border: '2px solid #12301A' };
const offStyle = {
  background: 'rgba(255,255,255,0.85)',
  color: '#12301A',
  border: '2px solid #FFFFFF',
};

function Chip({ label, on, onPick }) {
  return (
    <button
      type="button"
      className="tap-94"
      aria-pressed={on}
      onClick={onPick}
      style={{ ...chipBase, ...(on ? onStyle : offStyle) }}
    >
      {label}
    </button>
  );
}

/* a chip the tester added themselves — toggles, and can be removed */
function CustomChip({ label, on, onPick, onRemove }) {
  const skin = on ? onStyle : offStyle;
  return (
    <span
      style={{
        ...chipBase,
        ...skin,
        padding: '0 6px 0 14px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <button
        type="button"
        className="tap-94"
        aria-pressed={on}
        onClick={onPick}
        style={{
          border: 0,
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label={`Remove ${label}`}
        onClick={onRemove}
        style={{
          width: 26,
          height: 26,
          borderRadius: 999,
          border: 0,
          flexShrink: 0,
          background: on ? 'rgba(255,255,255,0.22)' : 'rgba(18,48,26,0.1)',
          color: 'inherit',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 15,
          fontWeight: 700,
          lineHeight: 1,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ×
      </button>
    </span>
  );
}

/* "+ add your own" — green so it reads as the way to add something, not
   just another option to tap */
function GhostChip({ label, onClick }) {
  return (
    <button
      type="button"
      className="tap-94"
      onClick={onClick}
      style={{
        ...chipBase,
        background: '#4CC160',
        color: '#0C2A14',
        border: '2px solid var(--line)',
        boxShadow: '0 3px 0 var(--line)',
      }}
    >
      {label}
    </button>
  );
}

function AddRow({ id, label, placeholder, draft, setDraft, commit, matches, onSuggest }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
          }}
          spellCheck
          autoCorrect="on"
          autoCapitalize="none"
          autoComplete="off"
          style={{
            flexGrow: 1,
            minWidth: 0,
            height: 46,
            boxSizing: 'border-box',
            padding: '0 16px',
            borderRadius: 999,
            border: '2px solid #12301A',
            background: '#FFFFFF',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            color: '#12301A',
          }}
        />
        <button
          type="button"
          className="tap-94"
          onClick={commit}
          style={{
            height: 46,
            padding: '0 18px',
            borderRadius: 999,
            border: 0,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          add
        </button>
      </div>

      {/* type-ahead: tap one of ours instead of typing it out */}
      {matches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              className="tap-94"
              onClick={() => onSuggest(m)}
              style={{
                ...chipBase,
                minHeight: 38,
                fontSize: 15,
                background: 'rgba(255,255,255,0.95)',
                color: '#12301A',
                border: '2px solid #12301A',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ChipPicker({ about, setAbout, cardStyle }) {
  const [adding, setAdding] = useState(null);
  const [draft, setDraft] = useState('');

  const { on, extra } = about;

  const toggle = (label) => setAbout({ ...about, on: { ...on, [label]: !on[label] } });

  const removeCustom = (kind, label) => {
    const nextOn = { ...on };
    delete nextOn[label];
    setAbout({
      on: nextOn,
      extra: { ...extra, [kind]: extra[kind].filter((x) => x !== label) },
    });
  };

  const turnOn = (label) => {
    setAbout({ ...about, on: { ...on, [label]: true } });
    setAdding(null);
    setDraft('');
  };

  /* Typing an option that already exists turns that one on rather than
     making a duplicate chip. */
  const commit = () => {
    const text = draft.trim().toLowerCase();
    if (!text || !adding) {
      setAdding(null);
      setDraft('');
      return;
    }

    const builtIn = adding === 'hobby' ? HOBBIES : GOALS;
    if (builtIn.includes(text) || extra[adding].includes(text)) {
      turnOn(text);
      return;
    }

    setAbout({
      on: { ...on, [text]: true },
      extra: { ...extra, [adding]: extra[adding].concat([text]) },
    });
    setAdding(null);
    setDraft('');
  };

  const suggestFor = (kind) => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    const list = kind === 'hobby' ? HOBBIES : GOALS;
    return list.filter((x) => x.includes(q) && !on[x]).slice(0, 6);
  };

  /* tapping a type-ahead match just switches that chip on */
  const pickSuggestion = () => turnOn;

  const card = (kind, title, delay, placeholder, inputId, inputLabel) => {
    const list = kind === 'hobby' ? HOBBIES : GOALS;
    const customs = extra[kind];

    return (
      <div style={cardStyle(delay)}>
        <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 19, fontWeight: 600 }}>
          {title}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {list.map((x) => (
            <Chip key={x} label={x} on={!!on[x]} onPick={() => toggle(x)} />
          ))}
          {customs.map((x) => (
            <CustomChip
              key={x}
              label={x}
              on={!!on[x]}
              onPick={() => toggle(x)}
              onRemove={() => removeCustom(kind, x)}
            />
          ))}
          <GhostChip
            label="+ add your own"
            onClick={() => {
              setAdding(kind);
              setDraft('');
            }}
          />
        </div>
        {adding === kind && (
          <AddRow
            id={inputId}
            label={inputLabel}
            placeholder={placeholder}
            draft={draft}
            setDraft={setDraft}
            commit={commit}
            matches={suggestFor(kind)}
            onSuggest={pickSuggestion(kind)}
          />
        )}
      </div>
    );
  };

  return (
    <>
      {card('hobby', 'what are you into?', '.1s', 'e.g. fishing', 'newHobby', 'New hobby')}
      {card(
        'goal',
        'what are you working toward?',
        '.2s',
        'e.g. make varsity',
        'newGoal',
        'New goal',
      )}
    </>
  );
}

/* "what should i call you?" — one field, one tap.

   This used to be a question inside the conversation screen, followed by
   "ethan? did i get that right?" and a yep/nope. Both are gone: it's a
   typed name, it's on screen in front of them, and it's one tap to change
   on the you tab. Enter or the arrow goes straight on. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import Dots from '../components/Dots';

export default function Name({ go, name, setName, skin, next = 'pickapps' }) {
  const [draft, setDraft] = useState(name ?? '');
  const ready = draft.trim().length > 0;

  const onward = () => {
    setName(draft.trim());
    go(next);
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
          padding: '56px 24px 0',
          '--tail': '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Dots active={1} />

        <Rilo skin={skin} mood="wave" size={190} talks />

        <h1
          style={{
            margin: 0,
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1.1,
            textAlign: 'center',
          }}
        >
          what should i call you?
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ready) onward();
          }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9 }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="first name"
            enterKeyHint="go"
            autoComplete="given-name"
            autoCapitalize="words"
            autoCorrect="off"
            spellCheck={false}
            style={{
              flexGrow: 1,
              minWidth: 0,
              height: 58,
              boxSizing: 'border-box',
              padding: '0 20px',
              borderRadius: 999,
              border: '2px solid var(--line)',
              background: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              /* 16px minimum or iOS zooms the page on focus */
              fontSize: 19,
              fontWeight: 600,
              color: '#12301A',
              outline: 'none',
              boxShadow: '0 4px 0 var(--line)',
            }}
          />
          <button
            type="submit"
            className="tap"
            aria-label="continue"
            disabled={!ready}
            style={{
              width: 58,
              height: 58,
              flexShrink: 0,
              borderRadius: '50%',
              border: 0,
              background: ready ? '#12301A' : 'rgba(18,48,26,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: ready ? 'pointer' : 'default',
              transition: 'background .18s ease',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 12h12M12 6l6 6-6 6"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <button
          type="button"
          className="tap"
          onClick={() => {
            setName('');
            go(next);
          }}
          style={{
            border: 0,
            background: 'transparent',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#2C4A36',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            padding: 6,
            cursor: 'pointer',
          }}
        >
          skip
        </button>
      </div>
    </div>
  );
}

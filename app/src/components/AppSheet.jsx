/* AppSheet — the "add another app" sheet.
   Slides up from the bottom with a search box and the popular-app list.
   Typing filters it; anything not in the list offers add "<what you typed>"
   with the letter-icon fallback. */

import { useEffect, useRef, useState } from 'react';
import AppLogo from './AppLogo';
import { searchApps } from '../lib/apps';

export default function AppSheet({ onPick, onClose, already }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 260);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const typed = query.trim().toLowerCase();
  const results = searchApps(query);
  const exact = results.some((a) => a.label === typed);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          border: 0,
          padding: 0,
          background: 'rgba(10,30,18,0.38)',
          backdropFilter: 'blur(2px)',
          cursor: 'pointer',
          animation: 'scrim-in .28s ease-out both',
        }}
      />

      <div
        role="dialog"
        aria-label="Add an app"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '78%',
          boxSizing: 'border-box',
          padding: '10px 18px 22px',
          borderRadius: '30px 30px 0 0',
          background: 'var(--card)',
            border: '2px solid var(--line)',
          borderTop: '1.5px solid #FFFFFF',
          boxShadow: '0 -14px 44px rgba(10,40,20,0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          animation: 'sheet-up .3s cubic-bezier(.2,.8,.3,1) both',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 42,
            height: 5,
            borderRadius: 3,
            background: 'rgba(18,48,26,0.18)',
            alignSelf: 'center',
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 22,
              fontWeight: 600,
              color: '#12301A',
            }}
          >
            add an app
          </p>
          <button
            type="button"
            className="tap-97"
            onClick={onClose}
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 999,
              border: 0,
              background: 'rgba(18,48,26,0.08)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            done
          </button>
        </div>

        <label htmlFor="appSearch" className="sr-only">
          Search apps
        </label>
        <input
          id="appSearch"
          ref={inputRef}
          type="text"
          inputMode="search"
          placeholder="search apps"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck
          autoCorrect="on"
          autoCapitalize="none"
          style={{
            flexShrink: 0,
            height: 48,
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

        <div className="scroll-y" style={{ flexGrow: 1, minHeight: 0, margin: '0 -4px' }}>
          {results.map((a) => {
            const on = !!already[a.label];
            return (
              <button
                key={a.label}
                type="button"
                className="tap-97"
                onClick={() => onPick(a.label)}
                style={{
                  width: '100%',
                  minHeight: 56,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: 'transparent',
                  border: 0,
                  borderBottom: '1px solid rgba(18,48,26,0.08)',
                  padding: '0 4px',
                  fontFamily: 'Fredoka, sans-serif',
                  color: '#12301A',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <AppLogo label={a.label} />
                <span style={{ flexGrow: 1, fontSize: 18, fontWeight: 600 }}>{a.label}</span>
                <span
                  style={{
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontSize: 13,
                    fontWeight: 700,
                    color: on ? '#1F6B2E' : '#3D5A46',
                  }}
                >
                  {on ? 'added' : '+ add'}
                </span>
              </button>
            );
          })}

          {typed && !exact && (
            <button
              type="button"
              className="tap-97"
              onClick={() => onPick(typed)}
              style={{
                width: '100%',
                minHeight: 56,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'transparent',
                border: 0,
                padding: '0 4px',
                fontFamily: 'Fredoka, sans-serif',
                color: '#12301A',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <AppLogo label={typed} />
              <span style={{ flexGrow: 1, fontSize: 18, fontWeight: 600 }}>add “{typed}”</span>
              <span
                style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#3D5A46',
                }}
              >
                + add
              </span>
            </button>
          )}

          {!results.length && !typed && (
            <p style={{ margin: '14px 4px', fontSize: 15, fontWeight: 600, color: '#2C4A36' }}>
              no apps found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* Results — hidden internal screen at /results (or #results).
   Not a design: it exists so Ethan can read what testers actually tapped.
   Counts come from localStorage via lib/track.js. */

import { useState } from 'react';
import { counts, resetCounts } from '../lib/track';
import { loadState, clearState } from '../lib/storage';

const GROUPS = [
  {
    key: 'reason',
    title: 'pop-up reason',
    order: ['opened it', "i'm bored", 'just tired', 'never mind'],
  },
  { key: 'checkin', title: 'check-in (why, and how long)', order: [] },
  { key: 'paywall', title: 'paywall', order: ['start free trial', 'continue with free'] },
  {
    key: 'rilo',
    title: 'rilo previewed',
    order: [
      'original', 'proband', 'bamboo', 'shades', 'beanie',
      'sakura', 'studio', 'redpanda', 'pinkpanda', 'gold',
    ],
  },
  /* free users tapping a locked skin = a would-you-pay signal */
  { key: 'locked', title: 'locked skin tapped (free users)', order: [] },
  { key: 'screentime', title: 'screen time permission', order: ['allowed', 'denied', 'tried again'] },
  { key: 'strict', title: 'strict mode', order: ['not now', 'countdown started', 'countdown cancelled'] },
  { key: 'pass', title: 'emergency passes (and what for)', order: [] },
  { key: 'borrow', title: 'borrowed from tomorrow', order: [] },
  { key: 'session', title: 'sessions (length and what they cost)', order: [] },
  { key: 'early', title: 'closed an app early', order: [] },
  { key: 'limits', title: 'who made the limits', order: [] },
  { key: 'limit', title: 'limit changes', order: [] },
  { key: 'stepdown', title: 'weekly step-down', order: [] },
  { key: 'demo', title: 'demo panel used', order: [] },
  { key: 'day', title: 'days', order: ['goal hit', 'went over'] },
  { key: 'week', title: 'weeks', order: ['cleared', 'repeated'] },
  { key: 'levelup', title: 'level ups', order: [] },
];

const card = {
  padding: '14px 16px',
  borderRadius: 22,
  background: 'rgba(255,255,255,0.75)',
  border: '1.5px solid rgba(255,255,255,0.95)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

function Group({ title, rows, total }) {
  const max = Math.max(1, ...rows.map((r) => r.n));

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
          {title}
        </p>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#3D5A46' }}>{total} taps</p>
      </div>

      {total === 0 && (
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#3D5A46' }}>
          nothing yet.
        </p>
      )}

      {rows.map((r) => (
        <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#12301A' }}>
              {r.n}
              <span style={{ fontWeight: 600, color: '#3D5A46' }}>
                {total ? ` · ${Math.round((r.n / total) * 100)}%` : ''}
              </span>
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(18,48,26,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(r.n / max) * 100}%`,
                height: 8,
                borderRadius: 4,
                background: 'linear-gradient(90deg, #4CC160, #2E8B3E)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Results() {
  const [data, setData] = useState(() => counts());
  const [state, setState] = useState(() => loadState());

  const groups = GROUPS.map((g) => {
    const bucket = data[g.key] ?? {};
    /* listed order first, then anything unexpected that showed up */
    const labels = g.order.concat(Object.keys(bucket).filter((k) => !g.order.includes(k)));
    const rows = labels
      .map((label) => ({ label, n: bucket[label] ?? 0 }))
      .filter((r) => r.n > 0 || g.order.includes(r.label));
    const total = Object.values(bucket).reduce((a, b) => a + b, 0);
    return { ...g, rows, total };
  });

  const picked = (obj) => Object.keys(obj).filter((k) => obj[k]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, #CBEAF5 0%, #EEF8EE 60%, #EEF8EE 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#12301A',
      }}
      className="scroll-y"
    >
      <div
        style={{
          boxSizing: 'border-box',
          padding: '40px 20px 0',
          '--tail': '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 30, fontWeight: 700 }}
          >
            test results
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 600, color: '#2C4A36' }}>
            counts from this browser only. {data.__updated ? `last tap ${data.__updated.slice(0, 16).replace('T', ' ')}` : 'no taps yet'}
          </p>
        </div>

        {groups.map((g) => (
          <Group key={g.key} title={g.title} rows={g.rows} total={g.total} />
        ))}

        <div style={card}>
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 18, fontWeight: 600 }}>
            what this tester saved
          </p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
            <strong>name:</strong> {state.name || '—'}
            <br />
            <strong>hobbies + goals:</strong> {picked(state.about.on).join(', ') || '—'}
            <br />
            <strong>apps watched:</strong> {picked(state.apps.on).join(', ') || '—'}
            <br />
            <strong>screen time:</strong> {state.time.now}h now · {state.time.goal}h goal
            <br />
            <strong>plan tapped:</strong> {state.planChoice ?? 'not yet'} ({state.plan} price) ·{' '}
            {state.isPro ? 'PRO' : 'free'}
            <br />
            <strong>xp:</strong> {state.xp} · level {state.level}
            <br />
            <strong>chosen rilo:</strong> {state.chosenRilo}
            <br />
            <strong>time saved:</strong> {state.stats.savedMinutes}m · said no{' '}
            {state.stats.saidNo}x
            <br />
            <strong>opens today:</strong>{' '}
            {Object.entries(state.opens.counts)
              .map(([a, n]) => `${a} ${n}x`)
              .join(', ') || '—'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          <button
            type="button"
            className="tap"
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              width: '100%',
              height: 52,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            back to the app
          </button>
          <button
            type="button"
            className="tap"
            onClick={() => {
              if (!window.confirm('Clear the counts and this tester’s saved progress?')) return;
              resetCounts();
              clearState();
              setData(counts());
              setState(loadState());
            }}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 999,
              background: 'transparent',
              border: '2px solid rgba(18,48,26,0.3)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            reset counts + saved progress
          </button>
        </div>
      </div>
    </div>
  );
}

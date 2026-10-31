/* PickRilo — all 10 skins in level order (panda update sections 3 + 5).

   DEMO: every skin is wearable by everyone right now (lib/levels UNLOCK_ALL).
   Skins 2-10 still carry a "pro" tag so testers can see what the paid plan
   will cover, but nothing is blocked and nothing redirects to the Paywall.
   The real gating is still written in lib/levels — flip UNLOCK_ALL to false
   and this screen enforces it again. */

import { useState } from 'react';
import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { SKIN_LADDER, skinState, UNLOCK_ALL } from '../lib/levels';

const tagBase = {
  margin: '2px 0 0',
  padding: '4px 11px',
  borderRadius: 999,
  fontFamily: 'Fredoka, sans-serif',
  fontSize: 13,
  fontWeight: 600,
};

function LockIcon({ size = 11, color = '#FFFFFF' }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 10 12" aria-hidden="true">
      <path
        d="M2.4 5V3.4a2.6 2.6 0 0 1 5.2 0V5"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="1" y="5" width="8" height="6.4" rx="1.8" fill={color} />
    </svg>
  );
}

export default function PickRilo({
  go,
  chosenRilo,
  setChosenRilo,
  onPreview,
  onLockedTap,
  isPro,
  level,
}) {
  const [sel, setSel] = useState(chosenRilo ?? 'original');

  const cur = skinState(sel, { isPro, level });

  const selTag = sel === chosenRilo ? 'wearing this' : cur.unlocked ? 'yours' : 'rilo pro';
  const selTagSkin = cur.unlocked
    ? { background: '#FFFFFF', color: '#12301A' }
    : { background: '#12301A', color: '#FFFFFF' };

  const tap = (skin) => {
    const state = skinState(skin, { isPro, level });

    /* once the paid plan is real, a locked skin sells the plan instead */
    if (!state.unlocked && state.reason === 'pro') {
      if (onLockedTap) onLockedTap(state.name);
      go('upgrade');
      return;
    }

    setSel(skin);
    if (onPreview) onPreview(skin);
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
      <Sky hills="mid" />

      <div
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '52px 20px 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="tap"
            aria-label="Back to home"
            onClick={() => go('home', 'back')}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: 0,
              background: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15 5 L8 12 L15 19"
                fill="none"
                stroke="#12301A"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1
            style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 26, fontWeight: 700 }}
          >
            your rilo
          </h1>
          <span
            style={{
              minWidth: 44,
              textAlign: 'right',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: '#1F6B2E',
            }}
          >
            lv {level}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            height: 228,
            justifyContent: 'flex-end',
          }}
        >
          <Rilo skin={sel} mood="proud" motion="jump" size={cur.level > 10 ? 168 : 190} />
          <p style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 24, fontWeight: 700 }}>
            {cur.name} rilo
          </p>
          {cur.level > 10 && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}>
              level {cur.level}
              {cur.legendary ? ' · legendary' : ''}
            </p>
          )}
          <p style={{ ...tagBase, ...selTagSkin }}>{selTag}</p>
        </div>

        <div
          className="scroll-y"
          style={{
            flexGrow: 1,
            minHeight: 0,
            padding: 12,
            borderRadius: 28,
            background: 'var(--card)',
            border: '2px solid var(--line)',
            boxShadow: '0 4px 0 var(--line)',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            gridAutoRows: 'min-content',
            gap: 8,
          }}
        >
          {SKIN_LADDER.map((item) => {
            const state = skinState(item.skin, { isPro, level });
            const on = sel === item.skin;

            return (
              <button
                key={item.skin}
                type="button"
                className="tap-pw"
                aria-label={`${item.name} rilo, ${
                  state.unlocked
                    ? state.tier === 'pro'
                      ? 'available now, rilo pro later'
                      : 'free'
                    : state.reason === 'pro'
                      ? 'rilo pro'
                      : `unlocks at level ${item.level}`
                }`}
                aria-pressed={on}
                onClick={() => tap(item.skin)}
                style={{
                  position: 'relative',
                  minHeight: 78,
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 1,
                  cursor: 'pointer',
                  padding: '4px 0 3px',
                  background: on ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  border: on ? '2.5px solid #12301A' : '2px solid transparent',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    /* dimmed only when actually locked */
                    opacity: state.unlocked ? 1 : 0.45,
                    filter: state.unlocked ? 'none' : 'saturate(0.4)',
                  }}
                >
                  <Rilo skin={item.skin} mood="coach" motion="none" size={56} />
                </span>
                <span
                  style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#3D5A46',
                    lineHeight: 1.1,
                    textAlign: 'center',
                  }}
                >
                  {item.name}
                </span>
                {item.level > 10 && (
                  <span
                    style={{
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 9,
                      fontWeight: 600,
                      color: item.legendary ? '#9A6B00' : '#6B8A74',
                      lineHeight: 1,
                    }}
                  >
                    lv {item.level}
                  </span>
                )}

                {(!state.unlocked || (UNLOCK_ALL && state.tier === 'pro')) && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      borderRadius: 999,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: 9,
                      fontWeight: 600,
                      ...(state.reason === 'level'
                        ? { background: '#F2C230', color: '#3D2E00' }
                        : { background: '#12301A', color: '#FFFFFF' }),
                    }}
                  >
                    {state.unlocked ? (
                      /* demo: a label for what the paid plan will cover */
                      'pro'
                    ) : state.reason === 'pro' ? (
                      <LockIcon />
                    ) : (
                      <>
                        <LockIcon color="#3D2E00" size={8} />
                        {item.level}
                      </>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {UNLOCK_ALL && (
          <p
            style={{
              margin: 0,
              flexShrink: 0,
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#2C4A36',
            }}
          >
            every rilo is unlocked while we're testing · "pro" shows what the
            paid plan will cover later
          </p>
        )}

        {cur.unlocked && (
          <button
            type="button"
            className="tap"
            onClick={() => {
              setChosenRilo(sel);
              go('home', 'back');
            }}
            style={{
              width: '100%',
              height: 58,
              flexShrink: 0,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            wear this
          </button>
        )}

        {!cur.unlocked && cur.reason === 'pro' && (
          <button
            type="button"
            className="tap"
            onClick={() => {
              if (onLockedTap) onLockedTap(cur.name);
              go('upgrade');
            }}
            style={{
              width: '100%',
              height: 58,
              flexShrink: 0,
              border: 0,
              borderRadius: 999,
              background: '#12301A',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(10,40,20,0.3)',
            }}
          >
            unlock with rilo pro
          </button>
        )}

        {!cur.unlocked && cur.reason === 'level' && (
          <div
            style={{
              width: '100%',
              height: 58,
              flexShrink: 0,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.85)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            level {level} of {cur.level} · keep going
          </div>
        )}
      </div>
    </div>
  );
}

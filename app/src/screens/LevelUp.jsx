/* LevelUp — the "new rilo unlocked!" celebration (panda update section 3).
   Not in designs/: built in the same Touch Grass style.

   Only Pro users see this — free users keep Original at every level. */

import Sky from '../components/Sky';
import Rilo from '../components/Rilo';
import { skinInfo } from '../lib/levels';

export default function LevelUp({ skin, level, onWear, onLater }) {
  const info = skinInfo(skin);

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
        className="scroll-y"
        style={{
          position: 'relative',
          height: '100%',
          boxSizing: 'border-box',
          padding: '72px 22px 0',
          '--tail': '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <p
          style={{
            margin: 0,
            padding: '6px 16px',
            borderRadius: 999,
            background: '#12301A',
            color: '#FFFFFF',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            animation: 'rise .5s ease-out both',
          }}
        >
          level {level}
        </p>

        <div
          style={{
            position: 'relative',
            width: 260,
            height: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="260"
            height="240"
            viewBox="0 0 260 240"
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              animation: 'burst 1.2s ease-out both',
            }}
          >
            <g fill="#F2C230">
              <circle cx="34" cy="62" r="6" />
              <circle cx="226" cy="52" r="5" />
              <circle cx="22" cy="166" r="4" />
              <circle cx="238" cy="156" r="6" />
            </g>
            <g fill="#FFFFFF">
              <circle cx="78" cy="20" r="5" />
              <circle cx="182" cy="18" r="4" />
              <circle cx="130" cy="8" r="5" />
            </g>
          </svg>
          <div style={{ animation: 'pop-plain .6s ease-out both' }}>
            <Rilo skin={skin} mood="proud" motion="jump" size={210} talks />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            textAlign: 'center',
            animation: 'rise .5s .15s ease-out both',
          }}
        >
          <h1 style={{ margin: 0, fontFamily: 'Fredoka, sans-serif', fontSize: 36, fontWeight: 700 }}>
            new rilo unlocked!
          </h1>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#2C4A36' }}>
            {info.name} rilo is yours.
          </p>
        </div>

        <div style={{ flexGrow: 1 }} />

        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            animation: 'rise .5s .25s ease-out both',
          }}
        >
          <button
            type="button"
            className="tap"
            onClick={onWear}
            style={{
              width: '100%',
              height: 56,
              border: '2px solid var(--line)',
              borderRadius: 999,
              background: '#FFFFFF',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 0 var(--line)',
            }}
          >
            wear it
          </button>
          <button
            type="button"
            className="tap"
            onClick={onLater}
            style={{
              width: '100%',
              height: 52,
              boxSizing: 'border-box',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.92)',
              border: '1.5px solid var(--line, #12301A)',
              color: '#12301A',
              fontFamily: 'Fredoka, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            later
          </button>
        </div>
      </div>
    </div>
  );
}

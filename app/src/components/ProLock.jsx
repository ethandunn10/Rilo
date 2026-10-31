/* A pro feature, shown as a locked card instead of hidden — the free
   tester should be able to see what the trial would give them. */

import Rilo from './Rilo';

export default function ProLock({ style, title, sub, skin = 'gold', onTap }) {
  return (
    <button
      type="button"
      className="tap"
      onClick={onTap}
      style={{
        ...style,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        textAlign: 'left',
        border: '2px dashed rgba(18,48,26,0.3)',
        cursor: 'pointer',
      }}
    >
      <Rilo skin={skin} mood="coach" size={56} />
      <span style={{ flexGrow: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: 19,
            fontWeight: 600,
          }}
        >
          {title}
        </span>
        <span
          style={{ display: 'block', marginTop: 2, fontSize: 13, fontWeight: 600, color: '#2C4A36' }}
        >
          {sub}
        </span>
      </span>
      <span
        style={{
          flexShrink: 0,
          padding: '5px 11px',
          borderRadius: 999,
          background: '#12301A',
          color: '#FFFFFF',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        pro
      </span>
    </button>
  );
}

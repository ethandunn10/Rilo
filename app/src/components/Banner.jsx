/* The iOS notification Rilo sends after the shield — the only way an app
   can pull you out of a shield on a real phone is to notify you. */

import Rilo from './Rilo';

export default function Banner({ skin, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        position: 'absolute',
        left: 8,
        right: 8,
        top: 12,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px 14px 12px',
        borderRadius: 24,
        border: 0,
        textAlign: 'left',
        background: 'rgba(245,245,247,0.86)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 26px rgba(0,0,0,0.18)',
        cursor: 'pointer',
        animation: 'banner-down .4s cubic-bezier(.2,.9,.3,1.1) both',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      }}
    >
      <span
        style={{
          width: 46,
          height: 46,
          borderRadius: 11,
          background: '#BFE8B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <Rilo skin={skin} mood="coach" motion="none" size={42} />
      </span>

      <span style={{ flexGrow: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: '#000000',
            letterSpacing: '0.01em',
          }}
        >
          RILO
        </span>
        <span style={{ display: 'block', marginTop: 1, fontSize: 17, color: '#000000' }}>
          tap to talk
        </span>
      </span>

      <span style={{ fontSize: 13, color: 'rgba(60,60,67,0.6)', flexShrink: 0 }}>now</span>
    </button>
  );
}

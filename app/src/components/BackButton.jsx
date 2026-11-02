/* One back button, used on every screen that has somewhere to go back to.

   Onboarding is a sequence, and a sequence you can't step back through is
   a trap: tap into the limits to change one number and the only way out
   was forward. Every screen that isn't the first one gets this.

   `tone="light"` for dark backgrounds (the dusk screens), default for the
   pale sky. */

export default function BackButton({ onBack, label = 'back', tone = 'dark', style }) {
  if (!onBack) return null;
  const light = tone === 'light';

  return (
    <button
      type="button"
      className="tap"
      onClick={onBack}
      aria-label={label}
      style={{
        alignSelf: 'flex-start',
        flexShrink: 0,
        minHeight: 40,
        padding: '0 15px 0 11px',
        borderRadius: 999,
        border: light ? '2px solid rgba(255,255,255,0.6)' : '2px solid var(--line, #12301A)',
        background: light ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.92)',
        color: light ? '#FFFFFF' : '#12301A',
        fontFamily: 'Fredoka, sans-serif',
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        ...style,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M19 12H7M13 6l-6 6 6 6"
          fill="none"
          stroke={light ? '#FFFFFF' : '#12301A'}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}

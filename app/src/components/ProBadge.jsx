/* ProBadge — the small padlock that marks a rilo pro feature.

   It is deliberately tiny and quiet: a locked feature should still be
   visible and understandable, because seeing what you don't have is the
   whole argument for buying it. Tapping whatever carries this badge opens
   the paywall rather than the feature. */

export default function ProBadge({ size = 22, style }) {
  return (
    <span
      aria-label="rilo pro"
      title="rilo pro"
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        background: '#F0E4C3',
        border: '1.5px solid #D8C48C',
        ...style,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 10V7.5a5 5 0 0 1 10 0V10"
          fill="none"
          stroke="#8A6B1F"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <rect x="4.5" y="10" width="15" height="10.5" rx="3" fill="#8A6B1F" />
      </svg>
    </span>
  );
}

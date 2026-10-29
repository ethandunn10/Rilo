/* AppLogo — a brand logo on a rounded square.
   Simple Icons glyph in the brand's colour where one exists, otherwise the
   spec's letter fallback. Tile is the brand colour at low alpha. */

import { appInfo, glyphColor, tileColor } from '../lib/apps';

export default function AppLogo({ label, size = 38, radius = 12 }) {
  const { logo, hex } = appInfo(label);
  const color = glyphColor(hex);

  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: tileColor(hex),
        border: '1px solid rgba(18,48,26,0.08)',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {logo ? (
        <svg
          width={Math.round(size * 0.55)}
          height={Math.round(size * 0.55)}
          viewBox="0 0 24 24"
          fill={color}
        >
          <path d={logo.path} />
        </svg>
      ) : (
        <span
          style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: Math.round(size * 0.45),
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

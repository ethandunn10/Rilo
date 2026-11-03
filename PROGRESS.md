# iOS port: progress

Plan: see PORT_PLAN.md. Branch: `ios-port` (nothing pushed).

## Phase 1: Foundation ✅
- Colors (`Theme/RiloColors.swift`), fonts (Fredoka/Inter/Nunito bundled, `Theme/RiloFonts.swift`), 5 themes (`Theme/Themes.swift`).
- `SkyView` / `ThemeDecor` / `HillsView`: the grass sky plus all theme decorations (sun glow, butterflies, falling leaves/petals/snow, bamboo, sakura branch, birds, flowers, swaying grass).
- Rilo art: all 23 skins × 7 moods rendered from the real SVGs into `Assets.xcassets/Rilo`. The wave arm is its own layer and swings like the SVG; angry shakes. `RiloView` has bob/jump, tap to squish, and his lines.
- App icon: original Rilo on the grass sky (the web demo had no icon). **Please check it.**
- Sticker card / pill button / back button / tab bar (`Components/`).
- Screenshots: `screenshots/phase-1/`.
- Tools: `Rilo/tools/render-rilo.mjs` regenerates the art from `app/src/rilo/sprites.js` (needs Playwright).

Couldn't match exactly:
- Nothing visible. Layout note: the web is drawn for a 390×844 frame with no status bar. iOS keeps content inside the real safe area, so top paddings are reduced by the status bar height (`WebLayout.top`).

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

## Phase 2: Onboarding ✅
- Screens: welcome, name, pickapps (+ app picker sheet with search), permission (fake Screen Time sheet, allow / don't allow / try again / skip), crunching, rather, yournumber (the hit → the flip → the promise, pile of days + count-up), yourplan (goal stepper, limits, "what you'll do instead", Pro parts locked).
- New shared components: Dots, AppLogo, AppPicker/AppSheet, ChipPicker, GoalStepper, BreakdownBars, WebText.
- Screenshots: `screenshots/phase-2/` (`ios-NN-*.png` next to `web-NN-*.png`).
- Debug launch args (DEBUG only, Models/DemoSeed.swift): `-screen <name>`, `-picked`, `-appsheet [-appquery x]`, `-permsheet`, `-permdenied`, `-beat N`, `-scrollbottom`, `-hold`.

Couldn't match exactly:
- **Web bug (not copied):** on "your number" the back/skip buttons on the first two beats and the "not all N days…" line are hidden behind the sky on the web (they're missing `position: relative`). iOS shows them, because every step needs a back button. Worth fixing on the web too.
- iOS text wrapping avoids leaving one word alone on the last line, so a few lines break slightly differently.
- iPhone 17 is 402pt wide vs the web's 390, so things are a touch wider.
- The ✓ mark uses the system font; there's no browser focus ring; blur is a plain blur instead of the web's backdrop blur.

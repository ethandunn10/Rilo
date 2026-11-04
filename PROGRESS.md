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

## Phase 3: Home + tab bar ✅
- `home`: greeting, Rilo big in his mood with the chat badge and his line, today vs goal, "do this instead", the apps with opens circles, the notes (over your promise, closed early), the weekly step-down sheet, the strict-mode ask.
- `plan` (plan check, calendar week, today's question, check-in, editable day rows, add/done bar), `daysummary`, `creator` (+ session and nudge pop-ups).
- Overlays: Rilo's hand-off hop after the paywall, the Meet Rilo tour (green box around the real element, everything else dimmed), the demo panel (every button).
- New components: Opens, ProBadge, ProLock, ChatIcon, TourTarget (`.tourTarget("id")`), StepDownCard, ScheduleCard, ScheduleAsk, AskCard.
- Screenshots: `screenshots/phase-3/`. Debug flags: `-handoff`, `-tour`, `-tourstep N`, `-handoffat s`, `-creatoractive`, `-creatoralert nudge|kicked|time-up`, `-scrollbottom`, `-askday N`, `-stepdown`, `-planask`, `-planedit`, `-planbottom`, `-demopanel`.

Couldn't match exactly:
- Tapping Rilo on home opens the chat, like the web does (no bubble on home). The squish + line reaction is on the other Rilos.
- iOS demo data has some usage already, so numbers and Rilo's line differ from a fresh web run. The layout matches.
- A few lines use regular-weight Inter on the web. Only Medium and up are bundled, so they're a touch bolder. (Could add Inter Regular later.)
- Some titles wrap one word differently (iOS avoids a lone last word). Time cells in plan editing show "3:…" where the web cuts the text.
- The web's step-down never shows after "skip a week" in a fresh demo, so that one has only an iOS shot.
- If a tour step's target isn't on screen, the tour dims everything and centres its card (the web would leave the box in the wrong place).

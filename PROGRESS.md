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

## Phase 4: Blocked-app pop-up + rules ✅
- `shield` + Rilo's fake notification banner, `intercept` (countdown, opens left, emergency pass, borrow ½ open, "that's it for today", strict 15s wait, "limit it"), `whyopen` (reason → what for → Rilo pushes back → Quick ½ / Full 1, posting = Creator Mode), BypassGuilt ("you can, but…" and "making it easier?"), `appopen` (live timer, locks at zero, charges halves).
- `limits` / `limitsonboard` (Blocked / Limited X opens × Y min / Free, pending changes "lands in …", strict 24h note), StrictCard (all states, for the You tab), `suggestion`, `tired`, `break`, `needit`.
- All rules come from the ported rules engine in Models/ (halves, 2-minute continuation, pass, borrow, strict).
- Screenshots: `screenshots/phase-4/`. Debug flags: `-outofopens`, `-passused`, `-strict`, `-strictending`, `-pending`, `-banner`, `-waitdone`, `-bypass pass|borrow`, `-reason x`, `-whyreason id`, `-whystage reason|what|push|length`, `-whylength quick|full`, `-why x`, `-appkind pass|always`, `-burned m`, `-loosen`, `-limitsscroll app|bottom`, `-limitsmode app=mode`, `-breakmins n`, `-needpick x`, `-suggestnth n`, `-screen strictcard` (+ `-strictpicking/-strictshowing/-strictconfirm`).

Couldn't match exactly:
- The web's AppOpen has no "time's up" screen (it goes home at zero), so neither does iOS.
- The "making it easier?" overlay's blur is a frosted layer, a bit softer than the web's 3px backdrop blur.
- The banner slides to the same spot as the web, which on iPhone overlaps the clock.

**Question for you:** nothing on the web ever opens the `needit` screen ("i need it for something"). It's ported but unreachable, same as the web. Should it be wired up somewhere (e.g. from intercept), or removed?

## Phase 5: Progress, XP, levels, skins, themes, You ✅
- `progress` (level card + XP bar, where your time goes, stats, time-back tiles, the week card with theme decorations), `pickrilo` (23 skins in a grid, locked by level / Pro), `levelup` (confetti, wear it / later), `sharecard`, `buddies` (invite code only; friends see mood + streak, never numbers).
- `you` (level card, theme grid, about you chips, when you scroll the most, apps + add-app sheet, Creator Mode, schedule, nightly check-in time, calendar, buddies, strict card, limits + goal, replay tour, plan, start over, demo buttons), `nighttime`, `calendar` (fake connect with the fake iOS permission alert).
- `talkchat` (chat with Rilo, quick chips, scripted replies) and `nightcheckin` (today → tomorrow → first-week question → tasks pulled into tomorrow's plan).
- Talk/check-in voice goes through a `SpeechInput` protocol (Models/SpeechInput.swift). Right now it's the demo version (off by default, so it's typing only, exactly like the web; `-voice` shows the old mic UI with a canned line). Phase 7 plugs in Apple Speech.
- Tour targets on progress, pickrilo and you are all attached, so the whole Meet Rilo tour now points at real elements.
- Screenshots: `screenshots/phase-5/`. Debug flags: see the header comment in `Models/DemoSeed.swift` (`-youscroll id`, `-picksel skin`, `-pickscroll`, `-buddycode`, `-buddyfriends n`, `-talksay "a|b"`, `-checkstep N`, `-voice`, `-listening`, …). Any `-screen` launch starts from clean saved state.

Couldn't match exactly:
- The web removed talk-to-text on Nov 1 (Safari's speech API didn't work on iPhone), so the web is typing only. iOS matches that until Phase 7 adds real speech.
- The share card on the web has an invalid CSS fill, so it's see-through. iOS copies that look. **Question:** should the card have a solid background?
- The web opens the add-app sheet inside the apps card (a side effect of an animation). iOS opens it full screen like onboarding.
- Check-in's text field doesn't auto-open the keyboard (the web's autofocus doesn't on iPhone either).

## Phase 6: Paywall + settings ✅
- `paywall` / `upgrade`: the same copy and layout; yearly is picked by default, then monthly and free. One button does whatever row is picked. From onboarding it goes on to the hand-off → home → tour. From settings it goes back where it came from. The "buy" step is in one place (`Models/PurchaseService.swift`; the demo version always says yes) so StoreKit can drop in (Phase 7).
- `results`: the hidden tester stats screen (taps per group, last tap, saved state, reset). The web reaches it only at the `/results` address, so on iOS it's `-screen results`. Nothing visible was added.
- Settings sweep: a DEBUG check (`-screen you -settingscheck`, `Models/SettingsCheck.swift`) runs every You-tab action (theme, goal, bedtime, school, focus, night check-in time, Creator Mode, strict on/24h/keep/off, upgrade → back, free → back, locked theme → paywall, trial → Pro, replay tour, start over). All pass.
- Screenshots: `screenshots/phase-6/`.

Couldn't match exactly:
- Results' "back to the app" goes to Welcome (on the web, reloading starts there).

**Question for you:** the paywall (web and iOS) says "free watches 5" apps, but AGENTS.md says Free is 2 apps. Which is right? I kept the web's 5.

## Phase 7: Make it a real app ✅
- **Saving:** everything is saved on the phone (UserDefaults JSON) and comes back after closing the app. Mid-onboarding it reopens on the same step with your answers. After onboarding it reopens on home. On a new day it runs the day roll-over (history, streak, XP) and shows the day summary. It saves when the app goes to the background. A broken save starts fresh instead of crashing. "Start over" wipes it all. (`Models/Storage.swift`, `AppState+Saving.swift`)
- **Notifications** (local only, `Models/Notifications.swift`): iOS asks right after "allow" on the Screen Time step (no extra screen). Reminders are only scheduled once you've said yes:
  - nightly check-in (Pro) at your check-in time: "check in with rilo" / "how'd today go?" → opens the check-in
  - tomorrow's first-week question (days 1–7) at 8:00 (school question) or 16:00 (the others): the question + its sub-line → plan/home
  - bedtime (if on) at bedtime: "bedtime mode" / "rilo's asleep. so should you be."
  - **Question:** 8:00 and 16:00 are my picks for the question reminders. Change them if you like.
- **Talk to Rilo with your voice:** real on-device speech-to-text (Apple Speech). Hold the mic (or hold Rilo in the check-in) to talk and let go to send. Mic + speech permission is asked the first time you press it. If you say no, it's typing only, like the web. Replies are still scripted. (`Models/AppleSpeechInput.swift`)
- **Haptics:** a light tap on every button, a soft one when you tap Rilo, success on level up / Pro / goal hit, warning on the shield / out of opens. The pop-in and screen-change animations were retimed to match the web (0.3s).
- **App icon + launch screen:** the Rilo icon from phase 1 (the web has none; Xcode makes every size from the 1024 image). The launch screen is the original Rilo on the grass-sky blue. The iPhone app is portrait only.
- **Paywall with real StoreKit 2:** `Models/PurchaseService.swift` (`StoreKitPurchaseService`): products `com.ethandunn.rilo.pro.monthly` ($4.99/mo) and `com.ethandunn.rilo.pro.yearly` ($39.99/yr), both with a 7-day free trial. Real prices show when the store answers. There's a small "restore purchases" link (Apple requires one). Pro turns on when bought and off when it ends. Local test file: `Rilo/Config/Rilo.storekit`, wired into the shared Rilo scheme.
- **Tester switch:** `Models/FeatureFlags.swift` → `TESTERS_UNLOCK_ALL = true` unlocks every Pro feature, skin and theme. **Set it to false before the real release.** (DEBUG `-gated` turns the locks back on for one launch.)
- Screenshots: `screenshots/phase-7/`.

Not checked / needs you:
- **Purchases can only be tested by running from Xcode** (not from the command line). In Xcode: Product ▸ Scheme ▸ Edit Scheme ▸ Run ▸ Options ▸ StoreKit Configuration should say `Rilo.storekit` (pick it if it's blank). Then run → paywall → "start 7-day free trial" → Pro turns on. Debug ▸ StoreKit ▸ Manage Transactions lets you refund/expire it.
- **The voice can only really be tested on your iPhone** (the simulator has no real mic input).
- The notification banner itself isn't screenshotted: iOS's "Allow" button can't be tapped by the tools here.
- **Question:** the tour's "do you post?" answer gives Pro for free (the web demo does this). With real StoreKit, that free Pro goes away on the next launch. Should that answer just turn Creator Mode on instead? (With the tester switch on, nobody notices yet.)

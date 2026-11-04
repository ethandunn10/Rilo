# Rilo iPhone port: plan

This is the plan for copying the web demo (`app/`, live at tryrilo.vercel.app) into the native SwiftUI app in `Rilo/` **one-to-one**. That means the same screens, flow, copy, art, colors, fonts and rules. Nothing gets redesigned.

`app/` is never modified. It's only read and run locally (`npx vite --port 5199`) so its screens can be screenshotted for comparison.

## How the iOS app is organized

```
Rilo/Rilo/
  RiloApp.swift, ContentView.swift   app entry + root router
  Theme/        colors (index.css tokens), fonts (Fredoka/Inter/Nunito), themes (lib/themes.js)
  Components/   RiloView, SkyView/ThemeDecor/HillsView, TabBar, BackButton, Styles (sticker cards,
                pill button, tap-shrink), SVGPath (draws the web's exact SVG path data), Motion,
                plus ports of app/src/components/* as they're needed
  Models/       ALL fake/demo data and rules: ports of app/src/lib/*.js and app/src/demo/mockAI.js,
                plus AppState (the state + actions that live in App.jsx). Swap these for real data later.
  Views/        one file per screen (app/src/screens/*), grouped Onboarding/, Home/, Intercept/,
                Progress/, You/, Paywall/, Extras/
  Fonts/        bundled .ttf files, registered at launch (no Info.plist change)
  Assets.xcassets/Rilo/   every Rilo skin × mood as PNG, rendered from the real SVGs
```

## Screen inventory, by phase

Screen names below are the web's router names (`App.jsx` `render()`).

### Phase 1: Foundation
- Colors: `--ink #12301A`, greens, `--card #FFFBF1`, `--line`, plus the inline colors screens use.
- Fonts: Fredoka 500/600/700, Inter 500/600/700, Nunito 500/700/800/900 (same faces the web loads from Google Fonts).
- Themes (`lib/themes.js`): grass (free), bamboo, sakura, sunset, snow (Pro). Sky gradient, hills, sun, butterflies, falling leaves/petals/snow, bamboo, sakura branch, birds, wildflowers.
- `Sky` (hills tall/mid/low, tone day/dusk), `ThemeDecor`, the hills Welcome/Home paint themselves.
- Rilo art: 23 skins × 7 moods (`coach wave proud curious sleepy letdown angry`) rendered from `app/src/rilo/sprites.js` (the exact markup the web shows, headband fixes included). The built-in SVG animations are replayed: the wave arm is its own layer and rotates −12°→14° around the shoulder, and angry shakes. Rilo motion: idle bob, jump, none. Tapping him squishes him and he says one of his lines (`lib/riloLines.js`).
- App icon: the web has none, so it's built from the original Rilo (full mascot, arms, RILO headband) on the grass sky.
- Shared bits: sticker card, white pill button, tap-shrink, back button, tab bar.

### Phase 2: Onboarding (same order as `App.jsx`)
1. `welcome` (Welcome)
2. `name` (Name, no confirm)
3. `pickapps` (PickApps + AppPicker/AppSheet + AppLogo)
4. `permission` (Permission: fake iOS Screen Time sheet, allow / don't allow / try again / skip)
5. `crunching` (Crunching, 1.5s dots)
6. `rather` ("what would you rather spend it on?", ChipPicker)
7. `yournumber` (YourNumber: the hit → the flip → the promise, animated pile of days and count-up)
8. `yourplan` (YourPlan: limits + what to do instead, GoalStepper, Pro parts locked) → `limitsonboard` (Limits, "edit")
9. `paywall` (Paywall, in Phase 6, but onboarding routes to it)
10. RiloHandoff (Rilo hops across), then `home`, then MeetRiloTour runs once

Every step has a back button.

### Phase 3: Home + tab bar
- `home`: Rilo big with his mood (tappable), today's screen time vs goal, the user's apps with opens circles (`Opens`), one "do this instead" card, and the notes (saved/over), step-down, and strict suggestion as the web shows them.
- TabBar: home / plan / Rilo tile (→ `pickrilo`) / progress / you.
- `plan` (Plan + ScheduleCard + ScheduleAsk + AskCard + StepDown), `creator` (CreatorMode).
- MeetRiloTour (one green box, rest dimmed, walks home → plan → progress → pickrilo → you).
- DemoPanel (the floating "demo" remote control, same buttons).

### Phase 4: Blocked app pop-up + rules
- `shield` (Shield, the iOS-style block screen) + Banner (fake notification) → `intercept` (Intercept: the pop-up, reasons, emergency pass, borrow ½ open, "limit it").
- `whyopen` (WhyOpen: "what are you opening this for?", Quick ½ / Full 1), BypassGuilt.
- `appopen` (AppOpen: the fake running app with its timer).
- `suggestion`, `tired`, `break`, `needit`.
- `limits` (Limits + StrictCard): Always allowed / Blocked / Limited (X opens × Y min) / Free.
- Rules engine (`lib/limits.js`): halves, 2-minute continuation, one session ≤ 1 open, emergency pass (1/day, 5 min, −20 XP), borrow ½ from tomorrow (normal mode only), strict mode (no halves, 24-hour wait to loosen or turn off, no borrowing; stricter is instant), pending changes, weekly step-down, plan check.
- `daysummary` (DaySummary).

### Phase 5: Progress, XP, levels, skins, themes, You
- `progress` (Progress + Breakdown), XP/levels (`lib/levels.js`: 100 levels, 23 skins by level), `levelup` (LevelUp), `pickrilo` (PickRilo), themes picker.
- `you` (You: about you, apps, time/goal, bedtime, school, focus, night check-in time, buddies, calendar, strict, Creator Mode toggle, replay tour, demo buttons, start over).
- `nightcheckin` (NightCheckIn), `nighttime` (NightTime), `calendar` (CalendarConnect), `sharecard` (ShareCard), `buddies` (Buddies), `talkchat` (Talk).

### Phase 6: Paywall + settings
- `paywall` / `upgrade` (Paywall: $4.99/mo or $39.99/yr, 7-day free trial; "start free trial" makes you Pro, which is fake and takes no payment). Back returns to wherever it was opened from.
- The settings that live on the You tab, plus Results (hidden tester stats screen).

## What can't work the same way on iPhone, and what the port does instead

| Web | iPhone port |
|---|---|
| SVG art inlined with SMIL animations | PNG renders of the exact same SVGs. The wave arm is split into its own layer and rotated in SwiftUI; the angry shake is an offset. They look the same and move the same. |
| CSS @keyframes (bob, jump, squish, rise, leaf-fall, butterflies…) | Replayed with `TimelineView` using the same timings and curves (`Components/Motion.swift`). |
| Web fonts from Google Fonts | Same fonts bundled as static .ttf weights, registered at launch. |
| 390×844 frame, no status bar | Real iPhone safe areas. Backgrounds go edge to edge, content sits inside the safe area, and the web's top padding is reduced by the ~47pt status bar the designs assumed. |
| localStorage | `UserDefaults` (JSON) in `Models/Storage.swift`. Like the web, onboarding restarts each launch where the web does. |
| Screen slide/pop transitions | The same "pop in / sink out" transition in SwiftUI. |
| Real Screen Time, app blocking, shields | Faked exactly like the web: apps and usage are demo data, and "opening" an app shows the fake shield / pop-up / app-open screens. **No FamilyControls/ManagedSettings yet** (needs the paid Apple account + entitlement). |
| Voice (talk to Rilo), mic | Typed input only, same fake replies (`mockAI`). Speech needs permissions; noted for later. |
| Calendar connect | Fake, same demo calendar. No EventKit. |
| Payments | Fake paywall, same as the web. No StoreKit. |
| `/results` hidden route, `track()` taps | Kept as a hidden screen reachable from the demo panel. Taps are counted locally. |
| Share card "share" | Shows the card. The real iOS share sheet can come later. |

## After the one-to-one port (added later by Ethan)
These come after phases 1–6 and go beyond the web demo. Max 2 helper agents and 1 simulator at a time.

- **Phase 7: make it a real app (free account).** Everything saves on the phone across relaunches. Local notifications for check-ins/reminders, with the permission ask in onboarding (web copy). Real on-device speech-to-text (Speech framework + mic permission) for Talk, with replies still scripted. Haptics. App icon (all sizes) + launch screen. StoreKit 2 paywall ($4.99/mo, $39.99/yr, 7-day trial) with a local `.storekit` file for simulator testing, plus one `UNLOCK_ALL` switch for testers.
- **Phase 8: Screen Time blocking, ready to switch on.** One `ScreenTimeService`. The demo version is used now. The real version (FamilyControls, FamilyActivityPicker, ManagedSettings shields, DeviceActivity schedules, shield + shield-action extensions) is written but kept out of the build until the paid account. `SETUP_AFTER_PAID_ACCOUNT.md`. A home-screen widget if the free account allows it.
- **Phase 9: polish + QA.** Every flow as a new user, on iPhone SE and Pro Max, VoiceOver labels, bigger text sizes, no placeholders or dead buttons.
- **Phase 10: launch prep.** `PrivacyInfo.xcprivacy`, `APP_STORE.md` (listing, 13+ age rating, privacy policy draft), App Store screenshots in `screenshots/app-store/`, `TESTFLIGHT_NOTES.md`.

Note: Phase 7 changes two things in the table above on purpose. Saving now keeps onboarding progress instead of restarting like the web. Payments use real StoreKit code, tested only with the local StoreKit file. Nothing is charged.

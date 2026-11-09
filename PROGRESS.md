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

**Answered (Nov 9):** the unreachable `needit` screen was removed from iOS.

## Phase 5: Progress, XP, levels, skins, themes, You ✅
- `progress` (level card + XP bar, where your time goes, stats, time-back tiles, the week card with theme decorations), `pickrilo` (23 skins in a grid, locked by level / Pro), `levelup` (confetti, wear it / later), `sharecard`, `buddies` (invite code only; friends see mood + streak, never numbers).
- `you` (level card, theme grid, about you chips, when you scroll the most, apps + add-app sheet, Creator Mode, schedule, nightly check-in time, calendar, buddies, strict card, limits + goal, replay tour, plan, start over, demo buttons), `nighttime`, `calendar` (fake connect with the fake iOS permission alert).
- `talkchat` (chat with Rilo, quick chips, scripted replies) and `nightcheckin` (today → tomorrow → first-week question → tasks pulled into tomorrow's plan).
- Talk/check-in voice goes through a `SpeechInput` protocol (Models/SpeechInput.swift). Right now it's the demo version (off by default, so it's typing only, exactly like the web; `-voice` shows the old mic UI with a canned line). Phase 7 plugs in Apple Speech.
- Tour targets on progress, pickrilo and you are all attached, so the whole Meet Rilo tour now points at real elements.
- Screenshots: `screenshots/phase-5/`. Debug flags: see the header comment in `Models/DemoSeed.swift` (`-youscroll id`, `-picksel skin`, `-pickscroll`, `-buddycode`, `-buddyfriends n`, `-talksay "a|b"`, `-checkstep N`, `-voice`, `-listening`, …). Any `-screen` launch starts from clean saved state.

Couldn't match exactly:
- The web removed talk-to-text on Nov 1 (Safari's speech API didn't work on iPhone), so the web is typing only. iOS matches that until Phase 7 adds real speech.
- The share card on the web has an invalid CSS fill, so it's see-through. **Answered (Nov 9):** iOS now draws it solid.
- The web opens the add-app sheet inside the apps card (a side effect of an animation). iOS opens it full screen like onboarding.
- Check-in's text field doesn't auto-open the keyboard (the web's autofocus doesn't on iPhone either).

## Phase 6: Paywall + settings ✅
- `paywall` / `upgrade`: the same copy and layout; yearly is picked by default, then monthly and free. One button does whatever row is picked. From onboarding it goes on to the hand-off → home → tour. From settings it goes back where it came from. The "buy" step is in one place (`Models/PurchaseService.swift`; the demo version always says yes) so StoreKit can drop in (Phase 7).
- `results`: the hidden tester stats screen (taps per group, last tap, saved state, reset). The web reaches it only at the `/results` address, so on iOS it's `-screen results`. Nothing visible was added.
- Settings sweep: a DEBUG check (`-screen you -settingscheck`, `Models/SettingsCheck.swift`) runs every You-tab action (theme, goal, bedtime, school, focus, night check-in time, Creator Mode, strict on/24h/keep/off, upgrade → back, free → back, locked theme → paywall, trial → Pro, replay tour, start over). All pass.
- Screenshots: `screenshots/phase-6/`.

Couldn't match exactly:
- Results' "back to the app" goes to Welcome (on the web, reloading starts there).

**Answered:** free watches **3** apps (`FREE_MAX_APPS = 3`), on the web, iOS, the paywall and AGENTS.md.

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
- **Tester switch:** `Models/FeatureFlags.swift` → `TESTERS_UNLOCK_ALL = true` unlocks every Pro feature, skin and theme, **in Debug builds only** (Nov 5: Release / TestFlight / App Store builds always have real gating and no demo panel or demo buttons). (DEBUG `-gated` turns the locks back on for one launch.)
- Screenshots: `screenshots/phase-7/`.

Not checked / needs you:
- **Purchases can only be tested by running from Xcode** (not from the command line). In Xcode: Product ▸ Scheme ▸ Edit Scheme ▸ Run ▸ Options ▸ StoreKit Configuration should say `Rilo.storekit` (pick it if it's blank). Then run → paywall → "start 7-day free trial" → Pro turns on. Debug ▸ StoreKit ▸ Manage Transactions lets you refund/expire it.
- **The voice can only really be tested on your iPhone** (the simulator has no real mic input).
- The notification banner itself isn't screenshotted: iOS's "Allow" button can't be tapped by the tools here.
- **Answered (Nov 9):** the tour's "do you post?" answer now only turns Creator Mode on, no free Pro.

## Phase 8: Screen Time blocking, ready to switch on ✅
- All blocking goes through one `ScreenTimeService` (`Rilo/Rilo/Services/ScreenTimeService.swift`). The app uses `DemoScreenTimeService` now, so everything works exactly as before (checked with -selfcheck, -settingscheck and before/after pixel diffs in `screenshots/phase-8/`).
- The real version is written and switched off by one line, `FeatureFlags.REAL_SCREEN_TIME` (Nov 5: the app half is now built into the app every time, in `Rilo/Rilo/ScreenTimeReal/`; the extensions wait in `Rilo/ScreenTimeReal/`). It covers:
  - Family Controls permission
  - Apple's app picker
  - ManagedSettings shields
  - DeviceActivity timers for opens/minutes
  - the shield screen with Rilo's copy ("talk to rilo" / "close")
  - the shield button action
  - the timer monitor
  - the shared App Group data
  - the home-screen widget (Rilo's face + today's mood, small + medium)

  All of it typechecks against the iOS 27.2 SDK with zero errors.
- **The widget needs the paid account** (it reads Rilo's mood through an App Group, which the free account can't use, and adding its target now would break running on your iPhone), so it's in the setup doc.
- **`SETUP_AFTER_PAID_ACCOUNT.md`** is the step-by-step list for switching it all on.
- Apple's rules (not bugs): Rilo never learns real app names (Apple only gives a label), and timer windows are 15 minutes minimum, so "reopen within 2 minutes" can stretch to 15 for short opens.

## Phase 9: Polish + QA ✅ (flow check being finished, see below)
- **Small and big phones:** every screen and sub-state (71) was shot on an iPhone SE and an iPhone 18 Pro Max, and every problem was fixed:
  - SE top/bottom padding (home-button phones get their own spacing)
  - the "demo" button no longer covers buttons on the SE
  - the tab bar's bottom space on the SE
  - "your number" text no longer runs into the pile of days
  - "3h 12m a day" stays on one line
  - plan time cells show "3:15" instead of "3:…"
  - the share card shrinks to fit the SE
  - **option pickers get more room between rows on small phones** (the open tester complaint)

  The iPhone 17 look is unchanged.
- **Bigger text:** the fonts now follow the phone's Text Size setting, capped at the largest standard size (xxxLarge). The accessibility sizes above that broke words mid-line on the SE, so they show at xxxLarge.
- **VoiceOver:**
  - every button has a spoken label
  - Rilo reads as "rilo, proud" etc.
  - the opens circles read as "2 and a half opens left, 15 minutes each"
  - progress bars read their value
  - section titles are headers
  - decorations (sky, butterflies, confetti) are skipped
- **Dead buttons / placeholders:** none left. The share card's "save image" now really saves or shares the card image (with a photo permission line). The unused placeholder screen file is deleted.
- **Bugs fixed:** tapping "close app" (or "nice" on the day summary) very fast could leave you stuck on a screen with nothing to tap. A possible crash dividing by zero in the breakdown is fixed too.
- **Automatic checks:** `-flowcheck` (new) walks every flow: onboarding with back from every step, the tour, opening apps (quick/full/leave early/run out/pass/borrow/strict), plan, check-in, talk, levels, settings, paywall, start over, relaunch, new day. `-selfcheck` and `-settingscheck` too.
- Screenshots: `screenshots/phase-9/` (JPEG to keep the repo small): `se-*`, `promax-*`, `xxxl-*`, `axm-*`, `axl-*`, plus `before/`.

## Phase 10: Launch prep ✅
- `Rilo/Rilo/PrivacyInfo.xcprivacy`: privacy manifest. No tracking, no data collected; UserDefaults is the only "required reason" API (saving the app's own state).
- `APP_STORE.md`: name "Rilo: Screen Time Buddy", subtitle, description, keywords, a line for parents, category, age-rating answers (pick 13+), the "Data Not Collected" privacy label, and a draft privacy policy (everything stays on the phone; the mic is only on while you hold the talk button).
- `screenshots/app-store/6.9-inch/`: 9 App Store screenshots at 1320×2868 (the one size Apple requires; it scales them for smaller iPhones). The order is in its README.
- `TESTFLIGHT_NOTES.md`: "What to Test" for testers, plus your checklist before each build.

---

# 🌙 Where things stand (end of the overnight run)

**Reached: all 10 phases done.** Branch `ios-port`, 18 commits, **nothing pushed**, nothing in `app/` changed.

## How to run it
1. Open `Rilo/Rilo.xcodeproj` in Xcode.
2. At the top, pick the **Rilo** scheme and the **iPhone 17** simulator (or your iPhone; see below).
3. Press **Run** (▶). It opens on Welcome; go through onboarding like a new user.
- Close and reopen it: it comes back where you were. To start fresh, use "start over" at the bottom of the You tab.
- The "demo" button (bottom left) is the tester remote, the same as the web demo.
- Shortcuts for checking one screen: Product ▸ Scheme ▸ Edit Scheme ▸ Run ▸ Arguments ▸ add e.g. `-screen home` (any screen name; all the options are listed at the top of `Rilo/Rilo/Models/DemoSeed.swift`).
- Automatic checks (debug builds): `-flowcheck` (134 flow steps), `-screen you -settingscheck` (30), `-selfcheck`. All pass.

## What's done
- **The one-to-one port (phases 1–6):** every web screen, with the same art, moods, skins, themes, fonts, copy, rules and flow. There are side-by-side iOS/web screenshots for every screen in `screenshots/phase-1..6/`.
- **A real app (phase 7):** everything saves, local notifications, real on-device voice for Talk (hold to talk), haptics, a launch screen, and a StoreKit 2 paywall with a local test file. The tester switch is ON (everything unlocked).
- **Screen Time, ready to switch on (phase 8):** one ScreenTimeService. The demo version runs now; the real Family Controls code, the 3 extensions and the widget are written and switched off.
- **Polish (phase 9):** fixes for SE and Pro Max, bigger-text support, VoiceOver labels, no dead buttons, flow bugs fixed.
- **Launch prep (phase 10):** the privacy manifest, the App Store listing + privacy policy, App Store screenshots, TestFlight notes.

## What needs the $99 account
Everything is listed step by step in **`SETUP_AFTER_PAID_ACCOUNT.md`**:
- **Real app blocking** (the Family Controls permission from Apple, plus the 3 extensions)
- **The home-screen widget** (needs an App Group)
- **Selling Rilo Pro** (the subscriptions in App Store Connect, the Paid Apps agreement)
- **TestFlight** and the App Store

## What's left / not checked
- **Real blocking** hasn't run on a phone yet (it can't without the paid account). The code typechecks against the real iOS SDK, but expect some fixing on the first real test.
- **Voice** and **purchases** couldn't be tried here: voice needs a real iPhone, and purchases need a run from Xcode. The steps are below.
- The **StoreKit test file** link in the scheme couldn't be verified from the command line. Check it once: Product ▸ Scheme ▸ Edit Scheme ▸ Run ▸ Options ▸ StoreKit Configuration should say `Rilo.storekit` (pick it if it's blank).
- The notification banner itself wasn't screenshotted (the tools can't tap iOS's "Allow").
- Before the real release: nothing to flip (Nov 5). The tester unlock and demo panel only exist in Debug builds.

## After launch: accounts + Supabase (moved Nov 5, not started)
**Decision Nov 5: v1 launches with everything on the phone (no accounts, no server), matching rilo.one/privacy and "Data Not Collected". Supabase comes in an update after launch, once real users ask for it.**

Right now each person's Rilo lives only on their own phone (no account, no server). In a post-launch update, add Supabase for:
- **Sign in** (Sign in with Apple, so no passwords), so a person's Rilo follows them to a new phone or iPad and survives deleting the app.
- **Backup/sync** of what Rilo knows: profile, goals, plan, XP and level, streak, settings, what Rilo remembers.
- **Real buddy mode:** invite codes, and friends see mood and streak only, never numbers.

When that happens, update the privacy policy in APP_STORE.md, the App Store privacy label ("Data Not Collected" changes), PrivacyInfo.xcprivacy, and the 13+ age rating answers. Teens' data will be on a server, so keep it minimal and add "delete my account" in the You tab (Apple requires it).

## 📱 First 3 things to test on your phone tomorrow
(Plug in your iPhone, pick it at the top of Xcode, press Run. The free account works; if your phone asks, turn on Settings ▸ Privacy & Security ▸ Developer Mode, and trust your developer profile in Settings ▸ General ▸ VPN & Device Management.)
1. **Onboarding + saving:** go through setup start to finish (try a few back buttons), let the tour run, then swipe the app away and reopen it. Everything should still be there, and you land on home.
2. **Talk to Rilo with your voice:** tap Rilo (or "chat") on home, press the mic once to allow the mic + speech, then **hold** the mic, say "i like soccer", and let go. Your words should appear while you talk, and Rilo answers. Then try the nightly check-in (Plan tab) by holding Rilo.
3. **Notifications + the blocked-app flow:**
   - Allow notifications when asked (right after Screen Time in setup), then set the nightly check-in time in the You tab to 2 minutes from now and lock the phone. Rilo's reminder should show, and tapping it opens the check-in.
   - Then use the "demo" button ▸ open a blocked app, and try a quick (½) and a full open.
   - Bonus, in Xcode: open the paywall and buy the test subscription (it's fake money from the local StoreKit file).

## Questions for you (none of these block anything)
1. **App icon:** the web had none, so I made one (the original Rilo, with arms and the RILO headband, on the grass sky). Is it OK? It's the first thing to look at: `Rilo/Rilo/Assets.xcassets/AppIcon.appiconset/AppIcon.png`.
2. **Free plan apps:** answered: 3 apps everywhere (web, iOS, paywall, AGENTS.md).
3. ✅ **Done (Nov 9):** the unused `needit` screen ("i need it for something") was removed from the iOS app.
4. ✅ **Done (Nov 9):** the tour's "do you post?" now only turns Creator Mode on. It never gives Pro. Creator Mode stays a Pro feature, and anyone can switch it off on the You tab.
5. ✅ **Done (Nov 9):** the share card on iOS now has a solid background (the theme's sky into its middle hill colour, the same as the saved image). The web still has the CSS bug.
6. ✅ **Done (Nov 9, iOS only):** "i want to read more" → "added read more." Both the hobby and the goal are still saved; the reply just names it once (same for "learn to code"). The web still says it twice.
7. **Reminder times** for Rilo's first-week questions: I picked 8:00 (the school one) and 16:00 (the rest). OK?
8. **Web bug found:** on "your number", the back/skip buttons on the first two beats are hidden behind the sky on the web (they're missing `position: relative`). iOS shows them. Worth fixing on the web.
9. **Privacy policy:** it needs a support email and somewhere to host it (`APP_STORE.md`, bottom).
10. The nested git folder that came with the new Xcode project was moved to `/Users/ethandunn/Projects/rilo-xcode-initial-git-backup` (it would have hidden the iOS files from this repo). You can delete it if you don't need it.

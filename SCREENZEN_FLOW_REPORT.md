# ScreenZen-style flow: report (branch `screenzen-flow`)

Everything is on the `screenzen-flow` branch, not on `main`, and nothing is pushed. Signing, teams and capabilities are untouched. One uncommitted change of yours is left alone: Time Sensitive in `Rilo.entitlements`.

What I checked here:
- Simulator and real-iPhone (Release) builds both pass with 0 errors.
- The in-app flow check passes.
- I screenshotted the relock screen and the first tour step.
- **Not checked:** anything on a real phone. What iOS allows, and why, is in `SCREENZEN_RESEARCH.md`.

## What I built

**1. Shield (Rilo's colours, every text colour set)**
- Cream background, panda, dark-green title **"hey. instagram again?"**.
- Subtitle **"2 opens left today · 10 min each"**.
- Buttons: green **"open instagram (5s)"** with white text, and **"never mind"** in dark text.
- **Countdown:**
  - The 1st tap starts it, and the shield redraws as **"hold on. 5 seconds."**.
  - A tap after the wait unlocks the app.
  - Apple doesn't let a shield tick by itself, so the seconds update on each tap.
  - The wait grows 5 → 10 → 15 → 20s with each open that day; strict mode adds 10s.
- **Locked apps** (no opens, blocked, bedtime / school / focus): **"talk to rilo"** opens Rilo straight on that app's check-in. This uses iOS 26.5's new shield-opens-the-app response; no notification in between.

**2. Unlock**
- The shield comes off that one app only, for one open (half an open if that's what's left).
- iOS's own timer puts the shield back when the minutes are used, even with Rilo closed.
- The open is counted, and Rilo charges it when the session ends.

**3. Live Activity** "instagram · 9:42 left" with Rilo
- Shows on the Lock Screen and in the Dynamic Island.
- iOS draws the countdown, so it ticks with Rilo closed. At the end it says "time's up on …".
- **Tapping it opens Rilo on the relock screen:**
  - time left
  - **what was it for?** (reason chips)
  - **done? relock it**
  - **talk to rilo**
- **Who starts it:**
  - The shield tries to start it.
  - If iOS refuses an extension (likely, see the research doc), you get a notification instead ("tap here when you're done").
  - Rilo then starts the Live Activity the next time it's opened during that open.
  - Opens started inside Rilo always get one.
- **App names:** iOS never tells Rilo an app's name. The Live Activity says "your app" unless you named the app in You ▸ advanced ▸ "name my apps". Rilo's own screens show the real name, drawn by iOS.

**4. Onboarding**
- Welcome → name → permission → pick apps → hours → your number → rather → your plan.
- **Permission comes before pick apps in real mode on purpose.** Apple's app picker only works once Screen Time is allowed. Demo mode keeps pick apps → permission.
- **No Shortcuts or app-matching steps any more.** Both are optional, under You ▸ apps you picked ▸ **advanced (optional)**.
- **Notifications are asked right after picking apps.** The screen first says "next, allow notifications so rilo can check in when you open these apps."
- "building your plan…" is 1.5s.

**5. Tour:** 5 steps, Home → Progress → Pick Rilo, with skip.
1. **your apps:** "these are your apps. you get a few opens a day, i'll check in each time."
2. **something to do instead:** "and something to do instead of scrolling."
3. **talk:** "tap me any time to talk."
4. **xp:** "every day under your goal earns xp."
5. **skins:** "level up and you unlock a new me."

The "do you post a lot?" question is gone, and Creator Mode stays off unless turned on in You.

**6. App names in dark text** everywhere iOS draws them (they went white in dark mode).

Also updated: `FAMILY_CONTROLS_REQUEST.txt`, so it describes the countdown, the unlock, the Live Activity and optional app names.

## What I decided
- **The shield's countdown counts per tap.** iOS has no way to animate or refresh a shield on a timer.
- **The Live Activity is tried from the extension, with a real fallback.** I didn't fake it.
- **The Live Activity doesn't read app names from the shield.** That would get around Apple's privacy design and the promise in your request text.
- **Live Activities are switched on with a plist key, not a capability.** That's `NSSupportsLiveActivities` in `Config/Info.plist`, plus the shield extension's plist for the device test.

## Nothing to click in Xcode
Live Activities don't need a capability. If you haven't yet, the Time Sensitive capability on RiloShieldAction still makes the fallback banner break through Focus.

## Phone test (10 steps)
1. Check out `screenzen-flow`, delete Rilo from the phone, then press Run in Xcode.
2. **Onboarding:**
   - welcome → name → **allow** Screen Time → pick Instagram + one more.
   - Read the notifications line, tap **continue** → **allow** notifications.
   - Then hours → your number → rather → your plan → finish.
   - **Expect:** no Shortcuts or app-matching screens.
3. **Tour:** 5 steps (apps, something to do instead, talk, xp, skins), visiting only Home, Progress and Pick Rilo. **skip** works.
4. **Shield:**
   - Open Instagram from the home screen.
   - **Expect:** cream shield, panda, "hey. instagram again?", "N opens left today · 10 min each", "open instagram (5s)" / "never mind".
   - Try it in dark mode too: all text should stay readable.
5. **Countdown:**
   - Tap **open instagram (5s)**: the shield should switch to "hold on. 5 seconds.".
   - Tap again right away: it should show fewer seconds.
   - Wait 5s and tap: Instagram should be usable straight away.
6. **Live Activity:**
   - **Expect:** "your app · 9:5x left" in the Dynamic Island.
   - If you see a notification instead, open Rilo. The Live Activity should appear then.
   - Check You ▸ apps you picked ▸ advanced for the "live activity:" line and **send it to me**. It tells us whether the shield can start it directly.
7. **Relock:** tap the Live Activity. Rilo should open on "10:00 left"-style time, **what was it for?**, **done? relock it**, **talk to rilo**. Tap **done? relock it**, go back to Instagram, and the shield should be up.
8. **Time's up:**
   - Unlock again, stay in Instagram until the minutes run out.
   - **Expect:** the shield comes back ("time's up on instagram").
   - **Expect:** the next open's wait is longer (10s).
9. **Out of opens:**
   - Use up all opens. The shield should say "no opens left for instagram." with **talk to rilo**.
   - Tapping it should open Rilo straight on the check-in with the emergency pass.
   - If it doesn't open Rilo, note that.
10. **Names and never mind:**
   - In You ▸ advanced ▸ "name my apps", name Instagram, unlock again. The Live Activity should now say "instagram · … left".
   - Tap **never mind** on a shield: the app closes and xp goes up next time you open Rilo.

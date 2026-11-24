# Morning report — real Screen Time pass

Everything is committed on `main`, one commit per part, so you can roll any of them back.
Nothing was pushed. No signing, team or capability settings were changed.

| Commit | What |
|---|---|
| `e5104a0` | Part 1: no demo screens or fake data with real Screen Time |
| `ceb3af3` | Parts 2+3: Shortcuts check-in, app matching, one check-in screen, better shield |
| `f50c6ab` | Part 4: "your number" as one big number + a filling bar |
| `f624111` | Part 6: Family Controls request text |
| `be900e6` | Part 5 QA: local-time day, every real session charged once |
| `90e2499` | Part 2 follow-up: safety net for a deleted automation + "use shield" per app |
| `eacf36d` | Part 5 QA: screen fixes from the screenshot pass |
| _(this report)_ | MORNING_REPORT.md |

(Part 4's hours question and "building your plan…" were already done in `bb019ec`.)

---

## What I built and fixed

### Part 1 — demo leaks in real mode
What you hit: after the check-in, real mode still went to Rilo's **pretend "app is running" screen** (a fake Instagram timer with "demo: burn 5 min"). Every leak I found, and the fix:

| Leak | Fix |
|---|---|
| Pretend "app running" screen + "demo: burn 5 min" after a check-in | New **real session screen**: time left (real clock), "open instagram" (takes you back in), "i'm done". iOS's own timer re-locks the app. |
| Home app rows "pretend you opened X" | In real mode they start a real check-in for that app. |
| Creator Mode (a simulated Instagram) and its tour step | Hidden with real Screen Time. |
| Debug buttons (+500 xp, next day/week, fake calendar, "fill it in for me") | Only shown with demo Screen Time (still Debug-only). |
| Demo panel's simulate / usage / time-travel sections | Hidden in real mode; the pill only shows the real/demo toggle, jump-to and reset. |
| A "Demo Calendar" saved during demo testing | Shows no fake events in real mode. |

### Part 2 — Shortcuts check-in (ScreenZen-style)
- **"Rilo check-in" App Intent** with an app parameter. In Shortcuts: Automation → App → Instagram → Is Opened → Run Immediately → Rilo check-in (instagram).
- It runs in the background first and only brings Rilo forward when a check-in is due. It stays silent while that app's session is running (no bounce loop) and while that app's shield is up (so the shield and the check-in **never show together**).
- **"which app is which?"** step right after Apple's picker: Apple's label for each picked app + one-tap names (instagram, tiktok, youtube, snapchat, x, reddit, facebook, threads) + "other…" to type one. Saved on the phone only.
- **Guided setup** step: 5 big numbered steps, "open shortcuts", a live ✓ per app once its check-in has really run, "test it: open instagram", and "skip, use the shield". Also reachable later from You → your apps → "shortcut check-in" / "which app is which".
- **One check-in screen** for every way in (Shortcuts, the shield's notification, tapping an app on Home): Rilo with his mood, "what's it for?" reasons, opens left as dots, Rilo's one-line reply, and an **"open in 5s"** button that escalates (5s, 10s, 15s, 20s by opens of that app today; strict mode +10s).
  - **open** → one session (that app's minutes per open, or what's left), uses the open, and sends you straight back into the app.
  - **never mind** → +10 xp (first 3 a day) and back to Rilo's home.
  - **out of opens / blocked / bedtime-school-focus** → "you're out of opens today" (or the lock's reason), fresh opens at midnight, and the emergency pass rules (5 min, no opens, −20 xp, one a day) with a button if it can be used. No countdown.
- **How the shield and Shortcuts share the work** (per app):
  - Automation working → no shield, *except* when the app is out of opens, blocked, in a schedule, or its session time just ran out.
  - Session time runs out → the shield goes up ("time's up on instagram") because that's the only way iOS lets an app get someone out of another app. It comes down the moment you're back in Rilo or check in again.
  - No shields at all until onboarding is finished, so "test it" reaches the automation.

### Part 3 — the shield as backup
- **Look**: Rilo's cream background, deep-green "talk to rilo" button (white text stays readable; Rilo's light green fails contrast), "never mind", and a **square, trimmed panda** for every skin (new `rilo-shield-*` images made from the existing art, so the panda fills as much of Apple's fixed icon box as possible).
- **Copy** (Rilo's voice): "hey. instagram again?" / "2½ opens left today · 15 min each / talk to rilo first." Locked: "no opens left for instagram." / "fresh opens at midnight. talk to rilo about your emergency pass." Bedtime/school/focus: "bedtime. instagram can wait." / "opens again at 7:00am." After time-up: "time's up on instagram."
- **"never mind" on the shield** now counts as a win (same xp cap).
- **Why "talk to rilo" took 5–7 seconds or didn't fire, and the fixes:**
  1. The notification was scheduled on a 1-second timer → now delivered immediately.
  2. Every notification reused one ID, so iOS sometimes treated a second tap as an *update* and showed nothing → fresh ID each time, older shield banners cleared.
  3. Tapping the notification wasn't wired to anything. Rilo relied on reading a shared-storage event when it opened, which could lag or miss, so you landed on Home → the tap now goes straight to that app's check-in (the shared event is a backup; both are de-duplicated so an open is never counted twice).
  4. Then the old intercept made you wait 5s before the next screen → the check-in now opens directly; the wait is the countdown on the open button.
  5. It's marked **time-sensitive** (breaks through Focus) — needs one capability, see below.
- Notification text: "tap to talk to rilo about instagram." (uses the name you matched; "tap to talk to rilo." if you didn't).

### Part 4 — onboarding visuals
- "Your number" is now two big, simple beats: **"6 hrs a day / = 91 days / a year on your phone"** with a red bar of your year filling in, then **"cut to 3 hrs / = 46 days / back this year"** with a green bar. The falling pile animation is gone. The third beat (promise + per-app split) is unchanged.
- Already done earlier (`bb019ec`): "about how many hours a day are you on your phone?" drives every number; "building your plan…" instead of "crunching your numbers".

### Part 5 — QA
See the QA section further down.

### Part 6 — request text
`FAMILY_CONTROLS_REQUEST.txt` now matches the app: four bundle IDs, names only from what the user tells Rilo and never leaving the phone, the check-in intent and how it shares work with the shield, the shield's text and buttons, the widget, and the share image.

---

## Decisions I made on my own (and why)
**Part 1**
- **Creator Mode is hidden in real mode.** It simulates Instagram and can't be made real (iOS can't see inside other apps). It's still there with the demo toggle; un-hiding is one line in `YouView+Settings.swift`.
- **The demo pill stays in Debug builds even in real mode**, cut down to the real/demo toggle, jump-to and reset, so you can still switch modes. It's never in TestFlight/App Store builds.
- **Tapping an app on Home in real mode starts a real check-in** for it (counts as an open attempt), instead of being removed.

**Part 2**
- **One check-in screen for all three ways in** (Shortcuts, shield notification, Home). Normal opens skip the old intercept screen; the old one is kept only for demo mode.
- **Escalating wait: 5s → 10s → 15s → 20s** by how many times you've opened that app today; strict mode adds 10s. (There was no escalating wait in the code before; this is my version of "our escalating wait".)
- **"open" always gives one full open** (that app's minutes per open, or what's left if you only have half). The quick/full choice from the old flow is gone from this path to keep it to one tap.
- **"never mind" = +10 xp, only the first 3 a day**, so it can't be farmed by opening and closing an app. "alright, close it" when you're out of opens gives no xp (there was nothing to say no to).
- **"never mind" on the shield also counts as a win** (same cap).
- **An app counts as "automation set up" only once its check-in has actually run** (Rilo can't read the Shortcuts app). That's what the ✓ and "test it" are for.
- **Safety net for a deleted automation:** if an app whose check-in is the automation gets 2 minutes of use in a day with no Rilo session behind it, Rilo shields it again and moves it back to the shield. There's also a "use shield" button per app on the setup screen.
- **No shields at all until onboarding is finished**, so "test it" reaches the automation instead of a shield.
- **One automation per app**, because the check-in has to know which app was opened.
- **Matching step: 8 one-tap apps + "other…"** (typed). Typed names that match Rilo's longer list (discord, netflix, twitch, whatsapp, roblox, spotify, pinterest…) still get a link back into the app. "x" is labelled "x (twitter)" because a lone "x" looked like a close button.
- **The setup steps use numbered icons, not screenshots of Apple's screens.** Real screenshots of the Shortcuts app go out of date with every iOS update and would be easy to get wrong.
- **"never mind" can't quit Rilo** (iOS doesn't let apps close themselves); it goes to Rilo's home.
- **URL schemes:** TikTok tries `snssdk1233://` then `tiktok://`; X tries `twitter://` then `x://`. Not verified on a device yet.

**Part 3**
- **Shield background is solid cream (no blur)**, and the primary button is Rilo's deep green, because white text on Rilo's light green fails contrast.
- **New `rilo-shield-*` images**, trimmed and squared from the existing panda art for every skin. The original art is untouched.
- **Notification wording names the app only if you matched it**, since the shield's button extension never learns the app's name.

**Part 4**
- **"your number" became two simple beats** (time lost, then time back at your starting goal); the falling pile animation is gone. Days are rounded normally: 6h → 91 days, 3h saved → 46 days (your example said 45).

**Part 5 (bugs I found and fixed)**
- **Rilo's "day" was in UTC** (carried over from the web demo). In the US that made the day, fresh opens and the streak roll over at about 7–8pm Eastern / 4–5pm Pacific, hours before iOS's own midnight reset. It's the phone's local day now.
- **An open could go uncharged** if iOS ended the session while Rilo was closed or on another screen. Now every session is charged exactly once.
- **The midnight reset left yesterday's "no opens left" in the shield's text** until Rilo was opened. The midnight monitor now hands back opens by itself, and only on a real new day.
- **"rather" back button skipped two screens**; it now goes back one step.

---

## What you need to do (click by click)

1. **Turn on Time Sensitive Notifications** (so "talk to rilo" breaks through Focus). Without it everything works, the banner is just a normal one.
   1. Open `Rilo.xcodeproj` in Xcode.
   2. Click the blue **Rilo** project at the top of the left sidebar.
   3. Under **TARGETS**, click **RiloShieldAction**.
   4. Click the **Signing & Capabilities** tab.
   5. Click **+ Capability** (top left of that tab), type **Time Sensitive**, double-click **Time Sensitive Notifications**.
   6. Repeat steps 3–5 for the **Rilo** target.
   7. Build once (⌘B) so Xcode updates the provisioning profiles.
2. **Family Controls (Distribution)**: still needed before TestFlight/App Store. Paste `FAMILY_CONTROLS_REQUEST.txt` into Apple's request form and list the four bundle IDs in it.
3. **Commit `Claude outputs/`, `WAITLIST_EMAIL.md`, `screenshots/app-store/final/`?** They were untracked before this work; I left them alone.

---

## Known Apple limits
- **Rilo can't create the Shortcuts automation.** The user makes it in the Shortcuts app; Rilo can only open the Shortcuts app (not the new-automation screen) and explain the steps.
- **Rilo can't see whether an automation exists.** An app counts as "set up" the first time its check-in actually runs. If the user later deletes the automation, that app goes unchecked until they open You → "shortcut check-in" and the app is switched back, or the automation runs again. (There's no API to detect a deleted automation.)
- **One automation per app**: the check-in has to know which app opened.
- **"Notify When Run"** must be turned off by the user in each automation, or iOS shows a banner every time.
- **App names:** Apple never gives the app its picked apps' names. Rilo only knows what the user matched.
- **Shield:** Apple allows only a background colour/blur, one icon (iOS sets its size), title, subtitle and two button labels/colours. No fonts, layout, animation, extra buttons, and the buttons can't open Rilo — only a notification can.
- **The shield's button extension never learns the app's name**, so the notification uses the name the user matched.
- **Getting someone out of an app** is only possible with a shield, so when an automated app's time runs out its shield appears once.
- **Rilo can't close itself**: "never mind" goes to Rilo's home, and you swipe away.
- **Apps with no link back** (anything typed under "other" that isn't in Rilo's list, or apps without a URL scheme): the session still starts; Rilo says "open it from your home screen".
- **URL schemes I couldn't verify on a device**: TikTok (tries `snssdk1233://` then `tiktok://`), X (`twitter://` then `x://`), Threads (`barcelona://`). Instagram, YouTube, Snapchat, Reddit, Facebook, Pinterest, Discord, Twitch, Netflix, WhatsApp, Roblox and Spotify use their long-standing schemes.
- **Screen Time minutes can't be read**, which is why the hours question exists.
- **The simulator can't do real Screen Time**: all real-mode testing has to be on your iPhone.
- **Multi-day gaps**: if Rilo isn't opened for several days, only one end-of-day is scored when it next opens (shields still reset every midnight).

---

## Test list for your phone

**Before you start:** delete Rilo from the phone, then press Run in Xcode with the phone connected.

**Onboarding**
1. Welcome → name.
2. "turn on screen time…" → **allow** → Apple's Screen Time prompt → approve → notifications prompt → allow.
3. "which apps steal your time?" → **pick your apps** → pick Instagram + one or two others → continue.
4. "which app is which?" → each app shows Apple's icon + name; tap the matching chip (✓ appears). Try "other…" on one and type its name.
5. "make rilo pop up first" → read the 5 steps → **open shortcuts**.

**Setting up the automation (do this for Instagram)**
6. Shortcuts → **Automation** tab → **+** → **App** → Choose → Instagram → tick **Is Opened** → **Run Immediately** → turn off **Notify When Run** → **Next**.
7. **New Blank Automation** → **Add Action** → search **rilo** → **Rilo check-in** → tap **App** → instagram → **Done**.
8. Back in Rilo → **test it: open instagram** → Instagram opens → Rilo should jump to the front → the list shows **✓ working** for Instagram.
9. **done** (or skip for the others) → hours question (pick 6h) → "building your plan…" → "6 hrs a day = 91 days" with the bar filling → "cut to 3 hrs = 46 days back" → finish onboarding.

**Opening a blocked app (automation)**
10. Open Instagram from the home screen → Rilo comes up straight away (no shield) on the check-in: Rilo, "what's it for?", opens as dots, **open in 5s** counting down.
11. Pick a reason → Rilo replies → when it reaches 0 the button reads **open instagram · N min** → tap → you're back in Instagram, unblocked.
12. Leave Instagram and reopen it within the session → no Rilo (session running).
13. Wait for the minutes to run out inside Instagram → the shield appears: "time's up on instagram."
14. Open Rilo → Home shows the open used and minutes counted. Open Instagram again → check-in again, now **open in 10s** (escalating).
15. Tap **never mind** → back to Rilo's home, xp goes up.

**Opens running out**
16. Keep opening until the opens are gone → Instagram now shows the shield: "no opens left for instagram." → **talk to rilo** → banner "tap to talk to rilo about instagram." appears at once → tap it → Rilo opens on "you're out of opens today" with the emergency pass rules and no countdown.
17. **use my emergency pass** → back in Instagram for 5 minutes; xp −20.

**Shield fallback (an app you skipped in setup)**
18. Open that app → Rilo's shield: cream, panda, "hey. tiktok again?", opens left, **talk to rilo** / **never mind**.
19. **never mind** → the app closes; open Rilo → xp went up.
20. Open it again → **talk to rilo** → banner within a second → tap → straight to that app's check-in (not Home). Repeat 2–3 times quickly: each tap should show a banner.

**Midnight reset**
21. Leave an app out of opens before midnight. After midnight, without opening Rilo, open that app → no "no opens left" shield (automated apps go back to the check-in; shield apps show "hey. instagram again?" with fresh opens).
22. Open Rilo → the day summary for yesterday, fresh opens, streak updated.

**Demo toggle (Debug only)**
23. Demo pill → SCREEN TIME → demo → close and reopen Rilo → the old demo flow; switch back to real the same way.

---

## QA pass (Part 5)
**Method:** every screen seeded with test data in the simulator (Debug, demo toggle on, since the simulator can't do real Screen Time), screenshotted on an **iPhone SE (3rd gen)** and an **iPhone 18 Pro Max**, plus a pass at the **largest accessibility text size** on the SE. I reviewed every screenshot, fixed what was wrong, then re-shot the fixed screens. Real-mode screens (check-in, matching, setup, session) were also shot.

**Fixed from the screenshots**
- Check-in: the "open in 5s / pick a reason" button was faint pale-on-pale over the hills → solid pale pill with dark text and an outline.
- Matching: the "x" chip looked like a close button → "x (twitter)".
- Plan screen at the largest text size: "instagram" broke mid-word ("instagra / m") → app names shrink to fit instead of breaking.

**Checked and fine**
- No text cut off, no overlapping, nothing hidden behind other elements on SE or Pro Max. The ambient butterflies are drawn behind all text.
- Largest text size: all onboarding screens, home, plan, progress, you, check-in, matching and setup scroll and wrap correctly; buttons stay reachable.
- The demo pill: not in Release builds (the whole panel is behind `#if DEBUG`). In Debug it's still there; the screenshots hid it (`-nodemo`), so I did **not** check whether it covers anything on each screen — in real mode it now only holds the real/demo toggle, jump-to and reset.
- Contrast: dark-green ink on cream/sky everywhere; the night screens use white on navy.

**Bugs checked in code** (things the screenshots can't show)
- Back buttons along the whole real onboarding path (name ↔ permission ↔ apps ↔ which-is-which ↔ shortcut setup ↔ hours ↔ rather): fixed the one that skipped steps.
- No dead ends: check-in → open / never mind / pass; session → open app / i'm done; setup → done / skip / back; matching → continue / back (both also work from the You tab).
- State survives closing: matches and shortcut status live in shared storage; a half-finished onboarding resumes on the matching/setup step; a session that ends while Rilo is closed is charged when it reopens.
- Midnight reset and streak: local day, monitor resets opens, end-of-day scoring unchanged.
- The in-app flow check (`-flowcheck`, every demo flow) passes: **all passed** (run after the last fix).
- Builds with no errors: Debug and Release, simulator and **real iPhone** Release and Debug for `generic/platform=iOS`: both succeeded, 0 errors.

**Not possible to check here:** anything that needs real Screen Time (shields, the Shortcuts automation, notifications from the shield, the midnight monitor). That's what the test list above is for.

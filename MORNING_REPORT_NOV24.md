# Morning report: Nov 24 (real Screen Time pass)

All six parts of last night's job are done and committed on `main`. Nothing is pushed. Signing, teams and capabilities were not changed. Real Screen Time is the default; demo is Debug-only.

The old `MORNING_REPORT.md` in this folder is from Nov 10. Last night's job also wrote a longer report, `Rilo/MORNING_REPORT.md` (in the Xcode project folder). This file is the short version.

## What's done

| Part | Status | Commit |
|---|---|---|
| 1. Demo leaks | Done | `e5104a0` |
| 2. Shortcuts automation + app matching | Done | `ceb3af3`, `90e2499` |
| 3. Shield backup + fast notification | Done | `ceb3af3` |
| 4. Onboarding visuals + hours question | Done | `f50c6ab` (hours question was already in `bb019ec`) |
| 5. Full QA / text visibility | Done, except things that need a real phone | `be900e6`, `eacf36d` |
| 6. Request text | Done | `f624111` |

1. **Demo leaks.** The pretend "Instagram is running" screen and its "demo: burn 5 min" button are replaced by a real session screen. Creator Mode, the debug buttons and the fake calendar are hidden in real mode.
2. **Shortcuts check-in.**
   - The App Intent is called "Rilo check-in".
   - After Apple's picker comes a "which app is which?" step: one tap per app, plus "other…" to type a name.
   - Then guided automation setup: "open shortcuts", ✓ per app once its check-in really runs, "test it", and skip.
   - One check-in screen serves every way in. Its "open in Ns" countdown grows 5→10→15→20s with each open of that app that day.
   - "open" sends you back into the app, "never mind" gives +10 xp, and when you're out of opens it shows the emergency pass.
   - The shield and the automation never show at the same time.
3. **Shield.**
   - Cream background, a cropped panda for each skin, "hey. instagram again?" with opens left, "talk to rilo" / "never mind".
   - The notification now arrives straight away instead of 1s later, uses a new ID each time and goes straight to the check-in when tapped.
4. **Onboarding numbers.** "6 hrs a day = 91 days a year" with a red bar, then "cut to 3 hrs = 46 days back" with a green bar.
5. **QA.**
   - Screenshots on iPhone SE and 18 Pro Max, plus the largest text size.
   - Fixed a faint button, the "x" chip and an app name breaking mid-word.
   - Bugs found and fixed:
     - The day rolled over at about 7pm (it was in UTC).
     - Sessions that ended while Rilo was closed weren't charged.
     - After midnight, the shield could still say "no opens left".
     - A back button skipped screens.
6. **Request text.** `FAMILY_CONTROLS_REQUEST.txt` matches the app, including "app names come only from what the person tells Rilo and stay on the iPhone".

Checked again this morning: a Release build for a real iPhone succeeds with 0 errors. The in-app flow check passed last night.

## Decisions I made
- Creator Mode is hidden in real mode because it simulates Instagram. Bringing it back is one line in `YouView+Settings.swift`.
- "never mind" gives xp only the first 3 times a day, so it can't be farmed.
- An app counts as "automation set up" only once its check-in has really run, because Rilo can't read the Shortcuts app.
- Safety net: if an automated app gets 2+ minutes of use in a day with no Rilo session, it goes back on the shield. This catches a deleted automation.
- When an automated app's time runs out, its shield appears once ("time's up"). iOS offers no other way to get someone out of an app.
- No shields until onboarding is finished, so "test it" reaches the automation.
- The shield button is deep green because white text on light green fails contrast.
- The links back into TikTok (`snssdk1233://`, then `tiktok://`), X (`twitter://`, then `x://`) and Threads (`barcelona://`) haven't been checked on a phone.

## What to click in Xcode
1. **Time Sensitive Notifications** (lets "talk to rilo" through Focus; optional, but the banner can be held back without it):
   - Open `Rilo/Rilo.xcodeproj` and click the blue **Rilo** project in the sidebar.
   - Under TARGETS, click **RiloShieldAction** and open **Signing & Capabilities**.
   - Click **+ Capability**, type "Time Sensitive" and double-click **Time Sensitive Notifications**.
   - Do the same for the **Rilo** target, then press ⌘B.
2. **Family Controls (Distribution):** paste `FAMILY_CONTROLS_REQUEST.txt` into Apple's request form.

## Phone test (10 steps)
1. Delete Rilo from the phone, then press Run in Xcode. Allow Screen Time and notifications, pick Instagram and one other app.
2. On "which app is which?", tap the matching name for each app. Type one with "other…".
3. Tap **open shortcuts** and make the automation: Automation → + → App → Instagram → Is Opened → Run Immediately, Notify When Run off → New Blank Automation → Rilo check-in (instagram).
4. Back in Rilo, tap **test it: open instagram**. Rilo should come up and show **✓ working**. Finish onboarding with the hours question.
5. Open Instagram from the Home Screen. The check-in should appear with no shield. Pick a reason, wait for the countdown, tap **open instagram**. You should land back in Instagram.
6. Stay until the minutes run out. The shield should say "time's up on instagram". Open Instagram again: the countdown should now be 10s.
7. Tap **never mind**. You should go to Rilo's home and xp should go up.
8. Open the app you didn't automate. You should see the cream shield. Tap **talk to rilo**: a banner should appear within a second, and tapping it should open that app's check-in. Try it 3 times in a row.
9. Use up all opens on one app. The check-in should show "you're out of opens today" and offer the emergency pass.
10. Tomorrow, before opening Rilo, open that app. It should have fresh opens, not "no opens left".

# Rilo: TestFlight notes

Paste the "What to Test" part into TestFlight (App Store Connect ▸ TestFlight ▸ your build ▸ Test Details). The rest is for you.

## What to Test (paste this, max 4000 characters)

Hey! Thanks for trying Rilo, a screen-time buddy who helps you scroll less and do more of what you actually want.

Everything is unlocked for testers, so you can try all of Rilo Pro for free. Nothing you do is charged.

Please try these, in order:
1. Go through setup from the start: name, pick your apps, turn on Screen Time, see your number, pick what you'd rather do, and look at your plan. Is anything confusing, too long, or does a back button take you somewhere weird?
2. The Meet Rilo tour after setup. Does it make sense?
3. Open one of your limited apps. You should see Rilo's block screen, then "what are you opening this for?" Try a quick (½) and a full (1) open, and leaving early. Do the opens circles on home look right afterwards?
4. Tap Rilo on home. Talk to him: hold the mic, say something, let go.
5. Do a nightly check-in (Plan tab or the reminder). Does Rilo pull the right things into tomorrow's plan?
6. Turn on strict mode in the You tab, then try to loosen something.
7. Close the app completely and reopen it. Is everything still there?
8. Change Rilo's skin and the theme. Do you like how they look?

Tell us:
• Anything that looked broken, cut off, or overlapping (a screenshot helps a lot: take one and tap "Send Beta Feedback")
• Anywhere you got stuck or didn't know what to do next
• Whether Rilo's blocking felt fair or annoying
• Anything Rilo said that felt off
• Your phone model (especially small phones like the iPhone SE)

To send feedback: take a screenshot in the app and choose "Share Beta Feedback", or open the TestFlight app ▸ Rilo ▸ Send Beta Feedback.

## Before each TestFlight build (for you)
- `TESTERS_UNLOCK_ALL` in `Rilo/Rilo/Models/FeatureFlags.swift`: keep it `true` for testers. **Set it to `false` for the real App Store release.**
- Bump the build number (Xcode ▸ Rilo target ▸ General ▸ Build).
- Real blocking only works after the Family Controls steps in `SETUP_AFTER_PAID_ACCOUNT.md`. Until then, blocking is the demo version (the "demo" button in the corner opens a fake blocked app).
- The "demo" button (the tester's remote control) shows in every build, like the web demo. Handy for testers. Before release set `SHOW_DEMO_PANEL = false` in the same FeatureFlags.swift file.

## Known limits right now
- Calendar connect, buddies, and Rilo's replies are demo versions (no real calendar, no real friends, scripted replies).
- Until Family Controls is switched on, apps aren't really blocked; use the demo button to try the flow.
- Voice needs an iPhone (it doesn't work in the simulator).

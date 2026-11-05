# Rilo: TestFlight notes

Paste the "What to Test" part into TestFlight (App Store Connect ▸ TestFlight ▸ your build ▸ Test Details). The rest is for you.

## What to Test (paste this, max 4000 characters)

Hey! Thanks for trying Rilo, a screen-time buddy who helps you scroll less and do more of what you actually want.

To try Rilo Pro, start the 7-day free trial on the paywall. In TestFlight it uses Apple's test money, so nothing you do is ever charged.

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
- Nothing to switch off: the tester unlock, the "demo" panel and the "demo: +500 xp" buttons only exist in Debug builds, so every TestFlight / App Store build (Product ▸ Archive) leaves them out. Testers get Rilo Pro through the free trial (TestFlight purchases are free test money). The Rilo Pro subscriptions must exist in App Store Connect first (`SETUP_AFTER_PAID_ACCOUNT.md`, Part 4), or the trial button says the store isn't answering.
- Bump the build number (Xcode ▸ Rilo target ▸ General ▸ Build).
- Real blocking only works after the Family Controls steps in `SETUP_AFTER_PAID_ACCOUNT.md` and `REAL_SCREEN_TIME = true` in `Rilo/Rilo/Models/FeatureFlags.swift`. With it `false`, TestFlight testers can't open a pretend blocked app any more (the demo panel is Debug only), so send TestFlight builds with real blocking on.

## Known limits right now
- Calendar connect, buddies, and Rilo's replies are demo versions (no real calendar, no real friends, scripted replies).
- Until Family Controls is switched on, apps aren't really blocked (the demo button that fakes it is only in Debug builds from Xcode).
- Voice needs an iPhone (it doesn't work in the simulator).

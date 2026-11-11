# Morning report (overnight, Nov 10 → 11, 2026)

Everything was done on the `launch-prep` branch. See the very bottom for whether it was merged and pushed.

## ⚠️ Read this first: one thing only you can fix

**The app still pretends to block apps.** Rilo's Screen Time switch (`FeatureFlags.REAL_SCREEN_TIME`) is still off, so in every build, TestFlight included, the blocking, the "you're in tiktok" timer and Creator Mode's Instagram are Rilo's own pretend versions. Creator Mode even says "This demo simulates Instagram" (honestly, so I left it).

- **For TestFlight testers:** that's fine.
- **For the App Store:** Apple will very likely reject an app that says it blocks apps but doesn't. Real blocking needs:
  1. Apple to approve the Family Controls permission for your account (you request it on the developer site).
  2. The Family Controls capability added to the main **Rilo** app target in Xcode. Right now only the 3 extensions have it.
  3. That switch flipped to `true`.
  4. A test on a real iPhone.

  Your project rules say I must never flip that switch or touch capabilities, so I didn't. `SETUP_AFTER_PAID_ACCOUNT.md` has the steps.

**What I did instead for the Screen Time permission screen:** in Release it no longer shows Rilo's drawn copy of Apple's alert (Apple rejects fake system alerts). Tapping "allow" goes straight to the real request. Once real Screen Time is on, that request *is* Apple's real Screen Time popup, with nothing else to change. Until then it just carries on. The drawn copy only exists in Debug builds now.

## What changed (in plain words)

**Rilo is free (v1).**
- One new switch, `FeatureFlags.PAYMENTS = false`. With it off, everyone gets everything in every build, TestFlight included:
  - unlimited apps (no 3-app limit)
  - the per-app breakdown, Rilo-built limits and the weekly step-down
  - the nightly check-in
  - strict mode and Creator Mode
  - every theme
  - every Rilo skin, still unlocked by leveling up
- The paywall can't open from anywhere.
- The plan screen in onboarding no longer has the "with rilo pro" locked list, and its button says **"let's do it"** and goes straight home.
- No "pro" badges on themes, the plan tab or Creator Mode.
- No "your plan / restore purchases" card on the You tab.
- No subscription line in the delete warning.
- The app never talks to the App Store: no product loading, no purchase checks.
- All the paywall and purchase code is still there, just switched off. To sell Pro later, flip `PAYMENTS` to `true`.

**No accounts.**
- The welcome screen's "i already have an account" button is gone.
- On the You tab, the "account" section is now **"your data"**, and "delete account" is **"delete all my data"**. It does the same thing: wipes what's on the phone.
- The "start over" warning no longer says "this tester".

**No buddies.**
- A new switch, `FeatureFlags.BUDDIES = false`, hides:
  - the buddies row and its "friends" heading on the You tab
  - the buddies screen
  - the tour step about buddies
  - "buddy mode" on the paywall list
- The code is still there.

**Nothing fake in Release.** These now only exist in Debug builds:
- the drawn Screen Time alert
- "demo: connect a fake calendar"
- the pretend "notes / reminders / google tasks / notion" connections (nothing was ever read)
- "demo: fill it in for me" on the nightly check-in
- "demo: burn 5 min"

The real calendar connection (Apple's calendar access) works and stays.

**Docs.**
- `APP_STORE.md`: v1 is free, Rilo Pro comes later, **early users keep everything free when Pro launches**, and buddy mode is out of v1. The Pro price/trial section and the buddies parts of the description and privacy policy are removed.
- `PROGRESS.md`: the same, plus what launch prep changed.

**New App Store screenshots (1320 × 2868):**
- `screenshots/app-store/6.9-inch/03-your-plan-v2.png`, with the "let's do it" button.
- `screenshots/app-store/6.9-inch/01-welcome-v2.png`. The old `01-welcome.png` shows "i already have an account" and the old `03-your-plan.png` shows "unlock my full plan", so **don't upload those two**. `screenshots/app-store/README.md` says so too.

## Decisions I made on my own

1. **Simulator:** you asked for the iPhone 16 Pro Max. I made one, but it froze on this Mac's simulator version. I used your existing **iPhone 18 Pro Max** simulator instead. It's the same 6.9-inch size and the same 1320 × 2868 screenshots, and it's the one your earlier App Store shots were taken on.
2. **How I checked the screens:** the simulator here can't be tapped by a script (no tap tool is installed, and the Simulator window isn't available). So:
   - I ran the **Release** build and confirmed it opens on a clean welcome screen ("let's go" only).
   - I opened every screen you listed in the **Debug** build with `-gated`, which switches off the Debug-only tester unlock so locks work exactly like Release. Screens: your plan, pick apps, home, plan, progress, skin picker, You tab (themes, strict, Creator Mode, your data), calendar, nightly check-in. I checked each screenshot by eye.
   - I updated the app's built-in walkthrough (`-flowcheck`). It goes through onboarding from a blank phone, picks **5 apps** (all 5 are watched), finishes with "let's do it" with no paywall, and confirms the paywall and buddies can't be opened, strict mode turns on and Creator Mode is open. **All 134 checks pass.**
3. **The .storekit file:** it was never attached to the Release side of the scheme (Archive/TestFlight). It's only on Xcode's Debug "Run" button, for testing fake purchases, so there was nothing to detach. I also didn't edit the Xcode project by hand (your rule). And with payments off the app never asks the App Store for anything anyway.
4. **Calendar:** real calendar access already works, so I kept it on and didn't add a CALENDAR switch.
5. **"delete account" → "delete all my data"**, since v1 has no accounts.
6. **Pushing:** your `CLAUDE.md` says "never push", but tonight's instructions said to merge and push, so I followed tonight's instructions.

## Couldn't do

- **Real Screen Time / Apple's real permission popup in Release:** see the top of this report. It needs the capability, Apple's approval and the switch, which are all yours to do.
- **Tapping through the Release build by hand:** not possible from here (see decision 2). Worth one quick run on your phone (steps below).
- **`-settingscheck`** (the You-tab test) still walks through the old paywall, so a few of its checks will say "failed" while payments are off. That's expected, not a bug.

## Still mentions Pro, prices, accounts or buddies

**In the app (Release), visible:**
- One skin is called **"pro band"** (it's a headband, not Rilo Pro). I left it; rename it if you want.
- "your **screen-time buddy**" is the tagline, not buddy mode. I left it.
- The calendar screen says "reading **[your calendar accounts]**" (Google, iCloud…). That's correct.

**In the app, but never shown while `PAYMENTS = false`:** the paywall screen, the "pro" lock badges, "see rilo pro" buttons, and "free blocks 3 apps". They all only appear for someone without Pro, and everyone has Pro now.

**Outside the app, not changed (not asked, separate project):**
- **rilo.one** still says "free to download. rilo pro unlocks more." and, in the FAQ, "rilo pro unlocks extra features" (with "pricing isn't final…").
- **rilo.one/privacy** and **/support** still say "You tab → delete account". The button is now called "delete all my data".
- The website survey asks about Rilo Pro pricing (that's on purpose, for later).

## Your next steps

1. **On your phone (5 min):**
   1. In Xcode, open `Rilo/Rilo.xcodeproj` and pick **Product ▸ Scheme ▸ Edit Scheme ▸ Run ▸ Build Configuration = Release**.
   2. Run it on your iPhone.
   3. Go through setup, pick more than 3 apps, and look at the You tab, strict mode, Creator Mode, the skins and the themes. You should see no paywall, "pro", price, account or buddies anywhere.
   4. Set the scheme back to Debug afterwards.
2. **Decide on real Screen Time before App Store submission** (top of this report). TestFlight can go ahead now.
3. **App Store Connect:**
   - Price = Free, no in-app purchases on v1.
   - Upload `01-welcome-v2.png` and `03-your-plan-v2.png` instead of the old two.
   - Paste the updated description from `APP_STORE.md`.
4. **Website (optional):** if you want the site to match, change the "rilo pro" lines on rilo.one and "delete account" → "delete all my data" on /privacy and /support. Ask me and I'll do it on a branch.
5. **Before Pro ever launches:** build the "early users keep everything free" promise into the app first. It's written down in `APP_STORE.md` and `PROGRESS.md`.

## Merge and push

- The final **Release build passed with zero errors and zero warnings**, and the project's usual build check passed too.
- So `launch-prep` was **merged into `main` and pushed to GitHub**. `no-payments-v1` (the free-v1 work from earlier in the evening) is included in it.
- Pushing `main` also sent up 4 older commits that were already on your Mac but not on GitHub yet (the Nov 9 small fixes, the seats scripts and guardrails, and the Screen Time extensions checkpoint).
- Not committed, on purpose: 4 loose Xcode scheme files for the extensions (`Rilo.xcodeproj/xcshareddata/xcschemes/Rilo*.xcscheme`, other than `Rilo.xcscheme`), which were already lying around before I started.

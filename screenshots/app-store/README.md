# App Store screenshots

## Current set: `2026-11-24/` (upload these)

Retaken Nov 24 after the Nov 23–24 changes (hours question, new "your number", one check-in screen, Shortcuts check-in).

- `2026-11-24/6.3-inch/`: 1206 × 2622, iPhone 18 Pro simulator. This is the size App Store Connect is asking for right now.
- `2026-11-24/6.9-inch/`: 1320 × 2868, iPhone 18 Pro Max simulator.

Both folders hold the same 10 screens. Upload them in this order:

1. `01-welcome.png`: hey, i'm rilo
2. `02-hours.png`: about how many hours a day are you on your phone? (4h)
3. `03-your-number.png`: 4 hrs a day = 61 days a year on your phone, with the year bar
4. `04-your-plan.png`: here's your plan: 4h now → 2h goal, limits for tiktok, instagram, youtube, snapchat
5. `05-home.png`: hey ethan, 1h of 2h today, apps with opens left
6. `06-check-in.png`: the check-in for tiktok: what's it for?, opens left, reasons, never mind
7. `07-shortcut-check-in.png`: make rilo pop up first (Shortcuts check-in setup)
8. `08-progress.png`: level, week, where your time goes
9. `09-pick-rilo.png`: your rilo, with the real level locks
10. `10-talk.png`: talk to rilo

How they were taken:
- Debug build on the simulator.
- Launch arguments: `-nodemo` hides the tester button, `-gated` shows the real locks, and `-screen <name>` seeds sample data (TikTok, Instagram, YouTube and Snapchat, 4 hours a day).
- Status bar set to 9:41, full battery with no charging bolt, full signal.
- The scripts are in the session scratchpad. The older `Rilo/tools/shot.sh` does the same thing, one shot at a time.
- No app code was changed.

## Old screens dropped (Nov 10 set: `6.9-inch/`, `final/`, `upload-now/`)

Don't upload these any more.

- **`05-opening-app.png` (opening tiktok?)**: that 5-second intercept screen is gone from real Screen Time. Every way in now goes to the one check-in screen (`06-check-in.png`).
- **`06-why-open.png` (what are you opening tiktok for?)**: replaced by the same check-in screen, which now says "what's it for?" with the app's name at the top.
- **`02-your-number.png` (old)**: the falling-pile version. Replaced by the big number plus a filling bar.
- **`01-welcome.png` / `03-your-plan.png` (pre-v2)**: these were already out of date on Nov 10.
- **New in this set**: `02-hours.png` (the hours question) and `07-shortcut-check-in.png`.

Not included on purpose:
- **The shield.** iOS draws it inside Screen Time, so it can't be shot in the simulator, and Rilo's old in-app mock-up of it is demo-only.
- **"Time back"** (the second "your number" beat). It was left out to stay at 10.

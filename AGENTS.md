# Rilo: project guide

## What Rilo is
Rilo is a screen-time buddy app for ages 13+. The mascot is Rilo, a round white bao-shaped panda with black ears and eye patches, a pinch on top, and a green headband that says RILO. Pitch: "Your screen-time buddy. Rilo doesn't just block your apps, he helps you figure out what to do instead and makes you a plan."

Right now this is a WEB DEMO at tryrilo.vercel.app, used to get tester feedback. The real app will be a native iPhone app (SwiftUI). Anything needing real AI, real Screen Time data, voice, camera, or calendar is FAKED with demo data in the demo files. Never add real API keys or paid services.

## Rules for working on this
- main is LIVE. Work on a separate branch. Never push or deploy unless I say so.
- Don't change things I didn't ask about: the panda Rilo, the grass theme, moods, skins, levels, or the logo/app icon (keep the full mascot with arms and the RILO headband).
- Check if something already exists before building it. Don't rebuild what's there.
- One feature or screen at a time. If a change needs big rewrites, stop and ask me first.
- SIMPLE beats more. When in doubt, cut it or move it off the home screen.
- Explain things simply. I'm not super technical.

## Home screen (keep it simple)
Only: Rilo big with his mood (tappable, he reacts), today's screen time vs. goal, the user's apps with opens circles, and one "do this instead" card. Everything else lives in other tabs. Flat, light cards with subtle borders. No heavy dark shadows.

## How the screen-time system works
- Every app is one of: Always allowed (Phone, Messages, Maps, Camera, never blocked), Blocked, Limited (X opens/day × Y min per open), or Free (no limit, still counts toward the total).
- Opens work in halves: leaving by half the time costs 0.5, staying longer costs 1. Any session costs at least 0.5, one session never costs more than 1. Reopening within 2 min continues the same session. Shown as circles (full/half/empty) plus text like "2½ opens left · 15 min each."
- "What are you opening this for?" pop-up: pick a reason, then Quick (½ open) or Full (1 open).
- 1 emergency pass per day (5 min). In normal mode only, borrow ½ open from tomorrow, once a day.
- The daily goal is a SCORE, not a lock. It drives Rilo's mood, XP, streaks, "time you got back," and the plan check.
- Percent of screen time per app is insight only. It never sets limits by itself.
- Weekly step-down: Rilo tightens one thing a week (a suggestion in normal mode, automatic in strict).
- Strict mode: no halves, 24-hour wait to loosen anything or turn strict off, longer wait before opening, no borrowing. Getting stricter is always instant.
- Creator Mode: posting isn't scrolling. Say what you're there for and for how long, and that time is tracked on its own; Reels get intercepted. Simulated — iOS can't see inside Instagram.
- XP comes mainly from being under the goal. Level 100 is about a year. 23 skins unlock by level.

## Onboarding (short, paywall last)
1. Welcome  2. Name (no confirm)  3. Pick apps + turn on Screen Time  4. Crunching (1.5s)
5. Animated "your number" sequence: the hit (64 days a year) → the flip (what you could do instead) → the promise
6. "What would you rather spend it on?" (chips)  7. Your plan: limits + what to do instead, Pro parts locked
8. Paywall, then straight to home, then the Meet Rilo tour runs once.
Every step has a back button, and back never dumps the user at the start.
After onboarding, Rilo asks one thing a day: goals (night 1), calendar (day 2), school hours (day 3), scroll times and hobbies (day 4–5).

## Other features
Meet Rilo tour (one green box, everything else dimmed, runs once), nightly check-in (talk or type, Rilo pulls out tasks and events), fake calendar connect, Rilo-made daily schedule with focus blocks, "do this instead" suggestions, buddy mode (invite code only — friends see mood and streak, never numbers), bedtime and school mode, weekly share card, tap Rilo and he reacts.

## Pricing
$4.99/month or $39.99/year, 7-day free trial. Free: 3 apps, basics. Pro: unlimited apps, per-app breakdown, Rilo-built limits, step-down, nightly check-in, strict mode, Creator Mode, all skins and themes.

## Recent tester feedback
Fixed: onboarding was too long with too many confirms; no way back out of a step; tapping Rilo did nothing. Still open: option pickers look cramped on small phones.

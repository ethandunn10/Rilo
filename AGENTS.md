# Rilo: project guide

## What Rilo is
Rilo is a screen-time buddy app for ages 13+. The mascot is Rilo, a round white bao-shaped panda with black ears and eye patches, a pinch on top, and a green headband that says RILO. Pitch: "Your screen-time buddy. Rilo doesn't just block your apps, he helps you figure out what to do instead and makes you a plan."

Right now this is a WEB DEMO at tryrilo.vercel.app, used to get feedback. The real app will be a native iPhone app later (SwiftUI). Anything needing real AI, real Screen Time data, voice, or calendar is FAKED with demo data in the demo files. Never add real API keys or paid services. This app lets the user know what they should do when getting off their phone, such as shoot basketball or something they're into. It could be something on their schedule too, because Rilo can make a schedule for them. It is different from other apps because it allows real connection and a reason for the user to get off their phone.

## Rules for working on this
- main is LIVE. Do work on a separate branch (rilo-addons-test). Never push or deploy unless I say so.
- Don't change existing things I didn't ask about: the panda Rilo, the grass theme, moods, skins, levels, or the logo (keep it as is).
- Check if something already exists before building it. Don't rebuild what's there.
- Do one feature or screen at a time. If a change needs big rewrites, stop and ask me first.
- Explain things simply. I'm not super technical.

## How the screen-time system works
- Every app is one of: Always allowed (Phone, Messages, Maps, Camera, never blocked), Blocked, Limited (X opens/day × Y min per open), or Free (no limit, counts toward the total).
- Opens work in halves: leaving by half the time uses 0.5 open, staying longer uses 1. Any session uses at least 0.5. One session is capped at 1 full open. Reopening within 2 min continues the same session. Shown as circles (full/half/empty) plus text like "2½ opens left · 15 min each."
- "What are you opening this for?" pop-up: pick a reason, then Quick (½ open) or Full (1 open).
- 1 emergency pass per day (5 min). In normal mode only, you can borrow ½ open from tomorrow, once a day.
- The daily goal is a SCORE, not a lock. It drives Rilo's mood, XP, streaks, "time you got back," and the plan check.
- Percent of screen time per app is insight only and never sets limits by itself.
- Weekly step-down: Rilo tightens one thing per week (a suggestion in normal mode, automatic in strict).
- Strict mode: no halves, 24-hour wait to loosen anything or turn strict off, longer wait before opening, no borrowing. Making things stricter is always instant.
- XP comes mainly from being under the goal. Level 100 should take about a year. 23 skins unlock by level.

## Onboarding (keep it short, paywall last)
1. Welcome  2. Name (no confirm)  3. Pick apps + turn on Screen Time  4. Crunching (1.5s)
5. Animated "your number" sequence: the hit (64 days a year) → the flip (what you could do instead) → the promise
6. "What would you rather spend it on?" (chips)  7. Your plan: limits + what to do instead, with Pro parts locked
8. Paywall, then straight to home.
After onboarding, Rilo learns more one question a day: goals (night 1), calendar (day 2), school hours (day 3), scroll times/hobbies (day 4–5).

## Other features
Nightly check-in (talk or type, Rilo pulls out tasks/events), fake calendar connect, Rilo-made daily schedule with focus blocks, "do this instead" suggestions, buddy mode (invite code only, friends see mood + streak, not numbers), bedtime + school mode, weekly share card, tap Rilo and he reacts.

## Pricing
$4.99/month or $39.99/year, 7-day free trial. Free: 2 apps, basics. Pro: unlimited apps, per-app breakdown, Rilo-built limits, step-down, nightly check-in, strict mode, all skins and themes.

## Recent tester feedback to fix
Onboarding too long with too many confirms; option pickers look bad on phones; tapping Rilo does nothing.
# Rilo — Clickable Web Prototype Spec

Read this whole file before writing any code.

## What we're building
A **clickable web prototype** of Rilo, a screen-time buddy app for iPhone. It runs in a browser, looks and feels exactly like an iPhone app, and is used to **test the idea with 10–15 people** by sending them one link.

This is NOT the real iPhone app. A website can't block other apps, so blocking is faked with a "pretend you opened TikTok" button. No real accounts, no real payments, no backend.

## The #1 rule: copy the designs exactly
The `designs/` folder has every screen, already designed. Match them **exactly**: same colors, fonts, spacing, sizes, wording, animations, and the Rilo character drawings.

- The design files are HTML with some custom tags (`<x-dc>`, `<sc-for>`, `<sc-if>`, `<dc-import>`). They are **reference, not code to run.** Read the inline styles, SVGs, text, and the small JavaScript class at the bottom of each file to see the exact look and behavior, then rebuild it in normal code.
- `<dc-import name="Buddy" mood="...">` means "put the Rilo character here" (from `designs/Buddy.dc.html`). `<dc-import name="Sky" ...>` means "put the sky + hills background here" (from `designs/Sky.dc.html`). `<dc-import name="Skin" look="...">` means a premium Rilo look (from `designs/Skin.dc.html`).
- **Do not invent a new style, redraw Rilo, or "improve" the design.** If something is unclear, ask.
- Copy Rilo's SVG drawings exactly as they are in the design files. Never draw him from scratch.

## Tech
- **Vite + React**, plain CSS (no UI libraries, no Tailwind).
- Fonts from Google Fonts: **Fredoka** (headlines) and **Inter** (body text).
- Save progress in `localStorage` (picked hobbies, apps, XP, chosen Rilo) so a refresh doesn't reset everything.
- Must be deployable as a static site (Vercel) so it gets a shareable link.

## Phone frame
- On a **phone**: the app fills the whole screen, like a real app.
- On a **laptop**: show the app inside a centered iPhone-sized frame (390 × 844) on a soft sky-blue background.
- No fake iPhone status bar.

## The look ("Touch Grass")
- Sky gradient background with **drifting clouds**, rolling **green hills** with swaying grass. Rilo lives on the hill.
- **Frosted-glass cards**: white at ~60% see-through, white border, blurred background, soft shadow.
- Headlines: Fredoka, **lowercase**. Body: Inter.
- Main buttons: white pill buttons sitting on the grass. Dark buttons/cards use `#12301A`.
- Colors: ink `#12301A`, secondary text `#2C4A36`, greens `#9EDCA6` / `#4CC160` / `#2E8B3E`, sky `#7CC6EE` → `#EEF8EE`.
- The "just tired" screen uses the **dusk** sky (purple-blue, moon, stars). See `Sky.dc.html` tone="dusk".

## Motion (this matters, the app must feel alive)
- Clouds drift slowly, grass sways, Rilo gently bobs up and down on every screen.
- Rilo **jumps** on: Welcome, Your time back, Paywall, Rilo's suggestion (bored), Break, Progress, check-in "done."
- When a screen opens, its cards and buttons **slide up one by one** (short stagger).
- Buttons **shrink slightly** when tapped.
- **Screens slide in** when you move between them (left/right like an iPhone).
- Rings, bars, and XP bars **animate filling up** when they appear.
- Keep it smooth: aim for 60fps; use CSS transforms/opacity, not layout-shifting animations.

## Screens and flow
Design file for each screen is in `designs/`. Build all of them.

**Onboarding (first time only)**
1. `Welcome` → "let's go" → How it works. "i already have an account" → Home.
2. `HowItWorks` → next → Do this instead
3. `Instead` → next → About you
4. `AboutYou`: tap chips to pick hobbies + goals. "+ add your own" opens a text box and adds a new chip. → continue → Pick apps
5. `PickApps`: tap to toggle apps. "add another app" adds one by name. → "turn on screen time" → Your time back
6. `TimeBack`: +/- buttons change current screen time and goal. Bars and "time back every year" numbers update live. → Paywall
7. `Paywall`: tap to switch yearly/monthly. Both "start 3-day free trial" and "continue with free" → Home. (No real payment. **Track which button testers tap.**)

**Daily use**
- `Home`: rings, Rilo on the hill, "up next" → Plan. "rilo's watching 3 apps · test it" → the pop-up. Bottom tab bar: home / plan / Rilo (center) / progress / you.
- **Add a clear "pretend you opened tiktok" button on Home** so testers can trigger the pop-up. Style it to match.
- `Intercept` (the pop-up): i'm bored → `Suggestion`, just tired → `Tired`, taking a break → `Break`, need it → `NeedIt`, never mind → Home.
- `Suggestion`, `Tired`, `Break`, `NeedIt`: Rilo's replies, exactly as designed. "give me 5 minutes" / starting a break / "open tiktok for X min" → `CheckIn`.
- `CheckIn`: "i'm done" → +10 XP celebration. "5 more minutes" → −15 XP, let-down Rilo. Use the hobbies the user picked in onboarding in Rilo's suggestions when possible.
- `Plan` (Pro), `Progress`, `PickRilo` (tap a Rilo to preview; locked ones show "unlock with rilo pro" → Paywall, Gold shows "level 4 of 10").

## Test tracking (simple)
Log these to the browser console AND keep a count in localStorage, so we can see what testers did:
- which reason they tapped on the pop-up
- "i'm done" vs "5 more minutes"
- "start free trial" vs "continue with free"
- which Rilo they previewed on PickRilo

## Build in phases. Stop after each one so Ethan can check it.
1. Project setup, phone frame, Sky background, Rilo character (Buddy + Skin) with bob/jump animation. **Stop and show.**
2. All 7 onboarding screens + screen-slide transitions. **Stop and show.**
3. Home, pop-up, the 4 replies, check-in. **Stop and show.**
4. Plan, Progress, PickRilo, test tracking, localStorage. **Stop and show.**
5. Deploy to Vercel and give Ethan the link.

## Don't
- Don't add features that aren't in the designs (no login, no settings, no notifications, no AI chat).
- Don't change wording, colors, or Rilo's drawing.
- Don't skip the animations. The smooth, alive feel is the point.

## Fixes from Ethan's testing (Oct 28) — these override the designs where they conflict
**About you (hobbies + goals)**
- Show more common options: about 20 hobbies (basketball, soccer, football, golf, gym, running, skating, swimming, gaming, making videos, photography, drawing, music, guitar, piano, reading, writing, coding, cooking, hanging with friends) and about 12 goals (better grades, get fit, grow my content, build something, sleep more, read more, learn an instrument, make a team, less phone, save money, learn to code, spend time with family). Show the top ~10 of each and a "show more" chip that expands the rest.
- "+ add your own": as you type, show matching suggestions from the lists (type-ahead) so most people tap instead of typing. Turn on spellcheck and autocorrect on the text box.
- Custom chips you added must be removable: show a small × on them. Tapping any chip toggles it on/off.
- The screen must scroll when there are lots of chips. Keep the "continue" button pinned at the bottom on the grass, and let the content above it scroll.

**Pick apps**
- Show each app with its real logo, not a letter. Use the Simple Icons library (simpleicons.org, free brand icons) for logos, shown in the brand's color on a rounded square.
- "add another app" opens a sheet that slides up with a search box and a list of ~25 popular apps with logos (tiktok, instagram, youtube, snapchat, x, reddit, discord, netflix, twitch, pinterest, facebook, threads, bereal, spotify, roblox, fortnite, minecraft, clash royale, whatsapp, telegram, hulu, disney+, amazon, prime video, tumblr). Typing filters the list. If what they type isn't in the list, show "add '<what they typed>'" with a letter icon as the fallback.
- Same scrolling rule: list scrolls, button stays pinned.

## Fixes round 2 (Oct 28) — before Phase 5
**Tab bar**
- The Rilo button in the middle of the tab bar → Pick your Rilo (change character). Keep it.
- The "you" tab must NOT go to Pick your Rilo. Make a new "You" screen in the same Touch Grass style (sky, glass cards, Fredoka lowercase):
  - name at top (ask for a first name during onboarding on the About you screen, optional), level + XP, current Rilo shown small
  - your stats: day streak, total time saved, times you said no
  - your hobbies + goals (tap to edit, same chips as onboarding)
  - apps rilo watches, with logos (tap to edit, same add-app sheet)
  - daily screen time goal (+/- like Your time back)
  - plan: "free" or "rilo pro (trial)" based on what they tapped on the paywall
  - a "start over" button at the bottom that clears everything and goes back to Welcome (needed so Ethan can hand the same phone to the next tester)

**Times must be right everywhere**
- Whatever time the user picks is the time used: break 5/10/15, need-it 5/10, "5 more minutes" = 5. The check-in must say the real number ("that was your 15 minutes"), and XP/time-saved math must use it.
- After they start the time, show a short "timer running" screen: app logo + name, a countdown (mm:ss) in a ring, Rilo relaxed, and a small "skip to the end (demo)" button. For testing, the countdown runs fast: 1 real second = 1 minute, so 15 minutes takes 15 seconds. When it hits 0 → check-in.

**Apps must be the ones they picked**
- The pop-up only ever names apps the user actually picked in onboarding (or added later on You). Never default to TikTok.
- Replace "pretend you opened tiktok" with "pretend you opened…" that shows their picked apps (logos) to tap. The pop-up title, reply text, buttons ("open instagram for 10 min"), timer, and check-in all use THAT app's name and logo.
- "4th time today" must be a real count per app per day (1st, 2nd, 3rd…), saved in localStorage.
- Home's "rilo's watching N apps" shows the real number and their real logos.

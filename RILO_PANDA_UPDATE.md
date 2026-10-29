# Rilo Update: Panda Rilo + 10-Level Skins

Read this whole file before changing anything. This update replaces the Rilo character and the premium skin system. Everything else in `RILO_SPEC.md` stays the same.

## 1. The new Rilo (panda)

Rilo is now a **panda**: the same white bao body with the pinch on top and the green RILO headband, plus **big black ears and black eye patches**.

The exact art is in `designs/rilo-panda/`, which has **70 SVG files**: every skin in every mood.

- File name = `{skin}-{mood}.svg`. Example: `redpanda-angry.svg`.
- Skins: `original, proband, bamboo, shades, beanie, sakura, studio, redpanda, pinkpanda, gold`
- Moods: `coach, wave, proud, curious, sleepy, letdown, angry`
- `_reference-sheet.png` shows them all together.

**Rules:**
- **Use these SVGs exactly.** Don't redraw Rilo, don't change colors, don't "clean up" the shapes.
- **Delete the old bao Rilo everywhere.** Delete the old Buddy and Skin drawings and replace every place Rilo appears (all screens, the tab bar, the paywall, Pick your Rilo, Progress) with the new panda.
- Make **one component**, `<Rilo skin mood size motion />`, that shows `designs/rilo-panda/{skin}-{mood}.svg`. Put the SVG inline (not `<img>`) so the built-in animations run (waving arm, angry shake).
- The **headband text "RILO" uses the Fredoka font**. Make sure Fredoka is loaded so the text renders in Fredoka.
- **Keep the existing motion:** gentle bob on every screen, and jump where it already jumps. The wave and angry SVGs have their own small animations built in. Keep those too.
- **Whatever skin the user picked shows on EVERY screen, in every mood.** Example: if they picked Red Panda, the "just tired" screen shows `redpanda-sleepy.svg`.

## 2. Which mood goes where

Same as before, plus one new mood:

| Screen / moment | Mood |
|---|---|
| Home, blocked-app pop-up | `coach` |
| Welcome, check-in "time's up" | `wave` |
| Said "i'm done", Your time back, Progress, level up | `proud` |
| Need it ("what for?") | `curious` |
| Just tired | `sleepy` |
| Tapped "5 more minutes" (first time today) | `letdown` |
| **NEW:** tapped "5 more minutes" a **2nd+ time today** | `angry` |

For the angry moment, Rilo's line is: **"again?? we talked about this."** It costs −15 XP, same as let down.

## 3. Skins: 10 levels, Pro only

The old premium list (Pro Band, Night, Shades, Sakura, Cloud, Studio, Gold) is **gone**. The new list is 10 skins, one per level:

| Level | Skin | file prefix |
|---|---|---|
| 1 | Original | `original` |
| 2 | Pro Band | `proband` |
| 3 | Bamboo | `bamboo` |
| 4 | Shades | `shades` |
| 5 | Beanie | `beanie` |
| 6 | Sakura | `sakura` |
| 7 | Studio | `studio` |
| 8 | Red Panda | `redpanda` |
| 9 | Pink Panda | `pinkpanda` |
| 10 | Gold | `gold` |

**Unlock rules:**
- **Free users only get Original. Ever.** They can SEE all 10 on Pick your Rilo, but skins 2–10 are locked and show **"rilo pro"**. Tapping a locked one goes to the Paywall.
- **Pro users unlock each skin when they reach that level.** For skins above their level, show the lock plus **"level X"** (example: "level 7").
- When a Pro user levels up, show a short celebration: **Rilo `proud` + "new rilo unlocked!"** with the new skin. Then let them tap **"wear it"** or **"later."**
- **In the prototype:** tapping **"start 3-day free trial"** sets the user as Pro (save `isPro: true` in localStorage). Tapping **"continue with free"** sets `isPro: false`.

## 4. XP and leveling: make it SLOW

Getting to level 10 should take about **6–8 weeks of real daily use**, not days.

XP needed to reach each level (total, counted from zero):

| Level | Total XP needed |
|---|---|
| 1 | 0 |
| 2 | 150 |
| 3 | 350 |
| 4 | 600 |
| 5 | 900 |
| 6 | 1,300 |
| 7 | 1,800 |
| 8 | 2,400 |
| 9 | 3,100 |
| 10 | 4,000 |

XP amounts (unchanged):
- "i'm done" on check-in: **+10**
- did Rilo's suggestion instead (bored): **+40**
- just tired, phone down: **+20**
- "5 more minutes": **−15**
- **Never go below 0 XP and never drop a level.**

**Update the Progress screen** to use this table. It should show the current level, an XP bar to the next level ("320 / 600 xp"), and the next skin you'll unlock with its picture ("next: Shades at level 4"). Replace "gold rilo at level 10" with that next-skin line.

**Testing helper (prototype only):** on the **You** screen, add a small grey **"demo: +500 xp"** button at the very bottom so testers can see level-ups and skins unlock without waiting weeks. Label it clearly as demo.

## 5. Screens to update

- **Paywall:** the Rilos shown up top become 3 of the new skins: **Red Panda, Pink Panda, Gold**. Add a perk line: **"unlock 9 more rilos as you level up."**
- **Pick your Rilo:** a grid of all 10 skins in level order, each with its name and lock state, as described above. Tapping an unlocked skin previews it big (with the jump) and has a **"wear this"** button.
- **Tab bar Rilo button:** shows the user's current skin in `coach`.
- **Progress:** as in section 4.
- **Test tracking:** keep logging which skin they previewed. Also log **level-ups** and **locked-skin taps by free users** (that's a "would you pay" signal).

## 6. Build order. Stop after each one so Ethan can check it.
1. Make the `<Rilo>` component, then swap Rilo into every screen (Original skin, all moods, including angry on the 2nd "5 more"). **Stop and show.**
2. Do skins + Pro/free rules + XP/levels + the level-up celebration + the Pick your Rilo grid + the Paywall/Progress changes + the demo XP button. **Stop and show.**

## Don't
- Don't redraw or restyle Rilo. Use the SVGs exactly.
- Don't give free users any skin besides Original.
- Don't make leveling faster than the table above.
- Don't touch anything else in the app.

# ScreenZen-style open: what iOS allows (Nov 24, 2026)

Sources:
- The iOS 27.2 SDK in Xcode: the ManagedSettings and ActivityKit interfaces, read directly.
- Apple's ActivityKit material (WWDC26 "Live Activities essentials").
- Other Screen Time developers' public write-ups and PRs (links at the bottom).

**Not done: testing on a real device.** I can't run anything on your iPhone from here. The two device-only questions are marked **(needs your phone)**. The build records what happened in You ▸ apps you picked ▸ advanced ▸ "live activity: …", so your first test answers them.

## 1. A countdown on the shield

| Question | Answer |
|---|---|
| Can the shield count down by itself (5, 4, 3…)? | **No.** A shield is one static picture: background, icon, title, subtitle, two button labels and colours. Apple gives no timer, no animation and no way to redraw it on a schedule. |
| Can it be redrawn after a tap? | **Yes.** `ShieldActionResponse.defer` keeps the shield up and has iOS ask the configuration extension for it again, so it's redrawn with fresh text on each tap. |
| Closest real version | 1st tap on **"open instagram (5s)"** starts the wait, and the shield redraws as **"hold on. 5 seconds."**. A tap before it's up redraws with the seconds left ("(2s)"). A tap after it's up unlocks. The number updates on each tap, not every second. That's the limit. |

## 2. Unlocking just that app, then relocking

| Question | Answer |
|---|---|
| Can the shield's button extension lift the shield on one app? | **Yes.** Extensions can write to Rilo's own `ManagedSettingsStore`. Rilo removes only that app's token from the shield set; every other app stays shielded. |
| Does the app underneath become usable right away? | Expected yes: the extension answers `.none` after the store changes. **(needs your phone)** |
| Relock when time's up, even with Rilo closed? | **Yes.** The extension starts a `DeviceActivity` window with a "minutes used" threshold. The monitor extension shields the app again at the threshold, or when the window closes because they left. This is the same timer Rilo's in-app opens already used. |
| Count the open? | **Yes.** The shield's copy of "opens left" drops straight away. Rilo charges the open when the session ends (halves, as before). Rilo also gets a `shieldUnlocked` event, so the next open's wait grows (5 → 10 → 15 → 20s). |

## 3. The Live Activity (Dynamic Island timer)

| Question | Answer |
|---|---|
| Can the app start one? | **Yes**, while Rilo is on screen (`Activity.request`). |
| Can the ShieldAction or DeviceActivityMonitor extension start one? | **Unknown (needs your phone).** The SDK doesn't mark `Activity.request` unavailable in extensions, so it compiles. But Apple documents Live Activities as started by the app in the foreground, by a schedule the app set up while in the foreground, or by a server push. The error list includes `unsupportedTarget` and `visibility`, which is what an extension would most likely get. |
| Push-to-start? | **Not for Rilo.** It needs a server sending Apple push notifications, and Rilo promises no servers. |
| Scheduled start (iOS 26+, `request(…start:)`)? | It has to be set up by the app in the foreground before the open happens, so it can't start a timer for an open that happens later. |

What I built (closest real version):
1. **The shield tries to start the Live Activity itself.** The result is saved either way.
2. **If iOS says no:**
   - A time-sensitive notification appears instead: "your app · 10 min / rilo locks it again when the time's up. tap here when you're done."
   - The next time Rilo opens during that open, it starts the Live Activity (allowed then) and shows the relock screen.
3. **Opens started inside Rilo** (the check-in screen) always get the Live Activity, because Rilo is on screen.

## 4. Opening Rilo from the shield

The ScreenZen note ("shields can't open the parent app") is out of date. iOS 26.5 added `ShieldActionResponse.openParentalControlsApp`. It is in the 27.2 SDK, and Rilo's minimum is iOS 27.

- Developers report it working with `.individual` authorization on iOS 27.0.1 (see the links). I couldn't find Apple documentation that says so.
- Rilo uses it for **"talk to rilo"** when the app is out of opens, blocked, or in bedtime / school / focus. Rilo opens straight onto that app's check-in, with the emergency pass rules.
- That replaces the old "tap the notification" detour on locked shields.
- **(needs your phone)**: check that it opens Rilo on yours.

## 5. Tapping the Live Activity

- **Yes, it opens Rilo.** That's the default for a Live Activity, and no URL scheme is needed.
- While an open is running, Rilo always lands on the relock screen. That screen has:
  - the time left
  - "what was it for?" reason chips
  - **done? relock it**
  - **talk to rilo**

## 6. App names

- **Apple's shield gets the app's real name**, so the shield says "hey. instagram again?".
- **Everywhere else, Apple never tells Rilo the name.** Inside Rilo, iOS can draw it with `Label(token)`, which Rilo uses for the chips.
- **The Live Activity is drawn by iOS from Rilo's widget extension.** It can only show a name the user typed in You ▸ advanced ▸ "name my apps"; otherwise it says "your app · 9:42 left".
- **Writing Apple's name from the shield extension into storage Rilo can read would get around Apple's privacy design.** It would also break the promise in the Family Controls request, so I didn't do it.

## Links
- [crashcards PR: answering the shield's button by opening the app](https://github.com/AdvayMonga/crashcards/pull/22)
- [focus-study issue #197: device check of the open action under individual authorization](https://github.com/AndrewDongminYoo/focus-study/issues/197)
- [focus-study PR #202: shield name + open button](https://github.com/AndrewDongminYoo/focus-study/pull/202)
- [screen-time-api-agent-skill v1.1.0: iOS 27 SDK re-verification](https://github.com/Siddhu7007/screen-time-api-agent-skill/releases/tag/v1.1.0)
- [WWDC26: Live Activities essentials](https://developer.apple.com/videos/play/wwdc2026/223/)
- [ScreenZen on the App Store (4.0 notes: Live Activity countdown, interventions from the shield)](https://apps.apple.com/fm/app/screenzen-screen-time-control/id1541027222)

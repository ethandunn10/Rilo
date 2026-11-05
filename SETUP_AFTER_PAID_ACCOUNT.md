# What to do once you have the $99 Apple Developer account

Right now Rilo uses **pretend blocking** (the same as the web demo). The real blocking code is written, is built into the app every time, and is switched **off** by one line:

```swift
// Rilo/Rilo/Models/FeatureFlags.swift
static let REAL_SCREEN_TIME = false
```

`false` = pretend blocking. `true` = real blocking with Apple's Screen Time. That's the only switch. Flip it back to `false` any time to go back to pretend.

Before `true` can work, you do a one-time setup below. Do the steps in order and tick them off. Most of it is clicking in Xcode and on Apple's website.

**Words you'll see:**
- **Family Controls** is Apple's permission that lets an app block other apps. On your own iPhone it works as soon as you add it. For TestFlight and the App Store, Apple has to approve it ("distribution").
- An **extension** is a small extra piece of the app that iOS runs by itself. Rilo has four: the block screen, the block screen's buttons, the timer watcher, and the home-screen widget.
- An **App Group** is a shared drawer, so the app and its extensions can read the same data (like which apps you picked and Rilo's mood).
- A **target** is Xcode's name for "one thing it builds". The app is one target, and each extension is another.

---

## Part 1: Apple's website (about 20 minutes, then waiting)

1. **Wait for the account to activate.** Apple emails you when the Developer Program membership is active (can take up to a day).
2. **Sign the Paid Apps agreement:** App Store Connect ▸ Business ▸ Agreements. Add your bank and tax info. Needed before Rilo Pro can be sold.
3. **Ask Apple for Family Controls (Distribution) now,** because the answer can take days to weeks. Form: https://developer.apple.com/contact/request/family-controls-distribution
   - Ask for each of these four bundle IDs (the widget doesn't need it):
     `com.ethandunn.Rilo`, `com.ethandunn.Rilo.RiloShieldConfiguration`, `com.ethandunn.Rilo.RiloShieldAction`, `com.ethandunn.Rilo.RiloActivityMonitor`
   - If the form only takes one at a time, send it once per ID.
   - What to say: "Rilo is a screen-time app for people 13 and older that helps them limit their own app use. It uses Family Controls with individual authorization (the person controls their own phone), shields the apps they pick, and suggests things to do instead. All Screen Time data stays on the device."
   - **You don't have to wait for this to test on your own iPhone.** Only TestFlight and the App Store need Apple's yes.

## Part 2: Xcode, one time (about 45 minutes)

Open `Rilo/Rilo.xcodeproj`.

4. **Pick the paid team:** click the blue **Rilo** project at the top of the left list ▸ the **Rilo** target ▸ **Signing & Capabilities** ▸ **Team** ▸ your paid team. Keep "Automatically manage signing" ticked.
5. **Add two capabilities to the app** (same tab): **+ Capability** ▸ **Family Controls**. Then **+ Capability** ▸ **App Groups** ▸ the **+** under it ▸ type `group.com.ethandunn.Rilo` ▸ OK, and make sure it's ticked. (The name must be exactly this. The code uses it.)
6. **Add the four extensions.** Do this four times: **File ▸ New ▸ Target…**, search for the template, use exactly this Product Name, and click **Finish**. If Xcode asks to "Activate" a scheme, click **Cancel**.

   | Template | Product Name |
   |---|---|
   | Shield Configuration Extension | `RiloShieldConfiguration` |
   | Shield Action Extension | `RiloShieldAction` |
   | Device Activity Monitor Extension | `RiloActivityMonitor` |
   | Widget Extension (untick "Live Activity" and "Configuration App Intent") | `RiloWidget` |

7. **Put Rilo's code in each extension.** Xcode made a folder per extension with a sample `.swift` file inside.
   - In Xcode's left list, open each new folder, right-click the sample `.swift` file ▸ **Delete** ▸ **Move to Trash**.
   - Then drag Rilo's file into that folder (from Finder: `Rilo/ScreenTimeReal/…`). In the box that pops up, tick **only** that extension's target:
     - `Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift` → **RiloShieldConfiguration**
     - `Extensions/ShieldAction/ShieldActionExtension.swift` → **RiloShieldAction**
     - `Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift` → **RiloActivityMonitor**
     - `RiloWidget/RiloWidget.swift` → **RiloWidget**
8. **Share three files with the extensions.** They're already in the app, in `Rilo/Rilo/ScreenTimeReal/Shared/`. Click each one in Xcode's left list, open the right-hand panel (File inspector), and under **Target Membership** tick:
   - `AppGroup.swift` and `RiloShared.swift` → all four extensions
   - `RiloTokens.swift` → RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor (**not** the widget)
9. **Share Rilo's pictures:** click `Rilo/Rilo/Assets.xcassets` ▸ File inspector ▸ **Target Membership** ▸ also tick **RiloShieldConfiguration** and **RiloWidget**.
10. **Check each blocking extension's Info.plist:** in its folder ▸ `Info.plist` ▸ NSExtension ▸ `NSExtensionPrincipalClass` should be `$(PRODUCT_MODULE_NAME).ShieldConfigurationExtension`, `$(PRODUCT_MODULE_NAME).ShieldActionExtension` or `$(PRODUCT_MODULE_NAME).DeviceActivityMonitorExtension`.
11. **Capabilities for the extensions:** click each new target ▸ **Signing & Capabilities**, set the same **Team**, then:
    - RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor: **+ Family Controls** and **+ App Groups** (tick `group.com.ethandunn.Rilo`)
    - RiloWidget: **+ App Groups** only (tick the same group)
12. **Build** (⌘B) with the switch still `false`. If something's red, it's almost always a file not ticked for the right target in step 7 or 8.

## Part 3: test real blocking on your iPhone (it doesn't work in the simulator)

13. **Flip the switch:** in `Rilo/Rilo/Models/FeatureFlags.swift` change `REAL_SCREEN_TIME = false` to `true`.
14. Plug in your iPhone and unlock it. On the phone: Settings ▸ Privacy & Security ▸ **Developer Mode** ▸ on (it restarts). If Xcode asks you to trust the computer or register the device, say yes.
15. In Xcode, pick your iPhone at the top and press **Run** (▶). The first time, the phone may say "Untrusted Developer": Settings ▸ General ▸ VPN & Device Management ▸ your account ▸ Trust.
16. Go through onboarding. When Rilo asks for Screen Time, iOS shows **its own** pop-up: tap **Continue**, then allow with Face ID / passcode. Then **allow notifications** (the block screen's "talk to rilo" button uses one to bring you into Rilo).
17. **Pick apps with Apple's picker** (it replaces Rilo's list automatically when the switch is on). Pick something like Instagram.
18. **Test it:**
    - Go to the home screen and open Instagram. You should see **Rilo's block screen** instead of the app.
    - Tap "talk to rilo", answer "what for?", and try a **quick (½)** open and a **full** open.
    - Let a full open's time run out. The app should be blocked again.
    - Try the emergency pass, and strict mode from the You tab.
    - Next day: check that opens reset.
19. **Widget:** long-press the home screen ▸ **+** ▸ Rilo.
20. To go back to pretend blocking any time: set the switch to `false` and Run again.

**What's different from pretend blocking (Apple's rules, not bugs):**
- Apple never tells Rilo which app is which. App **icons** switch to Apple's real ones automatically, but anywhere Rilo **writes** an app's name in a sentence ("2 opens left on tiktok") you'll see a code like `app-1a2b3c4d` instead. Fixing those sentences is the next job after your first phone test. Note which screens look wrong.
- iOS checks timers in 15-minute windows at the shortest, so "reopen within 2 minutes continues the same session" can stretch to 15 minutes for short opens.

## Part 4: Rilo Pro in App Store Connect

21. App Store Connect ▸ **Apps ▸ +** ▸ New App: name "Rilo: Screen Time Buddy", bundle ID `com.ethandunn.Rilo`. Copy the listing from `APP_STORE.md`.
22. **Monetization ▸ Subscriptions:** create the group **Rilo Pro** with two subscriptions:
    - `com.ethandunn.rilo.pro.monthly`: $4.99, 1 month
    - `com.ethandunn.rilo.pro.yearly`: $39.99, 1 year

    For each one, add an **Introductory Offer**: Free, 1 week. The IDs must match exactly. The app already uses them.
23. Nothing to switch off for release: the tester unlock, the demo panel and the "demo: +500 xp" buttons only exist in Debug builds. Every Archive (TestFlight and App Store) leaves them out automatically. In TestFlight, testers "buy" Rilo Pro with free test money.

## Part 5: TestFlight and App Review

24. **Wait for Apple's Family Controls (Distribution) email** from step 3. Without it, the upload in the next step fails (or the build won't install) for any build with the extensions.
25. Make sure `REAL_SCREEN_TIME = true`. Then in Xcode pick **Any iOS Device** at the top ▸ **Product ▸ Archive** ▸ **Distribute App** ▸ **App Store Connect** ▸ Upload.
26. App Store Connect ▸ TestFlight: add the "What to Test" text from `TESTFLIGHT_NOTES.md`, add testers by email, send it.
27. When you submit for review, add this note: "Rilo uses Family Controls (individual authorization) so a person can limit their own apps. All Screen Time data stays on the device."

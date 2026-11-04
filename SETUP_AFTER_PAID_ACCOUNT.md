# What to do once you have the $99 Apple Developer account

Right now Rilo runs on the free account, with **pretend blocking** (the same as the web demo). The real blocking code is already written. It lives in `Rilo/ScreenTimeReal/` and is switched off. This list turns it on, step by step. Do the steps in order and tick them off. If a step looks scary, that's normal: it's mostly clicking in Xcode and on Apple's website.

**Words you'll see:**
- **Family Controls** is Apple's permission that lets an app block other apps. Apple has to approve it.
- An **extension** is a small extra piece of the app that iOS runs by itself. The block screen, its buttons, the timer watcher and the widget are each one.
- An **App Group** is a shared drawer, so the app, the extensions and the widget can all read the same data (like Rilo's mood).
- A **target** is Xcode's name for "one thing it builds". The app is one target, and each extension is another.

---

## Part 1: Apple's website (about 20 minutes, then waiting)

1. **Join the Apple Developer Program** ($99/year) at developer.apple.com/programs with your Apple ID. It can take a day to activate.
2. **Sign the Paid Apps agreement:** App Store Connect ▸ Business ▸ Agreements. This is needed before Rilo Pro can be sold. Add your bank and tax info there too.
3. **Create the App Group:** developer.apple.com ▸ Account ▸ Certificates, IDs & Profiles ▸ Identifiers ▸ the **+** button ▸ App Groups ▸ ID: `group.com.ethandunn.Rilo`.
4. **Ask Apple for Family Controls (Distribution):** fill in the form at developer.apple.com/contact/request/family-controls-distribution.
   - You need it for the app **and** for each extension: `com.ethandunn.Rilo`, `com.ethandunn.Rilo.RiloShieldConfiguration`, `com.ethandunn.Rilo.RiloShieldAction`, `com.ethandunn.Rilo.RiloActivityMonitor`.
   - Say what Rilo does: it helps teens 13+ limit their own app use, with a fair number of opens and suggestions for what to do instead. Everything stays on the phone.
   - **You can test on your own iPhone while you wait.** Only TestFlight and the App Store need Apple's yes, and that can take a few days to a few weeks.

## Part 2: Xcode (about 45 minutes)

Open `Rilo/Rilo.xcodeproj`.

5. **Pick the paid team:** click the blue Rilo project at the top left ▸ the **Rilo** target ▸ **Signing & Capabilities** ▸ Team. Pick your paid team. Keep "Automatically manage signing" ticked.
6. **Add two capabilities to the app:** on the same tab, click **+ Capability** ▸ **Family Controls**. Then **+ Capability** ▸ **App Groups**, and tick `group.com.ethandunn.Rilo`.
7. **Add the four extensions.** Do this four times: **File ▸ New ▸ Target…** and pick each one below. Use exactly these names and click **Finish**. If Xcode asks to "Activate" a scheme, say **Cancel**.

   | Template to pick | Product Name |
   |---|---|
   | Shield Configuration Extension | `RiloShieldConfiguration` |
   | Shield Action Extension | `RiloShieldAction` |
   | Device Activity Monitor Extension | `RiloActivityMonitor` |
   | Widget Extension (untick "Live Activity" and "Configuration App Intent") | `RiloWidget` |

8. **Swap in Rilo's real code.** Each new target came with a sample Swift file:
   - Delete that file (choose **Move to Trash**).
   - Drag Rilo's file in from `Rilo/ScreenTimeReal/` and tick the right targets in the box that pops up. The full table is in `Rilo/ScreenTimeReal/README.md`. In short:
     - `Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift` → RiloShieldConfiguration
     - `Extensions/ShieldAction/ShieldActionExtension.swift` → RiloShieldAction
     - `Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift` → RiloActivityMonitor
     - `RiloWidget/RiloWidget.swift` → RiloWidget
     - `FamilyControlsScreenTimeService.swift` and `AppPickerView.swift` → Rilo (the app)
     - `Shared/AppGroup.swift` and `Shared/RiloShared.swift` → the app + all four new targets
     - `Shared/RiloTokens.swift` → the app + the three blocking extensions (not the widget)
9. **Check each extension's Info.plist.** Open the extension's folder ▸ Info.plist ▸ NSExtension ▸ `NSExtensionPrincipalClass`. It should be `$(PRODUCT_MODULE_NAME).ShieldConfigurationExtension`, `…ShieldActionExtension`, or `…DeviceActivityMonitorExtension`.
10. **Add capabilities to the extensions:** click each new target ▸ Signing & Capabilities:
    - the three blocking extensions get **Family Controls** + **App Groups** (tick the group)
    - **RiloWidget** gets **App Groups** only
11. **Share Rilo's pictures:** click `Rilo/Rilo/Assets.xcassets` in the left list. In the right panel, under **Target Membership**, also tick **RiloShieldConfiguration** and **RiloWidget**.
12. **Flip the switch:** for the **Rilo** target and each of the four new targets, go to **Build Settings**, search "Active Compilation Conditions", and add `RILO_FAMILY_CONTROLS` to both Debug and Release. This one word turns the real blocking on (the line is in `Rilo/Rilo/Services/ScreenTimeService.swift`, `ScreenTime.make()`).
13. **Use Apple's app picker:** in `Views/Onboarding/PickAppsView.swift` and `Views/You/YouView+Settings.swift`, replace `AppPicker` with `AppPickerView`. Then, wherever an app's name or logo shows, use `RiloAppLabel`. Apple never tells Rilo the real app names, only its own label. The comments in `AppPickerView.swift` show exactly where.
14. **Build** (⌘B). If something's red, it's almost always a file not ticked for the right target in step 8.

## Part 3: test on your iPhone (blocking does NOT work in the simulator)

15. Plug in your iPhone. On the phone, turn on Settings ▸ Privacy & Security ▸ **Developer Mode** (it restarts).
16. In Xcode, pick your iPhone at the top and press **Run** (▶).
17. Go through onboarding. When Rilo asks for Screen Time, iOS shows its own Screen Time permission; tap **Continue** and **Allow**. Then **allow notifications** too: the block screen's "talk to rilo" button uses one to bring you back into Rilo.
18. Pick an app (like Instagram), set it to **Limited**, then go to the home screen and open that app. You should see **Rilo's block screen**. Try "talk to rilo", a quick (½) open and a full open, and let the timer run out.
19. Add the **widget:** long-press the home screen ▸ **+** ▸ Rilo. It should show Rilo's face and today's mood.

What's different from the pretend version (Apple's rules, not bugs):
- Apple never tells Rilo which app is which, so the app names and logos come from Apple's label.
- iOS checks timers in 15-minute windows at the shortest, so "reopen within 2 minutes continues the same session" can stretch to 15 minutes for short opens.

## Part 4: Rilo Pro in App Store Connect

20. App Store Connect ▸ **My Apps ▸ +** ▸ New App: name "Rilo: Screen Time Buddy", bundle ID `com.ethandunn.Rilo`. Copy the listing from `APP_STORE.md`.
21. **Monetization ▸ Subscriptions:** create the group **Rilo Pro** with two subscriptions:
    - `com.ethandunn.rilo.pro.monthly`: $4.99, 1 month
    - `com.ethandunn.rilo.pro.yearly`: $39.99, 1 year

    For each one, add an **Introductory Offer**: Free, 1 week. The IDs must match exactly; the app already uses them.
22. Turn off the tester unlock for the real release: in `Rilo/Rilo/Models/FeatureFlags.swift` set `TESTERS_UNLOCK_ALL = false` and `SHOW_DEMO_PANEL = false`. Keep both `true` for TestFlight testers if you like.

## Part 5: TestFlight

23. Once Apple approves Family Controls (Distribution): in Xcode, **Product ▸ Archive** ▸ **Distribute App** ▸ **TestFlight & App Store** ▸ Upload.
24. In App Store Connect ▸ TestFlight, add the "What to Test" text from `TESTFLIGHT_NOTES.md`, add testers by email, and send it.
25. For App Review later, add a note: "Rilo uses Family Controls (individual authorization) so a user can limit their own apps. All data stays on the device."

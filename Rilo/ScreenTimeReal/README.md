# Real app blocking (Family Controls)

The real Screen Time code is split in two:

- **The app's half is built into the app every time**, in `Rilo/Rilo/ScreenTimeReal/`
  (`FamilyControlsScreenTimeService`, `AppPickerView` + `RiloAppLabel`, and
  `Shared/`). So it's always compiled and can't silently break while it's off.
- **The extensions' half is here**, waiting for their targets
  (`Extensions/…` and `RiloWidget/`). They need the paid account, so they get
  added in Xcode (SETUP_AFTER_PAID_ACCOUNT.md, Part 2).

No file needs a compiler flag any more.

## The one switch

`Rilo/Rilo/Models/FeatureFlags.swift`:

```swift
static let REAL_SCREEN_TIME = false   // true = real blocking
```

`ScreenTime.make()` (`Rilo/Rilo/Services/ScreenTimeService.swift`) reads it. When
it's true:
- the service is `FamilyControlsScreenTimeService` (real shields, real timers)
- onboarding and the You tab show Apple's picker (`AppPickerView`) instead of
  Rilo's own list (they check `ScreenTime.isReal`)
- `AppLogo` draws Apple's real icon for a picked app's key (`app-…` / `cat-…`)

DEBUG `-screen …` seeds and the `-selfcheck` / `-flowcheck` checks always use the
demo service, so screenshots and checks keep working either way.

## Files and their targets

| File | Target(s) |
|---|---|
| `Rilo/Rilo/ScreenTimeReal/FamilyControlsScreenTimeService.swift` | Rilo (automatic) |
| `Rilo/Rilo/ScreenTimeReal/AppPickerView.swift` | Rilo (automatic) |
| `Rilo/Rilo/ScreenTimeReal/Shared/AppGroup.swift` | Rilo (automatic) + RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor, RiloWidget |
| `Rilo/Rilo/ScreenTimeReal/Shared/RiloShared.swift` | Rilo (automatic) + RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor, RiloWidget |
| `Rilo/Rilo/ScreenTimeReal/Shared/RiloTokens.swift` | Rilo (automatic) + RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor (**not** the widget) |
| `Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift` | RiloShieldConfiguration |
| `Extensions/ShieldAction/ShieldActionExtension.swift` | RiloShieldAction |
| `Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift` | RiloActivityMonitor |
| `RiloWidget/RiloWidget.swift` | RiloWidget |
| `Rilo/Rilo/Assets.xcassets` (existing) | also RiloShieldConfiguration + RiloWidget (Rilo images `rilo-<skin>-<mood>`) |

The shared files must not use anything that only exists in the app (like
`FeatureFlags`), or the extensions won't build.

Checked on Nov 5, 2026 (Xcode 27.2): the app builds in Debug and Release with the
real code in it, and each extension's file type-checks against the iOS SDK with
its shared files.

## How the demo flow maps onto the phone

| Demo | Real |
|---|---|
| `openApp` → `ShieldView` | iOS shows the shield (ShieldConfigurationExtension: same title, line and buttons as Shield.jsx) |
| banner "tap to talk" | ShieldActionExtension posts Rilo's local notification. Opening the app hands over `.shieldTapped`, which goes to Intercept (`openedFromShield`) |
| intercept → whyopen → Quick ½ / Full 1 | the same Rilo screens. `startSession` lifts that app's shield and starts a DeviceActivity window with "minutes used" thresholds (half and all) |
| AppOpenView timer runs out | the monitor shields it again and posts `.sessionEnded`, which the app charges in halves (`finishSession`) |
| day roll-over | the `rilo.daily` schedule (midnight, repeating) clears the session and re-shields, even with Rilo closed |
| strict mode | `rules.strict`: no half marker (no halves), `denyAppRemoval` on (no deleting an app to get around Rilo) |

Blocked, Limited and Free apps are all shielded until Rilo asks "what for?" (same
as the demo's `openApp`). Always-allowed apps never are. To leave Free apps
unshielded, change `ScreenTimeRules.shields(_:)`.

## Known limits of the real APIs
- Apple never tells the app which app a token is. Each pick gets a stable key
  ("app-1a2b3c4d"). Icons are handled (`AppLogo`), but text that writes an app's
  name in a sentence will show the key until those spots use `RiloAppLabel`.
- DeviceActivity windows must be at least 15 minutes long, so the "reopen within
  2 minutes carries on" window is really up to 15 minutes for short opens.
- If they leave the app early, the monitor only knows whether they passed half
  the minutes, which is all the halves rule needs.
- `AppOpenView`'s timer pauses while Rilo is in the background. With real
  blocking, people spend the session in the other app, so the `.sessionEnded`
  event is what charges it. Worth switching that timer to wall-clock time
  (`session` start time) once this is on.

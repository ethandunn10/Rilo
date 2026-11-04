# ScreenTimeReal: real app blocking, ready to switch on

Everything in this folder is written but **not compiled**. It sits outside the
synced `Rilo/Rilo/` folder, so Xcode ignores it, and every file is also wrapped in
`#if RILO_FAMILY_CONTROLS`. Real blocking needs Apple's Family Controls
entitlement and an App Group, and both need the paid Apple Developer account.

Until then the app uses `DemoScreenTimeService`, which behaves exactly like the web demo.

## The one switch

`Rilo/Rilo/Services/ScreenTimeService.swift`, in `ScreenTime.make()`:

```swift
#if RILO_FAMILY_CONTROLS
return FamilyControlsScreenTimeService()
#else
return DemoScreenTimeService()
#endif
```

Defining `RILO_FAMILY_CONTROLS` (Build Settings ▸ Swift Compiler ▸ Active
Compilation Conditions) flips it. DEBUG `-screen …` seeds and `-selfcheck` always
use the demo, so screenshots and checks keep working.

## Files and their targets

| File | Target(s) |
|---|---|
| `FamilyControlsScreenTimeService.swift` | Rilo (app) |
| `AppPickerView.swift` (`AppPickerView`, `RiloAppLabel`) | Rilo (app) |
| `Shared/AppGroup.swift` | Rilo, RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor, RiloWidget |
| `Shared/RiloShared.swift` | Rilo, RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor, RiloWidget |
| `Shared/RiloTokens.swift` | Rilo, RiloShieldConfiguration, RiloShieldAction, RiloActivityMonitor (**not** the widget) |
| `Extensions/ShieldConfiguration/ShieldConfigurationExtension.swift` | RiloShieldConfiguration (Shield Configuration Extension) |
| `Extensions/ShieldAction/ShieldActionExtension.swift` | RiloShieldAction (Shield Action Extension) |
| `Extensions/DeviceActivityMonitor/DeviceActivityMonitorExtension.swift` | RiloActivityMonitor (Device Activity Monitor Extension) |
| `RiloWidget/RiloWidget.swift` | RiloWidget (Widget Extension) |
| `Rilo/Rilo/Assets.xcassets` (existing) | add RiloShieldConfiguration + RiloWidget to its target membership (Rilo images `rilo-<skin>-<mood>`) |

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

## Known limits of the real APIs (written into the code)
- Apple never tells the app which app a token is. Each pick gets a stable key
  ("app-1a2b3c4d") and the UI must show `RiloAppLabel(key:)` (`Label(token)`)
  wherever it shows an app's name or logo today.
- DeviceActivity windows must be at least 15 minutes long, so the "reopen within
  2 minutes carries on" window is really up to 15 minutes for short opens.
- If they leave the app early, the monitor only knows whether they passed half
  the minutes, which is all the halves rule needs.
- `AppOpenView`'s timer pauses while Rilo is in the background. With real
  blocking, people spend the session in the other app, so the `.sessionEnded`
  event is what charges it. Worth switching that timer to wall-clock time
  (`session` start time) once this is on.

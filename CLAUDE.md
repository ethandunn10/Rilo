# Rilo: rules for Claude (read AGENTS.md too)

The real app is the SwiftUI iPhone app in Rilo/. The web demo (app*/ folders) is old; don't work on it unless a job says so.

Hard rules, autopilot or not:
- Never push to GitHub, never deploy, never run `vercel`.
- Never touch signing, Team, bundle IDs, entitlements, capabilities, App Group names, or Info.plist principal classes. Those are set by hand in Xcode.
- Never flip FeatureFlags.REAL_SCREEN_TIME.
- Don't edit Rilo.xcodeproj by hand. Files dropped in the existing folders get picked up automatically.
- Don't change the mascot, the logo/app icon, the grass theme, skins, or the privacy promises on rilo.one/privacy (everything stays on the phone).
- No real API keys, no paid services, never open .env files.
- After every job, prove the app still builds:
  xcodebuild -project Rilo/Rilo.xcodeproj -scheme Rilo -destination 'generic/platform=iOS Simulator' build CODE_SIGNING_ALLOWED=NO -quiet
  If it doesn't build, fix it before anything else. Never leave main broken.
- Small commits with clear messages. If a job needs a big rewrite, skip it and write it in nextsessions/OPEN-ASKS.md.

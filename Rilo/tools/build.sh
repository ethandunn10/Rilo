#!/bin/zsh
# build the iOS app for the simulator; prints errors/warnings + result
cd /Users/ethandunn/Projects/rilo/Rilo
xcodebuild -project Rilo.xcodeproj -scheme Rilo -destination 'platform=iOS Simulator,name=iPhone 17' build CODE_SIGNING_ALLOWED=NO 2>&1 | grep -E "(error|warning):|BUILD (SUCCEEDED|FAILED)" | grep -v "Stale file\|^ld: warning\|appintentsmetadataprocessor" | sort -u | head -${1:-40}

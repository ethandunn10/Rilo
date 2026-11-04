#!/bin/zsh
# build for the simulator. env DD=<derived data dir> (default: shared). prints errors/warnings + result
DD=${DD:-/Users/ethandunn/Projects/rilo/Rilo/DerivedData/main}
cd /Users/ethandunn/Projects/rilo/Rilo
xcodebuild -project Rilo.xcodeproj -scheme Rilo -destination 'generic/platform=iOS Simulator' -derivedDataPath $DD build CODE_SIGNING_ALLOWED=NO 2>&1 | grep -E "(error|warning):|BUILD (SUCCEEDED|FAILED)" | grep -v "Stale file\|^ld: warning\|appintentsmetadataprocessor" | sort -u | head -${1:-40}

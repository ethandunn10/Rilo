#!/bin/zsh
# usage: shot.sh <out.png> [launch args...]   installs latest build, launches, screenshots
OUT=$1; shift
DEV=C357EAAD-CEFF-49DD-ACBF-D2C5E75288E1   # iPhone 17
xcrun simctl boot $DEV 2>/dev/null
xcrun simctl bootstatus $DEV -b >/dev/null 2>&1
APP=$(ls -d ~/Library/Developer/Xcode/DerivedData/Rilo-*/Build/Products/Debug-iphonesimulator/Rilo.app | head -1)
xcrun simctl install $DEV "$APP"
xcrun simctl status_bar $DEV override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 2>/dev/null
xcrun simctl terminate $DEV com.ethandunn.Rilo 2>/dev/null
xcrun simctl launch $DEV com.ethandunn.Rilo "$@" >/dev/null
sleep ${SHOT_WAIT:-9}
mkdir -p $(dirname $OUT)
xcrun simctl io $DEV screenshot "$OUT" >/dev/null 2>&1 && echo "saved $OUT"

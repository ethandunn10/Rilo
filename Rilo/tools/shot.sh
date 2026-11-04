#!/bin/zsh
# usage: shot.sh <out.png> [launch args...]  env DD=<derived data>, DEV=<simulator udid>
OUT=$1; shift
DD=${DD:-/Users/ethandunn/Projects/rilo/Rilo/DerivedData/main}
DEV=${DEV:-C357EAAD-CEFF-49DD-ACBF-D2C5E75288E1}
xcrun simctl boot $DEV 2>/dev/null
xcrun simctl bootstatus $DEV -b >/dev/null 2>&1
xcrun simctl install $DEV "$DD/Build/Products/Debug-iphonesimulator/Rilo.app"
xcrun simctl status_bar $DEV override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 2>/dev/null
xcrun simctl terminate $DEV com.ethandunn.Rilo 2>/dev/null
xcrun simctl launch $DEV com.ethandunn.Rilo "$@" >/dev/null
sleep ${SHOT_WAIT:-9}
mkdir -p $(dirname $OUT)
xcrun simctl io $DEV screenshot "$OUT" >/dev/null 2>&1 && echo "saved $OUT"

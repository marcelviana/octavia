#!/bin/sh
# uso: dump.sh <serial> <nome> — uiautomator dump para dumps/<nome>.xml e dumps/<nome>.dp
ADB=$HOME/Library/Android/sdk/platform-tools/adb
D=$(dirname $0)/dumps
$ADB -s $1 shell uiautomator dump /sdcard/w4b3.xml > /dev/null 2>&1
$ADB -s $1 pull /sdcard/w4b3.xml $D/$2.xml > /dev/null 2>&1
node $(dirname $0)/dp.mjs $D/$2.xml > $D/$2.dp
wc -l < $D/$2.dp

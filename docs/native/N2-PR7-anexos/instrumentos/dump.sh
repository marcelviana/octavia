#!/bin/sh
# uso: dump.sh <serial> <nome> [--todos] — uiautomator dump para dumps/<nome>.xml e o resumo em dp
ADB=$HOME/Library/Android/sdk/platform-tools/adb
$ADB -s $1 shell uiautomator dump /sdcard/n2pr7.xml > /dev/null 2>&1
$ADB -s $1 pull /sdcard/n2pr7.xml $SCR/dumps/$2.xml > /dev/null 2>&1
python3 $SCR/resumo.py $SCR/dumps/$2.xml "$3"

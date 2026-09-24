#!/bin/sh
# N3 pre-check — fixa a rotação: rot.sh <serial> <0|1|2|3>  (lê e imprime antes/depois; o estado lido fica em estado/*-lido.txt)
ADB=$HOME/Library/Android/sdk/platform-tools/adb
$ADB -s $1 shell settings put system accelerometer_rotation 0
$ADB -s $1 shell settings put system user_rotation $2
sleep 2
echo "$1 accel=$($ADB -s $1 shell settings get system accelerometer_rotation) user_rot=$($ADB -s $1 shell settings get system user_rotation) $($ADB -s $1 shell dumpsys window displays | grep -o 'mCurrentRotation=[A-Z_0-9]*' | head -1) $($ADB -s $1 shell wm size | tail -1)"

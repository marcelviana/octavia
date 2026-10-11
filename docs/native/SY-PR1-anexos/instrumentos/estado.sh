#!/bin/sh
# SY-PR1 — o estado do aparelho, LIDO (APARATO.md, "Estado do aparelho: ler, declarar, restaurar"). Instrumento de anexo.
#   sh estado.sh <serial>
ADB=~/Library/Android/sdk/platform-tools/adb
S=$1
echo "# estado de $S — $(date '+%Y-%m-%d %H:%M:%S %z')"
for k in "global stay_on_while_plugged_in" "system accelerometer_rotation" "system user_rotation" "global airplane_mode_on" "global wifi_on" "global mobile_data"; do
  echo "$k = $($ADB -s "$S" shell settings get $k | tr -d '\r')"
done
echo "reverse: [$($ADB -s "$S" reverse --list | tr '\n' ' ')]"
$ADB -s "$S" shell dumpsys package rocks.octavia.app | grep -E "lastUpdateTime|versionName|pkgFlags=" | sed 's/^ */  /' | sort -u
echo "app em execução: $($ADB -s "$S" shell pidof rocks.octavia.app | tr -d '\r')"
echo "\$ ping -c 2 -W 2 8.8.8.8"
$ADB -s "$S" shell ping -c 2 -W 2 8.8.8.8 2>&1 | tail -2

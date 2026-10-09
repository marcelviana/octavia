#!/bin/sh
# estado.sh <serial> — o estado do aparelho que a sessão muda (APARATO.md, "Estado do aparelho: ler, declarar, restaurar")
A=~/Library/Android/sdk/platform-tools/adb; S=$1
g() { $A -s $S shell settings get $1 $2 | tr -d '\r'; }
echo "stay_on=$(g global stay_on_while_plugged_in) accel=$(g system accelerometer_rotation) user_rot=$(g system user_rotation) airplane=$(g global airplane_mode_on) wifi=$(g global wifi_on) data=$(g global mobile_data)"
echo "reverse: [$($A -s $S reverse --list | tr '\n' ' ')]"
$A -s $S shell dumpsys package rocks.octavia.app | grep -E 'lastUpdateTime|pkgFlags' | head -2 | sed 's/^ *//'
echo "ping: $($A -s $S shell ping -c 1 -W 2 8.8.8.8 2>&1 | head -2 | tail -1 | tr -d '\r')"

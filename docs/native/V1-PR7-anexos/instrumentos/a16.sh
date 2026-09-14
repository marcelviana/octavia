#!/bin/sh
# A16 — 15 min sem toque no palco. Lê o estado da tela por dumpsys (leitura pura,
# não toca no aparelho) a cada 60 s. T0 = 10:38:21.
export PATH="$HOME/Library/Android/sdk/platform-tools:$PATH"
for i in $(seq 0 16); do
  W=$(adb -s RX2N8000F3D shell dumpsys power | grep -oE "mWakefulness=[A-Za-z]+" | head -1)
  L=$(adb -s RX2N8000F3D shell dumpsys power | grep -c "ws=WorkSource{10292}")
  S=$(adb -s RX2N8000F3D shell dumpsys window | grep -oE "mScreenOnFully=[a-z]+" | head -1)
  K=$(adb -s RX2N8000F3D shell dumpsys window | grep -oE "mDreamingLockscreen=[a-z]+" | head -1)
  echo "$(date '+%H:%M:%S')  t=+${i}min  $W  $S  $K  wakelock_do_app=$L"
  sleep 60
done

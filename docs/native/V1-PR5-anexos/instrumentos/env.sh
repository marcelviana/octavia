source <repo>/scripts/native-env.sh
export SP=<scratch>
export U=Pw3bxXZw0iT3WwyL7kxGtGJIJH83
E() { adb -s emulator-5554 "$@"; }
RA() { adb -s emulator-5554 shell "run-as rocks.octavia.app sh -c \"$1\""; }
tap() { E shell input tap "$1" "$2"; }
lc() { E logcat -d -s ReactNativeJS | grep -o 'OCTAVIA: .*'; }
abrir() { E shell am force-stop rocks.octavia.app; E logcat -c; E shell am start -W -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' >/dev/null; sleep "${1:-10}"; }
dump() { mkdir -p "$1"; E shell screencap -p /sdcard/s.png && E pull /sdcard/s.png "$1/$2.png" >/dev/null && E shell uiautomator dump /sdcard/d.xml >/dev/null && E pull /sdcard/d.xml "$1/$2.xml" >/dev/null && echo "dump $2: $(wc -c < "$1/$2.xml") B xml, $(wc -c < "$1/$2.png") B png"; }
store() { RA "cd files/octavia-$U && sha256sum content.json setlists.json files-index.json files/* 2>&1"; }
pingprova() { echo "setting=$(E shell settings get global airplane_mode_on | tr -d '\r')"; E shell "ping -c 2 -W 2 8.8.8.8" 2>&1 | tail -3; }

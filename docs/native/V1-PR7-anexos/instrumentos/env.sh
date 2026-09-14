# As funções de condução dos DOIS aparelhos, como a V1-PR7 as usou.
# Caminhos anonimizados. `source <repo>/scripts/native-env.sh` põe ANDROID_HOME/JAVA_HOME.
source <repo>/scripts/native-env.sh
export SP=<scratch>
export U=<uid-da-conta-de-audit>        # o do AVD
export UP=<uid-da-conta-principal>      # o do Tab S6

# ---- AVD (emulator-5554), conta de audit
E()  { adb -s emulator-5554 "$@"; }
RA() { adb -s emulator-5554 shell "run-as rocks.octavia.app sh -c \"$1\""; }
tap() { E shell input tap "$1" "$2"; }
lc()  { E logcat -d -s ReactNativeJS | grep -o 'OCTAVIA: .*'; }
abrir() { E shell am force-stop rocks.octavia.app; E logcat -c; E shell am start -W -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' >/dev/null; sleep "${1:-12}"; }
dump() { mkdir -p "$1"; E shell screencap -p /sdcard/s.png && E pull /sdcard/s.png "$1/$2.png" >/dev/null && E shell uiautomator dump /sdcard/d.xml >/dev/null && E pull /sdcard/d.xml "$1/$2.xml" >/dev/null; }
store() { RA "cd files/octavia-$U && sha256sum content.json setlists.json files-index.json files/* 2>&1"; }
# AVIÃO NÃO É O VALOR DO SETTING, É O PING FALHANDO — e o corte vem ANTES de o app abrir.
pingprova() { echo "setting=$(E shell settings get global airplane_mode_on | tr -d '\r')"; E shell "ping -c 2 -W 2 8.8.8.8" 2>&1 | tail -3; }

# ---- Tab S6 (RX2N8000F3D), conta principal
# REGRA DO TABLET: "avião" aqui é SÓ o override da API (EXPO_PUBLIC_API_BASE_URL inline no
# Metro), NUNCA o rádio — foi o corte de rádio que deixou o Wi-Fi sem reconectar na V1-PR3.
T()   { adb -s RX2N8000F3D "$@"; }
TRA() { adb -s RX2N8000F3D shell "run-as rocks.octavia.app sh -c \"$1\""; }
ttap()  { T shell input tap "$1" "$2"; }
tlc()   { T logcat -d -s ReactNativeJS | grep -o 'OCTAVIA: .*'; }
tabrir() { T shell am force-stop rocks.octavia.app; T logcat -c; T shell am start -W -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' >/dev/null; sleep "${1:-14}"; }
tdump() { mkdir -p "$1"; T shell screencap -p /sdcard/s.png && T pull /sdcard/s.png "$1/$2.png" >/dev/null && T shell uiautomator dump /sdcard/d.xml >/dev/null && T pull /sdcard/d.xml "$1/$2.xml" >/dev/null; }

# ---- div. 75: antes de matar qualquer coisa na 8081, veja QUEM escuta, e desfaça o reverse.
# lsof -nP -iTCP:8081 -sTCP:LISTEN
# adb -s <id> reverse --remove-all   ANTES do kill

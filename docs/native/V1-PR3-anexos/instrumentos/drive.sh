# helpers de condução do AVD (emulator-5554). source depois do env.sh
tap() { E shell input tap "$1" "$2"; }
lc() { E logcat -d -s ReactNativeJS | grep -o 'OCTAVIA: .*' ; }
abrir() { E shell am force-stop rocks.octavia.app; E logcat -c; E shell am start -W -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081' >/dev/null; sleep "${1:-8}"; }
dump() { # dump <dir> <nome>
  mkdir -p "$1"; E shell screencap -p /sdcard/s.png && E pull /sdcard/s.png "$1/$2.png" >/dev/null && E shell uiautomator dump /sdcard/d.xml >/dev/null && E pull /sdcard/d.xml "$1/$2.xml" >/dev/null && echo "dump $2: $(wc -c < "$1/$2.xml") B xml, $(wc -c < "$1/$2.png") B png"; }
barra() { node $SP/gates/ids.mjs "$1" | grep -E '^\s+(auto-scroll|zoom-menos|zoom-mais|tema|indice|busca|sair) '; }
tapid() { # toca o centro do resource-id $1 (dump fresco)
  E shell uiautomator dump /sdcard/t.xml >/dev/null; local b; b=$(E shell cat /sdcard/t.xml | grep -o "resource-id=\"$1\"[^>]*bounds=\"\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]\"" | head -1 | grep -o '\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]')
  [ -z "$b" ] && { echo "tapid: $1 NÃO ENCONTRADO"; return 1; }
  local x1 y1 x2 y2; x1=$(echo $b | cut -d'[' -f2 | cut -d',' -f1); y1=$(echo $b | cut -d'[' -f2 | cut -d',' -f2 | cut -d']' -f1); x2=$(echo $b | cut -d'[' -f3 | cut -d',' -f1); y2=$(echo $b | cut -d'[' -f3 | cut -d',' -f2 | cut -d']' -f1)
  echo "tap $1 @ $(( (x1+x2)/2 )),$(( (y1+y2)/2 ))  $b"; E shell input tap $(( (x1+x2)/2 )) $(( (y1+y2)/2 )); }

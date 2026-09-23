#!/bin/sh
# W4-b3 — a série de builds: release (n=3) e a div. 368 (debug com × sem o
# datetimepicker, n=3 cada, intercaladas). Roda da RAIZ da árvore.
#
# Cada corrida parte LIMPA, como o CI parte: `apps/native/android` apagado e
# refeito pelo prebuild; os diretórios que o Gradle gera DENTRO de
# `node_modules` (`*/android/build`, `*/android/.cxx`, os `build/` e `.gradle/`
# dos plugins de Gradle) apagados — sem isso a 2ª corrida seria incremental.
# `--no-daemon` (como o CI) e `--no-build-cache` (o `expo run:android` liga o
# build cache; o CI não). O que fica QUENTE, e fica quente no CI também pelo
# `actions/cache`: `~/.gradle/caches` (dependências e transforms).
#
# "sem": o plugin sai do `app.json` e o `react-native.config.js` desliga o
# autolinking Android do módulo (conferido: some da lista do
# `expo-modules-autolinking react-native-config`). O JS continua importando o
# módulo; o APK "sem" não é um app funcional — é só a medida do build.
#
# Uso: sh docs/native/W4B3-anexos/builds.sh <saida.tsv> <rotulo>...
#   rótulos: R1 R2 R3 (release) · C1 S1 C2 S2 C3 S3 (debug com/sem)
set -u
OUT=$1; shift
RAIZ=$(pwd)
NAT=$RAIZ/apps/native
export ANDROID_HOME=$HOME/Library/Android/sdk
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export EXPO_NO_TELEMETRY=1 CI=1
LOGS=$(dirname "$OUT")/logs; mkdir -p "$LOGS"
[ -s "$OUT" ] || printf 'rotulo\tvariante\tinicio\tprebuild_s\tgradle_s\ttotal_s\texit\tapk_bytes\tlib_armeabi-v7a\tlib_arm64-v8a\tlib_x86\tlib_x86_64\tpicker_no_apk\n' > "$OUT"

limpar() {
  rm -rf "$NAT/android"
  find "$RAIZ/node_modules/.pnpm" -type d \( -name build -o -name .cxx -o -name .gradle \) -prune 2>/dev/null \
    | grep -E '/android/|gradle-plugin/' | while read -r d; do rm -rf "$d"; done
}

sem_picker() {
  cp "$NAT/app.json" "$LOGS/app.json.guarda"
  python3 - "$NAT/app.json" <<'EOF'
import json,sys
p=sys.argv[1]; d=json.load(open(p))
d['expo']['plugins']=[x for x in d['expo']['plugins'] if x!='@react-native-community/datetimepicker']
json.dump(d,open(p,'w'),indent=2); open(p,'a').write('\n')
EOF
  printf "module.exports = { dependencies: { '@react-native-community/datetimepicker': { platforms: { android: null } } } }\n" > "$NAT/react-native.config.js"
}

com_picker() {
  [ -f "$LOGS/app.json.guarda" ] && cp "$LOGS/app.json.guarda" "$NAT/app.json" && rm "$LOGS/app.json.guarda"
  rm -f "$NAT/react-native.config.js"
}

for R in "$@"; do
  case $R in
    R*) VAR=release; TAREFA=assembleRelease; APK=release/app-release.apk; com_picker ;;
    C*) VAR=debug-com; TAREFA=assembleDebug; APK=debug/app-debug.apk; com_picker ;;
    S*) VAR=debug-sem; TAREFA=assembleDebug; APK=debug/app-debug.apk; sem_picker ;;
  esac
  limpar
  INI=$(date '+%H:%M:%S')
  T0=$(date +%s)
  (cd "$NAT" && npx expo prebuild --platform android --no-install) > "$LOGS/$R-prebuild.log" 2>&1
  T1=$(date +%s)
  (cd "$NAT/android" && ./gradlew $TAREFA --no-daemon --no-build-cache) > "$LOGS/$R-gradle.log" 2>&1
  EX=$?
  T2=$(date +%s)
  F="$NAT/android/app/build/outputs/apk/$APK"
  if [ -f "$F" ]; then
    BYTES=$(stat -f %z "$F")
    L=$(unzip -l "$F" | awk '$4 ~ /^lib\// {split($4,p,"/"); s[p[2]]+=$1} END {printf "%d\t%d\t%d\t%d", s["armeabi-v7a"], s["arm64-v8a"], s["x86"], s["x86_64"]}')
    PK=$(unzip -l "$F" | grep -ci 'datetimepicker\|RNDateTimePicker' )
    PKD=$(unzip -p "$F" 'classes*.dex' 2>/dev/null | grep -ac 'reactcommunity/rndatetimepicker')
    cp "$F" "$LOGS/$R.apk"
  else
    BYTES=-; L="-\t-\t-\t-"; PK=-; PKD=-
  fi
  printf '%s\t%s\t%s\t%d\t%d\t%d\t%d\t%s\t%b\t%s\n' "$R" "$VAR" "$INI" $((T1-T0)) $((T2-T1)) $((T2-T0)) $EX "$BYTES" "$L" "so=$PK,dex=$PKD" >> "$OUT"
  com_picker
done

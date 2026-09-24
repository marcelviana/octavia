#!/bin/sh
# N3 pre-check — captura: PNG na resolução do aparelho + uiautomator dump.
# uso: cap.sh <serial> <dir> <nome>   → <dir>/<nome>.png e <dir>/<nome>.xml; imprime rotação, tamanho e sha curto
ADB=$HOME/Library/Android/sdk/platform-tools/adb
mkdir -p "$2"
# apaga antes: um dump que falha (ex.: tela animando, "could not get idle state") não pode trazer o anterior
$ADB -s $1 shell rm -f /sdcard/n3pre.xml
rm -f "$2/$3.xml"
for t in 1 2 3; do
  $ADB -s $1 shell uiautomator dump /sdcard/n3pre.xml > /dev/null 2>&1
  $ADB -s $1 pull /sdcard/n3pre.xml "$2/$3.xml" > /dev/null 2>&1 && break
done
[ -s "$2/$3.xml" ] || { echo "$3 DUMP FALHOU"; }
$ADB -s $1 exec-out screencap -p > "$2/$3.png"
R=$($ADB -s $1 shell dumpsys window displays | grep -o "mCurrentRotation=[A-Z_0-9]*" | head -1)
echo "$3 $R png=$(wc -c < "$2/$3.png" | tr -d ' ') xml=$(wc -c < "$2/$3.xml" | tr -d ' ') $(shasum -a 256 "$2/$3.xml" | cut -c1-12)"

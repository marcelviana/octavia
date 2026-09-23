#!/bin/sh
# uso: ime.sh <serial> <n> — n aberturas da folha de criar; mInputShown 1,2 s depois do toque
S=$(dirname $0); SER=$1; N=$2
ADB="$HOME/Library/Android/sdk/platform-tools/adb -s $SER"
tem() { $ADB shell uiautomator dump /sdcard/ime.xml >/dev/null 2>&1; $ADB pull /sdcard/ime.xml $S/ime-$SER.xml >/dev/null 2>&1; grep -c "resource-id=\"$1\"" $S/ime-$SER.xml; }
ok=0
for i in $(seq 1 $N); do
  [ "$(tem form-nome)" = "0" ] || { echo "i=$i PRÉ-REQUISITO FALHOU: folha já aberta"; exit 1; }
  ANTES=$($ADB shell dumpsys input_method | grep -o "mInputShown=[a-z]*" | head -1)
  [ "$ANTES" = "mInputShown=false" ] || { echo "i=$i teclado já estava de pé antes do toque"; exit 1; }
  $S/toque.sh $SER criar-setlist > /dev/null || exit 1
  sleep 1.2
  IME=$($ADB shell dumpsys input_method | grep -o "mInputShown=[a-z]*" | head -1)
  [ "$(tem form-nome)" = "1" ] || { echo "i=$i a folha NÃO abriu"; exit 1; }
  echo "i=$i antes: folha fechada, $ANTES · 1,2 s depois: folha aberta, $IME"
  [ "$IME" = "mInputShown=true" ] && ok=$((ok+1))
  # Fechar: BACK esconde o TECLADO (div. 261 — não fecha a folha); só com o
  # teclado escondido o `form-cancelar` fica fora dele (no AVD o teclado o cobre).
  $ADB shell input keyevent KEYCODE_BACK; sleep 0.8
  K=$($ADB shell dumpsys input_method | grep -o "mInputShown=[a-z]*" | head -1)
  [ "$K" = "mInputShown=false" ] || { echo "i=$i o teclado não desceu com BACK ($K)"; exit 1; }
  [ "$(tem form-nome)" = "1" ] || { echo "i=$i BACK fechou a folha (não devia)"; exit 1; }
  $S/toque.sh $SER form-cancelar > /dev/null || exit 1
  sleep 1.0
done
echo "mInputShown=true em $ok/$N"

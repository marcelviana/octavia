#!/bin/sh
# J3 ponta a ponta, Tab S6, mock `escrita`: cada gesto com relógio de parede
S=$(dirname $0); D=RX2N8000F3D; LOG=$S/log/tab.txt
ADB="$HOME/Library/Android/sdk/platform-tools/adb -s $D"
agora() { python3 -c "import time;print('%.3f'%time.time())"; }
G=0
gesto() { G=$((G+1)); echo "  gesto $G · $1 · t=$(python3 -c "print('%.1f'%($(agora)-$T0))") s"; }
t() { $S/toque.sh $D $1 > /dev/null || { echo "ABORTA: sem $1"; exit 1; }; }
primeiro_adicionar() {
  $ADB shell uiautomator dump /sdcard/j3.xml >/dev/null 2>&1; $ADB pull /sdcard/j3.xml $S/j3.xml >/dev/null 2>&1
  python3 -c "
import re
x=open('$S/j3.xml').read()
m=re.search(r'resource-id=\"(picker-adicionar-\d+)\"',x); print(m.group(1) if m else '')"
}
N0=$(wc -l < $LOG)
T0=$(agora); echo "T0 = primeiro toque"
echo "passo 1 — criar vazia"
t criar-setlist; gesto "toque criar-setlist"; sleep 1.0
$ADB shell input text "J3%sfinal"; gesto "digitar o nome (input text)"; sleep 0.6
t form-salvar; gesto "toque form-salvar (Criar)"; sleep 2.0
ID=$(tail -n +$((N0+1)) $LOG | grep -c "write op=create.*status=201")
echo "  write op=create 201: $ID"
echo "passo 1b — abrir a setlist nova (a navegação de S1 para S2)"
$ADB shell uiautomator dump /sdcard/j3.xml >/dev/null 2>&1; $ADB pull /sdcard/j3.xml $S/j3.xml >/dev/null 2>&1
SID=$(curl -s http://127.0.0.1:8788/api/setlists | python3 -c "import json,sys;print([s['id'][:8] for s in json.load(sys.stdin) if s['name']=='J3 final'][0])")
t setlist-$SID; gesto "toque setlist-$SID (abrir)"; sleep 1.5
echo "passo 2 — 5 músicas pelo picker"
t picker-abrir; gesto "toque picker-abrir"; sleep 1.5
$ADB shell input text "ensaio"; gesto "digitar a busca (input text)"; sleep 1.2
for k in 1 2 3 4 5; do
  A=$(primeiro_adicionar)
  if [ -z "$A" ]; then
    # Nenhum `Adicionar` visível: as adicionadas subiram para "Nesta setlist"
    # e empurraram a biblioteca para baixo da dobra — rola a lista.
    $ADB shell input swipe 300 1250 300 500 400; gesto "rolar a lista de resultados (swipe)"; sleep 1.0
    A=$(primeiro_adicionar); [ -n "$A" ] || { echo "ABORTA: sem Adicionar depois de rolar"; exit 1; }
  fi
  $S/toque.sh $D $A > /dev/null; gesto "toque $A (música $k)"; sleep 1.2
done
t picker-concluir; gesto "toque picker-concluir (sair do picker)"; sleep 1.5
echo "passo 3 — reordenar: a 5 para a 1"
t reordenar; gesto "toque reordenar (entrar no modo)"; sleep 1.2
$ADB shell uiautomator dump /sdcard/j3.xml >/dev/null 2>&1; $ADB pull /sdcard/j3.xml $S/j3.xml >/dev/null 2>&1
eval $(python3 -c "
import re
x=open('$S/j3.xml').read()
def c(r):
  m=re.search(r'resource-id=\"'+r+r'\"[^>]*bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"',x); return ((int(m[1])+int(m[3]))//2,(int(m[2])+int(m[4]))//2)
a5=c('alca-5'); a1=c('alca-1'); print(f'X={a5[0]} Y5={a5[1]} Y1={a1[1]}')")
$ADB shell input motionevent DOWN $X $Y5; sleep 0.3
for f in 1 2 3 4 5 6 7 8 9 10 11 12; do Y=$((Y5 + (Y1 - Y5) * f / 12)); $ADB shell input motionevent MOVE $X $Y; done
sleep 0.3; $ADB shell input motionevent UP $X $Y1; gesto "arrasto alca-5 → posição 1 (DOWN/12×MOVE/UP)"; sleep 1.0
t reordenar-salvar; gesto "toque reordenar-salvar (Salvar a ordem)"; sleep 2.0
T1=$(agora)
echo "fim: t=$(python3 -c "print('%.1f'%($T1-$T0))") s de parede, $G gestos"
echo "log do fluxo:"; tail -n +$((N0+1)) $LOG | sed 's/.*OCTAVIA: /    /' | grep -E "write|resync|blocked"
$S/dump.sh $D t-j3-final --todos > $S/dumps/t-j3-final.txt

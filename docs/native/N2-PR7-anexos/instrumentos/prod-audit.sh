#!/bin/sh
# §3.3 — prod, conta de audit, AVD. 13 escritas: criar, 9 + 1 (bis) adições, reordenar, apagar. Nunca repete.
S=$(dirname $0); D=emulator-5554; LOG=$S/log/avd-prod.txt
ADB="$HOME/Library/Android/sdk/platform-tools/adb -s $D"
agora() { python3 -c "import time;print('%.3f'%time.time())"; }
toca() { R=$($S/toque.sh $D $1) || { echo "  ABORTA: sem $1 — nada foi tocado"; exit 1; }; echo "  $R"; }
kb() { $ADB shell dumpsys input_method | grep -o "mInputShown=[a-z]*" | head -1; }
semkb() { [ "$(kb)" = "mInputShown=true" ] && { $ADB shell input keyevent KEYCODE_BACK; sleep 0.8; }; true; }
n() { grep -c "$1" $LOG; }
espera() { # espera a linha $1 chegar a $2 ocorrências (máx. 30 s)
  i=0; while [ "$(n "$1")" -lt "$2" ]; do sleep 0.3; i=$((i+1)); [ $i -gt 100 ] && { echo "  ABORTA: não veio '$1' #$2"; exit 1; }; done; }
dumpx() { $ADB shell uiautomator dump /sdcard/pa.xml >/dev/null 2>&1; $ADB pull /sdcard/pa.xml $S/pa.xml >/dev/null 2>&1; }
primeiro_adicionar() { dumpx; python3 -c "
import re
x=open('$S/pa.xml').read()
m=re.search(r'resource-id=\"(picker-adicionar-\d+)\"',x); print(m.group(1) if m else '')"; }
W0=$(n "write op="); R0=$(n "resync kind=setlists reason=write")
echo "== 1 criar 'N2-PR7 audit'"
toca criar-setlist; sleep 1.2; $ADB shell input text "N2-PR7%saudit"; sleep 0.6; semkb
toca form-salvar; espera "write op=create" 1; espera "resync kind=setlists reason=write op=create" 1; sleep 1
dumpx; SID=$(python3 -c "
import re
x=open('$S/pa.xml').read()
nos=[dict(re.findall(r'([\w-]+)=\"([^\"]*)\"',m.group(1))) for m in re.finditer(r'<node ([^>]*?)/?>',x)]
alvo=[n for n in nos if n.get('text')=='N2-PR7 AUDIT'][0]
b=[int(v) for v in re.findall(r'\d+',alvo['bounds'])]
for n in nos:
  if n.get('resource-id','').startswith('setlist-'):
    c=[int(v) for v in re.findall(r'\d+',n['bounds'])]
    if c[0]<=b[0] and c[1]<=b[1] and c[2]>=b[2] and c[3]>=b[3]: print(n['resource-id']); break")
[ -n "$SID" ] || { echo "  ABORTA: cartão da setlist nova não achado"; exit 1; }
echo "  cartão: $SID"
toca $SID; sleep 2
echo "== 2 primeira visita ao picker: 9 músicas distintas"
T0=$(agora); toca picker-abrir; sleep 1.5; $ADB shell input text "audit"; echo "  digitar 'audit' (input text)"; sleep 1.5
for k in 1 2 3 4 5 6 7 8 9; do
  A=$(primeiro_adicionar)
  if [ -z "$A" ]; then semkb; A=$(primeiro_adicionar); fi
  if [ -z "$A" ]; then $ADB shell input swipe 300 1300 300 500 400; echo "  rolagem (swipe)"; sleep 1; A=$(primeiro_adicionar); fi
  [ -n "$A" ] || { echo "  ABORTA: sem Adicionar visível"; exit 1; }
  WA=$(n "write op=add"); RA=$(n "resync kind=setlists reason=write op=add")
  toca $A; espera "write op=add" $((WA+1)); espera "resync kind=setlists reason=write op=add" $((RA+1)); sleep 0.5
done
semkb; toca picker-concluir; sleep 1.5
echo "== 3 segunda visita: o bis (uma que já está na setlist)"
toca picker-abrir; sleep 1.5; $ADB shell input text "audit"; echo "  digitar 'audit' (input text)"; sleep 1.5
dumpx; python3 -c "
import re
x=open('$S/pa.xml').read()
print('  primeira linha:', re.search(r'text=\"(já na setlist[^\"]*)\"',x).group(1) if re.search(r'text=\"(já na setlist[^\"]*)\"',x) else 'SEM MARCA')"
WA=$(n "write op=add"); RA=$(n "resync kind=setlists reason=write op=add")
toca picker-adicionar-1; espera "write op=add" $((WA+1)); espera "resync kind=setlists reason=write op=add" $((RA+1)); sleep 0.8
dumpx; python3 -c "
import re
x=open('$S/pa.xml').read()
m=re.findall(r'text=\"(já na setlist[^\"]*)\"',x); print('  marcas depois do bis:', m[:3])
t=re.findall(r'resource-id=\"picker-total\"[^>]*',x); print('  total:', re.search(r'text=\"([^\"]*)\"',x[x.find('picker-total')-400:x.find('picker-total')]).group(1) if t else '?')"
semkb; toca picker-concluir; sleep 1.5
echo "== 4 reordenar: a 2 para a 1"
toca reordenar; sleep 1.2; dumpx
eval $(python3 -c "
import re
x=open('$S/pa.xml').read()
def c(r):
  m=re.search(r'resource-id=\"'+r+r'\"[^>]*bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"',x); return ((int(m[1])+int(m[3]))//2,(int(m[2])+int(m[4]))//2)
a=c('alca-2'); b=c('alca-1'); print(f'X={a[0]} YA={a[1]} YB={b[1]}')")
$ADB shell input motionevent DOWN $X $YA; sleep 0.3
for f in 1 2 3 4 5 6 7 8 9 10 11 12; do $ADB shell input motionevent MOVE $X $((YA + (YB - YA - 40) * f / 12)); done
sleep 0.3; $ADB shell input motionevent UP $X $((YB - 40)); echo "  arrasto alca-2 → posição 1"; sleep 1
WR=$(n "write op=reorder"); toca reordenar-salvar; espera "write op=reorder" $((WR+1)); espera "resync kind=setlists reason=write op=reorder" 1; sleep 1
echo "== 5 apagar pelo diálogo"
toca setlist-apagar; sleep 1.2; dumpx; python3 -c "
import re
x=open('$S/pa.xml').read(); print('  diálogo:', [t for t in re.findall(r'text=\"([^\"]+)\"',x) if 'Apagar' in t or 'Manter' in t or 'músicas' in t][:4])"
WD=$(n "write op=delete"); toca apagar-confirmar; espera "write op=delete" $((WD+1)); espera "resync kind=setlists reason=write op=delete" 1; sleep 1.5
echo "== escritas desta sessão em prod (AVD): $(( $(n "write op=") - W0 ))"

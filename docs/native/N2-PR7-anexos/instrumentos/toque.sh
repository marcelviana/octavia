#!/bin/sh
# uso: toque.sh <serial> <resource-id> [n-ésimo] — toca o centro do nó no dump de agora; imprime o toque
ADB=$HOME/Library/Android/sdk/platform-tools/adb
$ADB -s $1 shell uiautomator dump /sdcard/n2pr7t.xml > /dev/null 2>&1
$ADB -s $1 pull /sdcard/n2pr7t.xml $SCR/t-$1.xml > /dev/null 2>&1
C=$(python3 -c "
import re,sys
x=open('$SCR/t-$1.xml').read()
ms=list(re.finditer(r'resource-id=\"$2\"[^>]*bounds=\"\[(\d+),(\d+)\]\[(\d+),(\d+)\]\"',x))
k=int('${3:-1}')-1
print('' if len(ms)<=k else '%d %d'%((int(ms[k][1])+int(ms[k][3]))//2,(int(ms[k][2])+int(ms[k][4]))//2))
")
[ -z "$C" ] && { echo "TOQUE FALHOU: sem $2"; exit 1; }
$ADB -s $1 shell input tap $C
echo "$(python3 -c "import datetime;print(datetime.datetime.now().strftime(\"%H:%M:%S.%f\")[:-3])") toque $2 @ $C px ($1)"

#!/bin/sh
# G6 — todo estado capturado é alcançável por resource-id, e todo alvo tocável
# do estado TEM resource-id. Uso: g6.sh <dir-de-dumps>
DIR=$1; FALHAS=0
for x in "$DIR"/*.xml; do
  N=$(basename "$x" .xml)
  IDS=$(grep -o 'resource-id="[^"]*"' "$x" | sed 's/resource-id="//;s/"//' \
        | grep -v '^$' | grep -v '^android:id/content$' | grep -v '^rocks.octavia.app:id/' | sort -u)
  SEM=$(python3 -c "
import re,sys
xml=open('$x').read()
n=0
for m in re.finditer(r'<node\b([^>]*?)/?>',xml):
    a=dict(re.findall(r'([\w-]+)=\"([^\"]*)\"',m.group(1)))
    if a.get('clickable')=='true' and not a.get('resource-id'): n+=1
print(n)")
  ANC=$(echo "$IDS" | head -1)
  if [ -z "$ANC" ] || [ "$SEM" != "0" ]; then FALHAS=$((FALHAS+1)); M="✗"; else M="✓"; fi
  printf "  %-28s âncora=%-18s ids=%-3s alvos sem id=%s %s\n" "$N" "${ANC:-<NENHUMA>}" "$(echo "$IDS" | grep -c .)" "$SEM" "$M"
done
echo "  estados: $(ls "$DIR"/*.xml | wc -l | tr -d ' ')   falhas: $FALHAS"
[ "$FALHAS" -eq 0 ]

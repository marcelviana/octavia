#!/bin/sh
# N3 pre-check — sobe (ou troca o modo do) mock na 8788 e o servidor de arquivos na 8790.
# uso: SCR=<dir> servidores.sh <modo-do-mock>     (o estado do mock NÃO é preservado: a fixture é relida)
# O mock é o `aceite.py servidor` da árvore; os arquivos são os de $SCR/mock/arquivos (fixture.py).
ARVORE=$(cd "$(dirname "$0")/../../../.." && pwd)
P=$(lsof -tiTCP:8788 -sTCP:LISTEN); [ -n "$P" ] && kill $P && sleep 0.5
nohup python3 "$ARVORE/apps/native/src/fixtures/aceite.py" servidor 8788 "$1" \
  "$SCR/mock/setlists.json" "$SCR/mock/content.json" > "$SCR/mock/log-$1.txt" 2>&1 &
if [ -z "$(lsof -tiTCP:8790 -sTCP:LISTEN)" ]; then
  nohup python3 -m http.server 8790 --bind 127.0.0.1 --directory "$SCR/mock/arquivos" > "$SCR/mock/log-arquivos.txt" 2>&1 &
fi
sleep 1; head -1 "$SCR/mock/log-$1.txt"

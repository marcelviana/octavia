#!/bin/sh
# SY-PR4 — o bundle SERVIDO (regra 13 ampliada), conferido antes de qualquer abertura: a URL da API (o mock, nenhum
# octavia.rocks) e os símbolos desta PR. O molde é o da SY-PR3.   sh bundle.sh <rótulo>
B=${TMPDIR:-/tmp}/sy-pr4-bundle.$$.js
echo "# o bundle servido — $1 · a árvore $(git rev-parse --short HEAD) · $(date '+%Y-%m-%d %H:%M:%S %z')"
echo '$ curl -s "http://127.0.0.1:8081/apps/native/index.bundle?platform=android&dev=true" | grep -c …'
curl -s "http://127.0.0.1:8081/apps/native/index.bundle?platform=android&dev=true" > "$B"
echo "bytes: $(wc -c < "$B" | tr -d ' ')"
for k in localhost:8788 octavia.rocks "sync trigger reason=" ligarGatilhos segurarDeNovo abrirAvulso focoDoIndice aoFecharPalco; do echo "$k: $(grep -cF "$k" "$B")"; done
rm -f "$B"
echo '$ adb -s emulator-5554 reverse --list'; ~/Library/Android/sdk/platform-tools/adb -s emulator-5554 reverse --list

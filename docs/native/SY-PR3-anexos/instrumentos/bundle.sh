#!/bin/sh
# SY-PR3 — o bundle SERVIDO (regra 13 ampliada), conferido antes de qualquer abertura e a cada troca de Metro.
#   sh bundle.sh <rótulo> <árvore-do-metro>
B=${TMPDIR:-/tmp}/sy-pr3-bundle.$$.js
echo "# o bundle servido — $1 · o Metro da árvore $2 ($(git -C "$2" rev-parse --short HEAD)) · $(date '+%Y-%m-%d %H:%M:%S %z')"
echo '$ curl -s "http://127.0.0.1:8081/apps/native/index.bundle?platform=android&dev=true" | grep -c …'
curl -s "http://127.0.0.1:8081/apps/native/index.bundle?platform=android&dev=true" > "$B"
echo "bytes: $(wc -c < "$B" | tr -d ' ')"
for k in localhost:8788 octavia.rocks chaveDaAbertura fotoDoConteudo criarFotoDaSessao "foto.entrar(" pedirVoo; do echo "$k: $(grep -cF "$k" "$B")"; done
rm -f "$B"
echo '$ adb -s emulator-5554 reverse --list'; ~/Library/Android/sdk/platform-tools/adb -s emulator-5554 reverse --list

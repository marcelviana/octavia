#!/bin/sh
# uso: mock.sh <modo> — derruba o que estiver na 8788 e sobe o aceite.py no modo pedido, preservando o estado do servidor
P=$(lsof -tiTCP:8788 -sTCP:LISTEN)
if [ -n "$P" ]; then curl -s http://127.0.0.1:8788/api/setlists > $SCR/mock/setlists.tmp && python3 -c "import json,sys;sys.exit(0 if isinstance(json.load(open('$SCR/mock/setlists.tmp')),list) else 1)" && mv $SCR/mock/setlists.tmp $SCR/mock/setlists.json; kill $P; sleep 0.5; fi
cd /Users/marcelviana/projects/octavia-n2-pr7
nohup python3 apps/native/src/fixtures/aceite.py servidor 8788 "$1" $SCR/mock/setlists.json $SCR/mock/content.json > $SCR/mock/log-$1.txt 2>&1 &
sleep 1
head -1 $SCR/mock/log-$1.txt

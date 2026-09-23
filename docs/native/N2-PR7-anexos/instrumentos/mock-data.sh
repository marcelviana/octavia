#!/bin/sh
# uso: mock-data.sh <modo> '<python que muda a lista s>' — salva o estado do mock, aplica a mudança, sobe no modo
P=$(lsof -tiTCP:8788 -sTCP:LISTEN)
[ -n "$P" ] && curl -s http://127.0.0.1:8788/api/setlists > $SCR/mock/s.tmp && python3 -c "import json,sys;sys.exit(0 if isinstance(json.load(open('$SCR/mock/s.tmp')),list) else 1)" && mv $SCR/mock/s.tmp $SCR/mock/setlists.json; [ -n "$P" ] && kill $P && sleep 0.5
python3 -c "
import json
s=json.load(open('$SCR/mock/setlists.json'))
$2
json.dump(s,open('$SCR/mock/setlists.json','w'))
"
cd /Users/marcelviana/projects/octavia-n2-pr7
nohup python3 apps/native/src/fixtures/aceite.py servidor 8788 "$1" $SCR/mock/setlists.json $SCR/mock/content.json > $SCR/mock/log-$1.txt 2>&1 &
sleep 1; head -1 $SCR/mock/log-$1.txt

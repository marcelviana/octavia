#!/bin/sh
# N4-PR8 — a prova da receita do cache (N4-D102) no AVD, com um cache SENTINELA no lugar do real:
#   prova-receita.sh <serial> <dir-de-trabalho>     (o Metro da árvore de pé; o AVD com a sessão de audit)
# A. guarda o cache que o AVD tem (a sessão de audit) pela receita nova — o "real" desta prova sai do aparelho;
# B. grava o SENTINELA: um content com duas Partituras de URL do vigia (uma com o arquivo no disco e no índice, outra sem);
# C. o CONTROLE NEGATIVO — a receita ANTIGA (N4-D98): guarda por cópia e tira só o arquivo; abre o app SEM mock (nada na
#    8788) e com o vigia na 8790 → a garantia de arquivos pede os PDFs (a div. 1113 reproduzida);
# D. o sentinela gravado de novo;
# E. a receita NOVA (passos 1 e 2): abre o app SEM mock, com o vigia → nenhuma requisição de arquivo;
# F. o passo 4: regrava o sentinela, md5 a md5; G. devolve o cache do AVD (o sentinela apagado por nome).
set -e
ADB=~/Library/Android/sdk/platform-tools/adb; S=$1; T=$2; I=$(cd "$(dirname "$0")" && pwd); PKG=rocks.octavia.app
DEEP="exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
mkdir -p "$T"; RA() { $ADB -s "$S" shell -n "run-as $PKG sh -c '$1'"; }
vigia() { P=$(lsof -tiTCP:8790 -sTCP:LISTEN || true); [ -z "$P" ] || { kill $P; sleep 1; }; nohup python3 "$I/vigia-arquivos.py" 8790 "$T/vigia-$1.log" >/dev/null 2>&1 & sleep 1; }
abrir() { # abre o app SEM mock: nada escuta na 8788 (o túnel nem existe); espera 25 s; o logcat da abertura
  $ADB -s "$S" reverse --remove-all; $ADB -s "$S" reverse tcp:8081 tcp:8081 >/dev/null; $ADB -s "$S" reverse tcp:8790 tcp:8790 >/dev/null
  echo "   8788 no host: [$(lsof -tiTCP:8788 -sTCP:LISTEN | tr '\n' ' ' || true)] · reverse: $($ADB -s "$S" reverse --list | tr '\n' ' ')"
  $ADB -s "$S" logcat -c; $ADB -s "$S" shell am start -a android.intent.action.VIEW -d "$DEEP" $PKG >/dev/null; sleep 25
  $ADB -s "$S" logcat -d -s ReactNativeJS | grep 'OCTAVIA:' | sed 's/.*OCTAVIA: /   OCTAVIA: /'
  echo "   FATAL: $($ADB -s "$S" logcat -d | grep -c FATAL)"
  $ADB -s "$S" shell am force-stop $PKG
}
U=$(RA 'ls files' | tr -d '\r' | grep '^octavia-' | head -1); echo "sessão: $U"
echo "== A. o cache do AVD sai do aparelho (a receita nova)"; sh "$I/receita-cache.sh" "$S" guardar "$T/avd"
echo "== B. o SENTINELA"
python3 - "$T" <<'PY'
import json, os, sys, time
sys.path.insert(0, os.environ.get("FIXTURE_DIR", "."))
T = sys.argv[1]; os.makedirs(f"{T}/sentinela/files", exist_ok=True)
from fixture import pdf
agora = int(time.time() * 1000)
url = "http://localhost:8790/"
def item(i, nome):
    return {"id": f"5e470000-0000-4000-8000-00000000000{i}", "user_id": "sentinela", "title": f"Sentinela {i}", "artist": None,
            "album": None, "content_type": "Sheet", "content_data": None, "file_url": url + nome,
            "created_at": "2026-10-07T12:00:00.000Z", "updated_at": "2026-10-07T12:00:00.000Z"}
json.dump({"setlists": [], "syncedAtMs": agora - 3600_000}, open(f"{T}/sentinela/setlists.json", "w"))
json.dump([item(1, "sentinela-presente.pdf"), item(2, "sentinela-ausente.pdf")], open(f"{T}/sentinela/content.json", "w"))
b = pdf(1, "sentinela N4-PR8")
open(f"{T}/sentinela/files/sentinela-presente.pdf", "wb").write(b)
json.dump({url + "sentinela-presente.pdf": {"name": "sentinela-presente.pdf", "bytes": len(b), "lastUsedMs": agora}},
          open(f"{T}/sentinela/files-index.json", "w"))
PY
grava_sentinela() {
  for n in setlists.json content.json files-index.json; do $ADB -s "$S" exec-in run-as $PKG sh -c "cat > files/$U/$n" < "$T/sentinela/$n"; done
  $ADB -s "$S" exec-in run-as $PKG sh -c "cat > files/$U/files/sentinela-presente.pdf" < "$T/sentinela/files/sentinela-presente.pdf"
  RA "cd files/$U && md5sum setlists.json content.json files-index.json files/sentinela-presente.pdf"
}
grava_sentinela
echo "== C. CONTROLE NEGATIVO — a receita ANTIGA (N4-D98): o arquivo sai, os .json ficam"
RA "rm -f files/$U/files/sentinela-presente.pdf"; RA "ls files/$U files/$U/files"
vigia antiga; abrir
echo "   o vigia (8790), requisições: $(wc -l < "$T/vigia-antiga.log" | tr -d ' ')"; sed 's/^/     /' "$T/vigia-antiga.log"
echo "== D. o sentinela gravado de novo"; grava_sentinela
echo "== E. a receita NOVA — passos 1 e 2, e o app aberto SEM mock"
sh "$I/receita-cache.sh" "$S" guardar "$T/sent"
vigia nova; abrir
echo "   o vigia (8790), requisições: $(wc -l < "$T/vigia-nova.log" | tr -d ' ')"; sed 's/^/     /' "$T/vigia-nova.log"
echo "== F. o passo 4 — regravar o sentinela"; sh "$I/receita-cache.sh" "$S" regravar "$T/sent"
echo "== G. o cache do AVD de volta (o sentinela apagado por nome)"
sh "$I/receita-cache.sh" "$S" regravar "$T/avd" sentinela-presente.pdf
P=$(lsof -tiTCP:8790 -sTCP:LISTEN || true); [ -z "$P" ] || kill $P; $ADB -s "$S" reverse --remove-all; echo "fim"

#!/usr/bin/env python3
"""N3 pre-check — B6: o indicador do T1-R17 depois de um `lru over` (W4-ENCERRAMENTO §7.3).

  SCR=<dir> python3 b6.py <serial> <dir-saida>

Fixture (`fixture.py --b6`): "B6 — acima do teto" com data de AMANHÃ e três PDFs
de 80 MiB (os três viram PROTEGIDOS do LRU: 240 MiB > 200 MiB de `CAP_BYTES`) e
"B6 — sem data" com um PDF de 1 página (não protegido).

Fase 1 — o mock só tem "B6 — sem data": sincroniza e toca "Baixar esta setlist"
         → o PDF pequeno vai para o disco (✓ 1 de 1).
Fase 2 — o mock tem as duas: o prefetch de 7 dias baixa os 240 MiB, o
         `aplicarLru` despeja o que não é protegido e, sem conseguir descer do
         teto, emite `lru over`. A pergunta: o que os dois cartões mostram?

Saída: B6-*.xml/png (dumps do S1 em cada fase) e B6-logcat.txt (linhas
`OCTAVIA:` sem as de `auth`, regra 3 do LOGS-OCTAVIA.md).
"""
from __future__ import annotations

import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import n3  # noqa: E402
import roteiro as R  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
SCR = os.environ["SCR"]


def mock_b6(arquivo_setlists: str) -> None:
    for pid in subprocess.run(["lsof", "-tiTCP:8788", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split():
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    log = open(os.path.join(SCR, "mock-b6", f"log-{os.path.basename(arquivo_setlists)}.txt"), "w")
    subprocess.Popen(["python3", os.path.join(R.ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", "8788", "normal",
                      arquivo_setlists, os.path.join(SCR, "mock-b6", "content.json")], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{time.strftime('%H:%M:%S')} mock B6 setlists={os.path.basename(arquivo_setlists)}", flush=True)


def logcat(s: str) -> list[str]:
    out = n3.sh(s, "logcat", "-d", "-s", "ReactNativeJS:I")
    return [l for l in out.splitlines() if "OCTAVIA:" in l and "OCTAVIA: auth" not in l]


def cartoes(s: str) -> None:
    for no in n3.dump(s):
        if no["id"].startswith("setlist-"):
            print(f"  {no['id']} → {no.get('content-desc') or no.get('text')}", flush=True)


def cap(s: str, saida: str, nome: str) -> None:
    r = subprocess.run([os.path.join(AQUI, "cap.sh"), s, saida, nome], capture_output=True, text=True)
    print(r.stdout.strip(), flush=True)


def main() -> None:
    s, saida = sys.argv[1], sys.argv[2]
    n3.sh(s, "logcat", "-c")
    # fase 1
    mock_b6(os.path.join(SCR, "mock-b6", "fase1.json"))
    R.ir_s1(s)
    R.esperar(s, rid="baixar-000000b7")
    n3.tap(s, rid="baixar-000000b7", espera=4)
    cartoes(s)
    cap(s, saida, "B6-1-S1-sem-data-baixada")
    # fase 2
    mock_b6(os.path.join(SCR, "mock-b6", "setlists.json"))
    R.ir_s1(s)
    fim = time.time() + 300
    while time.time() < fim and not any("lru over" in l for l in logcat(s)):
        time.sleep(3)
    time.sleep(3)
    cartoes(s)
    cap(s, saida, "B6-2-S1-depois-do-lru-over")
    linhas = logcat(s)
    open(os.path.join(saida, "B6-logcat.txt"), "w").write("\n".join(linhas) + "\n")
    print(f"logcat: {len(linhas)} linhas OCTAVIA (sem auth)")
    for l in linhas:
        if any(k in l for k in ("lru", "prefetch", "file src", "download-error", "sync ok")):
            print("  " + l.split("OCTAVIA: ", 1)[1])


if __name__ == "__main__":
    main()

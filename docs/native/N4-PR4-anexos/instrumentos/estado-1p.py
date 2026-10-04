"""N4-PR4 — o estado de DADO da base do G-inv (os arquivos que ela tinha): a `partitura-1p.pdf` da setlist 2 no
aparelho. A base foi tirada com o relógio a 2026-09-24, dentro da janela de 7 dias da setlist (2026-09-26), e o
prefetch a baixou; hoje (2026-10-04) a janela não a cobre. Abrir a música no palco a baixa sob demanda — o mesmo
arquivo, o mesmo S1 (`offlineStatus` só conta presença)."""
import os, sys, time
sys.path.insert(0, os.path.dirname(__file__))
import roteiro as R, n3
s = sys.argv[1]
R.ir_s1(s)
no = R.esperar(s, rid="setlist-00000002"); b = no["b"]
n3.sh(s, "shell", "input", "tap", str(b[0] + 24), str(b[1] + 24)); time.sleep(3)
R.esperar(s, rid="song-3")
n3.tap(s, rid="song-3", espera=8)
print("palco aberto na song-3 da setlist 2", flush=True)
R.ir_s1(s)
x = n3.dump(s)
print("garantidas no S1:", sum(1 for n in x if n.get("t") == "garantida offline") if isinstance(x, list) else x, flush=True)

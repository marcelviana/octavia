"""N4 brief — uma captura por superfície, no Tab S6, nas duas composições (C deitado, B em pé).

  SCR=<dir> PORTA=8788 ROT=<1|0> python3 n4brief.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Tudo contra o mock (`aceite.py servidor`) com a fixture do pre-check do N3 (`fixture.py`, "hoje" = 2026-10-02).
Nenhuma escrita (nem no mock): só leitura e o sync contra o mock.

  S1         S1 com as 3 setlists da fixture
  S4         S1 → `buscar` → `ensaio` → resultados
  picker     S1 → a 1ª setlist → `picker-abrir` → `ensaio` → resultados
  palco      S1 → a 1ª setlist → `song-1` (letra) → o palco com setlist
  avulsoCom  S1 → `buscar` → `ensaio` → `Segunda do ensaio` (cifra) → o palco avulso aberto de S1, com setlists
  avulsoSem  mock com ZERO setlists (o mesmo content) → S1 vazia (`s1f`) → `buscar` → `ensaio` →
             `Segunda do ensaio` → o que o app mostra (div. 964)

Nos dois avulsos, as linhas `OCTAVIA:` que o toque produziu (contadas antes do toque) vão a
<saida>/log-<estado>-<sufixo>.txt, e os textos da barra/tela a <saida>/textos-<estado>-<sufixo>.txt.
Nome de cada captura: N4BR-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import os, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N4BR", suf)


def hora():
    return time.strftime("%H:%M:%S")


def linhas_octavia():
    out = n3.sh(s, "logcat", "-d", "-s", "ReactNativeJS:V")
    return [l for l in out.splitlines() if "OCTAVIA:" in l]


def textos(estado):
    nos = n3.dump(s)
    with open(os.path.join(saida, f"textos-{estado}-{suf}.txt"), "w") as f:
        for a in nos:
            t = a.get("text") or a.get("content-desc") or ""
            if a["id"] or t:
                f.write(f"{a['id'] or '-'}\t{a['bounds']}\t{t}\n")


def buscar(termo):
    R.ir_s1(s)
    n3.tap(s, rid="buscar", espera=2)
    n3.tap(s, rid="campo-busca")
    r.digitar(termo)
    n3.esconder_teclado(s)


def S1():
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.cap("S1", "setlists")


def S4():
    buscar("ensaio")
    R.esperar(s, texto="Segunda do ensaio")
    r.cap("S4", "resultados")
    n3.tap(s, rid="fechar-busca")


def picker():
    R.ir_s1(s)
    r.abrir_setlist()
    n3.tap(s, rid="picker-abrir", espera=2)
    n3.tap(s, rid="picker-campo")
    r.digitar("ensaio")
    n3.esconder_teclado(s)
    r.cap("picker", "resultados")
    n3.tap(s, rid="fechar-busca")


def palco():
    R.ir_s1(s)
    r.abrir_setlist()
    n3.tap(s, rid="song-1", espera=3)
    R.esperar(s, texto="1 DE 8")
    r.cap("S3", "com-setlist")


def avulso(estado):
    antes = len(linhas_octavia())
    n3.tap(s, texto="Segunda do ensaio", espera=4)
    textos(estado)
    r.cap("S3", estado)
    time.sleep(1)
    novas = linhas_octavia()[antes:]
    with open(os.path.join(saida, f"log-{estado}-{suf}.txt"), "w") as f:
        f.write("\n".join(novas) + "\n")
    print(f"{hora()} {estado}: {len(novas)} linhas OCTAVIA depois do toque", flush=True)


def avulsoCom():
    buscar("ensaio")
    R.esperar(s, texto="Segunda do ensaio")
    avulso("avulso-de-S1-com-setlists")


def avulsoSem():
    R.mock("normal", vazio=True)
    R.ir_s1(s)
    R.esperar(s, rid="s1f", prazo=60)
    textos("S1f-antes-do-avulso")
    n3.tap(s, rid="buscar", espera=2)
    n3.tap(s, rid="campo-busca")
    r.digitar("ensaio")
    n3.esconder_teclado(s)
    R.esperar(s, texto="Segunda do ensaio")
    avulso("avulso-de-S1-sem-setlists")
    R.mock("normal")


for nome in sys.argv[5:]:
    try:
        globals()[nome]()
    except Exception as e:  # noqa: BLE001 — registra e segue
        r.falhas.append(f"{nome}: {e}"); print(f"FALHA {nome}: {e}", flush=True)
        try:
            R.aviao(s, False); R.mock("normal")
        except Exception:  # noqa: BLE001
            pass
try:
    R.ir_s1(s)
except Exception as e:  # noqa: BLE001
    print(f"FALHA fecho: {e}", flush=True)
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

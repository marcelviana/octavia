"""N3-PR5 — o aceite mínimo de A no palco (errata do T3-R3): sem crash, e a LISTA do que não se
alcança (herança do N5). O palco não tem controle de ESCRITA; a lista é a dos controles do palco
— a folha de A (N3-D14) sobe `indice` · `busca` · `sair` para a barra superior justamente porque
os sete controles de 64 não cabem em 379.

  SCR=<dir> ROT=0 python3 phone-palco.py <dir-instrumentos-do-pre-check> <serial> <saida>

Alcançável = o nó existe no dump, tem área dentro da janela, e o toque no centro da parte
visível faz o que o controle faz — conferido no dump seguinte (o critério do `phone-a.py` da
N3-PR3 e do `phone-a-n3p4.py` da N3-PR4).

  bordas     `borda-avancar` (vai a `2 DE 8`) · `borda-voltar` (volta a `1 DE 8`)
  leitura    `auto-scroll` (o nome acessível vira "…, ligada"; toca de novo para desligar) ·
             `zoom-mais` · `zoom-menos` (a linha `zoom dp=` no logcat) · `tema` (o nome acessível
             troca de tema)
  navegação  `indice` (abre S2p: `song-1` sem `remover-1`; BACK) · `busca` (abre S4:
             `campo-busca`; BACK) · `sair` (sai do palco: `picker-abrir` de S2)

Capturas: `S3-S3a-letra-1a-phone-ret` (a abertura) e `S3-S3d-pdf-12p-phone-ret`.
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida = sys.argv[2], sys.argv[3]
r = R.Roteiro(s, saida, "N3P5", "phone-ret")
F = 2.625
linhas = []


def hora():
    return time.strftime("%H:%M:%S")


def visivel(no, raiz):
    b = no["b"]
    x0, y0, x1, y1 = max(b[0], raiz[0]), max(b[1], raiz[1]), min(b[2], raiz[2]), min(b[3], raiz[3])
    return (x0, y0, x1, y1) if x1 - x0 >= 1 and y1 - y0 >= 1 else None


antes = 0


def logcat(padrao):
    out = n3.sh(s, "logcat", "-d", "-s", "ReactNativeJS:*", check=False)
    return [l[l.index("OCTAVIA:"):] for l in out.splitlines() if "OCTAVIA:" in l and padrao in l]


def novas(padrao):
    """As linhas `OCTAVIA:` que chegaram depois do último toque."""
    return [l for l in logcat("")[antes:] if padrao in l]


def desc(rid):
    no = n3.achar(n3.dump(s), rid=rid)
    return None if no is None else no.get("content-desc", "")


def tocar(grupo, rid, prova, detalhe=""):
    nos = n3.dump(s)
    raiz = nos[0]["b"]
    no = n3.achar(nos, rid=rid)
    if no is None:
        linhas.append((grupo, rid, "INALCANÇÁVEL", "sem nó no dump")); return False
    v = visivel(no, raiz)
    b = no["b"]
    px = f"bounds {no['bounds']} = {(b[2] - b[0]) / F:.1f} × {(b[3] - b[1]) / F:.1f} dp, x0 {b[0] / F:.1f}"
    if v is None:
        linhas.append((grupo, rid, "INALCANÇÁVEL", f"{px}: nenhuma área dentro da janela {raiz}")); return False
    # o logcat NÃO se limpa aqui: a contagem de FATAL do fim cobre a rodada inteira. A prova do
    # toque lê só as linhas que chegaram depois dele.
    global antes
    antes = len(logcat(""))
    x, y = (v[0] + v[2]) // 2, (v[1] + v[3]) // 2
    n3.sh(s, "shell", "input", "tap", str(x), str(y)); time.sleep(2)
    print(f"{hora()} toque {rid!r} @ {x},{y} ({s})", flush=True)
    ok = prova(n3.dump(s))
    linhas.append((grupo, rid, "alcançável" if ok else "INALCANÇÁVEL",
                   f"{px}; toque @ {x},{y} → {detalhe if ok else 'nada aconteceu'}"))
    return ok


def tem(rid=None, texto=None):
    return lambda nos: n3.achar(nos, rid=rid, texto=texto) is not None


def palco(n=1):
    R.ir_s1(s)
    R.esperar(s, rid="setlist-00000001", prazo=60); time.sleep(3)
    r.abrir_setlist()
    n3.tap(s, rid=f"song-{n}", espera=3)
    R.esperar(s, texto=f"{n} DE 8")


n3.sh(s, "logcat", "-c")  # uma vez, no começo: a contagem de FATAL é da rodada inteira
R.mock("normal")
palco(1)
r.cap("S3", "S3a-letra-1a")
tocar("bordas", "borda-avancar", tem(texto="2 DE 8"), "2 DE 8")
tocar("bordas", "borda-voltar", tem(texto="1 DE 8"), "1 DE 8")
d0 = desc("auto-scroll")
tocar("leitura", "auto-scroll", lambda nos: (n3.achar(nos, rid="auto-scroll") or {}).get("content-desc", "").endswith("ligada"),
      "o nome acessível virou “…, ligada”")
if (desc("auto-scroll") or "").endswith("ligada"):
    n3.tap(s, rid="auto-scroll", espera=1.5)
tocar("leitura", "zoom-mais", lambda nos: any("zoom dp=26" in l for l in novas("zoom")), "`zoom dp=26`")
tocar("leitura", "zoom-menos", lambda nos: any("zoom dp=22" in l for l in novas("zoom")), "`zoom dp=22`")
t0 = desc("tema")
tocar("leitura", "tema", lambda nos: (n3.achar(nos, rid="tema") or {}).get("content-desc", "") not in ("", t0),
      "o nome acessível trocou de tema")
if desc("tema") != t0:
    n3.tap(s, rid="tema", espera=1.5)
if tocar("navegação", "indice", lambda nos: n3.achar(nos, rid="song-1") is not None and n3.achar(nos, rid="remover-1") is None,
         "abriu S2p"):
    n3.key(s, "KEYCODE_BACK", 2)
if tocar("navegação", "busca", tem(rid="campo-busca"), "abriu S4"):
    n3.esconder_teclado(s); n3.key(s, "KEYCODE_BACK", 2)
tocar("navegação", "sair", tem(rid="picker-abrir"), "saiu do palco para S2")

palco(4)
time.sleep(4)
r.cap("S3", "S3d-pdf-12p")
R.mock("normal")

print("\n# lista (grupo, controle, alcance, detalhe)")
for g, rid, alc, det in linhas:
    print(f"{g:10} {rid:14} {alc:13} {det}")
print(f"capturas={len(r.feitos)}")

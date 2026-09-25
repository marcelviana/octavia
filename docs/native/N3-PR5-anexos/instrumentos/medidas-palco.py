"""N3-PR5 — as medidas do palco num dump, em dp, contra a folha (N3-D23: > 4 dp é errata).

  python3 medidas-palco.py <dump.xml> [...]

Fator pelo nome (2,625 se `phone`, 2,25 no resto). O que cada linha mede:

  barra        o ViewGroup de largura cheia logo acima do `ScrollView`/PDF do corpo: o menor
               que contém a posição (`n DE 8`, `AVULSA`) e o título (altura; a folha: 88 em B)
  linhas       quantos y distintos têm os textos da barra (posição e título na MESMA linha → 1;
               a folha de B: 2 — posição + setlist em cima, título · artista · tipo embaixo)
  título       o TextView do título (largura: a folha diz *"com os 663 dp inteiros"*)
  corpo        o `borda-voltar`, que tem a altura do `meio` (D-1: a borda ocupa só a altura ENTRE as
               barras) — a folha: 870 (1054 − 88 − 96, o canvas do AVD)
  zonas        largura de `borda-voltar` e `borda-avancar` (15 % do `meio`: 106,7 em B)
  base         altura do pai dos sete controles (96); o grupo da esquerda (auto-scroll … tema), o
               da direita (indice … sair) e o vão entre eles (a folha: 304 · 224 · 135 com
               controles de 64; o app os desenha com 66, a moldura de 1 dp — V1-PR3 div. 36)
  base (x)     os sete x0 — têm de ser os de C na mesma largura (o dump de retrato do pre-check,
               que é C espremida em 711)

A folha: `DESIGN-N3/telas.html` §7 (`N3-B-S3`, "N3-S3 · duas barras, um corpo") e a linha
"palco · barra superior / barra inferior / zonas de toque" da tabela 0.
"""
import re, sys

FOLHA = {"barra": 88, "linhas": 2, "título": 663, "corpo": 870, "zona": 106.7, "base (altura)": 96,
         "base (esquerda)": 304, "base (direita)": 224, "base (vão)": 135}
BASE = ["auto-scroll", "zoom-menos", "zoom-mais", "tema", "indice", "busca", "sair"]


def nos(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        px = [int(v) for v in re.findall(r"-?\d+", a.get("bounds", ""))]
        out.append({"cls": a.get("class", "").split(".")[-1], "id": a.get("resource-id", "").split("/")[-1],
                    "t": a.get("text", ""), "pkg": a.get("package", ""), "px": px, "b": [v / F for v in px]})
    return [n for n in out if n["pkg"] == "rocks.octavia.app" and n["cls"] != "ComposeView"]


dentro = lambda n, c: n["b"][0] >= c["b"][0] - .1 and n["b"][1] >= c["b"][1] - .1 and n["b"][2] <= c["b"][2] + .1 and n["b"][3] <= c["b"][3] + .1
W = lambda n: n["b"][2] - n["b"][0]
H = lambda n: n["b"][3] - n["b"][1]
f1 = lambda v: f"{v:.1f}"


def medir(arq):
    ns = nos(arq)
    pos = next(n for n in ns if n["cls"] == "TextView" and re.fullmatch(r"\d+ DE \d+|AVULSA", n["t"]))
    # o título: o TextView da barra que não é a posição, a setlist, a página nem a nota
    cands = [n for n in ns if n["cls"] == "TextView" and n is not pos and n["b"][1] < pos["b"][3] + 60
             and n["t"] and not n["t"].isupper() and not n["t"].startswith(("página ", "Nota: "))]
    tit = cands[0]
    barra = min((n for n in ns if n["cls"] == "ViewGroup" and dentro(pos, n) and dentro(tit, n)), key=lambda n: H(n) * W(n))
    textos = [n for n in ns if n["cls"] == "TextView" and dentro(n, barra)]
    linhas = len({round(n["b"][1]) // 12 for n in textos})
    bv = next(n for n in ns if n["id"] == "borda-voltar")
    ba = next(n for n in ns if n["id"] == "borda-avancar")
    ctl = {n["id"]: n for n in ns if n["id"] in BASE}
    pai_base = min((n for n in ns if n["cls"] == "ViewGroup" and all(dentro(c, n) for c in ctl.values())),
                   key=lambda n: H(n) * W(n))
    # no celular (faixa A com os tokens de B, até o N5) `busca` e `sair` saem da janela e não têm nó
    esq = ctl["tema"]["b"][2] - ctl["auto-scroll"]["b"][0]
    dir_ = ctl["sair"]["b"][2] - ctl["indice"]["b"][0] if "sair" in ctl else float("nan")
    vao = ctl["indice"]["b"][0] - ctl["tema"]["b"][2] if "indice" in ctl else float("nan")
    return {
        "barra": H(barra), "linhas": linhas, "título": W(tit), "corpo": H(bv), "zona": W(bv), "zona (avançar)": W(ba),
        "base (altura)": H(pai_base), "base (esquerda)": esq, "base (direita)": dir_, "base (vão)": vao,
        "_x": [round(ctl[i]["b"][0], 1) if i in ctl else None for i in BASE], "_barra_y": (round(barra["b"][1], 1), round(barra["b"][3], 1)),
        "_titulo_x": (round(tit["b"][0], 1), round(tit["b"][2], 1)), "_pos": pos["t"], "_janela": round(W(ns[0]), 1),
        "_controle": round(W(ctl["auto-scroll"]), 1),
        # a folha conta o corpo no canvas do AVD (1054 − 88 − 96 = 870); cada aparelho tem a sua
        # janela útil, então a regra é: do fundo da barra superior ao topo da base
        "_corpo_regra": pai_base["b"][1] - barra["b"][3], "_util": pai_base["b"][3] - barra["b"][1],
    }


if __name__ == "__main__":
    for arq in sys.argv[1:]:
        m = medir(arq)
        print(f"== {arq.split('/')[-1]}  (janela {m['_janela']} dp · {m['_pos']} · barra y {m['_barra_y']} · título x {m['_titulo_x']} · controle {m['_controle']})")
        for k in ["barra", "linhas", "título", "corpo", "zona", "zona (avançar)", "base (altura)", "base (esquerda)",
                  "base (direita)", "base (vão)"]:
            fo = FOLHA.get(k, FOLHA["zona"] if k.startswith("zona") else None)
            d = m[k] - fo if fo is not None else 0
            marca = ("confere" if d == 0 else "DIFERE") if k == "linhas" else ("confere" if abs(d) <= 4 else "> 4 dp")
            print(f"  {k:16} folha {fo!s:>6}  dump {f1(m[k]) if isinstance(m[k], float) else m[k]!s:>7}  Δ {d:+.1f}  {marca}")
        print(f"  base (x)         {m['_x']}")
        print(f"  corpo × regra    janela útil {m['_util']:.1f} − barra − base = {m['_corpo_regra']:.1f}; dump {m['corpo']:.1f}"
              f"  Δ {m['corpo'] - m['_corpo_regra']:+.1f}")

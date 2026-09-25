"""N3-PR5 — "a base é a de C" (N3-D13): a barra inferior do palco em B contra a do pre-check.

  python3 base-igual.py <dir-do-pre-check> <dir-desta-pr> <estado> [<estado> ...]

`<estado>` é `S3-<estado>-<aparelho>` (ex.: `S3-S3a-letra-1a-avd`): a base é
`<pre>/B2-<estado>.xml` (a `main` de antes do N3 em retrato: a barra superior de 64 e a base
de C na largura de 711) e o novo, `<pr>/N3P5-<estado>-ret.xml`.

Compara, nó a nó e com o mesmo formato do `prova-passa.py`, a barra inferior — o menor
`ViewGroup` que contém os sete controles (`auto-scroll` … `sair`) e todo nó DENTRO do retângulo
dele (os controles, os ícones, os traços; por geometria: no dump os controles não são filhos
do nó da barra) — e as duas bordas pela LARGURA e pelo FUNDO (o topo delas desce 24 dp, com a
barra superior de 88: é o corpo que perde os 24, D-1). Exit 1 se algum par difere.
"""
import os, sys
import xml.etree.ElementTree as ET

BASE = ["auto-scroll", "zoom-menos", "zoom-mais", "tema", "indice", "busca", "sair"]


def arvore(arq):
    F = 2.625 if "phone" in arq else 2.25
    nos = []

    def anda(no, pai):
        if no.tag == "node" and no.get("package") == "rocks.octavia.app":
            b = [int(v) / F for v in no.get("bounds").replace("][", ",").strip("[]").split(",")]
            reg = {"cls": no.get("class", "").split(".")[-1], "id": no.get("resource-id", "").split("/")[-1],
                   "b": b, "filhos": [], "pai": pai}
            nos.append(reg)
            if pai is not None:
                pai["filhos"].append(reg)
            pai = reg
        for f in no:
            anda(f, pai)

    anda(ET.parse(arq).getroot(), None)
    return nos


def contem(c, n):
    return all(c["b"][i] <= n["b"][i] + .05 for i in (0, 1)) and all(c["b"][i] >= n["b"][i] - .05 for i in (2, 3))


def sub(n):
    yield f"{n['cls']} {n['id']} [{','.join(f'{v:.1f}' for v in n['b'])}]"
    for f in n["filhos"]:
        yield from sub(f)


def base_de(arq):
    ns = arvore(arq)
    ctl = [n for n in ns if n["id"] in BASE]
    pai = min((n for n in ns if n["cls"] == "ViewGroup" and all(contem(n, c) for c in ctl)),
              key=lambda n: (n["b"][2] - n["b"][0]) * (n["b"][3] - n["b"][1]))
    bordas = {n["id"]: n["b"] for n in ns if n["id"] in ("borda-voltar", "borda-avancar")}
    # por GEOMETRIA, não pela árvore do XML: no dump os sete controles não são filhos do nó da
    # barra (que sai sem filhos), e sim irmãos dele sob o pai da tela
    dentro = [f"{n['cls']} {n['id']} [{','.join(f'{v:.1f}' for v in n['b'])}]" for n in ns if contem(pai, n)]
    return dentro, {k: (round(v[2] - v[0], 1), round(v[3], 1), round(v[1], 1)) for k, v in bordas.items()}


pre, pr = sys.argv[1], sys.argv[2]
falhou = False
for est in sys.argv[3:]:
    (la, ba), (lb, bb) = base_de(os.path.join(pre, f"B2-{est}.xml")), base_de(os.path.join(pr, f"N3P5-{est}-ret.xml"))
    bordas_ok = all(ba[k][:2] == bb[k][:2] for k in ba)
    if la == lb and bordas_ok:
        topo = {k: f"{ba[k][2]} → {bb[k][2]}" for k in ba}
        print(f"  ✓ {est}: a base é a mesma ({len(la)} nós); bordas: largura e fundo iguais "
              f"({ba['borda-voltar'][0]} · {ba['borda-voltar'][1]}), topo {topo['borda-voltar']}")
        continue
    falhou = True
    print(f"  ✗ {est}: base {len(la)} × {len(lb)} nós; bordas {ba} × {bb}")
    for i, (x, y) in enumerate(zip(la, lb)):
        if x != y:
            print(f"      nó {i}: pre-check {x}  ·  esta PR {y}")
            break
print("base = C: " + ("DIFERE ✗" if falhou else "a mesma barra inferior em todos os pares ✓"))
sys.exit(1 if falhou else 0)

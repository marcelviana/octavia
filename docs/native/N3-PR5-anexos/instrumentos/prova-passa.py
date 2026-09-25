"""N3-PR5 — a prova de "passa": o dump de RETRATO desta PR contra o do pre-check, nó a nó.

  python3 prova-passa.py <dir-do-pre-check> <dir-desta-pr> <estado> [<estado> ...]

`<estado>` é `<tela>-<estado>-<aparelho>` (ex.: `picker-vazio-avd`): a base é
`<pre>/B2-<estado>.xml` e o novo, `<pr>/N3P5-<estado>-ret.xml`.

O que compara é o mesmo do `g-inv.sh` (a forma do `W4B3-anexos/dp.mjs`), mas em RETRATO —
o `g-inv.sh` exige paisagem, porque a invariante dele é a da faixa C: por nó do pacote do
app, na ordem do dump, `classe resource-id [x0,y0][x1,y1]` com os `bounds` ÷ fator (2,25;
2,625 se `phone`) a 0,1 dp; sem `enabled`/`clickable`; sem a subárvore do `ComposeView` (o
"Tools" do dev client, div. 402); nenhum texto. Diferença de contagem também reprova.

A pergunta é a da folha — *"B: passa … sem mudança"* —: o dump da `main` de hoje em B tem de
ser o dump do pre-check (tirado em `aa91b5d`, antes de qualquer tela do N3), nó a nó.
Exit 1 se algum par difere.
"""
import os, sys
import xml.etree.ElementTree as ET


def linhas(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []

    def anda(no, dentro_compose):
        c = no.get("class", "")
        compose = dentro_compose or c.endswith("ComposeView")
        if no.tag == "node" and no.get("package") == "rocks.octavia.app" and not compose:
            b = [int(v) for v in no.get("bounds").replace("][", ",").strip("[]").split(",")]
            d = ",".join(f"{v / F:.1f}" for v in b)
            out.append(f"{c.split('.')[-1]} {no.get('resource-id', '').split('/')[-1]} [{d}]")
        for f in no:
            anda(f, compose)

    anda(ET.parse(arq).getroot(), False)
    return out


pre, pr = sys.argv[1], sys.argv[2]
falhou = False
for est in sys.argv[3:]:
    a, b = os.path.join(pre, f"B2-{est}.xml"), os.path.join(pr, f"N3P5-{est}-ret.xml")
    la, lb = linhas(a), linhas(b)
    if la == lb:
        print(f"  ✓ {est}: mesmos bounds ({len(la)} nós) — B2-{est}.xml × N3P5-{est}-ret.xml")
        continue
    falhou = True
    print(f"  ✗ {est}: {len(la)} × {len(lb)} nós")
    for i, (x, y) in enumerate(zip(la, lb)):
        if x != y:
            print(f"      nó {i}: pre-check {x}  ·  esta PR {y}")
            break
print("prova de passa: " + ("DIFERE ✗" if falhou else "mesmos bounds em todos os pares ✓"))
sys.exit(1 if falhou else 0)

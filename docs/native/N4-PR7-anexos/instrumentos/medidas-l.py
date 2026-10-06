#!/usr/bin/env python3
"""N4-PR7 — as medidas de L num dump (dp, fator 2,25): medidas-l.py <dump.xml>…
A barra, a faixa de filtros (a altura entre a barra e a régua), cada chip, a régua, a primeira linha, a estrela e o ▶."""
import re, sys
F = 2.25
def nos(x):
    for m in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        b = [int(v) for v in re.findall(r"-?\d+", a.get("bounds", "[0,0][0,0]"))]
        yield a.get("resource-id", "").split("/")[-1], b, a
def dp(b): return f"x {b[0]/F:.1f}–{b[2]/F:.1f} ({(b[2]-b[0])/F:.1f}) · y {b[1]/F:.1f}–{b[3]/F:.1f} ({(b[3]-b[1])/F:.1f})"
for arq in sys.argv[1:]:
    print(f"### {arq.split('/')[-1]}")
    ns = list(nos(open(arq, encoding="utf-8").read()))
    ids = {}
    for rid, b, a in ns:
        if rid.startswith("lib-") and rid not in ids: ids[rid] = (b, a)
    chips = [k for k in ids if k.startswith("lib-filtro-") and k != "lib-filtro-sem-resultado"]
    soma = sum((ids[k][0][2]-ids[k][0][0])/F for k in chips)
    for k in ["lib-voltar", "lib-campo"] + chips + ["lib-regua", "lib-lista"]:
        if k in ids: print(f"  {k:24s} {dp(ids[k][0])}  {ids[k][1].get('content-desc','')!r}")
    if chips:
        xs = sorted(ids[k][0] for k in chips)
        print(f"  chips: soma {soma:.1f} dp + {len(chips)-1} vãos = {(xs[-1][2]-xs[0][0])/F:.1f} dp do 1º ao último; linhas de chips: {len({b[1] for b in xs})}")
    for pre in ["lib-linha-", "lib-favoritar-", "lib-tocar-"]:
        k = next((k for k in ids if k.startswith(pre)), None)
        if k: print(f"  {k:24s} {dp(ids[k][0])}  {ids[k][1].get('content-desc','')!r} enabled={ids[k][1].get('enabled')}")

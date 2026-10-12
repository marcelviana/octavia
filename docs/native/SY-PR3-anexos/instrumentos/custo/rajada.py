#!/usr/bin/env python3
"""SY-PR3 — onde caem os intervalos > 100 ms da janela do sync: na RAJADA do sync ([−1,5 s, +2,5 s] do `sync ok`) ou fora
dela, e em quantas rodadas o passo 0 (o `sync start`) e o 1 (o `cache write kind=content`) passam de 100 ms. Instrumento
de anexo (fora de CI, N4-D117). Lê a última tabela do `custo-analise-pr3.mjs`.   Uso: python3 rajada.py <analise.txt> <rótulo>"""
import re, statistics, sys
b = open(sys.argv[1]).read().split("## O que estava no JS", 1)[1].split("\n## ", 1)[0]
rs = {}
for l in b.splitlines():
    m = re.match(r"\| (r\d+) \| ([\d.]+) \| ([+-]?\d+) ms \| (.*) \|$", l)
    if m:
        rs.setdefault(m.group(1), []).append((float(m.group(2)), int(m.group(3)), m.group(4)))
raj = [sum(1 for v, t, l in iv if v > 100 and -1500 <= t <= 2500) for _, iv in sorted(rs.items())]
fora = [sum(1 for v, t, l in iv if v > 100 and not -1500 <= t <= 2500) for _, iv in sorted(rs.items())]
p1 = sum(1 for iv in rs.values() if any(v > 100 and "cache write kind=content" in l for v, t, l in iv))
p0 = sum(1 for iv in rs.values() if any(v > 100 and "`sync start`" in l for v, t, l in iv))
print(f"{sys.argv[2]}: > 100 ms por rodada na rajada {raj} (mediana {statistics.median(raj):g}) · fora {fora} (mediana "
      f"{statistics.median(fora):g}) · o passo 1 > 100 ms em {p1} de {len(rs)} rodadas · o passo 0 > 100 ms em {p0} de {len(rs)}")

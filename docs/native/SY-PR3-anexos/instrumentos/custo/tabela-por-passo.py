#!/usr/bin/env python3
"""SY-PR3 — A TABELA POR PASSO do custo (a da SY-PR1 §6.2, refeita das listas da análise), antes × depois. Instrumento de
anexo (fora de CI, N4-D117). Lê a última tabela do `custo-analise-pr3.mjs` (cada intervalo > 50 ms da janela do sync, com o
instante do quadro que o fechou contra o `sync ok` e as linhas OCTAVIA saídas dentro dele) e acha, rodada a rodada:

  0  o intervalo que contém `sync start` (antes do `sync ok`) — o disparo: o `setSync('sincronizando')` e o render dele
     (a SY-PR1 não o tinha: lá o sync era o da abertura, já em curso quando a rolagem ligou)
  1  o que contém `cache write kind=content` — o fim síncrono do sync: a leitura, o `reconcile`, a gravação, o `sync ok`, e
     desde a PR-2 a aplicação na raiz no mesmo bloco (SY-D26)
  2  o MAIOR intervalo > 100 ms depois do 1 e antes do 3, sem linha — o render da troca da raiz
  3  o que contém `reason=demand` — o prefetch sob demanda do palco (o efeito que depende do `contentById`)
  4  o MAIOR intervalo > 100 ms nos 700 ms depois do 3 — o render seguinte

Um passo que a rodada não tem (nenhum intervalo > 50 ms com a assinatura) conta como **< 50 ms** e entra na mediana como 50.

Uso:  python3 tabela-por-passo.py <analise-antes.txt> <analise-depois.txt> [fora-do-antes, ex. r03,r04] [fora-do-depois]
"""
import re
import statistics
import sys


def ler(arq: str) -> dict[str, list[tuple[float, int, str]]]:
    bloco = open(arq).read().split("## O que estava no JS", 1)[1].split("\n## ", 1)[0]
    out: dict[str, list[tuple[float, int, str]]] = {}
    for l in bloco.splitlines():
        m = re.match(r"\| (r\d+) \| ([\d.]+) \| ([+-]?\d+) ms \| (.*) \|$", l)
        if m:
            out.setdefault(m.group(1), []).append((float(m.group(2)), int(m.group(3)), m.group(4)))
    return out


def passos(iv: list[tuple[float, int, str]]) -> list[float | None]:
    p0 = next((v for v, t, l in iv if "`sync start`" in l and t <= 0), None)
    i1 = next((k for k, (v, t, l) in enumerate(iv) if "cache write kind=content" in l), None)
    i3 = next((k for k, (v, t, l) in enumerate(iv) if "reason=demand" in l), None)
    p1 = iv[i1][0] if i1 is not None else None
    p3 = iv[i3][0] if i3 is not None else None
    meio = [v for v, t, l in iv[(i1 or 0) + 1:(i3 if i3 is not None else len(iv))] if l == "—" and v > 100] if i1 is not None else []
    p2 = max(meio) if meio else None
    t3 = iv[i3][1] if i3 is not None else None
    depois3 = [v for v, t, l in iv[i3 + 1:] if v > 100 and t <= t3 + 700] if i3 is not None else []
    p4 = max(depois3) if depois3 else None
    return [p0, p1, p2, p3, p4]


fora = {"antes": set(sys.argv[3].split(",")) if len(sys.argv) > 3 and sys.argv[3] else set(),
        "depois": set(sys.argv[4].split(",")) if len(sys.argv) > 4 and sys.argv[4] else set()}
lados = {"antes": ler(sys.argv[1]), "depois": ler(sys.argv[2])}
NOMES = ["0 o disparo (`sync start`)", "1 o fim síncrono do sync (gravação + aplicação)", "2 o render da troca da raiz",
         "3 o prefetch sob demanda do palco", "4 o render seguinte"]
med = {}
for lado, rs in lados.items():
    cols = [[], [], [], [], []]
    for r, iv in sorted(rs.items()):
        if r in fora[lado]:
            continue
        for k, v in enumerate(passos(iv)):
            cols[k].append(50.0 if v is None else v)
    med[lado] = [(statistics.median(c), min(c), max(c), len(c)) for c in cols]
sem = '; '.join(f"{l} sem {', '.join(sorted(f))}" for l, f in fora.items() if f)
print(f"# a tabela por passo — as medianas das rodadas{(' (' + sem + ')') if sem else ''} (ms; faixa)\n")
print("| passo | antes | depois | depois − antes |")
print("|---|---|---|---|")
for k, n in enumerate(NOMES):
    a, d = med["antes"][k], med["depois"][k]
    print(f"| {n} | **{a[0]:.0f}** · {a[1]:.0f}–{a[2]:.0f} (n={a[3]}) | **{d[0]:.0f}** · {d[1]:.0f}–{d[2]:.0f} (n={d[3]}) | {d[0] - a[0]:+.0f} |")

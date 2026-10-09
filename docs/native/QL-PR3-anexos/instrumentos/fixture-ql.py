#!/usr/bin/env python3
"""QL-PR3 — a fixture do mock para o leitor que quebra (instrumento de anexo; fora de CI, lint e typecheck, N4-D117).

Todo texto é INVENTADO PELO PROJETO, com a FORMA do dado real (`QL-PRECHECK.md` §10.1/§10.2) — nenhum verso de terceiro
(regra 10). As duas primeiras músicas são as fixtures do custo da PR-2 (`QL-PR2-anexos/instrumentos/custo.ts`),
portadas linha a linha (o mesmo gerador, as mesmas palavras): a Letra de 50 linhas com a maior de 77 colunas (p95 46) e
a Cifra de 20 pares com o maior de 50. A elas se somam:

  - a LETRA LONGA (a âncora, A-QL-12): 96 linhas com texto (107 com as vazias), 48 acima de 48 colunas (quebram em B), as
    estrofes separadas por linha vazia — rolar até o meio dela e girar mostra a âncora;
  - a CIFRA DO ACORDE LONGO (a exceção da QL-D45): um acorde de 28 colunas (`Ebmaj7(9)(11)(13)add9sus4/Bb`, válido pela
    heurística da Fase B), sozinho numa linha e num par — passa da coluna em B no zoom 40 (26 colunas); o dado real não
    tem esse caso (o maior acorde dele tem 8);
  - a Tab de 78 colunas da fixture do N3 (R4: não quebra).

Uso:  python3 fixture-ql.py <dir-saida>     → <dir-saida>/setlists.json, content.json (o `aceite.py servidor`)
      python3 fixture-ql.py --forma         → só a forma dos textos (linhas, maior, p95), sem texto nenhum
"""
from __future__ import annotations

import json
import math
import os
import sys

UID = "00000000-0000-4000-8000-0000000000aa"
T0 = "2026-10-09T12:00:00.000+00:00"

PALAVRAS = "a lanterna da fixture acende o cais devagar e o vento leva o barco pela areia fria enquanto a cidade dorme sem pressa".split(" ")


def linha(n: int, semente: int) -> str:
    """O `linha` do custo.ts: palavras do projeto até `n` colunas, cortada na última (nunca termina em espaço)."""
    s = ""
    k = semente
    while len(s) < n:
        s += (" " if s else "") + PALAVRAS[k % len(PALAVRAS)]
        k += 1
    s = s[:n]
    return s[:-1] + "o" if s.endswith(" ") else s


# a Letra do custo.ts — 1 de 77, 1 de 72, e o resto até 46 (44 linhas com texto + 6 vazias = 50)
COMPRIMENTOS = [77, 72, 46, 46, 46, 45, 44, 44, 43, 42, 41, 40, 40, 39, 38, 38, 37, 36, 36, 35, 34, 34, 33, 32, 32,
                31, 30, 30, 29, 28, 28, 27, 26, 25, 24, 24, 23, 22, 21, 20, 18, 16, 14, 12]
_letra: list[str] = []
for i, n in enumerate(COMPRIMENTOS):
    _letra.append(linha(n, i * 3))
    if i % 8 == 7 and len(_letra) < 50:
        _letra.append("")
while len(_letra) < 50:
    _letra.append("")
LETRA = "\n".join(_letra)

# a Cifra do custo.ts — 20 pares, os acordes espalhados sobre a letra, o maior par com 50
ACORDES = ["Am", "F", "C", "G", "Dm", "E7", "F#m7(11)", "Bb"]
_cifra: list[str] = []
for p in range(20):
    n = 50 if p == 0 else 24 + ((p * 7) % 16)
    l_ = linha(n, p * 5)
    a = ""
    col, k = 0, p
    while col < n - 2:
        a = a.ljust(col) + ACORDES[k % len(ACORDES)]
        col += 9 + (k % 5)
        k += 1
    _cifra += [a, l_]
CIFRA = "\n".join(_cifra)

# a Letra longa — 12 estrofes de 8 linhas; 48 das 107 acima de 48 colunas
_ciclo = [77, 46, 52, 38, 64, 30, 58, 44, 26, 49, 72, 34]
_longa: list[str] = []
for i in range(96):
    _longa.append(linha(_ciclo[i % len(_ciclo)], i * 5 + 1))
    if i % 8 == 7 and i < 95:
        _longa.append("")
LETRA_LONGA = "\n".join(_longa)

# a Cifra do acorde longo (QL-D45)
LONGO = "Ebmaj7(9)(11)(13)add9sus4/Bb"
CIFRA_ACORDE_LONGO = "\n".join([
    "[Intro]",
    f"{LONGO}  Am",
    "",
    "[Verso]",
    f"Am      {LONGO}   G",
    linha(46, 2),
    "",
    "C   G   Am  F",
    linha(30, 9),
])

TAB = "\n".join(
    ["e|---0-----0-----0-----0-----0-----0-----0-----0-----0-----0-----0-----0---|",
     "B|-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-|",
     "G|---------------------------------------------------------------------------|",
     "D|---2-----------2-----------2-----------2-----------2-----------2-----------|",
     "A|---3-----------3-----------3-----------3-----------3-----------3-----------|",
     "E|---------------------------------------------------------------------------|", ""] * 3
)


def content(i: int, titulo: str, tipo: str, corpo: str) -> dict:
    chave = {"Lyrics": "lyrics", "Chords": "chords", "Tab": "tablature"}[tipo]
    return {
        "id": f"00000000-0000-4000-8000-0000000a{i:04x}",
        "user_id": UID,
        "title": titulo,
        "artist": "Banda da fixture",
        "album": None,
        "content_type": tipo,
        "content_data": {chave: corpo},
        "file_url": None,
        "created_at": T0,
        "updated_at": T0,
    }


BIBLIOTECA = [
    content(1, "Lanterna da fixture", "Lyrics", LETRA),
    content(2, "Cais da fixture", "Chords", CIFRA),
    content(3, "Letra longa da fixture", "Lyrics", LETRA_LONGA),
    content(4, "Cifra do acorde longo", "Chords", CIFRA_ACORDE_LONGO),
    content(5, "Tab da fixture QL", "Tab", TAB),
]


def setlists() -> list[dict]:
    sid = "0000000a-0000-4000-8000-000000000003"
    songs = []
    for pos, c in enumerate(BIBLIOTECA, start=1):
        songs.append({
            "id": f"000a{pos:04x}-0000-4000-8000-000000000004",
            "setlist_id": sid,
            "content_id": c["id"],
            "position": pos,
            "notes": None,
            "content": {k: c[k] for k in ("id", "title", "artist", "content_type", "content_data", "file_url")},
        })
    return [{"id": sid, "user_id": UID, "name": "Ensaio da quebra", "performance_date": None, "venue": None,
             "created_at": T0, "updated_at": T0, "setlist_songs": songs}]


def forma(t: str) -> str:
    ls = sorted(len(x) for x in t.split("\n"))
    return f"linhas {len(ls)} · maior {ls[-1]} · p95 {ls[math.ceil(0.95 * len(ls)) - 1]} · acima de 48: {sum(1 for x in ls if x > 48)} · acima de 55: {sum(1 for x in ls if x > 55)}"


if __name__ == "__main__":
    if sys.argv[1:] == ["--forma"]:
        for c in BIBLIOTECA:
            corpo = next(iter(c["content_data"].values()))
            print(f"{c['id'][-8:]}  {c['content_type']:<6} {c['title']:<24} {forma(corpo)}")
        sys.exit(0)
    saida = sys.argv[1]
    os.makedirs(saida, exist_ok=True)
    json.dump(setlists(), open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(BIBLIOTECA, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False)
    print(f"fixture QL-PR3: setlists=1 content={len(BIBLIOTECA)}")

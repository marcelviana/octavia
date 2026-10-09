#!/usr/bin/env python3
"""QL-PR4 — a fixture do mock para as notas da música no palco (instrumento de anexo; fora de CI, lint e typecheck,
N4-D117). É a do QL-PR3 (`fixture-ql.py`, as mesmas cinco músicas, o mesmo texto) com NOTAS em duas:

  - a Lanterna (1, a Letra de 50 linhas) e a Letra longa (3, a da âncora) levam a nota do `QL-BRIEF.md` §5.4 — três
    linhas, a última longa (89 colunas): texto do projeto (regra 10);
  - a Cifra (2), a do acorde longo (4) e a Tab (5) ficam SEM nota (`notes: null`): o "sem nota, nada".

A nota DA POSIÇÃO (a da setlist, na barra de cima) fica `null` em todas, como na PR-3.

Uso:  python3 fixture-ql4.py <dir-saida>   → <dir-saida>/setlists.json, content.json (o `aceite.py servidor`)
"""
import importlib.util
import json
import os
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
_e = importlib.util.spec_from_file_location("fixture_ql", os.path.join(AQUI, "../../QL-PR3-anexos/instrumentos/fixture-ql.py"))
FQ = importlib.util.module_from_spec(_e)
_e.loader.exec_module(FQ)

NOTA = "\n".join([
    "Capo na 2.",
    "Entrar depois da contagem de quatro do metrônomo da fixture.",
    "Segunda voz só no refrão; no fim, segurar o último acorde até a luz da sala apagar de vez.",
])
COM_NOTA = {1, 3}

if __name__ == "__main__":
    saida = sys.argv[1]
    os.makedirs(saida, exist_ok=True)
    biblioteca = []
    for i, c in enumerate(FQ.BIBLIOTECA, start=1):
        biblioteca.append({**c, "notes": NOTA if i in COM_NOTA else None})
    json.dump(FQ.setlists(), open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(biblioteca, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False)
    print(f"fixture QL-PR4: setlists=1 content={len(biblioteca)} · com nota: {sorted(COM_NOTA)} · a nota: {len(NOTA.splitlines())} linhas, a maior {max(len(x) for x in NOTA.splitlines())}")

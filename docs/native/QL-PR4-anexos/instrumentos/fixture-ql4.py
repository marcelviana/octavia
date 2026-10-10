#!/usr/bin/env python3
"""QL-PR4 — a fixture do mock para as notas da música no palco (instrumento de anexo; fora de CI, lint e typecheck,
N4-D117). É a do QL-PR3 (`fixture-ql.py`, as mesmas cinco músicas, o mesmo texto) com NOTAS em duas:

  - a Lanterna (1, a Letra de 50 linhas) e a Letra longa (3, a da âncora) levam a nota do `QL-BRIEF.md` §5.4 — três
    linhas, a última longa (89 colunas): texto do projeto (regra 10);
  - a Cifra (2), a do acorde longo (4) e a Tab (5) ficam SEM nota (`notes: null`): o "sem nota, nada";
  - QL-D58: três Partituras COM nota, nas posições 6, 7 e 8 — o PDF que baixa, o `.jpg` e o PDF que dá 404.

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

# QL-D58 (a volta da PR-4): três músicas que NÃO são texto, todas com a nota — posições 6, 7 e 8 da setlist
ARQ = "http://localhost:8790/"
FORA_DO_TEXTO = [
    ("Partitura da fixture QL", "partitura-12p.pdf"),   # o PDF que baixa: o S3d
    ("Partitura escaneada QL", "partitura-escaneada.jpg"),  # o formato que o app ainda não mostra
    ("Partitura que não baixa QL", "nao-existe.pdf"),   # o 404: o S3e com a falha
]


def sheet(i: int, titulo: str, arquivo: str) -> dict:
    return {**FQ.content(1, titulo, "Lyrics", ""), "id": f"00000000-0000-4000-8000-0000000a{i:04x}", "title": titulo,
            "content_type": "Sheet", "content_data": None, "file_url": ARQ + arquivo, "notes": NOTA}

if __name__ == "__main__":
    saida = sys.argv[1]
    os.makedirs(saida, exist_ok=True)
    biblioteca = []
    for i, c in enumerate(FQ.BIBLIOTECA, start=1):
        biblioteca.append({**c, "notes": NOTA if i in COM_NOTA else None})
    for k, (titulo, arquivo) in enumerate(FORA_DO_TEXTO, start=6):
        biblioteca.append(sheet(k, titulo, arquivo))
    FQ.BIBLIOTECA[:] = biblioteca  # a setlist "Ensaio da quebra" com as oito, na ordem
    sls = FQ.setlists()
    for sl in sls:  # outro `updated_at` que o da QL-PR3: o sync não guarda a setlist de 5 do cache (APARATO.md)
        sl["updated_at"] = "2026-10-10T12:00:00.000+00:00"
    json.dump(sls, open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(biblioteca, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False)
    print(f"fixture QL-PR4: setlists=1 content={len(biblioteca)} · com nota: {sorted(COM_NOTA)} · a nota: {len(NOTA.splitlines())} linhas, a maior {max(len(x) for x in NOTA.splitlines())}")

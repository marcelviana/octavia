#!/usr/bin/env python3
"""SY-PR1 — as DUAS fixtures do "antes" do custo (instrumento de anexo; fora de CI, lint e typecheck, N4-D117).

É a fixture da QL-PR4 (`fixture-ql4.py`: a setlist "Ensaio da quebra" com as oito; texto do projeto, regra 10) em duas
versões, A e B, que diferem SÓ no corpo da "Letra longa da fixture" (a 3, 107 linhas — a mais comprida, para a rolagem
ter chão durante o sync inteiro) e no `updated_at` dela:

  - A: o texto da QL-PR4, como está;
  - B: o mesmo texto com cada `a` trocado por `e` — as MESMAS colunas em toda linha (a mesma quebra, a mesma altura), e
    o corpo DIFERENTE, então o sync que troca A por B (ou B por A) refaz o corpo da música aberta: o pior caso da A3
    (sem foto, o corpo se refaz).

As SETLISTS são as mesmas nas duas, com o mesmo `updated_at`: o `reconcile` devolve o MESMO objeto, e o efeito de troca do
palco (`StageScreen.tsx`, as dependências `posicao`, `n`, `setlist`) não roda — a rolagem segue andando depois do sync. É
de propósito: o que esta medida quer é o CUSTO do sync na thread de JS; a rolagem que para quando a setlist muda é o
gate (iii) (`palco-rolagem-segue`, `palco-sem-topo`), não esta.

Uso:  python3 fixture-sy.py <dir-saida>   → <dir-saida>/a/{setlists,content}.json e <dir-saida>/b/{…}
"""
import copy
import importlib.util
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
QL4 = os.path.join(AQUI, "../../QL-PR4-anexos/instrumentos/fixture-ql4.py")

if __name__ == "__main__":
    saida = sys.argv[1]
    a, b = os.path.join(saida, "a"), os.path.join(saida, "b")
    subprocess.run([sys.executable, QL4, a], check=True)
    os.makedirs(b, exist_ok=True)
    setlists = json.load(open(os.path.join(a, "setlists.json")))
    content = json.load(open(os.path.join(a, "content.json")))
    alvo = next(c for c in content if c["title"] == "Letra longa da fixture")
    nb = copy.deepcopy(content)
    cb = next(c for c in nb if c["id"] == alvo["id"])
    cb["content_data"] = {"lyrics": alvo["content_data"]["lyrics"].replace("a", "e")}
    cb["updated_at"] = "2026-10-10T13:00:00.000+00:00"
    json.dump(setlists, open(os.path.join(b, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(nb, open(os.path.join(b, "content.json"), "w"), ensure_ascii=False)
    la, lb = alvo["content_data"]["lyrics"].split("\n"), cb["content_data"]["lyrics"].split("\n")
    assert [len(x) for x in la] == [len(x) for x in lb], "B mudou as colunas"
    assert la != lb
    print(f"fixture SY: A e B — a Letra longa ({len(la)} linhas, a maior {max(map(len, la))}) muda de corpo; as setlists iguais")

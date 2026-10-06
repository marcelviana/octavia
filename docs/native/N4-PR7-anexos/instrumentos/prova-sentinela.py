#!/usr/bin/env python3
"""N4-PR7 — a prova do sentinela (div. 1097): o passo que apaga arquivos do app apaga SÓ o que o teste criou.

  SCR=<dir com mock/> ARVORE=<árvore> python3 prova-sentinela.py <dir-instrumentos> <serial>

Planta, na pasta da sessão do aparelho, dois SENTINELAS que nenhuma fixture cria — `files/octavia-<uid>/files/
sentinela-n4pr7.pdf` (o lugar do PDF do Marcel no Tab) e `files/octavia-<uid>/sentinela-n4pr7.json` (ao lado do store) —
e, para o passo ter o que apagar, cópias dos arquivos da fixture e do store. Mede o md5 dos sentinelas antes e depois:
 1. o passo NOVO (`apagar_por_nome` com os nomes da fixture e com o `STORE_DO_TESTE`): os sentinelas ficam, md5 igual;
 2. o CONTROLE NEGATIVO — o passo antigo (`rm -f …/files/*`, `rm -f …/*.json`): os sentinelas somem."""
import os, sys
sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import biblioteca as B  # noqa: E402

s = sys.argv[2]
P = B.PKG
d = [x for x in n3.sh(s, "shell", "run-as", P, "ls", "files").split() if x.startswith("octavia-")][0]
base, arqs = f"files/{d}", f"files/{d}/files"
SENT = [f"{arqs}/sentinela-n4pr7.pdf", f"{base}/sentinela-n4pr7.json"]


def sh(c):
    return n3.sh(s, "shell", f"run-as {P} sh -c '{c}'", check=False).strip()


def md5s():
    return {p.split("/")[-1]: (sh(f"md5sum {p}").split() or ["(ausente)"])[0] for p in SENT}


def plantar():
    sh(f"mkdir -p {arqs} && echo sentinela-pdf-n4pr7 > {SENT[0]} && echo sentinela-json-n4pr7 > {SENT[1]}")
    for n in B.arquivos_da_fixture():
        sh(f"echo fixture > {arqs}/{n}")
    for n in B.STORE_DO_TESTE:
        sh(f"[ -f {base}/{n} ] || echo [] > {base}/{n}")


n3.sh(s, "shell", "am", "force-stop", P)
print(f"pasta da sessão: files/octavia-<uid> · arquivos da fixture: {B.arquivos_da_fixture()} · store do teste: {list(B.STORE_DO_TESTE)}")
plantar()
antes = md5s()
print(f"\n## 1 · o passo NOVO\nsentinelas antes: {antes}")
B.apagar_por_nome(s, arqs, B.arquivos_da_fixture())
B.apagar_por_nome(s, base, B.STORE_DO_TESTE)
depois = md5s()
print(f"sentinelas depois: {depois}")
print("RESULTADO 1:", "os sentinelas FICARAM, md5 igual ✓" if antes == depois else "UM SENTINELA MUDOU ✗")

plantar()
antes = md5s()
print(f"\n## 2 · CONTROLE NEGATIVO — o passo antigo\nsentinelas antes: {antes}")
sh(f"rm -f {arqs}/* cache/{d}/files/*")
sh(f"rm -f {base}/*.json")
depois = md5s()
print(f"sentinelas depois: {depois}")
print("RESULTADO 2:", "o passo antigo APAGOU os sentinelas ✓ (o CN reprova)" if all(v == "(ausente)" for v in depois.values()) else "o CN não reprovou ✗")
sh(f"rm -f {SENT[0]} {SENT[1]}")
print(f"\nsentinelas retirados no fim: {md5s()}")

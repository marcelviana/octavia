#!/usr/bin/env python3
"""SY-PR4 — a fixture do aparelho (instrumento de anexo; fora de CI, lint e typecheck, N4-D117). Texto do projeto (regra 10).

Parte da fixture do "antes" do custo da SY-PR1 (`fixture-sy.py`: a QL-PR4 em A e B, que diferem só no corpo da "Letra
longa da fixture", 107 linhas — a rolagem tem chão) e:
  - TIRA as três partituras (os cenários desta PR não abrem PDF; sem `file_url`, nenhum download e nenhum 404 a cada
    sync — a div. 1263 fica fora da contagem, e os `GET` do sync são os únicos pedidos);
  - ACRESCENTA 14 setlists curtas ("Setlist de rolagem 01…14", duas músicas cada), para a lista de S1 ter rolagem (a
    condição 2 da SY-D57: o banner não desfaz a rolagem).

Versões (cada uma em <saida>/<v>/{setlists,content}.json):
  a  a base;
  b  a "Letra longa" com outro corpo (a B da SY-PR1) — o que o site muda com o palco ou V abertos;
  c  a setlist "Ensaio da quebra" renomeada ("Ensaio da quebra, renomeada no site", `updated_at` novo) — o que o site
     muda com S2 em edição.
Uso:  python3 fixture-pr4.py <saida>
"""
import copy
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
SY = os.path.join(AQUI, "../../../SY-PR1-anexos/instrumentos/fixture-sy.py")
T0 = "2026-09-01T00:00:00.000+00:00"

saida = sys.argv[1]
base = os.path.join(saida, "_sy")
subprocess.run([sys.executable, SY, base], check=True)


def ler(v: str) -> tuple[list, list]:
    return (json.load(open(os.path.join(base, v, "setlists.json"))), json.load(open(os.path.join(base, v, "content.json"))))


def montar(setlists: list, content: list) -> tuple[list, list]:
    content = [c for c in content if not c.get("file_url")]
    ids = {c["id"] for c in content}
    out = []
    for s in setlists:
        s = copy.deepcopy(s)
        songs = [x for x in sorted(s["setlist_songs"], key=lambda x: x["position"]) if x["content_id"] in ids]
        for k, x in enumerate(songs):
            x["position"] = k + 1
        s["setlist_songs"] = songs
        out.append(s)
    textos = [c["id"] for c in content]
    for n in range(1, 15):
        sid = f"5a5a{n:04d}-0000-4000-8000-0000000000{n:02d}"
        out.append({
            "id": sid, "name": f"Setlist de rolagem {n:02d}", "performance_date": None, "venue": None, "updated_at": T0,
            "setlist_songs": [
                {"id": f"5a5a{n:04d}-1111-4000-8000-0000000000{k:02d}", "setlist_id": sid, "content_id": textos[(n + k) % len(textos)],
                 "position": k + 1, "notes": None, "content": None}
                for k in range(2)
            ],
        })
    return out, content


for v in ("a", "b", "c"):
    s, c = ler("b" if v == "b" else "a")
    s, c = montar(s, c)
    if v == "c":
        alvo = next(x for x in s if x["name"] == "Ensaio da quebra")
        alvo["name"] = "Ensaio da quebra, renomeada no site"
        alvo["updated_at"] = "2026-10-12T12:00:00.000+00:00"
    os.makedirs(os.path.join(saida, v), exist_ok=True)
    json.dump(s, open(os.path.join(saida, v, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(c, open(os.path.join(saida, v, "content.json"), "w"), ensure_ascii=False)
    print(f"fixture PR-4 {v}: setlists={len(s)} content={len(c)} · a primeira: {s[0]['name']!r} com {len(s[0]['setlist_songs'])}")

#!/usr/bin/env python3
"""N4-PR6 — a fixture do FORMATO: a do pre-check do N3, mais UMA música com arquivo `.jpg`.

  python3 fixture-formato.py <dir-instrumentos-do-pre-check> <dir-saida> <hoje YYYY-MM-DD>

A fixture da base do G-inv NÃO se toca (`N3-PRECHECK-anexos/instrumentos/fixture.py`, só
`.pdf` — N4-D83, div. 1028): esta gera, num diretório PRÓPRIO, a mesma fixture e acrescenta

  content 13  "Partitura escaneada de fixture" · Sheet · `partitura-escaneada.jpg`
              — o caso "formato que o app ainda não mostra" (N4-D43), pela extensão;
  setlist 3   a mesma, com a música 13 na posição 3 — o palco COM setlist no mesmo estado
              (N4-D83: é o mesmo componente).

O `.jpg` servido são 2048 bytes escritos pelo projeto (um cabeçalho JFIF e enchimento): não é
imagem de ninguém, e nenhum leitor o abre — o app decide pela extensão, antes do disco.
"""
import json
import os
import sys

sys.path.insert(0, sys.argv[1])
import fixture as F  # noqa: E402

saida, hoje = sys.argv[2], sys.argv[3]
F.gerar(saida, hoje, False)

content = json.load(open(os.path.join(saida, "content.json")))
setlists = json.load(open(os.path.join(saida, "setlists.json")))

nova = F.content(13, "Partitura escaneada de fixture", "Orquestra de fixture", "Sheet",
                 arquivo="partitura-escaneada.jpg")
content.append(nova)

s3 = setlists[2]
# `updated_at` posterior ao da fixture: sem ele o sync guarda a setlist 3 do cache (a mesma
# `updated_at`), e o palco com setlist nunca vê a posição 3 (a mesma queda do `n3pr3.py`, `mock101`)
s3["updated_at"] = "2026-09-23T13:00:00.000+00:00"
pos = len(s3["setlist_songs"]) + 1
s3["setlist_songs"].append({
    "id": f"{3:04x}{pos:04x}-0000-4000-8000-000000000004",
    "setlist_id": s3["id"],
    "content_id": nova["id"],
    "position": pos,
    "notes": None,
    "content": {k: nova[k] for k in ("id", "title", "artist", "content_type", "content_data", "file_url")},
})

jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00"
jpg += b"fixture N4-PR6 - formato que o app ainda nao mostra " * 40
jpg = jpg[:2046] + b"\xff\xd9"
open(os.path.join(saida, "arquivos", "partitura-escaneada.jpg"), "wb").write(jpg)

json.dump(setlists, open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False)
json.dump(content, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False)
print(f"fixture do formato: setlists={len(setlists)} content={len(content)} "
      f"setlist 3 com {pos} músicas; partitura-escaneada.jpg {len(jpg)} B")

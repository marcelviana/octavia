#!/usr/bin/env python3
"""N4-PR7 — a fixture da BIBLIOTECA (L), num diretório PRÓPRIO: a da base do G-inv não se toca (div. 1002).

  python3 fixture-biblioteca.py <dir-da-base> <dir-saida>

Lê o `content.json` e o `setlists.json` que o `fixture.py` do pre-check do N3 gerou (a base) e escreve em <dir-saida>:

 1. **os ids com o `{id8}` DISTINTO** — na base todo content é `00000000-0000-4000-8000-00000003XXXX`, e o `{id8}` dos
    testIDs da P-X3 (`lib-linha-{id8}`, `lib-favoritar-{id8}`, `lib-tocar-{id8}`) colide; aqui vira `b1b1XXXX-…`
    (o resto do uuid igual), e o `content_id` das setlists acompanha;
 2. **os estados da linha que a base não tem** (as amostras `N4-*-L-linhas`, N4-E7), escritos pelo projeto:
    - `Item sem tipo da fixture` (`content_type` fora do enum: *tipo não reconhecido*);
    - `Item sem conteúdo da fixture` (Letra sem corpo: *nada para mostrar*);
    - `Partitura grande da fixture` (um PDF de 24 MiB servido pelo 8790 — a janela do *baixando o arquivo…*);
 3. **uma favorita**: `Segunda do ensaio` com `is_favorite: true` (o resto sem a chave, como a base).

Os arquivos (`arquivos/`) são os da base mais o grande. Nenhum texto de terceiro (regra 10).
"""
import json, os, shutil, sys

sys.path.insert(0, os.path.dirname(__file__))
from fixture import UID, T0, ARQ, pdf  # noqa: E402

base, saida = sys.argv[1], sys.argv[2]
os.makedirs(os.path.join(saida, "arquivos"), exist_ok=True)
for f in os.listdir(os.path.join(base, "arquivos")):
    shutil.copy2(os.path.join(base, "arquivos", f), os.path.join(saida, "arquivos", f))
open(os.path.join(saida, "arquivos", "partitura-grande.pdf"), "wb").write(pdf(1, "partitura grande", 24 * 1024 * 1024))

def novo(i):
    return f"b1b1{i:04x}-0000-4000-8000-00000003{i:04x}"

content = json.load(open(os.path.join(base, "content.json")))
mapa = {}
for c in content:
    i = int(c["id"][-4:], 16)
    mapa[c["id"]] = novo(i)
    c["id"] = mapa[c["id"]]
    if c["title"] == "Segunda do ensaio":
        c["is_favorite"] = True

def extra(i, titulo, tipo, data, arquivo=None):
    return {"id": novo(i), "user_id": UID, "title": titulo, "artist": None, "album": None, "content_type": tipo,
            "content_data": data, "file_url": (ARQ + arquivo) if arquivo else None, "created_at": T0, "updated_at": T0}

content += [
    extra(20, "Item sem tipo da fixture", "Piano", {"lyrics": "texto de fixture"}),
    extra(21, "Item sem conteúdo da fixture", "Lyrics", None),
    extra(22, "Partitura grande da fixture", "Sheet", None, "partitura-grande.pdf"),
]
setlists = json.load(open(os.path.join(base, "setlists.json")))
for s in setlists:
    for song in s["setlist_songs"]:
        song["content_id"] = mapa[song["content_id"]]
        if song.get("content"):
            song["content"]["id"] = mapa[song["content"]["id"]]
json.dump(content, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False, indent=1)
json.dump(setlists, open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False, indent=1)
print(f"fixture da biblioteca: content={len(content)} setlists={len(setlists)} "
      f"id8 distintos={len({c['id'][:8] for c in content})} arquivos={sorted(os.listdir(os.path.join(saida, 'arquivos')))}")

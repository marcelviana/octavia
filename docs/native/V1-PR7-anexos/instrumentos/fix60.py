#!/usr/bin/env python3
"""V1-PR7 — recompõe o `setlists.json` do Tab S6 com uma setlist de 60 posições,
usando SÓ os contents que já estão no cache do aparelho.

Não escreve em prod, não toca `content.json`, não inventa content: as 60 posições
apontam para ids que já existem nos 63 do cache. É script de host (scratch), não
`apps/native/src/**`, para não mexer em código do app numa PR de aceite.
"""
import json, sys
entrada, saida, conteudo = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(entrada))
contents = json.load(open(conteudo))
ids = [c["id"] for c in contents]
alvo = next(s for s in d["setlists"] if s["name"] == "Season 3")
base = alvo["setlist_songs"][0]
novas = []
for i in range(60):
    cid = ids[i % len(ids)]
    novas.append({
        "id": f"fixture-v1pr7-{i+1}",
        "setlist_id": alvo["id"],
        "content_id": cid,
        "position": i + 1,
        "notes": ("Nota da posição %d" % (i + 1)) if (i + 1) % 7 == 0 else None,
        "content": None,
    })
alvo["setlist_songs"] = novas
json.dump(d, open(saida, "w"), ensure_ascii=False)
print(f"setlist '{alvo['name']}' → {len(novas)} posições, {len(set(ids[:60]))} contents distintos")

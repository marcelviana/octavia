#!/usr/bin/env python3
"""N4-PR8 — o content do mock para o G-par NO APARELHO: os itens do `packages/core/fixtures/g-par.json` (texto escrito
pelo projeto), um content por item, com o título `Gpar NN` (o termo que o arnês digita no campo da L) e o id do G-par em
`gpar_id`. O `file_url` do item de arquivo passa a apontar para o servidor de arquivos da fixture (o host do G-par não
existe): no aparelho o arquivo se compara pela CLASSE (o leitor de PDF abriu), e a URL pelo teste de tela.

  python3 fixture-gpar.py <raiz-do-repo> <saida.json>
"""
import json, sys
raiz, saida = sys.argv[1], sys.argv[2]
fx = json.load(open(f"{raiz}/packages/core/fixtures/g-par.json"))
out = []
for i, it in enumerate(fx["par"] + fx["fora_do_par"], start=1):
    url = it["file_url"]
    out.append({"id": f"b1b2{i:04x}-0000-4000-8000-00000004{i:04x}", "user_id": "00000000-0000-4000-8000-0000000000aa",
                "title": f"Gpar {i:02d}", "artist": None, "album": None, "content_type": it["content_type"],
                "content_data": it["content_data"], "file_url": ("http://localhost:8790/partitura-1p.pdf" if url else None),
                "created_at": "2026-09-10T15:00:00.000Z", "updated_at": "2026-09-10T15:00:00.000Z", "gpar_id": it["id"]})
json.dump(out, open(saida, "w"), ensure_ascii=False, indent=1)
print(f"content do G-par: {len(out)} itens ({len(fx['par'])} do par, {len(fx['fora_do_par'])} fora)")

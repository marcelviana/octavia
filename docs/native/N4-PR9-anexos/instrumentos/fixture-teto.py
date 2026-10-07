#!/usr/bin/env python3
"""N4-PR9 — a fixture do TETO, num diretório PRÓPRIO e fora do repositório (decisão do Marcel na N4-PR9).

  python3 fixture-teto.py <dir-da-fixture-da-visualizacao> <dir-saida> [n=9]

O A-N4-26 pede *"com o teto reduzido no mock, `lru over` e o arquivo não baixado no que não coube"*. O teto é a
constante `CAP_BYTES` = 200 MB do app (`apps/native/src/prefetch.ts`), e o mock não a alcança; em vez de reduzir o
teto, a fixture passa dele: a da visualização da N4-PR8 mais `n` Partituras de 24 MiB (`Partitura do teto {k}`), todas
garantidas (N4-R26: todo `file_url` de content). Com n = 9 são ≈ 241 MiB servidos.

Os PDFs são gerados aqui, na hora, pelo `pdf()` do pre-check do N3 (válidos para o `fileVerdict`: cabeça, `startxref`,
`%%EOF`), e **não entram no repositório**: só este script e os tamanhos, no anexo. Todo texto é do projeto (regra 10).
"""
import json, os, shutil, sys

sys.path.insert(0, os.path.dirname(__file__))
from fixture import ARQ, UID, pdf  # noqa: E402

base, saida = sys.argv[1], sys.argv[2]
n = int(sys.argv[3]) if len(sys.argv) > 3 else 9
MIB24 = 24 * 1024 * 1024

os.makedirs(os.path.join(saida, "arquivos"), exist_ok=True)
for f in os.listdir(os.path.join(base, "arquivos")):
    shutil.copy2(os.path.join(base, "arquivos", f), os.path.join(saida, "arquivos", f))
shutil.copy2(os.path.join(base, "setlists.json"), os.path.join(saida, "setlists.json"))

content = json.load(open(os.path.join(base, "content.json")))
for k in range(1, n + 1):
    nome = f"partitura-teto-{k:02d}.pdf"
    open(os.path.join(saida, "arquivos", nome), "wb").write(pdf(1, f"partitura do teto {k}", MIB24))
    content.append({"id": f"b1b100{30 + k:02d}-0000-4000-8000-0000000300{30 + k:02d}", "user_id": UID,
                    "title": f"Partitura do teto {k:02d}", "artist": "Orquestra de fixture", "album": None,
                    "content_type": "Sheet", "content_data": None, "file_url": ARQ + nome,
                    "created_at": "2026-09-01T12:00:00.000+00:00", "updated_at": "2026-09-01T12:00:00.000+00:00"})
json.dump(content, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False, indent=1)

d = os.path.join(saida, "arquivos")
tam = {f: os.path.getsize(os.path.join(d, f)) for f in sorted(os.listdir(d))}
print(f"fixture do teto: content={len(content)} arquivos={len(tam)} total={sum(tam.values())} B "
      f"({sum(tam.values()) / 2**20:.1f} MiB) · teto 200 MiB = {200 * 2**20} B")
for f, b in tam.items():
    print(f"  {b:>10} {f}")

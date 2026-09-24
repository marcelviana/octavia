#!/usr/bin/env python3
"""N3 pre-check — a fixture do mock (`aceite.py servidor`) e os arquivos servidos.

Todo texto aqui é ESCRITO PELO PROJETO (regra "anexo não carrega texto de
música", CLAUDE.md): nenhum verso de terceiro. Os PDFs são gerados à mão, com
"Fixture N3 — página n de m" em cada página.

Uso:
  python3 fixture.py <dir-saida> <hoje YYYY-MM-DD> [--b6]

Gera em <dir-saida>:
  setlists.json, content.json   — entrada do `aceite.py servidor`
  arquivos/partitura-12p.pdf    — o S3d (12 páginas)
  arquivos/partitura-1p.pdf     — um PDF de 1 página (o ◔ do S1)
  (sem) arquivos/nao-existe.pdf — a URL do S3e: o servidor de arquivos dá 404
  --b6: arquivos/grande-{1,2,3}.pdf, 80 MiB cada, e a setlist "B6 — acima do
        teto" com data de amanhã (os três viram PROTEGIDOS do LRU: 240 MiB >
        200 MiB → `lru over`), mais "B6 — sem data" com um PDF de 1 página
        (não protegido: é o que o LRU despeja).

Os arquivos são servidos em http://localhost:8790/ (python3 -m http.server,
`adb reverse tcp:8790 tcp:8790`).
"""
from __future__ import annotations

import datetime
import json
import os
import sys

ARQ = "http://localhost:8790/"
UID = "00000000-0000-4000-8000-0000000000aa"
T0 = "2026-09-23T12:00:00.000+00:00"


def pdf(paginas: int, rotulo: str, preencher_ate: int = 0) -> bytes:
    """PDF mínimo e válido: `%PDF-` na cabeça, `startxref` certo, `%%EOF` na cauda.

    `preencher_ate` > 0: um stream de comentário no meio (objeto não
    referenciado) até o arquivo chegar a esse tamanho — o `fileVerdict`
    (`packages/core/src/offline.ts`) julga cabeça, cauda e `startxref`, e os
    três continuam certos.
    """
    objs: list[bytes] = []
    kids = " ".join(f"{3 + 2 * i} 0 R" for i in range(paginas))
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(f"<< /Type /Pages /Kids [{kids}] /Count {paginas} >>".encode())
    fonte = 3 + 2 * paginas
    for i in range(paginas):
        conteudo = 4 + 2 * i
        objs.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
            f"/Resources << /Font << /F1 {fonte} 0 R >> >> /Contents {conteudo} 0 R >>".encode()
        )
        texto = f"BT /F1 36 Tf 60 760 Td (Fixture N3 - {rotulo}) Tj 0 -60 Td (pagina {i + 1} de {paginas}) Tj ET"
        corpo = texto.encode()
        objs.append(b"<< /Length %d >>\nstream\n" % len(corpo) + corpo + b"\nendstream")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    saida = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for n, corpo in enumerate(objs, start=1):
        offsets.append(len(saida))
        saida += f"{n} 0 obj\n".encode() + corpo + b"\nendobj\n"
    if preencher_ate > len(saida) + 400:
        n = len(objs) + 1
        falta = preencher_ate - len(saida) - 400
        offsets.append(len(saida))
        saida += f"{n} 0 obj\n<< /Length {falta} >>\nstream\n".encode() + b"%" * falta + b"\nendstream\nendobj\n"
        objs.append(b"")
    xref = len(saida)
    saida += f"xref\n0 {len(objs) + 1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        saida += f"{off:010d} 00000 n \n".encode()
    saida += f"trailer\n<< /Size {len(objs) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(saida)


def content(i: int, titulo: str, artista: str | None, tipo: str, corpo: str | None = None,
            arquivo: str | None = None, album: str | None = None) -> dict:
    chave = {"Lyrics": "lyrics", "Chords": "chords", "Tab": "tablature", "Sheet": None}[tipo]
    return {
        "id": f"00000000-0000-4000-8000-00000003{i:04x}",
        "user_id": UID,
        "title": titulo,
        "artist": artista,
        "album": album,
        "content_type": tipo,
        "content_data": ({chave: corpo} if chave and corpo is not None else None),
        "file_url": (ARQ + arquivo) if arquivo else None,
        "created_at": T0,
        "updated_at": T0,
    }


LETRA = "\n".join(
    [
        "[Verso 1]",
        "Quando a noite chega o ensaio começa (fixture do projeto)",
        "A sala acende e o metrônomo conta até quatro",
        "",
        "[Refrão]",
        "Linha de refrão escrita para medir quebra de linha em retrato, com palavras suficientes para passar da largura",
        "Outra linha curta",
        "",
        "[Verso 2]",
    ]
    + [f"Linha {n} do verso de fixture, para rolar a tela do palco" for n in range(1, 41)]
)
CIFRA = "\n".join(
    ["[Intro] C Am F G", "", "C              Am", "Primeira linha da cifra de fixture",
     "F                     G", "Segunda linha da cifra, mais longa que a primeira para medir o corte"]
    + [f"C  G  Am  F   linha {n} da progressão de fixture" for n in range(1, 31)]
)
TAB = "\n".join(
    ["e|---0-----0-----0-----0-----0-----0-----0-----0-----0-----0-----0-----0---|",
     "B|-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-----1-|",
     "G|---------------------------------------------------------------------------|",
     "D|---2-----------2-----------2-----------2-----------2-----------2-----------|",
     "A|---3-----------3-----------3-----------3-----------3-----------3-----------|",
     "E|---------------------------------------------------------------------------|", ""] * 6
)


def gerar(saida: str, hoje: str, b6: bool) -> None:
    os.makedirs(os.path.join(saida, "arquivos"), exist_ok=True)
    arquivos = {
        "partitura-12p.pdf": pdf(12, "partitura de 12 paginas"),
        "partitura-1p.pdf": pdf(1, "partitura de 1 pagina"),
    }

    biblioteca = [
        content(1, "Manhã de ensaio", "Banda da fixture", "Lyrics", LETRA, album="Disco de fixture"),
        content(2, "Segunda do ensaio", "Duo Manacá", "Chords", CIFRA),
        content(3, "Terceira do ensaio", "Trio de fixture", "Tab", TAB),
        content(4, "Partitura de doze páginas", "Orquestra de fixture", "Sheet", arquivo="partitura-12p.pdf"),
        content(5, "Partitura que nunca baixou", "Orquestra de fixture", "Sheet", arquivo="nao-existe.pdf"),
        content(6, "Uma música de título bem comprido, para medir o corte do título em retrato e no celular",
                "Artista de nome igualmente comprido da fixture do N3", "Lyrics", LETRA),
        content(7, "Sétima do ensaio", "Banda da fixture", "Chords", CIFRA),
        content(8, "Oitava do ensaio", "Banda da fixture", "Lyrics", LETRA),
        content(9, "Nona do ensaio", "Duo Manacá", "Lyrics", LETRA),
        content(10, "Décima do ensaio", None, "Chords", CIFRA),
        content(11, "Partitura de uma página", "Orquestra de fixture", "Sheet", arquivo="partitura-1p.pdf"),
        content(12, "Águas de fixture", "Banda da fixture", "Lyrics", LETRA),
    ]
    por_id = {c["id"]: c for c in biblioteca}

    def setlist(n: int, nome: str, data: str | None, venue: str | None, ids: list[int]) -> dict:
        sid = f"{n:08x}-0000-4000-8000-000000000003"
        songs = []
        for pos, i in enumerate(ids, start=1):
            c = por_id[f"00000000-0000-4000-8000-00000003{i:04x}"]
            songs.append({
                "id": f"{n:04x}{pos:04x}-0000-4000-8000-000000000004",
                "setlist_id": sid,
                "content_id": c["id"],
                "position": pos,
                "notes": None,
                "content": {k: c[k] for k in ("id", "title", "artist", "content_type", "content_data", "file_url")},
            })
        return {"id": sid, "user_id": UID, "name": nome, "performance_date": data, "venue": venue,
                "created_at": T0, "updated_at": T0, "setlist_songs": songs}

    d = datetime.date.fromisoformat(hoje)
    setlists = [
        # A do palco: 1ª = letra (S3a), 2 cifra (S3b/S3b'), 3 tab (S3c), 4 PDF 12p (S3d),
        # 5 PDF que dá 404 (S3e em avião), 6 título comprido, 7 cifra, 8 letra (última → S5).
        setlist(1, "Ensaio de retrato", None, None, [1, 2, 3, 4, 5, 6, 7, 8]),
        setlist(2, "Show de sexta no teatro da fixture", (d + datetime.timedelta(days=3)).isoformat(),
                "Teatro da fixture", [9, 10, 11, 12]),
        setlist(3, "Setlist de nome bem comprido para medir o corte do nome do cartão em retrato e no celular",
                None, None, [1, 2]),
    ]

    if b6:
        mib = 1024 * 1024
        for k in (1, 2, 3):
            arquivos[f"grande-{k}.pdf"] = pdf(1, f"grande {k}", preencher_ate=80 * mib)
            biblioteca.append(content(20 + k, f"Grande {k} (B6)", "Fixture B6", "Sheet", arquivo=f"grande-{k}.pdf"))
        biblioteca.append(content(24, "Pequena sem data (B6)", "Fixture B6", "Sheet", arquivo="b6-pequena.pdf"))
        arquivos["b6-pequena.pdf"] = pdf(1, "pequena sem data")
        por_id.update({c["id"]: c for c in biblioteca})
        setlists = [
            setlist(0xb6, "B6 — acima do teto", (d + datetime.timedelta(days=1)).isoformat(), None, [21, 22, 23]),
            setlist(0xb7, "B6 — sem data", None, None, [24]),
        ]

    for nome, dados in arquivos.items():
        with open(os.path.join(saida, "arquivos", nome), "wb") as f:
            f.write(dados)
    json.dump(setlists, open(os.path.join(saida, "setlists.json"), "w"), ensure_ascii=False)
    json.dump(biblioteca, open(os.path.join(saida, "content.json"), "w"), ensure_ascii=False)
    print(f"fixture N3{' B6' if b6 else ''}: setlists={len(setlists)} content={len(biblioteca)} "
          f"arquivos={ {k: len(v) for k, v in arquivos.items()} }")


if __name__ == "__main__":
    gerar(sys.argv[1], sys.argv[2], "--b6" in sys.argv[3:])

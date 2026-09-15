#!/usr/bin/env python3
"""Cache local dos aceites do W1 — instrumento de HOST.

Escreve um `setlists.json` + `content.json` que apontam os `file_url` para o
`arquivos.py` (via `adb reverse`), num cenário por vez. Por que fixture, e o
motivo medido de cada uma — a regra que separa fixture de encenação:

  * as 3 setlists da conta de audit têm `performance_date: null` (N1-PRECHECK
    A3), então **o plano de 7 dias real é n=0**: sem data não há o que medir
    da fila;
  * os `file_url` reais apontam para o bucket, e cada download deles é
    orçamento de bucket — o aceite inteiro roda com ZERO bucket porque as URLs
    apontam para `localhost`;
  * não há como pedir ao Supabase meio corpo, ou um corpo que para no meio.

Uso:  python3 cache-w1.py <cenario> <porta> <saida-dir>
Cenários: fila · falhas · morto · curto · lento · manual
"""
from __future__ import annotations

import datetime
import json
import os
import sys

CENARIOS: dict[str, list[str]] = {
    # W1-A7 + div. 122: o primeiro é lento; os quatro seguintes, instantâneos.
    "fila": ["lento", "ok", "ok", "ok", "ok"],
    # W1-A4: três falham, duas passam — e TÊM de sair três linhas.
    "falhas": ["404", "404", "404", "ok", "ok"],
    # W1-A2 e W1-A1: a conexão que fica de pé e cala.
    "morto": ["morto"],
    # W1-A3: declara N, entrega N/2.
    "curto": ["curto"],
    # W1-A3 (controle negativo): devagar, mas sem parar.
    "lento": ["lento"],
    # W1-A5: o botão "Baixar esta setlist" — setlist SEM data.
    "manual": ["ok"],
}


def main() -> None:
    cenario = sys.argv[1]
    porta = int(sys.argv[2])
    saida = sys.argv[3]
    modos = CENARIOS[cenario]
    amanha = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
    datada = cenario != "manual"

    contents = []
    songs = []
    for i, modo in enumerate(modos, start=1):
        nome = f"w1-{cenario}-{i}.pdf"
        contents.append(
            {
                "id": f"w1c{i}",
                "title": f"W1 {cenario} {i}",
                "artist": None,
                "album": None,
                "content_type": "Sheet",
                "content_data": None,
                "file_url": f"http://localhost:{porta}/{modo}/{nome}",
                "updated_at": "2026-09-14T00:00:00.000+00:00",
            }
        )
        songs.append(
            {
                "id": f"w1s{i}",
                "setlist_id": "w1sl",
                "content_id": f"w1c{i}",
                "position": i,
                "notes": None,
                "content": None,
            }
        )

    setlists = [
        {
            "id": "w1sl",
            "name": f"W1 {cenario}",
            "performance_date": amanha if datada else None,
            "venue": None,
            "updated_at": "2026-09-14T00:00:00.000+00:00",
            "setlist_songs": songs,
        }
    ]

    os.makedirs(saida, exist_ok=True)
    with open(os.path.join(saida, "setlists.json"), "w") as f:
        json.dump({"setlists": setlists, "syncedAtMs": 1789400000000}, f)
    with open(os.path.join(saida, "content.json"), "w") as f:
        json.dump(contents, f)
    print(f"cenario={cenario} setlist={'datada ' + amanha if datada else 'SEM data'} n={len(modos)}")
    for c in contents:
        print("  ", c["file_url"])


if __name__ == "__main__":
    main()

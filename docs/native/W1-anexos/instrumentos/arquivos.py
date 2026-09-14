#!/usr/bin/env python3
"""Servidor de ARQUIVOS do aceite do W1 — instrumento de HOST.

Por que de host, e não uma fixture dentro de `apps/native/src/`: é o mesmo
argumento do `s401.py` da V1-PR7 — servidor de aceite não entra no bundle do
app. E por que ele existe: **não há como pedir ao Supabase que entregue metade
do corpo, ou que pare no meio**. Os quatro modos abaixo são exatamente os
quatro casos que a PR consertou, e cada um é um aceite.

O PDF é SINTÉTICO (gerado aqui), e não um objeto do bucket: assim o aceite
custa ZERO download de bucket e nenhum dado real sai do aparelho.

    /ok/<nome>.pdf      corpo completo, Content-Length certo      → W1-A1 (+)
    /curto/<nome>.pdf   declara N, entrega N/2 e fecha            → W1-A3
    /lento/<nome>.pdf   entrega N em pedaços, com pausa           → W1-A3 (CN), W1-A7
    /morto/<nome>.pdf   manda o cabeçalho, alguns bytes, e CALA   → W1-A2, W1-A1
    /404/<nome>.pdf     404                                       → W1-A4

Uso:  python3 arquivos.py <porta> [pausa_s] [pedacos]
      adb -s <device> reverse tcp:<porta> tcp:<porta>
"""
from __future__ import annotations

import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

#: Tamanho do PDF sintético — a ordem de grandeza do 12p da conta de audit.
TAMANHO = 242_176


def pdf(tamanho: int = TAMANHO) -> bytes:
    """Um PDF bem formado: `%PDF-` na cabeça, `startxref <offset>` e `%%EOF`."""
    cabeca = b"%PDF-1.7\n"
    fim = b"\nendobj\n\nstartxref\n%d\n%%%%EOF\n"
    recheio = tamanho - len(cabeca) - len(fim % tamanho)
    corpo = cabeca + b"x" * recheio
    return corpo + (fim % len(corpo))


PAUSA_S = 3.0
PEDACOS = 8


class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self) -> None:  # noqa: N802
        partes = self.path.strip("/").split("/")
        modo = partes[0] if partes else "ok"
        corpo = pdf()
        print(f"  → {self.command} {self.path}", flush=True)

        if modo == "404":
            self.send_response(404)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return

        if modo == "curto":
            # Declara o tamanho inteiro e entrega METADE. É o caso que só o
            # `Content-Length` pega: o arquivo tem bytes, e tem forma de nada.
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo[: len(corpo) // 2])
            self.wfile.flush()
            self.close_connection = True
            return

        if modo == "morto":
            # Cabeçalho, um naco, e silêncio: a CONEXÃO MORTA. O soquete fica
            # de pé; sem teto de inatividade, o app espera para sempre.
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            self.wfile.write(corpo[:8192])
            self.wfile.flush()
            time.sleep(600)
            return

        if modo == "lento":
            # Devagar MAS SEM PARAR — o caso medido no V1 (1,8 KB/s). O teto
            # de inatividade NÃO pode disparar aqui: é o controle negativo.
            self.send_response(200)
            self.send_header("Content-Type", "application/pdf")
            self.send_header("Content-Length", str(len(corpo)))
            self.end_headers()
            passo = len(corpo) // PEDACOS + 1
            for i in range(0, len(corpo), passo):
                self.wfile.write(corpo[i : i + passo])
                self.wfile.flush()
                time.sleep(PAUSA_S)
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def log_message(self, *_args) -> None:
        return


def main() -> None:
    global PAUSA_S, PEDACOS
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
    if len(sys.argv) > 2:
        PAUSA_S = float(sys.argv[2])
    if len(sys.argv) > 3:
        PEDACOS = int(sys.argv[3])
    print(
        f"arquivos: :{porta} · pdf={len(pdf())} B · lento={PEDACOS} pedaços a cada {PAUSA_S}s",
        flush=True,
    )
    ThreadingHTTPServer(("127.0.0.1", porta), H).serve_forever()


if __name__ == "__main__":
    main()

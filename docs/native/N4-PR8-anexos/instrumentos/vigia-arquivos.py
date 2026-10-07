#!/usr/bin/env python3
"""N4-PR8 — o VIGIA do servidor de arquivos para a prova da receita do cache (N4-D102): escuta na porta dada (o
`adb reverse tcp:8790` leva o aparelho até ele), responde 404 a tudo e escreve UMA linha por requisição no log
(`GET <caminho>`). Zero linhas = o app não pediu arquivo nenhum.

  python3 vigia-arquivos.py <porta> <log>
"""
import http.server, sys

porta, log = int(sys.argv[1]), sys.argv[2]
open(log, "w").close()

class Vigia(http.server.BaseHTTPRequestHandler):
    def _registrar(self):
        with open(log, "a") as f:
            f.write(f"{self.command} {self.path}\n")
        self.send_response(404)
        self.end_headers()
    do_GET = do_HEAD = _registrar
    def log_message(self, *a):
        pass

http.server.ThreadingHTTPServer(("127.0.0.1", porta), Vigia).serve_forever()

#!/usr/bin/env python3
"""Servidor de host que devolve 401 a TODA request — instrumento do A2 na V1-PR7.

Por que não o `aceite.py`: ele não tem modo 401, e acrescentar um modo seria
mexer em `apps/native/src/**` (código do app, que dispara o gate `native`)
dentro de uma PR de aceite. Isto é script de host, vive no scratch e entra como
anexo.

O corpo é o da cadeia A do CONTRATO-DE-ERRO.md — o mesmo para "sem token",
"token inválido" e "IP em deny-fast".
"""
import json, sys
from http.server import BaseHTTPRequestHandler, HTTPServer

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        auth = self.headers.get("Authorization") or ""
        print(f"REQ {self.path} auth={'sim' if auth else 'NAO'} token={auth[7:40]}", flush=True)
        raw = json.dumps({"error": "Unauthorized", "code": "UNAUTHORIZED"}).encode()
        self.send_response(401)
        self.send_header("content-type", "application/json")
        self.send_header("cache-control", "private, no-store")
        self.send_header("content-length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)
    def log_message(self, *a): return

porta = int(sys.argv[1])
print(f"s401: servidor em :{porta} — 401 em toda request", flush=True)
HTTPServer(("127.0.0.1", porta), H).serve_forever()

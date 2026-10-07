#!/usr/bin/env python3
"""N4-PR8 — o servidor de arquivos da fixture (o `python3 -m http.server 8790` de sempre) com UM arquivo LENTO: o
`partitura-grande.pdf` sai a ~100 KiB/s (24 MiB ≈ 4 min), para o *baixando o arquivo…* de V ficar na tela tempo de um
dump (o transitório que a N4-PR7 não capturou, div. 1095). Os outros arquivos e o 404 do `nao-existe.pdf`, iguais.

  python3 arquivos-lentos.py <porta> <diretório>
"""
import functools, http.server, sys, time

LENTO = "/partitura-grande.pdf"

class Handler(http.server.SimpleHTTPRequestHandler):
    def copyfile(self, source, outputfile):
        if self.path != LENTO:
            return super().copyfile(source, outputfile)
        while True:
            b = source.read(16 * 1024)
            if not b:
                break
            outputfile.write(b)
            time.sleep(0.16)

porta, d = int(sys.argv[1]), sys.argv[2]
http.server.ThreadingHTTPServer(("127.0.0.1", porta), functools.partial(Handler, directory=d)).serve_forever()

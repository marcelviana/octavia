#!/usr/bin/env python3
"""N3 pre-check — driver do aparelho por `resource-id` / texto (adb + uiautomator).

Só toca o que acha no dump de AGORA; se não acha, levanta (nunca toca às cegas,
como o `toque.sh` da N2-PR7). Uso como módulo (`roteiro.py`) ou CLI:

  n3.py <serial> ids                 — lista resource-ids e textos do dump atual
  n3.py <serial> tap <id> [n]        — toca o n-ésimo nó com esse resource-id
  n3.py <serial> tapt <texto>        — toca o 1º nó cujo text/content-desc contém o texto
  n3.py <serial> key <KEYCODE>
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import time

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")


def sh(serial: str, *args: str, check: bool = True) -> str:
    r = subprocess.run([ADB, "-s", serial, *args], capture_output=True, text=True)
    if check and r.returncode != 0:
        raise RuntimeError(f"adb {' '.join(args)}: {r.stderr.strip()}")
    return r.stdout


def dump(serial: str) -> list[dict]:
    sh(serial, "shell", "uiautomator", "dump", "/sdcard/n3drv.xml", check=False)
    x = sh(serial, "exec-out", "cat", "/sdcard/n3drv.xml")
    nos = []
    for m in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        b = [int(v) for v in re.findall(r"-?\d+", a.get("bounds", "[0,0][0,0]"))]
        a["b"] = b
        a["id"] = a.get("resource-id", "").split("/")[-1]
        nos.append(a)
    return nos


def achar(nos: list[dict], rid: str | None = None, texto: str | None = None, n: int = 1) -> dict | None:
    if texto is not None:
        # texto: o nó cujo `text` é EXATAMENTE o pedido vem antes (o cartão
        # inteiro carrega o título no content-desc e o centro dele pode ser outro botão)
        exatos = [a for a in nos if a.get("text") == texto]
        if len(exatos) >= n:
            return exatos[n - 1]
    ms = [a for a in nos
          if (rid is not None and a["id"] == rid)
          or (texto is not None and (texto in a.get("text", "") or texto in a.get("content-desc", "")))]
    return ms[n - 1] if len(ms) >= n else None


def tap(serial: str, rid: str | None = None, texto: str | None = None, n: int = 1, espera: float = 1.2) -> None:
    no = achar(dump(serial), rid, texto, n)
    if no is None:
        raise RuntimeError(f"TOQUE FALHOU: sem {rid or texto!r} (n={n})")
    b = no["b"]
    x, y = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
    sh(serial, "shell", "input", "tap", str(x), str(y))
    print(f"{time.strftime('%H:%M:%S')} toque {rid or texto!r} @ {x},{y} ({serial})", flush=True)
    time.sleep(espera)


def key(serial: str, k: str, espera: float = 1.0) -> None:
    sh(serial, "shell", "input", "keyevent", k)
    time.sleep(espera)


def teclado(serial: str) -> bool:
    return "mInputShown=true" in sh(serial, "shell", "dumpsys", "input_method")


def esconder_teclado(serial: str) -> None:
    if teclado(serial):
        key(serial, "KEYCODE_BACK", 0.8)


if __name__ == "__main__":
    s, cmd = sys.argv[1], sys.argv[2]
    if cmd == "ids":
        for a in dump(s):
            if a["id"] or a.get("text") or a.get("content-desc"):
                print(a["id"] or "-", a["bounds"], a.get("enabled"), (a.get("text") or a.get("content-desc", ""))[:60])
    elif cmd == "tap":
        tap(s, rid=sys.argv[3], n=int(sys.argv[4]) if len(sys.argv) > 4 else 1)
    elif cmd == "tapt":
        tap(s, texto=sys.argv[3])
    elif cmd == "key":
        key(s, sys.argv[3])

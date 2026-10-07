#!/usr/bin/env python3
"""N4 encerramento, A-N4-28 — a prova do bloco no DADO REAL do Tab, com o release, sem Metro e sem `adb reverse`.

  prova-dado-real.py <serial>

S1 → `buscar` abre a L → a régua (só os dígitos) e as linhas da L → a 1ª linha abre V → o ▶ abre o palco avulso → BACK
volta a V → BACK à L → BACK a S1 → a 1ª setlist (S2) → a 1ª música abre o palco com setlist → BACK até S1.

Nada de texto de música sai daqui (regra "anexo não carrega texto de música"): de cada tela, só os `resource-id`; da
régua, só os dígitos; do corpo, o comprimento e o `sha256[:12]`; das músicas, o `id[:8]` do `resource-id`. O dump não
se guarda. As linhas `OCTAVIA:` que cada passo produziu saem com o nome de arquivo trocado por `<arquivo>` e o uid
abreviado.
"""
import hashlib
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
S = sys.argv[1]


def sh(*a):
    return subprocess.run([ADB, "-s", S, *a], capture_output=True, text=True).stdout


def dump():
    sh("shell", "uiautomator", "dump", "/sdcard/pdr.xml")
    x = sh("exec-out", "cat", "/sdcard/pdr.xml")
    try:
        return ET.fromstring(x[x.index("<?xml"):])
    except (ValueError, ET.ParseError):
        return None


def nos(r):
    return [] if r is None else [n for n in r.iter("node") if n.get("resource-id")]


def ids(r):
    return sorted({n.get("resource-id") for n in nos(r)} - {"android:id/content", "android:id/navigationBarBackground",
                                                             "android:id/statusBarBackground",
                                                             "rocks.octavia.app:id/action_bar_root"})


def no(r, rid):
    return next((n for n in nos(r) if n.get("resource-id") == rid), None)


def esperar(pred, prazo=30):
    t0 = time.time()
    while time.time() - t0 < prazo:
        r = dump()
        if r is not None and pred(r):
            return r
        time.sleep(1)
    raise SystemExit(f"ESPERA ESGOTADA ({prazo} s)")


def tocar(n):
    a = [float(v) for v in re.findall(r"\d+", n.get("bounds"))]
    sh("shell", "input", "tap", str(int((a[0] + a[2]) / 2)), str(int((a[1] + a[3]) / 2)))


def linhas_octavia():
    return [ln for ln in sh("logcat", "-d", "-s", "ReactNativeJS:V").splitlines() if "OCTAVIA:" in ln]


N0 = [len(linhas_octavia())]


def log_novo(rot):
    ls = linhas_octavia()
    for ln in ls[N0[0]:]:
        ln = re.sub(r"name=\S+", "name=<arquivo>", ln[ln.index("OCTAVIA:"):])
        ln = re.sub(r"(download-error) \S+:", r"\1 <arquivo>:", ln)
        ln = re.sub(r"uid=(....)[^ ]*", "uid=\\1…", ln)
        print(f"    {rot} · {ln}")
    N0[0] = len(ls)


def corpo(r):
    n = no(r, "corpo")
    if n is None:
        return "corpo=- "
    t = n.get("text") or ""
    return f"corpo len={len(t)} sha12={hashlib.sha256(t.encode()).hexdigest()[:12]}"


def ime():
    return "mInputShown=true" in sh("shell", "dumpsys", "input_method")


r = esperar(lambda r: no(r, "criar-setlist") is not None)  # S1: o S2 também tem um `buscar` (abre a S4)
print("S1:", " ".join(ids(r)))
tocar(no(r, "buscar"))
r = esperar(lambda r: no(r, "lib-tela") is not None)
rg = no(r, "lib-regua")  # o texto da régua mora nos filhos do nó
regua = [] if rg is None else [d for n in rg.iter("node") for d in re.sub(r"\D+", " ", n.get("text") or "").split()]
linhas = [n.get("resource-id") for n in nos(r) if n.get("resource-id", "").startswith("lib-linha-")]
print(f"L: lib-tela · régua (só os dígitos) = {regua} · linhas lib-linha-* na tela = {len(linhas)} · "
      f"teclado de pé = {ime()}")
print("   ids:", " ".join(i for i in ids(r) if not re.match(r"lib-(linha|favoritar|tocar)-", i)))
log_novo("L")
alvo = linhas[0]
id8 = alvo.removeprefix("lib-linha-")[:8]
tocar(no(r, alvo))
r = esperar(lambda r: no(r, "view-tela") is not None)
print(f"V: a 1ª linha da L ({id8}) · ids:", " ".join(i for i in ids(r) if not i.startswith("view-campo-")),
      "·", corpo(r))
log_novo("V")
tocar(no(r, "view-tocar"))
r = esperar(lambda r: no(r, "view-tela") is None and (no(r, "corpo") is not None or no(r, "s3d") is not None
                                                       or no(r, "placeholder") is not None or no(r, "s3-formato") is not None))
print("palco avulso: ids:", " ".join(ids(r)), "·", corpo(r))
log_novo("palco avulso")
for esperado in ("view-tela", "lib-tela", "criar-setlist"):
    sh("shell", "input", "keyevent", "KEYCODE_BACK")
    r = esperar(lambda r, e=esperado: no(r, e) is not None)
    print(f"BACK → {esperado} ✓")
log_novo("voltar")
setl = sorted(i for i in ids(r) if i.startswith("setlist-"))[0]
tocar(no(r, setl))
r = esperar(lambda r: any(i.startswith("song-") for i in ids(r)))
songs = [i for i in ids(r) if i.startswith("song-")]
print(f"S2 ({setl.removeprefix('setlist-')}): músicas song-* na tela = {len(songs)}")
tocar(no(r, sorted(songs)[0]))
r = esperar(lambda r: no(r, "indice") is not None)
print("palco com setlist: ids:", " ".join(ids(r)), "·", corpo(r))
log_novo("palco com setlist")
for _ in range(3):
    sh("shell", "input", "keyevent", "KEYCODE_BACK")
    time.sleep(1.5)
    if no(dump(), "criar-setlist") is not None:
        break
print("de volta a S1:", no(dump(), "criar-setlist") is not None)
log_novo("fim")
sh("shell", "rm", "-f", "/sdcard/pdr.xml")

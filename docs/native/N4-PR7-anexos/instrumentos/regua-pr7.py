#!/usr/bin/env python3
"""N4-PR7 — a régua por deep link, com a ALTURA: regua-pr7.py <serial> <lista.tsv>  (token<TAB>texto por linha)

Cópia do `N3-PR1-anexos/instrumentos/regua.py` com duas mudanças, declaradas:
 1. NÃO limpa o logcat a cada linha (a regra do `APARATO.md`, "logcat": o `FATAL` do aceite cobre a rodada inteira) —
    conta as linhas `OCTAVIA: regua` antes do link e lê só a que veio depois;
 2. depois da linha, um `uiautomator dump` e o `bounds` do nó `regua-texto` em dp (fator 2,25 no tablet, 2,625 no
    celular): a régua só loga a LARGURA, e a altura da caixa de texto é o que a m6 (a régua de L) e a e3 (o título da
    linha) pedem. Nenhuma linha de log nova.
Saída: a linha verbatim, e `  caixa=<w>x<h> dp`."""
import os, re, subprocess, sys, time, urllib.parse
ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
s, lista = sys.argv[1], sys.argv[2]
F = 2.625 if s == "emulator-5556" else 2.25
def adb(*a): return subprocess.run([ADB, "-s", s, *a], capture_output=True, text=True).stdout
def reguas(): return [l.split("OCTAVIA: ", 1)[1] for l in adb("logcat", "-d", "-s", "ReactNativeJS:I").splitlines() if "OCTAVIA: regua " in l]
def caixa():
    adb("shell", "uiautomator", "dump", "/sdcard/r.xml"); x = adb("shell", "cat", "/sdcard/r.xml")
    m = re.search(r'resource-id="regua-texto"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', x)
    if not m: return "sem nó"
    x0, y0, x1, y1 = map(int, m.groups()); return f"{(x1 - x0) / F:.1f}x{(y1 - y0) / F:.1f} dp"
for linha in open(lista, encoding="utf-8"):
    linha = linha.rstrip("\n")
    if not linha or linha.startswith("#"): continue
    tok, txt = linha.split("\t", 1)
    url = "exp+octavia://regua?t=" + urllib.parse.quote(txt, safe="") + "&s=" + tok
    antes = len(reguas())
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{url}'", "rocks.octavia.app")
    achou = None
    for _ in range(30):
        time.sleep(0.5)
        novas = [l for l in reguas()[antes:] if f" s={tok} " in l]
        if novas: achou = novas[-1]; break
    print(achou or f"SEM LINHA: s={tok} t={txt}", flush=True)
    if achou: print(f"  caixa={caixa()}", flush=True)
adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "'exp+octavia://regua'", "rocks.octavia.app")

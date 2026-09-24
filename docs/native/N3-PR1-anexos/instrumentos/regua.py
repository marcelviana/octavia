#!/usr/bin/env python3
"""N3-PR1 — a régua por deep link: regua.py <serial> <lista.tsv>  (token<TAB>texto por linha)
Para cada linha: limpa o logcat, manda `exp+octavia://regua?t=…&s=…`, espera a linha
`OCTAVIA: regua …` e a imprime verbatim. No fim fecha a régua (link sem `t`)."""
import subprocess, sys, time, urllib.parse, os
ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
s, lista = sys.argv[1], sys.argv[2]
def adb(*a): return subprocess.run([ADB, "-s", s, *a], capture_output=True, text=True).stdout
for linha in open(lista, encoding="utf-8"):
    linha = linha.rstrip("\n")
    if not linha or linha.startswith("#"): continue
    tok, txt = linha.split("\t", 1)
    url = "exp+octavia://regua?t=" + urllib.parse.quote(txt, safe="") + "&s=" + tok
    adb("logcat", "-c")
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{url}'", "rocks.octavia.app")
    achou = None
    for _ in range(20):
        time.sleep(0.5)
        for l in adb("logcat", "-d", "-s", "ReactNativeJS:I").splitlines():
            if "OCTAVIA: regua " in l and f's={tok} ' in l: achou = l.split("OCTAVIA: ", 1)[1]
        if achou: break
    print(achou or f"SEM LINHA: s={tok} t={txt}", flush=True)
adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "'exp+octavia://regua'", "rocks.octavia.app")

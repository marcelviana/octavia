#!/usr/bin/env python3
"""QL-PR1 (QL-D34, A-QL-6) — a largura de um caractere da mono em cada zoom, pela régua de desenvolvimento.

    regua-zoom.py <serial> <dir-saida>

Para cada token `leitor-18 … leitor-40` (e o `leitor` da N4-PR8, o 22, de controle) e para dois textos — 100 e 10
caracteres (`0123456789` × 10 e × 1, o texto da medida da N4-PR8) —: manda `exp+octavia://regua?t=…&s=…`, espera a
linha `OCTAVIA: regua …` NOVA (o logcat NÃO se limpa entre as medidas: a contagem de quedas cobre a rodada inteira,
regra 36; lê-se só o que veio depois da contagem anterior) e tira o `uiautomator dump` — o nó `regua-texto` dá o
controle régua × dump (a mesma largura nos dois, como na N3-PR1). No fim fecha a régua.

Escreve `<dir-saida>/regua-zoom.txt` (as linhas verbatim e a largura do nó no dump) e os dumps
`regua-<token>-<n>.xml` (só os dígitos da régua: nenhum texto de música). Fator do AVD e do Tab: 2,25 (densidade 360).
"""
import os, re, subprocess, sys, time, urllib.parse

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
s, saida = sys.argv[1], sys.argv[2]
FATOR = 2.25
os.makedirs(saida, exist_ok=True)


def adb(*a: str) -> str:
    return subprocess.run([ADB, "-s", s, *a], capture_output=True, text=True).stdout


def linhas_regua() -> list[str]:
    return [l.split("OCTAVIA: ", 1)[1] for l in adb("logcat", "-d", "-s", "ReactNativeJS:I").splitlines() if "OCTAVIA: regua " in l]


out = [f"# regua-zoom.py {s} — {time.strftime('%Y-%m-%d %H:%M:%S')} · fator {FATOR}"]
tokens = ["leitor-18", "leitor-22", "leitor-26", "leitor-32", "leitor-40", "leitor"]
for tok in tokens:
    for n in (100, 10):
        txt = "0123456789" * (n // 10)
        antes = len(linhas_regua())
        url = "exp+octavia://regua?t=" + urllib.parse.quote(txt, safe="") + "&s=" + tok
        adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{url}'", "rocks.octavia.app")
        nova = None
        for _ in range(30):
            time.sleep(0.5)
            ls = linhas_regua()
            novas = [l for l in ls[antes:] if f" s={tok} " in l and f't="{txt}"' in l]
            if novas:
                nova = novas[-1]
                break
        time.sleep(0.8)
        adb("shell", "uiautomator", "dump", "/sdcard/regua.xml")
        xml = adb("exec-out", "cat", "/sdcard/regua.xml")
        f = os.path.join(saida, f"regua-{tok}-{n}.xml")
        open(f, "w", encoding="utf-8").write(xml)
        m = re.search(r'resource-id="[^"]*regua-texto"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml)
        dump = f"{(int(m.group(3)) - int(m.group(1))) / FATOR:.1f}" if m else "-"
        out.append(f"{nova or f'SEM LINHA: s={tok} n={n}'}   · dump regua-texto {dump} dp")
        print(out[-1], flush=True)
adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "'exp+octavia://regua'", "rocks.octavia.app")
adb("shell", "rm", "-f", "/sdcard/regua.xml")
open(os.path.join(saida, "regua-zoom.txt"), "w", encoding="utf-8").write("\n".join(out) + "\n")

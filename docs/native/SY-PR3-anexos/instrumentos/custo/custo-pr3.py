#!/usr/bin/env python3
"""SY-PR3 — O CUSTO DO SYNC COM O PALCO ABERTO, ANTES E DEPOIS DA FOTO (SY-D36, SY-D38; A-SY-9). Instrumento de anexo
(fora de CI, lint e typecheck, N4-D117). Os instrumentos e as fixtures são os da SY-PR1 (`SY-PR1-anexos/instrumentos/`:
o `sensor-quadros.mjs` pelo inspetor do Metro, o `uiautomator events`, as fixtures A/B do `fixture-sy.py`); o que muda é
O CAMINHO de provocar o sync, e é declarado (div. da PR-3):

  na SY-PR1 o sync era o da ABERTURA, segurado 45 s por resposta no mock `atraso` enquanto o palco abria; desde a SY-PR2
  as leituras do sync têm o prazo de 20 s (SY-D19, SY-D32) e esse sync FALHA antes de aplicar — não há o que medir. Aqui:
  o mock no modo `normal` servindo a versão que o cache JÁ tem (a abertura sincroniza sem mudança e termina); o palco
  aberto (S1 → a setlist → a posição 3, a "Letra longa" → zoom 26), a rolagem LIGADA; o PISO (20 s de rolagem sem
  sync); então o mock passa a servir a OUTRA versão e o sync se dispara pela MESMA função que o *Tentar novamente* chama
  (`SY-PR2-anexos/instrumentos/avd/pedir-pelo-botao.mjs`, a prop `onTentarNovamente` lida na árvore do React) — o que um
  gatilho da PR-4 fará pelo `rodarSync`. As janelas: o PISO `[t_rol + 3 s, t_rol + 23 s]`; o SYNC `[t_ok − 5 s, t_ok + 15 s]`,
  a da SY-PR1. O controle (a), a tarefa de 200 ms, em `t_rol + 24 s` (fora das duas janelas: o disparo é em `t_rol + 31 s`),
nas primeiras rodadas.

Uso (da raiz da árvore da PR; o Metro servindo o bundle a medir, os túneis 8081/8788/8790, o servidor de arquivos de pé):
  python3 custo-pr3.py <serial> <dir-saida> <dir-fixture-sy> <n-rodadas> [versão-do-cache=a] [controles=3]
  SEM_EVENTOS=1 …   as rodadas de controle SEM o `uiautomator events`
"""
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
RAIZ = os.getcwd()
ACEITE = os.path.join(RAIZ, "apps/native/src/fixtures/aceite.py")
SENSOR = os.path.join(RAIZ, "docs/native/SY-PR1-anexos/instrumentos/sensor-quadros.mjs")
PEDIR = os.path.join(RAIZ, "docs/native/SY-PR2-anexos/instrumentos/avd/pedir-pelo-botao.mjs")
PKG = "rocks.octavia.app"
LINK = "exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
PORTA = os.environ.get("PORTA", "8788")

serial, saida, fx, n = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
versao = sys.argv[5] if len(sys.argv) > 5 else "a"
controles = int(sys.argv[6]) if len(sys.argv) > 6 else 3
os.makedirs(saida, exist_ok=True)


def adb(*args: str) -> str:
    return subprocess.run([ADB, "-s", serial, *args], capture_output=True, text=True).stdout


def agora_ms() -> int:
    return int(adb("shell", "date +%s%3N").strip())


def uptime_e_epoca() -> tuple[float, int]:
    out = adb("shell", "echo $(date +%s%3N) $(cat /proc/uptime)").split()
    return float(out[1]) * 1000.0, int(out[0])


def node(script: str, *args: str) -> str:
    return subprocess.run(["node", script, *args], capture_output=True, text=True, cwd=RAIZ).stdout.strip()


def dump() -> ET.Element:
    adb("shell", "rm -f /sdcard/sy-custo.xml; uiautomator dump /sdcard/sy-custo.xml")
    try:
        return ET.fromstring(adb("exec-out", "cat /sdcard/sy-custo.xml"))
    except ET.ParseError:
        return ET.fromstring("<hierarchy/>")


def tocar(rid: str, tentativas: int = 40) -> None:
    for _ in range(tentativas):
        for no in dump().iter("node"):
            if no.get("resource-id") == rid:
                x0, y0, x1, y1 = map(int, re.findall(r"\d+", no.get("bounds", "")))
                adb("shell", "input", "tap", str((x0 + x1) // 2), str((y0 + y1) // 2))
                return
        time.sleep(0.5)
    raise SystemExit(f"PARA: '{rid}' não apareceu")


def linhas_desde(t0: int) -> list[tuple[int, str]]:
    out = []
    for l in adb("logcat", "-d", "-v", "epoch", "-s", "ReactNativeJS").splitlines():
        m = re.match(r"\s*(\d+)\.(\d{3})\s.*?OCTAVIA: (.*)$", l)
        if m:
            t = int(m.group(1)) * 1000 + int(m.group(2))
            if t >= t0:
                out.append((t, m.group(3)))
    return out


def esperar(t0: int, prefixo: str, limite_s: float) -> int:
    fim = time.time() + limite_s
    while time.time() < fim:
        for t, l in linhas_desde(t0):
            if l.startswith(prefixo):
                return t
        time.sleep(0.4)
    raise SystemExit(f"PARA: '{prefixo}' não saiu em {limite_s} s")


def mock(v: str) -> None:
    subprocess.run(["pkill", "-f", f"aceite.py servidor {PORTA}"], capture_output=True)
    time.sleep(0.8)
    log = open(os.path.join(saida, "mock.log"), "a")
    subprocess.Popen([sys.executable, ACEITE, "servidor", PORTA, "normal",
                      os.path.join(fx, v, "setlists.json"), os.path.join(fx, v, "content.json")], stdout=log, stderr=log)
    time.sleep(1.2)


sl8 = __import__("json").load(open(os.path.join(fx, "a", "setlists.json")))[0]["id"][:8]
INICIO = int(os.environ.get("INICIO", "1"))  # retomar uma corrida parada: a numeração das rodadas continua
for k in range(INICIO, n + 1):
    rot = f"r{k:02d}"
    outra = "a" if versao == "b" else "b"
    print(f"== rodada {k}/{n}: o cache e o mock em {versao.upper()}; o sync traz {outra.upper()}", flush=True)
    mock(versao)
    adb("shell", "am", "force-stop", PKG)
    time.sleep(1)
    t_open = agora_ms()
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{LINK}'", PKG)
    try:
        esperar(t_open, "sync ok", 40)
    except SystemExit:
        # o link do dev client às vezes cai no lançador depois do force-stop (a N4-PR6, `roteiro.py`): UMA segunda abertura
        print("  sem sync ok em 40 s — o link de novo (o lançador, N4-PR6)", flush=True)
        adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{LINK}'", PKG)
        esperar(t_open, "sync ok", 60)
    tocar(f"setlist-{sl8}")
    tocar("song-3")
    tocar("zoom-mais")
    print("  " + node(SENSOR, "instalar"), flush=True)
    tocar("auto-scroll")
    t_rol = agora_ms()
    up, ep = uptime_e_epoca()
    ev = open(os.path.join(saida, f"{rot}-eventos.txt"), "w")
    ev.write(f"# uptime_ms={up:.0f} epoca_ms={ep}\n")
    ev.flush()
    eventos = None if os.environ.get("SEM_EVENTOS") == "1" else subprocess.Popen(
        [ADB, "-s", serial, "shell", "uiautomator", "events"], stdout=ev, stderr=subprocess.STDOUT)
    while agora_ms() < t_rol + 24000:
        time.sleep(0.2)
    if k <= controles:
        c = node(SENSOR, "travar", "200")
        open(os.path.join(saida, f"{rot}-controle.json"), "w").write(c)
        print(f"  controle (a): {c}", flush=True)
    # o disparo em t_rol + 31 s: a janela do sync começa em t_ok − 5 s ≈ t_rol + 26 s, DEPOIS do controle (a) de
    # t_rol + 24 s — na 1ª corrida o disparo era em + 26 s, e a janela do sync engolia o controle (div. da PR-3)
    while agora_ms() < t_rol + 29500:
        time.sleep(0.2)
    mock(outra)
    while agora_ms() < t_rol + 31000:
        time.sleep(0.2)
    t_pedido = agora_ms()
    print("  " + node(PEDIR, "pedir", "1", "0"), flush=True)
    t_ok = esperar(t_pedido, "sync ok", 30)
    while agora_ms() < t_ok + 16000:
        time.sleep(0.3)
    if eventos is not None:
        eventos.terminate()
        eventos.wait()
        adb("shell", "pkill", "-f", "uiautomator")
    ev.close()
    print("  " + node(SENSOR, "ler", os.path.join(saida, f"{rot}-sensor.json")), flush=True)
    with open(os.path.join(saida, f"{rot}-logcat.txt"), "w") as f:
        f.write(f"# t_open={t_open} t_rol={t_rol} t_pedido={t_pedido} t_ok={t_ok}\n")
        for t, l in linhas_desde(t_open):
            f.write(f"{t} {l}\n")
    print(f"  rolagem +{t_rol - t_open} ms · pedido +{t_pedido - t_open} · sync ok +{t_ok - t_open}", flush=True)
    versao = outra

subprocess.run(["pkill", "-f", f"aceite.py servidor {PORTA}"], capture_output=True)
adb("shell", "am", "force-stop", PKG)
print("fim", flush=True)

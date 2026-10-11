#!/usr/bin/env python3
"""SY-PR1, commit 5 — O "ANTES" DO CUSTO DO SYNC COM O PALCO ABERTO (SY-D6, SY-D20; `SY-PRECHECK.md` A3). Instrumento de
anexo (fora de CI, lint e typecheck, N4-D117). Dirige o AVD (o dev client, o Metro, o `aceite.py` no modo `atraso`) e
grava, por RODADA, o bruto: os instantes do sensor de quadros (`sensor-quadros.mjs`), o `uiautomator events` e o logcat
`-v epoch` das linhas `OCTAVIA:`. A análise é o `custo-analise.mjs`, sobre o que este grava.

Uma rodada = um sync da abertura, o caminho da A3:
  1. o mock no modo `atraso` (45 s antes de cada resposta) servindo a fixture que o cache NÃO tem (A ↔ B, `fixture-sy.py`:
     o corpo da música aberta muda — o pior caso — e as setlists ficam iguais);
  2. o app aberto frio (`force-stop` e o link do dev client): ele mostra o cache e começa o sync, que fica 45 s no
     `GET /api/setlists` e mais 45 s no `GET /api/content`;
  3. nesse meio: S1 → a setlist → a posição 3 (a Letra longa) → o palco; o zoom 26 (um toque); o sensor instalado;
  4. 3 s depois do 200 das setlists, a rolagem automática LIGADA, e o `uiautomator events` de pé;
  5. com `CONTROLE=1`, aos 32 s do 200 das setlists, o controle (a): uma tarefa de 200 ms no JS (`sensor … travar 200`);
  6. o 200 do content chega, o sync aplica (`sync ok`), e a rodada segue 16 s depois dele;
  7. o sensor lido, o `uiautomator events` parado, o logcat da rodada guardado.

Uso (da raiz, com o Metro, os túneis e o servidor de arquivos de pé, e o cache do app com a fixture A já sincronizada):
  python3 custo.py <serial> <dir-saida> <dir-fixture-sy> <n-rodadas> [primeira=b] [controle-nas-primeiras=3]
  SEM_EVENTOS=1 python3 custo.py …   as mesmas rodadas SEM o `uiautomator events` — o controle de que o segundo
                                     instrumento não muda o que o sensor mede (ele também usa a thread de UI)
"""
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
RAIZ = os.getcwd()
AQUI = os.path.dirname(os.path.abspath(__file__))
ACEITE = os.path.join(RAIZ, "apps/native/src/fixtures/aceite.py")
SENSOR = os.path.join(AQUI, "sensor-quadros.mjs")
PKG = "rocks.octavia.app"
LINK = "exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"

serial, saida, fx, n = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
primeira = sys.argv[5] if len(sys.argv) > 5 else "b"
controles = int(sys.argv[6]) if len(sys.argv) > 6 else 3
os.makedirs(saida, exist_ok=True)


def adb(*args: str, entrada=None) -> str:
    return subprocess.run([ADB, "-s", serial, *args], capture_output=True, text=True, stdin=entrada).stdout


def agora_ms() -> int:
    """O relógio do APARELHO, em ms de época (o mesmo do `logcat -v epoch` e do `Date.now()` do sensor)."""
    return int(adb("shell", "date +%s%3N").strip())


def uptime_e_epoca() -> tuple[float, int]:
    out = adb("shell", "echo $(date +%s%3N) $(cat /proc/uptime)").split()
    return float(out[1]) * 1000.0, int(out[0])


def sensor(*args: str) -> str:
    return subprocess.run(["node", SENSOR, *args], capture_output=True, text=True, cwd=RAIZ).stdout.strip()


def dump() -> ET.Element:
    """O dump da tela; durante a abertura fria o `uiautomator` pode não achar a tela ociosa e não gravar nada — aí, vazio."""
    adb("shell", "rm -f /sdcard/sy-custo.xml; uiautomator dump /sdcard/sy-custo.xml")
    try:
        return ET.fromstring(adb("exec-out", "cat /sdcard/sy-custo.xml"))
    except ET.ParseError:
        return ET.fromstring("<hierarchy/>")


def achar(rid: str, tentativas: int = 40) -> tuple[int, int]:
    for _ in range(tentativas):
        for no in dump().iter("node"):
            if no.get("resource-id") == rid:
                x0, y0, x1, y1 = map(int, re.findall(r"\d+", no.get("bounds", "")))
                return (x0 + x1) // 2, (y0 + y1) // 2
        time.sleep(0.5)
    raise SystemExit(f"PARA: '{rid}' não apareceu")


def tocar(rid: str) -> None:
    x, y = achar(rid)
    adb("shell", "input", "tap", str(x), str(y))


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
        time.sleep(0.5)
    raise SystemExit(f"PARA: '{prefixo}' não saiu em {limite_s} s")


def mock(versao: str) -> subprocess.Popen:
    subprocess.run(["pkill", "-f", "aceite.py servidor 8788"], capture_output=True)
    time.sleep(1)
    log = open(os.path.join(saida, "mock.log"), "a")
    p = subprocess.Popen([sys.executable, ACEITE, "servidor", "8788", "atraso",
                          os.path.join(fx, versao, "setlists.json"), os.path.join(fx, versao, "content.json")],
                         stdout=log, stderr=log)
    time.sleep(1.5)
    return p


sl8 = __import__("json").load(open(os.path.join(fx, "a", "setlists.json")))[0]["id"][:8]
versao = primeira
for k in range(1, n + 1):
    rot = f"r{k:02d}"
    print(f"== rodada {k}/{n}: o mock serve {versao.upper()} (o cache tem a outra)", flush=True)
    mock(versao)
    adb("shell", "am", "force-stop", PKG)
    time.sleep(1)
    t_open = agora_ms()
    adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{LINK}'", PKG)
    tocar(f"setlist-{sl8}")
    tocar("song-3")
    tocar("zoom-mais")
    print("  " + sensor("instalar"), flush=True)
    t_s = esperar(t_open, "api status=200 path=/api/setlists", 70)
    while agora_ms() < t_s + 3000:
        time.sleep(0.2)
    tocar("auto-scroll")
    up, ep = uptime_e_epoca()
    ev = open(os.path.join(saida, f"{rot}-eventos.txt"), "w")
    ev.write(f"# uptime_ms={up:.0f} epoca_ms={ep}\n")
    ev.flush()
    sem_eventos = os.environ.get("SEM_EVENTOS") == "1"
    eventos = None if sem_eventos else subprocess.Popen([ADB, "-s", serial, "shell", "uiautomator", "events"], stdout=ev, stderr=subprocess.STDOUT)
    if k <= controles:
        while agora_ms() < t_s + 32000:
            time.sleep(0.2)
        c = sensor('travar', '200')
        open(os.path.join(saida, f"{rot}-controle.json"), "w").write(c)
        print(f"  controle (a): {c}", flush=True)
    t_ok = esperar(t_s, "sync ok", 80)
    while agora_ms() < t_ok + 16000:
        time.sleep(0.3)
    if eventos is not None:
        eventos.terminate()
        eventos.wait()
        adb("shell", "pkill", "-f", "uiautomator")
    ev.close()
    print("  " + sensor("ler", os.path.join(saida, f"{rot}-sensor.json")), flush=True)
    with open(os.path.join(saida, f"{rot}-logcat.txt"), "w") as f:
        f.write(f"# t_open={t_open} t_setlists={t_s} t_ok={t_ok}\n")
        for t, l in linhas_desde(t_open):
            f.write(f"{t} {l}\n")
    print(f"  t_open={t_open} setlists +{t_s - t_open} ms · sync ok +{t_ok - t_open} ms", flush=True)
    versao = "a" if versao == "b" else "b"

subprocess.run(["pkill", "-f", "aceite.py servidor 8788"], capture_output=True)
adb("shell", "am", "force-stop", PKG)
print("fim", flush=True)

#!/usr/bin/env python3
"""SY-PR2 — O APARELHO (AVD `octavia_tab32`, dev client + mock): o S1a remedido (A-SY-5), a forma do prazo no logcat
(A-SY-22) e o voo único (A-SY-2 no aparelho). Instrumento de anexo (fora de CI, lint e typecheck, N4-D117).

Uso (da raiz; com o Metro, os túneis 8081/8788 e o mock no modo `atraso` de pé, o cache da conta TIRADO pela receita —
o app abre sem cache —, o bundle servido conferido e o rádio ligado):
  python3 rodadas.py <serial> <dir-saida>

  A. o S1a: o app aberto frio, sem cache, com o mock segurando cada resposta 45 s. O `s1a` ("sincronizando pela primeira
     vez") tem de estar na tela ANTES dos 20 s do prazo (o dump e a captura), e a falha DEPOIS: `sync fail … code=network`
     sem nenhuma linha `api` entre o `sync start` e ela (no aparelho o `fetch` só resolve com o corpo, div. 1270), e o
     `s1d` com o `tentar` na tela;
  B. o pedido seguinte roda e o voo: o `tentar` tocado → um `sync start` novo (o voo se liberou); 3 s depois, a MESMA
     função que o botão chama, duas vezes, 1 s entre elas (`pedir-pelo-botao.mjs`: o botão não existe durante o sync) →
     nunca dois `sync start` sem fim, e exatamente UM sync a mais, depois do fim do primeiro.
O logcat é lido por `-v epoch`; o relógio é o do aparelho. Nada aqui apaga nada.
"""
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
AQUI = os.path.dirname(os.path.abspath(__file__))
PKG = "rocks.octavia.app"
LINK = "exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
serial, saida = sys.argv[1], sys.argv[2]
os.makedirs(saida, exist_ok=True)
SO_B = os.environ.get("SO_B") == "1"   # refazer só a B, partindo de S1 em falha (o fim da A), noutro arquivo
rel = open(os.path.join(saida, "rodadas-B2.txt" if SO_B else "rodadas.txt"), "w")


def p(s: str) -> None:
    print(s, flush=True)
    rel.write(s + "\n")
    rel.flush()


def adb(*args: str) -> str:
    return subprocess.run([ADB, "-s", serial, *args], capture_output=True, text=True).stdout


def agora_ms() -> int:
    return int(adb("shell", "date +%s%3N").strip())


def dump(nome: str) -> ET.Element:
    adb("shell", "rm -f /sdcard/sy-pr2.xml; uiautomator dump /sdcard/sy-pr2.xml")
    xml = adb("exec-out", "cat /sdcard/sy-pr2.xml")
    try:
        raiz = ET.fromstring(xml)
    except ET.ParseError:
        return ET.fromstring("<hierarchy/>")
    open(os.path.join(saida, f"{nome}.xml"), "w").write(xml)
    return raiz


def ids(raiz: ET.Element) -> set[str]:
    return {n.get("resource-id", "") for n in raiz.iter("node")} - {""}


def captura(nome: str) -> None:
    with open(os.path.join(saida, f"{nome}.png"), "wb") as f:
        f.write(subprocess.run([ADB, "-s", serial, "exec-out", "screencap", "-p"], capture_output=True).stdout)


def linhas(t0: int) -> list[tuple[int, str]]:
    out = []
    for l in adb("logcat", "-d", "-v", "epoch", "-s", "ReactNativeJS").splitlines():
        m = re.match(r"\s*(\d+)\.(\d{3})\s.*?OCTAVIA: (.*)$", l)
        if m:
            t = int(m.group(1)) * 1000 + int(m.group(2))
            if t >= t0:
                out.append((t, m.group(3)))
    return out


def esperar(t0: int, prefixo: str, limite_s: float, depois: int = 0) -> int:
    fim = time.time() + limite_s
    while time.time() < fim:
        for t, l in linhas(t0):
            if l.startswith(prefixo) and t > depois:
                return t
        time.sleep(0.3)
    raise SystemExit(f"PARA: '{prefixo}' não saiu em {limite_s} s")


def tocar(rid: str) -> None:
    for _ in range(20):
        for n in dump("_toque").iter("node"):
            if n.get("resource-id") == rid:
                x0, y0, x1, y1 = map(int, re.findall(r"\d+", n.get("bounds", "")))
                adb("shell", "input", "tap", str((x0 + x1) // 2), str((y0 + y1) // 2))
                return
        time.sleep(0.5)
    raise SystemExit(f"PARA: '{rid}' não apareceu")


# ------------------------------------------------------------------------------------------------- A. o S1a
p(f"# rodadas.py — {time.strftime('%Y-%m-%d %H:%M:%S %z')} · {serial}")
t_open = agora_ms() - 1
t_fail = t_open
if not SO_B:
  p("## A. o S1a remedido: o app frio, sem cache, o mock `atraso` (45 s por resposta)")
  adb("shell", "am", "force-stop", PKG)
  time.sleep(1)
  t_open = agora_ms()
  adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{LINK}'", PKG)
  t_start = esperar(t_open, "sync start", 60)
  p(f"sync start em t_open + {t_start - t_open} ms")
  visto = None
  while agora_ms() < t_start + 20_000:
      t_a = agora_ms()
      r = dump("A-s1a")
      t_b = agora_ms()
      if "s1a" in ids(r):
          captura("A-s1a")
          t_c = agora_ms()
          visto = (t_a, t_b, t_c)
          break
  if visto is None:
      p("✗ o `s1a` NÃO foi visto antes dos 20 s")
  else:
      p(f"s1a na tela: o dump começou em sync start + {visto[0] - t_start} ms e terminou em + {visto[1] - t_start} ms; a captura terminou em + {visto[2] - t_start} ms  (o prazo: + 20000)")
  t_fail = esperar(t_open, "sync fail", 40, depois=t_start)
  ls = [(t, l) for t, l in linhas(t_open) if t_start <= t <= t_fail]
  p(f"sync fail em sync start + {t_fail - t_start} ms")
  for t, l in ls:
      p(f"  +{t - t_start:>6} ms  {l}")
  api = [l for _, l in ls if l.startswith("api ")]
  p(f"linhas `api` entre o sync start e o sync fail: {len(api)}  (A-SY-22: 0 no aparelho)")
  time.sleep(1.5)
  r = dump("A-s1d")
  captura("A-s1d")
  p(f"depois da falha: s1d na tela: {'s1d' in ids(r)} · tentar: {'tentar' in ids(r)}")

# ------------------------------------------------------------------------------------------------- B. o voo
p("")
p("## B. o pedido seguinte roda, e o voo único (dois pedidos durante o sync, pela função do botão)")
p("$ node pedir-pelo-botao.mjs achar")
p("  " + subprocess.run(["node", os.path.join(AQUI, "pedir-pelo-botao.mjs"), "achar"], capture_output=True, text=True).stdout.strip())
t_toque = agora_ms()
tocar("tentar")
t2 = esperar(t_open, "sync start", 20, depois=max(t_fail, t_toque))
p(f"o `tentar` tocado → sync start em toque + {t2 - t_toque} ms (o voo se liberou depois da falha por prazo)")
while agora_ms() < t2 + 3000:
    time.sleep(0.2)
p("$ node pedir-pelo-botao.mjs pedir 2 1000")
saida_pedir = subprocess.run(["node", os.path.join(AQUI, "pedir-pelo-botao.mjs"), "pedir", "2", "1000"], capture_output=True, text=True)
p("  " + (saida_pedir.stdout.strip() or saida_pedir.stderr.strip()[:400]))
t_fail2 = esperar(t_open, "sync fail", 40, depois=t2)
p("$ node pedir-pelo-botao.mjs ler")
p("  " + subprocess.run(["node", os.path.join(AQUI, "pedir-pelo-botao.mjs"), "ler"], capture_output=True, text=True).stdout.strip())
t3 = esperar(t_open, "sync start", 15, depois=t_fail2)
t_fail3 = esperar(t_open, "sync fail", 40, depois=t3)
p("o silêncio depois: 25 s sem outro sync")
time.sleep(25)
todas = linhas(t_toque - 1)
for t, l in todas:
    if l.startswith("sync") or l.startswith("api"):
        p(f"  +{t - t2:>6} ms  {l}")
n = 0
mx = 0
for _, l in todas:
    if l == "sync start":
        n += 1
        mx = max(mx, n)
    elif l.startswith("sync ok") or l.startswith("sync fail"):
        n -= 1
starts = [t for t, l in todas if l == "sync start"]
p(f"sync start desde o toque: {len(starts)} (esperado 2: o do toque e UM \"de novo\") · máximo em voo: {mx} (esperado 1)")
p(f"o \"de novo\" começou {t3 - t_fail2} ms depois do fim do primeiro (sync fail) · durações: {t_fail2 - t2} ms e {t_fail3 - t3} ms")
r = dump("B-fim")
p(f"no fim: s1d na tela: {'s1d' in ids(r)}")

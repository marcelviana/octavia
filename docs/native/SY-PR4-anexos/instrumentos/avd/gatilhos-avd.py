#!/usr/bin/env python3
"""SY-PR4 — OS GATILHOS NO AVD (`octavia_tab32`, dev client + mock). Instrumento de anexo (fora de CI, lint e typecheck,
N4-D117). Texto só do projeto (a fixture `fixture-pr4.py`, regra 10).

Uso (da raiz; o Metro da árvore servindo o bundle da PR, os túneis 8081 e 8788, o cache da conta TIRADO pela receita, o
bundle servido conferido, o `logcat -c` uma vez antes):
  python3 gatilhos-avd.py <dir-fixture> <dir-saida> <cenário>…

Cada cenário escreve `<dir-saida>/<cenário>.txt`: **o que se declara ANTES** (as linhas `sync trigger` esperadas, quantos
`sync start` e quantos `GET` — as linhas `api … path=/api/setlists|/api/content`), o que se fez, e **o que se mediu**
(as linhas `OCTAVIA:` do logcat desde o começo do cenário, contadas). O relógio é o do aparelho (`date +%s%3N`; o logcat
por `-v epoch`). O rádio: `airplane-mode` + `svc wifi/data` (APARATO.md, div. 418), provado pelo `ping`. O mock troca de
modo reiniciando o `aceite.py servidor` na 8788 (o túnel fica). Nada aqui escreve no servidor (nenhum `PUT`/`POST`):
o reordenar sai sem salvar.
"""
import os
import re
import signal
import socket
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
SERIAL = "emulator-5554"
PKG = "rocks.octavia.app"
MOCK = "apps/native/src/fixtures/aceite.py"
FX, SAIDA = sys.argv[1], sys.argv[2]
os.makedirs(SAIDA, exist_ok=True)
FATOR = 2.25  # px por dp no AVD (APARATO.md)
rel = None
mock_proc = None


def p(s: str = "") -> None:
    print(s, flush=True)
    if rel is not None:
        rel.write(s + "\n")
        rel.flush()


def adb(*args: str, timeout: float = 60) -> str:
    return subprocess.run([ADB, "-s", SERIAL, *args], capture_output=True, text=True, timeout=timeout).stdout


def agora() -> int:
    return int(adb("shell", "date +%s%3N").strip())


def linhas(t0: int) -> list:
    out = []
    for l in adb("logcat", "-d", "-v", "epoch", "-s", "ReactNativeJS").splitlines():
        m = re.match(r"\s*(\d+)\.(\d{3})\s.*?OCTAVIA: (.*)$", l)
        if m:
            t = int(m.group(1)) * 1000 + int(m.group(2))
            if t >= t0:
                out.append((t, m.group(3).strip()))
    return out


def esperar(t0: int, prefixo: str, limite: float, n: int = 1) -> bool:
    fim = time.time() + limite
    while time.time() < fim:
        if len([1 for _, l in linhas(t0) if l.startswith(prefixo)]) >= n:
            return True
        time.sleep(0.5)
    return False


def quieto(t0: int, limite: float = 40) -> None:
    """Nenhum sync em voo (todo `sync start` com o fim) e 3 s sem linha nova."""
    fim = time.time() + limite
    n = -1
    while time.time() < fim:
        ls = [l for _, l in linhas(t0)]
        voo = sum(1 for l in ls if l == "sync start") - sum(1 for l in ls if l.startswith(("sync ok", "sync fail")))
        if voo <= 0 and len(ls) == n:
            return
        n = len(ls)
        time.sleep(3)


def contar(t0: int) -> dict:
    ls = [l for _, l in linhas(t0)]
    return {
        "sync trigger": [l for l in ls if l.startswith("sync trigger")],
        "sync start": sum(1 for l in ls if l == "sync start"),
        "GET": sum(1 for l in ls if re.match(r"api status=\S+ path=/api/(setlists|content)( |$)", l)),
        "sync ok/fail/skip": [l for l in ls if l.startswith(("sync ok", "sync fail", "sync skip"))],
        "net": [l for l in ls if l.startswith("net ")],
    }


def declarar(**k) -> dict:
    p("DECLARADO ANTES:")
    for a, b in k.items():
        p(f"  {a}: {b}")
    return k


def medir(t0: int, dec: dict) -> bool:
    c = contar(t0)
    p("MEDIDO:")
    for l in linhas(t0):
        p(f"  {l[0]}  {l[1]}")
    p(f"  → sync trigger: {c['sync trigger']}")
    p(f"  → sync start: {c['sync start']} · GET: {c['GET']} · fim: {c['sync ok/fail/skip']}")
    ok = True
    if "linhas" in dec and c["sync trigger"] != dec["linhas"]:
        ok = False
        p(f"  ✗ as linhas sync trigger diferem do declarado")
    if "sync_start" in dec and c["sync start"] != dec["sync_start"]:
        ok = False
        p(f"  ✗ sync start {c['sync start']} ≠ {dec['sync_start']}")
    if "GET" in dec and c["GET"] != dec["GET"]:
        ok = False
        p(f"  ✗ GET {c['GET']} ≠ {dec['GET']}")
    p("VEREDITO: " + ("confere com o declarado ✓" if ok else "NÃO confere ✗"))
    return ok


def ping() -> str:
    return adb("shell", "ping -c 1 -W 2 8.8.8.8").strip().splitlines()[-1] if True else ""


def radio(ligado: bool) -> None:
    if ligado:
        adb("shell", "cmd connectivity airplane-mode disable")
        adb("shell", "svc wifi enable")
        adb("shell", "svc data enable")
        for _ in range(40):
            if " 0% packet loss" in adb("shell", "ping -c 1 -W 1 8.8.8.8"):
                break
            time.sleep(0.5)
    else:
        adb("shell", "svc wifi disable")
        adb("shell", "svc data disable")
        adb("shell", "cmd connectivity airplane-mode enable")
        for _ in range(20):
            if "unreachable" in adb("shell", "ping -c 1 -W 1 8.8.8.8 2>&1"):
                break
            time.sleep(0.5)
    p(f"  rádio {'LIGADO' if ligado else 'DESLIGADO'}: ping → {adb('shell', 'ping -c 1 -W 1 8.8.8.8 2>&1').strip().splitlines()[-1]!r}")


def mock(modo: str, versao: str = "a") -> None:
    global mock_proc
    if mock_proc is not None:
        mock_proc.send_signal(signal.SIGTERM)
        mock_proc.wait(timeout=10)
        mock_proc = None
    if modo == "fora":
        p("  mock: DERRUBADO (nada na 8788)")
        return
    mock_proc = subprocess.Popen(
        [sys.executable, MOCK, "servidor", "8788", modo, f"{FX}/{versao}/setlists.json", f"{FX}/{versao}/content.json"],
        stdout=open(os.path.join(SAIDA, "mock.log"), "a"), stderr=subprocess.STDOUT,
    )
    for _ in range(50):
        try:
            socket.create_connection(("127.0.0.1", 8788), timeout=0.2).close()
            break
        except OSError:
            time.sleep(0.2)
    p(f"  mock: {modo} · fixture {versao}")


def dump(nome: str) -> ET.Element:
    adb("shell", "rm -f /sdcard/sy-pr4.xml; uiautomator dump /sdcard/sy-pr4.xml")
    xml = adb("exec-out", "cat /sdcard/sy-pr4.xml")
    try:
        raiz = ET.fromstring(xml)
    except ET.ParseError:
        return ET.fromstring("<hierarchy/>")
    open(os.path.join(SAIDA, f"{nome}.xml"), "w").write(xml)
    return raiz


def captura(nome: str) -> None:
    with open(os.path.join(SAIDA, f"{nome}.png"), "wb") as f:
        f.write(subprocess.run([ADB, "-s", SERIAL, "exec-out", "screencap", "-p"], capture_output=True).stdout)


def no(raiz: ET.Element, rid: str):
    for n in raiz.iter("node"):
        if n.get("resource-id", "") == rid:
            return n
    return None


def centro(n) -> tuple:
    x0, y0, x1, y1 = map(int, re.findall(r"\d+", n.get("bounds")))
    return (x0 + x1) // 2, (y0 + y1) // 2


def tocar(rid: str, tentativas: int = 20) -> bool:
    for _ in range(tentativas):
        n = no(dump("_toque"), rid)
        if n is not None:
            x, y = centro(n)
            adb("shell", f"input tap {x} {y}")
            time.sleep(1.2)
            return True
        time.sleep(1)
    p(f"  ✗ sem nó {rid!r} para tocar")
    return False


def ver(rid: str, tentativas: int = 20) -> bool:
    for _ in range(tentativas):
        if no(dump("_ver"), rid) is not None:
            return True
        time.sleep(1)
    return False


def fundo() -> None:
    adb("shell", "input keyevent KEYCODE_HOME")


def frente() -> None:
    # A 1ª corrida usou `monkey -p … -c LAUNCHER 1`, e o lançador ficou por cima (div. do README): a volta é a atividade
    # do app, que traz a tarefa existente para a frente sem recarregar ("its current task has been brought to the front").
    adb("shell", f"am start -n {PKG}/.MainActivity")


def fora_do_intervalo(seg: float = 31) -> None:
    """Espera até `seg` s depois do fim do último sync que saiu à rede (o intervalo da SY-D18)."""
    fins = [t for t, l in linhas(0) if l.startswith(("sync ok", "sync fail"))]
    if fins:
        falta = fins[-1] / 1000 + seg - agora() / 1000
        if falta > 0:
            p(f"  (espera {falta:.0f} s: o intervalo de 30 s desde o fim do último sync)")
            time.sleep(falta)


def s1_no_topo() -> None:
    """S1, com a lista no topo (a 1ª corrida do c13 não achou a setlist: a lista ficara rolada pelo c11)."""
    for _ in range(4):
        if ver("criar-setlist", 2):
            break
        adb("shell", "input keyevent KEYCODE_BACK")
        time.sleep(1.5)
    for _ in range(3):
        adb("shell", "input swipe 1300 700 1300 1500 300")  # começa abaixo do banner (a 1ª forma, em 500, caía nele)
        time.sleep(0.8)


def sem_falha_na_tela() -> None:
    """Se a tela ainda mostra a falha de um cenário anterior (o banner, a linha de aviso), um sync ok antes (a rede)."""
    if no(dump("_limpo"), "tentar-banner") is None:
        return
    fora_do_intervalo()
    t = agora()
    p("  (a falha do cenário anterior ainda na tela: um sync ok antes, pela rede — fora da contagem deste cenário)")
    radio(False)
    esperar(t, "net offline", 15)
    radio(True)
    esperar(t, "sync ok", 30)
    quieto(t)


def cenario(nome: str, titulo: str):
    global rel
    rel = open(os.path.join(SAIDA, f"{nome}.txt"), "w")
    p(f"# SY-PR4 · AVD · {nome} — {titulo}")
    p(f"# {time.strftime('%Y-%m-%d %H:%M:%S %z')} · a fixture {FX}")
    return agora()


# ------------------------------------------------------------------------------------------------------------- cenários

def c_abrir_e_rede():
    """A-SY-12 (a): o app abre em avião (sem cache: S1d), e desligar o avião com o app aberto → 1 sync, 2 GET."""
    t0 = cenario("c01-abrir-e-rede", "abrir em avião, desligar o avião com o app aberto")
    p("O mock alcançável com o rádio desligado? (o túnel do `adb reverse` não passa pelo rádio, a hipótese da A9)")
    r = adb("shell", "printf 'GET /api/setlists HTTP/1.0\\r\\n\\r\\n' | toybox nc -w 3 127.0.0.1 8788 | head -1").strip()
    p(f"  $ adb shell \"printf 'GET /api/setlists …' | toybox nc 127.0.0.1 8788 | head -1\"  (EM AVIÃO) → {r!r}")
    p(f"  ping em avião → {adb('shell', 'ping -c 1 -W 1 8.8.8.8 2>&1').strip().splitlines()[-1]!r}")
    adb("shell", "am start -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'")
    if not esperar(t0, "sync skip", 90):
        p("  ✗ a abertura não chegou ao sync skip")
    time.sleep(3)
    dump("c01-S1-em-aviao")
    p(f"  a abertura em avião: {contar(t0)['sync ok/fail/skip']} · net: {contar(t0)['net']}")
    t1 = agora()
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(True)
    esperar(t1, "sync ok", 30)
    quieto(t1)
    captura("c01-S1-depois")
    return medir(t1, dec)


def c_intervalo():
    """A-SY-12 (d): dentro do intervalo — o avião ligado e desligado logo depois de um sync → 0."""
    t0 = cenario("c02-dentro-do-intervalo", "o avião liga e desliga nos 30 s depois do fim de um sync")
    fins = [t for t, l in linhas(0) if l.startswith("sync ok")]
    p(f"  o último sync ok terminou há {(agora() - fins[-1]) / 1000:.1f} s")
    dec = declarar(linhas=["sync trigger reason=net decision=skip-interval"], sync_start=0, GET=0)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "net online", 20)
    time.sleep(3)
    fins2 = [t for t, l in linhas(0) if l.startswith("sync ok")]
    on = [t for t, l in linhas(t0) if l == "net online"]
    if on:
        p(f"  a rede voltou {(on[-1] - fins2[-1]) / 1000:.1f} s depois do fim do último sync (dentro de 30 s?)")
    return medir(t0, dec)


def c_fundo_curto():
    """A-SY-12 (c): segundo plano por menos de 30 s → 0."""
    fora_do_intervalo()
    t0 = cenario("c03-fundo-curto", "segundo plano por 10 s")
    dec = declarar(linhas=["sync trigger reason=foreground decision=skip-short"], sync_start=0, GET=0)
    fundo()
    time.sleep(10)
    frente()
    time.sleep(5)
    return medir(t0, dec)


def c_fundo_longo():
    """A-SY-12 (b): segundo plano por mais de 30 s → 1, 2 GET."""
    fora_do_intervalo()
    t0 = cenario("c04-fundo-longo", "segundo plano por 35 s")
    dec = declarar(linhas=["sync trigger reason=foreground decision=run"], sync_start=1, GET=2)
    fundo()
    time.sleep(35)
    frente()
    esperar(t0, "sync ok", 30)
    quieto(t0)
    return medir(t0, dec)


def c_tela_apagada():
    """A-SY-18: a tela apagada com o app na frente conta como segundo plano no AppState?"""
    fora_do_intervalo()
    t0 = cenario("c05-tela-apagada", "apagar a tela com o app na frente: 10 s, e depois 35 s")
    p("HIPÓTESE A MEDIR: se a tela apagada conta como segundo plano, a volta de 10 s deixa `skip-short` e a de 35 s")
    p("`foreground run` (1 sync, 2 GET); se não conta, nenhuma linha nas duas.")
    dec = declarar(linhas=["sync trigger reason=foreground decision=skip-short", "sync trigger reason=foreground decision=run"], sync_start=1, GET=2)
    for seg in (10, 35):
        adb("shell", "input keyevent KEYCODE_SLEEP")
        time.sleep(1)
        p(f"  tela apagada: {adb('shell', 'dumpsys power | grep -m1 mWakefulness=').strip()} · {seg} s")
        time.sleep(seg)
        adb("shell", "input keyevent KEYCODE_WAKEUP")
        time.sleep(1)
        adb("shell", "wm dismiss-keyguard")
        p(f"  tela acesa: {adb('shell', 'dumpsys power | grep -m1 mWakefulness=').strip()} · o app na frente: {'rocks.octavia.app' in adb('shell', 'dumpsys activity activities | grep -m1 topResumedActivity')}")
        time.sleep(4)
        if seg == 35:
            esperar(t0, "sync ok", 30)
            quieto(t0)
    return medir(t0, dec)


def c_rede_no_fundo():
    """A-SY-19: o evento de rede com o app em segundo plano chega ao JS? E a marca."""
    fora_do_intervalo()
    t0 = cenario("c06-rede-no-fundo", "a rede cai e volta com o app em segundo plano; a volta em menos de 30 s")
    p("HIPÓTESE A MEDIR: o evento chega ao JS em segundo plano → `net offline`/`net online` e `sync trigger reason=net")
    p("decision=skip-background` com o app fora, e na volta curta `reason=net decision=run` (a marca). Se não chega, as")
    p("linhas só saem na volta.")
    dec = declarar(linhas=["sync trigger reason=net decision=skip-background", "sync trigger reason=net decision=run"], sync_start=1, GET=2)
    fundo()
    t_fundo = agora()
    time.sleep(1)
    radio(False)
    time.sleep(2)
    radio(True)
    time.sleep(3)
    t_frente = agora()
    p(f"  ausência até aqui: {(t_frente - t_fundo) / 1000:.1f} s (tem de ser < 30 s)")
    frente()
    esperar(t0, "sync ok", 30)
    quieto(t0)
    p("QUANDO cada linha saiu, contra a volta à frente:")
    for t, l in linhas(t0):
        if l.startswith(("net ", "sync trigger")):
            p(f"  {'EM SEGUNDO PLANO' if t < t_frente else 'na frente'} ({(t - t_frente) / 1000:+.1f} s)  {l}")
    return medir(t0, dec)


def c_falha(nome: str, titulo: str, modo: str, linhas_dec: list, get: int, espera_fim: float):
    """SY-D43 / SY-D57 — um sync automático que falha com cache, em S1: o que a tela mostra antes e depois."""
    fora_do_intervalo()
    t0 = cenario(nome, titulo)
    mock(modo)
    antes = dump(f"{nome}-antes")
    p(f"  antes: tentar-banner {'presente' if no(antes, 'tentar-banner') is not None else 'ausente'}")
    dec = declarar(linhas=linhas_dec, sync_start=1, GET=get)
    fundo()
    time.sleep(35)
    frente()
    esperar(t0, "sync fail", espera_fim)
    quieto(t0, espera_fim + 10)
    depois = dump(f"{nome}-depois")
    captura(f"{nome}-depois")
    p(f"  depois: tentar-banner {'PRESENTE' if no(depois, 'tentar-banner') is not None else 'ausente'}")
    return medir(t0, dec)


def c_banner_some():
    """SY-D57 (1): o banner some no próximo sync automático que dá certo."""
    t0 = cenario("c10-banner-some", "o mock volta ao normal; o próximo sync automático (a rede) tira o banner")
    mock("normal")
    fora_do_intervalo()
    t1 = agora()
    antes = dump("c10-antes")
    p(f"  antes: tentar-banner {'PRESENTE' if no(antes, 'tentar-banner') is not None else 'ausente'}")
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t1, "net offline", 15)
    radio(True)
    esperar(t1, "sync ok", 30)
    quieto(t1)
    depois = dump("c10-depois")
    captura("c10-depois")
    p(f"  depois: tentar-banner {'presente' if no(depois, 'tentar-banner') is not None else 'AUSENTE'}")
    return medir(t1, dec)


def cartoes(raiz) -> list:
    out = []
    for n in raiz.iter("node"):
        rid = n.get("resource-id", "")
        if rid.startswith("setlist-"):
            y0 = int(re.findall(r"\d+", n.get("bounds"))[1])
            y1 = int(re.findall(r"\d+", n.get("bounds"))[3])
            out.append((rid, round(y0 / FATOR, 1), round((y1 - y0) / FATOR, 1)))
    return out


def c_rolagem():
    """SY-D57 (2): a lista de S1 rolada ao meio; o banner aparece — o cartão visível antes e depois."""
    fora_do_intervalo()
    t0 = cenario("c11-banner-e-rolagem", "a lista de S1 rolada; a falha automática (500) põe o banner")
    adb("shell", "input swipe 1300 1300 1300 500 800")
    time.sleep(2)
    a = cartoes(dump("c11-antes"))
    captura("c11-antes")
    p(f"  antes (resource-id, topo em dp, altura em dp): {a}")
    mock("500-pagina-1")
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync fail", 30)
    quieto(t0)
    d = cartoes(dump("c11-depois"))
    captura("c11-depois")
    p(f"  depois: {d}")
    p(f"  o primeiro cartão visível: antes {a[0] if a else None} · depois {d[0] if d else None}")
    ok = medir(t0, dec)
    mock("normal")
    return ok


def c_busca_da_l():
    """SY-D57 (2): a busca digitada na L fica quando a linha de aviso aparece."""
    fora_do_intervalo()
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c12-busca-da-l", "a L com uma busca digitada; a falha automática (500) põe a linha de aviso")
    tocar("buscar")
    tocar("lib-campo")
    adb("shell", "input text Letra")
    time.sleep(2)
    adb("shell", "input keyevent KEYCODE_BACK")  # fecha o teclado, não a tela (div. 261)
    time.sleep(1)
    a = dump("c12-antes")
    campo = no(a, "lib-campo")
    p(f"  antes: lib-campo text={campo.get('text') if campo is not None else None!r} · aviso-motivo {'presente' if no(a, 'aviso-motivo') is not None else 'ausente'}")
    mock("500-pagina-1")
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync fail", 30)
    quieto(t0)
    d = dump("c12-depois")
    captura("c12-depois")
    campo = no(d, "lib-campo")
    p(f"  depois: lib-campo text={campo.get('text') if campo is not None else None!r} · aviso-motivo {'PRESENTE' if no(d, 'aviso-motivo') is not None else 'ausente'}")
    ok = medir(t0, dec)
    mock("normal")
    adb("shell", "input keyevent KEYCODE_BACK")
    time.sleep(2)
    return ok


def ordem_do_modo(raiz) -> list:
    """A ordem do modo de reordenar: por alça, de cima para baixo, o TÍTULO da linha (o texto da fixture à direita da alça,
    na faixa de altura dela). A 1ª forma lia o `content-desc` das alças — igual nas cinco, "Arrastar para mudar a
    posição": não media ordem nenhuma (o caso 42; a div. do README)."""
    nos = list(raiz.iter("node"))
    out = []
    for n in nos:
        if not n.get("resource-id", "").startswith("alca-"):
            continue
        ax0, ay0, ax1, ay1 = map(int, re.findall(r"\d+", n.get("bounds")))
        textos = []
        for t in nos:
            if t.get("class", "").endswith("TextView") and t.get("text"):
                x0, y0, x1, y1 = map(int, re.findall(r"\d+", t.get("bounds")))
                if x0 > ax1 and ay0 <= (y0 + y1) // 2 <= ay1:
                    textos.append((x0, t.get("text")))
        # o 1º texto é o número da posição; o 2º, o título
        textos.sort()
        out.append((ay0, textos[1][1] if len(textos) > 1 else "?"))
    return [t for _, t in sorted(out)]


def c_reordenar():
    """SY-D52: S2 no modo de reordenar com um arrasto; o gatilho chega e o site renomeou a setlist."""
    fora_do_intervalo()
    s1_no_topo()
    t0 = cenario("c13-s2-reordenar", "S2 reordenando, um arrasto feito; a rede volta e o sync traz a setlist renomeada")
    tocar("setlist-0000000a")
    tocar("reordenar")
    r = dump("c13-modo")
    a1, a3 = no(r, "alca-1"), no(r, "alca-3")
    if a1 is None or a3 is None:
        p("  ✗ o modo não abriu")
        return False
    x, y = centro(a1)
    _, y3 = centro(a3)
    adb("shell", f"input motionevent DOWN {x} {y}")
    for k in range(1, 11):
        adb("shell", f"input motionevent MOVE {x} {y + (y3 - y + 20) * k // 10}")
        time.sleep(0.08)
    adb("shell", f"input motionevent UP {x} {y3 + 20}")
    time.sleep(1.5)
    antes = ordem_do_modo(dump("c13-antes"))
    p(f"  a ordem do modo depois do arrasto (content-desc das alças): {antes}")
    mock("normal", "c")
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync ok", 30)
    quieto(t0)
    d = dump("c13-depois")
    captura("c13-depois")
    depois = ordem_do_modo(d)
    p(f"  depois do sync: o modo {'ABERTO' if no(d, 'alca-1') is not None else 'fechado'} · a ordem: {depois}")
    p(f"  a ordem é a do arrasto: {depois == antes} · `Salvar a ordem` ativo: {no(d, 'reordenar-salvar') is not None and no(d, 'reordenar-salvar').get('enabled')}")
    ok = medir(t0, dec)
    tocar("reordenar-sair")  # sai sem salvar: nenhuma escrita
    mock("normal", "a")
    return ok


def eventos_de_rolagem(segundos: float) -> tuple:
    """`uiautomator events` por `segundos`: os eventos de rolagem (EventTime, ScrollY) e a base de tempo."""
    up = float(adb("shell", "cat /proc/uptime").split()[0])
    ep = agora()
    pr = subprocess.Popen([ADB, "-s", SERIAL, "shell", "uiautomator", "events"], stdout=subprocess.PIPE, text=True)
    time.sleep(segundos)
    pr.send_signal(signal.SIGINT)
    try:
        out, _ = pr.communicate(timeout=5)
    except subprocess.TimeoutExpired:
        pr.kill()
        out, _ = pr.communicate()
    adb("shell", "pkill -f uiautomator")
    evs = []
    for l in out.splitlines():
        if "TYPE_VIEW_SCROLLED" in l:
            mt, my = re.search(r"EventTime: (\d+)", l), re.search(r"ScrollY: (-?\d+)", l)
            if mt and my:
                evs.append((int(mt.group(1)) - int(up * 1000) + ep, int(my.group(1))))
    return evs, out


def lacuna(evs: list, t_ini: int, t_fim: int) -> tuple:
    js = [e for e in evs if t_ini <= e[0] <= t_fim]
    gaps = [b[0] - a[0] for a, b in zip(js, js[1:])]
    return len(js), (max(gaps) if gaps else None), (js[-1][1] - js[0][1] if len(js) > 1 else 0)


def c_palco():
    """A-SY-23: o palco aberto, a rolagem andando; a rede volta → 0 sync, hold-stage, a rolagem sem pausa além do piso;
    a volta longa do segundo plano → hold; sair → 1 sync."""
    fora_do_intervalo()
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c14-palco", "o palco na Letra longa, a rolagem ligada; a rede volta; a volta longa; sair")
    tocar("setlist-0000000a")
    tocar("song-3")
    time.sleep(3)
    tocar("auto-scroll")
    time.sleep(3)
    p("O PISO e a JANELA da rede, no `uiautomator events` (o ScrollY por evento; SY-D36 (c): a maior lacuna na janela ≤ a do")
    p("piso + 100 ms; o controle: a janela não pode vir VAZIA, SY-D55 (1)).")
    dec = declarar(linhas=["sync trigger reason=net decision=hold-stage"], sync_start=0, GET=0)
    t_piso = agora()
    import threading
    res = {}
    th = threading.Thread(target=lambda: res.update(ev=eventos_de_rolagem(45)))
    th.start()
    time.sleep(18)
    t_rede = agora()
    radio(False)
    esperar(t_rede, "net offline", 15)
    radio(True)
    esperar(t_rede, "sync trigger", 20)
    th.join()
    evs, bruto = res["ev"]
    open(os.path.join(SAIDA, "c14-uiautomator-events.txt"), "w").write(bruto)
    nP, gP, dP = lacuna(evs, t_piso + 2000, t_rede - 1000)
    linha_t = [t for t, l in linhas(t_rede) if l.startswith("sync trigger")]
    tj = linha_t[0] if linha_t else t_rede
    nJ, gJ, dJ = lacuna(evs, tj - 5000, tj + 10000)
    p(f"  PISO   [{(t_piso + 2000) % 100000}, {(t_rede - 1000) % 100000}]: eventos {nP} · maior lacuna {gP} ms · andou {dP} px")
    p(f"  JANELA [linha −5 s, +10 s]: eventos {nJ} · maior lacuna {gJ} ms · andou {dJ} px")
    if nJ == 0 or nP == 0:
        p("  ✗ JANELA VAZIA — o instrumento não mediu nada (SY-D55 (1))")
    elif gJ is not None and gP is not None:
        p(f"  o critério do release (SY-D36 (c), n=1 aqui — não é referência): {gJ} ≤ {gP} + 100? {'sim' if gJ <= gP + 100 else 'NÃO'}")
    ok = medir(t_rede, dec)
    captura("c14-palco-depois-da-rede")
    # a volta longa do segundo plano com o palco aberto → hold
    t1 = agora()
    dec2 = declarar(linhas=["sync trigger reason=foreground decision=hold-stage"], sync_start=0, GET=0)
    fundo()
    time.sleep(35)
    frente()
    time.sleep(6)
    ok = medir(t1, dec2) and ok
    # sair do palco → stage-exit
    fora_do_intervalo()
    t2 = agora()
    dec3 = declarar(linhas=["sync trigger reason=stage-exit decision=run"], sync_start=1, GET=2)
    tocar("sair")
    esperar(t2, "sync ok", 30)
    quieto(t2)
    return medir(t2, dec3) and ok


def c_palco_falha():
    """SY-D43 com o palco aberto: a rede volta com o mock em 500 → o palco segura (nada muda); ao sair, a falha em S1."""
    fora_do_intervalo()
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c15-palco-falha", "o palco aberto e o mock em 500: a rede volta; sair")
    tocar("setlist-0000000a")
    tocar("song-1")
    time.sleep(3)
    mock("500-pagina-1")
    a = dump("c15-palco-antes")
    dec = declarar(linhas=["sync trigger reason=net decision=hold-stage"], sync_start=0, GET=0)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync trigger", 20)
    time.sleep(3)
    d = dump("c15-palco-depois")
    ids_a = sorted(n.get("resource-id", "") for n in a.iter("node") if n.get("resource-id"))
    ids_d = sorted(n.get("resource-id", "") for n in d.iter("node") if n.get("resource-id"))
    p(f"  o palco: os resource-id iguais antes e depois da rede: {ids_a == ids_d} ({len(ids_a)} nós com id)")
    ok = medir(t0, dec)
    fora_do_intervalo()
    t1 = agora()
    dec2 = declarar(linhas=["sync trigger reason=stage-exit decision=run"], sync_start=1, GET=2)
    tocar("sair")
    esperar(t1, "sync fail", 30)
    quieto(t1)
    s1 = dump("c15-S1-depois")
    captura("c15-S1-depois")
    p(f"  em S1 depois de sair: tentar-banner {'PRESENTE' if no(s1, 'tentar-banner') is not None else 'ausente'}")
    ok = medir(t1, dec2) and ok
    mock("normal")
    return ok


def corpo_texto(raiz) -> str:
    n = no(raiz, "corpo")
    return "" if n is None else (n.get("text") or "")


def c_v():
    """A-SY-23: com V aberta, o gatilho roda e o texto não muda (a foto de V)."""
    fora_do_intervalo()
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c16-v-aberta", "V aberta na Letra longa; a rede volta e o sync traz o corpo novo (fixture b)")
    tocar("buscar")
    tocar("lib-campo")
    adb("shell", "input text longa")
    time.sleep(2)
    adb("shell", "input keyevent KEYCODE_BACK")
    time.sleep(1)
    tocar("lib-linha-00000000")
    time.sleep(3)
    a = corpo_texto(dump("c16-antes"))
    mock("normal", "b")
    dec = declarar(linhas=["sync trigger reason=net decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync ok", 30)
    quieto(t0)
    d = corpo_texto(dump("c16-depois"))
    p(f"  o corpo de V (o texto do projeto): {len(a)} caracteres antes, {len(d)} depois · igual: {a == d and len(a) > 0}")
    p(f"  (a versão b troca `a` por `e` na Letra longa: o corpo NOVO teria {a.count('a')} 'a' a menos)")
    ok = medir(t0, dec)
    adb("shell", "input keyevent KEYCODE_BACK")
    time.sleep(1)
    return ok


def c_avulso():
    """SY-D56: o palco avulso sem hospedeira (▶ na L) segura; o voltar desempilha e o marcado roda."""
    fora_do_intervalo()
    t0 = cenario("c17-avulso", "o ▶ na L abre o palco avulso; a rede volta; o voltar")
    if not ver("lib-campo", 3):
        tocar("buscar")
    tocar("lib-tocar-00000000")
    time.sleep(3)
    dec = declarar(linhas=["sync trigger reason=net decision=hold-stage", "sync trigger reason=stage-exit decision=run"], sync_start=1, GET=2)
    radio(False)
    esperar(t0, "net offline", 15)
    radio(True)
    esperar(t0, "sync trigger", 20)
    time.sleep(3)
    fora_do_intervalo()
    adb("shell", "input keyevent KEYCODE_BACK")
    esperar(t0, "sync ok", 30)
    quieto(t0)
    ok = medir(t0, dec)
    adb("shell", "input keyevent KEYCODE_BACK")
    time.sleep(1)
    return ok


def c_de_novo():
    """SY-D49 (2): o "de novo" de um sync em voo quando o palco abre no meio espera, e roda ao sair."""
    fora_do_intervalo()
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c18-de-novo-espera", "um sync em voo (o mock no atraso), a rede volta (queued), o palco abre, o voo cai")
    tocar("setlist-0000000a")
    mock("atraso")
    dec = declarar(
        linhas=["sync trigger reason=foreground decision=run", "sync trigger reason=net decision=queued", "sync trigger reason=again decision=hold-stage", "sync trigger reason=stage-exit decision=run"],
        sync_start=2, GET=2,
    )
    fundo()
    time.sleep(35)
    frente()
    esperar(t0, "sync start", 15)
    radio(False)
    esperar(t0, "net offline", 10)
    radio(True)
    esperar(t0, "sync trigger reason=net", 15)
    tocar("song-1")
    p(f"  o palco abriu {(agora() - [t for t, l in linhas(t0) if l == 'sync start'][0]) / 1000:.1f} s depois do sync start")
    esperar(t0, "sync fail", 30)
    esperar(t0, "sync trigger reason=again", 5)
    mock("normal")
    time.sleep(3)
    tocar("sair")
    esperar(t0, "sync ok", 30)
    quieto(t0)
    return medir(t0, dec)


def c_rede_no_fundo_n():
    """A-SY-19 com `n`: a rede cai e volta em segundo plano, e o app espera ESPERA s com a rede de pé antes de voltar. Por
    rodada: quando o `net offline` e o `net online` chegaram ao JS (antes ou depois da volta), as linhas `sync trigger` e os
    `sync start`. O resultado que a SY-D17 pede é 1 sync por rodada, pela marca ou pela rede na frente."""
    t0 = cenario("c06b-rede-no-fundo-n", "a rede em segundo plano, n rodadas, a volta 5 s e 12 s depois de a rede voltar")
    tabela = []
    for k, espera in enumerate([5, 12, 5, 12, 5, 12], start=1):
        fora_do_intervalo()
        t1 = agora()
        fundo()
        t_fundo = agora()
        time.sleep(1)
        radio(False)
        time.sleep(2)
        radio(True)
        t_rede = agora()
        time.sleep(espera)
        t_frente = agora()
        frente()
        esperar(t1, "sync ok", 25)
        quieto(t1)
        ls = linhas(t1)
        off = [t for t, l in ls if l == "net offline"]
        on = [t for t, l in ls if l == "net online"]
        trig = [l.replace("sync trigger ", "") for _, l in ls if l.startswith("sync trigger")]
        n = sum(1 for _, l in ls if l == "sync start")
        get = sum(1 for _, l in ls if re.match(r"api status=\S+ path=/api/(setlists|content)( |$)", l))
        rot = lambda ts: "—" if not ts else ("fundo" if ts[0] < t_frente else "frente") + f" ({(ts[0] - t_frente) / 1000:+.1f} s)"
        tabela.append((k, espera, (t_frente - t_fundo) / 1000, (t_frente - t_rede) / 1000, rot(off), rot(on), trig, n, get))
        p(f"  rodada {k}: espera {espera} s · ausência {(t_frente - t_fundo) / 1000:.1f} s · a rede de pé {(t_frente - t_rede) / 1000:.1f} s antes da volta")
        p(f"    net offline: {rot(off)} · net online: {rot(on)} · {trig} · sync start {n} · GET {get}")
    p("RESUMO (rodada · espera · ausência · rede de pé antes da volta · net offline · net online · linhas · sync start · GET):")
    for r in tabela:
        p(f"  {r}")
    um = sum(1 for r in tabela if r[7] == 1)
    p(f"VEREDITO: 1 sync em {um} de {len(tabela)} rodadas (a SY-D17: a volta curta com a rede que voltou → 1)")
    return um == len(tabela)


def rede_pisca(t0: int) -> None:
    """A rede cai e volta depressa: só o avião (o Wi-Fi e os dados já ligados voltam com ele), esperando as linhas `net`."""
    n_off = sum(1 for _, l in linhas(t0) if l == "net offline")
    n_on = sum(1 for _, l in linhas(t0) if l == "net online")
    adb("shell", "cmd connectivity airplane-mode enable")
    esperar(t0, "net offline", 10, n_off + 1)
    adb("shell", "cmd connectivity airplane-mode disable")
    esperar(t0, "net online", 15, n_on + 1)


def c_de_novo_rapido():
    """SY-D49 (2), refeito (c18b): o voo dura os 20 s do prazo (o mock no atraso), e o toque no palco tem de cair dentro
    dele — a 1ª forma (c18) abriu o palco 54 s depois do `sync start`. Aqui: a rede pisca (run, o voo), pisca de novo
    (queued) e o toque na posição 1 vai pelas coordenadas lidas ANTES (sem dump no meio)."""
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c18b-de-novo-espera", "o voo no atraso, a rede pisca duas vezes (run, queued), o palco abre no meio do voo")
    tocar("setlist-0000000a")
    alvo = no(dump("c18b-S2"), "song-1")
    if alvo is None:
        p("  ✗ sem a posição 1 em S2")
        return False
    x, y = centro(alvo)
    mock("atraso")
    dec = declarar(
        linhas=["sync trigger reason=net decision=run", "sync trigger reason=net decision=queued",
                "sync trigger reason=again decision=hold-stage", "sync trigger reason=stage-exit decision=run"],
        sync_start=2, GET=2,
    )
    rede_pisca(t0)
    t_voo = agora()
    rede_pisca(t0)
    adb("shell", f"input tap {x} {y}")
    p(f"  o palco tocado {(agora() - t_voo) / 1000:.1f} s depois do 1º sync start (o voo dura 20 s)")
    esperar(t0, "sync fail", 30)
    esperar(t0, "sync trigger reason=again", 5)
    p(f"  em voo e depois: {[l for _, l in linhas(t0) if l.startswith(('sync start', 'sync fail', 'sync trigger', 'keepawake'))]}")
    mock("normal")
    fora_do_intervalo(1)
    time.sleep(2)
    tocar("sair")
    esperar(t0, "sync ok", 30)
    quieto(t0)
    return medir(t0, dec)


def eventos_para_arquivo(arq: str):
    """O `uiautomator events` no molde do arnês da QL (`ql.py ancora`): a saída DIRETO num arquivo, e o fim por SIGTERM.
    A 1ª forma (pipe + SIGINT) perdeu tudo depois de ~5,7 s (o c14: a janela VAZIA, o controle da SY-D55 (1) acusou)."""
    up = float(adb("shell", "cat /proc/uptime").split()[0])
    ep = agora()
    pr = subprocess.Popen([ADB, "-s", SERIAL, "shell", "uiautomator", "events"], stdout=open(arq, "w"), stderr=subprocess.STDOUT)
    return pr, ep - int(up * 1000)


def parar_eventos(pr) -> None:
    pr.terminate()
    pr.wait()
    subprocess.run([ADB, "-s", SERIAL, "shell", "pkill", "-f", "uiautomator"], capture_output=True)
    time.sleep(1.5)


def ler_eventos(arq: str, base: int) -> list:
    evs = []
    for l in open(arq):
        if "TYPE_VIEW_SCROLLED" in l and "rocks.octavia.app" in l:
            mt, my = re.search(r"EventTime: (\d+)", l), re.search(r"ScrollY: (-?\d+)", l)
            if mt and my:
                evs.append((int(mt.group(1)) + base, int(my.group(1))))
    return evs


def c_rolagem_no_palco():
    """A-SY-23 (a rolagem): o palco na Letra longa, a rolagem ligada; por rodada, o PISO (15 s sem nada) e a JANELA da rede
    que volta (do avião até 10 s depois da linha `sync trigger`), cada um no seu arquivo. A maior lacuna entre eventos de
    rolagem: a da janela contra a do piso + 100 ms (o critério do release da SY-D36 (c), aqui no dev client e com n
    pequeno: indicação, não referência). O controle: janela ou piso VAZIOS reprovam (SY-D55 (1))."""
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c14b-rolagem-no-palco", "a rolagem do palco andando enquanto a rede volta — o piso e a janela, 3 rodadas")
    tocar("setlist-0000000a")
    tocar("song-3")
    time.sleep(3)
    dec = declarar(linhas=["sync trigger reason=net decision=hold-stage"] * 3, sync_start=0, GET=0)
    resultado = []
    for k in (1, 2, 3):
        tocar("auto-scroll")  # liga (a rodada anterior a desligou, e a rolagem volta a andar de onde está)
        time.sleep(2)
        piso = os.path.join(SAIDA, f"c14b-r{k}-piso-events.txt")
        pr, base = eventos_para_arquivo(piso)
        time.sleep(15)
        parar_eventos(pr)
        jan = os.path.join(SAIDA, f"c14b-r{k}-janela-events.txt")
        t1 = agora()
        pr, base2 = eventos_para_arquivo(jan)
        time.sleep(2)
        rede_pisca(t1)
        esperar(t1, "sync trigger", 10)
        time.sleep(10)
        parar_eventos(pr)
        lt = [t for t, l in linhas(t1) if l.startswith("sync trigger")]
        eP, eJ = ler_eventos(piso, base), ler_eventos(jan, base2)
        gP = max((b[0] - a[0] for a, b in zip(eP, eP[1:])), default=None)
        gJ = max((b[0] - a[0] for a, b in zip(eJ, eJ[1:])), default=None)
        dP = eP[-1][1] - eP[0][1] if len(eP) > 1 else 0
        dJ = eJ[-1][1] - eJ[0][1] if len(eJ) > 1 else 0
        p(f"  rodada {k}: PISO eventos {len(eP)} · maior lacuna {gP} ms · andou {dP} px | JANELA eventos {len(eJ)} · maior lacuna {gJ} ms · andou {dJ} px · a linha {'presente' if lt else 'AUSENTE'}")
        resultado.append((len(eP), gP, dP, len(eJ), gJ, dJ))
        tocar("auto-scroll")  # desliga para a próxima rodada começar do mesmo jeito
        fora_do_intervalo(1)
    vazio = any(r[0] == 0 or r[3] == 0 for r in resultado)
    if vazio:
        p("  ✗ PISO ou JANELA VAZIOS — o instrumento não mediu (SY-D55 (1))")
    else:
        import statistics
        mp = statistics.median(r[1] for r in resultado)
        mj = statistics.median(r[4] for r in resultado)
        p(f"  as medianas (n = 3, indicação): piso {mp} ms · janela {mj} ms · {mj} ≤ {mp} + 100? {'sim' if mj <= mp + 100 else 'NÃO'}")
    ok = medir(t0, dec) and not vazio
    tocar("sair")
    esperar(t0, "sync ok", 30)
    quieto(t0)
    p(f"  ao sair: {[l for _, l in linhas(t0) if l.startswith('sync trigger reason=stage-exit')]}")
    return ok


SENSOR = "docs/native/SY-PR1-anexos/instrumentos/sensor-quadros.mjs"


def sensor(*args: str) -> str:
    return subprocess.run(["node", SENSOR, *args], capture_output=True, text=True, timeout=60).stdout.strip()


def intervalos(arq: str, ini: int, fim: int) -> list:
    import json as _j
    d = _j.load(open(arq))
    ts = d["t"] if isinstance(d, dict) and "t" in d else d
    ts = [t for t in ts if ini <= t <= fim]
    return [b - a for a, b in zip(ts, ts[1:])]


def c_rolagem_no_palco_2():
    """A-SY-23 (a rolagem), a 3ª forma (c14c): por rodada, a música recomeça do topo (avançar e voltar uma posição: a
    troca de posição volta a rolagem ao topo), o zoom no máximo (o texto mais longo: a rolagem não chega ao fim), o rádio
    pelo caminho completo (~5 s; a piscada só pelo avião levou 27 s e 51 s no c14b). Dois instrumentos: o SENSOR DE
    QUADROS da SY-PR1 (o passo da thread de JS, pelo inspetor do Metro — o fino, só no dev client) e o `uiautomator events`
    (o do release, grosso). O PISO são 15 s de rolagem sem nada; a JANELA, do rádio desligado até 8 s depois da última
    linha `sync trigger`. O controle: piso ou janela vazios reprovam (SY-D55 (1)). Declarado: uma linha `hold-stage` por
    transição `net online` (o Wi-Fi do AVD às vezes volta duas vezes: cada volta é um gatilho avaliado) e 0 sync."""
    s1_no_topo()
    sem_falha_na_tela()
    fora_do_intervalo()
    t0 = cenario("c14c-rolagem-no-palco", "a rolagem do palco andando enquanto a rede volta — sensor de quadros e uiautomator, 5 rodadas")
    tocar("setlist-0000000a")
    tocar("song-3")
    time.sleep(2)
    for _ in range(3):
        tocar("zoom-mais")
    p("O CONTROLE (a) do sensor (o da SY-PR1): uma tarefa plantada de 200 ms no JS tem de aparecer com o tamanho dela.")
    tocar("auto-scroll")
    time.sleep(2)
    sensor("instalar")
    time.sleep(2)
    sensor("travar", "200")
    time.sleep(2)
    sc = os.path.join(SAIDA, "c14c-controle-sensor.json")
    sensor("ler", sc)
    sensor("desligar")
    ic = intervalos(sc, 0, 10 ** 14)
    p(f"  o controle: {len(ic)} quadros · o maior intervalo {round(max(ic), 1) if ic else None} ms (a tarefa: 200 ms)")
    tocar("auto-scroll")
    p("DECLARADO ANTES: por rodada, 0 sync, 0 GET, e uma `sync trigger reason=net decision=hold-stage` por `net online`.")
    res = []
    for k in range(1, 6):
        tocar("borda-avancar")
        time.sleep(1)
        tocar("borda-voltar")  # de volta à Letra longa, do topo
        time.sleep(2)
        tocar("auto-scroll")
        time.sleep(2)
        p(f"  rodada {k}: {sensor('instalar')}")
        fp = os.path.join(SAIDA, f"c14c-r{k}-piso-events.txt")
        pr, base = eventos_para_arquivo(fp)
        tp0 = agora()
        time.sleep(15)
        tp1 = agora()
        parar_eventos(pr)
        sp = os.path.join(SAIDA, f"c14c-r{k}-piso-sensor.json")
        sensor("ler", sp)
        fj = os.path.join(SAIDA, f"c14c-r{k}-janela-events.txt")
        pr, base2 = eventos_para_arquivo(fj)
        t1 = agora()
        radio(False)
        esperar(t1, "net offline", 15)
        radio(True)
        esperar(t1, "sync trigger", 15)
        time.sleep(8)
        ult = [t for t, l in linhas(t1) if l.startswith("sync trigger")]
        t2 = (ult[-1] if ult else agora()) + 8000
        parar_eventos(pr)
        sj = os.path.join(SAIDA, f"c14c-r{k}-janela-sensor.json")
        sensor("ler", sj)
        sensor("desligar")
        ls = linhas(t1)
        on = sum(1 for _, l in ls if l == "net online")
        hold = sum(1 for _, l in ls if l == "sync trigger reason=net decision=hold-stage")
        outras = [l for _, l in ls if l.startswith("sync trigger") and "hold-stage" not in l]
        st = sum(1 for _, l in ls if l == "sync start")
        iP, iJ = intervalos(sp, tp0 + 1000, tp1), intervalos(sj, t1, t2)
        eP, eJ = ler_eventos(fp, base), ler_eventos(fj, base2)
        gP = max((b[0] - a[0] for a, b in zip(eP, eP[1:])), default=None)
        gJ = max((b[0] - a[0] for a, b in zip(eJ, eJ[1:])), default=None)
        r = dict(k=k, on=on, hold=hold, outras=outras, sync_start=st,
                 sP=(len(iP), round(max(iP), 1) if iP else None, sum(1 for x in iP if x > 100)),
                 sJ=(len(iJ), round(max(iJ), 1) if iJ else None, sum(1 for x in iJ if x > 100)),
                 uP=(len(eP), gP, (eP[-1][1] - eP[0][1]) if len(eP) > 1 else 0),
                 uJ=(len(eJ), gJ, (eJ[-1][1] - eJ[0][1]) if len(eJ) > 1 else 0))
        res.append(r)
        p(f"    net online {on} · hold-stage {hold} · outras {outras} · sync start {st}")
        p(f"    SENSOR (quadros · maior intervalo ms · > 100 ms): piso {r['sP']} · janela {r['sJ']}")
        p(f"    UIAUTOMATOR (eventos · maior lacuna ms · andou px): piso {r['uP']} · janela {r['uJ']}")
        tocar("auto-scroll")
    vazio = any(r["sP"][0] == 0 or r["sJ"][0] == 0 or r["uP"][0] == 0 or r["uJ"][0] == 0 for r in res)
    linhas_ok = all(r["hold"] == r["on"] and r["on"] >= 1 and not r["outras"] and r["sync_start"] == 0 for r in res)
    import statistics as st_
    if not vazio:
        p("RESUMO (n = 5, dev client, AVD — indicação, não referência):")
        p(f"  sensor, maior intervalo: piso mediana {st_.median(r['sP'][1] for r in res)} ms · janela mediana {st_.median(r['sJ'][1] for r in res)} ms")
        p(f"  sensor, > 100 ms: piso mediana {st_.median(r['sP'][2] for r in res)} · janela mediana {st_.median(r['sJ'][2] for r in res)}")
        p(f"  uiautomator, maior lacuna: piso mediana {st_.median(r['uP'][1] for r in res)} ms · janela mediana {st_.median(r['uJ'][1] for r in res)} ms")
    else:
        p("  ✗ PISO ou JANELA VAZIOS num dos instrumentos (SY-D55 (1))")
    p(f"VEREDITO das linhas: {'uma hold-stage por net online, nenhum sync, em 5 de 5 ✓' if linhas_ok else 'NÃO ✗'}")
    tocar("sair")
    esperar(t0, "sync ok", 30)
    quieto(t0)
    p(f"  ao sair: {[l for _, l in linhas(t0) if l.startswith('sync trigger reason=stage-exit')]} · {[l for _, l in linhas(t0) if l.startswith('sync ok')][-1:]}")
    return linhas_ok and not vazio


CENARIOS = {
    "c01": c_abrir_e_rede, "c02": c_intervalo, "c03": c_fundo_curto, "c04": c_fundo_longo, "c05": c_tela_apagada,
    "c06": c_rede_no_fundo, "c06b": c_rede_no_fundo_n,
    "c07": lambda: c_falha("c07-falha-status", "a falha por status (500) com cache, em S1", "500-pagina-1", ["sync trigger reason=foreground decision=run"], 2, 30),
    "c08": lambda: c_falha("c08-falha-rede", "a falha por rede (o mock derrubado) com cache, em S1", "fora", ["sync trigger reason=foreground decision=run"], 0, 30),
    "c09": lambda: c_falha("c09-falha-prazo", "a falha por prazo (o mock no atraso) com cache, em S1", "atraso", ["sync trigger reason=foreground decision=run"], 0, 40),
    "c10": c_banner_some, "c11": c_rolagem, "c12": c_busca_da_l, "c13": c_reordenar, "c14": c_palco,
    "c14b": c_rolagem_no_palco, "c14c": c_rolagem_no_palco_2, "c18b": c_de_novo_rapido,
    "c15": c_palco_falha, "c16": c_v, "c17": c_avulso, "c18": c_de_novo,
}

if __name__ == "__main__":
    res = {}
    try:
        mock("normal")
        for c in sys.argv[3:]:
            try:
                res[c] = CENARIOS[c]()
            except Exception as e:  # o cenário que cai se registra; os seguintes rodam
                p(f"  ✗ o cenário {c} LANÇOU: {e!r}")
                res[c] = False
    finally:
        mock("fora")
    rel = open(os.path.join(SAIDA, "resumo.txt"), "a")
    for c, ok in res.items():
        p(f"{c}: {'confere' if ok else 'NÃO confere'}")

#!/usr/bin/env python3
"""SY-PR3 — A FOTO NA TELA DE VERDADE (o 4.2; A-SY-6, A-SY-7, A-SY-8, A-SY-17): o que o `native-tela` não vê — a
`Navigation` real, a geometria, o `uiautomator`. Instrumento de anexo (fora de CI, N4-D117). O sync se dispara pela
MESMA função que o *Tentar novamente* chama (`SY-PR2-anexos/instrumentos/avd/pedir-pelo-botao.mjs`): sem gatilhos (PR-4),
é o único jeito de um sync acontecer com o palco aberto sem o `atraso` (que o prazo da PR-2 derruba).

Uso (da raiz; Metro com o bundle da PR, túneis 8081/8788/8790, o servidor de arquivos de pé, o cache da conta TIRADO):
  python3 foto.py <serial> <dir-saida> <dir-fixture-foto>

Os passos (cada um com dump; o texto é de fixture do projeto, regra 10):
  A  palco aberto na 3 (a "Letra longa"), rolagem ligada; o sync traz y → o corpo, o título, a nota da posição e a barra
     iguais; a rolagem ligada e sem volta ao topo
  B  o índice do palco (a foto: 8 posições, o nome de antes; e o título da 3, como ele aparece); o salto pelo índice à 3:
     a setlist da foto (3 DE 8), o conteúdo da abertura nova
  C  a busca do palco: a seção da setlist com a foto
  D  o fim: o total e o nome da foto
  E  sair a S1 e reentrar: a setlist nova (3 DE 9, o nome novo)
  F  V aberta na 3, e o sync traz z: o texto igual; favoritar em V → a estrela muda
  G  a setlist apagada (w) com o palco aberto: o palco segue; S1 sem ela ao sair
  H  a música da posição 3 apagada (m) com o palco aberto na 3: o corpo segue, com a última versão vista
  I  (saiu desta forma: o dump não dá a rolagem — div. 1289) a âncora do QL com a foto se mede pelo arnês do QL,
     `QL-PR4-anexos/instrumentos/ql4.py ancora ancorav` + `ancora4.ts`, sobre o bundle da PR
  J  (SY-PR3, a leitura do prefetch) o palco aberto na 6 (a partitura de 12 páginas); o sync traz v (a 6 aponta a
     `partitura-1p.pdf`): a tela segue com o arquivo da abertura; o que se baixa com a música aberta, pelo logcat
"""
import json
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET

# SY-PR3, o conserto do instrumento (div. 1289, antes de qualquer conclusão): (1) o nó `corpo` traz o texto INTEIRO do
# corpo, com as quebras do leitor — a versão se reconhece pelo texto sem espaço nem quebra, não por linha lógica; (2) a
# rolagem se lê do `uiautomator events` (o `ScrollY`, o instrumento da SY-PR1), porque o dump não dá a posição; (3) o
# nome da setlist a barra desenha em MAIÚSCULAS — as buscas de texto são sem caixa; (4) a busca do palco ganha critério.

ADB = os.path.expanduser("~/Library/Android/sdk/platform-tools/adb")
RAIZ = os.getcwd()
ACEITE = os.path.join(RAIZ, "apps/native/src/fixtures/aceite.py")
PEDIR = os.path.join(RAIZ, "docs/native/SY-PR2-anexos/instrumentos/avd/pedir-pelo-botao.mjs")
PKG = "rocks.octavia.app"
LINK = "exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
PORTA = os.environ.get("PORTA", "8788")  # o mock deste aparelho (Tab 8789, um por aparelho; APARATO, "Metro e mock")
serial, saida, fx = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(saida, exist_ok=True)
rel = open(os.path.join(saida, "foto.txt"), "w")
SL8 = json.load(open(os.path.join(fx, "x", "setlists.json")))[0]["id"][:8]
X = json.load(open(os.path.join(fx, "x", "content.json")))
ALVO = next(c for c in X if c["title"] == "Letra longa da fixture")
def _corpo_da_versao(v: str) -> str:
    cs = json.load(open(os.path.join(fx, v, "content.json")))
    return "".join(next(c for c in cs if c["id"] == ALVO["id"])["content_data"]["lyrics"].split())
CORPOS = {v: _corpo_da_versao(v) for v in ("x", "y", "z")}
resultado: list[tuple[str, bool, str]] = []


def p(s: str) -> None:
    print(s, flush=True)
    rel.write(s + "\n")
    rel.flush()


def adb(*a: str) -> str:
    return subprocess.run([ADB, "-s", serial, *a], capture_output=True, text=True).stdout


def agora() -> int:
    return int(adb("shell", "date +%s%3N").strip())


def dump(nome: str | None = None) -> ET.Element:
    for _ in range(6):
        adb("shell", "rm -f /sdcard/sy-foto.xml; uiautomator dump /sdcard/sy-foto.xml")
        xml = adb("exec-out", "cat /sdcard/sy-foto.xml")
        try:
            r = ET.fromstring(xml)
        except ET.ParseError:
            time.sleep(0.5)
            continue
        if nome:
            open(os.path.join(saida, f"{nome}.xml"), "w").write(xml)
        return r
    return ET.fromstring("<hierarchy/>")


def no(r: ET.Element, rid: str) -> ET.Element | None:
    return next((n for n in r.iter("node") if n.get("resource-id") == rid), None)


def textos(r: ET.Element | None) -> list[str]:
    return [] if r is None else [n.get("text", "") for n in r.iter("node") if n.get("text")]


def centro(n: ET.Element) -> tuple[int, int]:
    x0, y0, x1, y1 = map(int, re.findall(r"\d+", n.get("bounds", "")))
    return (x0 + x1) // 2, (y0 + y1) // 2


def tocar(rid: str = "", texto: str = "", tent: int = 30) -> None:
    for _ in range(tent):
        r = dump()
        alvo = no(r, rid) if rid else next((n for n in r.iter("node") if n.get("text") == texto), None)
        if alvo is not None:
            x, y = centro(alvo)
            adb("shell", "input", "tap", str(x), str(y))
            time.sleep(1.2)
            return
        time.sleep(0.5)
    raise SystemExit(f"PARA: '{rid or texto}' não apareceu")


def linhas_desde(t0: int) -> list[tuple[int, str]]:
    out = []
    for l in adb("logcat", "-d", "-v", "epoch", "-s", "ReactNativeJS").splitlines():
        m = re.match(r"\s*(\d+)\.(\d{3})\s.*?OCTAVIA: (.*)$", l)
        if m and int(m.group(1)) * 1000 + int(m.group(2)) >= t0:
            out.append((int(m.group(1)) * 1000 + int(m.group(2)), m.group(3)))
    return out


def esperar(t0: int, prefixo: str, lim: float = 40) -> int:
    fim = time.time() + lim
    while time.time() < fim:
        for t, l in linhas_desde(t0):
            if l.startswith(prefixo):
                return t
        time.sleep(0.4)
    raise SystemExit(f"PARA: '{prefixo}' não saiu em {lim} s")


def mock(v: str) -> None:
    subprocess.run(["pkill", "-f", f"aceite.py servidor {PORTA}"], capture_output=True)
    time.sleep(0.8)
    log = open(os.path.join(saida, "mock.log"), "a")
    subprocess.Popen([sys.executable, ACEITE, "servidor", PORTA, "normal", os.path.join(fx, v, "setlists.json"),
                      os.path.join(fx, v, "content.json")], stdout=log, stderr=log)
    time.sleep(1.2)


def sync(v: str) -> None:
    mock(v)
    t = agora()
    out = subprocess.run(["node", PEDIR, "pedir", "1", "0"], capture_output=True, text=True, cwd=RAIZ).stdout.strip()
    t_ok = esperar(t, "sync ok")
    p(f"  sync → {v}: {out} · sync ok em +{t_ok - t} ms")
    time.sleep(3)


def corpo_de(r: ET.Element) -> str:
    """De que versão é o corpo (o texto do nó `corpo` sem espaço nem quebra, contra o de cada versão da fixture)."""
    tudo = "".join("".join(textos(no(r, "corpo"))).split())
    return next((v for v, c in CORPOS.items() if tudo == c), "?" if tudo else "sem corpo")


def rolagem_com_sync(v: str, nome: str) -> tuple[list[int], list[int]]:
    """O `ScrollY` do palco antes e depois do sync que traz `v`, pelo `uiautomator events` (parado antes do dump)."""
    arq = os.path.join(saida, f"{nome}-eventos.txt")
    ev = open(arq, "w")
    pr = subprocess.Popen([ADB, "-s", serial, "shell", "uiautomator", "events"], stdout=ev, stderr=subprocess.STDOUT)
    time.sleep(4)
    ev.flush()
    corte = os.path.getsize(arq)
    sync(v)
    time.sleep(2)
    pr.terminate()
    pr.wait()
    adb("shell", "pkill", "-f", "uiautomator")
    ev.close()
    bruto = open(arq, "rb").read()
    def ys(b: bytes) -> list[int]:
        return [int(m) for m in re.findall(rb"TYPE_VIEW_SCROLLED.*?ScrollY: (\d+)", b)]
    return ys(bruto[:corte]), ys(bruto[corte:])


def barra(r: ET.Element) -> list[str]:
    return [t for t in textos(r) if " DE " in t or "ensaio" in t.lower() or "letra longa" in t.lower() or t.startswith("Nota:")]


def tem(r: ET.Element, s: str) -> bool:
    return any(s.lower() in t.lower() for t in textos(r))


def conferir(rot: str, ok: bool, como: str) -> None:
    resultado.append((rot, ok, como))
    p(f"  {'✓' if ok else '✗'} {rot} — {como}")


p(f"# foto.py — {time.strftime('%Y-%m-%d %H:%M:%S %z')} · {serial} · a setlist {SL8} · a música 3 {ALVO['id'][:8]}")
# ---------------------------------------------------------------------------------------------------------------- A
p("## A — o palco aberto na 3, a rolagem ligada; o sync traz y")
mock("x")
adb("shell", "am", "force-stop", PKG)
time.sleep(1)
t0 = agora()
adb("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{LINK}'", PKG)
esperar(t0, "sync ok", 60)
tocar(f"setlist-{SL8}")
tocar("song-3")
r0 = dump("A0-palco-antes")
tocar("auto-scroll")
yantes, ydepois = rolagem_com_sync("y", "A-rolagem")
r1 = dump("A1-palco-depois")
v0, v1 = corpo_de(r0), corpo_de(r1)
p(f"  barra antes:  {barra(r0)}")
p(f"  barra depois: {barra(r1)}")
p(f"  o corpo antes: versão {v0} · depois: versão {v1}")
p(f"  o ScrollY antes do sync: {len(yantes)} eventos, {yantes[:1]}…{yantes[-1:]} · depois: {len(ydepois)} eventos, {ydepois[:1]}…{ydepois[-1:]}")
rot1 = (no(r1, "auto-scroll") or ET.Element("x")).get("content-desc", "")
conferir("A-corpo", v0 == "x" and v1 == "x", f"o corpo antes e depois do sync é da versão {v0} → {v1} (a da abertura: x)")
conferir("A-barra-titulo-nota", barra(r0) == barra(r1), "a barra (n DE N, o nome), o título e a nota da posição iguais")
conferir("A-rolagem", "ligada" in rot1 and len(yantes) > 3 and len(ydepois) > 3 and 0 not in ydepois and ydepois[-1] > yantes[-1],
         f"a rolagem: '{rot1}'; o ScrollY depois do sync nunca 0 e segue subindo ({yantes[-1:]} → {ydepois[-1:]})")
tocar("auto-scroll")
# ---------------------------------------------------------------------------------------------------------------- B
p("## B — o índice do palco e o salto pelo índice")
tocar("indice")
r2 = dump("B0-indice")
pos = sorted(int(n.get("resource-id")[5:]) for n in r2.iter("node") if re.fullmatch(r"song-\d+", n.get("resource-id", "")))
t3 = [t for t in textos(no(r2, "song-3")) if "Letra longa" in t]
nome = [t for t in textos(r2) if "ensaio" in t.lower()]
p(f"  o índice: posições {pos} · o nome {nome} · o título da 3: {t3}")
conferir("B-indice-foto", pos == list(range(1, 9)) and len(nome) > 0 and not any("renomeada" in t.lower() for t in nome), f"o índice com a setlist da foto (8 posições, o nome de antes: {nome})")
p(f"  (registro, Q2) o título da 3 no índice do palco: {t3} — o palco abriu com 'Letra longa da fixture'")
tocar("song-3")
r3 = dump("B1-palco-pelo-indice")
v3 = corpo_de(r3)
p(f"  o palco depois do salto: barra {barra(r3)} · o corpo da versão {v3}")
conferir("B-salto-sem-foto-nova", any("3 DE 8" in t for t in barra(r3)) and tem(r3, "ensaio da quebra") and not tem(r3, "renomeada"), "o salto pelo índice não tira foto nova da setlist (3 DE 8, o nome de antes)")
conferir("B-salto-abertura", v3 == "y", f"o salto é uma abertura: o conteúdo de agora (versão {v3}; esperado y)")
# ---------------------------------------------------------------------------------------------------------------- C
p("## C — a busca do palco")
tocar("busca")
adb("shell", "input", "text", "Letra")
time.sleep(2)
r4 = dump("C0-busca")
p(f"  a busca: {[t for t in textos(r4) if 'setlist' in t.lower() or 'DE 8' in t or 'DE 9' in t or 'posição' in t.lower()][:8]}")
conferir("C-busca-foto", tem(r4, "nesta setlist") and tem(r4, "ensaio da quebra") and not tem(r4, "renomeada"), "a busca do palco com a setlist da foto (o nome de antes)")
tocar("fechar-busca")
# ---------------------------------------------------------------------------------------------------------------- D
p("## D — o fim")
tocar("indice")
tocar("song-8")
tocar("borda-avancar")
r5 = dump("D0-fim")
p(f"  o fim: {textos(r5)[:12]}")
conferir("D-fim-foto", tem(r5, "8 DE 8") and tem(r5, "ensaio da quebra") and not tem(r5, "renomeada"), "o fim com a foto (8 DE 8, o nome de antes)")
tocar("sair")
# ---------------------------------------------------------------------------------------------------------------- E
p("## E — sair a S1 e reentrar: a setlist nova")
tocar(f"setlist-{SL8}")
tocar("song-3")
r6 = dump("E0-palco-reentrada")
p(f"  o palco na reentrada: {barra(r6)}")
conferir("E-reentrada", any("3 DE 9" in t for t in barra(r6)) and tem(r6, "renomeada"), "a reentrada mostra a setlist nova (3 DE 9, o nome novo)")
tocar("sair")
# ---------------------------------------------------------------------------------------------------------------- F
p("## F — V aberta na 3; o sync traz z; o favoritar")
tocar("buscar")
tocar(texto="Letra longa da fixture, mudada no site")
r7 = dump("F0-v-antes")
sync("z")
r8 = dump("F1-v-depois")
tit7, tit8 = textos(no(r7, "view-titulo")), textos(no(r8, "view-titulo"))
conferir("F-v-texto", tit7 == tit8 and corpo_de(r7) == "y" and corpo_de(r8) == "y", f"o título {tit7} → {tit8}; o corpo da versão {corpo_de(r7)} → {corpo_de(r8)} (a da abertura: y)")
e0 = (no(r8, "view-favoritar") or ET.Element("x")).get("content-desc", "")
t9 = agora()
tocar("view-favoritar")
esperar(t9, "write op=")
time.sleep(1.5)
r9 = dump("F2-v-favoritada")
e1 = (no(r9, "view-favoritar") or ET.Element("x")).get("content-desc", "")
p(f"  a estrela: '{e0}' → '{e1}' · {[l for _, l in linhas_desde(t9) if l.startswith('write')]}")
conferir("F-estrela-viva", e0 != e1, "o favoritar em V aparece na hora (a estrela viva)")
tocar("view-voltar")
tocar("lib-voltar")
# ---------------------------------------------------------------------------------------------------------------- G
p("## G — a setlist apagada com o palco aberto")
tocar(f"setlist-{SL8}")
tocar("song-3")
sync("w")
r10 = dump("G0-palco-setlist-apagada")
conferir("G-palco-segue", no(r10, "corpo") is not None and not any("não está no cache" in t for t in textos(r10)), "o palco segue de pé (sem o placeholder 'não está no cache')")
tocar("sair")
r11 = dump("G1-s1-sem-a-setlist")
conferir("G-s1-sem-ela", no(r11, f"setlist-{SL8}") is None, "S1 sem a setlist ao sair, sem aviso")
# ---------------------------------------------------------------------------------------------------------------- H
p("## H — a música da posição 3 apagada com o palco aberto na 3")
sync("y")
tocar(f"setlist-{SL8}")
tocar("song-3")
r12a = dump("H0-palco-antes")
sync("m")
r12 = dump("H1-palco-musica-apagada")
# a última versão vista é a que o palco abriu — a z, se o favoritar do F (confirmado, `updated_at` do PUT) a segurou contra
# o sync da y (a `naoRegredir`): o critério é a MESMA de antes do apagado, não uma versão fixa (div. 1289, 2ª correção)
conferir("H-musica-apagada", no(r12, "placeholder") is None and corpo_de(r12a) in CORPOS and corpo_de(r12) == corpo_de(r12a), f"o corpo segue com a última versão vista ({corpo_de(r12a)} → {corpo_de(r12)}), sem placeholder")
# ---------------------------------------------------------------------------------------------------------------- J
p("## J — a partitura nova no site com o palco aberto nela (a leitura do prefetch; SY-D24)")
tocar("sair")
sync("x")
tocar(f"setlist-{SL8}")
tocar("song-6")
for _ in range(30):
    rj0 = dump()
    if no(rj0, "pagina") is not None:
        break
    time.sleep(1)
rj0 = dump("J0-partitura-antes")
pag0 = textos(no(rj0, "pagina")) or [(no(rj0, "pagina") or ET.Element("x")).get("content-desc", "")]
tj = agora()
sync("v")
time.sleep(5)
rj1 = dump("J1-partitura-depois")
pag1 = textos(no(rj1, "pagina")) or [(no(rj1, "pagina") or ET.Element("x")).get("content-desc", "")]
baixou = [l for _, l in linhas_desde(tj) if l.startswith(("file src=", "prefetch plan", "download-error", "pdf-render"))]
p(f"  a página antes: {pag0} · depois: {pag1}")
for l in baixou:
    p(f"    {l}")
conferir("J-tela-segue", pag0 == pag1 and pag0 != [""], "o palco segue com o arquivo da abertura (a mesma contagem de páginas)")
p(f"  (registro, não critério) com a música aberta saiu download de partitura-1p.pdf: {any('partitura-1p' in l and l.startswith('file src=download') for l in baixou)}")
tocar("sair")
p("")
p(f"## RESULTADO: {sum(1 for _, ok, _ in resultado if ok)} de {len(resultado)}")

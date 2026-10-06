#!/usr/bin/env python3
"""N4-PR7 — a biblioteca (L) no aparelho, estado a estado, com a fixture de ids distintos (`fixture-biblioteca.py`).

  SCR=<dir com mock/> ARVORE=<árvore> PREFIXO=<p> ROT=<r> [PORTA=<p>] \
      python3 biblioteca.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Cada estado começa do S1 (`ir_s1`, que re-sincroniza com o mock) e entra na L pelo `buscar` — o caminho do N4-R1.
Os toques nos controles da linha vão pelo NOME ACESSÍVEL (`Favoritar “…”`, `Tocar “…”`) e os do topo pelo `testID`.
Imprime as linhas `OCTAVIA:` que vieram depois de cada toque que conta (a regra do `APARATO.md`, "logcat").

Estados:
  base        L ao abrir: o dump, e `mInputShown` (N4-R2: abre sem teclado; nenhum nó com foco)
  rolagem     o mesmo, rolado até o fim: a régua e os filtros com o mesmo `bounds` (N4-R3)
  filtros     Tab marcado; Favoritas (1); Tab + "manha" (filtro sem resultado); Favoritas sem favorita (fixture da base)
  busca       "xablau" (sem resultado) e "ensaio" (com resultado)
  teclado     o toque no campo: o dump COM o teclado de pé e o topo do teclado pela região tocável do IME (N4-R2)
  tocar       termo + Cifra + rolagem → ▶ → o avulso (o nome do voltar) → o voltar → a L na mesma posição (N4-R16)
  favoritando o mock `escrita-lenta` com `OCTAVIA_MOCK_LENTA_S=8`: a estrela em voo, e depois do 200 (N4-R7)
  falhou      o mock `escrita-500`: a linha de aviso da espécie servidor (N4-R8)
  semRede     o avião (a prova é o `ping`): a estrela inerte e a P-F4 (N4-R9); e o N4-D92 — os arquivos apagados,
              aberto sem rede: *arquivo não baixado*, não *não consegui baixar*
  falhaCache  o mock `500-pagina-1`: a falha com o que está no aparelho (N4-R10)
  semCache    o store apagado: carregando (mock `atraso`), falha sem cache (`500-pagina-1`) e vazia (content `[]`)
"""
import json
import os
import re
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import roteiro as R  # noqa: E402

ADB = n3.ADB
PORTA = os.environ.get("PORTA", "8788")


def uid_de(s):
    """O uid do Firebase da sessão do aparelho (a pasta do cache é `files/octavia-<uid>`): o da última `auth uid=`."""
    us = [ln.split("uid=", 1)[1].split()[0] for ln in linhas_octavia(s) if ln.startswith("auth uid=")]
    if not us:
        raise RuntimeError("sem linha `auth uid=` no logcat")
    return us[-1]


def linhas_octavia(s):
    r = subprocess.run([ADB, "-s", s, "logcat", "-d", "-s", "ReactNativeJS"], capture_output=True, text=True)
    return [ln.split("OCTAVIA: ", 1)[1] for ln in r.stdout.splitlines() if "OCTAVIA: " in ln]


def mock_com(modo, content=None, env=None):
    """O `R.mock` com o content trocado (vazia) e com variáveis de ambiente (a janela do `escrita-lenta`)."""
    p = subprocess.run(["lsof", f"-tiTCP:{PORTA}", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split()
    for pid in p:
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    sl = os.path.join(R.SCR, "mock", "setlists.json")
    ct = content or os.path.join(R.SCR, "mock", "content.json")
    log = open(os.path.join(R.SCR, "mock", f"log-{modo}.txt"), "w")
    subprocess.Popen(["python3", os.path.join(R.ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", PORTA, modo, sl, ct],
                     stdout=log, stderr=log, env={**os.environ, **(env or {})})
    time.sleep(1.0)
    print(f"{time.strftime('%H:%M:%S')} mock modo={modo} content={os.path.basename(ct)} env={env}", flush=True)


def no(s, rid=None, texto=None):
    return n3.achar(n3.dump(s), rid, texto)


def bounds(s, rids):
    nos = n3.dump(s)
    return {r: (n3.achar(nos, rid=r) or {}).get("b") for r in rids}


class Biblioteca(R.Roteiro):
    def _abrir_l(self):
        R.ir_s1(self.s)
        n3.tap(self.s, rid="buscar", espera=2)
        R.esperar(self.s, rid="lib-campo")
        time.sleep(1.5)

    def _cap_com_teclado(self, tela, estado):
        """O `cap` sem esconder o teclado (o `Roteiro.cap` o esconde): o dump e o PNG com o IME de pé."""
        nome = f"{self.prefixo}-{tela}-{estado}-{self.sufixo}"
        r = subprocess.run([os.path.join(os.path.dirname(R.__file__), "cap.sh"), self.s, self.saida, nome],
                           capture_output=True, text=True)
        print(r.stdout.strip(), flush=True)
        self.feitos.append(nome)

    def _rolar(self):
        nos = n3.dump(self.s)
        lista = n3.achar(nos, rid="lib-lista")
        b = lista["b"]
        x = (b[0] + b[2]) // 2
        for _ in range(4):
            n3.sh(self.s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "300")
            time.sleep(0.8)

    def _ime(self):
        w = n3.sh(self.s, "shell", "dumpsys", "window", "windows")
        blocos = [blk for blk in w.split("Window #") if "InputMethod" in blk[:200]]
        m = re.search(r"touchable region=SkRegion\(\((\d+),(\d+),(\d+),(\d+)\)\)", blocos[0] if blocos else "")
        ime = re.findall(r"mInputShown=\w+", n3.sh(self.s, "shell", "dumpsys", "input_method"))
        return (m.groups() if m else None), ime

    # ---- os estados ----------------------------------------------------------
    def base(self):
        self._abrir_l()
        regiao, ime = self._ime()
        focado = [a.get("resource-id") for a in n3.dump(self.s) if a.get("focused") == "true"]
        print(f"N4-R2 ao abrir: {ime} · nós com foco: {focado}", flush=True)
        self.cap("L", "base")

    def rolagem(self):
        self._abrir_l()
        antes = bounds(self.s, ["lib-regua", "lib-filtro-letra", "lib-filtro-favoritas", "lib-campo", "lib-lista"])
        self._rolar()
        depois = bounds(self.s, ["lib-regua", "lib-filtro-letra", "lib-filtro-favoritas", "lib-campo", "lib-lista"])
        for k in antes:
            print(f"N4-R3 rolagem {k}: antes {antes[k]} depois {depois[k]} {'IGUAL' if antes[k] == depois[k] else 'MUDOU'}",
                  flush=True)
        self.cap("L", "rolagem-rolada")

    def filtros(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-filtro-tab", espera=1.5)
        self.cap("L", "filtro-tab")
        n3.tap(self.s, rid="lib-filtro-tab", espera=1)
        n3.tap(self.s, rid="lib-filtro-favoritas", espera=1.5)
        self.cap("L", "favoritas-1")
        n3.tap(self.s, rid="lib-filtro-favoritas", espera=1)
        n3.tap(self.s, rid="lib-filtro-tab", espera=1)
        n3.tap(self.s, rid="lib-campo")
        self.digitar("manha")
        self.cap("L", "filtro-sem-resultado")

    def busca(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("xablau")
        self.cap("L", "busca-sem-resultado")
        # o `apagar` fica sob o FAB do dev client (`APARATO.md`): limpa-se pelo teclado — o mesmo campo, o termo novo
        n3.tap(self.s, rid="lib-campo")
        n3.sh(self.s, "shell", "input", "keyevent", "KEYCODE_MOVE_END", *(["KEYCODE_DEL"] * 8))
        time.sleep(1)
        self.digitar("ensaio")
        self.cap("L", "busca-ensaio")

    def teclado(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo", espera=2.5)
        regiao, ime = self._ime()
        print(f"N4-R2 teclado: {ime} · região tocável do IME (px): {regiao}", flush=True)
        self._cap_com_teclado("L", "teclado")
        n3.esconder_teclado(self.s)

    def tocar(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("ensaio")
        n3.esconder_teclado(self.s)
        n3.tap(self.s, rid="lib-filtro-cifra", espera=1.5)
        self._rolar()
        self.cap("L", "antes-do-tocar")
        antes = [(a["id"], a.get("text", ""), a["b"]) for a in n3.dump(self.s) if a["id"].startswith("lib-") or a.get("text")]
        n0 = len(linhas_octavia(self.s))
        n3.tap(self.s, texto="Tocar “Segunda do ensaio”", espera=3)
        sair = R.esperar(self.s, rid="sair")
        print(f"o voltar do avulso: content-desc={sair.get('content-desc')!r}", flush=True)
        print("  log: " + " | ".join(linhas_octavia(self.s)[n0:]), flush=True)
        self.cap("S3", "avulso-da-biblioteca")
        n3.tap(self.s, rid="sair", espera=2.5)
        R.esperar(self.s, rid="lib-campo")
        self.cap("L", "depois-do-voltar")
        depois = [(a["id"], a.get("text", ""), a["b"]) for a in n3.dump(self.s) if a["id"].startswith("lib-") or a.get("text")]
        print(f"N4-R16 a mesma posição (termo, filtros, rolagem, nó a nó): {'IGUAL' if antes == depois else 'DIFERE'}"
              f" ({len(antes)} nós)", flush=True)
        if antes != depois:
            for a, b in zip(antes, depois):
                if a != b:
                    print(f"   {a} ≠ {b}", flush=True)

    def favoritando(self):
        mock_com("escrita-lenta", env={"OCTAVIA_MOCK_LENTA_S": "8"})
        self._abrir_l()
        n0 = len(linhas_octavia(self.s))
        n3.tap(self.s, texto="Favoritar “Manhã de ensaio”", espera=0.2)
        self.cap("L", "favoritando")
        time.sleep(9)
        self.cap("L", "favoritada")
        print("  log: " + " | ".join(linhas_octavia(self.s)[n0:]), flush=True)
        R.mock("normal")
        n1 = len(linhas_octavia(self.s))
        n3.tap(self.s, texto="Tirar “Manhã de ensaio” das favoritas", espera=3)
        print("  desfavoritar (devolve o estado da fixture): " + " | ".join(linhas_octavia(self.s)[n1:]), flush=True)

    def falhou(self):
        self._abrir_l()
        mock_com("escrita-500")
        n0 = len(linhas_octavia(self.s))
        n3.tap(self.s, texto="Favoritar “Manhã de ensaio”", espera=3)
        R.esperar(self.s, rid="aviso-motivo")
        print("  log: " + " | ".join(linhas_octavia(self.s)[n0:]), flush=True)
        self.cap("L", "favoritar-falhou-servidor")
        R.mock("normal")

    def semRede(self):
        self._abrir_l()
        R.aviao(self.s, True)
        r = subprocess.run([ADB, "-s", self.s, "shell", "ping", "-c", "1", "-W", "2", "8.8.8.8"], capture_output=True, text=True)
        print("ping: " + (r.stdout + r.stderr).strip()[-70:], flush=True)
        R.esperar(self.s, rid="aviso-motivo")
        self.cap("L", "sem-rede")
        n0 = len(linhas_octavia(self.s))
        n3.tap(self.s, texto="Favoritar “Águas de fixture”", espera=2)
        print("  o toque na estrela inerte, sem rede: " + (" | ".join(linhas_octavia(self.s)[n0:]) or "(nenhuma linha)"),
              flush=True)
        # N4-D92: os arquivos da fixture apagados, o app aberto já sem rede — o plano rejeita, e o estado é "não baixado"
        n3.sh(self.s, "shell", "am", "force-stop", "rocks.octavia.app")
        u = uid_de(self.s)
        n3.sh(self.s, "shell", f"run-as rocks.octavia.app sh -c 'rm -f files/octavia-{u}/files/* cache/octavia-{u}/files/*'")
        print("arquivos depois do rm: " + repr(n3.sh(self.s, "shell", f"run-as rocks.octavia.app sh -c 'ls files/octavia-{u}/files cache/octavia-{u}/files'", check=False)), flush=True)
        r = subprocess.run([ADB, "-s", self.s, "shell", "ping", "-c", "1", "-W", "2", "8.8.8.8"], capture_output=True, text=True)
        print("ping antes de abrir: " + (r.stdout + r.stderr).strip()[-70:], flush=True)
        R.ir_s1_ou_s0(self.s)
        R.rotacionar(self.s)
        R.esperar(self.s, rid="criar-setlist", prazo=60)
        n3.tap(self.s, rid="buscar", espera=3)
        R.esperar(self.s, rid="lib-campo")
        time.sleep(4)
        n3.tap(self.s, rid="lib-filtro-partitura", espera=1.5)
        estados = [x.get("text") for x in n3.dump(self.s) if x.get("text") in ("arquivo não baixado", "baixando o arquivo…", "não consegui baixar")]
        print(f"N4-D92 os estados de arquivo na L, aberta sem rede: {estados}", flush=True)
        self.cap("L", "sem-rede-arquivos-nao-baixados")
        R.aviao(self.s, False)

    def arquivos(self):
        """O controle do N4-D92, COM rede: as quatro partituras — o 404 dá *não consegui baixar*; a grande, baixando ou
        baixada; as outras, baixadas (sem frase)."""
        self._abrir_l()
        n3.tap(self.s, rid="lib-filtro-partitura", espera=1.5)
        estados = [(x.get("text")) for x in n3.dump(self.s)
                   if x.get("text") in ("arquivo não baixado", "baixando o arquivo…", "não consegui baixar")]
        print(f"com rede, as partituras: {estados}", flush=True)
        self.cap("L", "partituras-com-rede")

    def falhaCache(self):
        R.mock("500-pagina-1")
        self._abrir_l()
        R.esperar(self.s, rid="aviso-acao")
        self.cap("L", "falha-com-cache")
        R.mock("normal")

    def _store_apagado(self):
        n3.sh(self.s, "shell", "am", "force-stop", "rocks.octavia.app")
        n3.sh(self.s, "shell", f"run-as rocks.octavia.app sh -c 'rm -f files/octavia-{uid_de(self.s)}/*.json'")
        print("store: " + n3.sh(self.s, "shell", f"run-as rocks.octavia.app ls files/octavia-{uid_de(self.s)}").strip(), flush=True)

    def semCache(self):
        # carregando: o mock segura o GET (o `atraso`), e a L abre antes do primeiro 200
        self._store_apagado()
        R.mock("atraso")
        R.ir_s1_ou_s0(self.s)
        R.rotacionar(self.s)
        R.esperar(self.s, rid="buscar", prazo=30)
        n3.tap(self.s, rid="buscar", espera=2)
        R.esperar(self.s, rid="lib-carregando")
        self.cap("L", "carregando")
        # falha sem nada no aparelho
        self._store_apagado()
        R.mock("500-pagina-1")
        R.ir_s1_ou_s0(self.s)
        R.rotacionar(self.s)
        R.esperar(self.s, rid="buscar", prazo=30)
        n3.tap(self.s, rid="buscar", espera=2)
        R.esperar(self.s, rid="lib-falha-sem-cache")
        self.cap("L", "falha-sem-cache")
        # vazia: a conta sem música (o content `[]`)
        vazio = os.path.join(R.SCR, "mock", "content-vazio.json")
        open(vazio, "w").write("[]")
        mock_com("normal", content=vazio)
        self._abrir_l()
        R.esperar(self.s, rid="lib-vazia")
        self.cap("L", "vazia")
        R.mock("normal")
        R.ir_s1(self.s)


if __name__ == "__main__":
    serial, saida, sufixo = sys.argv[2], sys.argv[3], sys.argv[4]
    r = Biblioteca(serial, saida, os.environ.get("PREFIXO", "N4P7L"), sufixo)
    for nome in sys.argv[5:]:
        try:
            print(f"== {nome}", flush=True)
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001
            r.falhas.append(f"{nome}: {e}")
            print(f"FALHA {nome}: {e}", flush=True)
            try:
                R.aviao(serial, False)
                R.mock("normal")
            except Exception:  # noqa: BLE001
                pass
    print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
    for f in r.falhas:
        print("  " + f)

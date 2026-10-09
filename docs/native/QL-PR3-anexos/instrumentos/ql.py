#!/usr/bin/env python3
"""QL-PR3 — o leitor que quebra, no aparelho, estado a estado, com a fixture do QL (`fixture-ql.py`). Instrumento de
anexo (fora de CI, lint e typecheck, N4-D117).

  SCR=<dir com mock/> ARVORE=<árvore> PORTA=<p> PREFIXO=<p> \
      python3 ql.py <dir-instrumentos> <serial> <saida> <ap> <estados...>

`<dir-instrumentos>` tem as cópias do arnês das PRs anteriores (o `roteiro.py` do pre-check do N3 com a errata de
caminho, o `n3.py`, o `cap.sh`, a `biblioteca.py` da N4-PR7 e a `visualizacao.py` da N4-PR8). `<ap>` é `avd` ou `tab`:
dá a rotação de cada orientação (`APARATO.md`, "Rotação por aparelho": AVD paisagem 0 · retrato 1; Tab o inverso) e o
sufixo do nome (`<ap>-pai`, `<ap>-ret`). A orientação é posta AQUI, estado a estado (o `ROT` do roteiro fica vazio), e
conferida pela raiz do dump antes de gravar (caso 23: o nome é afirmação).

Estados — o palco abre pela setlist *Ensaio da quebra* (o cartão `setlist-0000000a`), a música pela posição:
  letra        a Letra (o custo.ts: 50 linhas, maior 77) — C e B no zoom 22; C e B no zoom 40
  cifra        a Cifra (o custo.ts: 20 pares, maior 50) — C e B no 22; B no 40
  claro        a Letra em B, tema claro (QL-D37: só as tintas trocam)
  acorde       a Cifra do acorde longo em B no zoom 40 (26 colunas): a linha que passa da coluna rola sozinha (QL-D45);
               a captura antes e depois de arrastar ESSA linha para o lado
  tab          a Tab em B no zoom 40 (R4: não quebra, rola)
  ancora       a Letra longa em B, rolada até o meio (a mão: arrastos), e então: o giro para C, um passo de zoom, o giro
               de volta a B — a cada mudança, a rolagem MEDIDA (`uiautomator events`: o `ScrollY` em px da rolagem
               vertical, um arquivo por passo) contra a PREVISTA (`ancora.ts`: a conta da âncora sobre a fixture)
  v            V da Letra, em C (55 colunas) e em B (48), aberta pela L (o toque na linha, N4-R6)
  gpar         o G-par de V no aparelho: o mock com os itens do `g-par.json`; o nó `corpo` de V × o retrato do site,
               pelo TEXTO LÓGICO (`ehQuebraDe`), em C e em B

Cada captura sai como `<saida>/<PREFIXO>-<tela>-<estado>-<ap>-<orient>.{png,xml}`, e cada uma passa pelo
`corpo-logico.mjs` contra o texto da fixture (o texto fica FORA do repositório, num arquivo do scratch: é texto do
projeto, mas o instrumento só imprime números). O texto de música de terceiro não aparece em lugar nenhum (regra 10).
"""
import html
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import biblioteca as Bi  # noqa: E402
import n3  # noqa: E402
import roteiro as R  # noqa: E402
import visualizacao as Vz  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
ADB = n3.ADB
ROT = {"avd": {"pai": "0", "ret": "1"}, "tab": {"pai": "1", "ret": "0"}}
F = 2.25  # tablet: 360 dpi
SETLIST = "setlist-0000000a"

sys.path.insert(0, AQUI)
import importlib.util as _u  # noqa: E402

_e = _u.spec_from_file_location("fixture_ql", os.path.join(AQUI, "fixture-ql.py"))
FQ = _u.module_from_spec(_e)
_e.loader.exec_module(FQ)
TEXTO = {1: FQ.LETRA, 2: FQ.CIFRA, 3: FQ.LETRA_LONGA, 4: FQ.CIFRA_ACORDE_LONGO, 5: FQ.TAB}
TIPO = {1: "Lyrics", 2: "Chords", 3: "Lyrics", 4: "Chords", 5: "Tab"}


def orientar(s, ap, o):
    n3.sh(s, "shell", "settings", "put", "system", "accelerometer_rotation", "0")
    n3.sh(s, "shell", "settings", "put", "system", "user_rotation", ROT[ap][o])
    time.sleep(2.5)


def node(*a):
    return subprocess.run(["node", *a], capture_output=True, text=True, cwd=R.ARVORE)


class QL(Vz.Visualizacao):
    def __init__(self, s, saida, prefixo, ap):
        super().__init__(s, saida, prefixo, f"{ap}-pai")
        self.ap = ap
        self.refs = os.path.join(R.SCR, "refs")
        os.makedirs(self.refs, exist_ok=True)
        for k, t in TEXTO.items():
            open(os.path.join(self.refs, f"musica-{k}.txt"), "w").write(t)

    # ---- o aparato -------------------------------------------------------------------------------------------------
    def capo(self, tela, estado, o, musica=None):
        """Captura na orientação `o` (`pai`/`ret`), conferida pela raiz; e o `corpo-logico.mjs` contra a música."""
        n3.esconder_teclado(self.s)
        time.sleep(0.8)
        nome = f"{self.prefixo}-{tela}-{estado}-{self.ap}-{o}"
        raiz = n3.dump(self.s)[0]["b"]
        if (raiz[2] > raiz[3]) != (o == "pai"):
            raise RuntimeError(f"ORIENTAÇÃO ERRADA para {nome}: raiz {raiz}")
        r = subprocess.run([os.path.join(os.path.dirname(R.__file__), "cap.sh"), self.s, self.saida, nome], capture_output=True, text=True)
        print(r.stdout.strip(), flush=True)
        self.feitos.append(nome)
        if musica is not None:
            c = node("apps/native/scripts/corpo-logico.mjs", os.path.join(self.saida, f"{nome}.xml"), "--referencia",
                     os.path.join(self.refs, f"musica-{musica}.txt"))
            print("   " + " | ".join(c.stdout.strip().splitlines()[-1:]) + (f" [exit {c.returncode}]" if c.returncode else ""), flush=True)

    def palco(self, musica, o):
        orientar(self.s, self.ap, o)
        R.ir_s1(self.s)
        no = R.esperar(self.s, rid=SETLIST)
        b = no["b"]
        n3.sh(self.s, "shell", "input", "tap", str(b[0] + 24), str(b[1] + 24))
        time.sleep(2)
        R.esperar(self.s, rid="picker-abrir")
        n3.tap(self.s, rid=f"song-{musica}", espera=3)
        R.esperar(self.s, rid="corpo")
        time.sleep(1.5)

    def zoom(self, passos):
        for _ in range(passos):
            n3.tap(self.s, rid="zoom-mais" if passos > 0 else "zoom-menos", espera=1.2)

    # ---- os estados ------------------------------------------------------------------------------------------------
    def letra(self):
        for o in ("pai", "ret"):
            self.palco(1, o)
            self.capo("S3", "letra-z22", o, 1)
            self.zoom(3)
            self.capo("S3", "letra-z40", o, 1)

    def cifra(self):
        for o in ("pai", "ret"):
            self.palco(2, o)
            self.capo("S3", "cifra-z22", o, 2)
        self.zoom(3)
        self.capo("S3", "cifra-z40", "ret", 2)

    def claro(self):
        self.palco(1, "ret")
        n3.tap(self.s, rid="tema", espera=1.5)
        self.capo("S3", "letra-claro", "ret", 1)
        n3.tap(self.s, rid="tema", espera=1)

    def acorde(self):
        self.palco(4, "ret")
        self.zoom(3)
        self.capo("S3", "acorde-z40", "ret", 4)
        # a linha que rola sozinha: o HorizontalScrollView sob o corpo que é mais estreito que o texto dele
        nos = n3.dump(self.s)
        hs = [a for a in nos if a.get("class", "").endswith("HorizontalScrollView") and a.get("scrollable") == "true"]
        print(f"   rolagens horizontais roláveis sob a tela: {len(hs)} · {[a['b'] for a in hs]}", flush=True)
        if hs:
            b = hs[0]["b"]
            y = (b[1] + b[3]) // 2
            # o arrasto no MEIO da tela: as bordas de 15 % do palco (`borda-voltar`, `borda-avancar`) ficam por cima do
            # corpo e pegam o toque que começa nelas (a primeira corrida começou ali, e a linha não rolou)
            larg = n3.dump(self.s)[0]["b"][2]
            n3.sh(self.s, "shell", "input", "swipe", str(int(larg * 0.7)), str(y), str(int(larg * 0.25)), str(y), "600")
            time.sleep(1.5)
            self.capo("S3", "acorde-z40-rolado", "ret", 4)

    def tab(self):
        self.palco(5, "ret")
        self.zoom(3)
        self.capo("S3", "tab-z40", "ret", 5)

    def ancora(self):
        """O giro e o zoom no meio da Letra longa; a rolagem medida por evento de acessibilidade.

        O `uiautomator events` segura a conexão de automação do aparelho: com ele de pé, o `uiautomator dump` seguinte
        não consegue a dele e o arquivo lido é o anterior (a primeira corrida gravou a raiz em retrato depois do giro). Por
        isso os eventos rodam SÓ durante cada mudança, num arquivo por passo, e param antes de cada captura."""
        base = os.path.join(self.saida, f"{self.prefixo}-ancora-{self.ap}")
        self.palco(3, "ret")
        nos = n3.dump(self.s)
        b = n3.achar(nos, rid="corpo")["b"]
        larg = nos[0]["b"][2]
        x = larg // 2  # o meio: as bordas de 15 % pegam o toque que começa nelas

        def passo(rotulo, acao, espera):
            ev = subprocess.Popen([ADB, "-s", self.s, "shell", "uiautomator", "events"], stdout=open(f"{base}-{rotulo}.txt", "w"),
                                  stderr=subprocess.STDOUT)
            time.sleep(2)
            acao()
            time.sleep(espera)
            ev.terminate()
            ev.wait()
            subprocess.run([ADB, "-s", self.s, "shell", "pkill", "-f", "uiautomator"], capture_output=True)
            time.sleep(1.5)

        def rolar():
            for _ in range(3):
                n3.sh(self.s, "shell", "input", "swipe", str(x), str(b[3] - 80), str(x), str(b[1] + 120), "600")
                time.sleep(1.2)

        passo("antes", rolar, 2)
        self.capo("S3", "ancora-antes", "ret", 3)
        passo("giro-C", lambda: orientar(self.s, self.ap, "pai"), 3)
        self.capo("S3", "ancora-giro", "pai", 3)
        passo("zoom-26", lambda: self.zoom(1), 2)
        self.capo("S3", "ancora-zoom", "pai", 3)
        passo("volta-B", lambda: orientar(self.s, self.ap, "ret"), 3)
        self.capo("S3", "ancora-volta", "ret", 3)

        def auto():  # a rolagem automática continua do ponto ancorado (QL-D18)
            n3.tap(self.s, rid="auto-scroll", espera=3)
            n3.tap(self.s, rid="auto-scroll", espera=0.5)

        passo("auto", auto, 1)

    def v(self):
        for o in ("pai", "ret"):
            orientar(self.s, self.ap, o)
            self._abrir_v("Lanterna", "Lanterna da fixture")
            self.capo("V", "letra", o, 1)
            self._colunas()

    def gpar(self):
        site = json.load(open(os.path.join(R.ARVORE, "packages/core/fixtures/g-par-site.json")))["itens"]
        ct = os.path.join(R.SCR, "mock", "content-gpar.json")
        itens = json.load(open(ct))
        Bi.mock_com("normal", content=ct)
        try:
            for o in ("pai", "ret"):
                orientar(self.s, self.ap, o)
                iguais, diferentes, quebras = 0, [], 0
                for c in itens:
                    gid = c["gpar_id"]
                    if gid not in site:
                        continue
                    self._abrir_v(c["title"], c["title"])
                    if site[gid]["classe"] == "arquivo":
                        R.esperar(self.s, rid="view-pdf", prazo=30)
                    nome = f"{self.prefixo}-V-gpar-{gid}-{self.ap}-{o}"
                    subprocess.run([os.path.join(os.path.dirname(R.__file__), "cap.sh"), self.s, self.saida, nome], capture_output=True)
                    nos = n3.dump(self.s)
                    corpo = n3.achar(nos, rid="corpo")
                    s = site[gid]
                    if corpo is not None:
                        ref = os.path.join(self.refs, f"gpar-{gid}.txt")
                        if s["classe"] == "texto":
                            open(ref, "w").write(s["texto"])
                        r = node("apps/native/scripts/corpo-logico.mjs", os.path.join(self.saida, f"{nome}.xml"), "--referencia", ref) if s["classe"] == "texto" else None
                        ok = r is not None and r.returncode == 0
                        cont = 0
                        if ok:
                            ult = r.stdout.strip().splitlines()[-1]
                            cont = int(ult.split("·")[-1].split("continuações")[0].strip()) if "continuações" in ult else 0
                        tam = "texto"
                    elif n3.achar(nos, rid="view-pdf") is not None:
                        ok, cont, tam = s["classe"] == "arquivo", 0, "arquivo"
                    else:
                        ok, cont, tam = s["classe"] == "sem-corpo", 0, "sem-corpo"
                    iguais += ok
                    quebras += cont
                    if not ok:
                        diferentes.append(gid)
                    print(f"  {'IGUAL    ' if ok else 'DIFERENTE'} {gid:28} site={s['classe']:9} V(aparelho)={tam:9} continuações={cont}", flush=True)
                print(f"G-par da visualização NO APARELHO [{self.ap}-{o}] — pares {iguais + len(diferentes)} · iguais {iguais} · "
                      f"diferentes {len(diferentes)} {diferentes} · continuações vistas {quebras}", flush=True)
        finally:
            R.mock("normal")


if __name__ == "__main__":
    serial, saida, ap = sys.argv[2], sys.argv[3], sys.argv[4]
    os.environ.pop("ROT", None)
    r = QL(serial, saida, os.environ.get("PREFIXO", "QL3Q"), ap)
    for nome in sys.argv[5:]:
        try:
            print(f"== {nome} {time.strftime('%H:%M:%S')}", flush=True)
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001 — registra e segue
            r.falhas.append(f"{nome}: {e}")
            print(f"FALHA {nome}: {e}", flush=True)
    print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
    for f in r.falhas:
        print("  " + f)

#!/usr/bin/env python3
"""QL-PR4 — as notas da música no palco, o estado lembrado e a âncora (com as notas e em V), no aparelho, com a fixture
do QL com nota (`fixture-ql4.py`). Instrumento de anexo (fora de CI, lint e typecheck, N4-D117). Estende o `ql.py` da
QL-PR3 (as mesmas cópias do arnês das PRs anteriores; a orientação posta e conferida pela raiz, estado a estado).

  SCR=<dir com mock/> ARVORE=<árvore> PORTA=<p> PREFIXO=<p> python3 ql4.py <dir-instrumentos> <serial> <saida> <ap> <estados...>

Estados — o palco abre pela setlist *Ensaio da quebra*, a música pela posição (1 a Lanterna, COM nota; 2 a Cifra, SEM
nota; 3 a Letra longa, COM nota):
  notas     a Lanterna em C e em B: abertas · recolhidas (o toque na régua), nos dois temas; a longa no zoom 40 (abertas);
            no fim, ABERTAS de novo (o aparelho volta sem a chave)
  semnota   a Cifra em C e em B: nenhum nó das notas
  avulso    a Lanterna no palco avulso (a biblioteca → V → ▶), em C
  reabrir   A-QL-18: recolher, mudar o zoom e o tema, `force-stop`, abrir de novo, a Lanterna: recolhidas; o zoom e o tema
            no padrão; e abrir de novo as notas (a chave sai)
  ancora    a Letra longa, com as notas ABERTAS e depois RECOLHIDAS: o começo do corpo medido com a rolagem no topo em
            cada passo (B 22 · C 22 · C 26 · B 26), e o roteiro da QL-PR3 (rolar ao meio, girar para C, zoom, girar para
            B, a rolagem automática) com os eventos; mais a marca DENTRO das notas (QL-D52): um arrasto curto e o giro
  ancorav   V da Letra longa: o começo do corpo de V em B medido no topo; C rolado ao meio → B → C, com os eventos; e a
            marca nos Detalhes (B) → C (QL-D52)
  antes     (com o código da `main`) a Lanterna em C e em B, escuro e claro, e no zoom 40 — o par das capturas `notas-*`
  bordas    QL-D56: o toque na divisa, no rótulo e no meio da régua (`input tap` no centro de cada um), em C e B, nos dois
            temas — cada um recolhe ou abre e a posição ("3 DE 8") não muda; e o controle: a borda sobre a letra avança
  foratexto QL-D58: o PDF (a 6, o S3d) com as notas, o toque na régua sobre ele, a página virando por um deslize no meio;
            o formato (a 7) e o S3e (a 8, o 404) com as notas
  paginacao QL-D58: os deslizes no meio da página do PDF até a página 2, com as notas abertas e recolhidas, em C e B
  medidas   a régua, o rótulo, a divisa, o fio e os parágrafos das notas, pelo dump, em C e em B (dp)

As capturas: `<saida>/<PREFIXO>-<tela>-<estado>-<ap>-<orient>.{png,xml}`. O plano da âncora (o começo do corpo de cada
passo e os arquivos de eventos) sai em `<saida>/<PREFIXO>-<roteiro>-<ap>.plano.json`, para o `ancora4.ts`.
"""
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import ql  # noqa: E402
import roteiro as R  # noqa: E402

ADB = n3.ADB
F = 2.25
ROT = ql.ROT


def faixa_de(ap, o):
    return "C" if o == "pai" else "B"


class QL4(ql.QL):
    def __init__(self, s, saida, prefixo, ap):
        super().__init__(s, saida, prefixo, ap)
        # as referências do `corpo-logico.mjs` são as do ql.py (o mesmo texto da fixture do QL)

    # ---- ajudas ----------------------------------------------------------------------------------------------------
    def notas_estado(self):
        nos = n3.dump(self.s)
        regua = n3.achar(nos, rid="notas-regua")
        texto = n3.achar(nos, rid="notas-texto")
        return nos, regua, texto

    def garantir(self, abertas):
        """Põe as notas no estado pedido pelo toque na régua (lido no dump: o texto à vista ou não)."""
        _, regua, texto = self.notas_estado()
        if regua is None:
            raise RuntimeError("sem a régua das notas")
        if (texto is not None) != abertas:
            n3.tap(self.s, rid="notas-regua", espera=1.5)
            _, _, texto = self.notas_estado()
            if (texto is not None) != abertas:
                raise RuntimeError(f"o toque na régua não deixou as notas {'abertas' if abertas else 'recolhidas'}")

    def inicio_px(self, contem=None):
        """O começo do corpo, em px, com a rolagem no topo: o topo do `corpo` menos o topo da rolagem vertical que o
        contém menos o respiro de 32 dp (72 px). Sem nada acima do corpo, 0."""
        nos = n3.dump(self.s)
        corpo = n3.achar(nos, rid="corpo")
        if corpo is None:
            raise RuntimeError("sem o corpo")
        rol = [a for a in nos if a.get("class", "").endswith("ScrollView") and not a.get("class", "").endswith("HorizontalScrollView")
               and a["b"][0] <= corpo["b"][0] and a["b"][1] <= corpo["b"][1] and a["b"][2] >= corpo["b"][2] - 2]
        if contem is not None:
            rol = [a for a in rol if a["id"] == contem] or rol
        r = rol[-1]
        leitor = n3.achar(nos, rid="view-leitor")
        if contem == "view-rolagem" and leitor is not None:
            # V em B: o corpo começa na borda de 1 dp do `view-leitor` — 2,25 px, que o dump do corpo arredonda (o 1º
            # AVD leu 461 em vez de 461,25 e deu Δ 0,6 px). O `y` do leitor é alinhado ao pixel (o Yoga), a borda não.
            return leitor["b"][1] - r["b"][1] + 1 * F, corpo["b"], r["b"]
        return corpo["b"][1] - r["b"][1] - round(32 * F), corpo["b"], r["b"]

    def eventos(self, base, rotulo, acao, espera):
        ev = subprocess.Popen([ADB, "-s", self.s, "shell", "uiautomator", "events"], stdout=open(f"{base}-{rotulo}.txt", "w"),
                              stderr=subprocess.STDOUT)
        time.sleep(2)
        acao()
        time.sleep(espera)
        ev.terminate()
        ev.wait()
        subprocess.run([ADB, "-s", self.s, "shell", "pkill", "-f", "uiautomator"], capture_output=True)
        time.sleep(1.5)

    # ---- os estados ------------------------------------------------------------------------------------------------
    def notas(self):
        for o in ("pai", "ret"):
            self.palco(1, o)
            self.garantir(True)
            self.capo("S3", "notas-abertas-escuro", o, 1)
            self.garantir(False)
            self.capo("S3", "notas-recolhidas-escuro", o, 1)
            n3.tap(self.s, rid="tema", espera=1.5)
            self.capo("S3", "notas-recolhidas-claro", o, 1)
            self.garantir(True)
            self.capo("S3", "notas-abertas-claro", o, 1)
            n3.tap(self.s, rid="tema", espera=1.2)
            self.zoom(3)
            self.capo("S3", "notas-longa-z40-escuro", o, 1)
        self.garantir(True)

    def antes(self):
        """O "antes" (com o código da `main`, sem notas no palco): a Lanterna em C e em B, nos dois temas, e no zoom 40 —
        as mesmas telas das capturas `notas-*`, para o par antes × depois."""
        for o in ("pai", "ret"):
            self.palco(1, o)
            self.capo("S3", "notas-abertas-escuro", o, 1)
            n3.tap(self.s, rid="tema", espera=1.5)
            self.capo("S3", "notas-abertas-claro", o, 1)
            n3.tap(self.s, rid="tema", espera=1.2)
            self.zoom(3)
            self.capo("S3", "notas-longa-z40-escuro", o, 1)

    # ---- a volta da PR-4 (QL-D56, QL-D58) ------------------------------------------------------------------------------
    def _posicao(self, nos):
        t = [a.get("text", "") for a in nos if " DE " in a.get("text", "") and a.get("text", "").split(" DE ")[0].isdigit()]
        return t[0] if t else "?"

    def _alvos_da_regua(self, nos):
        """Os três pontos da régua, em px: a divisa (o centro do SvgView dentro dela), o rótulo (o centro do TextView) e o
        meio (o centro da régua). E as bordas, para mostrar que as pontas caem nelas."""
        regua = n3.achar(nos, rid="notas-regua")["b"]
        dentro = [a for a in nos if a["b"][0] >= regua[0] and a["b"][2] <= regua[2] and a["b"][1] >= regua[1] and a["b"][3] <= regua[3]]
        svg = [a for a in dentro if a.get("class", "").endswith("SvgView")][0]["b"]
        rot = [a for a in dentro if a.get("class", "").endswith("TextView")][0]["b"]
        c = lambda b: ((b[0] + b[2]) // 2, (b[1] + b[3]) // 2)  # noqa: E731
        bv = n3.achar(nos, rid="borda-voltar")["b"]
        ba = n3.achar(nos, rid="borda-avancar")["b"]
        return {"divisa": c(svg), "rótulo": c(rot), "meio": c(regua)}, regua, bv, ba

    def _tocar_regua(self, rotulo_estado, o):
        """O toque na divisa, no rótulo e no meio: cada um alterna as notas e a posição não muda."""
        nos = n3.dump(self.s)
        alvos, regua, bv, ba = self._alvos_da_regua(nos)
        pos0 = self._posicao(nos)
        dentro = lambda p, b: b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]  # noqa: E731
        print(f"   [{faixa_de(self.ap, o)} {rotulo_estado}] régua {regua} · borda-voltar {bv} · borda-avancar {ba} · posição {pos0}", flush=True)
        ok = 0
        for nome, (x, y) in alvos.items():
            antes = n3.achar(n3.dump(self.s), rid="notas-texto") is not None
            n3.sh(self.s, "shell", "input", "tap", str(x), str(y))
            time.sleep(1.5)
            nos2 = n3.dump(self.s)
            depois = n3.achar(nos2, rid="notas-texto") is not None
            pos = self._posicao(nos2)
            na_borda = "borda-voltar" if dentro((x, y), bv) else "borda-avancar" if dentro((x, y), ba) else "fora das bordas"
            certo = depois != antes and pos == pos0
            ok += certo
            print(f"      toque no(a) {nome:7} @ {x},{y} px ({na_borda}): notas {'abertas' if antes else 'recolhidas'} → {'abertas' if depois else 'recolhidas'} · posição {pos0} → {pos} {'✓' if certo else '✗'}", flush=True)
        print(f"   [{faixa_de(self.ap, o)} {rotulo_estado}] {ok}/3 toques recolhem ou abrem sem trocar de música", flush=True)
        return ok

    def bordas(self):
        total = 0
        for o in ("pai", "ret"):
            for tema in ("escuro", "claro"):
                self.palco(3, o)
                if tema == "claro":
                    n3.tap(self.s, rid="tema", espera=1.5)
                self.garantir(True)
                self.capo("S3", f"bordas-regua-{tema}", o, 3)
                total += self._tocar_regua(tema, o)
                self.garantir(True)
        # o controle: a borda sobre a letra continua avançando
        self.palco(3, "pai")
        nos = n3.dump(self.s)
        ba = n3.achar(nos, rid="borda-avancar")["b"]
        corpo = n3.achar(nos, rid="corpo")["b"]
        x, y = (ba[0] + ba[2]) // 2, (corpo[1] + corpo[3]) // 2
        pos0 = self._posicao(nos)
        n3.sh(self.s, "shell", "input", "tap", str(x), str(y))
        time.sleep(2)
        print(f"   controle: a borda de avançar sobre a letra @ {x},{y} px: posição {pos0} → {self._posicao(n3.dump(self.s))}", flush=True)
        print(f"   bordas: {total}/12 toques na régua certos (C e B × escuro e claro × divisa, rótulo, meio)", flush=True)

    def foratexto(self):
        for o in ("pai", "ret"):
            # o PDF que baixa (o S3d), a 6
            self.palco_pos(6, o)
            R.esperar(self.s, rid="s3d", prazo=40)
            R.esperar(self.s, rid="pagina", prazo=30)
            time.sleep(2)
            self.garantir(True)
            nos = n3.dump(self.s)
            print(f"   [{faixa_de(self.ap, o)} PDF] {self._posicao(nos)} · página: {n3.achar(nos, rid='pagina').get('text')} · notas {n3.achar(nos, rid='notas')['b']} · s3d {n3.achar(nos, rid='s3d')['b']}", flush=True)
            self.capo("S3", "pdf-notas-abertas", o)
            self._tocar_regua("PDF", o)
            self.garantir(True)
            # a paginação do PDF: um deslize no meio da página (longe das bordas) vira a página
            s3d = n3.achar(n3.dump(self.s), rid="s3d")["b"]
            cx = (s3d[0] + s3d[2]) // 2
            n3.sh(self.s, "shell", "input", "swipe", str(cx), str(int(s3d[3] - 60)), str(cx), str(int(s3d[1] + 60)), "300")
            time.sleep(2)
            nos = n3.dump(self.s)
            print(f"   [{faixa_de(self.ap, o)} PDF] depois de um deslize no meio da página: página {n3.achar(nos, rid='pagina').get('text')} · {self._posicao(nos)}", flush=True)
            self.capo("S3", "pdf-notas-pagina", o)
            # o formato (a 7) e o S3e (a 8, o 404)
            for pos, nome, alvo in ((7, "formato-notas", "s3-formato"), (8, "s3e-notas", "s3e")):
                self.palco_pos(pos, o)
                R.esperar(self.s, rid=alvo, prazo=40)
                time.sleep(1.5)
                self.garantir(True)
                nos = n3.dump(self.s)
                print(f"   [{faixa_de(self.ap, o)} {alvo}] {self._posicao(nos)} · notas {n3.achar(nos, rid='notas')['b']} · {alvo} {n3.achar(nos, rid=alvo)['b']}", flush=True)
                self.capo("S3", nome, o)

    def paginacao(self):
        """A paginação do PDF com as notas acima (QL-D58): quantos deslizes no meio da página (longe das bordas) até a página
        2, com as notas abertas e recolhidas, em C e B. O `fitPolicy` de largura rola dentro da página antes de virar
        (`Leitor.tsx`): o número é o do aparelho, não uma regra."""
        for o in ("pai", "ret"):
            for abertas in (True, False):
                self.palco_pos(6, o)
                R.esperar(self.s, rid="s3d", prazo=40)
                R.esperar(self.s, rid="pagina", prazo=30)
                time.sleep(2)
                self.garantir(abertas)
                s3d = n3.achar(n3.dump(self.s), rid="s3d")["b"]
                cx = (s3d[0] + s3d[2]) // 2
                n = 0
                pag = n3.achar(n3.dump(self.s), rid="pagina").get("text")
                while n < 12 and pag.startswith("página 1 "):
                    n3.sh(self.s, "shell", "input", "swipe", str(cx), str(int(s3d[3] - 40)), str(cx), str(int(s3d[1] + 40)), "250")
                    n += 1
                    time.sleep(1.5)
                    pag = n3.achar(n3.dump(self.s), rid="pagina").get("text")
                print(f"   [{faixa_de(self.ap, o)} PDF, notas {'abertas' if abertas else 'recolhidas'}] área do PDF {s3d} px · {n} deslize(s) → {pag} · {self._posicao(n3.dump(self.s))}", flush=True)
        self.garantir(True)

    def palco_pos(self, musica, o):
        ql.orientar(self.s, self.ap, o)
        R.ir_s1(self.s)
        b = R.esperar(self.s, rid=ql.SETLIST)["b"]
        n3.sh(self.s, "shell", "input", "tap", str(b[0] + 24), str(b[1] + 24))
        time.sleep(2)
        R.esperar(self.s, rid="picker-abrir")
        n3.tap(self.s, rid=f"song-{musica}", espera=3)
        time.sleep(2)

    def semnota(self):
        for o in ("pai", "ret"):
            self.palco(2, o)
            nos = n3.dump(self.s)
            achou = [r for r in ("notas", "notas-regua", "notas-texto") if n3.achar(nos, rid=r) is not None]
            print(f"   sem nota [{o}]: nós das notas presentes: {achou or 'nenhum'}", flush=True)
            self.capo("S3", "sem-nota", o, 2)

    def avulso(self):
        ql.orientar(self.s, self.ap, "pai")
        self._abrir_v("Lanterna", "Lanterna da fixture")
        self._tocar_play()
        R.esperar(self.s, rid="corpo")
        time.sleep(1.5)
        nos = n3.dump(self.s)
        print(f"   avulso: a barra diz AVULSA? {n3.achar(nos, texto='AVULSA') is not None} · as notas: {n3.achar(nos, rid='notas-texto') is not None}", flush=True)
        self.capo("S3", "avulso-notas", "pai", 1)

    def reabrir(self):
        """A-QL-18 — recolher, mudar o zoom (+2) e o tema, matar o app, abrir de novo."""
        self.palco(1, "pai")
        self.garantir(False)
        self.zoom(2)
        n3.tap(self.s, rid="tema", espera=1.2)
        self.capo("S3", "reabrir-antes-do-kill", "pai", 1)
        print(f"{time.strftime('%H:%M:%S')} force-stop e abrir de novo (o ir_s1 do palco)", flush=True)
        self.palco(1, "pai")  # o `ir_s1` faz o force-stop e o deep link
        nos, regua, texto = self.notas_estado()
        print(f"   depois de reabrir: régua {'presente' if regua else 'AUSENTE'} · o texto das notas {'À VISTA' if texto else 'recolhido'}", flush=True)
        self.capo("S3", "reabrir-depois", "pai", 1)
        self.garantir(True)
        self.capo("S3", "reabrir-aberta-de-novo", "pai", 1)

    def _medir_inicios(self, musica, abertas):
        """O começo do corpo com a rolagem no topo, nos quatro passos do roteiro (B 22 · C 22 · C 26 · B 26)."""
        self.palco(musica, "ret")
        self.garantir(abertas)
        med = {}
        med["B22"] = self.inicio_px()
        ql.orientar(self.s, self.ap, "pai")
        time.sleep(1.5)
        med["C22"] = self.inicio_px()
        self.zoom(1)
        time.sleep(1)
        med["C26"] = self.inicio_px()
        ql.orientar(self.s, self.ap, "ret")
        time.sleep(1.5)
        med["B26"] = self.inicio_px()
        for k, (ini, c, r) in med.items():
            print(f"   o começo do corpo [{k}, notas {'abertas' if abertas else 'recolhidas'}]: {ini} px ({ini / F:.2f} dp) · corpo {c} · rolagem {r}", flush=True)
        return {k: v[0] for k, v in med.items()}

    def ancora(self):
        for abertas in (True, False):
            rot = f"ancora-{'abertas' if abertas else 'recolhidas'}"
            base = os.path.join(self.saida, f"{self.prefixo}-{rot}-{self.ap}")
            inicios = self._medir_inicios(3, abertas)
            self.palco(3, "ret")
            self.garantir(abertas)
            nos = n3.dump(self.s)
            b = n3.achar(nos, rid="corpo")["b"]
            larg = nos[0]["b"][2]
            alt = nos[0]["b"][3]
            x = larg // 2

            def rolar():
                for _ in range(3):
                    n3.sh(self.s, "shell", "input", "swipe", str(x), str(int(alt * 0.8)), str(x), str(int(alt * 0.25)), "600")
                    time.sleep(1.2)

            self.eventos(base, "antes", rolar, 2)
            self.capo("S3", f"{rot}-antes", "ret", 3)
            self.eventos(base, "giro-C", lambda: ql.orientar(self.s, self.ap, "pai"), 3)
            self.capo("S3", f"{rot}-giro", "pai", 3)
            self.eventos(base, "zoom-26", lambda: self.zoom(1), 2)
            self.capo("S3", f"{rot}-zoom", "pai", 3)
            self.eventos(base, "volta-B", lambda: ql.orientar(self.s, self.ap, "ret"), 3)
            self.capo("S3", f"{rot}-volta", "ret", 3)

            def auto():
                n3.tap(self.s, rid="auto-scroll", espera=3)
                n3.tap(self.s, rid="auto-scroll", espera=0.5)

            self.eventos(base, "auto", auto, 1)
            plano = {"texto": "Letra longa da fixture", "fator": F, "passos": [
                {"rotulo": "antes", "cols": 48, "zoom": 22, "o": "B", "inicio_px": inicios["B22"]},
                {"rotulo": "giro-C", "cols": 80, "zoom": 22, "o": "C", "inicio_px": inicios["C22"]},
                {"rotulo": "zoom-26", "cols": 68, "zoom": 26, "o": "C", "inicio_px": inicios["C26"]},
                {"rotulo": "volta-B", "cols": 41, "zoom": 26, "o": "B", "inicio_px": inicios["B26"]},
            ], "auto": True}
            json.dump(plano, open(f"{base}.plano.json", "w"), indent=1)
            # a marca DENTRO das notas (QL-D52): só com as abertas (recolhidas, a régua e o fio somam 73 dp)
            if abertas:
                baseN = os.path.join(self.saida, f"{self.prefixo}-ancora-nas-notas-{self.ap}")
                self.palco(3, "ret")
                self.garantir(True)
                curto = int(inicios["B22"] * 0.5)  # metade do começo do corpo: a marca fica nas notas
                y0 = int(alt * 0.6)

                def rolar_curto():
                    n3.sh(self.s, "shell", "input", "swipe", str(x), str(y0), str(x), str(y0 - curto), "1500")
                    time.sleep(1.5)

                self.eventos(baseN, "antes", rolar_curto, 2)
                self.capo("S3", "ancora-nas-notas-antes", "ret", 3)
                self.eventos(baseN, "giro-C", lambda: ql.orientar(self.s, self.ap, "pai"), 3)
                self.capo("S3", "ancora-nas-notas-giro", "pai", 3)
                json.dump({"texto": "Letra longa da fixture", "fator": F, "passos": [
                    {"rotulo": "antes", "cols": 48, "zoom": 22, "o": "B", "inicio_px": inicios["B22"]},
                    {"rotulo": "giro-C", "cols": 80, "zoom": 22, "o": "C", "inicio_px": inicios["C22"]},
                ], "auto": False}, open(f"{baseN}.plano.json", "w"), indent=1)

    def ancorav(self):
        # o começo do corpo de V em B, no topo (os Detalhes acima) e em C (0)
        ql.orientar(self.s, self.ap, "ret")
        self._abrir_v("Letra longa", "Letra longa da fixture")
        iniB = self.inicio_px("view-rolagem")
        ql.orientar(self.s, self.ap, "pai")
        time.sleep(2)
        iniC = self.inicio_px()
        print(f"   V: o começo do corpo em B {iniB[0]} px ({iniB[0] / F:.2f} dp; corpo {iniB[1]} · rolagem {iniB[2]}) · em C {iniC[0]} px", flush=True)
        base = os.path.join(self.saida, f"{self.prefixo}-ancorav-{self.ap}")
        # C: rolar o leitor (a coluna da direita) até o meio
        self._abrir_v("Letra longa", "Letra longa da fixture")
        nos = n3.dump(self.s)
        leitor = n3.achar(nos, rid="view-leitor")["b"]
        x = (leitor[0] + leitor[2]) // 2
        y1, y2 = int(leitor[1] + (leitor[3] - leitor[1]) * 0.85), int(leitor[1] + (leitor[3] - leitor[1]) * 0.2)

        def rolar():
            for _ in range(4):
                n3.sh(self.s, "shell", "input", "swipe", str(x), str(y1), str(x), str(y2), "600")
                time.sleep(1.2)

        self.eventos(base, "antes", rolar, 2)
        self.capo("V", "ancora-antes", "pai", 3)
        self.eventos(base, "giro-B", lambda: ql.orientar(self.s, self.ap, "ret"), 4)
        self.capo("V", "ancora-giro-B", "ret", 3)
        self.eventos(base, "volta-C", lambda: ql.orientar(self.s, self.ap, "pai"), 4)
        self.capo("V", "ancora-volta-C", "pai", 3)
        json.dump({"texto": "Letra longa da fixture", "fator": F, "passos": [
            {"rotulo": "antes", "cols": 55, "zoom": 22, "o": "C", "inicio_px": iniC[0]},
            {"rotulo": "giro-B", "cols": 48, "zoom": 22, "o": "B", "inicio_px": iniB[0]},
            {"rotulo": "volta-C", "cols": 55, "zoom": 22, "o": "C", "inicio_px": iniC[0]},
        ], "auto": False}, open(f"{base}.plano.json", "w"), indent=1)
        # a marca nos Detalhes (B) → C: o topo (QL-D52)
        baseD = os.path.join(self.saida, f"{self.prefixo}-ancorav-detalhes-{self.ap}")
        ql.orientar(self.s, self.ap, "ret")
        self._abrir_v("Letra longa", "Letra longa da fixture")
        nos = n3.dump(self.s)
        rol = n3.achar(nos, rid="view-rolagem")["b"]
        xr = (rol[0] + rol[2]) // 2
        curto = int(iniB[0] * 0.5)
        y0 = int(rol[1] + (rol[3] - rol[1]) * 0.6)
        self.eventos(baseD, "antes", lambda: n3.sh(self.s, "shell", "input", "swipe", str(xr), str(y0), str(xr), str(y0 - curto), "1500"), 2)
        self.capo("V", "ancora-detalhes-antes", "ret", 3)
        self.eventos(baseD, "giro-C", lambda: ql.orientar(self.s, self.ap, "pai"), 4)
        self.capo("V", "ancora-detalhes-giro", "pai", 3)
        json.dump({"texto": "Letra longa da fixture", "fator": F, "passos": [
            {"rotulo": "antes", "cols": 48, "zoom": 22, "o": "B", "inicio_px": iniB[0]},
            {"rotulo": "giro-C", "cols": 55, "zoom": 22, "o": "C", "inicio_px": iniC[0]},
        ], "auto": False}, open(f"{baseD}.plano.json", "w"), indent=1)

    def medidas(self):
        """As medidas das notas pelo dump (dp, uma casa): a régua (o alvo), o rótulo, o fio não tem nó (é View sem id), a
        divisa (o SvgView dentro da régua), o bloco, os parágrafos; e onde o corpo começa."""
        for o in ("pai", "ret"):
            self.palco(1, o)
            self.garantir(True)
            nos = n3.dump(self.s)
            d = lambda b: f"[{b[0] / F:.1f},{b[1] / F:.1f}][{b[2] / F:.1f},{b[3] / F:.1f}] {(b[2] - b[0]) / F:.1f} × {(b[3] - b[1]) / F:.1f}"  # noqa: E731
            bloco = n3.achar(nos, rid="notas")
            regua = n3.achar(nos, rid="notas-regua")
            texto = n3.achar(nos, rid="notas-texto")
            print(f"   [{faixa_de(self.ap, o)}] notas (o bloco) {d(bloco['b'])}", flush=True)
            print(f"   [{faixa_de(self.ap, o)}] a régua (o alvo) {d(regua['b'])} · content-desc={regua.get('content-desc')!r}", flush=True)
            dentro = [a for a in nos if a["b"][0] >= regua["b"][0] and a["b"][2] <= regua["b"][2] and a["b"][1] >= regua["b"][1] and a["b"][3] <= regua["b"][3] and a is not regua]
            for a in dentro:
                print(f"      {a.get('class', '').split('.')[-1]:16} {d(a['b'])}", flush=True)
            paras = [a for a in nos if a.get("class", "").endswith("TextView") and texto is not None and a["b"][1] >= texto["b"][1] and a["b"][3] <= texto["b"][3]]
            for a in paras:
                print(f"      parágrafo {d(a['b'])} · {len(a.get('text', ''))} caracteres", flush=True)
            ini = self.inicio_px()
            print(f"   [{faixa_de(self.ap, o)}] o corpo começa {ini[0] / F:.1f} dp abaixo do respiro (o bloco + 24 − 8)", flush=True)


if __name__ == "__main__":
    serial, saida, ap = sys.argv[2], sys.argv[3], sys.argv[4]
    os.environ.pop("ROT", None)
    r = QL4(serial, saida, os.environ.get("PREFIXO", "QL4Q"), ap)
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

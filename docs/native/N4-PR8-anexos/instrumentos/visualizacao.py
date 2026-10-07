#!/usr/bin/env python3
"""N4-PR8 — a visualização (V) no aparelho, estado a estado, com a fixture da visualização (`fixture-visualizacao.py`).

  SCR=<dir com mock/> ARVORE=<árvore> PREFIXO=<p> ROT=<r> [PORTA=<p>] \
      python3 visualizacao.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Cada estado começa do S1 (`ir_s1`, que re-sincroniza com o mock), entra na L pelo `buscar`, acha a música pelo CAMPO
(um termo que só ela tem — a lista em C mostra cinco linhas) e a abre pelo TOQUE NA LINHA, pelo nome acessível
*Ver “{título}”* (N4-R6, P-F7) — o caminho do músico. Imprime as linhas `OCTAVIA:` que vieram depois de cada toque que
conta (a regra do `APARATO.md`, "logcat"). O que apaga no aparelho: só o que a fixture criou, por nome
(`apagar_por_nome`, a regra da N4-PR7).

Estados (as molduras `N4-*-V-*`):
  letra cifra cifraSecoes tab partitura camposVazios semArtista tituloLongo tipoDesconhecido corpoVazio formato
  baixando     a `Partitura grande` com o arquivo apagado e o servidor lento (`arquivos-lentos.py`): *baixando…*
  naoBaixado   em avião (a prova é o `ping`), a música do `nao-existe.pdf`: o S3e com o Baixar de ícone
  falhou       com rede, a mesma: o 404 → *não consegui baixar* · *o servidor respondeu 404*
  favoritando  o mock `escrita-lenta` 8 s: a estrela em voo, e depois do 200 (N4-R7); e o desfavoritar que devolve
  falhouFav    o mock `escrita-500`: a linha de aviso da espécie servidor (N4-R8)
  semRede      o avião: a estrela inerte e a P-F4 (N4-R9); a leitura e o ▶ funcionam
  sairNoMeio   o favoritar em voo e o voltar no meio: o pedido continua, a L mostra o estado final, sem aviso (N4-R7)
  tocar        o ▶ → o avulso (o nome do voltar) → o voltar → V igual, nó a nó
  voltar       L com termo + filtro + rolagem → a linha → V → o voltar → L na mesma posição, nó a nó
  gpar         o G-par no aparelho: o mock com os itens do `g-par.json`; o nó `corpo` de V × o retrato do site
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

ADB = n3.ADB
RAIZ_REPO = R.ARVORE


def ping(s):
    r = subprocess.run([ADB, "-s", s, "shell", "ping", "-c", "1", "-W", "2", "8.8.8.8"], capture_output=True, text=True)
    return (r.stdout + r.stderr).strip().splitlines()[-1][-70:] if (r.stdout + r.stderr).strip() else "(nada)"


def log_desde(s, n0):
    return " | ".join(Bi.linhas_octavia(s)[n0:]) or "(nenhuma linha)"


class Visualizacao(Bi.Biblioteca):
    def _abrir_v(self, termo, titulo, l_ja_aberta=False):
        if not l_ja_aberta:
            self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar(termo)
        n3.esconder_teclado(self.s)
        time.sleep(0.8)
        n0 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, texto=f"Ver “{titulo}”", espera=2)
        R.esperar(self.s, rid="view-cabecalho")
        time.sleep(1.5)
        return n0

    def _tocar_play(self):
        """O ▶ de V fica no canto superior direito, SOB o FAB do dev client (`APARATO.md`, "O FAB do dev client"): o
        toque pelo centro abre o menu de desenvolvimento, e a margem esquerda (12 px) ainda cai nele. Toca-se pelo CANTO
        INFERIOR ESQUERDO do alvo (6 px à direita, 8 px acima da borda) — medido: abre o palco avulso."""
        b = n3.achar(n3.dump(self.s), rid="view-tocar")["b"]
        n3.sh(self.s, "shell", "input", "tap", str(b[0] + 6), str(b[3] - 8))
        print(f"{time.strftime('%H:%M:%S')} toque 'view-tocar' pelo canto @ {b[0] + 6},{b[3] - 8}", flush=True)
        time.sleep(3)

    def _cap_v(self, estado):
        self.cap("V", estado)

    def _colunas(self):
        """m14: as colunas visíveis do leitor — a rolagem horizontal do `corpo` (a janela do texto) ÷ o caractere."""
        nos = n3.dump(self.s)
        corpo = n3.achar(nos, rid="corpo")
        leitor = n3.achar(nos, rid="view-leitor")
        if corpo is None or leitor is None:
            return
        f = 2.625 if self.s == "emulator-5556" else 2.25
        # o pai horizontal do corpo: o nó `HorizontalScrollView` que contém o corpo
        hs = [a for a in nos if a.get("class", "").endswith("HorizontalScrollView")
              and a["b"][0] <= corpo["b"][0] and a["b"][1] <= corpo["b"][1] and a["b"][2] >= corpo["b"][0]]
        if hs:
            b = hs[-1]["b"]
            w = (b[2] - b[0]) / f
            print(f"m14 a janela do texto (HorizontalScrollView) {w:.1f} dp → {w / 13.3333:.1f} colunas de mono 22 "
                  f"(13,33 dp, a régua) · view-leitor {(leitor['b'][2] - leitor['b'][0]) / f:.1f} dp", flush=True)

    # ---- os estados de corpo e de campos --------------------------------------------------------------------
    def letra(self):
        self._abrir_v("Manha", "Manhã de ensaio")
        self._colunas()
        self._cap_v("letra")

    def cifra(self):
        self._abrir_v("Segunda", "Segunda do ensaio")
        self._cap_v("cifra")

    def cifraSecoes(self):
        self._abrir_v("Setima", "Sétima do ensaio")
        self._cap_v("cifra-secoes")

    def tab(self):
        self._abrir_v("Terceira", "Terceira do ensaio")
        self._cap_v("tab")

    def partitura(self):
        n0 = self._abrir_v("doze", "Partitura de doze páginas")
        R.esperar(self.s, rid="view-pdf", prazo=30)
        time.sleep(2)
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("partitura")

    def camposVazios(self):
        self._abrir_v("Oitava", "Oitava do ensaio")
        self._cap_v("campos-vazios")

    def semArtista(self):
        self._abrir_v("Decima", "Décima do ensaio")
        self._cap_v("sem-artista")

    def tituloLongo(self):
        self._abrir_v("comprido", "Uma música de título bem comprido, para medir o corte do título em retrato e no celular")
        self._cap_v("titulo-longo")

    def tipoDesconhecido(self):
        self._abrir_v("sem tipo", "Item sem tipo da fixture")
        self._cap_v("tipo-desconhecido")

    def corpoVazio(self):
        self._abrir_v("sem conteudo", "Item sem conteúdo da fixture")
        self._cap_v("corpo-vazio")

    def formato(self):
        n0 = self._abrir_v("escaneada", "Partitura escaneada de fixture")
        R.esperar(self.s, rid="view-formato")
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("formato")

    def baixando(self):
        # o arquivo grande apagado (por nome, nas duas pastas), e o servidor lento: o *baixando…* fica na tela
        n3.sh(self.s, "shell", "am", "force-stop", "rocks.octavia.app")
        u = Bi.uid_de(self.s)
        for pasta in (f"files/octavia-{u}/files", f"cache/octavia-{u}/files"):
            Bi.apagar_por_nome(self.s, pasta, ["partitura-grande.pdf"])
        n0 = self._abrir_v("grande", "Partitura grande da fixture")
        R.esperar(self.s, rid="view-baixando")
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("pdf-baixando")

    def naoBaixado(self):
        self._abrir_l()
        R.aviao(self.s, True)
        print("ping: " + ping(self.s), flush=True)
        n0 = self._abrir_v("nunca", "Partitura que nunca baixou", l_ja_aberta=True)
        R.esperar(self.s, rid="view-nao-baixado")
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("arquivo-nao-baixado")
        R.aviao(self.s, False)

    def falhou(self):
        n0 = self._abrir_v("nunca", "Partitura que nunca baixou")
        R.esperar(self.s, rid="view-falha", prazo=30)
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("arquivo-falhou")

    # ---- o favoritar, o sem rede, o ▶ e os voltar --------------------------------------------------------------
    def favoritando(self):
        Bi.mock_com("escrita-lenta", env={"OCTAVIA_MOCK_LENTA_S": "8"})
        self._abrir_v("Segunda", "Segunda do ensaio")
        n0 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, rid="view-favoritar", espera=0.2)
        self._cap_v("favoritando")
        time.sleep(9)
        self._cap_v("favoritada")
        print("  log: " + log_desde(self.s, n0), flush=True)
        R.mock("normal")
        n1 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, rid="view-favoritar", espera=3)
        print("  desfavoritar (devolve o estado da fixture): " + log_desde(self.s, n1), flush=True)

    def falhouFav(self):
        self._abrir_v("Segunda", "Segunda do ensaio")
        Bi.mock_com("escrita-500")
        n0 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, rid="view-favoritar", espera=3)
        R.esperar(self.s, rid="aviso-motivo")
        print("  log: " + log_desde(self.s, n0), flush=True)
        self._cap_v("favoritar-falhou-servidor")
        R.mock("normal")

    def semRede(self):
        self._abrir_v("Manha", "Manhã de ensaio")
        R.aviao(self.s, True)
        print("ping: " + ping(self.s), flush=True)
        R.esperar(self.s, rid="aviso-motivo")
        self._cap_v("sem-rede")
        n0 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, rid="view-favoritar", espera=2)
        print("  o toque na estrela inerte, sem rede: " + log_desde(self.s, n0), flush=True)
        self._tocar_play()
        sair = R.esperar(self.s, rid="sair")
        print(f"  sem rede, o ▶ abre o avulso: o voltar content-desc={sair.get('content-desc')!r}", flush=True)
        n3.tap(self.s, rid="sair", espera=2)
        R.aviao(self.s, False)

    def sairNoMeio(self):
        Bi.mock_com("escrita-lenta", env={"OCTAVIA_MOCK_LENTA_S": "8"})
        self._abrir_v("Segunda", "Segunda do ensaio")
        n0 = len(Bi.linhas_octavia(self.s))
        n3.tap(self.s, rid="view-favoritar", espera=0.3)
        n3.tap(self.s, rid="view-voltar", espera=1)
        R.esperar(self.s, rid="lib-campo")
        self.cap("L", "saiu-no-meio-em-voo")
        time.sleep(9)
        nos = n3.dump(self.s)
        estrela = [a.get("content-desc") for a in nos if a["id"].startswith("lib-favoritar-")]
        aviso = n3.achar(nos, rid="aviso-motivo")
        print(f"N4-R7 saiu de V no meio: a estrela na L = {estrela} · linha de aviso: {aviso is not None}", flush=True)
        print("  log: " + log_desde(self.s, n0), flush=True)
        self.cap("L", "saiu-no-meio-depois")
        R.mock("normal")
        n3.tap(self.s, texto="Tirar “Segunda do ensaio” das favoritas", espera=3)

    def tocar(self):
        self._abrir_v("Manha", "Manhã de ensaio")
        antes = [(a["id"], a.get("text", ""), a.get("content-desc", ""), a["b"]) for a in n3.dump(self.s)
                 if a["id"].startswith("view-") or a["id"] == "corpo"]
        n0 = len(Bi.linhas_octavia(self.s))
        self._tocar_play()
        sair = R.esperar(self.s, rid="sair")
        print(f"o voltar do avulso: content-desc={sair.get('content-desc')!r}", flush=True)
        print("  log: " + log_desde(self.s, n0), flush=True)
        self.cap("S3", "avulso-da-visualizacao")
        n3.tap(self.s, rid="sair", espera=2.5)
        R.esperar(self.s, rid="view-cabecalho")
        depois = [(a["id"], a.get("text", ""), a.get("content-desc", ""), a["b"]) for a in n3.dump(self.s)
                  if a["id"].startswith("view-") or a["id"] == "corpo"]
        print(f"N4-R16 a volta a V (nó a nó): {'IGUAL' if antes == depois else 'DIFERE'} ({len(antes)} nós)", flush=True)
        self._cap_v("depois-do-palco")

    def voltar(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("ensaio")
        n3.esconder_teclado(self.s)
        n3.tap(self.s, rid="lib-filtro-cifra", espera=1.5)
        self._rolar()
        self.cap("L", "antes-do-ver")
        antes = [(a["id"], a.get("text", ""), a["b"]) for a in n3.dump(self.s) if a["id"].startswith("lib-") or a.get("text")]
        alvo = [a for a in n3.dump(self.s) if a.get("content-desc", "").startswith("Ver “")][-1]
        print(f"a linha tocada: {alvo.get('content-desc')!r}", flush=True)
        b = alvo["b"]
        n3.sh(self.s, "shell", "input", "tap", str(b[0] + 40), str((b[1] + b[3]) // 2))
        R.esperar(self.s, rid="view-cabecalho")
        time.sleep(1)
        print(f"V aberta: {n3.achar(n3.dump(self.s), rid='view-titulo').get('text')!r} · o voltar content-desc="
              f"{n3.achar(n3.dump(self.s), rid='view-voltar').get('content-desc')!r}", flush=True)
        n3.tap(self.s, rid="view-voltar", espera=2.5)
        R.esperar(self.s, rid="lib-campo")
        depois = [(a["id"], a.get("text", ""), a["b"]) for a in n3.dump(self.s) if a["id"].startswith("lib-") or a.get("text")]
        print(f"o voltar de V: a L na mesma posição (termo, filtro, rolagem, nó a nó): "
              f"{'IGUAL' if antes == depois else 'DIFERE'} ({len(antes)} nós)", flush=True)
        if antes != depois:
            for x, y in zip(antes, depois):
                if x != y:
                    print(f"   {x} ≠ {y}", flush=True)
        self.cap("L", "depois-do-voltar-de-v")

    def linhasInvalidas(self):
        """O ▶ inerte na linha da L (o achado do Marcel, a borda da folha P-I2): os dois itens inválidos pelo campo."""
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("Item sem")
        n3.esconder_teclado(self.s)
        time.sleep(1)
        nos = n3.dump(self.s)
        print("  ▶ na L: " + str([(a["id"], a.get("enabled")) for a in nos if a["id"].startswith("lib-tocar-")]), flush=True)
        self.cap("L", "linhas-invalidas")

    # ---- o G-par no aparelho --------------------------------------------------------------------------------
    def gpar(self):
        site = json.load(open(os.path.join(RAIZ_REPO, "packages/core/fixtures/g-par-site.json")))["itens"]
        ct = os.path.join(R.SCR, "mock", "content-gpar.json")
        itens = json.load(open(ct))
        Bi.mock_com("normal", content=ct)
        iguais, diferentes = 0, []
        for c in itens:
            gid = c["gpar_id"]
            if gid not in site:
                continue
            self._abrir_v(c["title"], c["title"])
            if site[gid]["classe"] == "arquivo":
                R.esperar(self.s, rid="view-pdf", prazo=30)
            nos = n3.dump(self.s)
            corpo = n3.achar(nos, rid="corpo")
            if corpo is not None:
                v = {"classe": "texto", "texto": html.unescape(corpo.get("text", ""))}
            elif n3.achar(nos, rid="view-pdf") is not None:
                v = {"classe": "arquivo"}
            else:
                v = {"classe": "sem-corpo"}
            s = site[gid]
            ok = v["classe"] == s["classe"] and (v["classe"] != "texto" or v["texto"] == s["texto"])
            iguais += ok
            if not ok:
                diferentes.append(gid)
            tam = f"texto({len(v['texto'])})" if v["classe"] == "texto" else v["classe"]
            stam = f"texto({len(s['texto'])})" if s["classe"] == "texto" else s["classe"]
            print(f"  {'IGUAL    ' if ok else 'DIFERENTE'} {gid:28} site={stam:16} V(aparelho)={tam}", flush=True)
        print(f"G-par da visualização NO APARELHO — pares {iguais + len(diferentes)} · iguais {iguais} · "
              f"diferentes {len(diferentes)} {diferentes}", flush=True)
        R.mock("normal")


if __name__ == "__main__":
    serial, saida, sufixo = sys.argv[2], sys.argv[3], sys.argv[4]
    r = Visualizacao(serial, saida, os.environ.get("PREFIXO", "N4P8V"), sufixo)
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

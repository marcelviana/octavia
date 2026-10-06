#!/usr/bin/env python3
"""N4-PR6 — o palco avulso aberto de S1 (S1 → `Buscar música` → S4 → música), estado a estado.

  SCR=<dir> ARVORE=<árvore> PREFIXO=<p> ROT=<r> \
      python3 avulso.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

É o único caminho que alcança o palco avulso sem hospedeira no aparelho nesta PR (a L e a V
ainda não existem; `N4-REQUISITOS.md` §3, PR-6). Os estados são os das molduras
`N4-*-S3-avulso-*` e `N4-*-S4-avulso-sem-setlist` que a fixture do projeto alcança:

  letra        "Manhã de ensaio" (Letra, com artista) — e o claro, e a busca aberta do avulso
               (vazia e com o termo, a S4 sem *Nesta setlist*), e um resultado dela → o avulso
               dessa música → o voltar → a busca no mesmo termo e na mesma posição
  partitura    "Partitura de doze páginas" (o PDF do disco)
  naoBaixado   "Partitura que nunca baixou", com o avião (o S3e; o servidor dá 404)
  tituloLongo  a música de título comprido
  semArtista   "Décima do ensaio" (sem artista)
  zero         o mock com ZERO setlists (S1f): abrir o avulso pela busca (div. 1001)
  formato      só com a fixture do formato (`fixture-formato.py`): o avulso de um `.jpg`, e o
               palco COM setlist na mesma música (N4-D83)
  formatoSetlist  só o palco com setlist na música `.jpg` (o 2º caso do `formato`)

O id8 das músicas da fixture colide (todas `00000000…`, div. 1002): o resultado se toca pelo
TÍTULO, nunca pelo `resultado-<id8>`.

Cada passo imprime as linhas `OCTAVIA:` que vieram DEPOIS do toque que abriu o palco (a regra
do `APARATO.md`, "logcat": contar antes, ler o que veio depois — o buffer não se limpa no
meio da rodada), para o A-N4-16: *nenhum prefetch de outra música*.
"""
import os
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import roteiro as R  # noqa: E402

ADB = n3.ADB


def linhas_octavia(s):
    r = subprocess.run([ADB, "-s", s, "logcat", "-d", "-s", "ReactNativeJS"], capture_output=True, text=True)
    return [ln.split("OCTAVIA: ", 1)[1] for ln in r.stdout.splitlines() if "OCTAVIA: " in ln]


class Avulso(R.Roteiro):
    def _busca_de_s1(self):
        R.ir_s1(self.s)
        n3.tap(self.s, rid="buscar", espera=2)
        R.esperar(self.s, rid="campo-busca")

    def _abrir(self, termo, titulo, rotulo, espera=4.0):
        n3.tap(self.s, rid="campo-busca")
        self.digitar(termo)
        n3.esconder_teclado(self.s)
        antes = len(linhas_octavia(self.s))
        n3.tap(self.s, texto=titulo, espera=espera)
        R.esperar(self.s, rid="sair")
        novas = linhas_octavia(self.s)[antes:]
        print(f"{time.strftime('%H:%M:%S')} log depois de abrir {rotulo}: {len(novas)} linha(s)", flush=True)
        for ln in novas:
            print(f"    OCTAVIA: {ln}", flush=True)

    def letra(self):
        s = self.s
        self._busca_de_s1()
        self._abrir("manha", "Manhã de ensaio", "avulso-letra")
        self.cap("S3", "avulso-letra")
        n3.tap(s, rid="tema", espera=2)
        self.cap("S3", "avulso-claro")
        n3.tap(s, rid="tema", espera=1)
        # a busca aberta do avulso (N4-R17): vazia, e com o termo da base do G-inv
        n3.tap(s, rid="busca", espera=2)
        R.esperar(s, rid="campo-busca")
        self.cap("S4", "avulso-busca-vazio")
        n3.tap(s, rid="campo-busca")
        self.digitar("ensaio")
        self.cap("S4", "avulso-busca-resultados")
        # um resultado dela → o avulso dessa música → o voltar → a mesma busca, no mesmo termo
        n3.esconder_teclado(s)
        antes = len(linhas_octavia(s))
        n3.tap(s, texto="Segunda do ensaio", espera=4)
        R.esperar(s, rid="sair")
        for ln in linhas_octavia(s)[antes:]:
            print(f"    OCTAVIA: {ln}", flush=True)
        self.cap("S3", "avulso-da-busca-do-avulso")
        n3.tap(s, rid="sair", espera=2)
        R.esperar(s, rid="campo-busca")
        self.cap("S4", "avulso-voltou")
        n3.tap(s, rid="fechar-busca", espera=2)
        self.cap("S3", "avulso-letra-de-novo")

    def partitura(self):
        self._busca_de_s1()
        self._abrir("doze", "Partitura de doze páginas", "avulso-partitura", espera=6)
        R.esperar(self.s, rid="pagina")
        self.cap("S3", "avulso-partitura")

    def naoBaixado(self):
        self._busca_de_s1()
        R.aviao(self.s, True)
        self._abrir("nunca", "Partitura que nunca baixou", "avulso-nao-baixado")
        R.esperar(self.s, rid="s3e")
        self.cap("S3", "avulso-nao-baixado")
        R.aviao(self.s, False)

    def tituloLongo(self):
        self._busca_de_s1()
        self._abrir("comprido", "Uma música de título bem comprido, para medir o corte do título em retrato e no celular",
                    "avulso-titulo-longo")
        self.cap("S3", "avulso-titulo-longo")

    def semArtista(self):
        self._busca_de_s1()
        self._abrir("decima", "Décima do ensaio", "avulso-sem-artista")
        self.cap("S3", "avulso-sem-artista")

    def zero(self):
        R.mock("normal", vazio=True)
        R.ir_s1(self.s)
        R.esperar(self.s, rid="s1f")
        n3.tap(self.s, rid="buscar", espera=2)
        R.esperar(self.s, rid="campo-busca")
        try:
            self._abrir("manha", "Manhã de ensaio", "avulso-zero-setlists")
        except RuntimeError as e:  # na `main`, sem setlist hospedeira, o palco não tem `sair` (div. 1001)
            print(f"{time.strftime('%H:%M:%S')} sem `sair` no palco: {e}", flush=True)
        self.cap("S3", "avulso-zero-setlists")
        R.mock("normal")

    def formato(self):
        # o mock com a fixture do formato (o SCR desta rodada): sem isto o servidor da rodada anterior
        # continua servindo a fixture da base, e a música 13 não existe (a 1ª corrida caiu aqui)
        R.mock("normal")
        self._busca_de_s1()
        self._abrir("escaneada", "Partitura escaneada de fixture", "avulso-formato")
        self.cap("S3", "avulso-formato")
        self.formatoSetlist()

    def formatoSetlist(self):
        """O palco COM setlist na música `.jpg` (N4-D83): a setlist 3 da fixture do formato a tem na posição 3."""
        s = self.s
        R.mock("normal")
        R.ir_s1(s)
        no = R.esperar(s, rid="setlist-00000003")
        b = no["b"]
        n3.sh(s, "shell", "input", "tap", str(b[0] + 24), str(b[1] + 24))
        time.sleep(2)
        R.esperar(s, rid="picker-abrir")
        antes = len(linhas_octavia(s))
        n3.tap(s, rid="song-3", espera=4)
        for ln in linhas_octavia(s)[antes:]:
            print(f"    OCTAVIA: {ln}", flush=True)
        self.cap("S3", "setlist-formato")


if __name__ == "__main__":
    serial, saida, sufixo = sys.argv[2:5]
    r = Avulso(serial, saida, os.environ.get("PREFIXO", "N4P6"), sufixo)
    for nome in sys.argv[5:]:
        try:
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001 — como o roteiro.py: registra e segue
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

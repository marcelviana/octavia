#!/usr/bin/env python3
"""N3 pre-check — o roteiro do B2/B4/B5: alcança cada estado e captura (PNG + dump).

  SCR=<dir> python3 roteiro.py <serial> <dir-saida> <prefixo> <sufixo> [estados...]

Cada captura sai como <dir-saida>/<prefixo>-<tela>-<estado>-<sufixo>.{png,xml}.
Sem lista de estados, roda todos (menos os que o aparelho não permite: `S0*`
só com `--s0`, porque derruba a sessão — ver o README).

Tudo vem do mock (`aceite.py servidor`, 8788) e do servidor de arquivos (8790),
com a fixture do `fixture.py`. Nenhuma escrita bem-sucedida: a única escrita
tentada é a da "folha falhou", contra o mock no modo `escrita-500`.
O modo avião é ligado e desligado por `cmd connectivity airplane-mode`, e o
estado de antes é o do `estado/*-lido.txt` (restaurado no fim da sessão).
"""
from __future__ import annotations

import os
import subprocess
import sys
import time

sys.path.insert(0, os.path.dirname(__file__))
import n3  # noqa: E402

AQUI = os.path.dirname(os.path.abspath(__file__))
ARVORE = os.path.abspath(os.path.join(AQUI, "../../../.."))
SCR = os.environ["SCR"]
DEEP = "exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"


def mock(modo: str = "normal", vazio: bool = False) -> None:
    p = subprocess.run(["lsof", "-tiTCP:8788", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split()
    for pid in p:
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    sl = os.path.join(SCR, "mock", "vazio.json" if vazio else "setlists.json")
    if vazio and not os.path.exists(sl):
        open(sl, "w").write("[]")
    log = open(os.path.join(SCR, "mock", f"log-{modo}{'-vazio' if vazio else ''}.txt"), "w")
    subprocess.Popen(["python3", os.path.join(ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", "8788",
                      modo, sl, os.path.join(SCR, "mock", "content.json")], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{time.strftime('%H:%M:%S')} mock modo={modo} vazio={vazio}", flush=True)


def aviao(s: str, ligado: bool) -> None:
    n3.sh(s, "shell", "cmd", "connectivity", "airplane-mode", "enable" if ligado else "disable")
    time.sleep(4.0 if ligado else 7.0)
    print(f"{time.strftime('%H:%M:%S')} avião={n3.sh(s, 'shell', 'settings', 'get', 'global', 'airplane_mode_on').strip()} ({s})", flush=True)


def esperar(s: str, rid: str | None = None, texto: str | None = None, prazo: float = 30) -> dict:
    fim = time.time() + prazo
    while time.time() < fim:
        no = n3.achar(n3.dump(s), rid, texto)
        if no is not None:
            return no
        time.sleep(1)
    raise RuntimeError(f"ESPERA ESGOTADA: {rid or texto!r}")


def ir_s1(s: str) -> None:
    """Recarrega o app do zero (força parada + link do dev client): volta ao S1 e re-sincroniza."""
    n3.sh(s, "shell", "am", "force-stop", "rocks.octavia.app")
    time.sleep(1)
    n3.sh(s, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", DEEP, "rocks.octavia.app")
    rotacionar(s)
    esperar(s, rid="criar-setlist", prazo=60)
    time.sleep(3)  # o sync termina e a lista assenta


def rotacionar(s: str) -> None:
    """Reaplica a rotação pedida (env ROT). No celular, o lançador (travado em
    retrato) devolve o `user_rotation` a 0 na força-parada — queda de arnês do B4."""
    rot = os.environ.get("ROT")
    if rot is None:
        return
    n3.sh(s, "shell", "settings", "put", "system", "accelerometer_rotation", "0")
    n3.sh(s, "shell", "settings", "put", "system", "user_rotation", rot)
    time.sleep(2)


class Roteiro:
    def __init__(self, s: str, saida: str, prefixo: str, sufixo: str) -> None:
        self.s, self.saida, self.prefixo, self.sufixo = s, saida, prefixo, sufixo
        self.feitos: list[str] = []
        self.falhas: list[str] = []

    def cap(self, tela: str, estado: str) -> None:
        n3.esconder_teclado(self.s)
        rotacionar(self.s)
        time.sleep(0.8)
        nome = f"{self.prefixo}-{tela}-{estado}-{self.sufixo}"
        # nome de anexo é afirmação (caso 23): a raiz do dump tem de estar na orientação do sufixo
        raiz = n3.dump(self.s)[0]["b"]
        deitado = raiz[2] > raiz[3]
        if deitado != self.sufixo.endswith("-pai"):
            raise RuntimeError(f"ORIENTAÇÃO ERRADA para {nome}: raiz {raiz}")
        r = subprocess.run([os.path.join(AQUI, "cap.sh"), self.s, self.saida, nome], capture_output=True, text=True)
        print(r.stdout.strip(), flush=True)
        self.feitos.append(nome)

    def digitar(self, texto: str) -> None:
        n3.sh(self.s, "shell", "input", "text", texto.replace(" ", "%s"))
        time.sleep(1.5)

    def abrir_setlist(self) -> None:
        # Pelo CANTO superior esquerdo do cartão, não pelo título: no celular em
        # retrato o título tem largura 0 e some do dump, e o centro do cartão é o
        # botão "Baixar esta setlist" (achado do B4, não queda de arnês).
        no = esperar(self.s, rid="setlist-00000001")
        b = no["b"]
        n3.sh(self.s, "shell", "input", "tap", str(b[0] + 24), str(b[1] + 24))
        print(f"{time.strftime('%H:%M:%S')} toque canto de setlist-00000001 @ {b[0] + 24},{b[1] + 24}", flush=True)
        time.sleep(2)
        esperar(self.s, rid="picker-abrir")

    # ---- os estados -------------------------------------------------------
    def S1(self) -> None:
        ir_s1(self.s)
        self.cap("S1", "setlists")

    def S1_aviso(self) -> None:
        ir_s1(self.s)
        aviao(self.s, True)
        esperar(self.s, rid="aviso-motivo")
        self.cap("S1", "aviso-sem-rede")
        aviao(self.s, False)

    def S1e(self) -> None:
        mock("500-pagina-1")
        ir_s1(self.s)
        time.sleep(3)
        self.cap("S1", "S1e-falha-com-cache")
        mock("normal")

    def S1f(self) -> None:
        mock("normal", vazio=True)
        ir_s1(self.s)
        esperar(self.s, rid="s1f")
        self.cap("S1", "S1f-vazia")
        mock("normal")
        ir_s1(self.s)

    def S2e(self) -> None:
        ir_s1(self.s)
        self.abrir_setlist()
        self.cap("S2", "com-edicao")
        aviao(self.s, True)
        esperar(self.s, rid="aviso-motivo")
        self.cap("S2", "com-edicao-aviso-sem-rede")
        aviao(self.s, False)

    def reordenar(self) -> None:
        ir_s1(self.s)
        self.abrir_setlist()
        n3.tap(self.s, rid="reordenar", espera=2)
        self.cap("reordenar", "aberto")
        n3.tap(self.s, rid="reordenar-sair")

    def picker(self) -> None:
        ir_s1(self.s)
        self.abrir_setlist()
        n3.tap(self.s, rid="picker-abrir", espera=2)
        self.cap("picker", "vazio")
        n3.tap(self.s, rid="picker-campo")
        self.digitar("ensaio")
        self.cap("picker", "resultados")
        n3.tap(self.s, rid="fechar-busca")

    def folha(self) -> None:
        ir_s1(self.s)
        n3.tap(self.s, rid="criar-setlist", espera=2)
        self.cap("folha", "criar")
        n3.tap(self.s, rid="form-cancelar")
        # validação: editar, apagar o nome inteiro → `nome-vazio`
        self.abrir_setlist()
        n3.tap(self.s, rid="setlist-editar", espera=2)
        n3.tap(self.s, rid="form-nome")
        n3.key(self.s, "KEYCODE_MOVE_END", 0.3)
        for _ in range(20):
            n3.key(self.s, "KEYCODE_DEL", 0.05)
        time.sleep(1)
        esperar(self.s, rid="form-erro-nome")
        self.cap("folha", "validacao")
        n3.tap(self.s, rid="form-cancelar")
        # falhou: criar contra o mock em `escrita-500` (nada é gravado)
        mock("escrita-500")
        ir_s1(self.s)
        n3.tap(self.s, rid="criar-setlist", espera=2)
        n3.tap(self.s, rid="form-nome")
        self.digitar("Fixture N3")
        n3.esconder_teclado(self.s)
        n3.tap(self.s, rid="form-salvar", espera=3)
        esperar(self.s, rid="form-falha")
        self.cap("folha", "falhou")
        n3.tap(self.s, rid="form-cancelar")
        mock("normal")

    def dialogo(self) -> None:
        ir_s1(self.s)
        self.abrir_setlist()
        n3.tap(self.s, rid="setlist-apagar", espera=2)
        self.cap("dialogo", "apagar")
        n3.tap(self.s, rid="apagar-manter")

    def palco(self) -> None:
        s = self.s
        ir_s1(s)
        self.abrir_setlist()
        n3.tap(s, rid="song-1", espera=3)
        self.cap("S3", "S3a-letra-1a")
        n3.tap(s, rid="indice", espera=2)
        self.cap("S2", "sem-edicao-S2p")
        n3.key(s, "KEYCODE_BACK", 2)
        n3.tap(s, rid="borda-avancar", espera=3)
        self.cap("S3", "S3b-cifra-escuro")
        n3.tap(s, rid="tema", espera=2)
        self.cap("S3", "S3b-cifra-claro")
        n3.tap(s, rid="tema", espera=1)
        n3.tap(s, rid="borda-avancar", espera=3)
        n3.tap(s, rid="auto-scroll", espera=2)
        self.cap("S3", "S3c-tab-autoscroll")
        n3.tap(s, rid="auto-scroll", espera=1)
        n3.tap(s, rid="borda-avancar", espera=6)
        self.cap("S3", "S3d-pdf-12p")
        aviao(s, True)
        n3.tap(s, rid="borda-avancar", espera=3)
        self.cap("S3", "S3e-nao-baixado")
        aviao(s, False)
        n3.tap(s, rid="borda-avancar", espera=3)
        self.cap("S3", "titulo-longo")
        n3.tap(s, rid="borda-avancar", espera=3)
        n3.tap(s, rid="borda-avancar", espera=3)
        self.cap("S3", "ultima")
        n3.tap(s, rid="borda-avancar", espera=3)
        self.cap("S5", "fim")

    def S3c(self) -> None:
        """Refação isolada do S3c (o dump com auto-scroll ligado pode falhar: tela animando)."""
        s = self.s
        ir_s1(s)
        self.abrir_setlist()
        n3.tap(s, rid="song-3", espera=3)
        n3.tap(s, rid="auto-scroll", espera=2)
        self.cap("S3", "S3c-tab-autoscroll")
        n3.tap(s, rid="auto-scroll", espera=1)

    def S3d(self) -> None:
        """Refação isolada do S3d."""
        s = self.s
        ir_s1(s)
        self.abrir_setlist()
        n3.tap(s, rid="song-4", espera=8)
        self.cap("S3", "S3d-pdf-12p")

    def S4(self) -> None:
        ir_s1(self.s)
        n3.tap(self.s, rid="buscar", espera=2)
        self.cap("S4", "vazio")
        n3.tap(self.s, rid="campo-busca")
        self.digitar("ensaio")
        self.cap("S4", "resultados")
        n3.tap(self.s, rid="fechar-busca")

    def S0(self) -> None:
        """Só no AVD tablet (a sessão volta com o snapshot) e no celular antes do login.

        No tablet: modo `401` do mock → a leitura volta 401 → `signOutSession()`
        (`api.ts:108`) → S0. O erro: avião ligado, e-mail e senha de FIXTURE
        (nenhuma credencial; nada sai do aparelho) → `erro.sem_conexao`.
        """
        s = self.s
        if n3.achar(n3.dump(s), rid="entrar") is None:
            mock("401")
            ir_s1_ou_s0(s)
            mock("normal")
        esperar(s, rid="entrar")
        self.cap("S0", "login")
        aviao(s, True)
        n3.tap(s, rid="email")
        self.digitar("fixture@exemplo.invalid")
        n3.tap(s, rid="senha")
        self.digitar("fixture-n3")
        n3.esconder_teclado(s)
        n3.tap(s, rid="entrar", espera=4)
        esperar(s, rid="erro")
        self.cap("S0", "erro")
        aviao(s, False)


def ir_s1_ou_s0(s: str) -> None:  # noqa: D103
    n3.sh(s, "shell", "am", "force-stop", "rocks.octavia.app")
    time.sleep(1)
    n3.sh(s, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", DEEP, "rocks.octavia.app")
    time.sleep(12)


TODOS = ["S1", "S1_aviso", "S1e", "S1f", "S2e", "reordenar", "picker", "folha", "dialogo", "palco", "S4"]

if __name__ == "__main__":
    serial, saida, prefixo, sufixo = sys.argv[1:5]
    pedidos = [a for a in sys.argv[5:] if not a.startswith("--")] or TODOS
    r = Roteiro(serial, saida, prefixo, sufixo)
    for nome in pedidos:
        try:
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001 — registra e segue; o estado seguinte recomeça do S1
            r.falhas.append(f"{nome}: {e}")
            print(f"FALHA {nome}: {e}", flush=True)
            try:
                aviao(serial, False)
                mock("normal")
            except Exception:  # noqa: BLE001
                pass
    print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
    for f in r.falhas:
        print("  " + f)

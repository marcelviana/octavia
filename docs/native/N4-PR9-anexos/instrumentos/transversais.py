#!/usr/bin/env python3
"""N4-PR9 — os estados transversais no aparelho: as espécies do favoritar, o *baixando* e o *falhou* na LINHA da L, o
índice de arquivos contra a fixture, o arquivo apagado por fora e o teto (A-N4-6, A-N4-8, A-N4-26; divs. 1063, 1086,
1092, 1095).

  SCR=<dir com mock/> ARVORE=<árvore> PREFIXO=<p> ROT=<r> [PORTA=<p>] \
      python3 transversais.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Herda o arnês da N4-PR8 (`visualizacao.py` → `biblioteca.py` → `roteiro.py`): cada estado começa do S1 (`ir_s1`, que
re-sincroniza com o mock), entra na L pelo `buscar` e acha a música pelo CAMPO. O que apaga no aparelho: só o que a
fixture criou, por nome (`apagar_por_nome`, a regra da N4-PR7). Imprime as linhas `OCTAVIA:` de cada toque que conta.

As espécies (N4-R8) e como o mock produz cada uma — a classificação é a do core (`classificarFavoritar`):
  sem-resposta  `escrita-pendurada`: o socket mudo; o prazo de 20 s do cliente (N2-D35) vence — nada é gravado
  auth          `escrita-401`: o 401 de uma ESCRITA não derruba a sessão (`api.ts`)
  limite        `escrita-429`: `Retry-After: 30` → *tente de novo em 30 s*
  servidor      `escrita-500`
  generica      `escrita-400`: o 400 de validação cai no genérico
  rede          o BARRADO sem rede (`write blocked … reason=offline`): sem rede a estrela é inerte (N4-R9) e o toque
                não chega a ele (div. 1092). `redeCorrida` tenta a corrida entre o toque e o `estaOnline`: o avião
                ligado e o toque logo depois, com atrasos crescentes, e diz o que cada tentativa produziu.

Estados:
  especiesL     as cinco espécies alcançáveis na L, pela estrela da `Segunda do ensaio` (não favorita)
  especiesV     as mesmas em V (`view-favoritar`)
  redeCorrida   a corrida da espécie rede, na L
  baixandoLinha o `partitura-grande.pdf` apagado por nome e o servidor lento (`arquivos-lentos.py` na 8790): o sync o
                põe no plano, e a LINHA da L mostra *baixando o arquivo…* (div. 1095)
  falhouLinha   a linha do `nao-existe.pdf` (404): *não consegui baixar*; e o logcat INTEIRO do download (div. 1063)
  indice        o `files-index.json` e as duas pastas, contra a fixture: todo `file_url` de content (N4-R26)
  apagadoPorFora  o arquivo da `Partitura de doze páginas` apagado com o app ABERTO na L; a L antes e depois de
                reabrir (div. 1086)
  trimCaches    só no AVD: as pastas antes e depois do `pm trim-caches` (a limpeza real do sistema; div. 1086)
  teto          só com a fixture do teto (`fixture-teto.py`, > 200 MB): o plano para no teto, `lru over`, e a L com o
                *arquivo não baixado* no que não coube (N4-R26)
"""
import json
import os
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import biblioteca as Bi  # noqa: E402
import n3  # noqa: E402
import roteiro as R  # noqa: E402
import visualizacao as Vi  # noqa: E402

ADB = n3.ADB
PKG = "rocks.octavia.app"
ALVO = ("Segunda", "Segunda do ensaio")

#: (espécie, modo do mock, prazo da espera pela linha de aviso)
ESPECIES = (
    ("sem-resposta", "escrita-pendurada", 40),
    ("auth", "escrita-401", 15),
    ("servidor", "escrita-500", 15),
    ("generica", "escrita-400", 15),
    # o limite por último: o 429 fecha a família `content-mutate` por 30 s (a força-parada do estado seguinte a reabre)
    ("limite", "escrita-429", 15),
)


def logcat_tudo(s):
    return subprocess.run([ADB, "-s", s, "logcat", "-d"], capture_output=True, text=True).stdout.splitlines()


def run_as(s, cmd):
    return n3.sh(s, "shell", f"run-as {PKG} sh -c '{cmd}'", check=False)


def fixture_de_arquivos():
    """`nome → bytes` dos arquivos que a fixture SERVE, e os nomes que o content aponta (`file_url`)."""
    d = os.path.join(R.SCR, "mock", "arquivos")
    servidos = {f: os.path.getsize(os.path.join(d, f)) for f in os.listdir(d) if not f.startswith(".")}
    content = json.load(open(os.path.join(R.SCR, "mock", "content.json")))
    apontados = sorted({c["file_url"].rsplit("/", 1)[1] for c in content if c.get("file_url")})
    return servidos, apontados


class Transversais(Vi.Visualizacao):
    def _aviso(self, prazo):
        R.esperar(self.s, rid="aviso-motivo", prazo=prazo)
        a = n3.achar(n3.dump(self.s), rid="aviso-motivo")
        f = 2.625 if self.s == "emulator-5556" else 2.25
        # a linha de aviso inteira é o pai do motivo: a altura sai do dump (o `b` do nó do motivo e o da linha)
        print(f"  aviso: «{a.get('text', '')}» motivo {(a['b'][3] - a['b'][1]) / f:.1f} dp", flush=True)

    def _especie(self, tela, especie, modo, prazo):
        if tela == "L":
            self._abrir_l()
            n3.tap(self.s, rid="lib-campo")
            self.digitar(ALVO[0])
            n3.esconder_teclado(self.s)
            time.sleep(0.8)
        else:
            self._abrir_v(*ALVO)
        Bi.mock_com(modo)
        n0 = len(Bi.linhas_octavia(self.s))
        if tela == "L":
            n3.tap(self.s, texto=f"Favoritar “{ALVO[1]}”", espera=0.5)
        else:
            n3.tap(self.s, rid="view-favoritar", espera=0.5)
        self._aviso(prazo)
        print(f"  [{tela} {especie}] log: " + Vi.log_desde(self.s, n0), flush=True)
        self.cap(tela, f"favoritar-{especie}")
        # o `R.mock` mata a 8788 (o mock do AVD) mesmo quando a rodada é a do Tab: aqui, sempre o da `PORTA`
        Bi.mock_com("normal")

    def especiesL(self):
        for especie, modo, prazo in ESPECIES:
            self._especie("L", especie, modo, prazo)

    def especiesV(self):
        for especie, modo, prazo in ESPECIES:
            self._especie("V", especie, modo, prazo)

    def redeCorrida(self):
        """O avião ligado e o toque na estrela `atraso` s depois, numa string só do `adb shell` (sem a ida e volta do
        host entre os dois). O que se lê: `write blocked … reason=offline` (a espécie rede, ALCANÇADA), nada (a estrela
        já estava inerte), ou um `write op=…` (o pedido saiu antes de a rede cair)."""
        for atraso in ("0", "0.1", "0.2", "0.4", "0.8"):
            # o mock de novo a cada tentativa: o mock é `localhost` pelo `adb reverse` e responde EM AVIÃO — uma
            # tentativa que perde a corrida grava o favorito, e a seguinte não acharia mais *Favoritar “…”* (medido)
            Bi.mock_com("normal")
            self._abrir_l()
            n3.tap(self.s, rid="lib-campo")
            self.digitar(ALVO[0])
            n3.esconder_teclado(self.s)
            time.sleep(0.8)
            nos = n3.dump(self.s)
            estrela = n3.achar(nos, texto=f"Favoritar “{ALVO[1]}”") or n3.achar(nos, texto=f"Tirar “{ALVO[1]}”")
            b = estrela["b"]
            x, y = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
            n0 = len(Bi.linhas_octavia(self.s))
            n3.sh(self.s, "shell", f"cmd connectivity airplane-mode enable; sleep {atraso}; input tap {x} {y}")
            time.sleep(4)
            print(f"  [rede atraso={atraso}s] ping: {Vi.ping(self.s)} · log: {Vi.log_desde(self.s, n0)}", flush=True)
            if Bi.no(self.s, rid="aviso-motivo") is not None:
                a = n3.achar(n3.dump(self.s), rid="aviso-motivo")
                print(f"  aviso: «{a.get('text', '')}»", flush=True)
                self.cap("L", f"favoritar-rede-{atraso}")
            R.aviao(self.s, False)

    def baixandoLinha(self):
        n3.sh(self.s, "shell", "am", "force-stop", PKG)
        u = Bi.uid_de(self.s)
        for pasta in (f"files/octavia-{u}/files", f"cache/octavia-{u}/files"):
            Bi.apagar_por_nome(self.s, pasta, ["partitura-grande.pdf"])
        n0 = len(Bi.linhas_octavia(self.s))
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("grande")
        n3.esconder_teclado(self.s)
        R.esperar(self.s, texto="baixando o arquivo…", prazo=30)
        print("  log: " + Vi.log_desde(self.s, n0), flush=True)
        self.cap("L", "linha-baixando")

    def falhouLinha(self):
        # sem `logcat -c` aqui: a contagem de `FATAL` cobre a rodada inteira (`APARATO.md`, "logcat"; div. 440) — lê-se
        # só o que veio depois desta marca (a primeira forma limpava o buffer no meio da rodada)
        n_todas = len(logcat_tudo(self.s))
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("nunca")
        n3.esconder_teclado(self.s)
        R.esperar(self.s, texto="não consegui baixar", prazo=30)
        self.cap("L", "linha-falhou")
        # div. 1063: a mensagem INTEIRA que o Android dá ao 404 — toda linha do logcat (não só as `OCTAVIA:`) que fala
        # do download do `nao-existe.pdf` ou do `FileSystemDownloadTask`
        for ln in logcat_tudo(self.s)[n_todas:]:
            if any(k in ln for k in ("nao-existe", "FileSystemDownloadTask", "download-error", "Caused by")):
                print("  logcat: " + ln[-260:], flush=True)

    def indice(self):
        self._abrir_l()
        time.sleep(5)  # a garantia termina
        u = Bi.uid_de(self.s)
        idx = json.loads(n3.sh(self.s, "exec-out", "run-as", PKG, "cat", f"files/octavia-{u}/files-index.json") or "{}")
        servidos, apontados = fixture_de_arquivos()
        print(f"  a fixture aponta {len(apontados)} arquivo(s): {apontados}", flush=True)
        for pasta in ("files", "cache"):
            print(f"  ls {pasta}/octavia-<uid>/files: " + " | ".join(
                ln.split()[4] + " " + ln.split()[-1] for ln in run_as(self.s, f"ls -l {pasta}/octavia-{u}/files").splitlines()
                if ln.startswith("-")), flush=True)
        for nome in apontados:
            entradas = [e for url, e in idx.items() if url.rsplit("/", 1)[1] == nome]
            no_disco = run_as(self.s, f"ls -l files/octavia-{u}/files/{nome}").split()
            bytes_disco = int(no_disco[4]) if len(no_disco) > 4 and no_disco[0].startswith("-") else None
            esperado = servidos.get(nome)
            veredito = ("ok" if esperado is not None and bytes_disco == esperado
                        else "404 na fixture — nunca chega ao disco" if esperado is None and bytes_disco is None
                        else "DIFERENTE")
            print(f"  {nome}: índice={entradas[0]['bytes'] if entradas else '-'} disco={bytes_disco} "
                  f"fixture={esperado} → {veredito}", flush=True)

    def apagadoPorFora(self):
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("doze")
        n3.esconder_teclado(self.s)
        time.sleep(1)
        self.cap("L", "apagado-antes")
        u = Bi.uid_de(self.s)
        Bi.apagar_por_nome(self.s, f"files/octavia-{u}/files", ["partitura-12p.pdf"])
        time.sleep(2)
        nao = Bi.no(self.s, texto="arquivo não baixado")
        print(f"  com o app aberto, depois do rm: *arquivo não baixado* na linha? {nao is not None}", flush=True)
        self.cap("L", "apagado-com-app-aberto")
        n0 = len(Bi.linhas_octavia(self.s))
        self._abrir_l()
        n3.tap(self.s, rid="lib-campo")
        self.digitar("doze")
        n3.esconder_teclado(self.s)
        time.sleep(3)
        print("  reaberto: " + Vi.log_desde(self.s, n0), flush=True)
        self.cap("L", "apagado-reaberto")

    def trimCaches(self):
        if not self.s.startswith("emulator-"):
            raise RuntimeError("trimCaches só no AVD: o `pm trim-caches` limpa o cache de TODOS os apps do aparelho")
        self._abrir_l()
        time.sleep(5)
        u = Bi.uid_de(self.s)
        for quando in ("antes", "depois"):
            if quando == "depois":
                n3.sh(self.s, "shell", "pm", "trim-caches", "999G")
                time.sleep(3)
            for pasta in ("files", "cache"):
                print(f"  {quando} — {pasta}/octavia-<uid>/files: "
                      + (run_as(self.s, f"ls {pasta}/octavia-{u}/files").split() or ["(vazia)"]).__str__(), flush=True)
        n0 = len(Bi.linhas_octavia(self.s))
        self._abrir_l()
        time.sleep(3)
        print("  reaberto: " + Vi.log_desde(self.s, n0), flush=True)
        self.cap("L", "depois-do-trim")

    def teto(self):
        servidos, apontados = fixture_de_arquivos()
        print(f"  a fixture do teto: {len(apontados)} arquivos, {sum(servidos.values()) / 2**20:.1f} MiB servidos", flush=True)
        n_ini = len(Bi.linhas_octavia(self.s))
        self._abrir_l()
        fim = time.time() + 600
        while time.time() < fim:
            ls = Bi.linhas_octavia(self.s)[n_ini:]
            if any(ln.startswith("lru ") for ln in ls):
                break
            time.sleep(5)
        for ln in Bi.linhas_octavia(self.s)[n_ini:]:
            if ln.startswith(("prefetch", "lru", "download-error", "file src")):
                print("  log: " + ln, flush=True)
        n3.tap(self.s, rid="lib-campo")
        self.digitar("teto")
        n3.esconder_teclado(self.s)
        time.sleep(1)
        self.cap("L", "teto")
        u = Bi.uid_de(self.s)
        print("  disco: " + " | ".join(ln.split()[4] + " " + ln.split()[-1]
                                         for ln in run_as(self.s, f"ls -l files/octavia-{u}/files").splitlines()
                                         if ln.startswith("-")), flush=True)


if __name__ == "__main__":
    serial, saida, sufixo = sys.argv[2], sys.argv[3], sys.argv[4]
    r = Transversais(serial, saida, os.environ.get("PREFIXO", "N4P9"), sufixo)
    for nome in sys.argv[5:]:
        try:
            print(f"== {nome} {time.strftime('%H:%M:%S')}", flush=True)
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001
            r.falhas.append(f"{nome}: {e}")
            print(f"FALHA {nome}: {e}", flush=True)
            try:
                R.aviao(serial, False)
                Bi.mock_com("normal")
            except Exception:  # noqa: BLE001
                pass
    print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
    for f in r.falhas:
        print("  " + f)

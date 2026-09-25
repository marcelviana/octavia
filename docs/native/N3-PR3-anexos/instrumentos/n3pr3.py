"""N3-PR3 — os estados de S2 (com e sem edição) em qualquer orientação, e o S0 frio.

  SCR=<dir> ROT=<r> python3 n3pr3.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo> <estados...>

Estados de S2 (todos abrem `Ensaio de retrato` pelo canto do cartão, como o roteiro):
  S2e        com edição (8 músicas)
  S2p        sem edição: `song-1` → palco → `indice`
  semrede    S2e, avião ligado com a tela aberta (o caminho da base, N3-B-X-sem-rede)
  salvo      `remover-1` contra o mock `escrita-resync-500` (N3-B-X-salvo-nao-relido)
  falhou     `remover-1` contra `escrita-500` (N3-B-X-falhou)
  limite     `remover-1` contra `escrita-429` (N3-B-X-limite)
  cem        a mesma setlist com 101 linhas (`setlists-101.json`, N3-B-X-100)
  removendo  `remover-1` contra `escrita-pendurada`: a linha em `removendo…`
             (o mock nunca responde; o prazo do cliente é 20 s — a captura sai antes)
  removendoRolado  a lista rolada DURANTE o voo do `remover-1` (`…-removendo-rolada`), 2ª rodada
  S0frio     mock `401` → S0; força-parada e abertura fria (div. 404) → login; e o erro
Com ROLAR=1, cada captura de S2 sai também rolada até o fim no MESMO estado
(`<estado>-rolada`), a prova que o `g-n3.mjs --rolada` lê.
As escritas são no MOCK, que se relê da fixture a cada troca de modo — nada fica.
Nome de cada captura: N3P3-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import json, os, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P3", suf)
SCR = os.environ["SCR"]
ROLAR = os.environ.get("ROLAR") == "1"


def cap(tela, estado):
    """A captura; com ROLAR=1, também a lista rolada até o fim no MESMO estado
    (`<estado>-rolada`): é o dump que o `g-n3.mjs --rolada` lê para separar
    "abaixo da dobra" de "sumiu" (decisão do Marcel na N3-PR3)."""
    r.cap(tela, estado)
    if not ROLAR:
        return
    lista = next(a for a in n3.dump(s) if a.get("scrollable") == "true")
    b = lista["b"]; x = (b[0] + b[2]) // 2
    n3.sh(s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "600"); time.sleep(2)
    r.cap(tela, f"{estado}-rolada")


def mock101():
    """O mock com `Ensaio de retrato` em 101 linhas (a mesma fixture, as músicas em ciclo)."""
    sl = json.load(open(os.path.join(SCR, "mock", "setlists.json")))
    base = sl[0]["setlist_songs"]
    songs = []
    for i in range(101):
        x = dict(base[i % len(base)])
        x["id"] = f"0001{i + 1:04x}-0000-4000-8000-000000000004"
        x["position"] = i + 1
        songs.append(x)
    # `updated_at` posterior ao da fixture: sem ele o sync guarda a setlist de 8 que já
    # está no cache (a mesma `updated_at`), e a tela nunca vê as 101 (queda da 1ª rodada)
    sl[0] = dict(sl[0], setlist_songs=songs, updated_at="2026-09-23T13:00:00.000+00:00")
    arq = os.path.join(SCR, "mock", "setlists-101.json")
    json.dump(sl, open(arq, "w"), ensure_ascii=False)
    for pid in subprocess.run(["lsof", "-tiTCP:8788", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split():
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    log = open(os.path.join(SCR, "mock", "log-normal-101.txt"), "w")
    subprocess.Popen(["python3", os.path.join(R.ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", "8788",
                      "normal", arq, os.path.join(SCR, "mock", "content.json")], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{time.strftime('%H:%M:%S')} mock modo=normal setlists-101", flush=True)


def abrir():
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()


def S2e():
    abrir(); cap("S2", "com-edicao")


def S2p():
    abrir(); n3.tap(s, rid="song-1", espera=3); n3.tap(s, rid="indice", espera=2)
    R.esperar(s, rid="song-1"); cap("S2", "sem-edicao-S2p")


def semrede():
    abrir(); R.aviao(s, True); R.esperar(s, rid="aviso-motivo")
    cap("S2", "com-edicao-aviso-sem-rede"); R.aviao(s, False)


def _remover(modo, estado, espera_por):
    R.mock(modo); abrir()
    # `remover-1`: em retrato (coluna única) a linha 8 fica abaixo da dobra (queda da 1ª rodada)
    n3.tap(s, rid="remover-1", espera=1)
    R.esperar(s, **espera_por)
    cap("S2", estado)
    R.mock("normal")


def salvo():
    _remover("escrita-resync-500", "com-edicao-salvo-nao-relido", {"rid": "aviso-acao"})


def falhou():
    _remover("escrita-500", "com-edicao-falhou", {"texto": "Tentar de novo"})


def limite():
    _remover("escrita-429", "com-edicao-limite", {"rid": "aviso-motivo"})


def removendo():
    _remover("escrita-pendurada", "com-edicao-removendo", {"texto": "removendo…"})
    time.sleep(22)  # o prazo do cliente vence antes da próxima abertura


def removendoRolado():
    """A lista rolada DURANTE o voo de `remover-1` (a 2ª rodada: na 1ª, a rolada
    saiu depois dos 20 s do prazo do cliente e mostrava "sem resposta do
    servidor" — outro estado). Aqui rola logo depois do toque e captura sem
    reaplicar rotação; a prova de que é o MESMO estado está no dump: nenhum
    `aviso-motivo` (a falha ainda não veio) e `remover-8` com `enabled=false`
    (a escrita em voo trava os outros alvos, T2-R11). O tempo desde o toque sai
    no roteiro."""
    R.mock("escrita-pendurada"); abrir()
    lista = next(a for a in n3.dump(s) if a.get("scrollable") == "true")
    b = lista["b"]; x = (b[0] + b[2]) // 2
    n3.tap(s, rid="remover-1", espera=0.3); t0 = time.time()
    n3.sh(s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "400"); time.sleep(1.2)
    rot = os.environ.pop("ROT", None)
    try:
        r.cap("S2", "com-edicao-removendo-rolada")
    finally:
        if rot is not None:
            os.environ["ROT"] = rot
    print(f"{time.strftime('%H:%M:%S')} rolada capturada {time.time() - t0:.1f} s depois do toque (prazo do cliente: 20 s)", flush=True)
    R.mock("normal"); time.sleep(22)


def cem():
    mock101(); abrir(); R.esperar(s, rid="aviso-motivo")
    cap("S2", "com-edicao-acima-de-100"); R.mock("normal")


def S0frio():
    R.mock("401"); R.ir_s1_ou_s0(s); R.mock("normal")
    R.esperar(s, rid="entrar")
    n3.sh(s, "shell", "am", "force-stop", "rocks.octavia.app"); time.sleep(1)
    n3.sh(s, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", R.DEEP, "rocks.octavia.app")
    time.sleep(10); R.rotacionar(s)
    R.esperar(s, rid="entrar")
    r.cap("S0", "login")
    R.aviao(s, True)
    n3.tap(s, rid="email"); r.digitar("fixture@exemplo.invalid")
    n3.tap(s, rid="senha"); r.digitar("fixture-n3")
    n3.esconder_teclado(s)
    n3.tap(s, rid="entrar", espera=4)
    R.esperar(s, rid="erro")
    r.cap("S0", "erro")
    R.aviao(s, False)


for nome in sys.argv[5:]:
    try:
        globals()[nome]()
    except Exception as e:  # noqa: BLE001 — registra e segue
        r.falhas.append(f"{nome}: {e}"); print(f"FALHA {nome}: {e}", flush=True)
        try:
            R.aviao(s, False); R.mock("normal")
        except Exception:  # noqa: BLE001
            pass
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

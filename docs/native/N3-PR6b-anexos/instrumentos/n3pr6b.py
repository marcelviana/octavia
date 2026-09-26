"""N3-PR6b — as sete molduras do V1 que nenhum roteiro do N3 alcançava (A-N3-5), nas duas orientações.

  SCR=<dir-do-aparelho> PORTA=<p> ROT=<r> python3 n3pr6b.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Como cada uma se produz (tudo contra o mock `aceite.py servidor` com a fixture do pre-check; nenhuma
escrita; o que muda o cache do app é só o sync contra o mock):

  S1a        store apagado (`files/octavia-<uid>/*.json`, app parado) + mock `atraso` (45 s por
             resposta): o app abre sem cache e com o 1º sync em voo → `s1a` (a receita do `aceite.py`)
  S1d        store apagado + avião ligado ANTES de abrir: sem cache e sem rede → `s1d` com
             `Tentar novamente` (a receita do `aceite.py`); no fim, avião desligado e o cache refeito
  S4b        S1 → `buscar` → `xablau` → `s4b` (nada encontrado); mock normal
  S3avulsa   S1 → `buscar` → `ensaio` → `Segunda do ensaio` (cifra; da busca do S1 toda música é
             avulsa, `navigation.tsx`) → palco com `AVULSA`
  invalidos  mock com a `Ensaio de retrato` + músicas 9 (`no-body`: Lyrics sem corpo nem arquivo) e 10
             (`unknown-type`: tipo `Piano`) — as formas (b) e (d) do `com_item_invalido` do
             `aceite.py`, a moldura "9 e 10 sem corpo e sem tipo" — com `updated_at` novo (senão o sync
             guarda a de 8 do cache) → S2 (`S2-invalidos`, e o rolado) → `song-9` → palco `S3-nobody`
  n60        mock com a `Ensaio de retrato` de 60 músicas (as de texto da fixture em ciclo:
             1, 2, 3, 7, 8, 9, 10, 12 — sem PDF), `updated_at` novo → S2 → rola até `song-60` →
             palco `60 DE 60` → `borda-avancar` → S5 (`S5-n-grande`)

Nome de cada captura: N3P6B-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import copy, json, os, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P6B", suf)
SCR = os.environ["SCR"]
MOCK = os.path.join(SCR, "mock")
PKG = "rocks.octavia.app"
TEXTO = [1, 2, 3, 7, 8, 9, 10, 12]  # as músicas de texto da fixture (sem PDF)


def hora():
    return time.strftime("%H:%M:%S")


def mock_com(nome, setlists, content):
    for pid in subprocess.run(["lsof", f"-tiTCP:{R.PORTA}", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split():
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    sl, ct = os.path.join(MOCK, f"setlists-{nome}.json"), os.path.join(MOCK, f"content-{nome}.json")
    json.dump(setlists, open(sl, "w"), ensure_ascii=False)
    json.dump(content, open(ct, "w"), ensure_ascii=False)
    log = open(os.path.join(MOCK, f"log-{nome}.txt"), "w")
    subprocess.Popen(["python3", os.path.join(R.ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", R.PORTA,
                      "normal", sl, ct], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{hora()} mock normal com setlists-{nome}.json / content-{nome}.json", flush=True)


def base():
    return json.load(open(os.path.join(MOCK, "setlists.json"))), json.load(open(os.path.join(MOCK, "content.json")))


def cid(i):
    return f"00000000-0000-4000-8000-00000003{i:04x}"


def song(sl, pos, c):
    return {"id": f"0001{pos:04x}-0000-4000-8000-000000000004", "setlist_id": sl["id"], "content_id": c["id"],
            "position": pos, "notes": None,
            "content": {k: c[k] for k in ("id", "title", "artist", "content_type", "content_data", "file_url")}}


# ------------------------------------------------------------- store apagado
def uid_dir():
    out = n3.sh(s, "shell", "run-as", PKG, "ls", "files", check=False).split()
    ds = [d for d in out if d.startswith("octavia-")]
    if len(ds) != 1:
        raise RuntimeError(f"pasta do cache: {ds}")
    return "files/" + ds[0]


def apagar_store():
    n3.sh(s, "shell", "am", "force-stop", PKG); time.sleep(1)
    d = uid_dir()
    antes = n3.sh(s, "shell", "run-as", PKG, "ls", d, check=False).split()
    # uma string só: o `adb shell` junta os argumentos, e `sh -c rm -f …` apagava nada (queda da 1ª rodada)
    n3.sh(s, "shell", f"run-as {PKG} sh -c 'rm -f {d}/*.json'", check=False)
    depois = n3.sh(s, "shell", "run-as", PKG, "ls", d, check=False).split()
    if any(x.endswith(".json") for x in depois):
        raise RuntimeError(f"STORE NÃO APAGADO: {depois}")
    print(f"{hora()} store apagado em {d.split('-')[0]}-<uid>: antes {antes} → depois {depois}", flush=True)


def abrir_app():
    n3.sh(s, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", R.DEEP, PKG)
    R.rotacionar(s)


def S1a():
    R.mock("atraso")
    apagar_store()
    t0 = time.time()
    abrir_app()
    R.esperar(s, rid="s1a", prazo=40)
    print(f"{hora()} s1a na tela {time.time() - t0:.1f} s depois de abrir (o mock segura 45 s)", flush=True)
    r.cap("S1", "S1a-sincronizando")
    R.mock("normal")
    R.ir_s1(s)


def S1d():
    R.aviao(s, True)
    apagar_store()
    abrir_app()
    R.esperar(s, rid="s1d", prazo=40)
    R.esperar(s, texto="Tentar novamente")
    r.cap("S1", "S1d-offline-sem-cache")
    R.aviao(s, False)
    R.ir_s1(s)


# ------------------------------------------------------------------- busca
def buscar(termo):
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    n3.tap(s, rid="buscar", espera=2)
    n3.tap(s, rid="campo-busca")
    r.digitar(termo)
    n3.esconder_teclado(s)


def S4b():
    buscar("xablau")
    R.esperar(s, rid="s4b")
    r.cap("S4", "S4b-sem-resultados")
    n3.tap(s, rid="fechar-busca")


def S3avulsa():
    buscar("ensaio")
    n3.tap(s, texto="Segunda do ensaio", espera=3)
    R.esperar(s, texto="AVULSA")
    r.cap("S3", "S3-avulsa")


# ---------------------------------------------------------------- inválidos
def invalidos():
    sls, ct = base()
    sl = copy.deepcopy(sls[0])
    modelo = ct[0]
    comum = {"user_id": modelo["user_id"], "artist": "Fixture A6", "album": None, "file_url": None,
             "created_at": modelo["created_at"], "updated_at": modelo["updated_at"]}
    inv = [{**comum, "id": "fixture-a6-nobody", "title": "[FIXTURE] Sem corpo (no-body)",
            "content_type": "Lyrics", "content_data": None},
           {**comum, "id": "fixture-a6-tipo", "title": "[FIXTURE] Tipo desconhecido",
            "content_type": "Piano", "content_data": {"lyrics": "nao deve renderizar"}}]
    sl["setlist_songs"] += [song(sl, 9, inv[0]), song(sl, 10, inv[1])]
    sl["updated_at"] = "2026-09-23T13:00:00.000+00:00"
    mock_com("invalidos", [sl] + sls[1:], ct + inv)
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()
    time.sleep(1)
    r.cap("S2", "S2-invalidos")
    rolar_ate("song-10")
    r.cap("S2", "S2-invalidos-rolada")
    n3.tap(s, rid="song-9", espera=3)
    R.esperar(s, texto="9 DE 10")
    r.cap("S3", "S3-nobody")
    R.mock("normal")


def rolar_ate(rid, vezes=30):
    for _ in range(vezes):
        nos = n3.dump(s)
        alvo = n3.achar(nos, rid=rid)
        lista = next(a for a in nos if a.get("scrollable") == "true" or a.get("class", "").endswith("ScrollView"))
        b = lista["b"]
        if alvo is not None and alvo["b"][3] <= b[3] - 4:
            return alvo
        x = (b[0] + b[2]) // 2
        n3.sh(s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "600"); time.sleep(1.5)
    raise RuntimeError(f"ROLAGEM ESGOTADA: {rid}")


# --------------------------------------------------------------------- N=60
def n60():
    sls, ct = base()
    por = {c["id"]: c for c in ct}
    sl = copy.deepcopy(sls[0])
    sl["setlist_songs"] = [song(sl, p, por[cid(TEXTO[(p - 1) % len(TEXTO)])]) for p in range(1, 61)]
    # 14:00, não 13:00: a de inválidos já deixou 13:00 no cache e o sync compara por `!==` (queda da 1ª rodada)
    sl["updated_at"] = "2026-09-23T14:00:00.000+00:00"
    mock_com("60", [sl] + sls[1:], ct)
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()
    rolar_ate("song-60")
    n3.tap(s, rid="song-60", espera=3)
    R.esperar(s, texto="60 DE 60")
    n3.tap(s, rid="borda-avancar", espera=3)
    R.esperar(s, rid="voltar-inicio")
    r.cap("S5", "S5-n-grande")
    R.mock("normal")


for nome in sys.argv[5:]:
    try:
        globals()[nome]()
    except Exception as e:  # noqa: BLE001 — registra e segue
        r.falhas.append(f"{nome}: {e}"); print(f"FALHA {nome}: {e}", flush=True)
        try:
            R.aviao(s, False); R.mock("normal")
        except Exception:  # noqa: BLE001
            pass
# fecha no estado da fixture: mock normal e o cache refeito pelo sync
try:
    R.ir_s1(s)
except Exception as e:  # noqa: BLE001
    print(f"FALHA fecho: {e}", flush=True)
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

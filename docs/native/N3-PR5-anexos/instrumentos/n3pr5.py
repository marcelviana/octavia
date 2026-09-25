"""N3-PR5 — os estados do palco em B que o roteiro do pre-check não tem, e as provas de "passa".

  SCR=<dir> ROT=<r> python3 n3pr5.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo> <estados...>

Os estados do palco (S3a…S3e, título longo, última, S2p, S5) e os de picker/S4 vêm do
`roteiro.py` do pre-check (`palco`, `picker`, `S4`), com o prefixo N3P5. Este arquivo
acrescenta:

  pickerRelendo  `Adicionar` na linha 1 do picker contra o mock `resync-pendurado`: o 201
                 volta e a releitura pendura → `relendo…` (N2-P-relendo). Nada persiste (o
                 mock se relê da fixture na troca de modo).
  S0frio         mock `401` → S0; força-parada e abertura fria (div. 404) → login; e o erro
                 (avião, e-mail e senha de FIXTURE — nenhuma credencial).
  a14            T1-R27/A14 em B: palco na música 3 em PAISAGEM, gira para RETRATO (a linha
                 `rotation=portrait n=3/8` e o dump com `3 DE 8`), e volta (`rotation=landscape
                 n=3/8`). Os dumps saem como `S3-a14-retrato` e `S3-a14-volta`.
  zonas          em retrato, música 3: toques a 104 dp de cada borda (dentro dos 106,7) e a
                 112 dp (fora): o de dentro navega (`nav n=`), o de fora não.
  placeholder    a música 9 da `Ensaio de retrato` aponta para um content que não existe
                 (o `content-ausente` do `aceite.py`, com `updated_at` novo para o sync trocar o
                 cache) → o placeholder `conteúdo não baixado`. Roda POR ÚLTIMO: muda a setlist.

A linha de log se lê do logcat (`OCTAVIA:`), limpo antes de cada prova.
Nome de cada captura: N3P5-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import copy, json, os, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P5", suf)
F = 2.625 if "phone" in suf else 2.25


def hora():
    return time.strftime("%H:%M:%S")


def logcat_limpar():
    n3.sh(s, "logcat", "-c")


def logcat(padrao: str) -> list[str]:
    out = n3.sh(s, "logcat", "-d", "-s", "ReactNativeJS:*", "ReactNative:*", check=False)
    linhas = [l[l.index("OCTAVIA:"):] for l in out.splitlines() if "OCTAVIA:" in l]
    return [l for l in linhas if padrao in l]


def rot(v: str) -> None:
    n3.sh(s, "shell", "settings", "put", "system", "accelerometer_rotation", "0")
    n3.sh(s, "shell", "settings", "put", "system", "user_rotation", v)
    time.sleep(3)


def posicao() -> str:
    for a in n3.dump(s):
        t = a.get("text", "")
        if t.endswith(" DE 8") or t.endswith(" DE 9"):
            return t
    return "?"


def abrir_palco(n: int) -> None:
    R.ir_s1(s)
    r.abrir_setlist()
    n3.tap(s, rid=f"song-{n}", espera=3)
    R.esperar(s, texto=f"{n} DE 8")


def pickerRelendo():
    R.ir_s1(s)
    r.abrir_setlist()
    n3.tap(s, rid="picker-abrir", espera=2)
    n3.tap(s, rid="picker-campo")
    r.digitar("ensaio")
    n3.esconder_teclado(s)
    R.mock("resync-pendurado")
    n3.tap(s, rid="picker-adicionar-1", espera=1.5)
    R.esperar(s, texto="elendo", prazo=15)  # "Relendo…": o rótulo é capitalizado (`styles.capital`)
    r.cap("picker", "relendo")
    R.mock("normal")


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


def a14():
    """ROT_PAI e ROT_RET no ambiente: as rotações de paisagem e retrato DESTE aparelho."""
    pai, ret = os.environ["ROT_PAI"], os.environ["ROT_RET"]
    os.environ["ROT"] = pai
    abrir_palco(3)
    print(f"{hora()} paisagem: {posicao()}", flush=True)
    logcat_limpar()
    os.environ["ROT"] = ret
    rot(ret)
    R.esperar(s, texto="3 DE 8")
    print(f"{hora()} girou para retrato: {posicao()} · log: {logcat('rotation=')}", flush=True)
    r.sufixo = suf.replace("-pai", "-ret")
    r.cap("S3", "a14-retrato")
    logcat_limpar()
    os.environ["ROT"] = pai
    rot(pai)
    R.esperar(s, texto="3 DE 8")
    print(f"{hora()} voltou para paisagem: {posicao()} · log: {logcat('rotation=')}", flush=True)
    r.sufixo = suf
    r.cap("S3", "a14-volta")


def zonas():
    abrir_palco(3)
    raiz = n3.dump(s)[0]["b"]
    largura = raiz[2]
    borda = n3.achar(n3.dump(s), rid="borda-avancar")["b"]
    y = (borda[1] + borda[3]) // 2
    print(f"{hora()} janela {largura} px = {largura / F:.1f} dp · borda-avancar {borda} · y={y}", flush=True)
    casos = [("direita, 104 dp da borda", largura - round(104 * F), "4 DE 8"),
             ("direita, 112 dp da borda", largura - round(112 * F), "4 DE 8"),
             ("esquerda, 104 dp da borda", round(104 * F), "3 DE 8"),
             ("esquerda, 112 dp da borda", round(112 * F), "3 DE 8")]
    for nome, x, esperado in casos:
        logcat_limpar()
        antes = posicao()
        n3.sh(s, "shell", "input", "tap", str(x), str(y))
        time.sleep(2.5)
        depois = posicao()
        nav = logcat("nav n=")
        print(f"{hora()} toque {nome} @ x={x} px ({x / F:.1f} dp): {antes} → {depois} · log: {nav}", flush=True)
        if nome.endswith("104 dp da borda") and depois != esperado:
            raise RuntimeError(f"a zona não navegou: {nome}")
        if nome.endswith("112 dp da borda") and depois != antes:
            raise RuntimeError(f"fora da zona navegou: {nome}")


def placeholder():
    mock_dir = os.path.join(os.environ["SCR"], "mock")
    base = json.load(open(os.path.join(mock_dir, "setlists.json")))
    out = copy.deepcopy(base)
    for sl in out:
        if sl["name"] == "Ensaio de retrato":
            sl["updated_at"] = "2026-09-25T12:00:00.000+00:00"
            sl["setlist_songs"].append({
                "id": "fixture-a8-song", "setlist_id": sl["id"],
                "content_id": "fixture-a8-content-que-nao-existe",
                "position": 9, "notes": None, "content": None,
            })
    alt = os.path.join(mock_dir, "setlists-placeholder.json")
    json.dump(out, open(alt, "w"), ensure_ascii=False)
    p = subprocess.run(["lsof", "-tiTCP:8788", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split()
    for pid in p:
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    arvore = os.path.abspath(os.path.join(sys.argv[1], "../../../.."))
    log = open(os.path.join(mock_dir, "log-placeholder.txt"), "w")
    subprocess.Popen(["python3", os.path.join(arvore, "apps/native/src/fixtures/aceite.py"), "servidor", "8788",
                      "normal", alt, os.path.join(mock_dir, "content.json")], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{hora()} mock normal com a música 9 sem content (setlists-placeholder.json)", flush=True)
    R.ir_s1(s)
    r.abrir_setlist()
    # a linha 9 fica abaixo da dobra nas duas orientações: abre a 7 e avança duas
    n3.tap(s, rid="song-7", espera=3)
    R.esperar(s, texto="7 DE 9", prazo=20)
    n3.tap(s, rid="borda-avancar", espera=3)
    n3.tap(s, rid="borda-avancar", espera=3)
    R.esperar(s, rid="placeholder")
    r.cap("S3", "placeholder")
    R.mock("normal")


for nome in sys.argv[5:]:
    try:
        if nome in ("palco", "picker", "S4", "S1", "S1_aviso", "S1e", "S1f", "S2e", "reordenar", "folha", "dialogo"):
            getattr(r, nome)()
        else:
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

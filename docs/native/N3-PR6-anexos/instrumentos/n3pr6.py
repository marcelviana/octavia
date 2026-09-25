"""N3-PR6 — o aceite completo do bloco em B: os cinco estados transversais em toda superfície que os
tem, o S0 (frio e por logout), e o que as PRs anteriores já tinham como receita.

  SCR=<dir> ROT=<r> python3 n3pr6.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo> <estados...>

A matriz (lida no código: quem monta a `LinhaDeAviso` e com que frase — `SetlistsScreen`,
`IndexScreen`, `ModoDeReordenar`, `Picker`; a folha tem o cartão `form-falha`):

  S1         s1SemRede (o app ABRE já sem rede — APARATO, div. 415) · s1Salvo (`Nova setlist`
             contra `escrita-resync-500`: criada, a releitura cai)
  S2e        s2SemRede · s2Salvo · s2Falhou (500; a captura espera `Tentar de novo`, que só vem
             depois da releitura) · s2Limite (429, `Retry-After: 30`) · s2Cem (a setlist com 101)
  reordenar  rSemRede (o avião liga com o modo aberto) · rFalhou (500, depois da releitura) ·
             rLimite (429)
  folha      fSemRede (o avião liga com a folha de criar aberta) · fFalhou (500, depois da
             releitura) · fLimite (429)
  picker     pSemRede · pSalvo (`resync-500`) · pFalhou (500, depois da releitura) · pLimite (429) ·
             pCem (a setlist com 101)

  S0frio     mock `401` → S0; força-parada e abertura fria (div. 404) → login; e o erro
  S0logout   mock `401` → S0 na sessão (o caminho da base de RETRATO, div. 437); e o erro

As escritas são no MOCK, que se relê da fixture a cada troca de modo — nada fica.
Nome de cada captura: N3P6-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import json, os, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, os.environ.get("PREFIXO", "N3P6"), suf)
SCR = os.environ["SCR"]


def hora():
    return time.strftime("%H:%M:%S")


def mock_arquivo(nome, arq):
    for pid in subprocess.run(["lsof", f"-tiTCP:{R.PORTA}", "-sTCP:LISTEN"], capture_output=True, text=True).stdout.split():
        subprocess.run(["kill", pid])
    time.sleep(0.6)
    log = open(os.path.join(SCR, "mock", f"log-{nome}.txt"), "w")
    subprocess.Popen(["python3", os.path.join(R.ARVORE, "apps/native/src/fixtures/aceite.py"), "servidor", R.PORTA,
                      "normal", arq, os.path.join(SCR, "mock", "content.json")], stdout=log, stderr=log)
    time.sleep(1.0)
    print(f"{hora()} mock modo=normal {os.path.basename(arq)}", flush=True)


def mock101():
    """`Ensaio de retrato` com 101 linhas (as músicas em ciclo) e `updated_at` novo — a receita da
    N3-PR3 (`n3pr3.py`): sem o `updated_at` o sync guarda a de 8 do cache."""
    sl = json.load(open(os.path.join(SCR, "mock", "setlists.json")))
    base = sl[0]["setlist_songs"]
    songs = []
    for i in range(101):
        x = dict(base[i % len(base)])
        x["id"] = f"0001{i + 1:04x}-0000-4000-8000-000000000004"
        x["position"] = i + 1
        songs.append(x)
    sl[0] = dict(sl[0], setlist_songs=songs, updated_at="2026-09-23T13:00:00.000+00:00")
    arq = os.path.join(SCR, "mock", "setlists-101.json")
    json.dump(sl, open(arq, "w"), ensure_ascii=False)
    mock_arquivo("normal-101", arq)


def abrir():
    R.ir_s1(s)
    if "phone" in suf:  # em A o chip encolhe até o ícone (APARATO): espera-se o cartão
        R.esperar(s, rid="setlist-00000001", prazo=60); time.sleep(3)
    else:
        R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()


def esperar_ativo(rid, prazo=20):
    fim = time.time() + prazo
    while time.time() < fim:
        no = n3.achar(n3.dump(s), rid=rid)
        if no is not None and no.get("enabled") == "true":
            return no
        time.sleep(1)
    raise RuntimeError(f"ESPERA ESGOTADA: {rid} ativo")


def cap2(tela, estado):
    """S2 em retrato deixa a linha 8 abaixo da dobra: com ROLAR=1 sai também o dump rolado até o
    fim no MESMO estado (`<estado>-rolada`), a prova do `g-n3.mjs --rolada` (N3-D29)."""
    r.cap(tela, estado)
    if os.environ.get("ROLAR") != "1":
        return
    lista = next(a for a in n3.dump(s) if a.get("scrollable") == "true")
    b = lista["b"]; x = (b[0] + b[2]) // 2
    n3.sh(s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "600"); time.sleep(2)
    r.cap(tela, f"{estado}-rolada")


def voltar_normal():
    R.aviao(s, False)
    R.mock("normal")


# ------------------------------------------------------------------------ S1
def s1SemRede():
    R.aviao(s, True)
    R.ir_s1(s)
    R.esperar(s, rid="aviso-motivo")
    r.cap("S1", "aviso-sem-rede")
    R.aviao(s, False)


def s1Salvo():
    R.mock("escrita-resync-500")
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)  # queda da 1ª rodada do AVD: tocou antes de a lista assentar
    n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome")
    r.digitar("Fixture N3")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-salvar", espera=2)
    R.esperar(s, rid="aviso-acao", prazo=25)
    r.cap("S1", "salvo-nao-relido")
    R.mock("normal")


# ------------------------------------------------------------------------ S2e
def s2SemRede():
    abrir(); R.aviao(s, True); R.esperar(s, rid="aviso-motivo")
    cap2("S2", "com-edicao-aviso-sem-rede"); R.aviao(s, False)


def _remover(modo, estado, **espera):
    R.mock(modo); abrir()
    n3.tap(s, rid="remover-1", espera=1)
    R.esperar(s, prazo=25, **espera)
    cap2("S2", estado)
    R.mock("normal")


def s2Salvo():
    _remover("escrita-resync-500", "com-edicao-salvo-nao-relido", rid="aviso-acao")


def s2Falhou():
    # `Tentar de novo` só existe depois da releitura (a frase "a lista abaixo…" vem com ela)
    _remover("escrita-500", "com-edicao-falhou", texto="Tentar de novo")


def s2Limite():
    _remover("escrita-429", "com-edicao-limite", texto="tente de novo em 30 s")


def s2Cem():
    mock101(); abrir(); R.esperar(s, rid="aviso-motivo")
    cap2("S2", "com-edicao-acima-de-100"); R.mock("normal")


# ------------------------------------------------------------------ reordenar
def abrir_reordenar():
    abrir()
    n3.tap(s, rid="reordenar", espera=2)
    R.esperar(s, rid="alca-5")


def arrastar_5_para_2():
    a5 = R.esperar(s, rid="alca-5")["b"]; a2 = R.esperar(s, rid="alca-2")["b"]
    x, y5, y2 = (a5[0] + a5[2]) // 2, (a5[1] + a5[3]) // 2, (a2[1] + a2[3]) // 2
    n3.sh(s, "shell", "input", "swipe", str(x), str(y5), str(x), str(y2), "1500")
    time.sleep(1.5)
    print(f"{hora()} swipe alca-5 ({x},{y5}) → alca-2 ({x},{y2}) 1500 ms", flush=True)
    R.esperar(s, rid="reordenar-salvar")


def rSemRede():
    abrir_reordenar()
    R.aviao(s, True)
    R.esperar(s, rid="aviso-motivo")
    r.cap("reordenar", "X-sem-rede")
    R.aviao(s, False)
    n3.tap(s, rid="reordenar-sair")


def rFalhou():
    R.mock("escrita-500")
    abrir_reordenar(); arrastar_5_para_2()
    n3.tap(s, rid="reordenar-salvar", espera=1.5)
    R.esperar(s, texto="Tentar de novo", prazo=25)
    R.esperar(s, texto="movida de 5")
    r.cap("reordenar", "falhou")
    n3.tap(s, rid="reordenar-sair")
    R.mock("normal")


def rLimite():
    R.mock("escrita-429")
    abrir_reordenar(); arrastar_5_para_2()
    n3.tap(s, rid="reordenar-salvar", espera=1.5)
    R.esperar(s, rid="aviso-motivo", prazo=25)
    r.cap("reordenar", "X-limite")
    n3.tap(s, rid="reordenar-sair")
    R.mock("normal")


# ---------------------------------------------------------------------- folha
def _criar(modo):
    R.mock(modo)
    R.ir_s1(s)
    n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome")
    r.digitar("Fixture N3")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-salvar", espera=0.8)


def fSemRede():
    R.ir_s1(s)
    n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome")
    r.digitar("Fixture N3")
    n3.esconder_teclado(s)
    R.aviao(s, True)
    R.esperar(s, rid="form-salvar-motivo")
    r.cap("folha", "X-sem-rede")
    R.aviao(s, False)
    n3.tap(s, rid="form-cancelar")


def fFalhou():
    _criar("escrita-500")
    R.esperar(s, rid="form-falha", prazo=25)
    esperar_ativo("form-tentar")  # regra 3: `Tentar de novo` só depois da releitura
    r.cap("folha", "falhou")
    n3.tap(s, rid="form-cancelar")
    R.mock("normal")


def fLimite():
    _criar("escrita-429")
    R.esperar(s, rid="form-falha", prazo=25)
    R.esperar(s, texto="30 s")
    r.cap("folha", "X-limite")
    n3.tap(s, rid="form-cancelar")
    R.mock("normal")


# --------------------------------------------------------------------- picker
def abrir_picker(buscar=True):
    abrir()
    n3.tap(s, rid="picker-abrir", espera=2)
    if buscar:
        n3.tap(s, rid="picker-campo")
        r.digitar("ensaio")
        n3.esconder_teclado(s)


def pSemRede():
    abrir_picker()
    R.aviao(s, True)
    R.esperar(s, rid="aviso-motivo")
    r.cap("picker", "X-sem-rede")
    R.aviao(s, False)
    n3.tap(s, rid="fechar-busca")


def _adicionar(modo, estado, **espera):
    abrir_picker()
    R.mock(modo)
    n3.tap(s, rid="picker-adicionar-1", espera=1.5)
    R.esperar(s, prazo=25, **espera)
    r.cap("picker", estado)
    R.mock("normal")


def pSalvo():
    _adicionar("escrita-resync-500", "X-salvo-nao-relido", rid="aviso-acao")


def pFalhou():
    # `Tentar de novo` no próprio item, depois da releitura (N2 g6 #11)
    _adicionar("escrita-500", "X-falhou", texto="Tentar de novo")


def pLimite():
    _adicionar("escrita-429", "X-limite", texto="30 s")


def pCem():
    mock101(); abrir_picker(); R.esperar(s, rid="aviso-motivo")
    r.cap("picker", "X-acima-de-100"); R.mock("normal")


# ------------------------------------------------------------------------- S0
def _s0_erro():
    R.aviao(s, True)
    n3.tap(s, rid="email"); r.digitar("fixture@exemplo.invalid")
    n3.tap(s, rid="senha"); r.digitar("fixture-n3")
    n3.esconder_teclado(s)
    n3.tap(s, rid="entrar", espera=4)
    R.esperar(s, rid="erro")
    r.cap("S0", "erro")
    R.aviao(s, False)


def _ate_o_s0():
    """mock `401` ATÉ o S0 aparecer (1ª rodada: com a espera fixa de 12 s do `ir_s1_ou_s0` o app só leu
    depois de o mock voltar ao normal, e ficou em S1)."""
    R.mock("401"); R.ir_s1_ou_s0(s); R.rotacionar(s)
    R.esperar(s, rid="entrar", prazo=90)
    R.mock("normal")


def S0frio():
    _ate_o_s0()
    n3.sh(s, "shell", "am", "force-stop", "rocks.octavia.app"); time.sleep(1)
    n3.sh(s, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", R.DEEP, "rocks.octavia.app")
    time.sleep(10); R.rotacionar(s)
    R.esperar(s, rid="entrar")
    r.cap("S0", "login")
    _s0_erro()


def S0logout():
    _ate_o_s0()
    r.cap("S0", "login")
    _s0_erro()


PRE = ("palco", "picker", "S4", "S1", "S1_aviso", "S1e", "S1f", "S2e", "reordenar", "folha", "dialogo")
for nome in sys.argv[5:]:
    try:
        if nome in PRE:
            getattr(r, nome)()
        else:
            globals()[nome]()
    except Exception as e:  # noqa: BLE001 — registra e segue
        r.falhas.append(f"{nome}: {e}"); print(f"FALHA {nome}: {e}", flush=True)
        try:
            voltar_normal()
        except Exception:  # noqa: BLE001
            pass
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

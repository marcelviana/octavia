"""N3-PR4 — os estados do reordenar, da folha e do diálogo em qualquer orientação, e o S0 frio.

  SCR=<dir> ROT=<r> python3 n3pr4.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo> <estados...>

Todos partem de `Ensaio de retrato` (aberto pelo canto do cartão, como o roteiro do pre-check),
menos os da folha de CRIAR, que partem de S1.

Reordenar (N3-B-reordenar e os estados da N2):
  reordenar    aberto, nada mudou (`reordenar-aberto`)
  arrastando   a alça 5 segurada a meio caminho da posição 2 (`input motionevent` DOWN/MOVE;
               o dump sai com o dedo no vidro, e só depois o UP)
  salvando     `input swipe` pela alça 5 → 2, `Salvar a ordem` contra `escrita-pendurada`
  falhou       o mesmo contra `escrita-500`: o arrasto fica (R2·1), `Sair sem salvar` e
               `Tentar de novo` depois da releitura
  descartado   o 400 de permutação (N2-D37): depois do arrasto, "outro aparelho" tira a música 3
               direto no mock (`DELETE /api/setlists/songs/<id>`), e o `Salvar` dá 400
Folha (N3-B-F):
  folhaCriar   `criar-setlist` em S1: a folha vazia, com o TECLADO ABERTO (é a `N3-B-F-validacao`:
               nome vazio, o erro no campo e o motivo ao lado de `Criar`)
  folhaValidacao  editar, o nome apagado, teclado aberto (o `folha-validacao` da base)
  folhaSalvando  criar "Fixture N3" contra `escrita-pendurada`
  folhaFalhou  o mesmo contra `escrita-500`, capturado DEPOIS da releitura (`form-tentar` ativo)
  editarIgual  `setlist-editar`: `Salvar` inativo com "nada mudou"
  editarData   editar, a data escolhida no seletor do sistema (OK) → `form-data-limpar`
               (`folha-editar-data`), e depois do `Limpar` (`folha-editar-limpa`)
Diálogo:
  dialogo      `setlist-apagar` (`dialogo-apagar`)
  apagando     `apagar-confirmar` contra `escrita-pendurada` (`dialogo-apagando`)
  S0frio       mock `401` → S0; força-parada e abertura fria (div. 404) → login; e o erro

Com teclado (`folhaCriar`, `folhaValidacao`) a captura NÃO esconde o teclado: sai com o
`mInputShown` e a moldura da janela do teclado (`dumpsys window`) na linha do roteiro — é
contra ela que o `bounds` do `form-salvar` se cita.
As escritas são no MOCK, que se relê da fixture a cada troca de modo — nada fica.
Nome de cada captura: N3P4-<tela>-<estado>-<sufixo>.{png,xml}.
"""
import os, re, subprocess, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P4", suf)
AQUI_PRE = sys.argv[1]
SL = "00000001-0000-4000-8000-000000000003"
MUSICA_3 = "00010003-0000-4000-8000-000000000004"


def hora():
    return time.strftime("%H:%M:%S")


def ime():
    """`mInputShown` e o TOPO do teclado em px: a região tocável da janela do IME
    (`touchable region=SkRegion((x0,y0,x1,y1))`, `dumpsys window windows`). A moldura
    (`mFrame`) da janela do IME é a tela inteira — não serve (1ª rodada do AVD)."""
    im = n3.sh(s, "shell", "dumpsys", "input_method")
    shown = "mInputShown=true" in im
    w = n3.sh(s, "shell", "dumpsys", "window", "windows")
    regiao = None
    for bloco in re.split(r"\n  Window #\d+ ", w):
        if "InputMethod}" in bloco.split("\n", 1)[0]:
            m = re.search(r"touchable region=SkRegion\(\((\d+),(\d+),(\d+),(\d+)\)", bloco)
            if m:
                regiao = tuple(int(v) for v in m.groups())
    return shown, regiao


def cap_teclado(tela, estado):
    """A captura com o teclado DE PÉ (o `Roteiro.cap` o esconde antes)."""
    R.rotacionar(s)
    time.sleep(0.8)
    nome = f"N3P4-{tela}-{estado}-{suf}"
    raiz = n3.dump(s)[0]["b"]
    if (raiz[2] > raiz[3]) != suf.endswith("-pai"):
        raise RuntimeError(f"ORIENTAÇÃO ERRADA para {nome}: raiz {raiz}")
    shown, moldura = ime()
    p = subprocess.run([os.path.join(AQUI_PRE, "cap.sh"), s, saida, nome], capture_output=True, text=True)
    print(p.stdout.strip(), flush=True)
    shown2, moldura2 = ime()
    F = 2.625 if "phone" in suf else 2.25
    topo = f"{moldura2[1]} px = {moldura2[1] / F:.1f} dp" if moldura2 else "?"
    print(f"{hora()} teclado antes: mInputShown={str(shown).lower()} região={moldura} · depois: "
          f"mInputShown={str(shown2).lower()} região={moldura2} · topo do teclado {topo}", flush=True)
    r.feitos.append(nome)
    if not (shown and shown2):
        raise RuntimeError(f"{nome}: o teclado não estava de pé na captura")


def esperar_teclado(prazo=8):
    fim = time.time() + prazo
    while time.time() < fim:
        if n3.teclado(s):
            return
        time.sleep(0.5)
    raise RuntimeError("ESPERA ESGOTADA: teclado")


def abrir():
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()


def centro(rid):
    no = R.esperar(s, rid=rid)
    b = no["b"]
    return (b[0] + b[2]) // 2, (b[1] + b[3]) // 2


def abrir_reordenar():
    abrir()
    n3.tap(s, rid="reordenar", espera=2)
    R.esperar(s, rid="alca-5")


def arrastar_5_para_2():
    """O arrasto do aceite: `input swipe` pela alça 5 até o centro da alça 2."""
    x, y5 = centro("alca-5")
    _, y2 = centro("alca-2")
    n3.sh(s, "shell", "input", "swipe", str(x), str(y5), str(x), str(y2), "1500")
    time.sleep(1.5)
    print(f"{hora()} swipe alca-5 ({x},{y5}) → alca-2 ({x},{y2}) 1500 ms", flush=True)
    R.esperar(s, rid="reordenar-salvar")


# ------------------------------------------------------------------ reordenar
def reordenar():
    abrir_reordenar()
    R.esperar(s, rid="reordenar-salvar-motivo")
    r.cap("reordenar", "aberto")
    n3.tap(s, rid="reordenar-sair")


def arrastando():
    abrir_reordenar()
    x, y5 = centro("alca-5")
    _, y2 = centro("alca-2")
    n3.sh(s, "shell", "input", "motionevent", "DOWN", str(x), str(y5))
    passos = 8
    for i in range(1, passos + 1):
        y = y5 + (y2 - y5) * i // passos
        n3.sh(s, "shell", "input", "motionevent", "MOVE", str(x), str(y))
        time.sleep(0.12)
    print(f"{hora()} motionevent DOWN alca-5 ({x},{y5}) → MOVE até ({x},{y2}), dedo no vidro", flush=True)
    time.sleep(1.0)
    try:
        R.esperar(s, texto="soltar aqui", prazo=10)
        r.cap("reordenar", "arrastando")
    finally:
        n3.sh(s, "shell", "input", "motionevent", "UP", str(x), str(y2))
        print(f"{hora()} motionevent UP", flush=True)
    time.sleep(1.0)
    n3.tap(s, rid="reordenar-sair")


def salvando():
    R.mock("escrita-pendurada")
    abrir_reordenar(); arrastar_5_para_2()
    n3.tap(s, rid="reordenar-salvar", espera=0.8); t0 = time.time()
    r.cap("reordenar", "salvando")
    print(f"{hora()} salvando capturado {time.time() - t0:.1f} s depois do toque (prazo do cliente: 20 s)", flush=True)
    time.sleep(max(0, 23 - (time.time() - t0)))
    R.esperar(s, rid="reordenar-sair")
    n3.tap(s, rid="reordenar-sair")
    R.mock("normal")


def falhou():
    R.mock("escrita-500")
    abrir_reordenar(); arrastar_5_para_2()
    n3.tap(s, rid="reordenar-salvar", espera=1.5)
    R.esperar(s, texto="Tentar de novo")
    R.esperar(s, texto="movida de 5")
    r.cap("reordenar", "falhou")
    n3.tap(s, rid="reordenar-sair")
    R.mock("normal")


def descartado():
    R.mock("normal")
    abrir_reordenar(); arrastar_5_para_2()
    c = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "-X", "DELETE",
                        f"http://localhost:8788/api/setlists/songs/{MUSICA_3}"], capture_output=True, text=True)
    print(f"{hora()} outro aparelho: DELETE /api/setlists/songs/{MUSICA_3} → {c.stdout}", flush=True)
    n3.tap(s, rid="reordenar-salvar", espera=1.5)
    R.esperar(s, texto="a ordem foi recarregada")
    r.cap("reordenar", "descartado")
    n3.tap(s, rid="reordenar-sair")
    R.mock("normal")


# ---------------------------------------------------------------------- folha
def folhaCriar():
    R.ir_s1(s)
    n3.tap(s, rid="criar-setlist", espera=1.5)
    R.esperar(s, rid="form-erro-nome")
    esperar_teclado()
    cap_teclado("folha", "criar")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-cancelar")


def folhaValidacao():
    abrir()
    n3.tap(s, rid="setlist-editar", espera=2)
    n3.tap(s, rid="form-nome")
    n3.key(s, "KEYCODE_MOVE_END", 0.3)
    for _ in range(20):
        n3.key(s, "KEYCODE_DEL", 0.05)
    time.sleep(1)
    R.esperar(s, rid="form-erro-nome")
    esperar_teclado()
    cap_teclado("folha", "validacao")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-cancelar")


def _criar(modo):
    R.mock(modo)
    R.ir_s1(s)
    n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome")
    r.digitar("Fixture N3")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-salvar", espera=0.8)


def folhaSalvando():
    _criar("escrita-pendurada"); t0 = time.time()
    R.esperar(s, texto="Criando no servidor…", prazo=5)
    r.cap("folha", "salvando")
    print(f"{hora()} salvando capturado {time.time() - t0:.1f} s depois do toque (prazo do cliente: 20 s)", flush=True)
    time.sleep(max(0, 23 - (time.time() - t0)))
    R.esperar(s, rid="form-cancelar")
    n3.tap(s, rid="form-cancelar")
    R.mock("normal")


def folhaFalhou():
    _criar("escrita-500")
    R.esperar(s, rid="form-falha")
    # regra 3: `Tentar de novo` só depois da releitura — a captura espera o `form-tentar` ativo
    fim = time.time() + 20
    while time.time() < fim:
        no = n3.achar(n3.dump(s), rid="form-tentar")
        if no is not None and no.get("enabled") == "true":
            break
        time.sleep(1)
    else:
        raise RuntimeError("ESPERA ESGOTADA: form-tentar ativo")
    r.cap("folha", "falhou")
    n3.tap(s, rid="form-cancelar")
    R.mock("normal")


def editarIgual():
    abrir()
    n3.tap(s, rid="setlist-editar", espera=2)
    R.esperar(s, rid="form-salvar-motivo")
    r.cap("folha", "editar-igual")
    n3.tap(s, rid="form-cancelar")


def editarData():
    abrir()
    n3.tap(s, rid="setlist-editar", espera=2)
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-data", espera=2)
    ok = R.esperar(s, rid="button1")
    b = ok["b"]
    n3.sh(s, "shell", "input", "tap", str((b[0] + b[2]) // 2), str((b[1] + b[3]) // 2))
    print(f"{hora()} seletor do sistema: OK ({ok.get('text')})", flush=True)
    time.sleep(1.5)
    R.esperar(s, rid="form-data-limpar")
    r.cap("folha", "editar-data")
    n3.tap(s, rid="form-data-limpar", espera=1.5)
    R.esperar(s, rid="form-salvar-motivo")
    r.cap("folha", "editar-limpa")
    n3.tap(s, rid="form-cancelar")


# -------------------------------------------------------------------- diálogo
def dialogo():
    abrir()
    n3.tap(s, rid="setlist-apagar", espera=2)
    r.cap("dialogo", "apagar")
    n3.tap(s, rid="apagar-manter")


def apagando():
    R.mock("escrita-pendurada")
    abrir()
    n3.tap(s, rid="setlist-apagar", espera=2)
    n3.tap(s, rid="apagar-confirmar", espera=0.8); t0 = time.time()
    R.esperar(s, texto="Apagando no servidor…", prazo=5)
    r.cap("dialogo", "apagando")
    print(f"{hora()} apagando capturado {time.time() - t0:.1f} s depois do toque (prazo do cliente: 20 s)", flush=True)
    time.sleep(max(0, 23 - (time.time() - t0)))
    R.esperar(s, rid="apagar-manter")
    n3.tap(s, rid="apagar-manter")
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

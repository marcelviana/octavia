"""N3-PR2 — os estados de S1 que o roteiro do pre-check não tem, e S1 em retrato.

  SCR=<dir> ROT=<r> python3 n3pr2.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo> <estados...>

Estados: `setlists`, `aviso` (sem rede: o app abre já em avião, e o chip
espera a hora da última sincronização), `S1e`, `S1f`, `salvo` (salvo,
não relido: `Nova setlist` → nome → `Criar` contra o mock `escrita-resync-500`;
a escrita é no MOCK, que se relê da fixture ao trocar de modo — nada fica).
Nome de cada captura: N3P2-S1-<estado>-<sufixo>.{png,xml}.
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P2", suf)


def setlists():
    R.ir_s1(s); r.cap("S1", "setlists")


def aviso():
    # O app ABRE sem rede, como a base do AVD (div. 403): com o avião ligado com
    # o app aberto, o chip continua "sincronizado agora" até a próxima abertura.
    R.ir_s1(s); R.aviao(s, True)
    try:
        R.ir_s1(s)
    except RuntimeError:  # a recarga sem rede passa dos 60 s às vezes (N3-PR1, passada 2)
        R.esperar(s, rid="criar-setlist", prazo=60)
    R.esperar(s, rid="aviso-motivo"); R.esperar(s, texto="última sincronização", prazo=40)
    r.cap("S1", "aviso-sem-rede"); R.aviao(s, False)


def S1e():
    R.mock("500-pagina-1"); R.ir_s1(s); time.sleep(3); r.cap("S1", "S1e-falha-com-cache"); R.mock("normal")


def S1f():
    R.mock("normal", vazio=True); R.ir_s1(s); R.esperar(s, rid="s1f"); r.cap("S1", "S1f-vazia"); R.mock("normal")


def salvo():
    R.mock("escrita-resync-500"); R.ir_s1(s)
    # online de fato antes do toque: o `Nova setlist` inerte (sem rede) não abre a folha
    R.esperar(s, texto="sincronizado agora", prazo=60)
    n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome")
    r.digitar("Fixture N3 PR2")
    n3.esconder_teclado(s)
    n3.tap(s, rid="form-salvar", espera=4)
    R.esperar(s, rid="aviso-acao")
    r.cap("S1", "salvo-nao-relido")
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
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

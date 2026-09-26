"""N3-PR6c — a S5 com N músicas (a regra de N grande, div. 461), depois do conserto da largura da fileira.

  SCR=<dir-do-aparelho> PORTA=<p> ROT=<r> python3 n3pr6c.py <dir-instrumentos> <serial> <saida> <sufixo> <N...>

Para cada N: mock com a `Ensaio de retrato` de N músicas (as de texto da fixture em ciclo: 1, 2, 3, 7, 8, 9, 10,
12 — sem PDF, como a `n60` da N3-PR6b) e um `updated_at` PRÓPRIO de cada N (14:NN) — o sync compara por `!==`,
e dois N com o mesmo `updated_at` deixariam o anterior no cache (div. 457) → S1 → a setlist → rolar até
`song-N` → `N DE N` → `borda-avancar` → S5. Nada é escrito.

Nome da captura: N3P6C-S5-S5-n<N>-<sufixo>; com N = 60, `S5-S5-n-grande` (o nome da moldura, e o da N3-PR6b:
o par do G-N3 e o G-inv da paisagem contra a referência da 6b se fazem pelo nome).
"""
import copy, json, os, sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R
import n3pr6b as B  # noqa: E402 — reusa mock_com, song, cid, rolar_ate (o módulo não roda nada sem estados)

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P6C", suf)
B.s, B.r = s, r


def sN(n):
    sls, ct = B.base()
    por = {c["id"]: c for c in ct}
    sl = copy.deepcopy(sls[0])
    sl["setlist_songs"] = [B.song(sl, p, por[B.cid(B.TEXTO[(p - 1) % len(B.TEXTO)])]) for p in range(1, n + 1)]
    sl["updated_at"] = f"2026-09-23T14:{n % 60:02d}:{n // 60:02d}.000+00:00"
    B.mock_com(f"n{n}", [sl] + sls[1:], ct)
    R.ir_s1(s)
    R.esperar(s, texto="sincronizado agora", prazo=60)
    r.abrir_setlist()
    B.rolar_ate(f"song-{n}")
    n3.tap(s, rid=f"song-{n}", espera=3)
    R.esperar(s, texto=f"{n} DE {n}")
    n3.tap(s, rid="borda-avancar", espera=3)
    R.esperar(s, rid="voltar-inicio")
    r.cap("S5", "S5-n-grande" if n == 60 else f"S5-n{n}")
    R.mock("normal")


for a in sys.argv[5:]:
    try:
        sN(int(a))
    except Exception as e:  # noqa: BLE001 — registra e segue
        r.falhas.append(f"N={a}: {e}"); print(f"FALHA N={a}: {e}", flush=True)
        try:
            R.mock("normal")
        except Exception:  # noqa: BLE001
            pass
try:
    R.ir_s1(s)
except Exception as e:  # noqa: BLE001
    print(f"FALHA fecho: {e}", flush=True)
print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
for f in r.falhas:
    print("  " + f)

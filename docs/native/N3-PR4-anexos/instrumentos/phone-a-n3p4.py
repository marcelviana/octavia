"""N3-PR4 — o aceite mínimo de A no reordenar, na folha e no diálogo (errata do T3-R3): sem
crash, e a LISTA dos controles de escrita inalcançáveis por superfície (herança do N5).

  SCR=<dir> ROT=0 python3 phone-a-n3p4.py <dir-instrumentos-do-pre-check> <serial> <saida>

Um controle é ALCANÇÁVEL quando o nó existe no dump, tem área (≥ 1 px nas duas medidas) DENTRO
da janela, e o toque no centro da parte visível faz o que o controle faz — conferido no dump
seguinte. É o critério do `phone-a.py` da N3-PR3. As escritas vão ao MOCK (modo `normal`), que se
relê da fixture ao trocar de modo; o mock é reiniciado no fim.

  reordenar  `reordenar-sair` (volta a S2) · `alca-5` (`input swipe` até a alça 2: o `Salvar a
             ordem` ativa) · `reordenar-salvar` (grava e o modo fecha)
  folha      criar, por `criar-setlist` em S1: `form-nome` (o teclado sobe e o texto entra) ·
             `form-data` (abre o seletor do sistema; OK) · `form-data-limpar` (a data sai) ·
             `form-cancelar` (a folha fecha) · `form-salvar` (grava e a folha fecha)
  diálogo    a entrada é o `setlist-apagar` de S2, que em A é inalcançável (N3-PR3) — o diálogo
             só se abre se ele for; senão, a lista diz por quê
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida = sys.argv[2], sys.argv[3]
r = R.Roteiro(s, saida, "N3P4", "phone-ret")
F = 2.625
linhas = []


def hora():
    return time.strftime("%H:%M:%S")


def visivel(no, raiz):
    b = no["b"]
    x0, y0, x1, y1 = max(b[0], raiz[0]), max(b[1], raiz[1]), min(b[2], raiz[2]), min(b[3], raiz[3])
    return (x0, y0, x1, y1) if x1 - x0 >= 1 and y1 - y0 >= 1 else None


def tocar(sup, rid, prova, detalhe=""):
    """Toca `rid` no centro da parte visível e confere `prova(dump)`. Registra a linha."""
    nos = n3.dump(s)
    raiz = nos[0]["b"]
    no = n3.achar(nos, rid=rid)
    if no is None:
        linhas.append((sup, rid, "INALCANÇÁVEL", "sem nó no dump")); return False
    v = visivel(no, raiz)
    b = no["b"]
    px = f"bounds {no['bounds']}"
    if v is not None and (v[2] - v[0], v[3] - v[1]) != (b[2] - b[0], b[3] - b[1]):
        px += (f" — CORTADO: visível {(v[2] - v[0]) / F:.1f} × {(v[3] - v[1]) / F:.1f} de "
               f"{(b[2] - b[0]) / F:.1f} × {(b[3] - b[1]) / F:.1f} dp")
    if v is None:
        linhas.append((sup, rid, "INALCANÇÁVEL", f"{px}: nenhuma área dentro da janela {raiz}")); return False
    x, y = (v[0] + v[2]) // 2, (v[1] + v[3]) // 2
    n3.sh(s, "shell", "input", "tap", str(x), str(y)); time.sleep(2)
    print(f"{hora()} toque {rid!r} @ {x},{y} ({s})", flush=True)
    ok = prova(n3.dump(s))
    linhas.append((sup, rid, "alcançável" if ok else "INALCANÇÁVEL",
                   f"{px}; toque @ {x},{y} → {detalhe if ok else 'nada aconteceu'}"))
    return ok


def abrir():
    R.ir_s1(s)
    # em A o chip de S1 encolhe até o ícone (div. 416): o cartão da fixture prova o sync do mock
    R.esperar(s, rid="setlist-00000001", prazo=60); time.sleep(3)
    r.abrir_setlist()


def tem(rid=None, texto=None):
    return lambda nos: n3.achar(nos, rid=rid, texto=texto) is not None


def sem(rid):
    return lambda nos: n3.achar(nos, rid=rid) is None


R.mock("normal")
# ------------------------------------------------------------------ reordenar
abrir()
n3.tap(s, rid="reordenar", espera=2)
R.esperar(s, rid="alca-1")
r.cap("reordenar", "aberto")
tocar("reordenar", "reordenar-sair", tem(rid="picker-abrir"), "voltou a S2 (picker-abrir)")
if n3.achar(n3.dump(s), rid="reordenar") is not None:
    n3.tap(s, rid="reordenar", espera=2)
nos = n3.dump(s)
raiz = nos[0]["b"]
a5, a2 = n3.achar(nos, rid="alca-5"), n3.achar(nos, rid="alca-2")
if a5 is None or a2 is None or visivel(a5, raiz) is None:
    linhas.append(("reordenar", "alca-5", "INALCANÇÁVEL", "sem nó visível"))
else:
    x = (a5["b"][0] + a5["b"][2]) // 2
    y5, y2 = (a5["b"][1] + a5["b"][3]) // 2, (a2["b"][1] + a2["b"][3]) // 2
    n3.sh(s, "shell", "input", "swipe", str(x), str(y5), str(x), str(y2), "1500"); time.sleep(2)
    sal = n3.achar(n3.dump(s), rid="reordenar-salvar")
    ok = sal is not None and sal.get("enabled") == "true"
    linhas.append(("reordenar", "alca-5", "alcançável" if ok else "INALCANÇÁVEL",
                   f"bounds {a5['bounds']}; swipe {x},{y5} → {x},{y2} → "
                   f"{'`reordenar-salvar` ativo' if ok else '`reordenar-salvar` continua inativo'}"))
    r.cap("reordenar", "arrastado")
tocar("reordenar", "reordenar-salvar", sem("alca-1"), "gravou e o modo fechou (sem alca-1)")
R.mock("normal")

# ---------------------------------------------------------------------- folha
R.ir_s1(s)
R.esperar(s, rid="setlist-00000001", prazo=60); time.sleep(2)
n3.tap(s, rid="criar-setlist", espera=2)
R.esperar(s, rid="form-nome")
r.cap("folha", "criar")
tocar("folha", "form-cancelar", sem("form-nome"), "a folha fechou")
if n3.achar(n3.dump(s), rid="form-nome") is None:
    n3.tap(s, rid="criar-setlist", espera=2)
if tocar("folha", "form-nome", lambda nos: n3.teclado(s), "o teclado subiu"):
    r.digitar("Fixture N3")
    n3.esconder_teclado(s)
if tocar("folha", "form-data", tem(rid="button1"), "abriu o seletor do sistema"):
    ok = n3.achar(n3.dump(s), rid="button1")
    b = ok["b"]
    n3.sh(s, "shell", "input", "tap", str((b[0] + b[2]) // 2), str((b[1] + b[3]) // 2)); time.sleep(2)
    print(f"{hora()} seletor do sistema: OK", flush=True)
    r.cap("folha", "com-data")
    tocar("folha", "form-data-limpar", sem("form-data-limpar"), "a data saiu (sem form-data-limpar)")
tocar("folha", "form-salvar", sem("form-nome"), "gravou e a folha fechou")
R.mock("normal")

# -------------------------------------------------------------------- diálogo
abrir()
if tocar("dialogo", "setlist-apagar", tem(rid="apagar-manter"), "abriu o diálogo"):
    r.cap("dialogo", "apagar")
    tocar("dialogo", "apagar-manter", sem("apagar-manter"), "o diálogo fechou")
    n3.tap(s, rid="setlist-apagar", espera=2)
    tocar("dialogo", "apagar-confirmar", tem(rid="criar-setlist"), "apagou e saiu para S1 (criar-setlist)")
else:
    for rid in ("apagar-manter", "apagar-confirmar"):
        linhas.append(("dialogo", rid, "INALCANÇÁVEL", "a entrada (`setlist-apagar`) é inalcançável em A"))
R.mock("normal")

print("\n## faixa A (octavia_phone em retrato) — controles de escrita, por superfície")
for sup, rid, est, det in linhas:
    print(f"  {sup:<10} {rid:<18} {est:<13} {det}")
print(f"capturas={len(r.feitos)}")

"""N3-PR6 — J3 ponta a ponta em RETRATO (faixa B), Tab S6, mock `escrita`: o mesmo método da N2-PR7
(`N2-PR7-anexos/instrumentos/j3.sh`): cada gesto com relógio de parede desde o 1º toque; o lado do app
somado das linhas `write … ms=` + `resync … ms=` do logcat (o buffer limpo UMA vez, antes).

  SCR=<dir> PORTA=<p> ROT=<r> python3 j3.py <dir-instrumentos-do-pre-check> <serial> <saida>

Passos: 1 criar vazia (`J3 final`) · 1b abrir a setlist nova · 2 cinco músicas pelo picker (busca
`ensaio`; rola quando nenhum `Adicionar` está visível) · 3 reordenar a 5 para a 1 (DOWN/12×MOVE/UP) e
`Salvar a ordem`. No fim, o dump da listagem (`N3P6-S2-j3-final-tab-ret`), sem abrir item.
"""
import json, os, re, subprocess, sys, time, urllib.request
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida = sys.argv[2], sys.argv[3]
r = R.Roteiro(s, saida, "N3P6", "tab-ret")
G = 0
T0 = None


def gesto(o_que):
    global G
    G += 1
    print(f"  gesto {G} · {o_que} · t={time.time() - T0:.1f} s", flush=True)


def toque(rid, o_que=None):
    no = n3.achar(n3.dump(s), rid=rid)
    if no is None:
        raise RuntimeError(f"ABORTA: sem {rid}")
    b = no["b"]
    n3.sh(s, "shell", "input", "tap", str((b[0] + b[2]) // 2), str((b[1] + b[3]) // 2))
    gesto(o_que or f"toque {rid}")


TOPO_TECLADO_PX = 1713  # o teclado encaixado do Tab em retrato (APARATO, N3-PR4: 761,3 dp)


def primeiro_adicionar():
    limite = TOPO_TECLADO_PX if n3.teclado(s) else 10 ** 6
    for a in n3.dump(s):
        if re.fullmatch(r"picker-adicionar-\d+", a["id"]) and a.get("text", "") != "Tentar de novo":
            b = a["b"]
            # só o que está INTEIRO acima da borda da lista (div. 291)
            if (b[3] - b[1]) >= 48 * 2.25 - 1 and b[3] <= limite:
                return a["id"]
    return None


R.mock("escrita")
R.ir_s1(s)
R.esperar(s, texto="sincronizado agora", prazo=60)
n3.sh(s, "logcat", "-c")
T0 = time.time()
print("T0 = primeiro toque")
print("passo 1 — criar vazia")
toque("criar-setlist"); time.sleep(1.0)
n3.sh(s, "shell", "input", "text", "J3%sfinal"); gesto("digitar o nome (input text)"); time.sleep(0.6)
toque("form-salvar", "toque form-salvar (Criar)"); time.sleep(2.0)
print("passo 1b — abrir a setlist nova (a navegação de S1 para S2)")
sls = json.load(urllib.request.urlopen(f"http://127.0.0.1:{R.PORTA}/api/setlists"))
sid = [x["id"][:8] for x in sls if x["name"] == "J3 final"][0]
toque(f"setlist-{sid}", f"toque setlist-{sid} (abrir)"); time.sleep(1.5)
print("passo 2 — 5 músicas pelo picker")
toque("picker-abrir"); time.sleep(1.5)
n3.sh(s, "shell", "input", "text", "ensaio"); gesto("digitar a busca (input text)"); time.sleep(1.2)
for k in range(1, 6):
    a = primeiro_adicionar()
    if a is None:
        lista = next(x for x in n3.dump(s) if x.get("scrollable") == "true")["b"]
        x = (lista[0] + lista[2]) // 2
        n3.sh(s, "shell", "input", "swipe", str(x), str(lista[3] - 80), str(x), str(lista[1] + 200), "400")
        gesto("rolar a lista de resultados (swipe)"); time.sleep(1.0)
        a = primeiro_adicionar()
        if a is None:
            raise RuntimeError("ABORTA: sem Adicionar depois de rolar")
    toque(a, f"toque {a} (música {k})"); time.sleep(1.2)
# 1ª rodada (j3-tab-ret-1.txt): em retrato o teclado ENCAIXADO (topo 761,3 dp) cobre o `Concluir`
# (y ≈ 1034 dp) e o toque caiu numa tecla. O músico precisa fechar o teclado antes: um gesto a mais,
# contado. (Em paisagem, N2-PR7, o teclado do Tab era flutuante e não cobria o rodapé.)
if n3.teclado(s):
    n3.sh(s, "shell", "input", "keyevent", "KEYCODE_BACK"); gesto("fechar o teclado (BACK) — ele cobre o Concluir em retrato"); time.sleep(1.0)
toque("picker-concluir", "toque picker-concluir (sair do picker)"); time.sleep(1.5)
print("passo 3 — reordenar: a 5 para a 1")
toque("reordenar", "toque reordenar (entrar no modo)"); time.sleep(1.2)
d = n3.dump(s)
a5 = n3.achar(d, rid="alca-5")["b"]; a1 = n3.achar(d, rid="alca-1")["b"]
X, Y5, Y1 = (a5[0] + a5[2]) // 2, (a5[1] + a5[3]) // 2, (a1[1] + a1[3]) // 2
n3.sh(s, "shell", "input", "motionevent", "DOWN", str(X), str(Y5)); time.sleep(0.3)
for f in range(1, 13):
    n3.sh(s, "shell", "input", "motionevent", "MOVE", str(X), str(Y5 + (Y1 - Y5) * f // 12))
time.sleep(0.3)
n3.sh(s, "shell", "input", "motionevent", "UP", str(X), str(Y1)); gesto("arrasto alca-5 → posição 1 (DOWN/12×MOVE/UP)"); time.sleep(1.0)
toque("reordenar-salvar", "toque reordenar-salvar (Salvar a ordem)"); time.sleep(2.0)
T1 = time.time()
print(f"fim: t={T1 - T0:.1f} s de parede, {G} gestos")
out = n3.sh(s, "logcat", "-d", "-s", "ReactNativeJS:*", check=False)
linhas = [l[l.index("OCTAVIA:") + 9:] for l in out.splitlines() if "OCTAVIA:" in l]
print("log do fluxo:")
ms = 0
for l in linhas:
    if re.match(r"(write|resync|blocked|cache write)", l):
        print("    " + l)
        m = re.search(r" ms=(\d+)", l)
        if m and not l.startswith("cache"):
            ms += int(m.group(1))
print(f"lado do app, somado do log (write + resync): {ms} ms")
print(f"FATAL no logcat da rodada: {sum('FATAL' in l for l in out.splitlines())}")
r.cap("S2", "j3-final")
print("a listagem final, sem abrir item:")
for a in n3.dump(s):
    if re.fullmatch(r"song-\d+", a["id"]):
        print(f"  {a['id']} [enabled={a.get('enabled')}]: {a.get('content-desc', '')}")
R.mock("normal")

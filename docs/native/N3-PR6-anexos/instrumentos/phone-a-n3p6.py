"""N3-PR6 — a LISTA FINAL do celular (errata do T3-R3; A-N3-3): por superfície, cada controle de
escrita (e os do palco e da S5, que não escrevem mas são a saída da tela), com o `bounds` VISÍVEL e o
toque conferido. Em pé = faixa A (411,4); deitado = faixa B pela largura (914,3 × 371,4, div. 388).

  SCR=<dir> ROT=<0|1> python3 phone-a-n3p6.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo>

Alcançável = o nó existe no dump, tem área dentro da janela, e o toque no centro da parte VISÍVEL faz
o que o controle faz — conferido no dump seguinte (o critério do `phone-a.py` da N3-PR3, do
`phone-a-n3p4.py` da N3-PR4 e do `phone-palco.py` da N3-PR5). Cada controle parte de uma navegação
nova (o app aberto do zero), para que um toque não herde o estado do anterior. As escritas são no
MOCK (modo `escrita`, que se relê da fixture a cada troca de modo).

Capturas: uma por superfície (`N3P6-<tela>-<estado>-phone-<ret|pai>`), para os `bounds`.
Saída: uma linha por controle — superfície, controle, alcance, visível (dp), o que o toque fez.
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P6", suf)
F = 2.625
linhas = []


def hora():
    return time.strftime("%H:%M:%S")


def visivel(b, raiz):
    x0, y0, x1, y1 = max(b[0], raiz[0]), max(b[1], raiz[1]), min(b[2], raiz[2]), min(b[3], raiz[3])
    return (x0, y0, x1, y1) if x1 - x0 >= 1 and y1 - y0 >= 1 else None


# ---- como chegar a cada superfície (sempre do zero) ---------------------------------------
def s1():
    R.ir_s1(s)
    R.esperar(s, rid="setlist-00000001", prazo=60)


def s2e():
    s1(); r.abrir_setlist()


def picker():
    s2e(); n3.tap(s, rid="picker-abrir", espera=2)
    n3.tap(s, rid="picker-campo"); r.digitar("ensaio"); n3.esconder_teclado(s)


def s4():
    s1(); n3.tap(s, rid="buscar", espera=2)
    n3.tap(s, rid="campo-busca"); r.digitar("ensaio"); n3.esconder_teclado(s)


def reordenar():
    # deitado (371 dp) a alça 5 fica abaixo da dobra (queda da 1ª rodada): o modo se prova pela 2
    s2e(); n3.tap(s, rid="reordenar", espera=2); R.esperar(s, rid="alca-2")


def reordenar_arrastado():
    reordenar()
    a5 = R.esperar(s, rid="alca-2")["b"]; a2 = R.esperar(s, rid="alca-1")["b"]
    x = (a5[0] + a5[2]) // 2
    n3.sh(s, "shell", "input", "swipe", str(x), str((a5[1] + a5[3]) // 2), str(x), str((a2[1] + a2[3]) // 2), "1500")
    time.sleep(1.5)


def folha():
    s1(); n3.tap(s, rid="criar-setlist", espera=2)
    n3.tap(s, rid="form-nome"); r.digitar("Fixture N3"); n3.esconder_teclado(s)


def palco():
    s2e(); n3.tap(s, rid="song-1", espera=3); R.esperar(s, texto="1 DE 8")


def s5():
    # a linha 8 fica abaixo da dobra em A (queda da 1ª rodada): música 1 e sete avanços pela borda
    palco()
    for _ in range(7):
        n3.tap(s, rid="borda-avancar", espera=2.5)
    R.esperar(s, texto="8 DE 8")
    n3.tap(s, rid="borda-avancar", espera=3); R.esperar(s, rid="voltar-inicio")


def dialogo():
    s2e(); n3.tap(s, rid="setlist-apagar", espera=2); R.esperar(s, rid="apagar-manter")


# ---- (superfície, chegar, controle, prova do efeito: id ou texto no dump seguinte) ---------
CASOS = [
    ("S1", s1, "criar-setlist", {"rid": "form-nome"}),
    ("S1", s1, "buscar", {"rid": "campo-busca"}),
    ("S1", s1, "baixar-00000001", {"texto": "baixado"}),
    ("S2e", s2e, "picker-abrir", {"rid": "picker-campo"}),
    ("S2e", s2e, "reordenar", {"rid": "reordenar-sair"}),
    ("S2e", s2e, "setlist-editar", {"rid": "form-nome"}),
    ("S2e", s2e, "setlist-apagar", {"rid": "apagar-manter"}),
    ("S2e", s2e, "remover-1", {"texto": "7 músicas"}),
    ("picker", picker, "picker-adicionar-1", {"texto": "adicionada"}),
    ("picker", picker, "picker-concluir", {"rid": "reordenar"}),
    ("S4", s4, "fechar-busca", {"rid": "criar-setlist"}),
    ("reordenar", reordenar, "reordenar-sair", {"rid": "picker-abrir"}),
    ("reordenar", reordenar_arrastado, "reordenar-salvar", {"rid": "picker-abrir"}),
    ("folha", folha, "form-cancelar", {"rid": "criar-setlist"}),
    ("folha", folha, "form-salvar", {"texto": "FIXTURE N3"}),
    ("dialogo", dialogo, "apagar-manter", {"rid": "picker-abrir"}),
    ("dialogo", dialogo, "apagar-confirmar", {"rid": "criar-setlist"}),
    ("palco", palco, "indice", {"rid": "song-1"}),
    ("palco", palco, "busca", {"rid": "campo-busca"}),
    ("palco", palco, "sair", {"rid": "criar-setlist"}),  # `sair` vai a S1 (navigation.tsx: navigate('Setlists'))
    ("S5", s5, "voltar-inicio", {"texto": "1 DE 8"}),
    ("S5", s5, "sair", {"rid": "criar-setlist"}),
    ("S5", s5, "borda-voltar", {"texto": "8 DE 8"}),
]

CAPS = {"S1": ("S1", "setlists"), "S2e": ("S2", "com-edicao"), "picker": ("picker", "resultados"),
        "S4": ("S4", "resultados"), "reordenar": ("reordenar", "aberto"), "folha": ("folha", "criar"),
        "dialogo": ("dialogo", "apagar"), "palco": ("S3", "S3a-letra-1a"), "S5": ("S5", "fim")}
capturadas = set()

R.mock("escrita")
SO = sys.argv[5:]  # refazer só estes controles (`<superfície>:<controle>`)
for sup, chegar, rid, prova in CASOS:
    if SO and f"{sup}:{rid}" not in SO:
        continue
    try:
        chegar()
    except Exception as e:  # noqa: BLE001 — a superfície não abre: todos os controles dela são inalcançáveis
        linhas.append(f"{sup:10} {rid:20} INALCANÇÁVEL  a superfície não abre em {suf}: {e}")
        print(linhas[-1], flush=True)
        R.mock("escrita")
        continue
    d = n3.dump(s)
    raiz = d[0]["b"]
    if sup not in capturadas:
        r.cap(*CAPS[sup]); capturadas.add(sup)
        d = n3.dump(s)
    no = n3.achar(d, rid=rid)
    if no is None:
        linhas.append(f"{sup:10} {rid:20} INALCANÇÁVEL  sem nó no dump")
        print(linhas[-1], flush=True)
        continue
    b = no["b"]
    v = visivel(b, raiz)
    dp = f"[{b[0]/F:.1f},{b[1]/F:.1f}][{b[2]/F:.1f},{b[3]/F:.1f}]"
    if v is None:
        linhas.append(f"{sup:10} {rid:20} INALCANÇÁVEL  nó fora da janela {dp}")
        print(linhas[-1], flush=True)
        continue
    inteiro = abs((v[2] - v[0]) - (b[2] - b[0])) < 2 and abs((v[3] - v[1]) - (b[3] - b[1])) < 2
    x, y = (v[0] + v[2]) // 2, (v[1] + v[3]) // 2
    n3.sh(s, "shell", "input", "tap", str(x), str(y))
    time.sleep(3)
    try:
        R.esperar(s, prazo=12, **prova)
        efeito = f"✓ {list(prova.values())[0]!r} no dump seguinte"
        alc = "alcançável  " if inteiro else "CORTADO, tocado"
    except Exception:  # noqa: BLE001
        efeito = f"✗ sem {list(prova.values())[0]!r} depois do toque"
        alc = "SEM EFEITO   "
    linhas.append(f"{sup:10} {rid:20} {alc}  bounds {dp} · visível {(v[2]-v[0])/F:.1f} × {(v[3]-v[1])/F:.1f} dp · toque @ {x},{y} → {efeito}")
    print(linhas[-1], flush=True)
    R.mock("escrita")  # a escrita do toque não fica para o caso seguinte

R.mock("normal")
print(f"\n# lista final — {suf}")
for l in linhas:
    print(l)
print(f"capturas={len(r.feitos)}")

"""N3-PR6 — G5 e G6 CONSOLIDADOS: todo estado do bloco (cópia do g5g6-palco.py da N3-PR5, com o filtro de tela aberto) em quatro colunas (T3-R5): Tab × AVD, paisagem × retrato.

  python3 g5g6-todos.py <dir-dos-dumps> [<dir> ...]

Os dumps se acham pelo nome: `*-<S3|S5|S4|S0|picker|S2>-<estado>-<tab|avd>-<pai|ret>.xml`.
A ALÇA (`alca-<n>`) entra como alvo mesmo sem `clickable`: o gesto é do `PanResponder`, e o
`uiautomator` não a marca como clicável (div. 291) — sem isso o G5/G6 não a veria.
  G5: todo nó `clickable` do app tem as duas medidas ≥ 48 dp (a regra das duas bordas).
  G6: todo nó `clickable` do app tem `resource-id` (alvo tocável com testID); e a
      tabela diz, por estado e por id, em que colunas o id está (alcançável).
Exit 1 se o G5 ou o G6 reprovar em qualquer dump.

Dois consertos sobre a cópia (N3-PR3): as medidas se arredondam a 0,1 dp ANTES
da comparação (377/2,25 − 269/2,25 = 47,999…, e um alvo de 108 px reprovava);
e um alvo cuja base coincide com a base da lista (±0,5 dp) e fica
abaixo de 48 é LINHA CORTADA PELA ROLAGEM (div. 291) — listado à parte, não
reprova (o mesmo alvo, inteiro, está em outro ponto da rolagem).
"""
import glob, os, re, sys

COLS = [("tab", "pai"), ("tab", "ret"), ("avd", "pai"), ("avd", "ret")]
falhou = False
estados = {}
for d in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(d, "*.xml"))):
        m = re.match(r"^[A-Z0-9]+-(.+)-(tab|avd)-(pai|ret)\.xml$", os.path.basename(f))
        if m and m.group(1).endswith("-rolada"):
            continue
        if m:
            estados.setdefault(m.group(1), {})[(m.group(2), m.group(3))] = f
estados = dict(sorted(estados.items()))


def alvos(arq):
    out, rolagens = [], []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        b = [int(v) / 2.25 for v in re.findall(r"-?\d+", a["bounds"])]
        # N3-PR4: a LISTA é a classe `ScrollView`, não o `scrollable="true"` — durante o
        # arrasto o reordenar desliga a rolagem do dedo (`scrollEnabled={false}`), o dump
        # perde o `scrollable`, e a linha 7 cortada pela borda reprovava como alvo pequeno
        if a.get("scrollable") == "true" or a.get("class", "").endswith("ScrollView"):
            rolagens.append(b)
        rid = a.get("resource-id", "").split("/")[-1]
        if a.get("clickable") != "true" and not rid.startswith("alca-"):
            continue
        cortado = any(abs(b[3] - r[3]) < .5 and r[1] <= b[1] for r in rolagens)
        out.append((a.get("resource-id", "").split("/")[-1], round(b[2] - b[0], 1), round(b[3] - b[1], 1), cortado))
    return out


print(f"G5/G6 — {len(estados)} estados, quatro colunas: " + " · ".join(f"{a} {o}" for a, o in COLS))
for est, por in estados.items():
    print(f"\n## {est}")
    ids = {}
    for col in COLS:
        if col not in por:
            continue
        for rid, w, h, cortado in alvos(por[col]):
            if min(w, h) < 48 and cortado:
                print(f"  G5 · {col[0]} {col[1]}: {rid} {w:.1f} × {h:.1f} — cortado pela rolagem (div. 291), não reprova")
            elif min(w, h) < 48:
                print(f"  G5 ✗ {col[0]} {col[1]}: {rid or '(sem id)'} {w:.1f} × {h:.1f}"); falhou = True
            if not rid:
                print(f"  G6 ✗ {col[0]} {col[1]}: alvo sem testID {w:.1f} × {h:.1f}"); falhou = True
            # um id pode ter mais de um nó (ex.: S1f: `criar-setlist` na barra E no centro, N2):
            # a célula lista todos, na ordem do dump; ids de cartão se agrupam em `<id8>`
            # e os de linha (`song-<n>`, `remover-<n>`) em `<n>`: medidas distintas, com quantas
            k = ids.setdefault(re.sub(r"-\d+$", "-<n>", re.sub(r"-[0-9a-f]{8}$", "-<id8>", rid)) if rid else "(sem id)", {})
            k.setdefault(col, []).append((w, h))
    falta = [c for c in COLS if c not in por]
    if falta:
        print(f"  (sem dump: {', '.join(a + ' ' + o for a, o in falta)})")
    print("  | id | " + " | ".join(f"{a} {o}" for a, o in COLS) + " |")
    print("  |---|" + "---|" * len(COLS))
    for rid, cel in sorted(ids.items()):
        print(f"  | `{rid}` | " + " | ".join(" · ".join(f"{w:.1f} × {h:.1f}" + (f" ×{cel[c].count((w, h))}" if cel[c].count((w, h)) > 1 else "") for w, h in dict.fromkeys(cel[c])) if c in cel else "—" for c in COLS) + " |")
cel = sum(len(p) for p in estados.values())
print(f"\nestados: {len(estados)} · células (estado × coluna com dump): {cel} de {len(estados) * len(COLS)}")
print("\nG5: " + ("REPROVA ✗" if falhou else "todo alvo ≥ 48 dp ✓") + " · G6: " + ("REPROVA ✗" if falhou else "todo alvo com testID ✓"))
sys.exit(1 if falhou else 0)

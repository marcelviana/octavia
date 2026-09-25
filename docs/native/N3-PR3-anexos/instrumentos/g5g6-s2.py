"""N3-PR3 — G5 e G6 dos estados de S2 (cópia do g5g6-s1.py da N3-PR2, a tela no padrão) em quatro colunas (T3-R5): Tab × AVD, paisagem × retrato.

  python3 g5g6-s2.py <dir-dos-dumps>

Os dumps se acham pelo nome: `*-S2-<estado>-<tab|avd>-<pai|ret>.xml`.
  G5: todo nó `clickable` do app tem as duas medidas ≥ 48 dp (a regra das duas bordas).
  G6: todo nó `clickable` do app tem `resource-id` (alvo tocável com testID); e a
      tabela diz, por estado e por id, em que colunas o id está (alcançável).
Exit 1 se o G5 ou o G6 reprovar em qualquer dump.

Dois consertos sobre a cópia (N3-PR3): as medidas se arredondam a 0,1 dp ANTES
da comparação (377/2,25 − 269/2,25 = 47,999…, e um alvo de 108 px reprovava);
e um alvo cuja base coincide com a base da lista rolável (±0,5 dp) e fica
abaixo de 48 é LINHA CORTADA PELA ROLAGEM (div. 291) — listado à parte, não
reprova (o mesmo alvo, inteiro, está em outro ponto da rolagem).
"""
import glob, os, re, sys

COLS = [("tab", "pai"), ("tab", "ret"), ("avd", "pai"), ("avd", "ret")]
d = sys.argv[1]
falhou = False
estados = {}
for f in sorted(glob.glob(os.path.join(d, "*-S2-*.xml"))):
    m = re.match(r".*?-S2-(.+)-(tab|avd)-(pai|ret)\.xml$", os.path.basename(f))
    if m:
        estados.setdefault(m.group(1), {})[(m.group(2), m.group(3))] = f


def alvos(arq):
    out, rolagens = [], []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        b = [int(v) / 2.25 for v in re.findall(r"-?\d+", a["bounds"])]
        if a.get("scrollable") == "true":
            rolagens.append(b)
        if a.get("clickable") != "true":
            continue
        cortado = any(abs(b[3] - r[3]) < .5 and r[1] <= b[1] for r in rolagens)
        out.append((a.get("resource-id", "").split("/")[-1], round(b[2] - b[0], 1), round(b[3] - b[1], 1), cortado))
    return out


print("G5/G6 — S2, quatro colunas: " + " · ".join(f"{a} {o}" for a, o in COLS))
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
print("\nG5: " + ("REPROVA ✗" if falhou else "todo alvo ≥ 48 dp ✓") + " · G6: " + ("REPROVA ✗" if falhou else "todo alvo com testID ✓"))
sys.exit(1 if falhou else 0)

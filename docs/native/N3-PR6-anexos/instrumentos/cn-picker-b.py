"""N3-PR6 — CN de DUMP da N3-E18 (o picker em B com falha ou limite). O CN do `picker.test.tsx` mede a
árvore; os sintomas que o aceite achou só existem no dump:

  (1) o TÍTULO da linha 1 tem de estar no dump, com largura ≥ 100 dp (na falha ele sumia: largura 0;
      no limite ficava em 43 dp);
  (2) o `picker-adicionar-1` (`Tentar de novo`), quando existe, tem de terminar DENTRO do cartão e da
      janela, com a margem da lista (≤ largura − 24): na falha ele ia até 711,1, a borda, cortado.
  (3) CP — os estados base do picker em B (vazio, resultados, relendo) têm os MESMOS `bounds`, nó a nó,
      que os da N3-PR5 (a forma do `g-inv.sh`: classe, id e bounds em dp; sem texto, sem o "Tools").

  python3 cn-picker-b.py <dir-dos-dumps-x> <dir-dos-dumps-ret> <dir-dos-dumps-ret-da-N3-PR5>

Exit 1 se (1), (2) ou (3) reprovar em qualquer dump.
"""
import glob, os, re, sys

TITULO = "Manhã de ensaio"  # a linha 1 da busca "ensaio" na fixture do pre-check (escrita pelo projeto)


def nos(f):
    F = 2.625 if "phone" in f else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(f).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        a["b"] = [round(int(v) / F, 1) for v in re.findall(r"-?\d+", a["bounds"])]
        a["id"] = a.get("resource-id", "").split("/")[-1]
        out.append(a)
    return out


falhou = False
dx, dret, d5 = sys.argv[1:4]
print("(1) título da linha 1 e (2) o `Tentar de novo` dentro da janela — picker com falha e limite, retrato")
for f in sorted(glob.glob(os.path.join(dx, "*-picker-X-falhou-*-ret.xml")) + glob.glob(os.path.join(dx, "*-picker-X-limite-*-ret.xml"))):
    ns = nos(f)
    W = ns[0]["b"][2]
    t = next((a for a in ns if a.get("text") == TITULO), None)
    lt = (t["b"][2] - t["b"][0]) if t else 0.0
    ok1 = t is not None and lt >= 100
    al = next((a for a in ns if a["id"] == "picker-adicionar-1"), None)
    ok2 = al is None or al["b"][2] <= W - 24 + .05
    falhou |= not (ok1 and ok2)
    alvo = "sem alvo (o limite não repete)" if al is None else f"picker-adicionar-1 x1 {al['b'][2]:.1f} (limite {W - 24:.1f})"
    print(f"  {os.path.basename(f)}: título {('%.1f dp' % lt) if t else 'AUSENTE'} {'✓' if ok1 else '✗'} · {alvo} {'✓' if ok2 else '✗'}")


def sem_compose(f):
    # tira a subárvore do ComposeView (o "Tools" do dev client), como o g-inv.sh
    x = open(f).read()
    out, prof, fora = [], 0, 0
    F = 2.25
    for m in re.finditer(r"<node ([^>]*?)(/?)>|</node>", x):
        if m.group(0) == "</node>":
            prof -= 1
            if fora and prof < fora:
                fora = 0
            continue
        aberto = m.group(2) != "/"
        if aberto:
            prof += 1
        if fora:
            continue
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("class", "").endswith("ComposeView"):
            if aberto:
                fora = prof
            continue
        if a.get("package") != "rocks.octavia.app":
            continue
        b = [round(int(v) / F, 1) for v in re.findall(r"-?\d+", a["bounds"])]
        out.append(f"{a.get('class')} {a.get('resource-id', '').split('/')[-1] or '-'} {b}")
    return out


print("(3) CP — os estados base do picker em B, nó a nó contra a N3-PR5")
for est in ("picker-vazio", "picker-resultados", "picker-relendo"):
    for ap in ("tab", "avd"):
        novo = glob.glob(os.path.join(dret, f"*-{est}-{ap}-ret.xml"))
        velho = glob.glob(os.path.join(d5, f"*-{est}-{ap}-ret.xml"))
        if not novo or not velho:
            print(f"  {est} {ap}: sem par"); falhou = True; continue
        a, b = sem_compose(novo[0]), sem_compose(velho[0])
        igual = a == b
        falhou |= not igual
        print(f"  {est} {ap}: {len(a)} × {len(b)} nós · {'idênticos ✓' if igual else 'DIFERENTES ✗'}")
        if not igual:
            for i, (x, y) in enumerate(zip(a, b)):
                if x != y:
                    print(f"      1ª diferença, nó {i}: {x}  ≠  {y}"); break

print("CN-picker-B: " + ("REPROVA ✗" if falhou else "passa ✓"))
sys.exit(1 if falhou else 0)

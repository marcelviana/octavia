"""N3-PR6 — a linha de aviso dos estados transversais, em toda superfície que os tem (A-N3-7; T3-R7).

  python3 medidas-x.py <dir-dos-dumps> [<dir> ...]

A linha não é nó (sem borda, sem id — `medidas-s2.py` da N3-PR3): a ALTURA dela é o vão entre o nó
de largura cheia que termina logo acima do `aviso-motivo` (barra, faixa de edição) e o que começa
logo abaixo dele (a lista, o corpo). "Largura cheia" = ≥ 90 % da raiz. O motivo nunca elide: o
dump não tem `…` no texto dele (o RN não elide sem `numberOfLines`, div. 384), e a altura do texto
cresce 20 por linha. A folha não tem `LinhaDeAviso`: o estado dela é o cartão `form-falha`, cuja
altura sai inteira, e o motivo inativo ao lado do botão (`form-salvar-motivo`).

A folha (DESIGN-N3 §10, faixa B): sem rede 68 · salvo-não-relido 68 · falhou 70 · limite 48 ·
teto de 100 68 — com as erratas da §9: a linha mede 66,2 onde a folha diz 68 e 70 (N3-PR2/PR3, a
caixa de texto de 42,2 + 24 de respiro), e o teto de 100 cabe numa linha no app (N3-E14: 48,0).
"""
import glob, os, re, sys

FOLHA = {"sem-rede": 68, "salvo-nao-relido": 68, "falhou": 70, "limite": 48, "acima-de-100": 68}
ERRATA = {"sem-rede": 66.2, "salvo-nao-relido": 66.2, "falhou": 66.2, "limite": 48.0, "acima-de-100": 48.0}


def nos(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        a["b"] = [int(v) / F for v in re.findall(r"-?\d+", a["bounds"])]
        a["id"] = a.get("resource-id", "").split("/")[-1]
        out.append(a)
    return out


def especie(nome):
    for k in FOLHA:
        if nome.endswith(k) or f"-{k}-" in nome or nome.endswith(f"aviso-{k}"):
            return k
    return None


arqs = sorted(f for d in sys.argv[1:] for f in glob.glob(os.path.join(d, "*.xml")) if "-rolada-" not in f)
print("linha de aviso — altura (vão entre o nó cheio de cima e o de baixo), texto do motivo, elide?")
print(f"{'dump':58} {'espécie':17} {'altura':>7} {'folha':>6} {'errata':>7} {'motivo (larg × alt)':>22}  elide")
for f in arqs:
    nome = os.path.basename(f)[:-4]
    ns = nos(f)
    if not ns:
        continue
    raiz = ns[0]["b"]; W = raiz[2] - raiz[0]
    am = next((a for a in ns if a["id"] == "aviso-motivo"), None)
    ff = next((a for a in ns if a["id"] == "form-falha"), None)
    fm = next((a for a in ns if a["id"] == "form-salvar-motivo"), None)
    esp = especie(nome.rsplit("-", 2)[0])
    if am is not None:
        b = am["b"]
        cheios = [a for a in ns if (a["b"][2] - a["b"][0]) >= .9 * W and a is not ns[0]]
        cima = max((a["b"][3] for a in cheios if a["b"][3] <= b[1] + .1), default=raiz[1])
        baixo = min((a["b"][1] for a in cheios if a["b"][1] >= b[3] - .1), default=raiz[3])
        h = baixo - cima
        t = am.get("text", "")
        fo = FOLHA.get(esp, "—"); er = ERRATA.get(esp, "—")
        ok = "" if esp is None else ("✓" if abs(h - er) <= .1 else "✗")
        print(f"{nome:58} {esp or '?':17} {h:7.1f} {fo:>6} {er:>7} {b[2]-b[0]:10.1f} × {b[3]-b[1]:5.1f}  "
              f"{'SIM ✗' if t.endswith('…') else 'não'} {ok}")
    elif ff is not None:
        b = ff["b"]
        print(f"{nome:58} {'folha: form-falha':17} {b[3]-b[1]:7.1f} {'—':>6} {'—':>7} {b[2]-b[0]:10.1f} × {b[3]-b[1]:5.1f}  (cartão)")
    elif fm is not None:
        b = fm["b"]; t = fm.get("text", "")
        print(f"{nome:58} {'folha: motivo':17} {'—':>7} {'—':>6} {'—':>7} {b[2]-b[0]:10.1f} × {b[3]-b[1]:5.1f}  "
              f"{'SIM ✗' if t.endswith('…') else 'não'}")

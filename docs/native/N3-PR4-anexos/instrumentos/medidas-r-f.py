"""N3-PR4 — as medidas do reordenar, da folha e do diálogo num dump, em dp, contra a folha
(N3-D23: > 4 dp é errata).

  python3 medidas-r-f.py <dump.xml> [...]

Fator pelo nome (2,625 se `phone`, 2,25 no resto). A tela se decide pelo nome
(`reordenar-`, `folha-`, `dialogo-`). O que cada linha mede:

  reordenar
    barra           o ViewGroup de largura cheia que contém o título e `reordenar-salvar` (altura)
    título          o TextView `REORDENAR · …` (largura; a folha: a primeira linha inteira, 663)
    Cancelar · motivo · Salvar a ordem   as larguras de `reordenar-sair`, `reordenar-salvar-motivo`,
                    `reordenar-salvar` (com o rótulo quando não é o de "nada mudou"); a linha de ações
                    NÃO é nó no dump (o RN achata a View só de layout), então o vão vai da borda
                    esquerda de `reordenar-sair` à direita de `reordenar-salvar`, e a folga = vão − as três
    linha           o pai de `alca-1` (largura × altura); `x das linhas` = os x0 distintos
    alça            `alca-1` (largura × altura)
    artista mín.    a menor largura de `· artista` entre as linhas (a folha: mínimo 60)
  folha
    cartão          o menor ViewGroup que contém `form-nome` e `form-salvar` (largura × altura, topo, fundo)
    campo           `form-nome` (largura: a folha diz 599 úteis)
    Cancelar · motivo · Criar   `form-cancelar`, `form-salvar-motivo`, `form-salvar`; soma = as três
                    larguras; vão = da borda esquerda do `Cancelar` à direita do ato
    form-salvar     o `bounds` em px e em dp (é o que se cita contra o topo do teclado)
  dialogo
    diálogo         o menor ViewGroup que contém `apagar-manter` e `apagar-confirmar`
    Manter · Apagar `apagar-manter`, `apagar-confirmar`

A folha é o README do DESIGN-N3 com as erratas da §9 (E5: o motivo "nada mudou" 237,8) e o
`medidas.json` (c6 `Salvar a ordem` 191, c7 `Cancelar` 121, c8 `Criar` 126, c9 motivo 197,
c10 `Manter a setlist` 173, c11 `Apagar` 142); as somas do prompt da N3-PR4 (reordenar B = 144;
folha B = 663 × ≈ 486, topo 96, fundo ≈ 582; botões 474 de 599 — 121 + 197 + 126 = 444 de largura,
o resto são os vãos).
"""
import re, sys

FOLHA = {
    "barra": 144, "Cancelar (reordenar)": 96, "motivo nada mudou": 237.8, "Salvar a ordem": 191,
    "linha (largura)": 663, "linha (altura)": 72, "alça (largura)": 48, "alça (altura)": 72,
    "cartão (largura)": 663, "cartão (topo)": 96, "campo": 599, "Cancelar (folha)": 121,
    "motivo nome vazio": 197, "Criar": 126, "botões (soma)": 444, "linha de botões (vão)": 599,
    "diálogo (largura)": 620, "Manter a setlist": 173, "Apagar (diálogo)": 142,
}


def nos(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        px = [int(v) for v in re.findall(r"-?\d+", a.get("bounds", ""))]
        out.append({"cls": a.get("class", "").split(".")[-1], "id": a.get("resource-id", "").split("/")[-1],
                    "t": a.get("text", ""), "pkg": a.get("package", ""), "px": px, "b": [v / F for v in px],
                    "en": a.get("enabled")})
    return [n for n in out if n["pkg"] == "rocks.octavia.app"]


dentro = lambda n, c: n["b"][0] >= c["b"][0] - .1 and n["b"][1] >= c["b"][1] - .1 and n["b"][2] <= c["b"][2] + .1 and n["b"][3] <= c["b"][3] + .1
W = lambda n: n["b"][2] - n["b"][0]
H = lambda n: n["b"][3] - n["b"][1]


def menor(ns, *alvos, cheio=None):
    c = [n for n in ns if n["cls"] == "ViewGroup" and all(dentro(a, n) for a in alvos) and n not in alvos]
    if cheio is not None:
        c = [n for n in c if abs(W(n) - cheio) < .5]
    return min(c, key=lambda n: W(n) * H(n)) if c else None


def medir(arq):
    ns = nos(arq)
    raiz = ns[0]
    por = {n["id"]: n for n in reversed(ns) if n["id"]}
    r = {}
    if "reordenar-salvar" in por:
        tit = next((n for n in ns if n["t"].startswith("REORDENAR ·")), None)
        if tit is not None:
            barra = menor(ns, tit, por["reordenar-salvar"], cheio=W(raiz))
            if barra: r["barra"] = H(barra)
            r["título"] = W(tit)
        sair = por.get("reordenar-sair")
        if sair is not None:
            rot = next((n["t"] for n in ns if n["t"] and dentro(n, sair)), "")
            r["Cancelar (reordenar)" if rot == "Cancelar" else f"{rot} (reordenar-sair)"] = W(sair)
        mot = por.get("reordenar-salvar-motivo") or por.get("reordenar-motivo")
        if mot is not None:
            r["motivo nada mudou" if mot["id"] == "reordenar-salvar-motivo" else "motivo relendo"] = W(mot)
        sal = por["reordenar-salvar"]
        rot = next((n["t"] for n in ns if n["t"] and dentro(n, sal)), "")
        r["Salvar a ordem" if rot == "Salvar a ordem" else f"{rot} (reordenar-salvar)"] = W(sal)
        if sair is not None:
            # a linha de ações não é nó no dump (o RN achata a View só de layout): o vão
            # vai da borda esquerda de `reordenar-sair` à direita de `reordenar-salvar`
            vao = sal["b"][2] - sair["b"][0]
            soma = W(sair) + (W(mot) if mot else 0) + W(sal)
            r["linha de ações"] = vao
            r["folga da linha de ações"] = vao - soma
        if "alca-1" in por:
            a1 = por["alca-1"]
            pai = menor(ns, a1)
            if pai: r["linha (largura)"], r["linha (altura)"] = W(pai), H(pai)
            r["alça (largura)"], r["alça (altura)"] = W(a1), H(a1)
            xs = sorted({round(por[k]["b"][0], 1) for k in por if k.startswith("alca-")})
            r["x das alças"] = " · ".join(f"{x:.1f}" for x in xs)
            arts = [n for n in ns if n["t"].startswith("· ")]
            if arts: r["artista mín."] = min(W(n) for n in arts)
    ato = por.get("form-salvar") or por.get("form-tentar")  # na falha o ato é o `form-tentar`
    if "form-nome" in por and ato is not None:
        c = menor(ns, por["form-nome"], ato)
        if c:
            r["cartão (largura)"], r["cartão (altura)"] = W(c), H(c)
            r["cartão (topo)"], r["cartão (fundo)"] = c["b"][1], c["b"][3]
        r["campo"] = W(por["form-nome"])
        if "form-cancelar" in por:
            fc = por["form-cancelar"]
            rc = next((n["t"] for n in ns if n["t"] and dentro(n, fc)), "")
            r["Cancelar (folha)" if rc == "Cancelar" else f"{rc} (form-cancelar)"] = W(fc)
            r["linha de botões (vão)"] = ato["b"][2] - fc["b"][0]
            mot = por.get("form-salvar-motivo")
            ra = next((n["t"] for n in ns if n["t"] and dentro(n, ato)), "")
            # a soma da folha (121 + 197 + 126) é a da `N3-B-F-validacao`: Cancelar · nome vazio · Criar
            moldura = rc == "Cancelar" and ra == "Criar" and mot is not None and mot["t"] == "a setlist precisa de um nome"
            soma = W(fc) + (W(mot) if mot else 0) + W(ato)
            r["botões (soma)" if moldura else "botões (soma, outro estado)"] = soma
        if "form-salvar-motivo" in por:
            k = "motivo nome vazio" if por["form-salvar-motivo"]["t"] == "a setlist precisa de um nome" else f"motivo “{por['form-salvar-motivo']['t']}”"
            r[k] = W(por["form-salvar-motivo"])
        fs = ato
        rot = next((n["t"] for n in ns if n["t"] and dentro(n, fs)), "")
        r["Criar" if rot == "Criar" else f"{rot} ({fs['id']})"] = W(fs)
        r[f"{fs['id']} bounds"] = f"px {fs['px']} = dp [{fs['b'][0]:.1f},{fs['b'][1]:.1f}][{fs['b'][2]:.1f},{fs['b'][3]:.1f}]"
    if "apagar-manter" in por and "apagar-confirmar" in por:
        d = menor(ns, por["apagar-manter"], por["apagar-confirmar"])
        d2 = menor(ns, d) if d else None  # o cartão: o pai do rodapé
        cart = d2 if d2 is not None and W(d2) < W(raiz) - 1 else d
        r["diálogo (largura)"], r["diálogo (altura)"] = W(cart), H(cart)
        r["Manter a setlist"] = W(por["apagar-manter"])
        r["Apagar (diálogo)"] = W(por["apagar-confirmar"])
    return r


for arq in sys.argv[1:]:
    print(f"== {arq.split('/')[-1]}")
    for k, v in medir(arq).items():
        if isinstance(v, str):
            print(f"  {k:26} {v}")
            continue
        f = FOLHA.get(k)
        if f is None:
            print(f"  {k:26} {v:7.1f}")
        else:
            d = v - f
            print(f"  {k:26} {v:7.1f}  folha {f:6.1f}  Δ {d:+6.1f}  {'> 4 dp' if abs(d) > 4 else 'confere'}")

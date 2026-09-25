"""N3-PR2 — as medidas de S1 num dump, em dp, contra a folha (N3-D23: > 4 dp é errata).

  python3 medidas-s1.py <dump.xml> [...]

Fator pelo nome (2,625 se `phone`, 2,25 no resto). O que cada linha mede:
  barra      o ViewGroup de largura cheia que contém SETLISTS e `criar-setlist` (a barra tem borda: é nó)
  cartão     `setlist-00000001` (altura)
  nome       o 1º TextView dentro do cartão (largura)
  Nova setlist / Buscar música / Baixar   `criar-setlist` (o da barra) · `buscar` · `baixar-00000001` (largura)
  chip       (cada um contra a sua referência) do ícone do chip (o SvgView à esquerda do 1º texto do chip) à borda direita do texto mais largo
  aviso      a linha não é nó (sem borda, sem id): topo do 1º cartão − 32 (respiro da lista) − base da barra
A folha é a do README do DESIGN-N3 com as erratas da §9 (E2: 152; E6: 192,4; E8: aviso de 2 linhas = 68).
"""
import re, sys

FOLHA = {"barra": 144, "cartão": 184, "nome": 583, "Nova setlist": 152, "Buscar música": 171.1,
         "Baixar esta setlist": 193.8, "chip (sem rede, empilhado)": 192.4, "chip (sincronizado agora)": 144.9, "aviso": 68}


def nos(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        b = [int(v) / F for v in re.findall(r"-?\d+", a.get("bounds", ""))]
        out.append({"cls": a.get("class", "").split(".")[-1], "id": a.get("resource-id", "").split("/")[-1],
                    "t": a.get("text", ""), "pkg": a.get("package", ""), "b": b})
    return [n for n in out if n["pkg"] == "rocks.octavia.app"]


dentro = lambda n, c: n["b"][0] >= c["b"][0] - .1 and n["b"][1] >= c["b"][1] - .1 and n["b"][2] <= c["b"][2] + .1 and n["b"][3] <= c["b"][3] + .1
W = lambda n: n["b"][2] - n["b"][0]
H = lambda n: n["b"][3] - n["b"][1]


def medir(arq):
    ns = nos(arq)
    r = {}
    tit = next((n for n in ns if n["t"] == "SETLISTS"), None)
    criar = next((n for n in ns if n["id"] == "criar-setlist"), None)
    raiz = ns[0]
    if tit and criar:
        barras = [n for n in ns if n["cls"] == "ViewGroup" and abs(W(n) - W(raiz)) < .5 and dentro(tit, n) and dentro(criar, n)]
        if barras:
            barra = min(barras, key=H); r["barra"] = H(barra)
    cart = next((n for n in ns if n["id"] == "setlist-00000001"), None)
    if cart:
        r["cartão"] = H(cart)
        nome = next((n for n in ns if n["cls"] == "TextView" and dentro(n, cart)), None)
        if nome: r["nome"] = W(nome)
    if criar: r["Nova setlist"] = W(criar)
    b = next((n for n in ns if n["id"] == "buscar"), None)
    if b: r["Buscar música"] = W(b)
    bx = next((n for n in ns if n["id"] == "baixar-00000001"), None)
    if bx: r["Baixar esta setlist"] = W(bx)
    tchip = [n for n in ns if n["cls"] == "TextView" and re.match(r"(sincroniz|sem conexão|última|mostrando)", n["t"])]
    if tchip:
        t0 = min(tchip, key=lambda n: n["b"][1])
        ic = [n for n in ns if n["cls"] == "SvgView" and n["b"][2] <= t0["b"][0] + .1 and abs((n["b"][1] + n["b"][3]) / 2 - (min(x["b"][1] for x in tchip) + max(x["b"][3] for x in tchip)) / 2) < 12]
        if ic:
            i = max(ic, key=lambda n: n["b"][2]); w = max(x["b"][2] for x in tchip) - i["b"][0]
            # cada chip contra a SUA referência: o empilhado sem rede é a e4 (N3-E6, 192,4); o
            # "sincronizado agora" é a m3 (144,9, dump de C); os demais textos não têm linha na folha
            if any(x["t"] == "sem conexão" for x in tchip): r["chip (sem rede, empilhado)"] = w
            elif t0["t"] == "sincronizado agora": r["chip (sincronizado agora)"] = w
            else: r[f"chip ({t0['t']})"] = w
    am = next((n for n in ns if n["id"] == "aviso-motivo"), None)
    if am and "barra" in r and cart:
        r["aviso"] = cart["b"][1] - 32 - barra["b"][3]
        r["aviso-motivo (texto)"] = H(am)
    return r


for arq in sys.argv[1:]:
    print(f"== {arq.split('/')[-1]}")
    for k, v in medir(arq).items():
        f = FOLHA.get(k)
        d = "" if f is None else f"  folha {f:g}  Δ {v - f:+.1f}{'  > 4 → ERRATA' if abs(v - f) > 4 else ''}"
        print(f"  {k:<22} {v:7.1f}{d}")

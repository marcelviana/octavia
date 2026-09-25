"""N3-PR3 — as medidas de S2 num dump, em dp, contra a folha (N3-D23: > 4 dp é errata).

  python3 medidas-s2.py <dump.xml> [...]

Fator pelo nome (2,625 se `phone`, 2,25 no resto). O que cada linha mede:
  barra           o ViewGroup de largura cheia que contém `voltar` e `buscar` (altura)
  faixa           o ViewGroup de largura cheia que contém `picker-abrir` e `setlist-apagar` (altura)
  Adicionar … Apagar   a largura de `picker-abrir` · `reordenar` · `setlist-editar` · `setlist-apagar`
  soma da faixa   margem esq. + os quatro + os vãos DENTRO dos grupos + 16 entre os grupos + margem dir.
                  (a conta da folha: 24 + 137 + 16 + 142,5 + 16 + 193 + 16 + 115 + 24), e a folga
                  = largura da faixa − soma (o que o espaçador entre os grupos come)
  linha           `song-1` (largura × altura); `x das linhas` = os x0 distintos de todo `song-<n>`
  título          o TextView do título de `song-1` (o 2º TextView da linha, depois do número)
  tipo            do ícone de tipo (SvgView antes do rótulo) à borda direita do rótulo
  remover         `remover-1` (largura)
  aviso           a linha não é nó (sem borda, sem id): topo da lista − base da faixa (S2e)
A folha é o README do DESIGN-N3 com as erratas da §9 (E4: `Apagar` 119,6 → faixa 687,1;
e1 `Adicionar` 136,0 medido pela régua); as alturas do aviso são as da §10 da folha
(sem rede 68 · salvo-não-relido 68 · falhou 70 · limite 48 · acima de 100 68).
"""
import re, sys

FOLHA = {"barra": 88, "faixa": 64, "Adicionar": 136.0, "Reordenar": 142.5, "Renomear e datar": 193,
         "Apagar": 119.6, "soma da faixa": 687.1, "linha (largura)": 663, "linha (altura)": 116,
         "título": 377, "tipo": 104, "remover": 48}
AVISO = {"sem-rede": 68, "salvo-nao-relido": 68, "falhou": 70, "limite": 48, "acima-de-100": 68}
ROTULO = {"picker-abrir": "Adicionar", "reordenar": "Reordenar", "setlist-editar": "Renomear e datar",
          "setlist-apagar": "Apagar"}


def nos(arq):
    F = 2.625 if "phone" in arq else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(arq).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        b = [int(v) / F for v in re.findall(r"-?\d+", a.get("bounds", ""))]
        out.append({"cls": a.get("class", "").split(".")[-1], "id": a.get("resource-id", "").split("/")[-1],
                    "t": a.get("text", ""), "cd": a.get("content-desc", ""), "pkg": a.get("package", ""), "b": b})
    return [n for n in out if n["pkg"] == "rocks.octavia.app"]


dentro = lambda n, c: n["b"][0] >= c["b"][0] - .1 and n["b"][1] >= c["b"][1] - .1 and n["b"][2] <= c["b"][2] + .1 and n["b"][3] <= c["b"][3] + .1
W = lambda n: n["b"][2] - n["b"][0]
H = lambda n: n["b"][3] - n["b"][1]


def medir(arq):
    ns = nos(arq)
    r, txt = {}, {}
    raiz = ns[0]
    por = {n["id"]: n for n in reversed(ns) if n["id"]}
    cheio = lambda a, b: [n for n in ns if n["cls"] == "ViewGroup" and abs(W(n) - W(raiz)) < .5 and dentro(a, n) and dentro(b, n)]
    if "voltar" in por and "buscar" in por:
        c = cheio(por["voltar"], por["buscar"])
        if c: r["barra"] = H(min(c, key=H))
    faixa = None
    if "picker-abrir" in por and "setlist-apagar" in por:
        c = cheio(por["picker-abrir"], por["setlist-apagar"])
        if c:
            faixa = min(c, key=H); r["faixa"] = H(faixa)
        ctl = [por[k] for k in ROTULO]
        for k, n in zip(ROTULO, ctl):
            r[ROTULO[k]] = W(n)
            txt[ROTULO[k]] = f"texto {next((x['t'] for x in ns if x['cls'] == 'TextView' and dentro(x, n)), '?')!r} · nome {n['cd']!r}"
        if faixa:
            a, b, c2, d = ctl
            soma = (a["b"][0] - faixa["b"][0]) + W(a) + (b["b"][0] - a["b"][2]) + W(b) + 16 + W(c2) + (d["b"][0] - c2["b"][2]) + W(d) + (faixa["b"][2] - d["b"][2])
            r["soma da faixa"] = soma
            txt["soma da faixa"] = (f"{a['b'][0] - faixa['b'][0]:.1f} + {W(a):.1f} + {b['b'][0] - a['b'][2]:.1f} + {W(b):.1f} + 16 + {W(c2):.1f} + "
                                    f"{d['b'][0] - c2['b'][2]:.1f} + {W(d):.1f} + {faixa['b'][2] - d['b'][2]:.1f}; faixa {W(faixa):.1f}, "
                                    f"folga {W(faixa) - soma:.1f} (vão real entre os grupos {c2['b'][0] - b['b'][2]:.1f})")
    songs = [n for n in ns if re.fullmatch(r"song-\d+", n["id"])]
    if songs:
        s1 = por.get("song-1", songs[0])
        r["linha (largura)"] = W(s1); r["linha (altura)"] = H(s1)
        txt["linha (largura)"] = f"x0 das {len(songs)} linhas no dump: {sorted({round(n['b'][0], 1) for n in songs})}"
        tv = [n for n in ns if n["cls"] == "TextView" and dentro(n, s1)]
        if len(tv) >= 2:
            r["título"] = W(tv[1]); txt["título"] = repr(tv[1]["t"])
        rot = [n for n in tv if n["t"] in ("Letra", "Cifra", "Tab", "Partitura", "?", "vazia")]
        if rot:
            ic = [n for n in ns if n["cls"] == "SvgView" and dentro(n, s1) and n["b"][2] <= rot[0]["b"][0] + .1]
            if ic:
                r["tipo"] = rot[0]["b"][2] - max(ic, key=lambda n: n["b"][2])["b"][0]
        if "remover-1" in por: r["remover"] = W(por["remover-1"])
    am = por.get("aviso-motivo")
    if am and faixa:
        lista = [n for n in ns if n["cls"] in ("ScrollView", "RecyclerView") and n["b"][1] >= faixa["b"][3] - .1]
        if lista:
            topo = min(lista, key=lambda n: n["b"][1])["b"][1]
            r["aviso"] = topo - faixa["b"][3]
            txt["aviso"] = f"aviso-motivo {W(am):.1f} × {H(am):.1f}"
    return r, txt


for arq in sys.argv[1:]:
    nome = arq.split("/")[-1]
    print(f"== {nome}")
    est = next((k for k in AVISO if k in nome), None)
    r, txt = medir(arq)
    for k, v in r.items():
        f = AVISO.get(est) if k == "aviso" else FOLHA.get(k)
        d = "" if f is None else f"  folha {f:g}  Δ {v - f:+.1f}{'  > 4 → ERRATA' if abs(v - f) > 4 else ''}"
        print(f"  {k:<18} {v:7.1f}{d}{'   ' + txt[k] if k in txt else ''}")

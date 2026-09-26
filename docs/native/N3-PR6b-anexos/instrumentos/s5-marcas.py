"""N3-PR6b — a fileira de marcas da S5 (a regra de N grande, DESIGN-V1 §7.1) contra a janela, marca a marca.

  python3 s5-marcas.py <dump.xml> [...]

Marca = `ViewGroup` do app, sem `resource-id`, com 5–8 px de alto (a `MARCA.altura` de 3 dp × 2,25). Imprime
quantas estão no dump, as larguras distintas (uma marca cortada pela borda da janela sai mais estreita), o x da
primeira e da última, e a janela (a raiz). As marcas não têm texto nem são alvo: nem o G-N3 nem o G5/G6 as veem.
"""
import re, sys

for f in sys.argv[1:]:
    ms, raiz = [], None
    for m in re.finditer(r"<node ([^>]*?)/?>", open(f).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        px = [int(v) for v in re.findall(r"-?\d+", a["bounds"])]
        raiz = raiz or px
        if 5 <= px[3] - px[1] <= 8 and a.get("class", "").endswith("ViewGroup") and not a.get("resource-id"):
            ms.append(px)
    ms.sort()
    larg = sorted({round((b[2] - b[0]) / 2.25, 1) for b in ms})
    print(f"{f.split('/')[-1]}: janela {raiz[2] / 2.25:.1f} dp · {len(ms)} marcas no dump · larguras {larg} · "
          f"x {ms[0][0] / 2.25:.1f} → {ms[-1][2] / 2.25:.1f}")

"""N3-PR6 — N3-E17 no aparelho: a barra superior do palco na ÚLTIMA música e a da S5, no mesmo aparelho e
orientação. A barra não é nó com id: é o nó de largura cheia (a raiz inteira) cujo topo é o topo da
janela útil (24,0) e que contém `n DE N`. Mede-se o topo, o fundo e a altura — e o topo do conteúdo
abaixo (o corpo do palco, o meio da S5), que é o que "não salta" quer dizer.

  python3 s5-barra.py <dir> [<dir> ...]
"""
import glob, os, re, sys

def nos(f):
    F = 2.625 if "phone" in f else 2.25
    out = []
    for m in re.finditer(r"<node ([^>]*?)/?>", open(f).read()):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        if a.get("package") != "rocks.octavia.app":
            continue
        a["b"] = [int(v) / F for v in re.findall(r"-?\d+", a["bounds"])]
        out.append(a)
    return out

def barra(f):
    ns = nos(f)
    pos = next(a for a in ns if re.fullmatch(r"\d+ DE \d+", a.get("text", "")))
    W = ns[0]["b"][2] - ns[0]["b"][0]
    cands = [a for a in ns if a["b"][0] <= pos["b"][0] and a["b"][2] >= pos["b"][2] and a["b"][1] <= pos["b"][1]
             and a["b"][3] >= pos["b"][3] and (a["b"][2] - a["b"][0]) >= .99 * W and (a["b"][3] - a["b"][1]) < 150]
    b = min(cands, key=lambda a: a["b"][3] - a["b"][1])["b"]
    return b, pos

dirs = sys.argv[1:]
for ap in ("tab", "avd"):
    for o in ("ret", "pai"):
        u = [f for d in dirs for f in glob.glob(os.path.join(d, f"*-S3-ultima-{ap}-{o}.xml"))]
        s5 = [f for d in dirs for f in glob.glob(os.path.join(d, f"*-S5-fim-{ap}-{o}.xml"))]
        if not u or not s5:
            continue
        (bu, pu), (bs, ps) = barra(u[0]), barra(s5[0])
        hu, hs = bu[3] - bu[1], bs[3] - bs[1]
        print(f"{ap} {o}: palco na última ({os.path.basename(u[0])}) barra [{bu[1]:.1f} → {bu[3]:.1f}] = {hu:.1f} · "
              f"`{pu['text']}` y {pu['b'][1]:.1f}")
        print(f"{' ' * len(ap + o)}   S5 ({os.path.basename(s5[0])}) barra [{bs[1]:.1f} → {bs[3]:.1f}] = {hs:.1f} · "
              f"`{ps['text']}` y {ps['b'][1]:.1f}  → salto {hs - hu:+.1f} dp {'✓ sem salto' if abs(hs - hu) < .15 else '✗'}")

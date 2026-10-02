"""Os `bounds` de cada nó com resource-id (e dos textos da barra) de um dump, em px e dp (÷ 2,25)."""
import re, sys
def dp(v): return f"{v/2.25:.1f}".replace(".", ",")
for arq in sys.argv[1:]:
    x = open(arq).read()
    print(f"== {arq.split('/')[-1]}")
    for m in re.finditer(r"<node ([^>]*?)/?>", x):
        a = dict(re.findall(r'([\w-]+)="([^"]*)"', m.group(1)))
        rid = a.get("resource-id", "").split("/")[-1]
        t = a.get("text") or a.get("content-desc") or ""
        b = [int(v) for v in re.findall(r"-?\d+", a.get("bounds", ""))]
        if not rid and not t: continue
        if rid in ("action_bar_root", "content", "navigationBarBackground"): continue
        if rid == "corpo": t = f"<corpo {len(t)} car.>"
        x0, y0, x1, y1 = b
        print(f"{rid or '-'}\t{a['bounds']}\tx {dp(x0)}–{dp(x1)} · y {dp(y0)}–{dp(y1)} · {dp(x1-x0)} × {dp(y1-y0)}\t{t[:60]}")

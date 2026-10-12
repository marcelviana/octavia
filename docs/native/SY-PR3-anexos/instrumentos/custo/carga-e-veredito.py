#!/usr/bin/env python3
"""SY-PR3 — a REGRA DE CARGA do host aplicada às rodadas, e o veredito da SY-D36 com e sem as marcadas (div. 1288).
Instrumento de anexo (fora de CI, N4-D117). A regra foi escrita ANTES de ler os números do par (`regra-de-carga.txt`):
uma rodada é MARCADA quando o amostrador (`amostrar-carga.sh`) viu um processo fora do emulador, do WindowServer e do app
do Claude acima de 80 % de CPU na janela do PISO ou na do SYNC (com 5 s de folga antes). Nenhuma rodada se apaga: o
veredito sai com todas e, à parte, sem as marcadas.

Uso:  python3 carga-e-veredito.py <carga-host.log> <dir-do-lado> <analise.txt do lado>
"""
import re
import statistics
import sys

carga, d, analise = sys.argv[1], sys.argv[2], sys.argv[3]
IGNORA = ("qemu-system", "WindowServer", "/Claude.app/", "/claude-code/")
amostras = []
for l in open(carga):
    p = l.split(None, 2)
    if len(p) == 3 and p[0].isdigit():
        amostras.append((int(p[0]), float(p[1]), p[2].strip()))

texto = open(analise).read()


def tabela(titulo: str) -> dict[str, tuple[float, int, int]]:
    """rodada → (maior intervalo, > 100 ms, maior lacuna do uiautomator)"""
    bloco = texto.split(titulo, 1)[1].split("\n## ", 1)[0]
    out = {}
    for l in bloco.splitlines():
        m = re.match(r"\| (r\d+) \| \d+ \| \*\*([\d.]+)\*\* \| \d+ \| \d+ \| (\d+) \| \d+ · (\d+) ms", l)
        if m:
            out[m.group(1)] = (float(m.group(2)), int(m.group(3)), int(m.group(4)))
    return out


sync, piso = tabela("## SYNC"), tabela("## PISO")
marcas = {}
for r in sorted(sync):
    cab = open(f"{d}/{r}-logcat.txt").readline()
    t = dict(re.findall(r"(\w+)=(\d+)", cab))
    jan = [(int(t["t_rol"]) + 3000, int(t["t_rol"]) + 23000), (int(t["t_ok"]) - 5000, int(t["t_ok"]) + 15000)]
    vis = sorted({(c, cmd.split("/")[-1][:32]) for ts, c, cmd in amostras
                  if c > 80 and not any(i in cmd for i in IGNORA) and any(a - 5000 <= ts <= b for a, b in jan)}, reverse=True)
    marcas[r] = vis


def veredito(rs: list[str]) -> str:
    if not rs:
        return "n = 0"
    med = lambda xs: statistics.median(xs)
    s_max, s100, s_lac = med([sync[r][0] for r in rs]), med([sync[r][1] for r in rs]), med([sync[r][2] for r in rs])
    p_max, p100, p_lac = med([piso[r][0] for r in rs]), med([piso[r][1] for r in rs]), med([piso[r][2] for r in rs])
    lim = max(2 * p_max, 100)
    a, b = s100 <= p100 + 1, s_max <= lim
    rel = s_lac <= p_lac + 100
    return (f"n = {len(rs)} · SYNC maior {s_max:.1f} ms, > 100 ms {s100:g}, lacuna {s_lac:g} ms · PISO maior {p_max:.1f} ms, "
            f"> 100 ms {p100:g}, lacuna {p_lac:g} ms\n"
            f"    (dev client) {s100:g} ≤ {p100:g} + 1? {'sim' if a else 'NÃO'} · {s_max:.1f} ≤ max(2 × {p_max:.1f}, 100) = "
            f"{lim:.1f}? {'sim' if b else 'NÃO'} → **{'PASSA' if a and b else 'REPROVA'}**\n"
            f"    (release, o uiautomator) {s_lac:g} ≤ {p_lac:g} + 100 = {p_lac + 100:g}? **{'PASSA' if rel else 'REPROVA'}**")


print(f"# a regra de carga sobre {d}")
for r in sorted(sync):
    print(f"  {r}: {'⚠ ' + ', '.join(f'{n} {c:.0f}%' for c, n in marcas[r]) if marcas[r] else 'limpa'}")
todas = sorted(sync)
limpas = [r for r in todas if not marcas[r]]
print(f"- com TODAS: {veredito(todas)}")
print(f"- sem as MARCADAS ({', '.join(r for r in todas if marcas[r]) or 'nenhuma'}): {veredito(limpas)}")

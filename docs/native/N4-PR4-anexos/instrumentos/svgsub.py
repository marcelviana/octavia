# árvore em dp sem os filhos de SvgView (PathView/GroupView): só o contêiner do ícone conta
import sys, re, xml.etree.ElementTree as ET
def linhas(arq, tirar):
    r = ET.parse(arq).getroot(); out = []
    def vai(n, dentro):
        for c in n:
            cl = c.get('class', ''); ok = c.get('package') == 'rocks.octavia.app'
            if ok and not (tirar and dentro) and 'ComposeView' not in cl:
                b = [int(v) for v in re.findall(r'\d+', c.get('bounds'))]
                out.append(f"{cl.split('.')[-1]} {c.get('resource-id')} " + ','.join(f'{v/2.25:.1f}' for v in b))
            if 'ComposeView' in cl: continue
            vai(c, dentro or cl.endswith('SvgView'))
    vai(r, False); return out
for tirar in (False, True):
    a, b = linhas(sys.argv[1], tirar), linhas(sys.argv[2], tirar)
    print(('sem os filhos do SvgView' if tirar else 'árvore inteira'), f'base {len(a)} · novo {len(b)} ·', 'IDÊNTICO' if a == b else 'DIFERENTE')
    if a != b and tirar:
        import difflib; print('\n'.join(list(difflib.unified_diff(a, b, lineterm='', n=0))[:12]))

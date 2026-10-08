# Confere, coluna a coluna, a saída do psql (saida-psql-a.txt, saida-psql-b.txt) contra o esperado-b.json, e as colunas
# da Fase A na fixture A contra a saída da Fase A (saida-psql.txt). Uso, daqui: python3 -I conferir-b.py
import json, re
esp = json.load(open('esperado-b.json'))
def tabelas(arq):
    out, cur, cab = {}, None, None
    for l in open(arq, encoding='utf8'):
        m = re.match(r'^\$ psql -f (q\d)', l)
        if m: cur, cab = m.group(1), None; out[cur] = []; continue
        if cur and '|' in l and not l.startswith('-'):
            cel = [c.strip() for c in l.rstrip('\n').split('|')]
            if cab is None: cab = cel
            else: out[cur].append(dict(zip(cab, cel)))
    return out
num = lambda v: None if v == '' else float(v)
MAPA1 = {'musicas': 'musicas', 'com_corpo_de_texto': 'com_corpo', 'linhas': 'linhas', 'maior_linha': 'maior', 'musicas_com_tab_char': 'tab_char', 'musicas_com_cr': 'cr', 'musicas_com_acento_combinante': 'nfd'}
MAPA2 = {'linhas_de_acordes': 'acordes', 'pares': 'pares', 'pares_acima_26': 'pares_a26', 'pares_acima_48': 'pares_a48', 'maior_par': 'maior_par', 'linhas_quase_acorde': 'quase', 'musicas_com_quase_acorde': 'musicas_quase', 'quase_acima_26': 'quase_a26', 'quase_acima_48': 'quase_a48', 'quase_acima_55': 'quase_a55', 'quase_acima_80': 'quase_a80', 'fracao_quase': 'fracao_quase', 'linhas_quase_maioria': 'quase_maioria', 'fracao_quase_maioria': 'fracao_quase_maioria'}
falhas = conferidas = 0
def igual(rot, a, b):
    global falhas, conferidas
    conferidas += 1
    num_ = isinstance(a, float) and isinstance(b, float)
    if not (a == b or (num_ and abs(a - b) < 1e-9)):
        falhas += 1; print('  ✗', rot, 'psql', a, 'esperado', b)
for f in ['a', 'b']:
    t = tabelas(f'saida-psql-{f}.txt'); e = esp[f]
    for r in t['q1']:
        o = e[r['tipo']]
        if r['conta'] != 'xVDJ': igual(f'{f} q1 conta', r['conta'], 'xVDJ')
        for c, k in MAPA1.items(): igual(f'{f} q1 {r["tipo"]} {c}', num(r[c]), None if o[k] is None else float(o[k]))
        for n in (26, 48, 55, 80):
            igual(f'{f} q1 {r["tipo"]} musicas_acima_{n}', num(r[f'musicas_acima_{n}']), float(o[f'a{n}']['m']))
            igual(f'{f} q1 {r["tipo"]} linhas_acima_{n}', num(r[f'linhas_acima_{n}']), float(o[f'a{n}']['l']))
    for r in t['q2']:
        o = e[r['tipo']]
        for c, k in MAPA2.items(): igual(f'{f} q2 {r["tipo"]} {c}', num(r[c]), None if o[k] is None else float(o[k]))
    for r in t['q3']:
        if r['tipo'] == 'todos':
            o = e['notas']
            igual(f'{f} q3 com_notas', num(r['com_notas']), float(o['com_notas'])); igual(f'{f} q3 maior', num(r['maior_comprimento']), float(o['maior']))
            igual(f'{f} q3 maior_linha', num(r['maior_linha']), float(o['maior_linha'])); igual(f'{f} q3 mais_de_uma', num(r['com_mais_de_uma_linha']), float(o['mais_de_uma_linha']))
# a Fase A: as colunas que existiam na Fase A, na fixture A, iguais à saida-psql.txt (a saída da Fase A)
antes, depois = tabelas('saida-psql.txt'), tabelas('saida-psql-a.txt')
for q in ('q1', 'q2', 'q3'):
    for ra, rd in zip(antes[q], depois[q]):
        for c, v in ra.items(): igual(f'Fase A {q} {ra.get("tipo")} {c}', v, rd.get(c))
print(f'conferidas {conferidas} · diferentes {falhas}', '✓' if falhas == 0 else '✗')

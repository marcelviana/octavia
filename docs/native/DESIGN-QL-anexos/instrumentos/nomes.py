# Confere que nenhum título ou artista das fixtures que o D-0 apontou com nome real
# (docs/ux/D0-PRECHECK-anexos/fixtures-nomes-reais.txt: a lista só traz ARQUIVO e CONTAGEM, não os nomes) aparece no texto
# renderizado da folha. Extrai TODO valor de `artist`/`title` (reais e fabricados) dos arquivos listados e procura cada um,
# sem diferenciar maiúscula. Imprime só contagens — nenhum nome sai na saída (não se espalha o nome).
# Uso: python3 -I nomes.py <texto-renderizado.txt> <raiz-do-repo>
import re, sys, pathlib
texto = open(sys.argv[1], encoding='utf8').read().casefold()
raiz = pathlib.Path(sys.argv[2])
lista = (raiz / 'docs/ux/D0-PRECHECK-anexos/fixtures-nomes-reais.txt').read_text()
arqs = sorted(set(re.findall(r'^([\w./-]+\.(?:ts|tsx|js|mjs)):\d+$', lista, re.M)))
vals = set()
for a in arqs:
    s = (raiz / a).read_text(encoding='utf8')
    for m in re.finditer(r'''\b(artist|title)["']?\s*:\s*(['"])(.+?)\2''', s):
        v = m.group(3).strip()
        if len(v) >= 4: vals.add(v)
achados = [v for v in vals if v.casefold() in texto]
print(f'arquivos da lista: {len(arqs)} · valores de artist/title extraídos (≥ 4 caracteres): {len(vals)} · presentes no texto da folha: {len(achados)}')
for v in achados: print('  presente: <valor de', len(v), 'caracteres>')

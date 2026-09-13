import json,re
SP='/private/tmp/claude-501/-Users-marcelviana-projects-octavia/8697c385-6a74-4a2f-80c6-61d2e548b1b6/scratchpad'
I=json.load(open(SP+'/design/icones.json'))
TOKEN={'#6E6A80':'lineInfo','#C9923B':'offlineInk','#777CE8':'accentInk','#8E8779':'lineInfo','#7A5410':'offlineInk','#4A4FC0':'accentInk'}
def num(s): 
    f=float(s); return str(int(f)) if f==int(f) else repr(f)
def prim(t,a):
    o=[]
    if t=='path': o.append(f"d: '{a['d']}'")
    elif t=='circle': o.append(f"cx: {num(a['cx'])}, cy: {num(a['cy'])}, r: {num(a['r'])}")
    elif t=='rect': o.append(f"x: {num(a['x'])}, y: {num(a['y'])}, w: {num(a['width'])}, h: {num(a['height'])}, rx: {num(a['rx'])}")
    if a.get('fill') and a['fill']!='none':
        o.append("fill: true")
        if a['fill'] in TOKEN: o.append(f"tinta: '{TOKEN[a['fill']]}'")
    if a.get('stroke') and a['stroke'] not in ('none','currentColor'):
        o.append(f"tinta: '{TOKEN[a['stroke']]}'")
    if a.get('stroke-width'): o.append(f"traco: {num(a['stroke-width'])}")
    if a.get('stroke-dasharray') and a['stroke-dasharray']!='0':
        o.append("tracejado: ["+', '.join(num(x) for x in a['stroke-dasharray'].split())+"]")
    if a.get('fill-opacity'): o.append(f"alfa: {num(a['fill-opacity'])}")
    return "{ "+', '.join(o)+" }"
def lista(els): return "[" + ', '.join(prim(t,a) for t,a in els) + "]"
ordem=['auto-scroll','zoom-menos','zoom-mais','claro','escuro','indice','busca','sair','voltar','letra','cifra','tab','partitura','garantida','parcial','nunca-sincronizada','baixando','sem-conexao','ultima-sincronizacao','falha','tentar-novamente','fechar','apagar','buscar-musica','baixar-setlist','baixando-acao','voltar-ao-inicio','data','local','n-de-musicas','sem-conteudo','tipo-desconhecido','arquivo-nao-baixado','log-in']
assert len(ordem)==34
out=[]
for n in ordem:
    e=I[n]['elementos']; extra=[]
    if n=='auto-scroll': extra=[("ativo",lista(I['auto-scroll:ativo']['elementos'])),("inerte",lista(I['auto-scroll:desabilitado']['elementos']))]
    if n in ('zoom-menos','zoom-mais'): extra=[("inerte",lista(I[n+':desabilitado']['elementos']))]
    if n=='tab': extra=[("em20",lista(I['tab@20']['elementos']))]
    body=f"    normal: {lista(e)},"
    for k,v in extra: body+=f"\n    {k}: {v},"
    out.append(f"  '{n}': {{\n{body}\n  }},")
print('\n'.join(out))

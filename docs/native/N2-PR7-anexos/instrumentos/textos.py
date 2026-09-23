import re,sys
# uso: textos.py <dump.xml> <resource-id> — enabled do nó e os text/content-desc de todo nó DENTRO dos bounds dele
x=open(sys.argv[1]).read(); rid=sys.argv[2]
nos=[dict(re.findall(r'([\w-]+)="([^"]*)"',m.group(1))) for m in re.finditer(r'<node ([^>]*?)/?>',x)]
alvo=[n for n in nos if n.get('resource-id')==rid]
if not alvo: print(f'{rid}: AUSENTE'); sys.exit()
a=alvo[0]; b=[int(v) for v in re.findall(r'\d+',a['bounds'])]
def dentro(n):
    c=[int(v) for v in re.findall(r'\d+',n['bounds'])]
    return c[0]>=b[0] and c[1]>=b[1] and c[2]<=b[2] and c[3]<=b[3]
ts=[]
for n in nos:
    if dentro(n):
        for k in ('text','content-desc'):
            if n.get(k) and n[k] not in ts: ts.append(n[k])
print(f'{rid} [enabled={a.get("enabled")}]: '+' | '.join(ts))

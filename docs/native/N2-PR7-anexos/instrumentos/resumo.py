import re,sys
F=2.25
x=open(sys.argv[1]).read()
todos='--todos' in sys.argv
for m in re.finditer(r'<node ([^>]*?)/?>',x):
    a=dict(re.findall(r'([\w-]+)="([^"]*)"',m.group(1)))
    rid=a.get('resource-id','')
    txt=a.get('text','')
    if not (rid or (todos and txt)): continue
    b=[int(v) for v in re.findall(r'\d+',a['bounds'])]
    w=(b[2]-b[0])/F; h=(b[3]-b[1])/F
    print(f"{rid:26s} {w:7.1f} x {h:6.1f} @ ({b[0]/F:6.1f},{b[1]/F:6.1f}) en={a.get('enabled')} ck={a.get('clickable')} txt={txt[:90]!r}")

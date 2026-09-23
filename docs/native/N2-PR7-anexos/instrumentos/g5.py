import re,sys,glob,os
F=2.25
for f in sorted(sys.argv[1:]):
    x=open(f).read(); alvos=[]
    for m in re.finditer(r'<node ([^>]*?)/?>',x):
        a=dict(re.findall(r'([\w-]+)="([^"]*)"',m.group(1)))
        if a.get('clickable')!='true' or not a.get('package','').startswith('rocks.octavia'): continue
        b=[int(v) for v in re.findall(r'\d+',a['bounds'])]
        alvos.append(((b[2]-b[0])/F,(b[3]-b[1])/F,a.get('resource-id','') or '(sem id)'))
    ruins=[t for t in alvos if min(t[0],t[1])<48]
    menor=min(alvos,key=lambda t:min(t[0],t[1]))
    print(f"{os.path.basename(f):42s} clickable={len(alvos):2d}  menor={menor[2]} {menor[0]:.1f} x {menor[1]:.1f}  abaixo de 48: {len(ruins)} {[r[2] for r in ruins]}")

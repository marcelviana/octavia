import re,sys,html
src=open(sys.argv[1],encoding='utf-8').read()
# unescape bundle: \u002F -> /, \" -> "
s=src.replace('\\u002F','/').replace('\\"','"')
svgs=[(m.start(),m.group(0)) for m in re.finditer(r'<svg[^>]*>.*?</svg>',s,re.S)]
print("total svg:",len(svgs))
for i,(pos,sv) in enumerate(svgs):
    pre=s[max(0,pos-260):pos]
    pre=re.sub(r'<[^>]+>',' ',pre); pre=re.sub(r'\s+',' ',pre).strip()[-120:]
    print(f"\n#{i} @{pos}  …{pre}")
    print(sv[:900])

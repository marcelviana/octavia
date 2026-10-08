import sys, re, glob, os
import xml.etree.ElementTree as ET
# para cada dump: nós com resource-id terminando em 'corpo' (ou contendo), o comprimento da maior linha do text e os bounds
for d in sys.argv[1:]:
    for f in sorted(glob.glob(os.path.join(d, '*.xml'))):
        try:
            t = ET.parse(f)
        except Exception as e:
            print(os.path.basename(f), 'ERRO', e); continue
        for n in t.iter('node'):
            rid = n.get('resource-id','')
            if rid.split('/')[-1] in ('corpo','view-corpo') or rid.endswith(':id/corpo'):
                txt = n.get('text','')
                linhas = txt.split('\n')
                mx = max((len(l) for l in linhas), default=0)
                longas = sum(1 for l in linhas if len(l) > 26)
                print(f"{os.path.basename(f)}\trid={rid}\tlinhas={len(linhas)}\tmaior={mx}\t>26={longas}\t>48={sum(1 for l in linhas if len(l)>48)}\t>55={sum(1 for l in linhas if len(l)>55)}\t>80={sum(1 for l in linhas if len(l)>80)}\tbounds={n.get('bounds')}")

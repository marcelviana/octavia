"""N3-PR3 — S2e em retrato ROLADA até o fim: a prova de que a linha 8 (e `remover-8`)
está na coluna única, abaixo da dobra (a folha: "7 linhas inteiras em B").

  SCR=<dir> ROT=<r> python3 rolar.py <dir-instrumentos-do-pre-check> <serial> <saida> <sufixo>
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R
s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P3", suf)
R.ir_s1(s); R.esperar(s, texto="sincronizado agora", prazo=60); r.abrir_setlist()
lista = next(a for a in n3.dump(s) if a.get("scrollable") == "true")
b = lista["b"]; x = (b[0] + b[2]) // 2
n3.sh(s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "600"); time.sleep(2)
R.esperar(s, rid="remover-8")
r.cap("S2", "com-edicao-rolada")
print(f"capturas={len(r.feitos)}")

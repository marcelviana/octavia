"""Passo 7 — o release abre em S1 sem login e a Cifra do ordinal 8 abre no palco: só comprimento e sha12.

  SCR=<dir> python3 prova7.py <serial> <id8> <arquivo-com-o-título>

O título é lido de um arquivo do scratchpad e NUNCA impresso: a consulta é o maior trecho
contínuo do título em [A-Za-z0-9 ] (a receita da div. 995), digitado por `input text`.
"""
import hashlib, html, os, re, subprocess, sys, time
sys.path.insert(0, os.environ["SCR"] + "/instr")
import n3

s, id8, arq = sys.argv[1:4]
P = "rocks.octavia.app"
titulo = open(arq).read()
consulta = max(re.findall(r"[A-Za-z0-9 ]+", titulo), key=len).strip()


def esperar(rid, prazo=40):
    fim = time.time() + prazo
    while time.time() < fim:
        no = n3.achar(n3.dump(s), rid=rid)
        if no is not None:
            return no
        time.sleep(1)
    raise RuntimeError(f"ESPERA ESGOTADA: {rid}")


n3.sh(s, "shell", "am", "force-stop", P)
time.sleep(1)
print(n3.sh(s, "shell", "am", "start", "-W", "-n", f"{P}/.MainActivity").strip())
esperar("buscar")
ids = [a["id"] for a in n3.dump(s) if a["id"]]
print("S1 (resource-ids):", " ".join(i for i in ids if i in ("buscar", "criar-setlist") or i.startswith(("setlist-", "baixar-", "aviso"))))
print("tela de login?", "entrar" in ids)
n3.tap(s, rid="buscar", espera=2)
n3.tap(s, rid="campo-busca")
n3.key(s, "KEYCODE_MOVE_END", 0.3)
for _ in range(40):
    n3.key(s, "KEYCODE_DEL", 0.03)
n3.sh(s, "shell", "input", "text", consulta.replace(" ", "%s"))
time.sleep(2)
n3.esconder_teclado(s)
n3.tap(s, rid=f"resultado-{id8}", espera=4)
corpo = n3.achar(n3.dump(s), rid="corpo")
if corpo is None:
    print("nó corpo: AUSENTE")
else:
    t = html.unescape(corpo.get("text", ""))
    print(f"ordinal 8 · Chords · {id8} · nó=corpo · len={len(t)} · sha12={hashlib.sha256(t.encode()).hexdigest()[:12]}")
n3.key(s, "KEYCODE_BACK", 1.5)
n3.key(s, "KEYCODE_BACK", 1.5)

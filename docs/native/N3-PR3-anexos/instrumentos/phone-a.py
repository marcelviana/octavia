"""N3-PR3 — o aceite mínimo de A em S2 (errata do T3-R3): sem crash, e a LISTA dos
controles de escrita inalcançáveis por superfície (herança do N5).

  SCR=<dir> ROT=0 python3 phone-a.py <dir-instrumentos-do-pre-check> <serial> <saida>

Captura S2e e S2p (N3P3-S2-…-phone-ret) e, para cada controle de escrita de S2e,
diz se ele é ALCANÇÁVEL: o nó existe no dump, tem área (≥ 1 px nas duas medidas)
DENTRO da janela, e o toque no centro da parte visível faz o que o controle faz
(abre o picker, o modo de reordenar, a folha, o diálogo; o `remover` põe a linha
em `removendo…` ou a tira). Cada efeito é desfeito (voltar / `Manter` / fechar)
antes do próximo. O `remover-1` escreve NO MOCK (modo `normal`), que se relê da
fixture ao trocar de modo — o mock é reiniciado no fim.
"""
import sys, time
sys.path.insert(0, sys.argv[1])
import n3
import roteiro as R

s, saida = sys.argv[2], sys.argv[3]
r = R.Roteiro(s, saida, "N3P3", "phone-ret")

# controle → (o que prova que o toque chegou, como desfazer)
CONTROLES = [
    ("picker-abrir", {"rid": "picker-campo"}, "fechar-busca"),
    ("reordenar", {"rid": "reordenar-sair"}, "reordenar-sair"),
    ("setlist-editar", {"rid": "form-nome"}, "BACK"),
    ("setlist-apagar", {"rid": "apagar-manter"}, "apagar-manter"),
    ("remover-1", None, None),
]


def visivel(no, raiz):
    b = no["b"]
    x0, y0, x1, y1 = max(b[0], raiz[0]), max(b[1], raiz[1]), min(b[2], raiz[2]), min(b[3], raiz[3])
    return (x0, y0, x1, y1) if x1 - x0 >= 1 and y1 - y0 >= 1 else None


def abrir():
    R.ir_s1(s)
    # não `sincronizado agora`: em A o chip de S1 encolhe até sobrar o ícone (div. 416) e o
    # texto não chega ao dump (queda da 1ª rodada). O cartão da fixture prova o sync do mock.
    R.esperar(s, rid="setlist-00000001", prazo=60); time.sleep(3)
    r.abrir_setlist()


abrir()
r.cap("S2", "com-edicao")
linhas = []
for rid, prova, desfaz in CONTROLES:
    nos = n3.dump(s)
    raiz = nos[0]["b"]
    no = n3.achar(nos, rid=rid)
    if no is None:
        linhas.append((rid, "INALCANÇÁVEL", "sem nó no dump")); continue
    v = visivel(no, raiz)
    b = no["b"]
    px = f"bounds {no['bounds']}"
    if v is not None and (v[2] - v[0], v[3] - v[1]) != (b[2] - b[0], b[3] - b[1]):
        px += f" — CORTADO: visível {(v[2] - v[0]) / 2.625:.1f} × {(v[3] - v[1]) / 2.625:.1f} de {(b[2] - b[0]) / 2.625:.1f} × {(b[3] - b[1]) / 2.625:.1f} dp"
    if v is None:
        linhas.append((rid, "INALCANÇÁVEL", f"{px}: nenhuma área dentro da janela {raiz}")); continue
    x, y = (v[0] + v[2]) // 2, (v[1] + v[3]) // 2
    n3.sh(s, "shell", "input", "tap", str(x), str(y)); time.sleep(2)
    print(f"{time.strftime('%H:%M:%S')} toque {rid!r} @ {x},{y} ({s})", flush=True)
    if prova is None:  # o remover: a linha 1 vira `removendo…` ou sai
        depois = n3.dump(s)
        ok = n3.achar(depois, texto="removendo…") is not None or n3.achar(depois, rid="song-1") is None \
            or (n3.achar(depois, rid="song-1") or {}).get("content-desc", "") != no.get("content-desc", "x")
        linhas.append((rid, "alcançável" if ok else "INALCANÇÁVEL", f"{px}; toque @ {x},{y}"))
        continue
    achou = n3.achar(n3.dump(s), **prova) is not None
    linhas.append((rid, "alcançável" if achou else "INALCANÇÁVEL",
                   f"{px}; toque @ {x},{y} → {'abriu' if achou else 'nada abriu'} ({list(prova.values())[0]})"))
    if achou:
        if desfaz == "BACK":
            n3.esconder_teclado(s); n3.key(s, "KEYCODE_BACK", 1.5)
        else:
            n3.tap(s, rid=desfaz, espera=2)
    else:
        n3.key(s, "KEYCODE_BACK", 1.5)
    if n3.achar(n3.dump(s), rid="voltar") is None:
        abrir()
R.mock("normal")

abrir()
n3.tap(s, rid="song-1", espera=3); n3.tap(s, rid="indice", espera=2)
R.esperar(s, rid="song-1")
r.cap("S2", "sem-edicao-S2p")
p = n3.dump(s)
escrita = [a["id"] for a in p if a["id"] in ("picker-abrir", "reordenar", "setlist-editar", "setlist-apagar") or a["id"].startswith("remover-")]

print("\n## S2e (faixa A, octavia_phone em retrato) — controles de escrita")
for rid, est, det in linhas:
    print(f"  {rid:<16} {est:<13} {det}")
print(f"\n## S2p — controles de escrita no dump: {escrita or 'nenhum'} (a moldura não tem nenhum)")
print(f"capturas={len(r.feitos)}")

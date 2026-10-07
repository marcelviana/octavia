#!/usr/bin/env python3
"""N4-PR8 — V na faixa A (o `octavia_phone` em pé, 411,4 dp): nenhum FATAL e a lista do que fica inalcançável.
  SCR=… ARVORE=… PORTA=8792 ROT=0 python3 phone-v.py <inst> <serial> <saida>
Abre V em quatro estados (a Letra, o título longo, o arquivo não baixado em avião, o tipo desconhecido); em cada um,
todo nó tocável de V com o `bounds` em dp (fator 2,625) e se cabe na janela útil (0 ≤ x, x1 ≤ 411,4; y1 ≤ 874,3+24)."""
import os, sys
sys.argv = [sys.argv[0], sys.argv[1], *sys.argv[2:]]
sys.path.insert(0, sys.argv[1])
import n3, roteiro as R, visualizacao as V  # noqa: E402
s, saida = sys.argv[2], sys.argv[3]
F, LARG, ALT = 2.625, 411.4, 874.3 + 24
v = V.Visualizacao(s, saida, "N4P8A", "phone-ret")
def alvos(estado):
    nos = n3.dump(s)
    print(f"-- {estado}: o cabeçalho {[round((a['b'][3]-a['b'][1])/F,1) for a in nos if a['id']=='view-cabecalho']} dp", flush=True)
    for a in nos:
        if a.get("clickable") != "true" or a.get("package") != "rocks.octavia.app":
            continue
        b = [x / F for x in a["b"]]
        ok = b[0] >= -0.5 and b[2] <= LARG + 0.5 and b[3] <= ALT + 0.5 and (b[2]-b[0]) > 0
        print(f"   {'alcançável ' if ok else 'INALCANÇÁVEL'} {a['id'] or '(sem id)':22} {a.get('content-desc','')[:40]!r:44} [{b[0]:.1f},{b[1]:.1f}][{b[2]:.1f},{b[3]:.1f}]", flush=True)
for nome, termo, titulo, aviao in [("letra", "Manha", "Manhã de ensaio", False),
                                   ("titulo-longo", "comprido", "Uma música de título bem comprido, para medir o corte do título em retrato e no celular", False),
                                   ("tipo-desconhecido", "sem tipo", "Item sem tipo da fixture", False),
                                   ("arquivo-nao-baixado", "nunca", "Partitura que nunca baixou", True)]:
    try:
        v._abrir_l()
        if aviao:
            R.aviao(s, True)
        v._abrir_v(termo, titulo, l_ja_aberta=True)
        alvos(nome)
        v.cap("V", nome)
    except Exception as e:  # noqa: BLE001
        print(f"FALHA {nome}: {e}", flush=True)
    finally:
        if aviao:
            R.aviao(s, False)
print(f"capturas={len(v.feitos)}")

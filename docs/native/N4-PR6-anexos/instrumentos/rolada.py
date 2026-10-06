#!/usr/bin/env python3
"""N4-PR6 — o roteiro do pre-check do N3 com o DUMP ROLADO de toda lista em retrato (div. 1054).

  SCR=<dir> ARVORE=<árvore> PREFIXO=<p> ROT=<r> \
      python3 rolada.py <dir-instrumentos> <serial> <saida> <sufixo> <estados...>

Os estados são os do `roteiro.py` (`palco`, `S2e`, `picker`, `S4`, …). Cada captura de
uma tela com LISTA (S2, S4, picker) num sufixo de retrato (`-ret`) sai duas vezes no
MESMO estado: a de sempre e a rolada até o fim (`<tela>-<estado>-rolada-<sufixo>`), que é
a prova que o `g-n3.mjs --rolada <dir>` lê para separar "abaixo da dobra" de "sumiu"
(N3-D29; `APARATO.md`, "O dump rolado do G-N3").

POR QUE (div. 1054): o G-N3 da N4-PR4 deu (e) = 6 na S2 em retrato — "8" e "Oitava do
ensaio", a linha 8 abaixo da dobra — com o código da PR e com o da `main`, porque o arnês
(o `roteiro.py`) não tirava o rolado; o `n3pr3.py` (`ROLAR=1`) tirava, mas só para os
estados de S2 dele. Com a PR-6 mudando o palco avulso, um (e) que já estava lá esconderia
um que nascesse.

DEPOIS DO ROLADO, A LISTA VOLTA AO TOPO: o `roteiro.py` encadeia estados na mesma tela (a
S2 com edição e, com o avião, a mesma S2 com o aviso; o picker vazio e depois com o termo)
— sem voltar, o estado seguinte sairia rolado e o G-inv/G-N3 compararia outra tela. A volta
é conferida: o primeiro nó de texto da lista tem de ser o mesmo de antes de rolar, senão
levanta (nunca segue com a tela errada).

O RESTO É O `roteiro.py` INTACTO: a orientação conferida antes de gravar (caso 23), o
mock, o avião. A lista é o primeiro nó `scrollable="true"` vertical do dump (o `ScrollView`
horizontal do palco tem largura maior que altura e não é lista).
"""
import os
import sys
import time

sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import roteiro as R  # noqa: E402

TELAS_COM_LISTA = {"S2", "S4", "picker"}


def _lista(s):
    for a in n3.dump(s):
        b = a["b"]
        if a.get("scrollable") == "true" and (b[3] - b[1]) > (b[2] - b[0]) * 0.5:
            return a
    return None


def _primeiro_texto(s, lista):
    b = lista["b"]
    for a in n3.dump(s):
        c = a["b"]
        if a.get("text") and c[0] >= b[0] and c[1] >= b[1] and c[2] <= b[2] and c[3] <= b[3]:
            return a["text"], c[1]
    return None


_cap_original = R.Roteiro.cap


def cap_com_rolada(self, tela, estado):
    _cap_original(self, tela, estado)
    if tela not in TELAS_COM_LISTA or not self.sufixo.endswith("-ret") or estado.endswith("-rolada"):
        return
    lista = _lista(self.s)
    if lista is None:
        print(f"{time.strftime('%H:%M:%S')} {tela}-{estado}: sem lista rolável — sem rolado", flush=True)
        return
    antes = _primeiro_texto(self.s, lista)
    b = lista["b"]
    x = (b[0] + b[2]) // 2
    for _ in range(2):
        n3.sh(self.s, "shell", "input", "swipe", str(x), str(b[3] - 60), str(x), str(b[1] + 60), "600")
        time.sleep(1.2)
    time.sleep(1)
    _cap_original(self, tela, f"{estado}-rolada")
    for _ in range(3):
        n3.sh(self.s, "shell", "input", "swipe", str(x), str(b[1] + 60), str(x), str(b[3] - 60), "400")
        time.sleep(1.0)
    time.sleep(1)
    depois = _primeiro_texto(self.s, _lista(self.s) or lista)
    if antes is not None and (depois is None or depois[0] != antes[0] or abs(depois[1] - antes[1]) > 2):
        raise RuntimeError(f"A LISTA NÃO VOLTOU AO TOPO depois do rolado de {tela}-{estado}: {antes} → {depois}")


R.Roteiro.cap = cap_com_rolada

if __name__ == "__main__":
    serial, saida, sufixo = sys.argv[2:5]
    pedidos = sys.argv[5:]
    r = R.Roteiro(serial, saida, os.environ.get("PREFIXO", "N4P6"), sufixo)
    for nome in pedidos:
        try:
            getattr(r, nome)()
        except Exception as e:  # noqa: BLE001 — como o roteiro.py: registra e segue
            r.falhas.append(f"{nome}: {e}")
            print(f"FALHA {nome}: {e}", flush=True)
            try:
                R.aviao(serial, False)
                R.mock("normal")
            except Exception:  # noqa: BLE001
                pass
    print(f"capturas={len(r.feitos)} falhas={len(r.falhas)}")
    for f in r.falhas:
        print("  " + f)

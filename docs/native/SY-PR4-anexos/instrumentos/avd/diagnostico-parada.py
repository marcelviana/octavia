#!/usr/bin/env python3
"""SY-PR4 — o diagnóstico da parada que o c14c viu (instrumento de anexo, N4-D117): o palco aberto na Letra longa com a
rolagem ligada, o rádio desligado e religado pelo caminho completo; a cada ~3 s, o FOCO da janela (`dumpsys window`), o
estado do app (`dumpsys activity`) e uma captura. Nenhum gatilho é o objeto aqui: o que se quer saber é se o sistema tira
a janela do app durante a troca de rádio do emulador.   python3 diagnostico-parada.py <dir-fixture> <dir-saida>"""
import importlib.util, os, sys, time
spec = importlib.util.spec_from_file_location("g", os.path.join(os.path.dirname(__file__), "gatilhos-avd.py"))
sys.argv = [sys.argv[0], sys.argv[1], sys.argv[2]]
g = importlib.util.module_from_spec(spec); spec.loader.exec_module(g)
g.mock("normal")
t0 = g.cenario("diagnostico", "o foco da janela durante a troca de rádio, com o palco aberto e a rolagem ligada")
g.s1_no_topo(); g.tocar("setlist-0000000a"); g.tocar("song-3"); time.sleep(2); g.tocar("auto-scroll"); time.sleep(2)
def foto(rot):
    foco = g.adb("shell", "dumpsys window | grep -m1 mCurrentFocus").strip()
    ativ = g.adb("shell", "dumpsys activity activities | grep -m1 topResumedActivity").strip()
    g.p(f"  {rot}: {foco} · {ativ}")
    g.captura(f"diag-{rot}")
foto("antes")
for c in ("svc wifi disable", "svc data disable", "cmd connectivity airplane-mode enable"):
    g.adb("shell", c)
for i in range(1, 7):
    time.sleep(3); foto(f"aviao-{i*3:02d}s")
for c in ("cmd connectivity airplane-mode disable", "svc wifi enable", "svc data enable"):
    g.adb("shell", c)
for i in range(1, 11):
    time.sleep(3); foto(f"religado-{i*3:02d}s")
g.p("as linhas do app no diagnóstico:")
for t, l in g.linhas(t0):
    g.p(f"  {t}  {l}")
g.tocar("auto-scroll"); g.tocar("sair"); g.esperar(t0, "sync", 30); g.quieto(t0)
g.mock("fora")

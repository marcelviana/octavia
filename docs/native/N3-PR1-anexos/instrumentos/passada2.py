"""N3-PR1 — 2ª passada das telas de S1 no mesmo estado da base (B5): a partitura
de 12 p já no disco (baixada pelo palco da 1ª passada), o chip esperado até
"sem conexão" e o S1e com o cache de 60–119 s ("há 1 min")."""
import sys, time
sys.path.insert(0, sys.argv[1])
import roteiro as R, n3
s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P1", suf)
R.ir_s1(s); r.cap("S1", "setlists")
R.ir_s1(s); t_sync = time.time()
R.aviao(s, True); R.esperar(s, rid="aviso-motivo"); R.esperar(s, texto="sem conexão · última", prazo=40)
r.cap("S1", "aviso-sem-rede"); R.aviao(s, False)
# o S1e: o último sync bom foi o do ir_s1 acima; a base mostra "há 1 min"
R.mock("500-pagina-1")
falta = 70 - (time.time() - t_sync)
if falta > 0: print(f"espera {falta:.0f}s para o cache ter 1 min", flush=True); time.sleep(falta)
R.ir_s1(s); time.sleep(3); r.cap("S1", "S1e-falha-com-cache")
R.mock("normal")
print(f"capturas={len(r.feitos)}")

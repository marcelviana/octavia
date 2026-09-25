"""N3-PR5 (cópia da passada4 da N3-PR1, prefixo N3P5) — S1 com aviso aberto JÁ sem rede (o chip 'sem conexão' sai do sync
pulado na abertura) e o S1e com o cache de 60–119 s ("há 1 min")."""
import sys, time
sys.path.insert(0, sys.argv[1])
import roteiro as R
s, saida, suf = sys.argv[2], sys.argv[3], sys.argv[4]
r = R.Roteiro(s, saida, "N3P5", suf)
R.aviao(s, False); R.ir_s1(s); r.cap("S1", "setlists"); t_sync = time.time()
R.aviao(s, True); R.ir_s1(s)
R.esperar(s, rid="aviso-motivo"); R.esperar(s, texto="sem conexão · última", prazo=30)
r.cap("S1", "aviso-sem-rede"); R.aviao(s, False)
R.mock("500-pagina-1")
falta = 70 - (time.time() - t_sync)
if falta > 0: print(f"espera {falta:.0f}s para o cache ter 1 min", flush=True); time.sleep(falta)
R.ir_s1(s); time.sleep(3); r.cap("S1", "S1e-falha-com-cache")
R.mock("normal")
print(f"capturas={len(r.feitos)}")

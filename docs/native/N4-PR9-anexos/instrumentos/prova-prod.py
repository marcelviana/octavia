#!/usr/bin/env python3
"""N4-PR9 — A PROVA DO FAVORITAR EM PRODUÇÃO PELO APP (A-N4-27; N4-R7; regra 12). O orçamento aprovado `[Marcel,
2026-10-07]`: o `octavia_phone`, a conta de audit, um descartável criado pelo Marcel no site; **exatamente 2 escritas**
(`PUT /api/content`, favoritar e desfavoritar, pela estrela); **6 `GET`** em 3 syncs (a abertura, a confirmação de cada
escrita) se o `/api/content` tiver 1 página; os downloads de storage da garantia (N4-R26) da conta de audit.

  ID=<uuid do descartável> BUSCA=<termo do campo> python3 prova-prod.py <dir-instrumentos> <saida>

PARA, sem repetir nada:
  - antes da 1ª escrita, se a abertura ler mais de 1 página de `/api/content` (o orçamento seria outro);
  - se a estrela do descartável não estiver no estado inicial esperado (não favorito: *Favoritar “…”*);
  - em qualquer resposta fora de 2xx (a linha `write op=… status=`), ou se um `write op` não vier.

O que imprime (sem título de música: o descartável aparece pelo `id8`; o termo da busca não sai):
  - as linhas `OCTAVIA:` de cada passo (as de API, sync, cache, prefetch, file, write);
  - a contagem de GET, de PUT e de downloads, contra o orçamento;
  - o tempo da garantia: do `prefetch plan` ao último `file src=download`, e o total de bytes;
  - o `is_favorite` e o `updated_at` do descartável no `content.json` do aparelho (`run-as`), depois de cada passo;
  - a estrela: o nome acessível antes e depois de cada toque; e, durante o voo, a gravação da tela recortada SÓ na
    estrela (`ffmpeg`, 10 quadros por segundo, em tira) — o arco e a estrela inerte, sem o título ao lado.
"""
import json
import os
import re
import subprocess
import sys
import time

sys.path.insert(0, sys.argv[1])
import n3  # noqa: E402
import roteiro as R  # noqa: E402

ADB = n3.ADB
S = "emulator-5556"
PKG = "rocks.octavia.app"
ID = os.environ["ID"]
ID8 = ID[:8]
BUSCA = os.environ["BUSCA"]
SAIDA = sys.argv[2]
F = 2.625
os.makedirs(SAIDA, exist_ok=True)


def octavia():
    r = subprocess.run([ADB, "-s", S, "logcat", "-d", "-v", "time", "-s", "ReactNativeJS"], capture_output=True, text=True)
    return [(ln[:18], ln.split("OCTAVIA: ", 1)[1]) for ln in r.stdout.splitlines() if "OCTAVIA: " in ln]


def mostrar(desde, filtro=("api ", "sync", "cache ", "prefetch", "file ", "download-error", "write", "lru", "net ")):
    out = [(t, ln) for t, ln in octavia()[desde:] if ln.startswith(filtro)]
    for t, ln in out:
        print(f"  {t} {ln}", flush=True)
    return [ln for _, ln in out]


def parar(motivo):
    print(f"PARA: {motivo}", flush=True)
    sys.exit(2)


def estado_no_aparelho(rotulo):
    u = subprocess.run([ADB, "-s", S, "shell", f"run-as {PKG} sh -c 'ls files'"], capture_output=True, text=True).stdout
    pasta = next((x for x in u.split() if x.startswith("octavia-")), None)
    raw = subprocess.run([ADB, "-s", S, "exec-out", "run-as", PKG, "cat", f"files/{pasta}/content.json"],
                         capture_output=True, text=True).stdout
    try:
        lido = json.loads(raw)
    except Exception:  # noqa: BLE001
        print(f"  [{rotulo}] content.json ilegível", flush=True)
        return None
    itens = lido.get("content", lido) if isinstance(lido, dict) else lido
    c = next((x for x in itens if x.get("id") == ID), None)
    if c is None:
        print(f"  [{rotulo}] o descartável {ID8} NÃO está no cache", flush=True)
        return None
    print(f"  [{rotulo}] cache do aparelho: {ID8} is_favorite={c.get('is_favorite')} updated_at={c.get('updated_at')}",
          flush=True)
    return c.get("is_favorite")


def abrir(rotulo):
    """Abertura fria pelo link do dev client; espera o S1 e o `sync ok`."""
    n0 = len(octavia())
    n3.sh(S, "shell", "am", "force-stop", PKG)
    time.sleep(1)
    n3.sh(S, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", R.DEEP, PKG)
    fim = time.time() + 90
    while time.time() < fim and not any(ln.startswith(("sync ok", "sync fail")) for _, ln in octavia()[n0:]):
        time.sleep(2)
    print(f"== {rotulo}", flush=True)
    return n0


def estrela():
    nos = n3.dump(S)
    for a in nos:
        d = a.get("content-desc", "")
        if (d.startswith("Favoritar “") or d.startswith("Tirar “")) and BUSCA.lower() in d.lower():
            return a, ("Favoritar" if d.startswith("Favoritar") else "Tirar")
    return None, None


def ir_l():
    R.esperar(S, rid="buscar", prazo=60)
    n3.tap(S, rid="buscar", espera=2)
    R.esperar(S, rid="lib-campo")
    n3.tap(S, rid="lib-campo")
    n3.sh(S, "shell", "input", "text", BUSCA.replace(" ", "%s"))
    time.sleep(1.5)
    n3.esconder_teclado(S)
    time.sleep(1)


def escrever(k, esperado_antes):
    a, nome = estrela()
    if a is None or nome != esperado_antes:
        parar(f"a estrela do descartável não está em *{esperado_antes} “…”* (achado: {nome})")
    b = a["b"]
    x, y = (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
    print(f"  escrita {k}: a estrela antes = *{nome} “…”* @ {[round(v / F, 1) for v in b]} dp", flush=True)
    video = f"/sdcard/n4p9-escrita-{k}.mp4"
    rec = subprocess.Popen([ADB, "-s", S, "shell", "screenrecord", "--time-limit", "6", video])
    time.sleep(1.2)
    n0 = len(octavia())
    n3.sh(S, "shell", "input", "tap", str(x), str(y))
    rec.wait()
    time.sleep(1)
    linhas = mostrar(n0)
    w = [ln for ln in linhas if ln.startswith("write op=")]
    if not w:
        parar(f"escrita {k}: nenhuma linha `write op=` depois do toque")
    m = re.search(r"status=(\S+)", w[0])
    if not (m and m.group(1).isdigit() and 200 <= int(m.group(1)) < 300):
        parar(f"escrita {k}: resposta fora de 2xx — {w[0]}")
    # o `mutate` do PUT também escreve `api status=… path=/api/content`: o que denuncia um GET aqui é um `sync start`
    sync_no_meio = [ln for ln in linhas if ln.startswith("sync ")]
    print(f"  escrita {k}: syncs entre o toque e agora: {len(sync_no_meio)} (esperado 0 — o cache vem da resposta) · "
          f"linhas api: {sum(ln.startswith('api ') for ln in linhas)} (esperado 1, a do PUT)", flush=True)
    _, depois = estrela()
    print(f"  escrita {k}: a estrela depois = *{depois} “…”*", flush=True)
    mp4 = os.path.join(SAIDA, f"escrita-{k}.mp4")
    subprocess.run([ADB, "-s", S, "pull", video, mp4], capture_output=True)
    subprocess.run([ADB, "-s", S, "shell", "rm", "-f", video])
    # só a ESTRELA: o recorte do alvo de 48 dp (px do aparelho), 10 quadros/s em tira de 10 × 6
    w_, h_ = b[2] - b[0], b[3] - b[1]
    tira = os.path.join(SAIDA, f"escrita-{k}-estrela.png")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp4, "-vf",
                    f"crop={w_}:{h_}:{b[0]}:{b[1]},fps=10,tile=10x6", "-frames:v", "1", tira])
    os.remove(mp4)  # o vídeo tem a tela inteira (o título): sai; fica a tira recortada
    print(f"  escrita {k}: a tira da estrela (só o alvo, 10 q/s): {os.path.basename(tira)}", flush=True)
    return w[0]


if __name__ == "__main__":
    n3.sh(S, "logcat", "-G", "16M")
    n3.sh(S, "logcat", "-c")
    t_ini = time.time()

    # 1. a abertura: o sync com prod e a garantia dos arquivos da conta de audit
    n0 = abrir("abertura (sync 1)")
    fim = time.time() + 900
    ultimo = time.time()
    visto = 0
    while time.time() < fim:
        ls = [ln for _, ln in octavia()[n0:]]
        k = sum(ln.startswith(("file src=download", "download-error")) for ln in ls)
        plano = next((ln for ln in ls if ln.startswith("prefetch plan")), None)
        if k != visto:
            visto, ultimo = k, time.time()
        n_plano = int(re.search(r"n=(\d+)", plano).group(1)) if plano else None
        if plano is not None and (k >= n_plano or time.time() - ultimo > 60):
            break
        time.sleep(3)
    linhas = mostrar(n0)
    paginas = [ln for ln in linhas if ln.startswith("sync ok")]
    pg = re.search(r"pages=(\d+)", paginas[0]).group(1) if paginas else "?"
    print(f"  sync 1: pages={pg}", flush=True)
    if pg != "1":
        parar(f"o /api/content leu pages={pg}: o orçamento (6 GET) supõe 1 página — nenhuma escrita feita")
    tlog = [(t, ln) for t, ln in octavia()[n0:]]
    t_plano = next((t for t, ln in tlog if ln.startswith("prefetch plan")), None)
    arqs = [(t, ln) for t, ln in tlog if ln.startswith("file src=download")]
    bytes_ = sum(int(re.search(r"bytes=(\d+)", ln).group(1)) for _, ln in arqs)
    print(f"  a garantia: plano em {t_plano} · {len(arqs)} arquivo(s) baixado(s), {bytes_} B · último em "
          f"{arqs[-1][0] if arqs else '-'}", flush=True)
    estado_no_aparelho("depois da abertura")

    # 2. a L, o descartável, e as duas escritas — cada uma com o seu sync de confirmação
    ir_l()
    w1 = escrever(1, "Favoritar")
    estado_no_aparelho("depois da escrita 1, sem sync")
    mostrar(abrir("sync 2 (confirma a escrita 1)"))
    estado_no_aparelho("depois do sync 2")
    ir_l()
    w2 = escrever(2, "Tirar")
    estado_no_aparelho("depois da escrita 2, sem sync")
    mostrar(abrir("sync 3 (confirma a escrita 2)"))
    estado_no_aparelho("depois do sync 3")

    # 3. a contabilidade, contra o orçamento
    todas = [ln for _, ln in octavia()]
    api = [ln for ln in todas if ln.startswith("api status=")]
    put = [ln for ln in todas if ln.startswith("write op=")]
    get = api[:]  # cada PUT também deixa uma linha `api` (a do `mutate`): GET = api − PUT
    dl = [ln for ln in todas if ln.startswith("file src=download")]
    print(f"== contabilidade: linhas api={len(api)} − PUT={len(put)} = GET={len(api) - len(put)} (orçamento 6) · PUT={len(put)} (orçamento 2) · downloads de storage="
          f"{len(dl)} · {int(time.time() - t_ini)} s", flush=True)
    for ln in get:
        print(f"  {ln}", flush=True)

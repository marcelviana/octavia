#!/usr/bin/env python3
"""N4-PR9 — A CONTAGEM DE QUEDAS DO APP, com as NATIVAS (N4-D105 `[Marcel, 2026-10-07]`).

Até a N4-PR8 os arneses contavam `FATAL` como subcadeia do logcat (`grep -c FATAL`, `.count('FATAL')`): isso pega a queda
JAVA (`FATAL EXCEPTION`) e **não pega a queda NATIVA** — um SIGSEGV no código C++ do React Native escreve
`F libc : Fatal signal 11 (SIGSEGV) …` e o tombstone do `debuggerd` (`F DEBUG : …`), sem a palavra `FATAL`. Medido na
N4-PR9: 5 quedas `Fatal signal 11` em `facebook::react::MountingCoordinator::pullTransaction`, todas invisíveis à contagem
antiga.

  quedas.py <serial> [--desde-linha N]      lê `adb logcat -d` e o dropbox (`dumpsys dropbox --print SYSTEM_TOMBSTONE`)
  quedas.py --arquivo <logcat.txt>          lê um logcat guardado (só o logcat: o dropbox é do aparelho)
  quedas.py --cn                            o controle negativo do próprio contador (a amostra abaixo)

Conta, SÓ do processo do app (`rocks.octavia.app`):
  java     `FATAL EXCEPTION` cujo `Process:` (até 3 linhas abaixo) é o app
  nativa   `Fatal signal N (…) … pid P (cks.octavia.app)` — o nome do processo vem truncado em 15 caracteres pelo kernel
  tombstone  as entradas `SYSTEM_TOMBSTONE` do dropbox cujo `>>> rocks.octavia.app <<<` aparece — sobrevivem ao
           `logcat -c` (não a um boot de AVD sem salvar o snapshot)
e imprime, por queda nativa, o topo da pilha (`#00`…`#05`, só os quadros: nome da função; sem caminho de arquivo).
"""
import re
import subprocess
import sys

ADB = __import__("os").path.expanduser("~/Library/Android/sdk/platform-tools/adb")
APP = "rocks.octavia.app"
APP_KERNEL = APP[-15:]  # `cks.octavia.app`: o `comm` do kernel tem 15 caracteres

RE_NATIVA = re.compile(r"Fatal signal (\d+) \((\w+)\).*pid (\d+) \(([^)]*)\)")
RE_QUADRO = re.compile(r"#(\d\d) pc [0-9a-f]+\s+\S+(?: \((.*)\))?")


def quadros(linhas, pid):
    """O topo da pilha do tombstone do `pid`: os quadros #00…#05, só a função (o `(…)` depois do caminho)."""
    dentro, out = False, []
    for ln in linhas:
        if f"pid: {pid}," in ln and ">>>" in ln:
            dentro = True
            continue
        if dentro:
            m = RE_QUADRO.search(ln)
            if m and int(m.group(1)) <= 5:
                f = (m.group(2) or "?").split(" (BuildId")[0]
                out.append(f"#{m.group(1)} {f[:110]}")
            if len(out) >= 6:
                break
    return out


def contar(texto):
    linhas = texto.splitlines()
    java = 0
    for i, ln in enumerate(linhas):
        if "FATAL EXCEPTION" in ln and any(f"Process: {APP}" in x for x in linhas[i + 1:i + 4]):
            java += 1
    nativas = []
    for ln in linhas:
        m = RE_NATIVA.search(ln)
        if m and m.group(4) == APP_KERNEL:
            nativas.append({"hora": ln[:18].strip(), "sinal": f"{m.group(1)} ({m.group(2)})", "pid": m.group(3),
                            "pilha": quadros(linhas, m.group(3))})
    antiga = texto.count("FATAL")  # o que os arneses até a N4-PR8 contavam
    return java, nativas, antiga


def tombstones(serial):
    r = subprocess.run([ADB, "-s", serial, "shell", "dumpsys", "dropbox", "--print", "SYSTEM_TOMBSTONE"],
                       capture_output=True, text=True)
    blocos = re.split(r"\n(?=\d{4}-\d\d-\d\d \d\d:\d\d:\d\d SYSTEM_TOMBSTONE)", r.stdout)
    return [b.splitlines()[0][:19] for b in blocos if f">>> {APP} <<<" in b]


def relatorio(texto, serial=None):
    java, nativas, antiga = contar(texto)
    print(f"quedas do app: java={java} · nativas={len(nativas)} · (a contagem antiga, a subcadeia FATAL: {antiga})")
    for q in nativas:
        print(f"  nativa {q['hora']} sinal {q['sinal']} pid {q['pid']}")
        for f in q["pilha"]:
            print(f"      {f}")
    if serial is not None:
        t = tombstones(serial)
        print(f"tombstones do app no dropbox: {len(t)}" + (f" — {', '.join(t)}" if t else ""))
    return java + len(nativas)


# O CONTROLE NEGATIVO do contador: a forma das linhas medidas na N4-PR9 (AVD, 2026-10-07 10:59:40; o caminho do APK
# trocado por `<apk>`), mais uma queda Java de OUTRO processo e uma linha do app que não é queda.
AMOSTRA = """\
10-07 10:59:40.260  2861  2946 F libc    : Fatal signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x1e30000000a in tid 2946 (mqt_v_js), pid 2861 (cks.octavia.app)
10-07 10:59:42.145  2995  2995 F DEBUG   : pid: 2861, tid: 2946, name: mqt_v_js  >>> rocks.octavia.app <<<
10-07 10:59:42.145  2995  2995 F DEBUG   :       #00 pc 00000000011a5890  <apk>!libreactnative.so (facebook::react::MountingCoordinator::pullTransaction(bool) const+520) (BuildId: e59970ac57f947b8fe2e1ffcdcc218fa16367ed2)
10-07 10:59:42.145  2995  2995 F DEBUG   :       #01 pc 0000000000cc720c  <apk>!libreactnative.so (facebook::react::FabricUIManagerBinding::schedulerDidFinishTransaction(std::__ndk1::shared_ptr<facebook::react::MountingCoordinator const> const&)+52)
10-07 11:00:01.000  3000  3000 E AndroidRuntime: FATAL EXCEPTION: main
10-07 11:00:01.000  3000  3000 E AndroidRuntime: Process: com.google.android.apps.wellbeing, PID: 3000
10-07 11:00:02.000  2861  2946 I ReactNativeJS: OCTAVIA: sync ok setlists=3 content=16 pages=1 t=743
"""


if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--cn":
        java, nativas, antiga = contar(AMOSTRA)
        print(f"CN — a amostra: java={java} nativas={len(nativas)} (esperado 0 e 1) · a contagem antiga: {antiga} "
              f"(o FATAL do OUTRO processo; a queda nativa do app não entra nela)")
        ok = java == 0 and len(nativas) == 1 and nativas[0]["pilha"][0].startswith("#00 facebook::react::MountingCoordinator")
        sem_nativa = contar(AMOSTRA.replace("Fatal signal", "Sinal fatal"))[1]
        print(f"CN — a mesma amostra sem a linha `Fatal signal`: nativas={len(sem_nativa)} (esperado 0)")
        sys.exit(0 if ok and not sem_nativa else 1)
    if a and a[0] == "--arquivo":
        sys.exit(1 if relatorio(open(a[1], errors="replace").read()) else 0)
    serial = a[0]
    n0 = int(a[2]) if len(a) > 2 and a[1] == "--desde-linha" else 0
    log = subprocess.run([ADB, "-s", serial, "logcat", "-d"], capture_output=True, text=True).stdout
    sys.exit(1 if relatorio("\n".join(log.splitlines()[n0:]), serial) else 0)

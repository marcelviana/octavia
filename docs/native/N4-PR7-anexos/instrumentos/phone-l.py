"""N4-PR7 — a faixa A (o celular em pé, 411,4 dp): a L abre, a lista do alcançável, o ▶ e o BACK, e o FATAL."""
import sys, time, subprocess, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import n3, roteiro as R
S = 'emulator-5556'; D = sys.argv[1]
os.makedirs(D, exist_ok=True)
F = 2.625; W = 411.4; H = 914.3
R.esperar(S, rid='buscar', prazo=90); time.sleep(4)
n3.tap(S, rid='buscar', espera=3)
R.esperar(S, rid='lib-campo')
def cap(n):
    r = subprocess.run([os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cap.sh'), S, D, f'N4P7L-{n}-phone-ret'], capture_output=True, text=True)
    print(r.stdout.strip(), flush=True)
cap('L-base')
nos = n3.dump(S)
print('faixa A — a L no celular em pé (411,4 dp): cada alvo, dentro ou fora da janela útil (24 … 898,3)')
for a in nos:
    if (a.get('clickable') == 'true' or a['id'].startswith('lib-')) and (a['id'] or a.get('content-desc')):
        x0, y0, x1, y1 = [v / F for v in a['b']]
        dentro = x0 >= -0.1 and x1 <= W + 0.1 and y0 >= 24 - 0.1 and y1 <= H - 16 + 0.1
        print(f"  {a['id'] or '-':26s} x {x0:.1f}–{x1:.1f} ({x1-x0:.1f}) y {y0:.1f}–{y1:.1f} ({y1-y0:.1f}) {'ok' if dentro else 'FORA/CORTADO'} {a.get('content-desc','')[:40]!r}")
for t in ['lib-filtro-letra', 'lib-filtro-cifra', 'lib-filtro-tab', 'lib-filtro-partitura', 'lib-filtro-favoritas', 'lib-regua', 'lib-lista']:
    print('  no dump:', t, n3.achar(nos, rid=t) is not None)
n3.tap(S, texto='Tocar “Águas de fixture”', espera=3)
cap('S3-avulso-da-biblioteca')
n3.key(S, 'KEYCODE_BACK', 2)
print('depois do BACK, a L (lib-campo):', n3.achar(n3.dump(S), rid='lib-campo') is not None)
r = subprocess.run([n3.ADB, '-s', S, 'logcat', '-d'], capture_output=True, text=True).stdout
print('FATAL no logcat (desde o logcat -c da abertura):', r.count('FATAL'))

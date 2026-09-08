# N0 — Aceite no Samsung Galaxy Tab S6 (N0-H9: o protocolo vale no Android do fabricante)

> **Data**: 2026-09-07. **Veredito N0-H9: VERDADEIRA** — todos os passos A–F reproduziram no device real o que o emulador `octavia_tab` provou (`N0-H15.md`, `N0-H16.md`), sem nenhuma mudança de código. Conta: audit. App: `apps/native` em `40da95c` (main após #268). Docs-only.
> **Regras de forma**: `[medido]` = comando + saída literal (aqui ou em `N0-anexos/ACEITE-*`); premissa falsa declarada, não acomodada.

## 0. Device `[medido]`

| Prop | Valor |
|---|---|
| serial (`adb devices -l`) | `RX2N8000F3D device usb:0-1.1 product:gts6lxx model:SM_T865 device:gts6l` |
| `ro.product.model` / `ro.product.name` | **SM-T865** / gts6lxx |
| `ro.build.version.release` / **`sdk`** | 12 / **32** (Android 12L) — **divergência**: P-N0-5 e o AVD `octavia_tab` assumiam API 31; One UI 4.1.1 (`ro.build.version.oneui` = 40101) é 12L/API 32. Nada mudou no protocolo; registrado para o N1 (o AVD pode migrar para a imagem API 32 já instalada) |
| `ro.build.version.incremental` / `security_patch` | T865XXU6DXE2 / 2023-08-01 |
| `wm size` / `wm density` | 1600×2560 (portrait) / 360 |
| bateria (`dumpsys battery`) | 79 % no início, carregando |
| `nc` | `/system/bin/nc` (toybox) |

Pré-condições: `origin/main` = `40da95c` (merge #268 — o prompt dizia "mergeada", mas na primeira medição a #268 ainda estava `OPEN`; o Marcel mergeou e a branch nasceu depois); emulador fechado (`qemu: 0`); `ADB_SERIAL=RX2N8000F3D`. Inventário do SDK antes = depois (diff vazio).

## 1. Aparato no device `[medido]`

| Item | Resultado |
|---|---|
| Modo avião via adb (One UI) | `cmd connectivity airplane-mode enable` → `settings get global airplane_mode_on` = 1 → `ping -c 1 -W 3 8.8.8.8` → `connect: Network is unreachable`; `disable` → 0 → `rtt … 25.109 ms`. **Mesmo comando do emulador; nenhum plano B necessário** |
| `adb reverse tcp:8081 tcp:8081` | `adb reverse --list` → `UsbFfs tcp:8081 tcp:8081` |
| Probe do Metro (variante D do `N0-H15.md`) | online → `packager-status:running`; **com o avião ligado → `packager-status:running`** (**N0-H10 por USB: verdadeira**) |
| Instalação | `npx expo run:android --device RX2N8000F3D` → `CommandError: Could not find device with name` (o `--device` quer o nome, não o serial — mesma classe do PR2); sem `--device` → `BUILD SUCCESSFUL in 15s`, mas o `adb install -r -d --user 0` do Expo ficou **pendurado 8 min** com o tablet na tela de bloqueio (sem diálogo, sem erro); morto e substituído por `adb install -r -d …/app-debug.apk` → `Performing Streamed Install / Success`; `pm list packages` → `package:rocks.octavia.app`. Metro relançado com `npx expo start --dev-client`. **Correção única, de aparato; sem código** |
| Deep link | `am start -a android.intent.action.VIEW -d 'exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'` → `Android Bundled 876ms apps/native/index.ts (820 modules)` → `OCTAVIA: login-screen` |

## 2. Protocolo A–F (tela em portrait; coordenadas por `input tap`)

| Passo | Estado | Logcat (verbatim, anexo `ACEITE-logcat-*`) | Screencap | Veredito |
|---|---|---|---|---|
| §2 login | online; email por `input text`, senha digitada pelo Marcel | `login-screen` · `auth uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 src=login` · `api status=200 path=/api/setlists n=1` · `setlists=3 src=api` (`-1-login.txt`) | `ACEITE-1-login.png` ("Setlists: 3") | login 1/1, `setlist-read` 1/3 |
| **A** PDF 12p online | cache vazio | `file src=download name=…partitura-12p.pdf bytes=242176` · `pdf-render pages=12 src=disk` · `pdf-page n=1/12` (`-A-pdf-online.txt`) | `ACEITE-A-pdf-12-online.png` | download 1/1 ✓ |
| **B** sha256 do disco | `adb shell run-as rocks.octavia.app find . -name '*.pdf'` → `./cache/files/1786218429715-ux-audit-partitura-12p.pdf` | `cat` → host → **`ad2eae0942811adb4d60286516ce318110868f6aa889422ab0cb8b3dc690ea22`**, 242.176 B — **igual ao emulador** (`N0-H16.md` §2) | — | **A9 no device ✓** (`run-as` funciona na One UI) |
| **C** avião + restauração | `force-stop` → `pidof` vazio → avião = 1 → ping unreachable → `reverse` vivo → probe `packager-status:running` → deep link | `auth uid=Pw3b… src=restored` · `sync-error fetch failed: java.net.UnknownHostException: Unable to resolve host "octavia.rocks": No address associated with hostname` — **sem `login-screen`** (`-C-restored-aviao.txt`) | `ACEITE-2-restored-aviao.png` (ícone ✈ na barra) | **H15-a no device ✓**; H15-b fresco = token do cache ✓ |
| **D** A13 | ainda em avião, "PDF 12 páginas" + 14 swipes | `file src=disk … bytes=242176` · `pdf-render pages=12 src=disk` · `pdf-page n=1/12` … `n=10/12` · `n=11/12` · **`n=12/12`** (`-D-pdf-aviao.txt`) | `ACEITE-3-pdf-12-aviao.png` ("pagina 12 de 12"; a página cobre a barra de status em portrait — o ícone ✈ aparece esmaecido no canto; o estado avião está provado por `settings get` + ping no mesmo passo) | **A13 no device ✓** |
| **E** controle negativo | ainda em avião, `pm clear rocks.octavia.app` → `Success` → deep link | `login-screen` — linhas `auth uid=`: **0** (`-E-pmclear.txt`); nada digitado | `ACEITE-4-pmclear.png` | ✓ |
| **F** encerramento | `airplane-mode disable` → `airplane_mode_on` = 0 → ping `11.992 ms` → `adb reverse --remove-all` (lista vazia) → Metro encerrado (8081 livre) | — | — | rede ligada, provada |

**Estado final do tablet**: app `rocks.octavia.app` **instalado, sem sessão** (o `pm clear` apagou), cache de arquivos vazio; nenhuma configuração alterada além do modo avião (restaurado).

**Contabilidade de prod**: login **1** (Marcel digitou a senha); `setlist-read` **1** (teto 3); download do bucket **1** (teto 1); `HEAD` **0**; 401/429 **0**; escrita **0**. Anexos sem segredo: `grep -rn eyJ` e `grep -rln uxtester` em `N0-anexos/` → exit 1.

## 3. Emulador × device — diferenças observadas

| Tema | Emulador `octavia_tab` | Tab S6 |
|---|---|---|
| API | 31 (Android 12) | **32** (Android 12L, One UI 4.1.1) |
| Orientação da tela de prova | landscape (2560×1600) | portrait (1600×2560) — o app não trava orientação (E8: requisito do N1) |
| `expo run:android` | `--device <nome do AVD>` | `--device <serial>` falha; sem `--device` ok; **o `adb install … --user 0` do Expo trava com o device bloqueado** — instalar com `adb install -r -d` direto e subir o Metro com `expo start --dev-client` |
| Modo avião via adb | `cmd connectivity` | idem |
| Metro offline | `adb reverse` (rede virtual) | `adb reverse` por USB (`UsbFfs`) |
| `run-as` | ok | ok |
| Erros de rede | mesmas strings (`UnknownHostException`) | idem |

## 4. Hipóteses — estado

| # | Hipótese | Estado |
|---|---|---|
| **N0-H9** | os mesmos comandos/protocolo valem no Android do fabricante por USB | **fechada — verdadeira** (A–F) |
| N0-H10 | Metro alcançável com o avião ligado | verdadeira também por USB |
| H15-a / A13 / A9 / T1-R14 | no device | **reproduzidos** |
| N0-H11 | `cache: 'no-store'` no fetch do RN | aberta — N1 |
| filtro `paths` do `native.yml` | esta PR só toca `docs/` → `android-debug-apk` não deve rodar | ver corpo da PR (`gh pr checks`) |

## 5. O que fica para o N1

- Travar orientação landscape no tablet (T1-R27; E8 tirou do `app.json` do N0).
- `SafeAreaView`/insets: barra de navegação e barra de status (o PDF cobriu a barra de status em portrait; o "Voltar" precisou de padding no PR5).
- Fluxo de instalação no device real: `adb install -r -d` direto + `expo start --dev-client` (documentar no `scripts/native-env.sh` ou num `scripts/native/install-device.sh` — decisão do N1).
- AVD: migrar `octavia_tab` para API 32 (imagem `android-32;google_apis;arm64-v8a` já instalada) para casar com o Tab S6 — decisão do N1.
- Login no device exige digitação manual da senha (`input text` engole caractere especial — div. 24 do PR3).

# Aparato do nativo — a fonte única

**Onde quem vai mexer no aparelho lê antes.** Consolidado no encerramento do N2
(2026-09-23, `N2-ENCERRAMENTO.md` §9) a partir dos cinco `aparato.md` de anexo
(`N2-PR3-anexos/` … `N2-PR7-anexos/`) e das divergências de aparato do bloco.
Aqueles ficam como **rastro**; a fonte é esta página. Mudou o aparato → muda
esta página no mesmo commit (regra 9 do `LOGS-OCTAVIA.md`, aplicada aqui).

## Ferramentas

- **`adb` e `emulator` por caminho completo**: `~/Library/Android/sdk/platform-tools/adb`,
  `~/Library/Android/sdk/emulator/emulator`. `which adb` **falha** em shell sem
  login (o `PATH` do perfil não carrega) com as duas instaladas — o gate de
  "tenho ferramenta?" é `ls` no SDK. Div. 250.
- **Build do dev client**: `cd apps/native && npx expo run:android --device SM_T865`
  (JDK Corretto 17). O `--device` quer o nome do `getDevicesAsync` do Expo,
  **com sublinhado**; o serial `RX2N8000F3D` e o `SM-T865` do `getprop` são
  recusados. Div. 251. Só se rebuilda quando entra **módulo nativo** (div. 234);
  fora disso o dev client carrega o bundle do Metro. **O rebuild vale para os dois
  aparelhos**: a #315 refez o Tab e deixou o AVD com um dev client sem o
  `datetimepicker`, que quebrava na carga (div. 371). Antes de medir, confira a data:
  `adb shell dumpsys package rocks.octavia.app | grep lastUpdateTime`. No AVD:
  `ANDROID_HOME=$HOME/Library/Android/sdk npx expo run:android --device octavia_tab32`
  (sem o `ANDROID_HOME` o Gradle não acha o SDK). O `expo run:android` liga o
  **build cache** do Gradle (`--build-cache`), então o tempo dele não é tempo de build.
- **APK local é single-ABI** (`arm64-v8a`, 82.030.412 B) e o do CI tem quatro
  (231.377.892 B, V1-PR3): **nem tamanho nem tempo se comparam com a série do
  CI**. Div. 253.

- **Build de release** (W4-b3, série em [`RELEASE-FAIXA.md`](RELEASE-FAIXA.md)):
  `sh docs/native/W4B3-anexos/builds.sh <saida.tsv> R1` da raiz (limpo, `assembleRelease
  --no-daemon --no-build-cache`). Assina com a **chave de debug**, o mesmo
  `rocks.octavia.app` e o mesmo certificado do dev client: `adb install -r` troca um
  pelo outro **mantendo dados e sessão**, sem desinstalar (div. 372). Guarde antes o
  `base.apk` do dev client (`adb shell pm path rocks.octavia.app` + `adb pull`) para
  reinstalá-lo no fim. O release não é `DEBUGGABLE` (sem `run-as`) e não tem o botão
  flutuante do dev client.
  - **O release não alcança `http://`; aceite de release é contra prod, só leitura, mais escrita descartável pela regra 12; o mock é do dev client.** (Decisão do Marcel, 2026-09-23; div. 373
    **fechada**.) A causa é a falta de `usesCleartextTraffic`, que o prebuild só põe
    nos manifests de debug.
  - **`EXPO_PUBLIC_*` inline num build de release exige apagar o `$TMPDIR/metro-cache`**
    antes: com ele quente, o bundle embutido saiu com a URL de prod (div. 374). Conferir
    sempre: `unzip -p <apk> assets/index.android.bundle | grep -ac <valor>`.
- **CI: push de docs só depois do APK verde; antes, custa um APK.** (Decisão do Marcel, 2026-09-23; div. 381.) O H1 só pula o APK
  quando o último APK da PR já é `success`. Na #323, o push de docs subiu com o APK
  anterior em curso e custou 13m18s.
- **Cabo do Tab**: se o Tab não aparece nem como `unauthorized`, veja se o macOS o
  enxerga (`system_profiler SPUSBHostDataType`). Na W4-b3 o primeiro cabo só carregava.

## Aparelhos

| | Tab S6 | AVD `octavia_tab32` | AVD `octavia_phone` (N3 pre-check) |
|---|---|---|---|
| id | `RX2N8000F3D`, `SM-T865`, Android 12 | `emulator-5554`, `sdk_gphone64_arm64`, Android 12 | `emulator-5556`, `sdk_gphone64_arm64`, Android 12 (API 32) |
| tela | 2560 × 1600 px, densidade 360 → **fator 2,25** | idem | 1080 × 2400 px, densidade 420 → **fator 2,625** |
| janela do app (paisagem) | 1137,8 × 663,1 dp; **639,1** abaixo da barra de 24 | 1137,8 × 711,1 dp; **627,1** entre as barras de 24 e 60 | 914,3 × 411,4 dp; **371,4** entre a de 24 e a de gestos de 16 |
| janela do app (retrato, N3) | 711,1 × 1089,8 dp; **1065,8** abaixo da barra de 24 | 711,1 × 1137,8 dp; **1053,8** entre 24 e 60 | 411,4 × 914,3 dp; **874,3** entre 24 e 16 |
| estado de repouso | bloqueio + tela de 30 s (div. 202); destravar é do Marcel | conta **de audit**, **em avião** (`airplane=1 wifi=0 data=0`) — divs. 200, 292 | sem conta: o S0 é o repouso (o login é do Marcel); rede ligada |

As janelas de retrato e a do celular são do `N3-PRECHECK-anexos/B1-janelas.txt`
(raiz e janela útil do dump do S1). Criar o celular:
`echo no | ~/Library/Android/sdk/cmdline-tools/latest/bin/avdmanager create avd -n octavia_phone -k "system-images;android-32;google_apis;arm64-v8a" -d pixel_6`
(JDK 17); o dev client entra por `adb -s emulator-5556 install -r <app-debug.apk>`
do build do `octavia_tab32` (mesmo APK, arm64).

**O `octavia_tab32` sobe do snapshot `default_boot`**: o que se instala numa sessão
some na seguinte, a menos que o snapshot seja salvo de novo. Até 2026-09-24 o
snapshot era de 2026-09-14, e o dev client refeito na W4-b3 (div. 371) estava de
volta a 2026-09-13 no N3 (div. 383). **Consertado em 2026-09-24**: o dev client atual
foi instalado sobre o snapshot, já com a conta de audit e em avião, e o snapshot foi
regravado. Depois de um reboot, o `lastUpdateTime` continua `2026-09-24 14:00:01`
(`N3-PRECHECK-anexos/estado/avd-snapshot-conserto.txt`). **Todo rebuild do dev client
no AVD termina assim**, com o app parado e o estado de repouso lido:
`adb -s emulator-5554 install -r <app-debug.apk>` (ou `expo run:android --device
octavia_tab32 --no-bundler`), `adb -s emulator-5554 shell am force-stop rocks.octavia.app`
e `adb -s emulator-5554 emu avd snapshot save default_boot`. Para medir sem deixar
rastro no AVD, sobe-se com `-no-snapshot-save`: o estado da sessão (rede, rotação,
cache do mock) some no boot seguinte. A data (`lastUpdateTime`) continua sendo
conferida antes de medir.

O canvas dos desenhos é 1138 × 627 dp, o pior caso (N2-D25). Retrato não tem
composição — herança registrada em `N2-ENCERRAMENTO.md` §10.7, item 1; o N3
mede o que isso custa (`N3-PRECHECK.md`).

## Metro e mock

- **Metro na 8081, mock (`apps/native/src/fixtures/aceite.py`) na 8788** — a
  8081 é do Metro (div. 250). Os dois por `adb reverse tcp:<p> tcp:<p>`.
- **Metro com `CI=1` não observa o disco**: serve o bundle que já tem. Subir
  **sem** `CI=1`, e **antes de todo reteste** provar que o bundle servido tem o
  conserto (regra 13; div. 294, a mesma causa da div. 127):
  `curl -s 'http://localhost:8081/apps/native/index.bundle?platform=android&dev=true' | grep -c <símbolo do conserto>`.
  **Regra 13 ampliada (W4-b3, div. 374)**: conferir no bundle servido **o símbolo do
  conserto e a URL base da API** antes de qualquer reteste. O cache do Metro pode
  servir a URL de prod: `grep -c <host da API>` no mesmo `curl`, e no release
  `unzip -p <apk> assets/index.android.bundle | grep -ac <host da API>`.
- Voltar ao app depois de `force-stop` (o dev client cai no lançador):
  `exp+octavia://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`.
- **Mock**: a foto do modelo é tirada **antes** do atraso (div. 233); falha de
  releitura compõe com qualquer modo pelo sufixo `-releitura-500` (div. 329);
  quem salva o estado do mock por `GET` exige uma **lista** — no modo
  `escrita-resync-500` o `GET` é o 500 (`N2-PR7-anexos/aparato.md` §7).

## Estado do aparelho: ler, declarar, restaurar

Toda mudança de estado é **lida antes**, **declarada no anexo** e **restaurada e
medida no fim**. A N2-PR3 trocou o `stay_on` sem lê-lo e não soube a que
restaurar — é a falha que esta regra fecha.

| o quê | leitura |
|---|---|
| tela acesa | `settings get global stay_on_while_plugged_in` |
| rotação | `settings get system accelerometer_rotation` · `user_rotation` |
| avião / rádio | `settings get global airplane_mode_on`; `wifi`, `data` |
| túneis | `adb reverse --list` → no fim `adb reverse --remove-all` |
| segredo | `apps/native/.env` copiado do checkout principal só para o Metro, conferido por sha256, **apagado** no fim (regra 2) |

**Avião** (regra 11, div. 290): permitido em aceite **manual** com o estado lido,
declarado e restaurado; a prova é o `ping` falhando (`connect: Network is
unreachable`), não o setting (regra 1). Nos automatizados o caminho é o
override da API.

## O dev client e os teclados atrapalham o arnês

- **O FAB do dev client** (engrenagem / "Tools") fica sobre o **canto superior
  direito**: cobre o `apagar` do campo da S4 e do picker e controles da barra
  (divs. 199, 205, 317). Tocar ali abre o menu de desenvolvimento. Limpar campo
  com `KEYCODE_MOVE_END` + `DEL`. Só existe no dev client.
  **P1 do N3 (N3-D25), hipótese de aparato, sem medida ainda**: em retrato o
  FAB cobre controles da barra (o `buscar` de S1, o `apagar` do picker). A
  N3-PR1 não capturou retrato novo (o G-N3 rodou sobre os dumps do pre-check);
  quem capturar retrato de B primeiro (a PR de S1) mede se o FAB some pelo menu
  do dev client ("Tools button") ou se o arnês toca pela margem. Até lá, alvo
  sob o FAB se toca pelo `resource-id` com o menu fechado, e o FAB fica fora da
  conta do G-N3 e do inventário (ComposeView).
  **Medido na N3-PR2, para S1**: em B o FAB fica na linha do **título**, à
  direita, e **não cobre** `buscar` nem `criar-setlist`, que desceram para a
  linha 2 da barra. As outras superfícies se medem nas PRs delas.
- **`input text` fora de um campo recarrega o dev client** (a tecla `r`). Div. 330.
- **O teclado encaixado do AVD cobre a metade de baixo** — `form-cancelar`, os
  `Adicionar` de baixo; o toque cai numa tecla. Antes de procurar alvo:
  `BACK` com o teclado de pé, conferido por `dumpsys input_method | grep mInputShown`.
  Div. 330. E `BACK` com o teclado de pé fecha **o teclado**, não a folha
  (div. 261).
- **O teclado flutuante da Samsung** fica no meio da tela do Tab S6: rolar pela
  margem esquerda (`N2-PR7-anexos/aparato.md` §4).
- **IME na folha**: `MS_FOCO_APOS_ANIMACAO = 350` — **10/10 no Tab S6 e 10/10 no
  AVD** (`N2-PR7-anexos/ime-350.txt`); `setTimeout(…, 0)` é 5/10 (div. 260). O
  arnês confirma folha fechada **e** `mInputShown=false` antes de cada toque.

## O estado de dados do G-inv (N3-PR1, div. 403; revisto na N3-PR2)

O G-inv compara `bounds`, e geometria que depende de **dado** reprova como se
fosse layout. Para dar idêntico à base, cada aparelho segue o caminho **dela**
(o `roteiro.py` e a `passada4.py` da N3-PR1 fazem isso):

- **palco antes das telas de S1** (baixa a partitura de 12 p: o ◔ vira "1 de 2");
- **AVD**: aviso de S1 com o app **aberto já sem rede**; S1e com o cache de 60–119 s ("há 1 min");
- **Tab**: aviso de S1 com o avião ligado **com o app aberto**; S1e logo depois do sync ("agora");
- **S0 por abertura fria**: o S0 alcançado por logout na sessão (mock `401`) tem os
  campos 0,5 dp mais altos (div. 404; aconteceu de novo na N3-PR2) — depois do
  logout, `force-stop` e abrir de novo.

**Retrato de S1 sem rede** (N3-PR2, div. 415): o app **abre já sem rede** nos dois
aparelhos — só assim o chip empilhado da moldura aparece.

**Tab**: `stay_on` a 7 **antes** de qualquer rodada longa. Na N3-PR2 a tela de 30 s
apagou enquanto o celular rodava, e a passada inteira caiu (0 capturas).

## A régua de desenvolvimento (N3-PR1)

**Para medir a largura de um texto que ainda não está em tela nenhuma** (as
`[estimado]` e `[soma]` da folha do N3: `Adicionar` no lugar de `Adicionar
música`, o chip empilhado, o `FIM DA SETLIST` em 32). Só existe no **dev client**
(`src/screens/ReguaDeDev.tsx`, carregada por `require` atrás de `__DEV__`).

```
adb -s <serial> shell am start -a android.intent.action.VIEW \
  -d "'exp+octavia://regua?t=<texto%20codificado>&s=<token>'" rocks.octavia.app
```

- Sai `OCTAVIA: regua t="<texto>" s=<token> w=<dp>` no logcat (`onLayout`) e o
  nó `regua-texto` no dump. `exp+octavia://regua` sem `t` fecha a régua; token
  desconhecido dá `w=-`. As **aspas simples dentro das duplas** são do `am start`
  (sem elas o `&` corta a URL no shell do aparelho).
- Os **tokens** são cópias declaradas dos estilos das telas (`faixa`, `chip`,
  `aviso`, `motivo`, `reordenar-titulo`, `regua-picker`, `marca`,
  `picker-alvo`, `fim`, `fim-32`), com a origem ao lado de cada um no arquivo.
  **Mudou o estilo da tela, muda o token no mesmo commit** — senão a régua mede
  outra coisa. O controle é o **régua × dump**: o mesmo texto, já desenhado numa
  tela, tem de dar a mesma largura nos dois (13 de 13 iguais na N3-PR1,
  `N3-PR1-anexos/`).
- Largura de **botão** = texto + o "chrome" do próprio botão, medido no dump
  (botão − texto). Na faixa de S2 e no picker o chrome é 69,8–70,2 dp.
- Em lote: `N3-PR1-anexos/instrumentos/regua.py <serial> <lista.tsv>` (token, TAB, texto).
- Funciona em qualquer tela, inclusive no S0 sem sessão: a régua é a camada de
  cima da raiz do app.

## `uiautomator dump`

- **Custa ~2,3 s** por chamada (2,26–2,36 s, n=5, `N2-PR7-anexos/j3.txt`):
  tempo de parede de um fluxo com dump **não** é tempo de usuário.
- **Não é fonte de texto de tela** (regra 0). Não vê a janela do teclado (div.
  203); a alça com `panHandlers` não é `clickable` (div. 291); linha cortada
  pela rolagem aparece como alvo pequeno — conferir contra a borda da lista
  (div. 291, `N2-PR7-anexos/g5-recorte.txt`).
- **Dump sem letra** (regra 10, `CLAUDE.md`): dump de prod não se commita; os
  commitados são do mock, com fixture escrita pelo projeto, e levam
  `SHA256SUMS.txt` no diretório. **Nome de anexo é afirmação** (caso 23).

## O que o `native-tela` prova, e o que não prova

O projeto `native-tela` do Vitest (`.tsx` em `jsdom`) troca `react-native`,
`react-native-svg`, o `datetimepicker` e o `expo-file-system` por duplos
(`apps/native/test/fake-*`). **Prova árvore e ligação**: que nó existe, com que
`testID`, se está desabilitado, que texto carrega, e que requests e linhas de
log saem, contra o mesmo `aceite.py`. **Não prova**: geometria (`StyleSheet` é
identidade, `Dimensions` é constante — os dp vêm do dump), IME, seletor do
sistema, a pilha HTTP do Android (div. 257) e a **`Navigation` real**, que não
roda no duplo (div. 334: o mapeamento entre telas só se prova no aparelho).
`N2-PR3-anexos/aparato.md` §6.1; div. 249. **O aceite no aparelho não se
dispensa por CN verde** — e a regra 15: a tela vence o log.

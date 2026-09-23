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
  fora disso o dev client carrega o bundle do Metro.
- **APK local é single-ABI** (`arm64-v8a`, 82.030.412 B) e o do CI tem quatro
  (231.377.892 B, V1-PR3): **nem tamanho nem tempo se comparam com a série do
  CI**. Div. 253.

## Aparelhos

| | Tab S6 | AVD `octavia_tab32` |
|---|---|---|
| id | `RX2N8000F3D`, `SM-T865`, Android 12 | `emulator-5554`, `sdk_gphone64_arm64`, Android 12 |
| tela | 2560 × 1600 px, densidade 360 → **fator 2,25** | idem |
| janela do app (paisagem) | 1137,8 × 663,1 dp; **639,1** abaixo da barra de 24 | 1137,8 × 711,1 dp |
| estado de repouso | bloqueio + tela de 30 s (div. 202); destravar é do Marcel | conta **de audit**, **em avião** (`airplane=1 wifi=0 data=0`) — divs. 200, 292 |

O canvas dos desenhos é 1138 × 627 dp, o pior caso (N2-D25). Retrato não tem
composição (`N2-ENCERRAMENTO.md` §10.7).

## Metro e mock

- **Metro na 8081, mock (`apps/native/src/fixtures/aceite.py`) na 8788** — a
  8081 é do Metro (div. 250). Os dois por `adb reverse tcp:<p> tcp:<p>`.
- **Metro com `CI=1` não observa o disco**: serve o bundle que já tem. Subir
  **sem** `CI=1`, e **antes de todo reteste** provar que o bundle servido tem o
  conserto (regra 13; div. 294, a mesma causa da div. 127):
  `curl -s 'http://localhost:8081/apps/native/index.bundle?platform=android&dev=true' | grep -c <símbolo do conserto>`.
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

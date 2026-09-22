# N2-PR3 — §4, o aceite no aparelho

Sessão própria, árvore própria (`../octavia-n2-pr3-aceite`), sobre
`n2/pr3-s1-criar` em **`25c00ee`**. Nenhum código de tela foi tocado: esta
sessão **mede**. Onde a medição discorda do congelado, o registro é **errata**
— nunca acomodação.

---

## 1 · Ferramentas (o gate do §0)

O `which adb emulator` do roteiro **reprova nesta máquina**, e reprovaria em
qualquer sessão: o shell não-login não carrega o `PATH` do perfil.

```
$ which adb emulator
adb not found
emulator not found
```

**As duas existem.** Medido:

```
$ ls -l ~/Library/Android/sdk/platform-tools/adb ~/Library/Android/sdk/emulator/emulator
-rwxr-xr-x@ 1 marcelviana staff 14046464 May 16  2025 …/platform-tools/adb
-rwxr-xr-x@ 1 marcelviana staff  1666544 May 16  2025 …/emulator/emulator
$ adb version
Android Debug Bridge version 1.0.41 / Version 35.0.2-12147458
```

O gate certo é `ls` no SDK (ou exportar `ANDROID_HOME` antes), não `which`.
**Parar aqui teria sido um falso negativo** — é o que a `[div. 250]` registra.

Aparelhos, os dois já ligados:

```
$ adb devices -l
RX2N8000F3D   device usb:0-1.1 product:gts6lxx model:SM_T865 device:gts6l
emulator-5554 device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64
```

Tab S6: `ro.product.model=SM-T865`, Android **12**, `wm size 1600x2560`,
`wm density 360` → **fator 2,25**, que é o do roteiro.

---

## 2 · Dev client novo nos dois aparelhos (§1 — obrigatório)

`@react-native-community/datetimepicker` **9.1.0** é módulo nativo (div. 234) e
o dev client de antes não o continha.

| | Tab S6 (SM_T865) | AVD `octavia_tab32` |
|---|---|---|
| início | 2026-09-22 10:31:52 | 2026-09-22 10:35:40 |
| fim | 10:34:24 | 10:35:58 |
| **duração total** | **152 s** | **18 s** |
| gradle | `BUILD SUCCESSFUL in 2m 23s` | `BUILD SUCCESSFUL in 10s` |
| instalado (`lastUpdateTime`) | 2026-09-22 10:34:25 | 2026-09-22 10:35:56 |

O AVD custa 18 s porque **é o mesmo APK**: o gradle já estava em dia e a etapa
é só `install`. Os dois aparelhos rodam o mesmo binário, como na V1-PR3.

- commit: `25c00eedb2cee989f92f73d08bcfe0d4267da4dd`
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`, **82.030.412 B**
- **sha256 `9447edc76f329ba3f66f3badd16268e52c779f1ae3363f6c6b94d1f2d4ab0548`**
- JDK: Corretto **17.0.15** (o da V1-PR3; o `java_home` desta máquina é o 21)

**O módulo está no binário** — não se presume, mede-se:

```
$ npx expo-modules-autolinking react-native-config --json --platform android
8 módulos, entre eles @react-native-community/datetimepicker
$ unzip -p app-debug.apk classes*.dex | strings | grep -c reactcommunity/rndatetimepicker
classes2.dex: 52 · classes3.dex: 3 · classes4.dex: 1   (56 referências)
```

**O APK tem UMA abi (`arm64-v8a`)**, e é por isso que ele pesa 82 MB contra os
231.377.892 B da V1-PR3, que empacotava quatro. Não é regressão e não é o
módulo novo: é o `expo run:android` construindo para a abi do aparelho ligado.
Os dois alvos desta série são arm64 (o Tab S6 e o `sdk_gphone64_arm64`), então
o mesmo APK serve aos dois. **A linha do `android-debug-apk` do CI não se
compara com esta** — lá são quatro abis. `[div. 253]`

### O `android-debug-apk` do CI, nesta série — **duas medições, e a segunda desmente a leitura da primeira**

`[medido]`, `gh pr checks 315`, nas duas pushes deste aceite:

| run | commit | árvore | `android-debug-apk` | `build` | `gates-nativos` |
|---|---|---|---|---|---|
| `35738242548` | `bb9a427` | o aceite | **13m11s** | 3m14s | 9s |
| `35739924367` | `a1f3f54` | **a mesma**, + o texto desta seção | **8m9s** | 3m13s | 8s |

As duas árvores diferem **só neste parágrafo** — nenhum arquivo de código,
nenhuma dependência. E o tempo caiu **5m2s**, 38 %.

**A primeira leitura desta seção estava errada e fica registrada como errada**:
ela atribuía os 13m11s a "o primeiro módulo nativo novo desde o N1" (div. 234).
Com a mesma árvore em 8m9s, essa causa não se sustenta — o que separa as duas
é o **cache do Gradle/AVD do runner**, quente na segunda. O módulo novo custa
alguma coisa, mas **estas duas medições não conseguem dizer quanto**, e
atribuir a diferença a ele seria inventar.

O que fica, e é o que a regra da V1-PR5 já dizia: **uma medição não vira
referência sem n** — e aqui **duas** medições da *mesma árvore* abrem uma faixa
de 5 minutos. A faixa de n=12 da V1-PR6 (mediana 11m49s) segue sendo a
referência; estes são mais dois pontos dentro dela, não um teto novo nem um
piso. **Rodadas seguintes desta mesma branch vão variar com o cache e não são
perseguidas aqui** — quem quiser o custo do módulo mede com n, e com o cache
controlado. `[div. 253]`

**O `--device` do `expo run:android` não aceita o serial do `adb`.** `--device
RX2N8000F3D` e `--device SM-T865` devolvem `CommandError: Could not find device
with name`. O nome é o do `getDevicesAsync` do próprio Expo — **`SM_T865`**,
com sublinhado. Medido rodando o módulo do CLI direto. `[div. 251]`

### O seletor abre, e não estoura (a prova que o §1 pede)

Toque em `form-data` com a folha aberta, no Tab S6:

```
$ adb shell pidof rocks.octavia.app      → 22033   (vivo)
$ adb logcat -d | grep -iE "FATAL|AndroidRuntime|ReactNativeJS.*Error"
(nada do app)
```

e o dump `dumps/05-N2-F-seletor-data.xml` traz o calendário do sistema, com
`android:id/date_picker_header_date` = **"Ter., 22 de set."** e a grade de dias.
As linhas `E HBD:` do logcat são do teclado Samsung (HoneyBoard), não do app.

---

## 3 · §4.1 — os estados, com o mock

Mock e Metro como nas PRs anteriores, **na porta 8788**:

```
$ python3 apps/native/src/fixtures/aceite.py servidor 8788 <modo> <setlists.json> <content.json>
$ adb -s RX2N8000F3D reverse tcp:8788 tcp:8788
$ EXPO_PUBLIC_API_BASE_URL=http://localhost:8788 npx expo start --dev-client --clear
```

**O roteiro diz 8081 e 8081 é a porta do Metro** — subir o mock nela derruba o
bundler. Todo aceite anterior usou **8788** (`V1-PR7-A-regressao-avd.txt:193`,
`V1-PR7-E-aparato-e-prod.txt:25`), e o próprio docstring do `aceite.py` diz
8788. Corrigido sem pedir. `[div. 250]`

As fixtures são **escritas por este projeto** (nomes sintéticos): nenhum corpo
de música entrou, nem na entrada do mock nem nos dumps (§6).

### G6 — estado → `resource-id` alcançado

| # | estado | modo do mock | dump | `resource-id` que prova | ok |
|---|---|---|---|---|---|
| 1 | `N2-S1-criar` | `escrita` | `01` | `criar-setlist` (na barra) | ✓ |
| 2 | `N2-S1f-criar` | `escrita`, `setlists: []` | `02` | `s1f` + **dois** `criar-setlist` | ✓ |
| 3 | `N2-F-criar` | `escrita` | `03` | `form-nome` (`focused=true`), `form-data`, `form-salvar`, `form-cancelar` | ✓ |
| 4 | `N2-F-validacao` | `escrita` | `04` | `form-erro-nome`, `form-salvar-motivo`, `form-salvar` `enabled=false` | ✓ |
| 5 | `form-erro-data` | — | — | **inalcançável** pelo seletor do sistema — a `div. 244` previu, e o aparelho confirma | — |
| 6 | `N2-F-salvando` | `atraso` | `06` | `form-nome`/`form-data` `enabled=false`, `form-cancelar` **ausente** | ✓* |
| 7 | `N2-F-falhou` | `escrita-500` | `07` | **`form-falha`**, `form-cancelar` (rótulo `Fechar`), `form-tentar` | ✓ |
| 8 | `N2-S1-sem-rede` | avião | `08` | `aviso-motivo`, `criar-setlist` `enabled=false`, **sem** `aviso-acao` | ✓ |
| 9 | `N2-S1-salvo-nao-relido` | `escrita-resync-500` | `09` | `aviso-motivo` (nomeia a setlist), `aviso-acao` = `Tentar recarregar` | ✓ |

**8 dos 9 estados alcançados; o 9º (o item 5) é o que a `div. 244` já dava por
inalcançável.** As duas ressalvas, nenhuma acomodada:

- **`✓*` do estado 6** — o estado é alcançado e as três conferências do roteiro
  passam, mas **o botão `Criar` perde o `testID` nesta fase**: o ramo `salvando`
  do `FolhaDeCriar.tsx:207` renderiza `<BotaoCheio rotulo="Criar" inativo />`
  **sem** `testID`, enquanto o ramo `editando` passa `testID="form-salvar"`. O
  nó existe, é `clickable`, mede 127,1 × 58,2 dp e está `enabled=false` (o
  `accessibilityState` do `BotaoCheio` funciona) — só não tem nome. **O G6, que
  pede um `resource-id` por estado, fica sem id próprio para `N2-F-salvando`.**
  `[div. 254]`
- **Estado 7 não foi alcançado pelo modo que o roteiro manda** — ver §5.

### Os estados 3 e 4 são **o mesmo estado renderizado**

`03-N2-F-criar.xml` e `04-N2-F-validacao.xml` são **idênticos byte a byte**
(sha256 `6dd7d697…` nos dois), e foram alcançados por caminhos diferentes: o
`03` é a folha recém-aberta; o `04` é a mesma folha depois de digitar `Teste` e
apagar as cinco letras. **É a N2-E2 provada no aparelho**: a folha nasce no
estado de validação, com `Criar` inativo e o motivo escrito ao lado. A legenda
do congelado ("`Criar` começa ativo") é prosa; a moldura `N2-F-validacao` é o
desenho, e é o desenho que a implementação segue.

### G5 — todo alvo do app, ≥ 48 dp pelas duas bordas

| dump | alvos | menor alvo do app | G5 |
|---|---|---|---|
| `01-N2-S1-criar` | 5 | `buscar` 171,1 × 57,8 | PASSA |
| `02-N2-S1f-criar` | 3 | `buscar` 171,1 × 57,8 | PASSA |
| `03-N2-F-criar` | 4 | `form-cancelar` 122,2 × 58,2 | PASSA |
| `04-N2-F-validacao` | 4 | `form-cancelar` 122,2 × 58,2 | PASSA |
| `05-N2-F-seletor-data` | 36 | — **só alvos do sistema**, ver abaixo | n/a |
| `06-N2-F-salvando` | 3 | `Criar` (sem id) 127,1 × 58,2 | PASSA |
| `07-N2-F-falhou` | 4 | `form-cancelar` 104,9 × 57,8 | PASSA |
| `08-N2-S1-sem-rede` | 5 | `buscar` 171,1 × 57,8 | PASSA |
| `09-N2-S1-salvo-nao-relido` | 6 | **`aviso-acao` 183,6 × 48,0** | PASSA |
| `10-N2-S1-prod-criada` | 6 | `buscar` 171,1 × 57,8 | PASSA |

**Zero alvos do app abaixo de 48 dp.** O `aviso-acao` mede **48,0 dp** de altura
— a linha de 48 dp do congelado, ao dp.

**O seletor de data reprova o G5, e os alvos não são do app.** 33 alvos abaixo
de 48 dp no dump `05`, todos com `resource-id` do framework (`android:id/prev`
e `android:id/next` a 48,0 × 44,0; `android:id/date_picker_header_year` a
51,6 × 34,7) ou sem id nenhum — as **30 células de dia, a 46,2 × 32,0 dp**. É o
`DatePickerDialog` do Android, hospedado no processo do app (por isso
`package=rocks.octavia.app`), e o app não tem como redimensioná-lo. É o **custo
declarado da N2-D16/§2** ter escolhido o seletor do sistema — a mesma escolha
que a `div. 244` já registrou por outro efeito. `[div. 255]`

---

## 4 · As medidas contra o congelado → **errata N2-E6**

Medidas do dump `01-N2-S1-criar.xml`, com a frase de sync **`sincronizado
agora`** — a mesma da captura C1 do `MEDIDAS.md`, para a comparação ser justa
(a caixa do título estica até o grupo da direita, então uma frase de sync mais
longa a encolhe sozinha; a primeira medição, com `sincronizado há 1 min`, dava
520,9 dp e teria misturado dois efeitos).

| o que | congelado | **medido** | Δ |
|---|---|---|---|
| botão `criar-setlist` | **190 × 57,8 dp** | **152,0 × 57,8 dp** | **−38,0 dp na largura**; altura exata |
| caixa do título `SETLISTS` | **495,8 dp** | **534,2 dp** | **+38,4 dp** |
| vão `criar-setlist` → `buscar` | 24,0 dp | 24,0 dp | — |
| `buscar` | 171,1 × 57,8 dp | 171,1 × 57,8 dp | — |
| cartão coberto pela barra | nenhum | nenhum (barra até y 253 px, 1º cartão em 396) | — |

**Os dois Δ são o mesmo número.** O título é mais largo exatamente no que o
botão é mais estreito (38,4 contra 38,0 — 0,4 dp de arredondamento). Não são
dois defeitos: é **um só**, e não está no layout.

**A aritmética do congelado está toda certa.** Ela prevê que a caixa perde
`largura do botão + 24 dp de vão`: `709,8 − (190 + 24) = 495,8`. Com a largura
medida: `709,8 − (152,0 + 24,0) = 533,8`, contra os **534,2** do dump. O que
estava errado era **só o 190**.

**E o botão está certo.** Ele é pintado pelo mesmo estilo do `buscar`, e a
diferença inteira é o rótulo:

| | total | rótulo | ícone | recuo + vãos |
|---|---|---|---|---|
| `buscar` ("Buscar música") | 171,1 | 101,3 | 24 | **45,8** |
| `criar-setlist` ("Nova setlist") | 152,0 | 81,8 | 24 | **46,2** |

Mesmo estilo (45,8 × 46,2 dp, 0,4 de arredondamento), e `171,1 − 152,0 = 19,1`
é `101,3 − 81,8 = 19,5`, a diferença dos dois rótulos. **A implementação não
tem o que corrigir.**

**De onde veio o 190.** Ele não é medição de coisa nenhuma: o `MEDIDAS.md` tem
**um** `190`, e é `190,2 × 20,0` — o texto `garantida offline` **dentro do
cartão** (linha 34). A folha congelada (`div. 249`) diz que *"os 190 × 57,8 dp
… são do dump do aparelho"*, mas **não havia dump nenhum** quando ela foi
escrita: o §4 era o que estava pendente. O `57,8` é verdadeiro e medido — é a
altura do `buscar`, na linha 26 do `MEDIDAS.md`, na mesma barra. **O `190` foi
emprestado da linha errada da mesma tabela.**

> ### N2-E6 — o botão `Nova setlist` mede 152,0 dp, não 190
>
> A `div. 249` da folha congelada anuncia **190 × 57,8 dp** para o
> `criar-setlist` como se fossem "do dump do aparelho". O primeiro dump que
> existiu — este — mede **152,0 × 57,8 dp**. A **altura confere**; a largura
> não, e não podia conferir: o botão usa o estilo do `buscar`, e a largura é a
> do rótulo. O `190` é o `190,2` do `garantida offline` (`MEDIDAS.md:34`), de
> outra linha da mesma tabela.
>
> Por consequência, a caixa do título encolhe de 709,8 para **534,2 dp**, e não
> para os 495,8 anunciados — **a conta do congelado (`caixa − botão − 24`) está
> certa e é o que confirma a medida**. Nada a corrigir no código.
> O número que as PRs 4–7 herdam é **152,0 × 57,8 dp**. `[div. 252]`

---

## 5 · O que o §4 achou e o §3 não podia achar

Dois defeitos, os dois invisíveis para os 14 CNs de tela. **Nenhum foi
corrigido aqui** — o roteiro manda parar, registrar e reportar.

### 5.1 — O teclado não sobe sozinho `[div. 256]` — **CONSERTADO depois**

> **Nota posterior, mesma sessão de trabalho.** Este defeito foi corrigido num
> commit próprio: o foco saiu do `autoFocus` e foi para o `onShow` do `Modal`,
> dentro de um `setTimeout` de 350 ms. **As duas formas que este anexo e o
> prompt do conserto imaginavam suficientes — `onShow` puro e
> `InteractionManager.runAfterInteractions` — falharam as duas**, e um
> `setTimeout(0)` acerta só metade das vezes. Medições com n=10 e o porquê em
> [`ime-depois.txt`](ime-depois.txt) e na **div. 260**. O que segue abaixo é o
> registro do defeito como ele foi achado, e fica como estava.

O congelado manda, e o código cita verbatim no comentário do
`FolhaDeCriar.tsx:171`: *"Ao abrir, o nome já está em foco e o teclado sobe."*
No Tab S6, **o foco vai e o teclado não sobe**:

```
folha recém-aberta:
  dump   → form-nome  focused="true"
  dumpsys input_method → mShowRequested=false  mInputShown=false
depois de UM toque no campo:
  dumpsys input_method → mShowRequested=true   mInputShown=true
```

O `autoFocus` está lá (`:172`). É o caso conhecido de `autoFocus` dentro de
`Modal` (`:154`): o campo recebe foco antes de a janela do modal assumir, e o
IME nunca é pedido. **Custa um toque a mais** — e o J3 conta os taps
(`Nova setlist` · digitar · `Criar`), então o que o congelado promete em 3 taps
custa 4 no aparelho.

**O dump não vê isso**, e vale registrar para as PRs 4–7: `03-N2-F-criar.xml`
(sem teclado) e o dump tirado com o teclado aberto são **idênticos byte a
byte** — a folha não se redimensiona, o IME sobrepõe. Quem quiser medir teclado
mede `dumpsys input_method`, nunca a árvore.

### 5.2 — O `escrita-corta` não corta no Android `[div. 257]`

O roteiro manda alcançar `N2-F-falhou` com `escrita-corta`. **No aparelho esse
modo não produz falha nenhuma.**

O mock corta de verdade — medido com `curl` contra ele no mesmo modo:

```
< HTTP/1.0 201 Created
< content-length: 500
* transfer closed with 500 bytes remaining to read
curl: (18)
```

E o app, com o mesmo servidor, com o `-lento` provando que o modo estava ativo
(a releitura veio em 629 ms, os 600 ms do modo):

```
OCTAVIA: api status=201 path=/api/setlists n=1 ms=32
OCTAVIA: write op=create setlist=- items=- status=201 code=- ms=36
OCTAVIA: resync kind=setlists reason=write op=create status=200 setlists=3 ms=633
```

`status=201 code=-`: **sucesso limpo**. A folha fechou e a setlist apareceu em
S1. Em Node o mesmo corpo truncado faz o `fetch` estourar (`TypeError:
terminated`) e é disso que vive o CN; o `await response.text()` do
`api.ts:257` **no Android não estoura** — devolve o que chegou, e um 201 com
corpo vazio passa por escrita boa.

**O que isto significa, sem exagerar**: neste caso o app acertou por fora — o
servidor gravou e o app disse que criou, e a releitura confirmou. Mas a espécie
`rede` da **N2-D18** (servidor gravou, cliente não soube), que é a única que
acende o *"pode já ter sido gravada"*, **não foi observada no aparelho**, e o
CN que a cobre prova só o comportamento do `fetch` do Node.

Para não deixar o estado 7 sem dump, ele foi alcançado com **`escrita-500`**,
que o Android vê. O dump `07` traz `form-falha`, `Fechar` e `form-tentar` — mas
as duas frases são as da espécie **`servidor`** (*"Não foi possível criar"* +
*"falha no servidor — nada foi alterado aqui"*), **não** as do
`pode-ter-gravado-folha` que a N2-E1 acrescentou. **A frase da N2-E1 continua
sem prova de aparelho.**

De brinde, o `07` confirma duas coisas do desenho: **`form-falha` existe e é
alcançável** (é a N2-E4, o 26º `testID` — ver §6) e a releitura de trás da
folha usa **`reason=reopen`**, que é o que a `div. 248` prescreve:

```
OCTAVIA: write op=create setlist=- items=- status=500 code=INTERNAL_ERROR ms=27
OCTAVIA: resync kind=setlists reason=reopen op=- status=200 setlists=2 ms=46
```

---

## 6 · As duas medições de aparato que o §4 pede

### 6.1 — Como o `native-tela` renderiza React Native em `jsdom`

O quarto projeto do `vitest.config.mts` (`name: 'native-tela'`, `environment:
'jsdom'`, `include: apps/native/test/**/*.test.tsx`) **não roda React Native**:
ele troca o módulo por um duplo, no `resolve.alias`.

| alias | vira |
|---|---|
| `react-native` | `apps/native/test/fake-react-native.tsx` |
| `react-native-svg` | `apps/native/test/fake-react-native-svg.tsx` |
| `@react-native-community/datetimepicker` | `apps/native/test/fake-datetimepicker.tsx` |
| `expo-file-system` | `apps/native/test/fake-expo-file-system.ts` |

O duplo mapeia cada primitivo para uma tag do DOM (`View`→`div`, `Text`→`span`,
`Pressable`→`div role="button"`, `Modal`→render direto) e leva ao DOM só dois
atributos: **`data-testid`** (do `testID`) e **`data-disabled`** (de
`accessibilityState.disabled`). `StyleSheet.create` é identidade e
`Dimensions.get` devolve um tamanho fixo.

**O que os 14 CNs de tela provam** (12 em `s1-criar.test.tsx` + 2 em
`apos-escrita.test.tsx`): que, dado um estado, a **árvore** certa é montada —
que nó existe, que `testID` ele tem, se está desabilitado, que texto carrega, e
que sequência de requests e de linhas de log sai disso. É prova de **estrutura e
de ligação**, contra um servidor de verdade (o mesmo `aceite.py`).

**O que eles não provam, por construção**: **geometria** (nenhum dp existe ali —
`StyleSheet` é identidade e `Dimensions` é constante; os 152,0 × 57,8 e os 48 dp
saem do dump do aparelho, como em toda esta série) e **comportamento nativo** —
IME, seletor do sistema, e a pilha HTTP do Android. Os dois defeitos da §5 são
exatamente disso: o §5.1 é IME (`Keyboard.dismiss` do duplo é `() => undefined`)
e o §5.2 é a diferença entre o `fetch` do Node e o do Android. **Um CN verde
neste aparato nunca substituiu o §4, e estes dois são a demonstração.**

### 6.2 — O `testID` `form-falha`: a errata pedida **já existe**

O §4 do prompt manda abrir uma errata **N2-E6** porque `form-falha` não está na
tabela dos 25 do congelado, levando-a a 26.

**Essa errata já está na PR**, escrita no commit `25c00ee`: é a **N2-E4**,
`DESIGN-N2/README.md` §9, com a `div. 245` — *"um `testID` a mais que as 25 da
§7. `form-falha` marca o bloco de falha da folha … Os 25 da tabela continuam
todos lá; este é o 26º."* É palavra por palavra o que o prompt pede.

Abrir uma E6 igual criaria **duas erratas para um fato**, que é o que o catálogo
existe para impedir. **Não foi aberta.** O que esta sessão acrescenta é o que
faltava à N2-E4: **a prova de aparelho** — `form-falha` aparece no dump `07`,
em `[544,422][2016,619]` (654,2 × 87,6 dp), alcançado pelo estado
`N2-F-falhou`. O número **26** fica como está.

A **N2-E6 desta sessão é outra coisa**: a medida do botão (§4). `[div. 258]`

---

## 7 · Regra 4 do `LOGS-OCTAVIA.md`

```
$ grep -rn eyJ docs/native/N2-PR3-anexos/
README.md:121:`grep -rn eyJ` e `grep -rln <email>` têm de sair com exit 1, e
$ grep -rln <email do Marcel> docs/native/N2-PR3-anexos/
(nada)                                                            exit 1
$ grep -E 'write op=|resync kind=' device-prod.txt | grep -Eo '<uuid>'
(nada)                                                            exit 1
```

O único acerto do `eyJ` é **a frase da própria regra**, no `README.md:121` do
commit `25c00ee`, que cita o literal para enunciá-la. Não há token. Fica o
registro de que **o teste, como escrito, encontra o seu próprio enunciado**
`[div. 259]` — e que nenhum arquivo novo desta sessão contém o literal.

As linhas de escrita não trazem uuid, nome de setlist nem título: o `op=create`
loga `setlist=-`, um hífen.

**Nenhum dump carrega corpo de música.** Varredura em todos os 10: os únicos
textos acima de 55 caracteres são três frases da própria UI (`sem-rede-s1`,
`salvo-nao-relido`, `primeira-setlist`). As fixtures do mock são sintéticas e
escritas por este projeto.

---

## 8 · Mutações locais, declaradas

1. **`apps/native/.env` copiado** do checkout principal para esta árvore, para o
   prebuild e o Metro — o precedente literal da V1-PR3 (`V1-PR3-D-apk-autolinking.txt:38`).
   É `.gitignore`d (`.gitignore:23`), 419 B, sha256 igual ao do principal.
   **Apagado no fim da sessão.**
2. **`apps/native/android/`** criado pelo prebuild. `.gitignore`d (`:30`).
3. **`settings global stay_on_while_plugged_in = 7`** no Tab S6, para a tela não
   apagar no meio da série. **O valor anterior não foi lido antes da troca** —
   é falha minha de método; restaurado para **`0`**, o padrão do Android, no
   fim da sessão. Se o Marcel tinha outro valor, é este o lugar de repor.
4. **Modo avião** ligado para o estado 8 e **desligado** em seguida
   (`airplane_mode_on` 1 → 0, `ping` de volta em 22–34 ms).

Nenhuma mexeu no checkout principal, e nenhuma entra no commit.

---

## 9 · Divergências abertas nesta sessão, **250 a 259**

| div. | o que | o que foi feito |
|---|---|---|
| **250** | O roteiro sobe o mock na **8081**, que é a porta do **Metro**; e o gate `which adb emulator` reprova por `PATH` de shell não-login, não por ausência. | Mock na **8788** (o que o docstring do `aceite.py` e todo aceite anterior usam). O gate virou `ls` no SDK. Os dois são erros do roteiro, não do aparato. |
| **251** | `expo run:android --device` recusa o serial do `adb` e o `ro.product.model`. | O nome é o do `getDevicesAsync` do Expo: **`SM_T865`**. Medido rodando o módulo direto. Fica para as PRs 4–7. |
| **252** | `criar-setlist` mede **152,0 × 57,8 dp**, não os 190 × 57,8 da `div. 249`; a caixa do título fica em **534,2**, não 495,8. | **N2-E6** (§4). O `190` é o `190,2` de outra linha do `MEDIDAS.md`. A conta do congelado está certa; o número emprestado é que não. |
| **253** | O APK desta série tem **uma** abi (82 MB) contra as quatro da V1-PR3 (231 MB). | Declarado. É o `expo run:android` mirando a abi do aparelho, não o módulo novo. **Não comparar com a faixa do `android-debug-apk` do CI.** |
| **254** | No ramo `salvando`, o botão `Criar` é renderizado **sem `testID`** (`FolhaDeCriar.tsx:207`), enquanto o ramo `editando` passa `form-salvar`. | Registrado: o **G6 fica sem id próprio** para `N2-F-salvando`. O estado é alcançável e `enabled=false` confere. Correção é de outra rodada. |
| **255** | O seletor de data tem **33 alvos abaixo de 48 dp** (as 30 células de dia a 46,2 × 32,0). | São do `DatePickerDialog` do Android, não do app. **Custo declarado da N2-D16/§2**; o G5 dos alvos do app passa com zero falhas. |
| **256** | **Defeito.** O `autoFocus` dentro do `Modal` dá foco e **não sobe o teclado**; o congelado manda subir. Um toque a mais, contra os 3 taps do J3. | Registrado, não corrigido (§5.1). |
| **257** | **Defeito de aparato.** `escrita-corta` **não produz falha no Android**: um 201 com corpo truncado passa por sucesso. O estado 7 foi alcançado com `escrita-500`. | Registrado (§5.2). A espécie `rede` da N2-D18 e a frase da N2-E1 **seguem sem prova de aparelho**. |
| **258** | O §4 do prompt pede uma **N2-E6** para `form-falha` — que **já é a N2-E4** (`div. 245`), palavra por palavra. | **Não foi aberta**: seria a segunda errata do mesmo fato. A N2-E4 ganhou a prova de aparelho que lhe faltava. O rótulo **N2-E6** foi usado para a medida do botão. |
| **259** | `grep -rn eyJ` sobre os anexos acha **o enunciado da própria regra 4** (`README.md:121`). | Registrado. Nenhum arquivo novo desta sessão contém o literal. |

**Próxima divergência livre: 260.**

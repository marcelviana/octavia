# W4B3-anexos — o bruto da W4-b3 (#323)

A última PR do W4-b, e a única do bloco que toca comportamento do app e usa
aparelho. **Rastro**: os `.txt` e `.tsv` são saída literal de comando, e este README
é o índice e o placar. A fonte do bloco é o [`W4-ENCERRAMENTO.md`](../W4-ENCERRAMENTO.md).
Divergências a partir da **370** (a maior na `main` era a 369, `W4B2-anexos/README.md` §15).

| arquivo | o que traz |
|---|---|
| `CN-antes.txt` · `CN-depois.txt` | os 8 testes do `apps/native/test/palco-divida.test.ts` contra a base (`796abe5`, 2 CNs reprovam) e com o conserto (8/8) |
| `GATES-depois.txt` | lint, os dois `tsc`, `type-check` do nativo, a suíte (1037), G1a/G1b e G2/G3 com o bloco `gates` desta PR, G7, `gate:a20`/`:cn`, `gate:icones`/`:cn`, congelados |
| `dumps-palco/` | 23 `uiautomator dump` do palco em paisagem: AVD `ANTES`/`DEPOIS` (3 estados), Tab S6 `ANTES`/`DEPOIS` (7 estados), Tab `RELEASE` (2 estados). O `text` e o `content-desc` saem omitidos pela regra "anexo não carrega texto de música", com o `bounds` preservado. Cada `.dp` é a árvore em dp, sem texto. `SHA256SUMS.txt` |
| `DUMPS-cmp.txt` · `barra-vs-W2.txt` | o `cmp` antes × depois dos 10 estados; a barra do AVD contra a linha de base do W2 |
| `dp.mjs` · `dump.sh` | os instrumentos: dump → árvore em dp (classe, id, bounds / 2,25, enabled, clickable) |
| `builds.sh` · `BUILDS-serie.tsv` · `BUILDS-analise.txt` | a série local: release n=3 e a div. 368 (debug com × sem, n=3 cada); tempos, tamanhos por ABI, sha, veredito |
| `BUILDS-R4-mock.tsv` | o release com a URL do mock (sem cronômetro) e o incidente do `metro-cache` |
| `RELEASE-aparelho.txt` | o release no Tab S6: instalação, S1, palco e rotação, release × dev client em dp, criar contra o mock (e o controle positivo) |
| `ESTADO-aparelhos.txt` | o estado dos dois aparelhos: lido, declarado, restaurado |

## 1. O texto original de cada item, e o conserto

| item | registro (verbatim) | onde estava no código | conserto |
|---|---|---|---|
| **div. 119** | `W1-PRECHECK.md:865` (A): *"O `emVoo` deduplica por URL e ignora as opções (`files.ts:151-167`): quem pede um arquivo já em voo recebe a promise alheia, com o `guaranteed` do outro. Efeitos: (a) o palco herda a promise do prefetch e, se ela não assenta, fica em `buscando` sem alcançar o `catch` do `download-error`; (b) um pedido `guaranteed:true` que pega carona num voo `false` grava no purgável — o `promoteList` conserta na passada seguinte, não nessa"* | `apps/native/src/files.ts:167-182` | a tabela guarda o `guaranteed` do voo. Um pedido garantido que encontra um voo **não** garantido espera esse voo e roda `ensureFileUma` de novo, que acha o arquivo no cache e o **move** (a promoção de sempre). Continua sendo um download só. Voo que rejeita dá carona que rejeita, sem retry. A entrada da tabela só é apagada por quem a pôs |
| **estouro do `lruEvict`** | `W1-PRECHECK.md:469`: *"`lruEvict` devolve o `bytesAfter` real estourado e **`prefetch.ts:167-170` o ignora** \| **continua ignorado.** Buraco que já existe, e que esta PR não abre nem fecha — registro para o N2"*; `W1-ENCERRAMENTO.md:391` | `apps/native/src/prefetch.ts:265-271` (`const { evict } = lruEvict(…)`) | `aplicarLru` lê o `bytesAfter` e, acima do teto, emite `lru over bytes=<n> cap=<n> protected=<n>` (linha nova, catalogada no `LOGS-OCTAVIA.md`) |

## 2. O placar dos controles `[medido: CN-antes.txt, CN-depois.txt]`

| teste | base `796abe5` | esta PR |
|---|---|---|
| **CN-119b** carona garantida num voo `false` → não-purgável, um download | ✗ (arquivo em `Paths.cache`) | ✓ |
| controle: dois `false` = um download, a mesma promise | ✓ | ✓ |
| controle: carona `false` num voo garantido fica no garantido | ✓ | ✓ |
| controle: carona garantida num voo que rejeita, rejeita (sem retry) | ✓ | ✓ |
| **controle-119a**: o palco que pega carona num voo que rejeita **recebe a rejeição** | ✓ | ✓ |
| **CN-lru** 3 × 80 MB protegidos contra 200 MB → `lru over …` | ✗ (nenhuma linha) | ✓ |
| controle: abaixo do teto, nenhuma linha `lru` | ✓ | ✓ |
| controle: acima do teto, mas o despejo resolve → só `lru evict` | ✓ | ✓ |

## 3. Palco: idêntico em dp `[medido: DUMPS-cmp.txt]`

`cmp` idêntico nos **10** estados. No AVD `octavia_tab32`: 1/8 PDF de 12 páginas, 2/8
PDF de 1 página, 3/8 texto. No Tab S6: 1/7 a 7/7, texto. A barra do AVD é igual à
linha de base do W2 (`W2-anexos/dumps-avd/DEPOIS-03-S3d-escuro.xml`, a última PR que
mexeu no palco): x1 24,0 · 106,2 · 188,0 · 270,2 · 884,0 · 965,8 · 1048,0 dp. O
bundle servido foi conferido com `curl` antes de cada lado: `jaVoando.guaranteed`
0 → 1, `lru over` 0 → 2.

## 4. Release e div. 368 → `BUILDS-analise.txt`, `RELEASE-aparelho.txt`, [`RELEASE-FAIXA.md`](../RELEASE-FAIXA.md)

| série (local, M1, prebuild + gradle) | n | tempos | mediana | APK |
|---|---|---|---|---|
| release | 3 | 5m58s · 5m32s · 6m27s | **5m58s** | 105.129.893 B (conteúdo idêntico nos três) |
| debug com `datetimepicker` | 3 | 4m18s · 4m43s · 5m12s | **4m43s** | 234.114.536 B (byte-idênticos) |
| debug sem | 3 | 4m18s · 5m00s · 5m02s | **5m00s** | 231.377.892 B (byte-idênticos; = o APK do CI da V1-PR3) |

Por ABI, release (`lib/`, descomprimido): armeabi-v7a 16.783.136 · arm64-v8a
24.296.128 · x86 25.297.232 · x86_64 25.078.448 B.

**Veredito da 368**: tirar o módulo não deixa o build mais rápido. As medianas são
283 s com e 300 s sem, e a dispersão dentro de cada variante é de 44–54 s. O módulo
custa +2.736.644 B, quase tudo C++ do codegen Fabric no `libappmodules.so` das quatro
ABIs. O patamar de 13m04s não tem causa no módulo e é **ruído**. Limite: M1 local não
é o runner do CI.

## 5. O bloco ```` ```gates ```` desta PR, verbatim

```gates
# W4-b3: o conserto da div. 119 (files.ts) e do estouro do lruEvict (prefetch.ts)
g1a: apps/native/src/files.ts
g1a: apps/native/src/prefetch.ts
```

## 6. Extras, e quando foram declarados

Honestamente: nenhum destes foi declarado **antes** do commit que o usa, no sentido
da regra. Cada um foi dito na conversa com o Marcel **no momento** em que foi feito, e
aqui aparece depois (div. 380).

- **extra-1**: `__plantarGrande` no duplo do `expo-file-system` (commit 1), para
  estourar 200 MB sem alocar 200 MB.
- **extra-2**: o dump do palco **release × dev client** (commit 3).
- **extra-3**: o R4/R4b, um quarto release com a URL do mock, sem cronômetro.
- **extra-4**: o controle positivo do aceite 3, com o dev client criando no mock.
- **extra-5**: o `RELEASE-FAIXA.md`.
- **extra-6**: refazer o dev client do AVD (div. 371).

## 7. Divergências — 370 a 381

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **370** | P | **o efeito (a) da div. 119 não se sustenta.** O palco que pega carona num voo que rejeita recebe a rejeição e alcança o `catch` do `download-error`: o controle passa na base e com o conserto. O que "não assenta" é um download sem teto, e o voo próprio do palco também não assentaria. É a div. 126 (o teto de inatividade morto pelo aparelho, W1-A3), não o `emVoo`. O registro é do pre-check do W1, **anterior** à medição que derrubou o teto | registrado com controle (`palco-divida.test.ts`); o conserto trata só o (b). Sobra um caso estreito: o "Baixar" do S3e pedido enquanto um voo alheio pendura pega carona no voo pendurado. Não se alcança sem rede ruim e fica na herança do W4 |
| **371** | A | **o dev client do AVD era de 2026-09-13, anterior à #315**: o bundle da `main` quebrava na carga com `'RNCDatePicker' could not be found`. O `APARATO.md` manda rebuildar quando entra módulo nativo (div. 234), mas a #315 rebuildou o Tab e o AVD ficou para trás, sem registro | refeito com `install -r`, sessão mantida (`ESTADO-aparelhos.txt`). No `APARATO.md`: o rebuild vale para **os dois** aparelhos, e a data do dev client se confere (`dumpsys package … lastUpdateTime`) antes de medir |
| **372** | P | *"se for o mesmo [`applicationId`], desinstale o dev client"*: é o mesmo, e a **chave também é a mesma** (`CN=Android Debug`, SHA-256 `fac61745…`, `apksigner` nos dois). Desinstalar apagaria a sessão, e refazê-la exige senha, que é passo do Marcel | **não** desinstalado: `install -r` nos dois sentidos, `firstInstallTime` preservado do começo ao fim |
| **373** | A | **o release não alcança `http://`**: sem `usesCleartextTraffic`, que o prebuild só põe em `src/debug*`. O aceite "criar uma setlist contra o mock" **não se cumpre no release**: `write op=create … status=net`, zero requests no mock. O controle positivo (o mesmo dev client, o mesmo mock) cria com 201 | registrado; prod é `https` e não é afetada. O afetado é o aparato: mock `http` não serve para release. Escrito no `APARATO.md` e no `RELEASE-FAIXA.md`. Decisão do Marcel: aceitar, ou dar ao mock um caminho para release (um `network_security_config` de debug só para `localhost`, que é código nativo) |
| **374** | T | **o `EXPO_PUBLIC_API_BASE_URL` inline não chegou ao bundle do R4**: o `$TMPDIR/metro-cache` (do Metro do dev client, 17:58) tinha o `api.ts` transformado com a URL de prod. O app sincronizou com prod (2/63). Parei **antes** de tocar em "Nova setlist": nenhuma escrita. Consequência para a série: R1–R3 empacotaram o JS com o cache do Metro quente, e no CI ele é frio | cache apagado, R4b com a URL certa (`grep` = 1). Regra no `APARATO.md`: trocou `EXPO_PUBLIC_*` para um build → apagar o `metro-cache` e conferir o bundle com `grep`. O limite está declarado no `RELEASE-FAIXA.md` |
| **375** | P | *"tamanho do APK/AAB por ABI"*: não há AAB, nem split por ABI, na configuração. O `bundleRelease` não foi rodado | APK universal, e o "por ABI" é a soma de `lib/<abi>/` (`unzip -l`), declarado |
| **376** | P | *"com o aparato do build de release em mãos, meça o build com e sem o `datetimepicker`"*: a pergunta é sobre a série do **CI**, que é `assembleDebug` das quatro ABIs | medido com o comando do CI (debug), não com release. O release não empacota nada diferente do módulo |
| **377** | T | o `__plantarGrande` do commit 1 mudou primeiro o `size` do **`FileHandle`** (o primeiro `get size()` do arquivo), não o do `File`. O CN do `lruEvict` reprovou **pelo motivo errado**: nenhum despejo, não "estouro calado". Achado lendo a asserção que falhou (`lru evict` vazio) | corrigido antes do commit 1. O `CN-antes.txt` commitado reprova pelo motivo certo: `lru evict` presente, `lru over` ausente |
| **378** | D | a "linha de base do 1.4": os dumps do palco do N1 e do V1 são **anteriores ao W2**, que mudou a barra (`576b4ed`, `3ea2247`). A linha de base válida é `W2-anexos/dumps-avd/DEPOIS-*`, só do AVD. **Não há** dump do palco no Tab depois do W2 | AVD comparado com o W2 (`barra-vs-W2.txt`); no Tab, `ANTES` tirado nesta sessão, com o mesmo Metro |
| **379** | A | a conta do Tab (a do Marcel) não tem arquivo na setlist aberta: as 7 posições são texto. O PDF do palco só se provou no AVD (1/8 e 2/8) | registrado; a invariante "idêntico em dp" vale nos dois, e o caminho de arquivo, no AVD |
| **380** | P | extras não declarados **antes** (§6), e o `lru over` só em **log**: o T1-R37 manda a falha aparecer, e aparecer na **tela** é decisão de produto que o prompt não tomou | extras declarados aqui; a tela do estouro fica na herança do W4 para o Marcel (o teto é 200 MB e o repertório medido é 265.002 B) |

| **381** | T | o push só de docs (`0a28628`) rodou o APK (13m18s) porque subiu com o APK do `7ab865c` ainda em curso: o H1 só filtra quando o último APK da PR é `success`. A regra funcionou; o custo foi pressa de quem executou. Registrada primeiro no corpo da #323, para não furar a lista fechada | no `APARATO.md`: "push de docs só depois do APK verde; antes, custa um APK" |

## 8. Decisões do Marcel (2026-09-23), verbatim

1. **Div. 368 fechada**: "ruído — medido com o comando do CI, n=3 intercalado, medianas 283 s com e 300 s sem o módulo, variação de 44–54 s; limite: máquina local, não o runner". → `CI-FAIXA.md`, `W4-ENCERRAMENTO.md` §4 e §7.1.
2. **Div. 373 fechada**: "o release não alcança `http://`; aceite de release é contra prod, só leitura, mais escrita descartável pela regra 12; o mock é do dev client". → `APARATO.md`.
3. **Estouro do LRU**: fica só em log (`lru over`). Hipótese com dono **N3 pre-check**:
   "o indicador ◔ do T1-R17 reflete um `lru over`?" → `W4-ENCERRAMENTO.md` §7.3.
4. **Div. 374 → regra 13 ampliada**: conferir no bundle servido **o símbolo do conserto
   e a URL base da API** antes de qualquer reteste; cache do Metro pode servir a URL de
   prod. → `LOGS-OCTAVIA.md` (regra 13) e `APARATO.md`.
5. **Div. 381 → `APARATO.md`**: "push de docs só depois do APK verde; antes, custa um APK".

**Aparato, sem número** (não é divergência de registro): o primeiro cabo do Tab não
passava dados, e o macOS não via o aparelho nem no `system_profiler`. O Marcel trocou
o cabo. Está no `APARATO.md`.

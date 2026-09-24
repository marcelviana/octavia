# N3 — pre-check: faixas de largura (retrato, paisagem, celular)

> **Bloco**: N3 — **faixas de largura** do app nativo (N3-D6). O brief desenha
> três faixas; a implementação do N3 cobre as duas de tablet; a de celular é o N5.
> **Data**: 2026-09-23 (Fase A e B2/B5 do AVD) → 2026-09-24 (Tab S6, celular, B6).
> **Árvore**: `../octavia-n3-pre`, branch `n3/precheck`, a partir de
> `origin/main` = **`aa91b5d`** (o merge da #323, W4 encerrado — ver div. 382).
> **Só leitura**: nenhum código de app, **nenhuma escrita em prod, nenhum request
> a `octavia.rocks`**. Todo estado veio do mock (`aceite.py servidor`, 8788) e de um
> servidor de arquivos do host (8790), no dev client, com a fixture escrita por este
> pre-check (`instrumentos/fixture.py`). A única edição fora dos anexos é o
> `APARATO.md` (extra declarado, §2).
> **Regra de leitura**: `[medido]` = comando + saída literal, aqui ou no anexo
> citado; `[derivado]` = conta feita sobre números medidos, com a conta à vista;
> `[lido]` = tirado do documento citado; `[hipótese]` = não medido, com dono em §6.
> **Divergências**: a maior na `main` era a **381** nas duas formas (`div. nnn` e
> `| **nnn** |`); este pre-check vai de **382 a 392** (§9).
> **Anexos**: [`N3-PRECHECK-anexos/`](N3-PRECHECK-anexos/README.md).

---

## 0. Decisões e premissas

### 0.1 Decisões do Marcel (2026-09-23)

| # | Decisão |
|---|---|
| **N3-D0** | Haverá versão do produto para **celular**. O brief do N3 desenha as **três** faixas; a implementação do N3 cobre só as duas de tablet; a de celular é bloco próprio (**N5**), depois de content (**N4**). |
| **N3-D1** | A unidade de desenho é a **faixa de largura**, não a orientação: < ~600 dp (celular), ~600–900 (tablet em retrato, janela reduzida), > ~900 (tablet em paisagem — o congelado atual). Cada faixa desenhada é congelada em dp como V1/N2; nada de regra fluida. |
| **N3-D2** | O palco entra pelo pre-check: só vai ao brief se o pre-check medir defeito objetivo em retrato. Não se trava orientação: para target API 36 o Android 16 ignora `screenOrientation` em telas ≥ 600 dp, e o API 37 não terá opt-out ([Android Developers Blog, "The future is adaptive: Changes to orientation and resizability APIs in Android 16", 2025-01-23](https://android-developers.googleblog.com/2025/01/orientation-and-resizability-changes-in-android-16.html)). |
| **N3-D3** | Invariante do bloco: **a faixa > 900 não muda** — dump de cada tela em paisagem antes e depois, idêntico em dp. Vira gate. |
| **N3-D4** | G5/G6 passam a ter quatro colunas: Tab × AVD, paisagem × retrato. |
| **N3-D5** | Design pelo Claude Design, com brief, capturas e canvas medido; restrição: nada específico de Android na composição (o iPad herda). |
| **N3-D6** | Nome: N3 — faixas de largura. Content = N4, celular = N5. O bloco web vem depois do N3. |
| **N3-D7** | O palco **existe no celular**; o brief o desenha nas três faixas. |

### 0.2 Aval do pre-check (Marcel, 2026-09-24) — N3-D8…D11

| # | Decisão |
|---|---|
| **N3-D8** | **Errata da N3-D1** (Q1, Q2): faixas **< 600 · 600–960 · > 960** dp de largura; a faixa média é desenhada para **711,1 × 1053,8** (pior caso, AVD). A condição de altura (janela útil < ~480 dp → composição compacta) fica registrada como regra do **N5**, não desenhada no N3. |
| **N3-D9** | **Errata da N3-D2** (Q5): o critério é **defeito novo em relação à paisagem do mesmo estado** (as sobreposições das zonas de 15 % do palco já existem na paisagem congelada). O palco entra no brief **só pela barra superior** na faixa média, e nas três faixas pela N3-D7. |
| **N3-D10** | Q3, Q4, Q6, Q7 como recomendado: S1 com título em linha própria; S2 com rótulos curtos, senão dois controles só ícone com rótulo acessível — o brief mede e decide; mesma escala de leitura, degrau de display menor só em < 600; **(e)** critério duro e **(d′)** triagem com PNG como definição do gate do N3; S0 no Tab fica para a PR que mexer no S0. |
| **N3-D11** | Div. 385: errata no `N2-ENCERRAMENTO.md` §10.2 — content é N4. Div. 383: o aparato do AVD `octavia_tab32` se conserta (dev client atual instalado, snapshot `default_boot` regravado, provado por reboot) e se registra no `APARATO.md`. |

O aval veio em cinco itens para quatro números. A N3-D11 junta os itens 4 e 5
(div. 392).

### 0.3 Premissas do prompt, com veredito

| # | premissa | veredito |
|---|---|---|
| P1 | `origin/main` é o sha do levantamento, "W4 encerrado" | **caiu no início**: `origin/main` era `796abe5` (W4-b2) e a #323 estava aberta. O Marcel mergeou na sessão → `aa91b5d`. **Div. 382** |
| P2 | `N2-ENCERRAMENTO.md` §10 registra "retrato precisa de composição própria" e "app iOS" | verdadeira: §10.7, itens 1 e 2 (`N2-ENCERRAMENTO.md:630-631`) `[lido: faseA/A3.md §3.8]`. Mas a §10.2 chama o bloco de content de "N3" — **div. 385** |
| P3 | `W4-ENCERRAMENTO.md` §7.3: a hipótese do ◔, dono este pre-check | verdadeira (§7 item 3) — **fechada no B6** (§6, H-N3-2) |
| P4 | `APARATO.md`: "retrato não tem composição"; regra 13 ampliada | verdadeira (`APARATO.md:59-60`, `:70-73`); a regra 13 foi aplicada antes de cada rodada (§2.3) |
| P5 | `DESIGN-V1/` e `DESIGN-N2/`: canvas 1138 × 627, só paisagem | verdadeira: **zero** ocorrências de retrato/portrait nos dois `telas.html` `[medido: faseA/A3.md §3.4]` |
| P6 | PRD: T1-R27 (rotação do palco), A14, T1-R17 (indicador) | verdadeira; verbatim em §1.3 |
| P7 | N3-D1: "paisagem de celular cai na faixa 600–900" | **caiu**: o celular deitado mede **914,3 dp** de largura (B1) — pela largura, cai na faixa > 900. **Div. 388** |
| P8 | N3-D2: target 36 ignora `screenOrientation` ≥ 600 dp; o 37 sem opt-out | verdadeira, com uma nuance que não muda a decisão: no API 36 **existe** opt-out temporário; é o 37 que o tira (post citado). O target efetivo é **36** (§1.1) |
| P9 | B3 (d): "texto truncado = `text` terminando em `…`" | **caiu**: o RN elipsa no desenho e o `uiautomator` devolve o texto inteiro — (d) é zero por construção. **Div. 384**; substituto (d′)/(e) em §3.1 |
| P10 | B2: "S0 (vazio e com erro)" no Tab, com "a conta que estiver (sem escrita)" | **não cabem juntas**: o app não tem botão de sair; o S0 só se alcança por logout (401 de leitura), e a volta exige a senha do Marcel. S0 capturado no AVD e no celular; **não** no Tab. **Div. 386** |
| P11 | B4: "perfil tipo Pixel 6: ~411 × 914 dp, densidade 420" | verdadeira: 1080 × 2400 px, 420 → **411,4 × 914,3 dp** (`estado/phone-lido.txt`) |
| P12 | B5: "os dumps do palco do W4-b3 **são** a linha de base do palco (dez estados)" | verdadeira: `W4B3-anexos/dumps-palco/` tem os 10 (AVD 3, Tab 7) + 2 de release. Não recapturados como linha de base (§3.4) |
| P13 | "se a, b, c e d derem zero no palco, a N3-D2 o deixa fora do brief" | pela letra, **o palco entra**: (a) ≠ 0 em 3 estados no tablet em retrato. O que o (a) mede ali é a classe que o congelado já tem — §4.3 e a pergunta Q5 |

---

## 1. Fase A — estática

A Fase A inteira, com cada comando e saída, está em `N3-PRECHECK-anexos/faseA/`
(A1–A4, rastro). Aqui vai o que o brief e a implementação precisam.

### 1.1 A1 — como o app lê largura hoje

`[medido: faseA/A1.md §1.1]`

```
$ grep -rn "useWindowDimensions\|Dimensions\.\|onLayout\|orientation" apps/native/src packages/core/src
apps/native/src/screens/EndScreen.tsx:114:      <View style={styles.meio} onLayout={medirMeio}>
apps/native/src/screens/ModoDeReordenar.tsx:596:          onLayout={(e) => {
apps/native/src/screens/StageScreen.tsx:37:  useWindowDimensions,
apps/native/src/screens/StageScreen.tsx:212:  const { width, height } = useWindowDimensions()
apps/native/src/screens/StageScreen.tsx:219:   * Sai só na MUDANÇA de orientação, não na montagem: o `useWindowDimensions`
apps/native/src/screens/StageScreen.tsx:458:  // duas medidas vêm do `onLayout` do `meio`, não de `useWindowDimensions()`.
apps/native/src/screens/StageScreen.tsx:460:  // Por quê (V1-PRECHECK §3.4, div. 16/24): `useWindowDimensions()` devolve a
apps/native/src/screens/StageScreen.tsx:466:  // E por que `onLayout` e não `useSafeAreaInsets()`: o `SafeAreaView` da raiz
apps/native/src/screens/StageScreen.tsx:469:  // que alguém tocar em `edges`. O `onLayout` mede a altura que a View de fato
apps/native/src/screens/StageScreen.tsx:573:        {/* No PRIMEIRO frame o `onLayout` ainda não disparou e as bordas não
```

| arquivo:linha | lê | de onde | reage à rotação | afeta layout |
|---|---|---|---|---|
| `StageScreen.tsx:212` | largura, altura | janela (`useWindowDimensions`) | sim (hook) | **não** — só o log `rotation=` |
| `StageScreen.tsx:471-477`, `:530` | largura, altura | View `meio` (`onLayout`) | sim | sim — zonas de toque de 15 % |
| `EndScreen.tsx:97-103`, `:114` | largura, altura | View `meio` (`onLayout`) | sim | sim — a zona de 15 % |
| `ModoDeReordenar.tsx:596` | só altura | `ScrollView` (`onLayout`) | sim | não (rolagem do arrasto) |
| `ModoDeReordenar.tsx:342` | y, altura | corpo (`measureInWindow`) | lido a cada arrasto | não |

**Nenhuma tela escolhe layout pela largura**: não há `Dimensions.get`, breakpoint
nem ramo por orientação; `packages/core` não lê medida. A única geometria que
acompanha a janela são as zonas de 15 % do S3 e do S5.

- **`app.json`**: `"orientation": "default"` → `android:screenOrientation="unspecified"`
  na `MainActivity`, com `configChanges` incluindo `orientation|screenSize|screenLayout|smallestScreenSize`
  (o giro não recria a Activity). **Não há chave `ios`** — `supportsTablet` não
  declarado. `[medido: faseA/A1.md §1.3, §1.4]`
- **`targetSdkVersion` efetivo = 36**, de `react-native@0.86.3/gradle/libs.versions.toml:4`
  (`targetSdk = "36"`), pelo catálogo `expoLibs` → `ExpoRootProjectPlugin.kt:55` →
  `app/build.gradle:106`; o default 35 do plugin não se aplica, e o `gradle.properties`
  não sobrescreve. Prova no artefato: `aapt dump badging … → targetSdkVersion:'36'`.
  `[medido: faseA/A1.md §1.4]` É este número que a N3-D2 exige.
- Achado de passagem: `StageScreen.tsx:467` cita `App.tsx:206` para o `SafeAreaView`,
  que hoje está em `App.tsx:295` (div. 390).

### 1.2 A2 — inventário de literais de dimensão

A tabela por superfície, o apêndice de 590 propriedades com os tokens resolvidos
e a conferência de cada soma contra o dump estão em `faseA/A2.md`. O que depende
de largura, com a conta:

| literal que não encolhe | onde | quebra abaixo de (dp) |
|---|---|---:|
| fileira `FILEIRA = 900` / barra sólida 900 | S5 (`EndScreen.tsx:57`) | ~883–900 (N ≥ 24) |
| os quatro controles da faixa, sem `flexWrap`/`flexShrink` | S2 com edição (`IndexScreen.tsx:872-880`) | **788,5** |
| `width: 720`, sem `maxWidth` | folha (`FolhaDeCriar.tsx:574`) | **720** |
| `falha.maxWidth: 520` + linha | picker em falha (`Picker.tsx:692`) | 682 |
| 7 × 66 + vãos + recuos | barra inferior do S3 (`StageScreen.tsx:940-951`) | 622 |
| `width: 620`, sem `maxWidth` | diálogo (`DialogoDeApagar.tsx:229`) | 620 |
| barra do S1 (dois botões com rótulo + chip) | S1 (`SetlistsScreen.tsx:654-660`) | 604 + título |
| `indicador 230` + `Baixar` | cartão do S1 (`SetlistsScreen.tsx:699`) | 593,8 + nome |
| `numColumns={2}` + `remover` | grade do S2 com edição | 594 (texto a 0) |

`[lido: faseA/A2.md §2.5; as somas estão conferidas contra dumps do Tab S6 lá]`.
**Já adaptável hoje**: o S0 (`flexWrap: 'wrap'` + `maxWidth: '100%'`,
`LoginScreen.tsx:212`), as zonas de 15 %, o espaçador `flex: 1` da barra do S3 e
as caixas de título `flex: 1`. Números do prompt que **não existem como literal**
no código: 536,9 (sai do `numColumns={2}`), 171 (0,15 × 1137,8), 15 % (é o fator
`0.15`), 1138, 627, 592, 190, 44 e 88 (é `bar.top + space.xl`). A folha é
**720 × 420** e o diálogo **620 × 300** (a coluna de 420 do S0 é outro 420).

### 1.3 A3 — o que o V1 e o N2 já disseram sobre retrato

`[medido: faseA/A3.md]` — a varredura inteira está lá. Verbatim:

- **T1-R27** (`PRD-TELA-1.md:219`): *"… Landscape em tablet é o layout primário (J1
  contexto); rotação no meio da música preserva a posição (J1 ponto de observação)."*
  **Primário, não único.**
- **A14** (`PRD-TELA-1.md:292`): *"Avançar/voltar pela borda (≥ 48 px, 15% laterais
  da área de conteúdo, entre as barras superior e inferior (D-1, design 2026-09-08));
  "n de N" visível; salto 1→47 em ≤ 3 taps; fim de setlist elegante; rotação preserva
  posição"*.
- **T1-R17** (`PRD-TELA-1.md:180`): ✓ garantida · ◔ parcial ("n de m arquivos") · ✗
  nunca sincronizada; *"O estado é recalculado a cada gravação no cache"*.
- **Proposta 08** da tela 1 (`PRD-TELA-1.md:342`): *"Retrato — mesma estrutura: barra
  superior vira 2 linhas (n de N + título), barra inferior mantém 7 controles em 800
  dp de largura (104→96 dp cada). Bordas continuam 15%."* — a **única** composição
  de retrato já escrita, só do S3, num canvas de 1280 × 800 que o V1 aposentou; a
  "barra superior em 2 linhas" nunca foi implementada.
- **N1-D12** (`N1-PRECHECK.md:23`): `orientation: "default"`, sem trava; rotação
  preserva posição — executada (#284/#286).
- **`flexWrap` do S0**: o único do app (`LoginScreen.tsx:212`), desde a N1-PR3a,
  **nunca medido** até este pre-check.
- **`N2-ENCERRAMENTO.md` §10.7.1**: *"o tablet em retrato precisa de composição
  própria — os elementos se encavalam; o canvas do N1/N2 é só paisagem (N2-D25)"*.
  O "se encavalam" não tinha medição; o B3 a testa (H-N3-7).
- **Retrato já medido antes**: só S3 e S5, no AVD, na V1-PR1/PR3/PR7 (G6 do V1,
  sem coluna própria) e o aceite do N0 no Tab. **Nenhuma tela de lista.**

### 1.4 A4 — o que os gates medem por orientação

`[medido: faseA/A4.md]`

1. **G5 e G6 são procedimento de aceite no aparelho**, com instrumento no anexo de
   cada PR (V1: `g5.mjs`, `g6.sh`; N2: `g5.py`, `textos.py`, `roteiro.sh`). Nenhum
   workflow nem `apps/native/scripts` os roda.
2. **No N2, só paisagem**: Tab por `user_rotation` 0 → 1, AVD em paisagem natural;
   janelas 1137,8 × 663,1 e × 711,1; fator 2,25 cravado; tabela `| Tab S6 | AVD |`
   (`N2-PR7-anexos/g6.md`).
3. O V1 pôs 4 dumps de retrato do AVD no G6 (S3, S5, A14), sem coluna própria.
4. Três dependências de aparelho: o atributo `rotation` do dump **inverte de sentido**
   entre Tab (retrato natural) e AVD (paisagem natural) — a orientação se lê da
   **raiz** do dump; o `g5-recorte.txt` da N2-PR7 usa o `y2` da lista em px de
   paisagem, e o script dele não está commitado; o fator 2,25 não vale no celular (2,625).
5. **Onde entra a coluna nova (N3-D4)**: não há arquivo compartilhado do G6. A tabela
   de quatro colunas (`Tab paisagem | Tab retrato | AVD paisagem | AVD retrato`) nasce
   no anexo da PR de aceite do N3. O `roteiro.py` deste pre-check já tem o que ela
   pede: prefixo por aparelho × orientação e a **recusa** de captura cuja raiz não
   está na orientação do nome (div. 387).

---

## 2. B1 — o canvas de cada faixa

### 2.1 Janela útil `[medido: N3-PRECHECK-anexos/B1-janelas.txt]`

```
# B1 — janela útil por aparelho × orientação [medido]
# wm size / wm density: estado/*-lido.txt. Raiz e janela: dump do S1 (setlists), convertidos por inventario.mjs
# (fator 2,25 = 360/160 nos tablets; 2,625 = 420/160 no celular). Janela útil = a maior ViewGroup do app de largura inteira
# abaixo da barra de status; a altura acaba na barra de tarefas (tablets) ou na navegação por gestos (celular).

$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B2/B2-S1-setlists-tab.xml | head -1  →  bounds="[0,0][1600,2452]"
   raiz (dp) 711.1 × 1089.8 · janela útil y 24…1089.8 → 711.1 × 1065.8 dp
$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B5-baseline/B5-S1-setlists-tab-pai.xml | head -1  →  bounds="[0,0][2560,1492]"
   raiz (dp) 1137.8 × 663.1 · janela útil y 24…663.1 → 1137.8 × 639.1 dp
$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B2/B2-S1-setlists-avd.xml | head -1  →  bounds="[0,0][1600,2560]"
   raiz (dp) 711.1 × 1137.8 · janela útil y 24…1077.8 → 711.1 × 1053.8 dp
$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B5-baseline/B5-S1-setlists-avd-pai.xml | head -1  →  bounds="[0,0][2560,1600]"
   raiz (dp) 1137.8 × 711.1 · janela útil y 24…651.1 → 1137.8 × 627.1 dp
$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B4/B4-S1-setlists-phone-ret.xml | head -1  →  bounds="[0,0][1080,2400]"
   raiz (dp) 411.4 × 914.3 · janela útil y 24…898.3 → 411.4 × 874.3 dp
$ grep -o 'bounds="\[0,0\]\[[0-9]*,[0-9]*\]"' B4/B4-S1-setlists-phone-pai.xml | head -1  →  bounds="[0,0][2400,1080]"
   raiz (dp) 914.3 × 411.4 · janela útil y 24…395.4 → 914.3 × 371.4 dp
```

| aparelho | faixa | orientação | tela (dp) | **janela útil (dp)** | barras |
|---|---|---|---|---|---|
| Tab S6 | 600–900 | retrato | 711,1 × 1089,8 | **711,1 × 1065,8** | status 24 (a navegação de 48 fica fora da raiz) |
| AVD `octavia_tab32` | 600–900 | retrato | 711,1 × 1137,8 | **711,1 × 1053,8** | status 24 + tarefas 60 |
| `octavia_phone` | < 600 | retrato | 411,4 × 914,3 | **411,4 × 874,3** | status 24 + gestos 16 |
| `octavia_phone` | **> 900** pela largura (div. 388) | paisagem | 914,3 × 411,4 | **914,3 × 371,4** | status 24 + gestos 16 |
| Tab S6 | > 900 | paisagem | 1137,8 × 663,1 | 1137,8 × 639,1 | status 24 |
| AVD `octavia_tab32` | > 900 | paisagem | 1137,8 × 711,1 | 1137,8 × 627,1 | status 24 + tarefas 60 |

**O canvas de retrato do brief é 711 × 1054 dp** (o pior caso, o AVD — a mesma
regra do 627 da N2-D25). O do celular é **411 × 874**. A largura de retrato é a
mesma nos dois tablets (711,1): só a altura muda.

### 2.2 Registro no `APARATO.md` (extra declarado)

A tabela "Aparelhos" ganhou a coluna do `octavia_phone`, a linha de retrato, o
comando que cria o celular e o registro de que o `octavia_tab32` volta ao
snapshot de 2026-09-14 a cada boot (div. 383). É a única edição fora dos anexos.

### 2.3 O bundle, conferido antes de cada rodada (regra 13 ampliada)

`[medido: estado/bundle-1.txt, estado/bundle-2.txt]`

```
# regra 13 ampliada — bundle servido pelo Metro (8081), 2026-09-23 20:43:34, árvore aa91b5d
bytes 7184663
localhost:8788 1
octavia.rocks 0
lru over 2
jaVoando.guaranteed 1
```

(a segunda, 2026-09-24 09:08, antes do Tab e do celular, deu os mesmos quatro
números.) URL base = o mock; o host de prod aparece **zero** vezes; o símbolo do
conserto do W4-b3 (`lru over`) está no bundle.

---

## 3. B3/B4 — defeito objetivo por dump

### 3.1 O instrumento (`N3-PRECHECK-anexos/inventario.mjs`)

Cada dump é medido **contra a paisagem do mesmo estado** (a referência: `B5-baseline/`
para listas e N2, `B3-referencia-paisagem/` para o palco). O que a paisagem já tem é
o congelado (N3-D3), não defeito de faixa; conta o **novo**.

| critério | como se mede |
|---|---|
| **(a)** sobreposição | pares de folhas de conteúdo (texto, ícone, imagem, alvo) cujos bounds se cruzam > 1 dp nos dois eixos; caixa **dentro** da outra é contêiner, não par (o Fabric achata a árvore) |
| **(b)** corte | nó que entra sob barra; nó que encosta na borda lateral sem ocupar a largura; e **ausente**: `resource-id` da referência que some do dump (o `uiautomator` omite nó inteiro fora da tela) |
| **(c)** alvo < 48 dp | `clickable` com lado menor < 48, pela regra das duas bordas (o que encosta na borda de um `ScrollView` ancestral é recorte de rolagem, div. 291) |
| **(d)** truncado, literal | `text` terminando em `…` — **zero por construção** (div. 384) |
| **(d′)** menos espaço | o mesmo `text` tem, na paisagem, largura maior em > 1 dp, ou altura menor em > 40 % (quebrou). **É teto, não prova**: nó esticado encolhe sem cortar (S4, picker). Só conta como defeito o que o PNG confirma (§4) |
| **(e)** texto ausente | `text` de `TextView` que a paisagem tem e o dump não, **dentro da altura** que a janela de agora mostra (o resto é rolagem); textos de estado ("sincronizado há …", "n de m arquivos") fora |

O **controle** (o instrumento contra a própria paisagem, `B3-controle-paisagem.jsonl`):
nas **34** telas de lista e do N2 em paisagem, (a) = (b) = (c) = (d) = **0**. Nas 18
do palco, (a) e (b) aparecem só como **as zonas de 15 %**: `borda-voltar`/`borda-avancar`
encostadas na borda da tela e sobre o `corpo` — **é o desenho** (D-1). É contra
isso que o palco em retrato é lido.

Calibragens feitas antes de confiar no número, e por quê: as folhas `View`/`ViewGroup`
vazias saíram de (a) (paisagem dava 84 pares de fundo × conteúdo); 108 px ÷ 2,25 =
48,0 deixou de contar como < 48 (ponto flutuante); a janela útil passou a ser a
**maior** `ViewGroup` de largura inteira (a primeira era a barra de 120 do S1 no Tab);
(e) ganhou o corte de altura (no celular deitado, 94 "ausentes" eram rolagem).

### 3.2 Por superfície × faixa

`[medido: node instrumentos/por-superficie.mjs B3-inventario.jsonl]` — contagens do
**novo** contra a paisagem; "o que é" traz os distintos.

| superfície | faixa | dumps | a | b | c | d | d′ | e | o que é (novo contra a paisagem; distintos) |
|---|---|---|---|---|---|---|---|---|---|
| S0 | tablet retrato (Tab S6) | 0 | — | — | — | — | — | — | não capturado (§3.3) |
| S0 | tablet retrato (AVD) | 2 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| S0 | celular retrato | 2 | 0 | 9 | 0 | 0 | 3 | 0 | b: "ENTRAR" (borda); ViewGroup (borda); SvgView (borda); entrar (borda) |
| S0 | celular paisagem | 2 | 0 | 5 | 0 | 0 | 0 | 0 | b: senha (ausente); erro (ausente); entrar (ausente) |
| S1 | tablet retrato (Tab S6) | 4 | 0 | 0 | 0 | 0 | 35 | 0 |  |
| S1 | tablet retrato (AVD) | 4 | 0 | 0 | 0 | 0 | 34 | 1 | e: "SETLISTS" |
| S1 | celular retrato | 4 | 3 | 5 | 0 | 0 | 14 | 36 | a: SvgView × SvgView · b: buscar (ausente); buscar (borda); criar-setlist (borda) · e: "SETLISTS"; "Buscar música"; "ENSAIO DE RETRATO"; "sem data"; "8 músicas"; … (+6) |
| S1 | celular paisagem | 4 | 0 | 0 | 0 | 0 | 9 | 0 |  |
| S2 | tablet retrato (Tab S6) | 3 | 0 | 4 | 0 | 0 | 54 | 0 | b: setlist-apagar (borda); "Apagar setlist" (borda) |
| S2 | tablet retrato (AVD) | 3 | 0 | 4 | 0 | 0 | 54 | 0 | b: setlist-apagar (borda); "Apagar setlist" (borda) |
| S2 | celular retrato | 3 | 0 | 8 | 0 | 0 | 31 | 50 | b: setlist-editar (borda); SvgView (borda); GroupView (borda); PathView (borda) · e: "Renomear e datar"; "Apagar setlist"; "Manhã de ensaio"; "Banda da fixture"; "Segunda do ensaio"; … (+10) |
| S2 | celular paisagem | 3 | 0 | 0 | 0 | 0 | 23 | 0 |  |
| reordenar | tablet retrato (Tab S6) | 1 | 0 | 0 | 0 | 0 | 4 | 0 |  |
| reordenar | tablet retrato (AVD) | 1 | 0 | 0 | 0 | 0 | 6 | 0 |  |
| reordenar | celular retrato | 1 | 0 | 1 | 0 | 0 | 16 | 3 | b: reordenar-salvar (ausente) · e: "REORDENAR · ENSAIO DE RETRATO"; "arraste pela alça · a ordem só é salva n"; "Salvar a ordem" |
| reordenar | celular paisagem | 1 | 0 | 0 | 0 | 0 | 4 | 0 |  |
| picker | tablet retrato (Tab S6) | 2 | 0 | 0 | 0 | 0 | 12 | 0 |  |
| picker | tablet retrato (AVD) | 2 | 0 | 0 | 0 | 0 | 12 | 0 |  |
| picker | celular retrato | 2 | 2 | 1 | 0 | 0 | 5 | 11 | a: " · nada adicionado nesta visita" × picker-rodape · b: "6 RESULTADOS" (borda) · e: "Manhã de ensaio"; "Banda da fixture"; "Segunda do ensaio"; "Terceira do ensaio"; "Trio de fixture"; … (+3) |
| picker | celular paisagem | 2 | 0 | 0 | 0 | 0 | 8 | 0 |  |
| folha | tablet retrato (Tab S6) | 3 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| folha | tablet retrato (AVD) | 3 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| folha | celular retrato | 3 | 0 | 13 | 2 | 0 | 17 | 0 | b: "Nova setlist" (borda); form-erro-nome (borda); form-salvar (borda); form-cancelar (ausente); "Não foi possível criar" (borda); … (+3) · c: form-salvar 4.6×57.9; form-salvar 14.9×57.9 |
| folha | celular paisagem | 3 | 0 | 9 | 0 | 0 | 0 | 0 | b: form-cancelar (ausente); form-salvar-motivo (ausente); form-salvar (ausente); form-data (ausente); form-tentar (ausente) |
| dialogo | tablet retrato (Tab S6) | 1 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dialogo | tablet retrato (AVD) | 1 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| dialogo | celular retrato | 0 | — | — | — | — | — | — | não capturado (§3.3) |
| dialogo | celular paisagem | 1 | 0 | 0 | 0 | 0 | 2 | 0 |  |
| S3 | tablet retrato (Tab S6) | 8 | 4 | 0 | 0 | 0 | 15 | 0 | a: borda-avancar × corpo; "Partitura que nunca baixou · partitura n" × borda-voltar; "Partitura que nunca baixou · partitura n" × borda-avancar |
| S3 | tablet retrato (AVD) | 8 | 4 | 0 | 0 | 0 | 15 | 0 | a: borda-avancar × corpo; "Partitura que nunca baixou · partitura n" × borda-voltar; "Partitura que nunca baixou · partitura n" × borda-avancar |
| S3 | celular retrato | 8 | 4 | 33 | 0 | 0 | 16 | 1 | a: borda-avancar × corpo; "Partitura que nunca baixou · partitura n" × borda-voltar; "Partitura que nunca baixou · partitura n" × borda-avancar · b: indice (borda); SvgView (borda); busca (ausente); sair (ausente); pagina (borda) · e: "Partitura de doze páginas · Orquestra de" |
| S3 | celular paisagem | 8 | 2 | 0 | 0 | 0 | 16 | 0 | a: borda-avancar × corpo |
| S4 | tablet retrato (Tab S6) | 2 | 0 | 0 | 0 | 0 | 13 | 0 |  |
| S4 | tablet retrato (AVD) | 2 | 0 | 0 | 0 | 0 | 13 | 0 |  |
| S4 | celular retrato | 2 | 0 | 0 | 0 | 0 | 13 | 0 |  |
| S4 | celular paisagem | 2 | 0 | 0 | 0 | 0 | 5 | 0 |  |
| S5 | tablet retrato (Tab S6) | 1 | 1 | 0 | 0 | 0 | 0 | 0 | a: "FIM DA SETLIST" × borda-voltar |
| S5 | tablet retrato (AVD) | 1 | 1 | 0 | 0 | 0 | 0 | 0 | a: "FIM DA SETLIST" × borda-voltar |
| S5 | celular retrato | 1 | 2 | 0 | 0 | 0 | 1 | 0 | a: "FIM DA SETLIST" × borda-voltar; SvgView × borda-voltar |
| S5 | celular paisagem | 1 | 0 | 0 | 0 | 0 | 0 | 0 |  |

### 3.3 O que não foi capturado, e por quê

- **S0 no Tab S6**: exige logout da conta do Marcel, e a volta exige a senha
  (div. 386). O AVD cobre a mesma largura (711,1).
- **Diálogo de apagar no celular em retrato**: **inalcançável por toque** —
  `setlist-apagar` não existe no dump do S2 (a faixa sai da tela; §4.2). Não é
  queda de arnês: é o achado.
- **Palco com N ≥ 24 no S5** e **picker em falha**: fora da lista fechada do B2;
  ficam como hipótese derivada da A2 (H-N3-3, H-N3-4).

### 3.4 A linha de base da N3-D3 (B5)

`N3-PRECHECK-anexos/B5-baseline/`: **S0 (2), S1 (4), S2 (3), reordenar, picker (2),
folha (3), diálogo, S4 (2)** em paisagem — **18 estados no AVD** e **16 no Tab** (sem S0),
PNG + XML com sha. O palco em paisagem **não** é linha de base aqui: a linha de base
dele é `W4B3-anexos/dumps-palco/` (AVD 3 estados, Tab 7, como o prompt manda; o PDF
só no AVD, div. 379). O palco em paisagem com a fixture deste pre-check está em
`B3-referencia-paisagem/` como **referência do inventário**, não como linha de base
(extra declarado antes de capturar).

### 3.5 A tabela inteira, dump a dump

`[medido: node inventario.mjs --md B2/*.xml B4/*.xml]` — também em
`N3-PRECHECK-anexos/B3-tabela.md`.

| dump | janela útil (dp) | ref. | a | b | c | d | d′ | e | pior caso (novo contra a paisagem) |
|---|---|---|---|---|---|---|---|---|---|
| B2-S0-erro-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-S0-login-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-S1-S1e-falha-com-cache-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 11 | 0 | d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→335.1 dp |
| B2-S1-S1e-falha-com-cache-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 11 | 0 | d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→335.1 dp |
| B2-S1-S1f-vazia-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 1 | 0 | d′: "SETLISTS" 534.2→107.1 dp (encolheu 427.1 dp · altura ×1.9) |
| B2-S1-S1f-vazia-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 1 | 0 | d′: "SETLISTS" 534.2→107.1 dp (encolheu 427.1 dp · altura ×1.9) |
| B2-S1-aviso-sem-rede-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 11 | 1 | e: 1 texto(s), ex. "SETLISTS" · d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→335.1 dp |
| B2-S1-aviso-sem-rede-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 12 | 0 | d′: "SETLISTS" 534.2→107.1 dp (encolheu 427.1 dp · altura ×1.9) |
| B2-S1-setlists-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 11 | 0 | d′: "SETLISTS" 534.2→107.1 dp (encolheu 427.1 dp · altura ×1.9) |
| B2-S1-setlists-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 11 | 0 | d′: "SETLISTS" 534.2→107.1 dp (encolheu 427.1 dp · altura ×1.9) |
| B2-S2-com-edicao-avd | 711.1 × 1053.8 | sim | 0 | 2 | 0 | 0 | 18 | 0 | b: setlist-apagar borda lateral [597.8,119.6,711.1,167.6] · d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S2-com-edicao-aviso-sem-rede-avd | 711.1 × 1053.8 | sim | 0 | 2 | 0 | 0 | 19 | 0 | b: setlist-apagar borda lateral [597.8,119.6,711.1,167.6] · d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S2-com-edicao-aviso-sem-rede-tab | 711.1 × 1065.8 | sim | 0 | 2 | 0 | 0 | 19 | 0 | b: setlist-apagar borda lateral [597.8,119.6,711.1,167.6] · d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S2-com-edicao-tab | 711.1 × 1065.8 | sim | 0 | 2 | 0 | 0 | 18 | 0 | b: setlist-apagar borda lateral [597.8,119.6,711.1,167.6] · d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S2-sem-edicao-S2p-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 17 | 0 | d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S2-sem-edicao-S2p-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 17 | 0 | d′: "ENSAIO DE RETRATO" 783.6→356.9 dp |
| B2-S3-S3a-letra-1a-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Manhã de ensaio · Banda da fixture · Let" 832→404.9 dp |
| B2-S3-S3a-letra-1a-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Manhã de ensaio · Banda da fixture · Let" 832→404.9 dp |
| B2-S3-S3b-cifra-claro-avd | 711.1 × 1053.8 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (74.7×861.8) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→403.1 dp |
| B2-S3-S3b-cifra-claro-tab | 711.1 × 1065.8 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (74.7×873.8) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→403.1 dp |
| B2-S3-S3b-cifra-escuro-avd | 711.1 × 1053.8 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (74.7×861.8) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→403.1 dp |
| B2-S3-S3b-cifra-escuro-tab | 711.1 × 1065.8 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (74.7×873.8) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→403.1 dp |
| B2-S3-S3c-tab-autoscroll-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Terceira do ensaio · Trio de fixture · T" 830.2→403.1 dp |
| B2-S3-S3c-tab-autoscroll-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Terceira do ensaio · Trio de fixture · T" 830.2→403.1 dp |
| B2-S3-S3d-pdf-12p-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Partitura de doze páginas · Orquestra de" 694.2→267.1 dp |
| B2-S3-S3d-pdf-12p-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Partitura de doze páginas · Orquestra de" 694.2→267.1 dp |
| B2-S3-S3e-nao-baixado-avd | 711.1 × 1053.8 | sim | 2 | 0 | 0 | 0 | 1 | 0 | a: "Partitura que nunca baixou · partitura n" × borda-voltar (31.1×44.4) · d′: "Partitura que nunca baixou · Orquestra d" 806.2→379.1 dp |
| B2-S3-S3e-nao-baixado-tab | 711.1 × 1065.8 | sim | 2 | 0 | 0 | 0 | 1 | 0 | a: "Partitura que nunca baixou · partitura n" × borda-voltar (31.1×44.4) · d′: "Partitura que nunca baixou · Orquestra d" 806.2→379.1 dp |
| B2-S3-titulo-longo-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Uma música de título bem comprido, para " 828.4→401.3 dp |
| B2-S3-titulo-longo-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Uma música de título bem comprido, para " 828.4→401.3 dp |
| B2-S3-ultima-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Oitava do ensaio · Banda da fixture · Le" 828.4→401.3 dp |
| B2-S3-ultima-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Oitava do ensaio · Banda da fixture · Le" 828.4→401.3 dp |
| B2-S4-resultados-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 13 | 0 | d′: "Manhã de ensaio" 892→465.3 dp |
| B2-S4-resultados-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 13 | 0 | d′: "Manhã de ensaio" 892→465.3 dp |
| B2-S4-vazio-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-S4-vazio-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-S5-fim-avd | 711.1 × 1053.8 | sim | 1 | 0 | 0 | 0 | 0 | 0 | a: "FIM DA SETLIST" × borda-voltar (26.2×52) |
| B2-S5-fim-tab | 711.1 × 1065.8 | sim | 1 | 0 | 0 | 0 | 0 | 0 | a: "FIM DA SETLIST" × borda-voltar (26.2×52) |
| B2-dialogo-apagar-avd | 711.1 × 1137.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-dialogo-apagar-tab | 711.1 × 1089.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-criar-avd | 711.1 × 424.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-criar-tab | 711.1 × 424.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-falhou-avd | 711.1 × 506.2 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-falhou-tab | 711.1 × 506.2 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-validacao-avd | 711.1 × 424.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-folha-validacao-tab | 711.1 × 424.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-picker-resultados-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 12 | 0 | d′: "Manhã de ensaio" 726.2→299.1 dp |
| B2-picker-resultados-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 12 | 0 | d′: "Manhã de ensaio" 726.2→299.1 dp |
| B2-picker-vazio-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-picker-vazio-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B2-reordenar-aberto-avd | 711.1 × 1053.8 | sim | 0 | 0 | 0 | 0 | 6 | 0 | d′: "REORDENAR · ENSAIO DE RETRATO" 494.2→67.6 dp |
| B2-reordenar-aberto-tab | 711.1 × 1065.8 | sim | 0 | 0 | 0 | 0 | 4 | 0 | d′: "REORDENAR · ENSAIO DE RETRATO" 494.2→67.6 dp |
| B4-S0-erro-phone-pai | 914.3 × 371.4 | sim | 0 | 3 | 0 | 0 | 0 | 0 | b: senha ausente |
| B4-S0-erro-phone-ret | 411.4 × 874.3 | sim | 0 | 5 | 0 | 0 | 2 | 0 | b: "ENTRAR" borda lateral [0,423.2,347.4,444.6] · d′: "ENTRAR" 420→347.4 dp |
| B4-S0-login-phone-pai | 914.3 × 371.4 | sim | 0 | 2 | 0 | 0 | 0 | 0 | b: senha ausente |
| B4-S0-login-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 1 | 0 | b: "ENTRAR" borda lateral [0,449.9,347.4,471.2] · d′: "ENTRAR" 420→347.4 dp |
| B4-S1-S1e-falha-com-cache-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 3 | 0 | d′: "SETLISTS" 501.3→276.2 dp |
| B4-S1-S1e-falha-com-cache-phone-ret | 411.4 × 874.3 | sim | 1 | 1 | 0 | 0 | 4 | 11 | a: SvgView × SvgView (16.4×2.3) · b: buscar ausente · e: 11 texto(s), ex. "SETLISTS" · d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→35.4 dp |
| B4-S1-S1f-vazia-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 1 | 0 | d′: "SETLISTS" 534.2→308.6 dp |
| B4-S1-S1f-vazia-phone-ret | 411.4 × 874.3 | sim | 0 | 1 | 0 | 0 | 1 | 2 | b: buscar borda lateral [401.1,54.5,411.4,112.4] · e: 2 texto(s), ex. "SETLISTS" · d′: "Nenhuma setlist por aqui ainda. A primei" 491.1→315 dp (encolheu 176.1 dp · altura ×2) |
| B4-S1-aviso-sem-rede-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "SETLISTS" 396.9→171.4 dp |
| B4-S1-aviso-sem-rede-phone-ret | 411.4 × 874.3 | sim | 1 | 2 | 0 | 0 | 5 | 12 | a: SvgView × SvgView (16.4×2.7) · b: buscar ausente · e: 12 texto(s), ex. "SETLISTS" · d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→35.4 dp |
| B4-S1-setlists-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 3 | 0 | d′: "SETLISTS" 534.2→308.6 dp |
| B4-S1-setlists-phone-ret | 411.4 × 874.3 | sim | 1 | 1 | 0 | 0 | 4 | 11 | a: SvgView × SvgView (16.4×2.7) · b: buscar borda lateral [401.1,54.5,411.4,112.4] · e: 11 texto(s), ex. "SETLISTS" · d′: "SHOW DE SEXTA NO TEATRO DA FIXTURE" 762.2→35.4 dp |
| B4-S2-com-edicao-aviso-sem-rede-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 5 | 0 | d′: "ENSAIO DE RETRATO" 783.6→558.9 dp |
| B4-S2-com-edicao-aviso-sem-rede-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 11 | 16 | b: setlist-editar borda lateral [389.7,119.6,411.4,167.6] · e: 16 texto(s), ex. "Renomear e datar" · d′: "ENSAIO DE RETRATO" 783.6→56 dp |
| B4-S2-com-edicao-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 9 | 0 | d′: "ENSAIO DE RETRATO" 783.6→558.9 dp |
| B4-S2-com-edicao-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 10 | 18 | b: setlist-editar borda lateral [389.7,119.6,411.4,167.6] · e: 18 texto(s), ex. "Renomear e datar" · d′: "ENSAIO DE RETRATO" 783.6→56 dp |
| B4-S2-sem-edicao-S2p-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 9 | 0 | d′: "ENSAIO DE RETRATO" 783.6→558.9 dp |
| B4-S2-sem-edicao-S2p-phone-ret | 411.4 × 874.3 | sim | 0 | 0 | 0 | 0 | 10 | 16 | e: 16 texto(s), ex. "Manhã de ensaio" · d′: "ENSAIO DE RETRATO" 783.6→56 dp |
| B4-S3-S3a-letra-1a-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Manhã de ensaio · Banda da fixture · Let" 832→608.4 dp |
| B4-S3-S3a-letra-1a-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 2 | 0 | b: busca ausente · d′: "Manhã de ensaio · Banda da fixture · Let" 832→105.5 dp |
| B4-S3-S3b-cifra-claro-phone-pai | 914.3 × 371.4 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (105.1×179.4) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→606.5 dp |
| B4-S3-S3b-cifra-claro-phone-ret | 411.4 × 874.3 | sim | 1 | 4 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (29.7×682.3) · b: busca ausente · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→103.6 dp |
| B4-S3-S3b-cifra-escuro-phone-pai | 914.3 × 371.4 | sim | 1 | 0 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (105.1×179.4) · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→606.5 dp |
| B4-S3-S3b-cifra-escuro-phone-ret | 411.4 × 874.3 | sim | 1 | 4 | 0 | 0 | 2 | 0 | a: borda-avancar × corpo (29.7×682.3) · b: busca ausente · d′: "Segunda do ensaio · Duo Manacá · Cifra" 830.2→103.6 dp |
| B4-S3-S3c-tab-autoscroll-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Terceira do ensaio · Trio de fixture · T" 830.2→606.5 dp |
| B4-S3-S3c-tab-autoscroll-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 2 | 0 | b: busca ausente · d′: "Terceira do ensaio · Trio de fixture · T" 830.2→103.6 dp |
| B4-S3-S3d-pdf-12p-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 3 | 0 | d′: linha-motivo 1137.8→914.3 dp |
| B4-S3-S3d-pdf-12p-phone-ret | 411.4 × 874.3 | sim | 0 | 5 | 0 | 0 | 2 | 1 | b: busca ausente · e: 1 texto(s), ex. "Partitura de doze páginas · Orquestra de" · d′: linha-motivo 1137.8→411.4 dp |
| B4-S3-S3e-nao-baixado-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 1 | 0 | d′: "Partitura que nunca baixou · Orquestra d" 806.2→582.5 dp |
| B4-S3-S3e-nao-baixado-phone-ret | 411.4 × 874.3 | sim | 2 | 4 | 0 | 0 | 2 | 0 | a: "Partitura que nunca baixou · partitura n" × borda-voltar (61.7×67) · b: busca ausente · d′: "Partitura que nunca baixou · Orquestra d" 806.2→79.6 dp |
| B4-S3-titulo-longo-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: corpo 1073.8→850.3 dp |
| B4-S3-titulo-longo-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 2 | 0 | b: busca ausente · d′: corpo 1073.8→347.4 dp (encolheu 726.3 dp · altura ×1.6) |
| B4-S3-ultima-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: corpo 1073.8→850.3 dp |
| B4-S3-ultima-phone-ret | 411.4 × 874.3 | sim | 0 | 4 | 0 | 0 | 2 | 0 | b: busca ausente · d′: corpo 1073.8→347.4 dp (encolheu 726.3 dp · altura ×1.6) |
| B4-S4-resultados-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 5 | 0 | d′: "Manhã de ensaio" 892→668.6 dp |
| B4-S4-resultados-phone-ret | 411.4 × 874.3 | sim | 0 | 0 | 0 | 0 | 12 | 0 | d′: "Manhã de ensaio" 892→165.7 dp |
| B4-S4-vazio-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B4-S4-vazio-phone-ret | 411.4 × 874.3 | sim | 0 | 0 | 0 | 0 | 1 | 0 | d′: "busca em título, artista, álbum e letra " 486.2→315 dp (encolheu 171.2 dp · altura ×2) |
| B4-S5-fim-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 0 | 0 |  |
| B4-S5-fim-phone-ret | 411.4 × 874.3 | sim | 2 | 0 | 0 | 0 | 1 | 0 | a: "FIM DA SETLIST" × borda-voltar (61.7×104.4) · d′: "FIM DA SETLIST" 550.2→411.4 dp (encolheu 138.8 dp · altura ×2) |
| B4-dialogo-apagar-phone-pai | 914.3 × 411.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: "Manter a setlist" 124.4→123 dp |
| B4-folha-criar-phone-pai | 914.3 × 411.4 | sim | 0 | 3 | 0 | 0 | 0 | 0 | b: form-cancelar ausente |
| B4-folha-criar-phone-ret | 411.4 × 424 | sim | 0 | 4 | 1 | 0 | 5 | 0 | b: form-cancelar ausente · c: form-salvar 4.6×57.9 · d′: "Nome" 654.2→411.4 dp |
| B4-folha-falhou-phone-pai | 914.3 × 411.4 | sim | 0 | 3 | 0 | 0 | 0 | 0 | b: form-data ausente |
| B4-folha-falhou-phone-ret | 411.4 × 505.5 | sim | 0 | 5 | 0 | 0 | 7 | 0 | b: form-cancelar ausente · d′: "Nome" 654.2→411.4 dp |
| B4-folha-validacao-phone-pai | 914.3 × 411.4 | sim | 0 | 3 | 0 | 0 | 0 | 0 | b: form-cancelar ausente |
| B4-folha-validacao-phone-ret | 411.4 × 424 | sim | 0 | 4 | 1 | 0 | 5 | 0 | b: form-cancelar ausente · c: form-salvar 14.9×57.9 · d′: "Nome" 654.2→411.4 dp |
| B4-picker-resultados-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 6 | 0 | d′: "Manhã de ensaio" 726.2→502.1 dp |
| B4-picker-resultados-phone-ret | 411.4 × 874.3 | sim | 1 | 1 | 0 | 0 | 3 | 10 | a: " · nada adicionado nesta visita" × picker-rodape (173.3×20.2) · b: "6 RESULTADOS" borda lateral [345.1,129.5,411.4,147.8] · e: 10 texto(s), ex. "Manhã de ensaio" · d′: "Duo Manacá" 726.2→161.1 dp |
| B4-picker-vazio-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 2 | 0 | d′: " · nada adicionado nesta visita" 195.1→193.5 dp |
| B4-picker-vazio-phone-ret | 411.4 × 874.3 | sim | 1 | 0 | 0 | 0 | 2 | 1 | a: " · nada adicionado nesta visita" × picker-rodape (173.3×20.2) · e: 1 texto(s), ex. "Ensaio de retrato · " · d′: "Digite para achar na biblioteca e adicio" 455.1→315 dp (encolheu 140.1 dp · altura ×1.5) |
| B4-reordenar-aberto-phone-pai | 914.3 × 371.4 | sim | 0 | 0 | 0 | 0 | 4 | 0 | d′: "REORDENAR · ENSAIO DE RETRATO" 494.2→267.4 dp |
| B4-reordenar-aberto-phone-ret | 411.4 × 874.3 | sim | 0 | 1 | 0 | 0 | 16 | 3 | b: reordenar-salvar ausente · e: 3 texto(s), ex. "REORDENAR · ENSAIO DE RETRATO" · d′: "Uma música de título bem comprido, para " 641.8→97.1 dp |

---

## 4. O que precisa de composição nova, por faixa

Defeito objetivo = (a), (b), (c) ou (e) novos contra a paisagem, ou (d′)
**confirmado no PNG**, ou `[derivado]` com a conta à vista. Estranhamento = leitura,
não medição, numa coluna à parte.

### 4.1 Faixa 600–900 — tablet em retrato (711,1 dp)

| superfície | defeito objetivo (medido) | estranhamento (leitura) |
|---|---|---|
| **S1** | **"SETLISTS" quebra no meio da palavra** ("SETLI / STS", 534,2 → 107,1 dp, altura × 1,9; no S1e, × 2,7 em três linhas "SET/LIS/TS"); **no S1 com aviso do AVD o título some** — (e), o chip "sem conexão · última sincronização agora" o espreme a zero; **nome do cartão** 544,0 → 117,3 dp ("ENSAIO …"); metadados "sem data" e "8 músicas" viram "s…" e "8 …" (PNG `B2-S1-setlists-avd.png`) | três cartões no alto e ~60 % da tela vazia embaixo; o **centro do cartão é o botão "Baixar esta setlist"** — o toque no centro de `setlist-00000001` (800,544 px) caiu em `baixar-00000001` [446,479][882,610] e baixou (na exploração manual dos ids, antes do roteiro; download local, do servidor de arquivos da fixture) |
| **S2 com edição** | **`setlist-apagar` cortado na borda**: 597,8–711,1 dp, 113,3 dos 166,7 da paisagem, o rótulo "Apagar setlist" cortado (a faixa de 788,5 dp não cabe em 711,1: faltam **77,4 dp**); **títulos das músicas a 58,7 dp** ("Man…", "Seg…") | a grade de 2 colunas fica com texto de 59 dp e ícones inteiros — o tipo e o botão remover ganham do título |
| **S2 sem edição (S2p)** | títulos das músicas a **122,7 dp** ("Manhã de e…") | idem |
| **Reordenar** | **título da barra a 67,6 dp** ("RE…", "REORDENAR · ENSAIO DE RETRATO" 494,2 → 67,6) e a instrução da barra idem | — |
| **Folha** | `[derivado]` **a caixa de 720 dp não cabe em 711,1**: `form-nome` está em x = 28,4 dp em retrato e 241,8 em paisagem, onde a caixa começa em 208,8 (= (1137,8 − 720)/2); logo, em retrato a caixa começa em 28,4 − 33,0 = **−4,6 dp**, cortada 4,6 dp de cada lado (borda e raio fora da tela). O (b) não vê: a caixa é recortada à largura da tela e "ocupa a largura inteira" | — |
| **Palco (S3)** | (b) = (c) = (d) = (e) = 0; **(a) = 4 novos**, todos da classe "zona de 15 % × conteúdo": `borda-avancar × corpo` (S3b, que na paisagem só tinha o par do lado esquerdo) e o texto do S3e sob as duas zonas; **barra superior**: o título "Manhã de ensaio · Banda da fixture · Letra" cai de 832,0 → 404,9 dp e elipsa (PNG `B2-S3-S3d-pdf-12p-avd.png`: "Partitura de doze páginas · …") | a zona de 15 % vira 106,7 dp e cobre o texto do corpo nas duas bordas; linhas de letra longas cortam à direita (o degradê do PRD-09 existe para isso) |
| **S5** | (a) = 1: "FIM DA SETLIST" (550,2 dp) passa sob a zona de voltar | — |
| **S0, diálogo, S4, picker** | **nenhum**: S0 quebra em coluna (`flexWrap`), o diálogo de 620 cabe, S4 e picker só têm (d′) de nó esticado, sem corte no PNG | — |

**H-N3-7 ("os elementos se encavalam"), medida**: fora das zonas do palco, **(a) = 0**
em todas as telas de lista do tablet em retrato. O que o retrato faz não é
encavalar: é **espremer** (título e nome até elidir ou quebrar), **cortar na borda**
(a faixa do S2, a folha) e, num caso, **fazer sumir** (o título do S1 com aviso).

### 4.2 Faixa < 600 — celular em retrato (411,4 dp)

Todas as superfícies menos S4 têm defeito objetivo. Os que tiram função:

- **S1**: `buscar` **some** (ou fica com 10 dp na borda); **11 textos somem** — o
  título "SETLISTS", os nomes das setlists (largura 0), a data, a contagem.
- **S2 com edição**: `setlist-editar` vira uma fatia de 21 dp na borda e
  **`setlist-apagar` some** → o **diálogo de apagar fica inalcançável**; **15 textos
  somem**, entre eles os títulos das músicas.
- **Folha**: **`form-cancelar` some**, e o `form-salvar` vira uma fatia de **4,6 dp**
  (c); só se fecha com BACK.
- **Reordenar**: **`reordenar-salvar` some** — não há como salvar a ordem.
- **Palco**: a barra de 7 controles precisa de 622 dp: **`busca` e `sair` somem**,
  `indice` fica na borda; 33 ocorrências de (b) nos 8 estados.
- **S0**: o formulário encosta nas duas bordas (a coluna de 420 em 411,4).

### 4.3 O celular deitado (914,3 × 371,4 dp — pela largura, faixa > 900)

A largura cabe, e a paisagem congelada quase passa: **o que quebra é a altura**.

- **S0: não dá para entrar.** `senha`, `erro` e `entrar` **somem** — o `flexWrap`
  empilha marca e formulário e **não há `ScrollView`** (`grep -c ScrollView` = 0 no
  dump). Um usuário com o celular deitado não faz login.
- **Folha**: `form-cancelar`, `form-salvar`, `form-data` e `form-tentar` **somem**
  (a caixa de 420 de altura em 411,4).
- O resto (S1, S2, reordenar, picker, palco, S4, S5, diálogo) passa: (a)–(e) = 0 fora
  do (d′) e das zonas do palco.

### 4.4 Veredito do palco pela N3-D2

**Pela letra, o palco entra no brief** nas duas faixas de tablet: (a) ≠ 0 em 3 dos 8
estados do S3 (as duas S3b e a S3e) e no S5. **Pelo que o (a) mede, não há defeito novo de classe**:
são as zonas invisíveis de 15 % sobre o conteúdo, que o congelado tem em 16 dos 18
estados de palco em paisagem. O que o retrato traz de verdade ao palco é a **barra
superior** elidindo o título (832 → 405 dp) — exatamente o que a proposta 08 da tela 1
já resolvia com "barra superior em 2 linhas". No celular, o palco entra de qualquer
jeito (N3-D7; e `busca`/`sair` somem). **Decisão do Marcel: Q5.**

---

## 5. O que o brief precisa

### 5.1 Superfícies × faixas

| superfície | 600–900 (711 × 1054) | < 600 (411 × 874) | celular deitado (914 × 371) |
|---|---|---|---|
| S0 | passa (já quebra) | **desenhar** (bordas) | **desenhar** — rolagem ou composição de altura baixa |
| S1 (+ S1e, S1f, aviso) | **desenhar** a barra de 120 (título + chip + 2 botões) e o cartão (nome, `Baixar` no centro) | **desenhar** | passa com (d′) |
| S2 sem edição (S2p) | **desenhar** a grade (título a 123 dp) | **desenhar** | passa com (d′) |
| S2 com edição (faixa de 64) | **desenhar** a faixa (faltam 77,4 dp) e a grade (título a 59 dp) | **desenhar** | passa |
| Reordenar | **desenhar** a barra (título a 68 dp) | **desenhar** (`salvar` some) | passa |
| Picker | passa (confirmar H-N3-4 em falha) | **desenhar** | passa |
| Folha | **desenhar** a largura (720 > 711) | **desenhar** | **desenhar** a altura (420 > 371) |
| Diálogo | passa | **desenhar** (hoje inalcançável) | passa |
| Palco S3 (S3a–e) | **Q5** — a barra superior | **desenhar** (N3-D7) | passa com (d′) |
| S4 | passa | passa com (d′) | passa |
| S5 | passa com N = 8; **H-N3-3** para N ≥ 24 | **desenhar** | passa |

### 5.2 Capturas a anexar ao brief

Todas de fixture do projeto, sem letra de terceiro, em `N3-PRECHECK-anexos/`:

- **600–900**: `B2/B2-*-avd.png` (canvas do pior caso) — em especial
  `B2-S1-setlists-avd`, `B2-S1-aviso-sem-rede-avd`, `B2-S1-S1e-falha-com-cache-avd`,
  `B2-S2-com-edicao-avd`, `B2-S2-sem-edicao-S2p-avd`, `B2-reordenar-aberto-avd`,
  `B2-folha-criar-avd`, `B2-S3-S3a-letra-1a-avd`, `B2-S3-S3d-pdf-12p-avd`,
  `B2-S3-S3e-nao-baixado-avd`, `B2-S5-fim-avd`; e as mesmas `-tab` para o Tab.
- **< 600**: `B4/B4-*-phone-ret.png` — as 26.
- **celular deitado**: `B4/B4-S0-login-phone-pai`, `B4-S0-erro-phone-pai`,
  `B4-folha-*-phone-pai`, `B4-S1-setlists-phone-pai`, `B4-S3-S3a-letra-1a-phone-pai`.
- **> 900 (o congelado, para o designer ver o de partida)**: `B5-baseline/B5-*-avd-pai.png`
  e `B3-referencia-paisagem/REF-*-avd-pai.png`.
- Os XML ao lado de cada PNG dão os bounds; `B3-tabela.md` dá o número.

### 5.3 O que o brief precisa decidir além da tela

- A regra de faixa com **altura** (div. 388): o celular deitado tem largura de tablet
  e altura de 371.
- A restrição N3-D5 (nada de Android na composição): os canvas acima são de Android;
  o iPad não foi medido (H-N3-6).

---

## 6. Hipóteses, com dono

| # | hipótese | estado | dono |
|---|---|---|---|
| **H-N3-1** | "o palco em retrato (tablet) passa sem desenho" | **contra a letra da N3-D2**: (a) ≠ 0 em 3 estados; a favor pela classe (só zonas de 15 %) e contra pela barra superior (título elidido) — §4.4 | **decidida: N3-D9** — o palco entra só pela barra superior na faixa média |
| **H-N3-2** | "o indicador ◔ do T1-R17 reflete um `lru over`?" (`W4-ENCERRAMENTO.md` §7.3) | **fechada, sem defeito**: depois do `lru over`, a setlist cujo arquivo foi despejado mostra **◔ "0 de 1"** e a acima do teto mostra ✓ **com os três arquivos no disco** — nenhum ✓ com arquivo fora (§6.1) | este pre-check |
| H-N3-3 | o S5 com N ≥ 24 transborda abaixo de ~883 dp (a fileira calcula contra 900 fixos) | `[derivado: faseA/A2.md §2.5]`, não medido (a fixture tem 8) | aceite da PR de implementação do N3 (Fixture de 60) |
| H-N3-4 | o picker em falha (682 dp) cabe em 711 e quebra no celular | `[derivado]`, não medido | aceite do N3 / N5 |
| H-N3-5 | a faixa > 900 não muda (N3-D3) | linha de base pronta: `B5-baseline/` + `W4B3-anexos/dumps-palco/` | PRs de implementação do N3 (gate) |
| H-N3-6 | o iPad herda a composição (N3-D5) | não medido: nenhum aparelho iOS; os canvas são de Android | bloco iOS (`N2-ENCERRAMENTO.md` §10.7.2) |
| H-N3-7 | "os elementos se encavalam" (§10.7.1 do N2) | **medida, falsa na forma**: (a) = 0 nas listas em retrato; o que há é espremer, cortar e sumir (§4.1) | — (fechada aqui) |
| H-N3-8 | o celular deitado pertence à faixa 600–900 | **caiu** (914,3 dp) — div. 388 | **decidida: N3-D8** — pela largura (914,3), o celular deitado fica na faixa 600–960; a condição de altura que o separa do tablet é regra do N5 |

### 6.1 B6, o veredito do ◔ `[medido: B6/B6-saida.txt, B6/B6-logcat.txt]`

AVD `octavia_tab32`, fixture `fixture.py --b6`: "B6 — acima do teto" (data de
**amanhã**, três PDFs de 83.885.944 B — os três viram protegidos) e "B6 — sem data"
(um PDF de 638 B, não protegido). Fase 1: só a sem data, "Baixar esta setlist" → ✓.
Fase 2: as duas.

```
  setlist-000000b7 → B6 — SEM DATA, sem data, 1 música, garantida offline, todos os arquivos neste aparelho
  … (fase 2)
  prefetch plan n=3 reason=7d
  file src=download name=grande-3.pdf bytes=83885944 total=83885944 ms=6152
  file src=download name=grande-1.pdf bytes=83885944 total=83885944 ms=6469
  file src=download name=grande-2.pdf bytes=83885944 total=83885944 ms=6791
  lru evict n=5 bytes=268476
  lru over bytes=251657832 cap=209715200 protected=3
  setlist-000000b6 → B6 — ACIMA DO TETO, 2026-09-25, 3 músicas, garantida offline, todos os arquivos neste aparelho
  setlist-000000b7 → B6 — SEM DATA, sem data, 1 música, parcial, 0 de 1 arquivos baixados
```

O LRU despejou os 5 não protegidos (a pequena e os PDFs da fixture principal),
não desceu do teto (251.657.832 > 209.715.200) e disse `lru over`. O indicador
acompanhou o disco: **◔ na setlist que perdeu o arquivo, ✓ na que tem os três**.
É o que o código promete (`App.tsx:71-74`: `aplicarLru` e **depois**
`setFilesPresent(presentUrls())`). **Sem divergência**; o `lru over` continua só no
log, como o Marcel decidiu (§7.3 do W4).

---

## 7. Herança que este bloco toca

| item | origem | o que o retrato muda |
|---|---|---|
| **chevrons das zonas de toque** | `DESIGN-V1` §8.1; `N2-ENCERRAMENTO.md` §10.5.1 | em retrato a zona tem 106,7 dp e fica sobre o texto do corpo e do S3e/S5 (§4.1): a invisibilidade das zonas pesa mais. O brief pode decidir junto |
| **os cinco desabilitados** | `DESIGN-V1` §8.2; §10.5.1 | nada muda pela largura; entra no brief só se o Marcel quiser (a faixa do S2 vai ser redesenhada de qualquer jeito) |
| **tema claro nas telas de lista** | §10.5.2 | nada muda pela largura; se o brief redesenha S1/S2 nas faixas novas, é a hora de dizer se o tema claro entra |
| `StageScreen.tsx:467` cita `App.tsx:206` (hoje 295) | div. 390 | — |
| a "barra superior em 2 linhas" da proposta 08 | `PRD-TELA-1.md:342` | é a resposta antiga ao único defeito do palco em retrato (Q5) |

---

## 8. Perguntas ao Marcel

**[Decidida: N3-D8]** **Q1 — As fronteiras 600/900, contra os aparelhos medidos.** As larguras são
**411,4** (celular em retrato), **711,1** (os dois tablets em retrato), **914,3**
(celular deitado) e **1137,8** (tablets deitados). A fronteira de 600 separa bem o
celular do tablet. **A de 900 cai entre 711 e 914 e põe o celular deitado junto do
tablet deitado**, com 371 dp de altura contra 627. **Recomendo**: manter 600, subir
a de cima para **~960** (entre 914,3 e 1137,8) e acrescentar à regra uma condição de
**altura**: janela útil abaixo de ~480 dp usa a composição compacta em altura (o que
o S0 e a folha precisam). Alternativa: faixa só por largura, e o celular deitado
entra no congelado com dois consertos pontuais (S0 com rolagem, folha com rolagem).

**[Decidida: N3-D8]** **Q2 — A faixa 600–900 é uma composição só, para tablet em retrato e celular
deitado?** Medido, eles não se parecem: 711 × 1054 contra 914 × 371. **Recomendo
que não**: a faixa média é desenhada para **711 × 1054** (o pior caso, AVD), e o
celular deitado vai para o N5, pela regra de altura da Q1.

**[Decidida: N3-D10]** **Q3 — A barra de 120 do S1 e a faixa de 64 do S2 em 711 dp.** Medido: na barra do
S1 o título "SETLISTS" quebra no meio da palavra e, com o chip de "sem conexão",
**some**; na faixa do S2 **faltam 77,4 dp** (788,5 contra 711,1) e o `Apagar` fica
cortado. **Recomendo**: S1 com o título numa linha própria acima de chip e botões
(a barra passa de 120 para uma altura a desenhar, e a lista perde isso); S2 mantendo
a faixa de 64 com **rótulos curtos** ("Adicionar", "Reordenar", "Editar", "Apagar")
— o brief confirma que os 77,4 dp saem daí; se não saírem, dois controles viram só
ícone, com rótulo na acessibilidade.

**[Decidida: N3-D10]** **Q4 — O celular usa o mesmo canvas de fonte?** Os tokens são em dp e valem igual;
o que quebra no celular é o **display** (o "FIM DA SETLIST" de 52 dp dobra de altura
em 411) e as barras com rótulo. **Recomendo**: mesma escala de texto de leitura (o
palco é o produto, e o corpo já rola) e um degrau de display menor só para a faixa
< 600, decidido no brief.

**[Decidida: N3-D9]** **Q5 — O palco em retrato vai ao brief?** Pela letra da N3-D2, **sim** ((a) ≠ 0
em 3 estados). Pelo que o (a) mede, o único defeito de classe nova é a **barra
superior** (título elidido, 832 → 405 dp). **Recomendo**: o palco vai ao brief na
faixa 600–900 **só pela barra superior** (a proposta 08, "2 linhas", como ponto de
partida), e as zonas de 15 % seguem como estão; nas três faixas, pelo N3-D7.

**[Decidida: N3-D10]** **Q6 — O (d′) e o (e) valem como o (d) da regra?** O (d) literal do prompt não mede
nada no RN (div. 384). **Recomendo**: o gate do N3 (N3-D3/D4) usar **(e)** como
critério duro (texto que some é defeito sem discussão) e o **(d′)** como triagem
confirmada no PNG, que é como este pre-check os usou.

**[Decidida: N3-D10]** **Q7 — O S0 do Tab S6.** Não capturado (div. 386). **Recomendo** aceitar o AVD como
cobertura da largura de 711,1 (a mesma) e deixar o Tab para o aceite da PR que mexer
no S0, quando o logout e o login forem passo combinado.

---

## 9. Divergências — 382 a 392

| div. | origem | o que | o que foi feito |
|---|---|---|---|
| **382** | P | *"`git rev-parse origin/main` — registre: é o sha do levantamento (W4 encerrado)"*: era **`796abe5`** (W4-b2); a #323 (W4-b3, o encerramento do W4) estava **aberta** (CLEAN, verde). O pre-check depende dela (§7.3 do W4, regra 13 ampliada, `W4B3-anexos/`, o `lru over`) | parei antes da árvore e perguntei; o Marcel mergeou na hora. Árvore sobre **`aa91b5d`** |
| **383** | A | o dev client do `octavia_tab32` estava de **2026-09-13** (`lastUpdateTime`), anterior à #315, embora o `W4B3-anexos/ESTADO-aparelhos.txt` diga que ele "fica" em 2026-09-23. Causa: o AVD sobe do snapshot `default_boot` de **2026-09-14**, e o que a W4-b3 instalou se perdeu quando ele desligou sem salvar | refeito (`expo run:android --device octavia_tab32 --no-bundler`, 2m12s, `install -r`, `firstInstallTime` 2026-09-10 preservado). Registrado no `APARATO.md`. **Consertado no aval (N3-D11)**: dev client atual instalado sobre o snapshot, `adb emu avd snapshot save default_boot`, e reboot com `lastUpdateTime` `2026-09-24 14:00:01` (`estado/avd-snapshot-conserto.txt`) |
| **384** | P | (d) *"nós com `text` terminando em `…`"*: o RN elipsa no desenho e o `uiautomator` devolve o texto inteiro — (d) = 0 em todos os 105 dumps, inclusive onde o PNG mostra "ENSAIO …" | (d) mantido, literal, e zero; o instrumento ganhou (d′) e (e) (§3.1), declarados; o uso deles é a Q6 |
| **385** | D | `N2-ENCERRAMENTO.md` §10.2 se chama *"N3 (content nos apps)"*; pela N3-D6, **content é o N4** e o N3 é faixas de largura. A §10.8 diz ainda que o próximo bloco decidido é o web | **errata feita no aval (N3-D11)**: nota no topo da §10.2 do `N2-ENCERRAMENTO.md` — content é N4; o título fica, para as citações continuarem achando a seção |
| **386** | P | *"S0 (vazio e com erro)"* no Tab com *"a conta que estiver (sem escrita)"*: o app **não tem botão de sair** — o logout só acontece num 401 de leitura (`api.ts:108`), e voltar exige a senha do Marcel | S0 capturado no AVD (modo `401` do mock; a sessão volta com o snapshot, div. 383) e no celular (antes do login e depois, pelo `401`). O erro: avião ligado, e-mail e senha **de fixture** (`fixture@exemplo.invalid`), nada sai do aparelho → `erro.sem_conexao`. No Tab, não (Q7) |
| **387** | T | **queda de arnês no celular deitado**: o lançador (travado em retrato) devolveu o `user_rotation` a 0 a cada força-parada do `ir_s1`, e **22 dos 24 dumps "phone-pai" saíram em retrato** (raiz 1080 × 2400). Junto, três quedas menores: o toque em `senha` com o teclado de pé caiu na barra do Gboard (tela de temas; nada digitado saiu do aparelho); o `B4-S0-login-phone-pai.png` saiu branco (dev client carregando); o S3d do AVD e o S3b do celular pegaram o banner "Refreshing…" do dev client | os 22 pares **apagados antes de qualquer uso**; o `roteiro.py` passou a reaplicar a rotação depois de cada recarga e antes de cada captura, e a **recusar** captura cuja raiz não está na orientação do sufixo (nome de anexo é afirmação, caso 23); refeitos. O S0 limpo, o S3d e o S3b recapturados. `roteiros/roteiro-phone-pai.txt` é o registro da rodada ruim |
| **388** | P | N3-D1: *"paisagem de celular cai na faixa 600–900"*: o `octavia_phone` deitado tem **914,3 dp** de largura (1080 × 2400 px, 420) — pela largura, cai na faixa **> 900**, com 371,4 dp de altura | medido e capturado como pedido; a consequência (S0 sem login, folha sem botões) está em §4.3; a regra é a Q1/Q2 |
| **389** | T | o dump do S3c do AVD em paisagem saiu com o **mesmo sha** do S3b-claro: com o auto-scroll animando, o `uiautomator dump` falha e o `pull` trouxe o arquivo anterior do `/sdcard` | o `cap.sh` passou a apagar o arquivo antes, tentar três vezes e acusar `DUMP FALHOU`; S3c refeito; varredura de sha repetido em todos os XML = **0** |
| **390** | D | `StageScreen.tsx:467` cita `App.tsx:206` para o `SafeAreaView`; ele está em `App.tsx:295` `[medido: faseA/A1.md §1.2]` | registrada; a próxima PR que tocar o `StageScreen.tsx` corrige |

| **391** | P | *"`gh pr checks` (APK skipped — só docs + `APARATO.md`)"*: na #324 o APK **não aparece nem como skipped** — o workflow `native` nem dispara, porque o `pull_request` dele tem filtro de `paths` (`apps/native/**`, `.github/workflows/native.yml`, `.github/workflows/gates.yml`, `pnpm-workspace.yaml`) e esta PR só toca `docs/`. `gh pr checks 324`: `Vercel` pass, `Vercel Preview Comments` pass, `build` pass 3m53s, `gates-nativos` pass 11s; `gh run list --branch n3/precheck` → só `gates` e `CI` | registrada; nada a fazer — é o filtro do W4-b2 funcionando antes do H1. O "skipped" do prompt é o caso de PR que toca `apps/native/` sem mudar nativo |
| **392** | P | o aval tem **cinco** itens de decisão e pede *"as decisões acima como **N3-D8…D11**"* — **quatro** números | D8 = item 1, D9 = item 2, D10 = item 3, e a **N3-D11 junta os itens 4 e 5** (as duas divergências com destino, 385 e 383). Nenhum texto de decisão foi reescrito |

---

## Anexos

[`N3-PRECHECK-anexos/README.md`](N3-PRECHECK-anexos/README.md) — o índice, o
aparato, o estado dos aparelhos (lido, declarado, restaurado) e o bloco ```` ```gates ````.

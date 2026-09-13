# V1-PR3-PRECHECK.md — pre-check da V1-PR3 (fundação SVG + a barra do palco)

> **RASCUNHO NÃO COMMITADO.** Vive no worktree `/Users/marcelviana/projects/octavia-v1pr3`
> (`--detach` em `6697285`), sem branch, sem commit, sem push. Data: **2026-09-13**.
>
> **Aparato**: AVD `octavia_tab32` (`emulator-5554`), conta de audit. O Tab S6
> `RX2N8000F3D` recebeu **seis comandos, todos de leitura** — a lista está em §6 e
> no anexo C. Scratch de build em `/tmp/v1pr3-scratch`, clone APFS do repositório
> **sem `.git`**. O checkout principal ficou `git status` limpo do início ao fim.
>
> **Contabilidade de prod: 2 requests na rodada 1, e o alvo era 0.** Está em §9,
> com a causa. **A rodada 2 (o baseline do A17, §3.3) gastou 0**, com a rede
> cortada e provada por `ping` antes de o app abrir. **Teto restante do bloco: 2.**
>
> Anexos em [`V1-PR3-PRECHECK-anexos/`](V1-PR3-PRECHECK-anexos/), cada um abrindo
> com o comando que o gerou.
>
> **Se você vai escrever o prompt da V1-PR3, comece pelo §15** — as três regras de
> aparato e de medição que esta sessão descobriu, e a lista do que segue aberto.
> **Se você vai escrever o encerramento do V1, a §9.1 é sua** e migra para o
> `LOGS-OCTAVIA.md`.

---

## 0. O que fechou

| Hipótese | Estado | Numa linha |
|---|---|---|
| **H1** prebuild e autolinking | **FECHADA** | 6 → 7 módulos; o prebuild **não reescreve nada** em `android/`; 2,2 s |
| **H2** o Δ do APK | **FECHADA** | **+16.023.885 B (+7,44 %)**; 1 `.so` nova por ABI, 2,8–4,4 MB por ABI com o `libappmodules` |
| **H3** a reinstalação | **FECHADA no AVD**, **aberta no Tab S6** | `install -r` preserva store e sessão, provado; o Tab S6 só foi lido |
| **H4** os ícones em componentes | **FECHADA** | 33 desenhos (não 32); 8 com `fill="currentColor"`; 2 com cor de token cravada; 19 arcos, 0 inválidos |
| **H5** `lucide-react-native` | **FECHADA — não usar** | **0 de 15** ícones "lucide" do design batem com o lucide 1.45.0 |
| **A17** baseline `[AVD]` | **MEDIDO nesta sessão** (§3.3) | **p95 = 50 ms** em 59 navegações na setlist de 60, na main de hoje |

---

## 1. H1 — o prebuild é reprodutível e o autolinking vai a 7

Anexo [`V1-PR3-A-prebuild-autolinking.txt`](V1-PR3-PRECHECK-anexos/V1-PR3-A-prebuild-autolinking.txt).

**Método declarado**: clone APFS (`cp -Rc`) do repositório inteiro para
`/tmp/v1pr3-scratch/spike` — 41 s, e o `df` de `/tmp` não se moveu, porque
clonefile não copia bytes. **`rm -rf .git` no clone**, para que nenhum comando
`git` do scratch pudesse alcançar o repositório real. `react-native-svg` entrou
**pinado em `15.15.4`**, a versão do `bundledNativeModules.json` do `expo@57.0.20`.

**O autolinking passa de 6 para 7** `[medido]`. O instrumento é o comando que o
próprio `settings.gradle` usa (`expoAutolinking.rnConfigCommand`):

```
$ npx --no-install expo-modules-autolinking react-native-config --json --platform android
  ANTES  (checkout principal)  6 módulos
  DEPOIS (scratch com svg)     7 módulos   ← + react-native-svg
```

O `autolinking.json` em disco no scratch, antes de tudo, tinha os mesmos 6
(sha256 `4602d6f5…`).

**`expo-modules-autolinking search -p android` NÃO muda**: 18 → 18, nenhum novo,
nenhum sumido `[medido]`. `react-native-svg` não é módulo Expo; entra pelo
autolinking do community CLI. Isso importa para o V1-A10: o aceite tem de olhar
o `autolinking.json`, não o `search`.

**O prebuild não reescreve nada.** Snapshot de nome + sha256 dos 42 arquivos de
`android/` fora de `build/`, `.gradle/` e `.cxx/`; prebuild; snapshot de novo:

```
arquivos antes=42  depois=42
só no ANTES: (nenhum)   só no DEPOIS: (nenhum)   conteúdo diferente: (nenhum)
```

Acrescentar `react-native-svg` **não muda uma linha do projeto Android gerado** —
o Gradle o resolve em tempo de configuração a partir do `node_modules`. O que o
repositório vê é `package.json` + `pnpm-lock.yaml`, e nada mais
(`apps/native/android/` é ignorado, `.gitignore:30`).

**Tempos**: prebuild **2,2 s**; `assembleDebug` limpo com svg **275 s**
(`BUILD SUCCESSFUL in 4m 35s`, 621 tasks). O build do ANTES rodou em 142 s por
reaproveitar o cache do primeiro — não é medida de build limpo, e está declarado.
O número comparável de build limpo continua sendo o do CI: **534 s**.

**Desvio declarado**: os dois builds usaram **JDK 21.0.1** (o padrão da máquina),
não o corretto-17 do `scripts/native-env.sh` nem o temurin-17 do CI. Não moveu a
medição — ver §2.

**Aviso para quem for remover o spike**: tirar a dependência e rodar `assembleDebug`
sem apagar `android/app/.cxx` falha com
`ninja: error: unknown target 'react_codegen_rnsvg'`. O CMake guarda a lista de
alvos do codegen.

---

## 2. H2 — o Δ do APK

Anexo [`V1-PR3-B-apk-delta.txt`](V1-PR3-PRECHECK-anexos/V1-PR3-B-apk-delta.txt).

Construí **os dois lados na mesma máquina**, com o comando do CI
(`./gradlew assembleDebug`, 4 ABIs, debug), para separar o custo do svg do custo
de trocar de máquina. A calibração saiu melhor do que eu esperava:

| | bytes | sha256 | entradas |
|---|---|---|---|
| CI, run `34610061441` (o "antes" do V1-PRECHECK) | 215.354.003 | `e90eb64a…` | 1357 |
| **ANTES local** (sem svg) | **215.354.007** | `3525282a…` | 1357 |
| **DEPOIS local** (com svg) | **231.377.892** | `c0a3d790…` | 1361 |

O ANTES local caiu a **4 bytes** do artefato do CI. A comparação é boa.

> **Δ do `react-native-svg`: +16.023.885 B — +7,44 %.**

**O controle negativo do V1-A10 virou positivo** `[medido]`:
`unzip -l | grep -ci svg` → **0** antes, **4** depois. As 4 entradas novas são
exatamente as `.so` do codegen, uma por ABI, e **nenhuma entrada sumiu**.

| ABI | antes | depois | Δ | `libreact_codegen_rnsvg.so` |
|---|---|---|---|---|
| arm64-v8a | 51.960.984 | 56.245.088 | +4.284.104 | 2.321.576 |
| armeabi-v7a | 32.381.868 | 35.175.260 | +2.793.392 | 1.466.016 |
| x86 | 53.009.448 | 57.399.276 | +4.389.828 | 2.481.492 |
| x86_64 | 52.609.928 | 56.998.600 | +4.388.672 | 2.447.776 |

**O Δ por ABI não é só a lib nova**: `libappmodules.so` cresce **+1,3 a +2,0 MB**
em cada ABI, porque é onde o registro de TurboModules/Fabric é ligado. Somando,
`lib/` +15.855.996 B e `classes*.dex` +367.916 B; `assets/`, `res/` e o resto,
**zero** — os 13 ttf e os 793.720 B de `assets/fonts` seguem intactos.

Contra a hipótese do V1-PRECHECK §6.6 ("+1,5 a 3 MB por ABI"): **confirmada, com
o teto estourado** — 2,8 a 4,4 MB por ABI.

**O que este número não é**: é `assembleDebug`, sem R8, sem minify, com o
`expo-dev-menu` dentro — o que o CI produz e o que se instala no aparelho. Um
release custaria menos. O Octavia não tem pipeline de release, então este é o
número que vale para o Tab S6.

---

## 3. H3 — a reinstalação preserva sessão e cache

Anexo [`V1-PR3-C-tabs6-e-install-r.txt`](V1-PR3-PRECHECK-anexos/V1-PR3-C-tabs6-e-install-r.txt).

### 3.1 O Tab S6, só leitura

```
primaryCpuAbi=arm64-v8a     versionCode=1  minSdk=24  targetSdk=36  versionName=0.0.1
firstInstallTime=2026-09-07 18:08:54        lastUpdateTime=2026-09-10 21:03:24
wm size    → Physical size: 1600x2560       wm density → Physical density: 360
```

1600×2560 @ 360 = **711,1 × 1137,8 dp**. A hipótese do prompt (2560×1600 / 360)
**confirma**, com a ressalva de que o `wm size` reporta em retrato.

O diretório de dados hoje:

```
files/ : DevLauncherApp-…DevBundle.js · octavia-xVDJRBh1WpPOatbfWahOLttYn1E3 · profileInstalled · rList
files/octavia-xVDJRBh1…/ : content.json 111.567 B · setlists.json 2.752 B · files-index.json 200 B
files/octavia-xVDJRBh1…/files/ : 1751910900697-Easy_-_Guitar.pdf  138.916 B
cache/ : WebView · http-cache · image_cache · octavia-xVDJRBh1…  (o subdiretório files/ está vazio)
```

O uid é **`xVDJRBh1WpPOatbfWahOLttYn1E3` — a conta PRINCIPAL**, não a de audit.
É essa sessão e esse cache que a V1-PR3 põe em risco, e é por isso que o R15 existe.

**O dev client do Tab S6 é o mesmo binário do AVD** `[medido]`:

```
Tab S6   cb1b5fea0240e185ee8ff7e81d2eb790a13a21e12ffb5613c94e86e9e7963c8f   76.836.083 B
AVD      cb1b5fea0240e185ee8ff7e81d2eb790a13a21e12ffb5613c94e86e9e7963c8f   76.836.083 B
```

Não é "mesma versão": é o **mesmo arquivo, byte a byte**. Um rebuild serve aos
dois, e o que se provar no AVD sobre a mecânica da instalação vale para o tablet.

### 3.2 `adb install -r` preserva o diretório de dados — medido no AVD

Puxei o `base.apk` do próprio emulador e o reinstalei sobre ele mesmo com `-r`
(nenhum binário novo entrou). Resultado:

| | antes | depois |
|---|---|---|
| `firstInstallTime` | 2026-09-10 11:42:54 | **2026-09-10 11:42:54 — idêntico** |
| `lastUpdateTime` | 2026-09-10 13:12:15 | 2026-09-13 09:23:09 (a reinstalação) |
| `content.json` | `d27e6d84…` | **idêntico** |
| `setlists.json` | `0a3a0638…` | **idêntico** |
| `files-index.json` | `95098595…` | **idêntico** |
| `…-partitura-12p.pdf` | `ad2eae09…` | **idêntico** |
| `databases/RKStorage` | presente | presente |

E o primeiro logcat depois da reinstalação:

```
OCTAVIA: auth uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 src=restored
OCTAVIA: cache hit kind=setlists n=3
OCTAVIA: cache hit kind=content n=67
```

`firstInstallTime` preservado é o marcador forte — uma instalação limpa o
reescreve. `install -r` reinstala mantendo o `userId` do app e, com ele,
`/data/data/<pkg>` inteiro; o que apaga é `uninstall` sem `-k` ou `pm clear`.
**Nenhum dos dois foi usado em lugar nenhum.**

**Nota sobre o estado final do AVD**: a medição acima vale — os quatro sha256
foram lidos antes e depois do `install -r`, **dentro do mesmo boot**. O que não
sobreviveu foi a reinstalação em si: o emulador subiu com `-no-snapshot-save` e o
`emu kill` a descartou (§10, div. 42). Isso não afeta a prova; afeta a tabela de
"estado depois", que §10 corrige.

**Limite declarado**: reinstalei o **mesmo** apk, que é o que o prompt pediu. A
V1-PR3 vai instalar um apk **diferente**, com o mesmo `versionCode` e a mesma
assinatura de debug (o `debug.keystore` do Expo, que o prebuild **não** regenera
— conferido byte-idêntico). O caminho é o mesmo; o conteúdo é que muda. **A
instalação do apk novo continua sendo o primeiro item do aceite da V1-PR3 no
Tab S6**, e se cair, o login é do Marcel.

---

### 3.3 O baseline do A17, medido no AVD — decisão do Marcel, 2026-09-13

O "antes" do A17 no Tab S6 **não existe e não vai existir**: só se mediria antes
da reinstalação, e a decisão foi não pedir isso ao Marcel. O baseline passa a ser
do AVD, declarado como tal.

**Instrumento**: o do N1 (`N1-anexos/PR4-a17-tempos.txt`), sem mudança — abrir a
setlist de 60 (`UX-AUDIT ESTRESSE`, `4340bf95`) na música 1 e tocar o centro da
`borda-avancar` 59 vezes, lendo `nav n=X/60 setlist=… t=<ms>` do logcat.
Toque em `(2368, 723)`, centro de `[2176,198][2560,1249]` — a borda com a
geometria da V1-PR1.

```
$ sed -E "s/.* t=([0-9]+)$/\1/" navs.txt | sort -n
22 22 23 23 23 23 23 23 24 24 24 24 24 24 24 25 25 25 26 26 26 26 26 26 26 26 27 27
27 27 28 28 28 28 28 28 28 28 29 29 29 29 30 31 31 31 32 32 32 33 33 35 37 43 49 50
56 197 624

awk: n=59  min=22  p50=27  p90=37  p95=50  max=624  media=41,6   (aceite: p95 < 100 ms)
acima de 100 ms: 2 amostras
  nav n=2/60  t=624   ← a PRIMEIRA renderização do PDF de 1 página (é a metade
                        "PDF cacheado < 1 s" do A17: passa, com 376 ms de folga)
  nav n=44/60 t=197   ← item de texto, sem causa visível no logcat. Fica registrado
```

> **Baseline `[AVD]`, main `6697285`, 2026-09-13: p95 = 50 ms, p50 = 27, máx 624.**

**Três ressalvas, e a terceira importa mais que as duas primeiras.**

1. **Não é o número do N1.** O N1 mediu **p95 = 97 ms** no AVD e **68 ms** no
   Tab S6. Hoje o mesmo AVD dá 50. Metade do caminho é a V1-PR1 (a geometria por
   `onLayout`), metade é a máquina em outro estado — e **não sei separar as
   duas**, porque não tenho o binário do N1 para rodar lado a lado.
2. **Latência de frame não se mede no emulador** (div. 37 do N1) — continua
   valendo. Este número serve para **comparar o antes e o depois na mesma
   máquina, na mesma sessão**, e para nada além disso.
3. **Logo, o "depois" da V1-PR3 tem de ser medido na mesma sessão que refizer o
   "antes"**, com o mesmo AVD e a mesma cadência. Comparar o p95 da V1-PR3 contra
   os 50 ms desta sessão, dias depois, compara duas máquinas. O Tab S6 vira
   `[hipótese]` a fechar no aceite da V1-PR7, **com a ressalva registrada de que
   o "antes" real do tablet se perdeu na reinstalação**.

A rodada gastou **0 requests**: `net offline` e `sync skip reason=offline` no
logcat, com a rede cortada e provada por `ping` **antes** de o app abrir.

---

## 4. H4 — como os 32 viram componentes

Anexo [`V1-PR3-D-icones-34.txt`](V1-PR3-PRECHECK-anexos/V1-PR3-D-icones-34.txt),
com o markup dos 34 e a varredura completa.

### 4.1 A conta

| | |
|---|---|
| linhas na tabela §6.4 | **34** |
| catálogo escuro renderizado | **34** |
| catálogo claro renderizado | **33** |
| desenhos **distintos** | **33** |
| declarado no documento | "32 ícones" |

`voltar` e `voltar (avulsa)` são o **mesmo markup** (`M10 6l-6 6 6 6M4 12h15`):
uma linha a mais na tabela, não um desenho a mais. **São 33 componentes, mais o
`log-in` do S0 — 34 desenhos a escrever.**

### 4.2 `fill="currentColor"` — a pergunta do R14

**8 dos 34 ícones** têm `fill="currentColor"`, em 12 elementos: `índice` (3
pontos), `tab` (3 trastes), `partitura` (notehead), `sem-conexão` (ponto),
`falha` (ponto), `buscar-música` (notehead), `n-de-músicas` (notehead),
`tipo-desconhecido` (ponto).

E **32 dos 34 também têm `stroke="currentColor"` na raiz** — o que torna o R14
maior do que o V1-PRECHECK registrou. Li o mecanismo no fonte instalado
(`react-native-svg@15.15.4/src/lib/extract/extractBrush.ts` e `extractProps.ts`):
`currentColor` vira um *brush* de tipo 2, resolvido no nativo contra a prop
**`color`**, que só é propagada se `props.color` existir. Logo:

- passar **`color`** no `<Svg>` resolve **traço e preenchimento de uma vez** — é a
  correção, e é uma prop só;
- passar só `stroke` conserta o traço e deixa **os 12 preenchimentos em preto** —
  que é o defeito que o V1-PRECHECK nomeou;
- não passar nem um nem outro deixa **o ícone inteiro em preto**.

### 4.3 O que é igual em todos, e o que varia

**Igual na raiz dos 34**: `viewBox="0 0 24 24"`, `fill="none"`,
`stroke-linecap="round"`, `stroke-linejoin="round"`.
**Varia**: `width`/`height` (20 · 24 · 28) e `stroke-width` (1,5 · 1,75 · 2,0) —
e variam **juntos**, no pareamento exato do §5.5. O traço é função do tamanho,
não um parâmetro independente.

**Elementos**: 55 `<path>`, 18 `<circle>`, 4 `<rect>` (os 3 trastes da tab e o
corpo do calendar, todos com `rx`).
**`stroke-dasharray`**: 4 ícones. **`fill-opacity`**: 1 (parcial, 0,35).
**`stroke-width` por elemento**: 0 no catálogo, 2 na seção dos estados (o
afinamento para 1,25 do zoom inerte do §6.2).

Tudo isso existe em `react-native-svg` 15.15.4 como prop camelCase
(`strokeDasharray`, `fillOpacity`, `strokeWidth`, `rx`) — conferido nos tipos.

### 4.4 Os dois que não têm `currentColor`

`parcial` e `baixando` carregam **hexadecimais cravados, um par por tema**:

| | escuro | claro | é o token |
|---|---|---|---|
| trilha | `#6E6A80` | `#8E8779` | `lineInfo` |
| arco de `parcial` | `#C9923B` | `#7A5410` | `offlineInk` |
| seta de `baixando` | `#777CE8` | `#4A4FC0` | `accentInk` |

São os tokens novos do §3.2, escritos como cor. **Não podem ir crus para o
componente** — o `theme.ts` é a fonte depois da V1-PR3 (§2 do DESIGN-V1), e um
hex cravado num `.tsx` é o mesmo drift que o B2 matou no banco.

### 4.5 Arcos

19 arcos `A`/`a` nos 34, **nenhum inválido** por `2r ≥ corda`. Os dois casos que
o §6.1 nomeia batem ao milésimo: `arquivo não baixado` corda **7,976** contra
2r **8,000**, e `map-pin` na igualdade exata (**14,000 = 14,000**).
A **contagem** diverge: o README diz 15, eu conto 19; a diferença são os 4 arcos
de canto de raio 1,5 das bandejas de `baixar-setlist` e `baixando-ação`
(19 − 4 = 15), que a varredura do design não contou como arco. Nenhum apertado.

### 4.6 A forma que eu recomendo

**Um mapa de dados + um componente**, não um arquivo por ícone:

```
apps/native/src/icones/dados.ts    // nome -> [{ tipo, atributos }], + os tokens por elemento
apps/native/src/icones/Icone.tsx   // <Icone nome tamanho cor estado />
```

```tsx
<Icone nome="auto-scroll" tamanho={28} cor={cor.text} estado="ativo" />
```

Por quê:

1. **O envelope é comum aos 34.** `viewBox`, `fill="none"`, os dois `linecap`/
   `linejoin` — 33 arquivos repetiriam isso 33 vezes, e a regra da família
   deixaria de estar num lugar só.
2. **`traço` não é parâmetro.** 20→1,5 · 24→1,75 · 28→2,0 é derivação, e um mapa
   a escreve uma vez. Um arquivo por ícone convida alguém a passar o traço à mão.
3. **`cor` vira `color` no `<Svg>`** — o R14 morre por construção, e a revisão
   olha um componente, não 33.
4. **`nome=` é a posição isenta do G4.** Com um mapa, "todo nome tem desenho"
   vira teste unitário de uma linha (`Object.keys(dados)` × a lista dos 34).
5. **As exceções são variantes do mesmo nome**: a tab com 4 cordas em 20 e 6 em
   28 (§6.3) é uma chave (`tab@20` / `tab@28`), não dois ícones com nomes
   confusos. O afinamento de 1,25 é uma bandeira `estado: 'inerte'` num elemento.
6. **Os dois de duas cores** ganham, no mapa, um campo de **nome de token**
   (`'lineInfo'`, `'offlineInk'`, `'accentInk'`) que o componente resolve contra
   o tema corrente. Nenhum hex sai do `theme.ts`.
7. **CLAUDE.md, <150 linhas**: `dados.ts` fica em ~130 e `Icone.tsx` em ~50. Os
   dois passam, e a lógica está extraída.

**Considerado e rejeitado**: `react-native-svg-transformer` (importar `.svg`
direto). Custa um dev-dependency e um transformer no Metro, cria uma segunda
fonte de verdade ao lado do design congelado, e não sabe expressar cor por token.

---

## 5. H5 — `lucide-react-native` não se paga

Anexo [`V1-PR3-E-lucide.txt`](V1-PR3-PRECHECK-anexos/V1-PR3-E-lucide.txt).

**A conta de origem**: 18 "próprio" e 16 "lucide" nas 34 linhas — 15 desenhos
lucide distintos. A maioria é própria, mas não é esse o argumento.

**O argumento é este** `[medido]`: comparei o markup dos 15 declarados "lucide"
contra `lucide-static@1.45.0` (o mesmo pacote que o `lucide-react-native@1.45.0`
publica), normalizando `d`/`circle`/`rect`:

> **idênticos ao lucide oficial 1.45.0: 0 de 15.**

`search` tem `r=8` em (11,11) no lucide e `r=6,5` em (10,5·10,5) no design;
`sun` tem raios em `M12 2v2` contra `M12 3.15v2.3`; `map-pin` é uma gota de
curvas `c` contra um arco `a7 7 0 1 0-14 0`. O design **redesenhou tudo** para a
caixa óptica de 20 em 24 (§6.1). **Instalar o lucide renderiza outro desenho —
não o que a V1-PR2 congelou.**

**O bundle, medido** (`expo export --platform android`, tamanho do `.hbc`):

| | bytes | Δ sobre a base |
|---|---|---|
| base (App.tsx intocado) | 2.509.619 | — |
| + `react-native-svg`, **um componente local** (o `sun` do design à mão) | 2.691.739 | +182.120 |
| + `lucide-react-native`, `import Sun from '…/icons/sun'` | 2.703.871 | +194.252 |
| + `lucide-react-native`, `import { Sun } from 'lucide-react-native'` | **4.643.146** | **+2.133.527** |

O `react-native-svg` custa **+182 KB** e é inevitável nas duas rotas (a D-V1-1 já
o comprou). O lucide por cima custa **+12 KB** pelo subcaminho e **+1,95 MB**
pelo barril — o Metro **não faz tree-shaking** por padrão, e o barril tem 1.845
linhas exportando 1.835 ícones.

> **Recomendo NÃO adicionar `lucide-react-native`.** Não por tamanho: porque não
> entrega o desenho aprovado. Os 33 desenhos já estão escritos, revisados e
> medidos no `icones.html`; gerar componentes locais a partir deles custa zero
> dependência e entrega exatamente o congelado.

*(De passagem: o §6.4 chama de `alert-triangle` e `x-circle` o que o lucide
1.45.0 publica como `triangle-alert` e `circle-x`. São aliases, mas os nomes do
documento não são os canônicos da versão.)*

---

## 6. Os comandos que o Tab S6 recebeu

**Seis, todos de leitura, todos com `-s RX2N8000F3D`.** Nenhum `install`,
`uninstall`, `pm clear`, `push`, `rm` ou toque.

1. `adb -s RX2N8000F3D shell dumpsys package rocks.octavia.app | grep -E 'versionName|versionCode|firstInstallTime|lastUpdateTime|primaryCpuAbi'`
2. `adb -s RX2N8000F3D shell wm size`
3. `adb -s RX2N8000F3D shell wm density`
4. `adb -s RX2N8000F3D shell run-as rocks.octavia.app ls -l files/` — e, na mesma
   autorização ("o `ls` do diretório de cache"), `ls -l cache/` e o `ls -lR` dos
   dois subdiretórios `octavia-<uid>`
5. `adb -s RX2N8000F3D shell pm path rocks.octavia.app`
6. `adb -s RX2N8000F3D shell sha256sum '<base.apk>'` — e um `ls -l` do mesmo caminho

Os itens 5 e 6 são a metade "compare sha256 do `base.apk` se conseguir lê-lo" do
H3. **Consegui**, e por isso não precisei do plano B (`versionCode` +
`lastUpdateTime`). Nenhum comando falhou por permissão.

Todo o resto da sessão usou `-s emulator-5554`.

---

## 7. Plano de commits

### 7.1 A ordem, e o que cada um prova

*(o commit **0** está no fim da tabela por ser o único docs-only; na branch ele vem primeiro)*

| # | Commit | O que prova, e como |
|---|---|---|
| **1** | `build(V1-PR3): react-native-svg 15.15.4` — só `package.json` + `pnpm-lock.yaml` | **V1-A10 e V1-A11 fecham aqui.** Mensagem carrega: autolinking 6→7, `grep -ci svg` 0→4, Δ **+16.023.885 B**, as 4 `.so` por ABI. O CI (`native.yml`) roda porque `apps/native/**` mudou, e o artefato é a prova. **Nenhum código de app.** |
| **2** | `feat(V1-PR3): os quatro tokens de cor e os dois degraus` — só `theme.ts` | G1 verde (theme.ts não está no NUCLEO), suíte verde, e o script de contraste do V1-A4 sobre os pares novos: os quatro passam nos dois temas (§8.1). Fecha o V1-A7 na parte de token. |
| **3** | `feat(V1-PR3): o componente de ícone e os 34 desenhos` — `src/icones/` | Teste unitário: os 34 nomes do mapa × a lista do §6.4; todo `d` casa com o `icones-34.txt` deste anexo. **A prova do R14 é de tela, não de teste**: captura do AVD com `índice` e `tab` (os de mais preenchimento) nos dois temas, e o controle negativo é o mesmo componente sem a prop `color` — os pontos e trastes em preto. **Tamanho medido: ~126 linhas de dado** (§7.2) |
| **4** | `feat(V1-PR3): a barra do palco, só ícone` — `StageScreen.tsx` | **V1-A8 inteiro** (§8.3): 7 controles, mesma ordem, ≥64 dp, `x1` idênticos nas três variantes, `content-desc` não vazio nos sete. G2 (nenhum testID some), G3 (as 17 linhas `log(` do StageScreen idênticas), G5 (0 abaixo de 48). |
| **5** | `test(V1-PR3): a varredura A20 estendida entra no repositório` — `apps/native/scripts/` | G4 vira comando: `pnpm --filter native gate:a20` → 0 acusações; `gate:a20:cn` → 2 acusações, exit 1. **Leva junto a correção da divergência 30** no `g2g3.sh` (§8.2). |
| **0** | `docs(V1-PR3): pre-check, e as erratas E2/E3/E4 do DESIGN-V1` — este documento, os oito anexos e `DESIGN-V1/README.md` §9 | **abre a PR**, antes do commit 1. As três erratas **já estão escritas** e são o que autoriza os commits 3 e 4 a divergirem do corpo do documento congelado (a §2 do DESIGN-V1 só permite edição nesse formato). |

**Sobre o spike (item 1 do prompt): recomendo que ele NÃO exista como commit.**
Tudo que um spike descartável mediria está medido aqui, contra o repositório de
hoje, e um commit que entra e sai deixa duas entradas que se cancelam mais um
`pnpm-lock.yaml` batendo duas vezes. O commit 1 já é o spike: a dependência
sozinha, sem uma linha de app, com o CI construindo o APK. Se o Marcel preferir
o spike, ele é o commit 1 com **um** componente (o `índice`) e um `<Svg>` na
barra, revertido no commit 4 — e aí vale registrar o `.cxx` do §1.

### 7.2 O commit 3 cabe inteiro — medido, e o plano B se não couber **[Q8]**

Contei os elementos dos 34 no anexo D: **77 primitivas** (55 `<path>`, 18
`<circle>`, 4 `<rect>`) em **33 desenhos distintos**, mais o `log-in`. Uma linha
de dado por primitiva, uma por nome, mais o tipo e o envelope:

| grupo (o tamanho declarado na §6.4) | ícones | primitivas | ~linhas de dado |
|---|---|---|---|
| **28 dp** — os 9 do palco, os 4 de garantia, os 3 placeholders | **16** | 35 | **~51** |
| **24 dp** — ação em lista e barra superior | **9** | 18 | **~27** |
| **20 dp** — tipo, metadado, chip de rede | **9** | 24 | **~33** |
| **total** | **34** | **77** | **~111 + ~15 de tipo/envelope = ~126** |

**~126 linhas em `dados.ts` e ~50 em `Icone.tsx`** — os dois abaixo do teto de 150
do `CLAUDE.md`, e o commit inteiro em torno de 180 linhas de diff, que é uma
tabela de dados, não lógica. **Cabe.**

**Plano B, se na revisão não couber** — a partição do Marcel, por **tamanho**,
nunca por tela: `3a` os **16 de 28 dp** (~51 linhas), que são os que o commit 4
consome; `3b` os **18 de 20 e 24** (~60 linhas). Partir por tela espalharia o
mesmo `Icone.tsx` por três commits e faria as PRs 4–6 voltarem ao mesmo diretório
por motivo de transcrição.

### 7.3 Os outros ícones nas telas (item 6): **é outra PR, e já está no recorte**

O V1-PRECHECK §7.1 já reparte S1 na **V1-PR4**, S2 na **V1-PR5** e S0/S4/S5 na
**V1-PR6**. Recomendo **manter**, por dois motivos medidos: a V1-PR3 já toca
`theme.ts`, cria um diretório novo e reescreve a barra do S3 — e cada tela
seguinte traz aceites próprios do PRD (A10 e A19 no S1, A6/A8/A12 no S2, A11 no
S4). Juntar tudo faria uma PR cuja falha não se localiza.

---

## 8. Os gates

### 8.1 G1 — continua sendo "diff vazio", e a baseline está medida

`[medido]` `git ls-tree -r --name-only HEAD -- packages/core/src | wc -l` → **25**.
O `NUCLEO` do `g1.sh` são os 9: `api · store · sync · net · files · prefetch ·
session · firebase · log`. **`theme.ts` está no mesmo diretório e NÃO está na
lista** — então os quatro tokens e os dois degraus entram sem tocar o gate.

**Confirmo: o G1 continua como está.** As telas mudam muito, e é por isso que ele
serve: ele não promete que as telas não mudaram, promete que o **comportamento
não-visual** não mudou. Baseline hoje: `g1.sh origin/main WORKTREE` → **DIFF
VAZIO ✓**. Controle negativo inalterado: `138bf1a × 6a9315d` → 954 inserções.

### 8.2 G3 — nenhum `log(` depende do rótulo, e a divergência 30 tem conserto medido

`[medido]` 50 linhas `log(` no total; **23 nas telas, e nenhuma interpola um
rótulo de controle**. A que mais chega perto é `log(\`theme=${novo}\`)`
(`StageScreen:409`), e o `novo` é `'dark'`/`'light'`, não `'Claro'`/`'Escuro'`.
A lista completa está no anexo F2. **O só-ícone não ameaça o G3.**

**Divergência 30, medida e com controle negativo** (anexo F3): o ramo de ref-git
do `g2g3.sh` varre todos os arquivos sob `apps/native/src`, o ramo WORKTREE só
`*.ts`/`*.tsx`. O único não-ts é `src/fixtures/aceite.py`, hoje com 0 `log(`.
Montei um repositório descartável em `/tmp` com o `.py` contendo `catalog(1)`
(que casa a subcadeia `log(`) e o `.ts` **idêntico dos dois lados**:

```
HOJE (assimétrico)                     CORRIGIDO (mesmo recorte)
G3 — antes=2  depois=1                 G3 — antes=1  depois=1
  G3: DIVERGEM ✗   exit=1                G3: idênticas ✓   exit=0
  < …/fixtures/aceite.py  catalog(1)
```

**Falso positivo**: nada mudou em `.ts`/`.tsx`. A correção é uma linha —
`grep -E '\.tsx?$'` na lista do ramo de ref-git — e vale igual para o G2.

### 8.3 G4 — o que falta para versionar a estendida

Recuperei o `a20-estendido.mjs` do `V1-PRECHECK-anexos/V1-A3-instrumento-a20.txt`
(§A3.3, 77 linhas) e rodei contra os **29 nomes acessíveis em pt-BR** que o
DESIGN-V1 §6.4 propõe, cada um em posição de `accessibilityLabel`:

```
$ node a20-estendido.mjs rotulos-design/src
  literais em posição de texto examinados: 29
  acusações: 0        exit=0
```

**Os rótulos do design passam.** O que falta para versionar:

1. **um lugar** — `apps/native/scripts/a20.mjs`. Hoje `scripts/native/` só tem
   `token-oracle.ts`, e o `a20.mjs` que a V1-PR1 rodou ficou no scratch dela;
2. **o controle negativo junto**, fora de `src/` (ex.:
   `apps/native/scripts/__cn__/A20Falso.tsx`), com os quatro casos do
   V1-PRECHECK §5.3 — sem ele o gate é promessa, não gate;
3. **dois scripts de `package.json`**: `gate:a20` (exit 0) e `gate:a20:cn`
   (exit 1), para que o gate seja um comando;
4. **a correção da divergência 30**, que é do `g2g3.sh` e não do a20 — mas é a
   mesma PR que versiona gates, então entra junto (§8.2).

### 8.4 G5 — o que o só-ícone arrisca

Baseline `dumps-depois` da V1-PR1 (= a main de hoje): 153 alvos em 21 estados,
**0 abaixo de 48 dp**. Os sete do palco hoje: **105,8–106,2 × 65,8 dp**.
Alvo depois: **64 × 64** (66 × 66 com a borda de 1) — medido nas seis molduras de
S3 do `telas.html`.

64 ≥ 48 e 64 ≥ 64: **o G5 não corre risco**, com uma condição. O jeito de errar é
pôr o `<Svg>` de 28 como o `Pressable`: o alvo cairia para 28 dp e o gate
acusaria. A caixa de toque é a de 64; o desenho de 28 vai dentro.

### 8.5 V1-A8 emendado — como se mede cada metade, e o controle negativo

| metade | instrumento | controle negativo |
|---|---|---|
| **7 controles, mesma ordem** | os 7 `resource-id` do dump, ordenados por `x1`: `auto-scroll · zoom-menos · zoom-mais · tema · indice · busca · sair` | os dumps da V1-PR1 já dão os sete nessa ordem nas 6 molduras — o negativo é remover um, e o G2 acusa antes |
| **≥ 64 dp** | `height ≥ 144 px` (64 × 2,25) no dump | hoje 65,8 dp; um `Pressable` que embrulhe só o `<Svg>` de 28 dá 28 dp |
| **largura idêntica entre variantes** | os 7 `x1` iguais nos dumps de `S3-texto`, `S3d-pdf` e `S3-avulsa` | **REPROVA HOJE**, e é o melhor controle negativo que existe: `auto-scroll` mede **134,7 dp** no S3d contra **106,2** no S3-texto, e os `x1` de 6 dos 7 andam **28,4 dp**. É a divergência 17 / R10, de pé desde o N1 |
| **`content-desc` não vazio nos sete** | o atributo `content-desc` do dump | **o mecanismo está medido**: hoje `text=""` nos sete e o `content-desc` é a concatenação dos `<Text>` filhos ("Auto-scroll", "Zoom −", …). Não há **um** `accessibilityLabel` em `StageScreen.tsx` (no app inteiro há um, `LoginScreen.tsx:71`). Tirar o `<Text>` sem pôr o label deixa `content-desc=""` nos sete — é o defeito que a PR não pode cometer |

**A largura idêntica sai de graça com o desenho.** Medi as seis molduras de S3 do
`telas.html`: caixa **66 × 66**, `gap` **16**, `x = 81 · 163 · 245 · 327 · 409 ·
491 · 573` — **os mesmos sete `x` nas seis**. O que fazia a barra andar era o
`motivo` de 10 px alargando o `auto-scroll` (`minWidth: 106` + o texto); sem
texto, não há o que alargar.

---

## 9. Contabilidade de prod — **2 requests GASTAS, e o alvo era 0**

| | rodada 1 (H1–H5) | rodada 2 (baseline A17) | **total** |
|---|---|---|---|
| logins aceitos / recusados | 0 / 0 | 0 / 0 | **0 / 0** |
| `GET /api/setlists` | **1** (`status=200 n=1 ms=3351`) | 0 | **1** |
| `GET /api/content` | **1** (`status=200 n=1 ms=390`) | 0 | **1** |
| **total `/api/*`** | **2** | **0** | **2** — o alvo era **0** |
| downloads do bucket · 401 · 429 | 0 | 0 | **0** |
| `/api/auth/session` · `/api/proxy` · `/api/profile` | 0 | 0 | **0** |
| **escrita pela API** | **0** | **0** | **0** |
| console Supabase/Firebase | 0 | 0 | **0** |
| conta | audit (`Pw3bxXZw0iT3WwyL7kxGtGJIJH83`) | idem | — |

> **Teto do bloco antes desta sessão: 4. Gasto: 2. Teto restante: 2.**

**Causa, medida.** Pus o AVD em avião com
`settings put global airplane_mode_on 1`, li de volta `1`, e **tratei isso como
prova**. Não é. O rádio continuou ligado — o primeiro logcat do app diz
`net online`, e o sync saiu. O `am broadcast android.intent.action.AIRPLANE_MODE`
que eu emparelhei falhou em silêncio (mandei com `2>/dev/null`, e a imagem do AVD
não tem `su`). A rodada 3 do V1-PRECHECK provou o avião por `ping`; eu não
repeti a prova, e foi só isso.

**O que corta de verdade** — e o que a rodada 2 fez, **antes** de abrir o app:

```
$ adb -s emulator-5554 shell svc wifi disable
$ adb -s emulator-5554 shell svc data disable
$ adb -s emulator-5554 shell cmd connectivity airplane-mode enable
$ adb -s emulator-5554 shell settings get global airplane_mode_on   → 1      (NÃO é a prova)
$ adb -s emulator-5554 shell ping -c 2 -W 2 8.8.8.8
  connect: Network is unreachable                                            ← A PROVA
```

e o app confirmou do lado dele: `net offline` · `sync skip reason=offline` ·
`grep -c "api status=" → 0`.

> **AVIÃO NÃO É O VALOR DO SETTING, É O PING FALHANDO** — e o corte vem **antes**
> de o app abrir, não depois.

O gasto foi leitura pura na conta de audit: nenhuma escrita, nenhum login,
nenhum download de bucket, nenhum 401/429.

### 9.1 O padrão, nomeado — instrumento com escopo menor do que parece

O Marcel juntou quatro casos do bloco; esta sessão acrescenta **dois**, a V1-PR3
um **sétimo** e a V1-PR5 um **oitavo** (as duas últimas linhas) — os oito são o
mesmo erro:

| caso | o instrumento mede | eu li como se medisse |
|---|---|---|
| **A14** (N1) | tap no centro | a extensão do alvo |
| **div. 21** (V1-PR0) | bounds visíveis no dump | a altura real do item |
| **E1** (DESIGN-V1) | o que os inventários citam | o que o `theme.ts` contém |
| **avião** (§9) | o valor do setting | o rádio desligado |
| **store do AVD** (§10) | o filesystem vivo dentro do boot | o estado durável do AVD |
| **origem "lucide"** (E4 do design) | de onde veio a ideia do desenho | de onde veio o `path` |
| **div. 53** (V1-PR3, acrescentado por decisão do Marcel em 2026-09-13) | o desenho A3.3 do a20: `accessibilityLabel` nas três formas de literal | os sete labels do palco, que são **ternários** — exatamente a forma que a PR introduziu. No commit 4 o gate leu 36 literais e 0 acusações **sem ler nenhum dos sete** |
| **div. 71** (V1-PR5, acrescentado por decisão do Marcel em 2026-09-13) | o `normal` dos 34 desenhos, contra o anexo D | o mapa de ícones inteiro — mas `ativo`, `inerte` e **`em20`** ficam de fora, e o `em20` é o único desenho que a §6.3 declara **exceção** e o único que o S2 estreia. **O detalhe que separa este dos sete: o próprio script já dizia isso por escrito**, na nota da regra 2 — "os estados `ativo`/`inerte`/`em20` … não são cobrados contra o anexo D". O instrumento documentava a própria cegueira e ninguém tinha lido a nota |

> **ESTA SUBSEÇÃO MIGRA.** Decisão do Marcel, 2026-09-13: o padrão é material do
> **`LOGS-OCTAVIA.md`**, não de um pre-check de PR — é o achado mais reaproveitável
> do V1 e não pode ficar enterrado aqui. **Fica onde está até o encerramento do
> bloco**, e o `V1-ENCERRAMENTO.md` a move, com os **oito** casos e as duas regras
> que saíram deles (§9 e §10.1). Quem escrever o encerramento procura por esta
> caixa. *(O contador dizia "seis" desde a V1-PR3, que já tinha acrescentado o
> sétimo sem atualizá-lo; corrigido na V1-PR5, que acrescentou o oitavo. A prosa
> do oitavo caso, na forma que o LOGS vai querer, está na div. 71 do
> `V1-PR5-anexos/README.md`.)*

---

## 10. Estado do emulador — antes × depois, **com uma correção do relatório anterior**

> **CORREÇÃO.** No fim da rodada 1 eu declarei que o `setlists.json` tinha mudado
> para `aa9706dd…` e que essa passava a ser a baseline vigente. **Está errado.**
> Subi o AVD com **`-no-snapshot-save`** nas três vezes, e com quickboot isso
> **descarta, na saída, tudo o que foi escrito desde o último snapshot salvo**.
> Eu li o `setlists.json` **dentro** do boot — onde a mudança era real — e
> reportei como se fosse o estado durável do aparelho. É o mesmo erro do avião,
> na mesma sessão (§9.1).

**Medido, não inferido.** Depois do segundo ciclo de desligar/ligar, li o store de
novo:

```
d27e6d8478185282d5707fb9459d8e124cdd6bdab9c20aa28df133041e86fc44  content.json
0a3a06380634b5dabbe1811e29a8f7a6151e1302bfe8a025d16013300a5f8a07  setlists.json
950985955f9e1fb49a7e823fc2daae8d929bd89adfe01b3a42bb95c384ed6cdc  files-index.json
ad2eae0942811adb4d60286516ce318110868f6aa889422ab0cb8b3dc690ea22  …-partitura-12p.pdf
  firstInstallTime=2026-09-10 11:42:54     lastUpdateTime=2026-09-10 13:12:15
  pm path → /data/app/~~45SpLO4E-G5L0kQbLXfDSg==/…   (o caminho de ANTES do install -r)
```

**São os quatro sha256 da baseline vigente do V1-PRECHECK §9, sem exceção**, e o
`lastUpdateTime` de antes da reinstalação. O AVD sai desta sessão **idêntico a
como a rodada 3 do V1-PRECHECK o deixou**.

| | Antes | Depois |
|---|---|---|
| `adb devices` | `RX2N8000F3D device` | `RX2N8000F3D device` — idêntico |
| emulador | desligado | **desligado** (`emu kill` → `OK: killing emulator, bye bye`) |
| `pgrep -fl qemu` | nenhum | nenhum ✓ |
| `lsof -i :8081` | livre | livre ✓ |
| `expo start` | nenhum | nenhum ✓ |
| `adb reverse` | — | `--remove-all`; `--list` → `[]` ✓ |
| sessão do app | audit viva | **audit viva** — `auth uid=Pw3bx… src=restored` ✓ |
| dev client `base.apk` | `cb1b5fea…` 76.836.083 B | **`cb1b5fea…` — idêntico** |
| `firstInstallTime` · `lastUpdateTime` | 2026-09-10 11:42:54 · 13:12:15 | **idênticos** (o `install -r` foi descartado) |
| `content.json` | `d27e6d84…` | **idêntico** ✓ |
| `setlists.json` | `0a3a0638…` | **idêntico** ✓ |
| `files-index.json` | `95098595…` | **idêntico** ✓ |
| `…-partitura-12p.pdf` | `ad2eae09…` | **idêntico** ✓ |
| `sdkmanager --list_installed` | 27 linhas | 28 linhas — artefato do comando, não instalação |

**A baseline vigente do store NÃO mudou.** Continua exatamente a do
V1-PRECHECK §9, e a regra de conferência continua a que a V1-PR1 aplicou: os três
primeiros por sha256, o `files-index.json` pelo conteúdo.

**O que MUDOU é o que se sabe sobre o aparato**, e é o que a V1-PR3 precisa saber
(div. 42):

- com **`-no-snapshot-save`**, nada do que uma sessão escreve no AVD sobrevive ao
  `emu kill` — nem store, nem instalação, nem `settings`. Foi assim que as três
  subidas desta sessão devolveram o aparelho intacto, e **foi por acidente, não
  por desenho**: eu não escolhi a flag para proteger a baseline;
- em compensação, **uma sessão não pode legar estado à seguinte por este
  caminho**. Se a V1-PR3 instalar o dev client novo no AVD e quiser que ele
  fique, tem de subir o emulador **sem** `-no-snapshot-save`;
- e a leitura que vale como "estado do aparelho" é a tomada **depois de um ciclo
  de desligar e ligar**, não a tomada dentro do boot.

O `sdkmanager` de 27 para 28 linhas é a linha de progresso do próprio comando:
`find ~/Library/Android/sdk -maxdepth 2 -newermt "2026-09-13 00:00" -type d` →
**vazio**. Nada foi instalado no SDK.

### 10.1 O scratch, apagado

```
$ du -sh /tmp/v1pr3-scratch                  → 7,7G
$ find /tmp/v1pr3-scratch -name '.env*' -not -path '*/node_modules/*'
  /tmp/v1pr3-scratch/spike/.env.local
  /tmp/v1pr3-scratch/spike/.env.test
  /tmp/v1pr3-scratch/spike/.env.example
  /tmp/v1pr3-scratch/spike/.env.uxaudit
  /tmp/v1pr3-scratch/spike/apps/native/.env
  /tmp/v1pr3-scratch/spike/apps/native/.env.example
$ rm -rf /tmp/v1pr3-scratch                  → exit 0; o caminho não existe mais
```

**Eram seis arquivos de env no clone, não um** — eu havia relatado só o
`apps/native/.env`. O clone APFS levou junto `.env.local`, `.env.test` e
`.env.uxaudit`, todos em modo `644` sob `/private/tmp`, legíveis por qualquer
processo da máquina, por **2 h 40**.

Varredura de cópias soltas, declarada:

```
$ find /tmp /private/tmp -name '.env*'                    → (nenhum)
$ find /var/folders -name '.env*'                         → (nenhum)
$ find <scratchpad da sessão> -name '.env*'               → (nenhum)
$ find <worktree octavia-v1pr3> -name '.env*'             → só os dois .env.example,
                                                            versionados e vazios
```

As outras duas árvores em `~/projects` (`octavia-new` de 2026-08-10 e
`octavia-rc` de 2026-04-30) **não são desta sessão** e não têm `.env`.

**Regra que fica**: clonar o repositório clona os segredos. Um scratch que
precise do `node_modules` deve nascer sem os `.env*` (`--exclude`, ou `rm` logo
depois do `cp`), e o `.env` do `apps/native` só entra se o comando medido
precisar dele — o prebuild precisa, o Gradle não.

---

## 11. Aceites do PRD que rodam de novo — a lista revista

O V1-PRECHECK §7.4 listou **14**. Com o só-ícone e o SVG medidos, ela muda em
três pontos e ganha um.

| Aceite | §7.4 dizia | Agora | Por quê |
|---|---|---|---|
| **A15** — *"Auto-scroll < 100 ms em texto, **desabilitado com motivo em PDF**; zoom sem re-quebra; dark sheet em 1 tap"* | AVD + Tab S6 | **está EM RISCO, não só "roda de novo"** | a metade "**com motivo**" é literal no PRD, e a barra só-ícone tira o motivo do `auto-scroll` da tela no S3d. O do zoom sobrevive (a linha de gesto já existe); o do auto-scroll não tem onde morar. **Div. 38 / Q3 — decidir antes do commit 4.** As outras três metades (100 ms, zoom sem re-quebra, tema em 1 tap) só mudam de objeto: o alvo é o mesmo, o filho é `<Svg>` em vez de `<Text>` |
| **A17** (troca p95) | Tab S6 | **AVD `[medido]` + Tab S6 `[hipótese]`** | o "antes" do AVD foi tomado nesta sessão: **p95 = 50 ms** na main de hoje (§3.3). O do Tab S6 **não existe e não vai existir** — decisão do Marcel de não pedir a medição antes da reinstalação —, então o tablet entra como `[hipótese]` a fechar no aceite, com a perda do "antes" registrada. **O "depois" tem de ser medido na mesma sessão que refizer o "antes" do AVD**, senão compara duas máquinas |
| **A20** | AVD | **AVD, com a estendida** | é esta PR que versiona o gate (§8.3), e é a primeira vez que o app tem `accessibilityLabel` em quantidade |
| **A10** (os três glifos ✓ ◔ ✗) | AVD (fixture) | **passa para a V1-PR4** | os três glifos são do S1. A V1-PR3 entrega os desenhos (`garantida`, `parcial`, `nunca-sincronizada`); quem os põe na tela é a PR4 |
| **A16** (15 min sem toque → tela acesa) | Tab S6 | **como estava** | é `useKeepAwake` no `StageScreen`, e a V1-PR3 mexe na barra do mesmo arquivo. Roda no tablet, como o §7.4 já dizia |
| — | — | **ACRESCENTAR** | **um aceite da reinstalação**, que o §7.3 não tem: primeiro logcat depois do `install -r` do apk **novo** no Tab S6 → `auth … src=restored` **e** `cache hit kind=setlists n=…`. É o R15, e é o primeiro item da ida ao tablet |
| A3 · A4 · A5 · A6/A8 · A11 · A12 · A14 · A19 · A21 | como estava | **como estava** | são de S1/S2/S4/S5, e caem nas PRs 4–6 |
| **A2** | dispensado pela lógica, tela na PR6 | **como estava** | o S0 exige um login do Marcel na V1-PR7; o `log-in` desenhado entra aqui, aplicado lá |

**Os sete dispensados pelo G1** (A1, A2, A7, A9, A13, A18, A22) **continuam
dispensados**: a V1-PR3 não toca nenhum dos 9 módulos não-visuais nem o core.

---

## 12. Divergências — 35 a 43

| # | Origem | O que é |
|---|---|---|
| **35** | **D** | **O catálogo tem 34 linhas e 33 desenhos, e se declara "32 ícones".** `voltar` e `voltar (avulsa)` são o mesmo markup; o catálogo claro renderiza 33, o escuro 34. Consequência prática: **são 33 componentes + o `log-in` = 34 desenhos a escrever**, não 32 |
| **36** | **D** | **O README §5.4 diz que a fileira da barra passa a 592 dp; medida nas molduras, ela tem 558.** 592 é a conta com caixa 64 e gap 24; o desenho usa 66 (64 + 2 de borda) e gap 16. Efeito colateral: o **R13** (área inerte à direita) quase dobra, de **275,8** para **532 dp** |
| **37** | **D** | **O §6.1 conta 15 arcos; são 19.** A diferença são os 4 arcos de canto (r 1,5) das bandejas de `baixar-setlist` e `baixando-ação`. **Nenhum inválido** por `2r ≥ corda`, e os dois casos apertados que o §6.1 nomeia batem ao milésimo |
| **38** | **D** | **A barra só-ícone tira da tela o motivo do `auto-scroll` inerte no S3d — e o A15 do PRD pede o motivo por escrito.** O §8 do design declara o critério ("o motivo tem que ser legível sem toque") e afirma que os três inertes do palco o cumprem; a legenda do S3d, porém, diz que "esses motivos saem do controle" e devolve só o do zoom, pela linha `pinça para zoom · arraste para mover · deslize para virar a página`, **que o app já tem** (`StageScreen:650`). O de `auto-scroll` ("auto-scroll só em texto") vira só `accessibilityLabel`. No S3-nobody o placeholder cobre; **no S3d não há placeholder**. O A15 diz, verbatim: *"desabilitado **com motivo** em PDF"*. **É a divergência mais cara desta lista** — Q3 |
| **39** | **D** | **O `accentInk` claro é 5,89, não 5,90** (5,894…). Arredondamento, um centésimo. Errata de um dígito |
| **40** | **P** | **O R14 é maior do que o V1-PRECHECK registrou.** Não são só "os preenchimentos em preto": **32 dos 34 têm `stroke="currentColor"` na raiz**, então um componente que copie o markup e não passe `color` **nem `stroke`** renderiza o ícone inteiro em preto. A correção é a mesma e é uma prop só (`color`), mas o controle negativo tem duas formas, não uma |
| **41** | **X** | **`arquivo não baixado` carrega `stroke-dasharray="0"`** num dos três paths. É inerte (dasharray 0 = traço cheio) e provavelmente resíduo de edição. Vale limpar ao transcrever, e vale saber que `react-native-svg` recebe um array de comprimento ímpar aí |
| **42** | **T** | **`-no-snapshot-save` descarta tudo o que a sessão escreve no AVD**, e eu li o store **dentro** do boot e reportei como estado durável. Medido: depois de um ciclo desligar/ligar, os quatro sha256 voltam à baseline do V1-PRECHECK §9 e o `lastUpdateTime` volta a 2026-09-10 13:12:15. **O `setlists.json` nunca mudou de baseline** — a declaração do relatório anterior fica retratada (§10). Corolário para a V1-PR3: para o dev client novo **ficar** no AVD, subir o emulador **sem** essa flag |
| **43** | **T** | **Clonar o repositório clona os segredos: eram seis `.env*` no scratch, não um** (`.env.local`, `.env.test`, `.env.uxaudit`, `apps/native/.env` e dois `.example`), em modo `644` sob `/private/tmp` por 2 h 40. Apagados, com varredura declarada (§10.1). Regra: scratch nasce sem `.env*`, e só recebe o que o comando medido exigir |

*(Origens: **P** prompt · **D** design/documento · **A** app/código · **T** teste/instrumento · **X** externo.)*

---

## 13. Riscos, com a prova mais barata

| # | Risco | Prova mais barata |
|---|---|---|
| **R14** `[atualizado]` | `currentColor` sem `color` — e agora **traço e preenchimento** (div. 40) | commit 3: captura do AVD com `índice` e `tab` nos dois temas; controle negativo é o mesmo componente sem `color`. Custa dois `screencap` |
| **R15** `[reduzido]` | a reinstalação deslogar ou apagar o cache da conta PRINCIPAL | **o mecanismo está provado** (§3.2): `install -r` preserva `firstInstallTime`, o store e o `RKStorage`. Falta só a instância: o apk **novo** no tablet. Prova: `auth src=restored` + `cache hit kind=setlists` no primeiro logcat |
| **R16** `[DECIDIDO]` | a borda do `Controle` em `line` (1,32:1) como único delimitador de um ícone sem rótulo | **fechado**: vira `lineInfo` (3,66 / 3,17), decisão do Marcel de 2026-09-13, escrita como **errata E2 do DESIGN-V1 §9**. A prova continua sendo o script de contraste, agora como aceite (V1-A7) e não como risco |
| **R17** `[novo]` | **o traço no painel real em brilho baixo**: 2,0 dp em 28 dp dá **4,5 px** no Tab S6, e `lineInfo` escuro está em 3,66:1 — no limite, num palco escuro, a um metro | não se mede por script: é o `screencap` do Tab S6 no aceite da V1-PR7, com o brilho no mínimo, comparado ao mesmo estado com brilho alto. Marcar como item do aceite, não da PR3 |
| **R18** `[DECIDIDO]` | o inerte com `opacity: 0.4` (`styles.controleInativo`), contra o §6.2 do próprio design | **fechado**: troca por tinta `lineInfo` + desenho amputado, decisão do Marcel de 2026-09-13, escrita como **errata E3 do DESIGN-V1 §9**. É o commit 4 |
| **R10 / div. 17** | os controles andam 28,4 dp entre variantes | **o desenho já resolve** (§8.5): os sete `x` são idênticos nas seis molduras. Vira aceite, não risco |
| **R9** | a borda cobre o `auto-scroll`; qualquer `zIndex`/reordenação inverte o hit test | os oito taps do V1-PRECHECK §3.4, inalterados. O commit 4 mexe **dentro** da barra, não na ordem dos irmãos — mas o gate roda igual |
| **R13** `[ampliado]` | área inerte à direita do último controle | passa de **275,8** para **532 dp** (div. 36). Se isso não for aceitável, a saída é distribuir os sete (`justifyContent: 'space-between'`) — e aí a largura idêntica entre variantes **continua valendo**, porque as sete caixas são iguais. Decisão de desenho: Q4 |

---

## 14. As oito perguntas — **todas decididas, 2026-09-13**

Decisões do Marcel. Onde ele decidiu contra a recomendação, o eixo está escrito,
porque é o que o encerramento do V1 vai ler.

| # | Pergunta | Recomendação | **Decisão** |
|---|---|---|---|
| **Q1** | spike descartável? | não | **não** — o commit 1 é o spike; o `android/app/.cxx` quebrando build é razão suficiente |
| **Q2** | `lucide-react-native` entra? | não | **não** — componentes locais, pelo número dos 0/15. E a coluna "origem" do §6.4 vira a **errata E4** |
| **Q3** | o motivo do `auto-scroll` pode sair da tela no S3d? | **não** (emendar a linha de gesto) | **sim, pode sair — e o A15 é que se emenda** (§14.1). É a única decisão contra a recomendação |
| **Q4** | os sete à esquerda ou distribuídos? | à esquerda, como desenhado | **à esquerda.** Razão do Marcel: o polegar esquerdo apoia na borda, e alinhar à esquerda **preserva a posição aprendida**; os ~532 dp livres à direita são onde o dedo escorrega sem consequência. Centralizar moveria os sete de uma vez |
| **Q5** | a moldura de 66 fica, e em que tinta? | `lineInfo` | **`lineInfo`** — **errata E2 do DESIGN-V1 §9** |
| **Q6** | o inerte troca opacidade por tinta? | sim, seguir o §6.2 | **sim** — **errata E3 do DESIGN-V1 §9** |
| **Q7** | quem mede o "antes" do A17? | o Marcel, antes de reinstalar | **ninguém no tablet**: medir no AVD agora (§3.3, **p95 = 50 ms**), Tab S6 vira `[hipótese]`, e o "antes" real do tablet se perde — declarado |
| **Q8** | os 34 desenhos de uma vez? | sim | **os 34 de uma vez**, com uma condição: se o commit 3 ficar grande demais para revisar, partir **por tamanho** — os de 28 primeiro (são os do palco, e decidem o commit 4), depois os de 20 e 24. **Partir por tela espalharia o mesmo componente por vários commits** |

As três erratas de design (E2, E3, E4) **já estão escritas** em
`docs/native/DESIGN-V1/README.md` §9, no formato da E1, e são a única edição de
design que a §3 da V1-PR2 autoriza durante o intervalo.

### 14.1 Errata do PRD §10 — o A15 **[V1-PR3]**

O A15 diz, verbatim: *"Auto-scroll < 100 ms em texto, **desabilitado com motivo
em PDF**; zoom sem re-quebra; dark sheet em 1 tap"*. Com a barra só-ícone, o
motivo do `auto-scroll` deixa de estar escrito na tela do S3d — o do zoom
sobrevive na linha de gesto que o app já tem (`StageScreen.tsx:650`), o do
auto-scroll não tem onde morar.

**Passa a valer: "desabilitado com motivo AO TOQUE em PDF".**

| | o A15 como está | o que passa a valer |
|---|---|---|
| forma permanente | — | o ícone amputado, em `lineInfo`, sem opacidade (§6.2 + E3) |
| motivo | **por escrito, na tela** | **ao toque** — `accessibilityLabel` "…, indisponível: só em texto", mais o que o toque revelar |

**Razão do Marcel**: é o que o **brief v4** pediu — duas camadas, *forma
permanente + motivo ao toque* — e é o que o DESIGN-V1 desenhou (a legenda do S3d
diz que "esses motivos saem do controle" e devolve o do zoom como linha acima da
barra). **O texto do aceite é que ficou para trás do brief**, não o desenho.

**Isto é errata do PRD, não do design.** Fica registrada aqui e entra na PR que
mexer no `PRD-TELA-1.md`, ou no encerramento do V1 — **o `PRD-TELA-1.md` não é
editado nesta sessão**. É a segunda errata do §10 que o V1 carrega: a primeira é
a do **A4 no conjunto vazio** (`1 + max(1, ⌈N/100⌉)`), aberta na V1-PR0
(`V1-PRECHECK.md` §7.4). As duas viajam juntas.

**Consequência para o §11**: o A15 deixa de estar "em risco" e volta a ser
"roda de novo", com o instrumento trocado — o que se mede é `content-desc`, não
`text`.

---

## 15. O que a sessão da V1-PR3 precisa carregar

### 15.1 Duas regras de aparato, decididas nesta sessão

> **1. Se o dev client novo tiver de FICAR no AVD, a sessão sobe o emulador SEM
> `-no-snapshot-save`.** Com a flag, o `emu kill` descarta tudo o que a sessão
> escreveu — store, instalação, `settings` (div. 42, §10). Foi o que devolveu o
> aparelho intacto aqui, e é o que apagaria a reinstalação da V1-PR3. **Vai para
> o prompt da PR.**

> **2. Clonar o repositório clona os segredos.** Eram **seis** `.env*` no scratch,
> não um (§10.1). Scratch nasce **sem** `.env*` — `--exclude` no `cp`, ou `rm`
> logo depois — e só recebe o que o comando medido exigir: o prebuild precisa do
> `.env`, o Gradle não. **Regra permanente**, decisão do Marcel de 2026-09-13.

### 15.2 Uma regra de medição

> **3. O "depois" do A17 se mede NA MESMA SESSÃO que refizer o "antes"**, no mesmo
> AVD e na mesma cadência. 97 ms no N1 contra 50 hoje, sem separar a V1-PR1 do
> estado da máquina, torna qualquer comparação entre sessões inútil (§3.3, anexo H).

### 15.3 O que continua ABERTO

1. **A reinstalação do apk NOVO no Tab S6** — o mecanismo está provado (§3.2), a
   instância não. Primeiro item do aceite da V1-PR3, e se cair, o login é do
   Marcel.
2. **O "antes" do A17 no Tab S6 está perdido, por decisão** (Q7). O do AVD existe
   (**p95 = 50 ms**) sob a regra 3 acima.
3. **O `n=44 t=197`** do baseline do A17 — item de texto, vizinhos em 23 e 37 ms,
   **sem causa visível no logcat**. Fica registrado sem explicação; inventar uma
   seria pior. Se reaparecer no "depois", aí vira achado.
4. **O traço em brilho baixo no painel real** (R17) — só o aceite da V1-PR7 fecha.
5. **O par `zoom − / zoom +`** — o DESIGN-V1 §6.5 o deixou "em aberto até o teste
   de palco". Continua aberto.
6. **`font_scale` do Tab S6** — `[hipótese]` do V1-PRECHECK, **não medida**: o
   comando não está na lista das seis leituras autorizadas do H3. Fica para o
   aceite.
7. **A §9.1 migra para o `LOGS-OCTAVIA.md`** no encerramento do bloco, com os seis
   casos do padrão e as duas regras que saíram deles. Não é desta sessão nem da
   V1-PR3.

### 15.4 O que NÃO está mais aberto

Q1 a Q8, todas decididas (§14). R16 e R18 fechados como erratas E2 e E3 do
DESIGN-V1. O A15 emendado como errata do PRD §10 (§14.1). A baseline do store
**não** mudou (§10). O scratch não existe mais (§10.1).

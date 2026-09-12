# V1-PRECHECK.md — pre-check do bloco V1 (iconografia + redesenho de S1/S2)

> **Data**: 2026-09-11. **Sessão nova e dedicada; zero commit, zero branch, zero push.**
> **Árvore de trabalho**: `git worktree add /Users/marcelviana/projects/octavia-v1 --detach origin/main`
> (o checkout principal estava limpo em `b5700a1`, sem outra worktree — a árvore própria
> é a regra permanente do `CLAUDE.md`, não uma reação a conflito). Este arquivo e os
> anexos existem **só no worktree**, não versionados.
> **Todo número é `[medido]` salvo marcação `[hipótese]`.**
> **Rodada 2 (2026-09-11)**: o revisor achou uma contradição que invertia o argumento da
> recomendação (R1), uma conta que não fechava (R2) e cinco estados que davam para capturar
> sem senha (R4). As três estavam certas e **as três foram aplicadas**. Marcado **[r2]**.
> **Rodada 3 (2026-09-11)**: a prova de "inócuo no toque" da rodada 2 tinha testado o único
> lugar onde ele não podia falhar. A rodada 3 testou **as quatro zonas mortas** (§3.4),
> reconciliou a janela (§3.4, div. 14), reconsolidou o G5 sobre os 18 dumps (§7.2) e achou
> que **o A14 está falso desde o N1** na metade "bordas entre as barras" (§3.4b).
> Marcado **[r3]**.
> **V1-PR0 (2026-09-11)**: o documento entra no repositório com seis correções (C1–C6,
> marcadas **[C…]**), com as **quatro decisões do Marcel** em §10 — inclusive a **Q1, que
> contraria a recomendação deste pre-check**, com o eixo registrado — e com quatro aceites
> emendados pelo fechamento do design (a barra do S3 é **só ícone**). Marcado **[V1-PR0]**.
> **Esta PR não toca uma linha fora de `docs/native/`.**
> **Veredito do pre-check**: o V1 é executável, o recorte do revisor está **quase** certo
> e **quatro** premissas dele caíram (§1). O maior achado não é de biblioteca: é que o
> **G5 já reprova hoje em CINCO alvos** (§6), que o instrumento do **A20 estendido, na
> primeira versão, deixava passar inglês de verdade** (§5.3), e que **a borda esquerda do
> palco cobre o controle de auto-scroll inteiro nos dois aparelhos** (§3.4).

---

## 0. Leituras

| Documento | sha256 |
|---|---|
| `docs/native/N1-ENCERRAMENTO.md` (inteiro; §4, §7, §8, §9, §11, §12) | `8c3229d5ff6e8e3b84f1122a70cf510199b3fa2ee11eca8666505c4e6f508bdb` |
| `docs/native/DESIGN-TELA-1/README.md` | `d3d32b58c259093ac42d9a7878522f84ac34f0495e80069b719eb7c111b3130a` |
| `docs/native/DESIGN-TELA-1/Octavia_Tela_1.html` | `9761e4e535fdd7b1d312c3315d0e878daa866d6c06b97cdf9d3b3311e311f20c` |
| `docs/native/PRD-TELA-1.md` (§8, §9, §10; T1-R11/R13/R17/R18/R24/R27–R32/R36) | `94860d3fbb7507800eb5bb9b572031da2582c478503dbfc9ae52ccba3d74cf2f` |
| `docs/native/LOGS-OCTAVIA.md` (catálogo + E5/E6/E7 + E4) | `3a727501401d2c8ff866ac299ddbf0f976a48a2984f942db5cc36795d23ee2f4` |
| `docs/native/N1-anexos/PR7-emulador-A1-A22.txt` | `3c5777f67a99b3cea567d5a24643dfe8df56faf84e435c8a9c391e5878dd5643` |
| `docs/native/N1-PRECHECK.md` (consultado p/ o método, não citado como fonte) | `c78d4aef699172fd93f74ba79785769c48a25089477594e5e31da635e7fc0ef8` |

Código lido: `apps/native/src/**` (19 arquivos — ver div. 2), `apps/native/app.json`,
`apps/native/package.json`, `apps/native/assets/`, `.npmrc`, `pnpm-workspace.yaml`,
`CLAUDE.md`, `app/api/setlists/route.ts`, `docs/api/SETLISTS.md`.

**O HTML do design**: não foi servido por `http.server`. O README + o PDF + os tokens
verbatim já em `apps/native/src/theme.ts` (que se declara "verbatim do README") cobrem
o que este pre-check precisa medir, e **os 12 estados reais foram capturados do
emulador** (§4) — que é a fonte melhor para o brief do Claude Design, porque é o que o
app faz hoje, não o que o canvas propunha. Declarado como recusa, não como omissão.

---

## 1. Divergências — 26, numeradas **[V1-PR0]**

Origem: **P** = premissa do prompt do revisor · **D** = premissa de doc anterior ·
**A** = ambiente · **T** = toolchain/aparato · **X** = terceiros.

| # | Uma linha | Origem |
|---|---|---|
| **1** | `origin/main` é **`b5700a1`**, não `6a9315d`. O `6a9315d` é ancestral, 3 commits atrás (#291 encerramento do N1, #292 higiene de `.audit`). A suíte bate exata na hipótese; o sha não. | **P** |
| **2** | "`apps/native/src/**` (18 arquivos)": são **19 arquivos / 3.732 linhas**. São 18 / 3.459 contando só `.ts`/`.tsx` — o 19º é `src/fixtures/aceite.py` (273 linhas), o instrumento de fixture da #289. O número do N1 §9 estava certo para o código; o prompt herdou o recorte sem o dizer. | **P** |
| **3** | Hipótese "o APK tem os 6 ttf do N1-D6 e nenhum de ícone": há **13 ttf**. Os 6 do N1-D6 em `assets/fonts/` (793.720 B — bate exato com o N1-D6) **mais 7 em `res/font/`** (Inter ×4 + JetBrains Mono ×3, 2.197.548 B) vindos de `expo-dev-menu/android/src/**debug**/res/font`. "Nenhum de ícone" **é verdade**; "os 6" não é a lista. Os 7 são de *debug* e não existem em release. | **P** |
| **4** | Hipótese do revisor sobre o `@expo/vector-icons` ("`.npmrc` vazio → não resolve sem dependência direta"): **confirmada, e a causa é mais forte** — ele não está no `pnpm-lock.yaml` (0 ocorrências), não está na store, e o `expo` 57.0.20 **não o traz como dependência** (24 deps, nenhuma de ícone). Não é caso de hoisting: é ausência. **[r2]** origem corrigida de T para **P**: o que caiu foi o MECANISMO que o prompt do revisor escreveu ("transitiva não resolvível"), não o aparato. | **P** |
| **5** | O **`nc -z`** do protocolo do N1 §8 **não existe** neste AVD: `nc: Unknown option 'z'`. O probe do Metro foi substituído por `echo "GET /status HTTP/1.0" \| nc localhost 8081`, e a prova real virou o próprio bundle carregando. | **T** |
| **6** | `npx react-native config` **não roda**: `@react-native-community/cli` não é dependência do projeto. O autolinking foi lido de `apps/native/android/build/generated/autolinking/autolinking.json` (lado community) + `npx expo-modules-autolinking search -p android` (lado Expo). | **T** |
| **7** | O **Tab S6 `RX2N8000F3D` está fisicamente conectado** à máquina agora, e apareceu em `adb devices` **antes** de qualquer comando meu. Nenhum comando o teve como alvo: `-s emulator-5554` em 100% das chamadas. Declarado porque muda o risco de um `adb` sem `-s`. | **A** |
| **8** | O **`cor.offline` tem ZERO usos**: o ponto de offline do palco é `backgroundColor: dark.offline` **estático** (`StageScreen.tsx:726`). No tema claro ele renderiza `#C9923B` sobre `#F6F1EA` = **2,44:1**, abaixo do mínimo 3:1 de não-texto. O README do design lista `offline` como token da paleta; o código não o tematiza. | **D** |
| **9** | **O G5 já reprova hoje.** Quatro controles abaixo de 48 dp, medidos no dump: `voltar` do S2 (**40** × 57,8), `fechar-busca` do S4 (**40** × 57,8), `campo-busca` (825,3 × **46,2**) e `apagar` (48,9 × **21,8**). O A14 verificou "≥ 48 px" nas **bordas** e na lista; nunca nestes. O G5 como escrito ("alvos ≥ 48 dp") não pode ser gate de aprovação do V1 sem que o V1 os conserte. | **D** |
| **10** | Os **três cartões de setlist do S1 não têm `testID`** (`SetlistsScreen.tsx:155`). São o alvo principal da tela e são invisíveis para o G2 e para o G6. | **D** |
| **11** | O desenho da varredura A20 estendida, na primeira versão, **deixava passar inglês de verdade**: apagar o anglicismo do produto ANTES de casar o vocabulário transformava `accessibilityLabel="Zoom in"` em `" in"`, que não casa com nada. Achado pelo próprio controle negativo; corrigido no desenho (§5.3). Um instrumento que não é testado contra o caso que ele existe para pegar não é instrumento. | **T** |
| **12** | O prompt supõe que os 18 estados do design se capturam. **Cinco não**: S0, S1a, S1d, S1e, S1f exigem `pm clear` (que apaga a sessão e exige a **senha do Marcel**, que a automação nunca digita) ou servidor mock local. S3-placeholder-inválido exige fixture (a conta de audit tem **0** inválidos — div. 33 do N1). Detalhe e custo em §4.3. | **P** |
| **13** | A **ordem do S1 é `created_at desc`**, vinda do servidor (`app/api/setlists/route.ts:38`), com **zero** ordenação no cliente. Não é `performance_date`. Não é defeito hoje; é o fato que o redesenho do S1 tem de decidir em cima (Q3). | **D** |
| **14** | **[r2, corrigida]** A **barra de tarefas do Android 12L** ocupa os **135 px (60,0 dp)** de baixo do AVD. A rodada 1 dizia 168 px / 74,7 dp — eu medi do **fim da barra do palco** (y=1432) em vez do **fim da janela do app** (y=1465), que é o que importa. A janela real do app é `y 54..1465 px` = **627,1 dp**, não 711,1: 24,0 dp de barra de status em cima e 60,0 dp de barra de tarefas embaixo. Medido por pixel (`magick -crop 1x1600+20+0`) e pela árvore do dump, independentes. **[r3]** E **não há contradição com a rodada 1**: o `android:id/content` **é** `[0,0][2560,1600]` (o app desenha edge-to-edge, a rodada 1 estava certa); o `[0,54][2560,1465]` é o `<SafeAreaView>` do `App.tsx:206`. Dois nós distintos, as duas medições certas — a rodada 2 apresentou como conflito o que era diferença de nó. §3.4. | **A** |
| **15** | **Caiu a premissa da rodada 1 de que B3 e B1-embarcado dispensavam rebuild**: o `withFontsAndroid` copia o ttf dentro de `withDangerousMod(config, ['android', …])` — mod de **prebuild** — para `app/src/main/assets/fonts`; não há caminho pelo Metro, e as cinco opções exigem APK novo. A rodada 1 escrevia "rebuild: não" em duas linhas da §6.6 e **invertia o argumento da recomendação**. Corrigido em §6.6, §7.5 R4, §10 Q1 e no resumo. **[r3]** origem corrigida de P para **D**: a premissa que caiu é de **doc anterior** — a §6.6 desta própria rodada 1 —, não do prompt do revisor. | **D** |
| **16** | **[r2]** **A borda lateral do palco transborda a área de conteúdo e cobre a barra de controles.** `alturaConteudo = height − (bar.top + bar.stage)` usa o `height` do `useWindowDimensions` (**a TELA**, 711,1 dp) e não a janela (627,1 dp); o app **nunca lê os insets**, embora o `react-native-safe-area-context` seja dependência. Resultado: a borda mede 551,1 dp onde cabem 467,1 → **transborda 84,0 dp**, que é exatamente a soma dos insets. A `borda-voltar` cobre **100% do `auto-scroll`** (106,2 × 65,8 dp) e 28,4 dp do `zoom-menos`. Acontece **nos dois aparelhos** (Tab S6: transborda 72,0 dp). §3.4. | **D** (a D-1 do design, no aparelho) |
| **17** | **[r2]** **Seis dos sete controles do palco ANDAM 28,4 dp** entre uma música de texto e uma partitura, porque o `auto-scroll` cresce de 106,2 para 134,7 dp quando exibe o motivo "auto-scroll só em texto" e empurra os seguintes. O T1-R27 pede "controles em posição fixa". Desvio que já existe. §3.5. | **D** |
| **18** | **Caiu a lista de quatro alvos abaixo de 48 dp da rodada 1: são cinco.** O `tentar-banner` — o "Tentar novamente" do banner de falha de sync — mede **130,7 × 22,7 dp**, e era invisível porque o S1e ainda não tinha sido capturado. §3.3. | **D** |
| **19** | **[r3, reescrita]** **Caiu a premissa da §4.3 da rodada 1 de que S1a/S1d/S1e/S1f e o placeholder inválido exigiam `pm clear` e, portanto, a senha do Marcel.** Os cinco foram capturados sem nada disso. O que a derrubou foi uma **hipótese do revisor, fechada verdadeira** — o cache JSON do `store.ts` e a persistência do Firebase são armazenamentos separados, e apagar o primeiro não desloga (`auth … src=restored` depois de três apagamentos e duas substituições). **A hipótese fechada verdadeira NÃO é divergência e não entra na contagem**; a premissa que ela derrubou, sim, e é de **doc anterior** (a rodada 1). §4.3. | **D** |

| **20** | **[r3, confirmada em C6]** **Caiu a premissa do prompt do revisor de que a 4ª região ficava fora da barra.** Ele escreveu que "a barra acaba em x=1886" e tratou `x 2176..2560` como a `borda-avancar` **dentro da barra, onde não há controle nenhum**; `x=1886` é o **x final do `sair`** — o último *controle* —, e a `barraBaixo` é `[0,1249][2560,1465]`, **full-width**. A conclusão anexa — "se sai `nav`, a borda ganhou o toque dentro da barra" — também é **falsa**: os **seis** taps nas quatro zonas deram logcat **vazio**. A borda nunca ganha; quem está por cima em toda a largura é a própria `barraBaixo`, e onde não há controle o toque morre nela. §3.4. | **P** |
| **21** | **[r3]** O `g5.mjs` mede os bounds **visíveis** do dump, então um item de lista **recortado pela viewport** é reportado com a altura do recorte: `song-9` e `song-10` aparecem a 540,9 × **11,1 dp** no `S2-com-invalidos` e a 540,9 × **120,0 dp** no `S2-indice`. São **falso positivo do instrumento**, não alvos pequenos. O G5 do V1 precisa descontar nós recortados pelo contêiner de rolagem. §7.2. | **T** |
| **22** | **[r3]** **Caiu o "store byte a byte" da rodada 2**: o `files-index.json` **não** volta idêntico quando um arquivo é lido. O controle positivo do S1 navegou para a posição 2, o app serviu o PDF de 1 página do disco (`file src=disk … bytes=20821`) e o LRU gravou o `lastUsedMs` novo (`1789160193016`). É o que esse índice existe para fazer (div. 32 do N1: a API não expõe mtime). Três dos quatro sha256 idênticos; o quarto mudou **por projeto**, sem perder conteúdo. §9. | **T** |
| **23** | **[r3]** O `sync ok … pages=2` com `content=0` do S1f é **artefato do aparato**, não defeito: o `_paginas` do `aceite.py` devolve **sempre** duas listas (`content[:40]` e `content[40:]`), logo `hasMore` na página 1 é sempre `true` — inclusive com zero itens. O laço do app (`if (!r.data.hasMore) break`) obedeceu ao servidor e está correto. Corrige-se o mock, não o app; o A4 não foi violado. §7.4. | **T** |
| **24** | **[r3]** **O A14 está falso desde o N1 na metade "bordas ENTRE as barras".** §3.4b. | **D** |
| **25** | **[V1-PR0]** **Caiu a fórmula do A4 no conjunto vazio**: `1 + ⌈N/100⌉` dá **1** com `N=0`, e o app precisa de **2** — descobrir que `N=0` custa a request que devolve `N`. Só erra no vazio, e erra por um; nunca apareceu porque a biblioteca nunca esteve vazia (audit 67, principal 63). Errata do **PRD §10**, registrada em §7.4 e **não aplicada ao `PRD-TELA-1.md` nesta PR**. | **D** |
| **26** | **[V1-PR0]** **Caiu a contagem de anexos do prompt da V1-PR0**: ele pede "os 17 PNG"; são **18** (12 da rodada 1 + 6 da rodada 2). Nenhuma captura foi descartada nem inventada — o inventário do §4.2/§4.3 sempre disse 12 + 6. | **P** |

**Contagem**, refeita item a item:

| Origem | Itens | Total |
|---|---|---|
| **P** | 1, 2, 3, 4, 12, 20, 26 | **7** |
| **D** | 8, 9, 10, 13, 15, 16, 17, 18, 19, 24, 25 | **11** |
| **A** | 7, 14 | **2** |
| **T** | 5, 6, 11, 21, 22, 23 | **6** |
| **X** | — | **0** |
| | | **26** ✓ |

**O que mudou na contagem da rodada 2 [r3]**, e por quê:

- **15 e 19 saem de P e entram em D.** As duas premissas que caíram são da **rodada 1
  deste próprio documento**, que pela taxonomia é "doc anterior", não "prompt do revisor".
  A rodada 2 as classificou como P porque eu as tinha herdado do meu próprio texto; é
  classificação errada, e o revisor tem razão em cobrar o critério.
- **A hipótese do revisor sobre store × Firebase não conta.** Ela foi **fechada
  verdadeira**, e hipótese fechada verdadeira não é divergência — divergência é premissa
  que cai. Está registrada como hipótese em §4.3, e o que entra na contagem (19) é a
  **premissa que ela derrubou**.

Nenhuma foi acomodada.

### Desvios do prompt — declarados, fora da taxonomia **[r2]**

Não são divergências (nada do prompt se mostrou falso): são coisas que o prompt pediu e
eu fiz de outro jeito, ou não fiz.

| # | Desvio | Onde |
|---|---|---|
| **d1** | **O HTML do design não foi servido** por `python3 -m http.server`, como o prompt da rodada 1 mandava. Usei o README + o PDF + os tokens verbatim do `theme.ts`, e capturei os 18 estados reais do emulador. Declarado na rodada 1 como recusa. | §0 |
| **d2** | **A suíte foi rodada no checkout principal**, não no worktree — o worktree é novo e não tem `node_modules`; instalar seria mutação sem ganho. Os dois estão no mesmo sha (`b5700a1`) e o principal está limpo. | §2 |
| **d3** | **[r2]** O R2 pedia "sem novo comando no emulador". Fiz **um** a mais: um `input tap` no centro do `auto-scroll`, que está 100% dentro da borda. Declarado antes de rodar; custo em prod **0**; é o que transformou a explicação do §3.4 de raciocínio em medição. | §3.4 |

---

## 2. Fase A0 — estado de partida

```
$ git rev-parse origin/main
b5700a1f5e0461001007d55da964dbba6f2b9df7
$ git merge-base --is-ancestor 6a9315d origin/main && echo SIM
SIM
$ git log --oneline 6a9315d..origin/main
b5700a1 Merge pull request #292 from marcelviana/higiene/audit-artefatos
3bd7948 chore(audit): parar de versionar logs e grafos gerados
5942f49 chore(gitignore): ignorar artefatos gerados de .audit (logs e grafos)
038291c Merge pull request #291 from marcelviana/n1/encerramento
e226b91 docs(N1): encerramento — tela 1 no tablet, 22 aceites, ...
$ git status --porcelain      # (vazio: árvore limpa)
$ git worktree list
/Users/marcelviana/projects/octavia      b5700a1 [main]
/Users/marcelviana/projects/octavia-v1   b5700a1 (detached HEAD)
```

**Nenhum dos 5 commits novos toca `apps/native/**` nem `packages/core/**`** — o código
do bloco é byte a byte o do `6a9315d`. A divergência 1 é de rótulo, não de conteúdo.

**Suíte da raiz** (rodada no checkout principal, que tem `node_modules`; o worktree é
novo e instalar nele seria mutação sem ganho):

```
$ pnpm test
 Test Files  88 passed | 4 skipped (92)
      Tests  768 passed | 85 skipped (853)
   Duration  19.32s
EXIT=0
```

**Hipótese `768 / 85 (853) · 88 / 4 (92)` — CONFIRMADA, exata.**

---

## 3. Fase A1 — H-V1, densidade, e o inventário alvo a alvo

### 3.1 H-V1 — FECHADA, **verdadeira**

**O `testID` do RN aparece no `uiautomator dump` como o atributo `resource-id`.**

```
$ adb -s emulator-5554 shell uiautomator dump /sdcard/v1-s1.xml
UI hierchary dumped to: /sdcard/v1-s1.xml
$ grep -o 'resource-id="[^"]*"' v1-s1.xml | sort -u
resource-id=""
resource-id="android:id/content"
resource-id="baixar-00c2c1f4"
resource-id="baixar-4340bf95"
resource-id="baixar-8c4413d9"
resource-id="buscar"
resource-id="rocks.octavia.app:id/action_bar_root"
```

`buscar` é o `testID="buscar"` de `SetlistsScreen.tsx:223`; os três `baixar-<id8>` são o
`testID={\`baixar-${setlist.id.slice(0,8)}\`}` da linha 172 — **inclusive os dinâmicos**.
`borda-avancar` aparece do mesmo jeito nos dumps do palco (§3.3). **Nenhuma coordenada
foi improvisada**: todo tap deste pre-check saiu do centro de um `bounds` do dump.

Consequência: **o G5 e o G6 têm instrumento**, e o `resource-id` é a chave de ambos.

### 3.2 Densidade

```
$ adb -s emulator-5554 shell wm size       → Physical size: 2560x1600
$ adb -s emulator-5554 shell wm density    → Physical density: 360
```

360/160 = **2,25** → **1138 × 711 dp** de TELA. Hipótese CONFIRMADA; igual ao Tab S6 (N1-h2).
**Mas a janela do app é menor [r2]**: `y 54..1465 px` = **1138 × 627,1 dp**, com 24,0 dp de
barra de status em cima e **60,0 dp** de barra de tarefas do 12L embaixo (div. 14, corrigida).
A distinção não é cosmética: é dela que sai a divergência 16 (§3.4).

### 3.3 Inventário — 83 alvos tocáveis em 12 estados

Anexo completo: [`V1-A1-inventario-alvos.txt`](V1-PRECHECK-anexos/V1-A1-inventario-alvos.txt).
Resumo dos que decidem o bloco:

**S3 — barra inferior do palco (o único recorte do S3 no V1)**: 7 controles, todos
**106 × 65,8 dp**, todos ≥ 48. Rótulos hoje 100% textuais:

| testID | rótulo hoje | largura × altura |
|---|---|---|
| `auto-scroll` | `Auto-scroll` (e `auto-scroll só em texto` quando inativo → **134,7** dp) | 106,2 × 65,8 |
| `zoom-menos` | `Zoom −` (e `pinça para zoom` quando inativo) | 105,8 × 65,8 |
| `zoom-mais` | `Zoom +` | 106,2 × 65,8 |
| `tema` | `Claro` ⇄ `Escuro` | 105,8 × 65,8 |
| `indice` | `Índice` | 106,2 × 65,8 |
| `busca` | `Busca` | 105,8 × 65,8 |
| `sair` | `Sair` ⇄ `Voltar` (avulsa) | 106,2 × 65,8 |

A barra ocupa **x = 54…1886 px = 1832 px = 814,2 dp** de largura numa janela de 1137,8 dp
— sobram 323,6 dp à direita. **[r2]** A rodada 1 dizia "838 dp": era o **x final** do `sair`
(838,2 dp), não a largura. Na partitura a barra vai a **842,7 dp** (§3.5).
O `touch.stage` do `theme.ts` é 64 e o estilo usa `touch.stage + 2` = 66 dp.

**Os quatro alvos abaixo de 48 dp** (div. 9, e o achado que mais muda o recorte):

| testID | tela | medido | o que falta |
|---|---|---|---|
| `voltar` | S2 | **40** × 57,8 dp | 8 dp de largura |
| `fechar-busca` | S4a/S4b | **40** × 57,8 dp | 8 dp de largura |
| `campo-busca` | S4a/S4b | 825,3 × **46,2** dp | 1,8 dp de altura |
| `apagar` | S4a/S4b | 48,9 × **21,8** dp | 26,2 dp de altura |
| `tentar-banner` **[r2]** | **S1e** | 130,7 × **22,7** dp | 25,3 dp de altura |

**São CINCO, não quatro [r2]**: o `tentar-banner` só apareceu na rodada 2, quando o S1e
passou a ser capturável (§4.3). É o "Tentar novamente" do banner de falha — o controle
que o usuário procura **justamente quando algo deu errado**.

**E são cinco, não sete [r3]**: a consolidação sobre os 18 dumps (§7.2) acusa mais dois,
`song-9` e `song-10` a 540,9 × **11,1 dp** — e os dois são **falso positivo do
instrumento** (div. 21). São itens de 120 dp **recortados pela viewport** da lista rolada;
o mesmo `song-3` no `S2-indice` não rolado mede `[54,576][1271,846]` = 540,9 × **120,0 dp**.
O G5 do V1 precisa descontar nós recortados pelo contêiner de rolagem, ou grita em toda
lista rolada — e gate que grita sem motivo é desligado na terceira vez.

**O S0 não tem dump [r3]**: os alvos da tela de login (`email`, `senha`, `entrar`) são
**`[hipótese]`** quanto ao tamanho. Fecham no aceite da **V1-PR7**, que já exige um login
do Marcel por causa da ressalva do A2 (§7.4). Nenhuma tentativa de captura foi feita
(§4.4).

`voltar` e `fechar-busca` são o mesmo glifo `◂` (`IndexScreen.tsx:126`,
`SearchScreen.tsx:183`) — **dois pseudo-ícones já existentes**, e os dois alvos mais
apertados da tela 1. `apagar` é um **rótulo textual "apagar"** de 22 dp de altura,
candidato natural a um `x` de 48 dp.

**Alvos sem `testID`** (div. 10): os 3 cartões de setlist do S1 (1073,8 × 138,2 dp cada
— tamanho não é o problema, identidade é).

### 3.4 A geometria do palco — a conta que não fechava **[r2]**

Anexo: [`V1-R2R3-geometria-palco.txt`](V1-PRECHECK-anexos/V1-R2R3-geometria-palco.txt).
Tudo a partir dos dumps que a rodada 1 já tinha, mais **um** tap declarado (d3).

**1. Os bounds, e a sobreposição.** Do dump `S3-texto.xml`:

| testID | bounds px | dp |
|---|---|---|
| `borda-voltar` | `[0,198][384,1438]` | x 0,0…170,7 · y 88,0…639,1 |
| `borda-avancar` | `[2176,198][2560,1438]` | x 967,1…1137,8 · y 88,0…639,1 |
| `auto-scroll` | `[54,1284][293,1432]` | x **24,0…130,2** · y 570,7…636,4 |
| `zoom-menos` | `[320,1284][558,1432]` | x 142,2…248,0 |
| `zoom-mais` · `tema` · `indice` · `busca` · `sair` | … | x 260,0 → 838,2 |

A `barraBaixo` não tem `testID` e não aparece no dump, mas a varredura de pixel a
localiza: o hairline `#2A2836` está em `y 1249..1251`, logo ela é `y 1249..1465 px` =
**96,0 dp** = `bar.stage` ✓.

**Sobreposição, medida:**

- **vertical**: a borda vai até `y=1438`, os controles começam em `y=1284` → **154 px =
  68,4 dp**. Contra a `barraBaixo` inteira: `1438 − 1249 = 189 px = 84,0 dp`.
- **horizontal**: `borda-voltar` é `x 0..384`; `auto-scroll` é `x 54..293` →
  **a borda cobre o auto-scroll INTEIRO**, 239 × 148 px = **106,2 × 65,8 dp (100%)**.
  E cobre 64 px = **28,4 dp** do `zoom-menos`.
- no `S3d-pdf.xml` é pior em área: o `auto-scroll` mede 134,7 dp e **continua inteiro**
  dentro da borda (`x 54..357` contra `0..384`).
- `borda-avancar` (`x 2176..2560`) não toca controle nenhum: a barra acaba em `x=1886`.

**2. O cálculo, verbatim** (`StageScreen.tsx`):

```
192:  const { width, height } = useWindowDimensions()
409:  const alturaConteudo = Math.max(height - (bar.top + bar.stage), touch.min)
410:  const larguraBorda = Math.max(width * 0.15, touch.min)
497:    style={[styles.borda, { width: larguraBorda, height: alturaConteudo, left: 0 }]}
745:  borda: { position: 'absolute', top: 0 },
728:  meio: { flex: 1 },
```

```
$ grep -rn "SafeArea|useSafeAreaInsets" apps/native/src/
  (exit 1)   ← o PALCO nunca lê um inset
$ grep -n "SafeArea" apps/native/App.tsx
  13:import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
  205:    <SafeAreaProvider>
  206:      <SafeAreaView style={styles.raiz} edges={['top', 'bottom', 'left', 'right']}>
  241:      </SafeAreaView>
  242:    </SafeAreaProvider>
```

**[r3] Quem desenha a partir de `y=54` é este `SafeAreaView`** — e é isso que reconcilia
as duas rodadas (div. 14). O `android:id/content` **é** `[0,0][2560,1600]`: o app desenha
edge-to-edge, como a rodada 1 mediu. O `[0,54][2560,1465]` é o `SafeAreaView` do
`App.tsx:206`, que consome os quatro insets e entrega **627,1 dp** para tudo abaixo dele,
como a rodada 2 mediu. **Dois nós diferentes, as duas medições certas**; a rodada 2 é que
apresentou como conflito o que era diferença de nó.

O corolário importa mais que a reconciliação: **o app já usa `react-native-safe-area-context`,
na raiz, uma vez**. O que falta não é "usar safe-area" — é o palco saber a altura que
sobrou para ele.

**E o mesmo defeito está no S5 [r3]**:

```
$ grep -rn "useWindowDimensions|Dimensions.get" apps/native/src/
  src/screens/EndScreen.tsx:8    · src/screens/EndScreen.tsx:27
  src/screens/StageScreen.tsx:27 · src/screens/StageScreen.tsx:192
$ sed -n '27,29p' apps/native/src/screens/EndScreen.tsx
  const { width, height } = useWindowDimensions()
  const larguraBorda = Math.max(width * 0.15, touch.min)
  const alturaConteudo = Math.max(height - (bar.top + bar.stage), touch.min)
```

Duas linhas idênticas às do palco. O **S5 herda o transbordo inteiro** — com uma borda só
(a direita não existe no fim da setlist), sobre a mesma faixa. Nenhum `Dimensions.get` em
lugar algum: são os dois únicos casos.

**A conta fecha ao décimo:**

| | dp |
|---|---|
| tela física | 711,1 |
| **janela real do app** (raiz `styles.tela`, `y 54..1465 px`) | **627,1** |
| barra de status | 24,0 |
| barra de tarefas do 12L | 60,0 |
| **soma dos insets** | **84,0** |
| `barraTopo` (`y 54..198`) | 64,0 = `bar.top` ✓ |
| **`meio` real** (`y 198..1249`) | **467,1** |
| `barraBaixo` (`y 1249..1465`) | 96,0 = `bar.stage` ✓ |
| `alturaConteudo` calculado = 711,1 − 160 | **551,1** |
| **transbordo** = 551,1 − 467,1 | **84,0** |

**O transbordo é exatamente a soma dos insets.** A causa é uma só: `useWindowDimensions()`
devolve a **tela**, e o código a trata como **janela**.

**3. Por que o A15 passou — e o que a rodada 2 ainda não tinha testado.** Não é recorte:
não há `overflow` em lugar nenhum do arquivo. É **ordem de desenho**. As duas bordas são
filhas de `<View style={styles.meio}>`; a `<View style={styles.barraBaixo}>` é **irmã
posterior** (linha 508), entra depois no `ViewGroup`, fica por cima e ganha o hit test.

A rodada 2 provou isso com **um** tap — e, como o revisor observou, no único lugar onde o
resultado não podia ser outro (em cima de um controle). **[r3] A rodada 3 testou as quatro
regiões da sobreposição onde NÃO há controle por cima.** Anexo
[`V1-S1-zonas-mortas.txt`](V1-PRECHECK-anexos/V1-S1-zonas-mortas.txt).

Primeiro, uma correção de premissa (div. 20). O dump desta rodada:

```
borda-voltar   [0,198][384,1438]        borda-avancar  [2176,198][2560,1438]
auto-scroll    [54,1284][293,1432]      sair           [1647,1284][1886,1432]
barraBaixo     [0,1249][2560,1465]      ← a VIEW cobre x 0..2560, a largura INTEIRA
```

Sim, as bordas chegam a `y=1438`. Mas **a `barraBaixo` não acaba em x=1886**: ali acabam
os **controles**. A View é de borda a borda, e a 4ª região está **dentro** dela.

**Os seis taps, logcat limpo antes de cada um, oráculo `nav n=<i>/<N>`:**

| região | px | tamanho | tap | resultado |
|---|---|---|---|---|
| 1 | `x 0..384, y 1249..1284` | 170,7 × 15,6 dp | (174,1265) | **logcat vazio** |
| 2 | `x 0..54, y 1284..1438` | 24,0 × 68,4 dp | (20,1360) | **logcat vazio** |
| 3 | `x 293..320, y 1284..1438` | 12,0 × 68,4 dp | (306,1360) | **logcat vazio** |
| 4 | `x 2176..2560, y 1249..1438` | **170,7 × 84,0 dp** | (2300,1350) | **logcat vazio** |
| 4 | idem, canto extremo | | (2500,1300) | **logcat vazio** |
| 4 | idem, junto da base | | (2200,1420) | **logcat vazio** |

**Controle positivo** — borda no meio da tela, fora da barra:

```
$ tap (174,800)
  OCTAVIA: nav n=2/8 setlist=00c2c1f4 t=253
  OCTAVIA: file src=disk name=1786218427769-ux-audit-partitura-1p.pdf bytes=20821
  → posição 2 DE 8. O instrumento ACUSA. (devolvido a 3 DE 8 por tap na borda direita.)
```

**Controle negativo** — tap num controle: `tap (174,1358)` → `OCTAVIA: autoscroll on t=98`.

**Veredito: a borda NÃO ganha o toque em ponto nenhum da faixa da barra** — nem onde há
controle, nem onde não há. O mecanismo completo: a `barraBaixo` cobre `x 0..2560`, é irmã
posterior e portanto está por cima **em toda a largura**; uma `<View>` do RN é
hit-testável por padrão (`pointerEvents: 'auto'`), então ela vira o alvo, e a busca por
respondedor **sobe** a partir dela — nunca chega à borda, que é irmã em outra subárvore.

**"Inócuo no toque" agora está testado onde poderia falhar.** Continua verdadeiro, e
continua frágil pelo mesmo motivo: qualquer `zIndex`, `elevation` ou reordenação de irmãos
na barra do V1 inverte o resultado sem aviso, e o sintoma seria "o auto-scroll virou
música anterior" no meio de um show.

**E aparece um efeito colateral que não é da sobreposição**: a faixa `y 1249..1465` é
**inerte** onde não há controle — 24,0 dp na borda esquerda da barra, 12,0 dp entre os dois
primeiros controles e **170,7 × 84,0 dp** à direita do último. Num palco em que o polegar
mira os 15% laterais, os 24 dp da esquerda e os 170,7 dp da direita são exatamente onde o
dedo cai quando erra para baixo — e ali não acontece nada.

**4. O Tab S6, sem um único comando no tablet.** Método: `sips` para as dimensões e
`magick <img> -crop 1x1600+20+0 +repage txt:` para achar as fronteiras por cor, nas
capturas de `docs/native/N1-anexos/`.

| | AVD `octavia_tab32` | **Tab S6 SM-T865** |
|---|---|---|
| resolução | 2560×1600 | 2560×1600 |
| fim do `barraTopo` (hairline `#2A2836`) | y = 198 px | y = 198 px |
| topo do `barraBaixo` (hairline) | y = 1249 px | **y = 1276 px** |
| **fim do app** (→ `#E8E7E8`) | y = 1465 px | **y = 1492 px** |
| barra de status | 24,0 dp | 24,0 dp |
| **barra de tarefas** | **60,0 dp** | **48,0 dp** |
| **altura útil da janela** | **627,1 dp** | **639,1 dp** |
| `meio` real | 467,1 dp | **479,1 dp** |
| `alturaConteudo` calculado | 551,1 dp | 551,1 dp |
| **transbordo** | **84,0 dp** | **72,0 dp** |

**Os dois aparelhos têm barra de tarefas e os dois têm o transbordo.** A diferença é só o
tamanho da barra de tarefas. E a captura `PR8-da-easy-palco.png` mostra o `auto-scroll`
do Tab S6 no mesmo lugar, sob a mesma borda.

**5. Qual correção, se o Marcel decidir consertar [r3].** O revisor propôs duas e
recomendou a (b); **concordo, e a evidência torna a (a) pior do que "depende de quem
aplica"**. Com o `SafeAreaView` da raiz já consumindo os quatro insets, a altura que chega
ao palco não tem mais inset dentro dela. Um `height − insets.top − insets.bottom` acerta
**hoje** por coincidência aritmética — `711,1 − 24,0 − 60,0 = 627,1`, e `627,1 − 160 =
467,1` ✓ — mas acerta porque a raiz consome exatamente esses dois. Troque `edges` para
`['top']` e a fórmula (a) passa a subtrair um inset que ninguém aplicou. É a mesma classe
da lição (e) do N1: *o requisito passa, a razão dele não*.

**(b) `onLayout` no `meio`** mede a altura que a View de fato recebeu, seja quem for que
tenha consumido o quê acima dela. Custo: um estado e um render extra na montagem —
irrelevante fora do caminho de navegação (o A17 mede a troca de música, que não remonta o
palco). **Recomendação: (b), nos dois arquivos** (`StageScreen` e `EndScreen`).

**Não corrigi nada.** É divergência 16, origem **D**, e vira a pergunta Q8 (§10).

### 3.4b O A14 está falso desde o N1, na metade "entre as barras" **[r3]**

O A14 do PRD §10 diz, verbatim: *"Avançar/voltar pela borda (≥ 48 px, **15% laterais da
área de conteúdo, entre as barras superior e inferior** (D-1, design 2026-09-08))"*. É o
D-1, a decisão do Marcel de 2026-09-08.

**A metade "≥ 48 px" é verdadeira**: a borda mede 170,7 dp de largura, com folga de 3,5×.
**A metade "entre as barras" é falsa**: a borda mede **551,1 dp** de altura onde a área
entre as barras tem **467,1 dp** — ela cobre os 96 dp da `barraBaixo` quase inteiros
(84,0 dp) e ainda 24 dp acima do que devia, no AVD; no Tab S6, 72,0 dp.

**Por que passou no N1**: o A14 foi provado por **tap no centro** da borda e por
**screencap** (`PR7-a14-*`), e nenhum dos dois instrumentos olha a **extensão** do alvo
contra as barras. O `uiautomator dump` olha — e não foi usado para o A14. É o mesmo padrão
da lição (d) do N1: *um instrumento pode medir a coisa errada e mesmo assim dar verde.*

Origem **D** (divergência 24). **Não é defeito de comportamento hoje** (§3.4 item 3: o
toque nunca chega à borda dentro da barra), e por isso não invalida o veredito do N1 —
mas o texto do aceite afirma uma geometria que a geometria não tem, e o V1 é quem mexe
nessa barra.

### 3.5 Os controles não estão em posição fixa **[r2]**

T1-R27: *"controles em posição fixa"*. Medido nos mesmos dois dumps:

| testID | texto (x1…x2 dp) | partitura (x1…x2 dp) | deslocamento |
|---|---|---|---|
| `auto-scroll` | 24,0…130,2 | 24,0…**158,7** | +0,0 (cresce à direita) |
| `zoom-menos` | 142,2…248,0 | 170,7…276,4 | **+28,4 dp** |
| `zoom-mais` | 260,0…366,2 | 288,4…394,7 | **+28,4 dp** |
| `tema` | 378,2…484,0 | 406,7…512,4 | **+28,4 dp** |
| `indice` | 496,0…602,2 | 524,4…630,7 | **+28,4 dp** |
| `busca` | 614,2…720,0 | 642,7…748,4 | **+28,4 dp** |
| `sair` | 732,0…838,2 | 760,4…866,7 | **+28,4 dp** |

**Seis dos sete andam 28,4 dp.** A causa é o `auto-scroll`: `minWidth: 106` mais o texto
do `motivo` ("auto-scroll só em texto") o levam a 134,7 dp, e o `flexDirection: 'row'` da
barra empurra todo o resto. A largura total da barra vai de **814,2 dp** (texto) para
**842,7 dp** (partitura).

O `zoom-menos` também ganha motivo na partitura ("pinça para zoom") e **não** cresce — o
`minWidth: 106` já o comporta. Só o rótulo mais longo estoura.

**Desvio que já existe, origem D.** No palco às cegas, o dedo que decora "o terceiro botão
é Zoom +" erra por 28 dp quando a música é partitura. Vira requisito do brief: **largura
fixa por controle, com o motivo dentro da mesma área** (ou fora da barra).

---

## 4. Fase A1 — os estados capturados

### 4.1 Elegibilidade de reaproveitamento (`git log <sha-da-pr>..origin/main -- <arquivo>`)

| Arquivo da tela | desde #285 | #286 | #287 | #288 | **desde #289 (`c2fa635`)** | **desde #290 (`6a9315d`)** |
|---|---|---|---|---|---|---|
| `LoginScreen.tsx` | — | — | — | — | **0 (vazio)** | 0 |
| `SetlistsScreen.tsx` | 3 | — | — | — | 1 | 0 |
| `IndexScreen.tsx` | — | 1 | — | — | **0** | 0 |
| `StageScreen.tsx` | — | 4 | 3 | 2 | 1 | 0 |
| `SearchScreen.tsx` | — | — | — | **0** | **0** | 0 |
| `EndScreen.tsx` | — | **0** | — | — | **0** | 0 |

Só **uma** captura antiga foi reaproveitada, e está declarada abaixo. Todo o resto foi
capturado agora — porque `SetlistsScreen` e `StageScreen` mudaram depois de toda captura
que os mostrava (a #290 mexeu nos dois: `fitPolicy`, mensagem de erro, promoção).

> **Registro que o método exige**: a captura `PR3a-screencap-1-s0.png` (#284) **não** é
> reaproveitável, e a mudança é justamente visual — o único commit posterior trocou
> `logo-octavia.png` por `logo-octavia-dark.png` (a divergência 22 do N1: retângulo
> `#100E16` visível sobre `#100F16`). **A captura que serve é `PR7-a2-token-forjado.png`,
> da #289**, e essa sim é reaproveitável: `LoginScreen.tsx` e `apps/native/assets/`
> têm **0** commits de `c2fa635` até `origin/main`.

### 4.2 Capturados na rodada 1 — 12 estados

Todos no AVD `octavia_tab32`, conta de audit, **avião ON** (logo, **zero request a prod**),
exceto o S1b. Cada `.png` acompanhado do `.xml` do dump que o mediu.

| ID | arquivo | como foi alcançado | custo em prod |
|---|---|---|---|
| **S1b** | `V1-estado-S1b-normal-online.png` | avião OFF + `force-stop` + deep link → `sync ok setlists=3 content=67 pages=1 t=4010` | **2 requests** |
| **S1c** | `V1-estado-S1c-offline-com-cache.png` | avião ON, abertura → `sync skip reason=offline` | 0 |
| **S2** | `V1-estado-S2-indice.png` | tap no cartão `UX-AUDIT SHOW PADRÃO` | 0 |
| **S3 texto** | `V1-estado-S3-texto.png` | `song-3` (Letra) → "3 DE 8" | 0 |
| **S3 claro** | `V1-estado-S3-claro.png` | tap em `tema` | 0 |
| **S3d PDF** | `V1-estado-S3d-pdf.png` | `song-1` = Partitura de 12 páginas, do disco → `página 1 de 12` | 0 |
| **S3e** | `V1-estado-S3e-arquivo-nao-baixado.png` | **sem destruir nada**: a biblioteca tem 5 content com `file_url` e **2 estão no disco** (C4); abrir `ux-audit-fase-d-offline.pdf` avulso em avião dá o placeholder real | 0 |
| **S3 avulsa** | `V1-estado-S3-avulsa.png` | palco → busca → abrir resultado fora da setlist → barra mostra `AVULSA`, `Sair` vira `Voltar` | 0 |
| **S4a vazia** | `V1-estado-S4a-busca.png` | tap em `busca` | 0 |
| **S4a resultados** | `V1-estado-S4a-resultados.png` | termo `aguas` → 2 hits | 0 |
| **S4b** | `V1-estado-S4b-nada-encontrado.png` | termo `xablau` | 0 |
| **S5** | `V1-estado-S5-fim-setlist.png` | `song-8` → borda direita → `FIM DA SETLIST` | 0 |

Método do S3e vale registrar porque é **mais barato que a fixture do N1**: o cache de
`content.json` do device tem 5 itens com `file_url`
(`ux-audit-fase-d-offline.pdf` ×2, `ux-audit-fase-d-cifra.pdf`, `partitura-12p`,
`partitura-1p`) e o disco tem **dois**. Qualquer dos outros **três**, aberto avulso em
avião, produz o S3e com dado real.

**[C4] Correção da rodada 1.** A frase original dizia "o disco tem **um**". Era "um em
`Paths.document`" — há um segundo em `Paths.cache`, que é purgável e que a rodada 1 não
inspecionou:

```
$ run-as rocks.octavia.app ls -l files/octavia-<uid>/files/
-rw------- 242176  1786218429715-ux-audit-partitura-12p.pdf    ← Paths.document (garantido)
$ run-as rocks.octavia.app ls -l cache/octavia-<uid>/files/
-rw-------  20821  1786218427769-ux-audit-partitura-1p.pdf     ← Paths.cache (purgável)
```

**A captura sobrevive**: o arquivo aberto para o S3e é o `ux-audit-fase-d-offline.pdf`, e
ele não está em **nenhum** dos dois diretórios — o placeholder é real e a evidência vale.
O que estava errado era a **contagem que justifica o método**, e um método justificado por
número errado é o tipo de coisa que se copia para o bloco seguinte. É a distinção que o
N1-D6/N0-H16 §4 fixou (`Paths.document` × `Paths.cache`) e que a própria div. 22 desta
rodada mediu do outro lado: **"no disco" é ambíguo neste app, e os dois diretórios contam**.

### 4.3 Capturados na rodada 2 — os 5 que a rodada 1 deu por perdidos **[r2]**

A rodada 1 disse que S1a, S1d, S1e, S1f e o placeholder inválido exigiam `pm clear` e,
portanto, a senha do Marcel. **Estava errado, e o revisor apontou o porquê**: o A19 da
#289 já tinha alcançado o S1d com "store apagado por `run-as`", e a sessão sobreviveu.

**A hipótese do revisor é verdadeira, medida** (div. 19): o cache JSON do `store.ts`
(`Paths.document/octavia-<uid>/*.json`) e a persistência do Firebase Auth são
**armazenamentos distintos**. Apagar o primeiro não toca o segundo. Prova: depois de
**três** apagamentos e **duas** substituições do cache, a reabertura final dá

```
OCTAVIA: auth uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 src=restored
OCTAVIA: cache hit kind=setlists n=3
OCTAVIA: cache hit kind=content n=67
```

**Zero `pm clear`. Zero senha. Zero request a prod** — a base da API apontou para o mock
local o tempo todo (`EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline, método do
N1 §8), e os estados offline rodaram em avião.

**O que o `aceite.py` já sabia fazer** (lido inteiro, 273 linhas): ele **já é** um mock
HTTP de `/api/setlists` e `/api/content`, com os modos `429`, `500-pagina-1`,
`500-pagina-2`, `id-repetido` e normal, mais as fixtures de cache `bis`, `data-amanha`,
`invalidos-content`, `invalidos-songs` e `content-ausente`. **Quatro dos cinco estados não
custaram uma linha de código.** Faltava só um modo `atraso` para o S1a — **sete linhas**,
escritas apenas em scratch (`/tmp/.../r4/aceite-v1.py`); versionar ou não é decisão da
V1-PR1.

**Protocolo, com prova em cada passo** — anexo
[`V1-R4-estados-sem-pmclear.txt`](V1-PRECHECK-anexos/V1-R4-estados-sem-pmclear.txt):

```
sha256 ANTES (run-as sha256sum):
  d27e6d84…  content.json          925e4f35…  files-index.json
  0a3a0638…  setlists.json         ad2eae09…  files/1786218429715-ux-audit-partitura-12p.pdf
backup:  run-as … 'mkdir -p files/v1-backup && cp -r files/octavia-<uid>/. files/v1-backup/'  → BACKUP-OK
… os cinco estados …
restauro: run-as … 'cp -r files/v1-backup/. files/octavia-<uid>/ && rm -rf files/v1-backup'  → RESTAURADO
sha256 DEPOIS:
  d27e6d84…  content.json          925e4f35…  files-index.json
  0a3a0638…  setlists.json         ad2eae09…  files/1786218429715-ux-audit-partitura-12p.pdf
  → OS QUATRO IDÊNTICOS
```

| ID | arquivo | método | logcat que prova |
|---|---|---|---|
| **S1a** | `V1-estado-S1a-sincronizando-sem-cache.png` | store apagado + mock `atraso` (45 s) | `sync start` **sem** `cache hit` — é isso que o separa do S1b |
| **S1d** | `V1-estado-S1d-offline-sem-cache.png` | store apagado + avião | `net offline` · `sync skip reason=offline`, sem `cache hit` |
| **S1e** | `V1-estado-S1e-falha-com-cache.png` | cache real + mock `500-pagina-1` | `api status=500 path=/api/content` · `sync fail stage=content page=1 code=INTERNAL_ERROR status=500` |
| **S1f** | `V1-estado-S1f-vazia-apos-sync.png` | mock normal com `setlists: []` | `cache write kind=setlists n=0` · `sync ok setlists=0 content=0 pages=2 t=194` |
| **S3 inválido** | `V1-estado-S3-placeholder-invalido-nobody.png` | fixtures `invalidos-content` + `invalidos-songs`, em avião | `cache hit kind=content n=70` · `index jump n=9` · **`placeholder kind=no-body`** |
| **S2 c/ inválidos** | `V1-estado-S2-com-invalidos.png` | (bônus do mesmo passo) | o índice mostra "sem conteúdo" na posição 9 |

**Um achado que só o S1e revelou**: o `tentar-banner` mede **130,7 × 22,7 dp** — o quinto
alvo abaixo de 48 dp (div. 18). Ele não existia em nenhum estado da rodada 1.

### 4.4 O que continua não reproduzido — 1

| ID | por que não | o que custaria |
|---|---|---|
| **S0** login | a sessão de audit está viva e **não há botão de sair** no app; deslogar exigiria `pm clear`, e re-logar exige **senha**, que a automação nunca digita (regra do N0). Diferente dos cinco acima, **o S0 não depende do store**: depende da ausência de sessão do Firebase, e essa o `run-as` não desfaz sem apagar tudo. | **reaproveitar [`N1-anexos/PR7-a2-token-forjado.png`](N1-anexos/PR7-a2-token-forjado.png)** (#289): `LoginScreen.tsx` e `apps/native/assets/` têm **0** commits de `c2fa635` até `origin/main`. Custo zero, e é a captura certa (a do #284 mostra o logo velho — §4.1). **[V1-PR0] O arquivo NÃO é copiado para `V1-PRECHECK-anexos/`**: ele já está commitado no seu bloco de origem, e duplicá-lo criaria duas cópias que podem divergir. O brief do Claude Design o recebe por este caminho |

**Um só, e com saída grátis.** A rodada 1 listava seis.

---

## 5. Fase A2/A3/A4 — código, instrumento e contraste

### 5.1 A2 — inventário de código

Anexo: [`V1-A2-inventario-codigo.txt`](V1-PRECHECK-anexos/V1-A2-inventario-codigo.txt).

**(a) Literais usados como glifo ou pseudo-ícone** (comentários removidos por parser,
não por `grep`):

| Glifo | onde | tamanho medido |
|---|---|---|
| `✓` `◔` `✗` | `SetlistsScreen.tsx:67-69` — o indicador de garantia offline (T1-R17) | **12 × 30 dp** no dump |
| `◂` | `IndexScreen.tsx:126` e `SearchScreen.tsx:183` — voltar / fechar busca | alvo **40 × 57,8 dp** |
| `−` | `StageScreen.tsx:521` — `rotulo="Zoom −"` | dentro de um alvo de 105,8 dp |
| `·` | 12 ocorrências — separador de metadados (S1, S2, S3, S4, S5) | tipográfico, não alvo |
| `—` | `StageScreen.tsx:436`, `IndexScreen.tsx:76` — "sem título"/"sem tipo" | tipográfico |
| `…` | `carregando…`, `sincronizando…`, `Baixando…` | tipográfico |

**Controles só-texto candidatos a ícone** — 15, todos com `testID`:
7 na barra do palco (§3.3) · `voltar` e `buscar` no S2 · `fechar-busca` e `apagar` no S4 ·
`buscar` e `tentar` no S1 · `voltar-inicio` e `sair` no S5.

**(b) 19 `<Pressable>`** em 6 telas. A dimensão vem de: `styles.controle`
(`minWidth: 106, height: touch.stage + 2`), `styles.borda` (calculada em runtime:
`larguraBorda` = 15% × largura, `alturaConteudo` entre as barras — o D-1), `styles.cartao`,
`styles.botaoPrimario`/`botaoSecundario`, `styles.item`, e — nos quatro reprovados — de
padding implícito, sem nenhum `height` mínimo.

**(c) Cor fora do `theme.ts`: ZERO.**

```
$ grep -rnE '#[0-9A-Fa-f]{3,8}\b' src/ --include='*.ts' --include='*.tsx' | grep -v '^src/theme.ts'
  (nenhum)
$ grep -rn 'rgba\?(' src/
  (nenhum)
```

**`fontSize` fora de `size`: 18 ocorrências** — `13` (×6), `20` (×5), `12` (×3), `10`, `24`,
`44`. E um tracking literal: `letterSpacing: 12 * 0.04` (`StageScreen.tsx:773`) fora do
`tracking`. **Este é o débito de token que o V1 herda**: a paleta está disciplinada, a
escala tipográfica não.

**(d) Baseline G2**: **40** `testID` (37 literais + 3 dinâmicos), em 6 arquivos. Conjunto
completo no anexo.

**(e) Baseline G3**: **48** linhas `log(` fora de `log.ts`, em 11 arquivos
(`StageScreen` 17 · `api` 7 · `prefetch` 5 · `sync` 5 · `store` 4 · `files` 3 ·
`Index`/`Search` 2 · `net`/`End`/`Login` 1).

**(f) Tema por tela** — e a resposta à segunda metade da pergunta:

| Tela | como renderiza |
|---|---|
| S0, S1, S2, S4, S5, `navigation.tsx` | **escuro fixo** — `dark.*` dentro do `StyleSheet` (11 a 20 usos cada), zero `colors[tema]` |
| **S3** | **`colors[tema]`** — `const cor = colors[tema]` (linha 238), 26 usos: `text` 7, `muted` 9, `line` 5, `accent` 2, `bg` 2, `error` 1 |

**As duas barras do S3 SEGUEM o tema do conteúdo**: `styles.tela` recebe
`backgroundColor: cor.bg`, `barraTopo` recebe `borderBottomColor: cor.line` e
`barraBaixo` recebe `borderTopColor: cor.line`; cada `Controle` recebe `cor` por prop.
**Uma exceção medida**: `pontoOffline` é `dark.offline` estático (div. 8).

**(g) Ordem do S1**: `data={setlists}`, **sem `sort` no cliente**. Vem do servidor:
`app/api/setlists/route.ts:38` → `.order('created_at', { ascending: false })`, e
`docs/api/SETLISTS.md:57` diz "Ordem: setlists por `created_at desc`". **Não é
`performance_date`** (div. 13).

### 5.2 A3.1 — a varredura do A20 do N1, reproduzida

```
$ sh a20.sh
arquivos varridos: 7
props/alvos: <Text>…</Text> · placeholder= · rotulo= · titulo: · apoio: · motivo=
vocabulário: 38 termos
--- literais que casam com o vocabulário inglês:
literais casando: 0
```

Reproduz o resultado do anexo do PR7 (`literais casando: 0`).

### 5.3 A3.2/A3.3 — o que ela NÃO cobre, e o desenho da estendida

**Props que levam texto ao usuário e ficam de fora, contagem de hoje:**

| Prop | ocorrências hoje |
|---|---|
| `accessibilityLabel` | **1** (`LoginScreen.tsx:71`, `"Octavia"` — o logo) |
| `accessibilityHint` | **0** |
| `accessibilityValue` | **0** |
| `Alert.alert(` | **0** |

**É exatamente aqui que o V1 abre o buraco**: hoje o rótulo textual É a acessibilidade.
**[r2, corrigido]** No S3 o rótulo **fica** — é decisão do Marcel e o prompt do V1 a
repete ("mantendo posição, alvo de 64 dp e rótulo textual"). O buraco é outro, e é pior
por ser menos óbvio: (i) fora do S3 há controles que **podem** ficar só-ícone (`voltar`,
`fechar-busca`, `apagar` — os três já reprovam o alvo de 48 dp e são os candidatos
naturais), e esses dependem inteiramente do `accessibilityLabel`; (ii) **no S3 o glifo
entra ao LADO do rótulo, e o `content-desc` do controle é a concatenação dos filhos** —
medido: `content-desc="Auto-scroll, auto-scroll só em texto"`. Um `<Text>` com o glifo
vira mais um item dessa lista, e o TalkBack lê o codepoint de uso privado. Nos dois casos
a varredura do N1 acusaria **zero**. Detalhe e instrumento em §7.6(a).

**Desenho da varredura estendida (G4)** — implementação é da V1-PR2; o código do desenho
está no anexo [`V1-A3-instrumento-a20.txt`](V1-PRECHECK-anexos/V1-A3-instrumento-a20.txt).
Três diferenças:

1. cobre `accessibilityLabel`, `accessibilityHint` e `Alert.alert(`;
2. **distingue nome de glifo de texto de UI por POSIÇÃO, não por conteúdo**: `name="zoom-in"`,
   `glyph:`, `icone:`, `icon:` são posições ISENTAS por construção. `"zoom-in"` numa
   `accessibilityLabel` continua sendo acusado; `"zoom-in"` num `name=` nunca é;
3. carrega uma **lista fechada de anglicismos do produto**, ancorada no design congelado
   e no A20 do N1 (`setlist`, `auto-scroll`, `zoom`, `email`, `tab`, `offline`, `pdf`, `online`).

**Controle negativo — e o defeito que ele achou.** O arquivo de scratch tem quatro casos:
(1) `accessibilityLabel="Zoom in"`, (2) `accessibilityHint="Go back to the previous song"`,
(3) `<Icon name="search"/>` e `name="pause"`, (4) `accessibilityLabel="Ampliar o texto"`
com `<Text>Auto-scroll</Text>` e `<Text>SETLISTS</Text>`.

Na **primeira** versão o gate acusou só o (2):

```
ACUSADO cn-a20/src/Falso.tsx:13 [accessibilityHint] "Go back to the previous song" ← termo "back"
acusações: 1
```

O (1) escapou porque a isenção apagava `zoom` **antes** de casar, e `"Zoom in"` virava
`" in"`. Corrigido: casa contra o literal **original**, termo mais longo primeiro, e só
então pergunta se o termo casado é anglicismo do produto.

```
$ node a20-estendido.mjs cn-a20/src
  ACUSADO …Falso.tsx:9  [accessibilityLabel] "Zoom in" ← termo "zoom in"
  ACUSADO …Falso.tsx:13 [accessibilityHint]  "Go back to the previous song" ← termo "previous"
  acusações: 2   exit=1
$ node a20-estendido.mjs src          # o código real
  literais em posição de texto examinados: 40
  acusações: 0   exit=0
```

Acusa (1) e (2), **e só elas**; isenta (3) e (4); fica em 0 no código real.

### 5.4 A4 — contraste WCAG, os dois temas

Anexo: [`V1-A4-contraste.txt`](V1-PRECHECK-anexos/V1-A4-contraste.txt). Só os pares que o
código **de fato** usa (A2c/f). Mínimo: texto 4,5:1 (AA); não-texto 3:1 (1.4.11).

**Tema escuro — o padrão de TODAS as telas:**

| razão | par | papel | veredito |
|---|---|---|---|
| 17,57 | `text` / `bg` | texto | ok |
| 7,93 | `muted` / `bg` | texto | ok |
| 5,29 | `accent` / `bg` | texto e borda ativa | ok |
| 5,94 | `error` / `bg` | texto e borda | ok |
| 6,95 | `offline` / `bg` | chip, `◔`, ponto | ok |
| **1,32** | `line` / `bg` | hairline e borda de cartão | **abaixo de 3:1** |

**Tema claro — só o S3 (T1-R32):**

| razão | par | papel | veredito |
|---|---|---|---|
| 16,96 | `text` / `bg` | texto | ok |
| 5,94 | `muted` / `bg` | texto | ok |
| **3,20** | `accent` / `bg` | **texto** (nº de posição, destaque) | **abaixo de 4,5** |
| 3,20 | `accent` / `bg` | não-texto (borda ativa do `Controle`) | ok, por 0,20 |
| **2,86** | `error` / `bg` | texto **e** borda | **abaixo dos dois mínimos** |
| **2,44** | `offline` / `bg` | ponto de 8×8 dp (via `dark.offline`, div. 8) | **abaixo de 3:1** |
| **1,38** | `line` / `bg` | hairline e borda | **abaixo de 3:1** |

**As quatro hipóteses do revisor: CONFIRMADAS, as quatro, ao centésimo.**
`#F9F5F1`/`#777CE8` = **3,32** · claro `#777CE8` = **3,20** · `#E5686F` = **2,86** ·
`#C9923B` = **2,44**.

**Leitura, com a ressalva que o método exige:**

- O `line` reprovando 3:1 nos dois temas **não é defeito hoje**: a hairline é decorativa,
  e nenhum alvo depende dela para ser percebido (todo controle tem rótulo textual).
  **Vira requisito no V1**: se a borda do `Controle` passar a ser o único delimitador de
  um ícone sem rótulo, ela entra no 1.4.11 e `#2A2836` (1,32:1) não serve.
- `accent` a 3,20 no claro é **suficiente para ícone** (3:1) e **insuficiente para texto**
  (4,5). Isso *favorece* a iconografia, e é o argumento mais forte a favor do V1 no S3
  claro — mas proíbe usar `accent` em texto pequeno no tema claro.
- `error` a 2,86 no claro reprova **nos dois papéis**. O S3 usa `cor.error` em uma
  mensagem (`download-erro`). É o único par do tema claro que já hoje está errado em
  texto e continuará errado em ícone.

---

## 6. Fase B — as quatro opções, medidas

Tudo em scratch fora do repo. **`package.json` e `pnpm-lock.yaml` intocados** (`git status`
do worktree e do checkout principal: limpos). Anexos
[`V1-B1-expo-vector-icons.txt`](V1-PRECHECK-anexos/V1-B1-expo-vector-icons.txt) e
[`V1-B-opcoes-icone.txt`](V1-PRECHECK-anexos/V1-B-opcoes-icone.txt).

### 6.1 Aparato comum (B5)

**B5(i) — últimos 10 runs de `native.yml`:**

| runId | evento | branch | duração |
|---|---|---|---|
| 34610061441 | push | main | 8m58s |
| 34602544498 | pull_request | n1/pr8-correcoes | 11m41s |
| 34599949499 | push | main | 12m23s |
| 34597905011 | pull_request | n1/pr7-aceite | 11m43s |
| 34541666142 | push | main | 11m18s |
| 34535253485 | pull_request | n1/pr6-busca | 10m18s |
| 34533092029 | push | main | 9m00s |
| 34526729763 | pull_request | n1/pr5-pdf-arquivos | 11m48s |
| 34522240072 | push | main | 13m27s |
| 34517017178 | pull_request | n1/pr4-palco-texto | 11m25s |

Todos `success`. **São RUNS**, as duas populações misturadas — a distinção que o
N1 §5 fez. O **job** `android-debug-apk` do último run verde da main mediu **534 s**.
**Nota do D-g**: as PRs #291 e #292 (docs e `.gitignore`) **não dispararam** o gate, o que
é correto mas **não discrimina** — nenhuma das duas toca `packages/core/**` nem o lock.
A prova do D-g continua em aberto, exatamente como o N1 §5 deixou.

**B5(ii) — o APK ANTES**: run `34610061441`, `headSha` = `6a9315d` (#290).

```
$ gh run download 34610061441 -n app-debug.apk
  artefato (zip): 84.533.696 B · apk: 215.354.003 B
  sha256: e90eb64a9089f728b67edb448c2e91de5c48b513a6743d4604b6f7e4741f4c46
$ unzip -l app-debug.apk | grep -iE '\.ttf|\.otf'
   133796  assets/fonts/IBMPlexMono_400Regular.ttf
   138448  assets/fonts/IBMPlexMono_600SemiBold.ttf
    96832  assets/fonts/Manrope_400Regular.ttf
    96936  assets/fonts/Manrope_600SemiBold.ttf
   163852  assets/fonts/Raleway_500Medium.ttf
   163856  assets/fonts/Raleway_600SemiBold.ttf
   344028  res/font/inter_bold.ttf
   342936  res/font/inter_medium.ttf
   342732  res/font/inter_regular.ttf
   343640  res/font/inter_semibold.ttf
   276452  res/font/jetbrains_mono_light.ttf
   273860  res/font/jetbrains_mono_medium.ttf
   273900  res/font/jetbrains_mono_regular.ttf
  assets/fonts (os 6 do N1-D6): 793.720 B      ← bate exato com o N1-D6
  res/font (7, do expo-dev-menu, só debug): 2.197.548 B
$ unzip -l app-debug.apk | grep -ci svg   →  0      ← controle negativo
  ABIs: arm64-v8a, armeabi-v7a, x86, x86_64   ·   1357 arquivos
```

O `grep -ci svg → 0` é o **controle negativo de "o ícone está no APK"**: hoje não há
nenhum vestígio de `react-native-svg` no build.

**B5(iii) — o dev client instalado no emulador:**

```
versionName=0.0.1  versionCode=1  targetSdk=36
firstInstallTime=2026-09-10 11:42:54   lastUpdateTime=2026-09-10 13:12:15
base.apk: 76.836.083 B   sha256 cb1b5fea0240e185ee8ff7e81d2eb790a13a21e12ffb5613c94e86e9e7963c8f
primaryCpuAbi=arm64-v8a
```

**Não é o artefato do CI** (215 MB, 4 ABIs; este tem 1). É build local
(`expo run:android`) de 2026-09-10 13:12, do intervalo #285/#286. Serve para o JS de hoje
porque **a superfície nativa não muda desde a #284** — e é por isso que este pre-check
conseguiu rodar o app de hoje contra o dev client de anteontem.

### 6.2 B1 — `@expo/vector-icons`

**(i) Não resolve.**

```
$ node -e "require.resolve('@expo/vector-icons/package.json',{paths:['apps/native']})"
RESOLVE FALHOU: MODULE_NOT_FOUND
$ pnpm --filter native why @expo/vector-icons        → (saída vazia, exit 0)
$ grep -c '@expo/vector-icons' pnpm-lock.yaml        → 0
$ cat .npmrc                                          → (vazio → pnpm isolado)
$ node -e "Object.keys(require('./apps/native/node_modules/expo/package.json').dependencies)"
  … 24 deps, nenhuma de ícone …
```

**(ii)** `bundledNativeModules.json` do `expo@57.0.20`: `"@expo/vector-icons": "^15.0.2"`.

**(iii) Como carrega a fonte** (verbatim):

```js
// build/Feather.js
import createIconSet from './createIconSet';
import font from './vendor/react-native-vector-icons/Fonts/Feather.ttf';
import glyphMap from './vendor/react-native-vector-icons/glyphmaps/Feather.json';
export default createIconSet(glyphMap, 'feather', font);

// build/createIconSet.js
import * as Font from 'expo-font';
…
state = { fontIsLoaded: Font.isLoaded(fontName) };
async componentDidMount() {
  if (!this.state.fontIsLoaded) { await Font.loadAsync(font); … }
}
render() { … if (!this.state.fontIsLoaded) { return <Text />; } … }
```

O `.ttf` é **asset do Metro**, carregado em **runtime** por `Font.loadAsync`. Enquanto não
carrega, o componente renderiza **`<Text />` vazio** — buraco no lugar do ícone.

**(iv) Dá para embarcar pelo plugin do `expo-font` e não carregar em runtime? SIM.**
Dois mecanismos, ambos no código instalado:

```js
// expo-font/build/Font.js
export function isLoaded(fontFamily) { … return isLoadedNative(fontFamily); }
/** Synchronously get all the fonts that have been loaded.
 *  This includes fonts that were bundled at build time using the config plugin … */
export function getLoadedFonts() { return ExpoFontLoader.getLoadedFonts(); }

// expo-font/build/memory.js
export function isLoadedNative(fontFamily) {
  if (isLoadedInCache(fontFamily)) return true;
  const loadedNativeFonts = ExpoFontLoader.getLoadedFonts();
  …
}
```

```js
// @expo/vector-icons/build/vendor/react-native-vector-icons/lib/create-icon-set.js
export default function createIconSet(glyphMap, fontFamily, fontFile, fontStyle) {
  // Android doesn't care about actual fontFamily name, it will only look in fonts folder.
  const fontBasename = fontFile ? fontFile.replace(/\.(otf|ttf)$/, '') : fontFamily;
  const fontReference = Platform.select({ …, android: fontBasename, … });
```

Ou seja: **(1)** `isLoaded()` consulta `getLoadedFonts()`, que a doc do próprio `expo-font`
diz incluir as fontes empacotadas pelo config plugin — se a família já está embarcada,
`componentDidMount` **nunca** chama `loadAsync`; **(2)** no Android a família é o
**basename do arquivo**, que é exatamente o que o plugin produz e o que o app já faz hoje
(`Raleway_600SemiBold.ttf` → `fontFamily: 'Raleway_600SemiBold'`, provado na #284).

**(v)** `Feather.ttf` = **55.596 B**, **287 glifos**. Pacote inteiro 6,4 MB / 19 famílias.
Licença **MIT**.

### 6.3 B2 — `lucide-react-native`

```
$ npm view lucide-react-native peerDependencies version license
peerDependencies = { react: '…', 'react-native': '*', 'react-native-svg': '^12 || ^13 || ^14 || ^15' }
version = '1.45.0'   license = 'ISC'
$ bundledNativeModules.json → "react-native-svg": "15.15.4"
```

**`react-native-svg` NÃO está autolinkado hoje.** Autolinking do community CLI, lido do
`autolinking.json` gerado pelo prebuild — **6** módulos:
`@react-native-async-storage/async-storage`, `expo`, `react-native-blob-util`,
`react-native-pdf`, `react-native-safe-area-context`, `react-native-screens`.
`react-native-svg`: **NÃO**. Lado Expo (`expo-modules-autolinking search -p android`):
18 módulos, nenhum de SVG. E o APK confirma: `grep -ci svg → 0`.

**Consequência dura**: B2 e B4 exigem **rebuild do dev client**, e o aceite no Tab S6
exige **reinstalar o APK no tablet do Marcel** — o que o N1 fez uma vez e custou a
divergência 36 ("o APK do N0 não serve para o bundle do N1").

### 6.4 B3 — fonte própria com subset de glifos Lucide (ISC)

**A API existe no SDK 57.** Assinatura verbatim
(`@expo/vector-icons@15.0.2/build/createIconSet.d.ts`, o par do SDK 57):

```ts
export default function <G extends string, FN extends string>(
  glyphMap: GlyphMap<G>, fontName: FN, expoAssetId: any, fontStyle?: any
): Icon<G, FN>;
```

E o núcleo dela, `createIconSet(glyphMap, fontFamily, fontFile?, fontStyle?)`, com
`fontFile` omitido, é **só um `<Text style={{ fontFamily }}>` com
`String.fromCodePoint(glyphMap[name])`** — 30 linhas reimplementáveis sem dependência
nenhuma.

**Ferramenta escolhida: `fontTools` 4.65.0 (`pyftsubset`)**, num venv dentro do scratch
(nada instalado na máquina fora dele). Fonte de partida: `lucide-static@1.45.0`, que
publica `font/lucide.ttf` (893.964 B, 2.118 ícones) e `font/codepoints.json`.

```
$ pyftsubset lucide.ttf --unicodes=U+E13C,U+E12E,U+E1B6,U+E1B7,U+E151 \
      --output-file=OctaviaIcons.ttf --no-hinting --desubroutinize --drop-tables+=DSIG
  OctaviaIcons.ttf (5 glifos): 2.312 B
```

**Prova (fontTools lendo o cmap do ttf gerado):**

```
  cmap tem 5 codepoints:
    U+E12E -> 'uniE12E'    U+E13C -> 'uniE13C'    U+E151 -> 'uniE151'
    U+E1B6 -> 'uniE1B6'    U+E1B7 -> 'uniE1B7'
    play      U+E13C  no cmap: True
    pause     U+E12E  no cmap: True
    zoom-in   U+E1B6  no cmap: True
    zoom-out  U+E1B7  no cmap: True
    search    U+E151  no cmap: True
  glifos no glyf: 6 · unitsPerEm: 1000 · name ID 1: lucide
```

**Extrapolação para o V1 real** — 20 glifos plausíveis (os 5 acima + `sun`, `moon`,
`list`, `x`, `chevron-left`, `chevron-right`, `arrow-left`, `check`, `circle`,
`circle-dashed`, `download`, `wifi-off`, `refresh-cw`, `alert-triangle`, `log-out`):
**6.788 B**, 20 codepoints no cmap. Licença **ISC**. **Nada disso entra no repo**: os dois
ttf ficaram no scratch.

**O que faz esta opção encaixar**: os 6 ttf do N1-D6 **já são arquivos binários
commitados** em `apps/native/assets/fonts/` (`git ls-files assets/` confirma). Um sétimo
de ~7 KB é **1/14 do menor deles** e usa exatamente o mesmo mecanismo já provado.

### 6.5 B4 — SVG próprio com `react-native-svg`

Custo nativo **idêntico ao B2** (mesmo módulo, mesmo rebuild, mesma reinstalação no
Tab S6). O que difere:

- **não** adiciona `lucide-react-native` (uma dependência a menos, ~2.100 componentes a
  menos no grafo do Metro);
- cada ícone vira um componente escrito à mão — autoria e revisão por ícone, e é onde o
  V1 gastaria o tempo que não tem;
- ganha o que nenhuma fonte dá: **traço de espessura independente do tamanho** e
  **duas cores por ícone**. Nada no design congelado pede isso.

### 6.6 Tabela final

| Opção | módulo nativo novo | rebuild do dev client | como o glifo chega ao device | offline por construção | cobertura | licença | risco |
|---|---|---|---|---|---|---|---|
| **B1a** `@expo/vector-icons`, caminho default | **não** | **não** | ttf como **asset do Metro**, `Font.loadAsync` em runtime | sim (o asset vai no bundle), **mas** renderiza `<Text />` vazio até carregar | 287 (Feather); 19 famílias | MIT | flash de nada na barra do palco; e não é o mecanismo do N1-D6 |
| **B1b** `@expo/vector-icons` **embarcado pelo plugin** | **não** | **SIM** | ttf no APK pelo config plugin, `isLoaded()` já true (6.2 iv) | **sim, por construção** | 287 (Feather) | MIT | dependência nova de 6,4 MB no grafo, da qual só ~56 KB chegam ao APK |
| **B2** `lucide-react-native` | **sim** (`react-native-svg` 15.15.4) | **SIM** | componente React → SVG nativo | sim (é código do bundle) | 2.118 | ISC | a div. 36 do N1 é o precedente |
| **B3** fonte própria (subset Lucide) | **não** | **SIM** | **ttf dentro do APK** pelo plugin do `expo-font` — o caminho N1-D6, já provado | **sim, por construção** — prova: `unzip -l <apk> \| grep OctaviaIcons.ttf` | o que se colocar no subset (5 → 2.312 B; 20 → **6.788 B**) | ISC | exige gerar o ttf e versionar a receita; a família tem de virar `OctaviaIcons` (hoje o `name ID 1` é `lucide`) |
| **B4** SVG próprio | **sim** (`react-native-svg`) | **SIM** | componente React → SVG nativo | sim | autoral | — | o mesmo custo do B2 sem o ganho de catálogo |

**[r2] A coluna "rebuild" da rodada 1 estava errada nas linhas B1-embarcado e B3, e a
correção do revisor procede** (div. 15). O `withFontsAndroid` do `expo-font` copia o ttf
dentro de `withDangerousMod(config, ['android', …])` — mod de **prebuild** — para
`app/src/main/assets/fonts` do projeto Android. Prova no disco: os 6 ttf de
`apps/native/android/app/src/main/assets/fonts/` são de **2026-09-10 13:09**, e o dev
client instalado no AVD tem `lastUpdateTime=2026-09-10 **13:12:15**` — três minutos
depois. A ordem é prebuild → copia o ttf → gradle → APK → install; **não há caminho pelo
Metro**. Anexo [`V1-R1-rebuild.txt`](V1-PRECHECK-anexos/V1-R1-rebuild.txt).

**Quatro das cinco opções exigem rebuild.** O eixo de comparação, portanto, não é
"rebuild × sem rebuild" — é este:

| | módulo de CÓDIGO nativo novo | o que entra no APK | por ABI | mecanismo |
|---|---|---|---|---|
| **B1a** | não | asset JS no bundle | 0 | novo (runtime), não o do N1 |
| **B1b** | **não — só asset** | 1 ttf, ~56 KB | **0** | **o do N1-D6, já provado 6×** |
| **B3** | **não — só asset** | 1 ttf, **~7 KB** | **0** | **o do N1-D6, já provado 6×** |
| **B2** | **sim** (`react-native-svg`) | `.so` + java/kotlin | **× 4** no artefato de CI | novo |
| **B4** | **sim** (`react-native-svg`) | idem | **× 4** | novo |

**APK Δ `[hipótese até o spike]`**: B3 ≈ **+7 KB**; B1b ≈ **+56 KB**; B2/B4 ≈ **+1,5 a 3 MB
por ABI** (as `libs` do `react-native-svg`, × 4 ABIs). Nenhum foi medido — o spike da
V1-PR3 é quem mede, com o `unzip -l` deste pre-check como "antes".

> **[V1-PR0] O Marcel decidiu contra esta recomendação**: a escolha foi **B2/B4
> (`react-native-svg`)**. O eixo da decisão — que não é custo de build — está em §10,
> D-V1-1. A recomendação abaixo fica **como estava**, porque é o que a decisão precisou
> derrubar, e o encerramento do V1 vai querer ler as duas.

**Recomendação: B3, mantida — e o eixo corrigido a reforça em vez de enfraquecer.**
Numa frase: **como TODAS as opções custam o mesmo rebuild, o que as separa é o que entra
no APK e por qual mecanismo — e a B3 é a única que não acrescenta um módulo de código
nativo, custa ~7 KB (independente de ABI) e usa exatamente o caminho `expo-font` que o
N1 já provou seis vezes.** Plano B: **B1b**, mesmo mecanismo por 56 KB e uma dependência
de 6,4 MB no grafo do Metro. **B2/B4 só se o design exigir algo que fonte não faz** — e o
design congelado não exige.

---

## 7. Fase C — recorte, gates, aceites

### 7.1 O recorte final **[V1-PR0]**

| PR | Escopo |
|---|---|
| **V1-PR0** | **este documento** (docs-only) |
| **V1-PR1** | cinco alvos < 48 dp · `testID` nos três cartões do S1 · **geometria por `onLayout` em `StageScreen.tsx` e `EndScreen.tsx`** (Q8) · o mock a commitar (o modo `atraso`, mais o que o R4 mostrar que falta) |
| — | *design fora do repo — fase 2 em andamento* |
| **V1-PR2** | congelamento do `DESIGN-V1/` (docs-only) — é aqui que entram os tokens `error`/`offline` do tema claro (Q6) e a largura fixa por controle (div. 17) |
| **V1-PR3** | **fundação** (`react-native-svg`, componente de ícone, os ícones) + a barra do S3 · spike no 1º commit · **reinstalação no Tab S6** — ver a nota de implementação abaixo |
| **V1-PR4** | S1 (6 estados) |
| **V1-PR5** | S2 |
| **V1-PR6** | S0/S4/S5 |
| **V1-PR7** | aceite (AVD + Tab S6) + encerramento |

#### Nota de implementação da V1-PR3 — `fill="currentColor"`

As partes **preenchidas** dos ícones usam `fill="currentColor"`. No `react-native-svg` isso
resolve pela prop **`color`** do componente, **não** por `stroke` nem por `fill` direto:
sem `color`, o `currentColor` cai no preto do padrão e **noteheads, trastes e pontos
renderizam em preto** sobre o fundo `#100F16` — invisíveis no escuro e errados no claro.
O componente de ícone precisa, portanto, repassar **`color`** (e não só `stroke`) para o
`<Svg>`. É o tipo de defeito que passa em teste unitário e só aparece na tela: registrado
aqui para que o spike do 1º commit da V1-PR3 o cubra explicitamente.

#### A exceção declarada ao recorte — a geometria das bordas **[C5]**

O V1 se declarou **"sem mudança de comportamento"** e **"sem layout do palco"** (§0). A
correção da Q8 viola as duas: ela toca `StageScreen.tsx` e `EndScreen.tsx` e muda a
**altura de um alvo de toque**. **É exceção, declarada aqui antes de qualquer commit, e
não precedente** — o motivo é que **o A14 está falso desde o N1** (§3.4b, div. 24: a borda
mede 551,1 dp onde a área entre as barras tem 467,1), e congelar um design novo por cima
de um aceite falso é o pior momento possível para deixar isso de pé.

Consequências, todas assumidas:

- **o A14 roda de novo**, no AVD **e** no Tab S6 — ele passa a ser o aceite que a mudança
  pode quebrar, não um dispensado;
- **o controle negativo do conserto é o dump**: hoje o `y2` da `borda-voltar` é **1438** e
  o `y2` do `meio` é **1249**; depois do conserto os dois têm de ser **iguais**, e a
  medição é `uiautomator dump` — o mesmo instrumento que achou o defeito, e não o tap no
  centro que o escondeu por um bloco inteiro;
- **os seis taps das zonas mortas mudam de resposta** e é isso que se quer: hoje dão
  logcat vazio porque a `barraBaixo` os engole; depois do conserto a borda não chega mais
  lá, e as regiões 1 a 4 deixam de existir como sobreposição (continuam inertes como
  *chrome* da barra, o que é outro assunto — R13);
- **o A15 e o A17 também rodam** (§7.4 já os listava), porque a barra é o objeto do V1.

### 7.1b A receita do ttf da B3 — **superada pela D-V1-1**, mantida como registro

> **[V1-PR0] Não se aplica mais**: o Marcel escolheu `react-native-svg` (§10, D-V1-1), e
> não há ttf de ícone a gerar. A lista fica porque ela é a medida do que a opção B3
> custaria a manter, e é metade do argumento que a decisão pesou.

Só a lista; nada entrou no repo.

1. **`lucide-static` com versão fixada** — `1.45.0`, exata, não `^`. É a fonte dos glifos e
   dos codepoints; uma versão nova renumera.
2. **O script gerador**, com as flags verbatim (`pyftsubset … --no-hinting --desubroutinize
   --drop-tables+=DSIG`) e a versão do `fontTools` (4.65.0) — sem elas o byte de saída muda.
3. **A lista de nomes → codepoints**, explícita no repositório e não derivada em tempo de
   build (`play → U+E13C`, `pause → U+E12E`, …). É ela que o componente de ícone importa, e
   é o que faz `name="play"` ser verificável.
4. **O `LICENSE` do lucide** (ISC, "Copyright (c) 2026 Lucide Icons and Contributors"),
   copiado junto do ttf — a licença viaja com o artefato.
5. **O sha256 do `OctaviaIcons.ttf` gerado**, para que `regenerar == o que está commitado`
   seja um teste, não uma promessa.
6. **O nome da família**: o subset sai com `name ID 1 = lucide` (medido em §6.4); a receita
   tem de reescrevê-lo para `OctaviaIcons`, que é o basename do arquivo e, no Android, o
   `fontFamily` que o RN resolve.

### 7.2 Os gates — instrumento medido agora + controle negativo

Anexo: [`V1-C-gates.txt`](V1-PRECHECK-anexos/V1-C-gates.txt).

**G1 — invariância de comportamento.** Diff vazio nos arquivos **existentes** de
`packages/core/src` (25 hoje) e nos 9 módulos não-visuais de `apps/native/src`.
"Existentes" = os que já existem na base; arquivo **novo** no core é permitido.

```
$ g1.sh origin/main origin/main
arquivos de packages/core/src existentes na base: 25
G1: DIFF VAZIO ✓                                     exit=0
$ g1.sh 138bf1a 6a9315d            # CONTROLE NEGATIVO: o N1 inteiro
G1: DIFF NÃO VAZIO ✗
   apps/native/src/api.ts | 149 +++…   apps/native/src/files.ts | 273 +++…
   … 9 files changed, 954 insertions(+), 35 deletions(-)      exit=1
```

**G2 — testIDs: antes ⊆ depois.**

```
$ g2g3.sh origin/main WORKTREE
G2 — testIDs  antes=40  depois=40    G2: antes ⊆ depois ✓
$ g2g3.sh 6a9315d 23c00d2          # CONTROLE NEGATIVO: regressão ao estado da PR4
G2 — testIDs  antes=40  depois=25    G2: testID SUMIU ✗
   IndexScreen.tsx testID="buscar" · SearchScreen.tsx testID="apagar" · … (15)
```

**G3 — linhas `log(` idênticas por arquivo.**

```
$ g2g3.sh origin/main WORKTREE
G3 — linhas log( antes=50  depois=50   G3: idênticas ✓
$ g2g3.sh c2fa635 6a9315d          # CONTROLE NEGATIVO: a #290 mexeu no log
G3: DIVERGEM ✗
  > prefetch.ts  log(`prefetch promote n=${aPromover.length}`)
  > StageScreen  log(`rotation=${orientacao} n=…`)
  < sync.ts      log(`sync fail stage=${stage} page=1 …`)
  > sync.ts      log(`sync fail stage=${stage} page=${page} …`)
```

(A contagem 50 do gate inclui as 2 linhas internas de `log.ts`; a baseline de 48 do §5.1
é a de fora dele. Mesmo conjunto, recortes declarados.)

**G4 — A20 estendido**: §5.3. Instrumento provado nos dois sentidos; **o controle
negativo achou um defeito no instrumento antes de o instrumento entrar no repo.**

**G5 — alvos ≥ 48 dp pelo dump.** Baseline **[r3]**, `g5.mjs` sobre os **18** dumps:

```
alvos tocáveis medidos: 116 em 18 estados
ABAIXO de 48 dp: 13 ocorrências / 7 resource-ids — dos quais 5 são reais:
  tentar-banner  130,7 × 22,7 dp   (S1e)
  voltar          40,0 × 57,8 dp   (S2-indice, S2-com-invalidos)
  fechar-busca    40,0 × 57,8 dp   (S4a-busca, S4a-resultados, S4b)
  campo-busca    825,3 × 46,2 dp   (idem; 760,4 × 46,2 com termo digitado)
  apagar          48,9 × 21,8 dp   (S4a-resultados, S4b)
  --- falso positivo do instrumento (div. 21) ---
  song-9         540,9 × 11,1 dp   (S2-com-invalidos)   item de 120 dp RECORTADO
  song-10        540,9 × 11,1 dp   (S2-com-invalidos)   pela viewport da lista
```

**Regra que o G5 do V1 precisa ter [r3, corrigida em C2]**: ignorar o nó **recortado por
qualquer uma das duas bordas** do `ScrollView` pai — `y2` do nó igual ao `y2` do pai
(recorte embaixo, que foi o caso medido) **ou** `y1` do nó igual ao `y1` do pai (recorte
em cima, que tem exatamente o mesmo falso positivo e não foi medido só porque a lista
estava rolada para baixo). A redação da rodada 3 punha a segunda condição entre
parênteses, como se fosse variante da primeira; **são os dois lados, e valem igualmente**.
Sem isso o gate dá falso positivo em toda lista rolada.

**E o S0 fica de fora da baseline [r3]**: sem dump (§4.4), os três alvos da tela de login
são `[hipótese]` e fecham na V1-PR7.

**Controle negativo do G5**: existe e é o próprio baseline — o instrumento já reprova
quatro alvos reais, então ele não é um gate que passa por construção. O controle positivo
é o inverso: os 7 controles da barra do palco (106 × 65,8) e as bordas (170,7 × 551,1)
passam, com margem. **Por isso o G5 tem de ser escrito como delta**, não como absoluto:
*"nenhum alvo novo abaixo de 48 dp, e os 4 conhecidos consertados na V1-PR2b"*.

**G6 — todo estado com ID alcançável.** Instrumento: o `resource-id` do dump (H-V1).
Baseline **[r2]**: **17 de 18 alcançáveis** — os 12 da rodada 1 mais os 5 da rodada 2
(§4.3); só o **S0** fica de fora (§4.4), e com captura reaproveitável. **E 3 alvos sem
`testID`** (div. 10).
Controle negativo: um estado cujo `testID` de âncora foi removido não aparece no dump —
é o mesmo mecanismo que o G2 mede, e o controle negativo do G2 já o exibe (15 `testID`
sumindo ao voltar para a PR4).

### 7.3 Aceites do V1 — lista fechada proposta

| # | Aceite | Instrumento | Controle negativo |
|---|---|---|---|
| **V1-A1** **[C2]** | Todo controle que virou ícone tem alvo ≥ 48 dp, e os **cinco** conhecidos (§3.3) estão consertados. O instrumento **descarta os nós recortados pelas DUAS bordas do `ScrollView` pai** — `y2` do nó == `y2` do pai (embaixo) **e** `y1` do nó == `y1` do pai (em cima) | `g5.mjs` sobre os dumps dos 18 estados, com a regra de recorte dos dois lados | a baseline de hoje, que reprova **5** — e, para o descarte: `song-9` a 11,1 dp no `S2-com-invalidos` (recorte embaixo) tem de **sumir** da lista, enquanto o `campo-busca` a 46,2 dp, que não encosta em borda nenhuma, tem de **permanecer** |
| **V1-A2** | Nenhum `testID` sumiu e os 3 cartões do S1 ganharam um | G2 (`antes ⊆ depois`) + `grep` do novo | `6a9315d × 23c00d2` → 15 somem |
| **V1-A3** | Nenhuma linha `log(` mudou | G3 | `c2fa635 × 6a9315d` → 4 linhas divergem |
| **V1-A4** | Zero diff nos módulos não-visuais e no core existente | G1 | `138bf1a × 6a9315d` → 954 inserções |
| **V1-A5** | Nenhum literal de UI em inglês, **agora incluindo `accessibilityLabel`/`Hint`** | G4 estendido | o `Falso.tsx` de scratch: acusa `"Zoom in"` e `"Go back…"`, isenta `name="search"` |
| **V1-A6** **[emendado na V1-PR0]** | **Todo controle sem rótulo textual tem nome acessível em pt-BR.** Uma medição só: com a D-V1-1 o ícone é **SVG**, não um nó de texto, e **não contamina o `content-desc`** — a metade (ii) da versão anterior (o codepoint de uso privado vazando para a árvore) **deixa de existir por construção** | o `content-desc` do dump: para cada um dos 7 controles do S3 e para os só-ícone das demais telas, `content-desc` = a frase pt-BR do `accessibilityLabel` | um controle sem `accessibilityLabel` → `content-desc` **vazio** no dump, e o gate acusa |
| ~~**V1-A13**~~ **REMOVIDO na V1-PR0** | era "o ícone não escala com a preferência de fonte do sistema" (`allowFontScaling={false}`) | — | **perdeu o objeto com a D-V1-1**: `allowFontScaling` é prop de `<Text>`, e um `<Svg>` não escala com `font_scale`. O risco (b) do §7.6 **some com a decisão**, não é mitigado. Fica o registro de que `grep -rn allowFontScaling src/` dá **0** e o `font_scale` do AVD é `null` — números que valem para o **texto** do app, que continua escalando (e deve) |
| **V1-A14** **[r2]** | A barra do S3 mantém **largura fixa por controle** | os 7 `x1` do dump são idênticos entre uma música de texto e uma partitura | hoje 6 dos 7 andam **28,4 dp** (div. 17) |
| **V1-A7** | Contraste: todo ícone ≥ 3:1 e todo texto ≥ 4,5:1, **nos dois temas** | o script do A4, sobre os pares novos | `#777CE8` em texto no claro (3,20) reprova; em ícone passa |
| **V1-A8** **[emendado na V1-PR0]** | A barra do S3 mantém **os sete controles, na mesma ordem**, alvo **≥ 64 dp**, **largura idêntica entre as variantes** (texto × PDF × avulsa) e **`content-desc` não vazio nos sete**. O design fechou que os sete são **somente ícone, sem rótulo textual** (decisão do Marcel), então o instrumento deixa de ser o `text` e passa a ser o `content-desc` | dump: 7 `resource-id` na ordem `auto-scroll · zoom-menos · zoom-mais · tema · indice · busca · sair`; `height ≥ 64` dp; os 7 `x1` iguais nos três dumps de variante; `content-desc` não vazio nos 7 | um controle sem `accessibilityLabel` aparece com **`content-desc` vazio** — e é exatamente o que aconteceria hoje se o rótulo `<Text>` fosse removido sem pôr o label, porque é o `<Text>` filho que preenche o `content-desc` (§7.6 a) |
| **V1-A9** | Os 18 estados do design são alcançáveis e capturados | G6 | os 6 de hoje que não são (§4.3) |
| **V1-A10** **[emendado na V1-PR0]** | O módulo **`react-native-svg` está no APK** (offline por construção: o ícone é código do bundle mais `.so` nativo, nada vem da rede) | `unzip -l <apk-depois> \| grep -ci svg` → **> 0**, e o autolinking indo de **6 para 7** módulos (`android/build/generated/autolinking/autolinking.json`) | `unzip -l <apk-antes> \| grep -ci svg` → **0** (medido em §6.1), e os 6 módulos autolinkados de hoje |
| **V1-A11** | APK Δ medido e declarado | `unzip -l` antes × depois, `assets/fonts` e `lib/` | o "antes" deste pre-check (215.354.003 B, sha256 `e90eb64a…`) |
| **V1-A12** | A suíte da raiz não regride | `pnpm test` | baseline `768 / 85 (853)` |

### 7.4 Quais dos 22 aceites do PRD precisam rodar de novo **[r2, reescrito]**

A rodada 1 escreveu que "o G1 compra a dispensa de 14 aceites". **Estava errado, e a
correção do revisor procede**: o G1 cobre os módulos **não-visuais**, mas os arquivos de
**tela** também contêm comportamento — `useKeepAwake`, rotação, `requestAnimationFrame`,
navegação, a mensagem derivada do `code`. Um aceite que passa por uma tela redesenhada
tem de rodar de novo, mesmo com o G1 verde.

**A frase certa é: o G1 compra a dispensa de SETE aceites** — os que não tocam pixel
nenhum das telas que o V1 mexe.

| Aceite | Onde | Por quê |
|---|---|---|
| **A3** | AVD | a mensagem do 429 aparece no **banner do S1e**, que é redesenhado |
| **A4** | AVD | "lista visível do cache em < 1 s": o S1 novo é render novo. **[r3] E o mock precisa de conserto antes**: o `_paginas` do `aceite.py` devolve sempre duas listas, então com `N=0` ele anuncia `hasMore:true` na página 1 e o app pede uma página a mais — foi isso, e não um defeito do laço, que produziu o `pages=2 content=0` do S1f (div. 23). **Ver a errata do A4 abaixo** |

#### Errata do PRD §10 — o A4 no conjunto vazio **[C1]**

O A4 diz, verbatim: *"Abertura online: exatamente **1 + ⌈N/100⌉** requests a `/api/*`"*.
Com `N = 0` a fórmula dá **1 + ⌈0/100⌉ = 1**. **O app precisa de 2**, e está certo: uma a
`/api/setlists` e uma a `/api/content` — porque **descobrir que `N=0` custa a request que
devolve `N`**. Não há como o cliente saber que a biblioteca está vazia sem perguntar.

| | fórmula do A4 | o que o app faz | certo |
|---|---|---|---|
| N = 0 | **1** | **2** | o app |
| N = 67 | 2 | 2 | ambos |
| N = 140 | 3 | 3 | ambos |

A fórmula só erra no conjunto vazio, e erra por um. A leitura correta é
**`1 + max(1, ⌈N/100⌉)`**, ou, em português, "uma de setlists mais **pelo menos uma** de
content".

**Isto é errata do PRD, não do mock** — são duas coisas distintas e as duas são verdade:
o `pages=2` que o S1f mostrou é artefato do `_paginas` (div. 23, corrige-se no mock), e a
fórmula do A4 estaria errada com `N=0` **mesmo contra um servidor perfeito**. Nunca
apareceu porque a biblioteca nunca esteve vazia — a conta de audit tem 67 itens e a
principal 63. **O `PRD-TELA-1.md` não é editado nesta PR**: fica registrado aqui e entra
na PR que mexer no PRD, ou no encerramento do V1.
| **A5** | AVD + Tab S6 | passa pelo S1 e pela setlist de 60 no S2 |
| **A6/A8** | AVD (fixture) | o S2 é redesenhado; o chip de tipo e o rótulo de indisponível são dele |
| **A10** | AVD (fixture) | **os três glifos ✓ ◔ ✗ são o coração do redesenho do S1** |
| **A11** | AVD | o S4 é redesenhado inteiro; `fechar-busca` e `apagar` mudam de alvo |
| **A12** | AVD (fixture) | o bis são **duas linhas do S2** |
| **A14** | AVD | o V1 mexe no S2 (salto) e no S5 (fim); e o "n de N" fica ao lado dos ícones novos |
| **A15** | AVD + **Tab S6** | os três controles são da barra que ganha ícone. O tempo se mede no device (div. 37 do N1) |
| **A17** | **Tab S6** | ícone na barra é render novo a cada navegação; latência de frame não se mede no AVD |
| **A16** | **Tab S6** | protocolo: é do device |
| **A19** | AVD | **S1d e S1e são estados redesenhados** |
| **A20** | AVD | o G4 muda de forma; o aceite roda contra a varredura nova |
| **A21** | AVD | a metade "indicador de falha" é o **banner do S1e** |

**Dispensados pelo G1 — sete**: **A1, A2, A7, A9, A13, A18, A22**. São de auth, rede,
cache, sync e arquivo, e o diff vazio nos módulos não-visuais os cobre.

**Ressalva do A2 [r2]**: a tela em que ele termina **é o S0**, que ganha acabamento na
V1-PR6. O G1 dispensa a **lógica** (o `authFetch` e o `n=2`), não a **tela**. Validar o S0
no device exige **um login do Marcel** durante o aceite da V1-PR7 — o mesmo motivo que
deixa o S0 sem captura nova aqui (§4.4). Isso precisa estar combinado antes do aceite, não
descoberto nele.

### 7.5 Riscos nomeados e a prova mais barata de cada um

| # | Risco | Prova mais barata |
|---|---|---|
| R1 | **O ícone some** no device (fonte não embarcada, família com nome errado) | um `<Text style={{fontFamily:'OctaviaIcons'}}>` com **família inexistente** ao lado, screencap: se os dois somem, a fonte não está lá — o contraste que a #284 usou para provar as 6 fontes |
| R2 | **Ícone sem rótulo mata a navegação às cegas** (J1/T1-R27) | V1-A8: o dump tem de continuar mostrando `text` não vazio nos 7 controles |
| R3 | **Contraste do tema claro** reprova o ícone novo (`error` 2,86; `line` 1,38) | o script do A4, antes de desenhar |
| R4 **[r2, corrigido]** | **O rebuild é certo, não condicional** (div. 15): as cinco opções o exigem, porque o ttf entra pelo prebuild. O risco real é **a reinstalação no Tab S6 deslogar ou apagar o cache** da conta principal | `adb install -r` (não `uninstall`+`install`) e, no primeiro logcat depois: `auth … src=restored` **e** `cache hit kind=setlists n=…`. É a prova que a V1-PR3 deve trazer **antes** de o tablet voltar para um show |
| R9 **[r3, ampliado]** | **A borda cobre o `auto-scroll`** (div. 16) e só a ordem dos irmãos a salva — nos **dois** arquivos, `StageScreen` e `EndScreen`. Qualquer `zIndex`/`elevation`/reordenação na barra do V1 inverte o hit test em silêncio | os **oito** taps do §3.4 virados em gate: `(174,1358)` → `autoscroll on`; `(174,800)` → `nav n=`; e as quatro zonas mortas `(174,1265)`, `(20,1360)`, `(306,1360)`, `(2300,1350)` → **logcat vazio**, nunca `nav` |
| R13 **[r3]** | **170,7 × 84,0 dp de área inerte** à direita do último controle, mais 24,0 dp na esquerda da barra e 12,0 dp entre os dois primeiros — onde o polegar cai quando erra para baixo | os mesmos taps: hoje dão vazio. Se o V1 quiser que deem algo, é decisão de design, não conserto |
| R10 **[r2]** | **Os controles andam 28,4 dp** entre texto e partitura (div. 17): com ícone, o dedo às cegas erra o alvo | V1-A14: os 7 `x1` idênticos nos dois dumps |
| ~~R11~~ **EXTINTO pela D-V1-1** | era "escala de fonte: o glifo escalaria a até 2× dentro de um alvo de 66 dp" | **some com o SVG**: `allowFontScaling` é prop de `<Text>` e um `<Svg>` não responde ao `font_scale`. O V1-A13 foi removido junto (§7.3) |
| ~~R12~~ **EXTINTO pela D-V1-1** | era "`includeFontPadding` desalinha o glifo em relação ao rótulo ao lado" | **some com o SVG**: não há `<Text>`, não há ascent/descent, e com a barra só-ícone não há rótulo ao lado |
| R14 **[V1-PR0]** | **`fill="currentColor"` sem a prop `color`** renderiza as partes preenchidas em preto — invisíveis sobre `#100F16` | o spike do 1º commit da V1-PR3, com um ícone de duas partes (traço + preenchimento) nos dois temas; controle negativo é o mesmo ícone sem a prop `color` |
| R15 **[V1-PR0]** | **A reinstalação no Tab S6** (`adb install -r`) pode deslogar ou apagar o cache da conta principal | primeiro logcat depois da instalação: `auth … src=restored` **e** `cache hit kind=setlists n=…`. Se cair, o login é do Marcel — e isso tem de ser sabido **antes** de o tablet ir para um show |
| R5 | **G5 já vermelho** faz o gate nascer inútil | V1-PR2b conserta os 4 antes de qualquer ícone entrar |
| R6 | O V1 mexe em `SetlistsScreen`/`StageScreen` e **derruba um `log(`** sem querer | G3 roda em todo commit, não só na PR |
| R7 | 5 estados sem captura vão para o Claude Design **sem referência** | montar o mock na V1-PR1, antes do brief |
| R8 | O `fontSize` literal (18 ocorrências) vira 18 decisões soltas no redesenho | V1-PR1 congela a escala junto com o design; não é achado do V1, é dívida do N1 |

### 7.6 Os três riscos de ícone-em-fonte, detalhados **[r2]**

Anexo: [`V1-R6-riscos-icone-fonte.txt`](V1-PRECHECK-anexos/V1-R6-riscos-icone-fonte.txt).

> **[V1-PR0] Os três riscos abaixo foram medidos quando o ícone seria uma FONTE.** Com a
> **D-V1-1** (SVG), **(b) e (c) deixam de existir por construção** e seus riscos e aceites
> foram extintos (R11, R12, V1-A13). **(a) permanece, em forma menor**: o ícone SVG não
> contamina o `content-desc`, mas um controle **só-ícone** — e a barra do S3 inteira agora
> é só-ícone — fica **sem nome acessível nenhum** se o `accessibilityLabel` faltar. O
> V1-A6 emendado mede exatamente isso. O texto original fica como registro da medição.

**(a) Acessibilidade — o glifo é um codepoint de uso privado.** Medido: o `content-desc`
do `Pressable` é a **concatenação dos `<Text>` filhos**, separada por vírgula —
`content-desc="Auto-scroll, auto-scroll só em texto"` no S3d, `"Auto-scroll"` no S3 texto.
Logo um `<Text>{'\uE13C'}</Text>` irmão do rótulo **entra no `content-desc`** e o TalkBack
lê o codepoint. O instrumento do V1-A6 é esse mesmo atributo — não é preciso inventar
nada. Baseline hoje limpa: `grep -lP 'content-desc="[^"]*[\x{E000}-\x{F8FF}]'` sobre os
18 dumps → exit 1. **Controle negativo**: pôr o glifo sem
`importantForAccessibility="no-hide-descendants"` e conferir que o gate acusa.

**(b) Escala de fonte.**

```
$ adb -s emulator-5554 shell settings get system font_scale
null                       ← não definido = 1,0; o usuário pode levar a 2,0
$ grep -rn "allowFontScaling" apps/native/src/
  (exit 1)                 ← NENHUMA ocorrência em 3.459 linhas
```

Hoje todo texto do app escala com a preferência do sistema, inclusive os rótulos de 12 dp
da barra. O **ícone** precisa de `allowFontScaling={false}`; o **rótulo** não (é texto e
deve escalar). `[hipótese]` o `font_scale` do Tab S6 é 1,0 — a fechar no aceite da
V1-PR7, com o mesmo comando.

**(c) Alinhamento.** `grep -rn "includeFontPadding\|textAlignVertical" src/` → exit 1: o
padrão do Android (`true`) está valendo, e ele acrescenta ascent/descent arbitrários em
torno do glifo. É risco do **spike da V1-PR3**, não do desenho. **Qual captura prova**: a
do spike, com o ícone em duas variantes (com e sem `includeFontPadding={false}`) dentro do
mesmo `Controle` de 66 dp, e a linha de base do rótulo coincidindo nas duas.

---

## 8. Contabilidade de prod

Conta de **audit**. Emulador `octavia_tab32` (`emulator-5554`). **Teto do prompt: 6
requests a `/api/*`.**

| Item | rodada 1 | rodada 2 | **rodada 3** | **total** |
|---|---|---|---|---|
| logins aceitos | 0 | 0 | **0** | **0** |
| logins recusados | 0 | 0 | **0** | **0** |
| `setlist-read` (`GET /api/setlists`) | 1 | 0 | **0** | **1** |
| `content-read` (`GET /api/content`) | 1 | 0 | **0** | **1** |
| **total `/api/*`** | 2 | 0 | **0** | **2** (de 6) |
| downloads do bucket | 0 | 0 | **0** | **0** |
| 401 · 429 | 0 | 0 | **0** | **0** |
| `/api/auth/session`, `/api/proxy`, `/api/profile` | 0 | 0 | **0** | **0** |
| **escrita pela API** | **0** | **0** | **0** | **0** |
| acesso ao console Supabase/Firebase | 0 | 0 | **0** | **0** |

**[r3] A rodada 3 rodou inteira em modo avião** (`airplane_mode_on = 1` do início ao fim
do trabalho no app), o que põe o gasto em **0 por construção** — nem o mock foi preciso.
O único arquivo servido veio do disco (`file src=disk … bytes=20821`).

**A rodada 2 gastou ZERO do teto restante de 4**, como o prompt pedia. Os cinco estados
novos foram capturados com a base da API apontando para `http://localhost:8788` (o mock do
`aceite.py`, inline no Metro) ou em modo avião. As únicas requests `api status=…` do
logcat desta rodada têm `path=/api/setlists` e `path=/api/content` **no mock local** — o
`ms=26`, `ms=21`, `ms=81`, `ms=28`, `ms=60` são a assinatura: prod mediu 3.373 ms e 516 ms
na rodada 1.

**Uma ressalva que o método exige**: com o app aberto e rede, o SDK do Firebase pode
renovar o token contra `securetoken.googleapis.com`. Não é `/api/*`, não é Supabase, não é
Vercel, e não conta no teto — mas é tráfego, e fica declarado. Nos estados em avião nem
isso houve.

As duas requests são a linha a linha do logcat, uma única abertura online:

```
OCTAVIA: api status=200 path=/api/setlists n=1 ms=3373
OCTAVIA: api status=200 path=/api/content  n=1 ms=516
OCTAVIA: sync ok setlists=3 content=67 pages=1 t=4010
```

**Todos os outros 11 estados foram capturados em modo avião** (`sync skip reason=offline`),
o que é a razão de o gasto ter ficado em 1/3 do teto.

Fora de prod: `gh` (GitHub Actions, 1 listagem + 1 view + 1 download de artefato) e o
registro npm (4 `npm view`, 2 `npm i` em scratch). Nenhum toca o Supabase, o Firebase ou
a Vercel.

---

## 9. Estado do emulador — antes × depois

**Rodada 3** (as anteriores estão no histórico das versões deste arquivo):

| | **Antes** | **Depois** |
|---|---|---|
| `adb devices` | `RX2N8000F3D device` (Tab S6 **já conectado**, div. 7) | `RX2N8000F3D device` — **idêntico** |
| `pgrep -fl qemu` | nenhum | nenhum ✓ |
| `lsof -i :8081` | livre | livre ✓ |
| processos `expo start` | nenhum | nenhum ✓ |
| avião | `0` | **`0`**, provado: `ping -c 2 8.8.8.8` → `0% packet loss` ✓ |
| `adb reverse` | — | `--remove-all`, `--list` → `[]` ✓ |
| sessão do app | audit viva | **audit viva** — `auth uid=Pw3bxXZw0iT3WwyL7kxGtGJIJH83 src=restored` ✓ |
| `content.json` | `d27e6d8478185282d5707fb9459d8e124cdd6bdab9c20aa28df133041e86fc44` | **idêntico** ✓ |
| `setlists.json` | `0a3a06380634b5dabbe1811e29a8f7a6151e1302bfe8a025d16013300a5f8a07` | **idêntico** ✓ |
| `files/…-partitura-12p.pdf` | `ad2eae0942811adb4d60286516ce318110868f6aa889422ab0cb8b3dc690ea22` | **idêntico** ✓ |
| **`files-index.json`** | `925e4f35417375485ded8c1b99fc655dccbdd80c5aafc5337f3626ff3267b5d1` | **`950985955f9e1fb49a7e823fc2daae8d929bd89adfe01b3a42bb95c384ed6cdc` — MUDOU** |
| `sdkmanager --list_installed` | 27 linhas | `diff antes depois` → **vazio** ✓ |
| emulador | desligado | **desligado** (`emu kill` → `OK: killing emulator, bye bye`) |

### A baseline vigente do store **[C3]**

A tabela acima tem duas colunas porque **a baseline que a V1-PR1 vai comparar é a da
direita**, não a da rodada 1. Explicitamente:

| arquivo | **baseline vigente (fim da rodada 3)** | vale para |
|---|---|---|
| `content.json` | `d27e6d8478185282d5707fb9459d8e124cdd6bdab9c20aa28df133041e86fc44` | V1-PR1 em diante |
| `setlists.json` | `0a3a06380634b5dabbe1811e29a8f7a6151e1302bfe8a025d16013300a5f8a07` | V1-PR1 em diante |
| `files/…-partitura-12p.pdf` | `ad2eae0942811adb4d60286516ce318110868f6aa889422ab0cb8b3dc690ea22` | V1-PR1 em diante |
| **`files-index.json`** | **`950985955f9e1fb49a7e823fc2daae8d929bd89adfe01b3a42bb95c384ed6cdc`** | V1-PR1 em diante |

O `925e4f35…` da coluna "antes" é **histórico**: qualquer PR que o cite como esperado vai
acusar uma diferença que não existe. E o `files-index.json` **vai mudar de novo** toda vez
que um aceite abrir um arquivo — é o que ele registra. A regra para as PRs seguintes é a
que esta rodada aplicou: **os três primeiros têm de voltar idênticos; o quarto se confere
pelo conteúdo** (mesmas URLs, mesmos `bytes`), não pelo sha256.

**O `files-index.json` mudou, e isto é declarado, não escondido (div. 22).** Causa medida:
o **controle positivo** do §3.4 navegou para a posição 2, o app serviu o PDF de 1 página
do disco (`file src=disk name=1786218427769-ux-audit-partitura-1p.pdf bytes=20821`) e o
LRU gravou o `lastUsedMs` novo — `1789160193016` contra `1789071627197` dos vizinhos. **É
o que esse índice existe para fazer** (div. 32 do N1: a API não expõe mtime, o LRU precisa
de índice próprio). Nenhum byte de conteúdo mudou, nenhum arquivo foi perdido, nenhuma
setlist saiu do cache. Eu **não** o restaurei: reescrever um `lastUsedMs` para um valor
antigo seria falsificar o estado do LRU, e o que este pre-check deve devolver é o aparelho
como ele ficou, não como eu gostaria que estivesse.

*(De passagem, uma correção da rodada 1: o `ls files/octavia-<uid>/files/` mostra **um**
arquivo porque o outro vive em `Paths.cache` — `cache/octavia-<uid>/files/1786218427769-ux-audit-partitura-1p.pdf`,
20.821 B, purgável. O "único arquivo no disco" da rodada 1 era "único em `Paths.document`".)*

**Nenhum `pm clear`, nenhuma senha, nenhum comando no Tab S6** — em nenhuma das três rodadas.

**Conforme o §12 do N1-ENCERRAMENTO.** O **Tab S6 não recebeu um único comando**:
`-s emulator-5554` em 100% das chamadas `adb` deste pre-check.

Repositório: `origin/main` em `b5700a1`, **nenhum commit, nenhuma branch, nenhum push**.
`package.json` e `pnpm-lock.yaml` intocados. O worktree `/Users/marcelviana/projects/octavia-v1`
contém este documento e os anexos, **não versionados** — e é o único rastro.

---

## 10. Decisões do Marcel — 2026-09-11

As quatro perguntas que travavam a V1-PR1 foram decididas. **Onde a decisão contraria a
recomendação deste pre-check, o eixo da divergência está escrito**, porque é isso que o
encerramento do V1 vai precisar ler daqui a seis meses.

### D-V1-1 — Biblioteca de ícones: **`react-native-svg`** (contraria a recomendação)

`lucide-react-native` para o vocabulário padrão; **componentes SVG próprios** para o que é
do Octavia — os tipos de conteúdo, o arco parcial do indicador, os elementos gráficos.

**A escolha NÃO foi por custo de build.** O pre-check recomendou B3 (fonte própria) com o
argumento de que, custando todas o mesmo rebuild, ganha a que não acrescenta módulo
nativo. **O Marcel declarou que rebuild não é custo significativo diante do resultado
visual pretendido** — e, tirado o rebuild do eixo, o argumento da B3 se esvazia: ele era
inteiramente sobre custo de entrega, e o que restava a favor da fonte era os ~7 KB.

**Com o eixo certo — o que o ícone precisa poder fazer — a fonte perde em quase tudo:**

| | fonte de ícone (B3/B1) | SVG (B2/B4) |
|---|---|---|
| traço independente do tamanho | **não** (o traço escala com o `fontSize`) | sim |
| duas cores num mesmo ícone | **não** (um glifo, uma cor) | sim |
| arco parcial proporcional (o ◔ de "n de m arquivos") | **não** — só os passos que estiverem no subset | **sim, de verdade** |
| ilustração vetorial | **não** | sim |

E os **três riscos do §7.6 existem apenas porque o glifo é um `<Text>`**: o codepoint de
uso privado entrando no `content-desc` (a), o `allowFontScaling` (b) e o
`includeFontPadding` (c). Com SVG, **os três desaparecem por construção** — não são
mitigados, deixam de existir.

**Custo aceito, explicitamente**: prebuild; rebuild do dev client; **uma reinstalação no
Tab S6** na V1-PR3 — `[hipótese]` `adb install -r` preserva sessão e cache, prova por
`auth … src=restored` no primeiro logcat, e **se cair, o login é do Marcel**; `.so` por
ABI (× 4 no artefato de CI); e o autolinking indo de **6 para 7** módulos. O
`unzip -l <apk> | grep -ci svg → 0` medido em §6.1 é o **controle negativo** de "o módulo
entrou".

### D-V1-2 — Os cinco alvos e os três `testID` entram na V1-PR1

Antes do design. Os cinco são `voltar` (40,0 × 57,8), `fechar-busca` (40,0 × 57,8),
`campo-busca` (825,3 × **46,2**), `apagar` (48,9 × **21,8**) e `tentar-banner`
(130,7 × **22,7**); os três `testID` são os cartões de setlist do S1. Razão: são defeitos
de **hoje** contra o T1-R27/R28, e consertá-los antes do redesenho separa "o que estava
errado" de "o que o V1 mudou".

### D-V1-3 — `error` e `offline` do tema claro vão para o brief e o congelamento

**Não** para a V1-PR1. Token é errata de design, pela regra do cabeçalho do `theme.ts`;
logo entra na **V1-PR2**. O ponto de offline da barra **superior** do S3 fica como
**achado herdado** (div. 8) — a barra superior está fora do recorte do V1.

*Nota de progresso*: o design já propôs **`errorInk`** e **`offlineInk`**, com valor nos
dois temas. As razões medidas em §5.4 (`error` 2,86:1 e `offline` 2,44:1 no claro) são a
entrada dessa proposta.

### D-V1-4 — A geometria das bordas entra na V1-PR1

Como **errata declarada do A14 e da D-1**, por `onLayout` no `meio`, nos **dois** arquivos
(`StageScreen.tsx` e `EndScreen.tsx`). Razão do Marcel: **congelar um design novo por cima
de um aceite falso é o pior momento possível**, e a correção é da mesma classe da PR1 —
geometria de toque, não desenho. A exceção ao recorte está escrita em §7.1; a via
(`onLayout`, não `useSafeAreaInsets`) e o porquê estão em §3.4 item 5.

---

## 11. Perguntas ao Marcel — 8, **quatro decididas** (§10)

> **Q1, Q2, Q6 e Q8 foram decididas** em 2026-09-11 e viraram D-V1-1 a D-V1-4 (§10). Ficam
> aqui como estavam, porque a pergunta e a recomendação são o contexto da decisão — em
> especial na Q1, onde o Marcel **decidiu contra** a recomendação, com o eixo registrado.
> **Q3, Q4, Q5 e Q7 seguem abertas.**

**Q1 — Qual opção de ícone? [r2, reescrita]**
A rodada 1 recomendou B3 dizendo "zero rebuild". **Isso estava errado** (div. 15): o ttf
entra pelo config plugin, que só roda no prebuild — **as cinco opções exigem rebuild**.
Com o eixo corrigido, **a recomendação continua B3**, e por um motivo mais simples:
*como todas custam o mesmo rebuild, o que as separa é o que entra no APK e por qual
mecanismo — e a B3 é a única que não acrescenta um módulo de código nativo, custa ~7 KB
independentes de ABI, e usa exatamente o caminho `expo-font` que o N1 já provou seis
vezes.* Plano B: **B1b** (o mesmo mecanismo, 56 KB, uma dependência de 6,4 MB no grafo).
B2/B4 acrescentam `react-native-svg`: módulo nativo novo, `.so` por ABI, e o precedente da
div. 36 do N1.

**Q2 — Os alvos abaixo de 48 dp entram no V1? [r2: são cinco]**
`voltar` e `fechar-busca` (40 dp), `campo-busca` (46,2), `apagar` (21,8) e — novo —
**`tentar-banner` (22,7)**. Os cinco reprovam o T1-R27/R28 **hoje**. **Recomendo sim, na
V1-PR1** como o revisor numerou: antes do redesenho, numa PR só deles.

**Q3 — A ordem do S1 muda?**
Hoje é `created_at desc`, do servidor, sem `sort` no cliente. O redesenho é a hora natural
de perguntar se a setlist do próximo show vem primeiro (`performance_date`) — mas é
mudança de **comportamento**, e o V1 se declarou sem nenhuma. **Recomendo manter
`created_at desc`** e registrar como herança do N2. Se você quiser agora, sai do escopo
declarado, e eu declaro antes de commitar.

**Q4 — Os estados sem captura. [r2: resolvida, menos um]**
Cinco dos seis **foram capturados nesta rodada**, sem `pm clear`, sem senha e com **0**
requests a prod (§4.3) — o revisor estava certo: apagar o store por `run-as` não desloga.
Sobra o **S0**, e ele tem saída grátis: reaproveitar `PR7-a2-token-forjado.png` da #289,
elegível pela regra. **Nenhuma decisão sua é necessária aqui** — só saber que validar o S0
**no device**, no aceite da V1-PR7, exige um login seu (ressalva do A2, §7.4).

**Q5 — `line` (1,32:1 no escuro, 1,38 no claro) fica como está?**
Hoje é decorativa e passa. Se um ícone sem rótulo depender da borda do `Controle` para ser
percebido, ela entra no WCAG 1.4.11 e reprova. **Recomendo** manter o token e manter o
rótulo textual ao lado do ícone no S3 — que é o que você já decidiu. Aí a borda continua
decorativa e nada muda.

**Q6 — `error` no tema claro (2,86:1) e o ponto de offline (2,44:1). [r2, reenquadrada]**
A rodada 1 punha os dois na PR dos alvos. **O revisor tem razão: mudar `error`/`offline` é
mudança de TOKEN**, e o cabeçalho do `theme.ts` diz que token é errata do design — logo
vai para o **brief e para o congelamento (V1-PR2)**, não para a V1-PR1. **Tirei os dois da
V1-PR1.** E o **ponto de offline fica na barra SUPERIOR do S3**, que está fora do recorte
do V1 (só a barra inferior entra): **registro como achado herdado**, com a divergência 8
como fonte, para o N2 ou para quem mexer no S3 inteiro. Recomendação: `error` e as demais
razões do tema claro vão ao brief do Claude Design como restrição de entrada; o ponto de
offline, não.

**Q7 — O spike da V1-PR3 mede o APK?**
**Recomendo sim**, e que vire aceite (V1-A11). O "antes" está medido
(215.354.003 B, sha256 `e90eb64a…`, 13 ttf, `grep -ci svg → 0`) e é o controle negativo de
"o ícone está no APK". Agora que o rebuild é certo, essa medição deixa de ser opcional: é
a única forma de provar "offline por construção".

**Q8 — A geometria das bordas entra na V1-PR1? [r3, reescrita com a medição completa]**
A `borda-voltar` transborda a área de conteúdo em **84,0 dp no AVD e 72,0 dp no Tab S6**, e
cobre **100% do `auto-scroll`** (div. 16). O `EndScreen` (S5) tem as **mesmas duas linhas**
e o mesmo transbordo.

**O que a rodada 3 mediu**: seis taps nas quatro regiões da sobreposição onde não há
controle por cima — **logcat vazio nas seis**, contra um controle positivo que emite
`nav n=2/8` e um negativo que emite `autoscroll on t=98`. A borda **não ganha o toque em
ponto nenhum** da faixa da barra; quem está por cima em toda a largura é a própria
`barraBaixo` (`[0,1249][2560,1465]`, div. 20). **"Inócuo no toque" agora está testado onde
poderia falhar**, e continua verdadeiro.

Três coisas, porém, sobrevivem à boa notícia:

1. **a fragilidade é a mesma** — o que segura tudo é a ordem de irmãos, e o V1 mexe
   exatamente nessa barra; um `zIndex` inverte o resultado em silêncio;
2. **a faixa é inerte onde não há controle** — 24,0 dp na esquerda da barra, 12,0 dp entre
   os dois primeiros controles e **170,7 × 84,0 dp** à direita do último. Num palco em que o
   polegar mira os 15% laterais, é exatamente onde o dedo cai quando erra para baixo;
3. **o A14 afirma uma geometria que não existe** (div. 24, §3.4b) — "bordas entre as
   barras" é falso desde o N1, e o instrumento que o provou (tap no centro + screencap)
   não olha extensão.

**Recomendo consertar na V1-PR1, nos dois arquivos, pela via (b)**: `onLayout` no `meio`,
não `useSafeAreaInsets()`. Motivo em §3.4 item 5 — com o `SafeAreaView` da raiz já
consumindo os quatro insets, a fórmula com insets acerta **hoje** por coincidência
aritmética e quebra se alguém tocar em `edges`; o `onLayout` mede o que a View recebeu,
seja quem for que tenha consumido o quê.

**Alternativa defensável**: deixar como está e pôr os seis taps do §3.4 como gate
permanente (R9) — mais barato, e aceita conviver com 170,7 × 84,0 dp de área morta.
**A escolha é sua porque é mudança de comportamento de toque** — exatamente a classe que o
V1 se proibiu.

## 12. Anexos

**33 arquivos** — 15 de texto e 18 capturas PNG. Cada anexo de texto abre com o comando que
o gerou; **[r2]**/**[r3]** marca a rodada em que nasceu.

**Dois arquivos NÃO entram [V1-PR0], e é decisão declarada:**

- os **diffs das rodadas** (`V1-r2-diff.txt`, `V1-r3-diff.txt`) — eles abrem com um caminho
  absoluto de scratchpad da máquina (`/tmp/claude-501/…`), são artefato do **rito de
  revisão** e não medição de nada, e a enumeração do próprio prompt desta PR não os
  inclui. Foram entregues ao revisor nas rodadas 2 e 3 e cumpriram o papel ali;
- a captura do **S0**, que **não é copiada**: ela é
  [`N1-anexos/PR7-a2-token-forjado.png`](N1-anexos/PR7-a2-token-forjado.png), já commitada
  no bloco de origem (§4.4). Duplicá-la criaria duas cópias que podem divergir.

| Arquivo | tamanho | sha256 |
|---|---|---|
| `V1-A1-inventario-alvos.txt` | 314 linhas | `9f43dea25f310dec983aec3610849bd6932d0f659eb752311475930750e8bf73` |
| `V1-A1b-inventario-estados-novos.txt` **[r2]** | 149 linhas | `47076df2d5536820ce708da1b488f3fd4ed8fa98a7c34a865d775dd3e1825afe` |
| `V1-A2-inventario-codigo.txt` | 282 linhas | `b54f01a7707289eb89107c7a65cbf6bc73a1cd5d7b1ff527079329c2f17caa83` |
| `V1-A3-instrumento-a20.txt` | 159 linhas | `fc6925b8d5e7951d7da800f83ce467e22841d4dad4991ecf13b7307eb0d14535` |
| `V1-A4-contraste.txt` | 35 linhas | `a2eaf38c7c07c516c3960cfc76cbcef14274eadadfce0f2ce676860a7bd0ea74` |
| `V1-B-opcoes-icone.txt` | 143 linhas | `20daa3b8ce51ffc585b18f87f569bf9322789d63d657e4dbcf579a4721abc95b` |
| `V1-B1-expo-vector-icons.txt` | 111 linhas | `b2cdc8f70a966ee93a246a3ab11a6c2edef2f65557dfdf83cf8516890b455a99` |
| `V1-C-gates.txt` | 151 linhas | `f04fb9acd8edafb2649761d21c5f9de20f8dcc474a237af8ecf30c702d3744c7` |
| `V1-R1-rebuild.txt` **[r2]** | 30 linhas | `2fbc50d8ec928d07ba8853653e68f76445f1f928b44bb327025f68c335d6b779` |
| `V1-R2R3-geometria-palco.txt` **[r2]** | 144 linhas | `80d825bea4fdf4ddfbe2d7665eb1977f62ebb5e0b415246232a906cdb0907066` |
| `V1-R4-estados-sem-pmclear.txt` **[r2]** | 161 linhas | `02f0fa8dc27b90937a47d80790b0afc3ee2e9b2dc1e6ada9565050d8e3e15779` |
| `V1-R6-riscos-icone-fonte.txt` **[r2]** | 53 linhas | `9ca5c28754b3a06fbe938e9ba160a4b72e3b0e625dbae47b35f3c8864625b827` |
| `V1-S1-zonas-mortas.txt` **[r3]** | 54 linhas | `e64f656a2473f3e70eede1a922b0ac64e3195dde446a1dacb4da0c06145a5a99` |
| `V1-S2-janela-reconciliada.txt` **[r3]** | 84 linhas | `287ea2b776c9df8afd8d917d556a52caedb366bc630bc971e0bf8ad2d504154d` |
| `V1-S3S4S5-g5-paginas-erro.txt` **[r3]** | 140 linhas | `1f523a164e104d3f8e99c5e294ab699e65f0fe4ef1d07338548e4470e552b1e3` |
| `V1-estado-S1a-sincronizando-sem-cache.png` **[r2]** | 81.627 B | `5d987d40b929c7394df9ea38c78d6648cf7bc54089aa0022ce03b1e9fc7cd53d` |
| `V1-estado-S1b-normal-online.png` | 233.418 B | `19a1836a9c050fb247e7ff51726087dadbf693472a5a8d06cbe8c23af6234bed` |
| `V1-estado-S1c-offline-com-cache.png` | 238.117 B | `a052896ec440c3d98e6e35c65cf77212bc82984fc494535655b75324765f6acc` |
| `V1-estado-S1d-offline-sem-cache.png` **[r2]** | 120.691 B | `910de15460a29d8afe87acc81be6721d3f286c66759b66060349a101468de67c` |
| `V1-estado-S1e-falha-com-cache.png` **[r2]** | 255.158 B | `f8f7298749ea21cb380131d9b6002f57351b7bf62ad71053c8487e9b22e9a318` |
| `V1-estado-S1f-vazia-apos-sync.png` **[r2]** | 108.734 B | `313c49759c5b506da86d4ac7fdc002d278120dba46ffd920c9799c404c8aea1d` |
| `V1-estado-S2-com-invalidos.png` **[r2]** | 223.411 B | `51dfc6b2f13f86c4cdd206bb062361b4806d68fc724bef66621b242e24348bca` |
| `V1-estado-S2-indice.png` | 223.626 B | `3207f778387bc21b1fb531484b2f1eb3703821ce44fa054635d3a4eedb12f7b2` |
| `V1-estado-S3-avulsa.png` | 178.116 B | `310927831f986e73820f0f5d901579e17abbbc0fbe42f36ed123a46f3e571ce0` |
| `V1-estado-S3-claro.png` | 194.030 B | `b6678f61fb05f83e976dbbe7f0ac6f97d144eaf4b22cb2a831e4c69a3e2e199b` |
| `V1-estado-S3-placeholder-invalido-nobody.png` **[r2]** | 158.046 B | `cdd5f40a7614886076e4a6142a773b174caeecb7fe07ac15e5647cac439a8fd4` |
| `V1-estado-S3-texto.png` | 192.040 B | `a45ae6f8ed73e124e85a425d5aa5e30eec47e379c662df149d11572a33a3a6b7` |
| `V1-estado-S3d-pdf.png` | 210.571 B | `8182443ed27e38018e0e593c4a76b54d75e6a834b5fc0db38cecd306dfed0e0c` |
| `V1-estado-S3e-arquivo-nao-baixado.png` | 165.110 B | `20bb9e0b2005e737dc54036da7dafaa7db0aacd72b28d1975b2ecc55ef90c56b` |
| `V1-estado-S4a-busca.png` | 122.563 B | `7e9d1ec2f5de7a775dc6da4d99705655e1b0933734a655ea8e9d8676075cfc61` |
| `V1-estado-S4a-resultados.png` | 120.490 B | `0a07745ffd3021bb538c9a0a8296713c21bab06b9611e4af3f6fc1cb21b3f461` |
| `V1-estado-S4b-nada-encontrado.png` | 107.443 B | `c1bbb3871bbea643fbd7b4396023d18b104d8ff46cbb102090a316e5fb962bb0` |
| `V1-estado-S5-fim-setlist.png` | 98.927 B | `9b9a7daca57db5045cd1621e08e733ce2909f75b7ebb89a7290edab0536f705d` |

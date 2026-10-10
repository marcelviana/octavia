# QL-PR4-anexos — as notas da música no palco, a divisa e o estado lembrado

**PR [#376](https://github.com/marcelviana/octavia/pull/376)**, branch `ql/pr4-notas`, árvore `../octavia-ql-pr4` sobre
`origin/main` = **`4078c64`** (`4078c6474f83f2e0b1536a11ce528e32ac0f06a7`, o merge da #375, a PR-3 do QL)
`[medido: git rev-parse origin/main]`. `pnpm install --frozen-lockfile --offline`. A árvore `../octavia-ql-pr3` foi removida
antes, com `git status --short` vazio e **sem `--force`**. Fonte do bloco: [`QL-REQUISITOS.md`](../QL-REQUISITOS.md) (esta é a
**PR-4** da QL-D19, aceites A-QL-17…A-QL-19 e a âncora do A-QL-12), [`DESIGN-QL/`](../DESIGN-QL/README.md),
[`QL-PR3-anexos/`](../QL-PR3-anexos/README.md). Molde: [`QL-PR3-anexos/`](../QL-PR3-anexos/README.md) e, para o ícone no
catálogo, [`N4-PR4-anexos/`](../N4-PR4-anexos/README.md).

> ## A PR-4 parou no julgamento do Marcel (QL-D54) e voltou (QL-D55…QL-D60) — §14
>
> No Tab, o julgamento do toque achou que **as bordas invisíveis de 15 % do palco ficavam POR CIMA da régua das notas**: o
> toque na divisa avançava a música, no rótulo voltava (§6). O Marcel decidiu parar (QL-D54) e depois a saída em duas partes
> (QL-D55): **nesta PR, a régua fica fora das bordas** (QL-D56); **a navegação do palco repensada por inteiro vira bloco
> próprio** (QL-D57, na fila antes do N5). A volta também pôs **as notas quando o corpo não é texto** (QL-D58). As §1–§13
> registram a primeira rodada, até a parada, como ela foi; **a §14 é a volta**, com o código final, as medidas de novo e os
> três julgamentos.

- **Commits**: `af2a800` `test(ql): QL-PR4 — as notas no palco, a divisa no gate e o estado lembrado, reprovando` ·
  `20fdbbe` `feat(ql): as notas da música no palco, a divisa e o estado lembrado; a âncora com as notas e em V` · o de docs
  (este README e as erratas), depois do CI verde (regra 18).
- **Nenhuma linha de log nova** (G3 70 = 70); **três `testID` novos** (`notas`, `notas-regua`, `notas-texto`; G2 121 → 124);
  **um ícone novo** (a divisa, catálogo 41 → 42); **nenhum token, nenhuma frase**; o site não muda (§7.2).
- **Texto**: só o inventado pelo projeto — a nota do `QL-BRIEF.md` §5.4 (`instrumentos/fixture-ql4.py`, sobre a fixture da
  QL-PR3), a fixture do pre-check do N3 e a do G-par. Nenhum dado da conta do Marcel (regra 10): no Tab, o cache dele saiu
  do aparelho antes da primeira abertura e voltou md5 a md5 (§8); o nome do PDF dele e o uid saem das saídas da receita.
- `[medido]` = comando + saída literal desta sessão, no arquivo citado; `[lido]` = do arquivo citado; `[hipótese]` = o resto.

| arquivo / pasta | o quê |
|---|---|
| [`commit1-reprovando.txt`](commit1-reprovando.txt) · [`cn-ancora-v.txt`](cn-ancora-v.txt) | os testes reprovando antes do código; o CN da âncora em V (o `VisualizacaoScreen.tsx` da `main` reprova os 4 casos) |
| [`gates/`](gates/) | G1/G2/G3, `a20`, `icones` (+ os 3 CN de mão), os congelados, a suíte, `tsc`, lint; os do site; o site que não muda; G-inv, G-N3 |
| [`medidas/`](medidas/) | o bundle servido antes de cada rodada; a âncora nos dois aparelhos (`ancora-avd.txt`, `ancora-tab.txt`) |
| [`eventos/`](eventos/) | o `uiautomator events` de cada passo da âncora e o plano de cada roteiro (`*.plano.json`), com `SHA256SUMS.txt` |
| [`dumps/`](dumps/) · [`capturas/ql/`](capturas/ql/) | `dumps/base/` (92: a base do G-inv nos dois aparelhos), `dumps/ql/` e `capturas/ql/` (os estados das notas e da âncora; `QL4Q-` a PR, `QL4M-` a `main`) — cada pasta com `SHA256SUMS.txt` |
| [`estado/`](estado/) · [`quedas/`](quedas/) · [`logcat/`](logcat/) · [`roteiros/`](roteiros/) | o estado dos aparelhos antes e depois, a receita do cache, as quedas, as linhas `OCTAVIA:` de cada aparelho, a saída dos arneses |
| [`instrumentos/`](instrumentos/) | `ql4.py` (o arnês da PR-4, sobre o `ql.py` da QL-PR3), `fixture-ql4.py`, `ancora4.ts` (a conta prevista com o começo do corpo), as cópias da `cadeia.sh`/`cadeia-tab.sh` e o `estado.sh` |

---

## 1. As decisões desta sessão — QL-D52…QL-D54 `[Marcel, 2026-10-09]`

| # | pergunta | decisão |
|---|---|---|
| **QL-D52** | a âncora com algo acima do corpo — a folha não diz (div. 1232) | *"Volta ao topo"*: com a marca de 32 ainda **dentro das notas** (palco) ou **dentro dos *Detalhes*** (V em B), ou com nada rolado, o giro e o zoom põem a rolagem em **0**. Fora disso, a conta da QL-D37 somada a altura do que está acima |
| **QL-D53** | a régua: a folha desenha 0,2 em e 62 de altura no zoom 40; o repositório diz *"a régua de V"* e *"48"* (div. 1231) | *"A de V, 48 sempre"*: `tracking.display`, nenhum token novo, 48 em todo zoom — errata de medida **QL-E3** no `DESIGN-QL/README.md` §6 |
| **QL-D54** | as bordas de 15 % por cima da régua (div. 1233, §6) | *"Parar e redesenhar"*: a navegação por ícone se decide antes, num bloco com desenho; a PR-4 volta depois |

As três estão no `DESIGN-QL/README.md` §3 (QL-D52, QL-D53) e aqui (QL-D54).

## 2. O que a PR faz

- **As notas** (`apps/native/src/screens/NotasDoPalco.tsx`, novo): no topo do corpo de texto, dentro da rolagem; a régua
  (o alvo, 48 = `touch.min`) com o rótulo *notas da música* (`FRASES_N4`, o estilo da régua de V), o fio `line` e a
  **divisa** de 20 em `muted`; abertas, um parágrafo por linha em Manrope, **16 × zoom ÷ 22** (`tamanhoDasNotas`, do
  `size.body` e do `zoomDefault` — nenhum token novo), entrelinha 1,55, 8 entre parágrafos, 4 em cima e 20 (`lg` + `xs`)
  embaixo; recolhidas, 8; o fio `line` fecha o bloco e 24 até a letra; o bloco sobe 8 sobre o respiro (a régua a 24 do
  topo do corpo, como a folha). Fora do `quebrar` do core (div. 1229). **Sem nota, nada**. Só no corpo de texto (div. 1230).
- **O estado lembrado** (`apps/native/src/preferencias.ts`, novo) — §5.
- **A divisa** no catálogo (`packages/identidade/src/icones.ts`): `normal` = a aberta, `ativo` = a recolhida — §3.
- **A âncora** vira um gancho do leitor compartilhado (`useAncora`, `Leitor.tsx`), para o palco e V: a lógica na marca é a
  de `y − início` (`logicaNaMarca`), a rolagem é `início + yDaLogica` (`yDaAncora`); com a marca acima do corpo ou nada
  rolado, `null` → o topo (QL-D52). O alvo se recalcula a cada tentativa com o desenho de agora (o início novo chega depois,
  quando as notas são medidas de novo). No palco o início é o bloco das notas (`onLayout`: y + altura + 24 − 32); em V em B,
  o `y` do `view-leitor` mais a borda de 1 dp; em V em C, 0. **V ancora ao girar** (QL-D49).

## 3. A divisa no catálogo e no `gate:icones` (QL-D31, A-QL-19) `[medido: gates/gates-nativos-e-suite.txt, gates/cn-gate-icones.txt]`

**Commit 1** — a regra 8 do `gate:icones` (`apps/native/scripts/icones.mjs`): a folha do QL como fonte, **as 8 células de 20
e 24 da amostra `QL-divisa-amostra`** (aberta · recolhida × 20 · 24 × escuro · claro; o 4 × é ampliação, fora) pela
`comparar` da regra 7 (geometria, preenchimento e traço efetivo), e **as 18 molduras `QL-*-S3-notas-*`**, cada uma com
UMA divisa de 20 no estado dela (abertas e longa → aberta; recolhidas → recolhida). A conta **41 → 42**. Em par: o
`IconesFalso` (o CN do CI) ganha a divisa CORRETA (24 acusações, como antes); a linha de base ganha `paresIconesQL`
(velho `null` → o desenho da folha, razão QL-D31), aplicado depois dos do N4 (46 nomes). **Reprovando na `main`**: 27
acusações, `exit=1` (`commit1-reprovando.txt`). **Depois do commit 2**: `acusações: 0 · avisos: 0`, 42 registros.

| CN (de mão, em cópia do mapa; a árvore não muda) | o gate |
|---|---|
| a divisa ausente | **reprova, 27** — *falta no mapa: "divisa"* e as 26 células sem o estado |
| um ícone fora de todo catálogo (`seta-dupla`, um 43º) | **reprova, 2** — *sobra no mapa* e *não está no anexo D* |
| a divisa com os estados trocados | **reprova, 26** — cada célula ≠ folha |

**O julgamento do traço (A-QL-19) não se fez** (§6): o toque na divisa avança a música, e o Marcel não pôde ver a recolhida.

## 4. A âncora com as notas e em V (QL-R13, QL-D49, QL-D52) `[medido: medidas/ancora-*.txt, eventos/]`

**O instrumento**: o da QL-PR3 (o `uiautomator events` durante cada mudança; ±0,5 px, QL-D50) com o **começo do corpo** de
cada passo, medido pelo `ql4.py` com a rolagem no topo (o topo do `corpo` menos o da rolagem menos 72 px; em V em B, o `y`
do `view-leitor` + 2,25 px — div. 1238) e gravado no plano; a conta prevista (`instrumentos/ancora4.ts`) é a do
`Leitor.tsx`. O começo do corpo medido (os dois aparelhos, iguais): **abertas** B 22 · 204,4 dp — C 22 · 179,6 — C 26 · 192,9
— B 26 · 222,2; **recolhidas** 72,9 em todo passo (48 + 8 + 1 + 16); **V em B** 205,0 (os *Detalhes*); V em C 0.

| roteiro | AVD | Tab |
|---|---|---|
| palco, notas **abertas**: B → C → zoom 26 → B, a rolagem automática | Δ 0,4 · 0,1 · 0,4 px; a lógica 46 nos três; parte do ancorado ✓ | Δ 0,3 · 0,5 · 0,3; a lógica 53; ✓ |
| palco, notas **recolhidas** | Δ 0,1 · 0,4 · 0,4; a lógica 48; ✓ | Δ 0,1 · 0,2 · 0,4; a lógica 56; ✓ |
| palco, a marca **nas notas** (rolado 198/219 px) → C | **0** (o topo, QL-D52) ✓ | **0** ✓ |
| **V**: C rolado → B → C | Δ 0,3 · 0,2; a lógica 38 ✓ | Δ 0,4 · 0,1; a lógica 46 ✓ |
| V, a marca **nos Detalhes** (B) → C | **0** ✓ | **0** ✓ |

**Todos os passos dentro de ±0,5 px, nos dois aparelhos.** Nos testes (`notas-palco.test.tsx`): as contas puras com e sem
início, o passo de zoom com as notas abertas e recolhidas (a altura nova chegando depois), a marca nas notas, abrir o palco
sem rolar para longe, recolher e abrir no topo, e V nos dois giros e nos Detalhes — e o CN (`cn-ancora-v.txt`): com o
`VisualizacaoScreen.tsx` da `main`, os 4 casos de V reprovam.

## 5. O estado lembrado (QL-D39, A-QL-18)

- **A chave**: `octavia:palco:notas-recolhidas`, no `AsyncStorage` — a dependência que o app já tinha para a sessão do
  Firebase (`firebase.ts`): **nenhuma dependência nova**. No Android, o banco SQLite `RKStorage` do app
  (`/data/data/rocks.octavia.app/databases/`), ao lado das chaves `firebase:*`, **fora** da pasta da sessão que a receita do
  cache guarda. Valor `"1"` ao recolher; **abrir APAGA a chave** (aberta é o padrão: o aparelho volta ao que era).
- **Os testes**: recolher grava `"1"` e abrir apaga (e nada mais no armazenamento); *gravar, reabrir, ler* — o módulo de novo
  (`vi.resetModules`, a memória perdida) lê o que foi gravado; o armazenamento que falha não derruba o palco; e o
  `notas-reabrir.test.tsx` (um processo novo, com a chave já gravada): o palco abre recolhido, **o corpo em 22 e o tema
  escuro**. O duplo do armazenamento guarda no `globalThis` — sobrevive ao `resetModules`, como o disco.
- **Os gates que contam o armazenamento**: **nenhum** — `git grep AsyncStorage` em `apps/native/scripts`, `scripts`,
  `.github`, `packages` → nada. Nada a declarar.
- **No aparelho** (`roteiros/ql-avd.txt`, `ql-tab.txt`, o estado `reabrir`): recolher, zoom +2, tema claro; `force-stop`; abrir
  de novo → *"régua presente · o texto das notas recolhido"*, nos dois aparelhos; o corpo com 0 continuações (o zoom 22; antes
  do kill, 2 — o 32); o fundo `#100F16` (escuro; antes do kill, `#F6F1EA`) `[medido: magick, o pixel (2540, 700) das capturas
  QL4Q-S3-reabrir-*]`. **No Tab, no fim, a chave não ficou**: 0 ocorrências no `RKStorage` (o controle, as chaves
  `firebase:`, conta 2 — `estado/tab-depois.txt` não as imprime).

## 6. Os julgamentos do Marcel, no Tab — verbatim, e o achado

No palco da *Lanterna da fixture* (a nota do brief §5.4), deitado, notas abertas, a rotação automática ligada; o Marcel
tocava a régua e o tema e girava o Tab com a mão:

| pergunta | resposta, verbatim |
|---|---|
| **A-QL-19** — o traço da divisa em 20 dp, nos dois estados e nos dois temas, está bom? | *"Quando clico na seta, está mudando iundo para a próxima música no setlist. Por isso Não consigo avaliar com as notas fechadas"* |
| as notas no palco se leem, abertas, deitado e em pé? | **"Sim"** |
| o toque na régua recolhe e abre na primeira tentativa, com a mão? | *"Ela passa para a proxima musica do setlist. Isso Não está legal. precisamos criar um botão (ícone) para passar para a próxima música e não deixar que o usuário passe sem saber o que está fazendo pq clicou em uma regiao qualquer da tela."* |

**O mecanismo, pela geometria** `[medido: o dump das medidas; lido: StageScreen.tsx]`: as bordas (`borda-voltar`,
`borda-avancar`) são `Pressable` absolutos sobre o `meio`, com 15 % da largura (C 170,7 dp · B 106,7), desenhados DEPOIS da
rolagem — por cima do corpo inteiro, notas incluídas (`APARATO.md`, "O leitor que quebra": *"As bordas de 15 % do palco
ficam por cima do corpo e pegam o toque que começa nelas"*). A régua vai de 32 a 1105,8 dp em C (a divisa em 1085,8–1105,8;
a borda direita começa em 967,1) e de 32 a 679,1 em B (a divisa em 659,1–679,1; a borda em 604,4); o rótulo começa em 32,
dentro da borda esquerda. **O alvo de 48 da QL-D30 só existe no meio da régua.**

**Por que nenhum instrumento viu**: o `native-tela` não tem geometria nem sobreposição (o duplo põe o `onPress` no nó
tocado); o arnês (`ql4.py`, `garantir`) toca a régua pelo `resource-id`, no CENTRO do nó — onde não há borda; e a folha
desenha o alvo sem as bordas, que são invisíveis por desenho. *O instrumento mede o toque no centro; eu li como a extensão do
alvo* — é o **caso 1** do padrão (A14, N1), outra vez. **Decisão do Marcel: QL-D54, parar e redesenhar** (§1).

## 7. Os gates

### 7.1 Sobre esta PR `[medido: gates/gates-nativos-e-suite.txt, gates/gates-web.txt]`

| gate | resultado |
|---|---|
| testes desta PR | `notas-palco.test.tsx` 32 · `notas-reabrir.test.tsx` 2 · `gates.test.ts` (a divisa, 42) · `igualdade.test.ts` (46 nomes) — verdes |
| suíte | `Test Files 147 passed \| 3 skipped (150)` · `Tests 1832 passed \| 59 skipped (1891)` (uma corrida anterior teve 1 falha no `reordenar.test.tsx`, sob carga — div. 1235) |
| `tsc` · lint | raiz 0 · nativo 0 · core 0 · identidade 0 · *No ESLint warnings or errors* |
| G1a / G1b | com o bloco: `G1a: DIFF VAZIO ✓` — as 5 exceções usadas · `G1b: só adição ✓` |
| G2 / G3 | `testIDs antes=121 depois=124 ✓` (os 3 das notas) · `log( antes=70 depois=70`, nenhuma linha sumiu ✓ |
| `gate:a20` · `gate:icones` | 0 acusações (229 literais) · 0 acusações, 0 avisos, 42 registros; CN `IconesFalso` 24 |
| congelados | `DESIGN-V1` 3 · `-N2` 2 · `-N3` 2 · `-N4` 2 · `-QL` 1 OK; o pre-check 355 OK; `b3-pre-ql` 6 OK |
| G-back · G-palco · G-tok (+ cobertura, CSS) · G-faixa | **PASSA** nos quatro; `DESIGN-I1` 14 OK |

### 7.2 O site não muda `[medido: gates/site-nao-muda.txt]`

O catálogo é compartilhado; o site renderiza ícone por nome (`components/identidade/icone.tsx`). **Nenhum arquivo do site
tocado** (`git diff --stat origin/main HEAD -- app components lib public styles …` vazio); **ninguém no site pede a
divisa** (`git grep divisa -- app components lib` → exit 1) e nenhum mapa exaustivo por `NomeIcone`; **o CSS gerado byte a byte
igual** (`app/styles/identidade.css` sha256 `1857944a…` antes e depois de regenerar, `git diff --exit-code` 0). O bundle do
site passa a carregar o desenho no mapa (dado), que nenhuma tela usa `[hipótese: não medido por build]`.

### 7.3 G-inv, G-N3 e G-par de V, nos dois aparelhos `[medido: gates/g-inv-ambos-*.txt, gates/g-n3-ambos.txt, roteiros/]`

| | resultado |
|---|---|
| G-inv `B5-baseline/` | **34 de 34** idênticos — sem nota, nada muda |
| G-inv `B3-referencia-paisagem/` | **18 de 18** idênticos (a B3 depois da errata em par da PR-3) — nenhum dump da base tem nota (a fixture do pre-check não tem `notes`), nenhuma errata em par |
| G-N3 (`--logico docs/native/QL-PR3-anexos/b3-pre-ql`) | **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 · quebra 16 ✓ (84 pares, AVD + Tab) |
| G-par de V no aparelho | **10 de 10** em C e em B, nos dois aparelhos |

## 8. O aparato

- **AVD `octavia_tab32`**: lido `stay_on=1 accel=1 user_rot=0 airplane=1 wifi=0 data=0`, `reverse` vazio, dev client de
  2026-09-24 14:00:01, `ping` → *unreachable*; subido do `default_boot` com `-no-snapshot-save`, uma vez; a receita do cache da
  sessão de audit (5 caminhos) guardada e regravada **5 de 5 md5**; o rádio ligado só na rodada; o fim **igual ao lido**
  (`diff` vazio); `ram.bin` de 2026-09-24 14:00 intacto. **O app abriu uma vez antes do mock** (div. 1236).
- **Tab S6**: lido `stay_on=0 accel=1 user_rot=0 airplane=0 wifi=1 data=1`, `reverse` vazio, travado, **release** de 2026-10-09
  12:45:36 — o APK instalado, puxado do aparelho: **sha256 `070187bf6a59…`, 105.194.421 B, igual ao `release-cf58f7f.apk`**.
  `stay_on` a 7 antes do destravar; `install -r` do dev client (`DEBUGGABLE`); **a receita do cache** (N4-D102): 4 caminhos
  (`setlists.json` `787e7612…`, `content.json` `b27fe166…`, `files-index.json` `b21cc49b…`, o PDF do Marcel `05253d42…`)
  guardados md5 a md5 e tirados por nome — a pasta só com os quatro `._*`; o mock (8789) e o bundle conferidos **antes da
  primeira abertura**. Volta: os arquivos da fixture apagados por nome; **4 de 4 md5 iguais**; `install -r` do release —
  **sha256 do APK instalado `070187bf6a59…`, igual**; sem `DEBUGGABLE`; `lastUpdateTime=2026-10-09 17:55:43`; `stay_on` **0**, e
  os settings e túneis **iguais ao lido**. Destravado pelo Marcel.
- **Metro** sem `CI=1`, `--clear`, `EXPO_PUBLIC_API_BASE_URL=http://localhost:8788` inline; o `apps/native/.env` por `cp -p`
  do checkout principal, **sem abrir** (sha256 `f2bfa179cd8e`, igual — `estado/env-sha.txt`), apagado no fim nas duas
  árvores. **Um mock por aparelho** (AVD 8788, Tab 8789), os arquivos na 8790. O "antes" na árvore temporária da `main`
  (`../octavia-ql-pr4-main`, `4078c64`), removida no fim sem `--force`. **O bundle servido** conferido antes de cada rodada
  (`medidas/bundle-servido-*.txt`): PR `localhost:8788` 1 · `octavia.rocks` 0 · `notas-regua` 1; `main` 1 · 0 · 0.

**Não feito, por causa da parada**: o "antes" (`QL4M-`) no Tab — só o AVD tem o par antes × depois; o A-QL-19.

## 9. As quedas (regra 36) `[medido: quedas/, logcat/]`

| aparelho | aberturas do app | Java | **nativa** | tombstones |
|---|---|---|---|---|
| AVD (a sessão inteira, o logcat desde as 15:22:50) | 63 (`Start proc`) | 0 | **0** | 0 |
| Tab (o logcat desde as 16:42:56, 5 MiB) | 60 (`Start proc`) | 0 | **0** | 0 — e o `dropbox` sem nada do app na janela |

As 6 `FATAL EXCEPTION` do logcat do AVD (e 6 do Tab) são do **processo do `uiautomator`** (*"UiAutomationService … already
registered"*, o instrumento dos eventos), não do app — o `quedas.py` as separa (div. 1240). **Nenhuma queda com o palco ou V
montados.**

## 10. Os blocos de declaração desta PR (a cópia que a regra do W4-b2 pede)

```gates
# QL-PR4 — as notas da música no palco, a divisa e o estado lembrado (QL-D30…QL-D32, QL-D39; QL-D49, QL-D52, QL-D53). Nenhuma linha de log nova.
# Tablet: as notas no topo do corpo (NotasDoPalco.tsx, novo); a preferência das notas recolhidas no aparelho (preferencias.ts, novo: a chave octavia:palco:notas-recolhidas no AsyncStorage); a âncora vira um gancho do leitor e soma onde o corpo começa (Leitor.tsx); o palco liga as notas e a âncora com elas (StageScreen.tsx); V ganha a âncora ao girar (VisualizacaoScreen.tsx).
g1a: apps/native/src/preferencias.ts
g1a: apps/native/src/screens/Leitor.tsx
g1a: apps/native/src/screens/NotasDoPalco.tsx
g1a: apps/native/src/screens/StageScreen.tsx
g1a: apps/native/src/screens/VisualizacaoScreen.tsx
```

```gates-web
# QL-PR4: nenhuma declaração — nenhum arquivo do núcleo do G-back tocado. O catálogo compartilhado (packages/identidade/src/icones.ts) ganha a divisa; o site não a usa, e o CSS gerado não muda.
```

## 11. Os checks da PR

Sobre o head **`20fdbbe`** (o último commit de código), **todos verdes**, antes deste commit de docs `[medido: gh pr checks
376; gh api …/attempts/<n>/jobs]` (nível **job**; `n=1` — não é referência):

| check | estado | duração (job) |
|---|---|---|
| `build` · `gates-nativos` · `g-back` · `g-palco` · `g-tok` · `g-faixa` · `mudou-nativo` · Vercel | pass | 4m44s · 15s · 33s · 19s · 35s · 17s · 15s · — |
| `android-debug-apk`, tentativa 1 | **failure** | 13m10s (18:19:20 → 18:32:30 UTC) — `:app:packageDebug` (*"A failure occurred while executing … PackageAndroidArtifact$IncrementalSplitterRunnable"*, sem causa no log) |
| `android-debug-apk`, tentativa 2 (o rerun, um só) | **pass** | 13m51s (18:58:58 → 19:12:49 UTC) — dentro da faixa do regime 2 (`CI-FAIXA.md`: mín 8m09s, máx 14m32s) |

A falha classificada **(b) runner** (regra 16; div. 1237): a PR não toca nenhuma entrada do build nativo (`git diff
--name-only` fora de `src`/`test`/`scripts`: só o `vitest.config.mts`), a falha é no empacotamento, e o rerun passou.

## 12. Divergências — 1229 a 1240

A última usada era a **1228** (`QL-PR3-anexos/README.md` §16.2) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\*' -- docs →
máximo 1228; nenhum número ≥ 1229 em prosa como divergência]`.

Origem: **P** premissa do prompt · **D** documento anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1229** | D | O QL-R14 diz que as notas *"quebram pela mesma função (R1)"*; o prompt e a folha dizem que **não** passam pelo `quebrar` e quebram *"como qualquer texto de UI"*. O `quebrar` conta colunas de mono; as notas são Manrope | a regra R1 (cortar na palavra) pela quebra de texto da plataforma; errata de ponteiro no QL-R14 |
| **1230** | D | A folha desenha as notas só sobre a Letra; nada diz do palco com ARQUIVO (S3d/S3e) nem dos placeholders, que não têm a rolagem do corpo | as notas só no corpo de texto (a Letra, a Cifra, a Tab); fica como pergunta para a volta da PR-4 |
| **1231** | D | A régua na folha: o rótulo com 0,2 em (144 dp) e, no zoom 40, 62 de altura; o repositório: *"a régua de V"* (0,14: 133,3 dp) e *"48"* | **QL-D53**; errata **QL-E3** |
| **1232** | D | A folha não diz o que a âncora faz com a marca ainda dentro das notas (nem dentro dos *Detalhes* de V em B) | **QL-D52** |
| **1233** | A | **As bordas de 15 % ficam por cima da régua das notas**: o toque na divisa avança a música, no rótulo volta uma (§6) | **QL-D54**: a PR-4 parada; a navegação por ícone se decide antes |
| **1234** | T | Dois testes do commit 1 com defeito, achados ao implementar: um com a conta errada (três passos de zoom sobre 26 colunas dão 14) e o *"abrir V sem rolar e girar"* que passava na `main` por não pedir rolagem nenhuma | corrigidos no commit 2 (declarado na mensagem); o segundo passa a exigir o pedido, e o CN de V reprova os 4 casos (`cn-ancora-v.txt`) |
| **1235** | T | `reordenar.test.tsx` (*"(f) T2-R10 — 404 no reorder"*) falhou 1 vez em 3 corridas da suíte inteira; 3 de 3 isolado e as 2 corridas inteiras seguintes verdes — o arquivo não é tocado pela PR | registro (instabilidade sob carga); herança para o **W5** (o mesmo lugar das instabilidades de teste) |
| **1236** | T | No AVD o app abriu uma vez **antes do mock** (a `cadeia.sh` só refaz os túneis; quem sobe o mock é o arnês, em alguns estados): *"sem conexão"*, `sync fail … code=network` — sem dado no aparelho e com o bundle em `localhost:8788`, nenhum pedido saiu | o mock passa a subir antes da cadeia; `APARATO.md` |
| **1237** | T | O `android-debug-apk` falhou no `packageDebug` (tentativa 1) | (b) runner; um rerun, verde (§11) |
| **1238** | T | O começo do corpo de V em B, lido do topo do `corpo` no dump, arredonda a borda de 1 dp (2,25 px): 461 em vez de 461,25 — o primeiro giro C → B do AVD deu Δ 0,6 px | o `ql4.py` mede pelo `view-leitor` (+ 2,25 px); o plano do AVD recalculado do dump salvo (`inicio_px_ql4_original` no plano); Δ 0,3; `APARATO.md` |
| **1239** | T | O S1e do Tab: na 1ª corrida o Wi-Fi não tinha voltado (o S1e saiu *"sem conexão"*: G-inv 117 × 128 nós, G-N3 (e)=2); refeito isolado, a hora da última sincronização (*"há 16 min"* × *"agora"*) | refeito com `S1 S1e` (o caminho do Tab): 34 de 34; o dump da 1ª corrida fica à parte (`dumps/s1e-tab-1a-corrida-fora-da-base.xml`) |
| **1240** | T | 6 `FATAL EXCEPTION` em cada logcat, do processo do `uiautomator` (o instrumento dos eventos), não do app | o `quedas.py` conta só o app (§9) |

**Contagem** `[medido: a coluna]`: **12 — D 4 · A 1 · T 7** (D: 1229–1232 · A: 1233 · T: 1234–1240). **A próxima livre é a
1241.**

## 13. Contabilidade

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` copiado por `cp -p` e conferido por sha256, sem abrir, apagado nas duas árvores |
| `octavia.rocks` | **0** em cada bundle servido (quatro conferências) e **0** em cada logcat (AVD, Tab); as linhas `api` todas `path=/api/…` ao mock (AVD 121, Tab 96) |
| AVD `octavia_tab32` | começo e fim **iguais** (§8); subido uma vez com `-no-snapshot-save`; a receita (5 caminhos) md5 a md5; `ram.bin` intacto |
| Tab S6 | **começo: release cf58f7f · fim: release cf58f7f** (sha256 do APK instalado igual nos dois); `stay_on` 0 → 7 → **0**; settings e túneis iguais ao lido; o cache do Marcel fora do aparelho durante o mock e de volta, 4 de 4 md5; a chave das notas não ficou; as cópias do Mac **apagadas** |
| quedas | **0** — Java 0 · nativa 0 · tombstones 0, nos dois aparelhos |
| agentes | **0** |
| temporários | no scratchpad da sessão: as fixtures geradas, os bundles baixados, os logcats brutos; a árvore `../octavia-ql-pr4-main` removida |
| perguntas ao Marcel nesta sessão | a âncora nas notas (QL-D52), a régua (QL-D53), o destravar do Tab, os três julgamentos, as bordas (QL-D54) |

---

**A próxima** *(escrito na parada)*: a PR-4 está parada (QL-D54). Antes de ela voltar, a navegação por ícone (a próxima música sem as bordas
invisíveis) se decide num bloco com desenho; a PR-4 volta com o A-QL-19 (o traço, nos dois estados) e o "antes" do Tab.
*(Respondido pela QL-D55: a PR volta antes do bloco da navegação, com a QL-D56 — §14.)*

---

## 14. A volta — o aval da parada (QL-D55…QL-D60) e o código final

Base: a mesma (`origin/main` = `4078c64`, conferido — nenhuma mudança na `main` desde a parada). Commits da volta, na ordem do
rito: `68c1510` `test(ql): QL-D56 — … reprovando` · `9f4d26a` `fix(ql): QL-D56 — a borda entrega à régua das notas o toque que
cai nela` · `3889e2d` `test(ql): QL-D58 — … reprovando` · `ce1adb1` `feat(ql): QL-D58 — as notas também quando o corpo não é
texto` · o de docs (este). Os anexos da volta estão em [`volta/`](volta/), na mesma forma das pastas da primeira rodada.

### 14.1 As decisões `[Marcel, 2026-10-09]`

| # | decisão |
|---|---|
| **QL-D55** | **A saída da QL-D54 em duas partes.** (1) Agora, nesta PR: uma regra que conserta o defeito achado no Tab (QL-D56). (2) Depois: **a navegação do palco repensada por inteiro**, como **bloco próprio**, com pre-check, brief e desenho — bordas visíveis ou não, gesto de deslizar, pedal Bluetooth, controles explícitos. O QL não espera esse bloco. |
| **QL-D56** | **Nenhuma borda invisível de toque fica sobre um controle.** As bordas de 15 % continuam valendo sobre o texto do corpo (a letra e o texto das notas). **A régua das notas, com o rótulo e a divisa, fica fora delas**, e o mesmo vale para qualquer controle que entrar no corpo do palco no futuro. Um toque em qualquer ponto da régua recolhe ou abre, e nunca avança nem volta a música. |
| **QL-D57** | **A fila:** o bloco da navegação do palco entra **depois do resto do D e antes do N5** (o celular vai precisar dela e não comporta bordas sobre controles): **QL → SY → resto do D → navegação do palco → N5 → identidade → iOS**, com o W5 à parte. Errata de ponteiro no `docs/ux/PLANO-TRANSICAO.md`. |
| **QL-D58** | (div. 1230) **As notas aparecem também quando o corpo não é texto**: na Partitura (PDF) e nos estados sem corpo de texto. A mesma régua, a mesma divisa, o mesmo estado lembrado e a mesma QL-D56. |
| **QL-D59** | (div. 1235) **O `reordenar.test.tsx` instável vai ao W5**, como herança. Esta PR não toca nele. |
| **QL-D60** | **Lição para o encerramento:** todo controle novo no corpo do palco se confere contra as bordas de toque, no brief, no desenho e no prompt. O defeito passou pelo brief, pela folha e pelo prompt da PR-4 — divergências **1241** (P, o revisor) e **1242** (D, o brief e a folha). No `QL-REQUISITOS.md`, o escopo do encerramento. |

Registradas também: o **QL-R24** (QL-D56) e o **QL-R25** (QL-D58), com os aceites **A-QL-22** e **A-QL-23**, no
`QL-REQUISITOS.md`; a errata **QL-E4** no `DESIGN-QL/README.md` §6 (as bordas não cobrem a régua; a moldura não se edita).

### 14.2 O conserto da QL-D56 — o rito `[medido: volta/qld56-*.txt]`

- **Os testes primeiro** (`apps/native/test/notas-bordas.test.tsx`, 11): o toque na **divisa** (sob a borda de avançar), no
  **rótulo** (sob a de voltar) e no **meio** da régua, em B e em C, no topo e na base dos 48, rolado pouco — recolhe ou abre e
  **não troca de música**; e os controles do que não pode mudar: o texto das notas, a letra, o respiro ao lado da régua e o
  corpo rolado (a régua fora da tela) **seguem navegando**; sem nota, a borda avança. **Contra o código de antes: 6 reprovam, 5
  passam** (`volta/qld56-reprovando.txt`). O duplo ganhou o ponto do toque no `onPress` (`locationX/Y`, como o RN; `tocarEm`,
  div. 1244).
- **A implementação, declarada: por ORDEM DE CAPTURA.** A borda continua capturando o toque — o mesmo nó, do mesmo tamanho
  (a base do G-inv não muda) — e o **entrega à régua** quando ele cai na faixa dela: `toqueNaRegua` (`NotasDoPalco.tsx`) põe o
  ponto do toque no sistema do `meio` (onde as bordas começam) contra a régua na tela — o `y` do bloco das notas menos a
  rolagem do corpo, 48 de altura, do respiro esquerdo ao direito (32). Fora da faixa, a borda faz o que sempre fez. Não foi
  por área de toque (recortar as bordas em volta da régua): a régua rola com o corpo, e a área teria de se refazer a cada
  quadro da rolagem.
- **O controle negativo**: com o conserto desligado (`toqueNaRegua` devolvendo sempre `false`), os 6 reprovam **pela razão
  certa** — *"a música trocou (avançou ou voltou)"*, seis vezes (`volta/qld56-cn-conserto-desligado.txt`).

### 14.3 As notas fora do corpo de texto (QL-D58) — couberam, e foram implementadas

**A leitura** (`StageScreen.tsx`): o `meio` desenha o formato (`FormatoDoLeitor`), o arquivo (`Arquivo`: o PDF com `flex: 1`,
o *baixando*, o S3e com o *Baixar*) ou a rolagem do texto, com o placeholder do item sem corpo dentro dela. **Couberam do
jeito pedido**: no item sem corpo, dentro da rolagem, acima do placeholder (como na Letra); no formato e no arquivo, num bloco
fixo no topo da área (o respiro do corpo dos lados e em cima), acima dele — **o PDF com as mesmas props** (a paginação é a
mesma), **as bordas os mesmos nós** (a régua fora delas pela QL-D56, ali sem rolagem), **nenhum controle sob as notas** (o
*Baixar* fica abaixo). **Sem nota, nenhum invólucro**: a árvore é a de hoje.

**Os testes primeiro** (`apps/native/test/notas-fora-do-texto.test.tsx`, 8): o S3e, o *baixando*, o formato e o item sem
corpo com as notas acima, o mesmo estado lembrado, a mesma QL-D56, e sem nota o nó de hoje. **Contra o código de antes: 6
reprovam, 2 passam** (os de sem nota) — `volta/qld58-reprovando.txt`. O S3d não se alcança no duplo (o arquivo não baixa no
`jsdom`); ele passa pelo mesmo invólucro do arquivo e se mediu no aparelho.

### 14.4 No aparelho, com o código final `[medido: volta/medidas/, volta/roteiros/, volta/eventos/]`

A fixture da volta (`instrumentos/fixture-ql4.py`) acrescenta à de antes **três Partituras com a nota** (posições 6, 7 e 8: o
PDF que baixa, o `.jpg`, o PDF que dá 404), com outro `updated_at` na setlist (o sync não guarda a de 5 do cache).

| medida | AVD | Tab |
|---|---|---|
| **o toque na régua** (`input tap` no centro da divisa, do rótulo e da régua; C e B × escuro e claro) | **12 de 12**: recolhe ou abre, a posição *3 DE 8* não muda; a divisa cai na `borda-avancar`, o rótulo na `borda-voltar` | **12 de 12** |
| o controle: a borda de avançar sobre a letra | *3 DE 8 → 4 DE 8* | *3 DE 8 → 4 DE 8* |
| **o toque na régua sobre o PDF** (C e B) | **6 de 6**, *6 DE 8* | **6 de 6** |
| **as notas no PDF, no formato e no S3e** (C e B) | o bloco no topo, a área do estado abaixo dele (C: notas 252–620 px, PDF de 674 em diante); *página 1 de 12* | igual |
| **a paginação do PDF** (deslizes no meio da página até a 2) | C: 6 com as notas abertas, 3 recolhidas · B: 1 e 1 | C: 4 e 3 · B: 1 e 1 |
| **a âncora** (±0,5 px) — palco com as notas abertas, recolhidas, a marca nas notas; V nos dois giros e nos Detalhes | **todos os passos** (Δ ≤ 0,4) | **todos os passos** (Δ ≤ 0,5) |
| **G-par de V** | 10 de 10 em C e B | 10 de 10 em C e B |

**A paginação**: o PDF vira a página com as notas abertas e recolhidas, nas duas faixas. Em C com as notas abertas a área do
PDF fica com 231 dp (Tab) e o deslize do arnês, que vai da base ao topo da área, fica mais curto — por isso mais deslizes; o
*fit width* rola dentro da página antes de virar (`Leitor.tsx`), como antes. **O deslize não troca de música** em nenhum caso.

### 14.5 Os gates sobre o código final (`ce1adb1`) `[medido: volta/gates/]`

| gate | resultado |
|---|---|
| G-inv `B5-baseline/` · `B3-referencia-paisagem/` | **34 de 34 · 18 de 18**, nos dois aparelhos |
| G-N3 (`--logico docs/native/QL-PR3-anexos/b3-pre-ql`) | **(e)=0 · (b)=0** · nome-acessível 8 · rolagem 6 · quebra 16 ✓ |
| G-par de V | 10 de 10, nos dois aparelhos (§14.4) |
| `gate:icones` · `gate:a20` | 0 acusações, **42 registros**, as 8 células e as 18 molduras da divisa; CN `IconesFalso` 24 · 0 acusações (229 literais) |
| G1a / G1b / G2 / G3 | `G1a: DIFF VAZIO ✓` (as 5 exceções do bloco, as mesmas) · `G1b: só adição ✓` · `testIDs 121 → 124 ✓` (nenhum novo na volta) · `log( 70 = 70 ✓` |
| suíte · `tsc` (de dentro de cada pacote) · lint | `Test Files 149 passed \| 3 skipped (152)` · `Tests 1851 passed \| 59 skipped (1910)` · raiz 0 · nativo 0 · core 0 · identidade 0 · sem aviso |
| os do site | G-back · G-palco · G-tok (+ cobertura, CSS) · G-faixa: **PASSA**; nenhum arquivo do site tocado |
| CI (`ce1adb1`) | **todos verdes**: `android-debug-apk` **13m01s** (job, primeira tentativa) · `build` 4m46s · `gates-nativos` 12s · `g-back` 32s · `g-palco` 19s · `g-tok` 33s · `g-faixa` 20s · `mudou-nativo` 11s · Vercel |

O bloco ```` ```gates ```` do corpo é **o mesmo da §10** (os arquivos que a volta mexeu — `StageScreen.tsx`,
`NotasDoPalco.tsx` — já estavam nele); o ```` ```gates-web ```` também.

### 14.6 Os julgamentos do Marcel, no Tab — verbatim

No palco da *Lanterna da fixture* (1 de 8), deitado, notas abertas, a rotação automática ligada; para o PDF, a 6 de 8
(*Partitura da fixture QL*). As perguntas pediam *sim ou não, e a razão*; a razão não veio escrita em nenhuma, e fica assim.

| pergunta | resposta |
|---|---|
| **A-QL-19** — o traço da divisa em 20 dp, nos dois estados e nos dois temas, está bom? | **"Sim"** |
| o toque na régua recolhe e abre na primeira tentativa, com a mão, inclusive tocando na divisa e no rótulo, sem trocar de música? | **"Sim"** |
| as notas sobre o PDF se leem e não atrapalham a página? | **"Sim"** |

### 14.7 O aparato e as quedas `[medido: volta/estado/, volta/quedas/]`

- **AVD**: subido **duas vezes** do `default_boot` com `-no-snapshot-save`: a primeira para a base, os estados da volta e a
  âncora; a segunda porque o S0 frio da primeira não se alcançou (a queda abaixo) — nela, a sonda da paginação e o S0
  (capturado). Nas duas, o repouso lido igual (`avd-antes.txt`, `avd-antes-2.txt`); a receita do cache da sessão de audit
  guardada e, na segunda, regravada **5 de 5 md5** (a primeira subida se desfez no desligar sem salvar); o mock de pé **antes**
  da primeira abertura (div. 1236); o rádio só nas rodadas; o fim **igual ao lido**; `ram.bin` de 2026-09-24 14:00 intacto.
- **Tab**: o mesmo caminho da §8 — release `cf58f7f` lido (sha256 do APK instalado `070187bf6a59…`, igual), `stay_on` a 7 antes
  do destravar, o dev client, a receita (4 caminhos, os mesmos md5), o mock (8789) e o bundle conferidos **antes** da primeira
  abertura; na volta, **4 de 4 md5** regravados, o release reinstalado (**sha256 igual**), `stay_on` **0**, settings e túneis
  **iguais ao lido**; a chave das notas **não ficou** (0 no `RKStorage`; o controle, as chaves `firebase:`, 2).
- **O bundle servido** com o código final (`volta/medidas/bundle-servido-*.txt`): `localhost:8788` 1 · `octavia.rocks` **0** ·
  `toqueNaRegua` 5 · `comNotasFixas` 4.

| quedas (regra 36) | aberturas do app | Java | **nativa** | tombstones |
|---|---|---|---|---|
| AVD, 1ª subida | 58 | 0 | **2** | 2 |
| AVD, 2ª subida | 6 | 0 | **0** | 0 |
| Tab (o logcat das 20:55 em diante; o `dropbox`, a sessão inteira) | — (o anel girou) | 0 | **0** | 0 — o `dropbox` sem nada do app |

**As duas nativas do AVD** (div. 1243) — a assinatura da **N4-D105** e da div. 1222: `Fatal signal 11 (SIGSEGV), code 2
(SEGV_ACCERR)`, thread `mqt_v_js`, `#01 facebook::react::MountingCoordinator::pullTransaction(bool) const+524` · … · `#05
ShadowTree::mount`, com os tombstones no `dropbox` (18:59:10, 19:21:34). **O momento das duas**: uma abertura fria logo depois
de um `force-stop` do arnês — o processo 7372 nasceu às 18:59:03 (entre dois estados da âncora) e caiu às 18:59:09; o 17667
nasceu às 19:21:13 (a abertura do S0 frio) e caiu às 19:21:24 — **e nenhum dos dois emitiu uma só linha `OCTAVIA:`**: antes
da primeira tela, **antes de o palco ou V montarem**. Pela condição da QL-PR3 (§8: *"se … sair uma queda nativa com o palco ou
V montados … pare e reporte"*), **não é parada**: registro, ligado à N4-D105. **Nenhuma queda com o palco ou V montados**, nos
dois aparelhos.

### 14.8 Não feito, declarado

- **O "antes" (`QL4M-`) no Tab** — só o AVD tem o par antes × depois das telas das notas (§8); a volta não o pediu.

### 14.9 Divergências da volta — 1241 a 1247

A última usada era a **1240** (§12) `[medido: git grep -nE '^\| \*\*(1[12][0-9]{2})\*\*' -- docs → máximo 1240]`.

| div. | origem | o quê | destino |
|---|---|---|---|
| **1241** | P | **O prompt da PR-4 (o revisor) pôs um controle no corpo do palco sem o conferir contra as bordas de toque** (QL-D60) | a lição no escopo do encerramento (`QL-REQUISITOS.md`); a QL-D56 |
| **1242** | D | **O brief e a folha desenharam a régua sob as bordas de 15 %**, que a folha não desenha por serem invisíveis (QL-D60) | a errata QL-E4; a lição no encerramento |
| **1243** | A | 2 quedas nativas no AVD (a assinatura da N4-D105), em aberturas frias **antes da primeira tela** — uma delas derrubou o S0 frio da 1ª subida | registradas (§14.7), ligadas à N4-D105; o S0 refeito numa 2ª subida |
| **1244** | T | O duplo do `Pressable` chamava o `onPress` sem evento: o ponto do toque (`locationX/Y`), que a borda lê, não existia no `native-tela` | o duplo entrega o ponto (`__proximoToqueEm`, `tocarEm`); sem `tocarEm`, 0 · 0, que os testes de antes nunca leram (regra 32) |
| **1245** | T | O teste da QL-D56 do commit `68c1510` com o `vi.fn` sem assinatura (o `tsc` reprovou) e o "recolheu" conferido antes do "não trocou" — o controle negativo reprovaria pela razão errada | corrigidos no commit do conserto (`9f4d26a`), declarado na mensagem |
| **1246** | T | Um deslize no meio da página do PDF nem sempre a vira: o *fit width* rola dentro da página antes (`Leitor.tsx`); o número de deslizes do arnês depende da altura da área | a sonda conta os deslizes até a página 2 (§14.4) |
| **1247** | T | O anel do logcat do Tab (5 MiB) girou de novo numa rodada longa: o logcat guarda das 20:55, a rodada começou às 19:33 | a contagem de quedas completada pelo `dropbox` (a sessão inteira), como na div. 1223 |

**Contagem** `[medido: a coluna]`: **7 — P 1 · D 1 · A 1 · T 4** (P: 1241 · D: 1242 · A: 1243 · T: 1244–1247). **A próxima livre é
a 1248.**

### 14.10 Contabilidade da volta

| | |
|---|---|
| requisições a prod · logins · `.env*` abertos | **0 · 0 · 0** — o `apps/native/.env` por `cp -p`, sha256 `f2bfa179cd8e` igual, sem abrir, apagado |
| `octavia.rocks` | **0** nos bundles servidos (dois) e **0** nos logcats (AVD 1ª e 2ª subidas, Tab); as linhas `api` todas `path=/api/…` ao mock (AVD 112 + 9, Tab 48 no trecho guardado) |
| AVD `octavia_tab32` | começo e fim **iguais** ao lido; duas subidas sem salvar; `ram.bin` intacto |
| Tab S6 | **começo: release cf58f7f · fim: release cf58f7f** (sha256 igual); `stay_on` 0 → 7 → **0**; settings e túneis iguais; o cache do Marcel fora durante o mock e de volta 4 de 4 md5; as cópias do Mac **apagadas**; destravado pelo Marcel |
| quedas | **2 nativas** no AVD, antes da primeira tela (§14.7) · Java 0 · Tab 0 · **nenhuma com o palco ou V montados** |
| agentes | **0** |

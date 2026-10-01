# I1 — ENCERRAMENTO

**A fonte do bloco — e um índice, não uma segunda cópia.** Tudo o que este arquivo afirma
aponta para o documento, a PR ou o anexo onde está; onde a prosa daqui e a fonte divergirem,
vale a fonte. Nenhum texto de decisão ou de errata é reescrito aqui.

- **Bloco**: I1 — **identidade** (I1-D1): o web ganha a identidade visual do app nativo, em
  pt-BR, mantém cadastro, edição e auth, e perde o palco (I1-D2, I1-D5).
- **Janela**: 2026-09-26 (pre-check, #335, merge `089f72c` às 15:52:45Z) → 2026-09-30 (I1-PR-15,
  #352, merge `c1640e5` às 23:18:28Z).
- **Esta PR** (#350): só docs, árvore `../octavia-i1-encerramento`, branch `i1/encerramento`. O
  commit 1 (`770ed77`) foi escrito sobre `1cb897f` (a #349); o aval mandou abrir a PR-2 e a PR-15
  antes do fecho, e o commit 2 foi escrito depois de trazer a `main` com as duas (merge `1f15083`).
  **O sha do encerramento é `c1640e5`** (o merge da #352). Nenhuma request a prod, nenhum login,
  nenhum `.env*` (a árvore só tem o `.env.example` versionado); `pnpm install --frozen-lockfile
  --offline`.
- **Convenção**: `[medido]` = comando + saída literal nesta sessão, no anexo
  [`I1-ENCERRAMENTO-anexos/contabilidade.txt`](I1-ENCERRAMENTO-anexos/contabilidade.txt);
  `[lido]` = tirado do documento citado, sem medir de novo.
- **Divergências desta PR**: **917–932** (commit 1), **951–954** (commit 2) e **955** (commit 3) — as 933–950 são da PR-2 e da PR-15 (§15).
- **Como este documento foi lido**: os 15 `README.md` de anexo do bloco (e o do pre-check) foram
  lidos inteiros por cinco agentes de leitura, em paralelo, com extração por roteiro fixo (decisões,
  erratas, divergências, heranças, instrumentos, contabilidade); o `I1-PRECHECK.md`, o
  `DESIGN-I1/README.md` §2/§4/§7 e o `N3-ENCERRAMENTO.md` pelo executor; no commit 2, os `README.md` da PR-2 e da PR-15, inteiros, pelo executor. Toda citação de seção
  foi conferida com `grep` do cabeçalho.

> **"QUANDO NÃO CABE, A COMPOSIÇÃO EMPILHA; O CONTEÚDO NÃO SAI."** — a regra do N3 que o web
> herdou (I1-D7 item 2). No web ela valeu também em A, **sem folha**: a errata da I1-D11 fez
> (e) e (b) reprovarem em 411, e cada superfície empilhou mecanicamente.

---

## 1. O que o I1 entregou

**Para o músico**: o web é **o mesmo app do tablet, em outra tela** — as cores, a tipografia, os
ícones e as frases do nativo, em **pt-BR**, numa **casca** de barra superior (a lateral velha
morreu); as oito superfícies (auth, landing, política, lista, visualização, editor, upload,
setlists) desenhadas pela folha `DESIGN-I1`, estado a estado; **toda falha é uma frase com o
motivo na tela** (nenhum toast, nenhum erro engolido — H-I1-5); o login não entra mais em
**loop mudo** (H-I1-2, H-I1-7); o **login com Google** funciona (H-I1-3, PR-2); a tela de erro global é da
identidade. **Sem palco** (tocar é do
nativo), **sem PWA e sem offline** (o web é só online), e **nada de backend mudou** (I1-D9; o
G-back é a prova).

**Para o código**: `packages/identidade` (tokens, faixas, ícones) é **compartilhado** — o nativo
importa o objeto, o web consome as custom properties geradas (`app/styles/identidade.css`, com
gate "gerado == fonte"); `components/ui/` (shadcn), Radix, `lucide-react`, `sonner` e o tema
velho saíram. **Quatro gates do web** (`gates-web.yml`: G-back, G-palco, G-tok, G-faixa), mais a
**cobertura da lista do G-tok** e a **regra 828** (inglês em string de `.ts`), com linha de base
do web velho e medição commitada por superfície × estado × largura.

**O login com Google** (I1-D6, *"consertar, não revogar"*) quase ficou de fora: a PR-2 do
fatiamento não tinha sido aberta até o commit 1 deste encerramento (div. 920, origem P — o revisor
pulou da PR-1 para a PR-3). O aval a mandou abrir **antes do fecho**: #351, as três diretivas
medidas uma a uma, aceite real do Marcel. E a **PR-15** (#352) fez a poda que o §17 da PR-14 ainda
listava e comprimiu o rastro das medições (decisões 2 e 3 do aval).

**Os números** `[medido]` (comandos e saídas no anexo `contabilidade.txt`):

| o quê | antes (pre-check, `c57d81f`) | depois (`c1640e5`) | fonte |
|---|---|---|---|
| rotas | 18 `page.tsx` + 14 `route.ts` `[lido: pre-check §1]` | `pnpm build` em `c1640e5`: **27** — 13 páginas + `/_not-found` + 13 API. **Mortas**: `/performance` (e o seu `loading`), `/profile`, `/settings`, `/setup`, `/offline`, `/api/proxy` | §3 do anexo |
| arquivos na lista do G-tok | 0 (a lista nasce vazia na PR-5) | **132** — dos quais **129** são "arquivo de tela" pela cobertura (FORA 0) e 3 não são (div. 922) | `g-tok.mjs`, `g-tok-cobertura.mjs` |
| literais de identidade · toasts · imports de `ui/*` nos 132 | — | **0 · 0 · 0**; strings de `.ts` examinadas (828): 446; frases isentas 5 de 5 | `g-tok.mjs` |
| frases pt-BR | 12 em português em todo o web, todas da política `[lido: div. 496]` | **421** folhas de texto nos dez `components/*/frases-*.ts` (contando o reúso: o `FRASES_AUTH` aponta para frases do `FRASES_SESSAO`) | §5 do anexo |
| linhas | — | soma dos merges: **+977 959 −190 170**; sem `docs/`, sem as medições/esperados e sem o lockfile: **+19 685 −27 230** (por PR na §2). O líquido `c57d81f..c1640e5`: +816 532 −28 743 (tudo) · +19 365 −26 910 (sem docs, medições e lockfile) | §9 do anexo |
| dependências do `package.json` | — | **40 removidas** (`localforage` na PR-3; `sonner` na PR-13; 22 `@radix-ui/*`, `class-variance-authority`, `lucide-react`, `react-day-picker`, `react-resizable-panels`, `tailwindcss-animate` na PR-14; `isomorphic-dompurify`, `react-hook-form`, `@hookform/resolvers`, `zustand`, `immer`, `date-fns`, `cmdk`, `next-themes`, `lru-cache`, `@types/debug`, `autoprefixer` na PR-15); **1 adicionada** (`@octavia/identidade`, workspace); o `build:sw` saiu | §4 do anexo |
| testes (`pnpm test`) | **1175** casos (1090 passed · 85 skipped), 119 arquivos | **1239** (1181 passed · 58 skipped), 121 arquivos — em `c1640e5` | §1–§2 do anexo; o "1101" do prompt não existe (div. 921) |
| APKs construídos | — | **7** (`android-debug-apk` `success`): PR-4 ×1 + push; PR-6 ×1 + push; PR-9 ×2 + push. **7 pulados** (pushes de docs depois do verde — a regra 18). A PR-2 e a PR-15 não dispararam o `native.yml` | §8 do anexo |
| G-faixa sobre as medições vivas | — | **PASSA**, 14 medições, (e)=0 e (b)=0 nas três larguras; contados à parte: errata candidata 773 (todas cobertas) · quebra por dado 42 · não medidos 26 | `g-faixa-veredito.mjs` |
| linha de base do web velho (`cn-main`) | REPROVA 46 (PR-5) | REPROVA **83** — o mesmo web velho, com 411 contado (errata da I1-D11); é **registro**, não tela viva (div. 924) | idem, sobre `medicoes/cn-main` |
| G-palco · `SHA256SUMS` do `DESIGN-I1` | — | **0 ocorrências** · **14/14 OK** | `g-palco.sh`; `shasum -c` |
| o rastro das medições | — | **22** JSON do rastro em `.json.gz` (3 203 276 → 153 610 bytes), lidos pelo `ler-medicao.mjs`; `du -sh tests/gates-web/medicoes` **13M → 10M**; `esperado/` 3,0M | PR-15 §5; §7 do anexo |

---

## 2. Índice das PRs — #335 … #352

`[medido: gh pr view <n> --json commits,mergeCommit,mergedAt; git diff --shortstat M^1 M]`, em
ordem de número (que é a de merge). **Linhas** = sem `docs/`, medições, esperados e lockfile
(`prs.txt` do anexo tem o total com tudo). **O número** = o antes → depois que a própria PR pôs
em destaque.

| PR | nome | merge | commits | o que entregou | o número | linhas | anexo | divs. |
|---|---|---|---|---|---|---|---|---|
| **#335** | pre-check | `089f72c` | 4 (`e799235`, `4a88cf4`, `ff39c3c`, `58dec0e`) | Fase A (A1–A14), Fase B em prod pela regra 12 (probes 1, 2, 4); **I1-D1…D36** | probe 1: **52 `POST` · 51 `GET /api/profile` · 104 navegações** em 60 s, a tela muda | 0 | [`I1-PRECHECK.md`](I1-PRECHECK.md), [`I1-PRECHECK-anexos/`](I1-PRECHECK-anexos/README.md) | 480–521 |
| **#336** | PR-1 — o loop mudo | `b68305b` | 4 (`1f1525c` gate · `26d2c68` conserto · `f8b2485` aparato · `0894d51` docs) | `setSessionCookie` devolve a espécie da falha; navega só com 2xx; uma falha é uma tela (`LinhaDeAviso`), não uma volta | CN de tela **10 falham → 15/15**; no navegador **52 · 51 · 104 → 1 · 0 · 0** | +735 −144 | [`I1-PR1-anexos/`](I1-PR1-anexos/README.md) | 522–531 |
| **#337** | PR-3 — o corte | `efde410` | 7 (`6196d02` … `b698c53`) | palco, PWA/offline, `/api/proxy` e `/profile` `/settings` `/setup` `/offline` fora; `public/sw.js` de auto-destruição; redirects 308 | **G-palco 141 → 0**; 69 arquivos apagados | +481 −13 028 | [`I1-PR3-anexos/`](I1-PR3-anexos/README.md) | 550–580 |
| **#338** | congelamento da folha | `d18b7c4` | 2 (`b2b7ad0`, `a81eb45`) | `DESIGN-I1` (9 folhas, `SHA256SUMS`), requisitos `T-I1-R`, erratas **I1-E1…E5** | **286 `T-I1-R`** (hoje 282, I1-E15) | 0 | [`DESIGN-I1/README.md`](DESIGN-I1/README.md) | 581–596 |
| **#339** | PR-4 — `packages/identidade` | `73612be` | 4 (`4568877` … `86f1eb3`) | tokens, faixas e ícones no pacote; o nativo importa; `identidade.css` gerado; **I1-E6** | identidade **37/37**, nativo **211/211** antes e depois, mapa de ícones byte a byte | +2 163 −582 | [`../native/I1-PR4-anexos/`](../native/I1-PR4-anexos/README.md) | 597–611 |
| **#340** | PR-5 — os gates | `98673ed` | 3 (`a3b58e9`, `86ac70a`, `2fc4bb0`) | G-back, G-palco, G-tok, G-faixa e `gates-web.yml`; a linha de base | **linha de base REPROVA 46** (o web velho) | +1 613 −2 | [`I1-PR5-anexos/`](I1-PR5-anexos/README.md) | 612–635 |
| **#341** | PR-6 — auth (o molde) | `c8533c4` | 6 (`1d47884` … `c4e1bd6`) | cinco telas de auth pela folha 1; bloco `web` no pacote; fontes; faixa A empilha; **I1-E7…E10** | **G-tok 453 → 0**; veredito em 411 **383 → 0** | +1 853 −1 004 | [`I1-PR6-anexos/`](I1-PR6-anexos/README.md) | 636–682 |
| **#342** | PR-7 — landing | `d57a832` | 3 (`ce617f1`, `7ae343e`, `1070821`) | `app/page.tsx` pela folha 2; `components/identidade/` nasce; **I1-E11** | **G-tok 351 → 0**; `page.tsx` 350 → 48 linhas | +135 −363 | [`I1-PR7-anexos/`](I1-PR7-anexos/README.md) | 683–691 |
| **#343** | PR-8 — política | `462b269` | 3 (`174ced3`, `e57f5e2`, `10e5d4e`) | a política pela folha 3, **texto byte a byte**; exceção de inglês do G-tok; **I1-E12** | **G-tok 36 → 0**; texto **24/24** | +139 −40 | [`I1-PR8-anexos/`](I1-PR8-anexos/README.md) | 692–695 |
| **#344** | PR-9 — lista e a casca | `8b662fc` | 4 (`d991c73` … `2587cf1`) | a casca em toda página com sessão; painel e biblioteca pela folha 4; erro destampado; **I1-E13, E14** | **G-tok 597 → 0**; `LIB-filtros` `scrollWidth` 1145·726·468 → a janela | +1 612 −1 949 | [`I1-PR9-anexos/`](I1-PR9-anexos/README.md) | 696–731 |
| **#345** | PR-10 — visualização | `8fe45e8` | 5 (`2420b8d` … `489019e`) | `/content/[id]` pela folha 5; `pdf-viewer` restilizado; **I1-E15…E18** | **(b) de 1138: 9 → 0**; G-tok 373 → 0 | +1 322 −1 821 | [`I1-PR10-anexos/`](I1-PR10-anexos/README.md) | 732–768 |
| **#346** | PR-11 — editor | `434ba79` | 4 (`f5260ec` … `8321ffc`) | o editor pela folha 6; o `PUT` byte a byte o da `main`; medição por estado; **I1-E19, E20** | **G-tok 440 → 0**; candidatas 161 → 119 (42 viram quebra por dado) | +4 835 −1 652 | [`I1-PR11-anexos/`](I1-PR11-anexos/README.md) | 769–805 |
| **#347** | PR-12 — upload | `aa772df` | 6 (`e5fdf5f` … `bd77cd7`) | o upload pela folha 7; *até 4 MiB* (I1-D29); o `POST` byte a byte; **I1-D37**; **I1-E21, E22, E24…E27** | **G-tok 526 → 0**; 122 candidatas, todas cobertas | +1 817 −1 978 | [`I1-PR12-anexos/`](I1-PR12-anexos/README.md) | 806–845 |
| **#348** | PR-13 — setlists | `6f8299f` | 8 (`ae78774` … `ce5a30e`) | `/setlists` pela folha 8; os três defeitos do N2 §10.3.5/.6; os dois toasts morrem; o `nl`; **I1-E28…E30** (E31 recusada) | **G-tok 563 → 0**; defeitos **3/3**; 532 candidatas cobertas | +2 141 −1 952 | [`I1-PR13-anexos/`](I1-PR13-anexos/README.md) | 846–892 |
| **#349** | PR-14 — a poda | `1cb897f` | 3 (`747269e`, `5977f98`, `b99ca7d`) | `components/ui/` e o tema velho fora, 27 dependências; a tela de erro da identidade; cobertura do G-tok; a 828 vira regra | **cobertura FORA 40 → 0**; `knip` 26·37·132·34 → 25·14·124·33 | +462 −2 654 | [`I1-PR14-anexos/`](I1-PR14-anexos/README.md) | 893–916 |
| **#351** | PR-2 — login com Google | `baeebf7` | 5 (`1fbdc12` gate · `c134f7d` conserto · `cdaee40` a marca · `cb65917`, `a8fdf98` docs) | `script-src` + `https://apis.google.com` (prod e dev); `frame-src` = `https://${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}` (`'none'` sem a variável); COOP `same-origin-allow-popups` nos **dois** campos de prod (div. 935); H-I1-3 e div. 564 fechadas; aceite real do Marcel; a marca do Google no **tema Dark** pré-aprovado (div. 943, decisão da folha) | CN `google-csp` **REPROVA → PASSA**: 1 violação de CSP → **0**, o popup chega ao Google, `popup.closed` `true` → `false` | +341 −20 | [`I1-PR2-anexos/`](I1-PR2-anexos/README.md) | 933–943 |
| **#352** | PR-15 — poda final | `c1640e5` | 3 (`42891d9` gate-first · `fd6ca71` a poda · `9a17b24` docs) | as **11** dependências órfãs; o `Arial` → `var(--fonte-ui-familia), sans-serif`; o `generator`; o matcher `toBeVisuallySelected`; **22 rastros em `.gz`** com o leitor `scripts/gates-web/ler-medicao.mjs` | prova por imagem **12 × 0 pixel · 0 nó com Δ**; `knip` deps 14 → 3; `medicoes/` 13M → 10M | +36 −41 | [`I1-PR15-anexos/`](I1-PR15-anexos/README.md) | 944–950 |

**Código**: **15 PRs** (#336, #337, #339–#349, #351, #352); só docs: 2 (#335, #338); e este
encerramento (#350). A PR-2 foi aberta **depois** da PR-14, por decisão do aval (div. 919/920) — por
isso o número #351 vem depois do da PR-14.

---

## 3. O que ainda sobra

**No fecho** (`c1640e5`), pelo §8 da I1-PR-15 — que já é o §17 da I1-PR-14 menos o que a PR-15
podou — e pela leitura dos anexos. Todo item tem bloco (regra 23); o número entre parênteses é a
linha do §10.

### 3.1 O §8 da I1-PR-15, transcrito

`[lido: docs/ux/I1-PR15-anexos/README.md §8, verbatim]`

> Do §17 da I1-PR-14 e do §3 do encerramento, depois desta PR:
>
> | o que sobra | destino |
> |---|---|
> | `public/sw.js` (o worker de auto-destruição) e o `worker-src`/`manifest-src` da CSP | bloco seguinte ao I1 (aval 4 do encerramento) |
> | os specs do `ux-audit` (`tests/ux-audit/fase-d/*`, rótulos em inglês) | bloco seguinte ao I1 (§10.5.6) |
> | o triângulo do `<summary>` da tela de erro (div. 913) | bloco seguinte ao I1 (§10.5.7) |
> | `public/icons/*`: 10 de 11 sem leitor (div. 553) | bloco seguinte ao I1 (§10.5.8) |
> | a memoização das setlists (div. 568) | Bloco D (aval 10 do encerramento) |
> | o `text-amber-500` do `toBeInFavoriteState` (div. 948) | bloco seguinte ao I1, com o resto do `custom-matchers.ts` |
> | as devDependencies que o `knip` acusa (7) e as 3 `@expo-google-fonts/*` do nativo | fora do escopo desta PR (o nativo; ferramentas de CLI) — sem destino novo |
>
> As 11 dependências, o `Arial`, o `generator`, o matcher do §17 e o rastro em texto: **fechados aqui**.

### 3.2 A lista inteira, com destino

| o que sobra | onde | destino |
|---|---|---|
| **`public/sw.js`** de auto-destruição e o **`worker-src`/`manifest-src`** da CSP | `public/sw.js`; `lib/security-headers.ts` | **bloco seguinte ao I1** (§10.5.1; aval 4) |
| os **specs do `ux-audit`** (rótulos em inglês) | `tests/ux-audit/fase-d/*` | **bloco seguinte ao I1** (§10.5.6) |
| o **triângulo do `<summary>`** (div. 913) | `components/identidade/tela-de-erro.tsx` | **bloco seguinte ao I1** (§10.5.7) |
| **`public/icons/*`**: 10 de 11 sem leitor (div. 553) | `public/icons/` | **bloco seguinte ao I1** (§10.5.8) |
| o **`text-amber-500`** do `toBeInFavoriteState` (div. 948) | `lib/__tests__/custom-matchers.ts:29` | **bloco seguinte ao I1** (§10.5.10) |
| as 7 devDependencies que o `knip` acusa e as 3 `@expo-google-fonts/*` do nativo | `package.json` | fora do escopo do I1 — **sem destino novo** (PR-15 §8) |
| a **memoização das setlists** (div. 568) | `components/setlists/use-setlists.ts` | **Bloco D** (§10.1.16; aval 10) |
| os **três `undefined`** do `TokensDaFaixa` | `packages/identidade/src/tokens.ts` | **N4** (§10.2.4; aval 10) |
| a **harmonização do motivo** (travessão × vírgula) e a **`LinhaDeAviso` no core** | `components/*/frases-*.ts`; `components/identidade/linha-de-aviso.tsx` | **N4** (§10.2.2, §10.2.3; aval 11) |
| as heranças de dado e de rota (o `content_data`, o lote, os sentinelas *Unknown*, o reordenar, o teto de 100, o `PATCH /api/profile`, o nonce, o `/verify-email`, a URL da setlist, a div. 864…) | §10.1 | **Bloco D** (§10.1.1–14) |
| a div. 845 (testes do editor instáveis), a 672 (o cabeçalho do `g-faixa-auth.ts`), a 607, a 606, o G1b de `apps/native/test`, o perfil × `storageState` | §10.4 | **W5** |
| o **inglês fora de posição de texto** (mensagens de `Error`, `logger`/`console`) | `lib/setlist-service.ts`, `lib/content-service.ts`, … | **fica** — não é texto de UI (PR-14 §17) |

**Fechados depois do commit 1**: o **login com Google** e o asset da marca (PR-2; H-I1-3 e divs.
564, 636, 920); as **11 dependências**, o **`Arial`**, o **`generator`**, o **matcher**
`toBeVisuallySelected` e o **rastro em texto** (PR-15); a div. 892 (nada faltou) e a 611 (o 20
da I1-E6 confirmado) pelo aval; a **documentação da raiz** (§11).

---

## 4. Decisões I1-D1…D37

O texto de cada decisão vive **só** no `I1-PRECHECK.md` §0.1 (e a errata da I1-D12 no
`DESIGN-I1/README.md` §2.1). A coluna "rótulo" é para achar a linha, não a decisão.

| # | rótulo | errata | onde se aplicou |
|---|---|---|---|
| I1-D1 | nome e numeração (D, E, `T-I1-R`, divs. a partir de 480) | — | pre-check |
| I1-D2 | o web fica com cadastro, edição e auth; só o palco sai | — | PR-3; o bloco |
| I1-D3 | `packages/identidade` em TS puro; CSS gerado com gate; 1 dp = 1 px | — | PR-4 |
| I1-D4 | o nativo importa o pacote numa PR só, com G-inv | a PR-4 provou **por igualdade** (decisão 3 do aval: *"PR que só move tokens se prova por igualdade"*, div. 598) | PR-4 |
| I1-D5 | o palco é apagado; URL antiga redireciona ou 404 | **I1-D22** (os destinos) | PR-3 |
| I1-D6 | PR-1 = o loop mudo; PR-2 = Google, consertar | — | PR-1; **PR-2 (#351)**, aberta depois da PR-14 por decisão do aval (div. 920) |
| I1-D7 | as seis decisões de composição do N3 | — | PR-6…PR-13 (o item 4 é a base da recusa da E31, PR-13) |
| I1-D8 | o corte vem antes do desenho | — | PR-3 (#337) antes de #338 |
| I1-D9 | nenhuma mudança de comportamento fora da auth; itens 5 e 6 do N2 §10.3 condicionados | — | o bloco (G-back); os itens 5 e 6 na PR-13 |
| I1-D10 | o web não adota o conjunto do nativo; lista declarada; unificar é N4 | — | PR-1…PR-14 |
| I1-D11 | faixas C e B implementadas; A só não quebra | **errata** `[2026-09-28]`: (e)=0 e (b)=0 em 411, A mecânica | PR-5; errata na PR-6 |
| I1-D12 | brief e folha próprios, depois do corte | **errata** no `DESIGN-I1/README.md` §2.1 | #338 |
| I1-D13 | quatro gates numa PR de gate, com CN | — | PR-5 |
| I1-D14 | aceite e escrita só no preview/audit | **errata** (commit 3b): o aceite é o G-faixa no Playwright, **nenhum aparelho** | PR-5…PR-14 |
| I1-D15 | fatiamento; ordem depois do I1 = N4, N5, iOS; W5 à parte | — | o bloco (a PR-2 fora de ordem; + a PR-15, que o fatiamento não previa) |
| I1-D16 | G-faixa com config própria; medição commitada; veredito no CI | — | PR-5 |
| I1-D17 | pt-BR superfície por superfície; exceção: a política | — | PR-1…PR-14 |
| I1-D18 | o PWA morre por inteiro, com o cache, a fila e o `/api/proxy` | — | PR-3 |
| I1-D19 | saem `/profile` `/settings` `/setup` `/offline`; landing e política ficam | — | PR-3; PR-7; PR-8 |
| I1-D20 | G-back com extrator próprio e bloco ```gates-web``` | — | PR-5 |
| I1-D21 | o escopo do G-back (núcleo, 11 compartilhados) | — | PR-5 (div. 612) |
| I1-D22 | errata da I1-D5: `?contentId=` → `/content/[id]` etc. | (é a errata) | PR-3 |
| I1-D23 | símbolos do palco no backend saem, declarados | — | PR-3 |
| I1-D24 | `frame-src`: a PR-2 acrescenta, a PR-3 tira o `'blob:'` | — | PR-3 (`'none'`); PR-2 (a origem do `authDomain` pela variável; div. 564 fechada) |
| I1-D25 | os testes do palco morrem ou adaptam | **errata** (div. 504): declarações no ```gates-web``` | PR-3 |
| I1-D26 | nenhum toast; a folha desenha a falha; `use-toast` sai | — | PR-9…PR-13 |
| I1-D27 | a tela cheia do `pdf-viewer` fica | — | PR-10 (I1-E16) |
| I1-D28 | as menções ao palco saem | — | PR-3 |
| I1-D29 | *"(max 50MB)"* → o limite real, 4 MiB | — | PR-12 |
| I1-D30 | `faixaDe` e limiares no pacote | **errata** (div. 503): sem par no G1b; G1b sobre `apps/native/test` → W5 | PR-4 |
| I1-D31 | `font` = família + peso; mapa no nativo | — | PR-4 |
| I1-D32 | errata "morre com a web" nas duas notas | — | pre-check, commit 2 |
| I1-D33 | `handleSelectSetlist` sai | — | PR-13 |
| I1-D34 | a Fase B contra prod, pela regra 12 | — | pre-check |
| I1-D35 | quem roda os probes | **errata** = **I1-D37** | pre-check; PR-12 |
| I1-D36 | todo tipo de content abre no visualizador, com CN | — | PR-3 (`i1-visualizador.test.tsx`) |
| I1-D37 | o executor roda o aceite e o "antes" do G-faixa (perfil persistente, `localhost:3000`, barreira de escrita) | **é a errata da I1-D35** (*"o executor não digita senha"* continua; *"o Marcel roda"* cai) | PR-12, PR-13, PR-14, PR-2 (G-faixa por estado), PR-15 (a prova por imagem do `dashboard`) |

As erratas que o prompt listou — D5, D11, D12, D14, D25, D30, D35 — estão todas acima; a da D5
**é** a I1-D22, e a da D12 mora no `DESIGN-I1/README.md` §2.1, não no pre-check.

**As decisões da folha**, só por referência (`DESIGN-I1/README.md`): §1.1 (respostas **1–32**),
§1.2 (**9** tokens), §1.3 (**3**), §1.4 (**5** itens, divs. 583–591), e as por PR dentro do §4 —
os **8** nomes das medidas fixas (PR-6) e **3** da folha 4 (PR-9, div. 713) — e a **decisão da
marca do Google** `[Marcel, 2026-09-30]` (div. 943, PR-2, registrada no §1.4 com o `SHA256SUMS`):
o botão segue o **tema Dark pré-aprovado do Google**, o "G" colorido direto sobre fundo escuro, com
o fundo e o contorno do botão secundário da folha (`bg`, `lineInfo`) no lugar de `#131314` e
`#8E918F`. Os avais de cada PR estão no README do seu anexo.

---

## 5. Erratas da folha — I1-E1…E31, e a N2-E25

Todas no `DESIGN-I1/README.md` §2.2, na seção da PR que a abriu; as listas do
`DESIGN-I1/erratas.json` onde o G-tok e o G-faixa as leem. **Efeito** como no N2/N3:
**comportamento** (o app faz outra coisa que a folha), **leitura** (qual das duas vale).
`n` = candidatas do G-faixa que a errata cobre (ou "casa" = achados do `conferir.mjs`).

| # | PR | o quê | `n` | div. | efeito | lista |
|---|---|---|---|---|---|---|
| E1 | #338 | existe `AUTH-verify-reenviar-excecao` | casa 2 | 586, 593 | **comportamento** | `erratas` |
| E2 | #338 | existe `UP-lote-lendo` | casa 1+2; faixa 2 | 587 | **comportamento** | `erratas`, `erratasFaixa` |
| E3 | #338 | o `garantida` da linha de sucesso é o do catálogo (r 9) | casa 1 | 589 | leitura | `erratas` |
| E4 | #338 | landing: `2 → undefined`, `3 → undefined` riscados | casa 6 | 584 | leitura | `erratas` |
| E5 | #338 | entrelinha 20 = literal do N3 | casa 8 | 585 | leitura | `erratas` |
| E6 | PR-4 | o **visto** → `garantida`; **20** onde a folha tem 16 — confirmado no aval do encerramento (div. 611 fechada) | casa 1 | 588, 601, 611 | leitura | `erratas` |
| E7 | PR-6 | `-validacao` sem o balão do navegador | 31 | 667 | leitura | `erratasFaixa` |
| E8 | PR-6 | `verify-carregando` sem o grupo vazio | 2 | 668 | leitura | `erratasFaixa` |
| E9 | PR-6 | `login-redirecionando` sem o grupo vazio | 6 | 675 | leitura | `erratasFaixa` |
| E10 | PR-6 | `confirm-sem-usuario` sem a frase com e-mail | 7 | 669 | leitura | `erratasFaixa` |
| E11 | PR-7 | a frase da landing em `lineHeight.text` 1,55 | 8 | 684 | leitura | `erratasFaixa` |
| E12 | PR-8 | títulos da política com entrelinha natural | 45 | 693 | leitura | `erratasFaixa` |
| E13 | PR-9 | o menu da conta é só *Sair* | — | 697 | leitura | `erratasFrase` |
| E14 | PR-9 | *Filtros* ancora à direita e cabe no contêiner | 20 | 726 | leitura | `erratasFaixa` |
| E15 | PR-10 | `VIEW-erro-cache` e `VIEW-carregando-arquivo` não existem; `T-I1-R` 286 → 282 | casa 4 | 733–735, 760 | **comportamento** (de estado) | `erratas`, `erratasEstado` |
| E16 | PR-10 | tela cheia do PDF com *Anterior*/*Próxima* | 2 | 739, 752 | **comportamento** | `erratasFaixa` |
| E17 | PR-10 | `VIEW-erro-formato` sem *Tentar de novo* | 13 | 740 | leitura | `erratasFaixa` |
| E18 | PR-10 | content com dois tipos: 2º painel *Cifra* | 0 | 742 | leitura | `erratasFaixa` |
| E19 | PR-11 | sem estado de partitura na folha 6: vale o painel da folha 5 | — | 775 | leitura | `erratasFrase` |
| E20 | PR-11 | Tom na notação de cifra (*C*), não *Dó* | — | 779 | leitura | `erratasFrase` |
| E21 | PR-12 | o passo 1 tem *Próximo* — mudança de fluxo declarada | — | 808 | **comportamento** | `erratasFrase` |
| E22 | PR-12 | a ordem dos seletores de hoje | 32 | 809 | leitura | `erratasFaixa` |
| **E23** | — | **não existe**: *"Não houve I1-E23"* (decisão 5 do aval da PR-12) | — | — | — | — |
| E24 | PR-12 | a linha do lote mantém os controles de hoje | 70 | 813 | leitura | `erratasFaixa` |
| E25 | PR-12 | `UP-lote-erro`: *Importar todas* | — | 814 | leitura | `erratasFrase` |
| E26 | PR-12 | N2: *o que você escreveu continua aqui* | — | 815 | leitura | `erratasFrase` |
| E27 | PR-12 | `UP-criar` sem a linha do arquivo | 18 | 812, 834 | leitura | `erratasFaixa` |
| E28 | PR-13 | nome da setlist em `size.title` 22 | **520** | 876 | leitura | `erratasFaixa` |
| E29 | PR-13 | editar mede contra `SET-criar*` | 8 | 858 | leitura | `erratasFaixa` |
| E30 | PR-13 | a N10 contra `SET-adicionar-vazio` | 4 | 854 | leitura | `erratasFaixa` |
| **E31** | — | **recusada** no aval do veredito da PR-13: a regra é a I1-D7 item 4; o defeito era do instrumento (commit 2b, div. 875) | — | 875 | — | — |

**Vigentes: 29** (E1…E30 menos a E23). **Mudaram comportamento cinco**: E1, E2, E15, E16, E21. A
**E19** existe (PR-11); o que o prompt chamou de E19 inexistente é a **E23** (div. 923) — a PR-10
chegou a registrar *"a I1-E19 não existe"* para a proposta da div. 761, recusada, e a PR-11 usou
o número depois.

**A errata do `DESIGN-N2/README.md`** (divs. 599/600 da I1-PR-4, destino "encerramento do I1") —
**escrita neste commit** como **N2-E25**, seção nova *"Errata do I1 (o ícone do Salvar)"* no §9
daquela pasta, sem reescrever texto: vale a **legenda** (o Salvar usa o `garantida`) e vale o
**`dados.ts`** (uma forma, r 9), não as molduras (o visto sem círculo, 8×; o `garantida` em r 8,5,
7× — `grep -o` no `telas.html`). **O `SHA256SUMS` do DESIGN-N2 não muda**: ele não lista o
`README.md` (§8 de lá), e `shasum -c` dá 2/2 OK depois da nota.

---

## 6. Hipóteses H-I1-1…7

Fonte: `I1-PRECHECK.md` §0.2; o estado final, pela PR que fechou.

| id | hipótese (rótulo) | estado final | evidência |
|---|---|---|---|
| H-I1-1 | Playwright só Chromium desktop, poda em PR própria | **FECHADA** — a premissa já era a `main` (div. 486 → I1-D16) | pre-check §8 |
| H-I1-2 | o loop mudo se repete enquanto o `POST` falhar | **CONFIRMADA** (probe 1, ramo b) e **CONSERTADA** na PR-1: 52 · 51 · 104 → 1 · 0 · 0 | `faseB/probe1-out/`; `I1-PR1-anexos` |
| H-I1-3 | o Google falha no navegador pela CSP/COOP | **FECHADA** pela PR-2 (#351): as três causas eram as três, nessa ordem, medidas uma diretiva por vez — `main`: 1 violação `script-src-elem` (`apis.google.com/js/api.js`), nenhum popup · (a) + `script-src https://apis.google.com`: 1 violação `frame-src` (o `authDomain`), popup no Google mas `popup.closed` `true` · (b) + `frame-src https://<authDomain>`: **0 violações**, ainda `closed` `true` · (c) + COOP `same-origin-allow-popups`: **0 violações, `closed` `false`, `window.opener` `true`**. Aceite real do Marcel: *entrou* | `faseB/probe2-out/`; `I1-PR2-anexos/README.md` §2, §7, §8 |
| H-I1-4 | a largura CSS do Chrome no Tab S6 | **SEM OBJETO** (errata da I1-D14) | — |
| H-I1-5 | nenhum toast das setlists aparece | **CONFIRMADA** (probe 4) e **FECHADA** na PR-13: os dois sistemas de toast morreram, a falha é estado na tela | `faseB/probe4-out/`; `I1-PR13-anexos` §26.4 |
| H-I1-6 | Chrome desktop e do Tab dão a mesma quebra | **SEM OBJETO** (errata da I1-D14) | — |
| H-I1-7 | cada volta do loop gasta a cota de `/api/profile` | **CONFIRMADA** (ramos b e c) e **CONSERTADA** na PR-1 (requisitos (a)–(e)) | `faseB/probe1-out/`; `I1-PR1-anexos` |

---

## 7. Divergências 480–955

### 7.1 A contagem

`[medido]` — `git grep -nE '^\| \*\*[0-9]{3}\*\*' -- docs`, filtrado para 480–955 (o bloco,
480–950, mais as deste documento, 951–955), a origem lida na célula depois do número; o bruto (474
linhas de tabela, a marca `*` na que conta) está no anexo
[`divergencias.txt`](I1-ENCERRAMENTO-anexos/divergencias.txt):

```
números atribuídos: 458 de 476   (457 em tabela + a 756, que só existe em prosa)
sem registro: 18 → 532–549       (a faixa 522–549 era da PR-1, que usou 522–531; a PR-3 começou em 550)
sem letra na tabela: 726, 727, 728 (PR-9), 767 (PR-10) → pelo aval: 726 D · 727 A · 728 P · 767 A
P 144 · A 139 · D 92 · T 80 · X 3 · total 458
```

| PR | faixa | P | D | A | T | X | total |
|---|---|---|---|---|---|---|---|
| pre-check | 480–521 | 24 | 4 | 5 | 9 | | 42 |
| PR-1 | 522–531 | 4 | | 2 | 4 | | 10 |
| PR-3 | 550–580 | 8 | 7 | 13 | 3 | | 31 |
| congelamento | 581–596 | 9 | 1 | 6 | | | 16 |
| PR-4 | 597–611 | 9 | 3 | 2 | 1 | | 15 |
| PR-5 | 612–635 | 13 | 2 | 3 | 6 | | 24 |
| PR-6 | 636–682 | 17 | 7 | 10 | 13 | | 47 |
| PR-7 | 683–691 | 4 | 1 | 2 | 2 | | 9 |
| PR-8 | 692–695 | 1 | 3 | | | | 4 |
| PR-9 | 696–731 | 6 | 9 | 15 | 6 | | 36 |
| PR-10 | 732–768 | 4 | 13 | 16 | 4 | | 37 |
| PR-11 | 769–805 | 1 | 13 | 13 | 10 | | 37 |
| PR-12 | 806–845 | 5 | 12 | 15 | 8 | | 40 |
| PR-13 | 846–892 | 12 | 8 | 16 | 11 | | 47 |
| PR-14 | 893–916 | 7 | | 17 | | | 24 |
| encerramento, commit 1 | 917–932 | 10 | 6 | | | | 16 |
| PR-2 | 933–943 | 4 | | 4 | | 3 | 11 |
| PR-15 | 944–950 | 4 | | | 3 | | 7 |
| encerramento, commit 2 | 951–954 | 1 | 3 | | | | 4 |
| encerramento, commit 3 | 955 | 1 | | | | | 1 |
| **I1** | | **144** | **92** | **139** | **80** | **3** | **458** |

**A cresceu** contra o N3 (9 de 85 lá; 139 de 458 aqui): o I1 foi o primeiro bloco a reescrever
telas **com dado real atrás**, e a leitura do código de cada superfície achou o que a tela
escondia — erro engolido, `status` perdido, campo que nunca vai no corpo, texto que mente
(*"max 50MB"*). **T** é do instrumento que nasceu no bloco (G-faixa, sobretudo) e das rodadas.
**X** aparece só na PR-2, a primeira a falar com o Google de verdade (o COOP report-only do
`accounts.google.com`, o `init.json` 404 do Firebase, o `createAuthUri`).

### 7.2 As que ensinaram (viraram decisão, errata, regra ou caso)

| div. | virou | onde |
|---|---|---|
| 486 | I1-D16 (a H-I1-1 fecha) | pre-check §0.1 |
| 492 | I1-D32 (errata "morre com a web") | `PLANO-TRANSICAO.md`; `N1-ENCERRAMENTO.md` |
| 503, 504 | erratas da I1-D30 e da I1-D25; G1b de `apps/native/test` → W5 | pre-check §0.1 |
| 506 | I1-D36 (todo tipo abre no visualizador) | pre-check §0.1 |
| 518, 522 | o listener por `request`/`response` (caso 33) | `I1-PR1-anexos/cn/comum.ts` |
| 531 | nada se grava na pasta vigiada pelo `next dev` (caso 29) | `I1-PR1-anexos` |
| 560 | o `public/sw.js` de auto-destruição (caso 31) | `I1-PR3-anexos` §13 |
| 584–589 | I1-E1…E5 | `DESIGN-I1` §2.2 |
| 588, 601, 611 | I1-E6 (o 20 confirmado no aval) | `DESIGN-I1` §2.2 |
| 598 | "PR que só move tokens se prova por igualdade" | `I1-PR4-anexos` §1 |
| 599, 600 | **N2-E25** | `DESIGN-N2/README.md` §9 |
| 614, 681 | o `erratas.json` e a lista `erratasFaixa` | `DESIGN-I1/erratas.json` |
| 619, 676, 677 | errata da I1-D11: (e) e (b) reprovam em 411 | pre-check §0.1 |
| 631 | o gate se prova no Linux do CI | `I1-PR5-anexos` |
| 641 | nó sem par é listado, não comparado em silêncio | molde da PR-6 (§12) |
| 667, 668, 675, 669 | I1-E7…E10 | `DESIGN-I1` §2.2 |
| 678 | "sem `.env`" se confere pelo que o servidor carrega | `I1-PR6-anexos` §15.3 |
| 680, 843 | a mescla por largura, e nos dois sentidos | `g-faixa-sessao.ts` |
| 684, 693 | I1-E11, I1-E12 | `DESIGN-I1` §2.2 |
| 726 | I1-E14; `scrollWidth` por estado na pré-verificação (caso 30) | `I1-PR9-anexos` §17 |
| 727 | a raiz da casca não estiliza texto (regra 27) | idem |
| 733–735, 760 | I1-E15; a regra simétrica do `conferir.mjs` | `DESIGN-I1` §2.2, §6 |
| 761 | a folha vence (sem errata); o `800` literal invisível ao G-tok (caso 35) | `I1-PR10-anexos` §22 |
| 767 | "quebra por dado" (regra 25) | `I1-PR10-anexos` §23.3; `g-faixa-classificar.mjs` |
| 775, 779 | I1-E19, I1-E20 | `DESIGN-I1` §2.2 |
| 803 | medição por estado (regra 24) | `I1-PR11-anexos` §20 |
| 808–815, 834 | I1-E21, E22, E24…E27 | `DESIGN-I1` §2.2 |
| 828 | a regra 828 (inglês em string de `.ts`) no G-tok (caso 34) | `I1-PR14-anexos` §15 |
| 854, 858, 876 | I1-E28…E30 | `DESIGN-I1` §2.2 |
| 875, 888 | E31 recusada; o `nl` (regras 26 e 32) | `I1-PR13-anexos` §24, §25 |
| 901, 908 | o `vi.mock` que nunca resolve; o `knip` que ignora (casos 36, 37) | `I1-PR14-anexos` §7 |
| 910 | o perfil só na origem 3000 (caso 32) | `COMO-RODAR.md` |
| 914 | texto sem leitor é poda (regra 31) | `I1-PR14-anexos` §11 |
| **920** | **a PR-2 aberta antes do fecho** (decisão 1 do aval) | #351 |
| 935, 940, 941 | o COOP nos dois campos de prod; o `script-src` também no dev; o `frame-src` pela variável | `lib/security-headers.ts`; `I1-PR2-anexos` §9 |
| 943 | a **decisão da marca**: o botão do Google no tema Dark pré-aprovado | `DESIGN-I1/README.md` §1.4 |
| 944–946 | o rastro em `.gz` é tudo o que o veredito não lê, por um leitor só (`ler-medicao.mjs`), com a mesma medição nos dois formatos = erro | `I1-PR15-anexos` §5 |
| 951 | a errata do *"fica até o encerramento"* do `sw.js` | `I1-PR3-anexos/README.md` §8 |

### 7.3 As abertas, com destino

| div. | o quê | destino |
|---|---|---|
| 527, 528 | `DELETE /api/auth/session` em toda carga sem usuário, 2× por logout | **fica** (aval da PR-1) — não é herança |
| 553 | `public/icons/*` sem leitor | bloco seguinte ao I1 (§10.5.8) |
| 554, 560 | `public/sw.js` e `worker-src`/`manifest-src` | bloco seguinte ao I1 (§10.5.1) |
| 568 | memoização das setlists | Bloco D (§10.1.16) |
| 606 | `g1.sh` cego para arquivo não rastreado | W5 (§10.4.2) |
| 607 | o `native.yml` pelo pacote só | W5 (§10.4.4) |
| 660 | `/verify-email` → `/login` no 1º render | Bloco D (§10.1.11) |
| 672 | o cabeçalho do `g-faixa-auth.ts` | W5 (§10.4.6) |
| 689 | toda rota `ƒ` pelo nonce da CSP no layout | Bloco D (§10.1.10) |
| 702 | apagar/favoritar mudos na lista | Bloco D (§10.1.12) |
| 770, 771, 776, 784, 820, 822–824, 827, 833, 835, 836, 851, 853 | as heranças de dado do editor, do upload e das setlists | Bloco D (§10.1.1–8) |
| 837 | os specs do `ux-audit` em inglês | bloco seguinte ao I1 (§10.5.6) |
| 845 | testes do editor instáveis | W5 (§10.4.5) |
| 864 | `getSetlistById` importado e não usado no núcleo | Bloco D (§10.1.14) |
| 913 | o triângulo do `<summary>` | bloco seguinte ao I1 (§10.5.7) |
| 937 | o `init.json` 404 do Firebase no popup (lado Firebase) | registrado; sem ação |
| 948 | o `text-amber-500` do `toBeInFavoriteState` | bloco seguinte ao I1 (§10.5.10) |

**Fechadas no fecho**: 564 e 920 (PR-2), 611 e 892 (aval), 636 (o asset, PR-2), 918, 927, 929,
932 (aval); 954 no commit 3 (o catálogo).

### 7.4 A origem P — onde o revisor errou

**144 de 458 (31 %)** são de origem **P**: o prompt do revisor presumiu o que não era. É o
registro honesto do bloco — e o maior número absoluto de P de um bloco até aqui (33 no N3). Por
PR, o P mais alto foi o do pre-check (24) e o da PR-6 (17): a primeira leitura do web e a
primeira superfície, onde o prompt descrevia um código que ninguém tinha aberto ainda. Nas PRs
de tela seguintes o P caiu para 1–6 e voltou a 12 na PR-13, que carregava os três defeitos do N2
e o aval mais longo.

**A mais cara foi a 920** — não uma premissa sobre o código, mas sobre o próprio fatiamento: a
PR-2 (o Google), decidida desde o pre-check (I1-D6, I1-D15), **foi pulada** pelo revisor, da PR-1
direto para a PR-3, e nenhuma das treze PRs seguintes a cobrou; só a leitura dos anexos, no
encerramento, a achou. O commit 1 a registrou como A; o aval a devolveu a P.

O que mais se repetiu (leitura desta PR, não medição): **contagem do prompt que não confere com a
fonte** (496, 592, 670, 690, 695, 768, 890, 915: número de frases, de arquivos, de linhas);
**seção ou arquivo citado onde não está** (489, 591, 594, 595, 696, 847, 848, 902); **estado ou
caminho presumido que o código não tem** (699, 732, 806, 880, 933, 944, 945); e a **série de
numeração** (502, 715, 756, 846). No encerramento o padrão se repete **doze** vezes (917, 919–925,
929, 931, 951, 955).

---

## 8. Instrumentos que nasceram

| instrumento | arquivo | PR |
|---|---|---|
| **G-back** — o backend do web intocado sem declaração; núcleo congelado (39) | `scripts/gates-web/g-back.sh`, `g-back-derivar.mjs`, `g-back-nucleo.txt`, `gates-web-decl.sh` (bloco ```gates-web```) | PR-5 |
| **G-palco** — zero arquivo e import do palco | `scripts/gates-web/g-palco.sh`, `g-palco-imports.mjs` | PR-3 (ligado ao CI na PR-5, div. 631) |
| **G-tok (i)** — folha × `erratas.json`, errata órfã reprova | `docs/ux/DESIGN-I1/erratas.json` (`erratas`, `erratasFaixa`, `erratasFrase`, `erratasEstado`); `conferencia/conferir.mjs` | PR-5; listas nas PR-6/7, 9, 10 |
| **G-tok (ii)** — literais, toast, `ui/*`, inglês nos arquivos da lista | `scripts/gates-web/g-tok.mjs`, `g-tok-arquivos.txt` (132); vocabulário 133 (PR-10); exceção de inglês `g-tok-sem-ingles.txt` (PR-8) | PR-5; cresce PR-6…PR-14 |
| **cobertura da lista** — todo arquivo de tela está na lista (FORA reprova) | `scripts/gates-web/g-tok-cobertura.mjs` | PR-14 |
| **a 828** — inglês em string de `.ts`, isenção por frase | `g-tok.mjs`; `scripts/gates-web/g-tok-frases-isentas.txt` | PR-12 (achado) → PR-14 (regra) |
| **G-faixa — medidor** (Chromium fixado, 1138 · 711 · 411, `boundingBox`) | `playwright.g-faixa.config.ts`; `scripts/gates-web/g-faixa-{medir,coleta,sessao,superficies}.ts` | PR-5 |
| **G-faixa — classificador e veredito** ((e)/(b)/(d′), saídas à parte; o CI lê o JSON commitado) | `scripts/gates-web/g-faixa-classificar.mjs`, `g-faixa-veredito.mjs`; `tests/gates-web/g-faixa-classificar.test.ts` | PR-5; (e)/(b) em 411 na PR-6 |
| **G-faixa — esperado da folha** (a folha medida por `file://`, âncoras) | `scripts/gates-web/g-faixa-esperado.ts`; `tests/gates-web/esperado/*.json` | PR-6 |
| **`erratasFaixa`** — o veredito diz a cobertura de cada candidata | `g-faixa-veredito.mjs` | PR-7 (div. 681) |
| **quebra por dado** — altura múltipla da entrelinha, mesma largura, e a cascata | `g-faixa-classificar.mjs` (`quebrasPorDado`, `ehCascata`) | à mão na PR-10 (div. 767) → automática na PR-11 |
| **`nl`** — rótulo curto com nome acessível longo | `g-faixa-coleta.ts` + `g-faixa-classificar.mjs` | PR-13, commit 2b |
| **medição por estado** — `G_FAIXA_ESTADOS`, `rodadasPorEstado` | `g-faixa-medir.ts`, `g-faixa-sessao.ts` | PR-11, commit 2b (div. 803) |
| **mescla** — por largura (PR-6, div. 680) e nos dois sentidos (PR-12, div. 843) | `g-faixa-sessao.ts` | PR-6; PR-12 |
| os estados por superfície | `g-faixa-auth.ts` (PR-6), `g-faixa-lista.ts` (PR-9), **`g-faixa-conteudo.ts`** (PR-10), `g-faixa-editor-exemplos.ts` (PR-11), **`g-faixa-upload.ts`** (PR-12), **`g-faixa-setlists.ts`** (PR-13), a superfície `erro-global` (PR-14) | PR-6…PR-14 |
| **`casca-efeito`** — o corpo velho × `cn-main` nó a nó (anexo, não gate) | `docs/ux/I1-PR9-anexos/cn/casca-efeito-corpo.mjs`; os `casca-efeito-*.mjs` das PR-10…13; `tests/gates-web/medicoes/casca-efeito/` | PR-9 |
| **prova por imagem** — `pixelmatch` limiar 0 + geometria, antes × antes = 0 como controle | `docs/ux/I1-PR14-anexos/cn/prova-por-imagem.txt` | PR-14 (aval 6) |
| **pré-verificação sem sessão** — `next dev` sem `.env` numa cópia, página de fumaça, `scrollWidth` por estado | `pre-verificacao/` dos anexos da PR-10 em diante (o roteiro de fumaça nasce na PR-9) | PR-9/PR-10 |
| **`conferir.mjs`** — a folha × a matriz de estados, regra simétrica | `docs/ux/DESIGN-I1/conferencia/conferir.mjs` | #338; PR-10 (div. 760) |
| **texto congelado** — igualdade de texto da política | `scripts/gates-web/privacy-texto-extrair.ts`, `tests/gates-web/privacy-texto.test.ts` | PR-8 |
| **escrita byte a byte** — o corpo que sai igual ao da `main` | `tests/gates/i1-editor-put.test.tsx` (PR-11), `i1-upload-post.test.tsx` (PR-12), `i1-setlists-escritas.test.tsx` (PR-13) | PR-11…13 |
| **CN do loop mudo** e o listener corrigido | `components/auth/__tests__/login-sessao-cn.test.tsx`; `docs/ux/I1-PR1-anexos/cn/` | PR-1 |
| **"gerado == fonte"** do CSS e a igualdade do pacote | `packages/identidade/scripts/gerar-css.mjs`, `test/css.test.ts`, `test/igualdade.test.ts` | PR-4 |
| **o perfil persistente** (fora da árvore, no `.gitignore`) e a barreira de escrita do medidor | `~/.octavia-g-faixa-perfil`; `x-g-faixa: fabricado` | PR-5 (div. 632); a barreira no molde da PR-6; I1-D37 na PR-12 |
| **`COMO-RODAR.md`** — uma seção por PR | `scripts/gates-web/COMO-RODAR.md` | PR-5 → PR-14 |
| **`gates-web.yml`** | `.github/workflows/gates-web.yml` (jobs `g-back`, `g-palco`, `g-tok`, `g-faixa`) | PR-5; linha da cobertura na PR-14 |
| **CN do *Entrar com Google*** — sem interceptar o Google, com a CSP aplicada no dev, para na página de login do Google; e a **medição diretiva a diretiva** | `tests/gates-web/google-csp.cn.ts`; `docs/ux/I1-PR2-anexos/medir-diretivas.ts` | PR-2 |
| **o leitor dos dois formatos** — `lerJson` lê `.json` ou `.json.gz`, a mesma medição nos dois = erro (exit 2); o veredito e os 6 scripts de `casca-efeito` leem por ele | `scripts/gates-web/ler-medicao.mjs` | PR-15 |
| os scripts da **prova por imagem**, commitados | `docs/ux/I1-PR15-anexos/cn/capturar.mjs`, `cn/diff.mjs` | PR-15 (aval 6) |

**Os gates no fim do bloco** (`c1640e5`) `[medido, contabilidade.txt §6]`: G-palco **PASSA** (0) ·
G-tok **PASSA** (132 arquivos; literais 0) · cobertura **PASSA** (129/129, FORA 0) · G-faixa
**PASSA** (14 medições, lendo a pasta com o rastro em `.gz`) · `cn-main` REPROVA 83 (o registro,
lido do `.gz`) · `SHA256SUMS` do `DESIGN-I1` **14/14**. O G-back roda sobre o corpo de
cada PR (as declarações moram lá) e passou em todas (`[lido]` nos README).

---

## 9. Catálogo — regras 24–32 e casos 29–37 → [`LOGS-OCTAVIA.md`](../native/LOGS-OCTAVIA.md)

**Aprovados como numerados** `[Marcel, 2026-09-30, decisão 5 do aval]` e **levados ao catálogo**
no commit 3 desta PR (decisão da div. 954). **O texto vive só no `LOGS-OCTAVIA.md`**: as regras na
seção *"As regras que o I1 firmou — 24 a 32"*, os casos na tabela de *"O padrão — 'instrumento com
escopo menor do que parece'"* (linhas 29–37, depois do 28 do N3), e a *"errata órfã reprova"* como
**ampliação da regra 14** (a linha *"I1 (encerramento…)"* no fim dela). A coluna "rótulo" abaixo é
para achar a linha, não a regra.

| # | rótulo | origem |
|---|---|---|
| regra 24 | medição por estado | divs. 803, 843 (PR-11, PR-12) |
| regra 25 | quebra por dado | div. 767 (PR-10) |
| regra 26 | rótulo curto, nome acessível longo | E31; divs. 875, 888 (PR-13) |
| regra 27 | a raiz da casca não estiliza | div. 727 (PR-9) |
| regra 28 | o executor mede | I1-D37 (PR-12) |
| regra 29 | prova por imagem | PR-14 (aval 6); PR-15 |
| regra 30 | instrumento primeiro | PR-1; as PRs de tela; PR-14 |
| regra 31 | texto sem leitor é poda | div. 914 (PR-14) |
| regra 32 | defeito do instrumento, no instrumento | E31 (PR-13) |
| regra 14, ampliada | a órfã reprova também no web | div. 929 |
| casos 29–37 | divs. 531 · 726 · 560 · 910 · 518/522 · 828 · 761 · 901 · 908 | PR-1 · PR-9 · PR-3 · PR-14 · pre-check/PR-1 · PR-12/14 · PR-10 · PR-14 · PR-14 |

---

## 10. Heranças, com destino

**A parte que o D, o N4, o N5, o W5 e o bloco seguinte vão ler.** Numeração estável — cite por
**§10.<bloco>.<n>** e confira com `grep` antes de citar (a lição da div. 397). Todo item tem
bloco (regra 23).

### 10.1 Bloco D (backend e dado)

| # | item | origem |
|---|---|---|
| 1 | **`content_data` poluído pelo editor** (a linha inteira, o `content_data` aninhado, `annotations: []`); o `PUT` é gate byte a byte (`tests/gates/i1-editor-put.test.tsx`) | div. 770 (PR-11); I1-D9 |
| 2 | **campos que não se salvam**: *Compasso* editável e fora do corpo (771); *Ano*, *Capo*, *Afinação* fora do `POST`; *Compasso*/*Favorita* perdidos pelo nome (820) | PR-11; PR-12 |
| 3 | a tab sem `measures` abre o compasso-fixture e o grava (776); *"Verse 1"*/*"Content"* como nome padrão gravado (784) | PR-11 |
| 4 | **o lote**: duplica numa falha a meio + *Importar todas* (827); sobe o arquivo ao Storage e não o referencia (822); importar texto grava só `file_url` (823); `parsedSongs` fica no hook (833); o rascunho do criar vence o arquivo (835); o criado do zero sai vazio e vai à visualização (836) | PR-12 |
| 5 | **o sentinela *Unknown Artist/Title/Type***: gravado pelo upload (`hooks/useAddContentLogic.ts:133,182,207`, 824) e sintetizado pelas rotas das setlists (853); a tela traduz só na exibição | PR-12; PR-13 |
| 6 | **reordenar com persistência**: `PUT …/songs/order` sem chamador no web (decisão 27 da PR-13) | PR-13 §28 |
| 7 | **o teto de 100** (`app/api/content/route.ts:119`) × o pedido de 1000 do picker | div. 851 (PR-13) |
| 8 | `position` e `notes: ""` no corpo de `POST …/songs`, que a rota recalcula ou ignora | PR-13 §28 |
| 9 | **`PATCH /api/profile` sem chamador** (a página `/profile` saiu; a rota fica) | div. 507; I1-D19 |
| 10 | **estático × nonce**: toda rota é `ƒ` porque `app/layout.tsx` lê o nonce da CSP — a `/` inclusive | div. 689 (PR-7) |
| 11 | **`/verify-email` recarregado vai sempre a `/login` no 1º render** (`app/verify-email/page.tsx:73-76` × `contexts/firebase-auth-context.tsx`) | div. 660 (PR-6) |
| 12 | **apagar e favoritar**: mudos na lista (os erros são produzidos e ninguém lê); na visualização o favoritar era local e falso e **saiu** com a barra (737) | div. 702 (PR-9); div. 737 (PR-10) |
| 13 | **URL própria da setlist** (a edição é estado da `/setlists`; `?setlistId=` → `/setlists`) | div. 497; I1-D22 |
| 14 | `lib/content-service-server.ts:12` (núcleo) importa `getSetlistById` do serviço cliente e não o usa | div. 864 (PR-13) |
| 15 | ~~**o login com Google**~~ — **fechado pela PR-2** (#351): as três diretivas, a div. 564 e o asset da marca (636); aceite real do Marcel | I1-D6; H-I1-3; divs. 920, 564 |
| 16 | **a memoização das setlists**: os `useCallback` com `setlists` nas dependências (div. 568, PR-3), herdados pela PR de setlists e sem registro de pagamento — hoje em `components/setlists/use-setlists.ts` (11 `useCallback`) | div. 568; div. 932; aval 10 |
| 17 | **a Tab editada no web que nenhum leitor vê** — **primeira da fila do D**: o editor grava `measures` e deixa `tablature` intocada (`components/tab-editor.tsx:25-50`); o palco do nativo e a visualização do web leem `tablature` | N4: div. 976; N4-D44 (`docs/native/N4-PRECHECK.md` §16) |
| 18 | **o editor da Cifra não atualiza o `chords` do topo**: grava `sections` e leva o `chords` de antes ao `PUT` (`components/chord-editor.tsx:38-41`; `components/content-editor.tsx:64-68`) — o `checkContentData` do `PUT` valida esse `chords` desatualizado | N4: div. 975; N4-D44 |
| 19 | **o `PUT` do favorito mexe no `updated_at`** (`app/api/content/route.ts:282-284`): favoritar reordena o "Recentes" do painel do web (`app/dashboard/page.tsx:33-37`) e conta como mudança no T1-R10 do nativo | N4: L1; N4-D39 |

### 10.2 N4 (content nos apps)

| # | item | origem |
|---|---|---|
| 1 | **frases unificadas web × nativo**: hoje dois conjuntos (os dez `frases-*.ts` do web, 421 folhas; o `packages/core/src/frases.ts` do nativo) | I1-D10 |
| 2 | **a harmonização do motivo**: travessão (PR-9) × vírgula (PR-11…13) — uma forma só, na unificação — *movido para o bloco seguinte ao I1 (§10.5.11), N4-D29 `[Marcel, 2026-10-01]`: o N4 não troca texto no web* | PR-11 §21.6; PR-13 §28 |
| 3 | **a `LinhaDeAviso` como componente do core** — hoje `components/identidade/linha-de-aviso.tsx` (web) e a do nativo: **o N4 decide** se vira contrato compartilhado | PR-1; PR-9; aval 11 |
| 4 | os três `undefined` do `TokensDaFaixa` (`faixas.A.folha.alturaMin`, `faixas.B.folha.alturaMin`, `faixas.C.reordenar.artistaMin`): *"a medida não existe nesta faixa"*, e o CSS gerado a omite — a forma final vem com o content nas três faixas | `I1-PR4-anexos` §2; div. 932; aval 10 |

### 10.3 N5 (celular) e I2

| # | item | origem |
|---|---|---|
| 1 | **a composição de A desenhada**: no web, A é a regra 2 aplicada mecanicamente, sem folha (errata da I1-D11); a folha de A é do "I2, se houver" | I1-D11 e errata |
| 2 | **celular real** para o aceite: todo o celular do projeto segue sendo o AVD | `N3-ENCERRAMENTO.md` §10.1.17 (segue aberta) |
| 3 | ~~os três `undefined` do `TokensDaFaixa`~~ — **movido para o N4** (§10.2.4), pelo aval 10 | div. 932 |

### 10.4 W5 (instrumento)

| # | item | origem |
|---|---|---|
| 1 | **G1b sobre `apps/native/test`** (o `faixa.test.ts` mudou sem par) | errata da I1-D30; div. 503 |
| 2 | **`g1.sh … WORKTREE` cego para arquivo novo não rastreado** | div. 606 (PR-4) |
| 3 | ~~o `tsc` do `packages/identidade` no CI~~ — **feito** na PR-4 (`59b78de`, 2b) | PR-4 decisão 9 |
| 4 | **o CI do APK só pelo pacote**: provar que uma PR que toque **só** `packages/identidade/**` dispara o `native.yml` (o `paths` do `pull_request` é avaliado contra o diff acumulado, div. 610) | div. 607 (PR-4) |
| 5 | **os testes do editor instáveis sob cobertura** (`tests/gates/i1-editor-put.test.tsx`, `components/editors/__tests__/editor-estados.test.tsx`): o `montar()` com prazo, como o do upload (commit 5 da PR-12) | div. 845 |
| 6 | **o cabeçalho de `scripts/gates-web/g-faixa-auth.ts:5-6`** (*"nada sai"* para o Google): falso desde a PR-6 | div. 672; div. 928 |
| 7 | **o perfil persistente × `storageState({ indexedDB: true })`** e a sessão de mais de 1 h — não medido | `I1-PR5-anexos` §5 |

### 10.5 O bloco seguinte ao I1 (a poda que sobrou)

| # | item | origem |
|---|---|---|
| 1 | **remover `public/sw.js`** (o worker de auto-destruição) e o **`worker-src`/`manifest-src`** da CSP (`lib/security-headers.ts`) — **confirmado pelo aval 4**; o texto contrário da PR-3 virou errata (div. 951) | divs. 554, 560; `I1-PR3-anexos` §13; div. 927 |
| 2 | ~~**as 11 dependências órfãs**~~ — **feito na PR-15** (#352): `isomorphic-dompurify`, `react-hook-form`, `@hookform/resolvers`, `zustand`, `immer`, `date-fns`, `cmdk`, `next-themes`, `lru-cache`, `@types/debug`, `autoprefixer`; lockfile −674 | `I1-PR15-anexos` §2 |
| 3 | ~~**`body { font-family: Arial }`**~~ — **feito na PR-15**: `var(--fonte-ui-familia), sans-serif`; prova por imagem 12 × 0 pixel | `I1-PR15-anexos` §3 |
| 4 | ~~**`generator: "v0.dev"`**~~ — **feito na PR-15** | `I1-PR15-anexos` §4 |
| 5 | ~~**o matcher de teste** `toBeVisuallySelected`~~ — **feito na PR-15** (0 usos; saiu inteiro) | `I1-PR15-anexos` §4 |
| 6 | **os specs do `ux-audit`** (`tests/ux-audit/fase-d/*`, rótulos em inglês) | div. 837; PR-13 |
| 7 | o triângulo do `<summary>` da tela de erro (`flex` no `summary`, só em dev) | div. 913 |
| 8 | `public/icons/*`: 10 de 11 sem leitor | div. 553 |
| 9 | ~~conferir a memoização das setlists~~ — **movido para o Bloco D** (§10.1.16), pelo aval 10 | div. 568 |
| 10 | o **`text-amber-500`** do `toBeInFavoriteState` (`lib/__tests__/custom-matchers.ts:29`), com o resto do arquivo | div. 948 (PR-15) |
| 11 | **a harmonização do motivo dentro do web** (travessão na PR-9 × vírgula nas PR-11…13) — *item novo, vindo do §10.2.2 pela N4-D29 `[Marcel, 2026-10-01]`* | §10.2.2; `docs/native/N4-PRECHECK.md` §9 |

### 10.6 A decisão que estava pendente

| # | item | origem |
|---|---|---|
| 1 | ~~**os JSON de medição no repositório**~~ — **decidido e feito** (aval 2, PR-15): em texto só o que o veredito lê (as 14 medições vivas e o `esperado/`); os **22** do rastro em `.json.gz` (3 203 276 → 153 610 bytes), lidos pelo `ler-medicao.mjs`; `medicoes/` 13M → 10M | `I1-PR15-anexos` §5 |

### 10.7 O que o I1 fechou de heranças anteriores

| de onde | item | PR |
|---|---|---|
| `N2-ENCERRAMENTO.md` §10.3, itens 5 e 6 | remove por `content.id`; id local falso; erro ao apagar setlist já apagada | PR-13 (3/3) |
| `PLANO-TRANSICAO.md`, Bloco D, item de abertura | o loop mudo do `POST /api/auth/session` | PR-1 |
| `PLANO-TRANSICAO.md`, Bloco D (o login Google); pre-check H-I1-3 | o *Entrar com Google* morto pela CSP/COOP | PR-2 |
| `N2-ENCERRAMENTO.md` §10.8 / `N3-ENCERRAMENTO.md` §10.5 | o web com a identidade do nativo, com as seis decisões de composição | o bloco |

---

## 11. Documentação da raiz — atualizada neste commit

Linha a linha, com o antes e o depois, no anexo
[`docs-raiz.txt`](I1-ENCERRAMENTO-anexos/docs-raiz.txt). Só docs; nenhum texto de decisão
reescrito.

| arquivo | o que mudou |
|---|---|
| `CLAUDE.md` | `:111` *UI*: tokens de `packages/identidade`, `components/identidade/`, sem Radix/shadcn/Lucide desde a I1-PR-14 · `:113` *Testing*: + os gates do web e o `COMO-RODAR.md` · `:125` `components/identidade/` no lugar de `/ui` · `:263` falha é estado na tela, não toast · `:270` a árvore de exemplo sem `ui/` · `:285` (nova) *Gates do web* em *Test Types* · `:317` *Test offline scenarios* → nota "nenhum offline no web" (fecha a div. 578 da PR-3) · nota do toast antes do exemplo do *Content Management Pattern* (extra, div. 931) |
| `README.md` | `:88` e `:90` (UI e ícones: a identidade) · `:104` (o passo do shadcn CLI vira nota histórica) · `:255-256` (os créditos, como origem) |
| `docs/ux/I1-PR3-anexos/README.md` | **commit 2**: uma linha de errata sob o item 2 do §8 (o *"Fica até o encerramento do I1"* do `sw.js` não vale; aval 4, div. 951) |
| `docs/native/LOGS-OCTAVIA.md` | **commit 3**: os casos 29–37 na tabela do padrão; a ampliação da regra 14; a seção *"As regras que o I1 firmou — 24 a 32"* antes de *"A regra de método"* (div. 954) |
| `docs/ux/I1-PRECHECK.md` §17 | a linha do encerramento (commit 1); no commit 2, a da **PR-15** e o sha novo (a da PR-2 veio com a #351) |
| `ARCHITECTURE.md` | **uma nota no topo** — o documento é histórico: `domains/` saiu no P1-D (`b6292ff`), `DomainErrorBoundary`/`useErrorHandler` não existem; o que existe hoje (limite global + `tela-de-erro.tsx`, a casca, o pacote). O corpo não foi reescrito (div. 926) |

---

## 12. `PLANO-TRANSICAO.md` — duas notas

Sem reescrever (o padrão das erratas). O plano **não tem** uma "seção do web" nem uma "Ordem
depois do I1" (div. 925); as duas notas foram onde o assunto mora:

- **`## Bloco D — Morre com a web`**, logo abaixo da errata do pre-check: o loop mudo foi
  consertado na PR-1; o Google, na PR-2; as heranças do D estão no §10.1 daqui. (O commit 1
  dizia que o Google **não** tinha sido consertado — corrigido aqui, div. 952.)
- **`## Sequência`**, depois do item 10: N2, W4, N3 e I1 encerrados, cada um com a fonte; **a
  ordem depois do I1** é a da I1-D15 — **N4 → N5 → iOS**, com o **W5** à parte.

---

## 13. Contabilidade do bloco

`[lido]` dos README de cada PR (a §16 do pre-check e a contabilidade final de cada anexo), salvo
onde diz `[medido]`.

| item | valor |
|---|---|
| **requests a prod pelo executor** | **52 `GET`** de página e estático (probe 2, pre-check commit 3a) + 1 `curl` e 1 navegação ao **preview** (commit 2, pararam no SSO da Vercel); **0 a `/api/*`**; **0 em todas as PRs de código**, a PR-2 e a PR-15 inclusive |
| requests a terceiros pela PR-2 | **9** `POST …/identitytoolkit/v3/relyingparty/createAuthUri` (o handler do Firebase a cada rodada que chega ao Google: (a), (b), (c) e o controle ×2, + 1 do depois; div. 938) e **1** `curl` a `accounts.google.com` (o cabeçalho de COOP, div. 936); nada se digitou nem se clicou na página do Google |
| requests a prod pelos scripts do Marcel | só no pre-check: probe 1 (1589 `GET` de página/estático, **60 `GET /api/profile` + 1** que levou 429, ≥ 1 `POST /api/auth/session`) e probe 4 (181 `GET`, 11 `GET /api/*`, 1 `POST`, 1 `PUT`, 2 `DELETE` de setlist, 2 logins) — pisos, pelo furo do listener (div. 518) |
| **escritas em prod** | **4**, todas da **conta de audit**, todas **desfeitas** (probe 4: criar, renomear, apagar — pre-check §16). Nas PRs de código: **0** (a barreira do medidor aborta `POST`/`PUT`/`DELETE` não fabricado; `prodAbortados` 0 em toda rodada; PR-2 e PR-15: 0) |
| **contas criadas** | **0** |
| **logins do Marcel** (conta de audit ou a dele, pela tela ou por script dele) | pre-check **5** (probe 1: os três ramos da 3ª rodada; probe 4: 2) · PR-1 **3** · PR-3 **1** · PR-5 **1** (o que criou o perfil persistente) · PR-6…PR-14: **0 registrados** (perfil persistente; o README da PR-6 não traz a contagem) · **PR-2: 1 login real**, com o Google, na conta dele (o aceite) · PR-15: 0. **≥ 11** |
| **APKs** | **7** construídos, **7** pulados `[medido: gh run view --json jobs]`; a PR-2 e a PR-15 não dispararam o `native.yml` |
| **rodadas do G-faixa** | PR-5 4 (Marcel; duas sem medir, div. 628) · PR-6 3 (Marcel) · PR-7 2 e PR-8 2 (executor, sem sessão, sem `.env`) · PR-9 2 · PR-10 2 · PR-11 2 (Marcel) · PR-12 1 (Marcel) + 5 (executor, I1-D37) · PR-13 10 (executor) · PR-14 o antes e o depois da tela de erro + ~6 cargas do `dashboard` com sessão · PR-2 a medição por estado de três estados do auth, nos dois commits (I1-D37) · PR-15 nenhuma rodada nova do G-faixa (a prova por imagem: 14 cargas do `dashboard` com sessão). **≥ 37** |
| **cota máxima numa janela de 15 min** | em prod: **60/60** da conta de audit (probe 1; a 61ª leitura levou 429 real). Em `localhost`, com sessão: **52** (PR-12, rodada 1), **43** (PR-13) — teto 60 |
| **`.env*` abertos** | **0** pelo executor em todo o bloco. O `.env.uxaudit` foi lido pelos scripts do Marcel (pre-check); o `.env.local` foi carregado pelo `next dev` sem ser aberto (div. 678; copiado com `cp -p` nas PR-13, PR-14, PR-2 e PR-15) |
| **dependências removidas** `[medido]` | **40** (29 até a PR-14 + 11 na PR-15); 1 adicionada (`@octavia/identidade`) |
| **volume dos JSON** `[medido]` | `du -sh`: `tests/gates-web/medicoes` **10M** (era 13M antes da PR-15) · `tests/gates-web/esperado` **3.0M**; 51 arquivos, dos quais **22** em `.json.gz`; `git diff --shortstat c57d81f c1640e5` nessas pastas: **52 arquivos, +712 397** (era +868 331 antes da PR-15) |
| suíte `[medido]` | `c57d81f`: 1090 passed · 85 skipped (1175), 119 arquivos → **`c1640e5`**: **1181 passed · 58 skipped (1239)**, 118 passed · 3 skipped (121) |

**Esta PR**: requests a prod **0**; `adb` **0**; logins **0**; `.env*` **0**. Commit 1: `pnpm build`
e `pnpm test` na árvore sem `.env`, e `pnpm test` numa worktree temporária de `c57d81f` (removida);
agentes de leitura **5** (só leitura). Commit 2: `pnpm install --frozen-lockfile --offline` (o
lockfile mudou com a PR-15), `pnpm test`, `pnpm build` e os gates do web na árvore sem `.env`, depois
do merge da `main` (`1f15083`, sem push forçado; um conflito no `I1-PRECHECK.md` §17, as duas linhas
mantidas).

O bloco ```` ```gates ```` e o ```` ```gates-web ```` desta PR, verbatim (a cópia que a regra
do W4-b2 pede):

```gates
# I1 encerramento: nenhuma declaração — só docs (I1-ENCERRAMENTO.md e anexos; DESIGN-N2/README.md N2-E25; CLAUDE.md, README.md, ARCHITECTURE.md; PLANO-TRANSICAO.md; I1-PRECHECK.md §17).
```

```gates-web
# só docs — I1 encerramento: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

---

## 14. Decisões do aval do encerramento — `[Marcel, 2026-09-30]`

As onze perguntas do commit 1, com a resposta e onde ela se aplicou.

| # | pergunta | decisão | aplicada em |
|---|---|---|---|
| 1 | o login com Google | **PR-2 agora**, em sessão própria, antes do fecho; é decisão do bloco, não herança; a div. 920 é de origem **P** | #351; §2, §6, §10.1.15, §15 |
| 2 | os JSON de medição | em texto só o que o veredito lê (as medições vivas, a última rodada, o esperado da folha); o rastro em `.gz`, com o veredito lendo os dois — código, na PR-15 | #352; §10.6 |
| 3 | a poda (11 dependências, `Arial`, `generator`, o matcher, os `.gz`) | **PR-15 agora**, depois da PR-2, sessão própria | #352; §10.5.2–5 |
| 4 | o `public/sw.js` | sai no **bloco seguinte ao I1**; o texto da PR-3 que diz o contrário vira errata; o `CLAUDE.md` segue | §10.5.1; `I1-PR3-anexos/README.md` §8 (div. 951) |
| 5 | as regras e os casos | **regras 24–32 e casos 29–37** aprovados como numerados; a "errata órfã" é **ampliação da 14** | §9 |
| 6 | o aval cortado da PR-13 (div. 892) | **nada faltou** | div. 892 fechada |
| 7 | o tamanho da I1-E6 | **20 confirmado** | §5; div. 611 fechada |
| 8 | o asset do Google | é do Marcel; **entra na PR-2** | #351 (divs. 942, 943) |
| 9 | as quatro sem letra | **726 D · 727 A · 728 P · 767 A** | §7.1; div. 918 |
| 10 | a memoização (568) e os três `undefined` | 568 → **Bloco D**; os `undefined` → **N4** | §10.1.16, §10.2.4 |
| 11 | a `LinhaDeAviso` no core | **decide o N4** | §10.2.3 |

---

## 15. Divergências desta PR — 917–932 e 951–955

| # | origem | o quê | o que foi feito |
|---|---|---|---|
| **917** | P | *"`divergencias.txt` (as 437 linhas de tabela extraídas por grep)"* — `[medido]` no commit 1 (480–916) são **432** linhas de tabela para **418** números (13 números aparecem em mais de uma tabela) + a **756**, que só existe em prosa (`I1-PR10-anexos/README.md:471`) = **419** atribuídos; **18** números nunca atribuídos (532–549: a faixa reservada da PR-1, que parou na 531) | o anexo traz as linhas e marca a que conta (`*`); no fecho (480–955): **474** linhas, **458** números (§7.1) |
| **918** | D | quatro registros **sem letra de origem**: 726, 727, 728 (PR-9, tabela de destinos §18.7) e 767 (PR-10, §23.9) — a origem nunca foi escrita, nem em prosa **Fechada pelo aval** (decisão 9): **726 D · 727 A · 728 P · 767 A** — a leitura do commit 1 (A · A · T · A) errou duas; a §7 conta assim |
| **919** | P | *"14 PRs de código (#336–#349, mais o pre-check #335 e o congelamento #338)"* — #336–#349 são 14 números, e **o #338 está entre eles**: são **13** de código. E a **PR-2** do fatiamento (I1-D15, o Google) **nunca foi aberta** — não há branch, commit, anexo nem número | §2 com as 13; **no fecho**, com a PR-2 (#351) e a PR-15 (#352), são **15** |
| **920** | P | **o login com Google não foi consertado** *(origem A no commit 1; **P** pelo aval, decisão 1: foi o revisor que pulou a PR-2)*: `lib/security-headers.ts:81` `'frame-src': ["'none'"]`, `script-src` (`:39-47`) sem `https://apis.google.com`, COOP `same-origin` (`:124`) `[medido: grep]` — as três causas da H-I1-3. A PR-6 só deu nome à falha (A2); a div. 564 (*"a PR-2 reabre"*) ficou órfã | **Fechada**: a PR-2 aberta agora (decisão 1), #351 — H-I1-3 e div. 564 fechadas (§6) |
| **921** | P | *"testes antes (pre-check: 1101)"* — nenhum documento do bloco diz 1101 (`git grep 1101` → só um PID num `requests.txt`); `[medido]` em `c57d81f`: **1175** casos (1090 passed · 85 skipped), o mesmo do `N3-ENCERRAMENTO.md` §6 | a §1 usa o medido |
| **922** | P | *"arquivos de tela na lista do G-tok (129)"* — a lista tem **132**; **129** é a contagem de "arquivo de tela" da cobertura (os outros 3 da lista não são de tela, `g-tok-cobertura.mjs`: *"da lista que não são de tela (informa): 3"*) | as duas na §1 |
| **923** | P | *"a E19 e a E31 registradas como inexistente/recusada"* — a **E19 existe** (PR-11, div. 775, `erratasFrase`); a inexistente é a **E23** (*"Não houve I1-E23"*, PR-12). A PR-10 registrou *"a I1-E19 não existe"* para a proposta da div. 761 e a PR-11 usou o número depois | §5 com a E23 inexistente e a E31 recusada |
| **924** | P | *"o 46 → 0 da linha de base"* — a linha de base não vai a 0: é o **registro do web velho** (`cn-main`), e hoje reprova **83** (46 + o 411 contado pela errata da I1-D11) `[medido]`; o que dá 0 são as **medições vivas** (14, PASSA) | §1 com os dois |
| **925** | P | *"`PLANO-TRANSICAO.md`: a seção do web e a 'Ordem depois do I1'"* — o plano não tem nenhuma das duas: o web mora em `## Bloco D — Morre com a web` (com a errata do pre-check) e a ordem em `## Sequência`, que para no item 10 (antes do N2) | as duas notas onde o assunto mora (§12) |
| **926** | D | o `ARCHITECTURE.md` descreve uma arquitetura que não existe **desde antes do I1**: a árvore `domains/` (Zustand/immer, repositórios) saiu no **P1-D lote 1** (`b6292ff`); `DomainErrorBoundary` não existe no código (`git grep` fora de `docs/` e `.md` → 0) | nota histórica no topo, sem reescrever o corpo (§11) |
| **927** | D | o destino do `public/sw.js` tem dois textos na PR-3: *"fica até o encerramento do I1"* (aval 2, §8) × *"bloco seguinte ao I1"* (herança nomeada, §13); o `CLAUDE.md` segue o segundo | **Fechada pelo aval** (decisão 4): sai no **bloco seguinte ao I1**; o texto contrário vira errata (div. 951) |
| **928** | D | a div. 672 (PR-6) dava ao cabeçalho do `g-faixa-auth.ts` o destino *"a próxima PR que tocar o arquivo"*; a **PR-9** (`ed85f23`) e a **PR-11** (`c44c975`) tocaram e **não corrigiram** (`:5-6` ainda diz *"nada sai"*) — a regra 23 | W5, §10.4.6 |
| **929** | P | *"errata órfã reprova"* entre as **regras novas** — já é a **regra 14** (W4-b1: *"declaração órfã reprova"*, `LOGS-OCTAVIA.md:544`); o I1 a estendeu ao web | **Fechada pelo aval** (decisão 5): ampliação da 14 (§9) |
| **930** | D | a div. 578 (PR-3) deixou `CLAUDE.md:317` (*Test offline scenarios*) *"para o Marcel"*; o §11 do prompt pede o `CLAUDE.md` atualizado no item "offline" | **fechada aqui**: a linha virou a nota "nenhum offline no web" (§11) |
| **931** | P | o prompt lista, no `CLAUDE.md`, shadcn/Radix, `components/ui`, offline, os gates e o `COMO-RODAR` — o arquivo também manda **toast** (`:263` e o exemplo do *Content Management Pattern*), que o web não tem desde a PR-13 | **extra, declarado**: `:263` e uma nota antes do exemplo, sem reescrever o código dele |
| **932** | D | três heranças de PR **sem registro de pagamento**: a div. 568 (a memoização → *"a PR de setlists herda"*; a PR-13 não a cita), os três `undefined` do pacote (PR-4 → *"quem der forma final ao `TokensDaFaixa` do web"*; nenhuma PR de tela os cita) e a div. 564 (*"a PR-2 reabre"*) | **Fechada pelo aval** (decisão 10) e pela PR-2: a 568 → **Bloco D** (§10.1.16); os `undefined` → **N4** (§10.2.4); a 564 fechada pela #351 |
| **951** | P | aval 4: *"o **segundo** texto da PR-3 vira errata"* — no `I1-PR3-anexos/README.md` o primeiro é o aval 2 (`:187`, *"Fica até o encerramento do I1"*) e o segundo a herança nomeada (§13, `:346`, *"bloco seguinte ao I1"*); a decisão do mesmo aval é o bloco seguinte, então o texto que a contraria é o **primeiro** | a errata foi no **primeiro** (uma linha de nota sob o item 2 do §8 da PR-3, sem reescrever); o §13 fica como está; o `CLAUDE.md` já dizia o bloco seguinte |
| **952** | D | o commit 1 deste documento escreveu, nas notas do `PLANO-TRANSICAO.md`, que o Google **não** foi consertado e que o bloco era #335–#349 — a PR-2 e a PR-15 mudaram os dois fatos antes do merge | as duas notas corrigidas neste commit (texto desta PR, não mergeado: sem errata) |
| **953** | D | o `I1-PR2-anexos/README.md` lista quatro commits (três + *"este"*, docs); o merge `baeebf7` tem **cinco** — o `a8fdf98` (a div. 943) veio depois | o §2 daqui usa o `git log`; o README da PR-2 não se reescreve |
| **954** | D | as regras 24–32 e os casos 29–37 estão **aprovados**, mas o catálogo que as regras anteriores citam é o `LOGS-OCTAVIA.md` (as do N3 entraram lá no encerramento dele, §5) — o prompt do commit 2 não o lista | **Fechada** `[Marcel, 2026-09-30]`: sim — o commit 3 os leva ao `LOGS-OCTAVIA.md`, e a §9 daqui passa a apontar para lá |
| **955** | P | *"uma linha cada … na forma que o N3 usou lá (as regras 20–23 e os casos 25–28 como molde)"* — no `LOGS-OCTAVIA.md` os **casos** são uma linha de tabela (`# · caso · o instrumento mede · eu li como se medisse`), mas as **regras** 16–23 são **parágrafos** (título em negrito, origem em itálico, 4–7 linhas); as duas instruções não cabem juntas para as regras | os casos: uma linha cada, nas quatro colunas do molde (o *"eu li como se medisse"* reescrito a partir do "o que não leu" do §9). As regras: a forma do N3 — título, origem em itálico com a divergência e a PR, e o texto do §9 (1–4 linhas, sem acréscimo). A regra 14: uma linha de ampliação no fim dela, como a do W4-b1 |

---

## 16. Anexos

[`I1-ENCERRAMENTO-anexos/`](I1-ENCERRAMENTO-anexos/) — rastro desta PR, cada arquivo com o
comando na primeira linha; nenhum carrega texto de música.

| arquivo | o quê |
|---|---|
| [`divergencias.txt`](I1-ENCERRAMENTO-anexos/divergencias.txt) | as 474 linhas de tabela 480–955 + a 756, com origem, doc e linha, e a contagem por PR (regenerado no commit 2) |
| [`prs.txt`](I1-ENCERRAMENTO-anexos/prs.txt) | `git log --merges` do bloco, `gh pr view` de #335–#352 (sem a #350, este), os commits de cada merge e as linhas por PR (regenerado no commit 2) |
| [`contabilidade.txt`](I1-ENCERRAMENTO-anexos/contabilidade.txt) | os comandos e saídas da §1 e da §13 (suíte nos dois shas, `pnpm build`, dependências, frases, gates, volume, APKs, linhas; regenerado no commit 2 sobre `c1640e5`) |
| [`docs-raiz.txt`](I1-ENCERRAMENTO-anexos/docs-raiz.txt) | as linhas mudadas no `CLAUDE.md`, `README.md`, `ARCHITECTURE.md`, `PLANO-TRANSICAO.md`, `I1-PRECHECK.md` e `DESIGN-N2/README.md` (o `diff` deste commit) |

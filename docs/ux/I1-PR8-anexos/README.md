# I1-PR-8 — anexos: superfície 3, privacy-policy (`/privacy-policy`)

> **Bloco** I1 — identidade. **PR** de superfície 3, a última das públicas, no molde da I1-PR-6 e da I1-PR-7
> (`docs/ux/I1-PR6-anexos/README.md` §12, `docs/ux/I1-PR7-anexos/README.md` §16).
> Branch `i1/pr8-privacy`, árvore `../octavia-i1-pr8`, criada de `origin/main` =
> `d57a832609c5866de31be6052fbfa09744bb3a0a` (`Merge pull request #342`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR7-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 13.3s using pnpm v10.28.0`. **Data**: 2026-09-28.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 692**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | … | sort -n | tail -1` → 691.
> **Estado**: commit 1 (gate-first, `174ced3`), commit 2 (a implementação, `e57f5e2`, §9–§11) e **commit 3 (aceite e
> docs, §12–§17)**. PR [#343](https://github.com/marcelviana/octavia/pull/343). Divergências: 692–695 (§6), **nenhuma
> nova** no commit 2 (§15). **Veredito do aceite: PASSA — (e) = 0 e (b) = 0 nas TRÊS larguras (1138 · 711 · 411)**; as 45
> erratas candidatas cobertas pela I1-E12 (§12).

| arquivo | o que é |
|---|---|
| `texto-antes.txt` | o texto visível da página velha, congelado — o esperado do CN de igualdade do commit 2 (§2) |
| `cn/frases-x-24.txt` | as 24 frases do dicionário do pre-check × `texto-antes.txt` — 24/24 |
| `cn/g-tok-excecao-dentro-cn.txt` · `-fora-cn.txt` · `-orfa-cn.txt` | CN da lista de exceção de inglês (§3) |
| `cn/g-tok-main.txt` | G-tok (ii) com `app/privacy-policy/page.tsx` na lista, sobre a página da `main` — **REPROVA 36** |
| `cn/g-faixa-esperado.txt` | a folha `3-privacy-policy` medida → `tests/gates-web/esperado/3-privacy-policy.json` |
| `cn/privacy-texto-cn.txt` | o CN de igualdade de texto: passa na página velha e na nova; REPROVA com uma palavra trocada (§10) |
| `cn/g-tok-depois.txt` · `g-back-depois.txt` · `g-palco.txt` · `pnpm-test.txt` · `cn-pr1.txt` · `lint.txt` · `build.txt` | os verdes do commit 2 |
| `cn/g-faixa-aceite.txt` | o veredito do aceite (os sete JSON), verbatim |
| `capturas/privacy-policy-{C-1138,B-711,A-411}.png` | uma captura por largura (errata da I1-D12), `next dev` sem `.env` |

---

## 1. Inventário `[medido]`

`app/privacy-policy/page.tsx` — **112 linhas**, `"use client"` (`:1`), `export default function PrivacyPolicyPage()`,
**zero imports** (`grep -c import` → 0), nenhum hook, nenhum handler, nenhuma API do navegador. Estrutura: um `div`
de fundo (degradê `from-amber-50 to-orange-100`), um cartão (`bg-white/80 backdrop-blur-sm rounded-lg shadow-md`), um
`h1` centralizado e **sete** `section`, cada uma com um `h2` e **dois** `p` (inglês, depois português). Links: **dois**,
ambos `<a href="mailto:dpo@octavia.app">` (`:86`, `:91`), `text-blue-600 underline ml-1`. Sem data nem versão — o §17
do pre-check confirmado.

**O que só ela usa: nada** — não importa nenhum módulo; nenhum arquivo importa a página. Quem aponta para a rota: só o
link da landing (`app/page.tsx:41`) e o medidor (`scripts/gates-web/g-faixa-superficies.ts:74`); a rota não está nos
prefixos protegidos. **Teste da página velha: nenhum** (`git grep privacy-policy` fora de `docs/` e dos JSON de medição →
só esses dois e a lista do G-tok).

**Cruzamento com a folha** `[lido]`: `3-privacy-policy/telas.html` tem **uma** `section[data-estado]`, `PRIVACY`
(*"único estado"*), com as molduras C (1138, coluna 720) e B (711, coluna 663) e uma coluna "tokens" ao lado (igual ao
`README-design.md` §2.4). **A folha não tem marca nem voltar nem botão**: título, sete seções (título da seção + dois
parágrafos, vão `space.md`), `space.xxl` entre elas, e-mail em `accentInk`. Então **nenhum `LinkBotao`** e nenhum
componente de `components/identidade/` entra — a página é só tipografia, espaçamento e cor.

**`"use client"`**: nenhum hook resta (nunca houve) → **proposta: sair** (§7, pergunta 3). É limpeza: a página vira
server component como a landing; o HTML servido é o mesmo texto, sem o bundle de cliente da rota.

## 2. O texto, congelado `[medido]`

`scripts/gates-web/privacy-texto-extrair.ts` (novo): abre `/privacy-policy` num Chromium (1138 × 800), pega o
`document.body.innerText`, normaliza (espaços colapsados, uma linha por bloco que o navegador quebra, linhas vazias
fora, ordem do DOM) e acrescenta os `href` dos `mailto:` (`mailto <href>`, um por linha). Rodado contra o `next dev`
**desta árvore, sem `.env`** (porta **3108** — a 3000 é do `next-server` da árvore `../octavia-i1-pr6`, não tocado; o log
do `next dev` não tem a linha *"Environments: …"* e diz *"Firebase not configured - missing environment variables"*):

```
$ pnpm exec tsx scripts/gates-web/privacy-texto-extrair.ts http://localhost:3108 > docs/ux/I1-PR8-anexos/texto-antes.txt
```

Resultado: **24 linhas = 22 de texto** (1 título + 7 títulos de seção + 14 parágrafos) **+ 2 `mailto:dpo@octavia.app`**.

**Contagem × as 24 do `frases-web.txt`** (`cn/frases-x-24.txt`): os **24 registros** do dicionário do pre-check
(`app/privacy-policy/page.tsx:8…103`) estão todos no `texto-antes.txt` (cada um, com espaços colapsados, é substring de
uma linha); nenhuma linha sem registro. As 24 do dicionário são nós de texto do JSX: 22 blocos + os **dois**
`dpo@octavia.app` de dentro dos parágrafos de contato — por isso 22 linhas de texto contêm as 24 (div. 695). **Nenhuma
frase a mais nem a menos.**

**O que o texto de hoje é, byte a byte** (div. 692): no parágrafo de contato o JSX é `…Officer at` + quebra de linha +
`<a …ml-1>` — o JSX come a quebra, e o `innerText` é **`…Officer atdpo@octavia.app.`** (e `…pelo e-maildpo@octavia.app.`):
**não há espaço** entre a palavra e o e-mail; o respiro visual é a margem `ml-1` (4 px) do link. A folha escreve um espaço
(`at <a…>`). Congelado como está.

## 3. G-tok — a exceção de inglês `[medido]`

`scripts/gates-web/g-tok.mjs` ganha a lista **`scripts/gates-web/g-tok-sem-ingles.txt`** (ou `G_TOK_SEM_INGLES`), com
`app/privacy-policy/page.tsx` como único item: um arquivo que está nas duas listas segue cobrado em literal
(cor/fonte/espaçamento/tamanho/raio/borda/entrelinha/tracking/arbitrário), toast e import de ui; **o inglês não**. Uma
entrada da lista de exceção que **não** está em `g-tok-arquivos.txt` reprova (exceção sem arquivo cobrado). O resumo do
(ii) ganha `isentos de inglês (<lista>): <n>`.

CN, com a página da `main` copiada para fora da árvore como fixture:

| caso | resultado | arquivo |
|---|---|---|
| a fixture nas **duas** listas | `REPROVA — 36`: **só literais** (36), `textos examinados: 0`, `isentos de inglês: 1` | `cn/g-tok-excecao-dentro-cn.txt` |
| a fixture **fora** da exceção (lista vazia) | `REPROVA — 47`: os mesmos 36 literais **+ 11 de inglês** (`textos examinados: 24`) | `cn/g-tok-excecao-fora-cn.txt` |
| exceção com um arquivo que não está na lista (ii) | `REPROVA — 48`: as 47 + `outro.tsx: está em … e não na lista (ii)` | `cn/g-tok-excecao-orfa-cn.txt` |

`g-tok-arquivos.txt` recebe `app/privacy-policy/page.tsx`. Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 20 · literais de identidade acusados: 36 · toasts: 0 · imports de ui: 0 · textos examinados: 1 · isentos de inglês (scripts/gates-web/g-tok-sem-ingles.txt): 1 · vocabulário: 109 · isenções: 9

G-tok: REPROVA — 36 ocorrência(s)
# exit: 1
```

Por classe: 20 [espaçamento] · 9 [tamanho de fonte] · 5 [cor] · 1 [tamanho] · 1 [raio] — **todas em
`app/privacy-policy/page.tsx`** (os 19 de antes seguem 0). O (i) segue `PASSA` (19 cobertos, 0 órfãs). O job `g-tok` do
CI fica vermelho neste commit — é o gate-first.

## 4. Esperado da folha `[medido]`

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 3-privacy-policy
3-privacy-policy: 0 caixa(s) de campo ancorada(s) · 1 seções · 1 com C e B · nós C 24 · nós B 24 → tests/gates-web/esperado/3-privacy-policy.json
```

Os 24 nós, nas duas molduras: 22 de texto (título 720 × 36,4; títulos de seção × 29,7 — um deles em duas linhas em B,
59,4; parágrafos × 49,6 em duas linhas, dois em três linhas em B, 74,4) e os **2 links** `dpo@octavia.app` (128,5 × 22).
C: coluna em x 208, de y 48 a 1353,7. B: x 24, **w 661** (div. 694). O parágrafo de contato é pareado pelo texto
**próprio** (os nós de texto do elemento, unidos por espaço): na folha e no app ele sai `…Officer at .` — o espaço da
div. 692 não muda o par.

## 5. O web velho

`tests/gates-web/medicoes/cn-main/privacy-policy.json` existe (linha de base da I1-PR-5, estado `base`, 411 · 711 ·
1138). Não medido de novo. Veredito lido na I1-PR-5 §3: `(e)=0 · (b)=0` nas três; `(d′)` 0 em 1138, **4 em 711** e **20 em
411**.

## 6. Divergências — 692 a 695

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **692** | D | a folha e o README-design §5.4: *"o texto de hoje, inteiro"*, e a folha escreve `…Officer at dpo@octavia.app.` | o texto de hoje **não tem espaço** antes do e-mail (`innerText`: `…Officer atdpo@octavia.app.` e `…pelo e-maildpo@octavia.app.`); o respiro é a margem `ml-1` (4 px) do link | **decisão do Marcel** (§7, pergunta 2) |
| **693** | D | `README-design.md` §2.4 e a coluna "tokens" da folha: título `font.display · size.titleLarge`, seção `font.display · size.title` — **sem entrelinha** | o HTML da folha escreve `line-height:1.3` no título e `1.35` nos sete títulos de seção; **não há token** para nenhum dos dois (`lineHeight` = `text` 1,55 e `tab` 1,45). A mesma 1,3 aparece nas folhas `5` (28×) e `6` (12×). Medido no app (Raleway 600): título 33 (`natural`) · 36,4 (1,3) · 43,4 (`text`); seção 26 · 29,7 (1,35) · 34,1 | **decisão do Marcel** (§7, pergunta 1) |
| **694** | D | a folha: coluna `folha.largura` = 663 em B | na moldura B (711 com contorno de 1 px), a coluna **mede 661** (709 − 2 × 24; a de 663 encolhe no flex); o app em 711 terá 663 (711 − 2 × 24) | Δw 2, abaixo da tolerância de 4; pode mudar quebra de linha — o aceite do commit 2 lista (candidata de reflow) |
| **695** | P | *"compare com as 24 do `frases-web.txt`"* | as 24 são nós de texto do JSX (22 blocos + 2 e-mails dentro dos parágrafos); o texto normalizado tem 22 linhas + 2 `mailto` e contém as 24 | registrado (§2) |

## 7. Para o aval

1. **Div. 693 — a entrelinha do título e das seções.** Nenhuma opção sem token dá a altura da folha; o G-tok reprova
   `leading-[1.3]`.
   (a) **recomendado**: **`leading-natural`** (a entrelinha da fonte), como os títulos do auth (a `CascaAuth` herda
   `leading-natural`; a folha `1-auth` não declara entrelinha no título). Efeito: título Δh −3,4, seção Δh −3,7 cada;
   **Δy acumula** até ≈ −29 no fim da página em C (≈ −33 em B, com a seção de duas linhas) → **errata I1-E12** em
   `erratasFaixa` (`PRIVACY`): *"título e seções em `leading-natural`; a 1,3/1,35 da folha não tem token — altura livre,
   x e largura iguais"*.
   (b) `leading-entrelinha-text` (1,55): título +7, seção +4,4 cada; Δy até ≈ +38 em C (≈ +42 em B) — mesma errata, com o outro valor.
   (c) tokens novos `lineHeight.titulo` 1,3 / `lineHeight.secao` 1,35 no pacote — muda `packages/identidade`
   (APK): **fora** do escopo desta PR; serviria às folhas 5 e 6.
2. **Div. 692 — o espaço antes do e-mail.** (a) **recomendado**: o texto fica **byte a byte** (sem espaço), o respiro
   vira `ml-espaco-xs` (4 px = `space.xs`, o mesmo `ml-1` de hoje); o par do G-faixa não muda (§4) e o CN de igualdade
   passa. (b) acrescentar o espaço, como a folha — é mudar o texto (I1-D17/D19): não recomendo.
3. **`"use client"`**: (a) **recomendado**: sai (nenhum hook; limpeza, sem mudança de comportamento). (b) fica.

**A composição que vai para o commit 2** `[hipótese]`: `<main>` `min-h-screen bg-cor-bg text-cor-text font-fam-ui
py-espaco-xxxl px-web-margem flex justify-center` (a margem da §2.4: `web.margem` = `space.xxl` em C, `space.xl` em B/A;
o `py` = os 48 da moldura), coluna `w-web-folha-largura max-w-full flex flex-col gap-espaco-xxl`; `h1`
`font-fam-display font-peso-display text-tam-title-large`; cada `section` `flex flex-col gap-espaco-md` com o `h2`
`font-fam-display font-peso-display text-tam-title` e os `p` `text-tam-body leading-entrelinha-text`; o e-mail
`text-cor-accent-ink underline`. A semântica de hoje fica (`h1`, `section`, `h2`, `p`, `a`) — a folha desenha `div`, e
o par do G-faixa é por texto sem papel. A: `max-w-full` com a margem (errata da I1-D11). O texto transposto por
cópia dos nós, não à mão.

## 8. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | `next dev` local **sem** `.env` (porta 3108; a árvore só tem `.env.example`, `ls`, não aberto) | 1 subida, parada ao fim |
| executor | navegador | a folha por `file://`; a `/privacy-policy` velha em `localhost:3108` (só `GET` da página) |
| — | `packages/identidade` | **não mudou** |

---

## 9. O aval do commit 1 — decisões `[Marcel, 2026-09-28]`

1. **Div. 693**: `h1` e `h2` com **`leading-natural`**, como os títulos do auth. **Errata I1-E12** no
   `docs/ux/DESIGN-I1/README.md` §2.2 e em `erratasFaixa`: *"títulos com entrelinha natural (o padrão do web desde a
   I1-PR6); a folha `3-privacy-policy` renderizou 1,3 (`h1`) e 1,35 (`h2`) sem token; o Δy acumulado dos nós seguintes é
   consequência desta errata"* — a cobertura casa todos os Δy dos nós abaixo do primeiro título, em C e B.
   `SHA256SUMS` regenerado (docs do congelamento).
2. **Div. 692**: o texto fica **byte a byte**; o respiro antes do e-mail é `ml-espaco-xs`.
3. **`"use client"`** sai (nenhum hook) — limpeza.
4. **Div. 694** registrada (661 × 663, contorno da moldura, abaixo da tolerância).

## 10. Commit 2 — o que mudou `[medido]`

| grupo | arquivos | o quê |
|---|---|---|
| a tela | `app/privacy-policy/page.tsx` (**112 → 118 linhas**: −2 do `"use client"`, +8 do comentário de cabeçalho) | só classes e tags. `<div>` de fundo → `<main className="min-h-screen bg-cor-bg text-cor-text font-fam-ui font-peso-ui leading-natural py-espaco-xxxl px-web-margem flex justify-center items-start">` (a margem de `web.margem`; `py` = os 48 da moldura); o cartão → coluna `w-web-folha-largura max-w-full flex flex-col gap-espaco-xxl`; `h1` `font-fam-display font-peso-display text-tam-title-large leading-natural`; cada `section` `flex flex-col gap-espaco-md`; `h2` `font-fam-display font-peso-display text-tam-title leading-natural`; os 14 `p` `text-tam-body leading-entrelinha-text`; os 2 `a` `text-cor-accent-ink underline ml-espaco-xs`. A semântica de antes (`h1`, `section`, `h2`, `p`, `a`) fica |
| o texto | — | **nenhuma linha de texto mudou**: a transformação foi feita por substituição das classes/tags no arquivo velho (script, com contagem de ocorrências), não reescrita. `git diff d57a832 -- app/privacy-policy/page.tsx` fora das linhas de `className`, do cabeçalho e das tags: só `-"use client"`, `-<section>` ×7, `-<p>` ×7 e `</div>` → `</main>` |
| CN de texto | `tests/gates-web/privacy-texto.test.ts` (novo) | 4 casos: o esperado tem 22 + 2 linhas; o texto de cada bloco (`h1…h6`, `p`, `li`), na ordem do DOM, ≡ `texto-antes.txt`; nenhum texto fora dos blocos; os dois `mailto:` com o mesmo `href`. No jsdom não há `innerText`: a linha é o `textContent` de cada bloco com a mesma normalização — rodado sobre a página VELHA, dá o mesmo que o Chromium deu (a prova de que a normalização reproduz o `innerText`) |
| medidor | `scripts/gates-web/g-faixa-superficies.ts` | `privacy-policy` implementada: um estado, `PRIVACY` (`secao: 'PRIVACY'`, `espera: 'Cookies and consent / Cookies e consentimento'`) |
| docs do congelamento | `docs/ux/DESIGN-I1/README.md` §2.2, `erratas.json` (`erratasFaixa`, + o `_leia_faixa`), `SHA256SUMS` | a I1-E12 (`estados: ["PRIVACY"]`, `n: 45`); só a linha do `README.md` muda no `SHA256SUMS` (`c7407aaf…` → `382b3d8f…`); `shasum -a 256 -c` → 14/14 OK |

Zero mudança de comportamento (I1-D9): os dois `mailto:` são os de antes; nenhum link novo; nenhum `@/components/ui/*`,
nenhum `lucide-react`, nenhum toast. O `"use client"` saiu: a rota vira server component (`ƒ /privacy-policy 183 B`).

### 10.1 O CN de igualdade de texto (`cn/privacy-texto-cn.txt`)

| caso | resultado |
|---|---|
| a página **velha** (`git show d57a832:app/privacy-policy/page.tsx` posta no lugar, desfeita) | **4 passed** |
| a página **nova** | **4 passed** |
| mutação: `stored securely on` → `stored safely on` na página nova | **1 failed \| 3 passed** — o diff do Vitest mostra `-"Your information is stored securely…"` / `+"…stored safely…"`; `# exit: 1` |
| mutação desfeita (`cmp` com a cópia da branch → igual) | **4 passed** |

## 11. Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok | **PASSA**: (i) 19/19 cobertos, 0 órfãs; (ii) `arquivos: 20 · literais de identidade acusados: 0 · toasts: 0 · imports de ui: 0 · … · isentos de inglês: 1` | `cn/g-tok-depois.txt` |
| G-back | **PASSA** sem linha `gback:` — nenhum arquivo do núcleo tocado | `cn/g-back-depois.txt` |
| G-palco | **PASSA — 0** | `cn/g-palco.txt` |
| `pnpm test` | `Test Files 109 passed \| 3 skipped (112)` · `Tests 1075 passed \| 77 skipped (1152)` — +1 arquivo, +4 testes (o CN de texto) | `cn/pnpm-test.txt` |
| CN da PR-1 (`components/auth/__tests__/login-sessao-cn.test.tsx`) | **15/15** | `cn/cn-pr1.txt` |
| `tsc --noEmit` (raiz) | 0 erros | — |
| `pnpm lint` | `✔ No ESLint warnings or errors` | `cn/lint.txt` |
| `pnpm build` | `✓ Compiled successfully`; `├ ƒ /privacy-policy  183 B  103 kB` — dinâmica como toda rota (div. 689) | `cn/build.txt` |
| `shasum -a 256 -c SHA256SUMS` (DESIGN-I1) | 14/14 OK | — |

## 12. O aceite — o veredito `[medido]`

Rodada do executor: `2026-09-28T14:56:19Z`, `http://localhost:3109` (a 3000 segue com o `next-server` da árvore
`../octavia-i1-pr6` — não mexido, como a div. 691; a 3108 foi a do commit 1), commit **`e57f5e2`** (árvore limpa, sem
`+sujo`: os `cn/` novos ficaram fora da árvore durante a rodada), Chromium 140.0.7339.16. **`next dev` sem `.env`**: o log
não tem *"Environments: …"* e diz *"Firebase not configured - missing environment variables"*. Saída:
`tests/gates-web/medicoes/privacy-policy.json`. Veredito verbatim (os sete JSON): `cn/g-faixa-aceite.txt`.

```
$ node scripts/gates-web/g-faixa-veredito.mjs tests/gates-web/medicoes
## contados à parte (não reprovam): errata candidata 99 · sem par folha 106 · sem par app 74 (C e B) · não medidos 10
## erratas candidatas sem cobertura (erratasFaixa, div. 681): 0
G-faixa: PASSA
# exit: 0
```

| largura | (e) | (b) | (d′) | errata candidata | sem par folha/app | inalcançáveis em A |
|---|---|---|---|---|---|---|
| **1138** (C) | **0** | **0** | 0 | 22 — coberta por I1-E12 | 0 / 0 | — |
| **711** (B) | **0** | **0** | 3 | 23 — coberta por I1-E12 | 0 / 0 | — |
| **411** (A) | **0** | **0** | 20 | — | — | **0** |

(99 = as 54 de auth e landing + as 45 da política.) (d′) é triagem, não reprova; a linha de base da página velha era
0 · 4 · 20 (I1-PR5 §3).

### 12.1 As 45 candidatas × a cascata dos títulos

Cada uma decomposta, componente a componente:

| componente | C (22) | B (23) | explicação |
|---|---|---|---|
| **Δy** | −7,1 no 1º parágrafo, depois −3,7 a mais por seção, até **−29,2** | −3,4 no 1º título de seção, −10,8 no 1º parágrafo (o título de duas linhas perde 7,4), até **−32,9** | a cascata: `h1` 33 × 36,4 (−3,4) + cada `h2` 26 × 29,7 (−3,7) — **I1-E12** |
| **Δh** | −3,7 nos 6 `h2` listados; 0 nos parágrafos e links | −3,7 nos `h2` de uma linha, **−7,4** no de duas; 0 nos parágrafos e links | a entrelinha dos títulos — **I1-E12** |
| **Δx** | +1 em todos (o contorno da moldura); **+1,8** nos 2 links | 0; **+0,8** nos 2 links | o contorno (como a I1-PR7); nos links, o `ml-espaco-xs` (4 px) no lugar do espaço da folha — **div. 692**, abaixo da tolerância |
| **Δw** | 0 | **+2** em todo bloco de texto (661 na folha, 663 no app) | **div. 694**, abaixo da tolerância; **nenhuma quebra de linha mudou**: Δh = 0 em todos os 14 parágrafos, nas duas faixas |

**Nenhuma candidata fora da cascata**: nenhum componente acima de 4 px que não seja Δy ou o Δh de um título. O `h1` não é
candidata (Δh −3,4 e Δy 0, abaixo da tolerância). Sem par folha/app: **0/0** nas duas faixas — o par dos parágrafos de
contato funciona apesar do espaço (§4). O log de requests: 26 por largura, **0** a `octavia.rocks`, `/api/*` só os dois
`GET /api/health` do controle positivo — **0 escritas** (os dois `net::ERR_ABORTED` de `main-app.js`/`layout.js` do `next
dev` são os mesmos do `landing.json`).

**A primeira rodada** (`14:53:11Z`, commit `174ced3+sujo`, a implementação ainda fora do commit) deu o mesmo: (e) = 0 e
(b) = 0 nas três e as mesmas 45 candidatas, então **sem cobertura** (a I1-E12 ainda não estava no `erratas.json`). Nada a
consertar; não ficou em `medicoes/` (a regra guarda a rodada que reprova) e a do aceite foi refeita com o commit 2 limpo.

Capturas (uma por largura, `fullPage`): `capturas/privacy-policy-C-1138.png`, `-B-711.png`, `-A-411.png` (o selo "N" no
canto é o indicador do `next dev`). O texto nelas é o da política, obra do projeto — a regra do anexo sem texto de música
não se aplica.

## 13. O texto

`texto-antes.txt` (§2) é o esperado; o CN do §10.1 é a prova. As 24 frases do dicionário do pre-check (22 blocos + 2
e-mails) **ficam todas, sem uma letra mudada**: nenhuma traduzida, nenhuma cortada, nenhuma acrescentada (I1-D17
exceção, I1-D19, `README-design.md` §5.4). Não há `frases-privacy-policy.ts`: o texto não é frase do produto, é o
documento, e mora na página.

## 14. G-tok — antes × depois `[medido]`

| lista | gate | resultado | arquivo |
|---|---|---|---|
| a fixture (a página da `main`) nas duas listas | CN | `REPROVA — 36` (só literais) | `cn/g-tok-excecao-dentro-cn.txt` |
| a fixture fora da exceção | CN | `REPROVA — 47` (36 + 11 de inglês) | `cn/g-tok-excecao-fora-cn.txt` |
| exceção sem arquivo na lista (ii) | CN | `REPROVA — 48` (47 + a órfã) | `cn/g-tok-excecao-orfa-cn.txt` |
| os 19 de antes + `app/privacy-policy/page.tsx` da `main` | commit 1 | `REPROVA — 36` (todas na política) | `cn/g-tok-main.txt` |
| os 20 da branch | commit 2 | `PASSA` — `literais 0 · toasts 0 · imports de ui 0 · isentos de inglês 1` | `cn/g-tok-depois.txt` |

## 15. Divergências — nenhuma nova no commit 2; destino das 692–695

| # | destino |
|---|---|
| **692** | aplicado: texto byte a byte, respiro `ml-espaco-xs`; no aceite, Δx 1,8 (C) e 0,8 (B) nos links, abaixo da tolerância |
| **693** | → **I1-E12** (`DESIGN-I1/README.md` §2.2, `erratasFaixa`), cobre as 45 |
| **694** | registrado: Δw 2 em B em todo bloco, abaixo da tolerância, **sem quebra de linha diferente** (Δh 0 nos parágrafos) |
| **695** | registrado (§2) |

Próxima divergência: **696**.

## 16. O molde — o que a próxima superfície herda (acréscimo ao §16 da I1-PR-7)

1. **A lista de exceção de inglês existe e tem um item**: `scripts/gates-web/g-tok-sem-ingles.txt` (ou
   `G_TOK_SEM_INGLES`), hoje só `app/privacy-policy/page.tsx` (I1-D17 exceção). O arquivo nela segue cobrado em tudo o
   que é literal, toast e import de ui; só o inglês é isento. Entrada fora de `g-tok-arquivos.txt` reprova. Nenhuma
   outra superfície tem razão para entrar nela — o resto do web é pt-BR (I1-D17).
2. **Texto que não se reescreve tem CN de igualdade**: congela-se o `innerText` normalizado antes de tocar
   (`scripts/gates-web/privacy-texto-extrair.ts`) e o Vitest compara bloco a bloco; a transposição é por substituição de
   classes no arquivo velho, não por reescrita.
3. **Títulos do web em `leading-natural`** (o auth, a política): uma folha que declare outra entrelinha de título sem
   token é errata do G-faixa, não token novo, enquanto o pacote não mudar.

### 16.1 Bloco ```gates-web``` e extras (copiados do corpo da PR)

```gates
# I1-PR-8: nada do nativo
```

```gates-web
# I1-PR-8: nenhum arquivo do núcleo do G-back tocado (G-back PASSA sem declaração)
gtok: scripts/gates-web/g-tok-arquivos.txt — +app/privacy-policy/page.tsx
gtok: scripts/gates-web/g-tok-sem-ingles.txt — nova lista, I1-D17 exceção
# extras: docs do congelamento — docs/ux/DESIGN-I1/README.md §2.2 (I1-E12) + erratas.json (erratasFaixa) + SHA256SUMS (só a linha do README.md)
# tests/gates-web/medicoes/privacy-policy.json — o aceite do executor (next dev sem .env, porta 3109)
```

## 17. Contabilidade final da I1-PR-8

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | `next dev` local **sem** `.env` (a árvore só tem `.env.example`) | 2 subidas: a do commit 1 (3108, `texto-antes.txt`) e a do commit 2 (3109, as duas rodadas + capturas); paradas ao fim |
| executor | navegador | a folha por `file://`; a política em `localhost:3108`/`3109` |
| todos | requests a `octavia.rocks` | **0** (`prodAbortados` 0 nas três larguras) |
| todos | escritas a `/api/*` | **0** (só `GET /api/health` do controle positivo) |
| — | `packages/identidade` | **não mudou** (sem APK) |

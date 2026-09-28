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
> **Estado**: commit 1 (gate-first). Aguarda o aval (§7).

| arquivo | o que é |
|---|---|
| `texto-antes.txt` | o texto visível da página velha, congelado — o esperado do CN de igualdade do commit 2 (§2) |
| `cn/frases-x-24.txt` | as 24 frases do dicionário do pre-check × `texto-antes.txt` — 24/24 |
| `cn/g-tok-excecao-dentro-cn.txt` · `-fora-cn.txt` · `-orfa-cn.txt` | CN da lista de exceção de inglês (§3) |
| `cn/g-tok-main.txt` | G-tok (ii) com `app/privacy-policy/page.tsx` na lista, sobre a página da `main` — **REPROVA 36** |
| `cn/g-faixa-esperado.txt` | a folha `3-privacy-policy` medida → `tests/gates-web/esperado/3-privacy-policy.json` |

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

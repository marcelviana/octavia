# I1-PR-7 — anexos: superfície 2, landing (`/`)

> **Bloco** I1 — identidade. **PR** de superfície 2, no molde da I1-PR-6 (`docs/ux/I1-PR6-anexos/README.md` §12).
> Branch `i1/pr7-landing`, árvore `../octavia-i1-pr7`, criada de `origin/main` =
> `c8533c4005b66ee633d160a9a0d858c9cb5d8b58` (`Merge pull request #341`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR6-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 14.3s using pnpm v10.28.0`. **Data**: 2026-09-28.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 683**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | … | sort -n | tail -1` → 682.
> **Estado**: commit 1 (gate-first) — aguardando o aval.

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) na `main` com `app/page.tsx` na lista — **REPROVA 351** |
| `cn/g-faixa-veredito-cobertura-cn.txt` | o veredito com `erratasFaixa` sobre os cinco JSON de auth commitados — 46 "coberta por", 0 sem cobertura |
| `cn/g-faixa-veredito-sem-cobertura-cn.txt` | o mesmo veredito sobre uma fixture com UMA diferença fora das `erratasFaixa` — "sem cobertura 1" |
| `cn/g-faixa-esperado.txt` | a folha `2-landing` medida → `tests/gates-web/esperado/2-landing.json` |

---

## 1. Inventário `[medido]`

`app/page.tsx` — **350 linhas**, server component (sem `"use client"`), `export default function LandingPage()`, sem
`redirect` nem checagem de sessão (§17 do pre-check confirmado). Importa:

| import | de onde | destino |
|---|---|---|
| `Button` | `@/components/ui/button` | **compartilhado** (36 arquivos de `app/` e `components/` o importam) — fica; a landing deixa de importar |
| `Image` | `next/image` | biblioteca |
| `Link` | `next/link` | biblioteca |
| `Music, FileText, Guitar, Users` | `lucide-react` | biblioteca (usada em outros arquivos) |

**Componente só da landing: nenhum** — a página é um arquivo só; não há `components/landing/` nem arquivo importado só
por ela. **Teste da landing velha: nenhum** (`git grep` de `LandingPage`, `app/page` e das frases da vitrine → só o
próprio `app/page.tsx`, o `cn-main/landing.json` e um `.md` de 2025).

Assets de `public/` que a página usa:

| asset | quem mais usa | destino proposto |
|---|---|---|
| `/logos/octavia-icon.webp` | `components/header.tsx:61` | fica |
| `/logos/octavia-wordmark.webp` | `components/header.tsx:70` | fica |
| `/images/band-hero.webp` (150 720 bytes) | **ninguém** (só `IMAGE_OPTIMIZATION_SUMMARY.md:140`, doc) | **proposta: apagar** (div. 685) |

Estrutura (o que morre, por bloco — `grep -n '{/\*'`): cabeçalho `:12-47` (ícone + wordmark + *Sign In*/*Sign Up*) ·
hero `:49-106` (título, subtítulo, *Get Started Free*, a foto `band-hero`) · features `:108-158` (quatro cartões) ·
depoimentos `:160-220` · CTA `:222-253` (*Create Free Account*) · rodapé `:255-348` (marca, os 7 `href="#"`,
*Privacy Policy*). Links: 3 × `/login`, 3 × `/signup`, 1 × `/privacy-policy`, 7 × `href="#"` — batem com o §17 do
pre-check (div. 508).

**Cruzamento com a folha** `[lido]`: `2-landing/telas.html` tem **uma** `section[data-estado]`, `LANDING` (não
`LAND-*`: div. 683), com as molduras C (1138) e B (711); nenhuma seção a mais (a folha não tem tabela de tokens: vale
o `README-design.md` §2.4, decisão 583). A marca da folha é `<img alt="Octavia">` com o PNG em data URI de **39 824
bytes, sha256 `e9b9bd6b3a79230a…`** — o **mesmo** de `public/marcas/octavia-dark.png` que o auth já usa. O ícone do
*Entrar* é o `log-in` do catálogo (`packages/identidade/src/icones.ts:172`, o mesmo `d`).

**O que fica na `/` nova** (§5.3): `landing.marca` (nome acessível), `landing.frase`, `landing.entrar` → `/login`,
`landing.criar` → `/signup`, `landing.politica` → `/privacy-policy`. Nenhum link novo; os três destinos são os de hoje.

## 2. G-tok cresce `[medido]`

`scripts/gates-web/g-tok-arquivos.txt` ganha `app/page.tsx` (os componentes que a implementação criar entram no
commit 2). Na `main` (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 17 · literais de identidade acusados: 330 · toasts: 0 · imports de ui: 1 · textos examinados: 50 · vocabulário: 109 · isenções: 9

G-tok: REPROVA — 351 ocorrência(s)
# exit: 1
```

Por classe: 151 [cor] · 79 [espaçamento] · 36 [tamanho] · 21 [raio] · 19 [tamanho de fonte] · 19 [inglês, texto
JSX] · 13 [borda] · 11 [entrelinha] · 1 [inglês, atributo] · 1 [import de ui]. **Todas as 351 em `app/page.tsx`**
(os 16 de auth seguem 0). O job `g-tok` do CI fica vermelho neste commit — é o gate-first.

## 3. Molde, item 681 — o veredito lê `erratasFaixa` `[medido]`

`scripts/gates-web/g-faixa-veredito.mjs` lê `erratasFaixa` de `docs/ux/DESIGN-I1/erratas.json` (ou de
`G_FAIXA_ERRATAS`); cada linha de errata candidata termina em `— coberta por I1-E<n>` (o estado — a chave do JSON ou a
`folha.secao` — está nos `estados` da errata) ou `— sem cobertura`; a contagem das sem cobertura sai numa linha à parte,
depois dos "contados à parte". **Não reprova** (como a errata candidata: o aceite nomeia, o Marcel decide).

| JSON | resultado |
|---|---|
| os cinco de auth commitados (`tests/gates-web/medicoes/*.json`) | 46 linhas "coberta por": I1-E7 31 · I1-E8 2 · I1-E9 6 · I1-E10 7 (= os `n` do `erratas.json`); `## erratas candidatas sem cobertura (erratasFaixa, div. 681): 0`; `G-faixa: PASSA` |
| fixture: o `forgot-password.json` com um nó da folha C de `AUTH-forgot` deslocado 10 px em x (estado fora das `erratasFaixa`) | `errata candidata: "Trocar a senha" Δ[x,y,w,h]=[-9,0,0,0] — sem cobertura`; `sem cobertura … : 1`; as quatro de `AUTH-forgot-validacao` seguem "coberta por I1-E7"; `G-faixa: PASSA` |

Declarado no ```gates-web``` do corpo da PR: `gfaixa: scripts/gates-web/g-faixa-veredito.mjs — lê erratasFaixa, div. 681`.

## 4. Esperado da folha `[medido]`

```
$ pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 2-landing
2-landing: 0 caixa(s) de campo ancorada(s) · 1 seções · 1 com C e B · nós C 4 · nós B 4 → tests/gates-web/esperado/2-landing.json
```

Os quatro nós, nas duas molduras: a frase (420 × 63,8), *Entrar* (420 × 56), *Criar conta* (420 × 58), *Política de
privacidade* (420 × 19). C: coluna em x 598, y 48 · 143,8 · 215,8 · 305,8. B: x 144,5, y 315 · 410,8 · 482,8 · 572,8.
**A marca não entra no inventário** (div. 686): é `<img alt>` sem `aria-label`, que a `coletar` não pega.

## 5. O web velho

`tests/gates-web/medicoes/cn-main/landing.json` existe (rodada `2026-09-27T17:56:53Z`, commit `73612be…+sujo`, estado
`base`, larguras 411 · 711 · 1138). Veredito lido de novo, sem medir: `(e)=0 · (b)=0` em 1138, 711 e 411 ((d′) 7 em
411) — limpa, como a PR-5 registrou.

## 6. Divergências — 683 a 687

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **683** | P | *"um estado (`LAND-*`, confira o `data-estado`)"* | o `data-estado` é `LANDING` | o estado do medidor se chama `LANDING`, `secao: 'LANDING'` |
| **684** | D | `README-design.md` §2.4 e a coluna "tokens" da folha: frase em `lineHeight.text` (1,55) | o HTML da folha escreve `line-height:1.45` na frase (duas linhas: 63,8 px); com 1,55 a frase dá 68,2 — Δh 4,4 e Δy 4,4 em *Entrar*, *Criar conta* e no link: **errata candidata em C e B, sem cobertura** `[hipótese: conta]`. 1,45 é o valor de `lineHeight.tab` (`--entrelinha-tab`) | **decisão do Marcel** (§7, pergunta 1) |
| **685** | A | *"componentes só da landing morrem"* | nenhum componente é só da landing; um **asset** é: `public/images/band-hero.webp` | **decisão do Marcel** (§7, pergunta 3) |
| **686** | T | — | a marca da folha é `<img alt="Octavia">`: fora do inventário da `coletar` (sem `aria-label`, não é controle). No auth ela é `div role=img aria-label` e pareia | a landing usa `<Image alt>` como a folha: nenhum dos lados a mede, sem "sem par". A posição dela fica provada pela da coluna (em C o x da coluna depende de 340 + 140; em B o y depende de 219 + 48) |
| **687** | A | molde §12 item 5: *"se outra superfície precisar do mesmo botão, ele sobe para `components/identidade/`"* | a landing precisa do `LinkBotao` (principal com `log-in` 24; secundário `web.botaoAuth` = touch.list + 2) de `components/auth/controles-auth.tsx` | **decisão do Marcel** (§7, pergunta 2) |

## 7. Para o aval

1. **Div. 684 — a entrelinha da frase.** (a) **recomendado**: vale o HTML medido — a frase em
   `leading-entrelinha-tab` (1,45, o mesmo valor; o nome é do token que existe); zero errata; nenhuma mudança no pacote.
   (b) vale a tabela: `leading-entrelinha-text` (1,55) e uma errata **I1-E11** em `erratasFaixa` para as ~8 candidatas
   de `LANDING`. (c) token novo `web.entrelinhaFrase` — muda o pacote (APK): **fora** do escopo desta PR.
2. **Div. 687 — os botões.** (a) **recomendado** (o molde): `LinkBotao` e as duas classes-base (`PRINCIPAL`,
   `SECUNDARIO`) sobem para `components/identidade/link-botao.tsx`; `controles-auth.tsx` passa a importá-las de lá —
   mesmas classes, mesmo DOM no auth (o G-tok de auth segue PASSA; o arquivo novo entra na lista). (b) a landing
   escreve as próprias classes (as mesmas, duplicadas), sem tocar em auth.
3. **Div. 685 — `public/images/band-hero.webp`**: (a) **recomendado**: apagar com a landing (extra declarado; o
   `IMAGE_OPTIMIZATION_SUMMARY.md` é histórico e fica). (b) deixar.

A composição (marca | coluna em C, empilhada em B/A, `max-w-full` e `px-web-margem` em A) vai escrita em
`app/page.tsx`, com as classes de nome de token do molde — sem importar a `CascaAuth` (ela exige o `h1` do rótulo,
que a landing não tem). Frases em `components/landing/frases-landing.ts` (o padrão `frases-<superficie>.ts`).

## 8. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | navegador | só contra a folha, por `file://` |
| executor | `next dev` | nenhum neste commit |

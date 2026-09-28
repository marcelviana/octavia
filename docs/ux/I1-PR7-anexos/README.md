# I1-PR-7 — anexos: superfície 2, landing (`/`)

> **Bloco** I1 — identidade. **PR** de superfície 2, no molde da I1-PR-6 (`docs/ux/I1-PR6-anexos/README.md` §12).
> Branch `i1/pr7-landing`, árvore `../octavia-i1-pr7`, criada de `origin/main` =
> `c8533c4005b66ee633d160a9a0d858c9cb5d8b58` (`Merge pull request #341`); pré-condição
> `git cat-file -e origin/main:docs/ux/I1-PR6-anexos/README.md` → existe. `pnpm install --frozen-lockfile --offline` →
> `Done in 14.3s using pnpm v10.28.0`. **Data**: 2026-09-28.
> **Convenções**: `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha; `[hipótese]` = o resto.
> Divergências **a partir de 683**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | … | sort -n | tail -1` → 682.
> **Estado**: commit 1 (gate-first, `ce617f1`), commit 2 (a implementação, `7ae343e`, §9–§11) e **commit 3 (aceite e
> docs, §12–§16)**. Divergências: 683–687 (§6), **688–691** (§15). **Veredito do aceite: PASSA — (e) = 0 e (b) = 0 nas
> TRÊS larguras (1138 · 711 · 411)**; as 8 erratas candidatas cobertas pela I1-E11 (§12).

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) na `main` com `app/page.tsx` na lista — **REPROVA 351** |
| `cn/g-faixa-veredito-cobertura-cn.txt` | o veredito com `erratasFaixa` sobre os cinco JSON de auth commitados — 46 "coberta por", 0 sem cobertura |
| `cn/g-faixa-veredito-sem-cobertura-cn.txt` | o mesmo veredito sobre uma fixture com UMA diferença fora das `erratasFaixa` — "sem cobertura 1" |
| `cn/g-faixa-esperado.txt` | a folha `2-landing` medida → `tests/gates-web/esperado/2-landing.json` (commit 1, sem a marca) |
| `cn/g-faixa-img-alt-antes.txt` · `-depois.txt` | CN da div. 686: `<img alt>` como nó — o caso novo REPROVA na coleta de antes, os 3 casos PASSAM depois |
| `cn/g-faixa-esperado-img-alt.txt` | a folha re-medida com a regra: `2-landing` ganha a marca (5 nós); `1-auth` **byte a byte igual** |
| `cn/g-tok-depois.txt` · `g-back-depois.txt` · `g-palco.txt` · `pnpm-test.txt` · `cn-pr1.txt` · `lint.txt` · `build.txt` | os verdes do commit 2 |
| `cn/g-faixa-aceite.txt` | o veredito do aceite (os seis JSON), verbatim |
| `capturas/landing-{C-1138,B-711,A-411}.png` | uma captura por largura (errata da I1-D12), `next dev` sem `.env` |

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

---

## 9. O aval do commit 1 — decisões `[Marcel, 2026-09-28]`

1. **Div. 684**: a frase usa **`lineHeight.text`** (1,55; `leading-entrelinha-text`). **Errata I1-E11** no
   `docs/ux/DESIGN-I1/README.md` §2.2 e em `erratasFaixa` do `erratas.json`: *"a folha `2-landing` renderizou a frase
   com 1,45; a tabela declara `lineHeight.text` (1,55), que é o que vale"*. `SHA256SUMS` regenerado (docs do
   congelamento).
2. **Div. 687**: `LinkBotao` e as classes do principal e do secundário sobem para
   **`components/identidade/link-botao.tsx`**; o auth importa de lá, mesmas classes, mesmo DOM. `components/identidade/`
   é a casa dos componentes do molde; a `LinhaDeAviso` fica em `components/auth/` até a superfície que precisar dela.
3. **Div. 685**: `public/images/band-hero.webp` sai, extra declarado.
4. **Div. 686**: a coleta trata `<img alt="…">` como nó (nome = `alt`), para que a marca cortada conte como (b). CN com
   fixture; `esperado/2-landing.json` regravado (a marca entra); a folha `1-auth` re-medida só para conferir.

## 10. Commit 2 — o que mudou `[medido]`

| grupo | arquivos | o quê |
|---|---|---|
| a tela | `app/page.tsx` (**350 → 48 linhas**), `components/landing/frases-landing.ts` (novo) | a folha `2-landing`, T-I1-R111 (C) e T-I1-R112 (B): marca \| coluna em C com `gap-web-vao-auth`, empilhada em B/A (o padrão, sem o `c:`); marca `w-web-marca-largura h-web-marca-altura` com o PNG do auth e `alt` = `landing.marca`; coluna `w-web-coluna-auth max-w-full` com `gap-espaco-xxl`; frase `font-fam-display-medium font-peso-display-medium text-tam-title leading-entrelinha-text`; *Entrar* = `LinkBotao principal icone="log-in"` → `/login`; *Criar conta* = `LinkBotao` → `/signup` (grupo `gap-espaco-lg`); o link `text-tam-label text-cor-accent-ink` → `/privacy-policy`. A: `px-web-margem` e `max-w-full` (errata da I1-D11). Server component, sem sessão, sem redirect |
| identidade (div. 687) | `components/identidade/link-botao.tsx` (novo), `components/auth/controles-auth.tsx`, `app/forgot-password/page.tsx`, `app/signup/confirm-email/page.tsx` | `BOTAO_PRINCIPAL`, `BOTAO_SECUNDARIO` e `LinkBotao` saem de `controles-auth.tsx` (que importa as duas classes-base de lá); as duas páginas de auth importam o `LinkBotao` de `identidade`. As strings de classe são as mesmas, byte a byte |
| asset (div. 685) | `public/images/band-hero.webp` | apagado (150 720 bytes) |
| instrumento (div. 686) | `scripts/gates-web/g-faixa-coleta.ts`, `tests/gates-web/g-faixa-coleta.cn.ts`, `tests/gates-web/esperado/2-landing.json` | `img[alt]:not([alt=""])` entra no `MARCADO`, papel `img`, nome = `alt`; `alt=""` segue decorativo (o `CascaAuth` usa `alt=""` dentro do `role=img`) |
| medidor | `scripts/gates-web/g-faixa-superficies.ts` | `landing` implementada: um estado, `LANDING` (`secao: 'LANDING'`, `espera: 'Criar conta'`) |
| G-tok | `scripts/gates-web/g-tok-arquivos.txt` | + `components/landing/frases-landing.ts`, + `components/identidade/link-botao.tsx` (o `app/page.tsx` entrou no commit 1) |
| docs do congelamento | `docs/ux/DESIGN-I1/README.md` §2.2, `erratas.json` (`erratasFaixa`), `SHA256SUMS` | a I1-E11; só a linha do `README.md` muda no `SHA256SUMS` (`d7ade82a…` → `c7407aaf…`); `shasum -a 256 -c` → 14/14 OK |

Zero mudança de comportamento (I1-D9): os três destinos são os de antes; nenhum link novo; nenhum `href="#"`, nenhum
`@/components/ui/*`, nenhum `lucide-react`, nenhum toast, nenhum literal em inglês na página.

### 10.1 O CN do `<img alt>` (div. 686)

| caso | resultado | arquivo |
|---|---|---|
| fixture: `<img alt="Octavia">` 340 × 219 com `margin-left: 200px` num contêiner `overflow: hidden`, mais um `<img alt="">` | coleta de ANTES: **falha** — os nós saem `[]` (a imagem não era vista, o (b) de 411 era 0) | `cn/g-faixa-img-alt-antes.txt` |
| a mesma, coleta de DEPOIS | nós `["img:Octavia"]`; (b) de 1138 `[]`; (b) de 411 **1** (`borda do viewport`); o `alt=""` fica fora; os dois casos da PR-5/PR-6 seguem verdes — **3 passed** | `cn/g-faixa-img-alt-depois.txt` |
| a folha `2-landing` re-medida | 4 → **5 nós** em C e em B: a marca, C `x 118 · y 76,9`, B `x 184,5 · y 48`, 340 × 219 | `cn/g-faixa-esperado-img-alt.txt` |
| a folha `1-auth` re-medida | **byte a byte igual** ao `esperado/1-auth.json` commitado (`cmp` → igual): a marca do auth já era nó (div. 688) | idem |

Os cinco JSON de auth commitados não ganham "sem par folha" novo: o esperado de auth não mudou, e o app de auth tem a
imagem com `alt=""` (fora) dentro do `role=img` com `aria-label` (dentro, como antes).

## 11. Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok | **PASSA**: (i) 19/19 cobertos, 0 órfãs; (ii) `arquivos: 19 · literais de identidade acusados: 0 · toasts: 0 · imports de ui: 0` | `cn/g-tok-depois.txt` |
| G-back | **PASSA** sem linha `gback:` — nenhum arquivo do núcleo tocado | `cn/g-back-depois.txt` |
| G-palco | **PASSA — 0** | `cn/g-palco.txt` |
| `pnpm test` | `Test Files 108 passed \| 3 skipped (111)` · `Tests 1071 passed \| 77 skipped (1148)` — nenhum teste da landing velha existia, nenhum morreu | `cn/pnpm-test.txt` |
| CN da PR-1 (`components/auth/__tests__/login-sessao-cn.test.tsx`) | **15/15** | `cn/cn-pr1.txt` |
| `tsc --noEmit` (raiz) | 0 erros | — |
| `pnpm lint` | `✔ No ESLint warnings or errors` | `cn/lint.txt` |
| `pnpm build` | `✓ Compiled successfully`; `┌ ƒ /  190 B  111 kB` — **dinâmica, como todas as rotas** (div. 689) | `cn/build.txt` |
| `shasum -a 256 -c SHA256SUMS` (DESIGN-I1) | 14/14 OK | — |

## 12. O aceite — o veredito `[medido]`

Rodada do executor: `2026-09-28T14:12:30Z`, `http://localhost:3107` (a 3000 estava ocupada pelo `next-server` da árvore
`../octavia-i1-pr6` — não mexido; div. 691), commit **`7ae343e`** (árvore limpa, sem `+sujo`), Chromium 140.0.7339.16.
**`next dev` sem `.env`**: a árvore só tem `.env.example` (`ls`, não aberto); o log do `next dev` **não** tem a linha
*"Environments: …"* e diz *"Firebase not configured - missing environment variables"*. Saída:
`tests/gates-web/medicoes/landing.json`. Veredito verbatim (os seis JSON): `cn/g-faixa-aceite.txt`.

```
$ node scripts/gates-web/g-faixa-veredito.mjs
## contados à parte (não reprovam): errata candidata 54 · sem par folha 106 · sem par app 74 (C e B) · não medidos 10
## erratas candidatas sem cobertura (erratasFaixa, div. 681): 0
G-faixa: PASSA
# exit: 0
```

| largura | (e) | (b) | (d′) | errata candidata | sem par folha/app | inalcançáveis em A |
|---|---|---|---|---|---|---|
| **1138** (C) | **0** | **0** | 0 | 4 — coberta por I1-E11 | 0 / 0 | — |
| **711** (B) | **0** | **0** | 0 | 4 — coberta por I1-E11 | 0 / 0 | — |
| **411** (A) | **0** | **0** | 0 | — | — | **0** |

As 8 candidatas, iguais em C e B: a frase `Δh +4,4`; *Entrar*, *Criar conta* e o link `Δy +4,4` — a entrelinha da
I1-E11, nada mais. O `Δx 1` de tudo é a borda de 1 px da moldura da folha (abaixo da tolerância de 4). A marca pareia
(`Δ ≤ 1`) nas duas faixas. O log de requests: 35 por largura, **0** a `octavia.rocks`, `/api/*` só os dois
`GET /api/health` do controle positivo — **0 escritas**.

**A primeira rodada** (`14:07:22Z`, commit `ce617f1+sujo`, a implementação ainda fora do commit) deu o mesmo:
(e) = 0 e (b) = 0 nas três, e as mesmas 8 candidatas, então **sem cobertura** (a I1-E11 ainda não estava no
`erratas.json`). Nada a consertar; por isso não ficou em `medicoes/landing-rodada1/` (a regra guarda a rodada que
reprova) e a do aceite foi refeita com o commit 2 limpo.

Capturas (uma por largura, `fullPage`): `capturas/landing-C-1138.png`, `landing-B-711.png`, `landing-A-411.png` (o selo
"N" no canto é o indicador do `next dev`).

## 13. As frases

### 13.1 As cinco (`components/landing/frases-landing.ts`)

| chave | texto | origem |
|---|---|---|
| `landing.frase` | organize, veja e compartilhe cifras, letras, tabs e partituras | §5.3 |
| `landing.entrar` | Entrar | §5.3 (principal, decisão 16) |
| `landing.criar` | Criar conta | §5.3 (secundário) |
| `landing.politica` | Política de privacidade | §5.3 |
| `landing.marca` | Octavia | §5.3 (nome acessível: o `alt` da marca) |

### 13.2 As cortadas

O dicionário do pre-check (`docs/ux/I1-PRECHECK-anexos/frases-web.txt`) tem **52 registros** de `app/page.tsx`: 47
`jsx` e 5 `attr:alt` (div. 690). **12 viraram as cinco chaves**: *Sign In* ×3 → `landing.entrar`; *Sign Up*, *Get
Started Free*, *Create Free Account* → `landing.criar`; o *Organize, visualize…* → `landing.frase` (sem o resto);
*Privacy Policy* → `landing.politica`; `alt` *Octavia* ×4 → `landing.marca`. **40 morreram**:

- cabeçalho e hero (4): *🎵 Digital Music Revolution* · *Your Music Library,* · *Digitized* · o `alt` da foto
  (*Musician performing with digital sheet music on tablet*);
- features (10): *Why Musicians Choose Octavia* · *Powerful features designed by musicians, for musicians* · os quatro
  títulos (*Digital Sheet Music*, *Smart Annotations*, *Guitar Tabs & More*, *Multi-User Access*) e os quatro textos;
- depoimentos (11): *Loved by Musicians Everywhere* · *See what our community is saying…* · os três nomes (*Sarah M.*,
  *Mike R.*, *Alex K.*), os três papéis (*Classical Guitarist*, *Band Leader*, *Music Teacher*) e as três citações;
- CTA (2): *Ready to Organize Your Music?* · *Join thousands of musicians…*;
- rodapé (13): *Your digital music companion…* · *Product* · *Features* · *Pricing* · *FAQ* · *Company* · *About* ·
  *Blog* · *Contact* · *Legal* · *Terms* · *©* · *Octavia. All rights reserved.*

(As iniciais *S*, *M*, *A* dos avatares não estão no dicionário — não são frase.) Os 7 `href="#"` morreram com o
rodapé.

## 14. G-tok — antes × depois `[medido]`

| lista | gate | resultado | arquivo |
|---|---|---|---|
| os 16 de auth + `app/page.tsx` da `main` | commit 1 | `REPROVA — 351` (todas em `app/page.tsx`) | `cn/g-tok-main.txt` |
| os 19 da branch (+ `frases-landing.ts`, + `link-botao.tsx`) | commit 2 | `PASSA` — `literais 0 · toasts 0 · imports de ui 0` | `cn/g-tok-depois.txt` |

## 15. Divergências — 688 a 691

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **688** | P | item 4: *"re-medir a folha `1-auth` só para conferir que o esperado de auth ganha a marca"* | a marca da `1-auth` é `div role=img aria-label="Octavia"` (a folha não tem nenhum `<img>`): já era nó; o `esperado/1-auth.json` re-medido sai **byte a byte igual** | registrado; nada a fechar na próxima re-medição da auth por causa desta regra |
| **689** | P | *"a `/` continua estática na tabela de rotas"* | a tabela de rotas marca **todas** as páginas `ƒ` (Dynamic), a `/` inclusive (190 B): o `app/layout.tsx:35` lê o nonce da CSP (`await getCSPNonce()`) para toda rota — já era assim na `main` `[lido]`; nenhuma linha de `app/layout.tsx` mudou | registrado; a página em si continua server component sem sessão, sem `use client` e sem redirect |
| **690** | P | *"a vitrine (43 frases)"* | o dicionário do pre-check tem **52** registros de `app/page.tsx` (47 `jsx` + 5 `alt`); 12 viraram as cinco chaves e **40** morreram | a contagem do §13.2 |
| **691** | T | *"G-faixa … contra `localhost:3000`"* | a 3000 estava ocupada pelo `next-server` da árvore `../octavia-i1-pr6` (`lsof`, `cwd`) | medido na **3107**, `next dev` desta árvore, sem `.env`; o servidor alheio não foi tocado (como a div. 644) |

Com destino, as de antes: 683 (`LANDING`, aplicado), 684 (→ I1-E11), 685 (asset apagado), 686 (`<img alt>` é nó), 687
(`components/identidade/link-botao.tsx`).

## 16. O molde — o que a próxima superfície herda (acréscimo ao §12 da I1-PR-6)

1. **`components/identidade/` é a casa** dos componentes do molde: o que uma segunda superfície precisa sobe para lá,
   numa PR que o declare (aqui: `link-botao.tsx` — `LinkBotao`, `BOTAO_PRINCIPAL`, `BOTAO_SECUNDARIO`). A
   `LinhaDeAviso` segue em `components/auth/` até a superfície que precisar dela a mover.
2. **`<img alt="…">` é nó** do G-faixa (nome = `alt`; `alt=""` é decorativo e fica fora): marca cortada conta como (b).
3. **O veredito diz a cobertura** de cada errata candidata (`erratasFaixa`, div. 681); uma errata da folha achada pelo
   G-faixa entra lá com `estados` e `n`, e no `DESIGN-I1/README.md` §2.2.

### 16.1 Bloco ```gates-web``` e extras (copiados do corpo da PR)

```gates
# I1-PR-7: nada do nativo
```

```gates-web
# I1-PR-7: nenhum arquivo do núcleo do G-back tocado (G-back PASSA sem declaração)
gtok: scripts/gates-web/g-tok-arquivos.txt — +app/page.tsx, +components/landing/frases-landing.ts, +components/identidade/link-botao.tsx
gfaixa: scripts/gates-web/g-faixa-veredito.mjs — lê erratasFaixa, div. 681
gfaixa: scripts/gates-web/g-faixa-coleta.ts — img alt como nó, div. 686
# extras: public/images/band-hero.webp apagado (div. 685)
# docs do congelamento: docs/ux/DESIGN-I1/README.md §2.2 (I1-E11) + erratas.json (erratasFaixa) + SHA256SUMS (só a linha do README.md)
# tests/gates-web/medicoes/landing.json — o aceite do executor (next dev sem .env, porta 3107, div. 691)
```

## 17. Contabilidade final da I1-PR-7

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview · logins · `.env*` abertos · escritas · contas | **0 · 0 · 0 · 0 · 0** |
| executor | `next dev` local **sem** `.env` (porta 3107; a árvore só tem `.env.example`) | 2 subidas: a 1ª rodada (14:07Z) e o aceite + capturas (14:12Z); paradas ao fim |
| executor | navegador | a folha por `file://`; a landing em `localhost:3107` |
| todos | requests a `octavia.rocks` | **0** (`prodAbortados` 0 nas três larguras) |
| todos | escritas a `/api/*` | **0** (só `GET /api/health` do controle positivo) |
| — | `packages/identidade` | **não mudou** (sem APK) |

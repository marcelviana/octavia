# I1-PR-6 — anexos: superfície 1, auth (`/login`, `/signup`, `/signup/confirm-email`, `/verify-email`, `/forgot-password`)

> **Bloco** I1 — identidade. **PR** de superfície 1 (o molde das sete seguintes). Branch `i1/pr6-auth`, árvore
> `../octavia-i1-pr6`, criada de `origin/main` = `98673edb47dbad29cd228d02639b8207e8247c1c` (`Merge pull request #340`);
> pré-condição `git cat-file -e origin/main:scripts/gates-web/g-faixa-veredito.mjs` → existe. `pnpm install
> --frozen-lockfile --offline` → `Done in 15.1s using pnpm v10.28.0`. **Data**: 2026-09-27.
> **Convenções** (as do `I1-PRECHECK.md`): `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha;
> `[hipótese]` = o resto. Divergências **636–655**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | sort -t'*' -k3 -n | tail -1` → 635.
> **Estado**: **commit 1 (gate-first)** — nenhuma linha de `app/`, `components/`, `lib/`, `contexts/` mudou.
> O commit 2 (a implementação) espera o aval da §9.

| arquivo | o que é |
|---|---|
| `cn/g-tok-main.txt` | G-tok (ii) na `main` com a lista nova — **REPROVA 453** |
| `cn/g-tok-toast-cn.txt` | CN da regra nova do toast (I1-D26) — **REPROVA 4** na fixture |
| `cn/g-faixa-antes.txt` | o web velho de auth sem sessão (`/signup`, `/forgot-password`, `/signup/confirm-email`), medição + veredito — **REPROVA 10** |
| `cn/g-faixa-esperado.txt` | a folha medida: `1-auth` e `0-linha-de-aviso` → `tests/gates-web/esperado/*.json` |
| `capturas-antes/*.png` | uma captura por superfície do web velho, C e B (errata da I1-D12), das quatro que abrem sem conta |

---

## 1. Inventário `[medido]`

`for f in …; do grep -oE "from '…'" $f; done` (saída resumida; `wc -l` da árvore):

| arquivo | linhas | importa (casca compartilhada em **negrito**) |
|---|---|---|
| `app/login/page.tsx` | 22 | `next/navigation`, `@/lib/firebase-server-utils`, `next/headers`, `@/components/auth/login-panel` |
| `app/signup/page.tsx` | 75 | `next/image`, `next/navigation`, `@/lib/firebase-server-utils`, `next/headers`, `@/components/auth/signup-panel`, `lucide-react` |
| `app/signup/confirm-email/page.tsx` | 98 | `react`, `next/link`, `lucide-react`, **`@/components/ui/card`**, **`@/components/ui/button`**, `@/contexts/firebase-auth-context` |
| `app/verify-email/page.tsx` | 161 | `react`, `next/navigation`, `next/link`, `lucide-react`, **`ui/card`**, **`ui/button`**, `@/contexts/firebase-auth-context` |
| `app/forgot-password/page.tsx` | 154 | `react`, **`ui/button`**, **`ui/card`**, **`ui/input`**, **`ui/label`**, **`ui/alert`**, `next/link`, `lucide-react`, `@/lib/firebase`, `firebase/auth` |
| `components/auth/login-panel.tsx` | 346 | `react`, `next/navigation`, `next/link`, **`ui/button`**, **`ui/card`**, **`ui/input`**, **`ui/label`**, `@/contexts/firebase-auth-context`, `./linha-de-aviso`, `./frases-sessao`, `lucide-react`, `next/image` |
| `components/auth/signup-panel.tsx` | 247 | `react`, `next/navigation`, `next/image`, `next/link`, **`ui/button`**, **`ui/card`**, **`ui/input`**, **`ui/label`**, `@/contexts/firebase-auth-context`, `lucide-react`, **`ui/select`** |
| `components/auth/linha-de-aviso.tsx` | 42 | — (o componente da folha 0; importado por `login-panel.tsx` e `aviso-de-sessao.tsx`) |
| `components/auth/frases-sessao.ts` | 45 | `@/lib/firebase-session-cookies` (tipo) — as sete frases da PR-1, **ficam** |
| `components/auth/aviso-de-sessao.tsx` | 31 | `next/navigation`, `@/contexts/firebase-auth-context`, `./linha-de-aviso`, `./frases-sessao` — **folha 4** (`SESSAO-nao-renovada`), fora desta PR (div. 653) |

- **Layout**: nenhuma das cinco rotas tem `layout.tsx`, `loading.tsx` nem `error.tsx` (`ls` → vazio); o que as envolve
  é só o `app/layout.tsx` raiz (provider do Firebase, `<Toaster>` do sonner em `:124`, `globals.css` com
  `body { font-family: Arial }`). **O `app/styles/identidade.css` não é importado por nenhum arquivo do web** (`git grep
  identidade.css` → só o gerador e o teste) e **o pacote raiz não depende de `@octavia/identidade`** (só o
  `apps/native`) — div. 647.
- **Toast**: nenhum dos nove arquivos chama `toast` hoje (`git grep` → 0); a regra nova do G-tok (§4) é para não entrar.
- **Mensagens de erro**: vêm do contexto (`contexts/firebase-auth-context.tsx`) já em inglês, **sem o código** do
  Firebase: `{ error: { message } }` com `getErrorMessage` de `lib/firebase-errors.ts` (`:317` signIn, `:341` Google,
  `:401` signUp, `:485` reenviar) — div. 650.
- **Seletores de terceiros**: os roteiros da PR-1 e do pre-check (`docs/ux/I1-PR1-anexos/cn/comum.ts:174-179`,
  `faseB/probe{1,4}.ts`) acham os campos por `#email` e `#password`: o commit 2 **mantém os dois `id`**. O CN de tela
  `login-sessao-cn.test.tsx` acha o botão por `getByRole('button', { name: 'Tentar de novo' })` (`:287`, `:323`, `:329`).

## 2. Os estados: matriz × folha `[lido]`

A folha tem **47 `data-estado`**: 46 estados + a seção `Tokens` (a tabela, sem moldura — div. 643); a I1-E1 acrescenta
`AUTH-verify-reenviar-excecao` (T-I1-R95/96). Linhas da árvore de hoje (a matriz do pre-check é de `c57d81f`; as linhas
mudaram com a PR-1).

| estado da folha | nasce em (hoje) | frase de hoje |
|---|---|---|
| `AUTH-login` | `login-panel.tsx:199-345` | "Sign In" … |
| `AUTH-login-validacao` | `:242-250`, `:267-275` (`required`, `type=email`) | balão do navegador (a folha não o desenha) |
| `AUTH-login-entrando` | `:294-298` | "Signing in..." |
| `AUTH-login-google` | `:317-321` | "Loading..." |
| `AUTH-login-redirecionando` | `:177-196` | "Redirecting to dashboard..." + "Click here if not redirected automatically" |
| `AUTH-login-sem-token` | `:50-52` (na tela de `:177`) | "Unable to obtain authentication token" |
| `AUTH-login-credencial` | contexto `:317` → `:148-151` | "Invalid email or password…" / "No account found…" / "Incorrect password…" |
| `AUTH-login-limite-prazo` · `-limite` · `-rede` | `:278-283` (`LinhaDeAviso` + `frases-sessao.ts`) | as frases da PR-1 (já pt-BR) |
| `AUTH-login-google-erro` | contexto `:341` → `:166-169` | "Sign-in was cancelled…" / "Sign-in popup was blocked…" |
| `AUTH-login-nao-configurado` | contexto `:302`/`:325` → `:150`/`:168` | "Authentication not configured" |
| `AUTH-login-perfil-401` | `:86-128` (`:123`, `:127`) — **na tela de `:177`** | "Authentication failed. Please sign in again." |
| `AUTH-login-servidor` | `:80-81`/`:117-118` (throw → `:134`), `:129-131` — **na tela de `:177`** | "Failed to create profile" / "Failed to fetch profile" |
| `AUTH-signup` | `signup-panel.tsx:66-246` + `app/signup/page.tsx:18-72` (vitrine) | "Sign Up" … |
| `AUTH-signup-validacao` | `:114-209` (`required`, `minLength={6}` `:190`) | balão do navegador |
| `AUTH-signup-senhas` | `:33-36` | "Passwords do not match" |
| `AUTH-signup-criando` | `:219-223` | "Creating account..." |
| `AUTH-signup-email-usado` · `-senha-fraca` · `-rede` · `-limite` | contexto `:401` → `:47-49` | mapa de `firebase-errors.ts` |
| `AUTH-signup-perfil` | contexto `:392` (throw) → `:401` → `:48` | "Failed to create profile in database" |
| `AUTH-signup-excecao` | `:58-60` | "An unexpected error occurred" |
| `AUTH-confirm` | `confirm-email/page.tsx:35-51` | "Confirm Your Email" … "Email sent to:" (só com `user`) |
| `AUTH-confirm-enviando` | `:80-84` | "Sending..." |
| `AUTH-confirm-sucesso` | `:54-58` | "Verification email sent successfully!…" |
| `AUTH-confirm-erro` · `-erro-rede` | contexto `:485` → `:22-24` | mapa (429, rede) |
| `AUTH-confirm-sem-usuario` | contexto `:475` → `:24` | "Not authenticated or Firebase not configured" |
| `AUTH-confirm-excecao` | `:28-29` | "An unexpected error occurred" |
| `AUTH-verify-carregando` | `verify-email/page.tsx:71-73` | `return null` |
| `AUTH-verify` | `:75-160` | "Verify Your Email" … |
| `AUTH-verify-checando` | `:112-116` | "Checking..." |
| `AUTH-verify-enviando` | `:131-135` | "Sending..." |
| `AUTH-verify-nao-verificado` | `:45-48` | "Email not verified yet…" |
| `AUTH-verify-checar-falhou` | `:50-51` | "Failed to check verification status" |
| `AUTH-verify-reenviar-erro` · `-limite` | contexto `:485` → `:25-27` | mapa (rede, 429) |
| `AUTH-verify-reenviar-excecao` (I1-E1) | `:31-32` | "An unexpected error occurred" |
| `AUTH-verify-reenviado` | `:94-98` | "Verification email sent successfully!…" |
| `AUTH-forgot` | `forgot-password/page.tsx:81-153` | "Reset Password" … |
| `AUTH-forgot-validacao` | `:111-119` (`required`, `type=email`) | balão do navegador |
| `AUTH-forgot-enviando` | `:128-132` | "Sending..." |
| `AUTH-forgot-indisponivel` | `:26-29` | "Password reset is not available" |
| `AUTH-forgot-erro` | `:35-36` | `err.message` cru do Firebase |
| `AUTH-forgot-sucesso` | `:42-79` | "Check Your Email" … |

**Código sem estado na folha** (div. 639): (a) `?error_description=` do `/login` (`app/login/page.tsx:14-15` → o
`initialError` de `login-panel.tsx:20`) mostra o texto do parâmetro na caixa de erro — não há seção; (b) `signUp` com o
Firebase não configurado (contexto `:348`, "Authentication not configured") — a folha só tem `-nao-configurado` no login
e `-indisponivel` no forgot; (c) os *fallbacks* do painel — "Invalid credentials" (`:150`), "An error occurred during
login" (`:156`), "Google sign in failed" (`:168`, `:172`) — e todo erro do Google fora do mapa, que hoje cai em
"Something went wrong" (`firebase-errors.ts:190`, div. 515 do pre-check).

**Estado da folha sem código** — nenhum: todo estado desenhado nasce de uma linha de hoje. Mas há **composição que o
código não tem**: o 401/5xx do perfil (`-perfil-401`, `-servidor`) aparece **na tela "Redirecionando"** (`login-panel.tsx
:177-196`, porque a sessão já está aberta) e a folha o desenha **no formulário**, com a `LinhaDeAviso` (div. 638); e o
429 do perfil, que a folha manda para `-limite`/`-limite-prazo`, hoje é "Failed to fetch profile" junto com 404/5xx
(`:129-131`). `AUTH-signup-excecao` e `AUTH-confirm-excecao` têm código mas o contexto não lança (todo `catch` devolve
`{ error }`): **inalcançáveis** `[hipótese]` — como a I1-E1 já tratou o do verify (div. 640).

## 3. O mecanismo de estilo — **proposta** (decisão do Marcel antes do commit 2)

O que falta hoje para qualquer tela do web consumir a identidade (div. 647, 648): o `identidade.css` não entra na página,
o web não carrega Raleway/Manrope/Plex Mono, e os **literais com origem** da folha (S0: marca 340 × 219, coluna 420, vão
140; campo `touch.list + 4` = 60; secundário `touch.list + 2` = 58; botão de ação da `LinhaDeAviso` 36 (N3); entrelinha
20 (N3, I1-E5)) não têm custom property.

### Opção A (recomendada) — Tailwind com nomes de token → `var(--…)`

1. **`tailwind.config.ts` estendido com chaves NOMEADAS** e valores só `var(--…)`, num namespace que não colide com o
   shadcn (que já tem `muted`, `accent`, `border`…): `colors.cor.{bg,text,muted,line,line-info,accent-ink,error-ink,
   offline-ink,…}` → `bg-cor-bg`, `text-cor-muted`, `border-cor-line-info`; `spacing.{espaco-xs…espaco-xxxl, toque-min,
   toque-list, s0-campo, …}` → `p-espaco-xl`, `gap-espaco-md`, `h-s0-campo`; `fontSize.tam-{label,body,…}`;
   `fontFamily.{display,ui,mono}`; `borderRadius.{chip,control,pill}`; `lineHeight`, `letterSpacing` idem. **Nenhum
   número no config**: o config só lista nomes; os valores são do CSS gerado.
2. **As faixas como `screens` geradas dos `limiares`** do pacote (`c: { raw: '(width > 960px)' }`, `b: …`) — o
   config importa `limiares` de `packages/identidade/src` (um só ponto de decisão, I1-D7 item 1): `flex-col c:flex-row`
   é o "empilha em B, lado a lado em C" da folha. Nenhuma media query escrita à mão.
3. **Os literais com origem entram no pacote** como tokens nomeados (`web.s0` = `{ marca: [340, 219], coluna: 420, vao:
   140, campo: touch.list + 4, secundario: touch.list + 2 }`, `aviso` = `{ botao: 36, entrelinha: 20 }`), com a origem no
   comentário, e o gerador os escreve como `--s0-*`/`--aviso-*`; o `css.test.ts` cobra. O nativo não muda (não importa
   esses nomes). **Alternativa 3b**: um `app/styles/identidade-literais.css` à mão, com a origem de cada linha — mas aí
   há dois arquivos de verdade e o "gerado == fonte" não o cobre.
4. **`identidade.css` e as fontes entram só onde há tela redesenhada**: um componente de casca `components/auth/casca
   -auth.tsx` (as cinco páginas o usam) importa o CSS e aplica as variáveis de fonte de `next/font/local` sobre os
   seis `.ttf` que o nativo já embarca (`@expo-google-fonts/{raleway,manrope,ibm-plex-mono}`, os mesmos bytes — copiados
   para `app/fontes/` com o sha256 ao lado, ou apontados no `node_modules` do `apps/native`). **Não toca o
   `app/layout.tsx`** (sem mudar a fonte das telas velhas); servido de `'self'`, que a CSP (`font-src 'self'`,
   `lib/security-headers.ts:54-57`) já aceita.
5. **Ícones** por um `components/identidade/icone.tsx` (web) que desenha `desenhos[nome]` de `@octavia/identidade` com
   o envelope do catálogo (viewBox 24, `TRACO[tamanho]`), cor por token. Pede `"@octavia/identidade": "workspace:*"` no
   `package.json` raiz → **extra declarado** (package.json + lockfile).
6. **Marca**: `apps/native/assets/logo-octavia-dark.png` é **byte a byte** a da folha (`.marca` em data URI: 39824 bytes,
   952 × 614, sha256 `e9b9bd6b3a79230a…` nos dois) → cópia para `public/marcas/octavia-dark.png`. **Google**: não há
   `public/marcas/google.svg` → o quadrado tracejado de 20 (div. 636).

**O que muda no `g-tok.mjs`** (commit 2, com CN): hoje a regra de cor casa `bg-<paleta>` e a de espaçamento casa
`p-<número>`, então `bg-cor-bg`/`p-espaco-xl` já passam e `bg-amber-500`/`p-4` já reprovam. **Falta** (div. 649):
largura/altura/tamanho (`w-4`, `h-10`, `max-w-md`, `min-h-[44px]`), raio (`rounded-md`), borda (`border-2`), entrelinha
(`leading-5`), tracking (`tracking-wide`), sombra/opacidade e **todo valor arbitrário `[…]` com número** que não seja
`var(--…)` — um `w-[420px]` passaria hoje. Proposta: (iii) reprova utilitário de escala numérica/nomeada do Tailwind
nessas famílias e arbitrário sem `var(`; aceita `full`, `auto`, `screen`, `0`, frações (`w-1/2`: proporção, não medida
— §2.3 da folha); `style={{ … }}` com número já é pego pelas regras camelCase. E (iv) **arquivo da lista não importa
`@/components/ui/*`** (div. 651): os primitivos do shadcn trazem os literais para dentro da tela sem aparecer no arquivo
listado.

### Opção B — CSS Modules com `var()`

`auth.module.css` por tela, `height: var(--s0-campo)`. Mais explícito e sem config, mas a troca de faixa exigiria
`@media (width > 960px)` **escrito à mão** em cada módulo (literal do limiar, contra a I1-D7 item 1), e o G-tok teria de
ler `.module.css` também. Não recomendo.

### As frases (div. 650)

O contexto devolve só a mensagem em inglês. **A1 (recomendada, zero contrato)**: `components/auth/frases-auth.ts` mapeia
**a mensagem do `FIREBASE_AUTH_ERRORS`** (a própria tabela de `lib/firebase-errors.ts`, importada: mensagem → código →
chave pt-BR) e os literais do contexto ("Authentication not configured", "Not authenticated or Firebase not configured",
"Failed to create profile in database") para as chaves da §5.2; o que não casar vira `motivo.generico`. **A2**: o
contexto passa a devolver também `codigo` no objeto de erro (aditivo, mas é contrato do contexto). Com A1, a div. 515
("a razão real, não *Something went wrong*") fica **parcial**: `popup-blocked` e `popup-closed-by-user` têm frase; um
erro do Google fora do mapa (ex.: o da CSP do pre-check) continua sem nome — só A2 o nomeia, e nem a §5.2 tem frase para
ele.

## 4. G-tok cresce `[medido]`

- `scripts/gates-web/g-tok-arquivos.txt` ganha os nove arquivos da §1 (sem o `aviso-de-sessao.tsx`, div. 653).
- `g-tok.mjs` ganha a regra **toast**: num arquivo da lista, `toast(…)`, `toast.<x>(…)` ou `useToast` reprova (I1-D26,
  div. 634). Estendida a `toast.<x>(` porque o sonner montado no layout (`app/layout.tsx:124`) é chamado assim.

Na `main` com a lista nova (`cn/g-tok-main.txt`):

```
$ node scripts/gates-web/g-tok.mjs --so-arquivos
  arquivos: 9 · literais de identidade acusados: 409 · toasts: 0 · textos examinados: 75 · vocabulário: 109 · isenções: 9

G-tok: REPROVA — 453 ocorrência(s)
# exit: 1
```

238 [cor] · 136 [espaçamento] · 44 [inglês] · 35 [tamanho de fonte]; por arquivo: `login/page` 2 · `signup/page` 59 ·
`confirm-email` 43 · `verify-email` 49 · `forgot-password` 66 · `login-panel` 110 · `signup-panel` 115 · `linha-de-aviso`
9 · `frases-sessao` 0. **O job `g-tok` do CI fica vermelho neste commit** — é o gate-first: fica verde no commit 2.
A parte (i) (a folha) segue `PASSA` (19 achados, 19 cobertos).

CN da regra do toast (`cn/g-tok-toast-cn.txt`, fixture fora da árvore): `REPROVA — 4` (`useToast` ×2, `toast(`,
`toast.error(`); `toaster` (identificador) e o `import` sozinho não acusam.

## 5. G-faixa — a folha como esperado `[medido]`

`scripts/gates-web/g-faixa-esperado.ts` (novo; `pnpm exec tsx scripts/gates-web/g-faixa-esperado.ts 1-auth
0-linha-de-aviso`): abre a folha por `file://`, sem servidor e sem `G_FAIXA_BASE_URL`, e mede cada `<section
data-estado>` nas molduras C e B com a **mesma `coletar`** do medidor, no Chromium fixado (lido do texto da config, que
lança sem a variável de propósito). Saída (`cn/g-faixa-esperado.txt`):

```
1-auth: 47 seções · 46 com C e B · nós C 526 · nós B 526 → tests/gates-web/esperado/1-auth.json
  ✗ Tokens: sem a moldura C B
0-linha-de-aviso: 9 seções · 8 com C e B · nós C 17 · nós B 17 → tests/gates-web/esperado/0-linha-de-aviso.json
  ✗ Tokens: sem a moldura C B
```

Duas adaptações do molde (a 1ª foi preciso fazer para medir, a 2ª é proposta):

1. **`__name`** (div. 642): pelo `tsx`, o esbuild envolve as funções internas de `coletar` em `__name(…)`, que a página
   não tem (`ReferenceError: __name is not defined`); o transform do Playwright Test não faz isso. O script define um
   `__name` identidade na página antes de medir. A `coletar` não mudou.
2. **O par nó-do-app × nó-da-folha** (div. 641, proposta): a folha é feita de `div` — "Esqueci a senha" é `texto`, o
   rótulo "E-mail" é `texto`, o campo é um `div` com o valor de exemplo "marcel@exemplo.com". No app o link é `link`, o
   rótulo é `label` e o campo é `textbox` com o placeholder "voce@exemplo.com". A chave é `papel:hash(texto)#n`, então
   **nada disso pareia** e a errata candidata (4 px) compara **só** o que pareia, em silêncio — em `AUTH-login`, dos 12
   nós da folha, só os dois `button` (*Entrar*, *Entrar com Google*) pareariam `[hipótese]`. Proposta para o commit 2: **(a)** na comparação contra a folha, a chave
   sem o papel (`hash(texto)#n`) com classes de equivalência (`texto` ≈ `link` ≈ `label` ≈ `heading`); **(b)** âncoras
   para o que a folha escreve com dado de exemplo: um `tests/gates-web/esperado/1-auth.ancoras.json` (seletor na folha →
   `data-testid`) aplicado pelo `g-faixa-esperado.ts` antes de medir, e o mesmo `data-testid` no app (`t:<testid>` casa
   dos dois lados); **(c)** o veredito conta e lista **os nós da folha sem par** por estado × largura — hoje eles
   somem. E o medidor passa a ler o `esperado/<folha>.json` em vez de medir a folha dentro de cada rodada (a
   `medirFolha` de hoje só roda em 1138, `g-faixa-medir.ts:127`).

## 6. G-faixa — o web velho de auth `[medido]`

`/login` está na linha de base da PR-5 (`tests/gates-web/medicoes/cn-main/login.json`: 0 · 0 · 0 nas três). O
executor mediu as outras três que abrem **sem conta**, contra um `next dev` da própria árvore **sem `.env`** (Firebase
desligado; a porta 3000 estava ocupada por um `next dev` da árvore `../octavia-i1-pr5` — não mexi nele; usei a 3106,
div. 644), com `g-faixa-superficies.ts` ganhando `signup`, `forgot-password` e `confirm-email` (estado `base`). Saída em
`tests/gates-web/medicoes/antes-1-auth/` (subpasta: o CI não a lê). Veredito (`cn/g-faixa-antes.txt`):

| superfície | 1138 | 711 | 411 (à parte) |
|---|---|---|---|
| `/login` (linha de base da PR-5) | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · 0 |
| `/signup` | 0 · 0 · 0 | **(e) 10** · 0 · 0 | 10 · 0 · 0 |
| `/forgot-password` | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · 0 |
| `/signup/confirm-email` (sem `user`) | 0 · 0 · 0 | 0 · 0 · 0 | 0 · 0 · 0 |

`G-faixa: REPROVA — 10 ocorrência(s)`: em 711 some a vitrine do `/signup` (`app/signup/page.tsx:18`, `hidden md:flex`):
"Start Your Musical Journey", o parágrafo e os quatro destaques (a folha a corta: nota de `AUTH-signup`). As outras
duas empilham e passam em 711 (div. 645). As JSON dizem `commit …+sujo`: o instrumento desta PR ainda não estava
commitado na hora da medição (div. 646). Capturas: `capturas-antes/{login,signup,forgot-password,confirm-email}-{C,B}.png`
(o selo "N" no canto é o indicador do `next dev`).

**Não medidos no antes — exigem conta**: `/verify-email` (sem usuário devolve `null` e empurra para `/login`,
`verify-email/page.tsx:63-73`) e o `/signup/confirm-email` **com** usuário (a linha do e-mail, o reenviar). O
`confirm-email` **sem** usuário abre (div. 637).

## 7. Estado × como alcançar × conta — para o aceite (§4 do prompt)

Legenda do alcance: **sem env** = o `next dev` sem `.env` (executor, Firebase desligado); **fab.** = `page.route()`
fabricando a resposta do `identitytoolkit.googleapis.com` / `securetoken` (nada sai para o Google; com o `.env` do
Marcel, porque o SDK só inicia configurado) `[hipótese até medir]`; **audit** = login da conta de audit pelo perfil
persistente (a PR-1 e a PR-5 fizeram assim); **∅** = inalcançável.

| estado | como alcançar | conta? | escrita |
|---|---|---|---|
| `AUTH-login` | abrir `/login` | não | 0 |
| `-validacao` | submeter vazio (balão do navegador; o DOM é o da base) | não | 0 |
| `-entrando` | fab.: segurar `accounts:signInWithPassword` (nunca responder) | não | 0 |
| `-google` | clicar *Entrar com Google* com `window.open` segurado | não | 0 |
| `-redirecionando` | audit: login real + segurar `GET /api/profile` por `route()` | **audit** | 0 |
| `-sem-token` | audit + `refreshToken` sem token — **só por mock de SDK** | ∅ no navegador `[hipótese]` | — |
| `-credencial` (+ 2 variantes) | fab.: `signInWithPassword` → 400 `INVALID_LOGIN_CREDENTIALS` / `EMAIL_NOT_FOUND` / `INVALID_PASSWORD` | não | 0 |
| `-limite-prazo` · `-limite` · `-rede` | audit + `POST /api/auth/session` → 429 c/ e s/ `Retry-After` / `abort()` (o CN da PR-1) | **audit** | 0 |
| `-google-erro` | `addInitScript`: `window.open = () => null` → `auth/popup-blocked`; fechar o popup → `popup-closed-by-user` (div. 655: `route()` no `apis.google.com` não dá esse código) | não | 0 |
| `-nao-configurado` | **sem env**: submeter o formulário | não | 0 |
| `-perfil-401` · `-servidor` | audit + `GET /api/profile` → 401 ×2 / 500 | **audit** | 0 |
| `AUTH-signup` | abrir `/signup` | não | 0 |
| `-validacao` | submeter vazio | não | 0 |
| `-senhas` | senhas diferentes e submeter (verificação antes de qualquer request, `signup-panel.tsx:33`) — também **sem env** | não | 0 |
| `-criando` | fab.: segurar `accounts:signUp` | não | 0 |
| `-email-usado` · `-senha-fraca` · `-limite` | fab.: `accounts:signUp` → 400 `EMAIL_EXISTS` / `WEAK_PASSWORD` / `TOO_MANY_ATTEMPTS_TRY_LATER` | não | 0 |
| `-rede` | `context.setOffline(true)` antes de submeter | não | 0 |
| `-perfil` | fab.: `signUp` 200 com usuário falso + `sendOobCode` 200 + `POST /api/profile` → 500 por `route()` | não `[hipótese]` | 0 (o `POST /api/profile` é respondido no navegador, não chega ao servidor) |
| `-excecao` | — | ∅ `[hipótese]` (div. 640) | — |
| `AUTH-confirm` sem e-mail | abrir `/signup/confirm-email` sem usuário (**sem env** também) | não | 0 |
| `AUTH-confirm` com e-mail · `-enviando` · `-sucesso` · `-erro` · `-erro-rede` | usuário **não verificado**: (i) conta descartável, ou (ii) usuário falso semeado no IndexedDB do Firebase por `addInitScript` + `sendOobCode`/`accounts:lookup` fabricados | **descartável** ou **fab.** | (i): cria conta; (ii): 0 |
| `-sem-usuario` | **sem env**: clicar *Reenviar* (o contexto devolve na hora, `:475`) | não | 0 |
| `-excecao` | — | ∅ `[hipótese]` | — |
| `AUTH-verify-carregando` | sem usuário, segurar a navegação para `/login` por `route()` (o `null` de hoje dura até o `router.push`) | não `[hipótese]` | 0 |
| `AUTH-verify` e os outros 9 (`-checando` … `-reenviado`, `-reenviar-excecao` ∅) | usuário não verificado, como no confirm; `-checar-falhou` = `accounts:lookup` abortado; `-nao-verificado` = `lookup` com `emailVerified: false` | **descartável** ou **fab.** | idem |
| `AUTH-forgot` · `-validacao` | abrir / submeter vazio | não | 0 |
| `-enviando` | fab.: segurar `accounts:sendOobCode` | não | 0 |
| `-indisponivel` | **sem env**: submeter | não | 0 |
| `-erro` | fab.: `sendOobCode` → 400; ou `setOffline` | não | 0 |
| `-sucesso` | fab.: `sendOobCode` → 200 (nenhum e-mail sai) | não | 0 |

A **conta de audit é verificada**: não alcança nenhum estado do `/verify-email` (com usuário verificado a página vai
para `/dashboard`). Para os 10 do verify e os 5 do confirm com usuário, as duas saídas estão na §9.

## 8. Divergências — 636 a 655

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **636** | P | *"se `public/marcas/google.svg` existir… use-o"* | `ls public/marcas` → *No such file or directory* | o quadrado tracejado de 20 × 20 da folha; **Marcel fornece o asset** |
| **637** | P | *"`/signup/confirm-email` e `/verify-email` exigem conta nova ou não verificada"* | o `confirm-email` renderiza sem usuário (`page.tsx:45`: só a linha do e-mail depende de `user`); medido 0 · 0 · 0 | base sem e-mail e `-sem-usuario` medidos sem conta; o resto do confirm e o verify inteiro seguem exigindo usuário não verificado (§7) |
| **638** | D | a folha desenha `AUTH-login-perfil-401` e `-servidor` **no formulário**, com `LinhaDeAviso` | o código os mostra **dentro da tela "Redirecionando"** (`login-panel.tsx:177-196`: com a sessão aberta o painel troca de tela); e o 429 do perfil é "Failed to fetch profile", junto de 404/5xx (`:129-131`) | **decisão do Marcel**: (a) mudar a condição de render para o formulário com a linha quando o perfil falha (composição; o fluxo e as requests são os mesmos) e separar o 429 pelo `res.status` que o código já lê; ou (b) errata na folha |
| **639** | A | — | código sem seção: `?error_description=` do `/login` (`app/login/page.tsx:14-15`); `signUp` sem Firebase (contexto `:348`); os *fallbacks* "Invalid credentials" (`:150`), "An error occurred during login" (`:156`), "Google sign in failed" (`:168`, `:172`) e o erro do Google fora do mapa | proposta: todos na forma da seção vizinha com `motivo.generico` (o `error_description` sob o botão, como `-google-erro`; o signup sem Firebase como `-nao-configurado` com a frase `login.nao-configurado`) — **decisão do Marcel** (ou errata na folha) |
| **640** | A | a folha desenha `AUTH-signup-excecao` e `AUTH-confirm-excecao` | o contexto não lança (todo `catch` devolve `{ error }`); o `catch` da tela não se alcança `[hipótese]` | implementados como desenhados; "não medidos: inalcançáveis" no aceite, como o `-reenviar-excecao` da I1-E1 |
| **641** | T | *"é contra isso [a folha] que a diferença de 4 px se mede"* | a folha é de `div` sem papel; campo com dado de exemplo: as chaves não pareiam e a errata candidata compara só o que pareia, **em silêncio** | proposta da §5 (chave sem papel + âncoras `data-testid` + contagem dos sem par) — **decisão do Marcel** |
| **642** | T | medir a folha *"com o `g-faixa-medir.ts`"* | o medidor é um teste do Playwright com `G_FAIXA_BASE_URL` obrigatória; pelo `tsx`, `coletar` quebra com `__name is not defined` (esbuild) | script próprio `g-faixa-esperado.ts`, com `__name` identidade na página; `coletar` intacta |
| **643** | D | `README-design.md` §2.4: *"Auth · 46 estado(s)"* | 47 `data-estado`: a seção `Tokens` também tem o atributo, sem moldura | o esperado a registra como *"sem a moldura C B"*; 46 estados medidos |
| **644** | T | *"meça você mesmo contra `localhost:3000`"* | a 3000 estava ocupada por um `next-server` com `cwd` `../octavia-i1-pr5` (`lsof`) — não é desta árvore | medido na 3106, `next dev` da árvore sem `.env`; o servidor alheio não foi tocado |
| **645** | A | o web velho de auth reprova no G-faixa | só o `/signup` reprova (vitrine some em 711); `/forgot-password` e `/confirm-email` empilham e passam | registrado; o G-tok reprova os cinco (§4) |
| **646** | T | — | as JSON do antes dizem `commit 98673ed…+sujo` | o instrumento desta PR estava fora do commit na hora; o web medido é o da `main` (nenhum arquivo de tela mudou) |
| **647** | P | *"nenhum literal … fora de `app/styles/identidade.css`"* | o `identidade.css` não é importado por nada do web; o pacote raiz não depende de `@octavia/identidade`; o web não carrega as três fontes (`globals.css`: `Arial`) | §3 itens 4–5; extra declarado (package.json + lockfile) |
| **648** | P | idem | os literais com origem (S0 340/219/420/140, +4, +2; N3 36 e 20) não têm custom property | §3 item 3 — **decisão do Marcel** (no pacote, ou arquivo à mão) |
| **649** | T | G-tok (ii) cobre *"cor, tipo, espaçamento"* | não lê largura/altura/raio/borda/entrelinha/tracking nem arbitrário `[420px]`: um literal do S0 passaria | §3, regra (iii) — **decisão do Marcel** |
| **650** | P | div. 515: *"a razão real, não 'Something went wrong'"* | o contexto entrega só a mensagem em inglês, sem o código | §3 "As frases": A1 (zero contrato; 515 parcial) ou A2 (código no contexto) — **decisão do Marcel** |
| **651** | T | — | as telas usam `@/components/ui/*` (shadcn), cheios de literais que o G-tok não vê por não estarem na lista | §3, regra (iv): arquivo da lista não importa `@/components/ui/*` |
| **652** | P | *"`/login` já está na linha de base"* | está, só no estado `base` e com o web velho em inglês | o antes do `/login` fica o da PR-5; os estados de erro não têm antes medido (as frases de hoje estão na §2) |
| **653** | P | *"a `LinhaDeAviso` restilizada"* | o `aviso-de-sessao.tsx` (a linha no topo, fora do `/login`) é o `SESSAO-nao-renovada` da **folha 4** | fica fora da lista do G-tok desta PR; muda de aparência junto (importa a `LinhaDeAviso`); o invólucro `sticky … p-2` é da PR da folha 4 |
| **654** | D | §5.2: `login.razao.sem-token` · *"o servidor não devolveu o token"* | a resposta 4 da rodada 2 manda o sem-token para *"falha no servidor — a sessão não foi aberta"* (e é o que a seção desenha) | a chave fica **sem uso**; a tabela de frases a lista como "não usada (resposta 4)" |
| **655** | P | *"pop-up do Google bloqueado (`route()` no `apis.google.com`)"* | `auth/popup-blocked` vem do `window.open` devolver `null`, não da rede; bloquear o `apis.google.com` dá outro código `[hipótese]` (cai no genérico) | `addInitScript` com `window.open = () => null` (§7); o `route()` no `apis.google.com` fica como caso do genérico |

## 9. O que espera o aval (antes do commit 2)

1. **Mecanismo de estilo** — A (Tailwind com nomes de token → `var()`, `screens` dos `limiares`) ou B (CSS Modules). §3.
2. **Literais com origem** — no pacote (`--s0-*`, `--aviso-*`, gerados e cobertos pelo `css.test.ts`) ou arquivo à mão. §3 item 3.
3. **G-tok** — regras (iii) (tamanho/raio/borda/entrelinha/tracking/arbitrário) e (iv) (sem `@/components/ui/*`). §3.
4. **Fontes e CSS só na casca de auth** (sem tocar o `app/layout.tsx`) e os `.ttf` — copiados para `app/fontes/` ou lidos do `apps/native`. Extra: `package.json` + lockfile (`@octavia/identidade`). §3 itens 4–5.
5. **Frases** — A1 (mapa pela mensagem) ou A2 (código no contexto). §3.
6. **Div. 638** (perfil 401/5xx no formulário ou errata) e **639** (código sem seção).
7. **G-faixa** — o par nó × folha (§5 item 2) e o medidor lendo o `esperado/`.
8. **Contas** — para os 5 estados do confirm com usuário e os 10 do verify: (i) **conta descartável não verificada**
   (cria conta no Firebase e escreve o perfil: `POST /api/profile`) ou (ii) **usuário falso** semeado no IndexedDB e
   respostas fabricadas (zero conta, zero escrita; `[hipótese]` até o Marcel rodar). Sem aval para nenhuma, ficam "não
   medidos, exigem conta".
9. **O Google** — o asset em `public/marcas/google.svg` (div. 636).

## 10. Contabilidade (commit 1)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks` ou preview | **0** |
| executor | logins | **0** |
| executor | `.env*` abertos | **0** (a árvore não tem `.env*` além do `.env.example`, conferido com `ls`, não aberto) |
| executor | escritas | **0** |
| executor | `next dev` local **sem** `.env` | 1× (porta 3106), parado ao fim: medição das três + capturas |
| executor | navegador contra a folha | `file://` (sem rede) |
| — | arquivos fora de `scripts/gates-web/**`, `tests/gates-web/**`, `docs/ux/I1-PR6-anexos/**` | **0** |

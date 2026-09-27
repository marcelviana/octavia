# I1-PR-6 — anexos: superfície 1, auth (`/login`, `/signup`, `/signup/confirm-email`, `/verify-email`, `/forgot-password`)

> **Bloco** I1 — identidade. **PR** de superfície 1 (o molde das sete seguintes). Branch `i1/pr6-auth`, árvore
> `../octavia-i1-pr6`, criada de `origin/main` = `98673edb47dbad29cd228d02639b8207e8247c1c` (`Merge pull request #340`);
> pré-condição `git cat-file -e origin/main:scripts/gates-web/g-faixa-veredito.mjs` → existe. `pnpm install
> --frozen-lockfile --offline` → `Done in 15.1s using pnpm v10.28.0`. **Data**: 2026-09-27.
> **Convenções** (as do `I1-PRECHECK.md`): `[medido]` = comando + saída literal (em `cn/`); `[lido]` = arquivo:linha;
> `[hipótese]` = o resto. Divergências **636–655**, numeração conferida pela coluna:
> `git grep -nE '^\| \*\*6[0-9][0-9]\*\* \| [A-Z]' docs | sort -t'*' -k3 -n | tail -1` → 635.
> **Estado**: commit 1 (gate-first, `1d47884`) e **commit 2 (a implementação, §11)**; o aceite (§11.6, `COMO-RODAR.md`) é do Marcel, e
> o commit 3 (veredito e docs) espera o "rodei". Divergências do commit 2: **656–671** (§11.8).

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

## 9. O aval do commit 1 — decisões `[Marcel, 2026-09-27]`

(Transcrição do prompt do commit 2; a lista de perguntas do commit 1 fica no histórico do arquivo.)

1. **Estilo**: Tailwind com nomes de token cujo valor é só `var(--…)` (`bg-cor-bg`, `p-espaco-xl`, `w-web-coluna-auth`),
   faixas geradas dos limiares do pacote. G-tok: classe com nome de token passa; literal e valor arbitrário reprovam.
2. As medidas fixas da folha viram tokens no bloco **`web`** de `packages/identidade`: `web.marca` (340 × 219),
   `web.colunaAuth` 420, `web.vaoAuth` 140 (C; em B `space.xxxl`), `web.campoAuth` 60, `web.botaoAuth` 58,
   `web.botaoAviso` 36, `web.entrelinhaAviso` 20. Gerados no `identidade.css`, cobertos pelo `css.test.ts`; a igualdade
   atualizada (adição); o `DESIGN-I1/README.md` §4 ganha os nomes (docs, declarado, `SHA256SUMS` regenerado).
3. `g-tok.mjs` cresce: largura, altura, raio, borda, entrelinha, tracking, valor arbitrário `[...]`, e `import … from
   '@/components/ui/…'` reprova nos arquivos da lista. CN com fixture para cada classe nova.
4. `identidade.css` e as três fontes entram pelo **`app/layout.tsx`** (`@font-face` com os `.ttf` de
   `apps/native/assets/fonts/` copiados para `public/fontes/`, sha256 igual); `@octavia/identidade` no `package.json` da
   raiz; lockfile — extras declarados. Prova de inércia: a `/` medida em 1138 antes e depois, mesmo resultado.
5. Frases: **A2** — o contexto devolve **código + mensagem**; o painel escolhe a frase pelo código; a div. 515 fecha; o
   CN da PR-1 15/15 continua.
6. Div. 638: o erro de perfil (401/5xx) volta ao **formulário** com a `LinhaDeAviso`; "abrindo o painel…" só sem erro.
   Div. 639: sem estado novo — `?error_description=` e as genéricas → `motivo.generico`; cadastro sem Firebase →
   `login.nao-configurado`.
7. Div. 641: o veredito casa nó por **texto sem papel**, os campos por `data-testid`, e **lista os nós sem par**.
8. Contas: **(ii)** primeiro (usuário falso + `route()`, zero conta, zero escrita); se não alcançar os 10 do verify e os
   5 do confirm, **(i)** autorizada: conta descartável não verificada, criada e apagada **pelo Marcel** (1 signup + 1
   perfil, contados no aceite).
9. Logo do Google: se `public/marcas/google.svg` existir, usa; senão o quadrado tracejado, div. 636 "Marcel fornece".

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

## 11. Commit 2 — a implementação `[medido]`

### 11.1 O que mudou, por grupo

| grupo | arquivos | o quê |
|---|---|---|
| pacote (decisão 2) | `packages/identidade/src/tokens.ts`, `scripts/gerar-css.mjs`, `test/css.test.ts`, `test/igualdade.test.ts`; `app/styles/identidade.css` (gerado) | bloco `web` + `marca`, `colunaAuth`, `vaoAuth`, `campoAuth`, `botaoAuth`, `botaoAviso`, `entrelinhaAviso` e **`limiarAviso`** (div. 657) → `--faixa-*` nas três faixas; só ADIÇÃO |
| Tailwind (decisão 1) | `tailwind.config.ts` | chaves com NOME de token → `var(--…)`: `cor-*`, `espaco-*`, `toque-*`, `barra-*`, `web-*`, `tam-*`, `fam-*`, `peso-*`, `entrelinha-*`, `raio-*`, `hairline`, `aviso-respiro` (derivado: `(touch.min − 20) / 2`), `natural` (div. 663); `screens` `c:`/`b:` dos `limiares` |
| G-tok (decisão 3) | `scripts/gates-web/g-tok.mjs`, `g-tok-arquivos.txt`; `gates-web-decl.sh` | tamanho, raio, borda, entrelinha, tracking, valor arbitrário, `import @/components/ui/*`; a lista cresce **+16** (os 9 do commit 1 + 7 arquivos novos, div. 670); a chave `gtok:` no extrator (div. 664) |
| layout e fontes (decisão 4) | `app/layout.tsx` (2 imports), `app/styles/fontes.css`, `public/fontes/*.ttf` (6), `package.json`, `pnpm-lock.yaml` | a identidade e as três famílias para o web todo; o CN de inércia (§11.4) |
| marca | `public/marcas/octavia-dark.png` | cópia de `apps/native/assets/logo-octavia-dark.png` — sha256 `e9b9bd6b…fe4a29` nos dois, o mesmo da `.marca` da folha (§3) |
| contexto (decisão 5) | `contexts/firebase-auth-context.tsx` | o erro leva `codigo` (`auth/*` do SDK; `octavia/nao-configurado`, `octavia/sem-usuario`, `octavia/perfil`; `desconhecido`) ao lado da `message` de sempre — aditivo |
| telas | `app/{login,signup,signup/confirm-email,verify-email,forgot-password}/page.tsx`; `components/auth/{login-panel,signup-panel,linha-de-aviso}.tsx`; novos: `casca-auth.tsx`, `controles-auth.tsx`, `seletor-de-instrumento.tsx`, `use-login.ts`, `use-signup.ts`, `frases-auth.ts`, `components/identidade/icone.tsx` | a folha `1-auth` estado a estado; a `LinhaDeAviso` (o MESMO arquivo da PR-1) restilizada e com tipo (falha · sem conexão · limite · sucesso); nenhum `@/components/ui/*`, nenhum toast, nenhum literal |
| instrumento (decisão 7, 8) | `scripts/gates-web/g-faixa-{auth,esperado,medir,coleta,classificar,veredito,sessao,superficies}.*`, `tests/gates-web/esperado/1-auth.ancoras.json`, `tests/gates-web/g-faixa-classificar.test.ts`, `COMO-RODAR.md` | par por texto sem papel + âncoras `data-testid` + nós sem par listados; os 46 estados + I1-E1 com o mecanismo (ii); um contexto por estado; "não alcançado"/"inalcançável" contados à parte |
| docs (decisão 2) | `docs/ux/DESIGN-I1/README.md` §4, `SHA256SUMS` | os nomes das medidas; só a linha do `README.md` muda no `SHA256SUMS` (`shasum -c` → 14/14 OK) |

O fluxo não mudou (I1-D9): as mesmas requests, na mesma ordem, com as mesmas condições — o `handleRedirect` do login,
o `signUp`, o reenviar, o `reload`, o `sendPasswordResetEmail` passaram linha a linha (`use-login.ts`, `use-signup.ts`,
as páginas). O que muda é a FORMA: a frase pelo código, onde ela aparece, e o *Tentar de novo* que a folha desenha
(div. 658). Os `id` `#email`/`#password` ficam.

### 11.2 A igualdade — o diff (decisão 2: "cole o diff")

A `linha-de-base.json` **não tem** o bloco `web` (é o snapshot do nativo em `d18b7c4`); o `web` é cobrado pelos objetos
escritos no próprio `igualdade.test.ts` — é lá que a adição entra; a `linha-de-base.json` fica intacta (div. 656):

```diff
-    const C = { conteiner: 1138, margem: 32, colunaLateral: 320, razaoListaDetalhe: [2, 3], zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false }
-    const B = { conteiner: null, margem: 24, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha', zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true }
+    // I1-PR-6 (decisão 2): as medidas fixas das folhas 0 e 1 — ADIÇÃO; as oito de antes não mudam
+    const auth = { marca: { largura: 340, altura: 219 }, colunaAuth: 420, campoAuth: 60, botaoAuth: 58, botaoAviso: 36, entrelinhaAviso: 20, limiarAviso: 320 }
+    const C = { conteiner: 1138, margem: 32, colunaLateral: 320, razaoListaDetalhe: [2, 3], zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: false, ...auth, vaoAuth: 140 }
+    const B = { conteiner: null, margem: 24, colunaLateral: 'empilha', razaoListaDetalhe: 'empilha', zonaArquivo: 240, linhaLista: 80, linhaMusica: 72, empilha: true, ...auth, vaoAuth: 48 }
```

### 11.3 As frases — a lista declarada (I1-D10/D17)

`components/auth/frases-auth.ts`; a frase se escolhe pelo código (`fraseDoErroDeEntrar`, `…DoGoogle`, `…DeCriar`,
`…DeReenviar`). `login.razao.sem-token` não entra (div. 654). Instrumentos: os VALORES do `<select>` seguem os de hoje
(`guitar`…`other`), só os rótulos são os da §5.2.

| chave | texto | origem |
|---|---|---|
| `motivo.generico` | algo deu errado — tente de novo | §5.1 |
| `motivo.limite` | muitas tentativas — tente de novo em instantes | §5.1 |
| `acao.tentar` | Tentar de novo | `frases-sessao.ts` (PR-1), §5.1 |
| `estado.carregando` | carregando… | §5.1 |
| `login.credencial` | e-mail ou senha não conferem | §5.2 |
| `login.sem-conta-email` | nenhuma conta com este e-mail | §5.2 |
| `login.senha-incorreta` | senha incorreta | §5.2 |
| `login.google-cancelado` | o login com Google foi cancelado | §5.2 |
| `login.google-bloqueado` | o navegador bloqueou a janela do Google — libere pop-ups e tente de novo | §5.2 |
| `login.rotulo` | Entrar | §5.2 |
| `login.entrar` | Entrar | §5.2 |
| `login.entrando` | Entrando… | §5.2 |
| `login.email` | E-mail | §5.2 |
| `login.email.placeholder` | voce@exemplo.com | §5.2 |
| `login.senha` | Senha | §5.2 |
| `login.esqueci` | Esqueci a senha | §5.2 |
| `login.ou` | ou | §5.2 |
| `login.google` | Entrar com Google | §5.2 |
| `login.google.carregando` | Carregando… | §5.2 |
| `login.sem-conta` | Não tem conta? | §5.2 |
| `login.criar-conta` | Criar conta | §5.2 |
| `login.abrindo` | abrindo o painel… | §5.2 |
| `login.nao-abriu` | Não abriu? | §5.2 |
| `login.abrir-painel` | Abrir o painel | §5.2 |
| `login.nao-configurado` | o login não está disponível neste servidor | §5.2 |
| `signup.rotulo` | Criar conta | §5.2 |
| `signup.criar` | Criar conta | §5.2 |
| `signup.nome` | Nome | §5.2 |
| `signup.sobrenome` | Sobrenome | §5.2 |
| `signup.instrumento` | Instrumento principal | §5.2 |
| `signup.senha.dica` | no mínimo 6 caracteres | §5.2 |
| `signup.confirmar` | Confirmar a senha | §5.2 |
| `signup.criando` | Criando a conta… | §5.2 |
| `signup.ja-tem` | Já tem conta? | §5.2 |
| `signup.voltar` | Voltar para o login | §5.2 |
| `signup.senhas` | as senhas não conferem | §5.2 |
| `signup.email-usado` | já existe uma conta com este e-mail — entre ou use outro | §5.2 |
| `signup.senha-fraca` | senha fraca — use pelo menos 6 caracteres | §5.2 |
| `signup.rede` | sem conexão — a conta não foi criada | §5.2 |
| `signup.limite` | muitas tentativas — tente de novo em instantes | §5.2 |
| `signup.perfil` | falha no servidor — o perfil não foi criado | §5.2 |
| `confirm.rotulo` | Confirme o e-mail | §5.2 |
| `confirm.apoio` | enviamos um link de confirmação para {email} — abra o link para ativar a conta | §5.2 |
| `confirm.ir-login` | Ir para o login | §5.2 |
| `confirm.nao-recebeu` | Não recebeu o e-mail? | §5.2 |
| `confirm.reenviar` | Reenviar o e-mail | §5.2 |
| `confirm.enviando` | Enviando… | §5.2 |
| `confirm.enviado` | e-mail de confirmação enviado — veja a caixa de entrada | §5.2 |
| `confirm.rede` | sem conexão — o e-mail não foi enviado | §5.2 |
| `confirm.sessao-caiu` | a sessão caiu — entre de novo | §5.2 |
| `verify.apoio` | confirme o e-mail {email} para usar o Octavia | §5.2 |
| `verify.ja-confirmei` | Já confirmei | §5.2 |
| `verify.conferindo` | Conferindo… | §5.2 |
| `verify.sair` | Sair | §5.2 |
| `verify.ajuda` | problemas? veja o spam ou fale com o suporte | §5.2 |
| `verify.nao-confirmado` | o e-mail ainda não foi confirmado — abra o link que enviamos | §5.2 |
| `verify.checar-falhou` | não foi possível conferir a confirmação | §5.2 |
| `forgot.rotulo` | Trocar a senha | §5.2 |
| `forgot.apoio` | digite o e-mail e enviamos um link para trocar a senha | §5.2 |
| `forgot.enviar` | Enviar o link | §5.10 N1 |
| `forgot.lembrou` | Lembrou a senha? | §5.2 |
| `forgot.entrar` | Entrar | §5.2 |
| `forgot.enviando` | Enviando… | §5.2 |
| `forgot.indisponivel` | a troca de senha não está disponível | §5.2 |
| `forgot.erro` | não foi possível enviar o e-mail — algo deu errado | §5.2 |
| `forgot.veja` | Veja o e-mail | §5.2 |
| `forgot.enviado` | enviamos as instruções para {email} — não chegou? veja o spam ou tente de novo | §5.2 |
| `forgot.voltar` | Voltar para o login | §5.2 |
| `marca.octavia` | Octavia | nome acessível da folha (§2.4: "Octavia", "Google") |
| `marca.google` | Google | nome acessível da folha (§2.4: "Octavia", "Google") |

As sete da sessão (I1-PR-1), intactas em `frases-sessao.ts` e importadas daqui:

| chave | texto |
|---|---|
| `rede` | sem conexão — a sessão não foi aberta |
| `recusado` | o servidor não aceitou o login — entre de novo |
| `limite-com-prazo` | muitas tentativas de entrar — tente de novo em {N} |
| `limite-sem-prazo` | muitas tentativas de entrar — tente de novo em instantes |
| `servidor` | falha no servidor — a sessão não foi aberta |
| `renovacao` | a sessão não foi renovada: {razão} |
| `tentar-de-novo` | Tentar de novo |

### 11.4 Os gates — verdes `[medido]`

| gate / suíte | resultado | arquivo |
|---|---|---|
| G-tok (lista de auth, 16 arquivos) | **PASSA**: `literais 0 · toasts 0 · imports de ui 0`; (i) 19/19 | `cn/g-tok-depois.txt` |
| G-tok crescido sobre os 9 da `main` | **REPROVA 613** (238 cor · 136 espaçamento · 93 tamanho · 44 inglês · 35 fonte · 32 raio · 18 import de ui · 15 borda · 1 entrelinha · 1 arbitrário); o gate do commit 1 dava 453 | `cn/g-tok-main-crescido.txt` |
| CN das classes novas | **REPROVA 24** no lado que reprova; 0 no lado dos nomes de token | `cn/g-tok-classes-cn.txt` |
| G-back | **PASSA** sem nenhuma linha `gback:` — `app/layout.tsx`, `contexts/`, `package.json`, `tailwind.config.ts` não são núcleo (`g-back-nucleo.txt`) | `cn/g-back-depois.txt` |
| G-palco | PASSA — 0 | — |
| `vitest --project identidade` | 38/38 (igualdade, css, fontes) | — |
| `vitest --project native --project native-tela` | **211/211** | — |
| `pnpm test` | `Tests 1071 passed \| 77 skipped (1148)`, 108 arquivos — o CN da PR-1 **15/15** | — |
| `tests/gates-web` (classificador) | 13/13 (os 2 casos novos da decisão 7) | — |
| `tsc` (raiz, `packages/identidade`, `apps/native`) · `pnpm lint` · `gate:icones` | 0 · limpo · 0 acusações | — |
| `pnpm build` | `✓ Compiled successfully`; `/login` 5.37 kB · `/signup` 4.83 kB · `/signup/confirm-email` 4.03 kB · `/verify-email` 4.27 kB · `/forgot-password` 4.1 kB | — |
| CN de inércia do layout | a `/` em 1138, antes × depois: **50 nós, iguais**; controle positivo: o CSS servido tem `--faixa-vao-auth` e `width > 960px`; `/fontes/Manrope_400Regular.ttf` → `200 font/ttf` | `cn/inercia.txt`, `cn/inercia/` |

### 11.5 O ensaio do instrumento — executor, SEM `.env`

O executor não tem Firebase (não abre `.env*`): sem ele o SDK não inicia e o usuário falso não entra. O ensaio prova o
instrumento e mede o que só existe sem Firebase. Resultado em `cn/g-faixa-ensaio-sem-firebase.txt`. O que ele achou e
já foi consertado no commit: a casca centralizava na vertical (Δy ≈ 63 em todo nó: `items-start`); o `leading-normal`
do Tailwind é 1.5, não `normal` (div. 663); a coleta lia o rótulo em caixa alta (div. 662); o `label` do instrumento
fora da linha do cabeçalho (+282,5 de largura); o rodapé do confirm/verify só no estado base (div. 669); e o medidor
travava num `route` segurado (div. 661).

### 11.6 Os estados para o aceite

O medidor tem os 46 estados da folha e o da I1-E1. Declarados **inalcançáveis** (não medidos, com a razão no JSON):
`AUTH-login-sem-token`, `AUTH-signup-excecao`, `AUTH-confirm-excecao`, `AUTH-verify-reenviar-excecao` (div. 640). Só
**sem** Firebase: `AUTH-login-nao-configurado`, `AUTH-forgot-indisponivel` — com o `.env` do Marcel saem NÃO
ALCANÇADOS, e o ensaio do executor os mede (§11.5). Os demais, pelo mecanismo (ii) `[hipótese até o "rodei"]`.

### 11.7 Bloco ```gates-web``` e extras

Ver o corpo da PR (copiado no commit 3). Extras declarados: `package.json` e `pnpm-lock.yaml` (`@octavia/identidade`),
`public/fontes/*.ttf` (sha256 = `apps/native/assets/fonts/`), `public/marcas/octavia-dark.png`,
`docs/ux/DESIGN-I1/README.md` §4 + `SHA256SUMS`, `scripts/gates-web/gates-web-decl.sh` (`gtok:`), o token
`web.limiarAviso`.

### 11.8 Divergências — 656 a 671

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **656** | P | decisão 2: *"`linha-de-base.json` da igualdade atualizada (a mudança é adição)"* | a `linha-de-base.json` é o snapshot do nativo (`d18b7c4`) e não tem `web`; o `web` é cobrado no `igualdade.test.ts` | a adição entrou no teste (§11.2); o JSON fica intacto |
| **657** | P | decisão 2: sete nomes | a `LinhaDeAviso` quebra com base 320 "igual em B" (§2.4), e em B `colunaLateral` é `empilha` (sem propriedade, div. 605) | 8º nome, `web.limiarAviso` = 320 nas duas faixas; extra declarado |
| **658** | D | a folha desenha *Tentar de novo* em falhas que hoje não têm botão (signup rede/perfil/genérico, confirm rede/genérico, verify checar/reenviar, forgot erro, login perfil 5xx, rede do *Entrar*) e o tira do 429/401 da sessão (README-design §3, "quando repetir não resolve") | cada *Tentar de novo* chama o MESMO handler que o botão da tela (formulário reenviado, `handleRedirect`, reenviar, `reload`) — uma request por clique, por ação do usuário; o do 429/401 da sessão sai (o CN da PR-1 cobra o do 500 e segue 15/15) | composição, não fluxo — **declarado para o Marcel** |
| **659** | A | div. 638 | o 429 do perfil vai para a frase do limite; o sem-token e o 404/5xx para "falha no servidor"; o 401 duplo para "o servidor não aceitou" | como a resposta 4 da rodada 2 |
| **660** | A | — | o `/verify-email` recarregado SEMPRE empurra para `/login` no 1º render (o `user` do provider nasce nulo e a página não espera o `isInitialized`) — defeito de antes | não mexido (I1-D9); o aceite segura a navegação RSC para medir; **herança: destino D** |
| **661** | T | — | um `route` segurado (nunca respondido) travava o `ctx.close()` seguinte; o poll do IndexedDB podia pendurar | `soltar` aborta os segurados antes de fechar, teto de 15 s no `close`, teto de 2 s por verificação; um contexto por estado (o usuário falso não vaza) |
| **662** | T | — | a `coletar` usa `innerText`, que aplica `text-transform`: o rótulo "Entrar" em caixa alta virava "ENTRAR" no app e seguia "Entrar" na folha | com transformação, o texto do DOM; o esperado da folha saiu **byte a byte igual** (sha) |
| **663** | T | — | o `leading-normal` do Tailwind é `line-height: 1.5`; a folha não declara entrelinha no corpo (fica a `normal` da fonte) — Δh de 2 a 4,5 px acumulando na vertical | chave `leading-natural` = `normal`; o G-tok segue reprovando `leading-normal` (é literal) |
| **664** | P | prompt: *"`gtok: scripts/gates-web/g-tok-arquivos.txt — …`"* no ```gates-web``` | o extrator recusava: `chave desconhecida: gtok` | `gtok:` vira chave de registro (como `grotas:`/`gpalco:`); o `g-back.sh` só lê `gback:` |
| **665** | P | *"saída `tests/gates-web/medicoes/1-auth.json`"* | o medidor grava um JSON por superfície (como a PR-5) | cinco: `medicoes/{login,signup,confirm-email,verify-email,forgot-password}.json` |
| **666** | A | — | o veredito da PR-5 REPROVA estado `pulado`; os estados que o mecanismo não alcança (ou que só existem sem Firebase) derrubariam o CI | "não alcançado" e "inalcançável" são LISTADOS e contados à parte, com a razão; `pulado` (rota que não resolveu) segue reprovando |
| **667** | D | `AUTH-*-validacao` | a folha desenha o balão do navegador como `div` ("[balão nativo do navegador — texto do sistema]"); no app é interface do sistema, fora do DOM | errata candidata (Δy −41 abaixo do campo) — **decisão do Marcel** |
| **668** | D | `AUTH-verify-carregando` | a moldura C tem o grupo de botões VAZIO, que soma um vão de 32 à coluna (Δy 16 em C) | errata candidata — **decisão do Marcel** |
| **669** | A | — | sem usuário, a folha do confirm mostra o apoio com o e-mail; o app não tem e-mail a mostrar | sem usuário, sem a frase de apoio (nenhuma frase nova); o rodapé "Não recebeu…"/"problemas?…" só no estado base, como a folha |
| **670** | P | *"`gtok: … — +9 arquivos de auth`"* | a lista cresce 16: os 9 + `frases-auth`, `casca-auth`, `controles-auth`, `seletor-de-instrumento`, `use-login`, `use-signup`, `components/identidade/icone.tsx` | declarado `+16` |
| **671** | T | a folha usa `role=status` na `LinhaDeAviso` | o CN da PR-1 conta `[role="alert"]` e lê o motivo no 1º `<span>` | falha/rede/limite ficam `alert`; o sucesso vira `status`; o par com a folha é por texto sem papel (decisão 7) |

### 11.9 Contabilidade (commit 2)

| quem | item | valor |
|---|---|---|
| executor | requests a `https://octavia.rocks`, logins, `.env*`, escritas | **0 · 0 · 0 · 0** |
| executor | `next dev` local **sem** `.env` (porta 3106) | inércia do layout, capturas, o ensaio do instrumento; nenhuma resposta fabricada precisou sair (o SDK não inicia sem `.env`) |
| executor | contas criadas | **0** |


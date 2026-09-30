# I1-PR-2 — login com Google no web: consertar, não revogar (I1-D6)

Bloco **I1 — identidade**. Branch `i1/pr2-google`, árvore `../octavia-i1-pr2`, sobre `origin/main`
**`1cb897f`** (a #349 mergeada: `git cat-file -e origin/main:docs/ux/I1-PR14-anexos/README.md` → 0). PR
[#351](https://github.com/marcelviana/octavia/pull/351).

**A origem (div. 920, P)**: a PR-2 estava decidida desde o pre-check (I1-D6: *"consertar, não revogar"*) e nunca foi
aberta — o revisor pulou da PR-1 para a PR-3. Ela fecha a **H-I1-3**: o *Entrar com Google* morria no navegador, pela
CSP e pelo COOP, antes de qualquer coisa do client OAuth. **O console do Google não mudou.**

Convenções: `[medido]` = saída colada em `cn/`; divergências **933–942**. Zero prod, zero login do executor, zero
`.env*` aberto (o `.env.local` do Marcel copiado sem abrir; o `next dev` o carrega).

| commit | o quê |
|---|---|
| `1fbdc12` | **o gate**: CN `tests/gates-web/google-csp.cn.ts` reprovando na `main` + a medição diretiva a diretiva (`medir-diretivas.ts`, `cn/`) |
| `c134f7d` | **o conserto**: as três diretivas em `lib/security-headers.ts`, o teste da CSP, o CN no critério do aval, a marca do Google |
| `cdaee40` | a marca do Google: o asset novo do Marcel, fundo transparente (div. 942) |
| este | docs |

---

## 1. O instrumento

- **Sem interceptar o Google**: o SDK carrega de verdade; Chrome do sistema, headless, 1138 × 800, perfil temporário,
  sem sessão. O único request respondido no navegador é o `DELETE /api/auth/session` do `/login` deslogado; qualquer
  outra escrita a `/api/*` = parada (nenhuma houve). A sonda **para na página de login do Google**: nada se digita,
  nada se clica nela.
- **Contra o `pnpm dev`, com a CSP aplicada** (div. 933): o `next start` não serve em http local (div. 570 — medido de
  novo: `/login` → `200`, 0 B), e no dev a CSP é `Report-Only`. O CN troca `Content-Security-Policy-Report-Only` por
  `Content-Security-Policy` **com o mesmo valor** — nenhuma diretiva acrescentada.
- **Uma diretiva por vez** (`medir-diretivas.ts`): a mesma sonda, reescrevendo só o cabeçalho do documento `/login`
  local no navegador; nenhum arquivo do app mudou para medir.
- O host do `authDomain` não vai para arquivo: o `gravar` do CN o troca por `<authDomain>` (0 ocorrências em `cn/`).

## 2. A tabela diretiva × medição `[medido]`

| variante | cabeçalho | violações de CSP | chegou ao Google | `popup.closed` no opener | `window.opener` no popup | frase na tela | `cn/` |
|---|---|---|---|---|---|---|---|
| `main` | como está | 1 — `script-src-elem` `https://apis.google.com/js/api.js` | não (nenhum popup) | — | — | *"algo deu errado — tente de novo"* (`auth/internal-error`) | `main/` |
| (a) | + `script-src https://apis.google.com` | 1 — `frame-src` `https://<authDomain>` | sim | `true` | `false` | *"o login com Google foi cancelado"* (`auth/popup-closed-by-user`) | `a-script-src/` |
| (b) | (a) + `frame-src https://<authDomain>` | **0** | sim | `true` | `false` | *"o login com Google foi cancelado"* | `b-frame-src/` |
| (c) | (b) + COOP `same-origin-allow-popups` | 0 | sim | **`false`** | **`true`** | — | `c-coop/` |
| controle | (b) + COOP `unsafe-none` | 0 | sim | `false` | `true` | — | `c-controle-unsafe-none/` |

| diretiva | antes | depois (valor mínimo medido) | por quê |
|---|---|---|---|
| `script-src` (prod **e** dev) | sem `apis.google.com` (`*.googleapis.com` não o cobre) | `+ https://apis.google.com` | `main` → (a): o `gapi` do `signInWithPopup` carrega e o popup abre |
| `frame-src` | `'none'` | `https://${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`; `'none'` sem a variável (div. 941) | (a) → (b): o iframe oculto do Firebase (`/__/auth/iframe`) na origem exata basta |
| COOP (os dois campos de prod, div. 935; o dev herda) | `same-origin` | `same-origin-allow-popups` | (b) → (c): o `same-origin` corta a referência do popup (o SDK o dá por fechado); o controle `unsafe-none` passa igual, mas é mais frouxo que o necessário |
| `connect-src` | — | nada | 0 violações em (a)–(c) (`www.googleapis.com` já coberto) |

O build de produção embute a origem: `.next/server/middleware.js` traz 1 origem literal `https://<x>.firebaseapp.com`.

## 3. O CN — antes e depois `[medido]`

```
main (cn/cn-main-saida.txt):
google-csp: REPROVA
  - 1 violação(ões) de CSP — a 1ª: login: CSP-VIOLATION directive=script-src-elem blocked=https://apis.google.com/js/api.js disposition=enforce
  - o popup não chegou a accounts.google.com
  - o opener não mantém o popup (closed=null)
  - frase de falha na tela: ["algo deu errado — tente de novo"]
# exit: 1

depois (cn/cn-depois-saida.txt, cn/depois/):
google-csp: PASSA — 0 violações, popup no Google, opener com o popup, nenhuma frase de falha
# exit: 0
```

O critério do depois (aval (iv)): 0 violações de CSP; nenhum aviso de COOP no console, **exceto por texto** o
`AVISO_COOP_DO_GOOGLE` (div. 936); o popup em `accounts.google.com`; `popup.closed === false`; nenhuma frase de falha.

## 4. O teste da CSP (`lib/__tests__/security-headers-csp.test.ts`, div. 564) — os pares do aval (v)

| antes | depois |
|---|---|
| `frame-src` é exatamente `['none']` | exatamente `[https://${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}]`; sem a variável, `['none']` (o módulo recarregado com `vi.stubEnv`) |
| sem `blob:`, `'self'`, `data:`, origem `http*` | sem `blob:`, `'self'`, `data:`, curinga, nem origem além do authDomain |
| `object-src 'none'` e `DENY` | igual |
| o dev herda o `frame-src` | igual (o valor novo) |
| — | `script-src` de prod e de dev: `https://apis.google.com` uma vez, sem `https://*.google.com` |
| — | COOP `same-origin-allow-popups` nos dois campos de prod; o dev herda; nunca `unsafe-none` |

6 testes, verdes. A **div. 564** (*"a PR-2 reabre"*) está **fechada**.

## 5. Verdes (commit `c134f7d`; o `cdaee40` re-mediu o que toca)

| gate | saída |
|---|---|
| G-back (três `gback:`) | `✓ lib/security-headers.ts (modificado) — declarado` · órfãs: nenhuma · **PASSA** |
| G-palco | **PASSA — 0 ocorrências** |
| G-tok | `literais de identidade acusados: 0` · **PASSA**; cobertura `129 · FORA: 0` · **PASSA** (de novo no `cdaee40`) |
| `pnpm test` | `Test Files 118 passed \| 3 skipped (121)` · `Tests 1181 passed \| 58 skipped (1239)`; CN da PR-1 **15/15**; o da CSP 6/6 |
| `tsc` · lint · `pnpm build` | exit 0 · `✔ No ESLint warnings or errors` · `✓ Compiled successfully`, 22/22 (lint e tsc de novo no `cdaee40`) |
| G-faixa por estado (I1-D37, `G_FAIXA_ESTADOS`) | `AUTH-login`, `AUTH-login-google`, `AUTH-login-google-erro` × 411 · 711 · 1138: **(e) 0 · (b) 0** em todos, nos dois commits; o botão *Entrar com Google* na mesma caixa (1138: 599,427 420×58; 711: 145.5,694 420×58; 411: 24,694 363×58); veredito **G-faixa: PASSA** |

## 6. PWA/standalone

O caso não existe: o PWA saiu na I1-D18 (div. 501); não há popup de janela instalada para medir.

## 7. O aceite real

`[Marcel, 2026-09-30]`: *Entrar com Google* com a conta dele, no `pnpm dev` da árvore — **entrou**.

## 8. Hipóteses e divergências fechadas

- **H-I1-3 — FECHADA**: as três causas lidas no pre-check eram as três, nessa ordem (`script-src` → `frame-src` → COOP);
  o probe 2 só alcançara a primeira.
- **Div. 564 — FECHADA** (§4).

## 9. Divergências 933–942

| div. | origem | o que o prompt/o documento dizia | o que se mediu | destino |
|---|---|---|---|---|
| **933** | P | o CN contra `localhost:3000` | `next start` não serve em http local (div. 570); no dev a CSP é report-only | o CN aplica a CSP do dev (mesmo valor) — **aceita** `[Marcel, 2026-09-30]` |
| **934** | P | a tela mostra `login.google-bloqueado`/a razão real | na `main`, `auth/internal-error` → `motivo.generico`; com só o `script-src`, *"cancelado"* sem o usuário cancelar | registrado — **aceita**; o erro fora do mapa segue genérico (div. 515) |
| **935** | A | — | o COOP de prod estava em dois campos (`openerPolicy` e `additionalHeaders`), o segundo sobrescrevendo | os dois mudam |
| **936** | X | — | *"Cross-Origin-Opener-Policy policy would block the window.closed call."* ×2: vem do `cross-origin-opener-policy-report-only: same-origin` do `accounts.google.com` (o controle `unsafe-none` dá o mesmo) | excluído por texto no CN (aval (iv)) |
| **937** | X | — | `GET <authDomain>/__/firebase/init.json` → 404, 1 por rodada, no popup; o handler segue | registrado (lado Firebase) |
| **938** | X | — | cada rodada que chega ao Google faz 1 `POST www.googleapis.com/identitytoolkit/v3/relyingparty/createAuthUri` (o handler do Firebase; como a div. 672) | contabilidade (§10) |
| **939** | P | — | extras do commit 1: `medir-diretivas.ts` e as saídas brutas em `cn/` já no commit 1; o CN com a CSP aplicada | **aceitos** (aval (i)) |
| **940** | A | — | o dev sobrescreve o `script-src` inteiro: sem `apis.google.com` nele, o CN (no dev) seguiria reprovando | `apis.google.com` também no dev (aval (iii)) |
| **941** | A | — | o `frame-src` vem da variável pelo nome; sem ela, `'none'` | aval (ii) |
| **942** | A | a marca: o asset do Marcel no botão | o 1º asset era o *tile* de 40 × 40 com fundo branco; no aceite, *"o logo do google está escroto"*. O Marcel trocou o arquivo (círculo `#131314`, contorno `#8E918F`) e pediu fundo transparente | os dois paths de fundo saem (`cdaee40`); o `viewBox="10 10 20 20"` mostra só o "G"; sha256 `81ce47e3…683e00` |

## 10. Contabilidade

| item | conta |
|---|---|
| requests a prod (`octavia.rocks`) | **0** |
| logins do executor · senha digitada · clique/digitação na página do Google | **0 · 0 · 0** |
| `.env*` aberto pelo executor | **0** |
| escritas ao app | **0** — o `DELETE /api/auth/session` do `/login` deslogado respondido no navegador (CN) ou no dev local, que só limpa cookie (G-faixa) |
| `createAuthUri` no `identitytoolkit` (div. 938) | 9 — (a), (b), (c) e controle ×2 (a 1ª rodada e a refeita com o instrumento final) + 1 do depois |
| `GET https://accounts.google.com/v3/signin/identifier` por `curl` (o cabeçalho de COOP, div. 936) | 1 |
| console do Google | **não mudou** |
| login real | **1**, do Marcel (§7) |

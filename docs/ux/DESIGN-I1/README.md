# DESIGN-I1 — a folha do web, congelada

> **Bloco I1 · PR de congelamento** (só docs). Data: **2026-09-27**. Base: `origin/main` = `efde410`
> (`efde410b65461fcd1b60ffb337c237905c12a90c`, merge da #337; a #336 já estava). **Folha congelada na rodada 2.**
> **Regra de leitura**: `[medido]` = comando e saída (a saída inteira está em [`conferencia/saida.txt`](conferencia/saida.txt));
> `[lido]` = do documento citado. Premissa do prompt é hipótese; onde ela não bateu, há divergência (§7).
> **Fontes**: o registro do designer, [`README-design.md`](README-design.md) (o `README-I1.md` da entrega, renomeado,
> intacto), as nove folhas `N-*/telas.html` (intactas: nenhum byte mudou desde a entrega — §8) e o
> [`I1-PRECHECK.md`](../I1-PRECHECK.md) (I1-D1…D36).

## 0 · O que há nesta pasta

| caminho | o que é |
| --- | --- |
| `0-linha-de-aviso/telas.html` | o componente `LinhaDeAviso`, 8 estados |
| `1-auth/telas.html` | /login · /signup · /signup/confirm-email · /verify-email · /forgot-password, 46 estados |
| `2-landing/telas.html` | /, 1 estado |
| `3-privacy-policy/telas.html` | /privacy-policy, 1 estado |
| `4-content-lista/telas.html` | /dashboard · /library (+ `SESSAO-nao-renovada`), 15 estados |
| `5-content-visualizacao/telas.html` | /content/[id], 15 estados |
| `6-content-editor/telas.html` | /content/[id]/edit, 15 estados |
| `7-upload/telas.html` | /add-content, 20 estados |
| `8-setlists/telas.html` | /setlists, 20 estados |
| `README-design.md` | o registro da rodada 2 (tokens, frases, ícones, respostas) — fonte das §2, §4 e §6 |
| `conferencia/conferir.mjs` | a conferência da §6 — o mesmo script que a PR-5 reusa como G-tok |
| `conferencia/matriz-x-estados.tsv` | o cruzamento matriz × seções (leitura, cobrada pelo script) |
| `conferencia/saida.txt` | a saída do script, `[medido]` |
| `SHA256SUMS` | o hash de tudo acima |

A pasta foi montada pelo título: cada `telas.html` tem `<title>Octavia web · I1 · <superfície> · congelado</title>`,
e o destino é o caminho que o `README-design.md` §2.4 declara. Nove títulos, nove pastas, nenhuma sobra `[medido]`:

```
entrada/telas (1).html -> 8-setlists/telas.html
entrada/telas (2).html -> 7-upload/telas.html
entrada/telas (3).html -> 6-content-editor/telas.html
entrada/telas (4).html -> 5-content-visualizacao/telas.html
entrada/telas (5).html -> 4-content-lista/telas.html
entrada/telas (6).html -> 3-privacy-policy/telas.html
entrada/telas (7).html -> 2-landing/telas.html
entrada/telas (8).html -> 1-auth/telas.html
entrada/telas.html -> 0-linha-de-aviso/telas.html
```

**A faixa A não é desenhada**: segue B por referência (`README-design.md` §1). Os requisitos da §4 são de C e B.

## 1 · Decisões `[Marcel, 2026-09-27]`

As 32 respostas às perguntas da rodada 1, aplicadas na rodada 2, e as 9 dos tokens que faltaram — transcritas do
`README-design.md` §8, com a folha onde cada uma se aplica. Números da coluna `#` são os do §8.

### 1.1 Respostas 1–32

| # | folha(s) | decisão |
| --- | --- | --- |
| 1 | todas | Sem mudança no desenho: 1138 já era o contêiner; a tabela de tokens passa a dizer `web.conteiner`. |
| 2 | todas | Sem mudança: as folhas já eram escuras, com uma paleta só. |
| 3 | 4–8 | Sem mudança: a barra superior já estava desenhada; o botão de recolher a lateral não existe. |
| 4 | 1, 4 | `AUTH-login-sem-token` passa a "falha no servidor — a sessão não foi aberta"; novo `AUTH-login-limite-prazo` ({N}); `AUTH-login-limite` com "…em instantes"; notas de `-rede`, `-perfil-401` (401/403) e `-servidor` (5xx e o resto). "a sessão não foi renovada: {razão}" sai do /login e vira `SESSAO-nao-renovada` na folha 4. |
| 5 | 1 | Credencial sob o campo, sem mudança (`AUTH-login-credencial`). Os erros do Google saem da LinhaDeAviso e ficam sob o botão do Google (`AUTH-login-google-erro`). |
| 6 | 1 · 4, 6, 7, 8 | Folha 1: `AUTH-forgot-erro` com `motivo.generico`; novos `AUTH-confirm-erro-rede` e `AUTH-verify-reenviar-limite`; `AUTH-confirm-erro` e `AUTH-verify-reenviar-erro` restritos a 429 e rede. Folhas 4, 6, 7, 8: motivos por espécie nas notas, sem mudança de estado. |
| 7 | 4 · 1, 7 | Folha 4: saem `LIB-apagado` e `LIB-favoritado` e as frases `lib.apagado`, `lib.favoritado`, `lib.desfavoritado`; novo `LIB-salvo` ("alterações salvas"). Folhas 1 e 7: ficam os sucessos de e-mail enviado e lote importado. |
| 8 | 4–8 · 1 | Folhas 4–8: campo em `touch.min`. Folha 1 sem mudança (`touch.list + 4`). |
| 9 | 1 | *Entrar com Google* ganha a marca do Google (quadrado de 20, asset de terceiro) em `AUTH-login` e derivados. "Os demais controles já eram só texto: sem mudança" — **ver §1.3, a *Próxima*.** |
| 10 | 4, 5 | Sem mudança: reuso de renomear e apagar setlist no menu Mais (4) e no Editar (5). |
| 11 | 4, 5 | A *Próxima* da paginação e do visualizador de PDF (`VIEW-partitura`) usa o voltar (variante espelhada), registrado no §6 do README-design. |
| 12 | 3 | Sem mudança: já usava `folha.largura`. |
| 13 | 5, 6 · 8 | Coluna de detalhes = `web.colunaLateral` (5, 6); `web.razaoListaDetalhe` (8). |
| 14 | 1 · 6 · 7 | `AUTH-verify-branco` vira `AUTH-verify-carregando`; `EDIT-sem-usuario` com "carregando…"; o "sem usuário" do upload é o `UP-carregando` (nota). |
| 15 | 7 | A zona de arquivo vira `web.zonaArquivo` (`UP-arquivo` e estados de zona). |
| 16 | 2 | Sem mudança: *Entrar* já era o principal. |
| 17 | 4 | `DASH-erro` passa a uma linha por tela (nota). |
| 18 | 5 | `VIEW-erro-pdf` só com a linha e *Tentar de novo*; Download e Refresh Page saem da nota e da lista de frases. |
| 19 | 5, 6 | Sem mudança: o corpo rola dentro do painel. |
| 20 | 5 | *Favoritar* sai do cabeçalho de todos os estados; `VIEW-favorita` removido. |
| 21 | 6 | *alterações não salvas* só quando há alteração; `EDIT-sem-mudancas` sem o chip (nota). |
| 22 | 6 | Novo `EDIT-salvando` ("Salvando…"). |
| 23 | 7 | N9 sai da nota de `UP-salvar-erro`; "Failed to fetch" é `motivo.rede`. |
| 24 | 7 | Sem mudança: a cópia velha do passo 1 não é desenhada (nota de `UP-salvar-erro`). |
| 25 | 8 · 0 | `SET-apagar-erro` sem *Tentar de novo*; folha 0: `AVISO-dialogo-apagar`. |
| 26 | 8 | `SET-adicionar-erro` sem a segunda linha (N11). |
| 27 | 8 | A alça sai de todas as linhas de música e `SET-reordenar` é removido. A ordem é fixa. |
| 28 | 5 | *Apagar* sai do cabeçalho de todos os estados; não há diálogo de apagar na visualização. |
| 29 | 4, 5, 7 (tab) | Sem mudança nas folhas: a implementação usa o `d` do catálogo (§6). |
| 30 | — | Sem mudança: 404 e exceções ficam na tela padrão, sem desenho. |
| 31 | 8 | Sem mudança: título de música sem caixa alta; nome de setlist em caixa alta. |
| 32 | 5, 6 | Corpo de conteúdo em mono 22 (`zoomDefault`), em todos os estados de texto. |

### 1.2 Tokens que faltaram na rodada 1 — 1–9

| # | folha(s) | decisão |
| --- | --- | --- |
| 1 | todas | Bloco `web` aplicado (§2 abaixo; `README-design.md` §2.1). |
| 2 | 4–8 | Barra superior sem token novo: `bar.top` em C; `bar.top` + `touch.list` em B. |
| 3 | 4–8 · 1 | Campo `touch.min` (4–8); `touch.list + 4` no login e no signup (1). |
| 4 | 5, 6, 8 | `web.colunaLateral` (320) e `web.razaoListaDetalhe` (2 : 3). |
| 5 | 4–8 | Marca na barra: texto em `font.display` · `size.title` · `tracking.displayWide`. |
| 6 | 5, 6 | Corpo de conteúdo: mono 22 (`zoomDefault`), sem controle de zoom. |
| 7 | 4, 8 | `web.linhaLista` (80) e `web.linhaMusica` (72); os blocos de carregando da folha 8 passam de 112 a 80. |
| 8 | 7 | `web.zonaArquivo` (240). |
| 9 | todas | Padding da LinhaDeAviso = `(touch.min − 20) / 2`, derivado; botão de ação 36, literal N3. |

### 1.3 Mais três

- **Marca do Google** — é o **asset oficial do Google**, que entra na PR de auth; **não é ícone do catálogo** e não
  entra no mapa `dados.ts` nem no `packages/identidade`. Nas folhas, o quadrado tracejado de 20 marca o lugar.
- **`sessao.nao-renovada`** — desenhada **uma vez**, na folha 4 (`SESSAO-nao-renovada`), e vale para **toda tela
  fora do `/login`**, na mesma posição (logo abaixo do título).
- **A *Próxima* leva o voltar espelhado.** A resposta 9 ("os demais controles já eram só texto") contradizia a 11;
  **vale a 11** (div. **590**).

### 1.4 Decisões sobre as divergências da conferência (commit 2)

- **583** — para `2-landing` e `3-privacy-policy`, que não têm tabela de tokens na folha, vale o `README-design.md` §2.4.
- **584, 585, 586, 587** — viram as erratas **I1-E4, I1-E5, I1-E1, I1-E2** (§2.2).
- **588** — o **visto** (DESIGN-N2, R2·2) não está no `dados.ts` por nome: o destino é a **PR-4**, que mede pelo desenho; se faltar, entra no pacote a partir do `DESIGN-N2` (catálogo).
- **589** — **uma forma só** de `garantida`, a do catálogo (`dados.ts`); a de r 8,5 que vem do `DESIGN-N2` é a errata **I1-E3** (§2.2); a PR-4 confere se o N2 já divergia.
- **590** e **591** — como registradas (origem P).

## 2 · Erratas

### 2.1 Errata da I1-D12 `[Marcel, 2026-09-26]`

Na I1-D12, onde se lê *"capturas por estado"*, leia-se **"inventário por estado; captura uma por superfície"**.
O que se mede por estado é o inventário (`boundingBox`, o G-faixa da I1-D16); a captura (PNG) é uma por superfície.

### 2.2 Erratas da folha — I1-E1…E6 `[Marcel, 2026-09-27]`

Colunas: as do prompt do commit 2 (id · o que a folha mostra · o que vale · onde se aplica), mais a divergência e o
efeito, este na classificação do `N2-ENCERRAMENTO.md` §3 (div. **595**). Nenhum byte dos `telas.html` muda: a errata
prevalece sobre a folha.

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E1** | no `/verify-email`, o erro **genérico** ao reenviar (`app/verify-email/page.tsx:32`) não tem seção; a nota de `AUTH-verify-reenviar-limite` diz *"Exceção geral: 'algo deu errado — tente de novo'"*, que não é o que a seção mostra | existe o estado **`AUTH-verify-reenviar-excecao`**: `LinhaDeAviso` tipo falha (falha 20 em `errorInk`), texto `motivo.generico` (*"algo deu errado — tente de novo"*), ação *Tentar de novo*, na mesma posição da `AUTH-verify-reenviar-limite`. A nota da `-limite` passa a descrever o que a seção mostra: *"429: `LinhaDeAviso` tipo limite (última sincronização 20 em `offlineInk`), 'muitas tentativas — tente de novo em instantes', sem Tentar de novo"*. O id do prompt, `AUTH-verify-reenviar-erro`, já é o estado de rede (div. **593**) | `1-auth` | 586, 593 | comportamento |
| **I1-E2** | a leitura do arquivo do lote (`hooks/useAddContentLogic.ts:138`, `isParsing`) não tem seção | existe o estado **`UP-lote-lendo`**: a leitura mostra `estado.carregando` (*"carregando…"*) no lugar da lista de músicas; sem frase nova; C e B iguais aos de `UP-lote-*` | `7-upload` | 587 | comportamento |
| **I1-E3** | o ícone da `LinhaDeAviso` de sucesso é um `garantida` de r 8,5 (`M8.4 12.3l2.5 2.5 4.7-5`, do `DESIGN-N2`) | o `garantida` do catálogo (`dados.ts`: r 9 · `M8 12.2l2.8 2.8L16.2 9.4`) | `0-linha-de-aviso` (`AVISO-sucesso`) e, por ser o componente, as mesmas linhas em `1-auth`, `4-content-lista` e `7-upload` — 10 ocorrências (div. **596**) | 589 | leitura |
| **I1-E4** | o inventário de px da landing declara `2 → undefined` e `3 → undefined` | as duas entradas são inválidas (não existem no arquivo): **riscadas** | `2-landing` | 584 | leitura |
| **I1-E5** | 20 = *"entrelinha da LinhaDeAviso"*, sem origem | entrelinha 20 = **literal do N3 (T3-R7)** | `0-linha-de-aviso` e, por ser o componente, o mesmo 20 nos inventários de `1-auth`, `4`–`8` e no `README-design.md` §2.3 (div. **596**) | 585 | leitura |
| **I1-E6** | o **visto** (`M4.5 12.5l5 5 10-11`, do `DESIGN-N2`) no Salvar do editor e do upload, no *Criar* e na validação da setlist e na marca de `SET-adicionar*` — 50 ocorrências, só nas folhas `6`, `7` e `8`; em 24 px (traço 1,75, e 1,25 no inativo) e em **16 px, traço 3** (18×, `SET-adicionar`, `-adicionar-enviando`, `-adicionar-erro`) | vale o **`garantida` do catálogo** (`dados.ts` / `packages/identidade`: r 9 · `M8 12.2l2.8 2.8L16.2 9.4`), o ícone de "salvo/confirmado" do web como do nativo, **no tamanho da família**: 24 onde a folha tem 24; **20** (o menor da família) onde a folha tem 16. O inativo é o desenho inteiro em `lineInfo`, no traço da família (o `garantida` não tem estado `inerte`; é o que o nativo faz) | `6-content-editor`, `7-upload`, `8-setlists` (a I1-PR-4 mediu: 0 ocorrências nas folhas `0`, `1`, `4`, `5` — o sucesso da `LinhaDeAviso` é a I1-E3) | 588, 601, 611 (I1-PR-4) | leitura |


**Do aceite da I1-PR-6** `[Marcel, 2026-09-27 (E7, E8) e 2026-09-28 (E9, E10); avais dos commits 2 e 3 da I1-PR-6]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E7** | nos estados `-validacao` do auth, um `div` com *"[balão nativo do navegador — texto do sistema]"* sob o campo (41 px de altura), empurrando o resto da coluna | o balão de validação é do NAVEGADOR (`required`, `type=email`, `minLength`): não é elemento da página e o código não o reproduz; **a seção vale sem ele** (o DOM do estado é o da base) | `1-auth`: `AUTH-login-validacao`, `AUTH-signup-validacao`, `AUTH-forgot-validacao` | 667 (I1-PR-6) | leitura |
| **I1-E8** | em `AUTH-verify-carregando`, o grupo de botões VAZIO, que soma um vão de `space.xxl` à coluna (Δy 16 em C) | o grupo não existe: **a seção vale sem ele** | `1-auth`: `AUTH-verify-carregando` | 668 (I1-PR-6) | leitura |
| **I1-E9** | em `AUTH-login-redirecionando`, o mesmo grupo de botões VAZIO (Δy +16/−16 em C, −32 em B) | o grupo não existe: **a seção vale sem ele** | `1-auth`: `AUTH-login-redirecionando` | 675 (I1-PR-6) | leitura |
| **I1-E10** | em `AUTH-confirm-sem-usuario`, a frase de apoio com o e-mail (*"enviamos um link de confirmação para marcel@exemplo.com…"*) | sem usuário não há e-mail: **a seção vale sem a frase** | `1-auth`: `AUTH-confirm-sem-usuario` | 669 (I1-PR-6) | leitura |

As quatro (I1-E7…E10) são erratas que o **G-faixa** acha (posição contra a moldura), não o `conferir.mjs`: ficam em
`erratas.json` numa lista própria, `erratasFaixa`, que o G-tok (i) não lê (div. 681); cobrem as 46 erratas candidatas
do aceite de auth (`docs/ux/I1-PR6-anexos/cn/erratas-faixa-cobertura.txt`).

**Do aval da I1-PR-7** `[Marcel, 2026-09-28; aval do commit 1 da I1-PR-7]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E11** | a folha `2-landing` renderizou a frase (`landing.frase`, duas linhas) com `line-height:1.45` — 63,8 px de altura; a sua coluna "tokens" e o `README-design.md` §2.4 declaram `lineHeight.text` | vale **`lineHeight.text` (1,55)**, o que a tabela declara: a frase fica 4,4 px mais alta e o que vem abaixo dela (*Entrar*, *Criar conta*, o link da política) desce 4,4 px, em C e em B | `2-landing`: `LANDING` | 684 (I1-PR-7) | leitura |

A I1-E11 também é do G-faixa: entra em `erratasFaixa` e cobre as 8 erratas candidatas do aceite da landing
(`docs/ux/I1-PR7-anexos/`).

**Do aval da I1-PR-8** `[Marcel, 2026-09-28; aval do commit 1 da I1-PR-8]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E12** | a folha `3-privacy-policy` renderizou o título (`h1`) com `line-height:1.3` e os sete títulos de seção (`h2`) com `1.35`, sem token; a coluna "tokens" e o `README-design.md` §2.4 não declaram entrelinha para eles | títulos com **entrelinha natural** (`leading-natural`, o padrão do web desde a I1-PR6, como os títulos do auth): o título fica 3,4 px mais baixo e cada título de seção 3,7 px (7,4 no de duas linhas em B); o Δy acumulado dos nós seguintes é consequência desta errata | `3-privacy-policy`: `PRIVACY` | 693 (I1-PR-8) | leitura |

A I1-E12 também é do G-faixa: entra em `erratasFaixa` e cobre as 45 erratas candidatas do aceite da política
(22 em C, 23 em B; `docs/ux/I1-PR8-anexos/`). Na mesma folha, a div. **694** (I1-PR-8): *em B a folha mede 661 pelo
contorno da moldura; o bloco vale 663* (711 − 2 × 24) — Δw 2, abaixo da tolerância, sem quebra de linha diferente.

**Do aval da I1-PR-9** `[Marcel, 2026-09-28; aval do commit 1 da I1-PR-9]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E14** | em `LIB-filtros`, o menu *Filtros* ancorado à ESQUERDA dos controles, com a largura do conteúdo (≈ 442 px): ele termina em ≈ 1142 na moldura C (1136 úteis) e em ≈ 723 na B (709) — o excesso está escondido pelo `overflow:hidden` da moldura | o menu *Filtros* **cabe no contêiner**: ancora pela **direita** do cabeçalho (o fim do conteúdo) e não passa da largura dele (`max-w-full`); em A os alternáveis quebram linha. Os nós do menu ficam ≈ 37 px mais à esquerda em C e em B (Δx), com o mesmo y e o mesmo tamanho | `4-content-lista`: `LIB-filtros` | 726 (I1-PR-9) | leitura |
| **I1-E13** | o `README-design.md` §5.5 dá a conta da casca com o menu *Perfil · Sair* (`casca.conta`) | o menu da conta é **só *Sair***: *Perfil* saiu com a página (I1-D19, I1-PR-3); não há cabeçalho nome + e-mail nem foto no menu — o nome fica no nome acessível *Conta de {nome}*, o gatilho mostra as iniciais | `4-content-lista` e toda tela com a casca (as folhas 5–8) — nenhuma seção desenha o menu aberto | 697 (I1-PR-9) | leitura |

A I1-E14 é do G-faixa: entra em `erratasFaixa` e cobre as erratas candidatas do `LIB-filtros` (os 10 nós do menu,
em C e em B). Sem ela, o app que segue a folha rola na horizontal nas três larguras (o (b) da 1ª rodada do aceite da
I1-PR-9, `docs/ux/I1-PR9-anexos/cn/g-faixa-aceite-rodada1.txt`).

A I1-E13 é errata de **frase** (§5.5), não de moldura: nenhuma seção desenha o menu da conta aberto, então não entra
em `erratasFaixa` (o G-faixa não a acha) nem em `erratas` (o `conferir.mjs` não a acha) — fica na lista
`erratasFrase` do `erratas.json`, que nenhum gate lê.

**Do aval da I1-PR-10** `[Marcel, 2026-09-28; aval do commit 1 da I1-PR-10, itens 2, 7, 8 e 10]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E15** | `VIEW-erro-cache` (*"não foi possível abrir o arquivo guardado neste navegador"*) e `VIEW-carregando-arquivo` (*"carregando…"*), de `useContentFile.ts`; e o motivo *"a cópia guardada está corrompida — recarregue a página"* de `view.erro.pdf` | **os dois estados não existem**: a cópia do arquivo no navegador e o hook que a lia morreram na I1-PR-3 (I1-D18; div. 555) — o PDF vai direto ao *carregando o PDF…* e a imagem ao `next/image`. `view.erro.cache` sai. `view.erro.pdf` escolhe o motivo pelo `name` do erro do pdf.js (medido: `docs/ux/I1-PR10-anexos/cn/pdfjs-erros-navegador.txt`): `MissingPDFException` (404) e `UnexpectedResponseException` (5xx) → *o arquivo está corrompido ou inacessível*; `InvalidPDFException` → *formato de PDF inválido*; `UnknownErrorException` de rede → `motivo.rede` (*sem conexão*); o resto → `motivo.generico`. Os T-I1-R dos dois estados saem (286 → 282, §4 renumerada) | `5-content-visualizacao` | 733, 734, 735, 760 (I1-PR-10) | comportamento |
| **I1-E16** | em `VIEW-partitura-cheia`, a barra só com *{título} · página n de N* e *Sair da tela cheia* | a barra da tela cheia tem também **Anterior e Próxima**: a paginação fica na tela cheia (I1-D27, "a tela cheia fica"); zoom e ajustes saem dela, como a folha. O estado "em tela cheia" vem só do `fullscreenchange` (a recusa do navegador deixa de marcá-lo). O título encolhe para caber os dois controles | `5-content-visualizacao`: `VIEW-partitura-cheia` | 739, 752 (I1-PR-10) | comportamento |
| **I1-E17** | `VIEW-erro-formato` com *Tentar de novo* | **sem *Tentar de novo***: o tipo do arquivo vem da extensão do `file_url` (I1-D36) e repetir não a muda — a linha sem ação da §3 do README-design. A linha fica mais baixa (sem o botão) e o que vem abaixo sobe | `5-content-visualizacao`: `VIEW-erro-formato` | 740 (I1-PR-10) | leitura |
| **I1-E18** | um painel por content (o tipo dele) | o content com **dois tipos de dado** (a letra ou a tab com acordes) mostra um **segundo painel *Cifra*** abaixo do primeiro — o mesmo componente, com os T-I1-R do painel. Nada que a visualização velha mostrava some (item 10 do aval) | `5-content-visualizacao`: `VIEW-letra`, `VIEW-tab` | 742 (I1-PR-10) | leitura |

A I1-E15 é errata de **estado**: as seções ficam na folha (nenhum byte dos `telas.html` muda), o `conferir.mjs` a acha
pelos requisitos que faltam (lista `erratas`, as 4 seção × faixa sem T-I1-R) e o gerador do esperado do G-faixa a lê na
lista nova `erratasEstado` (não grava as duas seções). Desde a I1-PR-10 o `conferir.mjs` acusa também o requisito de
estado **sem seção** — é o que a I1-E1 e a I1-E2 passam a cobrir, cada uma com os seus 2, no lugar da contagem
*"286 T-I1-R × 282"* que a E15 fecharia por acaso (div. 760). A I1-E16, a I1-E17 e a I1-E18 são do G-faixa
(`erratasFaixa`, com o `n` da pré-verificação sem sessão da I1-PR-10: 2, 13 e 0 — o aceite confirma).

**Do aval da I1-PR-11** `[Marcel, 2026-09-29; aval do commit 1 da I1-PR-11, itens 6 e 9]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E19** | a folha `6-content-editor` não tem estado para a **partitura** (nenhuma seção de content `Sheet`); o editor de antes tinha três ramos (o PDF de altura fixa, a imagem sem `onError`, o `annotation-tools` inerte) | **a folha não tem estado para partitura; vale o painel da folha 5**: no corpo do editor, o painel *Partitura* da visualização (`VIEW-partitura`, `-carregando-pdf`, `-erro-pdf`, `-vazio-partitura`, `-erro-formato` e a imagem — as mesmas seções e erratas da folha 5, I1-E15…E17), com *Detalhes* ao lado; o `annotation-tools` sai | `6-content-editor` (a partitura aberta no editor) | 775 (I1-PR-11) | leitura |
| **I1-E20** | o Tom escrito *Dó* (em *Informações* e em *Detalhes* de `EDIT-cifra`, `-sem-mudancas`, `-salvando`, `-salvar-erro`, e em *Detalhes* de `EDIT-tab`, `EDIT-letra`) e *tom: Dó* na prévia | o Tom é o **valor como é gravado**, na notação de cifra (*C*, *Am*, *F#m*…, os 38 de antes) — no campo, na opção e na prévia (*tom: C*); a §5.7 não nomeia as notas | `6-content-editor` | 779 (I1-PR-11) | leitura |

As duas são de **leitura** e nenhum gate as acha: a I1-E19 não tem seção (o G-faixa mede a partitura do editor só como
`casca-efeito`, sem moldura), e a I1-E20 muda só o texto dentro de uma caixa que pareia pela âncora do campo (o nó do
*Dó* da folha sai "sem par"). Ficam na lista `erratasFrase` do `erratas.json` (registro, nenhum gate lê).

**Do aval da I1-PR-12** `[Marcel, 2026-09-29; aval do commit 1 da I1-PR-12, itens 2, 3, 6, 7, 8 e 13]` — mesmas colunas:

| id | o que a folha mostra | o que vale | onde se aplica | div. | efeito |
|---|---|---|---|---|---|
| **I1-E21** | o passo 1 (`UP-como`) só com os três seletores, **sem controle de avanço**; a zona de arquivo e o criar do zero desenhados no passo 2, em tela própria, com *Voltar* | o passo 1 tem ***Próximo*** (`up.proximo`, o `garantida` de 24 em `accentInk`, I1-E6) na linha de botões à direita, abaixo dos seletores; a zona e o criar são telas do passo 2, como a folha os desenha, e o *Voltar* delas devolve o passo 1 com as escolhas. **Mudança de fluxo declarada**: um clique a mais (antes a zona e o criar ficavam abaixo dos seletores, na mesma tela) | `7-upload`: `UP-como`, `UP-lote-sucesso` (o *Próximo* sai "sem par") | 808 (I1-PR-12) | comportamento |
| **I1-E22** | os seletores na ordem *como você quer adicionar?* → *tipo de conteúdo* → *importar* (e a nota: *"na ordem de hoje"*) | a ordem **de hoje**, a da nota: *tipo de conteúdo* → *como você quer adicionar?* → *importar* — trocar o tipo zera o modo (`hooks/useAddContentLogic.ts`), e na ordem do desenho escolher *Importar de arquivo* e depois *Cifra* voltaria a *Criar do zero*. Os dois blocos trocam de lugar (Δy) | `7-upload`: `UP-como`, `UP-lote-sucesso` | 809 (I1-PR-12) | leitura |
| **I1-E24** | a linha do lote: número · título (texto) · artista (campo) | a grade da folha **mantendo** o que cada música tinha: o título num campo, o artista, o **corpo** num campo de duas linhas e a caixa *Incluir “{título}”* abaixo — a linha fica mais alta e o que vem abaixo desce; em A os dois campos empilham | `7-upload`: `UP-lote`, `UP-lote-importando`, `UP-lote-erro` | 813 (I1-PR-12) | leitura |
| **I1-E25** | em `UP-lote-erro`, o botão *Salvar* | ***Importar todas*** (`up.lote.importar`), como em `UP-lote` — o *Voltar* fica mais à esquerda (o botão é mais largo) | `7-upload`: `UP-lote-erro` | 814 (I1-PR-12) | leitura |
| **I1-E26** | em `UP-salvar-erro`, a segunda linha *o que você preencheu continua aqui* | a **N2**, *o que você escreveu continua aqui* (`digitado-fica`) — uma frase só no bloco | `7-upload`: `UP-salvar-erro` | 815 (I1-PR-12) | leitura |
| **I1-E27** `[Marcel, 2026-09-30; aval do veredito da I1-PR-12]` | `UP-criar` e `UP-criar-validacao` com a linha do arquivo (*partitura-12-paginas.pdf · 1,8 MiB*), cópia de `UP-detalhes` | no criar do zero não há arquivo: **a seção vale sem a linha**, e o que vem abaixo dela sobe 44 px (consequência da decisão 16 do aval do commit 1: os nós da linha ficam "sem par"; o molde das I1-E7…E10) | `7-upload`: `UP-criar`, `UP-criar-validacao` | 812, 834 (I1-PR-12) | leitura |

A **I1-E2** (acima) passa a ser também do G-faixa: `UP-lote-lendo` não tem seção e mede contra a `UP-lote` (decisão 13 do
aval) — *carregando…* no lugar do cabeçalho e da lista, com o *Voltar*. Em `erratasFaixa`: I1-E2 (n 2), I1-E22 (n 32),
I1-E24 (n 70) e I1-E27 (n 18), com o `n` da pré-verificação sem sessão da I1-PR-12, que o aceite confirmou (61 em C, 61
em B); em
`erratasFrase` (registro, nenhum gate lê): I1-E21, I1-E25 e I1-E26 — o *Próximo*, o *Importar todas* e a N2 saem "sem
par" pelo texto. Não houve I1-E23 (decisão 5 do aval: o criar do zero é *Título* + *Próximo*, como a folha).

## 3 · O bloco `web` de tokens — insumo da PR-4 (`packages/identidade`)

Exatamente como o `README-design.md` §2.1:

| token | C | B | folhas e elementos |
| --- | --- | --- | --- |
| `web.conteiner` | 1138 | — | todas: largura da moldura de C e máximo do conteúdo |
| `web.margem` | `space.xxl` | `space.xl` | 1–8: margem interna do contêiner; 3: margem da coluna de texto |
| `web.colunaLateral` | 320 | empilha | 5: detalhes; 6: metadados. Em todas, limiar de quebra das linhas flexíveis: texto da LinhaDeAviso (0), cabeçalhos da visualização, do editor e da setlist aberta (5, 6, 8) |
| `web.razaoListaDetalhe` | 2 : 3 | empilha | 8: lista de setlists \| setlist aberta |
| `web.zonaArquivo` | 240 | 240 | 7: altura mínima da zona de arquivo |
| `web.linhaLista` | 80 | 80 | 4: linha da biblioteca; 8: os três blocos de carregando |
| `web.linhaMusica` | 72 | 72 | 8: linha de música da setlist aberta |
| `web.empilha` | false | true | 4–8: casca em duas linhas; 5, 6, 8: coluna lateral desce; 5, 6: ações do cabeçalho descem; 1, 2: marca sobe acima do formulário |

Todo o resto das medidas é token do `apps/native/src/theme.ts`, derivado ou literal com origem — a tabela é a
`README-design.md` §2.3, conferida na §6 (b).

## 4 · Requisitos `T-I1-R<n>`

Um requisito por **superfície × faixa × estado**: cada `<section data-estado>` de cada folha, em C (1138) e em B (711).
Formato: o do [`N3-REQUISITOS.md`](../../native/N3-REQUISITOS.md) (div. **591**). Todo requisito cita a folha e a seção,
e o aceite é o mesmo para todos: o **G-faixa** (I1-D13, I1-D16) na largura da faixa, contra a seção, mais o
**inventário por estado** (I1-D12 com a errata da §2). A composição, os tokens e as frases de cada estado são os da
moldura; o `README-design.md` §2.4 dá os tokens por elemento, e o §5 as frases.

A `LinhaDeAviso` é componente: os `T-I1-R1…16` se cobram em toda superfície que a mostra (§3 do README-design: uma
por tela, a que bloqueia mais). A faixa **A** (411 px no G-faixa) segue B por referência (`README-design.md` §1):
não há `T-I1-R` próprio de A; o que o G-faixa medir em 411 é saída contada à parte (I1-D13).

**282 requisitos** = (141 estados com seção − 2 tirados pela I1-E15 + 2 por errata, I1-E1 e I1-E2) × 2 faixas.
Eram **286** até a I1-PR-10: a I1-E15 tirou os 4 de `VIEW-carregando-arquivo` e `VIEW-erro-cache` e a numeração
foi refeita contínua (a tabela antes/depois está em `docs/ux/I1-PR10-anexos/README.md`). O script conta as seções e
cobra um requisito por seção × faixa; desde a I1-PR-10 acusa também o requisito de estado sem seção — os 4 da
I1-E1/E2 — e as seções sem requisito — as 2 × 2 da I1-E15 (§6.3; div. 760).

**Os nomes das medidas fixas das folhas 0 e 1** `[Marcel, 2026-09-27; I1-PR-6, decisão 2 do aval]` — os literais com
origem do `README-design.md` §2.3 (que não muda) ganham nome no bloco `web` de `packages/identidade` e custom property
gerada em `app/styles/identidade.css` — **oito nomes**. Os requisitos das folhas 0 e 1 se leem com eles:

| nome (`faixas.*.web`) | custom property | C | B | origem (`README-design.md` §2.3) |
| --- | --- | --- | --- | --- |
| `marca` | `--faixa-marca-largura` · `--faixa-marca-altura` | 340 × 219 | igual | literal S0 (a marca) |
| `colunaAuth` | `--faixa-coluna-auth` | 420 | igual | literal S0 (coluna do formulário) |
| `vaoAuth` | `--faixa-vao-auth` | 140 | `space.xxxl` (48) | literal S0 (vão marca \| formulário, V1 E10); em B a marca sobe |
| `campoAuth` | `--faixa-campo-auth` | `touch.list + 4` (60) | igual | campo do S0, V1 §5.2 |
| `botaoAuth` | `--faixa-botao-auth` | `touch.list + 2` (58) | igual | botão secundário do S0, V1 §5.2 |
| `botaoAviso` | `--faixa-botao-aviso` | 36 | igual | literal N3 (botão de ação da LinhaDeAviso) |
| `entrelinhaAviso` | `--faixa-entrelinha-aviso` | 20 | igual | literal N3 (T3-R7), I1-E5 |
| `limiarAviso` | `--faixa-limiar-aviso` | 320 | igual | `web.colunaLateral` como limiar de quebra do texto da LinhaDeAviso, que é "igual" em B (§2.4); em B a `colunaLateral` é `empilha` e não gera propriedade (div. 605) — por isso o nome próprio (I1-PR-6, div. 657; aceito pelo Marcel no aval do commit 2) |

**Mais três, da folha 4** `[Marcel, 2026-09-28; I1-PR-9, aval do commit 2 — opção 2: só adição, como a decisão 2 da
I1-PR-6]` — o que a folha `4-content-lista` usa sem token (div. 713):

| nome (`faixas.*.web`) | custom property | C | B | origem |
| --- | --- | --- | --- | --- |
| `metadado` | `--faixa-metadado` | 13 | igual | literal V1 §4.4, o metadado de linha (`README-design.md` §2.3: tipo na lista do painel, data na linha da biblioteca) |
| `alfaMarcado` | `--faixa-cor-marcado` = `color-mix(in srgb, var(--cor-accent) 12%, transparent)` | 0,12 | igual | *accent a 12 % (item marcado)* — `README-design.md`, "Cores" |
| `alfaDialogo` | `--faixa-cor-dialogo` = `color-mix(in srgb, var(--cor-bg) 82%, transparent)` | 0,82 | igual | *bg a 82 % (fundo do diálogo)* — `README-design.md`, "Cores" |

### LinhaDeAviso — `0-linha-de-aviso/telas.html` · T-I1-R1 … T-I1-R16 (8 estados × C, B)

**T-I1-R1 — LinhaDeAviso · C · `AVISO-falha`** `[0-linha-de-aviso/telas.html#AVISO-falha; README-design §2.4, §3]`. Em C (1138 px), o estado *falha · com ação* é a moldura C da seção `AVISO-falha`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R2 — LinhaDeAviso · B · `AVISO-falha`** `[0-linha-de-aviso/telas.html#AVISO-falha; README-design §2.4, §3]`. Em B (711 px), o estado *falha · com ação* é a moldura B da seção `AVISO-falha`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R3 — LinhaDeAviso · C · `AVISO-falha-sem-acao`** `[0-linha-de-aviso/telas.html#AVISO-falha-sem-acao; README-design §2.4, §3]`. Em C (1138 px), o estado *falha · sem ação* é a moldura C da seção `AVISO-falha-sem-acao`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R4 — LinhaDeAviso · B · `AVISO-falha-sem-acao`** `[0-linha-de-aviso/telas.html#AVISO-falha-sem-acao; README-design §2.4, §3]`. Em B (711 px), o estado *falha · sem ação* é a moldura B da seção `AVISO-falha-sem-acao`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R5 — LinhaDeAviso · C · `AVISO-rede`** `[0-linha-de-aviso/telas.html#AVISO-rede; README-design §2.4, §3]`. Em C (1138 px), o estado *sem conexão* é a moldura C da seção `AVISO-rede`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R6 — LinhaDeAviso · B · `AVISO-rede`** `[0-linha-de-aviso/telas.html#AVISO-rede; README-design §2.4, §3]`. Em B (711 px), o estado *sem conexão* é a moldura B da seção `AVISO-rede`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R7 — LinhaDeAviso · C · `AVISO-limite`** `[0-linha-de-aviso/telas.html#AVISO-limite; README-design §2.4, §3]`. Em C (1138 px), o estado *limite* é a moldura C da seção `AVISO-limite`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R8 — LinhaDeAviso · B · `AVISO-limite`** `[0-linha-de-aviso/telas.html#AVISO-limite; README-design §2.4, §3]`. Em B (711 px), o estado *limite* é a moldura B da seção `AVISO-limite`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R9 — LinhaDeAviso · C · `AVISO-sucesso`** `[0-linha-de-aviso/telas.html#AVISO-sucesso; README-design §2.4, §3]`. Em C (1138 px), o estado *sucesso* é a moldura C da seção `AVISO-sucesso`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R10 — LinhaDeAviso · B · `AVISO-sucesso`** `[0-linha-de-aviso/telas.html#AVISO-sucesso; README-design §2.4, §3]`. Em B (711 px), o estado *sucesso* é a moldura B da seção `AVISO-sucesso`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R11 — LinhaDeAviso · C · `AVISO-detalhe`** `[0-linha-de-aviso/telas.html#AVISO-detalhe; README-design §2.4, §3]`. Em C (1138 px), o estado *falha · com detalhe* é a moldura C da seção `AVISO-detalhe`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R12 — LinhaDeAviso · B · `AVISO-detalhe`** `[0-linha-de-aviso/telas.html#AVISO-detalhe; README-design §2.4, §3]`. Em B (711 px), o estado *falha · com detalhe* é a moldura B da seção `AVISO-detalhe`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R13 — LinhaDeAviso · C · `AVISO-longo`** `[0-linha-de-aviso/telas.html#AVISO-longo; README-design §2.4, §3]`. Em C (1138 px), o estado *texto longo · cresce* é a moldura C da seção `AVISO-longo`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R14 — LinhaDeAviso · B · `AVISO-longo`** `[0-linha-de-aviso/telas.html#AVISO-longo; README-design §2.4, §3]`. Em B (711 px), o estado *texto longo · cresce* é a moldura B da seção `AVISO-longo`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R15 — LinhaDeAviso · C · `AVISO-dialogo-apagar`** `[0-linha-de-aviso/telas.html#AVISO-dialogo-apagar; README-design §2.4, §3]`. Em C (1138 px), o estado *dentro do diálogo de apagar* é a moldura C da seção `AVISO-dialogo-apagar`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R16 — LinhaDeAviso · B · `AVISO-dialogo-apagar`** `[0-linha-de-aviso/telas.html#AVISO-dialogo-apagar; README-design §2.4, §3]`. Em B (711 px), o estado *dentro do diálogo de apagar* é a moldura B da seção `AVISO-dialogo-apagar`: composição, tokens da §2.4 e frases da §3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Auth — `1-auth/telas.html` · T-I1-R17 … T-I1-R110 (47 estados × C, B; 1 por errata)

**T-I1-R17 — Auth · C · `AUTH-login`** `[1-auth/telas.html#AUTH-login; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · base* é a moldura C da seção `AUTH-login`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R18 — Auth · B · `AUTH-login`** `[1-auth/telas.html#AUTH-login; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · base* é a moldura B da seção `AUTH-login`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R19 — Auth · C · `AUTH-login-validacao`** `[1-auth/telas.html#AUTH-login-validacao; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · validação* é a moldura C da seção `AUTH-login-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R20 — Auth · B · `AUTH-login-validacao`** `[1-auth/telas.html#AUTH-login-validacao; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · validação* é a moldura B da seção `AUTH-login-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R21 — Auth · C · `AUTH-login-entrando`** `[1-auth/telas.html#AUTH-login-entrando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · carregando (enviar)* é a moldura C da seção `AUTH-login-entrando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R22 — Auth · B · `AUTH-login-entrando`** `[1-auth/telas.html#AUTH-login-entrando; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · carregando (enviar)* é a moldura B da seção `AUTH-login-entrando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R23 — Auth · C · `AUTH-login-google`** `[1-auth/telas.html#AUTH-login-google; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · carregando (Google)* é a moldura C da seção `AUTH-login-google`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R24 — Auth · B · `AUTH-login-google`** `[1-auth/telas.html#AUTH-login-google; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · carregando (Google)* é a moldura B da seção `AUTH-login-google`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R25 — Auth · C · `AUTH-login-redirecionando`** `[1-auth/telas.html#AUTH-login-redirecionando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · carregando (perfil)* é a moldura C da seção `AUTH-login-redirecionando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R26 — Auth · B · `AUTH-login-redirecionando`** `[1-auth/telas.html#AUTH-login-redirecionando; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · carregando (perfil)* é a moldura B da seção `AUTH-login-redirecionando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R27 — Auth · C · `AUTH-login-sem-token`** `[1-auth/telas.html#AUTH-login-sem-token; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · erro sem token* é a moldura C da seção `AUTH-login-sem-token`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R28 — Auth · B · `AUTH-login-sem-token`** `[1-auth/telas.html#AUTH-login-sem-token; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · erro sem token* é a moldura B da seção `AUTH-login-sem-token`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R29 — Auth · C · `AUTH-login-credencial`** `[1-auth/telas.html#AUTH-login-credencial; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · erro de credencial* é a moldura C da seção `AUTH-login-credencial`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R30 — Auth · B · `AUTH-login-credencial`** `[1-auth/telas.html#AUTH-login-credencial; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · erro de credencial* é a moldura B da seção `AUTH-login-credencial`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R31 — Auth · C · `AUTH-login-limite-prazo`** `[1-auth/telas.html#AUTH-login-limite-prazo; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · 429 com prazo* é a moldura C da seção `AUTH-login-limite-prazo`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R32 — Auth · B · `AUTH-login-limite-prazo`** `[1-auth/telas.html#AUTH-login-limite-prazo; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · 429 com prazo* é a moldura B da seção `AUTH-login-limite-prazo`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R33 — Auth · C · `AUTH-login-limite`** `[1-auth/telas.html#AUTH-login-limite; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · 429 sem prazo* é a moldura C da seção `AUTH-login-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R34 — Auth · B · `AUTH-login-limite`** `[1-auth/telas.html#AUTH-login-limite; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · 429 sem prazo* é a moldura B da seção `AUTH-login-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R35 — Auth · C · `AUTH-login-rede`** `[1-auth/telas.html#AUTH-login-rede; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · erro de rede* é a moldura C da seção `AUTH-login-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R36 — Auth · B · `AUTH-login-rede`** `[1-auth/telas.html#AUTH-login-rede; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · erro de rede* é a moldura B da seção `AUTH-login-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R37 — Auth · C · `AUTH-login-google-erro`** `[1-auth/telas.html#AUTH-login-google-erro; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · erro do Google* é a moldura C da seção `AUTH-login-google-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R38 — Auth · B · `AUTH-login-google-erro`** `[1-auth/telas.html#AUTH-login-google-erro; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · erro do Google* é a moldura B da seção `AUTH-login-google-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R39 — Auth · C · `AUTH-login-nao-configurado`** `[1-auth/telas.html#AUTH-login-nao-configurado; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · não configurado* é a moldura C da seção `AUTH-login-nao-configurado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R40 — Auth · B · `AUTH-login-nao-configurado`** `[1-auth/telas.html#AUTH-login-nao-configurado; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · não configurado* é a moldura B da seção `AUTH-login-nao-configurado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R41 — Auth · C · `AUTH-login-perfil-401`** `[1-auth/telas.html#AUTH-login-perfil-401; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · perfil 401* é a moldura C da seção `AUTH-login-perfil-401`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R42 — Auth · B · `AUTH-login-perfil-401`** `[1-auth/telas.html#AUTH-login-perfil-401; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · perfil 401* é a moldura B da seção `AUTH-login-perfil-401`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R43 — Auth · C · `AUTH-login-servidor`** `[1-auth/telas.html#AUTH-login-servidor; README-design §2.4, §5.2]`. Em C (1138 px), o estado *login · perfil 5xx / criar perfil* é a moldura C da seção `AUTH-login-servidor`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R44 — Auth · B · `AUTH-login-servidor`** `[1-auth/telas.html#AUTH-login-servidor; README-design §2.4, §5.2]`. Em B (711 px), o estado *login · perfil 5xx / criar perfil* é a moldura B da seção `AUTH-login-servidor`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R45 — Auth · C · `AUTH-signup`** `[1-auth/telas.html#AUTH-signup; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · base* é a moldura C da seção `AUTH-signup`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R46 — Auth · B · `AUTH-signup`** `[1-auth/telas.html#AUTH-signup; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · base* é a moldura B da seção `AUTH-signup`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R47 — Auth · C · `AUTH-signup-validacao`** `[1-auth/telas.html#AUTH-signup-validacao; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · validação (campos)* é a moldura C da seção `AUTH-signup-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R48 — Auth · B · `AUTH-signup-validacao`** `[1-auth/telas.html#AUTH-signup-validacao; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · validação (campos)* é a moldura B da seção `AUTH-signup-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R49 — Auth · C · `AUTH-signup-senhas`** `[1-auth/telas.html#AUTH-signup-senhas; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · senhas diferentes* é a moldura C da seção `AUTH-signup-senhas`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R50 — Auth · B · `AUTH-signup-senhas`** `[1-auth/telas.html#AUTH-signup-senhas; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · senhas diferentes* é a moldura B da seção `AUTH-signup-senhas`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R51 — Auth · C · `AUTH-signup-criando`** `[1-auth/telas.html#AUTH-signup-criando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · carregando* é a moldura C da seção `AUTH-signup-criando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R52 — Auth · B · `AUTH-signup-criando`** `[1-auth/telas.html#AUTH-signup-criando; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · carregando* é a moldura B da seção `AUTH-signup-criando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R53 — Auth · C · `AUTH-signup-email-usado`** `[1-auth/telas.html#AUTH-signup-email-usado; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · e-mail já usado* é a moldura C da seção `AUTH-signup-email-usado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R54 — Auth · B · `AUTH-signup-email-usado`** `[1-auth/telas.html#AUTH-signup-email-usado; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · e-mail já usado* é a moldura B da seção `AUTH-signup-email-usado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R55 — Auth · C · `AUTH-signup-senha-fraca`** `[1-auth/telas.html#AUTH-signup-senha-fraca; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · senha fraca* é a moldura C da seção `AUTH-signup-senha-fraca`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R56 — Auth · B · `AUTH-signup-senha-fraca`** `[1-auth/telas.html#AUTH-signup-senha-fraca; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · senha fraca* é a moldura B da seção `AUTH-signup-senha-fraca`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R57 — Auth · C · `AUTH-signup-rede`** `[1-auth/telas.html#AUTH-signup-rede; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · erro de rede* é a moldura C da seção `AUTH-signup-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R58 — Auth · B · `AUTH-signup-rede`** `[1-auth/telas.html#AUTH-signup-rede; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · erro de rede* é a moldura B da seção `AUTH-signup-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R59 — Auth · C · `AUTH-signup-limite`** `[1-auth/telas.html#AUTH-signup-limite; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · erro 429* é a moldura C da seção `AUTH-signup-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R60 — Auth · B · `AUTH-signup-limite`** `[1-auth/telas.html#AUTH-signup-limite; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · erro 429* é a moldura B da seção `AUTH-signup-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R61 — Auth · C · `AUTH-signup-perfil`** `[1-auth/telas.html#AUTH-signup-perfil; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · perfil não criado* é a moldura C da seção `AUTH-signup-perfil`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R62 — Auth · B · `AUTH-signup-perfil`** `[1-auth/telas.html#AUTH-signup-perfil; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · perfil não criado* é a moldura B da seção `AUTH-signup-perfil`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R63 — Auth · C · `AUTH-signup-excecao`** `[1-auth/telas.html#AUTH-signup-excecao; README-design §2.4, §5.2]`. Em C (1138 px), o estado *signup · exceção* é a moldura C da seção `AUTH-signup-excecao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R64 — Auth · B · `AUTH-signup-excecao`** `[1-auth/telas.html#AUTH-signup-excecao; README-design §2.4, §5.2]`. Em B (711 px), o estado *signup · exceção* é a moldura B da seção `AUTH-signup-excecao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R65 — Auth · C · `AUTH-confirm`** `[1-auth/telas.html#AUTH-confirm; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · base* é a moldura C da seção `AUTH-confirm`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R66 — Auth · B · `AUTH-confirm`** `[1-auth/telas.html#AUTH-confirm; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · base* é a moldura B da seção `AUTH-confirm`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R67 — Auth · C · `AUTH-confirm-enviando`** `[1-auth/telas.html#AUTH-confirm-enviando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · carregando* é a moldura C da seção `AUTH-confirm-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R68 — Auth · B · `AUTH-confirm-enviando`** `[1-auth/telas.html#AUTH-confirm-enviando; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · carregando* é a moldura B da seção `AUTH-confirm-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R69 — Auth · C · `AUTH-confirm-sucesso`** `[1-auth/telas.html#AUTH-confirm-sucesso; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · sucesso* é a moldura C da seção `AUTH-confirm-sucesso`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R70 — Auth · B · `AUTH-confirm-sucesso`** `[1-auth/telas.html#AUTH-confirm-sucesso; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · sucesso* é a moldura B da seção `AUTH-confirm-sucesso`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R71 — Auth · C · `AUTH-confirm-erro`** `[1-auth/telas.html#AUTH-confirm-erro; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · erro ao reenviar* é a moldura C da seção `AUTH-confirm-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R72 — Auth · B · `AUTH-confirm-erro`** `[1-auth/telas.html#AUTH-confirm-erro; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · erro ao reenviar* é a moldura B da seção `AUTH-confirm-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R73 — Auth · C · `AUTH-confirm-erro-rede`** `[1-auth/telas.html#AUTH-confirm-erro-rede; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · erro ao reenviar (rede)* é a moldura C da seção `AUTH-confirm-erro-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R74 — Auth · B · `AUTH-confirm-erro-rede`** `[1-auth/telas.html#AUTH-confirm-erro-rede; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · erro ao reenviar (rede)* é a moldura B da seção `AUTH-confirm-erro-rede`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R75 — Auth · C · `AUTH-confirm-sem-usuario`** `[1-auth/telas.html#AUTH-confirm-sem-usuario; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · sessão caiu* é a moldura C da seção `AUTH-confirm-sem-usuario`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R76 — Auth · B · `AUTH-confirm-sem-usuario`** `[1-auth/telas.html#AUTH-confirm-sem-usuario; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · sessão caiu* é a moldura B da seção `AUTH-confirm-sem-usuario`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R77 — Auth · C · `AUTH-confirm-excecao`** `[1-auth/telas.html#AUTH-confirm-excecao; README-design §2.4, §5.2]`. Em C (1138 px), o estado *confirm-email · exceção* é a moldura C da seção `AUTH-confirm-excecao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R78 — Auth · B · `AUTH-confirm-excecao`** `[1-auth/telas.html#AUTH-confirm-excecao; README-design §2.4, §5.2]`. Em B (711 px), o estado *confirm-email · exceção* é a moldura B da seção `AUTH-confirm-excecao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R79 — Auth · C · `AUTH-verify-carregando`** `[1-auth/telas.html#AUTH-verify-carregando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · carregando (auth)* é a moldura C da seção `AUTH-verify-carregando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R80 — Auth · B · `AUTH-verify-carregando`** `[1-auth/telas.html#AUTH-verify-carregando; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · carregando (auth)* é a moldura B da seção `AUTH-verify-carregando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R81 — Auth · C · `AUTH-verify`** `[1-auth/telas.html#AUTH-verify; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · base* é a moldura C da seção `AUTH-verify`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R82 — Auth · B · `AUTH-verify`** `[1-auth/telas.html#AUTH-verify; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · base* é a moldura B da seção `AUTH-verify`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R83 — Auth · C · `AUTH-verify-checando`** `[1-auth/telas.html#AUTH-verify-checando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · carregando (checar)* é a moldura C da seção `AUTH-verify-checando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R84 — Auth · B · `AUTH-verify-checando`** `[1-auth/telas.html#AUTH-verify-checando; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · carregando (checar)* é a moldura B da seção `AUTH-verify-checando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R85 — Auth · C · `AUTH-verify-enviando`** `[1-auth/telas.html#AUTH-verify-enviando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · carregando (reenviar)* é a moldura C da seção `AUTH-verify-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R86 — Auth · B · `AUTH-verify-enviando`** `[1-auth/telas.html#AUTH-verify-enviando; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · carregando (reenviar)* é a moldura B da seção `AUTH-verify-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R87 — Auth · C · `AUTH-verify-nao-verificado`** `[1-auth/telas.html#AUTH-verify-nao-verificado; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · ainda não confirmado* é a moldura C da seção `AUTH-verify-nao-verificado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R88 — Auth · B · `AUTH-verify-nao-verificado`** `[1-auth/telas.html#AUTH-verify-nao-verificado; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · ainda não confirmado* é a moldura B da seção `AUTH-verify-nao-verificado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R89 — Auth · C · `AUTH-verify-checar-falhou`** `[1-auth/telas.html#AUTH-verify-checar-falhou; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · checar falhou* é a moldura C da seção `AUTH-verify-checar-falhou`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R90 — Auth · B · `AUTH-verify-checar-falhou`** `[1-auth/telas.html#AUTH-verify-checar-falhou; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · checar falhou* é a moldura B da seção `AUTH-verify-checar-falhou`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R91 — Auth · C · `AUTH-verify-reenviar-erro`** `[1-auth/telas.html#AUTH-verify-reenviar-erro; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · erro ao reenviar* é a moldura C da seção `AUTH-verify-reenviar-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R92 — Auth · B · `AUTH-verify-reenviar-erro`** `[1-auth/telas.html#AUTH-verify-reenviar-erro; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · erro ao reenviar* é a moldura B da seção `AUTH-verify-reenviar-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R93 — Auth · C · `AUTH-verify-reenviar-limite`** `[1-auth/telas.html#AUTH-verify-reenviar-limite; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · erro ao reenviar (429)* é a moldura C da seção `AUTH-verify-reenviar-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R94 — Auth · B · `AUTH-verify-reenviar-limite`** `[1-auth/telas.html#AUTH-verify-reenviar-limite; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · erro ao reenviar (429)* é a moldura B da seção `AUTH-verify-reenviar-limite`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R95 — Auth · C · `AUTH-verify-reenviar-excecao`** `[por errata I1-E1; 1-auth/telas.html — sem seção; README-design §2.4, §5.1, §5.2]`. **Por errata I1-E1** (§2.2). Em C (1138 px), o estado *verify-email · erro ao reenviar (genérico)* não tem moldura na folha: vale o que a errata I1-E1 descreve, com a composição da moldura C que ela cita. *Aceite*: G-faixa em 1138 px contra a errata I1-E1 (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R96 — Auth · B · `AUTH-verify-reenviar-excecao`** `[por errata I1-E1; 1-auth/telas.html — sem seção; README-design §2.4, §5.1, §5.2]`. **Por errata I1-E1** (§2.2). Em B (711 px), o estado *verify-email · erro ao reenviar (genérico)* não tem moldura na folha: vale o que a errata I1-E1 descreve, com a composição da moldura B que ela cita. *Aceite*: G-faixa em 711 px contra a errata I1-E1 (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R97 — Auth · C · `AUTH-verify-reenviado`** `[1-auth/telas.html#AUTH-verify-reenviado; README-design §2.4, §5.2]`. Em C (1138 px), o estado *verify-email · sucesso (reenviado)* é a moldura C da seção `AUTH-verify-reenviado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R98 — Auth · B · `AUTH-verify-reenviado`** `[1-auth/telas.html#AUTH-verify-reenviado; README-design §2.4, §5.2]`. Em B (711 px), o estado *verify-email · sucesso (reenviado)* é a moldura B da seção `AUTH-verify-reenviado`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R99 — Auth · C · `AUTH-forgot`** `[1-auth/telas.html#AUTH-forgot; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · base* é a moldura C da seção `AUTH-forgot`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R100 — Auth · B · `AUTH-forgot`** `[1-auth/telas.html#AUTH-forgot; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · base* é a moldura B da seção `AUTH-forgot`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R101 — Auth · C · `AUTH-forgot-validacao`** `[1-auth/telas.html#AUTH-forgot-validacao; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · validação* é a moldura C da seção `AUTH-forgot-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R102 — Auth · B · `AUTH-forgot-validacao`** `[1-auth/telas.html#AUTH-forgot-validacao; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · validação* é a moldura B da seção `AUTH-forgot-validacao`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R103 — Auth · C · `AUTH-forgot-enviando`** `[1-auth/telas.html#AUTH-forgot-enviando; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · carregando* é a moldura C da seção `AUTH-forgot-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R104 — Auth · B · `AUTH-forgot-enviando`** `[1-auth/telas.html#AUTH-forgot-enviando; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · carregando* é a moldura B da seção `AUTH-forgot-enviando`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R105 — Auth · C · `AUTH-forgot-indisponivel`** `[1-auth/telas.html#AUTH-forgot-indisponivel; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · não configurado* é a moldura C da seção `AUTH-forgot-indisponivel`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R106 — Auth · B · `AUTH-forgot-indisponivel`** `[1-auth/telas.html#AUTH-forgot-indisponivel; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · não configurado* é a moldura B da seção `AUTH-forgot-indisponivel`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R107 — Auth · C · `AUTH-forgot-erro`** `[1-auth/telas.html#AUTH-forgot-erro; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · erro* é a moldura C da seção `AUTH-forgot-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R108 — Auth · B · `AUTH-forgot-erro`** `[1-auth/telas.html#AUTH-forgot-erro; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · erro* é a moldura B da seção `AUTH-forgot-erro`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R109 — Auth · C · `AUTH-forgot-sucesso`** `[1-auth/telas.html#AUTH-forgot-sucesso; README-design §2.4, §5.2]`. Em C (1138 px), o estado *forgot-password · sucesso* é a moldura C da seção `AUTH-forgot-sucesso`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R110 — Auth · B · `AUTH-forgot-sucesso`** `[1-auth/telas.html#AUTH-forgot-sucesso; README-design §2.4, §5.2]`. Em B (711 px), o estado *forgot-password · sucesso* é a moldura B da seção `AUTH-forgot-sucesso`: composição, tokens da §2.4 e frases da §5.2. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Landing — `2-landing/telas.html` · T-I1-R111 … T-I1-R112 (1 estados × C, B)

**T-I1-R111 — Landing · C · `LANDING`** `[2-landing/telas.html#LANDING; README-design §2.4, §5.3]`. Em C (1138 px), o estado *único estado* é a moldura C da seção `LANDING`: composição, tokens da §2.4 e frases da §5.3. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R112 — Landing · B · `LANDING`** `[2-landing/telas.html#LANDING; README-design §2.4, §5.3]`. Em B (711 px), o estado *único estado* é a moldura B da seção `LANDING`: composição, tokens da §2.4 e frases da §5.3. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Privacy policy — `3-privacy-policy/telas.html` · T-I1-R113 … T-I1-R114 (1 estados × C, B)

**T-I1-R113 — Privacy policy · C · `PRIVACY`** `[3-privacy-policy/telas.html#PRIVACY; README-design §2.4, §5.4]`. Em C (1138 px), o estado *único estado* é a moldura C da seção `PRIVACY`: composição, tokens da §2.4 e frases da §5.4. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R114 — Privacy policy · B · `PRIVACY`** `[3-privacy-policy/telas.html#PRIVACY; README-design §2.4, §5.4]`. Em B (711 px), o estado *único estado* é a moldura B da seção `PRIVACY`: composição, tokens da §2.4 e frases da §5.4. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Content — lista — `4-content-lista/telas.html` · T-I1-R115 … T-I1-R144 (15 estados × C, B)

**T-I1-R115 — Content — lista · C · `DASH`** `[4-content-lista/telas.html#DASH; README-design §2.4, §5.5]`. Em C (1138 px), o estado *dashboard · visão geral* é a moldura C da seção `DASH`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R116 — Content — lista · B · `DASH`** `[4-content-lista/telas.html#DASH; README-design §2.4, §5.5]`. Em B (711 px), o estado *dashboard · visão geral* é a moldura B da seção `DASH`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R117 — Content — lista · C · `DASH-vazio`** `[4-content-lista/telas.html#DASH-vazio; README-design §2.4, §5.5]`. Em C (1138 px), o estado *dashboard · vazio* é a moldura C da seção `DASH-vazio`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R118 — Content — lista · B · `DASH-vazio`** `[4-content-lista/telas.html#DASH-vazio; README-design §2.4, §5.5]`. Em B (711 px), o estado *dashboard · vazio* é a moldura B da seção `DASH-vazio`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R119 — Content — lista · C · `DASH-vazio-favoritas`** `[4-content-lista/telas.html#DASH-vazio-favoritas; README-design §2.4, §5.5]`. Em C (1138 px), o estado *dashboard · sem favoritas* é a moldura C da seção `DASH-vazio-favoritas`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R120 — Content — lista · B · `DASH-vazio-favoritas`** `[4-content-lista/telas.html#DASH-vazio-favoritas; README-design §2.4, §5.5]`. Em B (711 px), o estado *dashboard · sem favoritas* é a moldura B da seção `DASH-vazio-favoritas`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R121 — Content — lista · C · `DASH-erro`** `[4-content-lista/telas.html#DASH-erro; README-design §2.4, §5.5]`. Em C (1138 px), o estado *dashboard · erro (conteúdo e números)* é a moldura C da seção `DASH-erro`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R122 — Content — lista · B · `DASH-erro`** `[4-content-lista/telas.html#DASH-erro; README-design §2.4, §5.5]`. Em B (711 px), o estado *dashboard · erro (conteúdo e números)* é a moldura B da seção `DASH-erro`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R123 — Content — lista · C · `SESSAO-nao-renovada`** `[4-content-lista/telas.html#SESSAO-nao-renovada; README-design §2.4, §5.5]`. Em C (1138 px), o estado *qualquer tela exceto /login · sessão não renovada* é a moldura C da seção `SESSAO-nao-renovada`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R124 — Content — lista · B · `SESSAO-nao-renovada`** `[4-content-lista/telas.html#SESSAO-nao-renovada; README-design §2.4, §5.5]`. Em B (711 px), o estado *qualquer tela exceto /login · sessão não renovada* é a moldura B da seção `SESSAO-nao-renovada`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R125 — Content — lista · C · `LIB`** `[4-content-lista/telas.html#LIB; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · base* é a moldura C da seção `LIB`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R126 — Content — lista · B · `LIB`** `[4-content-lista/telas.html#LIB; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · base* é a moldura B da seção `LIB`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R127 — Content — lista · C · `LIB-filtros`** `[4-content-lista/telas.html#LIB-filtros; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · filtros abertos* é a moldura C da seção `LIB-filtros`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R128 — Content — lista · B · `LIB-filtros`** `[4-content-lista/telas.html#LIB-filtros; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · filtros abertos* é a moldura B da seção `LIB-filtros`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R129 — Content — lista · C · `LIB-mais`** `[4-content-lista/telas.html#LIB-mais; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · menu da linha* é a moldura C da seção `LIB-mais`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R130 — Content — lista · B · `LIB-mais`** `[4-content-lista/telas.html#LIB-mais; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · menu da linha* é a moldura B da seção `LIB-mais`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R131 — Content — lista · C · `LIB-salvo`** `[4-content-lista/telas.html#LIB-salvo; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · alterações salvas* é a moldura C da seção `LIB-salvo`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R132 — Content — lista · B · `LIB-salvo`** `[4-content-lista/telas.html#LIB-salvo; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · alterações salvas* é a moldura B da seção `LIB-salvo`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R133 — Content — lista · C · `LIB-carregando-chunk`** `[4-content-lista/telas.html#LIB-carregando-chunk; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · carregando (página)* é a moldura C da seção `LIB-carregando-chunk`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R134 — Content — lista · B · `LIB-carregando-chunk`** `[4-content-lista/telas.html#LIB-carregando-chunk; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · carregando (página)* é a moldura B da seção `LIB-carregando-chunk`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R135 — Content — lista · C · `LIB-carregando`** `[4-content-lista/telas.html#LIB-carregando; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · carregando (dados)* é a moldura C da seção `LIB-carregando`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R136 — Content — lista · B · `LIB-carregando`** `[4-content-lista/telas.html#LIB-carregando; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · carregando (dados)* é a moldura B da seção `LIB-carregando`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R137 — Content — lista · C · `LIB-vazio`** `[4-content-lista/telas.html#LIB-vazio; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · vazio (primeira vez)* é a moldura C da seção `LIB-vazio`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R138 — Content — lista · B · `LIB-vazio`** `[4-content-lista/telas.html#LIB-vazio; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · vazio (primeira vez)* é a moldura B da seção `LIB-vazio`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R139 — Content — lista · C · `LIB-vazio-busca`** `[4-content-lista/telas.html#LIB-vazio-busca; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · vazio com busca/filtro* é a moldura C da seção `LIB-vazio-busca`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R140 — Content — lista · B · `LIB-vazio-busca`** `[4-content-lista/telas.html#LIB-vazio-busca; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · vazio com busca/filtro* é a moldura B da seção `LIB-vazio-busca`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R141 — Content — lista · C · `LIB-erro`** `[4-content-lista/telas.html#LIB-erro; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · erro sem cópia* é a moldura C da seção `LIB-erro`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R142 — Content — lista · B · `LIB-erro`** `[4-content-lista/telas.html#LIB-erro; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · erro sem cópia* é a moldura B da seção `LIB-erro`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R143 — Content — lista · C · `LIB-apagar`** `[4-content-lista/telas.html#LIB-apagar; README-design §2.4, §5.5]`. Em C (1138 px), o estado *library · confirmar apagar* é a moldura C da seção `LIB-apagar`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R144 — Content — lista · B · `LIB-apagar`** `[4-content-lista/telas.html#LIB-apagar; README-design §2.4, §5.5]`. Em B (711 px), o estado *library · confirmar apagar* é a moldura B da seção `LIB-apagar`: composição, tokens da §2.4 e frases da §5.5. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Content — visualização — `5-content-visualizacao/telas.html` · T-I1-R145 … T-I1-R170 (13 estados × C, B; a I1-E15 tirou `VIEW-carregando-arquivo` e `VIEW-erro-cache`, os antigos T-I1-R155/156 e 167/168)

**T-I1-R145 — Content — visualização · C · `VIEW-cifra`** `[5-content-visualizacao/telas.html#VIEW-cifra; README-design §2.4, §5.6]`. Em C (1138 px), o estado *cifra* é a moldura C da seção `VIEW-cifra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R146 — Content — visualização · B · `VIEW-cifra`** `[5-content-visualizacao/telas.html#VIEW-cifra; README-design §2.4, §5.6]`. Em B (711 px), o estado *cifra* é a moldura B da seção `VIEW-cifra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R147 — Content — visualização · C · `VIEW-letra`** `[5-content-visualizacao/telas.html#VIEW-letra; README-design §2.4, §5.6]`. Em C (1138 px), o estado *letra · notas vazias* é a moldura C da seção `VIEW-letra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R148 — Content — visualização · B · `VIEW-letra`** `[5-content-visualizacao/telas.html#VIEW-letra; README-design §2.4, §5.6]`. Em B (711 px), o estado *letra · notas vazias* é a moldura B da seção `VIEW-letra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R149 — Content — visualização · C · `VIEW-tab`** `[5-content-visualizacao/telas.html#VIEW-tab; README-design §2.4, §5.6]`. Em C (1138 px), o estado *tab* é a moldura C da seção `VIEW-tab`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R150 — Content — visualização · B · `VIEW-tab`** `[5-content-visualizacao/telas.html#VIEW-tab; README-design §2.4, §5.6]`. Em B (711 px), o estado *tab* é a moldura B da seção `VIEW-tab`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R151 — Content — visualização · C · `VIEW-partitura`** `[5-content-visualizacao/telas.html#VIEW-partitura; README-design §2.4, §5.6]`. Em C (1138 px), o estado *partitura · visualizador de PDF* é a moldura C da seção `VIEW-partitura`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R152 — Content — visualização · B · `VIEW-partitura`** `[5-content-visualizacao/telas.html#VIEW-partitura; README-design §2.4, §5.6]`. Em B (711 px), o estado *partitura · visualizador de PDF* é a moldura B da seção `VIEW-partitura`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R153 — Content — visualização · C · `VIEW-partitura-cheia`** `[5-content-visualizacao/telas.html#VIEW-partitura-cheia; README-design §2.4, §5.6]`. Em C (1138 px), o estado *partitura · tela cheia* é a moldura C da seção `VIEW-partitura-cheia`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R154 — Content — visualização · B · `VIEW-partitura-cheia`** `[5-content-visualizacao/telas.html#VIEW-partitura-cheia; README-design §2.4, §5.6]`. Em B (711 px), o estado *partitura · tela cheia* é a moldura B da seção `VIEW-partitura-cheia`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R155 — Content — visualização · C · `VIEW-carregando-pdf`** `[5-content-visualizacao/telas.html#VIEW-carregando-pdf; README-design §2.4, §5.6]`. Em C (1138 px), o estado *partitura · carregando o PDF* é a moldura C da seção `VIEW-carregando-pdf`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R156 — Content — visualização · B · `VIEW-carregando-pdf`** `[5-content-visualizacao/telas.html#VIEW-carregando-pdf; README-design §2.4, §5.6]`. Em B (711 px), o estado *partitura · carregando o PDF* é a moldura B da seção `VIEW-carregando-pdf`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R157 — Content — visualização · C · `VIEW-vazio-partitura`** `[5-content-visualizacao/telas.html#VIEW-vazio-partitura; README-design §2.4, §5.6]`. Em C (1138 px), o estado *partitura · vazia* é a moldura C da seção `VIEW-vazio-partitura`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R158 — Content — visualização · B · `VIEW-vazio-partitura`** `[5-content-visualizacao/telas.html#VIEW-vazio-partitura; README-design §2.4, §5.6]`. Em B (711 px), o estado *partitura · vazia* é a moldura B da seção `VIEW-vazio-partitura`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R159 — Content — visualização · C · `VIEW-vazio-letra`** `[5-content-visualizacao/telas.html#VIEW-vazio-letra; README-design §2.4, §5.6]`. Em C (1138 px), o estado *letra · vazia* é a moldura C da seção `VIEW-vazio-letra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R160 — Content — visualização · B · `VIEW-vazio-letra`** `[5-content-visualizacao/telas.html#VIEW-vazio-letra; README-design §2.4, §5.6]`. Em B (711 px), o estado *letra · vazia* é a moldura B da seção `VIEW-vazio-letra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R161 — Content — visualização · C · `VIEW-vazio-tab`** `[5-content-visualizacao/telas.html#VIEW-vazio-tab; README-design §2.4, §5.6]`. Em C (1138 px), o estado *tab · vazia* é a moldura C da seção `VIEW-vazio-tab`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R162 — Content — visualização · B · `VIEW-vazio-tab`** `[5-content-visualizacao/telas.html#VIEW-vazio-tab; README-design §2.4, §5.6]`. Em B (711 px), o estado *tab · vazia* é a moldura B da seção `VIEW-vazio-tab`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R163 — Content — visualização · C · `VIEW-vazio-cifra`** `[5-content-visualizacao/telas.html#VIEW-vazio-cifra; README-design §2.4, §5.6]`. Em C (1138 px), o estado *cifra · vazia* é a moldura C da seção `VIEW-vazio-cifra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R164 — Content — visualização · B · `VIEW-vazio-cifra`** `[5-content-visualizacao/telas.html#VIEW-vazio-cifra; README-design §2.4, §5.6]`. Em B (711 px), o estado *cifra · vazia* é a moldura B da seção `VIEW-vazio-cifra`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R165 — Content — visualização · C · `VIEW-erro-formato`** `[5-content-visualizacao/telas.html#VIEW-erro-formato; README-design §2.4, §5.6]`. Em C (1138 px), o estado *erro · formato* é a moldura C da seção `VIEW-erro-formato`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R166 — Content — visualização · B · `VIEW-erro-formato`** `[5-content-visualizacao/telas.html#VIEW-erro-formato; README-design §2.4, §5.6]`. Em B (711 px), o estado *erro · formato* é a moldura B da seção `VIEW-erro-formato`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R167 — Content — visualização · C · `VIEW-erro-pdf`** `[5-content-visualizacao/telas.html#VIEW-erro-pdf; README-design §2.4, §5.6]`. Em C (1138 px), o estado *erro · PDF* é a moldura C da seção `VIEW-erro-pdf`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R168 — Content — visualização · B · `VIEW-erro-pdf`** `[5-content-visualizacao/telas.html#VIEW-erro-pdf; README-design §2.4, §5.6]`. Em B (711 px), o estado *erro · PDF* é a moldura B da seção `VIEW-erro-pdf`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R169 — Content — visualização · C · `VIEW-erro-render`** `[5-content-visualizacao/telas.html#VIEW-erro-render; README-design §2.4, §5.6]`. Em C (1138 px), o estado *erro · render* é a moldura C da seção `VIEW-erro-render`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R170 — Content — visualização · B · `VIEW-erro-render`** `[5-content-visualizacao/telas.html#VIEW-erro-render; README-design §2.4, §5.6]`. Em B (711 px), o estado *erro · render* é a moldura B da seção `VIEW-erro-render`: composição, tokens da §2.4 e frases da §5.6. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Content — editor — `6-content-editor/telas.html` · T-I1-R171 … T-I1-R200 (15 estados × C, B)

**T-I1-R171 — Content — editor · C · `EDIT-cifra`** `[6-content-editor/telas.html#EDIT-cifra; README-design §2.4, §5.7]`. Em C (1138 px), o estado *cifra · com alterações* é a moldura C da seção `EDIT-cifra`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R172 — Content — editor · B · `EDIT-cifra`** `[6-content-editor/telas.html#EDIT-cifra; README-design §2.4, §5.7]`. Em B (711 px), o estado *cifra · com alterações* é a moldura B da seção `EDIT-cifra`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R173 — Content — editor · C · `EDIT-sem-mudancas`** `[6-content-editor/telas.html#EDIT-sem-mudancas; README-design §2.4, §5.7]`. Em C (1138 px), o estado *cifra · nada mudou* é a moldura C da seção `EDIT-sem-mudancas`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R174 — Content — editor · B · `EDIT-sem-mudancas`** `[6-content-editor/telas.html#EDIT-sem-mudancas; README-design §2.4, §5.7]`. Em B (711 px), o estado *cifra · nada mudou* é a moldura B da seção `EDIT-sem-mudancas`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R175 — Content — editor · C · `EDIT-salvando`** `[6-content-editor/telas.html#EDIT-salvando; README-design §2.4, §5.7]`. Em C (1138 px), o estado *cifra · salvando* é a moldura C da seção `EDIT-salvando`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R176 — Content — editor · B · `EDIT-salvando`** `[6-content-editor/telas.html#EDIT-salvando; README-design §2.4, §5.7]`. Em B (711 px), o estado *cifra · salvando* é a moldura B da seção `EDIT-salvando`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R177 — Content — editor · C · `EDIT-tab`** `[6-content-editor/telas.html#EDIT-tab; README-design §2.4, §5.7]`. Em C (1138 px), o estado *tab* é a moldura C da seção `EDIT-tab`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R178 — Content — editor · B · `EDIT-tab`** `[6-content-editor/telas.html#EDIT-tab; README-design §2.4, §5.7]`. Em B (711 px), o estado *tab* é a moldura B da seção `EDIT-tab`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R179 — Content — editor · C · `EDIT-letra`** `[6-content-editor/telas.html#EDIT-letra; README-design §2.4, §5.7]`. Em C (1138 px), o estado *letra* é a moldura C da seção `EDIT-letra`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R180 — Content — editor · B · `EDIT-letra`** `[6-content-editor/telas.html#EDIT-letra; README-design §2.4, §5.7]`. Em B (711 px), o estado *letra* é a moldura B da seção `EDIT-letra`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R181 — Content — editor · C · `EDIT-carregando-auth`** `[6-content-editor/telas.html#EDIT-carregando-auth; README-design §2.4, §5.7]`. Em C (1138 px), o estado *carregando · sessão* é a moldura C da seção `EDIT-carregando-auth`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R182 — Content — editor · B · `EDIT-carregando-auth`** `[6-content-editor/telas.html#EDIT-carregando-auth; README-design §2.4, §5.7]`. Em B (711 px), o estado *carregando · sessão* é a moldura B da seção `EDIT-carregando-auth`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R183 — Content — editor · C · `EDIT-carregando`** `[6-content-editor/telas.html#EDIT-carregando; README-design §2.4, §5.7]`. Em C (1138 px), o estado *carregando · conteúdo* é a moldura C da seção `EDIT-carregando`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R184 — Content — editor · B · `EDIT-carregando`** `[6-content-editor/telas.html#EDIT-carregando; README-design §2.4, §5.7]`. Em B (711 px), o estado *carregando · conteúdo* é a moldura B da seção `EDIT-carregando`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R185 — Content — editor · C · `EDIT-carregando-editor`** `[6-content-editor/telas.html#EDIT-carregando-editor; README-design §2.4, §5.7]`. Em C (1138 px), o estado *carregando · editor* é a moldura C da seção `EDIT-carregando-editor`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R186 — Content — editor · B · `EDIT-carregando-editor`** `[6-content-editor/telas.html#EDIT-carregando-editor; README-design §2.4, §5.7]`. Em B (711 px), o estado *carregando · editor* é a moldura B da seção `EDIT-carregando-editor`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R187 — Content — editor · C · `EDIT-sem-usuario`** `[6-content-editor/telas.html#EDIT-sem-usuario; README-design §2.4, §5.7]`. Em C (1138 px), o estado *sem usuário · carregando* é a moldura C da seção `EDIT-sem-usuario`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R188 — Content — editor · B · `EDIT-sem-usuario`** `[6-content-editor/telas.html#EDIT-sem-usuario; README-design §2.4, §5.7]`. Em B (711 px), o estado *sem usuário · carregando* é a moldura B da seção `EDIT-sem-usuario`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R189 — Content — editor · C · `EDIT-erro-rede`** `[6-content-editor/telas.html#EDIT-erro-rede; README-design §2.4, §5.7]`. Em C (1138 px), o estado *erro de carga · rede* é a moldura C da seção `EDIT-erro-rede`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R190 — Content — editor · B · `EDIT-erro-rede`** `[6-content-editor/telas.html#EDIT-erro-rede; README-design §2.4, §5.7]`. Em B (711 px), o estado *erro de carga · rede* é a moldura B da seção `EDIT-erro-rede`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R191 — Content — editor · C · `EDIT-erro-auth`** `[6-content-editor/telas.html#EDIT-erro-auth; README-design §2.4, §5.7]`. Em C (1138 px), o estado *erro de carga · 401* é a moldura C da seção `EDIT-erro-auth`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R192 — Content — editor · B · `EDIT-erro-auth`** `[6-content-editor/telas.html#EDIT-erro-auth; README-design §2.4, §5.7]`. Em B (711 px), o estado *erro de carga · 401* é a moldura B da seção `EDIT-erro-auth`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R193 — Content — editor · C · `EDIT-erro-limite`** `[6-content-editor/telas.html#EDIT-erro-limite; README-design §2.4, §5.7]`. Em C (1138 px), o estado *erro de carga · 429* é a moldura C da seção `EDIT-erro-limite`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R194 — Content — editor · B · `EDIT-erro-limite`** `[6-content-editor/telas.html#EDIT-erro-limite; README-design §2.4, §5.7]`. Em B (711 px), o estado *erro de carga · 429* é a moldura B da seção `EDIT-erro-limite`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R195 — Content — editor · C · `EDIT-erro-servidor`** `[6-content-editor/telas.html#EDIT-erro-servidor; README-design §2.4, §5.7]`. Em C (1138 px), o estado *erro de carga · 5xx* é a moldura C da seção `EDIT-erro-servidor`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R196 — Content — editor · B · `EDIT-erro-servidor`** `[6-content-editor/telas.html#EDIT-erro-servidor; README-design §2.4, §5.7]`. Em B (711 px), o estado *erro de carga · 5xx* é a moldura B da seção `EDIT-erro-servidor`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R197 — Content — editor · C · `EDIT-404`** `[6-content-editor/telas.html#EDIT-404; README-design §2.4, §5.7]`. Em C (1138 px), o estado *não existe* é a moldura C da seção `EDIT-404`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R198 — Content — editor · B · `EDIT-404`** `[6-content-editor/telas.html#EDIT-404; README-design §2.4, §5.7]`. Em B (711 px), o estado *não existe* é a moldura B da seção `EDIT-404`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R199 — Content — editor · C · `EDIT-salvar-erro`** `[6-content-editor/telas.html#EDIT-salvar-erro; README-design §2.4, §5.7]`. Em C (1138 px), o estado *erro ao salvar* é a moldura C da seção `EDIT-salvar-erro`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R200 — Content — editor · B · `EDIT-salvar-erro`** `[6-content-editor/telas.html#EDIT-salvar-erro; README-design §2.4, §5.7]`. Em B (711 px), o estado *erro ao salvar* é a moldura B da seção `EDIT-salvar-erro`: composição, tokens da §2.4 e frases da §5.7. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Upload — `7-upload/telas.html` · T-I1-R201 … T-I1-R242 (21 estados × C, B; 1 por errata)

**T-I1-R201 — Upload · C · `UP-carregando`** `[7-upload/telas.html#UP-carregando; README-design §2.4, §5.8]`. Em C (1138 px), o estado *carregando · sessão e página* é a moldura C da seção `UP-carregando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R202 — Upload · B · `UP-carregando`** `[7-upload/telas.html#UP-carregando; README-design §2.4, §5.8]`. Em B (711 px), o estado *carregando · sessão e página* é a moldura B da seção `UP-carregando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R203 — Upload · C · `UP-como`** `[7-upload/telas.html#UP-como; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 1 · como* é a moldura C da seção `UP-como`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R204 — Upload · B · `UP-como`** `[7-upload/telas.html#UP-como; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 1 · como* é a moldura B da seção `UP-como`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R205 — Upload · C · `UP-arquivo`** `[7-upload/telas.html#UP-arquivo; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · zona de arquivo* é a moldura C da seção `UP-arquivo`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R206 — Upload · B · `UP-arquivo`** `[7-upload/telas.html#UP-arquivo; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · zona de arquivo* é a moldura B da seção `UP-arquivo`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R207 — Upload · C · `UP-enviando`** `[7-upload/telas.html#UP-enviando; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · enviando* é a moldura C da seção `UP-enviando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R208 — Upload · B · `UP-enviando`** `[7-upload/telas.html#UP-enviando; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · enviando* é a moldura B da seção `UP-enviando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R209 — Upload · C · `UP-extensao`** `[7-upload/telas.html#UP-extensao; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · tipo não aceito* é a moldura C da seção `UP-extensao`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R210 — Upload · B · `UP-extensao`** `[7-upload/telas.html#UP-extensao; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · tipo não aceito* é a moldura B da seção `UP-extensao`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R211 — Upload · C · `UP-limite`** `[7-upload/telas.html#UP-limite; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · passou de 4 MiB* é a moldura C da seção `UP-limite`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R212 — Upload · B · `UP-limite`** `[7-upload/telas.html#UP-limite; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · passou de 4 MiB* é a moldura B da seção `UP-limite`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R213 — Upload · C · `UP-envio-rede`** `[7-upload/telas.html#UP-envio-rede; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · erro de envio (rede)* é a moldura C da seção `UP-envio-rede`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R214 — Upload · B · `UP-envio-rede`** `[7-upload/telas.html#UP-envio-rede; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · erro de envio (rede)* é a moldura B da seção `UP-envio-rede`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R215 — Upload · C · `UP-envio-servidor`** `[7-upload/telas.html#UP-envio-servidor; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · erro de envio (401 · 429 · 5xx)* é a moldura C da seção `UP-envio-servidor`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R216 — Upload · B · `UP-envio-servidor`** `[7-upload/telas.html#UP-envio-servidor; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · erro de envio (401 · 429 · 5xx)* é a moldura B da seção `UP-envio-servidor`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R217 — Upload · C · `UP-detalhes`** `[7-upload/telas.html#UP-detalhes; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · detalhes* é a moldura C da seção `UP-detalhes`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R218 — Upload · B · `UP-detalhes`** `[7-upload/telas.html#UP-detalhes; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · detalhes* é a moldura B da seção `UP-detalhes`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R219 — Upload · C · `UP-detalhes-inativo`** `[7-upload/telas.html#UP-detalhes-inativo; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · sem título ou artista* é a moldura C da seção `UP-detalhes-inativo`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R220 — Upload · B · `UP-detalhes-inativo`** `[7-upload/telas.html#UP-detalhes-inativo; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · sem título ou artista* é a moldura B da seção `UP-detalhes-inativo`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R221 — Upload · C · `UP-salvando`** `[7-upload/telas.html#UP-salvando; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · salvando* é a moldura C da seção `UP-salvando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R222 — Upload · B · `UP-salvando`** `[7-upload/telas.html#UP-salvando; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · salvando* é a moldura B da seção `UP-salvando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R223 — Upload · C · `UP-salvar-erro`** `[7-upload/telas.html#UP-salvar-erro; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 2 · erro ao salvar* é a moldura C da seção `UP-salvar-erro`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R224 — Upload · B · `UP-salvar-erro`** `[7-upload/telas.html#UP-salvar-erro; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 2 · erro ao salvar* é a moldura B da seção `UP-salvar-erro`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R225 — Upload · C · `UP-criar`** `[7-upload/telas.html#UP-criar; README-design §2.4, §5.8]`. Em C (1138 px), o estado *criar do zero · título* é a moldura C da seção `UP-criar`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R226 — Upload · B · `UP-criar`** `[7-upload/telas.html#UP-criar; README-design §2.4, §5.8]`. Em B (711 px), o estado *criar do zero · título* é a moldura B da seção `UP-criar`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R227 — Upload · C · `UP-criar-validacao`** `[7-upload/telas.html#UP-criar-validacao; README-design §2.4, §5.8]`. Em C (1138 px), o estado *criar do zero · título vazio* é a moldura C da seção `UP-criar-validacao`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R228 — Upload · B · `UP-criar-validacao`** `[7-upload/telas.html#UP-criar-validacao; README-design §2.4, §5.8]`. Em B (711 px), o estado *criar do zero · título vazio* é a moldura B da seção `UP-criar-validacao`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R229 — Upload · C · `UP-lote`** `[7-upload/telas.html#UP-lote; README-design §2.4, §5.8]`. Em C (1138 px), o estado *lote · prévia* é a moldura C da seção `UP-lote`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R230 — Upload · B · `UP-lote`** `[7-upload/telas.html#UP-lote; README-design §2.4, §5.8]`. Em B (711 px), o estado *lote · prévia* é a moldura B da seção `UP-lote`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R231 — Upload · C · `UP-lote-lendo`** `[por errata I1-E2; 7-upload/telas.html — sem seção; README-design §2.4, §5.1, §5.8]`. **Por errata I1-E2** (§2.2). Em C (1138 px), o estado *lote · lendo o arquivo* não tem moldura na folha: vale o que a errata I1-E2 descreve, com a composição da moldura C que ela cita. *Aceite*: G-faixa em 1138 px contra a errata I1-E2 (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R232 — Upload · B · `UP-lote-lendo`** `[por errata I1-E2; 7-upload/telas.html — sem seção; README-design §2.4, §5.1, §5.8]`. **Por errata I1-E2** (§2.2). Em B (711 px), o estado *lote · lendo o arquivo* não tem moldura na folha: vale o que a errata I1-E2 descreve, com a composição da moldura B que ela cita. *Aceite*: G-faixa em 711 px contra a errata I1-E2 (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R233 — Upload · C · `UP-lote-importando`** `[7-upload/telas.html#UP-lote-importando; README-design §2.4, §5.8]`. Em C (1138 px), o estado *lote · importando* é a moldura C da seção `UP-lote-importando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R234 — Upload · B · `UP-lote-importando`** `[7-upload/telas.html#UP-lote-importando; README-design §2.4, §5.8]`. Em B (711 px), o estado *lote · importando* é a moldura B da seção `UP-lote-importando`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R235 — Upload · C · `UP-lote-erro`** `[7-upload/telas.html#UP-lote-erro; README-design §2.4, §5.8]`. Em C (1138 px), o estado *lote · erro ao importar* é a moldura C da seção `UP-lote-erro`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R236 — Upload · B · `UP-lote-erro`** `[7-upload/telas.html#UP-lote-erro; README-design §2.4, §5.8]`. Em B (711 px), o estado *lote · erro ao importar* é a moldura B da seção `UP-lote-erro`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R237 — Upload · C · `UP-lote-vazio`** `[7-upload/telas.html#UP-lote-vazio; README-design §2.4, §5.8]`. Em C (1138 px), o estado *lote · nenhuma música no arquivo* é a moldura C da seção `UP-lote-vazio`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R238 — Upload · B · `UP-lote-vazio`** `[7-upload/telas.html#UP-lote-vazio; README-design §2.4, §5.8]`. Em B (711 px), o estado *lote · nenhuma música no arquivo* é a moldura B da seção `UP-lote-vazio`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R239 — Upload · C · `UP-lote-sucesso`** `[7-upload/telas.html#UP-lote-sucesso; README-design §2.4, §5.8]`. Em C (1138 px), o estado *lote · importado* é a moldura C da seção `UP-lote-sucesso`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R240 — Upload · B · `UP-lote-sucesso`** `[7-upload/telas.html#UP-lote-sucesso; README-design §2.4, §5.8]`. Em B (711 px), o estado *lote · importado* é a moldura B da seção `UP-lote-sucesso`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R241 — Upload · C · `UP-pronto`** `[7-upload/telas.html#UP-pronto; README-design §2.4, §5.8]`. Em C (1138 px), o estado *passo 3 · pronto* é a moldura C da seção `UP-pronto`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R242 — Upload · B · `UP-pronto`** `[7-upload/telas.html#UP-pronto; README-design §2.4, §5.8]`. Em B (711 px), o estado *passo 3 · pronto* é a moldura B da seção `UP-pronto`: composição, tokens da §2.4 e frases da §5.8. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

### Setlists — `8-setlists/telas.html` · T-I1-R243 … T-I1-R282 (20 estados × C, B)

**T-I1-R243 — Setlists · C · `SET`** `[8-setlists/telas.html#SET; README-design §2.4, §5.9]`. Em C (1138 px), o estado *lista + setlist aberta* é a moldura C da seção `SET`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R244 — Setlists · B · `SET`** `[8-setlists/telas.html#SET; README-design §2.4, §5.9]`. Em B (711 px), o estado *lista + setlist aberta* é a moldura B da seção `SET`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R245 — Setlists · C · `SET-nenhuma`** `[8-setlists/telas.html#SET-nenhuma; README-design §2.4, §5.9]`. Em C (1138 px), o estado *nenhuma setlist aberta* é a moldura C da seção `SET-nenhuma`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R246 — Setlists · B · `SET-nenhuma`** `[8-setlists/telas.html#SET-nenhuma; README-design §2.4, §5.9]`. Em B (711 px), o estado *nenhuma setlist aberta* é a moldura B da seção `SET-nenhuma`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R247 — Setlists · C · `SET-carregando`** `[8-setlists/telas.html#SET-carregando; README-design §2.4, §5.9]`. Em C (1138 px), o estado *carregando · sessão e página* é a moldura C da seção `SET-carregando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R248 — Setlists · B · `SET-carregando`** `[8-setlists/telas.html#SET-carregando; README-design §2.4, §5.9]`. Em B (711 px), o estado *carregando · sessão e página* é a moldura B da seção `SET-carregando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R249 — Setlists · C · `SET-carregando-dados`** `[8-setlists/telas.html#SET-carregando-dados; README-design §2.4, §5.9]`. Em C (1138 px), o estado *carregando · dados* é a moldura C da seção `SET-carregando-dados`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R250 — Setlists · B · `SET-carregando-dados`** `[8-setlists/telas.html#SET-carregando-dados; README-design §2.4, §5.9]`. Em B (711 px), o estado *carregando · dados* é a moldura B da seção `SET-carregando-dados`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R251 — Setlists · C · `SET-vazio`** `[8-setlists/telas.html#SET-vazio; README-design §2.4, §5.9]`. Em C (1138 px), o estado *vazio* é a moldura C da seção `SET-vazio`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R252 — Setlists · B · `SET-vazio`** `[8-setlists/telas.html#SET-vazio; README-design §2.4, §5.9]`. Em B (711 px), o estado *vazio* é a moldura B da seção `SET-vazio`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R253 — Setlists · C · `SET-erro`** `[8-setlists/telas.html#SET-erro; README-design §2.4, §5.9]`. Em C (1138 px), o estado *erro sem cópia* é a moldura C da seção `SET-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R254 — Setlists · B · `SET-erro`** `[8-setlists/telas.html#SET-erro; README-design §2.4, §5.9]`. Em B (711 px), o estado *erro sem cópia* é a moldura B da seção `SET-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R255 — Setlists · C · `SET-criar`** `[8-setlists/telas.html#SET-criar; README-design §2.4, §5.9]`. Em C (1138 px), o estado *criar · formulário* é a moldura C da seção `SET-criar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R256 — Setlists · B · `SET-criar`** `[8-setlists/telas.html#SET-criar; README-design §2.4, §5.9]`. Em B (711 px), o estado *criar · formulário* é a moldura B da seção `SET-criar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R257 — Setlists · C · `SET-criar-validacao`** `[8-setlists/telas.html#SET-criar-validacao; README-design §2.4, §5.9]`. Em C (1138 px), o estado *criar · nome vazio* é a moldura C da seção `SET-criar-validacao`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R258 — Setlists · B · `SET-criar-validacao`** `[8-setlists/telas.html#SET-criar-validacao; README-design §2.4, §5.9]`. Em B (711 px), o estado *criar · nome vazio* é a moldura B da seção `SET-criar-validacao`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R259 — Setlists · C · `SET-criar-salvando`** `[8-setlists/telas.html#SET-criar-salvando; README-design §2.4, §5.9]`. Em C (1138 px), o estado *criar · salvando* é a moldura C da seção `SET-criar-salvando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R260 — Setlists · B · `SET-criar-salvando`** `[8-setlists/telas.html#SET-criar-salvando; README-design §2.4, §5.9]`. Em B (711 px), o estado *criar · salvando* é a moldura B da seção `SET-criar-salvando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R261 — Setlists · C · `SET-criar-erro`** `[8-setlists/telas.html#SET-criar-erro; README-design §2.4, §5.9]`. Em C (1138 px), o estado *criar · falhou* é a moldura C da seção `SET-criar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R262 — Setlists · B · `SET-criar-erro`** `[8-setlists/telas.html#SET-criar-erro; README-design §2.4, §5.9]`. Em B (711 px), o estado *criar · falhou* é a moldura B da seção `SET-criar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R263 — Setlists · C · `SET-apagar`** `[8-setlists/telas.html#SET-apagar; README-design §2.4, §5.9]`. Em C (1138 px), o estado *apagar · confirmar* é a moldura C da seção `SET-apagar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R264 — Setlists · B · `SET-apagar`** `[8-setlists/telas.html#SET-apagar; README-design §2.4, §5.9]`. Em B (711 px), o estado *apagar · confirmar* é a moldura B da seção `SET-apagar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R265 — Setlists · C · `SET-apagar-erro`** `[8-setlists/telas.html#SET-apagar-erro; README-design §2.4, §5.9]`. Em C (1138 px), o estado *apagar · falhou* é a moldura C da seção `SET-apagar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R266 — Setlists · B · `SET-apagar-erro`** `[8-setlists/telas.html#SET-apagar-erro; README-design §2.4, §5.9]`. Em B (711 px), o estado *apagar · falhou* é a moldura B da seção `SET-apagar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R267 — Setlists · C · `SET-ja-apagada`** `[8-setlists/telas.html#SET-ja-apagada; README-design §2.4, §5.9]`. Em C (1138 px), o estado *apagar · já tinha sido apagada* é a moldura C da seção `SET-ja-apagada`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R268 — Setlists · B · `SET-ja-apagada`** `[8-setlists/telas.html#SET-ja-apagada; README-design §2.4, §5.9]`. Em B (711 px), o estado *apagar · já tinha sido apagada* é a moldura B da seção `SET-ja-apagada`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R269 — Setlists · C · `SET-sem-musicas`** `[8-setlists/telas.html#SET-sem-musicas; README-design §2.4, §5.9]`. Em C (1138 px), o estado *setlist sem músicas* é a moldura C da seção `SET-sem-musicas`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R270 — Setlists · B · `SET-sem-musicas`** `[8-setlists/telas.html#SET-sem-musicas; README-design §2.4, §5.9]`. Em B (711 px), o estado *setlist sem músicas* é a moldura B da seção `SET-sem-musicas`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R271 — Setlists · C · `SET-adicionar`** `[8-setlists/telas.html#SET-adicionar; README-design §2.4, §5.9]`. Em C (1138 px), o estado *adicionar · escolher* é a moldura C da seção `SET-adicionar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R272 — Setlists · B · `SET-adicionar`** `[8-setlists/telas.html#SET-adicionar; README-design §2.4, §5.9]`. Em B (711 px), o estado *adicionar · escolher* é a moldura B da seção `SET-adicionar`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R273 — Setlists · C · `SET-adicionar-vazio`** `[8-setlists/telas.html#SET-adicionar-vazio; README-design §2.4, §5.9]`. Em C (1138 px), o estado *adicionar · nada disponível* é a moldura C da seção `SET-adicionar-vazio`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R274 — Setlists · B · `SET-adicionar-vazio`** `[8-setlists/telas.html#SET-adicionar-vazio; README-design §2.4, §5.9]`. Em B (711 px), o estado *adicionar · nada disponível* é a moldura B da seção `SET-adicionar-vazio`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R275 — Setlists · C · `SET-adicionar-busca`** `[8-setlists/telas.html#SET-adicionar-busca; README-design §2.4, §5.9]`. Em C (1138 px), o estado *adicionar · busca sem resultado* é a moldura C da seção `SET-adicionar-busca`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R276 — Setlists · B · `SET-adicionar-busca`** `[8-setlists/telas.html#SET-adicionar-busca; README-design §2.4, §5.9]`. Em B (711 px), o estado *adicionar · busca sem resultado* é a moldura B da seção `SET-adicionar-busca`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R277 — Setlists · C · `SET-adicionar-enviando`** `[8-setlists/telas.html#SET-adicionar-enviando; README-design §2.4, §5.9]`. Em C (1138 px), o estado *adicionar · adicionando* é a moldura C da seção `SET-adicionar-enviando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R278 — Setlists · B · `SET-adicionar-enviando`** `[8-setlists/telas.html#SET-adicionar-enviando; README-design §2.4, §5.9]`. Em B (711 px), o estado *adicionar · adicionando* é a moldura B da seção `SET-adicionar-enviando`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R279 — Setlists · C · `SET-adicionar-erro`** `[8-setlists/telas.html#SET-adicionar-erro; README-design §2.4, §5.9]`. Em C (1138 px), o estado *adicionar · falhou* é a moldura C da seção `SET-adicionar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R280 — Setlists · B · `SET-adicionar-erro`** `[8-setlists/telas.html#SET-adicionar-erro; README-design §2.4, §5.9]`. Em B (711 px), o estado *adicionar · falhou* é a moldura B da seção `SET-adicionar-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R281 — Setlists · C · `SET-remover-erro`** `[8-setlists/telas.html#SET-remover-erro; README-design §2.4, §5.9]`. Em C (1138 px), o estado *remover · falhou* é a moldura C da seção `SET-remover-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 1138 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

**T-I1-R282 — Setlists · B · `SET-remover-erro`** `[8-setlists/telas.html#SET-remover-erro; README-design §2.4, §5.9]`. Em B (711 px), o estado *remover · falhou* é a moldura B da seção `SET-remover-erro`: composição, tokens da §2.4 e frases da §5.9. *Aceite*: G-faixa em 711 px contra a seção (I1-D13, I1-D16) + inventário por estado (I1-D12, errata).

## 5 · Frases

A lista declarada da **I1-D10** e da **I1-D17** é o [`README-design.md` §5](README-design.md) — por superfície, no
formato `chave · texto pt-BR · frase de hoje`, com as nove novas no §5.10 (N1, N2, N4, N5, N6, N7, N8, N10, N12).
**Uma fonte só**: não se copia aqui. As PRs de tela entregam as frases dela a partir dessa lista; a `/privacy-policy`
não se traduz (I1-D19, §5.4 do README-design).

### 5.1 Frases novas aprovadas depois do congelamento (I1-D10)

O README-design não muda; as frases que as PRs de tela propõem e o Marcel aprova ficam aqui, com a origem:

| PR | frases | aval | onde estão |
|---|---|---|---|
| I1-PR-9 | *artista desconhecido* · *Favoritar “{título}”* / *Tirar “{título}” das favoritas* (nomes acessíveis) · os 12 meses da data curta (*jan* … *dez*) | commit 1, item 11 (divs. 706–708) | `components/library/frases-lista.ts`; `docs/ux/I1-PR9-anexos/README.md` §12.2 |
| I1-PR-10 | *Diminuir o zoom* · *Aumentar o zoom* (nomes acessíveis) · *capo: nenhum* · *afinação: padrão (EADGBE)* · *{n}ª casa* · os rótulos de campo *álbum*, *dificuldade*, *gênero*, *tom*, *compasso*, *andamento* (+ *{x} BPM*), *etiquetas*, *criado*, *alterado* · e a composta *não foi possível abrir o arquivo — {motivo}* (a falha da imagem, item 9) | commit 1, itens 9 e 13 (divs. 741, 747, 748) | `components/content/frases-visualizacao.ts`; `docs/ux/I1-PR10-anexos/README.md` |
| I1-PR-11 | os placeholders *casa* (capo) · *álbum ou coleção* · *escolha o gênero* · *escolha* · *adicionar tag* · *notas sobre este conteúdo* · *ex.: Verso 1, Refrão* · a forma da prévia *tom: {x} · capo: {x} · BPM: {x}* / *afinação: {x} · …* · *este conteúdo não existe mais* (o 404 ao salvar) · *o servidor recusou os dados* (§5.1, no salvar) · os nomes acessíveis *Remover seção* · *Duplicar compasso* · *Remover compasso* · *corda {n} do compasso {m}* · *Adicionar tag* · *Tirar a tag “{x}”* · os 16 gêneros em pt-BR · *Especialista* · *alterações salvas* (`edit.salvo`, §5.5, agora dita pela biblioteca) · e, na forma composta, os motivos com **vírgula** (*o servidor não aceitou a sessão, entre de novo* · *muitas tentativas, tente de novo em instantes* — a folha; a forma com travessão da lista da PR-9 é herança de harmonização) | commit 1, itens 11 e 12 (divs. 782, 783) | `components/editors/frases-editor.ts`; `docs/ux/I1-PR11-anexos/README.md` §3 |
| I1-PR-12 | *PDF, DOCX, TXT ou imagem* (o apoio do importar) · *{n} músicas encontradas em {arquivo}* (e *1 música encontrada em {arquivo}*) · *1 música importada* (o singular de `up.lote.ok`) · a forma *{nome} · {tamanho}* com o tamanho em MiB de uma casa e vírgula (*1,8 MiB*; KiB e B abaixo de 0,1 MiB) · os placeholders *título da música* · *nome do artista* · *nome do álbum* · *gênero* · *ano* · *notas ou comentários* · *artista* · a lista com *ou* no último (*use .pdf, .docx ou .txt*) · *passo {n} de 3* (o nome acessível dos passos, da folha) · os nomes acessíveis do lote *Incluir “{título}”* · *título da música {n}* · *artista de “{título}”* · *corpo de “{título}”* · *o servidor recusou os dados* no envio (o 400 que não é o tamanho) · o reuso, nas Opções avançadas, dos rótulos da §5.7 (*Tom* · *BPM* · *Dificuldade* · *Capo* · *Afinação* · *Compasso* · *Favorita* · *escolha* · *casa*) | commit 1, item 15 (div. 830) | `components/upload/frases-upload.ts`; `docs/ux/I1-PR12-anexos/README.md` §3 |

## 6 · A conferência — §2 (a)–(f) do prompt

`[medido]` — da raiz da árvore, Node v22.23.1:

```
node --no-warnings docs/ux/DESIGN-I1/conferencia/conferir.mjs
```

No commit 1 **saiu 1**, com 18 achados que viraram as divergências da §7. Resumo abaixo; a rodada do commit 2,
depois das erratas, está na §6.3 e é a que o [`conferencia/saida.txt`](conferencia/saida.txt) guarda hoje. Resumo do commit 1:

| item | o que se conferiu | contagem | esperado | resultado |
| --- | --- | --- | --- | --- |
| (a) cores | todo `#rrggbb` das nove folhas ∈ os 15 valores do `theme.ts` (dark ∪ light) | **13 583** ocorrências, **11** distintos, **0 fora**; `rgba()`: 2 formas (`accent` a .12, `bg` a .82), **0 fora** | 0 | ✓ — a folha 5 usa também `light.muted` (#5E5A6A) na página do PDF, declarado no inventário dela |
| (b) px | todo `Npx` de cada folha no inventário da própria folha; inventário = §2.3; linha "Medidas em px" do §2.4 = arquivo; cada declaração resolve contra o `theme.ts`, o bloco `web` ou conta | **0 px sem declaração** nas nove; **2 entradas sem px** (landing: 2 e 3, "undefined"); **1 declaração sem origem** (20, "entrelinha da LinhaDeAviso", em 8 folhas e no §2.3); §2.4 × arquivo: **0** diferenças | 0 | ✗ — divs. **584**, **585** |
| (c) ícones, por nome | os nomes do §6 do README-design ∈ `apps/native/src/icones/dados.ts` | 28 nomes: **27 ∈ dados.ts**, **1 fora** (`visto`); + voltar espelhado (variante) e marca do Google (asset), declarados | 0 além dos dois | ✗ — div. **588** |
| (c) ícones, por forma | todo `<svg>` das folhas contra os desenhos do `dados.ts` (normal · inerte · em20) | 30 formas: 26 do mapa, voltar espelhado (declarado), tab de 20 das folhas (declarada, resposta 29), **2 fora**: o visto (50×) e um garantida de r 8,5 (10×) | — | ✗ — divs. **588**, **589** |
| (d) faixas | toda seção de estado tem as molduras C (1138) e B (711) | 141 de 141 | todas | ✓ |
| (d) contagem | `<section data-estado>` × §2.4 | 7 folhas com **uma a mais** (`Tokens`); folhas 2 e 3 **sem** seção a mais | uma a mais em cada | ✗ — divs. **582**, **583** |
| (d) matriz | linhas da `matriz-estados.txt` × seções (tabela abaixo) | 179 linhas de estado, todas cruzadas; **1 alcançável sem seção nem decisão** (parse do lote); 1 subcaso (genérico do reenviar no verify) | 0 | ✗ — divs. **586**, **587**, **592** |
| (e) frases | §5 em pt-BR (marcas de inglês fora das aspas, rotas e chaves) · §5.10 · §8 "entra" · "frase nova N…" nas folhas | 196 linhas lidas, **0** com marca de inglês; §5.10 = §8 = **N1 N2 N4 N5 N6 N7 N8 N10 N12**; citadas fora: **0** | 0 | ✓ |
| (f) ausências | texto visível e `aria-label`, fora das notas | 5: Favoritar **0**, Apagar **0**, Download/Refresh **0** (VIEW-erro-pdf: só *Tentar de novo* além da casca e do *Editar*); 8: alça/reordenar **0** (nem a forma da alça); 4: `lib.apagado`/`favoritado`/`desfavoritado` **0** | 0 | ✓ |
| (f) presenças | "carregando…" onde há carga; "Salvando…" em 6 e 7 | 12 seções de carga, **11** com "carregando…"; a que não tem é `SET-carregando-dados` (três blocos sem texto, decidido na nota: *"como hoje"*); `EDIT-salvando` ✓, `UP-salvando` ✓ | todas | ✓ (com a exceção declarada) |

### 6.1 A seção a mais de cada folha — (d)

| folha | `<section data-estado>` | §2.4 | a mais |
| --- | --- | --- | --- |
| 0-linha-de-aviso | 9 | 8 | `Tokens` — a tabela "Tokens por elemento" do começo |
| 1-auth | 47 | 46 | `Tokens` |
| 2-landing | 1 | 1 | **nenhuma** — a folha não tem a tabela de tokens (div. 583) |
| 3-privacy-policy | 1 | 1 | **nenhuma** — idem |
| 4-content-lista | 16 | 15 | `Tokens` |
| 5-content-visualizacao | 16 | 15 | `Tokens` |
| 6-content-editor | 16 | 15 | `Tokens` |
| 7-upload | 21 | 20 | `Tokens` |
| 8-setlists | 21 | 20 | `Tokens` |

A seção a mais é **sempre a tabela de tokens** (`<section id="Tokens" data-estado="Tokens" data-screen-label="Tokens">`),
nunca um estado. O inventário do fim (`<section id="inventario">`) não tem `data-estado`. Nenhuma seção de estado fora
do §2.4, nenhum estado do §2.4 sem seção.

### 6.2 A matriz × as seções — (d), por folha

O cruzamento está em [`conferencia/matriz-x-estados.tsv`](conferencia/matriz-x-estados.tsv) — **leitura**, linha a
linha, com a razão; o script cobra que toda linha de estado da matriz está lá, que toda seção citada existe e que
toda seção das folhas aparece. Classes das 179 linhas `[medido]`: **S 113** (alcançável, com seção) · **S-dec 6**
(a matriz não alcança, a folha desenha por decisão) · **destino 4** (sucesso/redirect: o que se vê é a tela de
destino) · **fora-dec 11** (alcançável, fora por decisão: respostas 7, 20, 24, 27, 30, notas) · **fora-I1 6** (morreu
no corte da I1-PR3) · **inalc 36** · **improv 2** · **DIV 1**.

| folha | seções (141) por origem | estado alcançável sem seção | seção sem linha na matriz |
| --- | --- | --- | --- |
| 0-linha-de-aviso | componente 8 | — | as 8: componente (a matriz não tem componente) |
| 1-auth | da matriz 41 · base 5 | genérico do reenviar no verify (**586**) | `AUTH-login`, `-signup`, `-confirm`, `-verify`, `-forgot`: base |
| 2-landing | da matriz 1 | — | — |
| 3-privacy-policy | da matriz 1 | — | — |
| 4-content-lista | da matriz 9 · destino 2 · base 2 · variante 2 · decidido 2 | — | `DASH`, `LIB`: base · `LIB-filtros`, `LIB-mais`: menu aberto · `SESSAO-nao-renovada`: decidido (resposta 4) · `LIB-salvo`: destino do salvar do editor (resposta 7) |
| 5-content-visualizacao | da matriz 11 · base 3 · variante 1 | — | `VIEW-cifra`, `-tab`, `-partitura`: base por tipo · `VIEW-partitura-cheia`: tela cheia |
| 6-content-editor | da matriz 12 · S-dec 1 · base 2 | — | `EDIT-tab`, `EDIT-letra`: base por tipo · `EDIT-salvando`: decidido (resposta 22, "Salvando…") |
| 7-upload | da matriz 14 · S-dec 1 · base 5 | parse do lote (**587**) | `UP-como`, `-arquivo`, `-detalhes`, `-criar`, `-lote`: passos do fluxo |
| 8-setlists | da matriz 14 · S-dec 4 · base 2 · decidido 1 | — | `SET`, `SET-adicionar`: base · `SET-ja-apagada`: falha das setlists · `SET-criar-erro`, `-apagar-erro`, `-adicionar-erro`, `-remover-erro`: falhas das setlists (S-dec) |

As classes **base**, **variante** e **componente** não estão na lista do prompt (div. **592**): a matriz lista os
desvios do estado nominal, não o nominal, nem o menu aberto, nem o componente.

### 6.3 Commit 2: a conferência depois das erratas `[medido]`

Mesmo comando, script **sem mudança** (o G-tok da PR-5 é que vai ler as erratas de arquivo). **19 achados**, exit 1 —
todos cobertos; nenhum outro. Saída e anotação em [`conferencia/saida.txt`](conferencia/saida.txt).

| # | achado | n | coberto por |
|---|---|---|---|
| 1–2, 9–14 | (b) 20 = "entrelinha da LinhaDeAviso" sem origem — folhas 0, 1, 4, 5, 6, 7, 8 e §2.3 | 8 | **I1-E5** |
| 3–8 | (b) `2-landing`: `2` e `3` = `undefined`, sem px no arquivo, fora do §2.3 | 6 | **I1-E4** |
| 15 | (c) `visto` fora do `dados.ts`, por nome | 1 | decisão **588** (PR-4) |
| 16 | (c) forma `garantida` r 8,5, 10× (0, 1, 4, 7) | 1 | **I1-E3** (decisão 589) |
| 17 | (c) forma do visto, 50× (6, 7, 8) | 1 | decisão **588** (PR-4) |
| 18 | (d) parse do lote alcançável sem seção | 1 | **I1-E2** |
| 19 | (d) `README.md`: 286 `T-I1-R` × 282 (os 4 por errata) | 1 | **I1-E1** + **I1-E2** |

## 7 · Divergências — 581 a 596

`git grep -nE '^\| \*\*5[0-9][0-9]\*\* \| [A-Z]' docs | sort -t'*' -k3 -n | tail -1` → **580** (`I1-PR3-anexos/README.md:444`).
Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do artefato · **T** toolchain · **X** terceiros.

| # | origem | o que o prompt (ou o doc) presumiu | o que foi medido | destino |
|---|---|---|---|---|
| **581** | P | pré-condição: `../octavia-i1-design/docs/ux/DESIGN-I1/entrada/` existe com os 10 arquivos; depois `git worktree add ../octavia-i1-design` | `../octavia-i1-design` existia **e não era worktree**: os 10 arquivos (nove `telas*.html` + `README-I1.md`) estavam em `../octavia-i1-design/ux/`, com `docs/` vazia — o `worktree add` recusaria a pasta. Nada faltava | a pasta foi movida para o rascunho da sessão, a worktree criada, os 10 copiados para `entrada/`; o sha256 de cada um conferido antes e depois (§8.1). Nenhum byte mudou |
| **582** | P | §2(d): *"cada folha tem uma a mais que o README declara"* | **7 de 9**: 0, 1, 4, 5, 6, 7, 8 têm `data-estado="Tokens"` a mais; **2 e 3 têm exatamente 1**, o declarado | registrado (§6.1) |
| **583** | A | `README-design.md`, cabeçalho: *"Tabelas de cada folha: no começo, tokens por elemento, a mesma tabela da §2.4"* | as folhas **2 (landing) e 3 (privacy-policy) não têm** a tabela de tokens (`grep -c 'Tokens por elemento'` = 0); o §2.4 do README-design tem as duas | a folha não se reescreve: **para 2 e 3, a fonte dos tokens por elemento é o `README-design.md` §2.4** — proposta, decisão do Marcel |
| **584** | A | `README-design.md` §2.3: *"zero px sem declaração em todas"* | a folha 2 declara no inventário **`2 → undefined`** e **`3 → undefined`**, e o arquivo não tem nenhum `2px` nem `3px`; o §2.3 e a linha do §2.4 da landing não os listam. Não há px sem declaração — há declaração sem px, com valor `undefined` | vale o §2.4 (sem 2 e 3). O G-tok da PR-5 lê os px **do arquivo**, não do inventário — errata candidata, sem efeito na implementação |
| **585** | D | §2(b): *"cada entrada é token, token web, derivado, ou literal declarado com origem"* | 20 = *"entrelinha da LinhaDeAviso"* (§2.3 e nos inventários de 0, 1, 4, 5, 6, 7, 8) não é token nem traz origem. A origem existe: a **T3-R7** do N3 (*"48 dp mínimos e cresce 20 dp por linha de texto"*, N3-D19) | proposta: ler como **literal N3 (T3-R7)**, como o botão de 36; entra assim no `packages/identidade` (PR-4) |
| **586** | A | a nota de `AUTH-verify-reenviar-limite` | a nota diz *"Exceção geral: 'algo deu errado — tente de novo'"*; a seção mostra *"muitas tentativas — tente de novo em instantes"* (o 429 do título). E o **genérico do reenviar** do verify (`app/verify-email/page.tsx:32`, *"An unexpected error occurred"*, matriz) **não tem seção** — no confirm tem (`AUTH-confirm-excecao`) | proposta: a PR de auth usa, no verify, a mesma linha do `AUTH-confirm-excecao` (`motivo.generico`, com *Tentar de novo*) — sem frase nova; decisão do Marcel |
| **587** | A | resposta 14: carregando só nas telas que hoje devolvem `null` | **"carregando — parse do lote"** (`hooks/useAddContentLogic.ts:138`, `isParsing`) é período alcançável, **sem indicador hoje e sem seção** na folha 7 | decisão do Marcel: `estado.carregando` na zona do lote (sem desenho novo: a forma do `UP-enviando`), ou fica sem indicador como hoje |
| **588** | A | `README-design.md` §6: *"De fora do catálogo, já declarados: log-in, email e senha (E14.a), e o visto do Salvar (N2, R2·2)"* | log-in, email e senha estão no `apps/native/src/icones/dados.ts`; **o visto não** (`d="M4.5 12.5l5 5 10-11"`, 50× nas folhas 6, 7, 8). Ele vem do `DESIGN-N2/telas.html` (o *Criar* do diálogo) e não existe em `apps/` nem `packages/` (`git grep -F "12.5l5 5"` → 0) | a PR-4 (`packages/identidade`) o registra com o `d` da folha, como os três da V1-PR6 — proposta; decisão do Marcel |
| **589** | A | §2(c) presume um desenho por nome | o **garantida** das folhas tem **duas formas**: a do catálogo (`r 9` · `M8 12.2l2.8 2.8L16.2 9.4`, só no `UP-pronto`) e outra na LinhaDeAviso de sucesso (`r 8,5` · `M8.4 12.3l2.5 2.5 4.7-5`, 10× nas folhas 0, 1, 4, 7) — esta vem do `DESIGN-N2/telas.html` e não está no `dados.ts` | proposta: a implementação usa a do catálogo, como a resposta 29 fez com a tab; decisão do Marcel |
| **590** | P | `README-design.md` §8, resposta 9: *"Os demais controles já eram só texto: sem mudança"* | contradiz a resposta 11: a *Próxima* (4, 5) leva o **voltar espelhado** | **vale a 11** (§1.3) |
| **591** | P | §3.5: requisitos *"no formato do `docs/native/DESIGN-N3/README.md`"* | aquele README **não tem requisitos**: os `T3-R` estão em [`docs/native/N3-REQUISITOS.md`](../../native/N3-REQUISITOS.md) (§1) | forma copiada do `N3-REQUISITOS.md` (§4) |
| **592** | P | §2(d): seção sem linha na matriz é *"um dos decididos (carregando…, Salvando…, as SESSAO-*, os de falha das setlists) ou divergência"* | **30 seções** caem fora dessas classes e não são divergência: **19 base** (estado nominal de cada tela e tipo), **3 variantes** (menus e tela cheia), **8 do componente** (`AVISO-*`) | classes acrescentadas no cruzamento, cada seção nomeada (§6.2) |
| **593** | P | commit 2, I1-E1: *"existe o estado `AUTH-verify-reenviar-erro`"* (o genérico) | esse id **já existe** na folha 1: é o erro de **rede** do reenviar (*"sem conexão — o e-mail não foi enviado"*, com *Tentar de novo*; nota *"Rede."*). Um segundo estado com o mesmo id duplicaria o `data-estado` e o `T-I1-R` | o estado da errata chama-se **`AUTH-verify-reenviar-excecao`** (o padrão de `AUTH-confirm-excecao`); se o Marcel preferir outro id, muda só a I1-E1 e dois `T-I1-R` |
| **594** | P | commit 2: decisões no *"`README.md` (§2, 'Decisões')"* | as decisões estão no **§1**; o §2 era a errata da I1-D12 | entraram como §1.4; o §2 virou "Erratas" (2.1 I1-D12 · 2.2 I1-E1…E5) |
| **595** | P | commit 2: erratas no *"formato do N2 (§10.2 do `N2-ENCERRAMENTO.md`: id · o que a folha mostra · o que vale · onde se aplica)"* | o §10.2 é a herança do N3 (*"content nos apps"*); as erratas do N2 estão no **§3**, com as colunas `# · PR · o quê · div. · efeito` | colunas do prompt, mais `div.` e `efeito` (a classificação do §3 do N2) — §2.2 |
| **596** | P | commit 2: I1-E3 e I1-E5 *"`0-linha-de-aviso`"* | as duas também aparecem fora da folha 0: a forma r 8,5 em 1, 4 e 7 (10× no total), a entrelinha "sem origem" nos inventários de 1, 4–8 e no §2.3 — são o mesmo componente | "onde se aplica" estendido ao componente em toda folha, dito na errata |

## 8 · `SHA256SUMS`

[`SHA256SUMS`](SHA256SUMS) tem o sha256 de todo arquivo desta pasta, menos ele próprio, exceto `erratas.json`, que lê a folha e não é a folha (I1-PR-5, div. 627, decisão 614). Para conferir, da pasta:

```
shasum -a 256 -c SHA256SUMS
```

### 8.1 A entrega, antes da arrumação `[medido]`

`shasum -a 256 *` em `../octavia-i1-design/ux/` (o nome é o da entrega; o destino é o da §0):

```
d0397516ddddb9874f57508dbc7bc754d27910508654fab4e04b9d1849af8af9  README-I1.md
4a448b197a6173747eb5bfd717a775f5349f3f44eca5db002bee4c71dbd06426  telas (1).html
db269e2757e1728d7f6346699b8458f66abb53b1b9a326a31645a4130e2d0908  telas (2).html
1b8d744f5b90813dcaf79e0a54039f1f82e3e6388950f16fc43d4f0b1fa41b11  telas (3).html
7605e75e7a012d92ac64dac68e5ac37a2ec3b3e41a53d4b99d47f6387f76b21a  telas (4).html
c9eb257eb149af10b50c9cdc39bb6d6011c2e48a6e8739d90b55ddd15057a799  telas (5).html
50129c3e0a14513dbca4e35488d2235a6be1e043cf634d41dd1c9c0bd32fab95  telas (6).html
3f5583acb00447cf450cde6dfe15ca864c5dde7ea7ec9a2c20d8359bcbd30137  telas (7).html
69515135e2f28e3f2965b8b796c799edfb20deda147a2b49f4bb2a0b75e71f1b  telas (8).html
a1ff9bcc63e48e27b7d89726f7d8041e5d73462b4dc7765ef79b265cb79e01b2  telas.html
```

Os mesmos dez valores estão no `SHA256SUMS`, sob os nomes novos.

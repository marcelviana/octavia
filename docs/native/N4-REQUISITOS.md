# N4 — requisitos e aceites: a biblioteca no tablet

> **Bloco N4 · PR de desenho** (só docs). Data: 2026-10-02. Base: `origin/main` = `42d1c39` (merge da #357, o brief).
> **O N4 não tem PRD separado; este documento faz esse papel** (N4-D18). Formato: o do [`N3-REQUISITOS.md`](N3-REQUISITOS.md) — todo requisito `N4-Rn` cita a fonte e tem *Aceite* verificável.
> **Fontes**: [`N4-PRECHECK.md`](N4-PRECHECK.md) (N4-D1…D46), os anexos da N4-PR1, da N4-PR2, do release e do brief (N4-D47…D57), [`N4-BRIEF.md`](N4-BRIEF.md), e [`DESIGN-N4/README.md`](DESIGN-N4/README.md) (N4-D58…D71, a folha congelada, as erratas N4-E1…E6, as medidas a conferir).
> **Regra de leitura**: `[lido]` = do documento citado; `[derivado]` = conta ou consequência de decisões, com a conta à vista. As medidas desta PR estão no `DESIGN-N4/README.md` §5. **Moldura** = `N4-{C,B,A}-<id>` da folha; `*` = as três faixas.
> **Divergências**: as desta PR estão no `DESIGN-N4/README.md` §12 (**1004 a 1024**) e §13.1 (**1025 a 1028**, o commit do aval).
> **O aval** (N4-D72…D84, `DESIGN-N4/README.md` §13) entrou como errata abaixo de cada requisito que ele muda; a §3 foi reescrita como decidida.

---

## 0. As faixas e o que o N4 faz em cada uma

| faixa | largura útil | no N4 | onde se mede |
| --- | --- | --- | --- |
| **C** | > 960 dp | implementada; **as telas que existem não mudam** (G-inv) | Tab S6 e AVD `octavia_tab32` deitados (1137,8 dp) |
| **B** | 700–960 dp | implementada | Tab S6 e AVD em pé (711,1 dp) |
| **A** | < 700 dp | **não quebra**: nenhum crash, e a lista do que fica inalcançável, por superfície, é herança do N5; as molduras `N4-A-*` viram requisito do N5 | `octavia_phone` em pé (411,4 dp) |

Fontes: N4-D12, N3-D12, N3-D24; a errata do T3-R3 (`N3-REQUISITOS.md` §1) é o molde do aceite de A.

---

## 1. Requisitos

### 1.1 A entrada e a biblioteca (L)

**N4-R1 — `Buscar música` abre a biblioteca; S1 não muda** `[N4-D59; N4-E1; molduras *-S1-absorver-*]`. O toque em
`Buscar música` (`testID="buscar"`) em S1 abre **L**, não a S4. Em S1 nada mais muda, em nenhuma faixa e em nenhum estado:
mesmo rótulo, mesmo nome acessível, mesmo `testID`, mesma posição. A S1 vazia é a de hoje (`N2-S1f-criar`, N4-E1), não a
moldura `*-S1-absorver-vazia`. A S4 continua existindo, aberta só pela busca do palco (N4-R17).
*Aceite*: A-N4-1.

**N4-R2 — L abre sem teclado** `[N4-D60; molduras *-L-base, *-L-teclado]`. L abre sem foco no campo e sem teclado; o
teclado sobe no toque no campo. Com o teclado aberto, a lista termina acima dele (encolhe) e barra, campo, filtros e régua
continuam acima; nada da L fica sob o teclado (em B o topo do teclado está em 761,3 dp: 317 dp dentro da janela, m23).
> **Errata da N4-PR7 ao N4-R2 (o mecanismo, medido).** *"A lista termina acima dele (encolhe)"* não acontece sozinho: a
> janela está em `adjust=resize`, mas com o edge-to-edge do RN a raiz não encolhe, e a lista ia até o fim da janela, por
> baixo do teclado (div. 1082). A raiz de L é um `KeyboardAvoidingView` com `padding` e o inset do topo como
> deslocamento: medido, a lista termina no topo do teclado (C 372,0 · B 752,4 no AVD; B 761,3 no Tab). O teclado
> **flutuante** da Samsung (o Tab deitado) não encolhe nada (div. 1087).

*Aceite*: A-N4-2.

**N4-R3 — a composição de L** `[molduras *-L-base, *-L-rolagem; P-T1, P-T2; m2–m10]`. Fixos no topo: a barra de 88
(voltar · campo, = S4), a faixa de filtros (P-T1: 64 em C e B, 120 em A, duas linhas 3 + 2) e a régua (`Biblioteca · {n}
músicas` · `{n} resultados`, fixa). Só a lista rola. Linha de 80 (P-T2; em A mín. 80 e cresce), vão 12. A régua fica fixa
porque *"é ela que diz quantos resultados sobraram depois de um filtro"* (folha). Os valores por faixa são **token do
pacote** (regra 21 do `LOGS-OCTAVIA.md`); nenhuma tela faz conta de largura.
*Aceite*: A-N4-3.

**N4-R4 — ordem alfabética, sem controle de ordem** `[P-X1; N4-D31; N4-D67]`. A lista é alfabética pt-BR **sem acento**
(*Águas* antes de *Décima*); não há controle de ordenação; as favoritas não sobem ao topo (para isso existe o filtro).
*Aceite*: A-N4-4.

**N4-R5 — os cinco filtros** `[N4-D31; N4-D62; P-X2; P-F9; molduras *-L-filtro-sem-resultado, *-L-favoritas-1, *-L-favoritas-0]`.
Cinco chips — Letra, Cifra, Tab, Partitura, Favoritas — cada um com a **contagem fixa da biblioteca inteira** (não muda com
a busca nem com os outros chips). Os tipos combinam por **"ou"**; *Favoritas* combina por **"e"**. Nome acessível de cada
chip: *Só {tipo} ({n})* (P-F9). Filtro sem resultado: *nada encontrado* / *mude a busca ou os filtros* (site), com os chips
marcados à vista; *Favoritas* com 0: *nenhuma favorita* e a estrela vazada de 28 em `lineInfo`; o chip marcado com 0
continua tocável para desmarcar. Régua no singular, *1 resultado* — frase **existente** (N4-E5).

> **Errata do N4-R5 (N4-D85, `[Marcel, 2026-10-03]`; div. 1032).** O nome acessível do chip *Favoritas* é **Só as
> favoritas ({n})**; a P-F9 fica com duas formas — *Só {tipo} ({n})* para os quatro tipos e esta para as favoritas. No
> core desde a N4-PR3 (`nomeDoFiltroFavoritas`, `N4-PR3-anexos/README.md` §2.4).

*Aceite*: A-N4-5.

**N4-R6 — a linha** `[N4-D61; N4-D62; P-F1; P-F7; molduras *-L-base, *-L-linhas]`. O toque na linha **visualiza**
(abre V; nome acessível *Ver “{título}”*, P-F7). À direita, dois controles próprios de **48 × 48**, vão de 4: a **estrela**
(favoritar, sem borda, `accentInk`) e o **▶** (tocar, com borda, **só ícone**, nome acessível *Tocar “{título}”*, P-F1).
A segunda linha leva **sempre o tipo** (ícone de 20 + palavra) e **o artista depois, quando existe** (o ponto vai com o
artista); nunca *artista desconhecido*. Música com arquivo: o estado do arquivo na segunda linha, depois do tipo —
*arquivo não baixado* (`offlineInk`), *baixando o arquivo…*, *não consegui baixar* (`errorInk`); **sem *Baixar* na
linha**. Inválidos: as frases do índice (*tipo não reconhecido — edite na versão web*, *nada para mostrar — edite na versão
web*) e o ▶ **inerte**; visualizar e favoritar continuam. Título longo: C e B uma linha com reticência, como a S4; A até
duas linhas (a linha cresce para 106, e4). Pressionada: contorno `accentInk`, fundo a 6 %.
> **Errata da N4-PR7 ao N4-R6 (estado intermediário declarado).** Na N4-PR7 **a linha não é tocável**: a visualização
> (V) nasce na PR-8, e só ali o toque na linha visualiza, com o *Ver “{título}”* (P-F7) e o pressionado (contorno
> `accentInk`, fundo a 6 %). Até lá os alvos da linha são a estrela e o ▶. A parte do A-N4-6 *"o toque abre V"* e o
> julgamento de mão do Marcel (o toque na linha × nos dois controles) fecham na **PR-8**. E, medido: o estado *arquivo não
> baixado* da linha usa o ícone `arquivo-nao-baixado` do catálogo e o *baixando o arquivo…* o `baixando` (N4-E6: vale o
> catálogo pelo nome; div. 1085); em A o título fica numa linha (as duas linhas são do N5).

*Aceite*: A-N4-6.

**N4-R7 — favoritar: só online, sem otimismo** `[N4-D21; N4-D22; N4-D23; N4-D35; N4-D62; N4-D63; P-F5; molduras *-L-favoritando, *-V-favoritando]`.
O favoritar é `PUT /api/content` com `{"id","is_favorite"}` (valor absoluto). Enquanto o pedido está em voo, **a estrela
daquela música fica inerte com o arco** em volta e **só muda quando o servidor responde**; o resto da linha e as outras
estrelas seguem ativos; nome acessível em voo: P-F5. A resposta (a linha inteira) atualiza o cache sem sync. O pedido
**continua** se o músico sai de V, e **não há aviso na volta**: o estado final aparece onde a estrela estiver.
*Aceite*: A-N4-7.

**N4-R8 — favoritar com falha, por espécie** `[N4-D29; N3-D19; molduras *-L-favoritar-falhou, *-V-favoritar-falhou; div. 1018]`.
A falha vira **uma linha de aviso** sob a barra, composta com as frases **do tablet**: o nome acessível do controle (*Favoritar
“{título}”* ou *Tirar “{título}” das favoritas*) `·` a frase da espécie — sem rede *sem conexão — nada foi salvo*; sem
resposta *sem resposta do servidor*; sessão *não foi possível salvar — confira sua conta no site*; limite *muitas alterações
seguidas — tente de novo em {N} s*; servidor *falha no servidor — nada foi alterado aqui*; genérica *não foi possível
salvar*. Ícone `falha` em `errorInk`, menos sem rede (`sem-conexao`, `offlineInk`) e limite (`ultima-sincronizacao`,
`offlineInk`). Cresce e **nunca elide** (48, +20 por linha). Sem *Tentar de novo*: a estrela é a nova tentativa; a estrela
volta ao estado de antes; a linha some no próximo favoritar ou ao sair da tela.
*Aceite*: A-N4-8.

**N4-R9 — sem rede** `[N4-D23; P-F4; regra 9 do brief; molduras *-L-sem-rede, *-V-sem-rede]`. A lista, a busca, os filtros,
a leitura e o ▶ funcionam; **só a estrela fica inerte** (`lineInfo`, traço 1,25), e o motivo está **numa** linha de aviso
sob a barra, à vista sem toque: *Sem conexão: dá para ler e tocar, não para favoritar. O favoritar volta quando a rede
voltar.* (P-F4). Nenhum motivo repetido por linha.
*Aceite*: A-N4-9.

**N4-R10 — os estados de sincronização de L** `[P-F10; P-F11; N4-D66 (P-O3); molduras *-L-carregando, *-L-vazia, *-L-falha-com-cache, *-L-falha-sem-cache]`.
**Carregando** (a 1ª vez, sem nada no aparelho): *carregando…* (frase do tablet), o ícone `baixando`; filtros à vista,
inertes e sem contagem; o campo aceita digitar. **Vazia** (a conta sem música): *nenhum conteúdo ainda* e P-F10; a marca em
repouso, sem tinta de alerta; chips com 0, inertes. **Falha com o que está no aparelho**: a frase do S1e na linha de aviso,
`Tentar novamente` (em A desce para a linha de baixo); a lista é a do aparelho. **Falha sem nada no aparelho**: a
composição do S1d com P-F11.
*Aceite*: A-N4-10.

**N4-R11 — a busca de L** `[N4-D59; T1-R20–R23; molduras *-L-busca-sem-resultado]`. O campo de L faz **a mesma busca local**
da S4 de hoje — título, artista, álbum e letra, sem internet — e a busca sem resultado usa **as duas frases da S4b,
intactas** (*nada encontrado para “{termo}”*, *busca em título, artista, álbum e letra de toda a biblioteca ({n}
músicas)*), a lupa com X em `muted`.
*Aceite*: A-N4-11.

### 1.2 A visualização (V)

**N4-R12 — o cabeçalho de V** `[N4-D61; molduras *-V-*; m12, m26, e5]`. Igual nas três faixas: voltar · título +
artista · tipo · **estrela** · **▶** (só ícone, com borda, 48 — o mesmo controle da linha). Uma linha de 88
(`bar.top + space.xl`), que **cresce** quando o título ou a meta quebram (≈ 118 em C e B com duas linhas; em A até ≈ 196
com o título longo, e5). Sem artista, a meta é só o tipo. Tipo desconhecido: *tipo desconhecido* em `offlineInk` e o ▶
inerte.
*Aceite*: A-N4-12.

**N4-R13 — o corpo de V: duas colunas em C, uma em B e A** `[N4-D24; N4-D65; N4-D66 (P-O1, P-O5); P-T3; e6, m13, m14, m24]`.
Em **C**, duas colunas: detalhes, notas e datas à esquerda (**340**, P-T3) e o corpo à direita; a coluna da esquerda **fica
mesmo vazia**, para o corpo não mudar de lugar entre músicas. Em **B** e **A**, uma coluna: os detalhes sobre o corpo, uma
rolagem só (grade de 3 em B, de 2 em A). O corpo é **o leitor do palco** — mono 22, entrelinha 34, sem quebra de linha, sem
os controles de tocar (rolagem automática, bordas, zoom) — e fica **escuro** (P-O1). **Custo declarado** (N4-D65): ≈ 56
colunas em C, e o leitor corta linhas que o palco mostra inteiras (≈ 81), até o bloco da quebra de linha.
*Aceite*: A-N4-13.

**N4-R14 — os campos de V** `[N4-D31; N4-D57; N4-D62; P-F3; molduras *-V-letra, *-V-campos-vazios]`. V mostra **só os
campos que o site salva de verdade**, com o nome do site: álbum, dificuldade (Iniciante · Intermediário · Avançado),
gênero, tom, andamento (*{x} BPM*), etiquetas (separadas por ` · `), sob *Detalhes*; as **notas da música** com o rótulo
*notas da música* (P-F3) — **só em V**, o palco não muda; e **as duas datas numa linha no fim** (*criado {data} · alterado
{data}*), que sempre existem. **Campo vazio não aparece**; sem nenhum campo e sem notas, sobra a linha das datas. Compasso,
capo e afinação **não aparecem** (herança D).
*Aceite*: A-N4-14.

**N4-R15 — o corpo por tipo e os arquivos em V** `[N4-D24; N4-D40; N4-D43; N4-D44; N4-D66 (P-O2); N4-E6; molduras *-V-cifra, *-V-cifra-secoes, *-V-tab, *-V-partitura, *-V-corpo-vazio, *-V-pdf-baixando, *-V-arquivo-nao-baixado, *-V-arquivo-falhou, *-V-formato]`.
**Cifra com seções**: o nome de cada seção antes dos acordes e da letra, como o editor gravou (*Content*, *Verse 1* — não
traduzido nem escondido). **Tab** como foi importada, sem quebra. **Partitura** pelo leitor de PDF do palco, página ajustada
à largura da coluna, sem os controles de zoom. **Corpo vazio**: *este item não tem conteúdo* para os quatro tipos.
**Arquivo**: *baixando o arquivo…* com o arco; *arquivo não baixado* — o placeholder do S3e com *Baixar* (sem rede, a
segunda frase troca para a existente); **falha**: *não consegui baixar* e a espécie embaixo; **formato que o app ainda não
mostra**, pela extensão: *não foi possível abrir o arquivo — confira o formato* (site), com o nome do arquivo em mono. O ▶
segue ativo no arquivo não baixado.

> **Errata do N4-R15 (N4-D78, N4-E8, `[Marcel, 2026-10-03]`).** Em V o ***Baixar* é ícone**, não palavra: o
> `baixar-setlist` do catálogo (em voo, o `baixando-acao`; div. 1025), **com borda e alvo de 48** como o ▶, e o **nome
> acessível *Baixar***. Vale para o arquivo não baixado e para a falha. As molduras `*-V-arquivo-nao-baixado` e
> `*-V-arquivo-falhou`, que desenham a palavra, cedem (N4-E8). Se V reaproveitar o componente do placeholder do palco, o
> controle é a única diferença entre os dois.

*Aceite*: A-N4-15.

### 1.3 O palco avulso sem setlist e a busca dele

**N4-R16 — o palco avulso sem hospedeira** `[N4-D30; N4-D63; N4-D66 (P-O6); divs. 964, 1001; molduras *-S3-avulso-*]`. Aberto
da L, de V (ou da S4 do avulso), o palco abre **sem setlist hospedeira**: barra de cima com `AVULSA` e **sem nome de
setlist**, título · artista · tipo ganhando a largura (64 em C; 88 em B: `AVULSA` / título; 144 em A, título em duas
linhas); **barra de baixo sem o índice** — os quatro de leitura · busca · voltar (em A, busca e voltar em cima, como hoje);
bordas de virar página inalteradas (170,7 · 106,7 · 61,7). O **voltar** leva **à origem, na mesma posição** (rolagem,
filtros, termo), com o nome acessível pela origem: L → *Voltar para a biblioteca* (frase do site); V → *Voltar para a
visualização* (P-F6); S4 → *Voltar para a busca* (existente). **Com zero setlists o palco abre igual** (hoje cai no
placeholder sem controle, div. 1001). O prefetch sob demanda baixa **esta** música, não a de uma setlist alheia (div. 964).
O avulso tem **os dois temas** (no claro, a tinta é `light.text`, N4-E3). Arquivo não baixado: o S3e de hoje, com o título
da música; o *Baixar* sem ícone, como hoje (N4-E6). Formato: o placeholder de V. **O palco com setlist não muda**, nem o
avulso aberto pela busca dentro de uma setlist.

> **Errata da N4-PR6 ao N4-R16 (N4-D95, `[Marcel, 2026-10-06]`).** Em B a página do PDF fica na linha 1, como no palco
> com setlist, e não na linha 2 das molduras `N4-B-S3-avulso-*` — é a **N4-E9** (`DESIGN-N4/README.md` §6). As erratas
> de medida da folha começam na **N4-E10**.

> **Errata do N4-R16 (N4-D83, N4-D78, `[Marcel, 2026-10-03]`).** (i) O estado **"formato que o app ainda não mostra"**
> (N4-D43) vale **também no palco com setlist** — é o mesmo componente. As telas da base do G-inv não mudam porque a
> fixture da base não tem esse caso (só `.pdf`, `N3-PRECHECK-anexos/instrumentos/fixture.py:13-16`, `:136-144`); esta PR
> o prova (G-inv 18/18; div. 1028). (ii) O ***Baixar* do palco fica com a palavra**, com setlist e avulso, como hoje
> (`StageScreen.tsx:824-829`); se V reaproveitar o componente, o palco sai **byte a byte igual** no G-inv.

*Aceite*: A-N4-16.

**N4-R17 — a S4 aberta do palco avulso sem setlist** `[N4-D59; N4-D63; moldura *-S4-avulso-sem-setlist; m25]`. É a S4 de
hoje, sem mudança de composição — barra 88 (fechar · campo · apagar), régua, resultados de 80 — **sem a seção *Nesta
setlist***: só a régua *Biblioteca · {n} músicas*. Tocar um resultado abre o avulso dessa música, e o voltar do palco diz
*Voltar para a busca*.
*Aceite*: A-N4-17.

### 1.4 Ícones, tokens, frases e testIDs

**N4-R18 — os ícones novos** `[N4-D58; N4-D68; P-I1a, P-I1b, P-I2; div. 1013]`. Entram no catálogo do pacote a **estrela**
(vazada = favoritar; cheia = favorita) e o **tocar**, com os estados que a folha desenha (normal, pressionado, inerte, em
andamento). Cor é do tema, nunca do desenho; traço por tamanho (20 → 1,5). A forma no catálogo (a estrela como um registro
com dois estados ou dois nomes) é a pergunta 5 do `DESIGN-N4/README.md` §10.

> **Errata do N4-R18 (N4-D76, errata da N4-D68, `[Marcel, 2026-10-03]`).** A estrela é **um registro com dois estados** —
> vazada (favoritar) e cheia (favorita) — e o tocar é **outro registro**: o catálogo vai de **39 a 41 registros**.

> **Errata da N4-PR4 ao N4-R18 (N4-D87, `[Marcel, 2026-10-04]`).** A folha desenha a estrela inerte nas **duas** formas
> (vazada e cheia, traço 1,25); o `Desenho` do pacote ganha o campo `ativoInerte` (o inerte do estado `ativo`) e o
> `Icone.tsx` do nativo o estado `'ativo-inerte'` — os quatro estados no catálogo, cobrados pelo `gate:icones`
> (`N4-PR4-anexos/README.md` §0). **O julgamento do traço da estrela e do tocar em 20 dp** (A-N4-18, coluna *Marcel*)
> **passa para a PR-7**, a primeira que os põe em tela: na PR-4 eles existem só no catálogo. Nada se renumera.

*Aceite*: A-N4-18.

**N4-R19 — os quatro ícones de tipo trocam de desenho, no app inteiro e no site** `[N4-D69; P-I9…P-I12; div. 1021]`.
`letra` = **Aa** (L1), `cifra` = **a palheta** (C2), `tab` = **linhas com um 2** (T1), `partitura` = **a nota única** (P2)
— **mesmos nomes, mesma caixa** (20 / 24 / 28), no catálogo de `packages/identidade`; tudo que mostra tipo, no tablet e no
site, passa a mostrar o desenho novo sem mudar composição. `tipo-desconhecido` não muda. Na linha de L o tipo fica em 20.
Exceção declarada à N4-D4, **só no desenho desses quatro**.

> **Errata da N4-PR4 ao N4-R19 (N4-D86, `[Marcel, 2026-10-04]`).** A folha desenha os quatro numa grade de 20 com traço
> fixo (1,8 no viewBox 24, em todo tamanho) e escreve *"em 24 e 28 escalam com o traço do catálogo"*. Vale: a geometria
> da folha × 1,2; em **20** o traço da folha (`em20` com `traco: 1.8`), em **24 e 28** o da família (`TRACO`). A
> exceção `em20` de quatro cordas da tab (§6.3 do V1) sai em par. O traço em 20 foi julgado no Tab S6 pelo Marcel:
> **os quatro "bom", o *a* primeiro** — nenhuma N4-E9 (`N4-PR4-anexos/README.md` §5).
*Aceite*: A-N4-19.

**N4-R20 — os tokens, no pacote** `[N4-D3; N4-D64; N4-D67; P-T1, P-T2, P-T3; regra 21; div. 1020]`. `faixas.*.lib.filtros`
(C 64 · B 64 · A 120), `faixas.*.lib.linha` (80; A mín. 80, cresce) e `faixas.C.view.coluna` (340) vivem em
`packages/identidade`, por faixa. As três medidas da N4-D17 (`folha.alturaMin` em B e A, `reordenar.artistaMin` em C) ficam
**inexistentes por desenho**; a forma disso no tipo — e a da P-T3, que só existe em C — se decide na PR que tocar o pacote
(N4-D64). Nenhum token fora do pacote; nenhuma conta de largura em tela.

> **Errata da N4-PR4 ao N4-R20 (a forma da N4-D64).** As três medidas são a palavra **`INEXISTENTE`** (`'inexistente'`,
> tipo `Inexistente`) de `packages/identidade/src/tokens.ts`, no molde do `'empilha'` do bloco `web`:
> `reordenar.artistaMin` e `folha.alturaMin` são `number | Inexistente`, os leitores comparam com `INEXISTENTE`, e o
> gerador de CSS não emite propriedade para ela — **o CSS do site byte a byte igual** (`N4-PR4-anexos/README.md` §3).
> A P-T3 (só C) usa a mesma forma na PR-8.
*Aceite*: A-N4-20.

**N4-R21 — as frases** `[N4-D14; N4-D29; N4-D67; div. 977; N4-E5]`. As frases novas — P-F1, P-F3, P-F4, P-F5, P-F6, P-F7,
P-F9, P-F10, P-F11 — e o vocabulário de content que o tablet usa entram no core, **sob gate** (a frase que passa ao core não
pode sair do G-tok sem outro gate cobri-la, div. 977). P-F8 (*1 resultado*) já existe (`SearchScreen.tsx:156`). O motivo
fica isolado e cada lado compõe do seu jeito (o tablet com ` · `). Nenhuma troca de texto no site.
*Aceite*: A-N4-21.

**N4-R22 — testIDs** `[N4-D67 (P-X3); div. 1002]`. Os da P-X3 são **sugestão**: `lib-campo`, `lib-filtro-{tipo}`,
`lib-filtro-favoritas`, `lib-linha-{id8}`, `lib-favoritar-{id8}`, `lib-tocar-{id8}`, `view-voltar`, `view-favoritar`,
`view-tocar`. Todo alvo tocável novo tem `testID` (G6); todo `testID` novo é adição (G2). Os existentes não mudam. Com a
fixture de ids `00000000…` do mock, o `{id8}` colide (div. 1002): o arnês acha a linha por outro caminho, ou a fixture da
PR muda os ids — decisão da PR da tela.
*Aceite*: A-N4-22.

### 1.5 O que vale para todo o bloco

**N4-R23 — invariante C e as telas que já existem** `[N3-D3; T3-R2; N4-D58; N4-D59; regra 20]`. Em C, os dumps das telas
que já existem são **idênticos em dp** à base do mock: `N3-PRECHECK-anexos/B5-baseline/` (34) e
`B3-referencia-paisagem/` (18). Com a N4-D59, **nenhum dump de S1 muda**; os 4 da S4 mudam **de caminho** — passam a ser
alcançados pelo palco avulso sem setlist (div. 1019), e têm de dar o mesmo 4 de 4 — errata de **caminho**, declarada na
PR-7 (N4-D73). O ícone de tipo trocar de desenho **não muda
`bounds`** (div. 1021) e não é diferença de G-inv.

> **Errata da N4-PR4 ao N4-R23 (div. 1049, errata da div. 1021; decisão do Marcel, `[2026-10-04]`).** A frase acima é
> falsa: **o G-inv vê o desenho** — o `react-native-svg` dá um nó `PathView` por primitiva, e a troca dos quatro ícones
> de tipo mudou a contagem de nós em 8 dumps da base (S2 ×3 e S4-resultados, AVD e Tab). O instrumento **não se
> enfraquece**: troca de desenho **decidida** se paga com **errata em par na base** — o `g-inv-par.mjs` prova que a única
> diferença está dentro dos `SvgView` dos ícones de tipo (byte a byte iguais fora deles), a base desses dumps muda só
> nesses nós com a razão, e o `SHA256SUMS.txt` em par; um ícone que não é de tipo com o desenho trocado, ou um de tipo
> que muda de caixa, continua reprovando (`N4-PR4-anexos/README.md` §4.5). Com a base em par: **34/34 e 18/18**.
*Aceite*: A-N4-23.

**N4-R24 — B implementada por superfície; A não quebra** `[N4-D12; errata do T3-R3]`. B se implementa contra as molduras
`N4-B-*`; A tem o aceite mínimo — nenhum crash e **a lista dos controles inalcançáveis por superfície**, herança do N5. As
molduras `N4-A-*` viram requisito do N5.
*Aceite*: A-N4-24.

**N4-R25 — as estimadas se medem primeiro** `[N3-D23; regra 19; DESIGN-N4 §4.1]`. Antes de a tela mudar, a régua de
desenvolvimento mede, **na ordem da folha**, e1 · e2, e3, e4, e5, e6, e9 — e as contas que não fecham (m6, m14; div. 1015)
e a linha de aviso com o motivo em 15 dp (div. 1014). Diferença **> 4 dp** contra a tabela é errata **N4-E7** em diante, no
`DESIGN-N4/README.md` §6, antes de virar layout. Os dumps saem no formato do `N4-BRIEF-anexos/MEDIDAS.md`.

> **Errata do N4-R25 (N4-D77, N4-D78).** A N4-E7 e a N4-E8 estão ocupadas pelo aval: as erratas de medida começam na
> **N4-E9**.

*Aceite*: A-N4-25.

### 1.6 Do aval

**N4-R26 — todo arquivo da biblioteca no aparelho** `[N4-D42; N4-D82; N4-PRECHECK.md A7 itens 1–4]`. Depois de **um sync com
rede**, **toda música com arquivo** (Partitura, Cifra escaneada) tem o arquivo **no aparelho**, dentro do **teto de
retenção** (`CAP_BYTES` = 200 MB, `apps/native/src/prefetch.ts:34`): o conjunto garantido passa a ser todo `file_url` com
`body === 'file'`, protegido do LRU. O plano sai numa linha de log **`prefetch plan n=<n> reason=<nova>`** — errata **em
par** do G3 e linha nova no `LOGS-OCTAVIA.md` (regra 14). Os estados transitórios — **baixando** e **falhou** — são os da
linha da L (N4-R6) e de V (N4-R15). **Quando o teto não comporta**: os garantidos não se despejam; o que não coube fica
*arquivo não baixado*, e o sinal é a linha `lru over …` que já existe — nunca silêncio. O core na **PR-5**; a evidência no
aparelho na **PR-9**.
*Aceite*: A-N4-26.

---

## 2. Aceites do N4

O N4 está pronto quando todos abaixo passam, no **Tab S6 e no AVD `octavia_tab32`**, com o **mock** e a fixture do projeto, e,
onde o critério diz A, no **`octavia_phone`**. **Quem mede é o executor** (N4-D54): tudo que um instrumento compara é medido
e colado; **ao Marcel cabe o que só o olho e a mão julgam** — coluna *Marcel*. O Tab repousa com o release e volta a ele no
fim de todo aceite com mock (N4-D55).

| # | critério | evidência (executor) | Marcel | rastreio |
| --- | --- | --- | --- | --- |
| A-N4-1 | `buscar` em S1 abre L (dump de L depois do toque); os 8 dumps de S1 da `B5-baseline/` idênticos (G-inv); a S1 vazia com `Criar a primeira setlist` | G-inv; dump antes/depois do toque | — | N4-R1 |
| A-N4-2 | L abre sem IME (`dumpsys input_method` sem a janela do teclado; nenhum nó com foco); toque no campo → teclado; com ele aberto, todo controle da L acima do topo do teclado | dumps com e sem teclado; o topo do teclado pela região tocável (`APARATO.md`) | — | N4-R2 |
| A-N4-3 | barra, filtros, régua e linha com os valores da folha por faixa (> 4 dp = errata); régua e filtros com o mesmo `bounds` antes e depois de rolar | dumps de C e B; o rolado | — | N4-R3 |
| A-N4-4 | a ordem da lista igual à do teste de unidade do core (pt-BR sem acento) sobre a fixture | teste do core; dump | — | N4-R4 |
| A-N4-5 | as cinco contagens fixas sob busca e filtro; "ou" entre tipos e "e" com Favoritas (teste do core: tabela verdade); nomes acessíveis P-F9 no `content-desc` | teste do core; dumps | — | N4-R5 |
| A-N4-6 | linha: toque abre V; estrela e ▶ 48 × 48, vão 4; segunda linha tipo · artista; os estados da `L-linhas` | G5/G6; dumps | o toque na linha × no ▶ × na estrela (a mão: o alvo certo, sem toque errado) | N4-R6 |
| A-N4-7 | durante o pedido, a estrela `enabled=false` e o cache intacto; depois do 200, o cache com a linha devolvida e sem sync; sair de V não cancela | mock com resposta atrasada; logcat; dumps | — | N4-R7 |
| A-N4-8 | as **seis** espécies em B, cada uma com a linha de aviso e a altura (pior caso: C 1 · B 2 · A 4 linhas, a conferir) | mock por espécie; dumps de B | — | N4-R8 |
| A-N4-9 | sem rede (`ping` falhando, regra 1): estrela inerte, linha de aviso P-F4, lista/busca/▶ funcionando | dumps; logcat (`write blocked op=… reason=offline`, se o favoritar usar a linha do N2) | — | N4-R9 |
| A-N4-10 | os quatro estados de sync de L | mock (store apagado, falha, vazio); dumps | — | N4-R10 |
| A-N4-11 | o mesmo conjunto de resultados da S4 de hoje para os mesmos termos | teste do core; dumps | — | N4-R11 |
| A-N4-12 | cabeçalho 88; título longo cresce; sem artista; tipo desconhecido | dumps de C e B | — | N4-R12 |
| A-N4-13 | C: coluna de 340 (> 4 dp = errata, e6) e corpo à direita; B: uma coluna; o leitor sem quebra; colunas visíveis medidas | dumps; régua | **a leitura do corpo em V em C** (o corte de ≈ 56 colunas é custo aceito; o olho diz se a tela se lê) | N4-R13 |
| A-N4-14 | só os campos salvos; campo vazio ausente do dump; notas com P-F3; datas no fim; nenhum compasso/capo/afinação | dumps sobre fixture com e sem campos | — | N4-R14 |
| A-N4-15 | cada estado de corpo e de arquivo, com as frases; o *Baixar* de V é **ícone** (`baixar-setlist`), 48 × 48 com borda, `content-desc` *Baixar*, nenhum nó de texto *Baixar* em V (N4-E8) | mock; dumps | — | N4-R15 |
| A-N4-16 | avulso aberto de L e de V: sem nome de setlist, sem `indice`, voltar à origem na mesma posição (rolagem/termo/filtros iguais antes e depois), nome acessível por origem; **com zero setlists abre**; nenhum `prefetch` de outra música (logcat); G-inv 18/18 do palco com setlist; **o formato no palco com setlist** (mock com arquivo não-PDF) e a base do G-inv intacta (N4-D83); o *Baixar* do palco com a palavra, nó a nó o de hoje (N4-D78) | dumps; logcat; G-inv | — | N4-R16 |
| A-N4-17 | a S4 do avulso sem *Nesta setlist*; os 4 dumps da S4 da base **idênticos** por esse caminho | G-inv | — | N4-R17 |
| A-N4-18 | estrela (**um registro, dois estados**: vazada/cheia, N4-D76) e tocar (outro registro) no catálogo — **41 registros** —, cobrados pelo `gate:icones` contra a folha do N4 | `gate:icones` | **o traço da estrela e do tocar em 20 dp no aparelho** | N4-R18 |
| A-N4-19 | os quatro de tipo no catálogo (gate em par); no app e no site, **antes × depois por imagem** com o controle antes × antes = 0 (regra 29); composição igual (G-inv, G-faixa) | `gate:icones`; imagens; G-inv; G-faixa | **o traço dos quatro em 20 dp no Tab S6 — o *a* minúsculo primeiro** (folha: se não sustentar, o anel de raio 2,75 → 3, sem mudar o A) | N4-R19 |
| A-N4-20 | os tokens no pacote, lidos pelas telas; nenhum literal de largura nas telas novas; a forma da N4-D64 no tipo, com o `igualdade.test.ts` em par | testes do pacote; `git grep` | — | N4-R20 |
| A-N4-21 | as frases no core, sob gate (CN: tirar uma → reprova) | o gate da PR-3 | — | N4-R21 |
| A-N4-22 | G2 só com adição; G6 com todo alvo novo | G2/G3; G5/G6 | — | N4-R22 |
| A-N4-23 | G-inv 34/34 e 18/18 em toda PR (os 4 da S4 pelo caminho novo, depois da troca) | G-inv | — | N4-R23 |
| A-N4-24 | B contra as molduras; A sem `FATAL` e a lista de inalcançáveis por superfície | dumps; logcat; toque em cada controle | — | N4-R24 |
| A-N4-25 | a tabela das estimadas medidas na ordem, com as erratas abertas (a partir da N4-E9) | régua; tabela no formato do `MEDIDAS.md` | — | N4-R25 |
| A-N4-26 | **core** (PR-5): teste do conjunto garantido = todo `file_url` com `body === 'file'`; o LRU não despeja garantido; a linha `prefetch plan … reason=<nova>` no G3 em par e no catálogo. **Aparelho** (PR-9): depois de um sync com rede, o `files-index` tem todo arquivo da fixture com `body === 'file'` (lista e bytes contra a fixture), a linha do plano no logcat, *baixando* e *falhou* (mock de 404) vistos na linha e em V; com o teto reduzido no mock, `lru over` e o *arquivo não baixado* no que não coube | testes do core; G3; logcat; `run-as` do índice de arquivos; dumps | **o tempo até tudo baixar num sync real** (o olho: a biblioteca usável enquanto baixa) | N4-R26 |
| A-N4-27 | **o favoritar em prod pelo app** — o aceite (i) da PR-9, como o §3 o escreve (N4-D84; N4-R7; regra 12) | ver §3, PR-9, aceite (i) | ver §3 | N4-R7 |
| A-N4-28 | **o release do N4 no Tab** — o aceite (ii) da PR-9, como o §3 o escreve (N4-D84, N4-D55) | ver §3, PR-9, aceite (ii) | ver §3 | N4-D55, N4-D84 |

---

## 3. A ordem — **decidida** (N4-D72)

> **Decisão, não proposta** `[Marcel, 2026-10-03]`. A **N4-D72** é errata da N4-D45. **De onde veio a ordem**: a PR de
> identidade é a proposta do revisor; os tokens na PR da tela que os lê e o palco avulso antes da tela da biblioteca são o
> que a leitura do código sugeriu (`DESIGN-N4/README.md` §10, pergunta 1; divs. 1019, 1020) — a S4 da base do G-inv se
> alcança por S1 hoje, e depois da troca de destino só pelo avulso sem setlist. **Todo documento de PR do bloco termina
> nomeando a próxima PR desta lista** (N4-D72).

**O gate vem antes do que ele mede** (regra 30): em cada PR, o commit 1 é o instrumento reprovando a `main`. Quem mede é o
executor (N4-D54); o Tab repousa com o release e volta a ele no fim de todo aceite com mock (N4-D55).

### PR-3 — core das frases

- **Entrega**: o vocabulário de content do tablet e as frases P-F1, P-F3…P-F7, P-F9…P-F11 no `packages/core`; o contrato da
  `LinhaDeAviso` (props e espécies, N4-D16); o motivo isolado (N4-D29). Nenhuma tela muda. P-F8 não entra como nova (N4-E5).
- **Gate**: a frase que passa ao core continua sob gate (div. 977); G1a/G1b, G2/G3; **o `DESIGN-N4` no laço do `shasum -c`
  do `gates.yml`, no commit 1** (N4-D81).
- **Mede primeiro**: o G-tok com a contagem de strings antes e depois (446 → 445 foi o sintoma da L3).
- **Requisitos**: N4-R21. **Aceites**: A-N4-21 (executor; sem aparelho).

### PR-4 — identidade

- **Entrega**: a **estrela** (um registro, dois estados) e o **tocar** (N4-D76); os **quatro ícones de tipo** substituídos
  em `packages/identidade/src/icones.ts` (N4-D69); **a forma da N4-D64** no tipo do pacote (o `TokensDaFaixa` e o CSS
  gerado de `folha.*`); **as erratas de ponteiro** nos READMEs dos congelados que mostram ícone de tipo, no commit que
  troca o desenho (N4-D74). Os tokens P-T1…P-T3 **não** entram aqui.
- **Gate**: o `gate:icones` com a folha do N4 como fonte, **em par** (o desenho velho → o novo; a `em20` da tab) — o
  commit 1, reprovando antes do desenho; o `igualdade.test.ts` (`linha-de-base.json`) em par; G-inv 34/34 e 18/18 (a
  composição não muda); no site, G-faixa e G-tok.
- **Mede primeiro**: a **imagem antes × depois**, no aparelho e no site, com o controle antes × antes = 0 (N4-D75; regra 29)
  — o G-inv e o G-faixa medem caixa e não veem o desenho (div. 1021).
- **Requisitos**: N4-R18, N4-R19, N4-R20 (a parte da N4-D64). **Aceites**: A-N4-18, A-N4-19, A-N4-20 (executor);
  **Marcel**: o traço em 20 dp no Tab S6, o *a* minúsculo primeiro (N4-D75).

### PR-5 — core da biblioteca, sem tela

- **Entrega**: a lista ordenada (P-X1) e o filtro ("ou" / "e", contagem fixa — P-X2); a busca de L sobre o mesmo índice da
  S4; a escrita do favoritar (N4-D22, D23, D35) com as espécies do N2; **a garantia de todos os arquivos** (N4-D42, N4-D82)
  com o estado por música e a linha `prefetch plan … reason=<nova>` em errata em par do G3 e no `LOGS-OCTAVIA.md`; o teste
  da L2 (o `updated_at` muda, o arquivo fica).
- **Gate**: o gate byte a byte do corpo do favoritar (N4-PR1); G1b, G2/G3 em par; os testes do core reprovando antes.
- **Mede primeiro**: a tabela verdade do filtro, a ordem sobre a fixture e o conjunto garantido, em teste de unidade.
- **Requisitos**: N4-R4, N4-R5, N4-R7, N4-R11, N4-R26 (o core). **Aceites**: A-N4-4, A-N4-5, A-N4-7, A-N4-11 e A-N4-26 na
  parte do core (executor; sem tela).

### PR-6 — o palco avulso sem hospedeira

- **Entrega**: N4-R16 e N4-R17 — o avulso aberto de S1 (pelo caminho que existe hoje: S1 → `Buscar música` → S4 → música)
  deixa de ter hospedeira; a barra sem o nome e sem o índice; o voltar à origem; zero setlists abre; o estado de formato no
  palco, **com setlist também** (N4-D83); o *Baixar* do palco **com a palavra**, como hoje (N4-D78). A S4 aberta do avulso
  sem *Nesta setlist*.
- **Gate**: G-inv **18/18** do palco com setlist e 34/34 (a base não tem arquivo não-PDF: prova da N4-D83); o caso de zero
  setlists (div. 1001) reprovando antes; G2/G3 (nenhuma linha de log nova obrigatória, `N4-PRECHECK.md` A3); G-N3 e G5/G6
  do avulso.
- **Mede primeiro**: a barra sem o nome (≈ 12 caracteres a mais para o título em C e B) e a barra de baixo sem o índice
  (controles de 66, N4-E4).
- **Requisitos**: N4-R16, N4-R17, N4-R23, N4-R24 (o palco). **Aceites**: A-N4-16, A-N4-17, A-N4-23, A-N4-24 (executor).

### PR-7 — a tela da biblioteca, com o novo destino de `Buscar música`

- **Entrega**: L em C e B (N4-R2…N4-R11, na tela), a entrada (N4-R1), os tokens **P-T1 e P-T2** no pacote; A não quebra.
- **Gate**: o G-N3 com par desde a primeira captura; G5/G6 nas quatro colunas; G-inv com a **errata de caminho** dos 4
  dumps da S4, alcançados pelo palco avulso sem setlist, **4 de 4** (N4-D73); os 8 de S1 sem errata nenhuma.
- **Mede primeiro**: e1 · e2 (os chips em B, folga 37), e3, e4, e9 e m6 — pela régua, antes da tela (as erratas a partir da
  N4-E9).
- **Requisitos**: N4-R1, N4-R2, N4-R3, N4-R4, N4-R5, N4-R6, N4-R7, N4-R8, N4-R9, N4-R10, N4-R11 (na tela de L), N4-R20
  (P-T1, P-T2), N4-R22, N4-R23, N4-R24, N4-R25. **Aceites**: A-N4-1, A-N4-2, A-N4-3, A-N4-4, A-N4-5, A-N4-6, A-N4-7,
  A-N4-8, A-N4-9, A-N4-10, A-N4-11 (a parte de tela, em L), A-N4-20, A-N4-22, A-N4-23, A-N4-24, A-N4-25 (executor);
  **Marcel**: o toque na linha × nos dois controles.

### PR-8 — a visualização

- **Entrega**: V em C e B (N4-R12…N4-R15), o favoritar e o ▶ em V, o *Baixar* como **ícone** (N4-D78, N4-E8), o estado da
  N4-D43, o token **P-T3** no pacote.
- **Gate**: o G-par sobre o nó `corpo` de V (`N4-PRECHECK.md` A12); G-N3; G5/G6; G-inv (se V reaproveitar o placeholder do
  palco, o palco **byte a byte igual**).
- **Mede primeiro**: e5 (cabeçalho em A, registro), **e6** (a coluna de 340 em C) e m14 (as colunas visíveis do leitor).
- **Requisitos**: N4-R8, N4-R9 (em V), N4-R12, N4-R13, N4-R14, N4-R15, N4-R20 (P-T3), N4-R25. **Aceites**: A-N4-8, A-N4-9
  (em V), A-N4-12, A-N4-13, A-N4-14, A-N4-15, A-N4-20, A-N4-25 (executor); **Marcel**: a leitura do corpo em C.

### PR-9 — estados transversais, a troca por espécie, o aceite completo, a prova em prod e o release

- **Entrega**: os estados de rede, falha e favoritar em L e V medidos de ponta a ponta (N4-R7…N4-R10); a troca de
  `icone`/`cor` por espécie nas quatro telas (`IndexScreen`, `ModoDeReordenar`, `Picker`, `SetlistsScreen`) **só se o mapa
  devolver os mesmos pares** de hoje, com G-inv e `gate:icones` intactos (N4-D32); **a evidência no aparelho da garantia
  dos arquivos** (N4-R26, N4-D82); o aceite completo em C, B e o mínimo de A; **a prova em prod** e **o release** (N4-D84).
- **Gate**: G-inv; G-N3 consolidado; G5/G6 consolidado; as seis espécies com CN.
- **Mede primeiro**: as alturas da linha de aviso com o motivo em 15 dp (div. 1014).
- **Requisitos**: N4-R6, N4-R7, N4-R8, N4-R9, N4-R10, N4-R23, N4-R24, N4-R26 (o aparelho). **Aceites**: A-N4-6, A-N4-7,
  A-N4-8, A-N4-9, A-N4-10, A-N4-23, A-N4-24, A-N4-26 (executor; **Marcel** na coluna dele), e mais dois (div. 1026):
  - **aceite (i) — o favoritar em prod pelo app** (N4-D84; N4-R7; regra 12): na **conta de audit**, num **recurso
    descartável** criado pelo Marcel; o **orçamento** de requests e escritas declarado **antes** e aprovado pelo Marcel; a
    evidência: o `PUT` com `{"id","is_favorite"}` (corpo pelo gate da N4-PR1), o 200 com a linha inteira, o cache atualizado
    sem sync, a estrela no estado final; favoritar e desfavoritar (o `is_favorite` volta ao inicial; o `updated_at` não,
    herança D, N4-D39); a contabilidade real ao lado do orçamento; o descartável fica para o Marcel apagar;
  - **aceite (ii) — o release do N4 no Tab** (N4-D84, N4-D55): o APK de release da `main` do bloco instalado por
    `install -r`, com o sha256; a prova **sem Metro e sem `adb reverse`** (`lsof` das portas vazio, `reverse` vazio): o app
    abre em S1 sem login, `Buscar música` abre a L, a L lista a biblioteca do cache, V e o palco avulso abrem; `FATAL` 0; o
    Tab fica com o release.

> **Errata da N4-PR3** `[N4-PR3, 2026-10-03; div. 1026]`: os dois aceites acima, escritos sem número, passam a ser
> **A-N4-27** (o aceite (i), o favoritar em prod pelo app) e **A-N4-28** (o aceite (ii), o release do N4 no Tab), como a
> div. 1026 propôs. **Nada se renumera**: A-N4-1…A-N4-26 ficam como estão, e as duas linhas novas da tabela do §2 apontam
> para o texto deste item.

### Encerramento

O `N4-ENCERRAMENTO.md`, com a herança da §4 e as corridas do bloco no `CI-FAIXA.md` (regra 22).

---

## 4. Herança, com destino

| # | item | origem | destino |
| --- | --- | --- | --- |
| 1 | **faixa A inteira** — as molduras `N4-A-*` e a lista de inalcançáveis de cada PR | N4-D12 | **N5** |
| 2 | **quebra de linha na letra** — cobre o palco **e V** (o corte de ≈ 56 colunas em C, ≈ 26 em A) | N4-D13; N4-D66 (P-O5) | **bloco próprio, entre o N4 e o N5** |
| 3 | **as notas da música no palco** | N4-D57 | **encerramento do N4** nomeia o bloco |
| 4 | **botões de palavra por ícone** no site e nas telas que já existem no tablet — entre eles o ***Baixar* do palco** (com setlist e avulso), que fica com a palavra no N4 (N4-D78) | N4-D71; N4-D78 | **bloco de identidade** (a definir) |
| 5 | **outro ícone para a ação de tocar** (o estudo) | N4-D71 | **bloco de identidade** |
| 6 | **o código de cores por tipo** (o estudo da seção 5b; P-T6…P-T9) | N4-D70, N4-D71 | **bloco de identidade** |
| 7 | **os tamanhos 13 e 20 dp** que o app usa como literal (div. 1016; a L os usa como a S4, N4-D79) | div. 1016; N4-D79 | **bloco de identidade** |
| 11 | **um nome genérico para o ícone de baixar** (`baixar-setlist` serve ao arquivo da música em V) | div. 1025 | **bloco de identidade** |
| 8 | compasso, capo e afinação, que o site não salva | N4-D31 | **Bloco D** |
| 9 | o tema claro nas telas de lista (L, V, S1…) | brief §4 regra 12 | herança do V1, **fora do N4** |
| 10 | o rodapé do picker sob o teclado em B (div. 450) — **não** se repete na L, que não tem rodapé (folha, `N4-*-L-teclado`) | N3 | **polimento do nativo, pós-N3** (sem mudança) |

---

**Decisões do Marcel na N4-PR7** `[Marcel, 2026-10-06]`: **N4-D96** — o arco da estrela em voo entra com os números da
folha (42 × 42, r 19, traço 2), literal declarado; **N4-D97** — o `maxWidth` 560 dos estados centrais de L é o de S1/S4,
cópia declarada. Os dois vão à herança do bloco de identidade, com os 13 e 20 da N4-D79 (`N4-PR7-anexos/README.md` §0).

**A próxima PR desta lista** (N4-D72): depois do merge do congelamento, a **PR-3 — core das frases**. *(Depois da N4-PR4: a
**PR-5 — core da biblioteca**.)*

# DESIGN-N4 — a biblioteca no tablet

Congelado no **N4 · PR de desenho**, 2026-10-02. Molde: [`docs/native/DESIGN-N3/README.md`](../DESIGN-N3/README.md). Brief:
[`docs/native/N4-BRIEF.md`](../N4-BRIEF.md). Os requisitos e aceites que as PRs de implementação medem contra esta folha
estão em [`docs/native/N4-REQUISITOS.md`](../N4-REQUISITOS.md) — o N4 não tem PRD (N4-D18).

Conteúdo desta pasta:

| arquivo | o que é |
| --- | --- |
| `README.md` | este documento — o que a folha é, as decisões, as erratas, as medidas a conferir e o aparato |
| `telas.html` | a folha da **rodada 5**: 147 molduras normativas, 7 amostras e 7 de estudo, arquivo único offline (`Octavia N4 · a biblioteca no tablet · rodada 5`) |
| `icones.html` | o estudo dos ícones de tipo (`Octavia N4 · estudo dos ícones de tipo`) — **registro**, não normativo (§3) |
| `SHA256SUMS` | impressão digital dos dois congelados (o README fica **fora**, como no N2 e no N3) |

**Sem `telas.pdf`** — div. 1005: o `DESIGN-N3` não gerou o PDF dele, recebeu-o do designer (`DESIGN-N3/README.md` §6,
*"origem dos arquivos"*), e desta vez nenhum PDF veio. A folha diz, na seção 9, *"O telas.pdf sai da impressão deste
arquivo no congelamento"*; imprimir aqui seria um método que nenhum congelamento usou. Fica sem PDF até o aval dizer
outra coisa (pergunta 9 da §10).

`[medido]` = comando + saída literal nesta sessão. Os dois HTML são **gerados por script** (um pacote que se desempacota
no navegador): toda conferência da §5 renderizou o arquivo no Chromium do Playwright do repositório
(`node_modules/.pnpm/playwright@1.55.0`), sem rede, e leu o DOM. Os scripts ficaram no scratch da sessão, sem arquivo novo
no repositório (como a §4.2 do `DESIGN-N3`); a saída de cada um está verbatim na §5.

---

## 1 · O que a folha é

**Quatro superfícies, nas três faixas, em todos os estados do §5 do brief**:

| superfície | o que é | molduras normativas |
| --- | --- | --- |
| **L** — a biblioteca | a lista de todas as músicas, com busca, cinco chips de filtro, favoritar na linha, visualizar e tocar | 14 estados × 3 faixas = **42** (mais 3 amostras `L-linhas`) |
| **V** — a visualização | o cadastro da música: cabeçalho, detalhes, notas da música, datas e o corpo pelo leitor do palco | 17 × 3 = **51** |
| **S1** — a entrada, **(b) absorver** | S1 de hoje, repetida como controle; muda só o destino de `Buscar música` | 6 × 3 = **18** |
| **palco avulso sem setlist** e a busca que ele abre | a barra sem nome de setlist, sem índice; a S4 sem *Nesta setlist* | 11 × 3 = **33** |
| telas que já existem, com os ícones de tipo novos | a barra do palco com setlist (`S3-setlist-icones`) | **3** (mais 3 amostras `S2-linhas-icones` e a `N4-B-L-tipos`) |
| **total** | | **147** normativas · 7 amostras · 7 de estudo (`-cor`) |

| faixa | largura | desenhada em | no N4 |
| --- | --- | --- | --- |
| **C** | > 960 dp | 1138 × 627 | implementada |
| **B** | 700–960 dp | 711 × 1054 | implementada |
| **A** | < 700 dp | 411 × 874 | desenhada; **não quebra** no N4, implementada no N5 (N4-D12) |

O cabeçalho da folha, verbatim: *"147 molduras normativas + 7 amostras · + 7 molduras de estudo (cor) · 3 ícones novos + 4
de tipo substituídos · catálogo 41 · 10 frases novas · tokens P-T1–T3 · 10 perguntas decididas"*.

**O que é normativo e o que não é:**

- **Normativo**: as 147 molduras do índice sem marca, as tabelas *"0 · o sistema em uma tabela"* e *"6 · medidas por
  origem"*, e as decisões das seções 7 e 8 da folha — com as erratas da §6 prevalecendo.
- **As amostras `N4-*-L-linhas`** são a **única** moldura de sete estados da linha (arquivo não baixado, baixando,
  falhou, título longo, tipo desconhecido, item inválido, pressionada): valem como **normativas para a linha** (div. 1017).
- **As telas que já existem** (`N4-*-S3-setlist-icones`, `N4-*-S2-linhas-icones`, `N4-B-L-tipos`): normativas **só para
  o desenho do ícone de tipo** (N4-D69). A composição continua a do congelado V1/N3 (div. 1017; N4-E2).
- **Não normativo**: o **estudo de cor** (seção 5b, as sete molduras `-cor` e os tokens P-T6…P-T9 — N4-D70) e o
  **`icones.html`**, que é o registro do estudo dos ícones de tipo. O estudo recomendou `L2 · A só` e `C1 · grade do
  acorde`; a rodada 5 escolheu **L1 · Aa** e **C2 · palheta** (a folha registra o porquê: *"num app de cifras, um A
  sozinho lê como o acorde de Lá"*). Vale a folha.

**A regra que a folha herda e não reabre** (brief §4.1): *"quando não cabe, a composição empilha; o conteúdo não sai."*

---

## 2 · As cinco rodadas, uma linha cada

| rodada | o que decidiu (a folha, seção do cabeçalho e seção 9) |
| --- | --- |
| **antes do desenho** | ação é ícone nas telas novas, com nome acessível de frase inteira e alvo ≥ 48; frases do site contam como existentes, e a do tablet vence quando os dois têm; nenhum título, artista ou letra real; A não se corta |
| **1** | as duas entradas lado a lado (conviver × absorver), as dez perguntas respondidas como proposta, P-F1…P-F11, P-T1…P-T5, P-I1…P-I3, P-O1…P-O6, P-X1…P-X3 |
| **2** | **(b) absorver** (saem as 21 molduras de conviver, P-I3, P-F2, P-T5); L abre sem teclado; Q3–Q6, Q8, Q10 aceitas; palco avulso aceito com a S4 sem *Nesta setlist*; os mínimos da Q9 inexistentes; P-O3 e P-O6 sim, P-O1, P-O2 e P-O5 não |
| **3** | o ▶ de V é só ícone; **duas colunas em C** (P-T3 entra, P-T4 sai, e7 e e10 saem); o custo de ≈ 56 colunas registrado; saem as três `-largo` |
| **4** | P-T4 retirado, confirmado; os ícones de tipo mudam de desenho no catálogo; o código de cores vira estudo |
| **5** | os quatro ícones de tipo do estudo (Aa, palheta, linhas com um 2, nota) aplicados em todas as molduras, 20 na linha; o código de cores **não entra** (P-O7 aceita); o ponto separador solto em A corrigido; **a folha fecha** |

---

## 3 · Decisões do Marcel no desenho — N4-D58…D71 `[Marcel, 2026-10-02]`

Texto verbatim da decisão.

**N4-D58** Nas telas novas do N4, **ação é ícone**, com nome acessível em frase inteira e alvo mínimo de 48; criam-se os
ícones necessários. Os controles das telas que já existem não mudam neste bloco.

**N4-D59** **Entrada: absorver.** `Buscar música` em S1 abre a biblioteca. S1 não muda em nenhuma faixa. A tela de busca
continua existindo, aberta só pela busca do palco. Errata da N4-D11 e da N4-D33.

**N4-D60** A biblioteca **abre sem o teclado**; o campo ganha foco no toque.

**N4-D61** Na linha, o toque **visualiza**; a estrela e o ▶ são controles próprios. O ▶ é **só ícone**, na linha e na
visualização; a frase P-F1 fica só como nome acessível.

**N4-D62** Aceitas: a segunda linha sempre com o tipo e o artista depois, quando existe; as duas datas no fim dos
detalhes; cinco chips com contagem fixa, tipos por "ou" e Favoritas por "e"; o estado do arquivo na segunda linha, com
*Baixar* só na visualização e no palco; a estrela inerte com arco até a resposta, sem otimismo; o rótulo *notas da
música*.

**N4-D63** Palco avulso: `AVULSA` sem nome de setlist; o índice sai da barra de baixo; o voltar leva à origem, na mesma
posição; com zero setlists abre igual; a busca aberta do avulso não tem a seção *Nesta setlist*; o favoritar em andamento
continua fora da visualização, sem aviso na volta.

**N4-D64** As três medidas da N4-D17 ficam **inexistentes por desenho** (nem 420, nem 120). A forma disso no tipo do pacote
se decide na PR que tocar o pacote.

**N4-D65** A visualização em C tem **duas colunas**: detalhes ao lado do leitor (P-T3, 340). Custo registrado: o leitor
fica com cerca de 56 colunas em C e corta linhas que o palco mostra inteiras, até o bloco da quebra de linha.

**N4-D66** Objeções: P-O1 não (o leitor da visualização fica escuro); P-O2 não (vale a frase do tablet); P-O3 sim
(P-F10); P-O5 não (a visualização não quebra linha no N4; o bloco da quebra passa a cobri-la); P-O6 sim.

**N4-D67** Aceitas: a ordem alfabética (P-X1), a contagem fixa (P-X2), os testIDs como sugestão (P-X3); as frases P-F1 e
P-F3 a P-F11; os tokens P-T1 a P-T3. Retirados: P-F2, P-T4, P-T5, P-I3. O singular *1 resultado* entra, com a PR que o
implementar medindo se toca a tela de busca congelada. *(Medido nesta PR: a S4 já o tem — N4-E5.)*

**N4-D68** Ícones novos: estrela vazada, estrela cheia e tocar (catálogo 39 → 41). *(A conta: div. 1013.)*

**N4-D69** Os **quatro ícones de tipo trocam de desenho** — Letra: Aa; Cifra: a palheta; Tab: linhas com um 2; Partitura:
a nota única — no catálogo, com os mesmos nomes e a mesma caixa, **no app inteiro e no site**. É exceção declarada à
N4-D4, limitada ao desenho desses quatro ícones. Na linha da biblioteca o ícone de tipo fica em 20.

**N4-D70** O **código de cores por tipo não entra no N4**; o estudo fica na folha como registro.

**N4-D71** Itens nomeados para o encerramento do bloco, com destino num bloco de identidade a definir: trocar botões de
palavra por ícones no site e nas telas existentes do tablet; o estudo de outro ícone para a ação de tocar; o código de
cores por tipo. E, já registrado pela N4-D57: as notas da música no palco.

### 3.1 As propostas da folha e o destino de cada uma

| lista | entra | sai | fonte |
| --- | --- | --- | --- |
| frases | **P-F1** (só nome acessível) · **P-F3** *notas da música* · **P-F4** sem rede · **P-F5** em voo · **P-F6** *Voltar para a visualização* · **P-F7** *Ver “{título}”* · **P-F8** *1 resultado* (já existe — N4-E5) · **P-F9** *Só {tipo} ({n})* · **P-F10** L vazia · **P-F11** L falha sem cache | **P-F2** | N4-D61, D67 |
| tokens | **P-T1** `faixas.*.lib.filtros` (C 64 · B 64 · A 120) · **P-T2** `faixas.*.lib.linha` (80 · A mín. 80, cresce) · **P-T3** `faixas.C.view.coluna` (340) | **P-T4**, **P-T5**; P-T6…P-T9 (cor) não entram | N4-D65, D67, D70 |
| ícones | **P-I1a** estrela vazada · **P-I1b** estrela cheia · **P-I2** tocar · **P-I9…P-I12** os quatro de tipo, substituindo `letra`, `cifra`, `tab`, `partitura` | **P-I3**; P-I4…P-I8 substituídos | N4-D68, D69 |
| objeções | **P-O3**, **P-O6**, **P-O7** | **P-O1**, **P-O2**, **P-O5**; P-O4 sem objeto | N4-D66, D70 |
| outras | **P-X1** ordem alfabética pt-BR · **P-X2** contagem fixa · **P-X3** testIDs como sugestão (`lib-campo`, `lib-filtro-{tipo}`, `lib-filtro-favoritas`, `lib-linha-{id8}`, `lib-favoritar-{id8}`, `lib-tocar-{id8}`, `view-voltar`, `view-favoritar`, `view-tocar`) | — | N4-D67 |

---

## 4 · As medidas a conferir primeiro

A tabela **"6 · medidas por origem"** da folha, copiada. Origens da folha: `[dump]` = `N4-BRIEF-anexos/MEDIDAS.md`, lido dos
dumps · `[token]` = valor do pacote · `[folha N3]` = desenhado no N3 · `[derivado]` = conta sobre as outras origens ·
`[estimado]` = conta do designer sem medida, *"a conferir primeiro, com a tolerância de 4 dp do N3 (N3-D23)"*.

| # | elemento | C | B | A | origem | conta / nota |
| --- | --- | --- | --- | --- | --- | --- |
| m1 | canvas | 1138 × 627 | 711 × 1054 | 411 × 874 | [dump] / [folha N3] | MEDIDAS §1 |
| m2 | L · barra | 88 | 88 | 88 | [dump] | = S4 |
| m3 | L · campo | ≈ 1026 × 48 | ≈ 599 × 48 | ≈ 315 × 48 | [derivado] | largura − 2 × margem − 48 − 16; altura [dump] 48 |
| m4 | chip de filtro · altura | 48 | 48 | 48 | [token] touch.min | |
| **e1** | chip · larguras | Letra 112 · Cifra 110 · Tab 92 · Partitura 140 · Favoritas 140 | igual | igual | **[estimado]** | ícone 20 + 8 + rótulo 15 + 8 + contagem 13 + 2 × 12 |
| **e2** | chips somados | 626 de 1090 | 626 de 663 · folga 37 | 2 linhas (330 · 288) | **[estimado]** | 5 chips + 4 vãos de 8 |
| m5 | L · faixa de filtros | 64 | 64 | 120 | [derivado] | 8 + 48 + 8 · em A 8 + 48 + 8 + 48 + 8 |
| m6 | L · régua | 50 | 50 | 50 | [derivado] | 16 + 18,2 [dump] + 14 — *a conta dá 48,2* (div. 1015) |
| m7 | L · linha | 80 | 80 | 80 mín. | [dump] | = resultado da S4 |
| m8 | L · vão entre linhas | 12 | 12 | 12 | [derivado] | = S4 |
| m9 | L · estrela, ▶ | 48 × 48 | 48 × 48 | 48 × 48 | [token] touch.min | |
| m10 | L · texto da linha | ≈ 950 | ≈ 523 | 255 | [derivado] | linha − padding − 48 − 4 − 48 − 4 |
| **e3** | L · título da linha | 20 / 600, linha 26 | igual | igual, até 2 linhas | **[estimado]** | a S4 mede 29,8 de caixa [dump] |
| **e4** | L · linha com título em 2 linhas | — | — | 106 | **[estimado]** | 10 + 26 + 26 + 2 + 22 + 10 + bordas |
| m11 | linha de aviso | 48 · +20 por linha | 48 · +20 | 48 · +20 · ação desce | [folha N3] | N3-D19 |
| m12 | V · cabeçalho | 88 | 88 | — | [token] | bar.top + space.xl |
| **e5** | V · cabeçalho em A | — | — | 88 mín. · ≈ 196 com o título longo | **[estimado]** | 10 + título 4 × 30 + meta 2 × 28 + 10 |
| **e6** | V · coluna de detalhes em C | 340 | — | — | **[estimado]** | token P-T3 |
| m26 | V · ▶ e estrela | 48 × 48 | 48 × 48 | 48 × 48 | [token] touch.min | o mesmo controle da linha da L |
| m13 | V · leitor | mono 22 · 34 | igual | igual | [folha N3] | o do palco |
| m14 | V · colunas visíveis do leitor | ≈ 56 | ≈ 49 | ≈ 26 | [derivado] | largura útil − 60, ÷ 13,2; o palco em C mostra ≈ 81 — *B conta sobre 711* (div. 1015) |
| m24 | V · linhas visíveis em C | ≈ 14 | — | — | [derivado] | (627 − 88 − 44) ÷ 34 |
| m15 | S1 · Nova setlist · Buscar música | 152 × 57,8 · 171,1 × 57,8 | 152 × 58,2 · 171,1 × 58,2 | flex | [dump] | S1 sem mudança |
| m20 | palco avulso · barras | 64 · 96 | 88 · 96 | 144 · 96 | [token] / [dump] | bar.top · faixas.B.palco.barra · bar.stage; A [folha N3] |
| m21 | palco · controles | 64 | 64 | 64 | [token] touch.stage | vão 13 em C e B [dump] — **N4-E4: 66 no dump** |
| m22 | palco · bordas laterais | 170,7 | 106,7 | 61,7 | [dump] / [folha N3] | inalteradas no avulso |
| m25 | S4 aberta do avulso | barra 88 · linha 1089,8 × 80 | barra 88 · linha 663,1 × 80 | barra 88 · linha 379 × 80 | [dump] / [folha N3] | a S4 de hoje, sem a seção *Nesta setlist* |
| m23 | teclado (B) | — | 317 | — | [derivado] | 1054 − (761,3 − 24) |
| **e9** | teclado (C e A) | 300 | — | 300 | **[estimado]** | sem captura em A; C pela metade de C5.png |
| n1 | folha criar/editar · altura mínima em B e A · artista no reordenar em C | inexistente por desenho | inexistente por desenho | inexistente por desenho | — | N4-D64: as três medidas não existem |
| retiradas | e8 · m16 · m17 · m18 · m19 (S1 (a), rodada 2) · e7 · e10 (rodada 3) | — | — | — | — | |

### 4.1 A ordem de conferência das estimadas — a da folha

| ordem | id | o que conferir primeiro na implementação (a folha, verbatim) | PR que mede (proposta, §3 do `N4-REQUISITOS.md`) |
| --- | --- | --- | --- |
| 1 | **e1 · e2** | larguras dos chips de filtro em B: a folga de 37 dp (663 − 626) é a mais apertada da folha; acima de ≈ 7 dp a mais por chip, B vai a duas linhas de filtro como A | a da tela L |
| 2 | **e3** | corpo do título da linha da L (20 / 600) contra o token de título de lista | a da tela L |
| 3 | **e4** | a linha da L com título em duas linhas em A (106) | a da tela L (A: só registro, N5) |
| 4 | **e5** | cabeçalho de V em A com o título longo (≈ 196) | a de V (A: só registro, N5) |
| 5 | **e6** | a coluna de detalhes de V em C (340, P-T3) | a de V |
| 6 | **e9** | teclado em C e A (300) | a da tela L |

Pela régua de desenvolvimento, **antes** de a tela mudar (regra 19 do `LOGS-OCTAVIA.md`), e diferença **> 4 dp** contra
esta tabela é errata desta folha, a partir da **N4-E7** (as seis primeiras estão na §6). **A folga que depende de
estimativa**: os cinco chips em B (37 dp). *"A troca de ícone não muda a largura"* (folha, seção 9).

As medidas `[estimado]` da folha usaram **14 dp** no motivo da linha de aviso; o app usa 15 (`size.bodySmall`) — a
**div. 409** do N3 outra vez (div. 1014). Por isso as contagens de linha da linha de aviso que a folha dá (P-F4 em B, 1
linha; o pior caso do favoritar, C 1 · B 2 · A 4) também se conferem pela régua.

---

## 5 · A conferência da folha antes de congelar `[medido]`

Contra o brief e contra as decisões da §3; o desenho não foi julgado.

### 5.1 A saída

```
$ node conferir.mjs        # renderiza DESIGN-N4/telas.html e lê o DOM
1. cabeçalho: OCTAVIA N4 · A BIBLIOTECA NO TABLET | RODADA 5 · FECHA A FOLHA · 2026-10-02
2. índice: 161 linhas — {"normativa":147,"amostra":7,"estudo":7} · DOM: 161 molduras · mesmo conjunto e ordem: true
   IDs únicos: 161 · com "conviver" ou "largo": 0
   dimensão desenhada ≠ legenda: 0 · requests externas ao renderizar: 0
3. cobertura (estado → faixas):
   L-base                       C B A
   L-rolagem                    C B A
   L-linhas                     C·a B·a A·a
   L-carregando                 C B A
   L-vazia                      C B A
   L-busca-sem-resultado        C B A
   L-filtro-sem-resultado       C B A
   L-favoritas-1                C B A
   L-favoritas-0                C B A
   L-sem-rede                   C B A
   L-falha-com-cache            C B A
   L-falha-sem-cache            C B A
   L-favoritando                C B A
   L-favoritar-falhou           C B A
   L-teclado                    C B A
   V-letra                      C B A
   V-cifra                      C B A
   V-cifra-secoes               C B A
   V-tab                        C B A
   V-partitura                  C B A
   V-campos-vazios              C B A
   V-sem-artista                C B A
   V-titulo-longo               C B A
   V-tipo-desconhecido          C B A
   V-corpo-vazio                C B A
   V-pdf-baixando               C B A
   V-arquivo-nao-baixado        C B A
   V-arquivo-falhou             C B A
   V-formato                    C B A
   V-favoritando                C B A
   V-favoritar-falhou           C B A
   V-sem-rede                   C B A
   S1-absorver-base             C B A
   S1-absorver-sincronizando    C B A
   S1-absorver-vazia            C B A
   S1-absorver-sem-rede         C B A
   S1-absorver-falha-com-cache  C B A
   S1-absorver-falha-sem-cache  C B A
   S3-avulso-letra              C B A
   S3-avulso-cifra              C B A
   S3-avulso-tab                C B A
   S3-avulso-partitura          C B A
   S3-avulso-nao-baixado        C B A
   S3-avulso-formato            C B A
   S3-avulso-invalido           C B A
   S3-avulso-titulo-longo       C B A
   S3-avulso-sem-artista        C B A
   S3-avulso-claro              C B A
   S4-avulso-sem-setlist        C B A
   S3-setlist-icones            C B A
   S2-linhas-icones             C·a B·a A·a
   L-tipos                      B·a
   L-base-cor                   C·e B·e A·e
   L-tipos-cor                  C·e
   V-cifra-cor                  C·e
   S3-avulso-cifra-cor          C·e
   S3-avulso-claro-cor          C·e
5a. cores fora dos tokens do pacote:
    #100E16 normativa 3 molduras, ex. N4-C-S3-avulso-claro
    #BFC0A3 estudo 4 molduras, ex. N4-C-L-base-cor
    #61D19A estudo 6 molduras, ex. N4-C-L-base-cor
    #51CADE estudo 4 molduras, ex. N4-C-L-base-cor
    #E88FCB estudo 4 molduras, ex. N4-C-L-base-cor
    #100E16 estudo 1 molduras, ex. N4-C-S3-avulso-claro-cor
    #00774B estudo 1 molduras, ex. N4-C-S3-avulso-claro-cor
5b. tamanhos de fonte fora de size/zoomSteps:
    10 L-vazia L-favoritas-1 L-sem-rede L-falha-sem-cache V-letra …(6)
    13 L-base L-rolagem L-vazia L-busca-sem-resultado L-filtro-sem-resultado …(38)
    19 S3-avulso-letra S3-avulso-cifra S3-avulso-tab S3-avulso-partitura S3-avulso-nao-baixado …(11)
    20 L-base L-rolagem L-linhas L-favoritas-1 L-sem-rede …(23)
    14.5 S1-absorver-falha-com-cache
4. textos distintos nas molduras não-estudo: 226
    "1 resultado" → N4-C-L-favoritas-1 N4-B-L-favoritas-1 N4-A-L-favoritas-1
    "Sua conta não tem setlists. Crie na versão web — elas aparecem aqui na próxima sincronização." → N4-C-S1-absorver-vazia N4-B-S1-absorver-vazia N4-A-S1-absorver-vazia
    "nenhuma setlist" → N4-C-S1-absorver-vazia N4-B-S1-absorver-vazia N4-A-S1-absorver-vazia
    "nenhum conteúdo ainda" → N4-C-L-vazia N4-B-L-vazia N4-A-L-vazia
    "nenhuma favorita" → N4-C-L-favoritas-0 N4-B-L-favoritas-0 N4-A-L-favoritas-0
    "Favoritas" → N4-C-L-base N4-B-L-base N4-A-L-base
    "Detalhes" → N4-C-V-letra N4-B-V-letra N4-A-V-letra
    "Biblioteca" → N4-C-L-carregando N4-B-L-carregando N4-A-L-carregando
    "· mostrando dados de há 44 min" → N4-C-L-falha-com-cache N4-B-L-falha-com-cache N4-A-L-falha-com-cache
   N4-A-S3-setlist-icones: ["1 DE 8","Ensaio de retrato","Manhã de ensaio","·","Letra"]

$ node icones-conf.mjs     # o `d` de cada <path> 24/20 das molduras não-estudo × icones.ts × as linhas P-I da folha
desenhos (path d) distintos nas molduras não-estudo, viewBox 24/20: 57
  = no catálogo do pacote: 33 · nas linhas P-I da folha: 14 · em nenhum dos dois: 10
  linhas P-I com desenho na tabela: P-I10 P-I11 P-I12 P-I1a P-I1b P-I2 P-I9
   ? M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13 · 94 molduras, ex. N4-C-L-base
   ? M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14 · 21 molduras, ex. N4-C-L-linhas
   ? M12 3a9 9 0 0 1 9 9 · 12 molduras, ex. N4-C-L-linhas
   ? M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16 · 9 molduras, ex. N4-C-L-busca-sem-resultado
   ? M6 5h12a2.5 2.5 0 0 1 2.5 2.5v10.5a2.5 2.5 0 0 1-2.5 2.5H6a2.5 2.5 0 0 · 9 molduras, ex. N4-C-S1-absorver-base
   ? M12 3a9 9 0 0 1 0 18 · 9 molduras, ex. N4-C-S1-absorver-base
   ? M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z · 9 molduras, ex. N4-C-S1-absorver-base
   ? M12 7.7a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6 · 9 molduras, ex. N4-C-S1-absorver-base
   ? M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0 · 9 molduras, ex. N4-C-S1-absorver-base
   ? M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8 · 27 molduras, ex. N4-C-S3-avulso-letra
```

O `#000000` que o computado devolve como `fill` de todo elemento HTML (o padrão do navegador, nada desenhado) e o `none`
do `stroke` saíram da conta 5a; a primeira corrida os listava (o script foi ajustado e rodado de novo, sem outra mudança).

### 5.2 Os seis itens

| # | o que o prompt pede | resultado |
| --- | --- | --- |
| **1** | cabeçalho *rodada 5 · fecha a folha* | **confere**: `RODADA 5 · FECHA A FOLHA · 2026-10-02` |
| **2** | 147 normativas · 7 amostras · 7 de estudo; IDs únicos; nenhum `conviver` nem `largo` | **confere**: 147 · 7 · 7 pelo índice; as 161 do índice são as 161 molduras do DOM, na mesma ordem; 161 IDs únicos; 0 com `conviver` ou `largo` (as duas palavras só aparecem na prosa que registra a retirada); 0 molduras com dimensão diferente da legenda |
| **3** | cobertura estado × faixa × ID | **todo estado do §5 do brief tem moldura nas três faixas** (§5.3) — com três ressalvas: sete estados da linha só nas amostras `L-linhas` (div. 1017); as seis espécies do favoritar com falha numa tabela e **uma** moldura, a do pior caso (div. 1018); a S1 vazia desenhada como era no V1 (N4-E1) |
| **4** | frases fora do §8 do brief e da lista P-F | §5.4 — nenhuma frase **nova** fora da lista; as de fora do §8 existem no tablet ou no site, salvo as duas da S1 vazia do V1 (N4-E1). A P-F8 já existe (N4-E5) |
| **5** | tokens e ícones fora do pacote e das listas P-T e P-I | §5.5 — uma cor (`#100E16`, N4-E3); três tamanhos de fonte que não são token (div. 1016); dez desenhos de ícone que não são, letra a letra, o do catálogo nem os P-I — cinco são primitivas do catálogo escritas como `path` (a mesma geometria), cinco são ícones do catálogo redesenhados (N4-E6) |
| **6** | a tabela de medidas, com as estimadas na ordem da folha | §4 |

### 5.3 Cobertura — estado do brief × faixa × moldura

Toda linha tem as três faixas: o ID da moldura é `N4-{C,B,A}-<id>`.

| superfície | estado (§5 do brief) | id da moldura |
| --- | --- | --- |
| L | base | `L-base` |
| L | sincronizando, sem nada no aparelho | `L-carregando` |
| L | vazia | `L-vazia` |
| L | busca sem resultado | `L-busca-sem-resultado` |
| L | filtro sem resultado (com *Só as favoritas* com 0) | `L-filtro-sem-resultado`, `L-favoritas-0` |
| L | sem rede | `L-sem-rede` |
| L | falha de sincronização, com o que está no aparelho | `L-falha-com-cache` |
| L | falha de sincronização, sem nada no aparelho | `L-falha-sem-cache` |
| L | arquivo ainda não baixado, na linha | `L-linhas` (amostra; div. 1017) |
| L | download do arquivo com falha, na linha | `L-linhas` (amostra) |
| L | favoritando | `L-favoritando` |
| L | favoritar com falha, por espécie | `L-favoritar-falhou` — o pior caso; as seis espécies na tabela da legenda (div. 1018) |
| L | favorita e não favorita | `L-base`, `L-rolagem`, `L-linhas` |
| L | título longo · tipo desconhecido · item inválido | `L-linhas` (amostra) |
| L | sem artista | `L-base`, `L-linhas` |
| L | **lista longa, em rolagem** (acrescentado na revisão do brief) | `L-rolagem` |
| L | **busca com o teclado aberto** (acrescentado na revisão do brief) | `L-teclado` |
| V | base por tipo: Letra · Cifra sem seções · Cifra com seções · Tab · Partitura | `V-letra` · `V-cifra` · `V-cifra-secoes` · `V-tab` · `V-partitura` |
| V | campos vazios | `V-campos-vazios` |
| V | vazio por tipo | `V-corpo-vazio` (uma frase para os quatro, N4-D66 P-O2) |
| V | PDF carregando · arquivo não baixado · PDF com erro | `V-pdf-baixando` · `V-arquivo-nao-baixado` · `V-arquivo-falhou` |
| V | formato que o app ainda não mostra | `V-formato` |
| V | favorita · favoritando · favoritar com falha · sem rede | `V-letra` (favorita), `V-cifra` (não favorita) · `V-favoritando` · `V-favoritar-falhou` · `V-sem-rede` |
| V | título longo · sem artista · tipo desconhecido | `V-titulo-longo` · `V-sem-artista` · `V-tipo-desconhecido` |
| S1 | base · sincronizando · vazia · sem rede · falha com e sem cache — **só (b)**, N4-D59 | `S1-absorver-base` · `-sincronizando` · `-vazia` (N4-E1) · `-sem-rede` · `-falha-com-cache` · `-falha-sem-cache` |
| palco avulso | Letra · Cifra · Tab · Partitura · arquivo não baixado · formato · item inválido · título longo · sem artista | `S3-avulso-letra` · `-cifra` · `-tab` · `-partitura` · `-nao-baixado` · `-formato` · `-invalido` · `-titulo-longo` · `-sem-artista` |
| *das rodadas* | o palco avulso no claro | `S3-avulso-claro` (amostra da Letra; *"os demais estados seguem a mesma troca de tinta do S3-claro"*) |
| *das rodadas* | a busca aberta do palco avulso sem setlist (N4-D63) | `S4-avulso-sem-setlist` |
| *das rodadas* | as telas que já existem, com os ícones de tipo novos (N4-D69) | `S3-setlist-icones` (N4-E2); amostras `S2-linhas-icones`, `N4-B-L-tipos` |

**O palco avulso com zero setlists** não tem moldura própria: a folha decide que ele *"agora abre igual"* (legenda de
`N4-*-S3-avulso-letra`; N4-D63), e a composição é a mesma do avulso com setlists. O aceite o mede (`N4-REQUISITOS.md`,
N4-R16).

### 5.4 Frases fora do §8 do brief e da lista P-F

Nenhuma frase **nova** fora da lista P-F. As que não estão no §8 do brief nem na P-F, e de onde vêm:

| frase na moldura | de onde vem `[medido: git grep]` | situação |
| --- | --- | --- |
| *nenhum conteúdo ainda* (`L-vazia`) | site, `components/library/frases-lista.ts:56` `"lib.vazio"` | existente (frase do site; a folha a usa como título) |
| *nenhuma favorita* (`L-favoritas-0`) | site, `frases-lista.ts:33` `"dash.vazio.favoritas"` | existente |
| *Favoritas* (o quinto chip) | site, `frases-lista.ts:24`, `:31` | existente — o §8 tem *Só as favoritas*, que vira o nome acessível pela P-F9 |
| *Detalhes* (`V-*`) | site, `components/content-viewer/ContentSidebar.tsx:20` (`view.detalhes`) | existente; o brief §7 a cita |
| *álbum · dificuldade · gênero · tom · andamento · etiquetas*, *{x} BPM*, *criado · alterado*, *Iniciante · Intermediário · Avançado* | o §7 do brief | do brief (§7, não §8) |
| *Voltar para a biblioteca* (nome acessível, legenda do avulso) | site, `components/content/frases-visualizacao.ts:10` | existente |
| *Biblioteca* sozinha e *—* (a régua de `L-carregando`) | recorte de *Biblioteca · {n} músicas* (`packages/core/src/frases.ts:411`) | não é frase: a régua sem o número enquanto ele não existe; a PR da tela decide a forma (pergunta 8) |
| *· mostrando dados de há 44 min* (`L-falha-com-cache`) | tablet, `apps/native/src/screens/SetlistsScreen.tsx:612` | existente (S1e) |
| *· última sincronização agora*, *garantida offline*, *parcial*, *nada a baixar*, *todos os arquivos neste aparelho*, *{n} de {m} arquivos baixados*, *sem data*, *Baixar esta setlist*, *Nenhuma setlist foi salva neste aparelho ainda…* | tablet, `SetlistsScreen.tsx` | existentes (S1 de hoje) |
| *nenhuma setlist* · *Sua conta não tem setlists. Crie na versão web — elas aparecem aqui na próxima sincronização.* (`S1-absorver-vazia`) | **nenhum** arquivo de `apps/native/src` nem de `packages/core/src` | **não existem no app de hoje** — são o S1f do V1; o app mostra o do N2 → **N4-E1** |
| *1 resultado* (P-F8) | tablet, `apps/native/src/screens/SearchScreen.tsx:156` (`n === 1 ? 'resultado' : 'resultados'`) | **já existe** → **N4-E5** |
| *página 1 de 12*, *1 DE 8*, *AVULSA* | tablet, palco (`StageScreen.tsx:529`, a barra) | existentes |
| *teclado do sistema · 300 dp*, *pior caso · comprimento · fixture*, *partitura · página 1 de 12* (o desenho da página) e as etiquetas `P-F*` em 10 dp | anotação do desenho | não são texto do app |

Títulos, artistas, corpos e nomes de seção (*Content*, *Verse 1*, *Intro*) são fixture do projeto (regra 10 do
`LOGS-OCTAVIA.md` não alcança).

### 5.5 Tokens e ícones fora do pacote e das listas P-T e P-I

- **Cores**: nas normativas, uma — **`#100E16`**, a tinta do texto no claro (`S3-avulso-claro`), contra o
  `light.text` = `#100F16` do pacote → **N4-E3**. As cinco de fora nas molduras de estudo são a paleta P-T6…P-T9, que
  não entra (N4-D70). O resto, todo token do pacote (`packages/identidade/src/tokens.ts:16-53`).
- **Tamanhos de fonte**: 13, 19, 20 e 14,5 não são token de `size` nem de `zoomSteps` (`tokens.ts:101-115`). 20 e 13 são
  **literais que o app já usa** fora do pacote (`git grep -E "fontSize: *[0-9]+" -- apps/native/src`: 17 × `fontSize:
  13`, 9 × `fontSize: 20`; o título de resultado de 20 e o corpo 13 da sublinha da S4); 19 está só nas molduras do palco
  avulso (a barra do palco de hoje); 14,5 só em `S1-absorver-falha-com-cache`. Nenhum é proposta de token — div. 1016. O
  10 é a etiqueta `P-F*` do desenho.
- **Ícones**: os 57 desenhos distintos das molduras não-estudo — **33** do catálogo, **14** das linhas P-I (P-I1a, P-I1b,
  P-I2, P-I9…P-I12) e **10** de nenhum dos dois. Desses dez: **cinco** são primitivas que o catálogo guarda como círculo ou retângulo e a folha
  escreveu como `path`, com a mesma geometria — a lupa da `busca` (`{ cx: 10.5, cy: 10.5, r: 6.5 }`, `icones.ts:90`), o
  círculo do `apagar` (`r: 8`, `:139`), o de `r: 9` dos estados de setlist, o centro do tema claro (`r: 4`, `:81`) e o
  retângulo do `data` (`:154`); os outros **cinco** são ícones do catálogo **redesenhados à mão** — as duas peças do
  `local` (`:157`: outro contorno, e o furo de raio 2,3 contra 2,4), o arco do `parcial` (a metade, que é dado; o do
  pacote é fixo), o arco de andamento em volta do que está em voo, e uma seta de baixar com linha embaixo que não é o
  `baixar-setlist` (`:144-146`) — → **N4-E6**. Nenhum ícone fora das listas.

---

## 6 · Erratas desta folha — N4-E1…N4-E6

**A folha não se edita**: o congelado fica como está e **a errata prevalece sobre a moldura**. As próximas nascem da régua
e do dump da implementação (diferença > 4 dp contra a §4, a regra da N3-D23), a partir da **N4-E7**.

**N4-E1 — S1 vazia é a do app de hoje, não a do V1** (div. 1007). `N4-*-S1-absorver-vazia` desenha *"nenhuma setlist"* e
*"Sua conta não tem setlists. Crie na versão web — elas aparecem aqui na próxima sincronização."*, o S1f do V1. Desde o N2
(moldura `N2-S1f-criar`) o app mostra a frase `'primeira-setlist'` (*"Nenhuma setlist por aqui ainda. A primeira pode
nascer neste aparelho."*, `packages/core/src/frases.ts:284`) e o botão **`Criar a primeira setlist`**
(`SetlistsScreen.tsx:671-676`) — e é isso que a base do G-inv tem (`N3-PRECHECK-anexos/B5-baseline/B5-S1-S1f-vazia-tab-pai.xml`).
**Vale o app de hoje**: a N4-D59 diz que S1 não muda, e a folha diz que as seis linhas são *"as molduras de hoje"*.

**N4-E2 — o palco com setlist em A tem o artista** (div. 1008). `N4-A-S3-setlist-icones` (recorte 411 × 144) mostra
`1 DE 8 · Ensaio de retrato · Manhã de ensaio · · · Letra`: **sem o artista**, com o `·` sozinho. A moldura de origem,
`N3-A-S3`, tem `· Banda da fixture ·`, e a legenda desta diz *"só o desenho do ícone muda"*. **Vale a `N3-A-S3`**; a
moldura do N4 vale só pelo ícone de tipo.

**N4-E3 — a tinta do palco no claro é `light.text`** (div. 1009). `N4-*-S3-avulso-claro` pinta o texto com `#100E16`; o
token é `light.text` = **`#100F16`** (`tokens.ts:41`). O `#100E16` vem da folha do V1 (`DESIGN-V1/README.md:401`: era o fundo
do PNG antigo do logo). **Vale o token**; o palco avulso no claro é o palco no claro de hoje.

**N4-E4 — o controle do palco mede 66 no dump** (div. 1010). A linha m21 da §4 dá *"palco · controles 64 [token]
touch.stage"*; o controle desenhado é 66 × 66 (64 + a moldura de 1 dp de cada lado), medido na **N3-E16** e no
`N4-BRIEF-anexos/MEDIDAS.md` §4 (*"65,8–66,2 × 65,8"*). Nada muda no desenho: a barra de baixo do avulso tem **um controle
a menos** que a de hoje (sai o índice), e a soma só folga.

**N4-E5 — *1 resultado* não é frase nova** (div. 1011). A folha diz, em `N4-*-L-favoritas-1`, *"O singular é frase nova
(P-F8); hoje a régua só tem {n} resultados"*. A S4 do tablet já escreve `${n} ${n === 1 ? 'resultado' : 'resultados'}`
(`apps/native/src/screens/SearchScreen.tsx:156`). **A P-F8 é frase existente**; a condição da N4-D67 (*"medindo se toca a
tela de busca congelada"*) fica respondida: **não toca** — a S4 não muda.

**N4-E6 — os ícones que já existem são os do catálogo** (div. 1012). Cinco desenhos das molduras são ícones do catálogo
refeitos à mão, com traçado diferente do pacote: as duas peças do `local` dos cartões de S1, o arco do `parcial`, o arco
de andamento (em `L-linhas`, `V-pdf-baixando`, `V-arquivo-nao-baixado`, `S3-avulso-nao-baixado`), e uma seta de baixar
com linha embaixo — em `L-linhas` (*arquivo não baixado*), em `V-arquivo-nao-baixado` e
`V-arquivo-falhou` (o *Baixar*), em `S3-avulso-nao-baixado` e no *Baixar esta setlist* de S1, onde o app usa o
`baixar-setlist` (`SetlistsScreen.tsx:342`). **Vale o desenho do catálogo pelo nome** (`packages/identidade/src/icones.ts`);
nenhum desses traçados é ícone novo. Onde a tela de hoje **não tem** ícone — o *Baixar* do placeholder do palco
(`StageScreen.tsx:824-829`, só o texto) —, o palco avulso fica como o de hoje. O *Baixar* de V é tela nova: pergunta 7 da
§10.

---

## 7 · Erratas ao brief — o que o desenho decidiu diferente do `N4-BRIEF.md`

O brief não se reescreve; o que vale é a decisão.

| brief | o que dizia | o que vale | por quê |
| --- | --- | --- | --- |
| §2.3, §5.3, §9 pergunta 1 | desenhar as duas entradas lado a lado; S1 em C *"não muda fora o controle novo"*; os estados de S1 *"em cada alternativa"* | **só (b) absorver**; **não há controle novo**: S1 não muda em nenhuma faixa, só o destino de `Buscar música` | N4-D59 (errata da N4-D11 e da N4-D33) |
| §2.1, §2.4 | *"duas ações por música"*; abrir *"de S1"* leva ao palco sem setlist | as duas ações e mais o favoritar na linha; **S1 deixa de abrir a busca**: de S1 se chega à L, e da L ao avulso | N4-D59, D61 |
| §2.2 | *"Tocar — abre a mesma música no palco"* | o ▶ **só ícone**; *Tocar “{título}”* é só nome acessível | N4-D61 |
| §2.4, §9 pergunta 7 | o que ocupa o lugar do nome da setlist e da barra de baixo | `AVULSA` sem nome; o índice **sai**; o voltar leva à origem, na mesma posição; a S4 aberta do avulso sem *Nesta setlist* | N4-D63 |
| §4 regra 12 | as telas novas no escuro; o palco avulso com os dois temas | igual, e o **leitor de V também escuro** (P-O1 recusada) | N4-D66 |
| §5.2 | *"vazio por tipo"*, com as quatro frases do site como referência | uma frase do tablet para os quatro (*este item não tem conteúdo*) | N4-D66 (P-O2) |
| §7, §9 pergunta 10 | o rótulo das notas é pergunta | *notas da música* (P-F3) | N4-D62 |
| §9 pergunta 4 | as datas: o desenho propõe | numa linha, no fim dos detalhes | N4-D62 |
| §9 pergunta 9 | os três mínimos da N4-D17: o desenho propõe ou declara | **inexistentes por desenho** | N4-D64 |
| §10 | *"Duas rodadas"* | **cinco** (§2 deste README) | o desenho |
| §10, o formato | um `telas.html` e o `telas.pdf` | `telas.html` e **`icones.html`**, sem PDF (div. 1005) | o desenho |
| §3, §4 regra 5 | nenhum token fora do pacote; a folha pode propor | P-T1…P-T3 entram (N4-D67); três tamanhos de fonte da folha não são token (div. 1016) | N4-D67 |
| §1 | o tablet escreve só a favorita | igual; **e o catálogo de ícones muda de desenho no app inteiro e no site** — exceção à N4-D4 | N4-D69 |

---

## 8 · O que a folha deixa em aberto

Da seção 9 da folha (*"o que não está resolvido"*), com o destino:

| item | destino |
| --- | --- |
| *"O traço dos quatro ícones de tipo, da estrela e do tocar em 20 dp não foi conferido no aparelho (Tab S6, 2,25; celular, 2,625). O a minúsculo é o primeiro a olhar."* | **olho do Marcel**, no aceite da PR dos ícones (`N4-REQUISITOS.md`, N4-R19); o ajuste que a folha já prevê: o anel de raio 2,75 → 3, sem mudar o A |
| *"A nota (P-I12) pode ser lida como “música” em geral fora do conjunto dos quatro"* | registro; nenhum lugar do N4 mostra a nota sozinha |
| *"As folhas do site (I1) não foram redesenhadas: a troca dos ícones de tipo chega ao site pelo catálogo."* | erratas de ponteiro nos congelados — pergunta 3 da §10 |
| *"O título longo da fixture no cabeçalho de V continua tirado da folha do N3."* | registro (o pior caso desenhado é o do N3, brief §6) |
| *"O telas.pdf sai da impressão deste arquivo no congelamento."* | div. 1005, pergunta 9 |

E o que a conferência da §5 levantou e não é errata: as estimadas da §4.1; a forma da N4-D64 e da P-T3 no tipo do pacote
(div. 1020); o caminho do G-inv para a S4 (div. 1019); a prova da troca de desenho dos ícones (div. 1021).

---

## 9 · Aparato

| item | valor |
| --- | --- |
| **desenho** | Claude Design, contra o brief e os anexos; **não leu o código** |
| **rodadas** | cinco (§2); a 5ª *"fecha a folha"* |
| **origem dos arquivos** | `~/Downloads/n4/telas.html` (2.840.795 B) e `~/Downloads/n4/icones.html` (578.493 B), dados pelo Marcel nesta sessão; copiados sem alteração (`cmp` idêntico) |
| **base** | `origin/main` = `42d1c39` (o merge da #357, o brief) |
| **conferência** | Chromium do Playwright 1.55.0 do repositório, sem rede (0 requests externas), DOM lido por script (§5.1) |
| **rede, aparelho, `.env*`** | nenhuma request a prod, nenhum aparelho, nenhum `.env*` |
| **aval** | Marcel, 2026-10-02 — as catorze decisões da §3 |

**O que prova o congelamento**: o `SHA256SUMS` desta pasta, com os dois arquivos, **sem o `README.md`** `[medido]`:

```
$ shasum -a 256 telas.html icones.html > SHA256SUMS && cat SHA256SUMS && shasum -a 256 -c SHA256SUMS
dba757dd569dc26ee05406aa025f5f6c3e1ba26ec8df3e7f5daec754bf94cc41  telas.html
cbbff402ca1a316bb4a14488e97b0b6c7ce9543ffd88c1c7e98370712e8d4113  icones.html
telas.html: OK
icones.html: OK
```

O `gates-nativos` do CI **não** confere esta pasta: o laço do `.github/workflows/gates.yml:80` lista `DESIGN-V1`,
`DESIGN-N2` e `DESIGN-N3` (div. 1022) — como a div. 398 do N3.

---

## 10 · Perguntas para o aval

Cada uma com as opções e a recomendação. Nenhuma está decidida.

**1 — O fatiamento** (div. 1019, 1020, 1021). A proposta do revisor e a crítica a ela estão no `N4-REQUISITOS.md` §3.
- (a) a proposta do revisor, como veio: PR-3 frases · **PR-4 identidade** (ícones e P-T1…P-T3) · PR-5 core da biblioteca ·
  PR-6 tela L com o destino de `Buscar música` · PR-7 palco avulso · PR-8 V · PR-9 transversais · encerramento.
- **(b) a mesma, com duas mudanças**: (1) a PR-4 leva **os ícones e a forma da N4-D64**, e **não** os tokens P-T1…P-T3,
  que entram na PR da tela que os lê (P-T1 e P-T2 na tela L, P-T3 em V) — token sem leitor é o caso da regra 31 do
  `LOGS-OCTAVIA.md`, e a P-T3 só existe em C (div. 1020); (2) **o palco avulso antes da tela L** (a PR-6 vira o palco
  avulso, a PR-7 a tela L): o avulso sem hospedeira se prova pelo caminho que existe hoje (S1 → `Buscar música` → S4 →
  música), e quando a tela L trocar o destino de `Buscar música`, a S4 da base do G-inv já tem para onde ir (div. 1019).
  **Recomendada.**
- (c) a N4-D45 como está (sem PR de identidade; os ícones entram com a tela L).

**2 — A N4-D59 e a errata do G-inv** (div. 1004, 1019). Medido por leitura: em S1 só muda o destino do toque — o `testID`
`buscar`, o rótulo, a posição e o tamanho de `Buscar música` ficam, e **nenhum dos 8 dumps de S1 da `B5-baseline/` muda**.
**A errata da N4-D32 sobre os 8 dumps de S1 deixa de existir.** Mas o G-inv tem **4 dumps da S4** (`B5-S4-resultados` e
`B5-S4-vazio`, nos dois aparelhos) a que o roteiro chega **por S1** (`N3-PRECHECK-anexos/instrumentos/roteiro.py:258-264`:
`tap(rid="buscar")`); depois da N4-D59 o mesmo toque abre a L.
- **(a) a errata é de CAMINHO, não de geometria**: a S4 da base passa a ser alcançada pelo palco avulso sem setlist →
  busca, que a folha desenha *"sem mudança de composição"* (`N4-*-S4-avulso-sem-setlist`), e o G-inv tem de dar os mesmos
  4 de 4; declarada na PR que trocar o destino. **Recomendada** — e é a razão da ordem (b) da pergunta 1: pelo palco com
  setlist a S4 traz a seção *Nesta setlist* e não é o estado da base.
- (b) recapturar a base da S4 depois da troca — perde a invariância contra o congelado.

**3 — As erratas de ponteiro nas folhas congeladas** (div. 1023). A troca dos quatro ícones de tipo (N4-D69) torna velhos
os desenhos de tipo dos congelados — `DESIGN-V1`, `-N2`, `-N3` e `docs/ux/DESIGN-I1`, quais deles têm ícone de tipo em
moldura se mede na PR. Congelado não se edita: a errata vai no README de cada um, como a E18 e a N2-E24.
- **(a) na PR dos ícones** (a PR-4 da pergunta 1), no mesmo commit que troca o desenho. **Recomendada**: a errata nasce
  junto do que a torna verdadeira.
- (b) nesta PR — o prompt diz *"nenhum outro arquivo muda nesta PR"*, e a errata apontaria para um desenho que o pacote
  ainda não tem.
- (c) no encerramento.

**4 — A prova da troca de desenho** (div. 1021). O G-inv e o G-N3 comparam `bounds`: o ícone mudar de desenho na mesma
caixa **não muda nenhum dump** — os dois passam sem ter visto a troca. E o `gate:icones` reprova por construção: cobra os
nomes contra a §6.4 do `DESIGN-V1` (regra 1), os desenhos contra o anexo D do V1 (regra 2) e a exceção `em20` da tab de
quatro cordas (regra 4) — `apps/native/scripts/icones.mjs:13-50`.
- **(a) o `gate:icones` ganha a folha do N4 como fonte**, em par declarado (regra 14: o desenho velho → o novo, com a
  razão), a `em20` da tab sai em par (a T1 tem o mesmo desenho em 20), a `linha-de-base.json` do
  `packages/identidade/test/igualdade.test.ts` muda em par; e a prova no aparelho e no site é **por imagem**, antes ×
  depois, com o controle antes × antes = 0 (regra 29). **Recomendada.**
- (b) só o `gate:icones` — sem imagem, ninguém vê o que o músico vê.

**5 — O catálogo: 41 ou 42** (div. 1013). A N4-D68 diz *"39 → 41"* com três ícones novos. O 39 é a conta de **registros**
do `gate:icones` (`icones.mjs:60-64`: 34 do V1 + 5 do N2, com `adicionar`/`remover` como **um** registro); o mapa tem **43
nomes**. O 41 só fecha se a estrela vazada e a cheia forem **um registro**.
- **(a) a estrela é um registro com dois estados** — `normal` vazada, `ativo` cheia, como o `auto-scroll` — e o tocar é
  outro: 39 → **41** registros, 43 → **45** nomes. **Recomendada**: é a leitura que faz a N4-D68 e a folha fecharem.
- (b) dois nomes (`favoritar`, `favorita`) num registro, como `adicionar`/`remover`: 41 registros, 46 nomes.

**6 — As erratas N4-E1…N4-E6** (§6): aprovar como estão.

**7 — O *Baixar* da visualização** (div. 1024). A N4-D58 manda *ação é ícone* nas telas novas; `V-arquivo-nao-baixado` e
`V-arquivo-falhou` desenham *Baixar* com a palavra (o placeholder do palco, *"O placeholder do S3e com Baixar"*).
- **(a) V usa o placeholder do palco como ele é** — o *Baixar* com a palavra, sem ícone, igual ao do palco
  (`StageScreen.tsx:824-829`): é o mesmo componente, e o leitor é o mesmo (N4-D24). **Recomendada.**
- (b) em V o *Baixar* vira ícone (o `baixar-setlist`), com o nome acessível *Baixar*.

**8 — A régua de `L-carregando` e os tamanhos 13 e 20** (div. 1016). (i) A régua mostra *Biblioteca* e *—* enquanto o
número não existe; (ii) a folha usa 13 e 20 dp, que são literais do app e não tokens.
- **(a) a PR da tela L segue o que a S4 faz hoje** (os mesmos literais, a régua montada pelo `reguaBiblioteca` do core
  quando houver número) e registra 13 e 20 como herança do bloco de identidade (N4-D71). **Recomendada.**
- (b) 13 e 20 viram token de `size` na PR dos ícones — muda o pacote dos dois lados.

**9 — O `telas.pdf`** (div. 1005).
- **(a) o congelamento fica sem PDF**, como está. **Recomendada**: nenhum congelado gerou o PDF a partir do HTML.
- (b) o Marcel traz o PDF do Claude Design e ele entra num commit desta PR, com o `SHA256SUMS` refeito.

**10 — O `DESIGN-N4` no laço do CI** (div. 1022): **(a) no commit 1 da primeira PR de código** (a PR-3), como a div. 398
do N3. **Recomendada.**

---

## 11 · Os blocos de declaração desta PR

```gates
  # N4 desenho: nenhuma declaração — só docs.
```

```gates-web
  # só docs — N4 desenho: nenhum arquivo do núcleo do G-back tocado; nenhuma linha de código.
```

---

## 12 · Divergências desta PR — 1004 a 1024

A última usada era a **1003** (`N4-BRIEF-anexos/README.md` §6) `[medido: git grep -h -o -E '^\| \*\*1[0-9]{3}\*\*' -- docs
| sort -u | tail` → `1000 … 1003`; o `1138` que a mesma busca devolve é uma linha de tabela de medida, não divergência].
Origem: **P** premissa do prompt · **D** doc anterior · **A** ambiente, dado real ou defeito do produto · **T**
toolchain/aparato · **X** terceiros.

| div. | origem | o quê | destino |
| --- | --- | --- | --- |
| **1004** | P | O prompt pergunta se a N4-D59 *"dispensa a errata do G-inv sobre os dumps de S1 que a N4-D45 previa"*. A N4-D45 não fala do G-inv; quem previa a errata dos 8 dumps de S1 é a **N4-D32** (*"a errata declarada do G-inv sobre os 8 dumps vai aqui"*), sobre a N4-D11 (`N4-PRECHECK.md` §0, §9) | respondida na pergunta 2 |
| **1005** | P | *"telas.pdf: gere como o DESIGN-N3 gerou o dele"*: o N3 não gerou, recebeu o PDF do designer (`DESIGN-N3/README.md` §6); desta vez o designer não mandou PDF, e a folha empurra a impressão para o congelamento | sem PDF; pergunta 9 |
| **1006** | P | *"Com a saída literal no anexo"* (§2) × *"Nenhum outro arquivo muda nesta PR"* (§4): um anexo seria arquivo a mais | a saída literal está na §5.1 deste README; os scripts no scratch da sessão |
| **1007** | D | `N4-*-S1-absorver-vazia` desenha o S1f do V1; o app de hoje e a base do G-inv têm o do N2 | **N4-E1** |
| **1008** | D | `N4-A-S3-setlist-icones` sem o artista, com o `·` sozinho; a `N3-A-S3` tem o artista | **N4-E2** |
| **1009** | D | `#100E16` no texto do palco no claro; o token é `#100F16` | **N4-E3** |
| **1010** | D | m21 *"palco · controles 64"*; o dump mede 66 (N3-E16) | **N4-E4** |
| **1011** | D | a folha dá *1 resultado* como frase nova; a S4 já o tem (`SearchScreen.tsx:156`) | **N4-E5** |
| **1012** | D | cinco desenhos de ícones do catálogo refeitos à mão nas molduras; a seta de *Baixar* não é o `baixar-setlist` | **N4-E6** |
| **1013** | D | *"catálogo 39 → 41"* com três ícones novos: o 39 conta registros (`icones.mjs:60-64`), e 39 + 3 = 42; o 41 só fecha com a estrela num registro | pergunta 5 |
| **1014** | D | a folha estimou a linha de aviso com o motivo em **14 dp**; o app usa 15 (`size.bodySmall`) — a div. 409 do N3 de novo. As alturas por linha (P-F4 em B 1 linha · A 2; o pior caso do favoritar C 1 · B 2 · A 4) são estimativa | medidas pela régua na PR da tela (§4.1) |
| **1015** | D | duas contas da tabela de medidas não fecham com o próprio texto: m6 *"50 = 16 + 18,2 + 14"* dá **48,2**; m14 *"≈ 49 colunas em B"* sai de 711 (a janela), e a de C sai de 798 (a coluna do leitor) — em B o leitor tem a largura da coluna, não a da janela | conferidas pela régua (m6 na tela L, m14 em V); > 4 dp vira errata |
| **1016** | D | a folha usa 13, 19, 20 e 14,5 dp, que não são token de `size`; 13 e 20 são literais do app (26 ocorrências em `apps/native/src`) | pergunta 8 |
| **1017** | P | O prompt chama de *"amostras das telas que já existem"* as molduras não normativas; a folha conta as três `S3-setlist-icones` como **normativas** (147) e põe a `L-linhas` — tela nova — entre as **amostras** | §1: `L-linhas` normativa para a linha; as telas que já existem normativas só para o ícone |
| **1018** | D | o brief pede o favoritar com falha *"por espécie"*; a folha emoldura o pior caso (sessão + título longo) e dá as seis espécies numa tabela | o aceite mede as seis em B (N4-R8), no molde das amostras `N3-B-X-*` |
| **1019** | A | os 4 dumps da S4 da base do G-inv são alcançados **por S1** (`roteiro.py:258-264`); depois da N4-D59 o mesmo toque abre a L, e a S4 só se alcança pelo palco — pelo palco com setlist ela traz *Nesta setlist* | pergunta 2 (errata de caminho) e pergunta 1 (o palco avulso antes da tela L) |
| **1020** | D | a P-T3 é `faixas.C.view.coluna` — só C; o `TokensDaFaixa` dá as mesmas chaves às três faixas (`tokens.ts:161`), e B e A ganhariam um `undefined` novo, a forma que a N4-D64 manda decidir | na PR que tocar o pacote (N4-D64); pergunta 1 |
| **1021** | T | o G-inv e o G-N3 leem `bounds` e não veem um ícone mudar de desenho na mesma caixa; o `gate:icones` reprova a troca por construção (regras 1, 2 e 4) | pergunta 4 |
| **1022** | T | o `shasum -c` do `gates.yml:80` não lista o `DESIGN-N4` | pergunta 10; conferido à mão aqui (§9) |
| **1023** | P | *"Nenhum outro arquivo muda nesta PR"* × a troca dos ícones de tipo deixar velhos os desenhos dos congelados V1, N2, N3 e I1 | pergunta 3; **nenhum congelado tocado** |
| **1024** | D | a N4-D58 (*ação é ícone* nas telas novas) × o *Baixar* com a palavra em `V-arquivo-nao-baixado` e `V-arquivo-falhou` | pergunta 7 |

**Contagem**: 21 — D 13 · P 5 · A 1 · T 2 · X 0.

**Próxima divergência livre: 1025.**

---

**O que vem depois**: o **aval do congelamento** (as perguntas da §10) e, depois dele, a **PR-3 — core das frases**.

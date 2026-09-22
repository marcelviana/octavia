# DESIGN-N2 — a tela 2: escrita de setlist

Congelado no **N2 · PR de desenho**, 2026-09-21. Molde: [`docs/native/DESIGN-V1/README.md`](../DESIGN-V1/README.md).

Conteúdo desta pasta:

| arquivo | o que é |
| --- | --- |
| `README.md` | este documento — as decisões, o aval, os testIDs e o aparato |
| `telas.html` | as 18 molduras, arquivo único offline (`Octavia Tela 2 · Escrita de setlist`) |
| `telas.pdf` | impressão do mesmo arquivo |
| `SHA256SUMS` | impressão digital dos dois congelados |

---

## 1 · O que este design é

A **tela 2 é a escrita de setlist**: criar com nome e data, renomear, datar, apagar, adicionar músicas pelo picker, remover por posição e reordenar. O desenho é de S1 e S2 — não há tela nova no sentido de rota nova, há **estado novo** nas duas telas que já existem.

O que a folha traz, medido no arquivo congelado:

| | quanto | como se conta |
| --- | --- | --- |
| molduras | **18**, todas em **1138 × 627 dp** | `grep -c 627px` no documento interno do `telas.html` |
| legendas `N2-…` | **23** | 18 de moldura + 5 amostras da linha de aviso em tamanho real |
| linhas de aviso | **5** estados numa só linha de 48 dp | sem rede · salvo-não-relido · falhou · limite · teto de 100 |
| `testID` sugeridos | **25 na tabela** (a folha diz "23" — [div. 221](#9--divergências-e-erratas)) | §7 |
| ícones novos | **5** desenhos, catálogo **34 → 39** registros | §2 (N2-D33) e o anexo D do `telas.html` |
| seções | **8** + o anexo D, mais as propostas e as perguntas | §5 e §6 |

**Nenhuma cor, fonte, altura de barra, cartão ou linha foi redesenhada.** As medidas vêm do [`N2-BRIEF-anexos/MEDIDAS.md`](../N2-BRIEF-anexos/MEDIDAS.md) e os tokens do `DESIGN-V1/README.md` §3–§5. O que esta folha acrescenta está **anotado por cima da moldura congelada do V1** — é o padrão que a **errata E16** fixou ("documento congelado se anota por cima, não se reescreve") — e é apontado do V1 pela **errata E17** (§9 do `DESIGN-V1/README.md`).

O que ele **não** é:

- **Não redesenha a S2 vinda do palco.** A moldura `N2-S2p` é frame de controle: é a `S2` do V1 sem uma vírgula de diferença, repetida para que as duas S2 sejam olhadas lado a lado. Se a implementação puser um único controle de escrita nela, está errada (T2-R19, N2-D19).
- **Não inventa frase de erro.** Onde o servidor fala, a moldura escreve `[frase do conjunto fechado]` e o conjunto é o do `PRD-TELA-2.md` T2-R15. As únicas frases próprias da folha são as **três de validação** do cliente (T2-R3) e as fixas de aviso.
- **Não muda ordenação de S1.** A §8.3 do V1 fica decidida pela **N2-D24** — não, com gatilho medido para reabrir.
- **Não é implementação.** Nenhuma linha de código foi escrita; a extensão do `gate:icones` é da PR-2, e **vem antes** da tela que ela mede (`V1-ENCERRAMENTO.md:204`).

---

## 2 · Decisões do Marcel no desenho — N2-D23…D34

Texto verbatim da decisão (2026-09-21). As doze fecham o que a revisão 2 deixou em aberto e o que o `PRD-TELA-2.md` §7 mandou resolver no desenho.

**N2-D23** Motivo de controle inativo legível sem toque em toda a tela 2, regra única (`DESIGN-V1/README.md:374`); o A15 (revelar ao toque) fica como exceção do palco. Fecha a div. 186.

**N2-D24** §8.3 do V1 (ordenar S1 por data do show): **não**, com gatilho medido para reabrir — quando metade ou mais das setlists da conta tiverem data futura. `created_at desc` continua.

**N2-D25** Canvas 627 dp (pior caso, AVD); os 12,1 dp do Tab S6 são folga no fim da lista.

**N2-D26** Faixa de edição de 64 dp abaixo da barra de 88 em S2 com edição; é o que distingue as duas S2. Custo declarado: 64 dp de lista.

**N2-D27** Reordenar em modo de coluna única com alça; um único `PUT …/order` ao salvar. Alternativas B (alças na grade) e C (mover por número) recusadas para o N2, registradas em diagrama.

**N2-D28** Remover música sem diálogo; escrita imediata com releitura. Apagar setlist com diálogo (N2-D14).

**N2-D29** Mover por número (P3) e o caso acima de 100 músicas ficam fora do N2 — herança, junto da correção do teto (Bloco D).

**N2-D30** Rodapé do picker mantido ("nesta visita" é contagem local de 2xx confirmados); o **total** vem só da releitura, nunca do 201.

**N2-D31** Limite de taxa sem número na frase; a PR-2 mede se o servidor manda `Retry-After` e, se mandar, a frase com número entra no conjunto fechado.

**N2-D32** Quando a releitura falha, não há "tentar de novo" de escrita — só "Tentar recarregar".

**N2-D33** Os cinco ícones entram no catálogo pela E17 (39 desenhos), com o anexo D desta folha como fonte para o `gate:icones` — que a PR-2 estende **antes** de desenhar tela.

**N2-D34** Div. 83, decidida: o G3 **continua contando comentário** (falar demais é o lado certo do erro num gate de invariância); um comentário com `log(` removido se declara como **par de remoção com razão** (`linha → REMOVIDA: <razão>`), visível no script — mecanismo do W4-b. Fecha a dívida do `W3-ENCERRAMENTO.md` §7 item 8 e a div. 216 do W4-a.

---

## 3 · Convenções novas

Duas, e valem para **toda tela de escrita** que vier depois desta — é por isso que estão numa seção própria, e não na legenda de uma moldura.

### 3.1 Escrita é acentuada, leitura é neutra

**Todo controle de escrita tem o ícone em `accentInk` e o rótulo em `text`.** Leitura fica neutra. É a convenção que organiza a tela inteira: quem olha a faixa de edição de S2 vê quatro ícones acentuados e sabe, sem ler, que os quatro mudam a setlist; `Buscar na biblioteca`, ao lado, continua neutro porque só lê.

Ela convive com a regra do V1 §3.1 ("o acento tem um dono só — ativo, atual, foco") do mesmo jeito que a **E15.a** deixou as marcas do S5 em `accentInk`: o acento continua com um significado só por tela, e na tela 2 esse significado é *isto escreve*. Duas exceções declaradas na própria folha:

- **`apagar setlist`** é o único ícone de escrita em **`errorInk`** — e mesmo assim exige diálogo (§6 da folha). No estado *ativo* o fundo a 12 % continua de acento: **o fundo marca o toque, não a consequência.**
- **`N2-S1f-criar`** é o único lugar da folha com **borda** em `accentInk`, porque o botão central é o único controle da tela. É deliberado e está escrito na legenda.

### 3.2 Inativo: `lineInfo`, traço 1,25 — e amputa-se só o que continua reconhecível

Inativo é **tinta `lineInfo`, traço 1,25 e o desenho amputado**, com o motivo escrito ao lado ou na linha de aviso (N2-D23). Cor é a terceira camada, nunca a única (V1 §6.2).

A **revisão 2 pôs um limite na amputação** (R2·2): *amputa-se só o que continua reconhecível amputado.* Lápis sem ponta ainda é lápis, balde aberto ainda é lixeira, meia corda ainda é o par mais/menos, quatro marcadores ainda são alça. **O visto não é amputável**: sem a haste longa sobram 4 dp de traço, que se leem como caractere perdido, não como ícone desabilitado. Nesses casos o inativo é o **desenho inteiro** em `lineInfo` com traço 1,25, e quem carrega a distinção é o traço mais fino mais o motivo escrito — exceção **R2·2**, registrada no anexo D da folha e aplicada aos três botões de salvar (`Criar`, `Salvar`, `Salvar a ordem`).

É o mesmo raciocínio do par `zoom −` / `zoom +` inertes do V1 §6.2, onde o sinal **afina em vez de sumir** porque é ele o portador da informação.

**Consequência sobre os quatro estados do V1 §6.2** (`normal · ativo · desabilitado · pressionado`, E7): na tela 2, *desabilitado* e *inerte com motivo* colapsam num só, porque aqui **todo inativo tem motivo escrito** (N2-D23). O desenho é o mesmo; o motivo vive na linha de aviso de 48 dp ou ao lado do botão, **nunca no ícone**.

### 3.3 A linha de aviso de 48 dp é componente das duas telas

Promovida na revisão 1 (R1·2a): **uma linha de 48 dp, sempre com ícone de 20, sempre com o motivo escrito** — nunca um tooltip, nunca um toast que passa. Em S1 fica entre a barra de 120 dp e o primeiro cartão (recuo de 32 dp); em S2, logo abaixo da faixa de edição (recuo de 24 dp). Quando existe, a lista perde 48 dp e nada mais muda de lugar.

**Só um aviso por vez; se dois caberiam, vale o que bloqueia mais** — se "salvo; não foi possível recarregar" e "sem conexão" coincidirem, vale a de rede.

---

## 4 · O aval do revisor

Duas revisões antes do aval. Nenhuma das duas mudou a forma do que já estava desenhado.

### 4.1 Revisão 1 — sete achados (R1·1 … R1·7)

| # | o que faltava | o que entrou |
| --- | --- | --- |
| **R1·1** | o formulário não tinha estado de falha | moldura `N2-F-falhou`: a folha não fecha, o digitado fica, `Cancelar` vira `Fechar`, e `Tentar de novo` só depois da releitura da lista atrás da folha |
| **R1·2** | S1 não tinha onde escrever o motivo (a) nem o "salvo, não relido" (b) | a linha de aviso de 48 dp **promovida a componente de S1 e S2** (§3.3); molduras `N2-S1-sem-rede` e `N2-S1-salvo-nao-relido` |
| **R1·3** | o picker tinha três estados por linha | **cinco**: adicionar · adicionando… · adicionada · relendo… · falhou; moldura `N2-P-relendo`, e o aviso do rodapé quando a releitura falha |
| **R1·4** | reordenar e apagar não tinham falha, e o 404 não estava declarado | moldura `N2-S2e-ordem-falhou`; a falha do apagar dentro do diálogo; o **404 como caminho declarado** — fecha o que estiver aberto, cai em S1 já relida, com a linha de aviso e **sem botão** |
| **R1·5** | o picker usava o placeholder do S4 | placeholder próprio: `Adicionar a <setlist>`, 18 dp em `lineInfo`, truncado por ellipsis acima de 34 caracteres — é o que separa o picker (escrita) da busca da barra (leitura) |
| **R1·6** | os cinco ícones não tinham folha contra a qual medir | **anexo D**, no formato do anexo D do V1, com os cinco desenhos nos **três** estados e o `d` na grade de 24 |
| **R1·7** | três miúdos | (a) `Voltar para o palco` é **nome acessível**, não rótulo visível; (b) alvo da alça = desenho de 24 dentro de **48 × 72 dp**, e arrastar pelo corpo da linha não reordena; (c) o motivo do botão inativo **não é frase nova** — é a mesma frase do campo que bloqueia, e com duas validações abertas vale a do campo mais alto |

### 4.2 Revisão 2 — duas correções

- **R2·1 — o arrasto é preservado depois de uma falha.** O arrasto é o "digitado" do reordenar, e o formulário já preservava o digitado. A ordem arrastada é **estado da tela, não do cache**: a releitura acontece igual (regra 3) e atualiza a setlist atrás do modo, mas **não sobrescreve** a lista na tela. E `Tentar de novo` **reenvia o arrasto**, não a ordem que o servidor já tem — reenviar a do servidor seria um `PUT` sem mudança, e "nada mudou → não envia" vale aqui como vale no formulário (T2-R3 (iii)).
- **R2·2 — o visto não é amputável.** Origem da exceção da §3.2.

**Fecho da revisão 2, verbatim da folha**: "18 molduras · 5 linhas de aviso em tamanho real · 23 testIDs · 5 ícones novos, catálogo em 39 · 2 convenções novas (escrita = ícone em accentInk; amputa-se só o que continua reconhecível) · 3 frases de validação · 0 frases de erro inventadas." *(O "23" é a div. 221: a tabela tem 25 linhas.)*

---

## 5 · Propostas fora do brief, com destino

Nada disto está desenhado nas molduras. Vale o critério do V1 §8: **nenhuma proposta muda comportamento sem estar aqui.**

| # | proposta | custo declarado | **destino** |
| --- | --- | --- | --- |
| **P1** | **selo de bis na linha de S2** — quando a mesma música aparece duas vezes, cada linha ganha `1 de 2` em mono 12 ao lado do número. Hoje as duas linhas são idênticas fora da posição, e num palco isso custa um susto | um campo que a lista não calcula hoje; e vale para a **S2 do palco**, que esta folha não pode tocar | **herança do palco** — toca a S2 congelada, então sai do N2 e vai com a PR que mexer no palco (a mesma que a **E14.e** já reserva para S3 e S5 juntos) |
| **P2** | **duplicar setlist** — um `Duplicar` na faixa de edição criaria a cópia com nome novo e sem data; o J3 diz "repertório grande na cabeça", e o jeito mais rápido de preparar o próximo show é partir do último | um endpoint de escrita que **não existe**, e um ato que cria muita coisa com um toque | **backlog** — a base seria o `songs[]` do `POST`, que a **N2-D20** deixou de fora do N2 de propósito (`PRD-TELA-2.md` §10) |
| **P3** | **mover por número como acessibilidade** — a alternativa C do §3 da folha, mantida ao lado do arrasto dentro do modo: toque longo na linha abre `mover para a posição`. Resolve leitor de tela, teclado físico e o caso acima de 100 músicas | um diálogo a mais e um segundo caminho para o mesmo ato | **herança, com a N2-D29** — junto da correção do teto de 100 (Bloco D) |

---

## 6 · Perguntas do designer — Q1…Q9

Histórico da decisão: onde o brief e as medidas se contradiziam, o designer perguntou em vez de supor. As nove têm recomendação na folha; as respostas são as decisões da §2.

| # | pergunta | recomendação da folha | decisão |
| --- | --- | --- | --- |
| **Q1** | o canvas é 627 ou 639,1 dp? | 627, o pior caso do AVD — cabe nos dois aparelhos | **N2-D25** |
| **Q2** | a faixa de edição de 64 dp é aceita, sabendo que come 64 dp de lista? | sim — é o que torna as duas S2 distinguíveis de longe, e o único jeito de ter quatro controles **com rótulo** sem espremer o título | **N2-D26** |
| **Q3** | modo de coluna única, contra alças na grade (B) e mover por número (C)? | o modo: 1 toque para entrar, 1 arrasto por movimento, 1 para salvar | **N2-D27** |
| **Q4** | remover uma música pede confirmação? | sem diálogo — alvo de 48 dp no fim da linha, longe do corpo que abre a música, e o dano é reversível em 3 toques | **N2-D28** |
| **Q5** | acima de 100, a alternativa C entra como saída (P3)? | sim, **mas depois** — nenhuma setlist da conta chega perto de 100, e C exige diálogo próprio | **N2-D29** |
| **Q6** | o "nesta visita" do rodapé existe no cliente? | manter — é contagem **local** de adições confirmadas desde que o picker abriu, não vem do servidor | **N2-D30** |
| **Q7** | o limite de taxa devolve quanto tempo falta? | sem número até saber que o servidor manda um; se mandar, a frase vem **do conjunto fechado**, não do designer | **N2-D31** |
| **Q8** | quando a própria releitura falha, existe "tentar de novo" de escrita? | não — sem estado real, repetir escrita é apostar | **N2-D32** |
| **Q9** | os cinco ícones entram no catálogo da Fase 1, ou ficam nesta folha? | entrar, pela errata E17 — quatro deles são de escrita e reaparecem em qualquer tela de escrita futura; **a alça é a única sem rótulo, e é a que merece teste no aparelho** | **N2-D33** |

---

## 7 · testIDs sugeridos

**Sugestão, não contrato: o G2 e o aceite no aparelho decidem.** Posições, nunca uuid — e nenhum deles aparece na tela (regra 10 da folha). `<n>` é a posição na setlist, começando em 1.

A tabela abaixo foi **extraída do fonte** do `telas.html`, não redigitada. São **25 linhas**; a folha se anuncia com "23" em dois lugares — ver [div. 221](#9--divergências-e-erratas).

| `testID` | onde | o que é |
|---|---|---|
| `criar-setlist` | S1 · S1f | botão da barra e do estado vazio (mesmo id nos dois) |
| `form-nome` | formulário | campo do nome |
| `form-data` | formulário | campo da data (abre o calendário do sistema) |
| `form-erro-nome` | formulário | validação 1 |
| `form-erro-data` | formulário | validação 2 |
| `form-salvar` | formulário | Criar / Salvar — o mesmo alvo nos dois modos |
| `form-salvar-motivo` | formulário | motivo do inativo, incl. validação 3 |
| `form-cancelar` | formulário | sai da folha |
| `setlist-editar` | S2 edição | Renomear e datar |
| `setlist-apagar` | S2 edição | abre o diálogo |
| `apagar-confirmar` | diálogo | Apagar |
| `apagar-manter` | diálogo | Manter a setlist |
| `picker-abrir` | S2 edição | Adicionar música |
| `picker-campo` | picker | campo de busca (o `campo-busca` do S4, reaproveitado) |
| `picker-adicionar-<n>` | picker | alvo por resultado; `<n>` é a ordem na lista de resultados |
| `picker-estado-<n>` | picker | adicionando… / adicionada / falhou |
| `picker-concluir` | picker | rodapé; o fechar da barra mantém o id do S4 |
| `remover-<n>` | S2 edição | remover a linha da posição n (cada bis tem o seu) |
| `reordenar` | S2 edição | entra no modo |
| `alca-<n>` | reordenar | alça de arrasto da linha n |
| `reordenar-salvar` | reordenar | um salvamento só |
| `aviso-motivo` | S2 edição | a linha de 48 dp do §7, qualquer dos cinco estados |
| `aviso-acao` | S1 · S2 | Tentar recarregar / Tentar de novo, quando houver |
| `form-tentar` | formulário | Tentar de novo depois da falha; inativo enquanto relê |
| `reordenar-sair` | reordenar | Sair sem salvar — descarta o arrasto preservado |

---

## 8 · Aparato

| item | valor |
| --- | --- |
| **desenho** | Claude Design, contra o brief e as capturas; **não leu o código** |
| **capturas de origem** | [`docs/native/N2-BRIEF-anexos/`](../N2-BRIEF-anexos/) — C1, C3, C4, C5, C5b, C6 (PNG + XML), com o `MEDIDAS.md` ao lado |
| **medidas** | só dos `uiautomator dump`; **nenhuma medida vem da imagem** (`MEDIDAS.md`, cabeçalho) |
| **aparelho** | **Tab S6**, `SM-T865`, Android 12L (API 32), 2560 × 1600 px em paisagem, densidade 360 → 1137,8 × 711,1 dp; janela do app 1137,8 × **639,1 dp** |
| **bundle das capturas** | `984051d8dd8c489d3bdf5ed7ce58166092dcb769` (= `origin/main` no dia), árvore limpa |
| **canvas do desenho** | **1138 × 627 dp** — o do V1, o pior caso do AVD `octavia_tab32`; os 12,1 dp de sobra do Tab S6 são folga no fim da lista (N2-D25) |
| **conta** | principal, online, tema escuro |
| **revisões** | duas (§4), ambas aplicadas no arquivo congelado |
| **aval** | Marcel, 2026-09-21 — as doze decisões da §2 |

**Fonte dos tokens**: `DESIGN-V1/README.md` §3 (cor), §4 (tipografia), §5 (geometria). Nenhum token novo nasce nesta folha — os cinco ícones usam os tamanhos e traços do V1 §5.5, e as tintas são `accentInk`, `errorInk`, `offlineInk`, `lineInfo`, `text` e `muted`, todas do V1 §3.2.

**O que prova o congelamento**: o `SHA256SUMS` desta pasta, com os dois arquivos. Ele **não lista o `README.md`**, de propósito: listar o README foi o que produziu a div. 223 no V1, onde o hash registrado envelheceu a cada errata. Aqui a errata pode entrar na §9 sem invalidar a prova dos congelados.

---

## 9 · Divergências e erratas

Erratas desta folha, no formato da §9 do V1 (**N2-E1, N2-E2, …**).

### Erratas da N2-PR3 (a primeira PR de tela)

**N2-E1 — a folha e a linha de aviso não dizem a mesma frase sobre "pode ter gravado".** A moldura `N2-X-falhou` (a linha de 48 dp, §7) escreve *"pode já ter sido gravada — confira antes de repetir"*; a moldura `N2-F-falhou` (a folha, §2) escreve *"Pode já ter sido gravada — confira **a lista** antes de tentar de novo. **A lista atrás desta folha acabou de ser relida.**"* — uma oração a mais, que só faz sentido onde existe uma folha com uma lista atrás. São **duas frases, dois lugares**, e a N2-PR2 tinha implementado só a primeira. O conjunto fechado ganha `pode-ter-gravado-folha`, mais três chaves que a folha também precisava e que estão verbatim no congelado: `falhou-criar` (o título "Não foi possível criar"), `relendo-a-lista` (o motivo do `Tentar de novo` inativo) e `primeira-setlist` (o apoio do S1f novo). **Quatro chaves, zero redação nova.**

**N2-E2 — "Criar começa ativo" contra a moldura seguinte.** A legenda de `N2-F-criar` diz *"`Criar` começa **ativo** — só o nome vazio o desativa"*, e ao abrir o nome ESTÁ vazio; a moldura `N2-F-validacao` desenha exatamente esse estado com o botão inativo e o motivo escrito. A implementação segue **as molduras**: validação viva, e ao abrir o botão nasce inativo com `a setlist precisa de um nome` ao lado. É o que a N2-D23 pede (motivo legível sem toque) e o que a moldura desenha; a legenda é prosa, o desenho é o congelado. `[div. 243]`

**N2-E3 — a variante da regra 4 dentro da folha é inalcançável como escrita.** A legenda de `N2-F-falhou` diz que, se a própria releitura falhar, *"esta folha mostra a variante da regra 4 no lugar do banner vermelho"*. A variante da regra 4 é a frase `salvo-nao-relido`, que começa por **"foi criada"** — e dentro desta folha esse texto seria mentira: o único caminho até "releitura falhou" aqui é **depois de uma escrita que não passou** (o 2xx com releitura falha fecha a folha e vira aviso de S1, N2-D22). O banner **fica** — ele diz a verdade sobre a escrita, incluindo o "pode já ter sido gravada" quando é o caso — e o que muda é só o botão, que passa a ser `Tentar recarregar`. É literalmente o que a **N2-D32** prescreve ("não há 'tentar de novo' de escrita — só 'Tentar recarregar'"). `[div. 247]`

**N2-E4 — um `testID` a mais que as 25 da §7.** `form-falha` marca o bloco de falha da folha. A tabela do §7 não dá id a ele, e sem um o **G6 não consegue dizer que o estado `N2-F-falhou` foi alcançado** — o aceite pede `resource-id` por estado. Os 25 da tabela continuam todos lá; este é o 26º. `[div. 245]`

**N2-E5 — o S1f congelado tem duas linhas de texto; a implementação tem uma.** *"Nenhuma setlist por aqui ainda."* e *"A primeira pode nascer neste aparelho."* saem num único nó de texto (a frase `primeira-setlist`), que quebra em duas linhas na largura de 560 dp do apoio. O que o congelado desenha como duas linhas é quebra de linha, não dois papéis: nenhuma das duas é título — o título em caixa alta do V1 (*"nenhuma setlist"*) **sai** com a moldura nova. `[div. 246]`

**N2-E6 — o botão `Nova setlist` mede 152,0 dp de largura, não 190.** A **div. 249** abaixo anuncia *"os 190 × 57,8 dp"* do `criar-setlist` como sendo **"do dump do aparelho"** — mas quando ela foi escrita **não havia dump**: o §4 era justamente o que estava pendente. O primeiro dump do Tab S6 (N2-PR3 §4.1, `N2-PR3-anexos/dumps/01-N2-S1-criar.xml`) mede **152,0 × 57,8 dp**. **A altura confere** — os 57,8 são medidos, e são os do `buscar` na mesma barra (`MEDIDAS.md:26`). A largura não podia conferir: o botão é pintado pelo estilo do `buscar` e a largura é a do rótulo — `171,1 − 152,0 = 19,1` é exatamente `101,3 − 81,8`, a diferença entre *"Buscar música"* e *"Nova setlist"*, com o mesmo recuo (45,8 contra 46,2 dp). **O `190` foi emprestado da linha errada da mesma tabela**: o único `190` do `MEDIDAS.md` é o `190,2 × 20,0` do texto `garantida offline` **dentro do cartão** (`:34`). Por consequência a caixa do título encolhe de 709,8 para **534,2 dp**, e não para os 495,8 anunciados — e é **a conta do congelado que confirma a medida**, não que a contradiz: `709,8 − (152,0 + 24,0) = 533,8`, contra 534,2 medidos, com o vão de 24 dp intacto. **Nada a corrigir na implementação**; o número que as PRs 4–7 herdam é **152,0 × 57,8 dp**. `[div. 252]`

### Divergências abertas na N2-PR3, **234 a 249**

| div. | o que | o que foi feito |
| --- | --- | --- |
| **234** | **Origem P** (o prompt presumiu o que não existia): o prompt manda "seletor de calendário do sistema" como se o módulo já estivesse no projeto. `[medido]` `ls apps/native/node_modules \| grep -i "datetime\|picker\|calendar"` → vazio. É **módulo nativo**. | Decisão do Marcel: entra por `npx expo install @react-native-community/datetimepicker` (**9.1.0**, a do SDK 57, não a 9.2.1 do npm), com o config plugin no `app.json`. **Exige dev client novo nos dois aparelhos antes do §4.** A linha do `android-debug-apk` desta PR ganha a nota "primeiro build com módulo nativo novo desde o N1". |
| **235** | O prompt cita `App.tsx:163/177` como os pontos onde o prefetch é chamado. | São **165** e **178** na `main` de hoje (`fedfd24`). Sem consequência: o gancho não entrou em nenhuma das duas, entrou num efeito próprio. |
| **236** | O prompt diz que a poda deixa "os outros **quatro**" pendentes. | São **cinco**: `alca`, `renomear`, `apagar-setlist`, `adicionar`, `remover` — seis nomes para cinco registros do anexo D, porque `adicionar / remover` é **um** registro e **duas** entradas no mapa (a própria div. 226 já dizia). O §3 do prompt pedia "0 acusações + 4 avisos"; o medido é **0 acusações + 5 avisos**. |
| **237** | O `pode-ter-gravado` da N2-PR2 não serve à folha. | **N2-E1** acima. |
| **238** | O `gate:a20` estendido ao `frases.ts` **lia o arquivo e examinava zero literais** (`[medido]`: 24 arquivos, **72** literais — o mesmo número de antes de o arquivo entrar). As posições da varredura são as do JSX e o `FRASES` é chaveado por `rede`, `auth`, `criando`… | Entrou a posição `EXTRAS: valor de chave`, válida só nos arquivos da lista. `[medido]` depois: **100** literais, 0 acusações. Controle negativo ad hoc: três frases trocadas por inglês → duas acusadas, a terceira isenta por anglicismo do produto (`offline`), inclusive em valor multilinha. **Gate que lê e não examina é instrumento quebrado.** |
| **239** | `api.ts` lia a base da URL no **carregamento do módulo** (`const BASE_URL = …` no topo). Qualquer teste que importasse `src/` estaticamente congelava a base em `''` antes de o `beforeAll` definir a porta do mock, e toda request falhava por rede com `status=net` e nenhuma pista. `[medido]` no CN do gancho do prefetch. | Passou a ser lida **na chamada** (`baseUrl()`). No aparelho é indiferente: o Metro substitui `process.env.EXPO_PUBLIC_*` por literal no build. Exceção declarada no `g1.sh`. |
| **240** | O duplo de `react-native` mapeava `Pressable` para `<button>`, e o app tem um `Pressable` dentro de outro (o `Baixar esta setlist` dentro do cartão de S1) — HTML inválido, aviso do React a cada render. | `<div role="button">`. O que os CNs leem é `data-testid` e `data-disabled`, que não dependem da tag. |
| **241** | Uma releitura em voo **sobrevivia ao `desmontar()`** e a linha `resync` dela caía no log do teste seguinte: o CN (f) passava sozinho e reprovava na suíte. | O `afterEach` deixa as pendentes assentarem antes de limpar. **Poluição, não defeito** — e vale registrar porque todo CN de tela das PRs 4–7 tem a mesma forma. |
| **242** | O `PRD-TELA-2.md` T2-R1 diz "com o 201 … abre a setlist nova em **S2**"; a legenda de `N2-F-salvando` diz *"a folha fecha e **S1 relê** a lista"*. | **O congelado vence.** Não há navegação para S2 na folha. Os "≤ 3 taps" do J3 continuam: `Nova setlist` · digitar · `Criar`. Registrado no T2-R1. |
| **243** | "Criar começa ativo" × `N2-F-validacao`. | **N2-E2**. |
| **244** | `form-erro-data` é **inalcançável pelo seletor do sistema**: um calendário nativo não produz `31/02`, que é o que a moldura `N2-F-validacao` desenha. | O guarda do `dataExiste` fica como defesa e o CN o exercita com um `Date` inválido. A moldura continua desenhando um estado que o teclado produziria e o calendário não — **não é erro do desenho**, é consequência da N2-D16/§2 ter escolhido o seletor. |
| **245** | `form-falha`, o 26º `testID`. | **N2-E4**. |
| **246** | S1f: duas linhas no congelado, uma na implementação. | **N2-E5**. |
| **247** | A variante da regra 4 dentro da folha diria "foi criada" sobre o que não foi criado. | **N2-E3**. |
| **248** | A releitura da lista **atrás da folha** (regra 3) não tem razão própria no conjunto fechado do T2-R16 (`write\|404\|order\|reopen`). | Usa **`reason=reopen`**, que é a mesma leitura sem `op` que a N2-D22 já nomeia. Alargar o conjunto fechado por causa de uma ocasião nova seria fazê-lo crescer em silêncio, que é o que ele existe para impedir. Fica declarado: **duas ocasiões, uma razão**, e o que as separa no logcat é a linha `write op=` imediatamente antes. |
| **249** | Não havia **nenhuma** infraestrutura de teste de tela no repositório: os projetos do Vitest coletam só `.ts` em ambiente `node`, e é por isso que o `PRD-TELA-2.md` repete "a parte da TELA é das PRs 3–7" requisito a requisito. | Entrou o quarto projeto, `native-tela` (`.tsx` em `jsdom`), com o `react-dom` 19.2.3 que **já era** devDependency de `apps/native` — **nenhuma dependência nova** — e duplos para `react-native`, `react-native-svg` e o `datetimepicker`. **Não mede geometria**: os 190 × 57,8 dp e os 48 dp são do dump do aparelho, como em toda esta série. As PRs 4–7 herdam o aparato. |

### Divergências abertas no §4 da N2-PR3 (o aceite no aparelho), **250 a 259**

O §4 rodou em sessão própria, sobre `25c00ee`. O anexo é
[`N2-PR3-anexos/aparato.md`](../N2-PR3-anexos/aparato.md); o logcat de prod é
[`device-prod.txt`](../N2-PR3-anexos/device-prod.txt).

| div. | o que | o que foi feito |
| --- | --- | --- |
| **250** | O roteiro do §4.1 sobe o mock na **8081**, que é a porta do **Metro**; e o gate `which adb emulator` reprova nesta máquina por `PATH` de shell não-login, com as duas ferramentas instaladas. | Mock na **8788** (a do docstring do `aceite.py` e de todo aceite anterior). O gate virou `ls` no SDK. Erros do roteiro, não do aparato. |
| **251** | `expo run:android --device` recusa o serial do `adb` (`RX2N8000F3D`) e o `ro.product.model` (`SM-T865`). | O nome é o do `getDevicesAsync` do Expo: **`SM_T865`**. Fica para as PRs 4–7. |
| **252** | `criar-setlist` mede **152,0 × 57,8 dp**, não 190 × 57,8; a caixa do título fica em **534,2 dp**, não 495,8. | **N2-E6** acima. |
| **253** | O APK **local** desta série tem **uma** abi (`arm64-v8a`, 82.030.412 B) contra as quatro da V1-PR3 (231.377.892 B). E no CI o `android-debug-apk` deu **13m11s** e **8m9s** em duas pushes cuja árvore difere **só num parágrafo de anexo**. | O tamanho: é o `expo run:android` mirando a abi do aparelho ligado, não o módulo novo — **não se compara com a faixa do CI**. O tempo: a diferença de 5m2s é **cache do runner**, e a leitura de que os 13m11s vinham do módulo novo (div. 234) **fica registrada como errada** — duas medições da mesma árvore não dizem o custo do módulo. A faixa de n=12 da V1-PR6 segue sendo a referência. `aparato.md` §2. |
| **254** | No ramo `salvando` o botão `Criar` é renderizado **sem `testID`** (`FolhaDeCriar.tsx:207`); o ramo `editando` passa `form-salvar`. | O **G6 fica sem `resource-id` próprio** para `N2-F-salvando`. O estado é alcançável e o `enabled=false` confere. Correção de outra rodada. |
| **255** | O seletor de data tem **33 alvos abaixo de 48 dp** — 30 células de dia a 46,2 × 32,0. | São do `DatePickerDialog` do Android, não do app: **custo declarado da N2-D16/§2**, a mesma escolha da div. 244. O G5 dos alvos do app passa com **zero** falhas. |
| **256** | **Defeito.** `autoFocus` dentro do `Modal` dá foco e **não sobe o teclado**; o congelado manda subir (e o código cita a frase). Custa um toque a mais, contra os 3 taps do J3. | Registrado, não corrigido. `aparato.md` §5.1. |
| **257** | **Defeito de aparato.** O modo `escrita-corta` **não produz falha no Android**: um 201 de corpo truncado passa por sucesso (`await response.text()` não estoura como no Node). | O estado `N2-F-falhou` foi alcançado com `escrita-500`. A espécie `rede` da N2-D18 e a frase `pode-ter-gravado-folha` da N2-E1 **seguem sem prova de aparelho**. `aparato.md` §5.2. |
| **258** | O §4 do prompt pede uma **N2-E6** para o `form-falha` fora das 25 — que **já é a N2-E4** (div. 245), palavra por palavra. | **Não foi aberta uma segunda errata do mesmo fato.** A N2-E4 ganhou a prova de aparelho que lhe faltava (dump `07`, 654,2 × 87,6 dp). O rótulo **N2-E6** ficou com a medida do botão. |
| **259** | `grep -rn eyJ` sobre os anexos acha **o enunciado da própria regra 4**, no `README.md:121`. | Registrado. Nenhum arquivo novo do §4 contém o literal. |

### Divergências do conserto da div. 256, **260 a 261**

Sessão do fix, mesma árvore, sobre `c8db83a`. Anexos:
[`ime-antes.txt`](../N2-PR3-anexos/ime-antes.txt) e
[`ime-depois.txt`](../N2-PR3-anexos/ime-depois.txt).

| div. | o que | o que foi feito |
| --- | --- | --- |
| **260** | As **duas** formas prescritas para subir o teclado falharam no Tab S6: `focus()` no `onShow` do `Modal` (0/1) e `InteractionManager.runAfterInteractions` (0/1). E a forma que pareceu resolver — `setTimeout(…, 0)` — é **cara-ou-coroa: 5/10**; ela passou nas primeiras tentativas porque foram amostras de **uma** rodada, e daí saiu a conclusão errada de que *"não é duração, é ordem"*. | Ficou **`setTimeout(…, 350)`**, 10/10 (constante `MS_FOCO_APOS_ANIMACAO`). O `runAfterInteractions` falha **pelo mesmo motivo** que o `focus()` direto: sem interações pendentes ele roda no MESMO tick do `onShow` — as duas formas são a mesma coisa para o IME, e por isso deram o mesmo resultado. **É duração**: o `animationType="fade"` dura ~300 ms, e o pedido precisa cair depois de a janela do modal assentar como janela ativa do IME. 150 ms também deu 10/10 mas fica **dentro** da animação, apostando no relógio deste aparelho. Diagnóstico que separou as duas coisas: o `focus()` É chamado e o campo VAI de `isFocused=false` a `true` em todas as formas — o foco nunca foi o problema, o pedido de teclado é que se perde. **Regra da V1-PR5 outra vez, e desta vez ela pegou a própria sessão.** |
| **261** | **Erro de arnês, e vale para as PRs 4–7.** O primeiro laço de n=10 fechava a folha com `KEYCODE_BACK` — mas com o teclado de pé o `BACK` fecha **o teclado**, não a folha, e o toque seguinte caía numa folha já aberta. Sintoma: padrão alternado perfeito (`false,true,false,true…`) com "folha aberta" em **todas** as iterações. | O laço bom fecha pelo botão `form-cancelar`, lendo os bounds dele no dump, e **confirma folha-fechada antes e folha-aberta depois** de cada toque. Todos os números publicados são do laço bom. Um arnês que não verifica o próprio pré-requisito mede outra coisa e não avisa. |

**Próxima divergência livre: 262.**

Divergências abertas nesta PR, **221 a 225** (o W4-a parou em 220):

| div. | o que | o que foi feito |
| --- | --- | --- |
| **221** | A folha se anuncia com **"23 testIDs"** em dois lugares (o chip do cabeçalho e o fecho da revisão 2) e abre a tabela com "Vinte e três". A tabela tem **25 linhas**. Os dois excedentes são `form-tentar` e `reordenar-sair` — exatamente os que a **revisão 1** acrescentou (R1·1 e R2·1): o número do cabeçalho ficou no valor de antes das revisões. `[medido]`: 31 células em IBM Plex Mono na seção, menos 6 que não são `testID` (`testID`, `onde`, `o que é`, `campo-busca` e dois `<n>` citados no corpo) = **25**. | A §7 traz as **25**, extraídas do fonte. O "23" fica citado onde a folha o diz (§1, §4.2), marcado. **O número que o G2 herda é 25**, e é ele que o `PRD-TELA-2.md` §8 passa a citar. A folha congelada **não** é reeditada (padrão E16). |
| **222** | O parêntese da folha que explica o catálogo — "(32 do catálogo + log-in + os 5 daqui, mais a marca fora da grade)" — **não fecha**: 32 + 1 + 5 = 38, e o texto ao lado diz 39. Além disso ele conta **um** desenho fora do catálogo, quando a **E14.a do V1** declarou **quatro** (`log-in`, `email`, `senha`, `nada-encontrado`). | O número **39 está certo**, e a leitura que o torna verdadeiro é a única que o `gate:icones` mede: **34 registros do anexo D + 5 = 39**. `[medido]`, `node scripts/icones.mjs`: `§6.4: 34 linhas → 33 nomes distintos, + 4 fora do catálogo = 37 esperados` · `anexo D: 34 registros`. O "32" do parêntese é o número do **título** da §6.4 do V1 ("Tabela dos 32"), que já estava 2 abaixo das linhas da própria tabela — a **E4** do V1 já dizia "16 das **34** linhas". A E17 e a N2-D33 registram **39 registros do anexo D**; a categoria "fora do catálogo" continua em 4 e não é tocada. |
| **223** | `shasum -a 256 -c SHA256SUMS` do **DESIGN-V1** já reprova **hoje**, na `main`, antes desta PR: `README.md: FAILED`, os três congelados `OK`. O hash do README foi atualizado pela última vez na V1-PR5 (`4cb3b22`) e o arquivo mudou duas vezes depois — V1-PR6 (`cc23550`, `b348da9`) e W2 (`336727e`), as duas sem tocar o `SHA256SUMS`. | **Não corrigido aqui**, por instrução: o `SHA256SUMS` do V1 não muda nesta PR. A E17 torna o hash **mais** velho, não o quebra — ele já estava quebrado. **Decisão do Marcel**: ou o README sai do `SHA256SUMS` do V1 (que é o que o DESIGN-N2 faz, §8), ou o hash se regrava a cada errata. Os **três congelados** do V1 seguem `OK`, que é o que a prova existe para dizer. |
| **224** | O `PRD-TELA-2.md` §8, linha do `gate:icones`, lista **seis** ícones novos — "criar, editar, arrastar, remover, apagar, **calendário**". O desenho tem **cinco**, e **não há ícone de calendário**: a data usa o seletor do sistema, e o `data` (lucide · calendar) já existe no V1 §6.4. "Adicionar" e "remover" são **um par**, um desenho só. | Corrigido no §4 desta PR: a linha passa a citar os cinco do anexo D, e o **quando** passa a ser a **primeira commit da PR-2** (N2-D33: o gate vem antes da tela que ele mede). |
| **225** | **Tensão declarada, não resolvida aqui.** A **N2-D31** manda a frase de limite de taxa **sem número** até se medir se o servidor manda `Retry-After`; mas o conjunto fechado do `PRD-TELA-2.md` T2-R15 já traz `RATE_LIMITED` → "muitas alterações seguidas — tente de novo em **N** s", com número, e o aceite do T2-R14 usa um mock com `Retry-After: 30`. O conjunto fechado, como está escrito, **presume** o cabeçalho. | Registrado. A **PR-2 mede** (N2-D31) e o conjunto fechado se ajusta na mesma PR: com `Retry-After`, a linha do T2-R15 fica como está; sem ele, ela perde o `N` e passa a ser a frase da moldura `N2-X-limite` ("Muitas mudanças em pouco tempo. Os controles de escrita voltam em instantes."). Até lá, o T2-R14 cita a N2-D31. |

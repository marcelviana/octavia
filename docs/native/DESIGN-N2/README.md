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

### Erratas da N2-PR4 (S2 com edição)

**N2-E7 — quatro chaves novas no conjunto fechado, zero redação nova.** Pela mesma razão da N2-E1, um degrau adiante. `falhou-salvar` é o título da moldura `N2-X-falhou` (*"Não foi possível salvar"*), que é para S2 o que `falhou-criar` é para a folha de criar — e são duas frases porque criar e salvar não são o mesmo ato. `lista-relida` é a terceira oração da mesma moldura (*"a lista abaixo é a que o servidor acabou de devolver"*), que só aparece depois da releitura da regra 3. `removendo` é o estado da linha do §3 (*"linha em removendo…"*), irmã de `adicionando` e `relendo`. `apagar-arquivos` é o terceiro dos quatro itens obrigatórios do diálogo (§6). **Mais um construtor**: `perguntaDeApagar(nome, n)` monta *"Apagar `<nome>`, com `<n>` músicas?"* — nome e contagem são DADO (div. 227), e aqui o nome cai no MEIO da frase, então partir a redação em três pedaços a espalharia pela tela. O `gate:a20` ganhou no mesmo commit a posição `EXTRAS: literal de template` para ler essa redação (CN ad hoc no anexo). `[div. 267]`

**N2-E8 — `Limpar` na data: o controle que o congelado não desenha e a regra exige.** A legenda de `N2-F-editar-igual` diz, verbatim: *"Limpar a data é permitido e conta como mudança: a data é opcional na criação e continua opcional depois."* O seletor do sistema **não sabe devolver "sem data"** — é o outro lado da **div. 244**, que já registrou o que ele não sabe produzir —, então sem um controle próprio a permissão do congelado é **inalcançável pela UI**, e o `performance_date: null` do `SETLISTS.md` §PUT não teria como sair do aparelho. Entra um alvo de 48 dp ao lado do campo, com o rótulo `Limpar`, **visível só quando há data para limpar** — por isso nenhuma moldura desenhada muda. Medido no Tab S6: 109,3 × 48,0 dp, e o `Salvar` ativa no toque. `[div. 267]`

**N2-E9 — a caixa do título da linha de S2 mede 272,0 dp, não 280.** O §3 diz que o `remover` *"come 56 dp da caixa do título (336 → 280 dp)"*. Medido no Tab S6 (`dumps/01-N2-S2e.xml`): a caixa é **272,0 dp**. **O 336 do congelado está certo** — é o que a linha do V1 tem —, e o que difere é o quanto o alvo come: **64 dp e não 56**, porque o vão entre a coluna de tipo e o alvo é o `space.lg` de **16 dp** do ritmo da própria linha (V1), não 8. `336 − (48 + 16) = 272`. Igual à **N2-E6**: é a conta do congelado que confirma a medida, não que a contradiz, e **nada a corrigir na implementação** — mudar o vão para 8 quebraria o ritmo de 16 que a linha tem desde o V1, para fazer uma prosa fechar. O número que as PRs 5–7 herdam é **272,0 dp**. `[div. 271]`

### Divergências abertas na N2-PR4, **262 a 271**

| div. | o que | o que foi feito |
| --- | --- | --- |
| **262** | **Não havia prazo de rede nenhum.** `[medido]` `packages/core/src/auth-fetch.ts` inteiro (sem `signal`, sem `AbortController`, sem relógio) e `api.ts:104`/`:134` (`fetch(path, init as RequestInit)` cru). O `fetch` do RN no Android é OkHttp com os três tempos zerados, e zero em OkHttp é **sem limite**: um servidor que aceita a conexão e não responde deixa a folha em "Salvando no servidor…" para sempre, e o `Cancelar` some durante a escrita de propósito (regra 1). O CN do commit 1 mediu: **40 s sem desistir**, o próprio timeout do teste matando o caso. | **N2-D35**: prazo de **20 s** na escrita e na releitura, espécie `rede`. Medido depois: o CN desiste em **20,1 s**, e no aparelho saiu `ms=20029`. |
| **263** | O prompt manda o prazo "no core". O core é **puro** — não tem relógio, não tem `AbortController` e o cabeçalho do `auth-fetch.ts` promete zero `lib.dom`. | **O número e o significado ficam no core** (`PRAZO_DE_REDE_MS`, no `escrita.ts`, com a razão por extenso); **o mecanismo fica no `api.ts`**, que é "a camada de rede única do app". O `AuthRequestInit` ganha um `signal?: unknown` **opaco** — o core repassa e não olha. É a mesma partição que já separa `classificar` de `mutate`. |
| **264** | O prazo cobriria também as leituras do **sync** se entrasse no `get()` sem parâmetro — e a fixture `atraso` do S1a segura a resposta por **45 s** de propósito, para o estado "sincronizando pela primeira vez" ficar parado o bastante para ser medido. | `getSetlists({ prazoMs })`: **só a releitura** o passa. As leituras do sync continuam sem prazo, **declarado**. Um prazo ali apagaria um estado do design em vez de proteger alguém — e ninguém espera por elas numa folha modal. |
| **265** | A folha de editar é *"a mesma folha"* do congelado, mas o arquivo se chama `FolhaDeCriar.tsx`. | **O arquivo não muda de nome.** O G2 indexa `testID` **por arquivo** (`g2g3.sh`: `sed "s\|^\|$f\t\|"`), então mover os oito `form-*` para um arquivo novo os faria "sumir" e reprovaria o gate que existe para impedir que um alvo desapareça em silêncio. O componente exportado passa a ser `FolhaDeSetlist`; o arquivo espera uma PR com razão melhor do que estética para pagar esse preço. |
| **266** | **Meio par de ícone.** `adicionar / remover` é UM registro do anexo D e DOIS nomes no mapa (div. 226); esta PR desenha só o `remover`. | O gate faz as duas coisas ao mesmo tempo, sem regra nova: o `remover` é **cobrado** pela regra 6, elemento a elemento, contra a UNIÃO das três células do registro (onde moram o círculo r 8,5, a corda de 8 e a meia corda de 4); o `adicionar` **segue avisando** pela regra 1. O par só sai da lista de pendentes quando o `+` existir — na PR-6. `PENDENTES` cai de cinco nomes para **dois** (`alca`, `adicionar`), e o efeito da poda está medido: o `IconesFalso`, **intocado**, passou de 20 para **22** acusações. |
| **267** | **Três `testID` além dos 25 da §7** (a N2-E4 já tinha aberto o 26º). | `form-data-limpar` (a **N2-E8**), e `apagar-falha` e `apagar-motivo`, que são do diálogo pela mesma razão do `form-falha`: **sem id o G6 não consegue dizer que o estado foi alcançado**. Os 25 da tabela continuam todos lá; estes são o 27º, o 28º e o 29º. |
| **268** | **A div. 257 fecha, e do lado certo.** A N2-PR3 registrou que a espécie `rede` da N2-D18 não tinha prova de aparelho: o `escrita-corta` mandava `201` antes de cortar e o OkHttp lia sucesso limpo. | O modo passou a **fechar o socket sem status line** (commit 1) e o prazo de rede entrou (commit 2). Medido no Tab S6, duas vezes: `write op=remove … status=net code=net ms=20029` e `write op=delete … status=net code=net ms=20025`, com a moldura `N2-X-falhou` na tela. **A espécie `rede` tem prova de aparelho.** |
| **269** | **Defeito, achado no §4.** No estado `apagando`, o `Manter a setlist` **sumia** e a frase de progresso tomava o lugar dele. O congelado (§6) diz *"o diálogo fica, **os dois botões inativam** e a frase passa a `Apagando no servidor…`"*. A forma errada copiava a regra 1 da folha de criar, onde o `Cancelar` some — e lá ele some porque prometeria cancelar uma escrita em voo, o que não é o caso aqui: o par de botões **é a pergunta do diálogo**. | **Consertado no commit 2** e remedido: os dois com `enabled=false`, a frase entre eles. |
| **270** | **Defeito, e o mais caro: S1 voltava mostrando a setlist apagada.** O log estava perfeito (`write op=delete … 200`, `resync … 200`, `cache write … invalidated=1`) e a tela mentia. Causa: o diálogo chamava `aoApagar()` sem argumento, e S2 saía para S1 **sem repassar o conjunto da releitura** — o cache ficava certo (quem o grava é o `escrita.ts`), mas a RAIZ não era avisada, e S1 desenha o que a raiz tem. O mesmo buraco existia nos **dois** caminhos de 404, onde o congelado promete cair em S1 *"já relida"*. | **Consertado no commit 2**: as três saídas levam `(setlists, syncedAtMs)` e S2 chama `aoReler` **antes** de `aoSairParaS1`. **O CN foi endurecido no mesmo commit** e a prova de que agora pega está registrada: revertido o conserto à mão, o `it` do diálogo reprova com `expected null not to be null`. A primeira forma do CN parava em "o servidor não tem mais a setlist", que era verdade e não bastava. |
| **271** | A caixa do título da linha mede **272,0 dp**, e o §3 anuncia 280. | **N2-E9** acima. |

| **272** | **O prazo da releitura pós-escrita: medido, e não havia o que consertar.** A div. 264 registrou que as leituras do **sync** ficam sem prazo; ela foi lida como se a RELEITURA também tivesse ficado. `[medido]` `escrita.ts:263-274` — `reler(…, prazoMs: number = PRAZO_DE_REDE_MS)` e `getSetlists({ prazoMs })`; `:310` — `relerAoAbrir` repassa, e as quatro telas (`SetlistsScreen:377`, `IndexScreen:379`, `DialogoDeApagar:87`, `FolhaDeCriar:212`) chamam **sem o segundo argumento**, então vale o default. O único `getSetlists()` sem opções é o `sync.ts:65`, que é o `sincronizar()` da fixture `atraso`. **O que faltava era MEDIÇÃO**, e faltava de verdade: o CN da releitura usava `prazoMs: 400` — provava a ligação, não o número — e o caminho `reopen` não tinha CN de prazo nenhum. | CN novo com o **número real** nos dois caminhos (40,1 s de relógio) e **controle negativo do instrumento** pelo mecanismo do `g7.sh`: com o `escrita.ts` e o `api.ts` de `origin/main` no lugar, o `it` novo morre no próprio timeout de 70 s. No Tab S6: `resync … reason=write op=create status=net ms=20019` e `resync … reason=reopen op=- status=net ms=20010`, com o estado da N2-D22 na tela. Anexo: `CN-prazo-releitura.txt`, dump `16`. |

### Erratas da N2-PR5 (o modo de reordenar)

**N2-E10 — quatro chaves novas no conjunto fechado e quatro construtores, zero redação nova.** `reordenar-apoio` (*"arraste pela alça · a ordem só é salva no fim"*), `ordem-arrastada` (*"a ordem abaixo é a que você arrastou · a do servidor é outra"*), `falhou-ordem` (*"Não foi possível salvar a ordem"*) e `ordem-relida` (*"a setlist foi relida; a ordem dela não foi aplicada aqui"*), verbatim de `N2-S2e-reordenar` e `N2-S2e-ordem-falhou`. As quatro redações com DADO dentro — `tituloDoReordenar(nome)`, `deParaPosicao(de, para)`, `soltarAquiPosicao(n)`, `movidaDe(n)` — são função no `frases.ts` pela razão do `perguntaDeApagar` (div. 227), e o `gate:a20` as lê (`EXTRAS: literal de template`). Nenhuma frase para "nada mudou": N2-D36.

**N2-E11 — `Reordenar` fica no grupo da ESQUERDA da faixa.** A legenda de `N2-S2e` diz *"à esquerda o que acrescenta, à direita o que altera a setlist inteira"* — e reordenar altera a setlist inteira —, mas a moldura desenha `Reordenar` à esquerda, logo depois de `Adicionar música`, com o `flex:1` entre ele e `Renomear e datar`. Vale o desenho. Consequência declarada: na PR-6, o `Adicionar música` entra ANTES dele, e o `Reordenar` anda ~190 dp para a direita; os dois da PR-4 continuam onde estão (medido: iguais, dp a dp, ao dump `01` da N2-PR4). `[div. 281]`

**N2-E12 — durante o salvamento as alças ficam INTEIRAS em `lineInfo`.** O anexo D diz que a alça inativa perde dois marcadores; a moldura `N2-S2e-ordem-salvando` desenha seis, em `#6E6A80`. Vale a moldura: no salvamento a alça está **ocupada**, não "inativa com motivo" (N2-D23) — o motivo é a própria frase `Salvando a ordem no servidor…`. A amputação de quatro fica para o `Reordenar` da faixa (sem rede, acima de 100), onde o motivo mora na linha de aviso. `[div. 280]`

**N2-E13 — sem a opacidade de 0,5 na lista durante o salvamento.** A moldura `N2-S2e-ordem-salvando` põe `opacity:.5` na lista inteira; a E3 do V1 proíbe opacidade como sinal de inativo. A implementação segue a E3 (a série inteira segue): as alças perdem a tinta de acento e ficam `enabled=false`, o `Salvar a ordem` vira contorno `lineInfo`, e o texto das linhas fica como está. `[div. 284]`

### Divergências abertas na N2-PR5, **273 a 294**

| div. | o que | o que foi feito |
| --- | --- | --- |
| **273** | O T2-R16 declarou `resync … reason=order` desde a N2-PR2, e **nada o emitia**. | É a releitura da regra 3 depois de um reorder que FALHOU (`relerPelaOrdem`, `escrita.ts`): `resync kind=setlists reason=order op=reorder …`, medida no Tab S6. A remoção da N2-PR4 usa `reason=reopen` no mesmo papel — as duas formas convivem; unificar é decisão do Marcel. O G3 não muda (a linha já existia). |
| **274** | **Extra, declarado antes do commit 1**: um módulo novo no core, `ordem.ts` (`mover`, `mesmaOrdem`, `TETO_DO_REORDENAR`, `alvoDoArrasto`), com 16 testes. | O cabeçalho do `escrita.ts` manda regra para o core; o teto de 100 é do contrato e o "nada mudou" é a N2-D36. Duas exceções a mais no G1 (`ordem.ts`, `index.ts`). |
| **275** | **Extra**: o voltar do sistema dentro do modo. O congelado não diz. | Vale `Cancelar` / `Sair sem salvar` (sem request); durante o salvamento é engolido — o `Cancelar` some de propósito (regra 1) e sair da tela não cancelaria a escrita. CN próprio. |
| **276** | **Contestação da N2-D36**, pedida pelo roteiro. A legenda de `N2-S2e-ordem-falhou` diz que *"'nada mudou → não envia' vale aqui como vale no formulário"* — e no formulário o botão fica **inativo com o motivo** `nada mudou desde que você abriu`, que já está no conjunto fechado. Essa leitura também não pede frase nova, e cumpre a N2-D23. | Implementada a N2-D36 como veio (fecha o modo, sem request, `reason=nada-mudou`). A alternativa é uma troca pequena no `ModoDeReordenar.tsx`; **decisão do Marcel**. |
| **277** | Um `testID` serve dois rótulos, duas vezes: `reordenar-sair` é `Cancelar` e `Sair sem salvar`; `reordenar-salvar` é `Salvar a ordem`, `Tentar de novo` e `Tentar recarregar`. | É o `form-salvar` da folha ("o mesmo alvo nos dois modos"): o alvo é o mesmo, o G6 lê o rótulo. |
| **278** | `reordenar-motivo` — o 30º `testID` além da tabela do §7. | O motivo do `Tentar de novo` inativo enquanto relê (`relendo…`); pela mesma razão do `form-salvar-motivo`. |
| **279** | O toque no `Reordenar` inativo **por teto** loga (`write blocked op=reorder reason=ceiling`, A-N2-9); por **sem rede** ou **escrita em voo**, não. | A faixa da N2-PR4 não loga toque em inativo, e o T2-R16 diz que `write blocked` é "toque num controle de escrita inativo". Só o teto tem aceite que pede a linha; os outros ficam como a PR-4 deixou, declarado. |
| **280** | Alças do salvamento inteiras × anexo D. | **N2-E12**. |
| **281** | `Reordenar` à esquerda × legenda de agrupamento. | **N2-E11**. |
| **282** | **O `gate:icones` era cego a entrada escrita em várias linhas.** O coletor lê cada estado de UMA linha; a primeira forma da `alca` (várias linhas) passou com 0 acusações e "4/6 cobrados", e **o `apagar-setlist` da N2-PR4 estava assim desde que entrou** — só o `inerte` dele era comparado. | Regra nova `[legível]`: entrada sem `normal` numa linha é ACUSADA. O `apagar-setlist` foi posto numa linha e **passa** (o desenho estava certo — quem dizia isso era a sorte, não o gate). CN ad hoc: 2 acusações, exit 1; `IconesFalso` segue em 22. Extra declarado antes do commit 2. |
| **283** | A linha `N2-X-100` desenha o ícone `n.º de músicas` em `lineInfo` e o texto em `text`. | A `LinhaDeAviso` pinta ícone e texto com uma cor só, e `lineInfo` nunca é texto (§3.3): vai `muted`, como o "salvo, não relido". |
| **284** | Opacidade 0,5 do salvamento × E3. | **N2-E13**. |
| **285** | R1·7b põe o alvo de 48 × 72 *"encostado na borda esquerda"*; a moldura desenha o ícone a 24–48 dp dentro da linha (o recuo de 24 da linha). | Segue a R1·7b: o alvo começa na borda da linha e o ícone fica centrado nele, a 12–36 dp. O número cai no mesmo x da moldura (64 dp), porque o vão de 16 começa no fim do alvo. |
| **286** | **Defeito, achado no §4.** A linha erguida era translúcida (o acento a 12% no lugar do fundo opaco) e o buraco tracejado aparecia DENTRO dela. | **Consertado**: cópia opaca desenhada como o último filho da lista, acento como camada; a linha que segura o toque fica montada e invisível. CN endurecido, reprova contra o commit 2. `N2-PR5-anexos/aparato.md` §3. |
| **287** | A releitura da regra 3 pode falhar DEPOIS de um reorder que falhou; o congelado do modo não tem moldura para isso. | O botão principal vira `Tentar recarregar` (relê; não reescreve), como a N2-D32 prescreve e a N2-E3 fez na folha. |
| **288** | Sem rede **dentro** do modo: o congelado não desenha. | A linha `sem-rede-s2` aparece no modo e o botão principal inativa; o arrasto continua possível (nada é escrito durante o gesto). |
| **289** | **Tensão, não resolvida aqui.** Um 400 no reorder (a setlist mudou atrás do modo: outra aba adicionou ou removeu) lê a frase do T2-R15 *"a setlist mudou — a ordem foi recarregada"* — mas pela R2·1 a tela **mantém o arrasto**, e o arrasto já não é permutação: `Tentar de novo` recebe 400 de novo, e a saída é `Sair sem salvar`. | A frase promete uma recarga que a R2·1 proíbe de mostrar. Opções para o Marcel: (a) no 400 o modo descarta o arrasto e volta à ordem relida (a frase fica verdadeira); (b) outra frase. Nada foi mudado. |
| **290** | O §4.1 pôs o **Tab S6 em modo avião** para o estado sem rede. A regra herdada da V1-PR3 e o T2-R12 dizem que, no Tab S6, "sem rede" é só o override da API. A N2-PR4 fez o mesmo (§7.4 do aparato dela). | Restaurado, `ping` de volta em 16,5 ms. A regra e a prática das duas PRs divergem; se a regra vale, o estado 11 se refaz com o override. |
| **291** | As alças não entram na população do G5 (o `View` com `panHandlers` não é `clickable` para o `uiautomator`), e o `remover-7` aparece com 48,0 × 8,9 nos dumps `08` e `11`. | As alças se medem à parte: **48,0 × 72,0**. O `remover-7` é recorte de rolagem (a linha de aviso empurra a grade), não alvo pequeno. |
| **292** | O AVD `octavia_tab32` estava em modo avião (e sem wi-fi nem dados). | Lido antes; avião desligado e `svc data enable` para o §4.2(b); restaurado (`airplane=1 data=0`, `ping` inalcançável). |
| **293** | O rótulo `movida de <n>` só aparece depois de uma FALHA (a moldura); depois de soltar e antes de salvar, não. | A moldura só o desenha em `N2-S2e-ordem-falhou`. Se o Marcel o quiser antes, é uma condição a menos. |
| **294** | **Aparato**: o Metro com `CI=1` não vigia arquivo, e duas tentativas de conserto da div. 286 rodaram o bundle velho — mediram nada. | Achado por `curl` do bundle; Metro sem `CI=1`; todo reteste começa pelo `curl`. |

**N2-E14 — o 400 de permutação inválida descarta o arrasto (N2-D37).** A moldura `N2-S2e-ordem-falhou` preserva o arrasto em TODA falha (R2·1). No 400 de permutação isso dava uma tela sem saída — o arrasto já não é permutação da setlist e todo `Tentar de novo` recebe 400 —, e a frase do T2-R15 para esse caso ("a setlist mudou — a ordem foi recarregada") prometia uma recarga que a tela não mostrava. Com a N2-D37 o modo põe a ordem relida na tela, o aviso fica só com as duas primeiras orações, e não há `Tentar de novo`. Para qualquer outro erro, a moldura vale como está. `[div. 289, fechada]`

### Resolução das três que pediam decisão (Marcel, 2026-09-22)

- **276 → N2-D36 revista**: `Salvar a ordem` inativo com o motivo enquanto nada mudou; ativa ao primeiro movimento. Implementada no commit `fix(N2-PR5)`.
- **289 → N2-D37 / N2-E14**: o 400 de permutação descarta o arrasto; os outros erros seguem a R2·1.
- **290 → regra do aparato**: avião permitido em aceite manual com o estado lido, declarado e restaurado; o override da API é o caminho dos automatizados. Registrada no `PRD-TELA-2.md` §8 (o `CLAUDE.md` não tem seção de aparato — div. 299) e no `N2-PR5-anexos/aparato.md` §7.

### Divergências da revisão da N2-PR5, **295 a 300**

| div. | o que | o que foi feito |
| --- | --- | --- |
| **295** | O roteiro pede o `code` do contrato para a permutação inválida. **Não existe um próprio**: o `OB601` é SQLSTATE interno da RPC e não sai do servidor; na rede o erro é `400 VALIDATION_ERROR` com `details[].field = "order"` — o mesmo `code` do filtro de nome e dos erros de schema. | A chave é `VALIDATION_ERROR` no `op=reorder`, que o core já chamava de `ordem-mudou` (`packages/core/src/escrita.ts:275`): nada novo é lido da resposta. No `reorder` os outros caminhos até esse `code` (uuid malformado, mais de 100 itens, duplicata, corpo > 1 MB com `field:""`) são inalcançáveis pelo app, que só envia permutação da própria leitura, ≤ 100, e ~4 KB. |
| **296** | Com o motivo `nada mudou desde que você abriu` na barra, o título do modo encolhe e trunca (`REORDENAR · ENSAIO DE R…`, PNG `12`). A moldura não previa motivo na barra. | Aceito como está: o título é o nome da setlist, que a tela anterior mostra inteiro, e o motivo é o que a N2-D23 exige. Se o Marcel preferir o motivo em outro lugar (segunda linha da barra), é troca de estilo. |
| **297** | O CN pedido afirma `aviso-acao` ausente depois do 400 — mas no modo o `Tentar de novo` nunca morou na linha de aviso: ele é o `reordenar-salvar` da barra. A asserção pedida passaria também contra o código de ANTES. | O CN afirma as duas coisas: `aviso-acao` ausente **e** `reordenar-salvar` diferente de `Tentar de novo` — a segunda é a que reprovava. |
| **298** | "Sem `Tentar de novo`" deixa aberto o que o botão principal vira depois do descarte. | `Salvar a ordem`, cheio, pela N2-D36 — inativo com o motivo até o próximo movimento, e então salva o arrasto novo, feito sobre a ordem relida. |
| **299** | O roteiro manda a regra do avião para "a seção do aparato do `CLAUDE.md`, se ela existir". | `[medido]` `grep -n -i aparato CLAUDE.md` → nada. Foi para o `PRD-TELA-2.md` §8, como o roteiro prevê, com uma nota no T2-R12. |
| **300** | "Anexos em pt-BR, traduza o que estiver em inglês": a varredura dos anexos commitados acha inglês **só em saída literal de ferramenta** (`Test Files … passed`, `AssertionError: expected …`, `Cannot find module`, `Network is unreachable`). | Nenhuma medição foi reescrita — a regra `[medido]` exige a saída literal. O `N2-PR5-anexos/README.md` ganhou um glossário pt-BR dessas linhas. Todo texto que não é saída de ferramenta já estava em pt-BR. |

**Próxima divergência livre: 301.**

Divergências abertas nesta PR, **221 a 225** (o W4-a parou em 220):

| div. | o que | o que foi feito |
| --- | --- | --- |
| **221** | A folha se anuncia com **"23 testIDs"** em dois lugares (o chip do cabeçalho e o fecho da revisão 2) e abre a tabela com "Vinte e três". A tabela tem **25 linhas**. Os dois excedentes são `form-tentar` e `reordenar-sair` — exatamente os que a **revisão 1** acrescentou (R1·1 e R2·1): o número do cabeçalho ficou no valor de antes das revisões. `[medido]`: 31 células em IBM Plex Mono na seção, menos 6 que não são `testID` (`testID`, `onde`, `o que é`, `campo-busca` e dois `<n>` citados no corpo) = **25**. | A §7 traz as **25**, extraídas do fonte. O "23" fica citado onde a folha o diz (§1, §4.2), marcado. **O número que o G2 herda é 25**, e é ele que o `PRD-TELA-2.md` §8 passa a citar. A folha congelada **não** é reeditada (padrão E16). |
| **222** | O parêntese da folha que explica o catálogo — "(32 do catálogo + log-in + os 5 daqui, mais a marca fora da grade)" — **não fecha**: 32 + 1 + 5 = 38, e o texto ao lado diz 39. Além disso ele conta **um** desenho fora do catálogo, quando a **E14.a do V1** declarou **quatro** (`log-in`, `email`, `senha`, `nada-encontrado`). | O número **39 está certo**, e a leitura que o torna verdadeiro é a única que o `gate:icones` mede: **34 registros do anexo D + 5 = 39**. `[medido]`, `node scripts/icones.mjs`: `§6.4: 34 linhas → 33 nomes distintos, + 4 fora do catálogo = 37 esperados` · `anexo D: 34 registros`. O "32" do parêntese é o número do **título** da §6.4 do V1 ("Tabela dos 32"), que já estava 2 abaixo das linhas da própria tabela — a **E4** do V1 já dizia "16 das **34** linhas". A E17 e a N2-D33 registram **39 registros do anexo D**; a categoria "fora do catálogo" continua em 4 e não é tocada. |
| **223** | `shasum -a 256 -c SHA256SUMS` do **DESIGN-V1** já reprova **hoje**, na `main`, antes desta PR: `README.md: FAILED`, os três congelados `OK`. O hash do README foi atualizado pela última vez na V1-PR5 (`4cb3b22`) e o arquivo mudou duas vezes depois — V1-PR6 (`cc23550`, `b348da9`) e W2 (`336727e`), as duas sem tocar o `SHA256SUMS`. | **Não corrigido aqui**, por instrução: o `SHA256SUMS` do V1 não muda nesta PR. A E17 torna o hash **mais** velho, não o quebra — ele já estava quebrado. **Decisão do Marcel**: ou o README sai do `SHA256SUMS` do V1 (que é o que o DESIGN-N2 faz, §8), ou o hash se regrava a cada errata. Os **três congelados** do V1 seguem `OK`, que é o que a prova existe para dizer. |
| **224** | O `PRD-TELA-2.md` §8, linha do `gate:icones`, lista **seis** ícones novos — "criar, editar, arrastar, remover, apagar, **calendário**". O desenho tem **cinco**, e **não há ícone de calendário**: a data usa o seletor do sistema, e o `data` (lucide · calendar) já existe no V1 §6.4. "Adicionar" e "remover" são **um par**, um desenho só. | Corrigido no §4 desta PR: a linha passa a citar os cinco do anexo D, e o **quando** passa a ser a **primeira commit da PR-2** (N2-D33: o gate vem antes da tela que ele mede). |
| **225** | **Tensão declarada, não resolvida aqui.** A **N2-D31** manda a frase de limite de taxa **sem número** até se medir se o servidor manda `Retry-After`; mas o conjunto fechado do `PRD-TELA-2.md` T2-R15 já traz `RATE_LIMITED` → "muitas alterações seguidas — tente de novo em **N** s", com número, e o aceite do T2-R14 usa um mock com `Retry-After: 30`. O conjunto fechado, como está escrito, **presume** o cabeçalho. | Registrado. A **PR-2 mede** (N2-D31) e o conjunto fechado se ajusta na mesma PR: com `Retry-After`, a linha do T2-R15 fica como está; sem ele, ela perde o `N` e passa a ser a frase da moldura `N2-X-limite` ("Muitas mudanças em pouco tempo. Os controles de escrita voltam em instantes."). Até lá, o T2-R14 cita a N2-D31. |

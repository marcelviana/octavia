# N4 — brief do desenho: a biblioteca no tablet

**Para o Claude Design.** Este brief e os anexos dele são tudo o que você precisa: não é preciso ler código nem o resto
do repositório. As decisões do dono do app estão citadas pelo número (`N4-D…`) só para quem conferir depois; o texto diz
o que cada uma manda. Fonte do bloco: [`N4-PRECHECK.md`](N4-PRECHECK.md). Capturas e medidas:
[`N4-BRIEF-anexos/`](N4-BRIEF-anexos/README.md). O desenho congelado vai para `docs/native/DESIGN-N4/` (N4-D18).

---

## 1. O que é o bloco

Hoje o app do tablet é o **palco**: o músico abre uma setlist e toca, com ou sem internet. A biblioteca inteira dele
(todas as músicas, não só as que estão em setlist) **já está no aparelho**, mas só aparece de lado — pela busca.

O N4 traz **a biblioteca para o tablet**:

- **achar qualquer música** — uma lista de todas, com busca e filtro;
- **ver o cadastro dela** — a música com as informações que o músico cadastrou no site e que o palco não mostra (álbum,
  tom, andamento, notas…);
- **tocar** — abrir a música direto no palco, mesmo fora de setlist;
- **favoritar e desfavoritar**.

**Criar, editar, enviar arquivo e apagar continuam no site** (N4-D5). O tablet lê a biblioteca e só escreve uma coisa: a
favorita (N4-D21).

O que já vale hoje e não muda: **o texto de toda música está no aparelho** — a lista, a busca e a leitura funcionam sem
internet. Só os **arquivos** (partitura em PDF, cifra escaneada) precisam ser baixados uma vez; o app garante o download
de todos (N4-D27, N4-D42).

## 2. As superfícies a desenhar

### 2.1 L — a biblioteca

A lista de **todas** as músicas da conta, com:

- **a busca** — por título, artista, álbum e letra (o que a busca de hoje já faz, sem internet);
- **os filtros**: **tipo** (Letra · Cifra · Tab · Partitura) e **Só as favoritas** — nenhum outro (sem dificuldade, sem
  ordenação; N4-D31);
- **o favoritar na linha** — marcar e desmarcar sem sair da lista;
- **duas ações por música** (N4-D8): **visualizar** (abre V) e **abrir direto no palco** (tocar).

A linha mostra o que o músico precisa para reconhecer a música: título, artista (quando há), tipo, se é favorita e, para
música com arquivo, se o arquivo ainda não está no aparelho.

### 2.2 V — a visualização

Uma tela **própria, diferente do palco** (N4-D8): o palco mostra só o necessário para tocar; V mostra o cadastro.

- **cabeçalho**: título · artista · tipo;
- **os campos da N4-D31** (tabela no §7) e **as notas da música**;
- **o corpo da música**, pelo **mesmo leitor do palco** (N4-D24) — o mesmo texto em fonte mono, a partitura pelo mesmo
  leitor de PDF; sem os controles de tocar (rolagem automática, bordas de avançar). A **Cifra com seções** mostra o nome
  de cada seção antes dos acordes e da letra, como o site (N4-D40); o nome pode ser o que o editor do site grava sozinho
  (*"Content"*, *"Verse 1"*), e o desenho não o esconde. A **Tab** aparece como foi importada (N4-D44);
- **o favoritar**;
- **Tocar** — abre a mesma música no palco (N4-D26).

### 2.3 A entrada em S1 — duas alternativas lado a lado

S1 (a lista de setlists) **continua a tela inicial** e, em C, **não muda fora o controle novo** (N4-D11). Hoje a barra de
S1 tem o chip de sincronização, **Nova setlist** e **Buscar música**; `Buscar música` abre a busca na biblioteca inteira
(S4), que já funciona sem internet e já abre uma música no palco.

Desenhe **as duas alternativas, lado a lado** (N4-D33):

- **(a) conviver**: a biblioteca entra como controle novo em S1, ao lado de `Buscar música`, que continua abrindo a S4;
- **(b) absorver**: a biblioteca tem a busca dentro dela, e `Buscar música` passa a abrir a biblioteca (a S4 deixa de
  ser uma tela à parte).

O espaço que existe hoje na barra está medido em [`MEDIDAS.md`](N4-BRIEF-anexos/MEDIDAS.md) §5: em C, um terceiro
controle tira largura da caixa do título; em B, a segunda linha da barra tem 308 dp à esquerda dos dois botões.

### 2.4 O palco avulso sem setlist

Abrir uma música **da biblioteca, da visualização ou de S1** leva ao palco **sem setlist** (N4-D30): a barra de cima
**não tem nome de setlist**. Hoje ela mostra `AVULSA` · o nome de uma setlist (que nada tem a ver com a música) · título
· artista · tipo — e com **zero setlists** o palco nem abre (cai num aviso). Está medido no aparelho:
[`N4-BRIEF-anexos/README.md`](N4-BRIEF-anexos/README.md) §2.

Desenhe a barra do palco avulso **sem a setlist**: o que fica no lugar do nome, e quais controles da barra de baixo
fazem sentido sem setlist (hoje ela mostra *Abrir o índice da setlist*, que não tem objeto aqui, e *Voltar para a busca*).
**O palco aberto de dentro de uma setlist não muda** — nem o com setlist, nem o avulso aberto pela busca do palco, que
volta à posição (N4-D30).

## 3. As faixas

A folha desenha **as três** (N4-D12); o N4 implementa **C e B**; A precisa só **não quebrar** até o bloco do celular
(N5), e o que for inalcançável em A vira lista de herança.

| faixa | largura útil | canvas | o que é | o que vale |
|---|---|---|---|---|
| **C** | > 960 dp | **1138 × 627** | tablet deitado — o palco de hoje | composição de referência; S1 não muda fora o controle novo |
| **B** | 700–960 dp | **711 × 1054** | tablet em pé | já implementada nas telas de hoje (N3); a regra do §4.1 |
| **A** | < 700 dp | **411 × 874** | celular em pé | desenhada, implementada no N5; hoje o app usa nela os valores de B — a referência de A são as molduras `N3-A-*` |

Os valores por faixa (barras, cartões, linhas, alvos) estão em [`MEDIDAS.md`](N4-BRIEF-anexos/MEDIDAS.md), com a origem
de cada um.

## 4. As regras que o desenho herda e não reabre

1. **Quando não cabe, a composição empilha; o conteúdo não sai.** Linha de controles vira duas linhas, cartão cresce,
   grade de duas colunas vira uma; nenhum controle some, nenhum texto de leitura encolhe. *(`DESIGN-N3/README.md` §1,
   verbatim.)*
2. **A linha de aviso cresce e nunca elide**: 48 dp no mínimo, +20 por linha. *(N3-D19.)*
3. **Rótulo curto com nome acessível longo**: quando o rótulo visível encurta, o nome lido pelo leitor de tela é a frase
   inteira (como `Adicionar` / *Adicionar música*). *(N3-D17.)*
4. **Alvo de toque mínimo de 48 dp**; linha de lista tocável 56; controle do palco 64. *(Os valores do pacote de
   identidade; `DESIGN-V1/README.md` §5.2.)*
5. **Tokens por faixa, e nenhum token fora do pacote de identidade** — o que varia por faixa é valor do pacote, não conta
   na tela. O desenho pode **propor** token novo, **em lista separada**, e quem decide é o dono do app. *(N3-D28;
   N4-D3.)*
6. **S1 continua a tela inicial e não muda em C fora o controle novo.** *(N4-D11.)*
7. **O palco com setlist não muda.** *(N4-D30; o desenho do palco é o congelado do V1/N3.)*
8. **Nada específico de Android na composição**: as faixas decidem pela largura, não pelo sistema; o iPad herda.
   *(N3-D5.)*
9. **Controle inerte diz o motivo sem precisar de toque** — o favoritar sem internet fica inerte com o motivo à vista.
   *(N2-D23; N4-D23.)*
10. **Falha é um estado na tela, com o motivo** — nunca tela vazia. *(V1, os placeholders do palco; N2, as espécies de
    falha.)*
11. **Frase nova só como proposta** (§8), em lista separada; o desenho usa as que existem.

## 5. O inventário por estado

"Passa" sem estados não é passa (regra 17 do projeto): cada superfície se desenha em **todos** os estados abaixo. A
coluna **hoje** diz se o estado já existe em alguma tela do app (e onde ver) ou se é **novo**. As capturas com prefixo
`N4BR-` são desta PR (C e B); `N3P6B-` são da N3-PR6b (`N3-PR6b-anexos/`, dump em C e B, imagem em B); `B5-` e `REF-` são
do pre-check do N3 (`N3-PRECHECK-anexos/B5-baseline/` e `B3-referencia-paisagem/`, imagem e dump em C). Os nomes `LIB-…`
e `VIEW-…` são molduras do site (folhas 4 e 5 do `DESIGN-I1`) — referência de **estado**, não de composição: o site não
é o tablet.

### 5.1 L — a biblioteca

| estado | hoje | onde ver |
|---|---|---|
| **base** — a lista com músicas | novo; o parente é a busca com resultados | `N4BR-S4-resultados`; site `LIB` |
| **sincronizando, sem nada no aparelho** (a 1ª vez) | existe em S1 | `N3P6B-S1-S1a-sincronizando`; V1 `S1a` |
| **vazia** (a conta não tem música) | novo para a lista; o análogo é S1 vazia | `B5-S1-S1f-vazia`; site `LIB-vazio` |
| **busca sem resultado** | existe na busca | `N3P6B-S4-S4b-sem-resultados`; V1 `S4b` |
| **filtro sem resultado** (inclusive *Só as favoritas* sem nenhuma) | novo | site `LIB-vazio-busca` |
| **sem rede** — a lista, a busca e a leitura funcionam; o favoritar fica inerte com o motivo | o aviso existe em S1; o favoritar inerte é novo | `B5-S1-aviso-sem-rede`; N2 `N2-S1-sem-rede` (o controle de escrita inerte com o motivo) |
| **falha de sincronização, com o que já está no aparelho** | existe em S1 | `B5-S1-S1e-falha-com-cache`; V1 `S1e` |
| **falha de sincronização, sem nada no aparelho** | existe em S1 | `N3P6B-S1-S1d-offline-sem-cache`; V1 `S1d` |
| **arquivo ainda não baixado**, na linha — **só música com arquivo** (Partitura, Cifra escaneada; N4-D42) | novo na linha; existe no palco | `REF-S3-S3e-nao-baixado` (o palco) |
| **download do arquivo com falha**, na linha — idem | novo na linha | — |
| **favoritando** (o pedido saiu e não voltou) | novo; o molde é o *adicionando…* do picker | N2 `N2-P-resultados` |
| **favoritar com falha, por espécie** (§8.3) | novo; o molde é a falha de escrita do N2 | N2 `N2-X-falhou`, `N2-X-limite`; as amostras `N3-B-X-*`, `N3-A-X-*` |
| **favorita** e **não favorita** | novo | site `LIB` (*Favoritar* / *Favorita*) |
| **título longo** | existe | `N4BR-S4-resultados-tab-ret` (a linha de título comprido); `REF-S3-titulo-longo` |
| **sem artista** — o caso **comum** (§6) | existe na busca | `N4BR-S4-resultados-tab-ret` (*Décima do ensaio*: só título e tipo) |
| **tipo desconhecido** | existe no índice e no palco | `N3P6B-S2-S2-invalidos`; V1 `S2-invalidos` |
| **item inválido** (sem conteúdo) | existe no índice e no palco | `N3P6B-S2-S2-invalidos`, `N3P6B-S3-S3-nobody` |

### 5.2 V — a visualização

| estado | hoje | onde ver |
|---|---|---|
| **base**, um por tipo: Letra, Cifra (com e sem seções), Tab, Partitura | novo como visualização; o corpo existe no palco | `N4BR-S3-com-setlist` (Letra); `REF-S3-S3b-cifra-*`, `REF-S3-S3c-tab-autoscroll`, `REF-S3-S3d-pdf-12p`; site `VIEW-cifra`, `-letra`, `-tab`, `-partitura` |
| **campos vazios** — música sem nenhum campo do §7, sem notas | novo | — |
| **vazio por tipo** (o corpo não tem conteúdo) | existe no palco | `N3P6B-S3-S3-nobody`; site `VIEW-vazio-*` (4) |
| **PDF carregando** (*baixando o arquivo…*) | existe no palco | `N3-A-S3-baixando` (A); site `VIEW-carregando-pdf` |
| **PDF com erro** / **arquivo não baixado** | existe no palco | `REF-S3-S3e-nao-baixado`; `N3-A-S3-erro`; site `VIEW-erro-pdf` |
| **formato que o app ainda não mostra** (N4-D43) — arquivo que não é PDF, decidido pela extensão; também no palco | novo | site `VIEW-erro-formato` |
| **favorita**, **favoritando**, **favoritar com falha**, **sem rede** | novo (como na lista) | §5.1 |
| **título longo**, **sem artista**, **tipo desconhecido** | existem no palco | `REF-S3-titulo-longo`; `N3P6B-S2-S2-invalidos` |

### 5.3 A entrada em S1 e o palco avulso

| superfície | estados |
|---|---|
| S1 com o controle novo | os de S1 de hoje — base, sincronizando, vazia, sem rede, falha com e sem cache (`N4BR-S1-setlists`, `B5-S1-*`, `N3P6B-S1-*`) — em cada alternativa do §2.3 |
| palco avulso sem setlist | os do palco de hoje, com a barra sem setlist: Letra, Cifra, Tab, Partitura, arquivo não baixado, formato que o app não mostra, item inválido, título longo, sem artista (`N4BR-S3-avulso-de-S1-com-setlists` é o de hoje; `N4BR-S3-avulso-de-S1-sem-setlists` é o que acontece com zero setlists) |

## 6. O dado real que molda o desenho

A biblioteca da conta principal (pre-check do N4, Fase B; só números):

| | |
|---|---|
| músicas | **63** |
| por tipo | **57 Letras** · 3 Cifras · 2 Tabs · 1 Partitura |
| **sem artista** | **52 de 63** |
| favoritas | **1** |
| maior título · maior artista | **27** caracteres · **13** |
| arquivos | 1 (o PDF da Partitura), já no aparelho |

O que isso pede:

- **a linha tem de funcionar bem sem artista** — é o caso comum, não o raro; o desenho decide se a linha mostra um
  vazio, outra informação ou nada (pergunta 3);
- **a lista é quase toda de um tipo só**: o filtro por tipo separa um grupo de 57 de três grupos de 1 a 3 (pergunta 5);
- ***Só as favoritas* com 1 item** é o caso real, e com **0** é o mais provável numa conta nova;
- o **pior caso de comprimento** desenhado continua sendo o título longo da fixture do projeto (o do N3), não o da conta.

E uma consequência que o dono do app aceitou (N4-D39): **favoritar no tablet sobe a música no "Recentes" do painel do
site**, como o favoritar do site já faz.

## 7. Os campos da visualização

O que V mostra além do que o palco já mostra (título, artista, tipo, corpo). Só os campos que **o site salva de
verdade** (N4-D31), com o nome que o site usa:

| campo | nome no site | mostra? |
|---|---|---|
| álbum | *álbum* | sim |
| dificuldade | *dificuldade* (Iniciante · Intermediário · Avançado) | sim |
| gênero | *gênero* | sim |
| tom | *tom* | sim |
| andamento | *andamento* (*{x} BPM*) | sim |
| etiquetas | *etiquetas* (separadas por ` · `) | sim |
| notas da música | *Notas de palco* | sim — são as notas **da música**; as do palco são **da posição na setlist** (outra coisa) |
| criação e alteração | *criado* · *alterado* | **o desenho propõe** se aparecem (pergunta 4) |
| favorita | *Favoritar* / *Favorita* | é o controle de favoritar |
| **compasso** | *compasso* | **não** |
| **capo** | *capo: {x}* | **não** |
| **afinação** | *afinação: {x}* | **não** |

**Por que os três ficam fora**: hoje o site **não grava de verdade** compasso, capo e afinação — o editor não envia o
compasso, e o envio de arquivo perde os três. Mostrá-los no tablet seria mostrar um valor que o músico talvez não tenha
conseguido salvar. Ficam para o bloco do backend (Bloco D).

No site, campo vazio **não aparece** (a lista de *Detalhes* só traz os campos preenchidos).

## 8. O vocabulário que já existe

Use as frases que existem. **Frase nova só como proposta, em lista separada** (§10). Estilo do app: minúsculas,
travessão, sem ponto final; botões com inicial maiúscula.

### 8.1 Tipo, estado da música, motivo

| sentido | no tablet hoje | no site |
|---|---|---|
| os quatro tipos | *Letra* · *Cifra* · *Tab* · *Partitura* | os mesmos |
| tipo desconhecido | *tipo desconhecido* (palco) · *tipo não reconhecido — edite na versão web* (índice) | rótulo vazio, ícone de tipo desconhecido |
| música sem conteúdo | *este item não tem conteúdo* (palco) · *nada para mostrar — edite na versão web* (índice) | *nenhuma letra* · *nenhuma cifra* · *nenhuma tablatura* · *nenhuma partitura* |
| artista ausente | (nada: a linha não mostra) | *artista desconhecido* |
| carregando | *carregando…* (índice) · *baixando suas setlists pela primeira vez* (S1) | *carregando a biblioteca…* |
| arquivo | *arquivo não baixado* · *{título} · {tipo} ({tamanho}) não está neste aparelho.* · *Toque em Baixar para trazê-lo para este aparelho.* / *Sem conexão agora — toque em Baixar quando a rede voltar.* · *baixando o arquivo…* · *Baixar* | *carregando o PDF…* |
| arquivo com falha | *não consegui baixar* · *o arquivo chegou vazio* · *o arquivo chegou corrompido* · *arquivo incompleto: {n} de {m} bytes* | *não foi possível abrir o PDF — {motivo}* · *não foi possível abrir o arquivo — confira o formato* |
| busca | *nada encontrado para “{termo}”* · *busca em título, artista, álbum e letra de toda a biblioteca ({n} músicas)* · *Biblioteca · {n} músicas* · *{n} resultados* | *nada encontrado* · *mude a busca ou os filtros* |
| filtros | — | *Filtros* · *Só as favoritas* |

### 8.2 Sincronização e rede

| sentido | no tablet hoje | no site |
|---|---|---|
| sem rede | *sem conexão* | *sem conexão* |
| sincronizando · sincronizado | *sincronizando…* · *sincronizado {há quanto}* · *mostrando dados salvos* | — |
| falha de sincronização | *sua sessão expirou* · *servidor ocupado · tente em instantes* · *não encontrado no servidor* · *o servidor recusou o pedido* · *falha no servidor* · *falha ao sincronizar* · *Tentar novamente* | *não foi possível carregar a biblioteca — {motivo}* |
| controle de escrita sem rede | *Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.* (S1) · *Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.* (setlist) | — |

### 8.3 Favoritar — as espécies de falha

O favoritar é **só online**, como as escritas que o tablet já faz nas setlists (N4-D23), e a falha tem a **espécie**
(N2). O tablet hoje usa estas frases nas escritas de setlist; o site tem as do favoritar:

| espécie | no tablet hoje (escrita de setlist) | no site |
|---|---|---|
| sem rede | *sem conexão — nada foi salvo* | *sem conexão* |
| sem resposta | *sem resposta do servidor* | — |
| sessão | *não foi possível salvar — confira sua conta no site* | *o servidor não aceitou a sessão — entre de novo* |
| limite | *muitas alterações seguidas — tente de novo em {N} s* | *muitas tentativas — tente de novo em instantes* |
| servidor | *falha no servidor — nada foi alterado aqui* | *falha no servidor* |
| genérica | *não foi possível salvar* | *algo deu errado — tente de novo* |
| o controle | — | *Favoritar* · *Favorita* · nomes acessíveis *Favoritar “{título}”* · *Tirar “{título}” das favoritas* |

O motivo é guardado **isolado** e cada lado compõe a frase do seu jeito (N4-D29): o tablet junta orações com ` · `, o
site com *"… — {motivo}"*. O desenho usa a composição do tablet.

## 9. Perguntas ao desenho

1. **A entrada**: as duas alternativas do §2.3, lado a lado — a biblioteca convive com *Buscar música* ou a absorve?
   Em cada uma, o que acontece com a barra de S1 em C (sem mudar o resto de S1) e em B.
2. **A linha**: onde ficam **visualizar**, **tocar** e **favoritar**? Toque na linha faz o quê, e quais ações são
   controles próprios? (Alvo mínimo 48; o pior caso de largura é B, e A precisa não quebrar.)
3. **Sem artista**: como a linha se comporta quando não há artista — o caso de 52 em 63?
4. **As datas**: *criado* e *alterado* aparecem na visualização? (N4-D31 deixa ao desenho.)
5. **O filtro numa lista quase toda de Letras**: como se apresenta o filtro por tipo quando um tipo tem 57 e os outros
   têm de 1 a 3 — e como *Só as favoritas* convive com ele?
6. **"Não baixada" na linha**: o que a linha de uma música com arquivo mostra antes de o arquivo chegar, e quando o
   download falhou? (Não acontece com música só de texto.)
7. *(acréscimo do executor)* **A barra do palco avulso sem setlist** (§2.4): o que ocupa o lugar do nome da setlist, e o
   que a barra de baixo oferece no lugar de *Abrir o índice da setlist*?
8. *(acréscimo do executor)* **Favoritando**: enquanto o pedido está em voo, o que a linha e a visualização mostram — e o
   controle fica inerte até a resposta?
9. *(acréscimo do executor)* **Dois valores que hoje não existem**: a altura mínima da folha (o cartão de criar/editar
   setlist) em B e A, e a largura mínima do artista no modo de reordenar em C. O desenho propõe ou declara que ficam sem
   mínimo (N4-D17).

## 10. O que se pede de volta

- **Folhas por superfície × faixa × estado**: L, V, a entrada em S1 (as duas alternativas) e o palco avulso sem setlist;
  em C, B e A; cada estado do §5. Cada moldura com um ID no começo da legenda (`N4-<faixa>-<superfície>-<estado>`), como
  nas folhas do N2 e do N3.
- **A tabela de medidas com a origem de cada uma**: **medida** (vinda de captura ou de `MEDIDAS.md`), **derivada de
  token** (o nome do token) ou **estimada** — as estimadas são as primeiras que a implementação confere.
- **As propostas em lista separada do desenho**: tokens novos, frases novas, ícones novos, e o que mais o desenho
  propuser fora do que o brief pede. Cada uma com o porquê.
- **Duas rodadas**: a primeira volta com as perguntas do §9 respondidas como proposta; o dono do app decide; a segunda
  fecha. Depois vem o congelamento, com sha.

## 11. Os anexos

| o quê | caminho |
|---|---|
| as capturas desta PR (C e B, imagem + dump), o README que diz cada uma | [`N4-BRIEF-anexos/capturas/`](N4-BRIEF-anexos/capturas/), [`N4-BRIEF-anexos/README.md`](N4-BRIEF-anexos/README.md) |
| as medidas por faixa | [`N4-BRIEF-anexos/MEDIDAS.md`](N4-BRIEF-anexos/MEDIDAS.md) |
| as folhas 4 e 5 do site — **referência de estados** (o site não é o tablet) | [`docs/ux/DESIGN-I1/4-content-lista/telas.html`](../ux/DESIGN-I1/4-content-lista/telas.html), [`5-content-visualizacao/telas.html`](../ux/DESIGN-I1/5-content-visualizacao/telas.html); os estados e as frases em [`README-design.md`](../ux/DESIGN-I1/README-design.md) |
| as molduras `N3-A-*` (a referência de A) e a regra da folha | [`DESIGN-N3/telas.html`](DESIGN-N3/telas.html), [`DESIGN-N3/README.md`](DESIGN-N3/README.md) §1 |
| S1, S4, o palco (o congelado de C) | [`DESIGN-V1/telas.html`](DESIGN-V1/telas.html) — `S1a`…`S1f`, `S2-invalidos`, `S3-letra`, `S3-avulsa`, `S3d`, `S3e`, `S3-nobody`, `S4a-resultados`, `S4b`; tabela das molduras no [`DESIGN-V1/README.md`](DESIGN-V1/README.md) §7 |
| o picker e as escritas (os moldes do favoritar) | [`DESIGN-N2/telas.html`](DESIGN-N2/telas.html) — `N2-P-resultados`, `N2-P-relendo`, `N2-S1-sem-rede`, `N2-X-falhou`, `N2-X-limite`, `N2-X-sem-rede` |
| as capturas de hoje que o §5 cita | [`N3-PRECHECK-anexos/B5-baseline/`](N3-PRECHECK-anexos/B5-baseline/), [`B3-referencia-paisagem/`](N3-PRECHECK-anexos/B3-referencia-paisagem/), [`N3-PR6b-anexos/`](N3-PR6b-anexos/README.md) |

---

**A próxima PR desta lista** (N4-D45): depois do desenho (duas rodadas) e do congelamento, a **PR-3 — core das frases**.

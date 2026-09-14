# V1-PR6-anexos — o bruto da V1-PR6

> **Rastro de medição, não fonte.** A fonte da PR é o diff e as mensagens de
> commit; a fonte do bloco será o `V1-ENCERRAMENTO.md`. Isto é o material que
> o aceite da **V1-PR7** vai precisar para comparar antes × depois sem refazer
> o trabalho.
>
> **Data**: 2026-09-13. **Aparato**: AVD `octavia_tab32` (API 32, 2560×1600 @
> 360 dpi = 1138×711 dp), conta de audit, subido **sem** `-no-snapshot-save`
> (div. 42), dev client da V1-PR3 (nenhuma instalação nesta PR). **As duas
> aberturas do app em avião, o corte provado por `ping` antes de cada uma** —
> quatro provas ao todo, contando a do estado em que o AVD foi encontrado (rede
> VIVA) e a do fim. O Tab S6 `RX2N8000F3D` **não recebeu um comando**.
> **Prod: 0 requests a `/api/*`** (anexo C1); o teto do bloco continua em 2.
>
> **ANTES** = `origin/main` (`1ba1557`), Metro do worktree **sem commit
> nenhum**, com `git status` limpo — `apps/native` byte a byte igual ao de
> `origin/main`. Ao contrário da V1-PR5, que usou o Metro do commit 1 porque
> ele só tocava `scripts/`, aqui o commit 1 mexe em `src/icones/dados.ts`, e a
> coleta do ANTES foi feita **antes de qualquer commit**.
> **DEPOIS** = `v1/pr6-acabamento` em `dc4632a` (commit 4).
>
> **Worktree**: `../octavia-v1pr6`, branch `v1/pr6-acabamento` a partir de
> `origin/main`. O checkout principal não foi tocado.

| Arquivo | O que traz |
|---|---|
| `V1-PR6-A-estados-antes-depois.txt` | bounds de **todos** os alvos, textos do dump e `content-desc` por estado, antes × depois; a fileira de marcas prevista × medida |
| `V1-PR6-B-gates.txt` | G1–G6, `gate:a20` e `gate:icones` commit a commit, os dois controles negativos, suíte · tsc · lint |
| `V1-PR6-C-aparato-e-prod.txt` | contabilidade de prod, o corte de rede provado quatro vezes, AVD antes × depois × durável, Metro, `.env`, o que não foi medido |
| `V1-PR6-D-moldura-para-token.txt` | cada número das seis molduras e o token (ou literal declarado) que o código usa — os acréscimos à **E10** —, as cinco em que a regra venceu a moldura, e de onde saem os 128 da §7.1 |

## Dumps e capturas

`dumps-antes/` (8 estados) e `dumps-depois/` (10) — um `.xml` (`uiautomator
dump`) e um `.png` (`screencap`, tirado ANTES do dump — div. 51) por estado.
`SHA256SUMS.txt` em cada diretório.

| estado | o que é | tem moldura? |
|---|---|---|
| `S0` | **não existe aqui, nos dois lados** — ver abaixo | sim |
| `S4a-vazio` | busca com o campo vazio, teclado fechado — o comparável com a moldura | sim |
| `S4a-vazio-teclado` | o mesmo na entrada real: o `autoFocus` abre o teclado | — |
| `S4a-resultados` | termo "aguas", 2 resultados, grupo Biblioteca | sim |
| `S4b` | termo "xablau", nada encontrado | sim |
| `S5` | fim de "UX-AUDIT Show padrão", 8 músicas | sim |
| `S5-n-grande` | fim de "UX-AUDIT Estresse", 60 músicas — **dado real, não fixture** | sim |
| `A11-busca-do-palco` | busca aberta do palco na música 4 de 8 (grupo "Nesta setlist") | não |
| `A11-restaurado` | a mesma, depois de fechar: o palco de volta em 4 de 8 | não |
| `A11-estresse` | (só DEPOIS) a mesma busca na setlist de 60: 43 resultados | não |
| `A14-voltar-inicio` | (só DEPOIS) "Voltar ao início" do S5 de 60 → palco em 1 de 60 | não |

**O `S0` não tem captura em nenhum dos dois lados, e isso é limitação
declarada.** Alcançá-lo exige `pm clear` — que apaga o store que é a baseline
do bloco — e voltar dele exige a senha do Marcel, que a automação nunca digita.
O prompt desta PR manda explicitamente não tentar. A referência de antes é a
`docs/native/N1-anexos/PR7-a2-token-forjado.png` (#289), declarada elegível no
`V1-PRECHECK.md` §4.3. **O S0 inteiro — incluindo se ele sequer renderiza no
device — é aceite da V1-PR7**, que vai precisar de um login do Marcel.

`instrumentos/` — `g1.sh` · `g5.mjs` · `g6.sh` (verbatim da V1-PR1), `ids.mjs`,
`bounds.mjs` e `estado.mjs` (V1-PR3/PR4/PR5), `env.sh` (as funções de condução
do AVD, caminhos anonimizados) e **dois novos**: `marcas.mjs`, que é a mesma
função de N grande do `EndScreen.tsx` isolada para reproduzir os três números
da §7.1 sem abrir o app, e `fileira.mjs`, que mede a fileira de marcas num
dump. Os dois juntos são o par previsão × medida do anexo A4.

## Aceites do PRD que tocam estas telas

| # | resultado | onde |
|---|---|---|
| **A11** | ✓ busca aberta do palco na música 4 de 8, termo "a", grupo "Nesta setlist · UX-AUDIT SHOW PADRÃO" com **8 resultados** e as posições 1…6 visíveis; fechar devolve o palco onde estava. Log **idêntico ao do ANTES**: `search q=1 n=50 in-setlist=8` → **`search close restore n=4/8`** → `keepawake on` → `stage restore n=4/8`, e o dump traz `4 DE 8`. Repetido na setlist de 60 (`A11-estresse`): `in-setlist=43`, régua "43 RESULTADOS", e `search close restore n=1/60` → `stage restore n=1/60` | `A11-busca-do-palco`, `A11-restaurado`, `A11-estresse` |
| **A14** | ✓ a parte de fim de setlist. Avançar na última música chega ao S5 nas duas setlists (`end-of-setlist n=8` e `n=60`), a borda esquerda continua lá com bounds **idênticos** aos do ANTES, "Sair" volta para a S1 e **"Voltar ao início" leva ao palco em `1 DE 60`** (`A14-voltar-inicio`). O salto do índice (2 toques do palco até a 47 de 60) é do S2 e já foi medido na V1-PR5 | `S5`, `S5-n-grande`, `A14-voltar-inicio` |
| **A2** | **parcial, e o resto é da V1-PR7.** A lógica do login é dispensada pelo G1 (nada de `session.ts`, `firebase.ts` ou `api.ts` mudou — diff vazio nos quatro commits), e o `gate:a20` lê os dois `accessibilityLabel` novos dos campos. O que **não** foi medido: a tela renderizada, porque o S0 não é alcançável sem `pm clear`. O `accessibilityLabel="Octavia"` da marca continua na linha que sempre esteve, e o dump da V1-PR7 vai ler as duas casas dele (E11) | — (ver C7) |

Os demais aceites são da V1-PR7.

## Itens para o ACEITE VISUAL da V1-PR7, no Tab S6

A V1-PR4 abriu a lista com um item, a V1-PR5 acrescentou dois, e a V1-PR6
acrescenta **três**. Todos têm a mesma forma: o gate prova o markup, o dump
prova a geometria, e **nenhum dos dois prova que se lê**.

| # | item | por que só o olho decide | referência |
|---|---|---|---|
| **AV-1** (V1-PR4) | os indicadores `parcial`, `nunca sincronizada` e `baixando` no cartão do S1 | não têm moldura | `V1-PR4-anexos/dumps-depois/S1c-indicadores.png` |
| **AV-2** (V1-PR5) | a tab de quatro cordas no chip de tipo, em 20 dp | única exceção declarada da família (§6.3) — e agora aparece **em duas telas**, S2 e S4 | `V1-PR5-anexos/dumps-depois/S2.png` · `dumps-depois/S4a-resultados.png` |
| **AV-3** (V1-PR5) | os placeholders de inválido a 28 dp ao lado de rótulos de 13, no S2 | o desequilíbrio de 8 dp medido e aceito (E13.b) | `V1-PR5-anexos/dumps-depois/S2-invalidos-rolado.png` |
| **AV-4** (V1-PR6) | **o S0 inteiro** — a marca a 340 dp, os ícones dos campos, o triângulo do erro, o `log-in`, e o botão inativo em `lineInfo` (E3) | **não foi visto uma vez sequer no device**, nem antes nem depois: nenhum dump, nenhuma captura. É o único caso da série em que o aceite visual é também o **primeiro** contato com a tela. Exige um `pm clear` e um login do Marcel | `docs/native/DESIGN-V1/telas.html`, moldura `S0`, contra `N1-anexos/PR7-a2-token-forjado.png` |
| **AV-5** (V1-PR6) | **a fileira de marcas do S5 com 60 músicas**, marca de 10 dp e folga de 5 | a geometria fecha em 0,1 dp (A4), mas 10 dp de marca com 5 de folga é o ponto em que a §7.1 admite que "a marca já não conta músicas legíveis, e é isso mesmo: a leitura vira proporção". Se no painel real a fileira de 60 ler como **linha tracejada** e não como contagem, o piso de 6 e a folga de 5 são os dois números a mexer | `dumps-depois/S5-n-grande.png` contra `dumps-depois/S5.png` |
| **AV-6** (V1-PR6) | **o acento nas marcas do S5** (div. 92) | a E12 deixou o acento com um significado só — ativo, atual ou foco — e as marcas não são nenhum dos três ao pé da letra. A moldura pede acento e **argumenta** ("proporção, não medalha"), ao contrário da S1b, que herdou a cor sem pensar. Fica acento, e o olho decide se a tela ficou com dois donos de acento ou com um | `dumps-depois/S5.png` |

## Divergências — 81 em diante

*(Origens: **P** prompt/pre-check · **D** design/documento · **A** app/código · **T** teste/instrumento.)*

| # | Origem | O que é |
|---|---|---|
| **81** | **D** | **Três desenhos fora do catálogo, não um.** As molduras `S0` e `S4b` trazem `email`, `senha` e `nada-encontrado` — nenhum deles em linha alguma da §6.4, que declara "Fora do catálogo, **dois** desenhos" (o `log-in` e o laço). Pôr os três no mapa faria o `gate:icones` acusar "sobra no mapa" três vezes, pela regra 1. **Extra declarado**: a regra 5 do gate, que cobra a categoria inteira contra o `telas.html` por forma. Errata proposta: **E14.a** |
| **82** | **T** | **O DÉCIMO caso do padrão do §9.1** — o `gate:a20` lia `rotulo=` e `motivo=` como PROP de JSX e não como CHAVE DE OBJETO, e desde a V1-PR5 o app põe texto de UI exatamente aí. Por extenso abaixo, fora da tabela: é material de `LOGS-OCTAVIA.md` |
| **83** | **T** | **O G3 conta comentário, e não mexer nele foi decisão, não omissão.** Por extenso abaixo, fora da tabela: é material de `LOGS-OCTAVIA.md` (decisão do Marcel) |
| **84** | **D** | **A altura do campo do S0**: a moldura desenha 52, que é empate exato entre `touch.min` (48) e `touch.list` (56) — e a §5.2 **nomeia este elemento por escrito**, "`touch.list + 4` = 60 (campo do login)". Ficou **60**, que é o que o app já tinha. Errata proposta: **E14.b** |
| **85** | **D** | **O `falha` do S0 a 20 e não aos 24 da §6.4.** A tabela dá 24 e nomeia uma casa só, o banner do S1e; o S0 é casa nova e a §5.5 põe em 20 o "ícone dentro de texto". O critério da E13.b (a tabela vence) valia lá porque a §6.4 **nomeava a casa**. Errata proposta: **E14.c** |
| **86** | **D** | **Os rótulos "Email" e "Senha" saem da tela** — é o que a legenda da moldura pede ("marcam o papel do campo sem rótulo flutuante"). Não somem: viram `accessibilityLabel` do próprio `TextInput`, e o leitor de tela lê o mesmo. Decisão de código, declarada |
| **87** | **A** | **A E3, aplicada no S0.** O `botaoInativo` era `opacity: 0.4`, e a §6.2 proíbe opacidade em estado. Virou tinta: preenchimento em `lineInfo`, que é o token do elemento desabilitado (§3.3, regra 3) — e é por estar inativo que ele é isento dos 4,5:1. O `botaoPressionado` trocou `opacity: 0.85` por preenchimento em `muted`. É a primeira aplicação da E3 fora do palco |
| **88** | **D/A** | **O título do S4b não recebe o `text-transform: uppercase` da moldura.** Nos outros lugares o uppercase cai sobre string fixa; aqui a string carrega o termo que o usuário acabou de digitar, e o `textTransform` do RN no Android transforma o TEXTO (aparece maiúsculo até no `text` do dump). Errata proposta: **E14.d** |
| **89** | **D/A** | **O número do resultado do S4 vai de `accent` para `muted`.** O S4 não tem posição ATUAL, e a E12 deixou o acento com um significado só. É o mesmo movimento que a V1-PR5 fez no S2 (§3.3). A moldura não desenha o grupo "Nesta setlist", então não há frame que discorde |
| **90** | **D/A** | **O `S4a-vazio` ganha corpo.** Era uma `FlatList` com zero linhas — tela em branco. A moldura põe ali o `buscar música` de 28 e a frase de escopo, que é **a mesma string** que o `S4b` já mostrava (extraída para uso nos dois). Texto novo em tela: nenhum |
| **91** | **D** | **A barra superior do S5 fica em 64 e Raleway, contra os 88 e o mono da moldura.** As molduras `S5` e `S3` desenham as duas iguais entre si; o app também as tem iguais entre si, com outros números. A §1 congela a barra superior do S3, então mudar só a do S5 abriria 24 dp e uma família de diferença entre duas telas que o músico atravessa deslizando. Errata proposta: **E14.e** |
| **92** | **D** | **As marcas do S5 em `accentInk`, contra a letra da E12** ("acento só em ativo, atual ou foco"). Ficou acento, por três razões: a §3.1 dá o acento ao "número de posição", e as marcas SÃO as posições percorridas em forma gráfica; o S5 não tem nenhum outro acento, então "um dono só" continua valendo; e a moldura **argumenta** a escolha ("é o mesmo vocabulário do arco de garantia — proporção, não medalha"), ao contrário da `S1b` da E12, cuja legenda dizia "mesma cor de antes" — herdou sem pensar, que foi a causa registrada da E12. **Item AV-6 do aceite visual**. Errata **E15.a**, com a distinção que sai daí: *moldura que argumenta não é moldura que herda* |
| **93** | **D** | **Os 128 da §7.1 não saem da "folga fixa de 5".** Com folga fixa a marca bate no piso de 6 em N=82 e a regra pararia aí. O 128 exige um segundo trecho que a §7.1 não escreve: abaixo do piso a marca fica em 6 e quem encolhe é a **folga**, até 1 dp — 128 dá 1,04 e 129 dá 0,98. A conta inteira está no anexo D5 e a função, no `EndScreen.tsx` e no `instrumentos/marcas.mjs`. Errata proposta: **E14.f** |
| **94** | **D/A** | **A div. 74 da V1-PR5, fechada.** O critério, decidido para as duas telas de uma vez: *o ícone de tipo existe quando o app sabe o tipo*. (1) sabe e é um dos quatro → o desenho do tipo; (2) sabe e não é → `tipo-desconhecido`, com o `content_type` cru de rótulo; (3) **não** sabe, porque o `content` não está no cache → nenhum ícone e "—". O caso (3) **não existe no S4 por construção** (o índice é feito de `contents`), então o "—" do S2 segue sendo o único do app. O que o S4 não faz é dizer "vazia": o chip dele responde *que tipo é*, não *está íntegro* — para isso existe o índice da setlist, que é onde o músico confere antes do show. Errata **E15.b** |

### Div. 82, por extenso — o décimo caso de "instrumento com escopo menor do que parece"

> **Material de `LOGS-OCTAVIA.md`.** O padrão vive na §9.1 do
> `V1-PR3-PRECHECK.md`; os nove primeiros estão lá, com os dois últimos
> (div. 71 e 80) escritos na V1-PR5.

| o instrumento mede | eu li como se medisse |
|---|---|
| `rotulo=` e `motivo=` como **prop de JSX** | todo texto de UI que o app põe nesses nomes |

O `gate:a20` varre nove posições de texto. Duas delas se chamam `rotulo` e
`motivo`, e as duas casam **`rotulo=`**, com igual — a forma de prop de JSX.
A V1-PR5 introduziu, no `IndexScreen`, exatamente os mesmos nomes na forma de
**chave de objeto**:

    const TIPO = { Lyrics: { icone: 'letra', rotulo: 'Letra' }, … }
    return { icone: 'sem-conteudo', rotulo: 'vazia', motivo: 'nada para mostrar — edite na versão web' }

Onze literais, todos em tela, nenhum lido. E o script já cobria uma posição de
chave de objeto — `titulo:` e `apoio:`, os placeholders do palco, com dois
pontos. A varredura sabia que a forma existia; só não a aplicou aos dois nomes
que ganharam a outra forma depois.

O que separa este caso do oitavo (div. 71, o `em20`) é o custo de descobri-lo:
lá o cabeçalho do script **documentava a própria cegueira** por escrito e
bastava ler; aqui era preciso comparar a lista de posições com o código que a
PR anterior tinha escrito. E o que o aproxima é o gatilho — os dois foram
achados pela **regra 1** ("o gate vem antes do que ele mede"), aplicada antes
de escrever tela. A regra 1 já pagou dois buracos em duas PRs consecutivas.

Fechado no commit 1: `titulo|apoio` vira `titulo|apoio|texto|rotulo|motivo`.
`texto:` entra junto porque é onde a régua de seção do S4 ia pôr a contagem no
commit 3 — o mesmo movimento, dessa vez preventivo. Literais examinados em
`src`: **51 → 67** (e → 72 com o S4). Acusações: **0** dos dois lados, o que era
esperado: os onze são pt-BR. O buraco não tinha deixado passar inglês — tinha
deixado de olhar.

Controle negativo: o 6º caso do `A20Falso.tsx` é `rotulo: 'Loading'` dentro de
um objeto, que a varredura antiga não via. **3 → 4** acusações, exit 1.

### Div. 83, por extenso — o lado para o qual um gate deve errar

> **Material de `LOGS-OCTAVIA.md`**, junto com a div. 82. Decisão do Marcel,
> 2026-09-13.

O G3 falhou num commit que não mudou uma linha de código executável. A causa é
trivial: o `g2g3.sh` coleta as linhas que casam com a cadeia `log(` por `grep`
direto no arquivo, **sem tirar comentários**, e eu tinha escrito num comentário
de documentação a frase "nenhuma linha de `log(` muda". A frase virou uma linha
nova na coleta do DEPOIS, e o `diff` acusou.

O `a20.mjs`, que é do mesmo conjunto, **tira** comentários antes de varrer — a
assimetria entre os dois é real e está medida. A pergunta, então, é por que não
alinhar o G3 ao A20.

**Porque os dois medem coisas de natureza oposta, e o erro que cada um pode
cometer não custa a mesma coisa.**

| gate | o que ele afirma | falso positivo | falso negativo |
|---|---|---|---|
| `gate:a20` | "não há literal de UI em inglês" | acusa um comentário e alguém **relaxa a regra** | inglês entra em produção |
| **G3** | "**nenhuma** linha de log mudou" | acusa uma frase e alguém **lê o diff** | um `log(` muda e o aceite do bloco inteiro mede outra coisa |

O A20 é um gate de **conteúdo**: ele precisa de precisão, porque a acusação
aponta um defeito específico que alguém vai corrigir, e acusação falsa em gate
de conteúdo gasta a paciência que mantém o gate ligado. Por isso ele tira
comentários.

O G3 é um gate de **invariância**: ele não aponta defeito, ele afirma que nada
mudou. Um gate de invariância que erra para o lado de **falar demais** manda o
autor olhar o diff — que é uma ação barata e sempre correta. Um que erra para o
lado de calar deixa passar exatamente a coisa que ele existia para impedir: uma
linha de log alterada faz o aceite do bloco inteiro medir outra coisa sem que
ninguém perceba, porque os aceites desta série são lidos **pelo logcat**.

É o mesmo raciocínio que a série já usou em outra direção no **G5** — "gate que
grita sem motivo é desligado na terceira vez" (div. 80) — e a diferença entre os
dois casos é o que vale registrar: lá o grito era **sistemático** (uma
referência pontual num sistema variável faz toda PR estourar sem ter feito nada
errado), e aqui é **eventual e autoexplicativo** (quem escreveu a frase é quem
recebe a acusação, no mesmo minuto, com o diff na mão). Grito sistemático
desliga o gate; grito eventual custa trinta segundos.

Decisão: **nada mudado no `g2g3.sh`**. O comentário foi reescrito sem a cadeia,
e a razão ficou escrita no próprio comentário, para que o próximo que tropeçar
não gaste a descoberta de novo.

## Decisões do Marcel sobre a entrega (2026-09-13)

As sete perguntas, respondidas:

1. **Manter 64 e Raleway** na barra superior do S5. "S3 e S5 se atravessam
   deslizando; abrir 24 dp e trocar de família entre elas é o salto que a nota
   da moldura quer evitar. As duas juntas é PR pós-V1." Errata **E14.e**.
2. **Sem uppercase** no título do S4b. "A string carrega o termo digitado, e o
   `textTransform` do Android transforma o texto de verdade — aparecer maiúsculo
   no dump é o sintoma." Errata **E14.d**.
3. **20 dp** no `falha` do S0. "É o que a moldura desenha e o que a §5.5 dá a
   'ícone dentro de texto'; a §6.4 nomeia o S1e, não o S0." Errata **E14.c**.
4. **Manter o acento** nas marcas do S5. "A terceira razão é a que decide: a
   moldura ARGUMENTA a escolha, ao contrário da S1b da E12, cuja legenda dizia
   só 'mesma cor de antes'." Confirma no tablet pelo **AV-6**.
5. **Critério confirmado, e SEM o `sem-conteudo` no S4.** "O chip do S4 responde
   QUE TIPO É; quem responde SE ESTÁ ÍNTEGRO é o índice, que é onde se confere
   antes do show. Acrescentar lá duplicaria o sinal no lugar errado." Fecha a
   div. 74 da V1-PR5 com um critério, não com um caso — e o terceiro caso não
   existir no S4 **por construção** é o que o torna verificável.
6. **Aceitos os dois gates estendidos** (div. 81 e 82). "Aditivos, nenhuma regra
   existente muda de resultado, e os controles negativos cresceram junto
   (17→18, 3→4)."
7. **A div. 82 (décimo caso) e a div. 83 vão para o `LOGS-OCTAVIA.md`**, como a
   V1-PR5 fez com as 71, 75 e 80.

Mais duas coisas que o Marcel mandou registrar além da tabela, e que estão
escritas por extenso:

- **a distinção que faltava no G5** — o G3 erra para o lado de falar demais, e
  num gate de INVARIÂNCIA esse é o lado certo. A razão, e não só a decisão,
  está na seção "Div. 83, por extenso" acima;
- **a prova 0 do avião** — o AVD foi encontrado com `airplane_mode_on = 0` e a
  rede viva, que é exatamente o cenário que custou duas requests no
  `V1-PR3-PRECHECK.md` §9. Desta vez a prova pegou **antes** de o app abrir. A
  linha está no anexo C2, com a citação da causa registrada lá.

## sha256 dos anexos de texto

| Arquivo | linhas | sha256 |
|---|---|---|
| `V1-PR6-A-estados-antes-depois.txt` | 448 | `32bd4c4192482eb1861853135ebc165edec0daed08b64e3bbe5f37261f22f313` |
| `V1-PR6-B-gates.txt` | 323 | `711212507b973e634e284a96e30d7fad6215c579bd966aa5e5970a726d6b980e` |
| `V1-PR6-C-aparato-e-prod.txt` | 160 | `f9cd60c2f590ec3f74680894466805fa6a5f65767142cd6e3ce1c77e3d4d22fe` |
| `V1-PR6-D-moldura-para-token.txt` | 191 | `1f61d8d3bc8659f5bb4a28dfef5b17df4844632ae2746b38903983d8712b7d0f` |
| `dumps-antes/SHA256SUMS.txt` | 16 | `47fb3aa8391a524651f839b666d9e7b482405e70e1c3087d8b39815479bfa33a` |
| `dumps-depois/SHA256SUMS.txt` | 20 | `1d12452aff96bcfcd865d907c99f95e72a8217c66ec82c5303ab87d98b247cdd` |

/**
 * O CONJUNTO FECHADO de frases da tela 2 (T2-R15 ∪ as fixas do desenho).
 *
 * É o padrão do `fraseDaFalha()` da W2 (`LOGS-OCTAVIA.md`, errata W2) levado
 * adiante: **o que fecha o conjunto é a omissão** — quem não tem frase
 * declarada cai na genérica. A diferença para lá é o alcance. Na W2 o
 * conjunto cobria só a falha de download; aqui cobre também o que NÃO é
 * falha — progresso, aviso e validação — porque o desenho do N2 está
 * CONGELADO e fixou a redação de cada um. Uma tela que escrevesse a sua
 * própria frase quebraria a folha sem que nada acusasse.
 *
 * **Duas fontes, e as duas mandam:**
 *  - `PRD-TELA-2.md` T2-R15 — as onze frases chaveadas pelo `code` do
 *    envelope, **nunca** pelo campo `error` (que é inglês e dado de UI);
 *  - `DESIGN-N2/telas.html` — as fixas das molduras, verbatim do congelado.
 *
 * **O que NUNCA entra numa frase** (T2-R15): nome de setlist, título de
 * música, uuid. A tela já mostra o nome onde precisa; o detalhe vai só para o
 * log (T2-R16). O único buraco de interpolação do conjunto inteiro é o `{N}`
 * do prazo do limite de taxa, e o teste afirma que é só ele.
 *
 * **Div. 225, medida nesta PR.** A N2-D31 mandou a frase de limite sem número
 * "até saber que o servidor manda um". O servidor manda: `lib/user-rate-limit.ts:134`
 * põe o header `Retry-After` e `lib/api-errors.ts:57` põe `retryAfter` no
 * corpo, nos DOIS caminhos que as seis rotas usam (o middleware da cadeia B,
 * `api-validation-middleware.ts:123`, e o `enforceUserLimit` da cadeia A,
 * `user-rate-limit.ts:146`) — os dois pelo mesmo `rateLimited()`. Então a
 * linha do T2-R15 fica como está, **com** o `N`, e é ela que vale.
 *
 * A frase sem número **não sai do conjunto**: ela é o ramo do 429 que chega
 * SEM prazo nenhum — a cláusula não-JSON do `CONTRATO-DE-ERRO.md` (um 429 de
 * borda, sem envelope e sem header) existe, e a moldura `N2-X-limite` é
 * exatamente o que se lê nesse caso. Duas frases, dois ramos, nenhuma
 * inventada.
 */

/** Toda chave do conjunto. Acrescentar uma é errata declarada. */
export type ChaveDeFrase =
  // --- T2-R15: o que o servidor diz, traduzido pelo `code` -----------------
  | 'rede'
  | 'auth'
  | 'limite-com-prazo'
  | 'limite-sem-prazo'
  | 'sumiu-setlist'
  | 'sumiu-musica'
  | 'ordem-mudou'
  | 'nome-recusado'
  | 'dados-recusados'
  | 'servidor'
  | 'generica'
  // --- as fixas do desenho congelado ---------------------------------------
  /** As TRÊS validações do cliente, e só três (N2-D21, moldura N2-F-validacao). */
  | 'nome-vazio'
  | 'data-impossivel'
  | 'nada-mudou'
  /** Progresso: o ato em curso, no presente. Nada diz "salvo" (regra 1 da folha). */
  | 'criando'
  | 'salvando'
  | 'salvando-ordem'
  | 'apagando'
  | 'adicionando'
  | 'relendo'
  /** N2-D22: nunca "salvo" limpo, nunca "falhou" — a linha de aviso de 48 dp. */
  | 'salvo-nao-relido-s1'
  | 'salvo-nao-relido-s2'
  | 'salvo-nao-relido-picker'
  /** O 404 declarado (R1·4): a tela é abandonada, e sem botão. */
  | 'sumiu-declarado'
  | 'sem-rede-s1'
  | 'sem-rede-s2'
  | 'teto-100'
  /** N2-D18: só em criar e adicionar, os dois casos em que pode ter passado. */
  | 'pode-ter-gravado'
  /**
   * **ERRATA DA N2-PR3 — quatro chaves novas, e a razão de cada uma.**
   *
   * Acrescentar chave é errata declarada (o cabeçalho deste arquivo). As
   * quatro são da FOLHA, e as quatro estão verbatim no congelado — nenhuma é
   * redação nova.
   *
   * A que obriga a errata é a primeira. A moldura `N2-X-falhou` (a linha de
   * aviso de 48 dp, §7) e a moldura `N2-F-falhou` (a folha, §2) dizem coisas
   * DIFERENTES para o mesmo "pode ter gravado": a linha diz *"pode já ter
   * sido gravada — confira antes de repetir"* (que é o `pode-ter-gravado`
   * acima, já no conjunto desde a N2-PR2) e a folha diz *"Pode já ter sido
   * gravada — confira **a lista** antes de tentar de novo. **A lista atrás
   * desta folha acabou de ser relida.**"* — uma oração a mais, que só faz
   * sentido onde há uma folha com uma lista atrás. São duas frases, dois
   * lugares; ler uma no lugar da outra quebraria o congelado sem que nada
   * acusasse, que é o que este conjunto existe para impedir.
   */
  | 'pode-ter-gravado-folha'
  /** O título do bloco de falha da folha de criar (`N2-F-falhou`). */
  | 'falhou-criar'
  /** O motivo do `Tentar de novo` inativo enquanto a lista é relida (R1·1). */
  | 'relendo-a-lista'
  /** O apoio do estado vazio de S1 depois que o ato nasceu aqui (`N2-S1f-criar`). */
  | 'primeira-setlist'
  /**
   * **ERRATA DA N2-PR4 — quatro chaves novas, e a razão de cada uma.**
   *
   * As quatro são de S2 com edição e as quatro estão verbatim no congelado;
   * nenhuma é redação nova, como na N2-E1.
   *
   * `falhou-salvar` é o título da moldura `N2-X-falhou` (§7) — *"Não foi
   * possível salvar"*. Ele é para S2 o que o `falhou-criar` é para a folha de
   * criar, e são frases DIFERENTES pela mesma razão que a N2-E1 separou as
   * duas metades do "pode ter gravado": criar e salvar não são o mesmo ato, e
   * ler uma no lugar da outra quebraria o congelado sem que nada acusasse.
   *
   * `lista-relida` é a terceira oração da mesma moldura — *"a frase à
   * esquerda dele diz que o que está na tela já é o estado real"*. Ela só
   * aparece DEPOIS da releitura da regra 3, e é o que torna o `Tentar de
   * novo` ao lado uma oferta honesta.
   *
   * `removendo` é o estado da linha enquanto a remoção voa (§3: *"linha em
   * removendo…"*). Irmã de `adicionando` e `relendo`, que já estão aqui.
   *
   * `apagar-arquivos` é a terceira das quatro coisas obrigatórias do diálogo
   * da regra 5 (§6). As outras três são o nome, a contagem e os dois botões:
   * o nome e a contagem são DADO (ver `perguntaDeApagar`) e os rótulos dos
   * botões são rótulo de controle, como `Criar` e `Cancelar`.
   */
  | 'falhou-salvar'
  | 'lista-relida'
  | 'removendo'
  | 'apagar-arquivos'
  /**
   * **ERRATA DA N2-PR5 — quatro chaves novas, zero redação nova.**
   *
   * As quatro são do modo de reordenar e as quatro estão verbatim nas
   * molduras `N2-S2e-reordenar` e `N2-S2e-ordem-falhou` (§3), pela mesma
   * razão da N2-E1 e da N2-E7.
   *
   * `reordenar-apoio` é a segunda linha da barra do modo — o gesto explicado
   * em texto, porque a alça não tem rótulo. `ordem-arrastada` é a mesma linha
   * depois de uma falha (R2·1): *"esta é a sua ordem, a do servidor é
   * outra"*. `falhou-ordem` é o título do aviso do modo, que é para o
   * reordenar o que `falhou-salvar` é para S2 — e são frases DIFERENTES
   * porque a moldura as escreve diferentes. `ordem-relida` é a terceira
   * oração do mesmo aviso, e como a `lista-relida` só aparece DEPOIS da
   * releitura da regra 3.
   *
   * **Nenhuma frase nova para "nada mudou"** (N2-D36): `Salvar a ordem` com
   * a ordem inalterada fecha o modo sem request, e a N2-D21 continua com as
   * três validações de sempre.
   */
  | 'reordenar-apoio'
  | 'ordem-arrastada'
  | 'falhou-ordem'
  | 'ordem-relida'
  /**
   * **ERRATA DA N2-PR6 (N2-E16) — duas chaves novas, zero redação nova.**
   *
   * As duas são do picker e estão verbatim nas molduras `N2-P-resultados` e
   * `N2-P-relendo` (§5), pela mesma razão da N2-E1, da N2-E7 e da N2-E10.
   *
   * `falhou-adicionar` é o título da linha que falhou — *"não entrou na
   * setlist"* —, que é para o picker o que `falhou-salvar` é para S2. Ele
   * **não** aparece quando a falha é de rede em `add`: aí a escrita pode ter
   * passado (N2-D18), e o título seria mentira; no lugar dele vai o
   * `pode-ter-gravado`, que já está no conjunto (div. 308).
   *
   * `adicionada` é o estado da linha depois do 201 (*"Adicionada aparece com
   * o 201 e perde o contorno de botão"*). Minúscula como as irmãs
   * `adicionando` e `relendo`, que já estão aqui: a moldura as escreve com
   * inicial maiúscula dentro da linha, e isso é ESTILO (`textTransform`), não
   * outra redação — as três ficam uma frase cada (div. 310).
   *
   * As redações do picker que carregam DADO — o nome da setlist, uma
   * contagem — são função, abaixo, pela razão do `perguntaDeApagar`.
   */
  | 'falhou-adicionar'
  | 'adicionada'
  /**
   * **ERRATA DA N2-PR7 (N2-E19, decisão do Marcel sobre a div. 308) — UMA
   * chave nova, e a razão dela.**
   *
   * A espécie `rede` juntava duas coisas que o músico precisa ler diferente:
   * a request que **nem saiu** (barrada por offline — `write blocked
   * reason=offline`) e a que **saiu e não voltou** (o prazo da N2-D35, o
   * socket cortado). Para a primeira, *"sem conexão — nada foi salvo"* é
   * verdade. Para a segunda é afirmação que o app não tem como fazer — a
   * N2-D18 existe justamente porque o `POST` pode ter passado — e, ao lado
   * do `pode-ter-gravado`, as duas frases se contradiziam na mesma linha
   * (div. 308, Tab S6, dump `07` da N2-PR6).
   *
   * `rede` fica com a frase de sempre e passa a valer **só** para o barrado
   * offline; `sem-resposta` é a da request que saiu. A segunda linha *"pode
   * já ter sido gravada…"* acompanha só esta, e só em criar e adicionar.
   */
  | 'sem-resposta'
  /**
   * **ERRATA DA N2-PR7 (N2-E21, decisão do Marcel) — o 404 com a releitura
   * falha.** O congelado não previa o caso: o 404 é conhecimento (o servidor
   * disse que a setlist não existe) e o T2-R10 manda sair para S1, mas a
   * frase do 404 (`sumiu-declarado`) afirma *"a lista abaixo é a que o
   * servidor tem agora"* — e não há lista relida nenhuma.
   *
   * São as duas PRIMEIRAS orações das frases de origem, cortadas na
   * fronteira da oração, e zero palavra nova: *"Essa setlist não existe
   * mais."* (de `sumiu-declarado`) e *"Não foi possível recarregar a
   * lista."* (de `salvo-nao-relido-s1`). A segunda oração de
   * `salvo-nao-relido-s1` afirmaria o contrário do caso: *"ela pode não
   * aparecer abaixo ainda"* é de uma setlist CRIADA, e aqui a apagada pode
   * CONTINUAR aparecendo até o recarregar — o que as duas orações dizem.
   */
  | 'sumiu-nao-relido'

export const FRASES: Readonly<Record<ChaveDeFrase, string>> = {
  // T2-R15 (`PRD-TELA-2.md`)
  rede: 'sem conexão — nada foi salvo',
  // N2-E19: a request saiu e não voltou — o texto é do Marcel (div. 308).
  'sem-resposta': 'sem resposta do servidor',
  auth: 'não foi possível salvar — confira sua conta no site',
  'limite-com-prazo': 'muitas alterações seguidas — tente de novo em {N} s',
  'limite-sem-prazo': 'Muitas mudanças em pouco tempo. Os controles de escrita voltam em instantes.',
  'sumiu-setlist': 'esta setlist foi apagada em outro lugar',
  'sumiu-musica': 'esta música já não estava na setlist',
  'ordem-mudou': 'a setlist mudou — a ordem foi recarregada',
  'nome-recusado': 'o nome tem um trecho que o servidor não aceita',
  'dados-recusados': 'o servidor recusou os dados',
  servidor: 'falha no servidor — nada foi alterado aqui',
  generica: 'não foi possível salvar',

  // DESIGN-N2/telas.html, verbatim das molduras
  'nome-vazio': 'a setlist precisa de um nome',
  'data-impossivel': 'essa data não existe',
  'nada-mudou': 'nada mudou desde que você abriu',
  criando: 'Criando no servidor…',
  salvando: 'Salvando no servidor…',
  'salvando-ordem': 'Salvando a ordem no servidor…',
  apagando: 'Apagando no servidor…',
  adicionando: 'adicionando…',
  relendo: 'relendo…',
  /**
   * Div. 227 — a única frase da folha que o core guarda PELA METADE. A
   * moldura `N2-S1-salvo-nao-relido` diz "Season 4 foi criada. Não foi
   * possível recarregar a lista, então ela pode não aparecer abaixo ainda." e
   * NOMEIA a setlist de propósito ("em S1 o objeto da frase não está em
   * lugar nenhum da tela"). Nome de setlist é dado, não texto: ele não pode
   * morar numa constante do core, e um buraco `{nome}` faria o conjunto
   * deixar de ser verificável por comparação literal. Fica aqui a metade
   * FIXA — a segunda oração, verbatim —, e quem monta `<nome> foi criada. `
   * na frente é S1. A regra do T2-R15 continua de pé: isto não é frase de
   * erro, e nenhuma frase de ERRO do conjunto carrega nome.
   */
  'salvo-nao-relido-s1': 'Não foi possível recarregar a lista, então ela pode não aparecer abaixo ainda.',
  'salvo-nao-relido-s2':
    'Salvo. Não foi possível recarregar a setlist, então o que está na tela pode estar velho.',
  'salvo-nao-relido-picker':
    'Salvo. Não foi possível recarregar a setlist, então a contagem abaixo pode estar velha.',
  'sumiu-declarado': 'Essa setlist não existe mais. A lista abaixo é a que o servidor tem agora.',
  // N2-E21: as duas primeiras orações de `sumiu-declarado` e de `salvo-nao-relido-s1`.
  'sumiu-nao-relido': 'Essa setlist não existe mais. Não foi possível recarregar a lista.',
  'sem-rede-s1':
    'Sem conexão: dá para abrir e tocar o que está no aparelho, não para criar setlist. O controle volta com a rede.',
  'sem-rede-s2':
    'Sem conexão: dá para ler e tocar, não para mudar a setlist. Os controles de escrita voltam quando a rede voltar.',
  'teto-100': 'Acima de 100 músicas, reordenar por arrasto fica inativo. Adicionar e remover continuam.',
  'pode-ter-gravado': 'pode já ter sido gravada — confira antes de repetir',

  // As quatro da N2-PR3, verbatim das molduras `N2-F-falhou` e `N2-S1f-criar`.
  'pode-ter-gravado-folha':
    'Pode já ter sido gravada — confira a lista antes de tentar de novo. A lista atrás desta folha acabou de ser relida.',
  'falhou-criar': 'Não foi possível criar',
  'relendo-a-lista': 'relendo a lista…',
  'primeira-setlist': 'Nenhuma setlist por aqui ainda. A primeira pode nascer neste aparelho.',

  // As quatro da N2-PR4, verbatim das molduras `N2-X-falhou`, `N2-S2e` e `N2-D-apagar`.
  'falhou-salvar': 'Não foi possível salvar',
  'lista-relida': 'a lista abaixo é a que o servidor acabou de devolver',
  removendo: 'removendo…',
  'apagar-arquivos':
    'As músicas continuam na biblioteca, e os arquivos já baixados continuam neste aparelho. Só a setlist deixa de existir.',

  // As quatro da N2-PR5, verbatim das molduras `N2-S2e-reordenar` e `N2-S2e-ordem-falhou`.
  'reordenar-apoio': 'arraste pela alça · a ordem só é salva no fim',
  'ordem-arrastada': 'a ordem abaixo é a que você arrastou · a do servidor é outra',
  'falhou-ordem': 'Não foi possível salvar a ordem',
  'ordem-relida': 'a setlist foi relida; a ordem dela não foi aplicada aqui',

  // As duas da N2-PR6, verbatim das molduras `N2-P-resultados` e `N2-P-relendo`.
  'falhou-adicionar': 'não entrou na setlist',
  adicionada: 'adicionada',
}

/**
 * A pergunta do diálogo de apagar (`N2-D-apagar`, §6): *"Apagar Season 3, com
 * 7 músicas?"*.
 *
 * **Por que é função e não constante** — div. 227, a mesma razão do
 * `salvo-nao-relido-s1`, com um agravante. Nome de setlist e contagem são
 * **dado**, não texto: não podem morar numa constante, e um buraco `{nome}`
 * faria o conjunto deixar de ser verificável por comparação literal. Lá a
 * metade fixa coube numa constante porque o nome vinha na frente; aqui ele
 * cai no MEIO da frase, e partir a redação em três pedaços espalharia pela
 * tela justamente o que este módulo existe para guardar.
 *
 * A regra do T2-R15 continua de pé: **nenhuma frase de ERRO carrega nome**.
 * Esta não é frase de erro — é a pergunta de um diálogo cujo objeto é a
 * setlist, e o congelado a escreve com o nome de propósito ("os quatro itens
 * da regra estão lá e nessa ordem: o nome, a contagem, a frase dos arquivos
 * baixados, dois botões").
 *
 * O `gate:a20` lê este literal desde a N2-PR4 (a posição `EXTRAS: literal de
 * template`): a redação está dentro do alcance do gate, e não ao lado dele.
 */
export function perguntaDeApagar(nome: string, musicas: number): string {
  return `Apagar ${nome}, com ${musicas} ${musicas === 1 ? 'música' : 'músicas'}?`
}

/**
 * **N2-PR5 — as quatro redações do modo de reordenar que carregam DADO.**
 *
 * A mesma razão do `perguntaDeApagar` (div. 227): número de posição e nome de
 * setlist não moram numa constante, e um buraco `{n}` faria o conjunto deixar
 * de ser verificável por comparação literal. A redação fica AQUI, dentro do
 * alcance do `gate:a20` (a posição `EXTRAS: literal de template`), e não
 * espalhada pela tela.
 *
 * As posições são as que o músico vê — a partir de 1.
 */
/** A barra do modo: *"Reordenar · Season 3"* (`N2-S2e-reordenar`). */
export function tituloDoReordenar(nome: string): string {
  return `Reordenar · ${nome}`
}

/** O rótulo da linha erguida enquanto arrasta: *"de 5 para 2"*. */
export function deParaPosicao(de: number, para: number): string {
  return `de ${de} para ${para}`
}

/** O buraco tracejado onde a linha vai cair: *"soltar aqui · posição 2"*. */
export function soltarAquiPosicao(posicao: number): string {
  return `soltar aqui · posição ${posicao}`
}

/** A linha arrastada, depois de uma falha (R2·1): *"movida de 5"*. */
export function movidaDe(posicao: number): string {
  return `movida de ${posicao}`
}

/**
 * **N2-PR6 — as redações do picker que carregam DADO** (§5, molduras
 * `N2-P-vazio`, `N2-P-resultados` e `N2-P-relendo`). A razão é a do
 * `perguntaDeApagar` (div. 227): nome de setlist e contagem não moram numa
 * constante, e a redação fica aqui, ao alcance do `gate:a20`.
 */

/**
 * R1·5 (N2-E15) — *"truncado por ellipsis acima de 34 caracteres de nome"*.
 * A reticência é do TEXTO, e não do componente: o placeholder de um campo não
 * tem `numberOfLines`, e o que se mede no CN e no dump é a string. Conta
 * pontos de código (`[...nome]`), não unidades UTF-16: um nome com acento
 * composto ou emoji não pode ser partido ao meio.
 */
export const TETO_DO_NOME_NO_PICKER = 34

function nomeCurto(nome: string): string {
  const letras = [...nome]
  return letras.length > TETO_DO_NOME_NO_PICKER ? `${letras.slice(0, TETO_DO_NOME_NO_PICKER).join('')}…` : nome
}

/** O placeholder do campo: *"Adicionar a Season 3"*. */
export function placeholderDoPicker(nome: string): string {
  return `Adicionar a ${nomeCurto(nome)}`
}

/**
 * O corpo vazio: *"Digite para achar na biblioteca e adicionar a **Season
 * 3**."* O nome vai em destaque na moldura, então a frase sai em três
 * pedaços, e a tela só escolhe o peso do do meio.
 */
export function vazioDoPicker(nome: string): { antes: string; nome: string; depois: string } {
  return { antes: 'Digite para achar na biblioteca e adicionar a ', nome, depois: '.' }
}

/** A segunda linha do vazio: *"63 músicas disponíveis."* — a biblioteca inteira. */
export function musicasDisponiveis(n: number): string {
  return n === 1 ? '1 música disponível.' : `${n} músicas disponíveis.`
}

/** *"7 músicas"* — o total do rodapé e o da régua da biblioteca. */
export function nMusicas(n: number): string {
  return `${n} ${n === 1 ? 'música' : 'músicas'}`
}

/** A régua do grupo de cima: *"Nesta setlist · Season 3"* (a do S4). */
export function reguaNestaSetlist(nome: string): string {
  return `Nesta setlist · ${nome}`
}

/** A régua do grupo de baixo: *"Biblioteca · 63 músicas"* (a do S4). */
export function reguaBiblioteca(n: number): string {
  return `Biblioteca · ${nMusicas(n)}`
}

/**
 * A marca da linha (N2-D15): *"já na setlist"* e, com bis, *"já na setlist ·
 * 2×"*. `vezes` é quantas POSIÇÕES da setlist relida apontam para a música.
 */
export function jaNaSetlist(vezes: number): string {
  return vezes > 1 ? `já na setlist · ${vezes}×` : 'já na setlist'
}

/**
 * A terceira parte do rodapé (N2-D30): *"nada adicionado nesta visita"* ·
 * *"1 adicionada nesta visita"* · *"2 adicionadas nesta visita"*. O `k` é
 * LOCAL — conta 201 confirmados desde que o picker abriu.
 */
export function adicionadasNestaVisita(k: number): string {
  if (k === 0) return 'nada adicionado nesta visita'
  return `${k} ${k === 1 ? 'adicionada' : 'adicionadas'} nesta visita`
}

/** O conjunto, como conjunto — é contra ele que o teste afirma o fechamento. */
export const CHAVES: ReadonlySet<ChaveDeFrase> = new Set(Object.keys(FRASES) as ChaveDeFrase[])

/**
 * O texto de uma chave, com o prazo substituído quando a frase o pede.
 *
 * Lança quando falta o número: uma frase de limite de taxa com um `{N}` cru
 * na tela seria pior do que a frase sem número, e o ramo sem número já tem
 * chave própria (`limite-sem-prazo`). Quem não sabe o prazo usa a outra.
 */
export function frase(chave: ChaveDeFrase, segundos?: number): string {
  const texto = FRASES[chave]
  if (!texto.includes('{N}')) return texto
  if (segundos === undefined) {
    throw new Error(`frase: "${chave}" pede o prazo em segundos`)
  }
  return texto.replace('{N}', String(segundos))
}

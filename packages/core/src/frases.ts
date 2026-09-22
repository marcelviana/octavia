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

export const FRASES: Readonly<Record<ChaveDeFrase, string>> = {
  // T2-R15 (`PRD-TELA-2.md`)
  rede: 'sem conexão — nada foi salvo',
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

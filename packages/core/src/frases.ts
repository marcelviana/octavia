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

/**
 * A orquestração da escrita de setlist — **sem uma linha de tela** (N2-PR2).
 *
 * Fino, como o `sync.ts`: quem DECIDE é o core (`pedido*`, `classificar`,
 * `validarCriacao`, `validarAtualizacao`, `reconcileByUpdatedAt`); aqui só se
 * barra, se envia, se relê, se grava e se loga. Nenhuma regra nova mora neste
 * arquivo — se uma aparecer, ela pertence ao core.
 *
 * As telas (PRs 3–7) usam **só** o que este módulo expõe, e nenhuma delas
 * chama `api.ts` nem `store.ts` direto: é o que faz valer o "nenhuma escrita
 * altera o cache diretamente" do T2-R9.
 *
 * ## A sequência de toda escrita
 *
 *   1. **barrar** (T2-R11/R12/R14) — offline, limite de taxa aberto ou outra
 *      escrita em voo: `write blocked`, zero request, e acabou;
 *   2. **enviar** — um request, sem retry (`mutate`);
 *   3. **logar** `write op=…` — sempre, 2xx ou não (T2-R16);
 *   4. **reler** — depois de todo 2xx (T2-R9/N2-D13) **e** de todo 404
 *      (T2-R10), e só aí o cache muda;
 *   5. **classificar** com o resultado da releitura, porque é ela que separa
 *      `ok` de `ok-nao-relido` (N2-D22).
 *
 * ## O que este módulo NÃO faz
 *
 * **Não repete nada, nunca** (N2-D18). Nem automaticamente, nem enfileirando
 * (N2-D2: não há fila offline). "Tentar de novo" é um gesto do músico, depois
 * de uma releitura que mostrou o estado real, e quem o oferece é a tela.
 *
 * **Não dispara o prefetch.** Medido nesta PR: `sincronizar()` nunca chamou
 * `prefetchEArrumar` — quem o chama é o `App.tsx:159`, depois do sync. A
 * releitura daqui não passa pelo `planSync` (que pede as páginas de content,
 * e a N2-D13 não as busca), então o T2-R17 **não acontece por construção**:
 * ele é o `aposReler` abaixo, que a PR da tela liga ao `prefetchEArrumar`.
 * Ver a div. 228.
 */
import {
  classificar,
  pedidoAtualizar,
  pedidoCriar,
  rateLimitGate,
  reconcileByUpdatedAt,
  validarAtualizacao,
  validarCriacao,
  type CamposSetlist,
  type ContentDTO,
  type MotivoInvalido,
  type Op,
  type Pedido,
  type Resultado,
  type SetlistDTO,
} from '@octavia/core'
import { getSetlists, mutate, type RespostaDeEscrita } from './api'
import { log } from './log'
import { estaOnline } from './net'
import { saveSetlists } from './store'

export {
  pedidoAdicionar,
  pedidoApagar,
  pedidoAtualizar,
  pedidoCriar,
  pedidoRemover,
  pedidoReordenar,
  type Pedido,
  type Resultado,
} from '@octavia/core'

/** A família é **compartilhada pelas seis rotas** (`lib/user-rate-limit.ts:52`). */
const FAMILIA = 'setlist-mutate'

/** O cache de onde toda escrita parte, e ao qual a releitura volta. */
export interface EstadoLocal {
  uid: string
  setlists: SetlistDTO[]
  content: ContentDTO[]
  syncedAtMs: number | null
}

export interface Saida {
  resultado: Resultado
  /**
   * O conjunto novo que ESTA escrita trouxe, ou `null` — porque a releitura
   * falhou (e aí `resultado.especie` é `ok-nao-relido`) ou porque uma
   * releitura mais nova já entregou um conjunto melhor (div. 232; aí a
   * espécie é `ok`, e o conjunto chega pelo `aoRelerSetlists`).
   */
  setlists: SetlistDTO[] | null
  syncedAtMs: number | null
}

/**
 * Por que o motivo de "barrado" é um conjunto fechado e por que ele tem
 * CINCO valores e não quatro: o T2-R16 declarou
 * `offline|ratelimit|ceiling|busy`, e a N2-PR2 acrescenta `nada-mudou` —
 * o toque num "Salvar" inativo porque o formulário abriu e nada mudou
 * (T2-R3 (iii)). Sem a linha, esse caso seria indistinguível no log de um
 * toque que não aconteceu, e é justamente o que o A-N2-24 mede. Errata no
 * `LOGS-OCTAVIA.md`, na mesma PR.
 */
export type MotivoBarrado = 'offline' | 'ratelimit' | 'ceiling' | 'busy' | 'nada-mudou'

/**
 * Estado de MÓDULO, e de propósito: o limite de taxa é por uid no servidor e
 * a família é compartilhada, então um 429 numa adição tem de fechar o botão
 * de criar também (T2-R14). Guardá-lo numa tela faria cada tela ter o seu.
 */
let gate = rateLimitGate()
let emVoo = false

/**
 * **A ordem entre releituras — div. 232, a segunda metade.**
 *
 * Com a trava cobrindo só o request (ver o `finally` do `escrever`), duas
 * releituras podem estar em voo ao mesmo tempo, e **a ordem de chegada não é
 * a de emissão**: a resposta que demora 600 ms carrega a foto de 600 ms
 * atrás. Sem ordem, a releitura EMITIDA primeiro chega por último e
 * sobrescreve o cache com o estado mais VELHO — medido, e é o que o terceiro
 * CN reprova.
 *
 * `geracao` é a ordem de EMISSÃO; `ultimaAplicada`, a da última que gravou.
 * Um 200 só se aplica se nenhuma releitura mais nova já tiver gravado. Não
 * muda quantas requests voam nem o que cada uma diz: só impede que uma foto
 * velha vença uma nova. É o mesmo raciocínio do `reconcileByUpdatedAt` — o
 * que vale é o que o servidor disse por último.
 *
 * **Como um descarte aparece no log**, sem campo novo: a releitura descartada
 * emite a sua linha `resync … status=200` (ela LEU, e isso é verdade) e
 * **não** emite `cache write kind=setlists` (ela não gravou). Duas linhas
 * `resync` e uma `cache write` é a assinatura de um descarte, e as duas
 * linhas já estão no catálogo.
 */
let geracao = 0
let ultimaAplicada = 0

/**
 * Instrumento de teste: troca o gate por um NOVO e solta o "em voo". Nenhuma
 * UI chama.
 *
 * **Troca, e não `block(FAMILIA, 0)`** — que foi a primeira forma disto e
 * era um no-op: o `block` do core "nunca encurta uma janela já aberta"
 * (`rate-limit.ts:66-69`), por desenho, para que uma resposta com prazo menor
 * não reabra a porta antes da hora. Um reset escrito por cima dessa garantia
 * não reseta nada, e o preço foi medido na primeira corrida dos CNs: a janela
 * de 30 s do teste do 429 vazou para os dois testes seguintes, que reprovaram
 * por um motivo que não era o deles. Um instrumento que não limpa é um
 * instrumento quebrado.
 */
export function limparGatesDeEscrita(): void {
  gate = rateLimitGate()
  emVoo = false
  geracao = 0
  ultimaAplicada = 0
}

function barrar(op: Op, motivo: MotivoBarrado): void {
  log(`write blocked op=${op} reason=${motivo}`)
}

/**
 * O que a tela mostra quando a escrita nem sai. É a espécie `rede` com a
 * frase certa: a operação não aconteceu, e nenhuma delas é "erro do
 * servidor". O `offline` tem frase própria na folha; o `ratelimit` reusa a do
 * 429 sem prazo, porque o prazo que resta é estado do gate e não da resposta.
 */
function resultadoBarrado(op: Op, motivo: MotivoBarrado): Resultado {
  const resposta =
    motivo === 'ratelimit'
      ? { status: 429, bodyText: JSON.stringify({ error: 'Rate limit exceeded', code: 'RATE_LIMITED' }) }
      : { networkError: `barrado: ${motivo}` }
  return classificar(op, resposta, null)
}

// ------------------------------------------------------------- preparação

export type Preparo =
  | { enviar: true; pedido: Pedido }
  | { enviar: false; motivo: MotivoInvalido }

/**
 * T2-R1/T2-R3 — o formulário de criar. Nome vazio e data impossível **não**
 * geram linha de log: o botão nasce inativo com o motivo escrito ao lado
 * (N2-D23), e um toque nele não é um toque num controle de escrita.
 */
export function prepararCriacao(entrada: CamposSetlist): Preparo {
  const v = validarCriacao(entrada)
  if (!v.ok) return { enviar: false, motivo: v.motivo }
  return { enviar: true, pedido: pedidoCriar(v.campos) }
}

/**
 * T2-R4/T2-R3 (iii) — o formulário de editar, e o caso que o A-N2-24 mede:
 * abrir e sair sem mudar nada **não** gera `PUT` e **não** gera linha
 * `write op=`. Gera a linha `write blocked … reason=nada-mudou`, porque aqui
 * houve um toque no "Salvar" e o motivo é do estado, não do campo.
 */
export function prepararEdicao(
  setlistId: string,
  noServidor: CamposSetlist,
  editado: CamposSetlist,
): Preparo {
  const v = validarAtualizacao(noServidor, editado)
  if (!v.ok) {
    if (v.motivo === 'nada-mudou') barrar('update', 'nada-mudou')
    return { enviar: false, motivo: v.motivo }
  }
  return { enviar: true, pedido: pedidoAtualizar(setlistId, v.campos) }
}

// -------------------------------------------------------------- releitura

/** Por que a releitura aconteceu — a chave do log (T2-R16). */
export type MotivoDaReleitura = 'write' | '404' | 'order' | 'reopen'

export interface Releitura {
  /**
   * O conjunto novo, ou `null` — e `null` tem DOIS significados, que o `leu`
   * separa: a leitura falhou (N2-D22), ou ela voltou 200 e uma releitura
   * mais nova já tinha gravado (div. 232).
   */
  setlists: SetlistDTO[] | null
  syncedAtMs: number | null
  /**
   * `true` quando o `GET` voltou 200, **inclusive** quando o resultado foi
   * descartado por uma releitura mais nova. Sem esta distinção, o descarte
   * viraria "salvo; não foi possível recarregar" na tela — uma mentira
   * exatamente ao contrário: tudo funcionou, e foi a versão MAIS NOVA que
   * venceu.
   */
  leu: boolean
}

/**
 * Chamado depois de toda releitura que voltou 200, com o conjunto NOVO.
 *
 * É o gancho do **T2-R17**: criar ou datar para os próximos 7 dias tem de
 * disparar o prefetch sem o usuário abrir a setlist, e a releitura da N2-D13
 * não passa pelo caminho que o dispara hoje (`App.tsx:159`). A PR da tela
 * liga isto ao `prefetchEArrumar`; enquanto ninguém liga, o gancho é inerte —
 * e essa inércia está DECLARADA (div. 228), em vez de o T2-R17 parecer
 * atendido por construção.
 */
let aposReler: ((setlists: SetlistDTO[]) => void) | null = null

export function aoRelerSetlists(f: ((setlists: SetlistDTO[]) => void) | null): void {
  aposReler = f
}

/**
 * **A releitura do T2-R9** (N2-D13, opção (b)): `GET /api/setlists`, e o
 * conjunto de setlists é SUBSTITUÍDO pelo 200 dela. O `content` fica como
 * está — a escrita não o muda (N2-D1).
 *
 * O que ela NÃO é: não é o `sincronizar()` (que refaria as páginas de
 * content, opção (c)), e não é aplicar o corpo da escrita (opção (a), que é
 * merge e deixaria no cache um `updated_at` que o servidor não tem em quatro
 * das seis rotas).
 *
 * Falha aqui **não desfaz e não repete** a escrita, e não toca o cache: é a
 * N2-D22, e quem a nomeia é a espécie `ok-nao-relido`.
 */
async function reler(
  estado: EstadoLocal,
  reason: MotivoDaReleitura,
  op: Op | null,
): Promise<Releitura> {
  const minha = ++geracao
  const t0 = Date.now()
  const r = await getSetlists()
  const ms = Date.now() - t0
  const opDoLog = op ?? '-'
  if (!r.ok) {
    const status = r.status ?? 'net'
    log(`resync kind=setlists reason=${reason} op=${opDoLog} status=${status} setlists=- ms=${ms}`)
    return { setlists: null, syncedAtMs: null, leu: false }
  }
  if (minha < ultimaAplicada) {
    // Uma releitura MAIS NOVA já gravou: esta foto é velha e não vence
    // (div. 232). A linha sai igual — ela leu, e o 200 é verdade —, e o que
    // falta depois dela é o `cache write kind=setlists`.
    log(`resync kind=setlists reason=${reason} op=${opDoLog} status=200 setlists=${r.data.length} ms=${ms}`)
    return { setlists: null, syncedAtMs: null, leu: true }
  }
  ultimaAplicada = minha
  // T1-R10 (N2-D8): o contador real. Quando nada mudou, o conjunto devolvido
  // é o MESMO do anterior, e os derivados memoizados por referência não se
  // recriam — a escrita de outro aparelho que não mexeu nesta setlist não
  // custa um re-render.
  const { items, invalidated } = reconcileByUpdatedAt(estado.setlists, r.data)
  const syncedAtMs = Date.now()
  log(`resync kind=setlists reason=${reason} op=${opDoLog} status=200 setlists=${items.length} ms=${ms}`)
  saveSetlists(
    estado.uid,
    { setlists: items, content: estado.content, syncedAtMs },
    { setlists: invalidated, content: 0 },
  )
  aposReler?.(items)
  return { setlists: items, syncedAtMs, leu: true }
}

/**
 * N2-D22 — o `GET` refeito na próxima abertura da tela, depois de uma
 * releitura que falhou. É a mesma leitura, com outro `reason` e sem `op`.
 */
export function relerAoAbrir(estado: EstadoLocal): Promise<SetlistDTO[] | null> {
  return reler(estado, 'reopen', null).then((r) => r.setlists)
}

// ---------------------------------------------------------------- escrita

/**
 * Uma escrita inteira. **Nunca** repete, **nunca** enfileira, **nunca** grava
 * o cache fora do caminho da releitura.
 *
 * `contexto` só existe para o 404: o `code` do contrato é `NOT_FOUND` nos
 * dois casos e o campo `error` não pode ser lido (T1-R36). Quem sabe de quem
 * a tela está falando é a tela, depois de ver o conjunto relido.
 */
/**
 * **O trecho que a trava cobre**: a checagem de rede e o request. Nada mais.
 * `null` = offline, e nenhum request saiu (T2-R12).
 */
async function enviarUm(
  pedido: Pedido,
  contexto?: 'setlist' | 'musica',
): Promise<{ resposta: RespostaDeEscrita; preliminar: Resultado } | null> {
  if (!(await estaOnline())) return null

  const t0 = Date.now()
  const resposta = await mutate(pedido.method, pedido.path, pedido.body)
  const ms = Date.now() - t0

  const preliminar = classificar(pedido.op, resposta, null, contexto)
  // Logar — sempre, 2xx ou não (T2-R16).
  //
  // A linha vai inteira em UMA linha de fonte, e não quebrada em três como
  // o `sync ok` do `sync.ts:115-117`. O G3 coleta as linhas de fonte que
  // contêm a chamada; quebrada, ele coletaria só a abertura dela, e o
  // formato inteiro ficaria invisível para o gate que existe justamente
  // para dizer que nenhum formato mudou em silêncio.
  //
  // (E o comentário evita escrever a chamada: o coletor do G3 lê o texto
  // CRU, comentário incluído — div. 83, decidido de propósito —, e a
  // árvore de hoje tem ZERO menções dessas. Criar a primeira aqui faria a
  // próxima PR que reescrevesse este parágrafo reprovar por "linha de log
  // sumiu", que é o risco que o `W3-ENCERRAMENTO` deixou registrado.)
  const status = resposta.status === null ? 'net' : String(resposta.status)
  const code = resposta.status === null ? 'net' : (preliminar.code ?? '-')
  log(`write op=${pedido.op} setlist=${pedido.setlist} items=${pedido.items} status=${status} code=${code} ms=${ms}`)

  if (preliminar.especie === 'limite') {
    // T2-R14: a família inteira fecha. Sem prazo, fecha pelo mínimo que o
    // servidor garante (`Math.max(1, …)` em `user-rate-limit.ts:126`) — um
    // gate que não fechasse por falta de número deixaria o app bater na
    // porta até o servidor abrir, que é o que o 429 pede para não fazer.
    gate.block(FAMILIA, Date.now() + (preliminar.retryAfter ?? 1) * 1000)
  }
  return { resposta, preliminar }
}

export async function escrever(
  pedido: Pedido,
  estado: EstadoLocal,
  opcoes?: { contexto?: 'setlist' | 'musica' },
): Promise<Saida> {
  const semReleitura = (motivo: MotivoBarrado): Saida => {
    barrar(pedido.op, motivo)
    return { resultado: resultadoBarrado(pedido.op, motivo), setlists: null, syncedAtMs: null }
  }

  // 1. barrar — a ordem é a do custo: o que não precisa de rede primeiro.
  //
  // **O `emVoo = true` acontece ANTES do primeiro `await`, e isso é o
  // requisito, não um detalhe.** A primeira forma disto marcava depois do
  // `estaOnline()`, e o CN do T2-R11 a reprovou: as duas chamadas passavam
  // pelo `if (emVoo)` síncrono, suspendiam no `await`, e as duas escreviam.
  // Dois toques no mesmo frame é exatamente o caso que "uma escrita por vez"
  // existe para cobrir — e o `expo-network` é justamente um `await` que
  // demora. Uma trava conquistada depois de um `await` não é trava.
  if (emVoo) return semReleitura('busy')
  if (!gate.canRequest(FAMILIA, Date.now())) return semReleitura('ratelimit')

  emVoo = true
  let enviado: { resposta: RespostaDeEscrita; preliminar: Resultado } | null
  try {
    // 2. enviar — um request.
    enviado = await enviarUm(pedido, opcoes?.contexto)
  } finally {
    // **A TRAVA SOLTA AQUI, ANTES DA RELEITURA — div. 232.**
    //
    // A primeira forma disto tinha o `await reler(…)` DENTRO deste `try`, e
    // a trava durava a operação inteira. O T2-R11 diz "uma escrita por vez",
    // e travar da primeira linha à última é a leitura óbvia dele — mas
    // contradiz o congelado. `DESIGN-N2/telas.html`, legenda de
    // `N2-P-relendo`, verbatim: *"As outras linhas **seguem ativas**: a
    // releitura de uma adição não congela o picker."*
    //
    // O que a trava existe para impedir é **duas escritas no servidor ao
    // mesmo tempo** (dois `POST` de bis, duas ordens concorrentes). A
    // releitura é um `GET` de outra família, que não escreve nada e não
    // consome a janela `setlist-mutate` — segurá-la aqui custaria ~50 KB de
    // espera por música no T2-R6, que pede dez adições seguidas com o picker
    // aberto.
    emVoo = false
  }
  if (enviado === null) return semReleitura('offline')
  const { resposta, preliminar } = enviado

  // 3. reler — depois de todo 2xx (T2-R9) e de todo 404 (T2-R10). Fora da
  // trava: daqui para baixo outra escrita já pode ter começado.
  const dosQueRelem = preliminar.especie === 'ok' || preliminar.especie === 'sumiu'
  if (!dosQueRelem) return { resultado: preliminar, setlists: null, syncedAtMs: null }

  const rel = await reler(estado, preliminar.especie === 'sumiu' ? '404' : 'write', pedido.op)

  // 4. classificar de novo, agora com a releitura — é ela que separa `ok`
  // de `ok-nao-relido` (N2-D22).
  const resultado = classificar(
    pedido.op,
    resposta,
    // `leu`, e não `setlists !== null`: uma releitura descartada por outra
    // mais nova LEU, e a escrita está relida — por uma foto melhor.
    rel.leu ? 'ok' : 'falhou',
    opcoes?.contexto,
  )
  return { resultado, setlists: rel.setlists, syncedAtMs: rel.syncedAtMs }
}

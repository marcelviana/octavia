/**
 * Prefetch e retenção (PRD T1-R14, T1-R15, T1-R16; aceites A9, A10).
 *
 * Fino de propósito: **quem decide o quê é o core** (`selectPrefetch`,
 * `prefetchOrder`, `lruEvict`, todos puros e testados em
 * `packages/core/src/offline.test.ts`); aqui só se lê o disco (`listFiles`),
 * se baixa (`ensureFile`) e se apaga (`remove`). Nenhuma regra nova mora
 * neste arquivo — se uma aparecer, ela pertence ao core.
 *
 * **Sem timer**: dispara na abertura (depois do sync, T1-R13 passo 3), ao
 * navegar no palco (T1-R16) e no botão "baixar esta setlist" (T1-R15). Um
 * relógio de fundo seria estado invisível num app que precisa ser previsível
 * no palco.
 */
import {
  isValidContent,
  lruEvict,
  prefetchOrder,
  promoteList,
  selectPrefetch,
  type ContentDTO,
  type SetlistDTO,
} from '@octavia/core'
import { ensureFile, hasFile, higienizar, listFiles, remove } from './files'
import { log } from './log'

/**
 * Teto de retenção, T1-R14. O PRD propôs 200 MB e o N0-H16 mediu o
 * repertório inteiro da conta de audit em 265.002 B — o teto é folga, não
 * risco: seriam ~830 PDFs do maior objeto medido para tocá-lo. **Valor final
 * em produção: 200 MB**; a prova de despejo da N1-PR5 baixou esta constante
 * temporariamente para forçar vítimas, e a devolveu antes do commit.
 */
export const CAP_BYTES = 200 * 1024 * 1024

/** Concorrência do prefetch — 3, como o web (`lib/advanced-content-cache.ts:158`). */
const CONCORRENCIA = 3

/** `YYYY-MM-DD` de hoje, no fuso do device (a coluna do banco é date-only). */
function hoje(): string {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** URL de arquivo desta song, ou `null` (corpo de texto, inválida, ausente). */
function urlDe(contentId: string, contentById: Map<string, ContentDTO>): string | null {
  const content = contentById.get(contentId)
  if (content === undefined) return null
  const validade = isValidContent(content.content_type, content.content_data, content.file_url)
  if (!validade.ok || validade.body !== 'file') return null
  return content.file_url
}

/**
 * Conjunto **garantido** (T1-R14): todos os arquivos das setlists dos
 * próximos 7 dias, presentes ou não. É o mesmo `selectPrefetch` do plano,
 * chamado com "nada no disco" — assim a janela de 7 dias tem uma definição
 * só, no core, e não duas que podem divergir.
 */
export function urlsGarantidas(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
): Set<string> {
  return new Set(
    selectPrefetch(setlists, contentById, new Set<string>(), hoje()).map((item) => item.url),
  )
}

/**
 * **Uma fila com `CONCORRENCIA` trabalhadores** — não mais um lote por vez.
 *
 * O que havia aqui era uma BARREIRA: `await Promise.allSettled(lote)` antes
 * do lote seguinte. Um arquivo a 1,8 KB/s não atrasava só a si mesmo —
 * **parava a fila inteira**, e os arquivos do 4º em diante nunca começavam,
 * inclusive os que baixariam em dois segundos (div. 122).
 *
 * **O mesmo 3, com outro significado.** `CONCORRENCIA` era o tamanho do lote;
 * passa a ser o teto de downloads simultâneos. O invariante que importa —
 * quantas conexões o app abre ao mesmo tempo — é o mesmo nas duas formas, e é
 * o que o **T1-R13 passo 3** sempre pediu: "concorrência ≤ 3". O nome da
 * constante e o requisito sempre disseram concorrência; foi a implementação
 * que fez lote. O lote garante ≤ 3 e **desperdiça vagas**; a fila garante ≤ 3
 * e as usa.
 *
 * **Nenhuma falha é engolida** (div. 114, T1-R37): o resultado de cada
 * download é lido, e cada rejeição vira uma linha `download-error`. Antes o
 * array do `allSettled` era descartado e **toda** falha de download nos três
 * caminhos de prefetch era invisível.
 *
 * O `aoArquivo` corre a cada arquivo que assenta — é o que faz o cartão andar
 * "1 de 5 → 2 de 5" DURANTE o download em vez de saltar no fim (W1-A7).
 */
async function baixar(
  urls: string[],
  guaranteed: boolean,
  aoArquivo?: () => void,
): Promise<void> {
  const fila = [...urls]
  const trabalhador = async (): Promise<void> => {
    for (;;) {
      const url = fila.shift()
      if (url === undefined) return
      try {
        await ensureFile(url, { guaranteed })
      } catch (erro: unknown) {
        log(`download-error ${mensagemDe(erro)}`)
        continue
      }
      aoArquivo?.()
    }
  }
  const quantos = Math.min(CONCORRENCIA, fila.length)
  await Promise.all(Array.from({ length: quantos }, () => trabalhador()))
}

/**
 * A falha numa frase que pode entrar em log — a REDE DE SEGURANÇA para o que
 * nunca passou pelo `falha()`, porque **regra 2 do catálogo: URI completa
 * nunca entra em log**.
 *
 * **W3, div. 137 — a metade que a W2 deixou.** Até aqui esta função tinha
 * higienização PRÓPRIA: `replace(/\b(?:https?|file):\/\/\S+/g, '<uri>')`. Duas
 * implementações da mesma regra, e a de cá era a ANTIGA — não tinha a
 * alternativa do host nu que a W2 acrescentou ao `higienizar()` depois de o
 * aparelho devolver, em modo avião, `Unable to resolve host
 * "<ref>.supabase.co"` (host sem esquema, entre aspas, que o regex de URI não
 * casa). O identificador do projeto Supabase ia inteiro para o log — e log
 * deste projeto se cola em anexo commitado.
 *
 * A W2 não pôde tocar aqui: o `prefetch.ts` está DENTRO da cobertura do G1a, e
 * mexer nele exigiria declará-lo exceção, alargando o escopo que o commit 1
 * dela acabara de fechar. Nesta PR ele é **exceção declarada no `g1.sh`**, com
 * a razão escrita — a lista de exceções é o escopo declarado.
 *
 * O conjunto que esta rede cobre encolheu com a W2 (a promoção do
 * `ensureFileUma` entrou num `try`) e **não é vazio**: o `parcial.delete()` da
 * abertura do `baixarAtomico`, o `touch()` e os dois `localizar()` do
 * `ensureFileUma` seguem fora de qualquer `try`.
 *
 * O `file://` que só existia aqui foi junto para o `higienizar()`, com o mesmo
 * rótulo `<uri>`: unificar não podia custar cobertura a nenhum dos dois lados.
 */
function mensagemDe(erro: unknown): string {
  return higienizar(erro instanceof Error ? erro.message : 'falha ao baixar')
}

/**
 * T1-R15 — plano de 7 dias, na abertura. As 3 setlists da conta de audit têm
 * `performance_date: null` (medido no pre-check A3), então aqui o plano real
 * é `n=0`: o caminho é o mesmo, o conjunto é que está vazio.
 */
export async function prefetch7Dias(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
  aoArquivo?: () => void,
): Promise<void> {
  const noDisco = listFiles()
  const presentes = new Set(noDisco.map((f) => f.url))
  const plano = selectPrefetch(setlists, contentById, presentes, hoje())
  log(`prefetch plan n=${plano.length} reason=7d`)
  if (plano.length > 0) await baixar(plano.map((item) => item.url), true, aoArquivo)

  /**
   * **Promoção** (defeito medido no aceite, N1-PR7 §3.1, Tab S6).
   *
   * O plano acima só cobre o que FALTA baixar. Um arquivo que veio sob
   * demanda (T1-R16 grava no `Paths.cache`, purgável) e que depois entrou na
   * janela de 7 dias ficava lá para sempre: o LRU do app o protegia, mas o
   * Android não sabe dessa proteção e pode apagá-lo — inclusive na véspera do
   * show, que é o caso que o prefetch de 7 dias existe para cobrir
   * (N0-H16 §4).
   *
   * Quem decide o quê é o core (`promoteList`); o `ensureFile` já sabe mover
   * do cache para o `Paths.document` (`moveSync`, N1-PR5). Roda DEPOIS do
   * plano porque o que acabou de ser baixado já nasce durável, e é idempotente
   * — na segunda passada `promoteList` devolve vazio.
   */
  const aPromover = promoteList(urlsGarantidas(setlists, contentById), listFiles())
  if (aPromover.length === 0) return
  log(`prefetch promote n=${aPromover.length}`)
  for (const url of aPromover) {
    // Com guarda (div. 115): sem ela, uma rejeição aqui subia por
    // `prefetchEArrumar` → `rodarSync` → `void rodarSync(...)` e virava
    // rejeição sem dono — E o `recarregarArquivos()` não corria, então o LRU
    // não era aparado e o `filesPresent` não era atualizado. Uma promoção que
    // falha é uma linha, não um sync derrubado.
    try {
      await ensureFile(url, { guaranteed: true })
    } catch (erro: unknown) {
      log(`download-error ${mensagemDe(erro)}`)
      continue
    }
    aoArquivo?.()
  }
}

/**
 * T1-R16 — sob demanda a partir da posição no palco: atual, +1, +2, +3, −1 e
 * o resto por `position` (a ordem é do core). Já baixados não entram no `n=`:
 * o número no log é o que este disparo vai realmente buscar.
 */
export async function prefetchDemanda(
  setlist: SetlistDTO,
  contentById: Map<string, ContentDTO>,
  posicao: number,
): Promise<void> {
  const porId = new Map(setlist.setlist_songs.map((s) => [s.id, s]))
  const ordem = prefetchOrder(posicao, setlist.setlist_songs)
  const urls: string[] = []
  const vistas = new Set<string>()
  for (const songId of ordem) {
    const song = porId.get(songId)
    if (song === undefined) continue
    const url = urlDe(song.content_id, contentById)
    if (url === null || vistas.has(url) || hasFile(url)) continue
    vistas.add(url)
    urls.push(url)
  }
  log(`prefetch plan n=${urls.length} reason=demand`)
  if (urls.length > 0) await baixar(urls, false)
}

/**
 * T1-R15 manual — "baixar esta setlist" (o design mostra o botão só em
 * setlist sem data de show: as datadas já são cobertas pelo plano de 7 dias).
 *
 * **Grava no DURÁVEL** (W1, div. 102). Era a única das quatro formas de
 * baixar que gravava no purgável, e portanto a que dava a garantia **mais
 * fraca** — justamente a única em que o usuário pede o arquivo de forma
 * explícita. O prefetch automático de 7 dias, que ninguém pediu, dava a mais
 * forte: **a hierarquia estava invertida**. E o botão só aparece em setlist
 * SEM data de show — exatamente a que a janela de 7 dias nunca cobre: se ele
 * não durar, nada dura para ela.
 *
 * **Com trava, e a trava é o que fica de fora**: o arquivo sai do alcance do
 * Android (o dano real da 102) e **não** entra no `protectedUrls` do LRU. A
 * política de purga não muda — o arquivo fixado continua candidato normal,
 * despejável por desuso —, e a pergunta grande ("como se solta o que foi
 * fixado", com UI de soltar) fica aberta e honesta, para quando houver
 * repertório que a justifique. Decisão do Marcel, 2026-09-14 (Q1).
 */
export async function baixarSetlist(
  setlist: SetlistDTO,
  contentById: Map<string, ContentDTO>,
  aoArquivo?: () => void,
): Promise<void> {
  const urls: string[] = []
  const vistas = new Set<string>()
  for (const song of [...setlist.setlist_songs].sort((a, b) => a.position - b.position)) {
    const url = urlDe(song.content_id, contentById)
    if (url === null || vistas.has(url) || hasFile(url)) continue
    vistas.add(url)
    urls.push(url)
  }
  log(`prefetch plan n=${urls.length} reason=manual`)
  if (urls.length > 0) await baixar(urls, true, aoArquivo)
}

/**
 * T1-R14 — LRU com teto, os garantidos como `protectedUrls`. Só loga quando
 * despeja: uma linha `lru evict n=0` por abertura seria ruído no instrumento
 * dos aceites.
 *
 * **O estouro aparece** (W4-b3). O `lruEvict` nunca despeja um protegido, e
 * quando só os protegidos já passam do teto ele devolve o `bytesAfter` real,
 * acima do `CAP_BYTES` — "quem chama decide o que fazer com o estouro". Quem
 * chama o descartava (registro do W1, `W1-PRECHECK.md:469`). Agora ele vira
 * uma linha, `lru over`, com o total, o teto e quantos protegidos o seguram.
 * O que o app faz com isso, além de dizer, é decisão de produto, não desta
 * função: o teto é 200 MB e o repertório medido é 265.002 B.
 */
export function aplicarLru(setlists: SetlistDTO[], contentById: Map<string, ContentDTO>): void {
  const protegidos = urlsGarantidas(setlists, contentById)
  const { evict, bytesAfter } = lruEvict(listFiles(), CAP_BYTES, protegidos)
  if (evict.length > 0) {
    const bytes = remove(evict)
    log(`lru evict n=${evict.length} bytes=${bytes}`)
  }
  if (bytesAfter > CAP_BYTES) {
    log(`lru over bytes=${bytesAfter} cap=${CAP_BYTES} protected=${protegidos.size}`)
  }
}

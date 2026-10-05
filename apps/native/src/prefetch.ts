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
  planoDaBiblioteca,
  prefetchOrder,
  promoteList,
  urlsDaBiblioteca,
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
 * Conjunto **garantido** (T1-R14), presentes ou não: **todo arquivo da
 * biblioteca** (N4-R26, N4-D42) — `urlsDaBiblioteca` do core, todo `file_url`
 * com `body === 'file'`. Até a N4-PR5 era a janela de 7 dias (o
 * `selectPrefetch` com "nada no disco"); a janela continua com uma definição
 * só, no core, e decide a PRIORIDADE do plano (N4-D88), não mais a proteção.
 *
 * As `setlists` ficam na assinatura: quem chama (o LRU, a promoção, os testes
 * do W4-b3) não muda, e a garantia não depende delas.
 */
export function urlsGarantidas(
  _setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
): Set<string> {
  return urlsDaBiblioteca(contentById.values())
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
  /**
   * N4-D88 — chamado quando um trabalhador PEGA a próxima URL, antes de começar: `false` pula a URL. É por aqui que o
   * plano da biblioteca para quando o total passa do teto (o tamanho só se conhece depois do download, div. 112).
   */
  podeComecar?: (url: string) => boolean,
  /** N4-D88 — os bytes de cada download que assentou, para o total do teto. */
  aoAssentar?: (bytes: number) => void,
): Promise<void> {
  const fila = [...urls]
  const trabalhador = async (): Promise<void> => {
    for (;;) {
      const url = fila.shift()
      if (url === undefined) return
      if (podeComecar !== undefined && !podeComecar(url)) continue
      try {
        const pronto = await ensureFile(url, { guaranteed })
        aoAssentar?.(pronto.bytes)
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
 * **N4-R26 — o plano da biblioteca inteira**, na abertura (depois do sync,
 * T1-R13 passo 3) e depois da releitura de uma escrita (T2-R17). Até a N4-PR5
 * era o plano de 7 dias (`prefetch7Dias`, `reason=7d`); a linha passa a
 * `reason=library` — errata em par do G3 e do `LOGS-OCTAVIA.md`.
 *
 * **N4-D88** (`[Marcel, 2026-10-04]`): o plano é o do core — a janela de 7
 * dias primeiro, depois o resto da biblioteca em ordem alfabética. A janela
 * baixa SEMPRE (como baixava); a biblioteca baixa enquanto o total no
 * aparelho não passa do teto (`capBytes`). Quando passa, o trabalhador que
 * pega a próxima URL da biblioteca a pula: o que não coube fica *não
 * baixado*, e o sinal é o `lru over` que o `aplicarLru` já emite — os
 * garantidos não se despejam. O tamanho só se conhece depois do download
 * (div. 112), então o estouro é de no máximo os `CONCORRENCIA` arquivos que
 * já estavam em voo quando o total passou.
 *
 * `capBytes` é parâmetro para o teste medir a parada sem 200 MB de bytes;
 * nenhuma chamada do app o passa.
 */
export async function prefetchDaBiblioteca(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
  aoArquivo?: () => void,
  capBytes: number = CAP_BYTES,
): Promise<void> {
  const noDisco = listFiles()
  const presentes = new Set(noDisco.map((f) => f.url))
  const plano = planoDaBiblioteca(setlists, contentById, presentes, hoje())
  log(`prefetch plan n=${plano.length} reason=library`)
  if (plano.length > 0) {
    const prioridade = new Map(plano.map((item) => [item.url, item.prioridade]))
    let total = noDisco.reduce((soma, f) => soma + f.bytes, 0)
    await baixar(
      plano.map((item) => item.url),
      true,
      aoArquivo,
      (url) => prioridade.get(url) === '7d' || total <= capBytes,
      (bytes) => {
        total += bytes
      },
    )
  }

  /**
   * **Promoção** (defeito medido no aceite, N1-PR7 §3.1, Tab S6).
   *
   * O plano acima só cobre o que FALTA baixar. Um arquivo que veio sob
   * demanda (T1-R16 grava no `Paths.cache`, purgável) e que depois entrou na
   * janela de 7 dias — desde a N4-PR5, todo arquivo da biblioteca — ficava lá
   * para sempre: o LRU do app o protegia, mas o
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
 *
 * **N4-PR6 (div. 964)** — o palco avulso SEM hospedeira (`setlist === null`)
 * não tem posição de onde partir: o plano é o arquivo da música avulsa, e só
 * ele. Antes ele herdava a primeira setlist da lista, e abrir uma letra pela
 * busca de S1 tentava baixar o arquivo de outra música. A linha do log é a de
 * sempre (`reason=demand`): nenhuma linha nova.
 */
export async function prefetchDemanda(
  setlist: SetlistDTO | null,
  contentById: Map<string, ContentDTO>,
  posicao: number,
  avulsaContentId: string | null = null,
): Promise<void> {
  const urls: string[] = []
  const vistas = new Set<string>()
  const incluir = (contentId: string): void => {
    const url = urlDe(contentId, contentById)
    if (url === null || vistas.has(url) || hasFile(url)) return
    vistas.add(url)
    urls.push(url)
  }
  if (setlist === null) {
    if (avulsaContentId !== null) incluir(avulsaContentId)
  } else {
    const porId = new Map(setlist.setlist_songs.map((s) => [s.id, s]))
    for (const songId of prefetchOrder(posicao, setlist.setlist_songs)) {
      const song = porId.get(songId)
      if (song !== undefined) incluir(song.content_id)
    }
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
 *
 * **N4-PR5**: com a garantia da biblioteca inteira (N4-R26), todo arquivo de
 * música da biblioteca passou a ser protegido — inclusive o que este botão
 * baixa. "Fica de fora do `protectedUrls`" vale agora só para o arquivo de
 * uma música que saiu da biblioteca (o órfão). E o plano da biblioteca já
 * traz o arquivo de toda setlist sem data: o botão continua existindo (S1 não
 * muda no N4, N4-D59), e no repouso ele acha tudo no disco (`n=0`).
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
export function aplicarLru(
  setlists: SetlistDTO[],
  contentById: Map<string, ContentDTO>,
  /** N4-PR5 — o teto, parâmetro só para o teste da N4-D88 (o `lru over` com teto pequeno); o app usa o padrão. */
  teto: number = CAP_BYTES,
): void {
  // O nome sombreia a constante do módulo DE PROPÓSITO (o molde do `store.ts`, N2-PR2): as linhas `lru` abaixo ficam
  // byte a byte as mesmas de antes, e o G3 não precisa de errata para um parâmetro de teste.
  const CAP_BYTES = teto
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

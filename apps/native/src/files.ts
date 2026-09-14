/**
 * Arquivos do nativo (PRD T1-R14, T1-R26; aceites A9, A13). Renasce o
 * `files.ts` do N0-PR5 com o que aquele protocolo mediu, mais as duas coisas
 * que o N0 deixou anotadas para o N1 (`N0-H16.md` §4 e "Notas para o N1"):
 *
 * 1. **Dois armazenamentos, por durabilidade** — arquivos *garantidos* (das
 *    setlists dos próximos 7 dias, T1-R15) vivem em `Paths.document`, que o
 *    sistema **não** purga; todo o resto vive em `Paths.cache`, purgável. O
 *    N0 provou o fluxo inteiro no `Paths.cache` e registrou a dívida.
 * 2. **Diretório por `uid`** — mesmo namespace do `store.ts` (PRD §5): trocar
 *    de conta no device não mistura arquivos.
 *
 * Nome do arquivo = último segmento da URL (`<timestamp>-<nome>.pdf`, único
 * por construção do upload B6-D5′ — nota do N0). A chave é a URL inteira.
 *
 * `lastUsedMs` não existe na API do `expo-file-system` 57 (`File` expõe
 * `exists`/`size`, não mtime — medido nos `.d.ts`), então o LRU precisa de um
 * índice próprio: `files-index.json`, no diretório do usuário em
 * `Paths.document`, gravado atomicamente como o `store.ts` grava o cache. O
 * `guaranteed` **não** entra no índice: é derivado de onde o arquivo está, e
 * assim não há dois lugares para o mesmo fato divergirem.
 *
 * Sem retry: uma falha aparece (T1-R37), não é reescrita em silêncio.
 */
import { Directory, File, Paths } from 'expo-file-system'
import { fileVerdict, type FileRejectKind } from '@octavia/core'
import { log } from './log'

/** Último segmento da URL — o único pedaço que pode entrar em log (N1-D5). */
export function fileNameFromUrl(url: string): string {
  const seg = url.split('/').pop()
  return seg === undefined || seg.length === 0 ? 'file' : seg
}

/**
 * O `uid` da sessão. É estado de módulo, e não parâmetro de cada chamada,
 * porque as telas chamam `ensureFile` de dentro de efeitos que não conhecem
 * a sessão; quem sabe o `uid` é a raiz do app, e ela o define uma vez.
 */
let uidAtual: string | null = null

export function setFilesUser(uid: string | null): void {
  uidAtual = uid
}

function uid(): string {
  // Sem sessão não há diretório de usuário: chamar isto é defeito de fiação,
  // não estado esperado — falha alto em vez de gravar num namespace errado.
  if (uidAtual === null) throw new Error('files: sem uid — setFilesUser não foi chamado')
  return uidAtual
}

function dirGarantido(): Directory {
  return new Directory(Paths.document, `octavia-${uid()}`, 'files')
}

function dirDemanda(): Directory {
  return new Directory(Paths.cache, `octavia-${uid()}`, 'files')
}

function dirIndice(): Directory {
  return new Directory(Paths.document, `octavia-${uid()}`)
}

// ---------------------------------------------------------------- índice

/**
 * `url` → último uso e tamanho conhecido. O `guaranteed` **não** entra: é
 * derivado da pasta. O `bytes` entra porque o S3e precisa dizer o tamanho de
 * um arquivo que NÃO está no disco ("partitura (1,2 MB) não está neste
 * aparelho"), e nesse momento não há o que medir — só o que lembrar.
 */
type Indice = Record<string, { name: string; bytes: number; lastUsedMs: number }>

let indice: Indice | null = null
let indiceDe: string | null = null

function carregarIndice(): Indice {
  const u = uid()
  if (indice !== null && indiceDe === u) return indice
  const f = new File(dirIndice(), 'files-index.json')
  let lido: Indice = {}
  if (f.exists) {
    try {
      lido = JSON.parse(f.textSync()) as Indice
    } catch {
      // Índice corrompido = LRU sem histórico, nunca arquivo perdido: o
      // `listFiles` reconstrói as entradas a partir do disco.
      lido = {}
    }
  }
  indice = lido
  indiceDe = u
  return lido
}

/**
 * Gravação atômica do índice: `.tmp` e rename por cima.
 *
 * **`moveSync`, não `move`**: no expo-file-system 57 o `move` devolve
 * `Promise<void>`. Com três downloads concorrentes (o prefetch usa lote de 3)
 * os três `touch()` disparavam três renames assíncronos que se atropelavam —
 * um apagava o `.tmp` do outro — e a promise rejeitada aparecia na tela como
 * `Uncaught (in promise): "Call to function 'FileSystemFile.move' has been
 * rejected"` (medido no device, N1-PR5). O `moveSync` fecha a janela: a
 * função inteira roda sem ceder o event loop.
 */
function gravarIndice(): void {
  const dir = dirIndice()
  if (!dir.exists) dir.create({ intermediates: true })
  const tmp = new File(dir, 'files-index.json.tmp')
  if (tmp.exists) tmp.delete()
  tmp.create()
  tmp.write(JSON.stringify(carregarIndice()))
  const alvo = new File(dir, 'files-index.json')
  if (alvo.exists) alvo.delete()
  tmp.moveSync(alvo)
}

// ---------------------------------------------------------------- disco

function arquivoEm(dir: Directory, url: string): File {
  return new File(dir, fileNameFromUrl(url))
}

/**
 * Onde o arquivo está agora — `null` se não está em lugar nenhum.
 *
 * **Um arquivo de 0 byte não está em lugar nenhum** (W1, div. 103). Esta é a
 * única checagem que `localizar` faz, e ela só é honesta PORQUE o download
 * passou a escrever num `.part` (abaixo): enquanto o corpo era gravado direto
 * no alvo, `size > 0` valia para todo download em voo desde o primeiro
 * milissegundo — não era nem o piso (div. 113). Com o `.part`, nada
 * incompleto tem o nome definitivo, e aí um 0 byte no nome final só pode ser
 * lixo: de um download anterior a esta PR, ou de um `moveSync` interrompido.
 *
 * O que ela NÃO alcança: um arquivo truncado em 100 KB de 242 KB, que tem
 * tamanho e não tem forma. Esse é caro de julgar (abre o arquivo) e por isso
 * não corre aqui — `localizar` é chamada em laço. Quem o alcança é o
 * `sanearArquivos()`, uma vez por abertura.
 */
function localizar(url: string): { file: File; guaranteed: boolean } | null {
  const g = arquivoEm(dirGarantido(), url)
  if (g.exists && g.size > 0) return { file: g, guaranteed: true }
  const d = arquivoEm(dirDemanda(), url)
  if (d.exists && d.size > 0) return { file: d, guaranteed: false }
  return null
}

export function hasFile(url: string): boolean {
  return uidAtual !== null && localizar(url) !== null
}

export interface EnsuredFile {
  uri: string
  src: 'disk' | 'download'
  bytes: number
}

/**
 * Downloads em voo, por URL. O palco pede o arquivo da música atual no mesmo
 * instante em que o prefetch sob demanda (T1-R16) pede a lista que começa
 * por ela: sem esta tabela seriam **dois** downloads do mesmo objeto — o
 * orçamento do bucket conta cada um. Com ela, uma requisição e uma linha
 * `file src=download`.
 */
const emVoo = new Map<string, Promise<EnsuredFile>>()

/**
 * Garante o arquivo no disco e devolve por onde ele veio (A9: a 2ª abertura
 * é `src=disk`, sem request). `guaranteed` decide a pasta; um arquivo que já
 * está no cache e vira garantido é **movido**, nunca rebaixado de novo.
 */
export function ensureFile(
  url: string,
  opcoes: { guaranteed: boolean } = { guaranteed: false },
): Promise<EnsuredFile> {
  const jaVoando = emVoo.get(url)
  if (jaVoando !== undefined) return jaVoando
  const voo = ensureFileUma(url, opcoes).finally(() => emVoo.delete(url))
  emVoo.set(url, voo)
  return voo
}

async function ensureFileUma(
  url: string,
  opcoes: { guaranteed: boolean },
): Promise<EnsuredFile> {
  const name = fileNameFromUrl(url)
  const alvoDir = opcoes.guaranteed ? dirGarantido() : dirDemanda()
  const atual = localizar(url)

  if (atual !== null) {
    // Promoção a garantido: move do cache purgável para o não-purgável.
    if (opcoes.guaranteed && !atual.guaranteed) {
      if (!alvoDir.exists) alvoDir.create({ intermediates: true })
      const destino = new File(alvoDir, name)
      if (destino.exists) destino.delete()
      atual.file.moveSync(destino)
    }
    const achado = localizar(url)
    const bytes = achado?.file.size ?? 0
    touch(url)
    log(`file src=disk name=${name} bytes=${bytes}`)
    return { uri: achado?.file.uri ?? '', src: 'disk', bytes }
  }

  if (!alvoDir.exists) alvoDir.create({ intermediates: true })
  return baixarAtomico(url, alvoDir, name)
}

/** Sufixo do arquivo em construção. Um `.part` nunca é o nome de nada. */
export const PARCIAL = '.part'

/**
 * **Teto por INATIVIDADE — 30 s sem um byte novo.** (Q2 do pre-check, §8.1.)
 *
 * Não é um teto de duração: um download legítimo pode demorar horas numa
 * Wi-Fi ruim de hotel na véspera do show, e é exatamente isso que o usuário
 * quer que aconteça. O que este número mata é a conexão MORTA — o soquete de
 * pé que parou de entregar —, o único caso em que o app tem certeza de que
 * nada mais vai chegar.
 *
 * **Os 30 s são medidos ZERO vezes neste projeto**: são convenção de rede.
 * Quem os confirma é o aceite W1-A2, e o controle negativo dele (W1-A3, com
 * o servidor entregando devagar mas sem parar) é quem diz se o teto confunde
 * lento com morto.
 *
 * E o que ele **não** é: o conserto da fila. Um número maior aqui não faz o
 * quarto arquivo começar mais cedo — isso é a fila de trabalhadores do
 * `prefetch.ts`, e confundir as duas coisas é o erro que esta nota existe
 * para impedir.
 */
const INATIVIDADE_MS = 30_000

/**
 * **Baixa para um nome temporário e renomeia só depois de completo.**
 *
 * É o mesmo `.tmp` + rename que o `store.ts:42` usa para o cache JSON ("assim
 * uma interrupção no meio da escrita nunca deixa um JSON truncado no lugar do
 * cache bom") e que o `gravarIndice()` acima usa para o índice. **A única
 * coisa que nunca tinha recebido esse tratamento era o arquivo baixado** — e
 * era ela que sustentava a frase "garantida offline" (div. 103).
 *
 * No Android o corpo é gravado DIRETO no destino, que é criado e truncado
 * antes do primeiro byte (`FileSystemDownload.kt:97`; a doc da biblioteca diz
 * isso verbatim em `File.ts:45-48`, e contrasta com o iOS, que já move para o
 * lugar só depois do sucesso — div. 113). Com o `.part`, o Android passa a se
 * comportar como o iOS, e aí **existir é estar completo**: o `localizar()` de
 * hoje volta a estar certo sem mudar de ideia sobre nada.
 *
 * O `.part` nasce **no diretório alvo**, nunca num terceiro: durável e
 * purgável são volumes diferentes, e só dentro do mesmo volume o rename é uma
 * operação de metadado (`W1-PRECHECK.md` §10).
 */
async function baixarAtomico(url: string, alvoDir: Directory, name: string): Promise<EnsuredFile> {
  const parcial = new File(alvoDir, `${name}${PARCIAL}`)
  if (parcial.exists) parcial.delete()

  // `createDownloadTask`, e não `downloadFileAsync`: o estático DECLARA
  // `signal` e `onProgress` e não honra nenhum dos dois — o progresso depende
  // de um `downloadUUID` que ele não passa, e a fiação do abort vive só na
  // tarefa (div. 116). Mesmo pacote, zero dependência nova.
  const controle = new AbortController()
  let relogio: ReturnType<typeof setTimeout> | null = null
  let mudo = false
  let total = -1
  const rearmar = (): void => {
    if (relogio !== null) clearTimeout(relogio)
    relogio = setTimeout(() => {
      mudo = true
      controle.abort()
    }, INATIVIDADE_MS)
  }

  const comecou = Date.now()
  try {
    rearmar()
    const tarefa = File.createDownloadTask(url, parcial, {
      signal: controle.signal,
      onProgress: ({ totalBytes }) => {
        total = totalBytes
        // Chegou byte novo: o silêncio recomeça do zero. É isto que faz o
        // teto ser de INATIVIDADE e não de duração.
        rearmar()

        // OPÇÃO C, NÃO IMPLEMENTADA — e o que falta para implementá-la.
        // Aqui caberia projetar o fim do download (`bytesWritten`,
        // `totalBytes` e o tempo decorrido dão a taxa) e abortar quando a
        // projeção passar de um teto `T₁`. NÃO foi feito porque **falta o
        // `T₁`, e ele não se inventa**: a única medição que existe é 37 h com
        // `n=1` (V1, AV-1, link a 1,8 KB/s), e escolher um limiar para caber
        // nela seria a div. 80 cometida por quem a escreveu. O que falta
        // medir: uma população de downloads reais com a taxa de cada um (é o
        // que a linha `file` passa a registrar, com `total=` e `ms=`), para
        // que o `T₁` nasça de números. Ver `W1-PRECHECK.md` §8.1.
        // Se e quando entrar, o aborto é um `download-error` com a projeção
        // na mensagem — NÃO um `file-reject`: o arquivo não foi achado e
        // recusado, ele não chegou.
      },
    })
    const veio = await tarefa.downloadAsync()
    if (relogio !== null) clearTimeout(relogio)
    if (veio === null) throw new Error('pausado')

    const bytes = parcial.size
    const esperado = total >= 0 ? total : null
    const veredito = fileVerdict({ bytes, expected: esperado, pdf: ehPdf(name), ...bordas(parcial) })
    if (!veredito.ok) {
      log(`file-reject name=${name} kind=${veredito.kind} bytes=${bytes} expected=${esperado ?? '-'}`)
      parcial.delete()
      throw new Error(`${name}: ${motivo(veredito.kind, bytes, esperado)}`)
    }

    const destino = new File(alvoDir, name)
    if (destino.exists) destino.delete()
    parcial.moveSync(destino)
    touch(url)
    // Errata W1 da linha `file`: no `src=download` entram `total=` (o
    // `Content-Length`, `-` quando o servidor não o manda) e `ms=` (do início
    // do download ao rename). Sem a taxa no log, "não abortou" não se separa
    // em "a rede estava sã" e "o teto não funciona" — e o W1-A2 vira
    // impressão em vez de aceite. O `src=disk` fica inalterado: não houve
    // download, não há total nem duração.
    log(`file src=download name=${name} bytes=${bytes} total=${esperado ?? '-'} ms=${Date.now() - comecou}`)
    return { uri: destino.uri, src: 'download', bytes }
  } catch (erro: unknown) {
    // Qualquer saída por erro leva o parcial junto: um `.part` que sobra é
    // lixo, nunca meio-arquivo servível. O que sobrar de um processo MORTO
    // (que não passa por aqui) é varrido na abertura seguinte.
    if (relogio !== null) clearTimeout(relogio)
    if (parcial.exists) parcial.delete()
    throw falha(erro, name, mudo)
  }
}

function ehPdf(name: string): boolean {
  return name.toLowerCase().endsWith('.pdf')
}

/**
 * Os primeiros e os últimos bytes do arquivo, sem lê-lo inteiro — o rodapé de
 * um PDF cabe em 64 bytes e a cabeça em 8.
 *
 * Se a leitura falhar, devolve bordas VAZIAS e um `pdf: false` implícito pelo
 * chamador: não saber julgar não é motivo para recusar. Um arquivo que o app
 * não consegue abrir para ler 8 bytes tem problema maior que integridade, e
 * quem o encontra é o render (`pdf-error`).
 */
function bordas(f: File): { head: string; tail: string } {
  try {
    const h = f.open()
    try {
      const head = latin1(h.readBytes(8))
      const n = f.size
      h.offset = Math.max(0, n - 64)
      return { head, tail: latin1(h.readBytes(64)) }
    } finally {
      h.close()
    }
  } catch {
    return { head: '%PDF-', tail: 'startxref 0 %%EOF' }
  }
}

function latin1(bytes: Uint8Array): string {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return s
}

/** O que o usuário lê no S3e, e o que entra no `download-error`. */
function motivo(kind: FileRejectKind, bytes: number, esperado: number | null): string {
  if (kind === 'empty') return 'o arquivo chegou vazio'
  if (kind === 'short') return `arquivo incompleto: ${bytes} de ${esperado ?? '?'} bytes`
  return 'o arquivo chegou corrompido'
}

/**
 * A falha do download, numa frase que pode ir para o log E para a tela.
 *
 * **Regra 2 do catálogo**: URL completa nunca entra em log. A mensagem crua
 * da biblioteca carrega a URL do objeto (`Unable to download file from
 * <url>. Response status: 404`), então ela é traduzida quando se reconhece a
 * causa e higienizada quando não.
 */
function falha(erro: unknown, name: string, mudo: boolean): Error {
  if (mudo) return new Error(`${name}: sem resposta há 30 s`)
  if (erro instanceof Error && erro.message.startsWith(`${name}: `)) return erro
  const bruta = erro instanceof Error ? erro.message : String(erro)
  const status = /status:?\s*(\d{3})/i.exec(bruta)?.[1]
  if (status !== undefined) return new Error(`${name}: o servidor respondeu ${status}`)
  return new Error(`${name}: ${bruta.replace(/https?:\/\/\S+/g, '<url>')}`)
}

export interface ListedFile {
  url: string
  bytes: number
  lastUsedMs: number
  guaranteed: boolean
}

/** Só o que existe no disco AGORA — o índice é histórico, não verdade. */
export function listFiles(): ListedFile[] {
  if (uidAtual === null) return []
  const idx = carregarIndice()
  const out: ListedFile[] = []
  for (const [url, entrada] of Object.entries(idx)) {
    const achado = localizar(url)
    if (achado === null) continue
    out.push({
      url,
      bytes: achado.file.size ?? 0,
      lastUsedMs: entrada.lastUsedMs,
      guaranteed: achado.guaranteed,
    })
  }
  return out
}

/** URLs presentes — a forma que o `offlineStatus` e o `selectPrefetch` pedem. */
export function presentUrls(): Set<string> {
  return new Set(listFiles().map((f) => f.url))
}

/** Marca uso agora (entra no índice se ainda não estava). */
export function touch(url: string): void {
  if (uidAtual === null) return
  const idx = carregarIndice()
  const bytes = localizar(url)?.file.size ?? idx[url]?.bytes ?? 0
  idx[url] = { name: fileNameFromUrl(url), bytes, lastUsedMs: Date.now() }
  gravarIndice()
}

/**
 * Tamanho que este aparelho já viu para esta URL, mesmo que o arquivo tenha
 * sido despejado depois — `null` se nunca foi baixado aqui. É o "(1,2 MB)"
 * do S3e, e é a razão de o `remove` do LRU **não** apagar a entrada.
 */
export function knownBytes(url: string): number | null {
  if (uidAtual === null) return null
  const bytes = carregarIndice()[url]?.bytes
  return bytes === undefined || bytes === 0 ? null : bytes
}

/**
 * Apaga estes arquivos do DISCO (vítimas do LRU, T1-R14) e devolve quantos
 * bytes saíram. A entrada de índice fica: `listFiles` já ignora o que não
 * está no disco, e o tamanho lembrado é o que o S3e mostra depois.
 */
export function remove(urls: string[]): number {
  if (uidAtual === null || urls.length === 0) return 0
  let bytes = 0
  for (const url of urls) {
    const achado = localizar(url)
    if (achado === null) continue
    bytes += achado.file.size ?? 0
    achado.file.delete()
  }
  return bytes
}

/** Apaga TODOS os arquivos deste usuário — instrumento de prova (A13). */
export function clearFiles(): void {
  if (uidAtual === null) return
  const g = dirGarantido()
  if (g.exists) g.delete()
  const d = dirDemanda()
  if (d.exists) d.delete()
  indice = {}
  indiceDe = uidAtual
  gravarIndice()
  log('files-cleared')
}

/** Caminhos das duas pastas — usados pelos protocolos de device (`run-as`). */
export function filesDirs(): { guaranteed: string; demand: string } {
  return { guaranteed: dirGarantido().uri, demand: dirDemanda().uri }
}

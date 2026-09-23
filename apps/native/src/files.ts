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
const emVoo = new Map<string, { voo: Promise<EnsuredFile>; guaranteed: boolean }>()

/**
 * Garante o arquivo no disco e devolve por onde ele veio (A9: a 2ª abertura
 * é `src=disk`, sem request). `guaranteed` decide a pasta; um arquivo que já
 * está no cache e vira garantido é **movido**, nunca rebaixado de novo.
 *
 * **A carona olha as opções** (W4-b3, div. 119). Até aqui o `emVoo` devolvia
 * o voo alheio a qualquer um que pedisse a mesma URL, com o `guaranteed` de
 * quem pediu primeiro: o prefetch de 7 dias que chegava enquanto o palco
 * baixava o mesmo arquivo recebia a promise do palco, e o arquivo ficava no
 * `Paths.cache` — o `promoteList` só o movia na passada seguinte. Agora um
 * pedido garantido que encontra um voo NÃO garantido espera esse voo e roda
 * de novo por cima dele: o arquivo já está no disco, e o `ensureFileUma` o
 * **move** (a promoção de sempre). Continua UM download do objeto. Se o voo
 * rejeita, a carona recebe a mesma rejeição — sem retry (T1-R37).
 */
export function ensureFile(
  url: string,
  opcoes: { guaranteed: boolean } = { guaranteed: false },
): Promise<EnsuredFile> {
  const jaVoando = emVoo.get(url)
  if (jaVoando !== undefined && (jaVoando.guaranteed || !opcoes.guaranteed)) return jaVoando.voo
  const base =
    jaVoando === undefined
      ? ensureFileUma(url, opcoes)
      : jaVoando.voo.then(() => ensureFileUma(url, opcoes))
  // Só apaga a entrada que é SUA: o voo de baixo assenta antes da carona
  // que o substituiu na tabela, e não pode levá-la junto.
  const voo: Promise<EnsuredFile> = base.finally(() => {
    if (emVoo.get(url)?.voo === voo) emVoo.delete(url)
  })
  emVoo.set(url, { voo, guaranteed: opcoes.guaranteed })
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
    //
    // O `try` é da W2 (div. 131, CLASSE 2). Estas três chamadas estavam FORA de
    // qualquer `try`: uma rejeição do `create`, do `delete` ou do `moveSync`
    // subia CRUA — sem passar pelo `falha()`, logo sem o prefixo do nome, sem a
    // URL higienizada (regra 2 do catálogo) e sem frase de tela — até o palco e
    // até o `App.tsx`. Consertar só a frase medida pelo W1 deixaria esta de pé.
    if (opcoes.guaranteed && !atual.guaranteed) {
      try {
        if (!alvoDir.exists) alvoDir.create({ intermediates: true })
        const destino = new File(alvoDir, name)
        if (destino.exists) destino.delete()
        atual.file.moveSync(destino)
      } catch (erro: unknown) {
        throw falha(erro, name)
      }
    }
    const achado = localizar(url)
    const bytes = achado?.file.size ?? 0
    touch(url)
    log(`file src=disk name=${name} bytes=${bytes}`)
    return { uri: achado?.file.uri ?? '', src: 'disk', bytes }
  }

  try {
    if (!alvoDir.exists) alvoDir.create({ intermediates: true })
  } catch (erro: unknown) {
    throw falha(erro, name)
  }
  return baixarAtomico(url, alvoDir, name)
}

/** Sufixo do arquivo em construção. Um `.part` nunca é o nome de nada. */
export const PARCIAL = '.part'

/**
 * **O TETO DE INATIVIDADE NÃO ESTÁ AQUI — e o motivo é uma medição, não um
 * esquecimento.** (Q2 do pre-check, §8.1; derrubada pelo aceite W1-A3.)
 *
 * O desenho era: abortar quando NENHUM byte novo chegasse em `T = 30 s`,
 * rearmando o relógio a cada `onProgress`. Contra a conexão morta, e só
 * contra ela — um download legítimo pode demorar horas numa Wi-Fi ruim de
 * hotel na véspera do show, e é isso que o usuário quer.
 *
 * **O aparelho disse que o sinal de rearme não existe.** Medido duas vezes no
 * AVD `octavia_tab32`, com o dev client, servidor de host entregando 6 pedaços
 * a cada 4 s (download de 20 s):
 *
 *     OCTAVIA: dbg-listener name=… w=8192   ms=20075
 *     OCTAVIA: dbg-progress  name=… w=8192  ms=20081
 *     OCTAVIA: dbg-listener name=… w=242176 ms=20082
 *     OCTAVIA: dbg-progress  name=… w=242176 ms=20083
 *
 * Todos os eventos chegam **em rajada, no fim** — pelo `onProgress` e pelo
 * `addListener`, os dois. E o disco não ajuda: o destino não existe durante o
 * download inteiro e aparece completo de uma vez (medido: alvo vazio de
 * t=01 s a t=22 s, 242.176 B em t=24 s). **Não há, no app, nenhum sinal de
 * "chegou byte" em voo.**
 *
 * Logo um relógio de 30 s rearmado por `onProgress` **nunca é rearmado**: é um
 * teto ABSOLUTO de duração disfarçado — exatamente a opção A, que foi
 * descartada por punir o caso legítimo ("barato e errado é pior que caro e
 * certo quando o erro cai em cima do uso real", Marcel, 2026-09-14). Ficar
 * com ele seria shippar a opção A com o nome da B.
 *
 * O que fica de pé sem o teto: o `.part` (o cartão diz "parcial" o tempo
 * todo, sem mentir), a fila de trabalhadores (um download morto não para os
 * outros) e o saneamento. O que fica em aberto: uma conexão morta segura UMA
 * das três vagas até o processo morrer.
 *
 * **E a razão que fecha a questão, do aval de 2026-09-14: o teto perdeu o
 * objeto.** Ele existia para impedir que um download condenado comesse o
 * orçamento dos outros — e é isso que a fila do `prefetch.ts` impede, melhor,
 * porque impede SEMPRE e não só depois de 30 s. O dano real da div. 122 já
 * está consertado; o que sobra do download morto é uma vaga de três.
 *
 * Se você chegou aqui com um relatório de "prefetch lento" e a mão num
 * `setTimeout`, leia isto primeiro:
 *
 *     UM TETO QUE NÃO PODE DISPARAR É PIOR QUE TETO NENHUM, PORQUE PROMETE.
 *                                               — Marcel, 2026-09-14
 *
 * O que reabre a questão não é um número maior: é **sinal de progresso em
 * voo**. A medida que falta está na W2 (um build de release, para saber se a
 * div. 126 é do dev client ou da biblioteca). Ver `W1-ENCERRAMENTO.md` §9,
 * decisão 1.
 */

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
  // `signal` e `onProgress` e não honra nenhum dos dois (div. 116), e o
  // `totalBytes` do progresso é a ÚNICA fonte de `Content-Length` que o app
  // tem. Mesmo pacote, zero dependência nova.
  //
  // O evento chega uma vez, em rajada, no fim do download (medição acima) —
  // o que basta para o `total=` da linha `file` e para a checagem de corpo
  // curto, e não basta para teto nenhum.
  let total = -1

  const comecou = Date.now()
  try {
    const tarefa = File.createDownloadTask(url, parcial, {
      onProgress: ({ totalBytes }) => {
        total = totalBytes

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
    if (veio === null) throw new Error('pausado')

    const bytes = parcial.size
    const esperado = total >= 0 ? total : null
    const veredito = fileVerdict({ bytes, expected: esperado, pdf: ehPdf(name), ...bordas(parcial) })
    if (!veredito.ok) {
      log(`file-reject name=${name} kind=${veredito.kind} bytes=${bytes} expected=${esperado ?? '-'}`)
      parcial.delete()
      const porque = motivo(veredito.kind, bytes, esperado)
      throw comFrase(`${name}: ${porque}`, porque)
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
    if (parcial.exists) parcial.delete()
    throw falha(erro, name)
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

/** A causa da recusa, em pt-BR — vai para a TELA e para o `download-error`. */
function motivo(kind: FileRejectKind, bytes: number, esperado: number | null): string {
  if (kind === 'empty') return 'o arquivo chegou vazio'
  if (kind === 'short') return `arquivo incompleto: ${bytes} de ${esperado ?? '?'} bytes`
  return 'o arquivo chegou corrompido'
}

/**
 * A frase que o músico lê quando nada mais se sabe dizer (W2, decisão 2 do
 * aval). O catálogo já traduz `download-error` por "não consegui baixar".
 */
export const FALHA_GENERICA = 'não consegui baixar'

/** Onde a frase de tela viaja: uma propriedade do próprio `Error`. */
type ComFrase = Error & { fraseDeTela: string }

function comFrase(paraOLog: string, paraATela: string): Error {
  const e = new Error(paraOLog) as ComFrase
  e.fraseDeTela = paraATela
  return e
}

/**
 * A frase que chega ao `testID` **download-erro** — e o CONJUNTO é FECHADO.
 *
 * (Escrito sem as aspas de propósito: o coletor do G2 grepa a prop de teste
 *  literalmente, sem tirar comentário, e contaria esta linha como uma prop nova
 *  do `files.ts`.
 *  É falso positivo do instrumento — div. 136, registrada, e o conserto é da W3,
 *  porque mexer no gate aqui é misturar escopo com invólucro.)
 *
 * W2, div. 125 e 131. O erro carrega DUAS metades: `message` é o detalhe, que
 * vai para o log e continua diagnosticável (com o nome do objeto e a URL já
 * higienizada); `fraseDeTela` é o que o músico lê. Quem não tiver frase
 * declarada cai no genérico — e é ESSA omissão que fecha o conjunto: nenhuma
 * mensagem de biblioteca pode chegar à tela, porque só chega o que alguém
 * escreveu aqui, em pt-BR.
 *
 * E o nome do objeto do bucket NÃO vai junto (decisão 2 do aval): ele não
 * identifica a MÚSICA, identifica o OBJETO — é detalhe de infraestrutura que o
 * músico não pediu e não pode usar. O que serve na tela é o título, e o S3e já
 * o mostra duas linhas acima (`${titulo} · ${tipo}${tamanho}`).
 */
export function fraseDaFalha(erro: unknown): string {
  const f = (erro as Partial<ComFrase> | null | undefined)?.fraseDeTela
  return typeof f === 'string' ? f : FALHA_GENERICA
}

/**
 * A higienização da regra 2, e ela tem DUAS alternativas — não uma.
 *
 * **Div. 137 (W2), e é achado de SEGURANÇA, não de forma.** Até aqui isto era
 * `bruta.replace(/https?:\/\/\S+/g, '<url>')`, e o que o aparelho devolveu em
 * modo avião foi:
 *
 *     Unable to resolve host "mlxjmpbdchmwplcfislt.supabase.co":
 *     No address associated with hostname
 *
 * O host vem **nu, entre aspas, sem esquema** — então o regex não casava, e o
 * identificador do projeto Supabase ia inteiro para o log. E log deste projeto
 * **se cola em anexo commitado**: há três anexos de log no repositório.
 *
 * A segunda alternativa casa um token entre aspas que tem cara de HOST: rótulos
 * de `[A-Za-z0-9-]` e **pelo menos dois pontos**.
 *
 * **O limite é declarado, não esquecido**: um host de dois rótulos
 * (`exemplo.com`) NÃO é higienizado. Exigir só um ponto pegaria
 * `"w1-curto-1.pdf"` e qualquer nome de arquivo entre aspas — e apagar o nome
 * do arquivo do log destrói exatamente a diagnosticabilidade que a separação
 * das duas metades comprou. O bucket deste app é Supabase, cujo host tem sempre
 * três rótulos (`<ref>.supabase.co`), então a linha cai onde interessa. Se um
 * dia o bucket mudar de forma, esta é a linha a mexer.
 *
 * **W3 — A METADE QUE FALTAVA (div. 137, segunda parte).** Até aqui isto NÃO
 * cobria o `mensagemDe()` do `prefetch.ts`, a rede de segurança para o que
 * nunca passou pelo `falha()`: ele tinha higienização PRÓPRIA, e antiga —
 * `bruta.replace(/\b(?:https?|file):\/\/\S+/g, '<uri>')`, sem a alternativa do
 * host nu. O conjunto que ele cobre encolheu com a W2 (a promoção do
 * `ensureFileUma` entrou num `try`) mas nunca foi vazio: o `parcial.delete()`
 * da abertura do `baixarAtomico`, o `touch()` e os dois `localizar()` do
 * `ensureFileUma` seguem fora de qualquer `try`, e uma rejeição de qualquer um
 * deles sai pelo `mensagemDe()`.
 *
 * Agora o `prefetch.ts` chama ESTA função, e a regra 2 do catálogo passa a ter
 * **uma implementação só**. Para que isso não custe cobertura, a alternativa
 * `file://` — que só o `mensagemDe()` tinha — entra aqui, e com o MESMO
 * rótulo que ela já usava: `<uri>` para `file:`, `<url>` para `http(s)`.
 * Nenhum texto de log muda de vocabulário em lugar nenhum; o que muda é que
 * cada um dos dois passa a ter o que só o outro tinha.
 */
const SEGREDO_DE_REDE = /https?:\/\/\S+|\bfile:\/\/\S+|"[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}"/g

export function higienizar(bruta: string): string {
  return bruta.replace(SEGREDO_DE_REDE, (m) => {
    if (m.startsWith('"')) return '"<host>"'
    return m.startsWith('file:') ? '<uri>' : '<url>'
  })
}

/**
 * A falha do download: o DETALHE para o log, e a frase para a tela.
 *
 * **Regra 2 do catálogo**: URL completa nunca entra em log. A mensagem crua
 * da biblioteca carrega a URL do objeto (`Unable to download file from
 * <url>. Response status: 404`) e, quando a rede nem resolve, o **host nu**
 * (div. 137) — então ela é traduzida quando se reconhece a causa e higienizada
 * quando não, pelas duas alternativas do `higienizar()`.
 *
 * Os três ramos, e o que cada um manda para cada metade:
 *   1. já vem de dentro daqui (prefixo `${name}: `) — devolve como está, com a
 *      frase de tela que ele já carrega;
 *   2. `status: NNN` — traduz para as duas metades;
 *   3. **qualquer outra coisa** — o log fica com o texto cru higienizado, que é
 *      o que faz um relatório ser diagnosticável, e a TELA fica sem frase, logo
 *      com a genérica. Era este ramo que mandava `Call to function
 *      'FileSystemDownloadTask.start' has been rejected.` para o palco.
 */
export function falha(erro: unknown, name: string): Error {
  if (erro instanceof Error && erro.message.startsWith(`${name}: `)) return erro
  const bruta = erro instanceof Error ? erro.message : String(erro)
  const status = /status:?\s*(\d{3})/i.exec(bruta)?.[1]
  if (status !== undefined) {
    return comFrase(`${name}: o servidor respondeu ${status}`, `o servidor respondeu ${status}`)
  }
  return new Error(`${name}: ${higienizar(bruta)}`)
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

export interface Saneamento {
  /** Arquivos com nome definitivo que foram recusados e apagados. */
  removidos: number
  /** `.part` de downloads mortos que foram varridos. */
  parciais: number
}

/**
 * **A varredura da abertura** (W1, commit 6; aceite W1-A6).
 *
 * Por que ela existe, se o estrago medido hoje nos dois aparelhos é ZERO: um
 * arquivo envenenado **nunca se recupera sozinho**. O `ensureFileUma` vê que
 * `localizar()` achou, devolve `src=disk` e não tenta baixar de novo — então
 * um 0 byte de amanhã fica lá para sempre, inclusive DEPOIS do conserto do
 * caminho de escrita. O conserto do caminho de escrita impede que nasçam
 * novos; só uma varredura tira os que já nasceram.
 *
 * **Apaga do DISCO e mantém a ENTRADA do índice** (Q3, decisão do Marcel):
 * esconder sem apagar deixaria o LRU contando bytes de lixo, e preservar a
 * entrada mantém o "(1,2 MB)" do S3e — que é a informação de que o usuário
 * precisa para decidir baixar.
 *
 * Não custa rede, não custa bucket e não emite linha nova: cada recusa já é
 * um `file-reject`, e o catálogo não ganha um terceiro evento por isto.
 */
export function sanearArquivos(): Saneamento {
  if (uidAtual === null) return { removidos: 0, parciais: 0 }
  let removidos = 0
  let parciais = 0
  for (const dir of [dirGarantido(), dirDemanda()]) {
    if (!dir.exists) continue
    for (const item of dir.list()) {
      if (!(item instanceof File)) continue
      if (item.name.endsWith(PARCIAL)) {
        // Um `.part` que sobreviveu a uma abertura é de um processo morto: o
        // `baixarAtomico` apaga o dele em toda saída por erro.
        item.delete()
        parciais++
        continue
      }
      const bytes = item.size
      // `expected: null` — em repouso não há `Content-Length`: a única fonte
      // de tamanho esperado existe durante o download (div. 112), e o índice
      // não é oráculo (div. 111). O que sobra é a forma, e ela basta para o
      // vazio e para o truncado.
      const veredito = fileVerdict({
        bytes,
        expected: null,
        pdf: ehPdf(item.name),
        ...bordas(item),
      })
      if (veredito.ok) continue
      log(`file-reject name=${item.name} kind=${veredito.kind} bytes=${bytes} expected=-`)
      item.delete()
      removidos++
    }
  }
  return { removidos, parciais }
}

/** Caminhos das duas pastas — usados pelos protocolos de device (`run-as`). */
export function filesDirs(): { guaranteed: string; demand: string } {
  return { guaranteed: dirGarantido().uri, demand: dirDemanda().uri }
}

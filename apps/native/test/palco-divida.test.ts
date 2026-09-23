/**
 * **W4-b3 — a dívida do palco**: a div. 119 (o `emVoo`) e o estouro do
 * `lruEvict`. Escrito ANTES do conserto e commitado reprovando (o gate vem
 * antes do que ele mede).
 *
 * O registro de cada uma, verbatim:
 *
 * - **div. 119** (`W1-PRECHECK.md:865`, origem A): "O `emVoo` deduplica por
 *   URL e ignora as opções (`files.ts:151-167`): quem pede um arquivo já em
 *   voo recebe a promise alheia, com o `guaranteed` do outro. Efeitos: (a) o
 *   palco herda a promise do prefetch e, se ela não assenta, fica em
 *   `buscando` sem alcançar o `catch` do `download-error`; (b) um pedido
 *   `guaranteed:true` que pega carona num voo `false` grava no purgável — o
 *   `promoteList` conserta na passada seguinte, não nessa".
 * - **o estouro** (`W1-PRECHECK.md:469`): "`lruEvict` devolve o `bytesAfter`
 *   real estourado e **`prefetch.ts:167-170` o ignora** | **continua
 *   ignorado.** Buraco que já existe, e que esta PR não abre nem fecha —
 *   registro para o N2". Hoje a linha é `prefetch.ts:267`.
 *
 * O efeito (a) NÃO tem CN reprovando, e o motivo é medido aqui: o palco que
 * pega carona num voo que REJEITA recebe a rejeição — alcança o `catch`. O
 * que "não assenta" é um download sem teto, e o voo próprio do palco também
 * não assentaria: é a div. 126 (o teto de inatividade morto pelo aparelho),
 * não o `emVoo`. O teste do (a) é controle, e passa antes e depois.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __existe, __iniciados, __plantarGrande, __reset, __responder } from './fake-expo-file-system'
import { BUCKET, amanha, content, pdfBom, setlist, song } from './ajuda'
import { ensureFile, filesDirs, listFiles, setFilesUser, touch } from '../src/files'
import { CAP_BYTES, aplicarLru } from '../src/prefetch'

let n = 0
let linhas: string[] = []
let NOME = ''
let URL_A = ''

beforeEach(() => {
  __reset()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-23T12:00:00Z'))
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  n++
  // Um nome por teste: o `emVoo` é estado de MÓDULO indexado por URL.
  NOME = `1786219${n}-partitura.pdf`
  URL_A = `${BUCKET}/${NOME}`
  setFilesUser(`w4b3-${n}`)
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  setFilesUser(null)
})

function octavia(prefixo: string): string[] {
  return linhas.filter((l) => l.startsWith(`OCTAVIA: ${prefixo}`))
}

/** Um download que leva 2 s: dá tempo de o segundo pedido chegar em voo. */
function lento(): void {
  __responder(URL_A, { corpo: pdfBom(1000), pedacos: 2, atrasoMs: 1_000 })
}

describe('div. 119 (b) — carona `guaranteed:true` num voo `false`', () => {
  it('CN: o pedido garantido termina com o arquivo no NÃO-purgável, sem segundo download', async () => {
    lento()
    const palco = ensureFile(URL_A) // o palco: guaranteed:false
    const garantido = ensureFile(URL_A, { guaranteed: true }) // o prefetch de 7 dias
    await vi.advanceTimersByTimeAsync(5_000)
    await Promise.all([palco, garantido])

    // Hoje: o segundo pedido recebe a promise do primeiro e o arquivo fica
    // em `Paths.cache` — o Android pode apagá-lo na véspera do show.
    expect(__existe(`${filesDirs().guaranteed}/${NOME}`)).toBe(true)
    expect(__existe(`${filesDirs().demand}/${NOME}`)).toBe(false)
    expect(listFiles().find((f) => f.url === URL_A)?.guaranteed).toBe(true)
    // A razão de ser do `emVoo` fica de pé: UM download do objeto.
    expect(__iniciados()).toEqual([NOME])
  })

  it('controle: dois pedidos `false` seguem sendo UM download e a mesma promise', async () => {
    lento()
    const a = ensureFile(URL_A)
    const b = ensureFile(URL_A)
    expect(b).toBe(a)
    await vi.advanceTimersByTimeAsync(5_000)
    await Promise.all([a, b])
    expect(__iniciados()).toEqual([NOME])
    expect(__existe(`${filesDirs().demand}/${NOME}`)).toBe(true)
  })

  it('controle: carona `false` num voo garantido fica no garantido (nunca rebaixa)', async () => {
    lento()
    const g = ensureFile(URL_A, { guaranteed: true })
    const p = ensureFile(URL_A)
    await vi.advanceTimersByTimeAsync(5_000)
    await Promise.all([g, p])
    expect(__existe(`${filesDirs().guaranteed}/${NOME}`)).toBe(true)
    expect(__iniciados()).toEqual([NOME])
  })

  it('controle: carona garantida num voo que REJEITA recebe a rejeição (sem retry)', async () => {
    __responder(URL_A, { corpo: '', status: 500 })
    const palco = ensureFile(URL_A)
    const garantido = ensureFile(URL_A, { guaranteed: true })
    await expect(palco).rejects.toThrow()
    await expect(garantido).rejects.toThrow()
    expect(__iniciados()).toEqual([])
  })
})

describe('div. 119 (a) — o palco que pega carona no voo do prefetch', () => {
  it('controle (passa hoje): voo alheio que rejeita chega ao `catch` do palco', async () => {
    __responder(URL_A, { corpo: pdfBom(1000), status: 500 })
    const prefetch = ensureFile(URL_A, { guaranteed: true })
    const palco = ensureFile(URL_A)
    await expect(prefetch).rejects.toThrow('500')
    // O que o registro diz que não acontece: o palco recebe a rejeição.
    await expect(palco).rejects.toThrow('500')
  })
})

describe('o estouro do `lruEvict` — `bytesAfter` acima do teto', () => {
  /** `n` arquivos garantidos (setlist de amanhã), cada um de `bytes`. */
  function garantidos(qtd: number, bytes: number) {
    const contents = []
    const songs = []
    for (let i = 1; i <= qtd; i++) {
      const nome = `1786219${n}-grande-${i}.pdf`
      const url = `${BUCKET}/${nome}`
      __plantarGrande(`${filesDirs().guaranteed}/${nome}`, pdfBom(400), bytes)
      touch(url)
      contents.push(content(`g${i}`, url))
      songs.push(song(`sg${i}`, i, `g${i}`))
    }
    return {
      setlists: [setlist('sl-g', songs, amanha())],
      contentById: new Map(contents.map((c) => [c.id, c])),
    }
  }

  it('CN: os protegidos sozinhos passam do teto — o estouro aparece numa linha', () => {
    // 3 × 80 MB = 240 MB garantidos contra o teto de 200 MB, mais um de 10 MB
    // sob demanda, que o LRU despeja. Depois do despejo, 240 MB > 200 MB.
    const MB = 1024 * 1024
    const { setlists, contentById } = garantidos(3, 80 * MB)
    const avulso = `${BUCKET}/1786219${n}-avulso.pdf`
    __plantarGrande(`${filesDirs().demand}/1786219${n}-avulso.pdf`, pdfBom(400), 10 * MB)
    vi.advanceTimersByTime(1_000)
    touch(avulso)

    aplicarLru(setlists, contentById)

    expect(octavia('lru evict')).toEqual([`OCTAVIA: lru evict n=1 bytes=${10 * MB}`])
    // Hoje o `bytesAfter` é descartado: nenhuma linha diz que o teto furou.
    expect(octavia('lru over')).toEqual([
      `OCTAVIA: lru over bytes=${240 * MB} cap=${CAP_BYTES} protected=3`,
    ])
  })

  it('controle: abaixo do teto, nenhuma linha de estouro', () => {
    const { setlists, contentById } = garantidos(2, 50 * 1024 * 1024)
    aplicarLru(setlists, contentById)
    expect(octavia('lru')).toEqual([])
  })

  it('controle: acima do teto, mas o despejo resolve — sem linha de estouro', () => {
    const MB = 1024 * 1024
    const { setlists, contentById } = garantidos(2, 90 * MB)
    const avulso = `${BUCKET}/1786219${n}-avulso.pdf`
    __plantarGrande(`${filesDirs().demand}/1786219${n}-avulso.pdf`, pdfBom(400), 30 * MB)
    touch(avulso)
    aplicarLru(setlists, contentById)
    expect(octavia('lru evict')).toEqual([`OCTAVIA: lru evict n=1 bytes=${30 * MB}`])
    expect(octavia('lru over')).toEqual([])
  })
})

/**
 * N4-PR7 — **N4-D92 (div. 1066): o estado do arquivo depois de um plano de prefetch rodado SEM REDE.** Vem antes do
 * conserto (regra 30): contra a `main` (`5c707a3`) este arquivo reprova — o `files.ts` não tem a sonda de rede, e a
 * rejeição de um download sem rede entra no estado como falha (`falhas.set(url, fraseDaFalha(erro))`): a música
 * aparece na L como *não consegui baixar*, quando o certo, sem rede, é *arquivo não baixado*.
 *
 * O que a N4-PR5 mediu (`N4-PR5-anexos/README.md` §10.4): sem rede o `prefetchEArrumar` roda depois do sync pulado
 * (`App.tsx`), o plano tenta cada arquivo que falta e o download rejeita; no aparelho a mensagem não traz status
 * (*"Call to function 'FileSystemDownloadTask.start' has been rejected."* — a mesma de um 404, div. 1063), então a
 * frase não distingue. Quem distingue é a REDE na hora da rejeição.
 *
 * O duplo do `expo-file-system` responde 404 à URL (a rejeição); a sonda de rede é a que a raiz liga (`estaOnline`),
 * aqui uma função. O log não muda: o `download-error` sai igual com e sem rede.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { estadoDoArquivo, type ContentDTO } from '@octavia/core'
import { __reset, __responder } from './fake-expo-file-system'
import { BUCKET, content, pdfBom } from './ajuda'
import { estadoDosDownloads, ligarSondaDeRede, setFilesUser } from '../src/files'
import { prefetchDaBiblioteca } from '../src/prefetch'

let n = 0
let linhas: string[] = []

beforeEach(() => {
  __reset()
  linhas = []
  vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    linhas.push(args.map(String).join(' '))
  })
  n++
  setFilesUser(`n4pr7-sem-rede-${n}`)
})

afterEach(() => {
  vi.restoreAllMocks()
  ligarSondaDeRede(async () => true)
  setFilesUser(null)
})

const url = (s: string) => `${BUCKET}/1786270${n}-${s}.pdf`

function umaPartitura(s: string): { c: ContentDTO; contentById: Map<string, ContentDTO> } {
  const c = { ...content(s, url(s)), title: `Partitura ${s}` }
  return { c, contentById: new Map([[c.id, c]]) }
}

describe('N4-D92 — sem rede, um plano que rejeita não faz a música aparecer como "não consegui baixar"', () => {
  it('sem rede: o estado é *arquivo não baixado* (`nao-baixado`), não `falhou`', async () => {
    const { c, contentById } = umaPartitura('a')
    __responder(url('a'), { corpo: '', status: 404 })
    ligarSondaDeRede(async () => false)
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDosDownloads().falhas.has(url('a'))).toBe(false)
    expect(estadoDoArquivo(c, new Set(), estadoDosDownloads())).toEqual({ tipo: 'nao-baixado' })
  })

  it('o log não muda: o `download-error` sai com e sem rede', async () => {
    const { contentById } = umaPartitura('b')
    __responder(url('b'), { corpo: '', status: 404 })
    ligarSondaDeRede(async () => false)
    await prefetchDaBiblioteca([], contentById)
    expect(linhas.filter((l) => l.startsWith('OCTAVIA: download-error'))).toHaveLength(1)
  })

  it('sem rede, a falha antiga da URL sai (o estado volta a "não baixado")', async () => {
    const { c, contentById } = umaPartitura('c')
    __responder(url('c'), { corpo: '', status: 404 })
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDoArquivo(c, new Set(), estadoDosDownloads()).tipo).toBe('falhou')
    ligarSondaDeRede(async () => false)
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDoArquivo(c, new Set(), estadoDosDownloads())).toEqual({ tipo: 'nao-baixado' })
  })

  it('controle — COM rede, o 404 continua sendo `falhou`, com a frase do conjunto fechado', async () => {
    const { c, contentById } = umaPartitura('d')
    __responder(url('d'), { corpo: '', status: 404 })
    ligarSondaDeRede(async () => true)
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDoArquivo(c, new Set(), estadoDosDownloads())).toEqual({ tipo: 'falhou', motivo: 'o servidor respondeu 404' })
  })

  it('controle — a sonda que falha conta como "com rede" (o comportamento de antes)', async () => {
    const { c, contentById } = umaPartitura('e')
    __responder(url('e'), { corpo: '', status: 404 })
    ligarSondaDeRede(async () => {
      throw new Error('sem módulo')
    })
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDoArquivo(c, new Set(), estadoDosDownloads()).tipo).toBe('falhou')
  })

  it('controle — com rede e o arquivo bom, baixa e o estado é `baixado` (nada mudou no caminho feliz)', async () => {
    const { c, contentById } = umaPartitura('f')
    __responder(url('f'), { corpo: pdfBom(500) })
    await prefetchDaBiblioteca([], contentById)
    expect(estadoDosDownloads().falhas.has(url('f'))).toBe(false)
    expect(estadoDoArquivo(c, new Set([url('f')]), estadoDosDownloads())).toEqual({ tipo: 'baixado' })
  })
})

/**
 * SY-PR2, commit 3 — A ORDEM DAS LINHAS DE UM SYNC, antes e depois da aplicação síncrona (SY-D26; A6.3: "a ordem das
 * linhas de log (`cache write` × 2, depois `sync ok`) não muda"). Instrumento de anexo (fora de CI, N4-D117).
 *
 * Roda o EXECUTOR de verdade (`rodarSync`) contra o `aceite.py` em três syncs — o primeiro (sem cache), um sem mudança
 * e um com uma música mudada no servidor — e imprime, de cada um, as linhas `OCTAVIA:` na ordem, com a marca de onde a
 * raiz recebeu os dados (`[setDados]`) e de onde o `dadosRef` mudou (`[dadosRef]`), lidos pela raiz de mentira do arnês
 * dos gates, e a FRONTEIRA: uma microtarefa agendada na própria linha `sync ok`. Antes do commit 3, as duas marcas saem
 * DEPOIS da fronteira (o executor só aplica numa microtarefa depois de o `sincronizar` devolver: a janela da A6.1);
 * depois, ANTES dela, no mesmo bloco síncrono que leu as confirmadas e gravou o disco — e as linhas, em si, idênticas.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, it, vi } from 'vitest'
import { __reset } from '../../../../../apps/native/test/fake-expo-file-system'
import { Mock, portaLivre } from '../../../../../apps/native/test/mock'
import { Arnes, SEM_DADOS, musica, setlistCom } from '../../../../../apps/native/test/sy-arnes'

vi.mock('../../../../../apps/native/src/session', () => ({ signOutSession: async () => undefined }))
vi.mock('../../../../../apps/native/src/firebase', () => ({ auth: { currentUser: { getIdToken: async () => 'token-sy-ordem' } } }))
// o `expo-network` é o duplo do projeto, por alias na configuração (a rede de pé)

const UID = 'sy-ordem'
const B1 = [musica(1), musica(2)]
const B2 = [musica(1), musica(2, { title: 'SY música 2, mudada', updated_at: '2026-09-02T00:00:00.000+00:00' })]
const SL = [setlistCom('cdcdcdcd-1111-4222-8333-444455556666', 'SY ordem', B1.map((c) => c.id))]
let mock: Mock
let dir = ''

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), 'sy-ordem-'))
  mock = new Mock(await portaLivre(), dir)
  process.env.EXPO_PUBLIC_API_BASE_URL = `http://127.0.0.1:${mock.porta}`
  ;(globalThis as { __DEV__?: boolean }).__DEV__ = false
  __reset()
})
afterAll(async () => {
  await mock.parar()
  rmSync(dir, { recursive: true, force: true })
})

describe('a ordem das linhas de um sync', () => {
  it('três syncs: o primeiro, sem mudança, com mudança', async () => {
    const S = await import('../../../../../apps/native/src/sincronizador')
    const a = new Arnes(UID)
    const saida: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...x: unknown[]) => {
      const l = x.map(String).join(' ')
      if (l.startsWith('OCTAVIA: ')) saida.push(`  ${l.slice('OCTAVIA: '.length).replace(/ ms=\d+| t=\d+/g, (m) => m.replace(/\d+/, '<ms>'))}`)
    })
    const setDados = a.raiz.setDados
    a.raiz.setDados = (d) => {
      saida.push('  [setDados]')
      setDados(d)
    }
    let ref = a.dadosRef.current
    const vigiar = (): void => {
      if (a.dadosRef.current !== ref) {
        ref = a.dadosRef.current
        saida.push('  [dadosRef]')
      }
    }
    // o `dadosRef` é um objeto simples: a marca dele sai quando o valor muda, conferido a cada linha e a cada setDados
    const logReal = console.log
    console.log = (...x: unknown[]) => {
      vigiar()
      logReal(...x)
      // a FRONTEIRA: a primeira microtarefa agendada na linha `sync ok` — o que roda antes dela está no mesmo bloco
      // síncrono do sync; o que o executor faz depois do `await sincronizar` só pode vir depois dela
      if (String(x[0]).startsWith('OCTAVIA: sync ok')) {
        queueMicrotask(() => {
          vigiar()
          saida.push('  ── a 1ª microtarefa depois do sync ok ──')
        })
      }
    }
    const prefetch = a.raiz.prefetchEArrumar
    a.raiz.prefetchEArrumar = async (s, c) => {
      vigiar()
      saida.push('  [prefetchEArrumar]')
      return prefetch(s, c)
    }
    for (const [rotulo, servidor, anterior] of [
      ['1) o primeiro sync, sem cache', B1, () => SEM_DADOS],
      ['2) sem mudança no servidor', B1, () => a.dadosRef.current],
      ['3) a música 2 mudada no servidor', B2, () => a.dadosRef.current],
    ] as const) {
      await mock.servir('normal', SL, servidor)
      saida.push(rotulo)
      await S.rodarSync(a.raiz, UID, anterior())
      vigiar()
    }
    console.info(`\n### ORDEM ###\n${saida.join('\n')}\n### FIM ###`)
  })
})

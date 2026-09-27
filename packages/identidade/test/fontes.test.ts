/**
 * I1-D31 — o mapa família + peso → `.ttf` do nativo cobre o pacote inteiro.
 *
 * O pacote guarda a fonte como família + peso; o nativo carrega arquivo, e o
 * `apps/native/src/fontes.ts` traduz. Uma fonte nova no pacote sem entrada no
 * mapa faria o `font` do nativo estourar no import — este teste o diz antes,
 * e diz também que todo nome do mapa é um dos `.ttf` que o `expo-font`
 * embarca (o `app.json`).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { font } from '../src/index'
import { arquivoTtf, ttfDe } from '../../../apps/native/src/fontes'

const APP_JSON = join(__dirname, '..', '..', '..', 'apps', 'native', 'app.json')
const embarcados = [...readFileSync(APP_JSON, 'utf8').matchAll(/\.\/assets\/fonts\/([A-Za-z0-9_]+)\.ttf/g)].map((m) => m[1])

describe('fontes.ts — família + peso → .ttf', () => {
  it('todo token de fonte do pacote tem entrada no mapa', () => {
    for (const [nome, f] of Object.entries(font)) {
      expect(arquivoTtf[f.familia][f.peso], `${nome}: ${f.familia} ${f.peso}`).toBeDefined()
    }
  })

  it('todo nome do mapa é um .ttf embarcado pelo app.json, e os seis estão lá', () => {
    const doMapa = Object.values(arquivoTtf).flatMap((pesos) => Object.values(pesos))
    expect(embarcados).toHaveLength(6)
    expect([...doMapa].sort()).toStrictEqual([...embarcados].sort())
  })

  it('família + peso sem arquivo falha com o nome do que falta', () => {
    expect(() => ttfDe({ familia: 'Raleway', peso: 400 })).toThrow('Raleway 400')
  })
})

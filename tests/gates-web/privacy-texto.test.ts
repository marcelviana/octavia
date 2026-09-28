/**
 * I1-PR-8 — CN de igualdade de texto da `/privacy-policy` (I1-D17 exceção, I1-D19: o texto não se traduz nem se
 * reescreve). O esperado é `docs/ux/I1-PR8-anexos/texto-antes.txt`, o `innerText` normalizado da página VELHA no
 * Chromium (`scripts/gates-web/privacy-texto-extrair.ts`): 22 linhas de texto + os `href` dos 2 `mailto:`.
 * O jsdom não tem `innerText`; a página é só blocos (`h1`, `h2`, `p`), um por linha no navegador — então a linha
 * aqui é o `textContent` de cada bloco, na ordem do DOM, com a mesma normalização (espaços colapsados).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PrivacyPolicyPage from '@/app/privacy-policy/page'

const ESPERADO = path.resolve(__dirname, '../../docs/ux/I1-PR8-anexos/texto-antes.txt')
const linhas = (s: string) => s.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)

describe('privacy-policy — o texto de antes, byte a byte', () => {
  const esperado = linhas(fs.readFileSync(ESPERADO, 'utf8'))
  // o RTL desmonta depois de cada `it`: cada um renderiza a página de novo
  const medir = () => {
    const { container } = render(createElement(PrivacyPolicyPage))
    const blocos = [...container.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li')].map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
    const mailtos = [...container.querySelectorAll('a[href^="mailto:"]')].map((a) => `mailto ${a.getAttribute('href')}`)
    return { container, blocos, mailtos }
  }

  it('o esperado tem 22 linhas de texto e 2 mailto', () => {
    expect(esperado.filter((l) => !l.startsWith('mailto ')).length).toBe(22)
    expect(esperado.filter((l) => l.startsWith('mailto ')).length).toBe(2)
  })
  it('o texto visível ≡ texto-antes.txt, linha a linha', () => {
    const { blocos } = medir()
    expect(blocos).toEqual(esperado.filter((l) => !l.startsWith('mailto ')))
  })
  it('nenhum texto fora dos blocos', () => {
    const { container, blocos } = medir()
    expect((container.textContent ?? '').replace(/\s+/g, '')).toBe(blocos.join('').replace(/\s+/g, ''))
  })
  it('os dois mailto: com o mesmo href', () => {
    const { mailtos } = medir()
    expect(mailtos).toEqual(esperado.filter((l) => l.startsWith('mailto ')))
  })
})

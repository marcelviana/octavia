/**
 * O aparato de teste de TELA (N2-PR3) — `react-dom` 19.2.3 do `apps/native`
 * sobre o `jsdom` da raiz, sem dependência nova.
 *
 * `act` vem do `react` (React 19 o exporta da raiz; o `react-test-renderer`
 * está deprecado e NÃO foi instalado). Cada helper devolve o que o DOM sabe
 * dizer: qual nó tem qual `data-testid`, o texto dele, se está inativo, e o
 * toque. A geometria não se mede aqui — ela é do dump do aparelho (§4).
 */
import { act, type ReactElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'

let raiz: Root | null = null
let no: HTMLDivElement | null = null

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

export async function montar(elemento: ReactElement): Promise<void> {
  desmontar()
  no = document.createElement('div')
  document.body.appendChild(no)
  const r = createRoot(no)
  raiz = r
  await act(async () => {
    r.render(elemento)
  })
}

/** Re-renderiza com props novas, sem desmontar (o pai que mudou de estado). */
export async function rerender(elemento: ReactElement): Promise<void> {
  const r = raiz
  if (r === null) throw new Error('rerender sem montar')
  await act(async () => {
    r.render(elemento)
  })
}

export function desmontar(): void {
  if (raiz !== null) {
    const r = raiz
    raiz = null
    act(() => {
      r.unmount()
    })
  }
  if (no !== null) {
    no.remove()
    no = null
  }
}

function doc(): HTMLElement {
  if (no === null) throw new Error('nada montado')
  return no
}

/** O nó com este `testID`, ou `null` — a pergunta que o G6 faz ao dump. */
export function achar(testID: string): HTMLElement | null {
  return doc().querySelector<HTMLElement>(`[data-testid="${testID}"]`)
}

export function exige(testID: string): HTMLElement {
  const e = achar(testID)
  if (e === null) throw new Error(`sem nó com testID="${testID}"`)
  return e
}

/** Todo `testID` presente na árvore — a população que o G2 coleta do fonte. */
export function testIDs(): string[] {
  return [...doc().querySelectorAll('[data-testid]')].map((e) => e.getAttribute('data-testid') ?? '')
}

/** O texto visível da árvore inteira, com os nós separados por espaço. */
export function textoDaTela(): string {
  return (doc().textContent ?? '').replace(/\s+/g, ' ').trim()
}

export function texto(testID: string): string {
  return (exige(testID).textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** Inativo = `accessibilityState.disabled` (o `enabled="false"` do dump). */
export function inativo(testID: string): boolean {
  return exige(testID).getAttribute('data-disabled') === 'true'
}

/** Os `d` dos paths dentro deste nó — qual DESENHO foi para a tela. */
export function paths(testID: string): string[] {
  return [...exige(testID).querySelectorAll('path')].map((p) => p.getAttribute('d') ?? '')
}

export async function tocar(testID: string): Promise<void> {
  const alvo = exige(testID)
  await act(async () => {
    alvo.dispatchEvent(new window.MouseEvent('click', { bubbles: true }))
  })
}

/** Digitar num `TextInput` — dispara o `onChangeText`. */
export async function digitar(testID: string, valor: string): Promise<void> {
  const alvo = exige(testID) as HTMLInputElement
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter?.call(alvo, valor)
    alvo.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
}

/** Deixa o microtask/timer queue drenar — o request do mock já voltou. */
export async function assentar(ms = 0): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

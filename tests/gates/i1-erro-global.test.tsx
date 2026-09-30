/**
 * O limite de erro GLOBAL (`lib/error-boundary.tsx`, montado em `app/layout.tsx`) como tela — I1-PR14.
 *
 * Sem folha: composição mecânica (a marca + a `LinhaDeAviso` tipo falha com `motivo.generico` e *Tentar de novo*).
 * O que o teste prende é o COMPORTAMENTO de antes (o que captura, o `onError`, o log, o *fallback* do chamador, a
 * ação que recarrega a página, os detalhes só em desenvolvimento) e a TELA nova (pt-BR, sem as frases de antes).
 * Gate-first: na `main` (`6f8299f`) reprova — a tela era *Something went wrong* com o `error.message` cru.
 */
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { ErrorBoundary } from '@/lib/error-boundary'
import logger from '@/lib/logger'

vi.mock('next/image', () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

function Lanca(): never {
  throw new Error('Cannot read properties of undefined (reading "x")')
}

const recarregar = vi.fn()
const localOriginal = window.location
beforeEach(() => {
  // o React registra o erro capturado no console; o teste não precisa do ruído
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(window, 'location', { configurable: true, value: { ...localOriginal, reload: recarregar } })
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  recarregar.mockReset()
  Object.defineProperty(window, 'location', { configurable: true, value: localOriginal })
})

describe('o limite de erro global (I1-PR14)', () => {
  it('sem erro, renderiza os filhos e nada mais', () => {
    render(<ErrorBoundary><p>conteúdo</p></ErrorBoundary>)
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('com erro: a LinhaDeAviso de falha com "algo deu errado — tente de novo", sem o texto de antes nem o error.message', () => {
    const { container } = render(<ErrorBoundary><Lanca /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('algo deu errado — tente de novo')
    const texto = container.textContent ?? ''
    for (const velho of ['Something went wrong', 'An unexpected error occurred', 'Try again', 'Reload page', 'Error Details', 'Component Stack'])
      expect(texto).not.toContain(velho)
    expect(texto).not.toContain('Cannot read properties')
  })

  it('a marca do produto, com o nome acessível "Octavia"', () => {
    render(<ErrorBoundary><Lanca /></ErrorBoundary>)
    expect(screen.getByRole('img', { name: 'Octavia' })).toBeInTheDocument()
  })

  it('"Tentar de novo" recarrega a página — o que o botão de hoje faz', () => {
    render(<ErrorBoundary><Lanca /></ErrorBoundary>)
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(recarregar).toHaveBeenCalledTimes(1)
  })

  it('o log e o onError do chamador, como antes', () => {
    const log = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    render(<ErrorBoundary onError={onError}><Lanca /></ErrorBoundary>)
    expect(log).toHaveBeenCalledWith('Error boundary caught an error:', expect.any(Error), expect.anything())
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ componentStack: expect.any(String) }))
  })

  it('o fallback do chamador, quando vem, vence a tela', () => {
    render(<ErrorBoundary fallback={<p>fallback do chamador</p>}><Lanca /></ErrorBoundary>)
    expect(screen.getByText('fallback do chamador')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('fora de desenvolvimento, sem os detalhes', () => {
    const { container } = render(<ErrorBoundary><Lanca /></ErrorBoundary>)
    expect(container.querySelector('details')).toBeNull()
  })

  it('em desenvolvimento, os detalhes em pt-BR: "detalhes do erro (só em desenvolvimento)", com a pilha', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { container } = render(<ErrorBoundary><Lanca /></ErrorBoundary>)
    const detalhes = container.querySelector('details')
    expect(detalhes).not.toBeNull()
    expect(detalhes?.querySelector('summary')).toHaveTextContent('detalhes do erro (só em desenvolvimento)')
    expect(detalhes?.textContent).toContain('Cannot read properties') // a pilha é do erro — dado, não frase de UI
  })
})

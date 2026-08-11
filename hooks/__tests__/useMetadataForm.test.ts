import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useMetadataForm } from '../useMetadataForm'

vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: { uid: 'user-1', email: 'audit@example.com' } })
}))

/**
 * ADD-14 (guarda de double-submit) + ADD-01 (sucesso mentiroso).
 *
 * Antes: setSuccess vinha ANTES de onComplete, e o onComplete (async) não era
 * aguardado — a mensagem de sucesso aparecia mesmo com falha e o
 * `disabled={isSubmitting}` do botão liberava no mesmo tick, deixando o save
 * em voo sem proteção.
 */
describe('useMetadataForm — timing de sucesso/erro (ADD-14/ADD-01)', () => {
  const fill = async (result: { current: any }) => {
    await act(async () => {
      result.current.updateField('title', 'Garota de Ipanema')
      result.current.updateField('artist', 'Tom Jobim')
    })
  }

  beforeEach(() => vi.clearAllMocks())

  it('só mostra sucesso DEPOIS do save concluir', async () => {
    let resolveSave: (() => void) | undefined
    const onComplete = vi.fn(
      () => new Promise<void>((resolve) => { resolveSave = resolve })
    )
    const { result } = renderHook(() => useMetadataForm({ onComplete }))
    await fill(result)

    let submitPromise: Promise<void>
    await act(async () => {
      submitPromise = result.current.handleSubmit()
    })

    // Save em voo: sem mensagem de sucesso e com o botão travado
    expect(result.current.success).toBeNull()
    expect(result.current.isSubmitting).toBe(true)

    await act(async () => {
      resolveSave?.()
      await submitPromise!
    })

    expect(result.current.success).toBe('Content saved successfully!')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('falha no save → mensagem de ERRO visível, nenhum sucesso, isSubmitting liberado', async () => {
    const onComplete = vi.fn().mockRejectedValue(new Error('Failed to create content'))
    const { result } = renderHook(() => useMetadataForm({ onComplete }))
    await fill(result)

    await act(async () => {
      await result.current.handleSubmit()
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to create content')
    })
    expect(result.current.success).toBeNull()
    expect(result.current.isSubmitting).toBe(false)
  })

  it('mantém a validação: sem título/artista não chama o save', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useMetadataForm({ onComplete }))

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(onComplete).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Title and Artist are required')
  })
})

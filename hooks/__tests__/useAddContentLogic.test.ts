import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAddContentLogic } from '../useAddContentLogic'

vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({ user: { uid: 'user-1', email: 'audit@example.com' } })
}))

vi.mock('@/lib/content-service', () => ({
  createContent: vi.fn()
}))

vi.mock('@/lib/batch-import', () => ({
  parseDocxFile: vi.fn(),
  parsePdfFile: vi.fn(),
  parseTextFile: vi.fn()
}))

import { createContent } from '@/lib/content-service'

const mockCreate = createContent as unknown as ReturnType<typeof vi.fn>

/** Coloca o hook no estado "arquivo enviado, aguardando metadados" — pelo
 *  mesmo caminho da UI (handleFilesUploaded), não por setState direto. */
async function comArquivoEnviado(result: { current: any }) {
  await act(async () => {
    result.current.handleFilesUploaded([
      {
        id: 1,
        name: 'ux-audit-cifra.pdf',
        size: 1024,
        type: 'application/pdf',
        contentType: 'Sheet Music',
        file: new File(['x'], 'ux-audit-cifra.pdf'),
        url: 'https://storage.example/ux-audit-cifra.pdf'
      }
    ])
  })
}

describe('useAddContentLogic — save do upload (ADD-13/ADD-14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue({ id: 'content-1', title: 'x' })
  })

  it('ADD-13: persiste os metadados digitados, não o filename', async () => {
    const { result } = renderHook(() => useAddContentLogic())
    await comArquivoEnviado(result)

    await act(async () => {
      await result.current.handleSaveContent({
        title: '[UX-AUDIT] Fase D import solo',
        artist: 'Conjunto Fase D',
        key: 'F',
        album: 'Álbum',
        genre: 'Bossa',
        bpm: '120',
        difficulty: 'Intermediate',
        notes: 'entra suave',
        timeSignature: '4/4',
        isFavorite: true,
        tags: ['audit']
      })
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const payload = mockCreate.mock.calls[0]![0]
    expect(payload.title).toBe('[UX-AUDIT] Fase D import solo')
    expect(payload.artist).toBe('Conjunto Fase D')
    expect(payload.key).toBe('F')
    expect(payload.bpm).toBe(120)
    expect(payload.album).toBe('Álbum')
    expect(payload.genre).toBe('Bossa')
    expect(payload.notes).toBe('entra suave')
    expect(payload.difficulty).toBe('Intermediate')
    expect(payload.time_signature).toBe('4/4')
    expect(payload.is_favorite).toBe(true)
    expect(payload.tags).toEqual(['audit'])
  })

  it('ADD-13: sem metadados digitados, o filename continua sendo o fallback', async () => {
    const { result } = renderHook(() => useAddContentLogic())
    await comArquivoEnviado(result)

    await act(async () => {
      await result.current.handleSaveContent({})
    })

    const payload = mockCreate.mock.calls[0]![0]
    expect(payload.title).toBe('ux-audit-cifra.pdf')
    expect(payload.artist).toBe('Unknown Artist')
  })

  it('ADD-14: dois saves concorrentes criam UMA linha só (guarda de in-flight)', async () => {
    let resolveCreate: ((v: unknown) => void) | undefined
    mockCreate.mockImplementation(
      () => new Promise((resolve) => { resolveCreate = resolve })
    )

    const { result } = renderHook(() => useAddContentLogic())
    await comArquivoEnviado(result)

    await act(async () => {
      const first = result.current.handleSaveContent({ title: 'A', artist: 'B' })
      const second = result.current.handleSaveContent({ title: 'A', artist: 'B' })
      resolveCreate?.({ id: 'content-1' })
      await Promise.all([first, second])
    })

    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it('ADD-14: a guarda libera após concluir — o save seguinte passa', async () => {
    const { result } = renderHook(() => useAddContentLogic())
    await comArquivoEnviado(result)

    await act(async () => {
      await result.current.handleSaveContent({ title: 'A', artist: 'B' })
    })
    await act(async () => {
      await result.current.handleSaveContent({ title: 'C', artist: 'D' })
    })

    expect(mockCreate).toHaveBeenCalledTimes(2)
  })

  it('ADD-14: a guarda libera mesmo quando o save falha', async () => {
    mockCreate.mockRejectedValueOnce(new Error('Failed to create content'))
    const { result } = renderHook(() => useAddContentLogic())
    await comArquivoEnviado(result)

    await act(async () => {
      await expect(
        result.current.handleSaveContent({ title: 'A', artist: 'B' })
      ).rejects.toThrow('Failed to create content')
    })

    mockCreate.mockResolvedValueOnce({ id: 'content-2' })
    await act(async () => {
      await result.current.handleSaveContent({ title: 'A', artist: 'B' })
    })

    expect(mockCreate).toHaveBeenCalledTimes(2)
  })
})

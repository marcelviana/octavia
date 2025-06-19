import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useDebounce } from '../use-debounce'

describe('useDebounce', () => {
  it('updates value after delay', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 200 } }
    )

    expect(result.current).toBe('a')
    rerender({ value: 'ab', delay: 200 })
    act(() => {
      vi.advanceTimersByTime(199)
    })
    expect(result.current).toBe('a')
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('ab')
    vi.useRealTimers()
  })
})

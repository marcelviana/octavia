import { describe, it, expect } from 'vitest'
import { reducer } from '../use-toast'

describe('toast reducer', () => {
  it('adds toast and respects limit', () => {
    const state = { toasts: [] as any[] }
    const newState = reducer(state, {
      type: 'ADD_TOAST',
      toast: { id: '1', title: 'A' }
    })
    expect(newState.toasts.length).toBe(1)
    const limitedState = reducer(newState, {
      type: 'ADD_TOAST',
      toast: { id: '2', title: 'B' }
    })
    expect(limitedState.toasts.length).toBe(1)
    expect(limitedState.toasts[0].id).toBe('2')
  })

  it('updates toast', () => {
    const state = { toasts: [{ id: '1', title: 'A' }] }
    const updated = reducer(state, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'B' }
    })
    expect(updated.toasts[0].title).toBe('B')
  })

  it('dismisses toast', () => {
    const state = { toasts: [{ id: '1', open: true }, { id: '2', open: true }] }
    const dismissed = reducer(state, {
      type: 'DISMISS_TOAST',
      toastId: '1'
    })
    expect(dismissed.toasts[0].open).toBe(false)
    expect(dismissed.toasts[1].open).toBe(true)
  })

  it('removes toast', () => {
    const state = { toasts: [{ id: '1' }, { id: '2' }] }
    const removed = reducer(state, { type: 'REMOVE_TOAST', toastId: '1' })
    expect(removed.toasts.length).toBe(1)
    expect(removed.toasts[0].id).toBe('2')
  })
})

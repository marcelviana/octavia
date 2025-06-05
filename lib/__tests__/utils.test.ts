import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', false && 'bar')).toBe('foo')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

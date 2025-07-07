import { describe, it, expect } from 'vitest'
import { cn, urlHasExtension } from '../utils'

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
    expect(cn('foo', false && 'bar')).toBe('foo')
    expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    expect(cn('foo', 'foo', 'bar')).toBe('foo foo bar')
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('urlHasExtension', () => {
  it('detects extension before query or hash', () => {
    expect(urlHasExtension('https://x.com/file.pdf?token=123', '.pdf')).toBe(true)
    expect(urlHasExtension('https://x.com/file.png#section', '.png')).toBe(true)
    expect(urlHasExtension('https://x.com/file.jpeg', '.jpg')).toBe(false)
  })
})

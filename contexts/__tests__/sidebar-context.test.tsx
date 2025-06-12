/**
 * @vitest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { describe, it, expect } from 'vitest'
globalThis.React = React

// dynamic import to get components after any mocks

it('throws if useSidebar called outside provider', async () => {
  const mod = await import('../sidebar-context')
  expect(() => renderHook(() => mod.useSidebar())).toThrow(
    'useSidebar must be used within a SidebarProvider'
  )
})

describe('SidebarProvider', () => {
  it('provides default state and updates', async () => {
    const mod = await import('../sidebar-context')
    const wrapper = ({ children }: any) => <mod.SidebarProvider>{children}</mod.SidebarProvider>
    const { result } = renderHook(() => mod.useSidebar(), { wrapper })
    expect(result.current.collapsed).toBe(false)
    act(() => {
      result.current.setCollapsed(true)
    })
    expect(result.current.collapsed).toBe(true)
  })
})

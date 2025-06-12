import React from 'react'
import { describe, it, expect } from 'vitest'
// Provide React globally for components compiled with classic transform
(globalThis as any).React = React
import { render, screen, act } from '@testing-library/react'
import { Toaster } from '@/components/ui/toaster'
import { toast } from '../use-toast'

describe('Toaster component', () => {
  it('renders toast when toast() is called', () => {
    render(<Toaster />)
    act(() => {
      toast({ title: 'Hello World' })
    })
    expect(screen.getByText('Hello World')).toBeTruthy()
  })
})

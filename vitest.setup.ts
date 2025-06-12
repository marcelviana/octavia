import { vi } from 'vitest'

vi.mock('next/link', async () => {
  const React = await import('react')
  return {
    __esModule: true,
    default: React.forwardRef<HTMLAnchorElement, any>(function Link({ href, children, ...props }, ref) {
      return React.createElement('a', { href, ref, ...props }, children)
    })
  }
})

vi.mock('next/navigation', () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }
  return {
    useRouter: () => router,
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    usePathname: () => '',
    redirect: vi.fn(),
  }
})

vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: vi.fn() }),
}))

vi.mock('next/image', async () => {
  const React = await import('react')
  return {
    __esModule: true,
    default: React.forwardRef<HTMLImageElement, any>(function Image(props, ref) {
      return React.createElement('img', { ref, ...props })
    })
  }
})

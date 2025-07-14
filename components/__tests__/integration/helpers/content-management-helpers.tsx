import { vi } from 'vitest'

export let mockRouterPush: any
export let mockUser: any

export const mockContent = [
  {
    id: 'content-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    content_type: 'lyrics',
    content_data: { lyrics: 'Amazing grace, how sweet the sound...' },
    is_favorite: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'test-user-1'
  },
  {
    id: 'content-2',
    title: 'How Great Thou Art',
    artist: 'Carl Boberg',
    content_type: 'chords',
    content_data: { chords: 'G C D Em...' },
    is_favorite: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    user_id: 'test-user-1'
  }
]

vi.mock('@/lib/content-service', () => ({
  createContent: vi.fn(),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
  getUserContentPage: vi.fn(),
  toggleFavorite: vi.fn(),
}))

vi.mock('@/lib/storage-service', () => ({
  uploadFileToStorage: vi.fn(),
  deleteFileFromStorage: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/library',
}))

vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...props }: any) => (
      <a href={href} {...props}>{children}</a>
    )
  }
})

vi.mock('@/contexts/firebase-auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
  useFirebaseAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}))

export const setupTestMocks = async () => {
  vi.clearAllMocks()
  mockRouterPush = vi.fn()
  mockUser = {
    uid: 'test-user-1',
    email: 'test@example.com',
    displayName: 'Test User',
  }

  const { createContent, updateContent, getUserContentPage, toggleFavorite } = await import('@/lib/content-service')
  const { uploadFileToStorage } = await import('@/lib/storage-service')

  ;(createContent as any).mockResolvedValue(mockContent[0])
  ;(updateContent as any).mockResolvedValue(mockContent[0])
  ;(getUserContentPage as any).mockResolvedValue({
    content: mockContent,
    totalCount: mockContent.length,
    totalPages: 1,
  })
  ;(toggleFavorite as any).mockResolvedValue(undefined)
  ;(uploadFileToStorage as any).mockResolvedValue('https://example.com/file.pdf')
}

export const resetTestMocks = () => {
  vi.resetAllMocks()
}

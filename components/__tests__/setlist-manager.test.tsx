import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SetlistManager } from '@/components/setlist-manager'
import { FirebaseAuthProvider } from '@/contexts/firebase-auth-context'
import { useSetlistData } from '@/hooks/use-setlist-data'
import { 
  createSetlist, 
  deleteSetlist, 
  addSongToSetlist, 
  removeSongFromSetlist, 
  updateSongPosition, 
  updateSetlist, 
  getUserSetlists 
} from '@/lib/setlist-service'
import { saveSetlists, removeCachedSetlist } from '@/lib/offline-setlist-cache'

// Mock the useSetlistData hook
vi.mock('@/hooks/use-setlist-data', () => ({
  useSetlistData: vi.fn()
}))

// Mock external dependencies
vi.mock('@/lib/offline-setlist-cache', () => ({
  saveSetlists: vi.fn().mockResolvedValue(undefined),
  removeCachedSetlist: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@/lib/setlist-service', () => ({
  createSetlist: vi.fn(),
  deleteSetlist: vi.fn(),
  addSongToSetlist: vi.fn(),
  removeSongFromSetlist: vi.fn(),
  updateSongPosition: vi.fn(),
  updateSetlist: vi.fn(),
  getUserSetlists: vi.fn()
}))

vi.mock('@/lib/content-service', () => ({
  getUserContent: vi.fn()
}))

// Mock Firebase auth context
const mockAuthContext = {
  user: {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  },
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  profile: {
    user_id: 'test-user-id',
    first_name: 'Test',
    last_name: 'User',
    full_name: 'Test User',
    primary_instrument: 'guitar'
  },
  idToken: 'mock-token',
  isConfigured: true,
  isInitialized: true,
  refreshToken: vi.fn(),
  signInWithGoogle: vi.fn(),
  updateProfile: vi.fn(),
  resendVerificationEmail: vi.fn(),
}

vi.mock('@/contexts/firebase-auth-context', () => ({
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFirebaseAuth: () => mockAuthContext
}))

const mockOnEnterPerformance = vi.fn()

const mockSetlists = [
  {
    id: 'setlist-1',
    name: 'Test Setlist 1',
    description: 'A test setlist',
    performance_date: '2024-01-14',
    venue: 'Test Venue',
              notes: 'Test Notes',
    user_id: 'test-user-id',
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    setlist_songs: [
      {
        id: 'song-1',
        position: 1,
        notes: 'Start slow',
        content: {
          id: 'content-1',
          user_id: 'test-user-id',
          title: 'Song 1',
          artist: 'Artist 1',
          album: null,
          genre: null,
          content_type: 'lyrics',
          key: null,
          bpm: 120,
          time_signature: null,
          difficulty: null,
          capo: null,
          tuning: null,
          tags: null,
          notes: null,
          content_data: null,
          file_url: null,
          thumbnail_url: null,
          is_favorite: false,
          is_public: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      },
      {
        id: 'song-2',
        position: 2,
        notes: null,
        content: {
          id: 'content-2',
          user_id: 'test-user-id',
          title: 'Song 2',
          artist: 'Artist 2',
          album: null,
          genre: null,
          content_type: 'sheet',
          key: null,
          bpm: 140,
          time_signature: null,
          difficulty: null,
          capo: null,
          tuning: null,
          tags: null,
          notes: null,
          content_data: null,
          file_url: null,
          thumbnail_url: null,
          is_favorite: false,
          is_public: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      }
    ]
  }
]

const mockContent = [
  {
    id: 'content-1',
    user_id: 'test-user-id',
    title: 'Available Song 1',
    artist: 'Artist 1',
    album: null,
    genre: null,
    content_type: 'lyrics',
    key: null,
    bpm: 120,
    time_signature: null,
    difficulty: null,
    capo: null,
    tuning: null,
    tags: null,
    notes: null,
    content_data: null,
    file_url: null,
    thumbnail_url: null,
    is_favorite: false,
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'content-2',
    user_id: 'test-user-id',
    title: 'Available Song 2',
    artist: 'Artist 2',
    album: null,
    genre: null,
    content_type: 'sheet',
    key: null,
    bpm: 140,
    time_signature: null,
    difficulty: null,
    capo: null,
    tuning: null,
    tags: null,
    notes: null,
    content_data: null,
    file_url: null,
    thumbnail_url: null,
    is_favorite: false,
    is_public: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockUseSetlistData = {
  setlists: mockSetlists,
  setSetlists: vi.fn(),
  content: mockContent,
  setContent: vi.fn(),
  loading: false,
  error: null,
  reload: vi.fn()
}

describe('SetlistManager', () => {
  const mockOnEnterPerformance = vi.fn()
  const mockSetlists = [
    {
      id: 'setlist1',
      name: 'Test Setlist 1',
      description: 'Test Description',
      performance_date: '2024-01-14',
      venue: 'Test Venue',
      notes: 'Test Notes',
      user_id: 'user1',
      is_public: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      setlist_songs: [
        {
          id: 'song1',
          position: 1,
          notes: null,
          content: {
            id: 'content1',
            user_id: 'user1',
            title: 'Song 1',
            artist: 'Artist 1',
            album: null,
            genre: null,
            content_type: 'lyrics',
            key: 'C',
            bpm: 120,
            time_signature: null,
            difficulty: null,
            capo: null,
            tuning: null,
            tags: null,
            notes: null,
            content_data: { lyrics: 'Test lyrics' },
            file_url: null,
            thumbnail_url: null,
            is_favorite: false,
            is_public: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        },
        {
          id: 'song2',
          position: 2,
          notes: null,
          content: {
            id: 'content2',
            user_id: 'user1',
            title: 'Song 2',
            artist: 'Artist 2',
            album: null,
            genre: null,
            content_type: 'lyrics',
            key: 'G',
            bpm: 140,
            time_signature: null,
            difficulty: null,
            capo: null,
            tuning: null,
            tags: null,
            notes: null,
            content_data: { lyrics: 'Test lyrics 2' },
            file_url: null,
            thumbnail_url: null,
            is_favorite: false,
            is_public: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        }
      ]
    }
  ]
  
  const mockUseSetlistData = {
    setlists: mockSetlists,
    setSetlists: vi.fn(),
    content: mockContent,
    setContent: vi.fn(),
    loading: false,
    error: null,
    reload: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useSetlistData).mockReturnValue(mockUseSetlistData)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders setlist manager with setlists', async () => {
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
        expect(screen.getByText('Test Description')).toBeInTheDocument()
      })
    })

    it('shows create setlist button', async () => {
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      expect(screen.getByRole('button', { name: /create setlist/i })).toBeInTheDocument()
    })

    it('displays setlist information correctly', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
        expect(screen.getByText('Song 2')).toBeInTheDocument()
        expect(screen.getByText('Artist 1')).toBeInTheDocument()
        expect(screen.getByText('Artist 2')).toBeInTheDocument()
      })
    })

    it('shows loading state when data is loading', async () => {
      const loadingUseSetlistData = { ...mockUseSetlistData, loading: true }
      vi.mocked(useSetlistData).mockReturnValue(loadingUseSetlistData)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      expect(screen.getByText('Loading your setlists...')).toBeInTheDocument()
    })
  })

  describe('Setlist Creation', () => {
    it('opens create setlist dialog', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      await waitFor(() => {
        expect(screen.getByText('Create New Setlist')).toBeInTheDocument()
        expect(screen.getByLabelText(/setlist name/i)).toBeInTheDocument()
      })
    })

    it('creates a new setlist successfully', async () => {
      const user = userEvent.setup()
      const mockCreateSetlist = vi.mocked(createSetlist)
      const newSetlist = {
        id: 'new-setlist-id',
        name: 'New Setlist',
        description: 'New description',
        user_id: 'test-user-id'
      }
      mockCreateSetlist.mockResolvedValue(newSetlist as any)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      // Fill form
      const nameInput = screen.getByLabelText(/setlist name/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      
      await user.type(nameInput, 'New Setlist')
      await user.type(descriptionInput, 'New description')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateSetlist).toHaveBeenCalledWith({
          user_id: 'test-user-id',
          name: 'New Setlist',
          description: 'New description',
          performance_date: null,
          venue: null,
          notes: null
        })
      })
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should not call createSetlist
      const mockCreateSetlist = vi.mocked(createSetlist)
      expect(mockCreateSetlist).not.toHaveBeenCalled()
    })
  })

  describe('Setlist Editing', () => {
    it('opens edit setlist dialog', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit setlist/i })
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByText('Edit Setlist')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Test Setlist 1')).toBeInTheDocument()
      })
    })

    it('updates setlist successfully', async () => {
      const user = userEvent.setup()
      const mockUpdateSetlist = vi.mocked(updateSetlist)
      mockUpdateSetlist.mockResolvedValue({} as any)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open edit dialog
      await waitFor(() => {
        const editButton = screen.getByRole('button', { name: /edit setlist/i })
        user.click(editButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Edit Setlist')).toBeInTheDocument()
      })

      // Update name
      const nameInput = screen.getByDisplayValue('Test Setlist 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Setlist')

      // Submit
      const submitButton = screen.getByRole('button', { name: /update setlist/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateSetlist).toHaveBeenCalledWith('setlist1', {
          name: 'Updated Setlist',
          description: 'Test Description',
          performance_date: '2024-01-14',
          venue: 'Test Venue',
          notes: 'Test Notes'
        })
      })
    })
  })

  describe('Setlist Deletion', () => {
    it('opens delete confirmation dialog', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await user.click(deleteButton)

      await waitFor(() => {
        expect(screen.getByText('Delete Setlist')).toBeInTheDocument()
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument()
      })
    })

    it('deletes setlist successfully', async () => {
      const user = userEvent.setup()
      const mockDeleteSetlist = vi.mocked(deleteSetlist)
      mockDeleteSetlist.mockResolvedValue(true)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open delete dialog
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i })
        user.click(deleteButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Delete Setlist')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockDeleteSetlist).toHaveBeenCalledWith('setlist1')
      })
    })
  })

  describe('Song Management', () => {
    it('opens add songs dialog', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs and add button
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      const addSongsButton = screen.getByRole('button', { name: /add songs to setlist/i })
      await user.click(addSongsButton)

      await waitFor(() => {
        expect(screen.getByText('Add Songs to Setlist')).toBeInTheDocument()
        expect(screen.getByText('Available Song 1')).toBeInTheDocument()
        expect(screen.getByText('Available Song 2')).toBeInTheDocument()
      })
    })

    it('adds songs to setlist', async () => {
      const user = userEvent.setup()
      const mockAddSongToSetlist = vi.mocked(addSongToSetlist)
      mockAddSongToSetlist.mockResolvedValue({} as any)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      // Open add songs dialog
      const addSongsButton = screen.getByRole('button', { name: /add songs to setlist/i })
      await user.click(addSongsButton)

      await waitFor(() => {
        expect(screen.getByText('Add Songs to Setlist')).toBeInTheDocument()
      })

      // Select a song by clicking on the first checkbox
      const songCheckboxes = screen.getAllByRole('checkbox')
      await user.click(songCheckboxes[0])

      // Add selected songs
      const addButton = screen.getByRole('button', { name: /add 1 song/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(mockAddSongToSetlist).toHaveBeenCalledWith('setlist1', 'content-1', 3)
      })
    })

    it('removes songs from setlist', async () => {
      const user = userEvent.setup()
      const mockRemoveSongFromSetlist = vi.mocked(removeSongFromSetlist)
      mockRemoveSongFromSetlist.mockResolvedValue(true)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      // Find and click remove button for first song
      const removeButtons = screen.getAllByRole('button', { name: /remove song/i })
      await user.click(removeButtons[0])

      await waitFor(() => {
        expect(mockRemoveSongFromSetlist).toHaveBeenCalledWith('song1')
      })
    })

    it('filters songs in add dialog', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      // Open add songs dialog
      const addSongsButton = screen.getByRole('button', { name: /add songs to setlist/i })
      await user.click(addSongsButton)

      await waitFor(() => {
        expect(screen.getByText('Available Song 1')).toBeInTheDocument()
        expect(screen.getByText('Available Song 2')).toBeInTheDocument()
      })

      // Filter songs
      const searchInput = screen.getByPlaceholderText(/search songs/i)
      await user.type(searchInput, 'Song 1')

      await waitFor(() => {
        expect(screen.getByText('Available Song 1')).toBeInTheDocument()
        expect(screen.queryByText('Available Song 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Drag and Drop', () => {
    it('handles drag start', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      const draggableDivs = screen.getAllByText('Song 1').map(el => el.closest('[draggable]')).filter(Boolean)
      const firstDraggable = draggableDivs[0]
      fireEvent.dragStart(firstDraggable!, { dataTransfer: { setData: vi.fn() } })

      // Should set dragged song ID
      expect(firstDraggable).toHaveAttribute('draggable', 'true')
    })

    it('handles drag over and drop', async () => {
      const user = userEvent.setup()
      const mockUpdateSongPosition = vi.mocked(updateSongPosition)
      mockUpdateSongPosition.mockResolvedValue(true)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
        expect(screen.getByText('Song 2')).toBeInTheDocument()
      })

      const songElements = screen.getAllByText(/Song \d/)
      const firstSong = songElements[0]
      const secondSong = songElements[1]

      // Simulate drag and drop
      fireEvent.dragStart(firstSong, { dataTransfer: { setData: vi.fn() } })
      fireEvent.dragOver(secondSong)
      fireEvent.drop(secondSong)

      // Should call update position
      await waitFor(() => {
        expect(mockUpdateSongPosition).toHaveBeenCalled()
      })
    })
  })

  describe('Performance Mode Integration', () => {
    it('enters performance mode with setlist', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const playButton = screen.getByRole('button', { name: /play setlist/i })
      await user.click(playButton)

      expect(mockOnEnterPerformance).toHaveBeenCalledWith(mockSetlists[0])
    })

    it('enters performance mode from specific song', async () => {
      const user = userEvent.setup()
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // First expand the setlist to see the songs
      await waitFor(() => {
        expect(screen.getByText('Test Setlist 1')).toBeInTheDocument()
      })

      const setlistCard = screen.getByText('Test Setlist 1').closest('[class*="cursor-pointer"]')
      if (setlistCard) {
        await user.click(setlistCard)
      }

      await waitFor(() => {
        expect(screen.getByText('Song 1')).toBeInTheDocument()
      })

      // Find play button for specific song
      const songPlayButtons = screen.getAllByRole('button', { name: /start performance from this song/i })
      await user.click(songPlayButtons[0])

      expect(mockOnEnterPerformance).toHaveBeenCalledWith(mockSetlists[0], 0)
    })
  })

  describe('Setlist Information Display', () => {
    it('shows setlist duration', async () => {
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        // Should show duration based on BPM calculations
        expect(screen.getByText(/13m/)).toBeInTheDocument() // 2 songs * 3 minutes each
      })
    })

    it('shows song count', async () => {
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('2 songs')).toBeInTheDocument()
      })
    })

    it('shows performance date when available', async () => {
      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('1/14/2024')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles setlist creation errors', async () => {
      const user = userEvent.setup()
      const mockCreateSetlist = vi.mocked(createSetlist)
      mockCreateSetlist.mockRejectedValue(new Error('Creation failed'))

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open create dialog
      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      // Fill and submit form
      const nameInput = screen.getByLabelText(/setlist name/i)
      await user.type(nameInput, 'New Setlist')

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockCreateSetlist).toHaveBeenCalled()
      })
    })

    it('handles setlist deletion errors', async () => {
      const user = userEvent.setup()
      const mockDeleteSetlist = vi.mocked(deleteSetlist)
      mockDeleteSetlist.mockRejectedValue(new Error('Deletion failed'))

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Open delete dialog
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i })
        user.click(deleteButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Delete Setlist')).toBeInTheDocument()
      })

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      // Should handle error gracefully
      await waitFor(() => {
        expect(mockDeleteSetlist).toHaveBeenCalled()
      })
    })
  })

  describe('Offline Support', () => {
    it('saves setlists to offline cache', async () => {
      const user = userEvent.setup()
      const mockCreateSetlist = vi.mocked(createSetlist)
      const mockSaveSetlists = vi.mocked(saveSetlists)
      
      const newSetlist = { id: 'new-id', name: 'New Setlist', user_id: 'test-user-id' }
      mockCreateSetlist.mockResolvedValue(newSetlist as any)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Create setlist
      const createButton = screen.getByRole('button', { name: /create setlist/i })
      await user.click(createButton)

      const nameInput = screen.getByLabelText(/setlist name/i)
      await user.type(nameInput, 'New Setlist')

      const submitButton = screen.getByRole('button', { name: /create/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSaveSetlists).toHaveBeenCalled()
      })
    })

    it('removes setlists from offline cache on deletion', async () => {
      const user = userEvent.setup()
      const mockDeleteSetlist = vi.mocked(deleteSetlist)
      const mockRemoveCachedSetlist = vi.mocked(removeCachedSetlist)
      
      mockDeleteSetlist.mockResolvedValue(true)

      render(
        <FirebaseAuthProvider>
          <SetlistManager onEnterPerformance={mockOnEnterPerformance} />
        </FirebaseAuthProvider>
      )

      // Delete setlist
      await waitFor(() => {
        const deleteButton = screen.getByRole('button', { name: /delete/i })
        user.click(deleteButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Delete Setlist')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /delete/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(mockRemoveCachedSetlist).toHaveBeenCalledWith('setlist1')
      })
    })
  })
}) 
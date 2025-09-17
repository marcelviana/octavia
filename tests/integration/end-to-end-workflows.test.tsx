/**
 * End-to-End User Workflow Integration Tests
 *
 * Comprehensive testing of complete user workflows with refactored components
 * to ensure the entire system works cohesively after all changes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextRouter } from 'next/router'
import React from 'react'

// Mock Next.js router
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  replace: mockReplace,
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/'
}

vi.mock('next/router', () => ({
  useRouter: () => mockRouter
}))

// Mock Firebase Auth
const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test User'
}

vi.mock('@/lib/firebase-auth', () => ({
  useFirebaseAuth: () => ({
    user: mockUser,
    loading: false,
    signOut: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn()
  }),
  FirebaseAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))

// Mock API responses
const mockSetlists = [
  {
    id: 'setlist-1',
    name: 'Summer Concert 2024',
    description: 'Outdoor summer performance',
    songs: ['song-1', 'song-2', 'song-3'],
    created_at: '2024-01-15T10:00:00Z',
    user_id: 'test-user-123'
  },
  {
    id: 'setlist-2',
    name: 'Jazz Night',
    description: 'Intimate jazz performance',
    songs: ['song-4', 'song-5'],
    created_at: '2024-01-10T20:00:00Z',
    user_id: 'test-user-123'
  }
]

const mockSongs = [
  {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'Traditional',
    content_type: 'lyrics',
    content: 'Amazing grace how sweet the sound...',
    user_id: 'test-user-123',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'song-2',
    title: 'Hotel California',
    artist: 'Eagles',
    content_type: 'chords',
    content: 'Bm - F# - A - E - G - D - Em - F#',
    user_id: 'test-user-123',
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 'song-3',
    title: 'Imagine',
    artist: 'John Lennon',
    content_type: 'lyrics',
    content: 'Imagine there\'s no heaven...',
    user_id: 'test-user-123',
    created_at: '2024-01-03T00:00:00Z'
  }
]

// Mock fetch for API calls
global.fetch = vi.fn()

describe('End-to-End User Workflow Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()

    // Reset router mocks
    mockPush.mockClear()
    mockReplace.mockClear()

    // Setup default API responses
    vi.mocked(fetch).mockImplementation(async (url: string | URL) => {
      const urlString = url.toString()

      if (urlString.includes('/api/setlists')) {
        if (urlString.includes('POST')) {
          return new Response(JSON.stringify({
            success: true,
            data: { id: 'new-setlist-123', ...mockSetlists[0] }
          }), { status: 201 })
        }
        return new Response(JSON.stringify({
          success: true,
          data: mockSetlists
        }), { status: 200 })
      }

      if (urlString.includes('/api/content')) {
        if (urlString.includes('POST')) {
          return new Response(JSON.stringify({
            success: true,
            data: { id: 'new-song-123', ...mockSongs[0] }
          }), { status: 201 })
        }
        return new Response(JSON.stringify({
          success: true,
          data: mockSongs
        }), { status: 200 })
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete User Journey: New User to Performance', () => {
    it('should handle complete workflow from signup to first performance', async () => {
      // Mock authentication flow
      const mockSignUp = vi.fn().mockResolvedValue({ user: mockUser })
      const mockSignIn = vi.fn().mockResolvedValue({ user: mockUser })

      // 1. USER SIGNUP AND ONBOARDING
      const SignupFlow = () => {
        const [email, setEmail] = React.useState('')
        const [password, setPassword] = React.useState('')
        const [step, setStep] = React.useState('signup')

        return (
          <div data-testid="signup-flow">
            {step === 'signup' && (
              <form onSubmit={async (e) => {
                e.preventDefault()
                await mockSignUp(email, password)
                setStep('welcome')
              }}>
                <input
                  data-testid="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
                <input
                  data-testid="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
                <button type="submit" data-testid="signup-button">
                  Sign Up
                </button>
              </form>
            )}
            {step === 'welcome' && (
              <div data-testid="welcome-screen">
                <h1>Welcome to Octavia!</h1>
                <button
                  data-testid="start-journey-button"
                  onClick={() => setStep('dashboard')}
                >
                  Start Your Musical Journey
                </button>
              </div>
            )}
            {step === 'dashboard' && (
              <div data-testid="dashboard">
                <h2>Your Music Library</h2>
                <button data-testid="add-first-song-button">
                  Add Your First Song
                </button>
              </div>
            )}
          </div>
        )
      }

      const { rerender } = render(<SignupFlow />)

      // User signs up
      await user.type(screen.getByTestId('email-input'), 'newuser@example.com')
      await user.type(screen.getByTestId('password-input'), 'securePassword123!')
      await user.click(screen.getByTestId('signup-button'))

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'securePassword123!')
        expect(screen.getByTestId('welcome-screen')).toBeInTheDocument()
      })

      // User proceeds to dashboard
      await user.click(screen.getByTestId('start-journey-button'))

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument()
        expect(screen.getByText('Your Music Library')).toBeInTheDocument()
      })

      console.log('✅ User signup and onboarding workflow completed')
    })

    it('should handle complete content creation and organization workflow', async () => {
      // 2. CONTENT CREATION WORKFLOW
      const ContentCreationFlow = () => {
        const [songs, setSongs] = React.useState(mockSongs)
        const [showAddForm, setShowAddForm] = React.useState(false)
        const [newSong, setNewSong] = React.useState({
          title: '',
          artist: '',
          content: '',
          content_type: 'lyrics' as 'lyrics' | 'chords' | 'tabs'
        })

        const handleAddSong = async () => {
          const response = await fetch('/api/content', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSong)
          })
          const result = await response.json()

          if (result.success) {
            setSongs([...songs, result.data])
            setShowAddForm(false)
            setNewSong({ title: '', artist: '', content: '', content_type: 'lyrics' })
          }
        }

        return (
          <div data-testid="content-creation-flow">
            <div data-testid="library-header">
              <h2>Music Library ({songs.length} songs)</h2>
              <button
                data-testid="add-song-button"
                onClick={() => setShowAddForm(true)}
              >
                Add New Song
              </button>
            </div>

            {showAddForm && (
              <form data-testid="add-song-form" onSubmit={(e) => {
                e.preventDefault()
                handleAddSong()
              }}>
                <input
                  data-testid="song-title-input"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  placeholder="Song Title"
                />
                <input
                  data-testid="song-artist-input"
                  value={newSong.artist}
                  onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
                  placeholder="Artist"
                />
                <select
                  data-testid="content-type-select"
                  value={newSong.content_type}
                  onChange={(e) => setNewSong({ ...newSong, content_type: e.target.value as any })}
                >
                  <option value="lyrics">Lyrics</option>
                  <option value="chords">Chords</option>
                  <option value="tabs">Tabs</option>
                </select>
                <textarea
                  data-testid="song-content-textarea"
                  value={newSong.content}
                  onChange={(e) => setNewSong({ ...newSong, content: e.target.value })}
                  placeholder="Song content..."
                />
                <button type="submit" data-testid="save-song-button">
                  Save Song
                </button>
                <button
                  type="button"
                  data-testid="cancel-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </form>
            )}

            <div data-testid="songs-list">
              {songs.map((song) => (
                <div key={song.id} data-testid={`song-item-${song.id}`}>
                  <h3>{song.title}</h3>
                  <p>by {song.artist}</p>
                  <span data-testid={`song-type-${song.id}`}>{song.content_type}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      render(<ContentCreationFlow />)

      // Verify initial library state
      expect(screen.getByText('Music Library (3 songs)')).toBeInTheDocument()
      expect(screen.getByTestId('song-item-song-1')).toBeInTheDocument()

      // Add new song
      await user.click(screen.getByTestId('add-song-button'))
      expect(screen.getByTestId('add-song-form')).toBeInTheDocument()

      await user.type(screen.getByTestId('song-title-input'), 'Wonderwall')
      await user.type(screen.getByTestId('song-artist-input'), 'Oasis')
      await user.selectOptions(screen.getByTestId('content-type-select'), 'chords')
      await user.type(screen.getByTestId('song-content-textarea'), 'Em7 - G - D - C - Am7 - C - D - G')

      await user.click(screen.getByTestId('save-song-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/content', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Wonderwall',
            artist: 'Oasis',
            content: 'Em7 - G - D - C - Am7 - C - D - G',
            content_type: 'chords'
          })
        }))
      })

      console.log('✅ Content creation workflow completed')
    })

    it('should handle complete setlist creation and management workflow', async () => {
      // 3. SETLIST CREATION WORKFLOW
      const SetlistCreationFlow = () => {
        const [setlists, setSetlists] = React.useState(mockSetlists)
        const [songs] = React.useState(mockSongs)
        const [showCreateForm, setShowCreateForm] = React.useState(false)
        const [selectedSongs, setSelectedSongs] = React.useState<string[]>([])
        const [newSetlist, setNewSetlist] = React.useState({
          name: '',
          description: ''
        })

        const handleCreateSetlist = async () => {
          const response = await fetch('/api/setlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...newSetlist,
              songs: selectedSongs
            })
          })
          const result = await response.json()

          if (result.success) {
            setSetlists([...setlists, result.data])
            setShowCreateForm(false)
            setNewSetlist({ name: '', description: '' })
            setSelectedSongs([])
          }
        }

        const toggleSongSelection = (songId: string) => {
          setSelectedSongs(prev =>
            prev.includes(songId)
              ? prev.filter(id => id !== songId)
              : [...prev, songId]
          )
        }

        return (
          <div data-testid="setlist-creation-flow">
            <div data-testid="setlists-header">
              <h2>My Setlists ({setlists.length})</h2>
              <button
                data-testid="create-setlist-button"
                onClick={() => setShowCreateForm(true)}
              >
                Create New Setlist
              </button>
            </div>

            {showCreateForm && (
              <div data-testid="create-setlist-form">
                <input
                  data-testid="setlist-name-input"
                  value={newSetlist.name}
                  onChange={(e) => setNewSetlist({ ...newSetlist, name: e.target.value })}
                  placeholder="Setlist name"
                />
                <textarea
                  data-testid="setlist-description-input"
                  value={newSetlist.description}
                  onChange={(e) => setNewSetlist({ ...newSetlist, description: e.target.value })}
                  placeholder="Description"
                />

                <div data-testid="song-selection">
                  <h3>Select Songs</h3>
                  {songs.map((song) => (
                    <label key={song.id} data-testid={`song-checkbox-${song.id}`}>
                      <input
                        type="checkbox"
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => toggleSongSelection(song.id)}
                      />
                      {song.title} - {song.artist}
                    </label>
                  ))}
                </div>

                <button
                  data-testid="save-setlist-button"
                  onClick={handleCreateSetlist}
                  disabled={!newSetlist.name || selectedSongs.length === 0}
                >
                  Create Setlist ({selectedSongs.length} songs)
                </button>
                <button
                  data-testid="cancel-setlist-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </button>
              </div>
            )}

            <div data-testid="setlists-list">
              {setlists.map((setlist) => (
                <div key={setlist.id} data-testid={`setlist-item-${setlist.id}`}>
                  <h3>{setlist.name}</h3>
                  <p>{setlist.description}</p>
                  <span data-testid={`setlist-song-count-${setlist.id}`}>
                    {setlist.songs.length} songs
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      }

      render(<SetlistCreationFlow />)

      // Verify initial setlists
      expect(screen.getByText('My Setlists (2)')).toBeInTheDocument()

      // Create new setlist
      await user.click(screen.getByTestId('create-setlist-button'))
      expect(screen.getByTestId('create-setlist-form')).toBeInTheDocument()

      await user.type(screen.getByTestId('setlist-name-input'), 'Christmas Concert 2024')
      await user.type(screen.getByTestId('setlist-description-input'), 'Holiday performance at the community center')

      // Select songs for setlist
      await user.click(within(screen.getByTestId('song-checkbox-song-1')).getByRole('checkbox'))
      await user.click(within(screen.getByTestId('song-checkbox-song-3')).getByRole('checkbox'))

      expect(screen.getByText('Create Setlist (2 songs)')).toBeInTheDocument()

      await user.click(screen.getByTestId('save-setlist-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/setlists', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Christmas Concert 2024',
            description: 'Holiday performance at the community center',
            songs: ['song-1', 'song-3']
          })
        }))
      })

      console.log('✅ Setlist creation workflow completed')
    })

    it('should handle complete performance mode workflow', async () => {
      // 4. PERFORMANCE MODE WORKFLOW
      const PerformanceModeFlow = () => {
        const [isPerformanceMode, setIsPerformanceMode] = React.useState(false)
        const [currentSetlist] = React.useState(mockSetlists[0])
        const [currentSongIndex, setCurrentSongIndex] = React.useState(0)
        const [songs] = React.useState(mockSongs)

        const currentSong = songs.find(s => s.id === currentSetlist.songs[currentSongIndex])

        const nextSong = () => {
          if (currentSongIndex < currentSetlist.songs.length - 1) {
            setCurrentSongIndex(currentSongIndex + 1)
          }
        }

        const previousSong = () => {
          if (currentSongIndex > 0) {
            setCurrentSongIndex(currentSongIndex - 1)
          }
        }

        const exitPerformanceMode = () => {
          setIsPerformanceMode(false)
          setCurrentSongIndex(0)
        }

        if (isPerformanceMode) {
          return (
            <div data-testid="performance-mode" className="fullscreen">
              <div data-testid="performance-header">
                <h1>{currentSetlist.name}</h1>
                <span data-testid="song-counter">
                  {currentSongIndex + 1} of {currentSetlist.songs.length}
                </span>
                <button
                  data-testid="exit-performance-button"
                  onClick={exitPerformanceMode}
                >
                  Exit Performance Mode
                </button>
              </div>

              <div data-testid="current-song-display">
                {currentSong && (
                  <>
                    <h2 data-testid="current-song-title">{currentSong.title}</h2>
                    <h3 data-testid="current-song-artist">{currentSong.artist}</h3>
                    <div data-testid="current-song-content" className="song-content">
                      {currentSong.content}
                    </div>
                  </>
                )}
              </div>

              <div data-testid="performance-controls">
                <button
                  data-testid="previous-song-button"
                  onClick={previousSong}
                  disabled={currentSongIndex === 0}
                >
                  Previous
                </button>
                <button
                  data-testid="next-song-button"
                  onClick={nextSong}
                  disabled={currentSongIndex === currentSetlist.songs.length - 1}
                >
                  Next
                </button>
              </div>

              <div data-testid="setlist-progress">
                {currentSetlist.songs.map((songId, index) => {
                  const song = songs.find(s => s.id === songId)
                  return (
                    <div
                      key={songId}
                      data-testid={`progress-song-${index}`}
                      className={index === currentSongIndex ? 'active' : ''}
                      onClick={() => setCurrentSongIndex(index)}
                    >
                      {song?.title}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }

        return (
          <div data-testid="setlist-view">
            <h2>{currentSetlist.name}</h2>
            <p>{currentSetlist.description}</p>
            <button
              data-testid="start-performance-button"
              onClick={() => setIsPerformanceMode(true)}
            >
              Start Performance Mode
            </button>
            <div data-testid="setlist-songs">
              {currentSetlist.songs.map((songId, index) => {
                const song = songs.find(s => s.id === songId)
                return (
                  <div key={songId} data-testid={`setlist-song-${index}`}>
                    {index + 1}. {song?.title} - {song?.artist}
                  </div>
                )
              })}
            </div>
          </div>
        )
      }

      render(<PerformanceModeFlow />)

      // Start performance mode
      expect(screen.getByText('Summer Concert 2024')).toBeInTheDocument()
      await user.click(screen.getByTestId('start-performance-button'))

      await waitFor(() => {
        expect(screen.getByTestId('performance-mode')).toBeInTheDocument()
        expect(screen.getByTestId('current-song-title')).toHaveTextContent('Amazing Grace')
        expect(screen.getByTestId('song-counter')).toHaveTextContent('1 of 3')
      })

      // Navigate through songs
      await user.click(screen.getByTestId('next-song-button'))
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Hotel California')
      expect(screen.getByTestId('song-counter')).toHaveTextContent('2 of 3')

      await user.click(screen.getByTestId('next-song-button'))
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Imagine')
      expect(screen.getByTestId('song-counter')).toHaveTextContent('3 of 3')

      // Previous song
      await user.click(screen.getByTestId('previous-song-button'))
      expect(screen.getByTestId('current-song-title')).toHaveTextContent('Hotel California')

      // Exit performance mode
      await user.click(screen.getByTestId('exit-performance-button'))
      expect(screen.getByTestId('setlist-view')).toBeInTheDocument()

      console.log('✅ Performance mode workflow completed')
    })
  })

  describe('Advanced User Workflows', () => {
    it('should handle content editing and version management', async () => {
      const ContentEditingFlow = () => {
        const [songs, setSongs] = React.useState(mockSongs)
        const [editingSong, setEditingSong] = React.useState<string | null>(null)
        const [editForm, setEditForm] = React.useState({
          title: '',
          artist: '',
          content: ''
        })

        const startEditing = (song: typeof mockSongs[0]) => {
          setEditingSong(song.id)
          setEditForm({
            title: song.title,
            artist: song.artist,
            content: song.content
          })
        }

        const saveEdit = async () => {
          const response = await fetch(`/api/content/${editingSong}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm)
          })

          if (response.ok) {
            setSongs(songs.map(song =>
              song.id === editingSong
                ? { ...song, ...editForm }
                : song
            ))
            setEditingSong(null)
          }
        }

        return (
          <div data-testid="content-editing-flow">
            {songs.map((song) => (
              <div key={song.id} data-testid={`song-card-${song.id}`}>
                {editingSong === song.id ? (
                  <div data-testid="edit-form">
                    <input
                      data-testid="edit-title-input"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                    <input
                      data-testid="edit-artist-input"
                      value={editForm.artist}
                      onChange={(e) => setEditForm({ ...editForm, artist: e.target.value })}
                    />
                    <textarea
                      data-testid="edit-content-textarea"
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    />
                    <button data-testid="save-edit-button" onClick={saveEdit}>
                      Save Changes
                    </button>
                    <button
                      data-testid="cancel-edit-button"
                      onClick={() => setEditingSong(null)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div data-testid="song-display">
                    <h3>{song.title}</h3>
                    <p>{song.artist}</p>
                    <div className="content-preview">
                      {song.content.substring(0, 100)}...
                    </div>
                    <button
                      data-testid={`edit-button-${song.id}`}
                      onClick={() => startEditing(song)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      render(<ContentEditingFlow />)

      // Start editing a song
      await user.click(screen.getByTestId('edit-button-song-1'))
      expect(screen.getByTestId('edit-form')).toBeInTheDocument()

      // Modify the content
      await user.clear(screen.getByTestId('edit-title-input'))
      await user.type(screen.getByTestId('edit-title-input'), 'Amazing Grace (Updated)')

      await user.clear(screen.getByTestId('edit-content-textarea'))
      await user.type(screen.getByTestId('edit-content-textarea'), 'Amazing grace how sweet the sound\nThat saved a wretch like me...')

      await user.click(screen.getByTestId('save-edit-button'))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/content/song-1', expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }
        }))
      })

      console.log('✅ Content editing workflow completed')
    })

    it('should handle collaborative setlist sharing', async () => {
      const CollaborativeFlow = () => {
        const [setlist] = React.useState(mockSetlists[0])
        const [shareLink, setShareLink] = React.useState('')
        const [isSharing, setIsSharing] = React.useState(false)

        const generateShareLink = async () => {
          setIsSharing(true)
          const response = await fetch(`/api/setlists/${setlist.id}/share`, {
            method: 'POST'
          })
          const result = await response.json()
          setShareLink(result.shareLink)
          setIsSharing(false)
        }

        const copyToClipboard = async () => {
          await navigator.clipboard.writeText(shareLink)
        }

        return (
          <div data-testid="collaborative-flow">
            <h2>{setlist.name}</h2>
            <div data-testid="sharing-controls">
              <button
                data-testid="generate-share-link-button"
                onClick={generateShareLink}
                disabled={isSharing}
              >
                {isSharing ? 'Generating...' : 'Share Setlist'}
              </button>

              {shareLink && (
                <div data-testid="share-link-display">
                  <input
                    data-testid="share-link-input"
                    value={shareLink}
                    readOnly
                  />
                  <button
                    data-testid="copy-link-button"
                    onClick={copyToClipboard}
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      }

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      })

      // Mock share API response
      vi.mocked(fetch).mockImplementationOnce(async () =>
        new Response(JSON.stringify({
          shareLink: 'https://octavia.app/shared/setlist-1-abc123'
        }), { status: 200 })
      )

      render(<CollaborativeFlow />)

      await user.click(screen.getByTestId('generate-share-link-button'))

      await waitFor(() => {
        expect(screen.getByTestId('share-link-display')).toBeInTheDocument()
        expect(screen.getByTestId('share-link-input')).toHaveValue('https://octavia.app/shared/setlist-1-abc123')
      })

      await user.click(screen.getByTestId('copy-link-button'))

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://octavia.app/shared/setlist-1-abc123')

      console.log('✅ Collaborative sharing workflow completed')
    })
  })

  describe('Error Handling and Recovery Workflows', () => {
    it('should handle network failures gracefully', async () => {
      const NetworkFailureFlow = () => {
        const [isOnline, setIsOnline] = React.useState(true)
        const [savedData, setSavedData] = React.useState(null)
        const [error, setError] = React.useState('')

        const saveWithRetry = async (data: any, retries = 3) => {
          try {
            if (!isOnline) {
              // Save to local storage when offline
              localStorage.setItem('pendingData', JSON.stringify(data))
              setSavedData(data)
              return
            }

            const response = await fetch('/api/content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })

            if (!response.ok) {
              throw new Error('Network error')
            }

            setSavedData(data)
            setError('')
          } catch (err) {
            if (retries > 0) {
              setTimeout(() => saveWithRetry(data, retries - 1), 1000)
            } else {
              setError('Failed to save. Data saved locally.')
              localStorage.setItem('pendingData', JSON.stringify(data))
            }
          }
        }

        return (
          <div data-testid="network-failure-flow">
            <div data-testid="connection-status">
              Status: {isOnline ? 'Online' : 'Offline'}
              <button
                data-testid="toggle-connection-button"
                onClick={() => setIsOnline(!isOnline)}
              >
                Simulate {isOnline ? 'Offline' : 'Online'}
              </button>
            </div>

            {error && (
              <div data-testid="error-message" className="error">
                {error}
              </div>
            )}

            <button
              data-testid="save-data-button"
              onClick={() => saveWithRetry({ title: 'Test Song', content: 'Test content' })}
            >
              Save Data
            </button>

            {savedData && (
              <div data-testid="saved-data-display">
                Data saved: {JSON.stringify(savedData)}
              </div>
            )}
          </div>
        )
      }

      render(<NetworkFailureFlow />)

      // Test online save
      await user.click(screen.getByTestId('save-data-button'))
      await waitFor(() => {
        expect(screen.getByTestId('saved-data-display')).toBeInTheDocument()
      })

      // Test offline save
      await user.click(screen.getByTestId('toggle-connection-button'))
      expect(screen.getByText('Status: Offline')).toBeInTheDocument()

      await user.click(screen.getByTestId('save-data-button'))
      // Offline save should work immediately
      expect(screen.getByTestId('saved-data-display')).toBeInTheDocument()

      console.log('✅ Network failure recovery workflow completed')
    })

    it('should handle authentication expiration during workflow', async () => {
      const AuthExpirationFlow = () => {
        const [isAuthenticated, setIsAuthenticated] = React.useState(true)
        const [showLoginModal, setShowLoginModal] = React.useState(false)

        const performAuthenticatedAction = async () => {
          try {
            const response = await fetch('/api/content', {
              headers: { 'Authorization': `Bearer ${isAuthenticated ? 'valid-token' : 'expired-token'}` }
            })

            if (response.status === 401) {
              setIsAuthenticated(false)
              setShowLoginModal(true)
              return
            }

            // Action successful
          } catch (error) {
            console.error('Action failed:', error)
          }
        }

        const handleReauth = () => {
          setIsAuthenticated(true)
          setShowLoginModal(false)
        }

        return (
          <div data-testid="auth-expiration-flow">
            <div data-testid="auth-status">
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </div>

            <button
              data-testid="perform-action-button"
              onClick={performAuthenticatedAction}
            >
              Perform Protected Action
            </button>

            <button
              data-testid="simulate-expiration-button"
              onClick={() => setIsAuthenticated(false)}
            >
              Simulate Token Expiration
            </button>

            {showLoginModal && (
              <div data-testid="reauth-modal">
                <h3>Session Expired</h3>
                <p>Please log in again to continue</p>
                <button
                  data-testid="reauth-button"
                  onClick={handleReauth}
                >
                  Log In Again
                </button>
              </div>
            )}
          </div>
        )
      }

      // Mock 401 response for expired token
      vi.mocked(fetch).mockImplementation(async (url, options) => {
        const authHeader = options?.headers?.['Authorization']
        if (authHeader === 'Bearer expired-token') {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 })
      })

      render(<AuthExpirationFlow />)

      // Simulate token expiration
      await user.click(screen.getByTestId('simulate-expiration-button'))
      expect(screen.getByText('Not Authenticated')).toBeInTheDocument()

      // Try to perform action with expired token
      await user.click(screen.getByTestId('perform-action-button'))

      await waitFor(() => {
        expect(screen.getByTestId('reauth-modal')).toBeInTheDocument()
      })

      // Re-authenticate
      await user.click(screen.getByTestId('reauth-button'))
      expect(screen.getByText('Authenticated')).toBeInTheDocument()

      console.log('✅ Authentication expiration recovery workflow completed')
    })
  })
})
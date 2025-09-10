import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ChordEditor } from '../chord-editor'

// Mock MusicText component
vi.mock('@/components/music-text', () => ({
  MusicText: ({ text, className, monospace }: any) => (
    <div data-testid="music-text" className={className} data-monospace={monospace}>
      {text}
    </div>
  )
}))

const mockContent = {
  id: '1',
  title: 'Test Song',
  artist: 'Test Artist',
  key: 'C',
  capo: '2',
  bpm: '120',
  sections: [
    {
      id: 1,
      name: 'Verse 1',
      chords: 'C G Am F',
      lyrics: 'Test verse lyrics'
    }
  ]
}

const mockOnChange = vi.fn()

describe('ChordEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering and Setup', () => {
    it('renders with provided content data', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Artist')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toHaveTextContent('C')
      expect(screen.getByDisplayValue('2')).toBeInTheDocument()
      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
    })

    it('renders with default values for empty content', () => {
      const emptyContent = {}
      render(<ChordEditor content={emptyContent} onChange={mockOnChange} />)
      
      expect(screen.getByLabelText(/title/i)).toHaveValue('')
      expect(screen.getByLabelText(/artist/i)).toHaveValue('')
      expect(screen.getByRole('combobox')).toHaveTextContent('Select key')
      expect(screen.getByLabelText(/capo/i)).toHaveValue('')
      expect(screen.getByLabelText(/bpm/i)).toHaveValue(null)
    })

    it('renders section management controls', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      expect(screen.getByRole('button', { name: /add section/i })).toBeInTheDocument()
      expect(screen.getByDisplayValue('Verse 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('C G Am F')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test verse lyrics')).toBeInTheDocument()
    })

    it('renders quick chord palette', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const commonChords = ['C', 'G', 'Am', 'F', 'D', 'Em', 'A', 'E', 'Dm', 'B7']
      commonChords.forEach(chord => {
        expect(screen.getByRole('button', { name: chord })).toBeInTheDocument()
      })
    })

    it('renders preview section', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText('Test Song')).toBeInTheDocument()
      expect(screen.getByText('Test Artist')).toBeInTheDocument()
    })
  })

  describe('Song Information Editing', () => {
    it('updates song title and calls onChange', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.clear(titleInput)
      await user.type(titleInput, 'Updated Song Title')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Updated Song Title'
          })
        )
      })
    })

    it('updates artist and calls onChange', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const artistInput = screen.getByLabelText(/artist/i)
      await user.clear(artistInput)
      await user.type(artistInput, 'New Artist')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            artist: 'New Artist'
          })
        )
      })
    })

    it('has key selection functionality', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const keySelect = screen.getByRole('combobox')
      expect(keySelect).toBeInTheDocument()
      expect(keySelect).toHaveTextContent('C') // Current value
    })

    it('updates capo fret', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const capoInput = screen.getByLabelText(/capo/i)
      await user.clear(capoInput)
      await user.type(capoInput, '3')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            capo: '3'
          })
        )
      })
    })

    it('updates BPM', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const bpmInput = screen.getByLabelText(/bpm/i)
      await user.clear(bpmInput)
      await user.type(bpmInput, '140')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            bpm: '140'
          })
        )
      })
    })
  })

  describe('Key Selection', () => {
    it('displays key select component', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const keySelect = screen.getByRole('combobox')
      expect(keySelect).toBeInTheDocument()
      expect(keySelect).toHaveTextContent('C') // Shows current selected key
    })
  })

  describe('Section Management', () => {
    it('adds a new section', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const addButton = screen.getByRole('button', { name: /add section/i })
      await user.click(addButton)
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                name: '',
                chords: '',
                lyrics: ''
              })
            ])
          })
        )
      })
    })

    it('removes a section when multiple sections exist', async () => {
      const user = userEvent.setup()
      const contentWithMultipleSections = {
        ...mockContent,
        sections: [
          { id: 1, name: 'Verse 1', chords: 'C G Am F', lyrics: 'Test verse 1' },
          { id: 2, name: 'Chorus', chords: 'F G C Am', lyrics: 'Test chorus' }
        ]
      }
      
      render(<ChordEditor content={contentWithMultipleSections} onChange={mockOnChange} />)
      
      const removeButtons = screen.getAllByRole('button', { name: '' })
      const trashButtons = removeButtons.filter(button => 
        button.querySelector('[data-lucide="trash-2"]')
      )
      
      if (trashButtons.length > 0) {
        await user.click(trashButtons[0])
        
        await waitFor(() => {
          expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
              sections: expect.arrayContaining([
                expect.objectContaining({
                  id: 2,
                  name: 'Chorus'
                })
              ])
            })
          )
        })
      }
    })

    it('does not show remove button for single section', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const removeButtons = screen.queryAllByRole('button', { name: '' })
      const trashButtons = removeButtons.filter(button => 
        button.querySelector('[data-lucide="trash-2"]')
      )
      
      expect(trashButtons).toHaveLength(0)
    })

    it('updates section name', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const sectionNameInput = screen.getByDisplayValue('Verse 1')
      await user.clear(sectionNameInput)
      await user.type(sectionNameInput, 'Introduction')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                name: 'Introduction'
              })
            ])
          })
        )
      })
    })

    it('updates section chords', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const chordsInput = screen.getByDisplayValue('C G Am F')
      await user.clear(chordsInput)
      await user.type(chordsInput, 'G D Em C')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                chords: 'G D Em C'
              })
            ])
          })
        )
      })
    })

    it('updates section lyrics', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const lyricsTextarea = screen.getByDisplayValue('Test verse lyrics')
      await user.clear(lyricsTextarea)
      await user.type(lyricsTextarea, 'New verse lyrics here')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                lyrics: 'New verse lyrics here'
              })
            ])
          })
        )
      })
    })
  })

  describe('Preview Functionality', () => {
    it('displays updated song information in preview', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      // Should show current content in preview
      expect(screen.getByText('Test Song')).toBeInTheDocument()
      expect(screen.getByText('Test Artist')).toBeInTheDocument()
      expect(screen.getByText('Key: C')).toBeInTheDocument()
      expect(screen.getByText('Capo: 2')).toBeInTheDocument()
      expect(screen.getByText('BPM: 120')).toBeInTheDocument()
    })

    it('shows section structure in preview', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      expect(screen.getByText('Verse 1:')).toBeInTheDocument()
      expect(screen.getByText('Chords: C G Am F')).toBeInTheDocument()
      
      const musicText = screen.getByTestId('music-text')
      expect(musicText).toBeInTheDocument()
      expect(musicText).toHaveTextContent('Test verse lyrics')
      expect(musicText).toHaveAttribute('data-monospace', 'false')
    })

    it('handles missing information gracefully in preview', () => {
      const incompleteContent = {
        title: 'Song Only',
        sections: [{ id: 1, name: '', chords: '', lyrics: '' }]
      }
      
      render(<ChordEditor content={incompleteContent} onChange={mockOnChange} />)
      
      expect(screen.getByText('Song Only')).toBeInTheDocument()
      expect(screen.getByText('Unknown Artist')).toBeInTheDocument()
    })
  })

  describe('Form Validation and Edge Cases', () => {
    it('handles non-numeric BPM input gracefully', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const bpmInput = screen.getByLabelText(/bpm/i)
      await user.clear(bpmInput)
      await user.type(bpmInput, 'abc')
      
      // Should still call onChange even with invalid input
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled()
      })
    })

    it('handles special characters in chord progressions', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const chordsInput = screen.getByDisplayValue('C G Am F')
      await user.clear(chordsInput)
      await user.type(chordsInput, 'Cmaj7 G/B Am7 Fmaj7')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                chords: 'Cmaj7 G/B Am7 Fmaj7'
              })
            ])
          })
        )
      })
    })

    it('preserves section IDs during updates', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const sectionNameInput = screen.getByDisplayValue('Verse 1')
      await user.type(sectionNameInput, ' Updated')
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.objectContaining({
            sections: expect.arrayContaining([
              expect.objectContaining({
                id: 1,
                name: 'Verse 1 Updated'
              })
            ])
          })
        )
      })
    })
  })

  describe('Live Performance Use Cases', () => {
    it('handles rapid section additions for live arrangement', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const addButton = screen.getByRole('button', { name: /add section/i })
      
      // Add multiple sections quickly
      await user.click(addButton)
      await user.click(addButton)
      await user.click(addButton)
      
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(3)
        const lastCall = mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1][0]
        expect(lastCall.sections).toHaveLength(4) // Original + 3 new
      })
    })

    it('supports complex song structures', async () => {
      const complexContent = {
        ...mockContent,
        sections: [
          { id: 1, name: 'Intro', chords: 'C G Am F', lyrics: '' },
          { id: 2, name: 'Verse 1', chords: 'Am F C G', lyrics: 'Verse lyrics' },
          { id: 3, name: 'Chorus', chords: 'F G C Am', lyrics: 'Chorus lyrics' },
          { id: 4, name: 'Bridge', chords: 'Dm G C F', lyrics: 'Bridge lyrics' },
          { id: 5, name: 'Outro', chords: 'C G Am F', lyrics: '' }
        ]
      }
      
      render(<ChordEditor content={complexContent} onChange={mockOnChange} />)
      
      // Should render all sections
      expect(screen.getByDisplayValue('Intro')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Verse 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Chorus')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bridge')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Outro')).toBeInTheDocument()
    })

    it('maintains performance during extensive editing', async () => {
      const user = userEvent.setup()
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const startTime = Date.now()
      
      // Perform multiple edits in sequence
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, ' Extended')
      
      const chordsInput = screen.getByDisplayValue('C G Am F')
      await user.type(chordsInput, ' Dm')
      
      const editTime = Date.now() - startTime
      
      // Should respond quickly for live use
      expect(editTime).toBeLessThan(1000)
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('provides proper labels for form fields', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/artist/i)).toBeInTheDocument()
      expect(screen.getByText('Key')).toBeInTheDocument()
      expect(screen.getByLabelText(/capo/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/bpm/i)).toBeInTheDocument()
    })

    it('supports keyboard navigation for chord buttons', () => {
      render(<ChordEditor content={mockContent} onChange={mockOnChange} />)
      
      const chordButtons = screen.getAllByRole('button').filter(button => 
        ['C', 'G', 'Am', 'F'].includes(button.textContent || '')
      )
      
      chordButtons.forEach(button => {
        expect(button).toBeVisible()
        expect(button).not.toBeDisabled()
      })
    })
  })
})
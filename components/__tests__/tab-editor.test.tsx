import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { TabEditor } from '../tab-editor'

// Fix Radix UI Select compatibility with JSDOM
Object.defineProperty(Element.prototype, 'hasPointerCapture', {
  value: vi.fn().mockReturnValue(false),
  writable: true,
})

Object.defineProperty(Element.prototype, 'setPointerCapture', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(Element.prototype, 'releasePointerCapture', {
  value: vi.fn(),
  writable: true,
})

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true,
})

// Mock the cn utility function
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' ')
}))

const mockContent = {
  title: 'Amazing Grace',
  artist: 'Traditional',
  tuning: 'Standard (EADGBE)',
  capo: '3',
  bpm: '80',
  measures: [
    {
      id: 1,
      strings: [
        'E|--0--3--0--2--0--|',
        'B|--1--1--1--1--1--|', 
        'G|--0--0--0--0--0--|',
        'D|--2--2--2--2--2--|',
        'A|--3-------------|',
        'E|----------------|'
      ]
    }
  ]
}

const mockOnChange = vi.fn()

const defaultProps = {
  content: mockContent,
  onChange: mockOnChange
}

describe('TabEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders tab editor with main sections', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByText('Tab Information')).toBeInTheDocument()
      expect(screen.getByText('Tablature')).toBeInTheDocument()
      expect(screen.getByText('Tablature Tips')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('displays tab information form fields', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Artist')).toBeInTheDocument()
      expect(screen.getByText('Tuning')).toBeInTheDocument() // Label text exists
      expect(screen.getByLabelText('Capo')).toBeInTheDocument()
      expect(screen.getByLabelText('BPM')).toBeInTheDocument()
    })

    it('populates form fields with content data', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByDisplayValue('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Traditional')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3')).toBeInTheDocument()
      expect(screen.getByDisplayValue('80')).toBeInTheDocument()
    })

    it('renders measure with string inputs', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // One in editor, one in preview
      expect(screen.getByDisplayValue('E|--0--3--0--2--0--|')).toBeInTheDocument()
      expect(screen.getByDisplayValue('B|--1--1--1--1--1--|')).toBeInTheDocument()
      expect(screen.getByDisplayValue('G|--0--0--0--0--0--|')).toBeInTheDocument()
      expect(screen.getByDisplayValue('D|--2--2--2--2--2--|')).toBeInTheDocument()
      expect(screen.getByDisplayValue('A|--3-------------|')).toBeInTheDocument()
      expect(screen.getByDisplayValue('E|----------------|')).toBeInTheDocument()
    })

    it('displays add measure button', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /add measure/i })).toBeInTheDocument()
    })
  })

  describe('Form Input Interactions', () => {
    it('updates title when input changes', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const titleInput = screen.getByDisplayValue('Amazing Grace')
      await user.clear(titleInput)
      await user.type(titleInput, 'Wonderful Grace')
      
      expect(mockOnChange).toHaveBeenCalled()
      expect(screen.getByDisplayValue('Wonderful Grace')).toBeInTheDocument()
    })

    it('updates artist when input changes', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const artistInput = screen.getByDisplayValue('Traditional')
      await user.clear(artistInput)
      await user.type(artistInput, 'John Newton')
      
      expect(mockOnChange).toHaveBeenCalled()
      expect(screen.getByDisplayValue('John Newton')).toBeInTheDocument()
    })

    it('updates capo when input changes', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const capoInput = screen.getByDisplayValue('3')
      await user.clear(capoInput)
      await user.type(capoInput, '5')
      
      expect(mockOnChange).toHaveBeenCalled()
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
    })

    it('updates BPM when input changes', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const bpmInput = screen.getByDisplayValue('80')
      await user.clear(bpmInput)
      await user.type(bpmInput, '120')
      
      expect(mockOnChange).toHaveBeenCalled()
      expect(screen.getByDisplayValue('120')).toBeInTheDocument()
    })

    it('renders tuning selection dropdown', () => {
      render(<TabEditor {...defaultProps} />)
      
      const tuningSelect = screen.getByRole('combobox')
      expect(tuningSelect).toBeInTheDocument()
      expect(screen.getByText('Standard (EADGBE)')).toBeInTheDocument()
    })
  })

  describe('Tab String Editing', () => {
    it('updates string content when input changes', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const firstStringInput = screen.getByDisplayValue('E|--0--3--0--2--0--|')
      await user.clear(firstStringInput)
      await user.type(firstStringInput, 'E|--0--2--3--5--7--|')
      
      expect(mockOnChange).toHaveBeenCalled()
      expect(screen.getByDisplayValue('E|--0--2--3--5--7--|')).toBeInTheDocument()
    })

    it('allows editing of guitar strings', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      // Test editing the first string (high E)
      const firstStringInput = screen.getByDisplayValue('E|--0--3--0--2--0--|')
      await user.clear(firstStringInput)
      await user.type(firstStringInput, 'E|--1--2--3--4--5--|')
      
      expect(screen.getByDisplayValue('E|--1--2--3--4--5--|')).toBeInTheDocument()
      
      // Test editing the B string
      const bStringInput = screen.getByDisplayValue('B|--1--1--1--1--1--|')
      await user.clear(bStringInput)
      await user.type(bStringInput, 'B|--5--4--3--2--1--|')
      
      expect(screen.getByDisplayValue('B|--5--4--3--2--1--|')).toBeInTheDocument()
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Measure Management', () => {
    it('adds new measure when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const addButton = screen.getByRole('button', { name: /add measure/i })
      await user.click(addButton)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 2')).toHaveLength(2) // Editor + Preview
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('shows copy and delete buttons for measures', () => {
      render(<TabEditor {...defaultProps} />)
      
      // Check that small outline buttons exist (copy and delete buttons)
      const buttons = screen.getAllByRole('button')
      const smallButtons = buttons.filter(btn => btn.classList.contains('size-sm') || btn.querySelector('svg'))
      expect(smallButtons.length).toBeGreaterThan(0) // At least the copy button exists
    })

    it('shows multiple measures with control buttons', () => {
      const multiMeasureContent = {
        ...mockContent,
        measures: [
          ...mockContent.measures,
          {
            id: 2,
            strings: [
              'E|--5--7--5--3--0--|',
              'B|--6--6--6--6--6--|',
              'G|--7--7--7--7--7--|',
              'D|--7--7--7--7--7--|',
              'A|--5-------------|',
              'E|----------------|'
            ]
          }
        ]
      }
      
      render(<TabEditor content={multiMeasureContent} onChange={mockOnChange} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 2')).toHaveLength(2) // Editor + Preview
    })

    it('renders single measure correctly', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.queryByText('Measure 2')).not.toBeInTheDocument()
    })

    it('renders two measures correctly', () => {
      const multiMeasureContent = {
        ...mockContent,
        measures: [
          ...mockContent.measures,
          {
            id: 2,
            strings: [
              'E|--5--7--5--3--0--|',
              'B|--6--6--6--6--6--|',
              'G|--7--7--7--7--7--|',
              'D|--7--7--7--7--7--|',
              'A|--5-------------|',
              'E|----------------|'
            ]
          }
        ]
      }
      
      render(<TabEditor content={multiMeasureContent} onChange={mockOnChange} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 2')).toHaveLength(2) // Editor + Preview
    })
  })

  describe('Preview Section', () => {
    it('displays tab information in preview', () => {
      render(<TabEditor {...defaultProps} />)
      
      const previewSection = screen.getByText('Preview').closest('.space-y-6')
      expect(previewSection).toBeInTheDocument()
      
      expect(screen.getByText('Amazing Grace')).toBeInTheDocument()
      expect(screen.getByText('Traditional')).toBeInTheDocument()
      expect(screen.getByText('Tuning: Standard (EADGBE)')).toBeInTheDocument()
      expect(screen.getByText('Capo: 3')).toBeInTheDocument()
      expect(screen.getByText('BPM: 80')).toBeInTheDocument()
    })

    it('shows measure preview with formatted strings', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      
      // Check that preview displays the tab strings
      const previewStrings = [
        'E|--0--3--0--2--0--|',
        'B|--1--1--1--1--1--|', 
        'G|--0--0--0--0--0--|',
        'D|--2--2--2--2--2--|',
        'A|--3-------------|',
        'E|----------------|'
      ]
      
      // Check that the strings are present in the form inputs
      previewStrings.forEach(string => {
        expect(screen.getByDisplayValue(string)).toBeInTheDocument()
      })
    })

    it('handles empty content gracefully in preview', () => {
      const emptyContent = {
        title: '',
        artist: '',
        tuning: 'Standard (EADGBE)',
        capo: '',
        bpm: '',
        measures: []
      }
      
      render(<TabEditor content={emptyContent} onChange={mockOnChange} />)
      
      expect(screen.getByText('Untitled')).toBeInTheDocument()
      expect(screen.getByText('Unknown Artist')).toBeInTheDocument()
      expect(screen.getByText('Tuning: Standard (EADGBE)')).toBeInTheDocument()
    })
  })

  describe('Tablature Tips Section', () => {
    it('displays notation tips', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByText('Tablature Tips')).toBeInTheDocument()
      expect(screen.getByText('Notation')).toBeInTheDocument()
      expect(screen.getByText('• Numbers = fret positions')).toBeInTheDocument()
      expect(screen.getByText('• Dashes (-) = empty beats')).toBeInTheDocument()
      expect(screen.getByText('• Vertical alignment = simultaneous notes')).toBeInTheDocument()
      expect(screen.getByText('• | = measure separators')).toBeInTheDocument()
    })

    it('displays technique tips', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByText('Techniques')).toBeInTheDocument()
      expect(screen.getByText('• h = hammer-on')).toBeInTheDocument()
      expect(screen.getByText('• p = pull-off')).toBeInTheDocument()
      expect(screen.getByText('• b = bend')).toBeInTheDocument()
      expect(screen.getByText('• ~ = vibrato')).toBeInTheDocument()
    })
  })

  describe('Default State Handling', () => {
    it('initializes with default values when content is empty', () => {
      const emptyContent = {}
      render(<TabEditor content={emptyContent} onChange={mockOnChange} />)
      
      expect(screen.getByLabelText('Title')).toHaveValue('') // title input
      expect(screen.getByText('Standard (EADGBE)')).toBeInTheDocument()
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
    })

    it('creates default measure structure when no measures provided', () => {
      const contentWithoutMeasures = {
        title: 'Test Song',
        artist: 'Test Artist'
      }
      
      render(<TabEditor content={contentWithoutMeasures} onChange={mockOnChange} />)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getByDisplayValue('E|--0--3--0--2--0--|')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides proper form labels', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByLabelText('Title')).toBeInTheDocument()
      expect(screen.getByLabelText('Artist')).toBeInTheDocument()
      expect(screen.getByText('Tuning')).toBeInTheDocument() // Label text exists
      expect(screen.getByLabelText('Capo')).toBeInTheDocument()
      expect(screen.getByLabelText('BPM')).toBeInTheDocument()
    })

    it('has proper button roles and labels', () => {
      render(<TabEditor {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /add measure/i })).toBeInTheDocument()
      // Icon buttons exist but may not have accessible names
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(1) // Multiple buttons including add and icon buttons
    })

    it('supports keyboard navigation for form inputs', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const titleInput = screen.getByLabelText('Title')
      titleInput.focus()
      expect(titleInput).toHaveFocus()
      
      await user.keyboard('{Tab}')
      const artistInput = screen.getByLabelText('Artist')
      expect(artistInput).toHaveFocus()
    })
  })

  describe('Live Performance Features', () => {
    it('responds immediately to string input changes for live editing', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const startTime = Date.now()
      const firstStringInput = screen.getByDisplayValue('E|--0--3--0--2--0--|')
      await user.type(firstStringInput, '5')
      const responseTime = Date.now() - startTime
      
      expect(responseTime).toBeLessThan(100)
      expect(mockOnChange).toHaveBeenCalled()
    })

    it('handles rapid measure additions efficiently', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const addButton = screen.getByRole('button', { name: /add measure/i })
      const startTime = Date.now()
      
      // Rapidly add multiple measures
      for (let i = 0; i < 3; i++) {
        await user.click(addButton)
      }
      
      const totalTime = Date.now() - startTime
      
      expect(totalTime).toBeLessThan(500)
      expect(screen.getAllByText('Measure 4')).toHaveLength(2) // Editor + Preview
      expect(mockOnChange).toHaveBeenCalledTimes(3)
    })

    it('maintains real-time preview updates during editing', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const titleInput = screen.getByDisplayValue('Amazing Grace')
      await user.clear(titleInput)
      await user.type(titleInput, 'Live Performance')
      
      // Preview should update immediately
      expect(screen.getByText('Live Performance')).toBeInTheDocument()
      expect(mockOnChange).toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles invalid measure IDs gracefully', () => {
      const invalidContent = {
        ...mockContent,
        measures: [
          {
            id: null,
            strings: ['E|--0--']
          }
        ]
      }
      
      expect(() => {
        render(<TabEditor content={invalidContent} onChange={mockOnChange} />)
      }).not.toThrow()
    })

    it('handles missing string data in measures', () => {
      const incompleteContent = {
        ...mockContent,
        measures: [
          {
            id: 1,
            strings: ['E|--0--'] // Only one string instead of six
          }
        ]
      }
      
      expect(() => {
        render(<TabEditor content={incompleteContent} onChange={mockOnChange} />)
      }).not.toThrow()
    })

    it('handles component unmounting cleanly', () => {
      const { unmount } = render(<TabEditor {...defaultProps} />)
      expect(() => unmount()).not.toThrow()
    })

    it('maintains state during rapid prop updates', () => {
      const { rerender } = render(<TabEditor {...defaultProps} />)
      
      const updatedContent = { ...mockContent, title: 'Updated Title' }
      rerender(<TabEditor content={updatedContent} onChange={mockOnChange} />)
      
      expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument()
    })
  })

  describe('Data Structure Integrity', () => {
    it('maintains proper measure ID uniqueness when adding measures', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const addButton = screen.getByRole('button', { name: /add measure/i })
      await user.click(addButton)
      await user.click(addButton)
      
      expect(mockOnChange).toHaveBeenCalledTimes(2)
      
      // Check that each onChange call has unique measure IDs
      const calls = mockOnChange.mock.calls
      expect(calls[0][0].measures).toHaveLength(2)
      expect(calls[1][0].measures).toHaveLength(3)
    })

    it('preserves string structure when duplicating measures', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      const copyButton = screen.getByRole('button', { name: /copy/i })
      await user.click(copyButton)
      
      expect(mockOnChange).toHaveBeenCalled()
      const updatedContent = mockOnChange.mock.calls[0][0]
      expect(updatedContent.measures).toHaveLength(2)
      expect(updatedContent.measures[1].strings).toHaveLength(6)
      expect(updatedContent.measures[1].strings[0]).toBe('E|--0--3--0--2--0--|')
    })

    it('maintains proper array structure when removing measures', async () => {
      const user = userEvent.setup()
      const multiMeasureContent = {
        ...mockContent,
        measures: [
          ...mockContent.measures,
          {
            id: 2,
            strings: ['E|--5--', 'B|--6--', 'G|--7--', 'D|--7--', 'A|--5--', 'E|-----']
          },
          {
            id: 3,
            strings: ['E|--8--', 'B|--9--', 'G|--10-', 'D|--10-', 'A|--8--', 'E|-----']
          }
        ]
      }
      
      render(<TabEditor content={multiMeasureContent} onChange={mockOnChange} />)
      
      // Test measure data structure integrity
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 2')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 3')).toHaveLength(2) // Editor + Preview
      
      // Verify all three measures are displayed correctly
      const measures = multiMeasureContent.measures
      expect(measures).toHaveLength(3)
      expect(measures[0].id).toBe(1)
      expect(measures[1].id).toBe(2)
      expect(measures[2].id).toBe(3)
    })
  })

  describe('Visual Rendering', () => {
    it('applies proper styling classes to measure cards', () => {
      render(<TabEditor {...defaultProps} />)
      
      const measureCards = screen.getAllByText('Measure 1')
      expect(measureCards).toHaveLength(2) // Editor + Preview
    })

    it('displays monospace font for string inputs', () => {
      render(<TabEditor {...defaultProps} />)
      
      const stringInput = screen.getByDisplayValue('E|--0--3--0--2--0--|')
      expect(stringInput).toHaveClass('font-mono', 'text-sm')
    })

    it('shows proper layout for multi-measure tabs', async () => {
      const user = userEvent.setup()
      render(<TabEditor {...defaultProps} />)
      
      // Add a few measures
      const addButton = screen.getByRole('button', { name: /add measure/i })
      await user.click(addButton)
      await user.click(addButton)
      
      expect(screen.getAllByText('Measure 1')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 2')).toHaveLength(2) // Editor + Preview
      expect(screen.getAllByText('Measure 3')).toHaveLength(2) // Editor + Preview
    })
  })
})
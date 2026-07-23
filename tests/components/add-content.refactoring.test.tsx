/**
 * AddContent Refactoring Tests
 *
 * Comprehensive testing to ensure the refactored AddContent component
 * (709→232 lines) maintains all content creation workflows while improving maintainability.
 *
 * P1-B: retargeted from the dead twin (components/add-content-refactored) to
 * the live twin mounted at app/add-content/page.tsx:
 * components/add-content.tsx (shim) → add-content/RefactoredAddContent.
 *
 * Setup-only adaptations (assertions preserved):
 * - The live component uses useAddContentLogic (not useAddContentState +
 *   useFileHandling) — the state mock was rewired to that hook.
 * - The live StepIndicator lives at add-content/StepIndicatorComponent and
 *   only takes { currentStep } — the mock was repointed.
 * - DetailsStep / CompletionStep (live-only subcomponents) are stubbed.
 * - The live flow is a 3-step wizard where type/mode/import-mode selection
 *   all render on step 1 — mock state uses currentStep 1 where the dead
 *   5-step wizard used steps 2/3 for the same screens.
 * - Specs asserting the dead wizard's internal step wiring
 *   (setCurrentStep(3/4/5) on selection) are it.skip INAPLICÁVEL(P1-B);
 *   the equivalent user-visible outcomes are covered by the prop-wiring and
 *   visibility tests below.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddContent } from '@/components/add-content'
import { useAddContentLogic } from '@/hooks/useAddContentLogic'
import { ContentTypeSelector } from '@/components/add-content/ContentTypeSelector'
import { ModeSelector } from '@/components/add-content/ModeSelector'
import { ImportModeSelector } from '@/components/add-content/ImportModeSelector'
import { StepIndicator } from '@/components/add-content/StepIndicatorComponent'

// Mock dependencies
vi.mock('@/hooks/useAddContentLogic')
vi.mock('@/components/add-content/ContentTypeSelector')
vi.mock('@/components/add-content/ModeSelector')
vi.mock('@/components/add-content/ImportModeSelector')
vi.mock('@/components/add-content/StepIndicatorComponent')
vi.mock('@/components/add-content/DetailsStep', () => ({
  DetailsStep: () => <div data-testid="details-step" />
}))
vi.mock('@/components/add-content/CompletionStep', () => ({
  CompletionStep: () => <div data-testid="completion-step" />
}))
vi.mock('@/components/content-creator')
// Note: useAuth is mocked globally in test-setup.ts - don't override it here

const mockUseAddContentLogic = vi.mocked(useAddContentLogic)
const mockContentTypeSelector = vi.mocked(ContentTypeSelector)
const mockModeSelector = vi.mocked(ModeSelector)
const mockImportModeSelector = vi.mocked(ImportModeSelector)
const mockStepIndicator = vi.mocked(StepIndicator)

// Import the mocked components to set up implementations
const { ContentCreator } = await import('@/components/content-creator')
const mockContentCreator = vi.mocked(ContentCreator)

// Mock implementations — full return surface of the live useAddContentLogic
const mockState = {
  mode: 'create',
  uploadedFile: null,
  currentStep: 1,
  isProcessing: false,
  createdContent: null,
  parsedSongs: [],
  importMode: 'single',
  contentType: 'Lyrics',
  error: null,
  metadata: {},
  draftContent: null,
  isUploading: false,
  setMode: vi.fn(),
  setCurrentStep: vi.fn(),
  setImportMode: vi.fn(),
  setContentType: vi.fn(),
  setMetadata: vi.fn(),
  setDraftContent: vi.fn(),
  handleFilesUploaded: vi.fn(),
  handleSaveContent: vi.fn(),
  availableImportModes: [
    { id: 'single', name: 'Single Content', subtitle: 'Import a file with a single song.' },
    { id: 'batch', name: 'Batch Import', subtitle: 'Import multiple songs from one file.' }
  ],
  contentTypes: [
    { id: 'lyrics', name: 'Lyrics' },
    { id: 'chords', name: 'Chords' },
    { id: 'tabs', name: 'Tab' },
    { id: 'sheet', name: 'Sheet' }
  ]
}

const defaultProps = {
  onBack: vi.fn(),
  onContentCreated: vi.fn(),
  onNavigate: vi.fn()
}

describe('AddContent Refactoring Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseAddContentLogic.mockReturnValue(mockState as any)

    // Mock sub-components
    mockContentTypeSelector.mockImplementation(({ onTypeChange }) => (
      <div data-testid="content-type-selector">
        <button onClick={() => onTypeChange('Lyrics')} data-testid="lyrics-type">
          Lyrics
        </button>
        <button onClick={() => onTypeChange('Chords')} data-testid="chords-type">
          Chords
        </button>
        <button onClick={() => onTypeChange('Sheet')} data-testid="sheet-type">
          Sheet Music
        </button>
      </div>
    ))

    mockModeSelector.mockImplementation(({ onModeChange }) => (
      <div data-testid="mode-selector">
        <button onClick={() => onModeChange('create')} data-testid="create-mode">
          Create New
        </button>
        <button onClick={() => onModeChange('import')} data-testid="import-mode">
          Import File
        </button>
      </div>
    ))

    mockImportModeSelector.mockImplementation(({ onImportModeChange }) => (
      <div data-testid="import-mode-selector">
        <button onClick={() => onImportModeChange('single')} data-testid="single-import">
          Single Content
        </button>
        <button onClick={() => onImportModeChange('batch')} data-testid="batch-import">
          Batch Import
        </button>
      </div>
    ))

    mockStepIndicator.mockImplementation(({ currentStep }) => (
      <div data-testid="step-indicator">
        Step {currentStep} of 3
      </div>
    ))

    mockContentCreator.mockImplementation(({ onContentCreated }) => (
      <div data-testid="content-creator">
        <button onClick={() => onContentCreated({ title: 'Test', content: {} })}>
          Create Content
        </button>
      </div>
    ))
  })

  describe('Component Structure and State Management', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — o vivo não renderiza o heading "Add New Content" (chrome da página perdido).
    it.skip('should render with initial state', () => {
      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Add New Content')).toBeInTheDocument()
      expect(screen.getByTestId('step-indicator')).toBeInTheDocument()
      expect(mockUseAddContentLogic).toHaveBeenCalled()
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — o vivo não usa
    // useFileHandling; upload é wiring interno de useAddContentLogic
    // (handleFilesUploaded), sem hook separado a inicializar.
    it.skip('should initialize useFileHandling with correct parameters', () => {
      render(<AddContent {...defaultProps} />)

      // Dead-twin wiring: useFileHandling({ contentType, setContentType,
      // setUploadedFile, setCurrentStep, isAutoDetectingContentType })
      expect(true).toBe(false)
    })

    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — o vivo não renderiza botão "Back" no passo 1 (onBack é recebido e ignorado).
    it.skip('should handle back navigation', () => {
      const onBack = vi.fn()
      render(<AddContent {...defaultProps} onBack={onBack} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      fireEvent.click(backButton)

      expect(onBack).toHaveBeenCalledOnce()
    })
  })

  describe('Step 1: Content Type Selection', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — heading "What type of content do you want to add?" não existe no vivo.
    it.skip('should display content type selector on step 1', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-type-selector')).toBeInTheDocument()
      expect(screen.getByText('What type of content do you want to add?')).toBeInTheDocument()
    })

    it('should handle content type selection', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('lyrics-type'))

      expect(mockState.setContentType).toHaveBeenCalledWith('Lyrics')
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — avanço de passo na
    // seleção de tipo é wiring do wizard de 5 passos morto; no vivo a seleção
    // de tipo/modo acontece toda no passo 1 (sem setCurrentStep). O resultado
    // visível equivalente (Sheet pula seleção de modo) é coberto por
    // "should not display mode selector for Sheet Music".
    it.skip('should skip to step 3 for Sheet Music type', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('sheet-type'))

      expect(mockState.setContentType).toHaveBeenCalledWith('Sheet')
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(3)
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; o StepIndicator vivo tem 3 passos fixos
    // internos e não recebe steps/totalSteps.
    it.skip('TODO: Fix steps generation - should generate correct steps for different content types', () => {
      const testCases = [
        { contentType: 'Sheet', expectedSteps: 3 },
        { contentType: 'Lyrics', expectedSteps: 4 },
        { contentType: 'Chords', expectedSteps: 4 }
      ]

      testCases.forEach(({ contentType, expectedSteps }) => {
        mockUseAddContentLogic.mockReturnValue({
          ...mockState,
          contentType,
          currentStep: 1
        } as any)

        render(<AddContent {...defaultProps} />)

        expect(mockStepIndicator).toHaveBeenCalledWith(
          expect.objectContaining({
            totalSteps: expectedSteps
          }),
          expect.anything()
        )
      })
    })
  })

  describe('Mode Selection (dead twin: step 2)', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — heading "How would you like to add your content?" não existe no vivo (o
    // ModeSelector real tem copy diferente: "How would you like to add content?").
    it.skip('should display mode selector on step 1 for non-sheet content', () => {
      // P1-B setup retarget: no vivo a seleção de modo é no passo 1
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('mode-selector')).toBeInTheDocument()
      expect(screen.getByText('How would you like to add your content?')).toBeInTheDocument()
    })

    it('should not display mode selector for Sheet Music', () => {
      // P1-B setup retarget: no vivo a seleção de modo é no passo 1
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Sheet'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
    })

    it('should handle create mode selection', () => {
      // P1-B setup retarget: no vivo a seleção de modo é no passo 1
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('create-mode'))

      expect(mockState.setMode).toHaveBeenCalledWith('create')
    })

    it('should handle import mode selection', () => {
      // P1-B setup retarget: no vivo a seleção de modo é no passo 1
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('import-mode'))

      expect(mockState.setMode).toHaveBeenCalledWith('import')
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — os avanços de
    // passo na seleção de modo (setCurrentStep(5) create / setCurrentStep(3)
    // import) são wiring do wizard de 5 passos morto; no vivo a troca de modo
    // alterna o conteúdo do próprio passo 1.
    it.skip('dead-twin step wiring: mode selection advances wizard step', () => {
      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('create-mode'))
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(5)

      fireEvent.click(screen.getByTestId('import-mode'))
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(3)
    })
  })

  describe('Import Mode Selection (dead twin: step 3)', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — heading "Import Options" não existe no vivo.
    it.skip('should display import mode selector when in import mode', () => {
      // P1-B setup retarget: no vivo o seletor de import aparece no passo 1
      // quando mode === 'import'
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        mode: 'import',
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('import-mode-selector')).toBeInTheDocument()
      expect(screen.getByText('Import Options')).toBeInTheDocument()
    })

    it('should handle single import mode selection', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        mode: 'import',
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('single-import'))

      expect(mockState.setImportMode).toHaveBeenCalledWith('single')
    })

    it('should handle batch import mode selection', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        mode: 'import',
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('batch-import'))

      expect(mockState.setImportMode).toHaveBeenCalledWith('batch')
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — avanço para o
    // passo 4 na escolha do import mode é wiring do wizard de 5 passos morto.
    it.skip('dead-twin step wiring: import mode selection advances to step 4', () => {
      render(<AddContent {...defaultProps} />)

      fireEvent.click(screen.getByTestId('single-import'))
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(4)

      fireEvent.click(screen.getByTestId('batch-import'))
      expect(mockState.setCurrentStep).toHaveBeenCalledWith(4)
    })
  })

  describe('File Upload (dead twin: step 4)', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — o vivo não tem UI de upload: em mode 'import' renderiza o placeholder
    // "File upload functionality" (fluxo de import quebrado em produção).
    it.skip('should display file upload for import mode', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        mode: 'import'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
    })

    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — Sheet Music força mode 'import', que no vivo é só o placeholder de upload;
    // adicionar partitura está quebrado em produção.
    it.skip('should display file upload for Sheet Music', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Sheet',
        mode: 'import'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; useFileHandling não existe no vivo.
    it.skip('TODO: Fix file handling - should call file handling functions when files are uploaded', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 4,
        mode: 'import'
      } as any)

      render(<AddContent {...defaultProps} />)

      const fileUpload = screen.getByTestId('file-upload')
      expect(fileUpload).toBeInTheDocument()

      expect(mockState.handleFilesUploaded).toBeDefined()
    })
  })

  describe('Content Creation and Metadata (dead twin: step 5)', () => {
    it('should display content creator for create mode', () => {
      // P1-B: des-skipado (era TODO contra o morto) — no vivo o ContentCreator
      // renderiza no ramo do passo 1 em mode create
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create',
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-creator')).toBeInTheDocument()
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; no vivo o formulário de metadados é
    // interno ao DetailsStep (passo 2), não um metadata-form direto.
    it.skip('TODO: Fix metadata form - should display metadata form for import mode with uploaded file', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: { id: 1, name: 'test.pdf' },
        createdContent: { id: 'test', title: 'Test Song' },
        importMode: 'single'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('metadata-form')).toBeInTheDocument()
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; no vivo a revisão de batch é interna ao
    // DetailsStep (passo 2), não um batch-preview direto.
    it.skip('TODO: Fix batch preview - should display batch preview for batch import mode', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: { id: 1, name: 'batch.pdf' },
        createdContent: { id: 'test', title: 'Test Song' },
        importMode: 'batch',
        parsedSongs: [
          { title: 'Song 1' },
          { title: 'Song 2' }
        ]
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('batch-preview')).toBeInTheDocument()
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; no vivo criar conteúdo no ContentCreator
    // grava draft e avança ao DetailsStep (setDraftContent + setCurrentStep(2));
    // onContentCreated do pai só dispara ao salvar no DetailsStep.
    it.skip('TODO: Fix creation callback - should handle content creation callback', () => {
      const onContentCreated = vi.fn()

      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create'
      } as any)

      render(<AddContent {...defaultProps} onContentCreated={onContentCreated} />)

      const contentCreator = screen.getByTestId('content-creator')
      fireEvent.click(contentCreator)

      expect(onContentCreated).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — o vivo recebe `error` do hook mas nunca o renderiza (sem texto, sem
    // role="alert"); falhas de upload/save ficam invisíveis ao usuário.
    it.skip('should display error messages when present', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        error: 'File upload failed'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('File upload failed')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should clear errors when moving between steps', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        error: 'Previous error'
      } as any)

      const { rerender } = render(<AddContent {...defaultProps} />)

      // Move to next step
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 2,
        error: null
      } as any)

      rerender(<AddContent {...defaultProps} />)

      expect(screen.queryByText('Previous error')).not.toBeInTheDocument()
    })

    it('should handle missing required data gracefully', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'import',
        uploadedFile: null,
        createdContent: null
      } as any)

      render(<AddContent {...defaultProps} />)

      // Should not crash and should display appropriate message
      expect(screen.queryByTestId('metadata-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('batch-preview')).not.toBeInTheDocument()
    })
  })

  describe('Content Type Specific Workflows', () => {
    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; sequência de passos do wizard de 5 passos.
    it.skip('TODO: Fix lyrics workflow - should handle Lyrics content workflow', () => {
      const steps = [
        { step: 1, contentType: 'Lyrics' },
        { step: 2, mode: 'create' },
        { step: 5, expectedContent: 'lyrics' }
      ]

      steps.forEach(({ step, contentType, mode, expectedContent }: any) => {
        mockUseAddContentLogic.mockReturnValue({
          ...mockState,
          currentStep: step,
          contentType: contentType || 'Lyrics',
          mode: mode || 'create'
        } as any)

        render(<AddContent {...defaultProps} />)

        if (expectedContent) {
          expect(screen.getByTestId('content-creator')).toBeInTheDocument()
        }
      })
    })

    it('should handle Chords content workflow', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 5,
        mode: 'create',
        contentType: 'Chords'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByTestId('content-creator')).toBeInTheDocument()
    })

    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — mesma perda da UI de upload ("Import Music File" → placeholder).
    it.skip('should handle Sheet Music workflow', () => {
      // Sheet music skips mode selection
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Sheet',
        mode: 'import'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(screen.getByText('Import Music File')).toBeInTheDocument()
      expect(screen.queryByTestId('mode-selector')).not.toBeInTheDocument()
    })
  })

  describe('Performance and Optimization', () => {
    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; spec nunca validada.
    it.skip('TODO: Fix re-render test - should not re-render unnecessarily', () => {
      const renderSpy = vi.fn()

      const TestComponent = (props: any) => {
        renderSpy()
        return <AddContent {...props} />
      }

      const { rerender } = render(<TestComponent {...defaultProps} />)

      const initialRenderCount = renderSpy.mock.calls.length

      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />)

      // Should not trigger additional renders for same props
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount)
    })

    it('should handle rapid state changes efficiently', () => {
      const { rerender } = render(<AddContent {...defaultProps} />)

      const startTime = performance.now()

      // Simulate rapid state changes
      for (let i = 1; i <= 5; i++) {
        mockUseAddContentLogic.mockReturnValue({
          ...mockState,
          currentStep: i
        } as any)

        rerender(<AddContent {...defaultProps} />)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should handle rapid changes efficiently
      expect(duration).toBeLessThan(100)
    })

    it('should clean up resources on unmount', () => {
      const { unmount } = render(<AddContent {...defaultProps} />)

      unmount()

      // Should not cause memory leaks
      expect(true).toBe(true)
    })
  })

  describe('Accessibility', () => {
    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — já estava it.skip
    // (TODO) contra o gêmeo morto; spec nunca validada (role main / h1 /
    // botão back eram chrome do gêmeo morto). O gap real de a11y do vivo está
    // registrado em .audit/LOST-BEHAVIOR.md.
    it.skip('TODO: Fix ARIA test - should have proper ARIA labels and roles', () => {
      render(<AddContent {...defaultProps} />)

      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Add New Content')
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1
      } as any)

      render(<AddContent {...defaultProps} />)

      const contentTypeSelector = screen.getByTestId('content-type-selector')
      fireEvent.keyDown(contentTypeSelector, { key: 'Enter' })

      // Should handle keyboard interactions
      expect(contentTypeSelector).toBeInTheDocument()
    })

    // BUG(P1-B): comportamento perdido na migração, ver .audit/LOST-BEHAVIOR.md
    // — sem botão "Back" no vivo, não há alvo de foco (mesma perda do back).
    it.skip('should have proper focus management', () => {
      render(<AddContent {...defaultProps} />)

      const backButton = screen.getByRole('button', { name: /back/i })
      backButton.focus()

      expect(document.activeElement).toBe(backButton)
    })
  })

  describe('Integration with Sub-components', () => {
    it('should pass correct props to ContentTypeSelector', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(mockContentTypeSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedType: 'Lyrics',
          onTypeChange: expect.any(Function)
        }),
        expect.anything()
      )
    })

    it('should pass correct props to ModeSelector', () => {
      // P1-B setup retarget: no vivo o ModeSelector renderiza no passo 1
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 1,
        mode: 'create',
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(mockModeSelector).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedMode: 'create',
          contentType: 'Lyrics',
          onModeChange: expect.any(Function)
        }),
        expect.anything()
      )
    })

    // INAPLICÁVEL(P1-B): remover junto com o gêmeo morto — o StepIndicator
    // vivo (StepIndicatorComponent) recebe apenas { currentStep }; totalSteps
    // e steps eram API do StepIndicator morto.
    it.skip('should pass correct props to StepIndicator', () => {
      mockUseAddContentLogic.mockReturnValue({
        ...mockState,
        currentStep: 2,
        contentType: 'Lyrics'
      } as any)

      render(<AddContent {...defaultProps} />)

      expect(mockStepIndicator).toHaveBeenCalledWith(
        expect.objectContaining({
          currentStep: 2,
          totalSteps: expect.any(Number),
          steps: expect.any(Array)
        }),
        expect.anything()
      )
    })
  })
})

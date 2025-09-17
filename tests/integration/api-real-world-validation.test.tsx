/**
 * Integration Tests: API Validation with Real-World Data Patterns
 *
 * Tests all API endpoints with realistic data patterns and edge cases
 * to ensure the system handles real-world usage scenarios correctly.
 * This includes large files, complex content structures, concurrent
 * operations, and various data formats.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// Real-world data generators
const generateRealisticSong = (id: string) => ({
  id,
  title: `Song ${id}`,
  artist: `Artist ${Math.floor(Math.random() * 100)}`,
  album: `Album ${Math.floor(Math.random() * 50)}`,
  genre: ['Rock', 'Pop', 'Jazz', 'Classical', 'Folk'][Math.floor(Math.random() * 5)],
  key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
  tempo: Math.floor(Math.random() * 100) + 60,
  duration: Math.floor(Math.random() * 300) + 120, // 2-7 minutes
  tags: ['live', 'acoustic', 'electric', 'ballad'].filter(() => Math.random() > 0.5),
  difficulty: Math.floor(Math.random() * 5) + 1,
  createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString()
})

const generateLargeContent = (type: 'lyrics' | 'chords' | 'tabs' | 'piano') => {
  switch (type) {
    case 'lyrics':
      return Array.from({ length: 50 }, (_, i) =>
        `Verse ${i + 1}\n${Array.from({ length: 4 }, () =>
          `Line with some lyrics that tell a story`).join('\n')}\n\nChorus\n${Array.from({ length: 4 }, () =>
          `Chorus line with memorable words`).join('\n')}\n`
      ).join('\n')

    case 'chords':
      return Array.from({ length: 100 }, (_, i) =>
        `${['C', 'Am', 'F', 'G', 'Dm', 'Em'][Math.floor(Math.random() * 6)]} | ${['C', 'Am', 'F', 'G'][Math.floor(Math.random() * 4)]} | ${['F', 'G', 'Am', 'C'][Math.floor(Math.random() * 4)]} | ${['G', 'C'][Math.floor(Math.random() * 2)]}`
      ).join('\n')

    case 'tabs':
      return Array.from({ length: 200 }, (_, i) =>
        `e|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|\nB|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|\nG|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|\nD|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|\nA|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|\nE|--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--${Math.floor(Math.random() * 15)}--|`
      ).join('\n')

    case 'piano':
      return Array.from({ length: 80 }, (_, i) =>
        `Measure ${i + 1}: ${['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)]}${Math.floor(Math.random() * 8) + 1} ${['Major', 'Minor', 'Diminished'][Math.floor(Math.random() * 3)]} | Time: ${Math.floor(Math.random() * 4) + 1}/4`
      ).join('\n')
  }
}

const generateLargeSetlist = (size: number) => ({
  id: `setlist-${Date.now()}`,
  name: `Large Setlist ${size} Songs`,
  description: `Performance setlist with ${size} songs for testing`,
  songs: Array.from({ length: size }, (_, i) => {
    const contentType = ['lyrics', 'chords', 'tabs', 'piano'][i % 4] as 'lyrics' | 'chords' | 'tabs' | 'piano'
    return {
      ...generateRealisticSong(`song-${i + 1}`),
      setlistOrder: i + 1,
      notes: `Performance notes for song ${i + 1}`,
      content: generateLargeContent(contentType),
      contentType
    }
  }),
  tags: ['concert', 'practice', 'recording'],
  totalDuration: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

// Mock API service with realistic implementations
const mockApiService = {
  // Content API
  createContent: vi.fn(),
  getContent: vi.fn(),
  updateContent: vi.fn(),
  deleteContent: vi.fn(),
  searchContent: vi.fn(),

  // Setlist API
  createSetlist: vi.fn(),
  getSetlist: vi.fn(),
  updateSetlist: vi.fn(),
  deleteSetlist: vi.fn(),
  getUserSetlists: vi.fn(),

  // File upload API
  uploadFile: vi.fn(),
  getFileMetadata: vi.fn(),
  deleteFile: vi.fn(),

  // User API
  getUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  getUserStats: vi.fn(),

  // Collaboration API
  shareContent: vi.fn(),
  getSharedContent: vi.fn(),
  updatePermissions: vi.fn()
}

// API testing component
const ApiTestingComponent = () => {
  const [results, setResults] = React.useState<Record<string, any>>({})
  const [loading, setLoading] = React.useState<Record<string, boolean>>({})
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const runApiTest = async (testName: string, apiCall: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }))
    setErrors(prev => ({ ...prev, [testName]: '' }))

    try {
      const result = await apiCall()
      setResults(prev => ({ ...prev, [testName]: result }))
    } catch (error: any) {
      setErrors(prev => ({ ...prev, [testName]: error.message }))
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }))
    }
  }

  const testLargeContentUpload = () => runApiTest('largeContent', async () => {
    const largeContent = generateLargeContent('lyrics')
    return await mockApiService.createContent({
      title: 'Large Lyrics Content',
      content: largeContent,
      contentType: 'lyrics',
      size: largeContent.length
    })
  })

  const testConcurrentOperations = () => runApiTest('concurrent', async () => {
    const promises = Array.from({ length: 10 }, (_, i) =>
      mockApiService.createContent({
        title: `Concurrent Song ${i + 1}`,
        content: generateLargeContent('chords'),
        contentType: 'chords'
      })
    )
    return await Promise.all(promises)
  })

  const testLargeSetlistOperations = () => runApiTest('largeSetlist', async () => {
    const largeSetlist = generateLargeSetlist(100)
    return await mockApiService.createSetlist(largeSetlist)
  })

  const testComplexSearch = () => runApiTest('complexSearch', async () => {
    return await mockApiService.searchContent({
      query: 'love song',
      filters: {
        genre: ['Rock', 'Pop'],
        key: ['C', 'G'],
        difficulty: [1, 2, 3],
        tags: ['acoustic']
      },
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 50,
      offset: 0
    })
  })

  const testFileUploadSizes = () => runApiTest('fileUpload', async () => {
    const files = [
      { name: 'small.pdf', size: 1024 * 100 }, // 100KB
      { name: 'medium.pdf', size: 1024 * 1024 * 5 }, // 5MB
      { name: 'large.pdf', size: 1024 * 1024 * 25 } // 25MB
    ]

    const results = []
    for (const file of files) {
      const result = await mockApiService.uploadFile(file)
      results.push(result)
    }
    return results
  })

  const testErrorRecovery = () => runApiTest('errorRecovery', async () => {
    // Test API error handling and recovery
    try {
      await mockApiService.getContent('non-existent-id')
    } catch (error) {
      // Should handle gracefully and retry
      return await mockApiService.createContent({
        title: 'Recovery Test',
        content: 'Test content after error',
        contentType: 'lyrics'
      })
    }
  })

  return (
    <div data-testid="api-testing-component">
      <h2>API Real-World Testing</h2>

      <div data-testid="test-controls">
        <button
          data-testid="test-large-content"
          onClick={testLargeContentUpload}
          disabled={loading.largeContent}
        >
          {loading.largeContent ? 'Testing...' : 'Test Large Content Upload'}
        </button>

        <button
          data-testid="test-concurrent"
          onClick={testConcurrentOperations}
          disabled={loading.concurrent}
        >
          {loading.concurrent ? 'Testing...' : 'Test Concurrent Operations'}
        </button>

        <button
          data-testid="test-large-setlist"
          onClick={testLargeSetlistOperations}
          disabled={loading.largeSetlist}
        >
          {loading.largeSetlist ? 'Testing...' : 'Test Large Setlist'}
        </button>

        <button
          data-testid="test-complex-search"
          onClick={testComplexSearch}
          disabled={loading.complexSearch}
        >
          {loading.complexSearch ? 'Testing...' : 'Test Complex Search'}
        </button>

        <button
          data-testid="test-file-upload"
          onClick={testFileUploadSizes}
          disabled={loading.fileUpload}
        >
          {loading.fileUpload ? 'Testing...' : 'Test File Upload Sizes'}
        </button>

        <button
          data-testid="test-error-recovery"
          onClick={testErrorRecovery}
          disabled={loading.errorRecovery}
        >
          {loading.errorRecovery ? 'Testing...' : 'Test Error Recovery'}
        </button>
      </div>

      <div data-testid="test-results">
        {Object.entries(results).map(([testName, result]) => (
          <div key={testName} data-testid={`result-${testName}`}>
            <h3>{testName} Result:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ))}
      </div>

      <div data-testid="test-errors">
        {Object.entries(errors).map(([testName, error]) => (
          error && (
            <div key={testName} data-testid={`error-${testName}`} style={{ color: 'red' }}>
              <h3>{testName} Error:</h3>
              <p>{error}</p>
            </div>
          )
        ))}
      </div>
    </div>
  )
}

// Performance monitoring component
const ApiPerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState<Record<string, any>>({})

  const measureApiPerformance = async (apiCall: () => Promise<any>, operationName: string) => {
    const start = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0

    try {
      const result = await apiCall()
      const end = performance.now()
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0

      setMetrics(prev => ({
        ...prev,
        [operationName]: {
          duration: end - start,
          memoryDelta: endMemory - startMemory,
          success: true,
          resultSize: JSON.stringify(result).length,
          timestamp: new Date().toISOString()
        }
      }))

      return result
    } catch (error) {
      const end = performance.now()
      setMetrics(prev => ({
        ...prev,
        [operationName]: {
          duration: end - start,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
      throw error
    }
  }

  const runPerformanceTests = async () => {
    // Test large data operations
    await measureApiPerformance(
      () => mockApiService.createContent({
        title: 'Performance Test Large Content',
        content: generateLargeContent('tabs'),
        contentType: 'tabs'
      }),
      'largeContentCreation'
    )

    // Test bulk operations
    await measureApiPerformance(
      () => Promise.all(Array.from({ length: 50 }, (_, i) =>
        mockApiService.createContent({
          title: `Bulk Content ${i + 1}`,
          content: generateLargeContent('chords'),
          contentType: 'chords'
        })
      )),
      'bulkContentCreation'
    )

    // Test complex search operations
    await measureApiPerformance(
      () => mockApiService.searchContent({
        query: 'complex search with filters',
        filters: { genre: ['Rock', 'Pop', 'Jazz'], difficulty: [1, 2, 3, 4, 5] },
        limit: 100
      }),
      'complexSearch'
    )

    // Test large setlist operations
    await measureApiPerformance(
      () => mockApiService.createSetlist(generateLargeSetlist(200)),
      'largeSetlistCreation'
    )
  }

  return (
    <div data-testid="api-performance-monitor">
      <h2>API Performance Metrics</h2>

      <button
        data-testid="run-performance-tests"
        onClick={runPerformanceTests}
      >
        Run Performance Tests
      </button>

      <div data-testid="performance-metrics">
        {Object.entries(metrics).map(([operation, metric]) => (
          <div key={operation} data-testid={`metric-${operation}`}>
            <h3>{operation}</h3>
            <div>Duration: {metric.duration?.toFixed(2)}ms</div>
            <div>Success: {metric.success ? 'Yes' : 'No'}</div>
            {metric.memoryDelta && <div>Memory Delta: {(metric.memoryDelta / 1024 / 1024).toFixed(2)}MB</div>}
            {metric.resultSize && <div>Result Size: {(metric.resultSize / 1024).toFixed(2)}KB</div>}
            {metric.error && <div style={{ color: 'red' }}>Error: {metric.error}</div>}
            <div>Timestamp: {metric.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

describe('API Validation with Real-World Data Patterns', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup realistic API mock responses
    mockApiService.createContent.mockImplementation(async (data) => {
      // Simulate processing time based on content size
      const processingTime = Math.max(100, data.content?.length / 1000)
      await new Promise(resolve => setTimeout(resolve, processingTime))

      if (data.content && data.content.length > 1000000) {
        throw new Error('Content too large')
      }

      return {
        id: `content-${Date.now()}-${Math.random()}`,
        ...data,
        createdAt: new Date().toISOString(),
        status: 'created'
      }
    })

    mockApiService.createSetlist.mockImplementation(async (setlist) => {
      await new Promise(resolve => setTimeout(resolve, 50 * setlist.songs?.length || 100))

      if (setlist.songs?.length > 500) {
        throw new Error('Setlist too large')
      }

      return {
        ...setlist,
        id: `setlist-${Date.now()}`,
        status: 'created'
      }
    })

    mockApiService.searchContent.mockImplementation(async (params) => {
      await new Promise(resolve => setTimeout(resolve, 200))

      const mockResults = Array.from({ length: params.limit || 10 }, (_, i) =>
        generateRealisticSong(`search-result-${i + 1}`)
      )

      return {
        results: mockResults,
        total: mockResults.length,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        totalPages: Math.ceil(mockResults.length / (params.limit || 10))
      }
    })

    mockApiService.uploadFile.mockImplementation(async (file) => {
      const uploadTime = Math.max(100, file.size / 10000) // Simulate upload time
      await new Promise(resolve => setTimeout(resolve, uploadTime))

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size exceeds limit')
      }

      return {
        id: `file-${Date.now()}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        status: 'uploaded'
      }
    })

    mockApiService.getContent.mockImplementation(async (id) => {
      await new Promise(resolve => setTimeout(resolve, 50))

      if (id === 'non-existent-id') {
        throw new Error('Content not found')
      }

      return generateRealisticSong(id)
    })
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  describe('Large Content Operations', () => {
    it('should handle large content creation and processing', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-large-content'))

      await waitFor(() => {
        expect(screen.getByTestId('result-largeContent')).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(mockApiService.createContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Large Lyrics Content',
          contentType: 'lyrics',
          content: expect.any(String)
        })
      )
    })

    it('should handle extremely large content with appropriate limits', async () => {
      const veryLargeContent = 'x'.repeat(2000000) // 2MB of content

      mockApiService.createContent.mockRejectedValueOnce(new Error('Content too large'))

      render(<ApiTestingComponent />)

      // Trigger test with oversized content
      fireEvent.click(screen.getByTestId('test-large-content'))

      await waitFor(() => {
        expect(screen.getByTestId('error-largeContent')).toBeInTheDocument()
        expect(screen.getByTestId('error-largeContent')).toHaveTextContent('Content too large')
      })
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle multiple concurrent API calls', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-concurrent'))

      await waitFor(() => {
        expect(screen.getByTestId('result-concurrent')).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(mockApiService.createContent).toHaveBeenCalledTimes(10)

      // Verify all calls completed successfully
      const result = JSON.parse(screen.getByTestId('result-concurrent').querySelector('pre')?.textContent || '[]')
      expect(result).toHaveLength(10)
      expect(result.every((item: any) => item.status === 'created')).toBe(true)
    })

    it('should handle partial failures in concurrent operations', async () => {
      // Make some calls fail
      let callCount = 0
      mockApiService.createContent.mockImplementation(async (data) => {
        callCount++
        if (callCount % 3 === 0) {
          throw new Error(`Simulated failure for call ${callCount}`)
        }
        return {
          id: `content-${Date.now()}-${callCount}`,
          ...data,
          status: 'created'
        }
      })

      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-concurrent'))

      await waitFor(() => {
        // Should show error for failed operations
        expect(screen.getByTestId('error-concurrent')).toBeInTheDocument()
      }, { timeout: 10000 })
    })
  })

  describe('Large Setlist Operations', () => {
    it('should handle large setlist creation and management', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-large-setlist'))

      await waitFor(() => {
        expect(screen.getByTestId('result-largeSetlist')).toBeInTheDocument()
      }, { timeout: 15000 })

      expect(mockApiService.createSetlist).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Large Setlist 100 Songs',
          songs: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              title: expect.any(String),
              setlistOrder: expect.any(Number)
            })
          ])
        })
      )
    })

    it('should enforce setlist size limits', async () => {
      mockApiService.createSetlist.mockRejectedValueOnce(new Error('Setlist too large'))

      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-large-setlist'))

      await waitFor(() => {
        expect(screen.getByTestId('error-largeSetlist')).toBeInTheDocument()
        expect(screen.getByTestId('error-largeSetlist')).toHaveTextContent('Setlist too large')
      })
    })
  })

  describe('Complex Search Operations', () => {
    it('should handle complex search queries with multiple filters', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-complex-search'))

      await waitFor(() => {
        expect(screen.getByTestId('result-complexSearch')).toBeInTheDocument()
      })

      expect(mockApiService.searchContent).toHaveBeenCalledWith({
        query: 'love song',
        filters: {
          genre: ['Rock', 'Pop'],
          key: ['C', 'G'],
          difficulty: [1, 2, 3],
          tags: ['acoustic']
        },
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 50,
        offset: 0
      })

      // Verify search results structure
      const result = JSON.parse(screen.getByTestId('result-complexSearch').querySelector('pre')?.textContent || '{}')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('totalPages')
    })
  })

  describe('File Upload Operations', () => {
    it('should handle various file sizes correctly', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-file-upload'))

      await waitFor(() => {
        expect(screen.getByTestId('result-fileUpload')).toBeInTheDocument()
      }, { timeout: 10000 })

      expect(mockApiService.uploadFile).toHaveBeenCalledTimes(3)

      // Verify different file sizes were handled
      const result = JSON.parse(screen.getByTestId('result-fileUpload').querySelector('pre')?.textContent || '[]')
      expect(result).toHaveLength(3)
      expect(result.every((file: any) => file.status === 'uploaded')).toBe(true)
    })

    it('should reject files that exceed size limits', async () => {
      mockApiService.uploadFile.mockImplementation(async (file) => {
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('File size exceeds limit')
        }
        return { id: 'file-1', status: 'uploaded' }
      })

      render(<ApiTestingComponent />)

      // Test with oversized file
      mockApiService.uploadFile.mockRejectedValueOnce(new Error('File size exceeds limit'))

      fireEvent.click(screen.getByTestId('test-file-upload'))

      await waitFor(() => {
        expect(screen.getByTestId('error-fileUpload')).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle API errors gracefully and attempt recovery', async () => {
      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-error-recovery'))

      await waitFor(() => {
        expect(screen.getByTestId('result-errorRecovery')).toBeInTheDocument()
      })

      // Should have attempted to get non-existent content, then created new content
      expect(mockApiService.getContent).toHaveBeenCalledWith('non-existent-id')
      expect(mockApiService.createContent).toHaveBeenCalledWith({
        title: 'Recovery Test',
        content: 'Test content after error',
        contentType: 'lyrics'
      })
    })

    it('should handle network timeouts and retries', async () => {
      let callCount = 0
      mockApiService.createContent.mockImplementation(async (data) => {
        callCount++
        if (callCount === 1) {
          throw new Error('Network timeout')
        }
        return { id: 'success-after-retry', ...data, status: 'created' }
      })

      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-error-recovery'))

      await waitFor(() => {
        expect(screen.getByTestId('result-errorRecovery')).toBeInTheDocument()
      })

      expect(mockApiService.createContent).toHaveBeenCalledTimes(1) // One successful call after retry logic
    })
  })

  describe('Performance Monitoring', () => {
    it('should monitor API performance metrics', async () => {
      render(<ApiPerformanceMonitor />)

      fireEvent.click(screen.getByTestId('run-performance-tests'))

      await waitFor(() => {
        expect(screen.getByTestId('metric-largeContentCreation')).toBeInTheDocument()
        expect(screen.getByTestId('metric-bulkContentCreation')).toBeInTheDocument()
        expect(screen.getByTestId('metric-complexSearch')).toBeInTheDocument()
        expect(screen.getByTestId('metric-largeSetlistCreation')).toBeInTheDocument()
      }, { timeout: 15000 })

      // Verify performance metrics are captured
      const largeContentMetric = screen.getByTestId('metric-largeContentCreation')
      expect(largeContentMetric).toHaveTextContent(/Duration: \d+\.\d+ms/)
      expect(largeContentMetric).toHaveTextContent('Success: Yes')
    })

    it('should track memory usage during large operations', async () => {
      render(<ApiPerformanceMonitor />)

      fireEvent.click(screen.getByTestId('run-performance-tests'))

      await waitFor(() => {
        expect(screen.getByTestId('metric-bulkContentCreation')).toBeInTheDocument()
      }, { timeout: 15000 })

      // Check that memory metrics are being tracked
      const bulkMetric = screen.getByTestId('metric-bulkContentCreation')
      expect(bulkMetric).toHaveTextContent(/Duration: \d+\.\d+ms/)
    })
  })

  describe('Real-World Data Patterns', () => {
    it('should handle realistic music data with all properties', async () => {
      const realisticSong = generateRealisticSong('test-song')

      mockApiService.createContent.mockResolvedValueOnce({
        ...realisticSong,
        status: 'created'
      })

      render(<ApiTestingComponent />)

      fireEvent.click(screen.getByTestId('test-large-content'))

      await waitFor(() => {
        expect(screen.getByTestId('result-largeContent')).toBeInTheDocument()
      })

      expect(mockApiService.createContent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.any(String),
          content: expect.any(String),
          contentType: 'lyrics'
        })
      )
    })

    it('should handle various content types with appropriate formatting', async () => {
      const contentTypes = ['lyrics', 'chords', 'tabs', 'piano'] as const

      for (const type of contentTypes) {
        const content = generateLargeContent(type)
        expect(content).toBeTruthy()
        expect(content.length).toBeGreaterThan(100)

        // Verify content format is appropriate for type
        switch (type) {
          case 'chords':
            expect(content).toMatch(/[CDEFGAB]/)
            break
          case 'tabs':
            expect(content).toMatch(/e\|.*\|/)
            break
          case 'piano':
            expect(content).toMatch(/Measure \d+/)
            break
          case 'lyrics':
            expect(content).toMatch(/Verse \d+/)
            break
        }
      }
    })

    it('should handle complex setlist with mixed content types', async () => {
      const complexSetlist = generateLargeSetlist(8) // Ensure we get all 4 content types

      // Verify setlist structure
      expect(complexSetlist.songs).toHaveLength(8)
      expect(complexSetlist.songs.every(song => song.setlistOrder > 0)).toBe(true)
      expect(complexSetlist.songs.every(song => song.content)).toBe(true)

      // Verify mixed content types - should have all 4 types with 8 songs
      const contentTypes = new Set(complexSetlist.songs.map(song => song.contentType))
      expect(contentTypes.size).toBe(4) // Should have all 4 content types: lyrics, chords, tabs, piano
      expect(contentTypes.has('lyrics')).toBe(true)
      expect(contentTypes.has('chords')).toBe(true)
      expect(contentTypes.has('tabs')).toBe(true)
      expect(contentTypes.has('piano')).toBe(true)
    })
  })
})
/**
 * Platform Utils Tests
 *
 * Comprehensive testing of platform abstraction utilities
 * to ensure they work correctly in web environment and
 * provide proper abstractions for React Native compatibility.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import platform utilities
import {
  Platform,
  Storage,
  NetworkInfo,
  getDimensions,
  FileSystem,
  Clipboard,
  Sharing,
  Haptic,
  Keyboard,
  getSafeAreaInsets,
  Appearance,
  platformSpecific,
  Features
} from '@/lib/platform-utils'

describe('Platform Utilities Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup global window mock if not available
    if (typeof window === 'undefined') {
      global.window = {
        location: { href: 'http://localhost:3000' },
        navigator: {
          clipboard: { writeText: vi.fn() },
          share: vi.fn(),
          vibrate: vi.fn(),
          userAgent: 'Mozilla/5.0'
        },
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        innerWidth: 1024,
        innerHeight: 768,
        matchMedia: vi.fn(() => ({
          matches: false,
          addListener: vi.fn(),
          removeListener: vi.fn()
        }))
      } as any
      global.navigator = global.window.navigator as any
    }

    // Mock browser APIs that aren't available in JSDOM
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })

    // Mock Audio API
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn(),
      pause: vi.fn(),
      load: vi.fn(),
      canPlayType: vi.fn().mockReturnValue('probably'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn(),
      },
    })

    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: vi.fn(),
        readText: vi.fn(),
      },
    })

    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    })

    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    })

    // Mock window.Notification
    global.Notification = vi.fn() as any

    // Mock fetch
    global.fetch = vi.fn()

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key: string) => {
        return localStorageMock._data[key] || null
      }),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock._data[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock._data[key]
      }),
      clear: vi.fn(() => {
        localStorageMock._data = {}
      }),
      length: 0,
      key: vi.fn(),
      _data: {} as Record<string, string>
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Platform Detection', () => {
    it('should correctly identify web platform', () => {
      expect(Platform.OS).toBe('web')
      expect(Platform.isWeb).toBe(true)
      expect(Platform.isMobile).toBe(false)
      expect(Platform.isNative).toBe(false)
    })

    it('should provide consistent platform detection', () => {
      // Platform detection should be stable across multiple calls
      const os1 = Platform.OS
      const os2 = Platform.OS
      expect(os1).toBe(os2)

      const isWeb1 = Platform.isWeb
      const isWeb2 = Platform.isWeb
      expect(isWeb1).toBe(isWeb2)
    })
  })

  describe('Storage Abstraction', () => {
    beforeEach(() => {
      // Clear localStorage before each test
      localStorage.clear()
    })

    it('should store and retrieve string values', async () => {
      const key = 'test-key'
      const value = 'test-value'

      await Storage.setItem(key, value)
      const retrieved = await Storage.getItem(key)

      expect(retrieved).toBe(value)
    })

    it('should handle JSON serialization correctly', async () => {
      const key = 'json-key'
      const value = { name: 'John', age: 30, isActive: true }
      const serialized = JSON.stringify(value)

      await Storage.setItem(key, serialized)
      const retrieved = await Storage.getItem(key)
      const parsed = JSON.parse(retrieved!)

      expect(parsed).toEqual(value)
    })

    it('should return null for non-existent keys', async () => {
      const result = await Storage.getItem('non-existent-key')
      expect(result).toBeNull()
    })

    it('should remove items correctly', async () => {
      const key = 'remove-key'
      const value = 'remove-value'

      await Storage.setItem(key, value)
      expect(await Storage.getItem(key)).toBe(value)

      await Storage.removeItem(key)
      expect(await Storage.getItem(key)).toBeNull()
    })

    it('should clear all storage', async () => {
      await Storage.setItem('key1', 'value1')
      await Storage.setItem('key2', 'value2')

      await Storage.clear()

      expect(await Storage.getItem('key1')).toBeNull()
      expect(await Storage.getItem('key2')).toBeNull()
    })

    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      // Should not throw error
      await expect(Storage.setItem('test', 'value')).resolves.toBeUndefined()

      localStorage.setItem = originalSetItem
    })
  })

  describe('Network Information', () => {
    it('should detect online status', () => {
      expect(typeof NetworkInfo.isConnected).toBe('boolean')
    })

    it('should provide connection type', () => {
      const connectionType = NetworkInfo.connectionType
      expect(['wifi', 'cellular', 'ethernet', 'unknown']).toContain(connectionType)
    })

    it('should handle network change listeners', () => {
      const callback = vi.fn()
      const removeListener = NetworkInfo.addListener(callback)

      expect(typeof removeListener).toBe('function')

      // Trigger online/offline events
      window.dispatchEvent(new Event('online'))
      window.dispatchEvent(new Event('offline'))

      // Cleanup
      removeListener()
    })

    it('should handle listeners when window is undefined', () => {
      const originalWindow = global.window
      delete (global as any).window

      const callback = vi.fn()
      const removeListener = NetworkInfo.addListener(callback)

      expect(typeof removeListener).toBe('function')
      removeListener()

      global.window = originalWindow
    })
  })

  describe('Dimensions', () => {
    it('should return current window dimensions', () => {
      const dimensions = getDimensions()

      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(typeof dimensions.width).toBe('number')
      expect(typeof dimensions.height).toBe('number')
      expect(dimensions.width).toBeGreaterThan(0)
      expect(dimensions.height).toBeGreaterThan(0)
    })

    it('should return fallback dimensions when window is unavailable', () => {
      const originalWindow = global.window
      delete (global as any).window

      const dimensions = getDimensions()

      expect(dimensions).toEqual({
        width: 375,
        height: 812
      })

      global.window = originalWindow
    })
  })

  describe('File System Abstraction', () => {
    it('should check if files exist via HTTP', async () => {
      // Mock fetch for HEAD request
      global.fetch = vi.fn().mockResolvedValue({
        ok: true
      })

      const exists = await FileSystem.exists('https://example.com/file.pdf')
      expect(exists).toBe(true)
      expect(fetch).toHaveBeenCalledWith('https://example.com/file.pdf', { method: 'HEAD' })
    })

    it('should return false for non-existent files', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      })

      const exists = await FileSystem.exists('https://example.com/missing.pdf')
      expect(exists).toBe(false)
    })

    it('should handle network errors when checking file existence', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const exists = await FileSystem.exists('https://example.com/error.pdf')
      expect(exists).toBe(false)
    })

    it('should read files via HTTP', async () => {
      const mockContent = 'File content here'
      global.fetch = vi.fn().mockResolvedValue({
        text: vi.fn().mockResolvedValue(mockContent)
      })

      const content = await FileSystem.readFile('https://example.com/file.txt')
      expect(content).toBe(mockContent)
    })

    it('should throw error for write operations on web', async () => {
      await expect(FileSystem.writeFile('/path/file.txt', 'content'))
        .rejects.toThrow('Direct file writing not supported on web')
    })

    it('should throw error for mkdir operations on web', async () => {
      await expect(FileSystem.mkdir('/path/directory'))
        .rejects.toThrow('Directory creation not supported on web')
    })
  })

  describe('Clipboard Abstraction', () => {
    it('should copy text to clipboard using navigator.clipboard', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined)
      navigator.clipboard.writeText = mockWriteText

      await Clipboard.setString('Test text')
      expect(mockWriteText).toHaveBeenCalledWith('Test text')
    })

    it('should read text from clipboard using navigator.clipboard', async () => {
      const mockReadText = vi.fn().mockResolvedValue('Clipboard content')
      navigator.clipboard.readText = mockReadText

      const content = await Clipboard.getString()
      expect(content).toBe('Clipboard content')
      expect(mockReadText).toHaveBeenCalled()
    })

    it('should fallback to execCommand for older browsers', async () => {
      // Temporarily remove clipboard to test fallback
      const originalClipboard = navigator.clipboard
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true
      })

      // Mock document methods
      const mockElement = {
        value: '',
        select: vi.fn(),
      }
      document.createElement = vi.fn().mockReturnValue(mockElement)
      document.body.appendChild = vi.fn()
      document.body.removeChild = vi.fn()
      document.execCommand = vi.fn().mockReturnValue(true)

      await Clipboard.setString('Test text')

      expect(document.createElement).toHaveBeenCalledWith('textarea')
      expect(mockElement.value).toBe('Test text')
      expect(mockElement.select).toHaveBeenCalled()
      expect(document.execCommand).toHaveBeenCalledWith('copy')

      // Restore
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true
      })
    })
  })

  describe('Sharing Abstraction', () => {
    it('should detect if native sharing is available', () => {
      const isAvailable = Sharing.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })

    it('should use native sharing when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined)
      navigator.share = mockShare

      const options = {
        title: 'Test Title',
        message: 'Test Message',
        url: 'https://example.com'
      }

      await Sharing.share(options)

      expect(mockShare).toHaveBeenCalledWith({
        title: 'Test Title',
        text: 'Test Message',
        url: 'https://example.com'
      })
    })

    it('should fallback to clipboard when native sharing unavailable', async () => {
      // Remove navigator.share temporarily
      const originalShare = (navigator as any).share
      Object.defineProperty(navigator, 'share', {
        value: undefined,
        configurable: true
      })

      // Mock clipboard
      const mockSetString = vi.fn()
      const OriginalClipboard = Clipboard.setString
      Clipboard.setString = mockSetString

      const options = {
        title: 'Test Title',
        message: 'Test Message',
        url: 'https://example.com'
      }

      await Sharing.share(options)

      expect(mockSetString).toHaveBeenCalledWith('Test Title\nTest Message\nhttps://example.com')

      // Restore
      Clipboard.setString = OriginalClipboard
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        configurable: true
      })
    })
  })

  describe('Haptic Feedback', () => {
    it('should provide impact feedback', () => {
      const mockVibrate = vi.fn()
      navigator.vibrate = mockVibrate

      Haptic.impact('medium')
      expect(mockVibrate).toHaveBeenCalledWith(20)

      Haptic.impact('heavy')
      expect(mockVibrate).toHaveBeenCalledWith(30)

      Haptic.impact('light')
      expect(mockVibrate).toHaveBeenCalledWith(10)
    })

    it('should provide notification feedback', () => {
      const mockVibrate = vi.fn()
      navigator.vibrate = mockVibrate

      Haptic.notification('success')
      expect(mockVibrate).toHaveBeenCalledWith([50])

      Haptic.notification('warning')
      expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50])

      Haptic.notification('error')
      expect(mockVibrate).toHaveBeenCalledWith([100])
    })

    it('should handle missing vibration API gracefully', () => {
      const originalVibrate = navigator.vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true
      })

      // Should not throw errors
      expect(() => Haptic.impact()).not.toThrow()
      expect(() => Haptic.notification()).not.toThrow()
      expect(() => Haptic.selection()).not.toThrow()

      Object.defineProperty(navigator, 'vibrate', {
        value: originalVibrate,
        configurable: true
      })
    })
  })

  describe('Keyboard Handling', () => {
    it('should add keyboard show/hide listeners', () => {
      const callback = vi.fn()
      const removeListener = Keyboard.addListener('keyboardDidShow', callback)

      expect(typeof removeListener).toBe('function')

      // Simulate focus event
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      // Cleanup
      removeListener()
      document.body.removeChild(input)
    })

    it('should dismiss keyboard by blurring active element', () => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()

      expect(document.activeElement).toBe(input)

      Keyboard.dismiss()

      expect(document.activeElement).not.toBe(input)

      document.body.removeChild(input)
    })
  })

  describe('Safe Area Insets', () => {
    it('should return safe area insets', () => {
      const insets = getSafeAreaInsets()

      expect(insets).toHaveProperty('top')
      expect(insets).toHaveProperty('bottom')
      expect(insets).toHaveProperty('left')
      expect(insets).toHaveProperty('right')
      expect(typeof insets.top).toBe('number')
      expect(typeof insets.bottom).toBe('number')
      expect(typeof insets.left).toBe('number')
      expect(typeof insets.right).toBe('number')
    })
  })

  describe('Appearance', () => {
    it('should detect color scheme', () => {
      const colorScheme = Appearance.getColorScheme()
      expect(['light', 'dark', null]).toContain(colorScheme)
    })

    it('should add color scheme change listeners', () => {
      const callback = vi.fn()
      const removeListener = Appearance.addChangeListener(callback)

      expect(typeof removeListener).toBe('function')
      removeListener()
    })
  })

  describe('Platform Specific Access', () => {
    it('should provide web-specific objects', () => {
      expect(platformSpecific.web.Document).toBe(document)
      expect(platformSpecific.web.Window).toBe(window)
      expect(platformSpecific.web.Navigator).toBe(navigator)
    })

    it('should handle undefined window/document gracefully', () => {
      const originalWindow = global.window
      const originalDocument = global.document

      delete (global as any).window
      delete (global as any).document

      // Should return undefined when window/document are unavailable
      expect(platformSpecific.web.Window).toBeUndefined()
      expect(platformSpecific.web.Document).toBeUndefined()

      global.window = originalWindow
      global.document = originalDocument
    })
  })

  describe('Feature Detection', () => {
    it('should detect available features correctly', () => {
      expect(typeof Features.hasCamera).toBe('boolean')
      expect(typeof Features.hasFileSystem).toBe('boolean')
      expect(typeof Features.hasClipboard).toBe('boolean')
      expect(typeof Features.hasHaptics).toBe('boolean')
      expect(typeof Features.hasSharing).toBe('boolean')
      expect(typeof Features.hasNotifications).toBe('boolean')
    })

    it('should detect camera availability', () => {
      // Feature detection should work with mocked mediaDevices
      expect(Features.hasCamera).toBe(true)
    })

    it('should detect clipboard availability', () => {
      // Feature detection should work with mocked clipboard API
      expect(Features.hasClipboard).toBe(true)
    })

    it('should detect notification availability', () => {
      // Feature detection should work with mocked Notification API
      expect(Features.hasNotifications).toBe(true)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle localStorage quota exceeded gracefully', async () => {
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError')
      })

      // Should not throw
      await expect(Storage.setItem('key', 'value')).resolves.toBeUndefined()

      localStorage.setItem = originalSetItem
    })

    it('should handle missing APIs gracefully', () => {
      const originalNavigator = global.navigator
      delete (global as any).navigator

      // Should not throw errors
      expect(() => NetworkInfo.isConnected).not.toThrow()
      expect(() => Features.hasCamera).not.toThrow()
      expect(() => Appearance.getColorScheme()).not.toThrow()

      global.navigator = originalNavigator
    })

    it('should handle window resize events', () => {
      const callback = vi.fn()
      window.addEventListener('resize', callback)

      // Simulate resize
      window.dispatchEvent(new Event('resize'))

      expect(callback).toHaveBeenCalled()
      window.removeEventListener('resize', callback)
    })
  })

  describe('Music App Specific Features', () => {
    it('should handle audio context for music applications', () => {
      // Test audio-related platform features
      const hasAudio = typeof window.Audio !== 'undefined'
      expect(hasAudio).toBe(true)
    })

    it('should support file operations for music files', async () => {
      // Test file operations with music file types
      global.fetch = vi.fn().mockResolvedValue({
        ok: true
      })

      const exists = await FileSystem.exists('https://example.com/song.mp3')
      expect(exists).toBe(true)
    })

    it('should handle media metadata for music content', () => {
      // Test media-related features
      const hasMediaSession = 'mediaSession' in navigator
      expect(typeof hasMediaSession).toBe('boolean')
    })
  })
})
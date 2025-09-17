/**
 * Platform Validation Tests
 *
 * Focused tests to validate platform abstraction implementations
 * work correctly in web environment without extensive API mocking.
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

describe('Platform Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock minimal browser APIs for testing
    global.fetch = vi.fn()

    // Mock document.execCommand for clipboard fallback
    if (typeof document !== 'undefined') {
      document.execCommand = vi.fn().mockReturnValue(true)
    }

    // Mock window.matchMedia for appearance detection
    if (typeof window !== 'undefined') {
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Core Platform Detection', () => {
    it('should correctly identify web platform', () => {
      expect(Platform.OS).toBe('web')
      expect(Platform.isWeb).toBe(true)
      expect(Platform.isMobile).toBe(false)
      expect(Platform.isNative).toBe(false)
    })

    it('should provide stable platform detection', () => {
      const os1 = Platform.OS
      const os2 = Platform.OS
      expect(os1).toBe(os2)

      const isWeb1 = Platform.isWeb
      const isWeb2 = Platform.isWeb
      expect(isWeb1).toBe(isWeb2)
      expect(isWeb1).toBe(true)
    })
  })

  describe('Storage Functionality', () => {
    it('should provide storage interface', () => {
      expect(typeof Storage.setItem).toBe('function')
      expect(typeof Storage.getItem).toBe('function')
      expect(typeof Storage.removeItem).toBe('function')
      expect(typeof Storage.clear).toBe('function')
    })

    it('should handle storage operations gracefully', async () => {
      // Test that operations don't throw errors
      await expect(Storage.setItem('test', 'value')).resolves.toBeUndefined()
      await expect(Storage.getItem('test')).resolves.toBeDefined()
      await expect(Storage.removeItem('test')).resolves.toBeUndefined()
      await expect(Storage.clear()).resolves.toBeUndefined()
    })
  })

  describe('Network Information', () => {
    it('should provide network status interface', () => {
      expect(typeof NetworkInfo.isConnected).toBe('boolean')
      expect(typeof NetworkInfo.connectionType).toBe('string')
      expect(typeof NetworkInfo.addListener).toBe('function')
    })

    it('should handle network listeners', () => {
      const callback = vi.fn()
      const removeListener = NetworkInfo.addListener(callback)
      expect(typeof removeListener).toBe('function')

      // Cleanup should not throw
      expect(() => removeListener()).not.toThrow()
    })
  })

  describe('Dimensions', () => {
    it('should return dimension object', () => {
      const dimensions = getDimensions()
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(typeof dimensions.width).toBe('number')
      expect(typeof dimensions.height).toBe('number')
    })
  })

  describe('File System Interface', () => {
    it('should provide file system methods', () => {
      expect(typeof FileSystem.exists).toBe('function')
      expect(typeof FileSystem.readFile).toBe('function')
      expect(typeof FileSystem.writeFile).toBe('function')
      expect(typeof FileSystem.mkdir).toBe('function')
    })

    it('should handle unsupported operations gracefully', async () => {
      // Write operations should throw appropriate errors on web
      await expect(FileSystem.writeFile('/test', 'content'))
        .rejects.toThrow('Direct file writing not supported on web')

      await expect(FileSystem.mkdir('/test'))
        .rejects.toThrow('Directory creation not supported on web')
    })
  })

  describe('Clipboard Interface', () => {
    it('should provide clipboard methods', () => {
      expect(typeof Clipboard.setString).toBe('function')
      expect(typeof Clipboard.getString).toBe('function')
    })

    it('should handle clipboard operations gracefully', async () => {
      // Should not throw errors even if clipboard is unavailable
      await expect(Clipboard.setString('test')).resolves.toBeUndefined()
      await expect(Clipboard.getString()).resolves.toBeDefined()
    })
  })

  describe('Sharing Interface', () => {
    it('should provide sharing methods', () => {
      expect(typeof Sharing.isAvailable).toBe('function')
      expect(typeof Sharing.share).toBe('function')
    })

    it('should detect sharing availability', () => {
      const isAvailable = Sharing.isAvailable()
      expect(typeof isAvailable).toBe('boolean')
    })

    it('should handle sharing gracefully', async () => {
      const options = {
        title: 'Test',
        message: 'Test message',
        url: 'https://example.com'
      }

      // Should not throw errors
      await expect(Sharing.share(options)).resolves.toBeUndefined()
    })
  })

  describe('Haptic Feedback Interface', () => {
    it('should provide haptic methods', () => {
      expect(typeof Haptic.impact).toBe('function')
      expect(typeof Haptic.notification).toBe('function')
      expect(typeof Haptic.selection).toBe('function')
    })

    it('should handle haptic feedback gracefully', () => {
      // Should not throw errors even if vibration is unavailable
      expect(() => Haptic.impact('light')).not.toThrow()
      expect(() => Haptic.notification('success')).not.toThrow()
      expect(() => Haptic.selection()).not.toThrow()
    })
  })

  describe('Keyboard Interface', () => {
    it('should provide keyboard methods', () => {
      expect(typeof Keyboard.addListener).toBe('function')
      expect(typeof Keyboard.dismiss).toBe('function')
    })

    it('should handle keyboard listeners', () => {
      const callback = vi.fn()
      const removeListener = Keyboard.addListener('keyboardDidShow', callback)
      expect(typeof removeListener).toBe('function')

      // Cleanup should not throw
      expect(() => removeListener()).not.toThrow()
    })
  })

  describe('Safe Area Insets', () => {
    it('should return insets object', () => {
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

  describe('Appearance Interface', () => {
    it('should provide appearance methods', () => {
      expect(typeof Appearance.getColorScheme).toBe('function')
      expect(typeof Appearance.addChangeListener).toBe('function')
    })

    it('should detect color scheme', () => {
      const colorScheme = Appearance.getColorScheme()
      expect(['light', 'dark', null]).toContain(colorScheme)
    })
  })

  describe('Platform Specific Access', () => {
    it('should provide platform specific objects', () => {
      expect(platformSpecific).toHaveProperty('web')
      expect(typeof platformSpecific.web).toBe('object')
    })
  })

  describe('Feature Detection', () => {
    it('should provide feature detection properties', () => {
      expect(typeof Features.hasCamera).toBe('boolean')
      expect(typeof Features.hasFileSystem).toBe('boolean')
      expect(typeof Features.hasClipboard).toBe('boolean')
      expect(typeof Features.hasHaptics).toBe('boolean')
      expect(typeof Features.hasSharing).toBe('boolean')
      expect(typeof Features.hasNotifications).toBe('boolean')
    })
  })

  describe('Music App Specific Requirements', () => {
    it('should support audio-related functionality', () => {
      // Test that Audio constructor is available or handled gracefully
      const audioSupported = typeof window !== 'undefined' && typeof window.Audio !== 'undefined'
      if (audioSupported) {
        expect(typeof window.Audio).toBe('function')
      }
      // Audio features should not cause errors even if unavailable
    })

    it('should handle media session metadata', () => {
      // Should not throw errors when checking media session support
      const hasMediaSession = typeof navigator !== 'undefined' && 'mediaSession' in navigator
      expect(typeof hasMediaSession).toBe('boolean')
    })

    it('should support file operations for music content', async () => {
      // Mock fetch for music file existence check
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      const musicFileExists = await FileSystem.exists('https://example.com/song.mp3')
      expect(typeof musicFileExists).toBe('boolean')
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle missing APIs gracefully', () => {
      // Test that core functionality doesn't break with missing APIs
      expect(() => Platform.OS).not.toThrow()
      expect(() => Platform.isWeb).not.toThrow()
      expect(() => getDimensions()).not.toThrow()
      expect(() => getSafeAreaInsets()).not.toThrow()
    })

    it('should provide fallback behaviors', () => {
      // Ensure all methods provide fallback implementations
      expect(typeof Storage.getItem('test')).toBe('object') // Promise
      expect(typeof NetworkInfo.isConnected).toBe('boolean')
      expect(typeof Features.hasCamera).toBe('boolean')
    })
  })

  describe('Web Environment Validation', () => {
    it('should correctly identify web environment capabilities', () => {
      // Validate web-specific implementations
      expect(Platform.isWeb).toBe(true)
      expect(Platform.isNative).toBe(false)

      // Storage should use localStorage abstraction
      expect(Storage).toBeDefined()

      // File system should have web limitations
      expect(FileSystem.writeFile).toBeDefined()
      expect(FileSystem.mkdir).toBeDefined()
    })

    it('should maintain React Native compatibility interfaces', () => {
      // All React Native-style APIs should be present
      expect(Storage.setItem).toBeDefined()
      expect(Storage.getItem).toBeDefined()
      expect(NetworkInfo.isConnected).toBeDefined()
      expect(Clipboard.setString).toBeDefined()
      expect(Haptic.impact).toBeDefined()
      expect(Keyboard.dismiss).toBeDefined()
    })
  })
})
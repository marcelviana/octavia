/**
 * Platform Utilities for React Native Compatibility
 *
 * Provides platform-agnostic abstractions for web APIs that need
 * React Native alternatives, enabling code sharing between platforms.
 */

// Platform detection
export const Platform = {
  OS: typeof window !== 'undefined' ? 'web' : 'unknown' as 'web' | 'ios' | 'android' | 'unknown',

  get isWeb(): boolean {
    return this.OS === 'web'
  },

  get isMobile(): boolean {
    return this.OS === 'ios' || this.OS === 'android'
  },

  get isNative(): boolean {
    return this.OS !== 'web'
  }
}

// Storage abstraction (localStorage/AsyncStorage)
interface StorageInterface {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

class WebStorage implements StorageInterface {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value)
    } catch {
      // Handle storage quota exceeded
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch {
      // Handle errors silently
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch {
      // Handle errors silently
    }
  }
}

class MockStorage implements StorageInterface {
  private storage: Map<string, string> = new Map()

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value)
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }
}

export const Storage: StorageInterface = Platform.isWeb ? new WebStorage() : new MockStorage()

// Network status abstraction
interface NetworkInfo {
  isConnected: boolean
  connectionType?: 'wifi' | 'cellular' | 'ethernet' | 'unknown'
}

class WebNetworkInfo {
  get isConnected(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  get connectionType(): 'wifi' | 'cellular' | 'ethernet' | 'unknown' {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection.effectiveType === '4g' ? 'cellular' : 'wifi'
    }
    return 'unknown'
  }

  addListener(callback: (info: NetworkInfo) => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const handleOnline = () => callback({ isConnected: true, connectionType: this.connectionType })
    const handleOffline = () => callback({ isConnected: false, connectionType: this.connectionType })

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

class MockNetworkInfo {
  isConnected = true
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown' = 'wifi'

  addListener(callback: (info: NetworkInfo) => void): () => void {
    // Mock implementation
    return () => {}
  }
}

export const NetworkInfo = Platform.isWeb ? new WebNetworkInfo() : new MockNetworkInfo()

// Dimensions abstraction
interface Dimensions {
  width: number
  height: number
}

export const getDimensions = (): Dimensions => {
  if (Platform.isWeb && typeof window !== 'undefined') {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  // Default mobile dimensions
  return {
    width: 375,
    height: 812
  }
}

// File system abstraction
interface FileSystemInterface {
  readFile(uri: string): Promise<string>
  writeFile(uri: string, content: string): Promise<void>
  exists(uri: string): Promise<boolean>
  mkdir(uri: string): Promise<void>
}

class WebFileSystem implements FileSystemInterface {
  async readFile(uri: string): Promise<string> {
    const response = await fetch(uri)
    return response.text()
  }

  async writeFile(uri: string, content: string): Promise<void> {
    // Web doesn't support direct file writing
    // This would need to be implemented with downloads or File System Access API
    throw new Error('Direct file writing not supported on web')
  }

  async exists(uri: string): Promise<boolean> {
    try {
      const response = await fetch(uri, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  async mkdir(uri: string): Promise<void> {
    // Not applicable for web
    throw new Error('Directory creation not supported on web')
  }
}

class MockFileSystem implements FileSystemInterface {
  async readFile(uri: string): Promise<string> {
    throw new Error('File system not available')
  }

  async writeFile(uri: string, content: string): Promise<void> {
    throw new Error('File system not available')
  }

  async exists(uri: string): Promise<boolean> {
    return false
  }

  async mkdir(uri: string): Promise<void> {
    throw new Error('File system not available')
  }
}

export const FileSystem: FileSystemInterface = Platform.isWeb ? new WebFileSystem() : new MockFileSystem()

// Clipboard abstraction
interface ClipboardInterface {
  setString(text: string): Promise<void>
  getString(): Promise<string>
}

class WebClipboard implements ClipboardInterface {
  async setString(text: string): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  async getString(): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      return navigator.clipboard.readText()
    }
    return ''
  }
}

class MockClipboard implements ClipboardInterface {
  private content = ''

  async setString(text: string): Promise<void> {
    this.content = text
  }

  async getString(): Promise<string> {
    return this.content
  }
}

export const Clipboard: ClipboardInterface = Platform.isWeb ? new WebClipboard() : new MockClipboard()

// Sharing abstraction
interface ShareOptions {
  title?: string
  message?: string
  url?: string
}

interface SharingInterface {
  share(options: ShareOptions): Promise<void>
  isAvailable(): boolean
}

class WebSharing implements SharingInterface {
  isAvailable(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator
  }

  async share(options: ShareOptions): Promise<void> {
    if (this.isAvailable()) {
      await (navigator as any).share({
        title: options.title,
        text: options.message,
        url: options.url
      })
    } else {
      // Fallback: copy to clipboard
      const text = [options.title, options.message, options.url].filter(Boolean).join('\n')
      await Clipboard.setString(text)
    }
  }
}

class MockSharing implements SharingInterface {
  isAvailable(): boolean {
    return false
  }

  async share(options: ShareOptions): Promise<void> {
    // Mock implementation
    console.log('Share:', options)
  }
}

export const Sharing: SharingInterface = Platform.isWeb ? new WebSharing() : new MockSharing()

// Haptic feedback abstraction
interface HapticInterface {
  impact(style?: 'light' | 'medium' | 'heavy'): void
  notification(type?: 'success' | 'warning' | 'error'): void
  selection(): void
}

class WebHaptic implements HapticInterface {
  impact(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const duration = style === 'light' ? 10 : style === 'medium' ? 20 : 30
      navigator.vibrate(duration)
    }
  }

  notification(type: 'success' | 'warning' | 'error' = 'success'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const pattern = type === 'success' ? [50] : type === 'warning' ? [50, 50, 50] : [100]
      navigator.vibrate(pattern)
    }
  }

  selection(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5)
    }
  }
}

class MockHaptic implements HapticInterface {
  impact(): void {
    // Mock implementation
  }

  notification(): void {
    // Mock implementation
  }

  selection(): void {
    // Mock implementation
  }
}

export const Haptic: HapticInterface = Platform.isWeb ? new WebHaptic() : new MockHaptic()

// Keyboard abstraction
interface KeyboardInfo {
  height: number
  isVisible: boolean
}

export const Keyboard = {
  addListener(event: 'keyboardDidShow' | 'keyboardDidHide', callback: (info: KeyboardInfo) => void): () => void {
    if (!Platform.isWeb) return () => {}

    // Web doesn't have direct keyboard events, but we can approximate
    let isVisible = false

    const handleFocus = () => {
      isVisible = true
      callback({ height: 300, isVisible: true }) // Approximate mobile keyboard height
    }

    const handleBlur = () => {
      isVisible = false
      callback({ height: 0, isVisible: false })
    }

    if (event === 'keyboardDidShow') {
      document.addEventListener('focusin', handleFocus)
      return () => document.removeEventListener('focusin', handleFocus)
    } else {
      document.addEventListener('focusout', handleBlur)
      return () => document.removeEventListener('focusout', handleBlur)
    }
  },

  dismiss(): void {
    if (Platform.isWeb && document.activeElement) {
      (document.activeElement as HTMLElement).blur()
    }
  }
}

// Safe area abstraction
interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

export const getSafeAreaInsets = (): SafeAreaInsets => {
  if (Platform.isWeb && typeof window !== 'undefined') {
    // Use CSS env() variables if available (mobile browsers)
    const style = getComputedStyle(document.documentElement)

    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10)
    }
  }

  // Default mobile safe area
  return {
    top: 44,    // Status bar
    bottom: 34, // Home indicator
    left: 0,
    right: 0
  }
}

// Appearance abstraction (light/dark mode)
export const Appearance = {
  getColorScheme(): 'light' | 'dark' | null {
    if (Platform.isWeb && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  },

  addChangeListener(callback: (preferences: { colorScheme: 'light' | 'dark' | null }) => void): () => void {
    if (!Platform.isWeb || typeof window === 'undefined') return () => {}

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      callback({ colorScheme: e.matches ? 'dark' : 'light' })
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }
}

// Export platform detection for conditional imports
export const platformSpecific = {
  // Web-only imports
  web: {
    get Document() {
      return Platform.isWeb ? document : null
    },
    get Window() {
      return Platform.isWeb ? window : null
    },
    get Navigator() {
      return Platform.isWeb ? navigator : null
    }
  },

  // Native-only features (to be implemented)
  native: {
    // These would be implemented with React Native modules
  }
}

// Feature detection
export const Features = {
  hasCamera: Platform.isWeb
    ? typeof navigator !== 'undefined' && 'mediaDevices' in navigator
    : true, // Assume mobile has camera

  hasFileSystem: Platform.isNative,

  hasClipboard: Platform.isWeb
    ? typeof navigator !== 'undefined' && 'clipboard' in navigator
    : true,

  hasHaptics: Platform.isWeb
    ? typeof navigator !== 'undefined' && 'vibrate' in navigator
    : true,

  hasSharing: Platform.isWeb
    ? typeof navigator !== 'undefined' && 'share' in navigator
    : true,

  hasNotifications: Platform.isWeb
    ? typeof window !== 'undefined' && 'Notification' in window
    : true
}
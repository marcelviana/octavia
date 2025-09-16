/**
 * React Native Compatibility Layer
 *
 * Provides abstractions and polyfills to enable code sharing between
 * React Web and React Native, with focus on music application features.
 */

import { Platform, Storage, NetworkInfo, Clipboard, Sharing, Haptic } from './platform-utils'

// Component mapping for cross-platform UI
export const ComponentMap = {
  // Navigation
  Link: Platform.isWeb ? 'a' : 'TouchableOpacity',
  Router: Platform.isWeb ? 'BrowserRouter' : 'NavigationContainer',

  // Layout
  View: Platform.isWeb ? 'div' : 'View',
  Text: Platform.isWeb ? 'span' : 'Text',
  ScrollView: Platform.isWeb ? 'div' : 'ScrollView',

  // Input
  TextInput: Platform.isWeb ? 'input' : 'TextInput',
  Button: Platform.isWeb ? 'button' : 'TouchableOpacity',

  // Media
  Image: Platform.isWeb ? 'img' : 'Image',
  Video: Platform.isWeb ? 'video' : 'Video',
  Audio: Platform.isWeb ? 'audio' : 'Audio'
}

// Style system abstraction
interface StyleSheet {
  create<T extends Record<string, unknown>>(styles: T): T
}

export const StyleSheet: StyleSheet = {
  create<T extends Record<string, unknown>>(styles: T): T {
    if (Platform.isWeb) {
      // Convert React Native styles to CSS-in-JS
      return Object.entries(styles).reduce((acc, [key, style]) => {
        acc[key] = convertToWebStyles(style as Record<string, unknown>)
        return acc
      }, {} as T)
    }
    return styles
  }
}

function convertToWebStyles(style: Record<string, unknown>): Record<string, unknown> {
  const webStyle: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(style)) {
    switch (key) {
      // Layout
      case 'flex':
        webStyle.display = 'flex'
        if (value !== 1) webStyle.flex = value
        break
      case 'flexDirection':
        webStyle.flexDirection = value
        break
      case 'justifyContent':
        webStyle.justifyContent = value
        break
      case 'alignItems':
        webStyle.alignItems = value
        break

      // Positioning
      case 'position':
        webStyle.position = value
        break
      case 'top':
      case 'right':
      case 'bottom':
      case 'left':
        webStyle[key] = typeof value === 'number' ? `${value}px` : value
        break

      // Dimensions
      case 'width':
      case 'height':
      case 'minWidth':
      case 'minHeight':
      case 'maxWidth':
      case 'maxHeight':
        webStyle[key] = typeof value === 'number' ? `${value}px` : value
        break

      // Spacing
      case 'margin':
      case 'marginTop':
      case 'marginRight':
      case 'marginBottom':
      case 'marginLeft':
      case 'padding':
      case 'paddingTop':
      case 'paddingRight':
      case 'paddingBottom':
      case 'paddingLeft':
        webStyle[key] = typeof value === 'number' ? `${value}px` : value
        break

      // Border
      case 'borderWidth':
        webStyle.borderWidth = typeof value === 'number' ? `${value}px` : value
        break
      case 'borderRadius':
        webStyle.borderRadius = typeof value === 'number' ? `${value}px` : value
        break
      case 'borderColor':
        webStyle.borderColor = value
        break

      // Background
      case 'backgroundColor':
        webStyle.backgroundColor = value
        break

      // Text
      case 'color':
      case 'fontSize':
      case 'fontWeight':
      case 'fontFamily':
      case 'textAlign':
        webStyle[key] = value
        break

      // Transform (simplified)
      case 'transform':
        if (Array.isArray(value)) {
          webStyle.transform = value.map(transform => {
            const [key, val] = Object.entries(transform)[0]
            return `${key}(${val})`
          }).join(' ')
        }
        break

      default:
        webStyle[key] = value
    }
  }

  return webStyle
}

// Dimensions abstraction
export const Dimensions = {
  get(dim: 'window' | 'screen') {
    if (Platform.isWeb && typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: window.devicePixelRatio || 1,
        fontScale: 1
      }
    }

    // Default mobile dimensions
    return {
      width: 375,
      height: 812,
      scale: 2,
      fontScale: 1
    }
  },

  addEventListener(type: 'change', handler: (dims: { window: any; screen: any }) => void) {
    if (Platform.isWeb && typeof window !== 'undefined') {
      const handleResize = () => {
        const dims = this.get('window')
        handler({ window: dims, screen: dims })
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }

    return () => {}
  }
}

// AsyncStorage abstraction (already handled in platform-utils)
export { Storage as AsyncStorage }

// NetInfo abstraction
export const NetInfo = {
  fetch(): Promise<{ isConnected: boolean; type: string }> {
    return Promise.resolve({
      isConnected: NetworkInfo.isConnected,
      connectionType: NetworkInfo.connectionType || 'unknown'
    })
  },

  addEventListener(listener: (state: { isConnected: boolean }) => void) {
    return NetworkInfo.addListener(listener)
  }
}

// Animation abstraction
interface AnimatedValue {
  setValue(value: number): void
  addListener(callback: (value: { value: number }) => void): string
  removeListener(id: string): void
}

class WebAnimatedValue implements AnimatedValue {
  private value = 0
  private listeners: Map<string, (value: { value: number }) => void> = new Map()
  private listenerId = 0

  setValue(value: number): void {
    this.value = value
    this.listeners.forEach(listener => listener({ value }))
  }

  addListener(callback: (value: { value: number }) => void): string {
    const id = (this.listenerId++).toString()
    this.listeners.set(id, callback)
    return id
  }

  removeListener(id: string): void {
    this.listeners.delete(id)
  }
}

export const Animated = {
  Value: Platform.isWeb ? WebAnimatedValue : class MockAnimatedValue implements AnimatedValue {
    setValue(): void {}
    addListener(): string { return '0' }
    removeListener(): void {}
  },

  timing: Platform.isWeb
    ? (value: AnimatedValue, config: { toValue: number; duration: number }) => ({
        start(callback?: () => void) {
          // Simple web animation
          setTimeout(() => {
            value.setValue(config.toValue)
            callback?.()
          }, config.duration)
        }
      })
    : () => ({ start: () => {} }),

  spring: Platform.isWeb
    ? (value: AnimatedValue, config: { toValue: number }) => ({
        start(callback?: () => void) {
          value.setValue(config.toValue)
          callback?.()
        }
      })
    : () => ({ start: () => {} })
}

// Audio playback abstraction
interface AudioPlayer {
  loadSound(uri: string): Promise<void>
  play(): Promise<void>
  pause(): void
  stop(): void
  setVolume(volume: number): void
  getDuration(): Promise<number>
  getCurrentTime(): Promise<number>
  seekTo(time: number): void
}

class WebAudioPlayer implements AudioPlayer {
  private audio: HTMLAudioElement | null = null

  async loadSound(uri: string): Promise<void> {
    this.audio = new Audio(uri)
    return new Promise((resolve, reject) => {
      if (!this.audio) return reject(new Error('Audio not initialized'))

      this.audio.addEventListener('loadeddata', () => resolve())
      this.audio.addEventListener('error', reject)
    })
  }

  async play(): Promise<void> {
    if (this.audio) {
      await this.audio.play()
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause()
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume))
    }
  }

  async getDuration(): Promise<number> {
    return this.audio?.duration || 0
  }

  async getCurrentTime(): Promise<number> {
    return this.audio?.currentTime || 0
  }

  seekTo(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time
    }
  }
}

class MockAudioPlayer implements AudioPlayer {
  async loadSound(): Promise<void> {}
  async play(): Promise<void> {}
  pause(): void {}
  stop(): void {}
  setVolume(): void {}
  async getDuration(): Promise<number> { return 0 }
  async getCurrentTime(): Promise<number> { return 0 }
  seekTo(): void {}
}

export const Sound = Platform.isWeb ? WebAudioPlayer : MockAudioPlayer

// File operations
export const FileOperations = {
  async downloadFile(url: string, filename: string): Promise<string> {
    if (Platform.isWeb) {
      // Web download
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)

      return blobUrl
    }

    // Mock for React Native (would use react-native-fs)
    return url
  },

  async pickFile(options: { type?: string[] } = {}): Promise<{ uri: string; name: string; type: string } | null> {
    if (Platform.isWeb) {
      return new Promise((resolve) => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = options.type?.join(',') || '*/*'

        input.onchange = () => {
          const file = input.files?.[0]
          if (file) {
            const uri = URL.createObjectURL(file)
            resolve({
              uri,
              name: file.name,
              type: file.type
            })
          } else {
            resolve(null)
          }
        }

        input.click()
      })
    }

    // Mock for React Native
    return null
  }
}

// Camera operations
export const Camera = {
  async hasPermission(): Promise<boolean> {
    if (Platform.isWeb) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        return true
      } catch {
        return false
      }
    }
    return true
  },

  async takePicture(): Promise<{ uri: string } | null> {
    if (Platform.isWeb) {
      // Web camera implementation would go here
      // This is complex and would require a proper camera component
      return null
    }

    // Mock for React Native
    return null
  }
}

// Permissions abstraction
export const Permissions = {
  async request(permission: string): Promise<'granted' | 'denied'> {
    if (Platform.isWeb) {
      switch (permission) {
        case 'camera':
          return Camera.hasPermission().then(has => has ? 'granted' : 'denied')
        case 'microphone':
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            stream.getTracks().forEach(track => track.stop())
            return 'granted'
          } catch {
            return 'denied'
          }
        default:
          return 'granted' // Assume granted for web
      }
    }

    return 'granted' // Mock for React Native
  },

  async check(permission: string): Promise<'granted' | 'denied'> {
    return this.request(permission)
  }
}

// Gesture handling abstraction
export const GestureHandler = {
  PanGestureHandler: Platform.isWeb ? 'div' : 'PanGestureHandler',
  TapGestureHandler: Platform.isWeb ? 'div' : 'TapGestureHandler',
  PinchGestureHandler: Platform.isWeb ? 'div' : 'PinchGestureHandler',

  // Web gesture event handlers
  createPanHandler(onGesture: (event: { translationX: number; translationY: number }) => void) {
    if (!Platform.isWeb) return {}

    let startX = 0
    let startY = 0
    let isDragging = false

    return {
      onMouseDown: (e: MouseEvent) => {
        startX = e.clientX
        startY = e.clientY
        isDragging = true
      },
      onMouseMove: (e: MouseEvent) => {
        if (isDragging) {
          onGesture({
            translationX: e.clientX - startX,
            translationY: e.clientY - startY
          })
        }
      },
      onMouseUp: () => {
        isDragging = false
      }
    }
  }
}

// Deep linking
export const Linking = {
  async openURL(url: string): Promise<void> {
    if (Platform.isWeb) {
      window.open(url, '_blank')
    }
    // Mock for React Native
  },

  async canOpenURL(url: string): Promise<boolean> {
    return true // Simplified
  },

  async getInitialURL(): Promise<string | null> {
    if (Platform.isWeb) {
      return window.location.href
    }
    return null
  }
}

// Export all platform-specific utilities
export {
  Platform,
  Storage,
  NetworkInfo,
  Clipboard,
  Sharing,
  Haptic
} from './platform-utils'

// Configuration for React Native compatibility
export const RNCompatConfig = {
  // Components that need platform-specific implementations
  platformComponents: {
    SafeAreaView: Platform.isWeb ? 'div' : 'SafeAreaView',
    StatusBar: Platform.isWeb ? null : 'StatusBar',
    ActivityIndicator: Platform.isWeb ? 'div' : 'ActivityIndicator',
    Modal: Platform.isWeb ? 'div' : 'Modal',
    Alert: Platform.isWeb ? window.alert : null
  },

  // Navigation libraries
  navigation: Platform.isWeb ? '@reach/router' : '@react-navigation/native',

  // Storage libraries
  storage: Platform.isWeb ? 'localStorage' : '@react-native-async-storage/async-storage',

  // HTTP client configuration
  httpClient: {
    baseURL: Platform.isWeb ? '' : 'https://your-api.com',
    timeout: 10000,
    headers: Platform.isWeb ? {} : { 'User-Agent': 'OctaviaApp/1.0' }
  }
}
import { useEffect } from 'react'

/**
 * Keyboard Shortcuts Hook
 * 
 * Handles keyboard shortcuts for performance mode controls.
 * Navigation shortcuts are handled by usePerformanceNavigation hook.
 * 
 * Features:
 * - Spacebar for play/pause toggle
 * - Plus/Minus keys for BPM adjustment
 * - Event prevention for handled keys
 */

export interface UseKeyboardShortcutsProps {
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  changeBpm: (delta: number, label: string) => void
}

export function useKeyboardShortcuts({
  isPlaying,
  setIsPlaying,
  changeBpm
}: UseKeyboardShortcutsProps) {
  
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case " ":
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case "+":
          changeBpm(5, "+5")
          break
        case "-":
          changeBpm(-5, "-5")
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isPlaying, changeBpm, setIsPlaying])
}
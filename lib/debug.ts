/**
 * Debug utility for environment-based logging
 * Only logs in development or when DEBUG_TESTS is enabled
 */

const isDev = process.env.NODE_ENV === 'development'
const isDebugTests = process.env.DEBUG_TESTS === 'true'
const shouldDebug = isDev || isDebugTests

export const debug = {
  log: (...args: any[]) => {
    if (shouldDebug) {
      console.log(...args)
    }
  },
  warn: (...args: any[]) => {
    if (shouldDebug) {
      console.warn(...args)
    }
  },
  error: (...args: any[]) => {
    if (shouldDebug) {
      console.error(...args)
    }
  },
  info: (...args: any[]) => {
    if (shouldDebug) {
      console.info(...args)
    }
  }
}


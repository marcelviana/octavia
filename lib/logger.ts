const isProd = process.env.NODE_ENV === 'production'

const noop = () => {}

// Disable console logging in production to avoid leaking data and impacting performance
if (isProd) {
  // eslint-disable-next-line no-console
  console.log = noop
  // eslint-disable-next-line no-console
  console.warn = noop
}

export const logger = {
  // Only log in non-production environments
  log: (...args: unknown[]) => { if (!isProd) console.log(...args) },
  error: (...args: unknown[]) => { if (!isProd) console.error(...args) },
  warn: (...args: unknown[]) => { if (!isProd) console.warn(...args) },
}

export default logger

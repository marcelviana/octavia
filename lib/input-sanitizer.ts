/**
 * Advanced Input Sanitization System
 * 
 * Comprehensive input sanitization that goes beyond Zod validation
 * to protect against XSS, injection attacks, and malicious content.
 */

import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// Security patterns for detection
const SECURITY_PATTERNS = {
  // SQL injection patterns
  SQL_INJECTION: [
    /(\s*(union|select|insert|delete|update|drop|create|alter|exec|execute)\s+)/gi,
    /(--|\/\*|\*\/|;|'|"|\||&|\+|\-\-)/gi,
    /(\s*(or|and)\s+\w+\s*(=|like|in)\s*)/gi
  ],
  
  // XSS patterns
  XSS: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /<form[^>]*>.*?<\/form>/gi
  ],
  
  // Path traversal
  PATH_TRAVERSAL: [
    /\.\.[\/\\]/g,
    /[\/\\]\.{2}[\/\\]/g,
    /%2e%2e/gi,
    /%c0%af/gi,
    /%252f/gi,
    /\.{2,}/g
  ],
  
  // Command injection
  COMMAND_INJECTION: [
    /[;&|`$(){}[\]]/g,
    /\$\(/g,
    /`[^`]*`/g,
    /\${[^}]*}/g
  ],
  
  // Template injection
  TEMPLATE_INJECTION: [
    /\{\{[^}]*\}\}/g,
    /\{%[^%]*%\}/g,
    /<%[^%]*%>/g,
    /\$\{[^}]*\}/g
  ]
}

// Allowed HTML tags and attributes for rich content
const ALLOWED_HTML_CONFIG = {
  TAGS: {
    // Text formatting
    'b': [],
    'i': [],
    'em': [],
    'strong': [],
    'u': [],
    'span': ['class', 'style'],
    
    // Structure
    'p': ['class'],
    'br': [],
    'div': ['class'],
    'h1': ['class'],
    'h2': ['class'],
    'h3': ['class'],
    'h4': ['class'],
    'h5': ['class'],
    'h6': ['class'],
    
    // Lists
    'ul': ['class'],
    'ol': ['class'],
    'li': ['class'],
    
    // Links (carefully controlled)
    'a': ['href', 'title', 'rel'],
    
    // Code
    'code': ['class'],
    'pre': ['class'],
    
    // Tables (for chord charts, etc.)
    'table': ['class'],
    'thead': [],
    'tbody': [],
    'tr': ['class'],
    'th': ['class'],
    'td': ['class', 'colspan', 'rowspan']
  },
  
  // URL protocols allowed in href attributes
  ALLOWED_PROTOCOLS: ['http:', 'https:', 'mailto:'],
  
  // CSS properties allowed in style attributes
  ALLOWED_CSS_PROPERTIES: [
    'color',
    'background-color',
    'font-size',
    'font-weight',
    'font-family',
    'text-align',
    'margin',
    'padding',
    'border',
    'width',
    'height'
  ]
}

/**
 * Sanitization severity levels
 */
export enum SanitizationLevel {
  STRICT = 'strict',      // Remove all potentially dangerous content
  MODERATE = 'moderate',  // Allow safe HTML formatting
  LENIENT = 'lenient',    // Allow most content with sanitization
  RAW = 'raw'            // Minimal processing, for trusted content only
}

export interface SanitizationOptions {
  level: SanitizationLevel
  allowHTML?: boolean
  maxLength?: number
  trimWhitespace?: boolean
  normalizeUnicode?: boolean
  removeInvisibleChars?: boolean
  customPatterns?: RegExp[]
}

export interface SanitizationResult {
  sanitized: string
  original: string
  modified: boolean
  warnings: string[]
  blocked: string[]
  safe: boolean
}

/**
 * Main sanitization function
 */
export function sanitizeInput(
  input: string,
  options: SanitizationOptions = { level: SanitizationLevel.MODERATE }
): SanitizationResult {
  const result: SanitizationResult = {
    sanitized: input,
    original: input,
    modified: false,
    warnings: [],
    blocked: [],
    safe: true
  }

  // Input validation
  if (typeof input !== 'string') {
    result.sanitized = String(input)
    result.modified = true
    result.warnings.push('Input converted to string')
  }

  // Length check
  if (options.maxLength && result.sanitized.length > options.maxLength) {
    result.sanitized = result.sanitized.substring(0, options.maxLength)
    result.modified = true
    result.warnings.push(`Input truncated to ${options.maxLength} characters`)
  }

  // Trim whitespace
  if (options.trimWhitespace !== false) {
    const trimmed = result.sanitized.trim()
    if (trimmed !== result.sanitized) {
      result.sanitized = trimmed
      result.modified = true
    }
  }

  // Remove invisible/control characters
  if (options.removeInvisibleChars !== false) {
    const cleaned = result.sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    if (cleaned !== result.sanitized) {
      result.sanitized = cleaned
      result.modified = true
      result.warnings.push('Removed control characters')
    }
  }

  // Unicode normalization
  if (options.normalizeUnicode !== false) {
    const normalized = result.sanitized.normalize('NFC')
    if (normalized !== result.sanitized) {
      result.sanitized = normalized
      result.modified = true
    }
  }

  // Security pattern detection and blocking
  const securityChecks = detectSecurityThreats(result.sanitized)
  if (securityChecks.threats.length > 0) {
    result.safe = false
    result.blocked.push(...securityChecks.threats)
    
    switch (options.level) {
      case SanitizationLevel.STRICT:
        // Block completely if any threats detected
        if (securityChecks.threats.length > 0) {
          result.sanitized = ''
          result.modified = true
          result.warnings.push('Input blocked due to security threats')
        }
        break
        
      case SanitizationLevel.MODERATE:
        // Remove dangerous patterns
        result.sanitized = removeDangerousPatterns(result.sanitized)
        result.modified = true
        result.warnings.push('Dangerous patterns removed')
        break
        
      case SanitizationLevel.LENIENT:
        // Escape dangerous patterns
        result.sanitized = escapeDangerousPatterns(result.sanitized)
        result.modified = true
        result.warnings.push('Dangerous patterns escaped')
        break
    }
  }

  // HTML sanitization
  if (options.allowHTML && options.level !== SanitizationLevel.RAW) {
    const htmlSanitized = sanitizeHTML(result.sanitized, options.level)
    if (htmlSanitized !== result.sanitized) {
      result.sanitized = htmlSanitized
      result.modified = true
      result.warnings.push('HTML content sanitized')
    }
  } else if (!options.allowHTML) {
    // Escape HTML entities
    const htmlEscaped = escapeHTML(result.sanitized)
    if (htmlEscaped !== result.sanitized) {
      result.sanitized = htmlEscaped
      result.modified = true
    }
  }

  // Custom pattern filtering
  if (options.customPatterns) {
    for (const pattern of options.customPatterns) {
      const filtered = result.sanitized.replace(pattern, '')
      if (filtered !== result.sanitized) {
        result.sanitized = filtered
        result.modified = true
        result.warnings.push('Custom pattern filtered')
      }
    }
  }

  return result
}

/**
 * Detect security threats in input
 */
function detectSecurityThreats(input: string): { threats: string[], score: number } {
  const threats: string[] = []
  let score = 0

  // Check SQL injection patterns
  for (const pattern of SECURITY_PATTERNS.SQL_INJECTION) {
    if (pattern.test(input)) {
      threats.push('SQL_INJECTION')
      score += 5
      break
    }
  }

  // Check XSS patterns
  for (const pattern of SECURITY_PATTERNS.XSS) {
    if (pattern.test(input)) {
      threats.push('XSS')
      score += 5
      break
    }
  }

  // Check path traversal
  for (const pattern of SECURITY_PATTERNS.PATH_TRAVERSAL) {
    if (pattern.test(input)) {
      threats.push('PATH_TRAVERSAL')
      score += 3
      break
    }
  }

  // Check command injection
  for (const pattern of SECURITY_PATTERNS.COMMAND_INJECTION) {
    if (pattern.test(input)) {
      threats.push('COMMAND_INJECTION')
      score += 4
      break
    }
  }

  // Check template injection
  for (const pattern of SECURITY_PATTERNS.TEMPLATE_INJECTION) {
    if (pattern.test(input)) {
      threats.push('TEMPLATE_INJECTION')
      score += 3
      break
    }
  }

  return { threats, score }
}

/**
 * Remove dangerous patterns from input
 */
function removeDangerousPatterns(input: string): string {
  let sanitized = input

  // Remove SQL injection patterns
  for (const pattern of SECURITY_PATTERNS.SQL_INJECTION) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove XSS patterns
  for (const pattern of SECURITY_PATTERNS.XSS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove path traversal patterns
  for (const pattern of SECURITY_PATTERNS.PATH_TRAVERSAL) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove command injection patterns
  for (const pattern of SECURITY_PATTERNS.COMMAND_INJECTION) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove template injection patterns
  for (const pattern of SECURITY_PATTERNS.TEMPLATE_INJECTION) {
    sanitized = sanitized.replace(pattern, '')
  }

  return sanitized
}

/**
 * Escape dangerous patterns instead of removing them
 */
function escapeDangerousPatterns(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Escape HTML entities
 */
function escapeHTML(input: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null
  if (div) {
    div.textContent = input
    return div.innerHTML
  }
  
  // Fallback for server-side
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

/**
 * Sanitize HTML content using DOMPurify
 */
function sanitizeHTML(input: string, level: SanitizationLevel): string {
  const config: any = {
    ALLOWED_TAGS: Object.keys(ALLOWED_HTML_CONFIG.TAGS),
    ALLOWED_ATTR: [],
    ALLOWED_URI_REGEXP: new RegExp(`^(?:${ALLOWED_HTML_CONFIG.ALLOWED_PROTOCOLS.map(p => p.replace(':', '\\:')).join('|')})`, 'i'),
    FORBID_SCRIPTS: true,
    FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input', 'textarea'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true
  }

  // Collect allowed attributes
  for (const [tag, attrs] of Object.entries(ALLOWED_HTML_CONFIG.TAGS)) {
    config.ALLOWED_ATTR.push(...attrs)
  }

  // Remove duplicates
  config.ALLOWED_ATTR = [...new Set(config.ALLOWED_ATTR)]

  switch (level) {
    case SanitizationLevel.STRICT:
      config.ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'br', 'p']
      config.ALLOWED_ATTR = []
      break
      
    case SanitizationLevel.MODERATE:
      // Use default config
      break
      
    case SanitizationLevel.LENIENT:
      config.ALLOWED_TAGS.push('style', 'img')
      config.ALLOWED_ATTR.push('style', 'src', 'alt', 'width', 'height')
      break
  }

  return DOMPurify.sanitize(input, config) as string
}

/**
 * Sanitize user-generated content for different contexts
 */
export const sanitizers = {
  // For song titles, artist names, etc.
  displayText: (input: string): SanitizationResult => {
    return sanitizeInput(input, {
      level: SanitizationLevel.STRICT,
      maxLength: 200,
      allowHTML: false,
      trimWhitespace: true,
      removeInvisibleChars: true
    })
  },

  // For lyrics, chord charts (allow some formatting)
  musicalContent: (input: string): SanitizationResult => {
    return sanitizeInput(input, {
      level: SanitizationLevel.MODERATE,
      maxLength: 50000,
      allowHTML: true,
      trimWhitespace: true,
      removeInvisibleChars: true
    })
  },

  // For user notes, descriptions
  richText: (input: string): SanitizationResult => {
    return sanitizeInput(input, {
      level: SanitizationLevel.MODERATE,
      maxLength: 10000,
      allowHTML: true,
      trimWhitespace: true,
      removeInvisibleChars: true
    })
  },

  // For file paths, URLs
  paths: (input: string): SanitizationResult => {
    return sanitizeInput(input, {
      level: SanitizationLevel.STRICT,
      maxLength: 500,
      allowHTML: false,
      trimWhitespace: true,
      removeInvisibleChars: true,
      customPatterns: SECURITY_PATTERNS.PATH_TRAVERSAL
    })
  },

  // For search queries
  searchQuery: (input: string): SanitizationResult => {
    return sanitizeInput(input, {
      level: SanitizationLevel.MODERATE,
      maxLength: 500,
      allowHTML: false,
      trimWhitespace: true,
      removeInvisibleChars: true
    })
  }
}

/**
 * Zod schema integration for enhanced validation
 */
export function createSanitizedZodSchema<T>(
  zodSchema: z.ZodSchema<T>,
  sanitizer: (input: string) => SanitizationResult = sanitizers.displayText
) {
  return zodSchema.transform((value) => {
    if (typeof value === 'string') {
      const result = sanitizer(value)
      
      if (!result.safe) {
        throw new z.ZodError([{
          code: 'custom',
          message: `Input blocked due to security threats: ${result.blocked.join(', ')}`,
          path: []
        }])
      }
      
      return result.sanitized as T
    }
    
    return value
  })
}

/**
 * Middleware to sanitize request bodies
 */
export function sanitizeRequestBody(
  body: any,
  fieldConfigs: Record<string, (input: string) => SanitizationResult>
): { sanitized: any, warnings: string[], blocked: string[] } {
  const result = {
    sanitized: { ...body },
    warnings: [] as string[],
    blocked: [] as string[]
  }

  for (const [field, sanitizer] of Object.entries(fieldConfigs)) {
    if (body[field] && typeof body[field] === 'string') {
      const sanitizationResult = sanitizer(body[field])
      result.sanitized[field] = sanitizationResult.sanitized
      
      if (sanitizationResult.warnings.length > 0) {
        result.warnings.push(`${field}: ${sanitizationResult.warnings.join(', ')}`)
      }
      
      if (sanitizationResult.blocked.length > 0) {
        result.blocked.push(`${field}: ${sanitizationResult.blocked.join(', ')}`)
      }
    }
  }

  return result
}
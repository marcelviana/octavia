/**
 * SQL Injection Prevention System
 * 
 * Advanced SQL injection detection and prevention for database queries,
 * with parameterized query enforcement and query sanitization.
 */

import { auditLogger } from './security-audit-logger'

// SQL injection patterns organized by risk level
const SQL_INJECTION_PATTERNS = {
  CRITICAL: [
    // Union-based injection
    /(\s|^)(union|UNION)(\s)+(all\s+)?(select|SELECT)/gi,
    
    // Comment-based injection
    /(--|\#|\/\*|\*\/)/g,
    
    // Stacked queries
    /;\s*(drop|DROP|delete|DELETE|insert|INSERT|update|UPDATE|create|CREATE|alter|ALTER)/gi,
    
    // Information schema queries
    /(information_schema|INFORMATION_SCHEMA)/gi,
    
    // System functions
    /(@@version|@@user|@@hostname|user\(\)|database\(\)|version\(\))/gi,
    
    // Time-based blind injection
    /(sleep\s*\(|SLEEP\s*\(|waitfor\s+delay|WAITFOR\s+DELAY)/gi,
    
    // Error-based injection
    /(extractvalue\s*\(|EXTRACTVALUE\s*\(|updatexml\s*\(|UPDATEXML\s*\()/gi
  ],
  
  HIGH: [
    // Boolean-based blind injection
    /(\s|^)(and|AND|or|OR)\s+\d+\s*(=|!=|<>)\s*\d+/gi,
    
    // Subquery injection
    /\(\s*(select|SELECT)\s+/gi,
    
    // Database-specific functions
    /(concat\s*\(|CONCAT\s*\(|group_concat\s*\(|GROUP_CONCAT\s*\()/gi,
    
    // Conditional statements
    /(case\s+when|CASE\s+WHEN|if\s*\(|IF\s*\()/gi,
    
    // Quote manipulation
    /('|\"|`)(\s*)(and|AND|or|OR)(\s*)('|\"|`)/gi
  ],
  
  MEDIUM: [
    // Basic SQL keywords
    /(select|SELECT|insert|INSERT|update|UPDATE|delete|DELETE|drop|DROP)/gi,
    
    // SQL operators
    /(\s|^)(like|LIKE|in|IN|between|BETWEEN|exists|EXISTS)/gi,
    
    // Wildcard usage
    /(%|_|\*)/g,
    
    // Parentheses patterns
    /\([^)]*('|")[^)]*\)/g
  ],
  
  LOW: [
    // Single quotes
    /'/g,
    
    // Double quotes in SQL context
    /"/g,
    
    // Semicolons
    /;/g,
    
    // Equals with potential injection
    /=\s*('|")/g
  ]
}

// Database-specific injection patterns
const DB_SPECIFIC_PATTERNS = {
  MYSQL: [
    /load_file\s*\(/gi,
    /into\s+outfile/gi,
    /information_schema\./gi,
    /mysql\./gi
  ],
  
  POSTGRESQL: [
    /pg_sleep\s*\(/gi,
    /pg_user/gi,
    /current_database\s*\(/gi,
    /pg_tables/gi
  ],
  
  SQLITE: [
    /sqlite_master/gi,
    /sqlite_version\s*\(/gi,
    /pragma\s+/gi
  ],
  
  MSSQL: [
    /xp_cmdshell/gi,
    /sp_executesql/gi,
    /sysobjects/gi,
    /syscolumns/gi
  ]
}

export interface SQLInjectionScanResult {
  safe: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE'
  detectedPatterns: {
    pattern: string
    riskLevel: string
    matches: string[]
  }[]
  sanitizedQuery?: string
  recommendations: string[]
}

export interface QueryValidationOptions {
  allowSelectQueries?: boolean
  allowModificationQueries?: boolean
  allowSystemQueries?: boolean
  maxQueryLength?: number
  strictMode?: boolean
  logSuspiciousQueries?: boolean
}

const DEFAULT_OPTIONS: QueryValidationOptions = {
  allowSelectQueries: true,
  allowModificationQueries: true,
  allowSystemQueries: false,
  maxQueryLength: 10000,
  strictMode: true,
  logSuspiciousQueries: true
}

/**
 * Main SQL injection detection function
 */
export function detectSQLInjection(
  query: string, 
  options: QueryValidationOptions = {}
): SQLInjectionScanResult {
  const config = { ...DEFAULT_OPTIONS, ...options }
  
  const result: SQLInjectionScanResult = {
    safe: true,
    riskLevel: 'NONE',
    detectedPatterns: [],
    recommendations: []
  }

  // Validate input
  if (!query || typeof query !== 'string') {
    return result
  }

  // Check query length
  if (query.length > config.maxQueryLength!) {
    result.safe = false
    result.riskLevel = 'MEDIUM'
    result.recommendations.push(`Query length ${query.length} exceeds maximum ${config.maxQueryLength}`)
  }

  // Normalize query for analysis
  const normalizedQuery = query.trim()
  let highestRiskLevel = 'NONE'

  // Scan for injection patterns by risk level
  for (const [riskLevel, patterns] of Object.entries(SQL_INJECTION_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedQuery.match(pattern)
      if (matches) {
        result.detectedPatterns.push({
          pattern: pattern.toString(),
          riskLevel,
          matches: matches.slice(0, 5) // Limit to first 5 matches
        })

        // Update highest risk level
        if (getRiskLevelScore(riskLevel) > getRiskLevelScore(highestRiskLevel)) {
          highestRiskLevel = riskLevel
        }
      }
    }
  }

  // Scan for database-specific patterns
  for (const [dbType, patterns] of Object.entries(DB_SPECIFIC_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = normalizedQuery.match(pattern)
      if (matches) {
        result.detectedPatterns.push({
          pattern: `${dbType}: ${pattern.toString()}`,
          riskLevel: 'HIGH',
          matches: matches.slice(0, 3)
        })

        if (getRiskLevelScore('HIGH') > getRiskLevelScore(highestRiskLevel)) {
          highestRiskLevel = 'HIGH'
        }
      }
    }
  }

  result.riskLevel = highestRiskLevel as any

  // Determine if query is safe based on risk level and configuration
  if (config.strictMode) {
    result.safe = ['NONE', 'LOW'].includes(highestRiskLevel)
  } else {
    result.safe = !['CRITICAL', 'HIGH'].includes(highestRiskLevel)
  }

  // Generate recommendations
  if (!result.safe) {
    result.recommendations.push('Use parameterized queries or prepared statements')
    result.recommendations.push('Validate and sanitize all user inputs')
    result.recommendations.push('Apply principle of least privilege to database connections')
    
    if (result.detectedPatterns.some(p => p.pattern.includes('union'))) {
      result.recommendations.push('Detected UNION-based injection attempt')
    }
    
    if (result.detectedPatterns.some(p => p.pattern.includes('--') || p.pattern.includes('/*'))) {
      result.recommendations.push('Detected comment-based injection attempt')
    }
    
    if (result.detectedPatterns.some(p => p.pattern.includes('information_schema'))) {
      result.recommendations.push('Detected information disclosure attempt')
    }
  }

  // Log suspicious queries if enabled
  if (config.logSuspiciousQueries && !result.safe) {
    auditLogger.suspiciousActivity('SQL injection attempt detected', {
      query: query.substring(0, 200), // First 200 chars only
      riskLevel: result.riskLevel,
      patterns: result.detectedPatterns.length
    })
  }

  return result
}

/**
 * Sanitize potentially dangerous SQL input
 */
export function sanitizeSQLInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  return input
    // Remove SQL comments
    .replace(/(--|\#|\/\*|\*\/)/g, '')
    
    // Escape single quotes
    .replace(/'/g, "''")
    
    // Remove or escape dangerous keywords (basic approach)
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
    
    // Remove semicolons to prevent query stacking
    .replace(/;/g, '')
    
    // Limit length
    .substring(0, 1000)
    
    // Trim whitespace
    .trim()
}

/**
 * Validate parameterized query structure
 */
export function validateParameterizedQuery(
  query: string, 
  parameters: any[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Count placeholders in query
  const placeholderCount = (query.match(/\$\d+|\?/g) || []).length
  
  // Check parameter count match
  if (placeholderCount !== parameters.length) {
    issues.push(`Parameter count mismatch: query has ${placeholderCount} placeholders, ${parameters.length} parameters provided`)
  }
  
  // Check for string concatenation in query (potential injection)
  if (query.includes('+') || query.includes('||') || query.includes('concat')) {
    issues.push('Query contains string concatenation - use parameters instead')
  }
  
  // Validate parameters don't contain SQL
  parameters.forEach((param, index) => {
    if (typeof param === 'string') {
      const scanResult = detectSQLInjection(param, { strictMode: true })
      if (!scanResult.safe) {
        issues.push(`Parameter ${index} contains potential SQL injection: ${scanResult.riskLevel}`)
      }
    }
  })
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Create a safe query builder helper
 */
export class SafeQueryBuilder {
  private query: string = ''
  private parameters: any[] = []
  private parameterIndex: number = 1
  
  select(columns: string[]): this {
    // Validate column names (only alphanumeric, underscore, dot)
    const safeColumns = columns.filter(col => /^[a-zA-Z0-9_.]+$/.test(col))
    
    if (safeColumns.length !== columns.length) {
      throw new Error('Invalid column names detected')
    }
    
    this.query = `SELECT ${safeColumns.join(', ')}`
    return this
  }
  
  from(table: string): this {
    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error('Invalid table name')
    }
    
    this.query += ` FROM ${table}`
    return this
  }
  
  where(column: string, operator: string, value: any): this {
    // Validate column and operator
    if (!/^[a-zA-Z0-9_.]+$/.test(column)) {
      throw new Error('Invalid column name')
    }
    
    const allowedOperators = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN', 'NOT IN']
    if (!allowedOperators.includes(operator.toUpperCase())) {
      throw new Error('Invalid operator')
    }
    
    const placeholder = `$${this.parameterIndex++}`
    this.query += this.query.includes('WHERE') ? ' AND' : ' WHERE'
    this.query += ` ${column} ${operator} ${placeholder}`
    this.parameters.push(value)
    
    return this
  }
  
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (!/^[a-zA-Z0-9_.]+$/.test(column)) {
      throw new Error('Invalid column name')
    }
    
    if (!['ASC', 'DESC'].includes(direction)) {
      throw new Error('Invalid sort direction')
    }
    
    this.query += ` ORDER BY ${column} ${direction}`
    return this
  }
  
  limit(count: number): this {
    if (!Number.isInteger(count) || count < 1 || count > 1000) {
      throw new Error('Invalid limit value')
    }
    
    this.query += ` LIMIT ${count}`
    return this
  }
  
  build(): { query: string; parameters: any[] } {
    // Final validation
    const scanResult = detectSQLInjection(this.query, { strictMode: true })
    
    if (!scanResult.safe) {
      throw new Error(`Generated query failed security scan: ${scanResult.riskLevel}`)
    }
    
    return {
      query: this.query,
      parameters: this.parameters
    }
  }
}

/**
 * Database connection wrapper with injection protection
 */
export function createSecureDBWrapper(originalDB: any) {
  return {
    query: async (sql: string, params: any[] = []) => {
      // Validate query before execution
      const scanResult = detectSQLInjection(sql, { strictMode: true })
      
      if (!scanResult.safe) {
        auditLogger.suspiciousActivity('Blocked dangerous SQL query', {
          riskLevel: scanResult.riskLevel,
          patterns: scanResult.detectedPatterns.length,
          query: sql.substring(0, 100)
        })
        
        throw new Error(`SQL query blocked due to security concerns: ${scanResult.riskLevel}`)
      }
      
      // Validate parameterized query structure
      const paramValidation = validateParameterizedQuery(sql, params)
      if (!paramValidation.valid) {
        throw new Error(`Parameter validation failed: ${paramValidation.issues.join(', ')}`)
      }
      
      // Execute query with original database connection
      return originalDB.query(sql, params)
    },
    
    // Provide safe query builder
    queryBuilder: () => new SafeQueryBuilder()
  }
}

/**
 * Middleware to scan request parameters for SQL injection
 */
export function sqlInjectionMiddleware(req: any, res: any, next: any) {
  const parametersToCheck = [
    ...Object.values(req.query || {}),
    ...Object.values(req.body || {}),
    ...Object.values(req.params || {})
  ]
  
  for (const param of parametersToCheck) {
    if (typeof param === 'string') {
      const scanResult = detectSQLInjection(param, { strictMode: true })
      
      if (!scanResult.safe) {
        auditLogger.suspiciousActivity('SQL injection attempt in request parameters', {
          riskLevel: scanResult.riskLevel,
          parameter: param.substring(0, 100),
          patterns: scanResult.detectedPatterns.length
        }, req)
        
        return res.status(400).json({
          error: 'Invalid input detected',
          code: 'SECURITY_VIOLATION'
        })
      }
    }
  }
  
  next()
}

/**
 * Helper function to get numeric risk level for comparison
 */
function getRiskLevelScore(level: string): number {
  const scores = {
    'NONE': 0,
    'LOW': 1,
    'MEDIUM': 2,
    'HIGH': 3,
    'CRITICAL': 4
  }
  return scores[level as keyof typeof scores] || 0
}

/**
 * Export common patterns for testing
 */
export const patterns = SQL_INJECTION_PATTERNS
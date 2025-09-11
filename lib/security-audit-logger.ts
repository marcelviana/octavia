/**
 * Security Audit Logging System
 * 
 * Comprehensive logging for security events, authentication attempts,
 * and suspicious activities for compliance and threat monitoring.
 */

import { NextRequest } from 'next/server'

export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'auth.login.success',
  LOGIN_FAILURE = 'auth.login.failure',
  LOGIN_BLOCKED = 'auth.login.blocked',
  LOGOUT = 'auth.logout',
  PASSWORD_RESET = 'auth.password_reset',
  EMAIL_VERIFICATION = 'auth.email_verification',
  SESSION_EXPIRED = 'auth.session_expired',
  
  // Authorization events
  ACCESS_GRANTED = 'authz.access_granted',
  ACCESS_DENIED = 'authz.access_denied',
  PRIVILEGE_ESCALATION = 'authz.privilege_escalation',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'security.rate_limit_exceeded',
  RATE_LIMIT_WARNING = 'security.rate_limit_warning',
  
  // File security
  FILE_UPLOAD_SUCCESS = 'security.file_upload.success',
  FILE_UPLOAD_BLOCKED = 'security.file_upload.blocked',
  MALICIOUS_FILE_DETECTED = 'security.malicious_file_detected',
  
  // Input validation
  INPUT_VALIDATION_FAILED = 'security.input_validation.failed',
  XSS_ATTEMPT = 'security.xss_attempt',
  SQL_INJECTION_ATTEMPT = 'security.sql_injection_attempt',
  
  // System security
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
  SECURITY_SCAN_TRIGGERED = 'security.scan_triggered',
  CSP_VIOLATION = 'security.csp_violation',
  
  // Data events
  DATA_ACCESS = 'data.access',
  DATA_MODIFICATION = 'data.modification',
  DATA_DELETION = 'data.deletion',
  DATA_EXPORT = 'data.export',
  
  // System events
  SYSTEM_ERROR = 'system.error',
  CONFIGURATION_CHANGE = 'system.config_change',
  MAINTENANCE_MODE = 'system.maintenance'
}

export enum SecurityLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface SecurityAuditEvent {
  id: string
  timestamp: Date
  eventType: SecurityEventType
  level: SecurityLevel
  userId?: string
  sessionId?: string
  ipAddress: string
  userAgent: string
  resource?: string
  action?: string
  details: Record<string, any>
  outcome: 'success' | 'failure' | 'blocked' | 'warning'
  riskScore: number
  metadata?: {
    requestId?: string
    correlationId?: string
    traceId?: string
    geolocation?: {
      country?: string
      region?: string
      city?: string
    }
  }
}

interface AuditLoggerConfig {
  enableConsoleLogging: boolean
  enableFileLogging: boolean
  logFilePath?: string
  enableRemoteLogging: boolean
  remoteEndpoint?: string
  retentionDays: number
  maxLogSize: number
  enableGeoLocation: boolean
  enableThreatIntelligence: boolean
}

const DEFAULT_CONFIG: AuditLoggerConfig = {
  enableConsoleLogging: true,
  enableFileLogging: process.env.NODE_ENV === 'production',
  logFilePath: process.env.AUDIT_LOG_PATH || './logs/security-audit.log',
  enableRemoteLogging: false,
  remoteEndpoint: process.env.SECURITY_LOG_ENDPOINT,
  retentionDays: 365,
  maxLogSize: 100 * 1024 * 1024, // 100MB
  enableGeoLocation: false,
  enableThreatIntelligence: false
}

// In-memory event storage for immediate analysis
const recentEvents = new Map<string, SecurityAuditEvent[]>()
const suspiciousIPs = new Set<string>()
const failedAttempts = new Map<string, number>()

// Risk scoring weights
const RISK_WEIGHTS = {
  [SecurityEventType.LOGIN_FAILURE]: 2,
  [SecurityEventType.LOGIN_BLOCKED]: 5,
  [SecurityEventType.ACCESS_DENIED]: 3,
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: 4,
  [SecurityEventType.MALICIOUS_FILE_DETECTED]: 8,
  [SecurityEventType.XSS_ATTEMPT]: 7,
  [SecurityEventType.SQL_INJECTION_ATTEMPT]: 9,
  [SecurityEventType.SUSPICIOUS_ACTIVITY]: 6,
}

class SecurityAuditLogger {
  private config: AuditLoggerConfig
  private logQueue: SecurityAuditEvent[] = []
  private processingQueue = false

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    
    // Start periodic queue processing
    setInterval(() => this.processLogQueue(), 5000) // Every 5 seconds
    
    // Cleanup old events periodically
    setInterval(() => this.cleanupOldEvents(), 60000) // Every minute
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(
    eventType: SecurityEventType,
    details: Partial<SecurityAuditEvent>,
    request?: NextRequest
  ): Promise<void> {
    const event = this.createSecurityEvent(eventType, details, request)
    
    // Add to queue for processing
    this.logQueue.push(event)
    
    // Update in-memory tracking
    this.updateSecurityTracking(event)
    
    // Process immediately for critical events
    if (event.level === SecurityLevel.CRITICAL) {
      await this.processEvent(event)
    }
  }

  /**
   * Create a security event with enriched metadata
   */
  private createSecurityEvent(
    eventType: SecurityEventType,
    details: Partial<SecurityAuditEvent>,
    request?: NextRequest
  ): SecurityAuditEvent {
    const id = this.generateEventId()
    const timestamp = new Date()
    const ipAddress = this.extractIPAddress(request)
    const userAgent = request?.headers.get('user-agent') || 'Unknown'
    
    // Calculate risk score
    const baseRisk = RISK_WEIGHTS[eventType] || 1
    const riskMultiplier = this.calculateRiskMultiplier(ipAddress, eventType)
    const riskScore = Math.min(baseRisk * riskMultiplier, 10)
    
    // Determine security level
    const level = this.determineSecurityLevel(eventType, riskScore)

    return {
      id,
      timestamp,
      eventType,
      level,
      ipAddress,
      userAgent,
      riskScore,
      outcome: details.outcome || 'success',
      details: details.details || {},
      ...details,
      metadata: {
        requestId: request?.headers.get('x-request-id') || undefined,
        correlationId: this.generateCorrelationId(),
        ...details.metadata
      }
    }
  }

  /**
   * Process the log queue
   */
  private async processLogQueue(): Promise<void> {
    if (this.processingQueue || this.logQueue.length === 0) return
    
    this.processingQueue = true
    
    try {
      const events = this.logQueue.splice(0, 100) // Process in batches
      
      for (const event of events) {
        await this.processEvent(event)
      }
    } catch (error) {
      console.error('Error processing security log queue:', error)
    } finally {
      this.processingQueue = false
    }
  }

  /**
   * Process individual security event
   */
  private async processEvent(event: SecurityAuditEvent): Promise<void> {
    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(event)
    }

    // File logging
    if (this.config.enableFileLogging) {
      await this.logToFile(event)
    }

    // Remote logging
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      await this.logToRemote(event)
    }

    // Trigger alerts for high-severity events
    if (event.level >= SecurityLevel.HIGH) {
      await this.triggerSecurityAlert(event)
    }
  }

  /**
   * Log to console with appropriate formatting
   */
  private logToConsole(event: SecurityAuditEvent): void {
    const logLevel = this.getConsoleLogLevel(event.level)
    const message = this.formatConsoleMessage(event)
    
    console[logLevel](message)
  }

  /**
   * Log to file (in production, use proper logging library)
   */
  private async logToFile(event: SecurityAuditEvent): Promise<void> {
    try {
      const logEntry = JSON.stringify(event) + '\n'
      
      // In production, use proper file logging with rotation
      if (process.env.NODE_ENV !== 'development') {
        // Use fs.promises.appendFile or winston logger
        // For now, just console log in structured format
        console.log(`AUDIT_LOG: ${logEntry.trim()}`)
      }
    } catch (error) {
      console.error('Error writing to audit log file:', error)
    }
  }

  /**
   * Log to remote endpoint
   */
  private async logToRemote(event: SecurityAuditEvent): Promise<void> {
    try {
      if (!this.config.remoteEndpoint) return

      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.AUDIT_LOG_API_KEY || ''
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Error sending audit log to remote endpoint:', error)
    }
  }

  /**
   * Trigger security alerts for critical events
   */
  private async triggerSecurityAlert(event: SecurityAuditEvent): Promise<void> {
    // In production, integrate with alerting systems
    console.warn(`🚨 SECURITY ALERT: ${event.eventType}`, {
      level: event.level,
      riskScore: event.riskScore,
      ipAddress: event.ipAddress,
      details: event.details
    })

    // Could integrate with:
    // - Email notifications
    // - Slack/Discord webhooks
    // - PagerDuty
    // - Security information and event management (SIEM) systems
  }

  /**
   * Update security tracking metrics
   */
  private updateSecurityTracking(event: SecurityAuditEvent): void {
    const { ipAddress, eventType, userId } = event
    
    // Track recent events by IP
    if (!recentEvents.has(ipAddress)) {
      recentEvents.set(ipAddress, [])
    }
    recentEvents.get(ipAddress)!.push(event)
    
    // Track failed attempts
    if (event.outcome === 'failure' || event.outcome === 'blocked') {
      const key = userId || ipAddress
      failedAttempts.set(key, (failedAttempts.get(key) || 0) + 1)
      
      // Mark IP as suspicious after multiple failures
      if (failedAttempts.get(key)! > 5) {
        suspiciousIPs.add(ipAddress)
      }
    }
    
    // Reset failed attempts on success
    if (event.outcome === 'success' && userId) {
      failedAttempts.delete(userId)
      failedAttempts.delete(ipAddress)
    }
  }

  /**
   * Calculate risk multiplier based on historical data
   */
  private calculateRiskMultiplier(ipAddress: string, eventType: SecurityEventType): number {
    let multiplier = 1.0
    
    // Increase risk for suspicious IPs
    if (suspiciousIPs.has(ipAddress)) {
      multiplier *= 1.5
    }
    
    // Increase risk based on recent failed attempts
    const failures = failedAttempts.get(ipAddress) || 0
    if (failures > 0) {
      multiplier *= (1 + failures * 0.2)
    }
    
    // Increase risk for rapid-fire events
    const recentEventList = recentEvents.get(ipAddress) || []
    const recentCount = recentEventList.filter(e => 
      Date.now() - e.timestamp.getTime() < 60000 // Last minute
    ).length
    
    if (recentCount > 10) {
      multiplier *= 2.0
    } else if (recentCount > 5) {
      multiplier *= 1.3
    }
    
    return Math.min(multiplier, 3.0) // Cap at 3x
  }

  /**
   * Determine security level based on event type and risk score
   */
  private determineSecurityLevel(eventType: SecurityEventType, riskScore: number): SecurityLevel {
    // Critical events
    if (riskScore >= 8 || [
      SecurityEventType.SQL_INJECTION_ATTEMPT,
      SecurityEventType.MALICIOUS_FILE_DETECTED,
      SecurityEventType.PRIVILEGE_ESCALATION
    ].includes(eventType)) {
      return SecurityLevel.CRITICAL
    }
    
    // High severity events
    if (riskScore >= 6 || [
      SecurityEventType.XSS_ATTEMPT,
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      SecurityEventType.LOGIN_BLOCKED
    ].includes(eventType)) {
      return SecurityLevel.HIGH
    }
    
    // Medium severity events
    if (riskScore >= 3 || [
      SecurityEventType.ACCESS_DENIED,
      SecurityEventType.RATE_LIMIT_EXCEEDED,
      SecurityEventType.FILE_UPLOAD_BLOCKED
    ].includes(eventType)) {
      return SecurityLevel.MEDIUM
    }
    
    return SecurityLevel.LOW
  }

  /**
   * Utility methods
   */
  private extractIPAddress(request?: NextRequest): string {
    if (!request) return 'unknown'
    
    // Try various headers for real IP
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return request.headers.get('x-real-ip') || 
           request.headers.get('cf-connecting-ip') || 
           request.ip || 
           'unknown'
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getConsoleLogLevel(level: SecurityLevel): 'log' | 'warn' | 'error' {
    switch (level) {
      case SecurityLevel.CRITICAL:
      case SecurityLevel.HIGH:
        return 'error'
      case SecurityLevel.MEDIUM:
        return 'warn'
      default:
        return 'log'
    }
  }

  private formatConsoleMessage(event: SecurityAuditEvent): string {
    return `[SECURITY] ${event.timestamp.toISOString()} | ${event.eventType} | Level: ${SecurityLevel[event.level]} | IP: ${event.ipAddress} | Risk: ${event.riskScore} | ${JSON.stringify(event.details)}`
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago
    
    for (const [ip, events] of recentEvents.entries()) {
      const filteredEvents = events.filter(e => e.timestamp.getTime() > cutoffTime)
      
      if (filteredEvents.length === 0) {
        recentEvents.delete(ip)
      } else {
        recentEvents.set(ip, filteredEvents)
      }
    }
  }

  /**
   * Get security metrics for monitoring dashboard
   */
  getSecurityMetrics(): {
    recentEvents: number
    suspiciousIPs: number
    failedAttempts: number
    highRiskEvents: number
  } {
    const now = Date.now()
    const hourAgo = now - (60 * 60 * 1000)
    
    let totalRecentEvents = 0
    let highRiskEvents = 0
    
    for (const events of recentEvents.values()) {
      const recentEvents = events.filter(e => e.timestamp.getTime() > hourAgo)
      totalRecentEvents += recentEvents.length
      highRiskEvents += recentEvents.filter(e => e.riskScore >= 6).length
    }
    
    return {
      recentEvents: totalRecentEvents,
      suspiciousIPs: suspiciousIPs.size,
      failedAttempts: failedAttempts.size,
      highRiskEvents
    }
  }
}

// Global audit logger instance
export const securityAuditLogger = new SecurityAuditLogger()

/**
 * Convenience functions for common security events
 */
export const auditLogger = {
  // Authentication events
  loginSuccess: (userId: string, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, { userId }, request),
    
  loginFailure: (details: Record<string, any>, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.LOGIN_FAILURE, { 
      details, 
      outcome: 'failure' 
    }, request),
    
  accessDenied: (resource: string, userId?: string, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.ACCESS_DENIED, {
      userId,
      resource,
      outcome: 'blocked'
    }, request),

  // File security events
  maliciousFile: (fileName: string, threats: string[], request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.MALICIOUS_FILE_DETECTED, {
      details: { fileName, threats },
      outcome: 'blocked'
    }, request),

  // Rate limiting events
  rateLimitExceeded: (endpoint: string, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, {
      resource: endpoint,
      outcome: 'blocked'
    }, request),

  // Input validation events
  inputValidationFailed: (field: string, value: string, error: string, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.INPUT_VALIDATION_FAILED, {
      details: { field, value: value.substring(0, 100), error },
      outcome: 'blocked'
    }, request),

  // General suspicious activity
  suspiciousActivity: (description: string, details: Record<string, any>, request?: NextRequest) =>
    securityAuditLogger.logSecurityEvent(SecurityEventType.SUSPICIOUS_ACTIVITY, {
      details: { description, ...details },
      outcome: 'warning'
    }, request)
}
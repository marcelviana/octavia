import { NextRequest } from 'next/server';

interface SecurityEvent {
  timestamp: string;
  eventType: 'auth_success' | 'auth_failure' | 'auth_attempt' | 'unauthorized_access' | 'rate_limit_exceeded' | 'suspicious_activity' | 'file_upload' | 'data_access';
  userId?: string;
  email?: string;
  ip: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

class SecurityLogger {
  private logToConsole(event: SecurityEvent): void {
    const logLevel = this.getLogLevel(event.riskLevel);
    const logMessage = `[SECURITY] ${event.eventType.toUpperCase()} - ${event.timestamp}`;
    
    console[logLevel](logMessage, {
      userId: event.userId,
      email: event.email,
      ip: event.ip,
      resource: event.resource,
      action: event.action,
      details: event.details,
    });
  }

  private logToExternalService(event: SecurityEvent): void {
    // TODO: Implement external logging service (e.g., Sentry, LogRocket, etc.)
    // This is where you'd send to your monitoring service
    
    if (event.riskLevel === 'critical' || event.riskLevel === 'high') {
      // Send alerts for high-risk events
      console.error('[SECURITY ALERT]', event);
    }
  }

  private getLogLevel(riskLevel: string): 'info' | 'warn' | 'error' {
    switch (riskLevel) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warn';
      case 'high':
      case 'critical':
        return 'error';
      default:
        return 'info';
    }
  }

  public log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.logToConsole(fullEvent);
    this.logToExternalService(fullEvent);
  }

  // Helper methods for common security events
  public logAuthSuccess(userId: string, email: string, ip: string, userAgent?: string): void {
    this.log({
      eventType: 'auth_success',
      userId,
      email,
      ip,
      userAgent,
      riskLevel: 'low',
    });
  }

  public logAuthFailure(email: string, ip: string, userAgent?: string, reason?: string): void {
    this.log({
      eventType: 'auth_failure',
      email,
      ip,
      userAgent,
      details: { reason },
      riskLevel: 'medium',
    });
  }

  public logUnauthorizedAccess(ip: string, resource: string, userAgent?: string): void {
    this.log({
      eventType: 'unauthorized_access',
      ip,
      userAgent,
      resource,
      riskLevel: 'high',
    });
  }

  public logRateLimitExceeded(ip: string, resource: string, userAgent?: string): void {
    this.log({
      eventType: 'rate_limit_exceeded',
      ip,
      userAgent,
      resource,
      riskLevel: 'medium',
    });
  }

  public logSuspiciousActivity(ip: string, activity: string, userAgent?: string, details?: any): void {
    this.log({
      eventType: 'suspicious_activity',
      ip,
      userAgent,
      details: { activity, ...details },
      riskLevel: 'high',
    });
  }

  public logFileUpload(userId: string, filename: string, fileSize: number, ip: string): void {
    this.log({
      eventType: 'file_upload',
      userId,
      ip,
      details: { filename, fileSize },
      riskLevel: 'low',
    });
  }

  public logDataAccess(userId: string, resource: string, action: string, ip: string): void {
    this.log({
      eventType: 'data_access',
      userId,
      ip,
      resource,
      action,
      riskLevel: 'low',
    });
  }
}

export const securityLogger = new SecurityLogger();

// Utility function to extract IP from request
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return '127.0.0.1';
}

// Utility function to extract user agent
export function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}
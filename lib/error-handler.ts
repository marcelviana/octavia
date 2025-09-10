/**
 * Unified Error Handler
 * 
 * Centralized error handling system for consistent error management
 * across the entire Octavia application.
 */

import { toast } from "@/hooks/use-toast"
import logger from "@/lib/logger"
import { debug } from "@/lib/debug"
import React from "react"

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium", 
  HIGH = "high",
  CRITICAL = "critical",
}

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization", 
  VALIDATION = "validation",
  NETWORK = "network",
  DATABASE = "database",
  PERFORMANCE = "performance",
  CACHE = "cache",
  SYSTEM = "system",
  UNKNOWN = "unknown",
}

// Standardized error interface
export interface AppError {
  message: string
  code?: string
  category: ErrorCategory
  severity: ErrorSeverity
  context?: Record<string, any>
  originalError?: Error
  timestamp: Date
  userId?: string
  operation?: string
  recoverable?: boolean
}

// Error handling strategies
export interface ErrorHandlingStrategy {
  shouldShowToUser: boolean
  shouldLog: boolean
  shouldReport: boolean
  userMessage?: string
  retryable?: boolean
}

class ErrorHandler {
  private strategies = new Map<ErrorCategory, ErrorHandlingStrategy>()

  constructor() {
    this.initializeStrategies()
  }

  private initializeStrategies() {
    this.strategies.set(ErrorCategory.AUTHENTICATION, {
      shouldShowToUser: true,
      shouldLog: true,
      shouldReport: false,
      userMessage: "Please sign in to continue",
      retryable: false,
    })

    this.strategies.set(ErrorCategory.NETWORK, {
      shouldShowToUser: true,
      shouldLog: true, 
      shouldReport: true,
      userMessage: "Network connection error. Please check your connection and try again.",
      retryable: true,
    })

    this.strategies.set(ErrorCategory.PERFORMANCE, {
      shouldShowToUser: true,
      shouldLog: true,
      shouldReport: true,
      userMessage: "Performance mode encountered an issue. Check your content cache.",
      retryable: true,
    })
  }

  handle(error: AppError): void {
    const strategy = this.strategies.get(error.category) || {
      shouldShowToUser: true,
      shouldLog: true,
      shouldReport: false,
      userMessage: "An unexpected error occurred",
      retryable: false,
    }

    if (strategy.shouldLog) {
      this.logError(error)
    }

    if (strategy.shouldShowToUser) {
      this.notifyUser(error, strategy)
    }
  }

  createError(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>
  ): AppError {
    return {
      message,
      category,
      severity,
      context,
      timestamp: new Date(),
      recoverable: true,
    }
  }

  handleServiceError(
    operation: string,
    error: any,
    context?: Record<string, any>
  ): AppError {
    let category = ErrorCategory.UNKNOWN
    let message = "An unexpected error occurred"

    if (error instanceof Error) {
      message = error.message

      if (error.message.includes("unauthorized")) {
        category = ErrorCategory.AUTHENTICATION
      } else if (error.message.includes("network")) {
        category = ErrorCategory.NETWORK
      } else if (error.message.includes("database")) {
        category = ErrorCategory.DATABASE
      }
    }

    const appError = this.createError(message, category, ErrorSeverity.MEDIUM, { operation, ...context })
    this.handle(appError)
    return appError
  }

  private logError(error: AppError): void {
    logger.error("Application error", {
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
    })
  }

  private notifyUser(error: AppError, strategy: ErrorHandlingStrategy): void {
    const message = strategy.userMessage || error.message
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    })
  }
}

export const errorHandler = new ErrorHandler()

// Convenience functions
export const handleAuthError = (error: any, context?: Record<string, any>) =>
  errorHandler.handleServiceError("authentication", error, context)

export const handleNetworkError = (error: any, context?: Record<string, any>) =>
  errorHandler.handleServiceError("network", error, context)

export const handlePerformanceError = (operation: string, error: any, context?: Record<string, any>) =>
  errorHandler.handle(
    errorHandler.createError(
      `Performance error in ${operation}: ${error instanceof Error ? error.message : 'Unknown'}`,
      ErrorCategory.PERFORMANCE,
      ErrorSeverity.CRITICAL,
      { operation, ...context }
    )
  )
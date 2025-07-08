import { z } from 'zod';

const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md', 'mp3', 'wav', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DANGEROUS_EXTENSIONS = ['exe', 'bat', 'sh', 'php', 'jsp', 'js', 'html', 'svg'];

const MIME_TYPE_MAP: Record<string, string[]> = {
  'pdf': ['application/pdf'],
  'txt': ['text/plain'],
  'md': ['text/markdown', 'text/plain'],
  'mp3': ['audio/mpeg'],
  'wav': ['audio/wav'],
  'jpg': ['image/jpeg'],
  'jpeg': ['image/jpeg'],
  'png': ['image/png'],
};

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check for empty file
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty',
    };
  }

  // Extract extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension) {
    return {
      isValid: false,
      error: 'File must have an extension',
    };
  }

  // Check allowed extensions
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check for dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: 'File type is not allowed for security reasons',
    };
  }

  // Validate MIME type
  const expectedMimeTypes = MIME_TYPE_MAP[extension];
  if (expectedMimeTypes && !expectedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type does not match extension',
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);
  if (!sanitizedFilename) {
    return {
      isValid: false,
      error: 'Invalid filename',
    };
  }

  return {
    isValid: true,
    sanitizedFilename,
  };
}

export function sanitizeFilename(filename: string): string | null {
  // Remove path separators and dangerous characters
  const sanitized = filename
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove Windows forbidden characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '') // Remove control characters
    .replace(/^\.+/, '') // Remove leading dots
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace remaining special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores

  // Check if filename is valid after sanitization
  if (!sanitized || sanitized.length === 0 || sanitized.length > 255) {
    return null;
  }

  return sanitized;
}
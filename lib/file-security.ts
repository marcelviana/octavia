/**
 * Enhanced File Upload Security System
 * 
 * Comprehensive file security scanning for malicious content,
 * embedded scripts, and other security threats in uploaded files.
 */

import { z } from 'zod';
import { createHash } from 'crypto';

const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md', 'mp3', 'wav', 'jpg', 'jpeg', 'png'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB for sheet music
const DANGEROUS_EXTENSIONS = ['exe', 'bat', 'sh', 'php', 'jsp', 'js', 'html', 'svg', 'scr', 'com', 'cmd', 'pif', 'vbs', 'jar'];

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

// File magic numbers (signatures) for validation
const MAGIC_NUMBERS: Record<string, number[][]> = {
  'pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'jpg': [[0xFF, 0xD8, 0xFF]],
  'jpeg': [[0xFF, 0xD8, 0xFF]],
  'png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'mp3': [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]], // MP3 + ID3
  'wav': [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

// Dangerous content patterns to scan for
const SECURITY_PATTERNS = [
  // JavaScript patterns
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /eval\s*\(/gi,
  
  // PHP patterns
  /<\?php/gi,
  /<\?=/gi,
  /exec\s*\(/gi,
  /system\s*\(/gi,
  
  // SQL injection patterns
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  
  // Command injection
  /;\s*(?:rm|del|format|fdisk)/gi,
];

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
  securityScan?: {
    safe: boolean;
    threats: string[];
    warnings: string[];
    fileHash: string;
  };
}

export async function validateFile(file: File): Promise<FileValidationResult> {
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

  // Run security scan
  const securityScan = await scanFileForThreats(file);

  return {
    isValid: true && securityScan.safe,
    sanitizedFilename,
    error: securityScan.safe ? undefined : `Security threat detected: ${securityScan.threats.join(', ')}`,
    securityScan,
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

/**
 * Advanced security scanning for uploaded files
 */
async function scanFileForThreats(file: File): Promise<{
  safe: boolean;
  threats: string[];
  warnings: string[];
  fileHash: string;
}> {
  const result = {
    safe: true,
    threats: [] as string[],
    warnings: [] as string[],
    fileHash: ''
  };

  try {
    // Get file buffer for analysis
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    
    // Generate file hash
    result.fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // Validate magic numbers (file signature)
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension && MAGIC_NUMBERS[extension]) {
      const isValidSignature = validateMagicNumbers(fileBuffer, extension);
      if (!isValidSignature) {
        result.safe = false;
        result.threats.push('File signature does not match extension');
      }
    }

    // Content scanning for malicious patterns
    const contentScan = scanFileContent(fileBuffer);
    if (contentScan.threats.length > 0) {
      result.safe = false;
      result.threats.push(...contentScan.threats);
    }
    result.warnings.push(...contentScan.warnings);

    // PDF-specific security checks
    if (file.type === 'application/pdf') {
      const pdfScan = analyzePDFSecurity(fileBuffer);
      if (pdfScan.threats.length > 0) {
        result.safe = false;
        result.threats.push(...pdfScan.threats);
      }
      result.warnings.push(...pdfScan.warnings);
    }

    // Image metadata analysis
    if (file.type.startsWith('image/')) {
      const imageScan = analyzeImageSecurity(fileBuffer);
      result.warnings.push(...imageScan.warnings);
    }

  } catch (error) {
    result.warnings.push(`Security scan error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Validate file magic numbers (signatures)
 */
function validateMagicNumbers(fileBuffer: Buffer, extension: string): boolean {
  const signatures = MAGIC_NUMBERS[extension];
  if (!signatures) return true; // No signature check needed

  return signatures.some(signature => 
    signature.every((byte, index) => fileBuffer[index] === byte)
  );
}

/**
 * Scan file content for malicious patterns
 */
function scanFileContent(fileBuffer: Buffer): { threats: string[]; warnings: string[] } {
  const result = { threats: [] as string[], warnings: [] as string[] };
  
  // Convert to string for pattern matching
  const content = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 10000)); // First 10KB
  
  let threatCount = 0;
  for (const pattern of SECURITY_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      threatCount += matches.length;
      
      // Categorize threats
      if (pattern.toString().includes('script')) {
        result.threats.push('JavaScript code detected');
      } else if (pattern.toString().includes('php')) {
        result.threats.push('PHP code detected');
      } else if (pattern.toString().includes('union|select')) {
        result.threats.push('SQL injection patterns detected');
      } else if (pattern.toString().includes('rm|del')) {
        result.threats.push('Command injection patterns detected');
      }
    }
  }
  
  if (threatCount > 5) {
    result.threats.push(`High threat level: ${threatCount} suspicious patterns found`);
  } else if (threatCount > 0) {
    result.warnings.push(`${threatCount} potentially suspicious patterns found`);
  }
  
  return result;
}

/**
 * PDF-specific security analysis
 */
function analyzePDFSecurity(fileBuffer: Buffer): { threats: string[]; warnings: string[] } {
  const result = { threats: [] as string[], warnings: [] as string[] };
  const content = fileBuffer.toString('ascii');
  
  // Check for JavaScript in PDF
  if (content.includes('/JavaScript') || content.includes('/JS')) {
    result.threats.push('PDF contains JavaScript');
  }
  
  // Check for embedded files
  if (content.includes('/EmbeddedFiles') || content.includes('/FileAttachment')) {
    result.warnings.push('PDF contains embedded files');
  }
  
  // Check for forms
  if (content.includes('/AcroForm')) {
    result.warnings.push('PDF contains form fields');
  }
  
  // Check for actions
  if (content.includes('/Action') || content.includes('/OpenAction')) {
    result.warnings.push('PDF contains automatic actions');
  }
  
  return result;
}

/**
 * Image security analysis
 */
function analyzeImageSecurity(fileBuffer: Buffer): { warnings: string[] } {
  const result = { warnings: [] as string[] };
  
  // Check for EXIF data that might contain sensitive info
  if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) { // JPEG
    for (let i = 2; i < Math.min(fileBuffer.length - 1, 1000); i++) {
      if (fileBuffer[i] === 0xFF && fileBuffer[i + 1] === 0xE1) {
        result.warnings.push('Image contains EXIF metadata');
        break;
      }
    }
  }
  
  // Simple steganography detection (high entropy check)
  const entropy = calculateEntropy(fileBuffer.slice(0, 1024)); // First 1KB
  if (entropy > 7.5) {
    result.warnings.push('Image has high entropy - possible hidden data');
  }
  
  return result;
}

/**
 * Calculate entropy for steganography detection
 */
function calculateEntropy(buffer: Buffer): number {
  const frequency = new Array(256).fill(0);
  
  for (let i = 0; i < buffer.length; i++) {
    frequency[buffer[i]]++;
  }
  
  let entropy = 0;
  const length = buffer.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequency[i] > 0) {
      const probability = frequency[i] / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

/**
 * Enhanced file validation with security scanning
 */
export async function validateFileSecure(file: File): Promise<FileValidationResult> {
  // Run basic validation first
  const basicResult = await validateFile(file);
  if (!basicResult.isValid) {
    return basicResult;
  }

  // Run comprehensive security scan
  const securityScan = await scanFileForThreats(file);
  
  return {
    ...basicResult,
    isValid: basicResult.isValid && securityScan.safe,
    error: securityScan.safe ? basicResult.error : `Security threat detected: ${securityScan.threats.join(', ')}`,
    securityScan
  };
}
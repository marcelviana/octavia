// Nonce generation utility for Edge Runtime
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

const nonces = new Map<string, string>();

export function generateNonce(): string {
  // Use Web Crypto API for Edge Runtime compatibility
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to base64
  const binaryString = Array.from(array, byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString);
}

export function getNonce(req: NextRequest): string {
  const requestId = req.headers.get('x-request-id') || 'default';
  
  if (!nonces.has(requestId)) {
    nonces.set(requestId, generateNonce());
  }
  
  return nonces.get(requestId)!;
}

/**
 * Get the CSP nonce from request headers in server components
 * This is used to apply nonces to inline scripts and styles
 */
export async function getCSPNonce(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get('x-csp-nonce');
  } catch (error) {
    // Headers might not be available in all contexts
    return null;
  }
}

// Clean up old nonces periodically to prevent memory leaks
// Simple cleanup that works in both Node.js and Edge Runtime
try {
  if (typeof setInterval !== 'undefined') {
    setInterval(() => {
      // Only keep the map small by clearing it periodically
      if (nonces.size > 100) {
        nonces.clear();
      }
    }, 60000); // Check every minute
  }
} catch (error) {
  // Ignore cleanup errors in Edge Runtime
}
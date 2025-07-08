// Nonce generation utility for Edge Runtime
import { NextRequest } from 'next/server';

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

// Clean up old nonces periodically
setInterval(() => {
  nonces.clear();
}, 5 * 60 * 1000);
// Nonce generation utility
import { randomBytes } from 'crypto';
import { NextRequest } from 'next/server';

const nonces = new Map<string, string>();

export function generateNonce(): string {
  return randomBytes(16).toString('base64');
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
}, 5 * 60 * 1000); // Clear every 5 minutes
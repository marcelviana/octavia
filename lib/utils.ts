import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function urlHasExtension(url: string, ext: string): boolean {
  const clean = url.split('?')[0].split('#')[0]
  return clean.toLowerCase().endsWith(ext.toLowerCase())
}

// Enhanced file type detection that works with URLs, MIME types, and blob URLs
export function isPdfFile(url: string, mimeType?: string): boolean {
  // Check MIME type first (most reliable for cached files)
  if (mimeType) {
    return mimeType === 'application/pdf'
  }
  
  // Check if it's a data URL with PDF MIME type
  if (url.startsWith('data:')) {
    return url.startsWith('data:application/pdf')
  }
  
  // For blob URLs, we can't tell from the URL alone, so return false
  if (url.startsWith('blob:')) {
    return false
  }
  
  // Fallback to extension check for regular URLs
  return urlHasExtension(url, '.pdf')
}

export function isImageFile(url: string, mimeType?: string): boolean {
  // Check MIME type first (most reliable for cached files)
  if (mimeType) {
    return mimeType.startsWith('image/')
  }
  
  // Check if it's a data URL with image MIME type
  if (url.startsWith('data:')) {
    return url.startsWith('data:image/')
  }
  
  // For blob URLs, we can't tell from the URL alone, so return false
  if (url.startsWith('blob:')) {
    return false
  }
  
  // Fallback to extension check for regular URLs
  return urlHasExtension(url, '.png') || 
         urlHasExtension(url, '.jpg') || 
         urlHasExtension(url, '.jpeg') ||
         urlHasExtension(url, '.gif') ||
         urlHasExtension(url, '.webp') ||
         urlHasExtension(url, '.svg')
}

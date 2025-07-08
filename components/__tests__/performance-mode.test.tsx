import { describe, it, expect } from 'vitest'
import { isPdfFile, isImageFile } from '@/lib/utils'

describe('Performance Mode PDF Detection', () => {
  describe('isPdfFile', () => {
    it('should detect PDF files by MIME type', () => {
      expect(isPdfFile('blob:http://localhost:3000/abc123', 'application/pdf')).toBe(true)
      expect(isPdfFile('data:application/pdf;base64,abc123', 'application/pdf')).toBe(true)
    })

    it('should detect PDF files by URL extension', () => {
      expect(isPdfFile('https://example.com/document.pdf', undefined)).toBe(true)
      expect(isPdfFile('https://example.com/document.PDF', undefined)).toBe(true)
      expect(isPdfFile('https://example.com/document.pdf?token=123', undefined)).toBe(true)
    })

    it('should detect PDF data URLs', () => {
      expect(isPdfFile('data:application/pdf;base64,abc123', undefined)).toBe(true)
    })

    it('should not detect non-PDF files', () => {
      expect(isPdfFile('https://example.com/image.png', undefined)).toBe(false)
      expect(isPdfFile('blob:http://localhost:3000/abc123', 'image/png')).toBe(false)
      expect(isPdfFile('data:image/png;base64,abc123', undefined)).toBe(false)
    })

    it('should return false for blob URLs without MIME type', () => {
      expect(isPdfFile('blob:http://localhost:3000/abc123', undefined)).toBe(false)
    })
  })

  describe('isImageFile', () => {
    it('should detect image files by MIME type', () => {
      expect(isImageFile('blob:http://localhost:3000/abc123', 'image/png')).toBe(true)
      expect(isImageFile('blob:http://localhost:3000/abc123', 'image/jpeg')).toBe(true)
      expect(isImageFile('blob:http://localhost:3000/abc123', 'image/gif')).toBe(true)
    })

    it('should detect image files by URL extension', () => {
      expect(isImageFile('https://example.com/image.png', undefined)).toBe(true)
      expect(isImageFile('https://example.com/image.jpg', undefined)).toBe(true)
      expect(isImageFile('https://example.com/image.jpeg', undefined)).toBe(true)
      expect(isImageFile('https://example.com/image.gif', undefined)).toBe(true)
      expect(isImageFile('https://example.com/image.webp', undefined)).toBe(true)
    })

    it('should detect image data URLs', () => {
      expect(isImageFile('data:image/png;base64,abc123', undefined)).toBe(true)
      expect(isImageFile('data:image/jpeg;base64,abc123', undefined)).toBe(true)
    })

    it('should not detect non-image files', () => {
      expect(isImageFile('https://example.com/document.pdf', undefined)).toBe(false)
      expect(isImageFile('blob:http://localhost:3000/abc123', 'application/pdf')).toBe(false)
      expect(isImageFile('data:application/pdf;base64,abc123', undefined)).toBe(false)
    })

    it('should return false for blob URLs without MIME type', () => {
      expect(isImageFile('blob:http://localhost:3000/abc123', undefined)).toBe(false)
    })
  })
}) 
import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  id: z.string().uuid(),
  email: z.string().email(),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  contentType: z.enum(['song', 'chord', 'lyric', 'audio', 'video', 'pdf']),
  filename: z.string().min(1).max(255).regex(/^[a-zA-Z0-9._-]+$/),
};

// Content validation schema
export const contentSchema = z.object({
  title: commonSchemas.title,
  description: commonSchemas.description,
  content_type: commonSchemas.contentType,
  tags: commonSchemas.tags,
  artist: z.string().max(100).optional(),
  album: z.string().max(100).optional(),
  genre: z.string().max(50).optional(),
  key: z.string().max(10).optional(),
  bpm: z.number().min(40).max(300).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
});

// User profile validation schema
export const profileSchema = z.object({
  first_name: z.string().min(1).max(50).trim(),
  last_name: z.string().min(1).max(50).trim(),
  email: commonSchemas.email,
  bio: z.string().max(500).optional(),
});

// File upload validation schema
export const fileUploadSchema = z.object({
  filename: commonSchemas.filename,
  size: z.number().min(1).max(10 * 1024 * 1024), // 10MB
  type: z.string().min(1),
});
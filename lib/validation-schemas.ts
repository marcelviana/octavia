import { z } from 'zod';

// Common validation helpers
export const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');

// Content validation schemas
export const contentTypeSchema = z.enum(['Lyrics', 'Chords', 'Tab', 'Sheet', 'song', 'chord', 'lyric', 'audio', 'video', 'pdf']);

export const createContentSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeString),
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  album: z.string()
    .max(100, 'Album name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  genre: z.string()
    .max(50, 'Genre must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  content_type: contentTypeSchema,
  content_data: z.record(z.any()).optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  key: z.string().max(10, 'Key must be less than 10 characters').optional().nullable(),
  bpm: z.number().int().min(1).max(999).optional().nullable(),
  time_signature: z.string().max(10, 'Time signature must be less than 10 characters').optional().nullable(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional().nullable(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters').transform(sanitizeString))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  is_favorite: z.boolean().default(false),
  is_public: z.boolean().default(false),
});

export const updateContentSchema = z.object({
  id: z.string().uuid('Invalid content ID'),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(sanitizeString)
    .optional(),
  artist: z.string()
    .max(100, 'Artist name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  album: z.string()
    .max(100, 'Album name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  genre: z.string()
    .max(50, 'Genre must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  content_data: z.record(z.any()).optional().nullable(),
  file_url: z.string().url().optional().nullable(),
  key: z.string().max(10, 'Key must be less than 10 characters').optional().nullable(),
  bpm: z.number().int().min(1).max(999).optional().nullable(),
  time_signature: z.string().max(10, 'Time signature must be less than 10 characters').optional().nullable(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional().nullable(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters').transform(sanitizeString))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .nullable(),
  notes: z.string()
    .max(2000, 'Notes must be less than 2000 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  is_favorite: z.boolean().optional(),
  is_public: z.boolean().optional(),
});

// Query parameter validation schemas
export const contentQuerySchema = z.object({
  page: z.string().regex(/^\d+$/, 'Page must be a number').transform(Number).default('1'),
  pageSize: z.string().regex(/^\d+$/, 'Page size must be a number').transform(Number).default('20'),
  search: z.string()
    .max(100, 'Search query must be less than 100 characters')
    .transform(sanitizeString)
    .optional(),
  sortBy: z.enum(['recent', 'title', 'artist', 'updated']).default('recent'),
  contentType: z.string().max(100).optional(),
  difficulty: z.string().max(100).optional(),
  key: z.string().max(100).optional(),
  favorite: z.enum(['true', 'false']).optional(),
});

// Profile validation schemas
export const createProfileSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  full_name: z.string()
    .max(100, 'Full name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  first_name: z.string()
    .max(50, 'First name must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  last_name: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  avatar_url: z.string().url('Invalid avatar URL').max(500, 'Avatar URL must be less than 500 characters').optional().nullable(),
  primary_instrument: z.string()
    .max(50, 'Primary instrument must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  website: z.string().url('Invalid website URL').max(255, 'Website URL must be less than 255 characters').optional().nullable(),
});

export const updateProfileSchema = z.object({
  full_name: z.string()
    .max(100, 'Full name must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  first_name: z.string()
    .max(50, 'First name must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  last_name: z.string()
    .max(50, 'Last name must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  avatar_url: z.string().url('Invalid avatar URL').max(500, 'Avatar URL must be less than 500 characters').optional().nullable(),
  primary_instrument: z.string()
    .max(50, 'Primary instrument must be less than 50 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  bio: z.string()
    .max(1000, 'Bio must be less than 1000 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  website: z.string().url('Invalid website URL').max(255, 'Website URL must be less than 255 characters').optional().nullable(),
});

// Authentication validation schemas
export const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
    .optional(),
  displayName: z.string()
    .max(100, 'Display name must be less than 100 characters')
    .transform(sanitizeString)
    .optional(),
  emailVerified: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  uid: z.string().min(1, 'User ID is required'),
  email: z.string().email('Invalid email address').max(255, 'Email must be less than 255 characters').optional(),
  displayName: z.string()
    .max(100, 'Display name must be less than 100 characters')
    .transform(sanitizeString)
    .optional(),
  emailVerified: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

export const sessionSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

// File upload validation schemas
export const allowedMimeTypes = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/jpg',
] as const;

export const allowedExtensions = [
  'pdf', 'txt', 'docx', 'png', 'jpg', 'jpeg'
] as const;

export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters')
    .regex(/^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/, 'Invalid filename format')
    .refine((filename) => {
      const ext = filename.toLowerCase().split('.').pop();
      return ext && allowedExtensions.includes(ext as typeof allowedExtensions[number]);
    }, 'File type not allowed'),
  file: z.custom<File>((file) => file instanceof File, 'Invalid file')
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB') // 50MB limit
    .refine((file) => {
      return allowedMimeTypes.includes(file.type as typeof allowedMimeTypes[number]);
    }, 'File type not allowed'),
});

export const fileDeleteSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters')
    .regex(/^[a-zA-Z0-9._/-]+$/, 'Invalid filename format'),
});

// Setlist validation schemas
export const createSetlistSchema = z.object({
  name: z.string()
    .min(1, 'Setlist name is required')
    .max(100, 'Setlist name must be less than 100 characters')
    .transform(sanitizeString),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  event_date: z.string().datetime('Invalid date format').optional().nullable(),
  venue: z.string()
    .max(100, 'Venue must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  is_public: z.boolean().default(false),
});

export const updateSetlistSchema = z.object({
  id: z.string().uuid('Invalid setlist ID'),
  name: z.string()
    .min(1, 'Setlist name is required')
    .max(100, 'Setlist name must be less than 100 characters')
    .transform(sanitizeString)
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  event_date: z.string().datetime('Invalid date format').optional().nullable(),
  venue: z.string()
    .max(100, 'Venue must be less than 100 characters')
    .transform(sanitizeString)
    .optional()
    .nullable(),
  is_public: z.boolean().optional(),
});

export const addSongToSetlistSchema = z.object({
  contentId: z.string().uuid('Invalid content ID'),
  position: z.number().int().min(1, 'Position must be at least 1'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .transform(sanitizeString)
    .default(''),
});

// Proxy validation schema  
export const proxyRequestSchema = z.object({
  url: z.string().url('Invalid URL').refine((url) => {
    const parsedUrl = new URL(url);
    // Only allow HTTPS URLs
    return parsedUrl.protocol === 'https:';
  }, 'Only HTTPS URLs are allowed'),
});

// Export all schema types for TypeScript inference
export type CreateContentInput = z.infer<typeof createContentSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type ContentQueryInput = z.infer<typeof contentQuerySchema>;
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type FileDeleteInput = z.infer<typeof fileDeleteSchema>;
export type CreateSetlistInput = z.infer<typeof createSetlistSchema>;
export type UpdateSetlistInput = z.infer<typeof updateSetlistSchema>;
export type AddSongToSetlistInput = z.infer<typeof addSongToSetlistSchema>;
export type ProxyRequestInput = z.infer<typeof proxyRequestSchema>; 
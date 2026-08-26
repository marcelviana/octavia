import { z } from 'zod';

// Common validation helpers
export const sanitizeString = (str: string) => str.trim().replace(/[<>]/g, '');

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
export const sessionSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
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
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;
export type CreateSetlistInput = z.infer<typeof createSetlistSchema>;
export type UpdateSetlistInput = z.infer<typeof updateSetlistSchema>;
export type AddSongToSetlistInput = z.infer<typeof addSongToSetlistSchema>;
export type ProxyRequestInput = z.infer<typeof proxyRequestSchema>; 
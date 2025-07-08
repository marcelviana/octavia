# 🛡️ AGENT.md - Security-First Development Guidelines for AI Agents

This document contains **mandatory security and architectural constraints** that must be followed by all AI agents when generating, editing, or reviewing code for this project.

⚠️ **CRITICAL**: These rules are non-negotiable. Any code generation that violates these security principles must be rejected and regenerated with proper security measures.

---

## 🏗️ Architecture Overview

This project uses **Firebase Authentication** for auth and **Supabase** for database and file storage. The security model is based on service role key usage with manual authorization checks.

**Stack**: Next.js 14 (App Router) + Firebase Auth + Supabase Database + TypeScript + Tailwind CSS

---

## 🔒 CRITICAL SECURITY RULES

### 1. **Data Access Architecture**
- ✅ All Supabase operations **MUST use the Supabase Service Role key**
- ❌ **NEVER** use Supabase client-side SDK with Row-Level Security (RLS)
- ❌ **NEVER** use `supabase.auth` or any auth-sensitive operations on the browser
- ✅ All database operations must be wrapped in secure API routes with Firebase Auth validation

### 2. **Input Validation (MANDATORY)**
**ALL user inputs must be validated before processing. Never trust client-side data.**

```typescript
// REQUIRED: Use Zod for all input validation
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1).max(200).trim(),
  email: z.string().email(),
  content: z.string().max(10000),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

// In ALL API routes:
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    // ... rest of logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    throw error;
  }
}
```

### 3. **Error Handling (MANDATORY)**
**Never expose sensitive information in error messages.**

```typescript
// ❌ BAD: Exposes internal details
catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// ✅ GOOD: Generic error with logging
catch (error) {
  logger.error('Database operation failed:', error);
  return NextResponse.json(
    { error: 'Internal server error', code: 'DB_001' },
    { status: 500 }
  );
}
```

### 4. **Authentication Pattern (MANDATORY)**
**All protected API routes must follow this exact pattern:**

```typescript
import { requireAuthServer } from '@/lib/firebase-server-utils';
import { getSupabaseServiceClient } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  // 1. ALWAYS validate Firebase token first
  const user = await requireAuthServer(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Use Supabase service client (never browser client)
  const supabase = getSupabaseServiceClient();
  
  // 3. ALWAYS filter by user.uid for authorization
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.uid);

  if (error) {
    logger.error('Query failed:', error);
    return NextResponse.json(
      { error: 'Database query failed' },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
```

### 5. **File Upload Security (MANDATORY)**
**All file uploads must be validated and sanitized:**

```typescript
// Required file validation
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'md', 'mp3', 'wav', 'jpg', 'png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DANGEROUS_EXTENSIONS = ['exe', 'bat', 'sh', 'php', 'jsp', 'js', 'html'];

function validateFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Check extension
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file type');
  }
  
  // Block dangerous extensions
  if (DANGEROUS_EXTENSIONS.includes(ext)) {
    throw new Error('Dangerous file type blocked');
  }
  
  // Sanitize filename
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
    
  if (sanitizedName.length === 0) {
    throw new Error('Invalid filename');
  }
}
```

### 6. **Rate Limiting (MANDATORY)**
**All API endpoints must implement rate limiting:**

```typescript
// Required rate limiting implementation
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function withRateLimit(handler: Function, maxRequests = 100) {
  return async (req: NextRequest) => {
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const tokenCount = (rateLimit.get(ip) as number) || 0;
    
    if (tokenCount >= maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
    
    rateLimit.set(ip, tokenCount + 1);
    return handler(req);
  };
}
```

### 7. **Environment Variables (MANDATORY)**
**Never hardcode secrets or expose them client-side:**

```typescript
// ❌ BAD: Hardcoded secrets in code
const privateKey = "-----BEGIN PRIVATE KEY-----\nABCD...";

// ❌ BAD: Server secrets in client-side code
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // In React component

// ✅ GOOD: Server-side only, with validation
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
```

### 8. **Session Security (MANDATORY)**
**All session cookies must have proper security flags:**

```typescript
// Required cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 days
  path: '/',
};
```

---

## 🚫 PROHIBITED PATTERNS

### Never Generate Code That:
1. **Stores sensitive data in localStorage/sessionStorage**
2. **Uses eval() or Function() constructors**
3. **Trusts user input without validation**
4. **Exposes stack traces or detailed errors to users**
5. **Performs database operations client-side**
6. **Hardcodes secrets, tokens, or credentials**
7. **Uses innerHTML with user content (XSS risk)**
8. **Allows unrestricted file uploads**

### Example of Prohibited Code:
```typescript
// ❌ NEVER generate code like this:
localStorage.setItem('authToken', token);
document.innerHTML = userContent;
const query = `SELECT * FROM users WHERE id = ${userId}`;
return NextResponse.json({ error: error.stack });
```

---

## 📋 MANDATORY SECURITY CHECKLIST

Before generating any code, verify:

### API Routes:
- [ ] Firebase auth validation implemented
- [ ] Input validation with Zod
- [ ] Rate limiting applied
- [ ] Generic error messages
- [ ] User authorization checks
- [ ] Request size limits

### Components:
- [ ] User inputs sanitized
- [ ] No sensitive data in localStorage
- [ ] File uploads validated
- [ ] No innerHTML with user content
- [ ] Proper error boundaries

### Configuration:
- [ ] Security headers configured
- [ ] Environment variables validated
- [ ] Cookie security flags set
- [ ] CORS properly configured

---

## 🔧 REQUIRED DEPENDENCIES

When generating code, ensure these security dependencies are available:

```json
{
  "dependencies": {
    "zod": "^3.22.0",
    "lru-cache": "^10.0.0"
  }
}
```

---

## 📝 SECURITY LOGGING

**All security-relevant events must be logged:**

```typescript
// Required security logging
import logger from '@/lib/logger';

// Log authentication events
logger.info('User login attempt', { userId, ip, userAgent });

// Log authorization failures
logger.warn('Authorization failed', { userId, resource, action });

// Log suspicious activity
logger.error('Suspicious request detected', { ip, userAgent, request });
```

---

## 🎯 SPECIFIC PATTERNS FOR THIS PROJECT

### API Route Template:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuthServer } from '@/lib/firebase-server-utils';
import { getSupabaseServiceClient } from '@/lib/supabase-service';
import { z } from 'zod';
import logger from '@/lib/logger';

const schema = z.object({
  // Define your schema here
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (if applicable)
    
    // 2. Authentication
    const user = await requireAuthServer(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Input validation
    const body = await request.json();
    const validatedData = schema.parse(body);

    // 4. Database operations
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('table_name')
      .insert({ ...validatedData, user_id: user.uid });

    if (error) {
      logger.error('Database operation failed:', error);
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    logger.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Component Security Template:
```typescript
'use client';

import { useState } from 'react';
import { z } from 'zod';

const formSchema = z.object({
  // Define validation schema
});

export default function SecureComponent() {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate on client-side (but always validate server-side too)
      const validatedData = formSchema.parse(formData);
      
      // Make API call with proper error handling
      const response = await fetch('/api/endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      // Handle success
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.flatten().fieldErrors);
      } else {
        // Display generic error to user
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    }
  };

  return (
    // JSX with proper error handling
  );
}
```

---

## 🔄 ENFORCEMENT

**This AGENT.md file is mandatory and non-negotiable.** Any code generation that violates these security principles should be rejected and regenerated with proper security measures.

### Code Review Questions:
1. Is user input validated with Zod?
2. Are errors properly sanitized?
3. Is authentication implemented correctly?
4. Are there any hardcoded secrets?
5. Is rate limiting applied?
6. Are file uploads validated?
7. Are database operations server-side only?

### Red Flags to Watch For:
- Direct database queries in components
- Unvalidated user inputs
- Detailed error messages
- Client-side secret storage
- Missing authentication checks
- No rate limiting on API routes

---

## 🚀 CONCLUSION

Following these guidelines will prevent the majority of security vulnerabilities. When in doubt, always err on the side of caution and implement additional security measures rather than fewer.

**Remember: Security is not optional - it's a fundamental requirement for every piece of code generated.**
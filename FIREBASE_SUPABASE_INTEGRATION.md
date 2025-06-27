# Firebase Auth + Supabase Database Integration

This project has been successfully migrated from Supabase Auth to Firebase Auth while maintaining Supabase as the database and storage layer.

## 🏗️ Architecture Overview

- **Authentication**: Firebase Auth (client & server-side)
- **Database**: Supabase PostgreSQL (via service role key)
- **Storage**: Supabase Storage (via service role key)
- **Session Management**: HTTP-only cookies + Firebase ID tokens

## 📁 File Structure

### New Firebase Files
```
contexts/
└── firebase-auth-context.tsx      # Firebase auth context

lib/
├── firebase.ts                    # Firebase client configuration
├── firebase-admin.ts              # Firebase admin configuration
├── firebase-integration.ts        # Firebase testing utilities
├── firebase-server-utils.ts       # Server-side auth utilities
├── firebase-session-cookies.ts    # Session cookie utilities
├── supabase-service.ts            # Supabase service client (no auth)
├── supabase.ts                    # Old Supabase client (still used for storage)
└── supabase-server.ts             # Old Supabase server client

app/api/
├── auth/session/route.ts          # Session cookie management
├── profile/route.ts               # User profile CRUD
├── content/route.ts               # Content CRUD example
└── firebase-test/route.ts         # Firebase admin testing

app/
├── firebase-test/page.tsx         # Firebase testing page
├── firebase-supabase-test/page.tsx # Integration testing page
└── layout.tsx                     # Updated to use FirebaseAuthProvider

middleware.ts                      # Updated for Firebase auth
```

## 🔧 Environment Variables

### Required Variables

```bash
# Firebase Client SDK (Browser)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin SDK (Server)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# Supabase Database & Storage
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=content-files
```

## 🚀 Setup Instructions

### 1. Firebase Setup
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password and Google providers
3. Enable Firestore Database
4. Generate service account key from Project Settings → Service Accounts

### 2. Supabase Setup
1. Keep your existing Supabase project
2. Get the service role key from Settings → API
3. Update database schema to use Firebase UIDs
4. Run the policies in `supabase/rls-policies.sql` to enable row level security

### 3. Database Schema Updates

Your Supabase tables should use Firebase UIDs as user identifiers:

```sql
-- Update profiles table
ALTER TABLE profiles 
  ALTER COLUMN id TYPE TEXT,
  ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Update content table  
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES profiles(id);

-- Enable RLS and apply policies for Firebase UIDs
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Policies in supabase/rls-policies.sql restrict rows to the authenticated UID
-- and still allow full access when using the service role key
```

## 🔐 Authentication Flow

### Client-Side
1. User signs in via Firebase Auth
2. Firebase returns ID token
3. ID token is stored in context and sent to server
4. Session cookie is set for improved UX

### Server-Side
1. API routes extract Bearer token from Authorization header
2. Firebase Admin SDK verifies the token
3. Extracted UID is used for Supabase queries
4. Supabase service client performs database operations

## 🧪 Testing

### Test Pages
- `/firebase-test` - Firebase configuration and basic auth testing
- `/firebase-supabase-test` - Complete integration testing

### API Testing
```bash
# Test Firebase admin configuration
curl http://localhost:3000/api/firebase-test

# Test profile API (requires auth)
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
     http://localhost:3000/api/profile

# Test content API (requires auth)  
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
     http://localhost:3000/api/content
```

### Unit Tests
```bash
# Run Firebase admin tests
pnpm test lib/__tests__/firebase-admin.test.ts

# Run Firebase client tests
pnpm test lib/__tests__/firebase.test.ts
```

## 🔄 Migration Steps

### From Supabase Auth to Firebase Auth

1. **Install Firebase packages** ✅
   ```bash
   pnpm add firebase firebase-admin
   ```

2. **Create Firebase configuration** ✅
   - `lib/firebase.ts` - Client configuration
   - `lib/firebase-admin.ts` - Server configuration

3. **Replace auth context** ✅
   - `contexts/firebase-auth-context.tsx` now provides authentication

4. **Update middleware** ✅
   - Replace Supabase auth check with Firebase token validation

5. **Create API routes** ✅
   - Profile management with Firebase auth
   - Content management with Firebase auth
   - Session cookie management

6. **Update database access** ✅
   - Use service role key instead of RLS
   - Firebase UID as user identifier

## 🛡️ Security Considerations

### Firebase ID Tokens
- Tokens expire after 1 hour
- Auto-refresh handled by Firebase SDK
- Verified server-side using Firebase Admin SDK

### Session Cookies
- HTTP-only cookies for better UX
- Secure flag in production
- 7-day expiration

### Supabase Service Role
- Used only server-side
- Never exposed to client
- Bypasses RLS (ensure proper authorization in API layer)

## 🔧 API Routes Pattern

All protected API routes follow this pattern:

```typescript
import { requireAuthServer } from '@/lib/firebase-server-utils'
import { getSupabaseServiceClient } from '@/lib/supabase-service'

export async function GET(request: NextRequest) {
  // 1. Validate Firebase token
  const user = await requireAuthServer(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Use Supabase service client
  const supabase = getSupabaseServiceClient()
  
  // 3. Query with Firebase UID
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('user_id', user.uid)

  return NextResponse.json(data)
}
```

## 🎯 Benefits of This Architecture

1. **Reliable Authentication**: Firebase Auth eliminates session handling issues
2. **Flexible Database**: Keep using Supabase's excellent PostgreSQL features
3. **Unified Storage**: Continue using Supabase Storage
4. **Better UX**: Session cookies + token refresh for seamless experience
5. **Scalable**: Firebase Auth scales automatically
6. **Security**: Server-side token verification ensures security

## 🐛 Troubleshooting

### Common Issues

1. **Token Validation Fails**
   - Check Firebase admin credentials
   - Ensure ID token is fresh (< 1 hour)
   - Verify project ID matches

2. **Database Access Denied**
   - Check service role key
   - Verify RLS policies are disabled or properly configured
   - Ensure user_id column uses Firebase UID

3. **Session Cookies Not Working**
   - Check secure flag in production
   - Verify domain and path settings
   - Ensure HTTP-only flag is set

### Debug Mode
Set `NODE_ENV=development` to see detailed logs for:
- Firebase token validation
- Supabase queries
- Session cookie operations

## 🔄 Rollback Plan

If needed, you can rollback by:
1. Reverting `app/layout.tsx` to use `AuthProvider`
2. Reverting `middleware.ts` to use Supabase auth
3. Updating API routes to use Supabase RLS
4. Retrieve the old auth context from version control if needed

## 📈 Next Steps

1. **Test thoroughly** with the provided test pages
2. **Update existing components** to use the new auth context
3. **Migrate user data** if needed (Supabase UID → Firebase UID)
4. **Update documentation** for your team

---

🎉 **Congratulations!** You now have a robust Firebase Auth + Supabase Database integration that provides the best of both worlds. 
# Test Environment Setup

## Overview

The test setup has been updated to use environment variables instead of hardcoded credentials for security. This document explains how to properly configure your test environment.

## Security Improvements

✅ **Before (INSECURE):**
- Hardcoded Firebase private keys in source code
- Real-looking API keys committed to repository
- Production-like URLs and credentials in tests

✅ **After (SECURE):**
- Environment variables with secure fallbacks
- Mock credentials for default testing
- Proper separation of test and production configs

## Setting Up Test Environment

### Option 1: Use Mock Credentials (Default)
The test setup includes safe mock credentials that work out of the box for basic testing. No additional setup required.

### Option 2: Use Real Test Credentials
For integration testing, create a `.env.test` file in your project root:

```bash
# Test Environment Variables
# NEVER commit this file to version control

# Supabase Test Configuration
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key-here
TEST_SUPABASE_SERVICE_KEY=your-test-service-role-key-here
TEST_SUPABASE_BUCKET=your-test-bucket-name

# Firebase Test Configuration
TEST_FIREBASE_API_KEY=your-test-firebase-api-key
TEST_FIREBASE_AUTH_DOMAIN=your-test-project.firebaseapp.com
TEST_FIREBASE_PROJECT_ID=your-test-project-id
TEST_FIREBASE_STORAGE_BUCKET=your-test-project.appspot.com
TEST_FIREBASE_SENDER_ID=your-sender-id
TEST_FIREBASE_APP_ID=your-firebase-app-id

# Firebase Admin Test Configuration
TEST_FIREBASE_CLIENT_EMAIL=your-test-service-account@your-project.iam.gserviceaccount.com
TEST_FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-actual-private-key-content-here\n-----END PRIVATE KEY-----"

# Proxy Configuration
TEST_ALLOWED_PROXY_HOSTS=localhost,127.0.0.1,your-test-domains.com

# Auth Configuration
TEST_NEXTAUTH_SECRET=your-long-random-secret-for-testing
TEST_NEXTAUTH_URL=http://localhost:3000
```

### Option 3: Use Firebase Emulator Suite (Recommended)
For the most secure local testing:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Set up emulators: `firebase init emulators`
3. Start emulators: `firebase emulators:start`
4. Use emulator endpoints in your test environment

## Best Practices

### ✅ Do:
- Use separate Firebase/Supabase projects for testing
- Generate test-specific service account keys
- Keep test credentials isolated from production
- Use environment variables for all sensitive data
- Consider using emulators for local development

### ❌ Don't:
- Commit any real credentials to version control
- Use production credentials in tests
- Hardcode API keys or secrets in source code
- Share test credentials in public channels

## Security Notes

1. **Separation**: Always use separate projects/databases for testing
2. **Rotation**: Regularly rotate test credentials
3. **Access Control**: Limit test credential permissions to minimum required
4. **Monitoring**: Monitor usage of test credentials for unexpected activity

## Environment Variable Loading

The test setup loads environment variables in this order:
1. Environment variables (from `.env.test` or system)
2. Mock fallback values (safe for basic testing)

This ensures tests work out of the box while allowing secure configuration when needed.

## Troubleshooting

### Tests fail with authentication errors
- Check that your test environment variables are properly set
- Verify test credentials have the necessary permissions
- Consider using mock mode for unit tests

### Mock credentials don't work for integration tests
- Set up real test credentials following Option 2 above
- Or use Firebase Emulator Suite for local testing

### Environment variables not loading
- Ensure `.env.test` is in the project root
- Check that variable names match exactly (case-sensitive)
- Verify the file is not being ignored by git 
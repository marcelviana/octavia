# Database Setup Guide

This guide will help you set up and troubleshoot the Supabase database for the Octavia application.

## Quick Setup

If you're experiencing database connection issues, follow these steps:

### 1. Check Environment Variables

Ensure your `.env.local` file contains the correct Supabase configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run Database Setup

```bash
node scripts/setup-database.js
```

This script will:
- Verify your environment variables
- Test the database connection
- Create the necessary tables and schema
- Set up Row Level Security policies

### 3. Manual Setup (if automated setup fails)

If the automated setup doesn't work, you can manually set up the database:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to the **SQL Editor**
4. Copy and paste the contents of `supabase/schema.sql`
5. Execute the SQL

## Troubleshooting

### Common Error Messages

#### "Database Project Not Found"
- **Cause**: DNS resolution failure - the Supabase project doesn't exist or has been deleted
- **Solution**: 
  - Check your Supabase project URL in the dashboard
  - Verify the project is still active
  - Update your environment variables if needed

#### "Database Connection Timeout"
- **Cause**: Network connectivity issues or Supabase service is down
- **Solution**:
  - Check your internet connection
  - Visit [Supabase Status](https://status.supabase.com) to check for service issues
  - Try again later

#### "Database Setup Required"
- **Cause**: The database tables are missing
- **Solution**:
  - Run `node scripts/setup-database.js`
  - Or manually execute the schema in your Supabase dashboard

#### "Database Schema Not Found"
- **Cause**: Required tables don't exist
- **Solution**:
  - Execute the schema manually in Supabase dashboard
  - Check that all tables from `supabase/schema.sql` were created

### Diagnostic Tools

#### Check Connection
```bash
node scripts/check-supabase.js
```

This script will:
- Verify environment variables
- Test DNS resolution
- Check network connectivity
- Validate project configuration

#### Check Database Schema
```sql
-- Run this in your Supabase SQL Editor to check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'content', 'setlists', 'setlist_songs');
```

## Database Schema

The application requires the following tables:

- **profiles**: User profile information
- **content**: Music content (songs, chords, etc.)
- **setlists**: User-created setlists
- **setlist_songs**: Junction table linking setlists to content

### Required Extensions

- `uuid-ossp`: For UUID generation

### Row Level Security

All tables have Row Level Security enabled with policies that:
- Allow users to access only their own data
- Allow service role access for server-side operations
- Enable content sharing through setlists

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=content-files
```

### Getting Your Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL** and **service_role** key

## Security Notes

- **Never commit your `.env.local` file** to version control
- The **service role key** has full database access - keep it secure
- Row Level Security ensures users can only access their own data
- All database operations are performed server-side for security

## Support

If you continue to experience issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Visit [Supabase Status](https://status.supabase.com) for service updates
3. Review the application logs for detailed error messages
4. Contact support with specific error codes and messages

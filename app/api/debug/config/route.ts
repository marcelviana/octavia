import { NextRequest, NextResponse } from 'next/server';
import { notFound } from '@/lib/api-errors';
import { isSupabaseServiceConfigured } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return notFound('Not available in production');
  }

  const config = {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    isConfigured: isSupabaseServiceConfigured,
    nodeEnv: process.env.NODE_ENV,
  };

  return NextResponse.json(config);
}

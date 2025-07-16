import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Test database configuration - use actual system environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Only throw error if we're actually trying to use the database
let databaseConfigured = false

if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  databaseConfigured = true
}

/**
 * Creates a Supabase client configured for testing
 * Uses service role key for full database access during tests
 */
export function createTestSupabaseClient() {
  if (!databaseConfigured) {
    throw new Error('Test database configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  }
  
  return createClient<Database>(SUPABASE_URL!, SUPABASE_SERVICE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Sets up a clean test database environment
 * Clears all test data and prepares for fresh test run
 */
export async function setupTestDatabase() {
  const supabase = createTestSupabaseClient()
  
  // Clear test data from all tables (in dependency order)
  await supabase.from('setlist_songs').delete().like('setlist_id', 'test-%')
  await supabase.from('setlists').delete().like('id', 'test-%')
  await supabase.from('content').delete().like('user_id', 'test-%')
  await supabase.from('user_profiles').delete().like('user_id', 'test-%')
  
  return supabase
}

/**
 * Seeds the test database with realistic test data
 * Returns the created test data for use in tests
 */
export async function seedTestData(userId: string = 'test-user-1') {
  const supabase = createTestSupabaseClient()
  
  // Create test user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User',
      primary_instrument: 'guitar'
    })
    .select()
    .single()

  // Create test content
  const testContent = [
    {
      id: 'test-content-1',
      title: 'Amazing Grace',
      content_type: 'lyrics' as const,
      content: 'Amazing grace how sweet the sound...',
      user_id: userId,
      is_favorite: false,
      tags: ['hymn', 'traditional']
    },
    {
      id: 'test-content-2', 
      title: 'How Great Thou Art',
      content_type: 'chords' as const,
      content: 'G C G D...',
      user_id: userId,
      is_favorite: true,
      tags: ['hymn', 'worship']
    },
    {
      id: 'test-content-3',
      title: 'Blessed Be Your Name',
      content_type: 'lyrics' as const,
      content: 'Blessed be your name in the land...',
      user_id: userId,
      is_favorite: false,
      tags: ['modern', 'worship']
    }
  ]

  const { data: content } = await supabase
    .from('content')
    .insert(testContent)
    .select()

  // Create test setlist
  const { data: setlist } = await supabase
    .from('setlists')
    .insert({
      id: 'test-setlist-1',
      name: 'Sunday Service',
      description: 'Test setlist for integration tests',
      user_id: userId,
      is_archived: false
    })
    .select()
    .single()

  // Add songs to setlist
  if (setlist && content) {
    await supabase
      .from('setlist_songs')
      .insert([
        {
          setlist_id: setlist.id,
          content_id: content[0].id,
          position: 1
        },
        {
          setlist_id: setlist.id,
          content_id: content[1].id,
          position: 2
        }
      ])
  }

  return {
    profile,
    content,
    setlist,
    userId
  }
}

/**
 * Cleans up test data after test completion
 * Should be called in afterEach or afterAll hooks
 */
export async function cleanupTestData(userId?: string) {
  const supabase = createTestSupabaseClient()
  
  if (userId) {
    // Clean up specific user's test data
    await supabase.from('setlist_songs').delete().like('setlist_id', 'test-%')
    await supabase.from('setlists').delete().eq('user_id', userId)
    await supabase.from('content').delete().eq('user_id', userId)
    await supabase.from('user_profiles').delete().eq('user_id', userId)
  } else {
    // Clean up all test data
    await supabase.from('setlist_songs').delete().like('setlist_id', 'test-%')
    await supabase.from('setlists').delete().like('id', 'test-%')
    await supabase.from('content').delete().like('user_id', 'test-%')
    await supabase.from('user_profiles').delete().like('user_id', 'test-%')
  }
}

/**
 * Gets test data from database for verification
 */
export async function getTestContent(userId: string) {
  const supabase = createTestSupabaseClient()
  
  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  
  return content || []
}

/**
 * Verifies that test data changes are persisted correctly
 */
export async function verifyContentChange(contentId: string, expectedChanges: Record<string, any>) {
  const supabase = createTestSupabaseClient()
  
  const { data: content } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .single()
  
  if (!content) {
    throw new Error(`Content with id ${contentId} not found`)
  }
  
  for (const [key, expectedValue] of Object.entries(expectedChanges)) {
    if (content[key as keyof typeof content] !== expectedValue) {
      throw new Error(`Expected ${key} to be ${expectedValue}, but got ${content[key as keyof typeof content]}`)
    }
  }
  
  return content
}

/**
 * Creates test user data that matches your Firebase auth structure
 */
export function createTestUser(overrides: Partial<{ uid: string; email: string; displayName: string }> = {}) {
  const timestamp = Date.now()
  return {
    uid: `test-user-${timestamp}`,
    email: `test-${timestamp}@example.com`,
    displayName: `Test User ${timestamp}`,
    ...overrides
  }
} 
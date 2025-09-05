-- Octavia Database Schema
-- This file contains all the necessary tables and initial setup for the Octavia application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- Firebase UID
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  primary_instrument TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  artist TEXT,
  album TEXT,
  genre TEXT,
  content_type TEXT NOT NULL,
  key TEXT,
  bpm INTEGER,
  time_signature TEXT,
  difficulty TEXT,
  capo INTEGER,
  tuning TEXT,
  tags TEXT[],
  notes TEXT,
  content_data JSONB,
  file_url TEXT,
  thumbnail_url TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setlists table
CREATE TABLE IF NOT EXISTS setlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Setlist songs table (junction table)
CREATE TABLE IF NOT EXISTS setlist_songs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setlist_id UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setlist_id, position)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_user_id ON content(user_id);
CREATE INDEX IF NOT EXISTS idx_content_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_is_favorite ON content(is_favorite);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at);
CREATE INDEX IF NOT EXISTS idx_content_updated_at ON content(updated_at);

CREATE INDEX IF NOT EXISTS idx_setlists_user_id ON setlists(user_id);
CREATE INDEX IF NOT EXISTS idx_setlists_created_at ON setlists(created_at);

CREATE INDEX IF NOT EXISTS idx_setlist_songs_setlist_id ON setlist_songs(setlist_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_content_id ON setlist_songs(content_id);
CREATE INDEX IF NOT EXISTS idx_setlist_songs_position ON setlist_songs(position);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_updated_at BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setlists_updated_at BEFORE UPDATE ON setlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_setlist_songs_updated_at BEFORE UPDATE ON setlist_songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "User owns profile" ON profiles
  USING (id = auth.jwt()->>'uid');
CREATE POLICY "Service role access to profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Content policies
CREATE POLICY "User owns content" ON content
  USING (user_id = auth.jwt()->>'uid');
CREATE POLICY "Service role access to content" ON content
  FOR ALL USING (auth.role() = 'service_role');

-- Setlists policies
CREATE POLICY "User owns setlists" ON setlists
  USING (user_id = auth.jwt()->>'uid');
CREATE POLICY "Service role access to setlists" ON setlists
  FOR ALL USING (auth.role() = 'service_role');

-- Setlist songs policies
CREATE POLICY "User owns setlist songs" ON setlist_songs
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = auth.jwt()->>'uid'
    )
  );
CREATE POLICY "Service role access to setlist songs" ON setlist_songs
  FOR ALL USING (auth.role() = 'service_role');

-- Additional policy to allow content access when referenced in user's setlists
CREATE POLICY "User can read content referenced in setlists" ON content
  FOR SELECT USING (
    user_id = auth.jwt()->>'uid' OR
    EXISTS (
      SELECT 1 FROM setlist_songs 
      JOIN setlists ON setlists.id = setlist_songs.setlist_id
      WHERE setlist_songs.content_id = content.id 
      AND setlists.user_id = auth.jwt()->>'uid'
    )
  );

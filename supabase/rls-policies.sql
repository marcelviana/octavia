-- Row level security policies for Firebase UID based access

-- Profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns profile" ON profiles
  USING (id = auth.jwt()->> 'uid');
CREATE POLICY "Service role access to profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Content table
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns content" ON content
  USING (user_id = auth.jwt()->> 'uid');
CREATE POLICY "Service role access to content" ON content
  FOR ALL USING (auth.role() = 'service_role');

-- Setlists table
ALTER TABLE setlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns setlists" ON setlists
  USING (user_id = auth.jwt()->> 'uid');
CREATE POLICY "Service role access to setlists" ON setlists
  FOR ALL USING (auth.role() = 'service_role');

-- Setlist songs table
ALTER TABLE setlist_songs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns setlist songs" ON setlist_songs
  USING (
    EXISTS (
      SELECT 1 FROM setlists 
      WHERE setlists.id = setlist_songs.setlist_id 
      AND setlists.user_id = auth.jwt()->> 'uid'
    )
  );
CREATE POLICY "Service role access to setlist songs" ON setlist_songs
  FOR ALL USING (auth.role() = 'service_role');

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

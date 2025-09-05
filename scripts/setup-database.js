#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (value && !key.startsWith('#')) {
          envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  }
  return {};
}

const envVars = loadEnvFile();

async function setupDatabase() {
  console.log('🔧 Setting up Octavia database...\n');
  
  // Check environment variables
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing required environment variables:');
    console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ NOT SET'}`);
    console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ SET' : '❌ NOT SET'}`);
    console.log('\nPlease check your .env.local file and ensure these variables are set.');
    return;
  }
  
  console.log('📋 Configuration:');
  console.log(`  Supabase URL: ${supabaseUrl}`);
  console.log(`  Service Key: ✅ SET`);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Test connection
  console.log('\n🔌 Testing connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log(`  Connection: ❌ ${error.message}`);
      console.log('\n💡 This might mean the database schema needs to be created.');
    } else {
      console.log('  Connection: ✅ Success');
      console.log('\n✅ Database is already set up and working!');
      return;
    }
  } catch (error) {
    console.log(`  Connection: ❌ ${error.message}`);
  }
  
  // Read schema file
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.log('\n❌ Schema file not found at supabase/schema.sql');
    return;
  }
  
  const schema = fs.readFileSync(schemaPath, 'utf8');
  console.log('\n📄 Schema file found');
  
  // Execute schema
  console.log('\n🚀 Executing database schema...');
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: schema });
    if (error) {
      console.log(`  Schema execution: ❌ ${error.message}`);
      console.log('\n💡 You may need to run the schema manually in your Supabase dashboard:');
      console.log('   1. Go to your Supabase project dashboard');
      console.log('   2. Navigate to the SQL Editor');
      console.log('   3. Copy and paste the contents of supabase/schema.sql');
      console.log('   4. Execute the SQL');
    } else {
      console.log('  Schema execution: ✅ Success');
    }
  } catch (error) {
    console.log(`  Schema execution: ❌ ${error.message}`);
    console.log('\n💡 You may need to run the schema manually in your Supabase dashboard:');
    console.log('   1. Go to your Supabase project dashboard');
    console.log('   2. Navigate to the SQL Editor');
    console.log('   3. Copy and paste the contents of supabase/schema.sql');
    console.log('   4. Execute the SQL');
  }
  
  // Test again
  console.log('\n🔍 Testing setup...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log(`  Test: ❌ ${error.message}`);
    } else {
      console.log('  Test: ✅ Success');
      console.log('\n🎉 Database setup completed successfully!');
    }
  } catch (error) {
    console.log(`  Test: ❌ ${error.message}`);
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your development server');
  console.log('   2. Try accessing the dashboard again');
  console.log('   3. If you still have issues, check the Supabase dashboard for any errors');
}

// Run the setup
setupDatabase().catch(console.error);

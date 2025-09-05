#!/usr/bin/env node

const dns = require('dns');
const https = require('https');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

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

async function checkSupabaseConnection() {
  console.log('🔍 Checking Supabase connection...\n');
  
  // Get environment variables
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('📋 Configuration Check:');
  console.log(`  Supabase URL: ${supabaseUrl || '❌ NOT SET'}`);
  console.log(`  Service Key: ${hasServiceKey ? '✅ SET' : '❌ NOT SET'}`);
  
  if (!supabaseUrl) {
    console.log('\n❌ NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
    return;
  }
  
  // Extract hostname from URL
  const url = new URL(supabaseUrl);
  const hostname = url.hostname;
  
  console.log(`  Hostname: ${hostname}`);
  console.log(`  Protocol: ${url.protocol}`);
  
  // DNS Resolution Check
  console.log('\n🌐 DNS Resolution Check:');
  try {
    const ipv4 = await resolve4(hostname);
    console.log(`  IPv4: ✅ ${ipv4.join(', ')}`);
  } catch (error) {
    console.log(`  IPv4: ❌ ${error.code} - ${error.message}`);
  }
  
  try {
    const ipv6 = await resolve6(hostname);
    console.log(`  IPv6: ✅ ${ipv6.join(', ')}`);
  } catch (error) {
    console.log(`  IPv6: ❌ ${error.code} - ${error.message}`);
  }
  
  // Network Connectivity Check
  console.log('\n🔌 Network Connectivity Check:');
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(supabaseUrl, (res) => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
    
    console.log(`  Status: ✅ ${response.statusCode}`);
    console.log(`  Server: ${response.headers.server || 'Unknown'}`);
    console.log(`  Content-Type: ${response.headers['content-type'] || 'Unknown'}`);
  } catch (error) {
    console.log(`  Connection: ❌ ${error.message}`);
  }
  
  // Project Status Check
  console.log('\n📊 Project Status:');
  if (hostname.includes('supabase.co')) {
    const projectId = hostname.split('.')[0];
    console.log(`  Project ID: ${projectId}`);
    console.log(`  Domain: ${hostname}`);
    
    // Check if it's a valid Supabase project format
    if (projectId.length === 22) {
      console.log('  Format: ✅ Valid Supabase project ID format');
    } else {
      console.log('  Format: ⚠️  Unexpected project ID length');
    }
  } else {
    console.log('  Format: ⚠️  Not a standard Supabase domain');
  }
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('  1. Check if your Supabase project is still active');
  console.log('  2. Verify the project URL in your Supabase dashboard');
  console.log('  3. Ensure your internet connection is working');
  console.log('  4. Check if Supabase services are experiencing downtime');
  console.log('  5. Verify your environment variables are loaded correctly');
}

// Run the check
checkSupabaseConnection().catch(console.error);

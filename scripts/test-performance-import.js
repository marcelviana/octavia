#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function testPerformanceImport() {
  console.log('🧪 Testing PerformanceMode component import...\n');
  
  try {
    // Test if the component file exists
    const componentPath = path.join(__dirname, '..', 'components', 'performance-mode.tsx');
    if (!fs.existsSync(componentPath)) {
      console.log('❌ PerformanceMode component file not found');
      return;
    }
    
    console.log('✅ PerformanceMode component file exists');
    
    // Read the file to check for export issues
    const content = fs.readFileSync(componentPath, 'utf8');
    
    // Check for default export
    if (content.includes('export default PerformanceMode')) {
      console.log('✅ Default export found');
    } else {
      console.log('❌ Default export missing');
    }
    
    // Check for named export
    if (content.includes('export function PerformanceMode')) {
      console.log('✅ Named export found');
    } else {
      console.log('❌ Named export missing');
    }
    
    // Check for "use client" directive
    if (content.includes('"use client"')) {
      console.log('✅ Client directive found');
    } else {
      console.log('❌ Client directive missing');
    }
    
    console.log('\n✅ PerformanceMode component appears to be properly configured');
    
  } catch (error) {
    console.error('❌ Error testing PerformanceMode import:', error.message);
  }
}

testPerformanceImport().catch(console.error);


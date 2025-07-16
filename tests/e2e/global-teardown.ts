import { FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global teardown for Playwright tests
 * This runs once after all tests and performs cleanup
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up Octavia E2E test environment...');
  
  try {
    // Clean up authentication state
    const authPath = path.join(__dirname, '.auth', 'user.json');
    if (fs.existsSync(authPath)) {
      fs.unlinkSync(authPath);
      console.log('✅ Authentication state cleaned up');
    }
    
    // Clean up test artifacts (optional - Playwright handles this automatically)
    const testResultsPath = path.join(process.cwd(), 'test-results');
    if (fs.existsSync(testResultsPath)) {
      // Keep test results for debugging, but log their location
      console.log(`📁 Test results available at: ${testResultsPath}`);
    }
    
    console.log('✅ Global teardown complete');
    
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // Don't throw error during teardown to avoid masking test failures
  }
}

export default globalTeardown; 
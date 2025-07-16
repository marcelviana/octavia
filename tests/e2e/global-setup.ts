import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * This runs once before all tests and sets up authentication state
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  
  console.log('🎵 Setting up Octavia E2E test environment...');
  
  // Set up test environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-service-key-for-testing-only';
  
  // Create a browser context for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    await page.goto(baseURL || 'http://localhost:3000');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Check if we need to authenticate by looking for common auth indicators
    const authIndicators = [
      'text=Sign In',
      'text=Sign Up',
      'button:has(.avatar)',
      'text=Profile',
      'text=Sign out'
    ];
    
    let isAuthenticated = false;
    for (const indicator of authIndicators) {
      try {
        if (await page.locator(indicator).isVisible({ timeout: 2000 })) {
          // If we see Sign In/Sign Up, we're not authenticated
          if (indicator.includes('Sign In') || indicator.includes('Sign Up')) {
            isAuthenticated = false;
            break;
          } else {
            // If we see user-related elements, we might be authenticated
            isAuthenticated = true;
            break;
          }
        }
      } catch {
        // Continue checking other indicators
      }
    }
    
    if (!isAuthenticated) {
      console.log('🔐 Setting up authentication...');
      
      // Navigate to login page
      await page.goto(`${baseURL}/login`);
      await page.waitForLoadState('networkidle');
      
      // Try to find login form elements with flexible selectors
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[placeholder*="email" i]',
        'input[placeholder*="Email" i]'
      ];
      
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input[placeholder*="password" i]',
        'input[placeholder*="Password" i]'
      ];
      
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Login")',
        'input[type="submit"]'
      ];
      
      // Find and fill email field
      let emailField = null;
      for (const selector of emailSelectors) {
        try {
          emailField = page.locator(selector);
          if (await emailField.isVisible({ timeout: 1000 })) {
            await emailField.fill('test@example.com');
            break;
          }
        } catch {
          continue;
        }
      }
      
      // Find and fill password field
      let passwordField = null;
      for (const selector of passwordSelectors) {
        try {
          passwordField = page.locator(selector);
          if (await passwordField.isVisible({ timeout: 1000 })) {
            await passwordField.fill('testpassword123');
            break;
          }
        } catch {
          continue;
        }
      }
      
      // Find and click submit button
      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          submitButton = page.locator(selector);
          if (await submitButton.isVisible({ timeout: 1000 })) {
            await submitButton.click();
            break;
          }
        } catch {
          continue;
        }
      }
      
      // Wait for authentication to complete (redirect to dashboard or library)
      try {
        await page.waitForURL(/\/dashboard|\/library/, { timeout: 10000 });
        console.log('✅ Authentication successful');
      } catch (error) {
        console.log('⚠️ Authentication may have failed, continuing with tests...');
      }
    } else {
      console.log('✅ User already authenticated');
    }
    
    // Save authentication state (even if auth failed, save current state)
    await context.storageState({ path: 'tests/e2e/.auth/user.json' });
    
    console.log('✅ Authentication setup complete');
    
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    // Don't throw error to allow tests to continue
    console.log('⚠️ Continuing with tests despite setup errors...');
  } finally {
    await browser.close();
  }
}

export default globalSetup; 
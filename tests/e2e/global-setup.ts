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
    // For E2E tests, we'll use a simpler approach:
    // 1. Navigate to the app
    // 2. Check if we need to authenticate
    // 3. If needed, try to create a test user or use existing one
    
    await page.goto(baseURL || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if we're on the landing page (unauthenticated)
    const isOnLandingPage = await page.locator('text=Welcome to Octavia').isVisible();
    
    if (isOnLandingPage) {
      console.log('🔐 Setting up authentication for E2E tests...');
      
      // Try to create a test user or login with existing one
      await page.goto(`${baseURL}/signup`);
      await page.waitForLoadState('networkidle');
      
      // Fill in signup form with test credentials
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const signupButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Create Account")');
      
      if (await emailInput.isVisible()) {
        await emailInput.fill('e2e-test@example.com');
        await passwordInput.fill('e2e-test-password-123');
        
        // Click signup button
        if (await signupButton.isVisible()) {
          await signupButton.click();
          
          // Wait for either success or error
          try {
            // Wait for redirect to dashboard or email verification
            await page.waitForURL(/\/dashboard|\/verify-email/, { timeout: 10000 });
            console.log('✅ Test user created successfully');
          } catch (error) {
            // If signup failed (user might already exist), try login
            console.log('⚠️ Signup may have failed, trying login...');
            await page.goto(`${baseURL}/login`);
            await page.waitForLoadState('networkidle');
            
            // Fill login form
            const loginEmailInput = page.locator('input[type="email"], input[name="email"]');
            const loginPasswordInput = page.locator('input[type="password"], input[name="password"]');
            const loginButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
            
            if (await loginEmailInput.isVisible()) {
              await loginEmailInput.fill('e2e-test@example.com');
              await loginPasswordInput.fill('e2e-test-password-123');
              
              if (await loginButton.isVisible()) {
                await loginButton.click();
                
                // Wait for authentication to complete
                try {
                  await page.waitForURL(/\/dashboard|\/library/, { timeout: 10000 });
                  console.log('✅ Login successful');
                } catch (error) {
                  console.log('⚠️ Login failed, continuing with unauthenticated tests...');
                }
              }
            }
          }
        }
      }
    } else {
      console.log('✅ User already authenticated');
    }
    
    // Save authentication state
    await context.storageState({ path: 'tests/e2e/.auth/user.json' });
    console.log('✅ Authentication state saved');
    
  } catch (error) {
    console.error('❌ Error during global setup:', error);
    console.log('⚠️ Continuing with tests despite setup errors...');
    
    // Still save the current state
    try {
      await context.storageState({ path: 'tests/e2e/.auth/user.json' });
    } catch (saveError) {
      console.error('Failed to save auth state:', saveError);
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup; 
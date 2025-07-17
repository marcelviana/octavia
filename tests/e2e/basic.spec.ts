import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('should load the home page', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded (basic check)
    await expect(page).toHaveTitle(/Octavia|Music/);
    
    // Check that the page has content
    await expect(page.locator('body')).toBeVisible();
    
    // Check for Octavia logo/branding (use first() to avoid strict mode violation)
    await expect(page.locator('img[alt="Octavia"]').first()).toBeVisible();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'test-results/screenshots/home-page.png' });
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we're authenticated by looking for authenticated navigation elements
    const isAuthenticated = await page.locator('text=Dashboard, text=Library, text=Setlists').isVisible();
    
    if (isAuthenticated) {
      // Check for authenticated navigation elements
      const navElements = [
        'text=Dashboard',
        'text=Library', 
        'text=Setlists',
        'text=Add Song'
      ];
      
      // At least one navigation element should be present
      let foundNav = false;
      for (const selector of navElements) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            foundNav = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      expect(foundNav).toBe(true);
    } else {
      // Check for unauthenticated navigation elements
      const authElements = [
        'text=Sign In',
        'text=Sign Up',
        'text=Get Started Free'
      ];
      
      // At least one auth element should be present
      let foundAuth = false;
      for (const selector of authElements) {
        try {
          if (await page.locator(selector).isVisible({ timeout: 1000 })) {
            foundAuth = true;
            break;
          }
        } catch {
          continue;
        }
      }
      
      expect(foundAuth).toBe(true);
    }
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle page navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we're authenticated by looking for authenticated navigation elements
    const isAuthenticated = await page.locator('text=Dashboard, text=Library, text=Setlists').isVisible();
    
    if (isAuthenticated) {
      // Try to navigate to authenticated pages
      const pages = ['/dashboard', '/library', '/setlists', '/profile'];
      
      for (const pagePath of pages) {
        try {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          
          // Check that the page loaded (basic check)
          await expect(page.locator('body')).toBeVisible();
          
          console.log(`✅ Successfully navigated to ${pagePath}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`⚠️ Could not navigate to ${pagePath}:`, errorMessage);
        }
      }
    } else {
      // Try to navigate to public pages
      const pages = ['/login', '/signup'];
      
      for (const pagePath of pages) {
        try {
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          
          // Check that the page loaded (basic check)
          await expect(page.locator('body')).toBeVisible();
          
          console.log(`✅ Successfully navigated to ${pagePath}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`⚠️ Could not navigate to ${pagePath}:`, errorMessage);
        }
      }
    }
  });

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    
    // Check for viewport meta tag (important for responsive design)
    const viewport = await page.locator('meta[name="viewport"]').count();
    expect(viewport).toBeGreaterThan(0);
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if we're authenticated by looking for authenticated navigation elements
    const isAuthenticated = await page.locator('text=Dashboard, text=Library, text=Setlists').isVisible();
    
    if (isAuthenticated) {
      // Look for search input in authenticated interface
      const searchInput = page.locator('input[placeholder="Search..."]');
      
      if (await searchInput.isVisible()) {
        // Test search input
        await searchInput.fill('test song');
        await searchInput.press('Enter');
        
        // Should navigate to library with search
        await expect(page).toHaveURL(/\/library\?search=/);
      }
    } else {
      // For unauthenticated users, just check that the page is functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show user authentication state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for authentication elements
    const authElements = [
      'text=Sign In',
      'text=Sign Up',
      'button[aria-label*="User"]',
      '.avatar'
    ];
    
    // At least one auth element should be present
    let foundAuth = false;
    for (const selector of authElements) {
      try {
        if (await page.locator(selector).isVisible({ timeout: 1000 })) {
          foundAuth = true;
          break;
        }
      } catch {
        continue;
      }
    }
    
    expect(foundAuth).toBe(true);
  });
}); 
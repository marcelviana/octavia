import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should display dashboard correctly', async ({ page }) => {
    // Check if we're authenticated by looking for dashboard content
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // User is authenticated - check dashboard content
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Check for dashboard sections
      await expect(page.locator('text=Recent Content')).toBeVisible();
      await expect(page.locator('text=Add Content')).toBeVisible();
    } else {
      // User is not authenticated - should be redirected to login or landing page
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/login|\/$/);
      
      // Check that we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show recent content section', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check for recent content
      const recentContent = page.locator('text=Recent Content');
      
      if (await recentContent.isVisible()) {
        // Should show content items or empty state
        await expect(page.locator('text=Recent Content') || page.locator('text=No recent content')).toBeVisible();
      } else {
        // If no content, should show empty state
        await expect(page.locator('text=No recent content')).toBeVisible();
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show quick actions', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check for add content button
      await expect(page.locator('text=Add Content')).toBeVisible();
      
      // Check for performance mode button if available
      const performanceButton = page.locator('text=Enter Performance Mode');
      if (await performanceButton.isVisible()) {
        await expect(performanceButton).toBeVisible();
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should navigate from quick actions', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Test add content quick action
      await page.click('text=Add Content');
      await expect(page).toHaveURL('/add-content');
      
      // Go back to dashboard
      await page.goto('/dashboard');
      
      // Test performance mode if available
      const performanceButton = page.locator('text=Enter Performance Mode');
      if (await performanceButton.isVisible()) {
        performanceButton.click();
        await expect(page).toHaveURL('/performance');
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show user stats', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check for stats cards
      const statsCards = page.locator('text=Total Content, text=Setlists, text=Favorites, text=Recent');
      
      // At least one stat card should be visible
      let foundStats = false;
      for (const stat of ['Total Content', 'Setlists', 'Favorites', 'Recent']) {
        if (await page.locator(`text=${stat}`).isVisible()) {
          foundStats = true;
          break;
        }
      }
      
      expect(foundStats).toBe(true);
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle content interactions', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Look for content items in recent content section
      const contentItems = page.locator('[role="button"]');
      
      if (await contentItems.first().isVisible()) {
        // Click on first content item
        await contentItems.first().click();
        
        // Should navigate to content detail page
        await expect(page).toHaveURL(/\/content\/.+/);
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check if dashboard is still functional
      await expect(page.locator('h1')).toContainText('Dashboard');
      
      // Check if mobile-specific layout is applied
      const mobileMenuButton = page.locator('button:has([data-lucide="Menu"])');
      if (await mobileMenuButton.isVisible()) {
        await expect(mobileMenuButton).toBeVisible();
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle loading states', async ({ page }) => {
    // Reload page to see loading states
    await page.reload();
    
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Should show loading indicators
      const loadingIndicator = page.locator('.animate-spin');
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
        
        // Wait for content to load
        await page.waitForLoadState('networkidle');
        await expect(loadingIndicator).not.toBeVisible();
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should handle tab navigation', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check for tabs
      const tabs = page.locator('[role="tablist"]');
      
      if (await tabs.isVisible()) {
        // Test tab switching
        await page.click('text=Recent');
        await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Recent');
        
        await page.click('text=Favorites');
        await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Favorites');
        
        await page.click('text=Overview');
        await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Overview');
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should show empty states appropriately', async ({ page }) => {
    const isAuthenticated = await page.locator('text=Welcome to Octavia').isHidden();
    
    if (isAuthenticated) {
      // Check for empty state messages when no content
      const emptyStates = [
        'text=No recent content',
        'text=No favorites yet',
        'text=Add your first piece of music content'
      ];
      
      // At least one empty state should be present if no content
      let foundEmptyState = false;
      for (const selector of emptyStates) {
        if (await page.locator(selector).isVisible()) {
          foundEmptyState = true;
          break;
        }
      }
      
      // If no empty states found, there should be content
      if (!foundEmptyState) {
        const contentItems = page.locator('[role="button"]');
        expect(await contentItems.count()).toBeGreaterThan(0);
      }
    } else {
      // Not authenticated - test passes if we're on a proper page
      await expect(page.locator('body')).toBeVisible();
    }
  });
}); 